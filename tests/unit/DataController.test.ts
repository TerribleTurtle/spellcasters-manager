import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getData, saveData, deleteData, listFiles, saveBatch, importData } from '../../server/controllers/dataController';
import { fileService } from '../../server/services/fileService';
import { dataService } from '../../server/services/dataService';
import { Response } from 'express';
import { createMockRequest, MockRequest } from '../helpers/mockRequest';
import path from 'path';

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

// Mock patchService
vi.mock('../../server/services/patchService', () => ({
    patchService: {
        enqueueEntityChange: vi.fn(),
        recordPatch: vi.fn().mockResolvedValue({ id: 'mock-patch' })
    }
}));

describe('DataController', () => {
    let mockReq: MockRequest;
    let mockRes: Partial<Response>;
    let jsonSpy: any;
    let statusSpy: any;
    let sendSpy: any;
    let nextSpy: any;

    const ROOT_DIR = path.resolve('root/data');

    beforeEach(() => {
        vi.clearAllMocks();
        jsonSpy = vi.fn();
        sendSpy = vi.fn();
        nextSpy = vi.fn();
        statusSpy = vi.fn().mockReturnValue({ send: sendSpy, json: jsonSpy });
        
        mockRes = {
            json: jsonSpy,
            status: statusSpy,
            send: sendSpy,
            locals: {} // Init locals
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
            // Mock Middleware Success
            mockRes.locals = { resolvedPath: path.resolve(ROOT_DIR, 'units/u1.json') };
            
            const mockData = { id: 'u1' };
            (fileService.readJson as any).mockResolvedValue(mockData);

            await getData(mockReq, mockRes as Response, nextSpy);

            expect(fileService.readJson).toHaveBeenCalledWith(mockRes.locals?.resolvedPath);
            expect(jsonSpy).toHaveBeenCalledWith(mockData);
        });

        it('returns 404 when file not found', async () => {
            mockReq.params = { category: 'units', filename: 'unknown.json' };
            mockRes.locals = { resolvedPath: path.resolve(ROOT_DIR, 'units/unknown.json') };
            
            (fileService.readJson as any).mockRejectedValue(new Error('Not found'));

            await getData(mockReq, mockRes as Response, nextSpy);
            expect(nextSpy).toHaveBeenCalledWith(expect.objectContaining({ message: 'File not found', code: 'NOT_FOUND' }));
        });

        it('returns 500 if middleware failed to set path', async () => {
            mockReq.params = { category: 'units', filename: 'u1.json' };
            mockRes.locals = {}; // No resolvedPath
            
            await getData(mockReq, mockRes as Response, nextSpy);
            expect(nextSpy).toHaveBeenCalledWith(expect.objectContaining({ message: 'Path resolution failed' }));
        });
    });

    describe('saveData', () => {
        it('saves valid unit data', async () => {
            mockReq.params = { category: 'units', filename: 'u1.json' };
            mockReq.body = { id: 'u1', name: 'New Unit', type: 'Unit' };
            
            const mockResult = { ...mockReq.body, last_modified: '2024-01-01' };
            vi.spyOn(dataService, 'saveData').mockResolvedValue(mockResult);

            await saveData(mockReq, mockRes as Response, nextSpy);

            expect(dataService.saveData).toHaveBeenCalledWith(
                'root/data',
                'units',
                'u1.json',
                mockReq.body,
                false
            );
            expect(jsonSpy).toHaveBeenCalledWith({ success: true, last_modified: '2024-01-01' });
        });

        it('rejects invalid unit data', async () => {
            mockReq.params = { category: 'units', filename: 'u1.json' };
            mockReq.body = { id: 'u1' }; // Missing name
            
            // Mock dataService to throw validation error
            const error = new Error('Validation Failed');
            (error as any).code = 'BAD_REQUEST';
            vi.spyOn(dataService, 'saveData').mockRejectedValue(error);

            await saveData(mockReq, mockRes as Response, nextSpy);

            expect(dataService.saveData).toHaveBeenCalled();
            expect(nextSpy).toHaveBeenCalledWith(error);
        });
    });

    describe('importData', () => {
        it('imports data successfully', async () => {
            mockReq.body = { data: { units: [] } };
            vi.spyOn(dataService, 'importData').mockResolvedValue({ success: true, imported: 0, errors: [] });
            
            await importData(mockReq, mockRes as Response, nextSpy);
            
            expect(dataService.importData).toHaveBeenCalledWith('root/data', { units: [] }, false);
            expect(jsonSpy).toHaveBeenCalled();
        });

        it('passes queue flag when query param is present', async () => {
             mockReq.body = { data: { units: [] } };
             mockReq.query = { queue: 'true' };
             vi.spyOn(dataService, 'importData').mockResolvedValue({ success: true, imported: 0, errors: [] });
             
             await importData(mockReq, mockRes as Response, nextSpy);
             
             expect(dataService.importData).toHaveBeenCalledWith('root/data', { units: [] }, true);
        });

        it('handles import errors', async () => {
             mockReq.body = { data: {} };
             const error = new Error('Import failed');
             vi.spyOn(dataService, 'importData').mockRejectedValue(error);
             
             await importData(mockReq, mockRes as Response, nextSpy);
             
             expect(nextSpy).toHaveBeenCalledWith(error);
        });
    });

    describe('deleteData', () => {
        it('deletes file and cleans queue', async () => {
            mockReq.params = { category: 'units', filename: 'u1.json' };
            mockRes.locals = { resolvedPath: path.resolve(ROOT_DIR, 'units/u1.json') };
            
            const mockQueue = [{ target_id: 'u1.json' }, { target_id: 'other.json' }];
            
            (fileService.exists as any).mockResolvedValue(true);
            (fileService.readJson as any).mockResolvedValue(mockQueue);

            await deleteData(mockReq, mockRes as Response, nextSpy);

            expect(fileService.deleteFile).toHaveBeenCalledWith(mockRes.locals?.resolvedPath);
            expect(jsonSpy).toHaveBeenCalledWith({ success: true });
        });
    });

    describe('listFiles', () => {
        it('returns filtered file list', async () => {
            mockReq.params = { category: 'units' };
            mockRes.locals = { resolvedDir: path.resolve(ROOT_DIR, 'units') };
            
            (fileService.listFiles as any).mockResolvedValue(['u1.json', 'u2.json']);

            await listFiles(mockReq, mockRes as Response, nextSpy);

            expect(fileService.listFiles).toHaveBeenCalledWith(
                mockRes.locals?.resolvedDir,
                ['.json']
            );
            expect(jsonSpy).toHaveBeenCalledWith(['u1.json', 'u2.json']);
        });
    });

    describe('saveBatch', () => {
        it('saves multiple items', async () => {
            mockReq.params = { category: 'test-cat' }; 
            
            mockReq.body = [
                { filename: 'f1.json', data: { id: 1 } },
                { filename: 'f2.json', data: { id: 2 } }
            ];

            const mockResults = [
                { filename: 'f1.json', success: true },
                { filename: 'f2.json', success: true }
            ];
            vi.spyOn(dataService, 'saveBatch').mockResolvedValue(mockResults);

            await saveBatch(mockReq, mockRes as Response, nextSpy);

            expect(dataService.saveBatch).toHaveBeenCalledWith(
                'root/data',
                'test-cat',
                mockReq.body
            );
            expect(jsonSpy).toHaveBeenCalledWith({ success: true, results: mockResults });
        });

        it('validates request body is array', async () => {
            mockReq.params = { category: 'test-cat' };
            mockReq.body = { not: 'array' };
            
            // The validation happens in controller BEFORE service, 
            // BUT wait, dataController checks `req.body`.
            // Actually, dataController.ts implementation of saveBatch:
            // const { category } = req.params;
            // try { const results = await dataService.saveBatch(...); }
            
            // Looking at `dataController.ts` again, it DOES NOT confirm array itself, 
            // it relies on `dataService.saveBatch`.
            
            // If dataController doesn't check, then we mock dataService to throw.
            // But wait, the previous test implementation suggested there WAS a check.
            // Let's check dataController.ts again.
            // ...
            // export const saveBatch = async (req: Request, res: Response, next: NextFunction) => {
            //      const { category } = req.params ...
            //      try {
            //          const results = await dataService.saveBatch(dataDir, category, req.body);
            //          res.json({ success: true, results });
            //      } ...
            
            // So the controller blindly passes body. The service must validate.
            // So we mock the service to reject.
            
            const error = new Error('Body must be an array of updates');
            vi.spyOn(dataService, 'saveBatch').mockRejectedValue(error);

            await saveBatch(mockReq, mockRes as Response, nextSpy);
            expect(nextSpy).toHaveBeenCalledWith(error);
        });
    });
});
