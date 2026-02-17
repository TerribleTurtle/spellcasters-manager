import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getData, saveData, deleteData, listFiles, saveBatch } from '../../server/controllers/dataController';
import { fileService } from '../../server/services/fileService';
import { Response } from 'express';
import { createMockRequest, MockRequest } from '../helpers/mockRequest';

// Mock fileService
vi.mock('../../server/services/fileService', () => ({
    fileService: {
        readJson: vi.fn(),
        writeJson: vi.fn(),
        listFiles: vi.fn(),
        exists: vi.fn(),
        deleteFile: vi.fn(),
    }
}));

describe('DataController', () => {
    let mockReq: MockRequest;
    let mockRes: Partial<Response>;
    let jsonSpy: any;
    let statusSpy: any;
    let sendSpy: any;

    beforeEach(() => {
        vi.clearAllMocks();
        jsonSpy = vi.fn();
        sendSpy = vi.fn();
        statusSpy = vi.fn().mockReturnValue({ send: sendSpy, json: jsonSpy });
        
        mockRes = {
            json: jsonSpy,
            status: statusSpy,
            send: sendSpy,
        } as unknown as Response;

        mockReq = createMockRequest({
            params: {},
            query: {},
            body: {},
            context: { dataDir: 'root/data', mode: 'dev' }
        });
    });

    describe('getData', () => {
        it('returns data when file exists', async () => {
            mockReq.params = { category: 'units', filename: 'u1.json' };
            const mockData = { id: 'u1' };
            (fileService.readJson as any).mockResolvedValue(mockData);

            await getData(mockReq, mockRes as Response);

            expect(fileService.readJson).toHaveBeenCalledWith(expect.stringMatching(/root[/\\]data[/\\]units[/\\]u1\.json/));
            expect(jsonSpy).toHaveBeenCalledWith(mockData);
        });

        it('returns 404 when file not found', async () => {
            mockReq.params = { category: 'units', filename: 'unknown.json' };
            (fileService.readJson as any).mockRejectedValue(new Error('Not found'));

            await getData(mockReq, mockRes as Response);

            expect(statusSpy).toHaveBeenCalledWith(404);
        });

        it('prevents directory traversal', async () => {
            mockReq.params = { category: 'units', filename: '../../secret.txt' };
            
            await getData(mockReq, mockRes as Response);

            expect(statusSpy).toHaveBeenCalledWith(403);
            expect(fileService.readJson).not.toHaveBeenCalled();
        });
    });

    describe('saveData', () => {
        it('saves valid unit data', async () => {
            mockReq.params = { category: 'units', filename: 'u1.json' };
            mockReq.body = { id: 'u1', name: 'New Unit', type: 'Unit' };

            await saveData(mockReq, mockRes as Response);

            expect(fileService.writeJson).toHaveBeenCalledWith(
                expect.stringMatching(/root[/\\]data[/\\]units[/\\]u1\.json/),
                expect.objectContaining({ name: 'New Unit' })
            );
            expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('rejects invalid unit data', async () => {
            mockReq.params = { category: 'units', filename: 'u1.json' };
            mockReq.body = { id: 'u1' }; // Missing name

            await saveData(mockReq, mockRes as Response);

            expect(fileService.writeJson).not.toHaveBeenCalled();
            expect(statusSpy).toHaveBeenCalledWith(400);
            expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
                error: "Validation Failed",
                fields: expect.arrayContaining([
                    expect.objectContaining({
                        path: "name",
                        message: expect.any(String)
                    })
                ])
            }));
        });
    });

    describe('deleteData', () => {
        it('deletes file and cleans queue', async () => {
            mockReq.params = { category: 'units', filename: 'u1.json' };
            const mockQueue = [{ target_id: 'u1.json' }, { target_id: 'other.json' }];
            
            (fileService.exists as any).mockResolvedValue(true);
            (fileService.readJson as any).mockResolvedValue(mockQueue);

            await deleteData(mockReq, mockRes as Response);

            expect(fileService.deleteFile).toHaveBeenCalledWith(expect.stringMatching(/root[/\\]data[/\\]units[/\\]u1\.json/));
            // Expect writeJson to be called with filtered queue
            expect(fileService.writeJson).toHaveBeenCalledWith(
                expect.stringMatching(/root[/\\]data[/\\]queue\.json/),
                [{ target_id: 'other.json' }]
            );
            expect(jsonSpy).toHaveBeenCalledWith({ success: true });
        });

        it('prevents directory traversal', async () => {
             mockReq.params = { category: 'units', filename: '../../secret.txt' };
             await deleteData(mockReq, mockRes as Response);
             expect(statusSpy).toHaveBeenCalledWith(403);
             expect(fileService.deleteFile).not.toHaveBeenCalled();
        });
    });

    describe('listFiles', () => {
        it('returns filtered file list', async () => {
            mockReq.params = { category: 'units' };
            (fileService.listFiles as any).mockResolvedValue(['u1.json', 'u2.json']);

            await listFiles(mockReq, mockRes as Response);

            expect(fileService.listFiles).toHaveBeenCalledWith(
                expect.stringMatching(/root[/\\]data[/\\]units/),
                ['.json']
            );
            expect(jsonSpy).toHaveBeenCalledWith(['u1.json', 'u2.json']);
        });

        it('prevents directory traversal', async () => {
            mockReq.params = { category: '../secrets' };
            await listFiles(mockReq, mockRes as Response);
            expect(statusSpy).toHaveBeenCalledWith(403);
        });
    });

    describe('saveBatch', () => {
        it('saves multiple items', async () => {
            mockReq.params = { category: 'test-cat' }; // Use category without schema to skip validation logic in test
            mockReq.body = [
                { filename: 'f1.json', data: { id: 1 } },
                { filename: 'f2.json', data: { id: 2 } }
            ];

            await saveBatch(mockReq, mockRes as Response);

            expect(fileService.writeJson).toHaveBeenCalledTimes(2);
            expect(fileService.writeJson).toHaveBeenCalledWith(
                expect.stringMatching(/root[/\\]data[/\\]test-cat[/\\]f1\.json/),
                expect.objectContaining({ id: 1 })
            );
             expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('validates request body is array', async () => {
            mockReq.params = { category: 'test-cat' };
            mockReq.body = { not: 'array' };
            await saveBatch(mockReq, mockRes as Response);
            expect(statusSpy).toHaveBeenCalledWith(400);
        });

        it('handles individual save errors gracefully', async () => {
            mockReq.params = { category: 'test-cat' };
            mockReq.body = [
                { filename: 'good.json', data: { id: 1 } },
                { filename: 'bad.json', data: { id: 2 } }
            ];
            
            (fileService.writeJson as any).mockImplementation((path: string) => {
                if (path.includes('bad.json')) return Promise.reject(new Error('Write failed'));
                return Promise.resolve();
            });

            await saveBatch(mockReq, mockRes as Response);

            expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
                success: true, 
                results: expect.arrayContaining([
                    expect.objectContaining({ filename: 'good.json', success: true }),
                    expect.objectContaining({ filename: 'bad.json', success: false })
                ])
            }));
        });
    });
});
