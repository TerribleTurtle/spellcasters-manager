import { describe, it, expect, vi, beforeEach } from 'vitest';
import { queueService } from '../../server/services/queueService';
import { fileService } from '../../server/services/fileService';
import fs from 'fs';

// Mock dependencies
vi.mock('../../server/services/fileService');
vi.mock('fs', () => ({
    default: {
        promises: {
            writeFile: vi.fn(),
            readFile: vi.fn(),
            readdir: vi.fn().mockResolvedValue([]),
            stat: vi.fn().mockResolvedValue({ isDirectory: () => false }),
            appendFile: vi.fn().mockResolvedValue(undefined),
        },
        existsSync: vi.fn(),
        mkdirSync: vi.fn(),
        writeFileSync: vi.fn(),
        readdirSync: vi.fn().mockReturnValue([]),
        unlinkSync: vi.fn(),
        statSync: vi.fn().mockReturnValue({ isDirectory: () => false }),
    }
}));

describe('QueueService', () => {
    const dataDir = 'root/data';
    const mockedFileService = vi.mocked(fileService);
    const mockedFs = vi.mocked(fs);

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Default fs mocks
        mockedFs.existsSync.mockReturnValue(true);
        mockedFs.mkdirSync.mockReturnValue(undefined);
        mockedFs.writeFileSync.mockReturnValue(undefined);
        mockedFs.readdirSync.mockReturnValue([]);
        mockedFs.unlinkSync.mockReturnValue(undefined);
    });

    describe('Queue Operations', () => {
        it('getQueue returns empty array if no file', async () => {
            mockedFileService.exists.mockResolvedValue(false);
            const queue = await queueService.getQueue(dataDir);
            expect(queue).toEqual([]);
        });

        it('getQueue returns queue content', async () => {
            const mockQueue: any[] = [{ target_id: 'c1' }];
            mockedFileService.exists.mockResolvedValue(true);
            mockedFileService.readJson.mockResolvedValue(mockQueue);
            
            const queue = await queueService.getQueue(dataDir);
            expect(queue).toEqual(mockQueue);
        });

        it('addToQueue adds item and returns updated queue', async () => {
            const change: any = { target_id: 'u1', name: 'Unit 1', field: 'name', old: 'A', new: 'B' };
            mockedFileService.exists.mockResolvedValue(false); // New queue

            const queue = await queueService.addToQueue(dataDir, change);

            expect(mockedFileService.writeJson).toHaveBeenCalledWith(
                expect.stringMatching(/queue\.json/),
                expect.arrayContaining([expect.objectContaining({ target_id: 'u1', timestamp: expect.any(String) })])
            );
            expect(queue).toHaveLength(1);
        });

        it('removeFromQueue removes item at index', async () => {
            const mockQueue: any[] = [{ target_id: 'c1' }, { target_id: 'c2' }];
            mockedFileService.exists.mockResolvedValue(true);
            mockedFileService.readJson.mockResolvedValue([...mockQueue]);

            const queue = await queueService.removeFromQueue(dataDir, 0);

            expect(mockedFileService.writeJson).toHaveBeenCalledWith(
                expect.stringMatching(/queue\.json/),
                [{ target_id: 'c2' }] // c1 removed
            );
            expect(queue).toHaveLength(1);
        });

        it('updateQueueItem modifies item at index', async () => {
            const mockQueue: any[] = [{ target_id: 'c1', val: 'old' }];
            mockedFileService.exists.mockResolvedValue(true);
            mockedFileService.readJson.mockResolvedValue([...mockQueue]);

            const change: any = { target_id: 'c1', name: 'Change 1', field: 'val', old: 'old', new: 'new' };
            await queueService.updateQueueItem(dataDir, 0, change);

            expect(mockedFileService.writeJson).toHaveBeenCalledWith(
                expect.stringMatching(/queue\.json/),
                [{ target_id: 'c1', name: 'Change 1', field: 'val', old: 'old', new: 'new' }]
            );
        });

        it('removeByTargetId removes items by id', async () => {
            const mockQueue: any[] = [{ target_id: 'c1' }, { target_id: 'c2' }];
            mockedFileService.exists.mockResolvedValue(true);
            mockedFileService.readJson.mockResolvedValue([...mockQueue]);

            const queue = await queueService.removeByTargetId(dataDir, 'c1');

            expect(mockedFileService.writeJson).toHaveBeenCalledWith(
                expect.stringMatching(/queue\.json/),
                [{ target_id: 'c2' }]
            );
            expect(queue).toHaveLength(1);
        });

        it('bulkRemoveFromQueue removes multiple items', async () => {
            const mockQueue: any[] = [{ target_id: 'c1' }, { target_id: 'c2' }, { target_id: 'c3' }];
            mockedFileService.exists.mockResolvedValue(true);
            mockedFileService.readJson.mockResolvedValue([...mockQueue]);

            const queue = await queueService.bulkRemoveFromQueue(dataDir, [0, 2]);

            expect(mockedFileService.writeJson).toHaveBeenCalledWith(
                expect.stringMatching(/queue\.json/),
                [{ target_id: 'c2' }]
            );
            expect(queue).toHaveLength(1);
        });
    });
});
