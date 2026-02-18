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

    describe('Revert on Remove', () => {
        it('removeFromQueue reverts entity data on disk', async () => {
            const oldData = { name: 'Original', hp: 100 };
            const mockQueue: any[] = [
                { target_id: 'unit1.json', field: 'entity', old: oldData, new: { name: 'Modified', hp: 200 }, category: 'units' }
            ];
            mockedFileService.exists.mockResolvedValue(true);
            mockedFileService.readJson.mockResolvedValue([...mockQueue]);
            mockedFileService.writeJson.mockResolvedValue(undefined);

            await queueService.removeFromQueue(dataDir, 0);

            // First writeJson call should be the revert (writing old data to entity file)
            expect(mockedFileService.writeJson).toHaveBeenCalledWith(
                expect.stringContaining('units'),
                oldData
            );
        });

        it('removeByTargetId reverts entity data on disk', async () => {
            const oldData = { name: 'Original', hp: 100 };
            const mockQueue: any[] = [
                { target_id: 'unit1.json', field: 'entity', old: oldData, new: { name: 'Modified', hp: 200 }, category: 'units' },
                { target_id: 'unit2.json', field: 'entity', old: { name: 'Other' }, new: { name: 'Other2' }, category: 'units' }
            ];
            mockedFileService.exists.mockResolvedValue(true);
            mockedFileService.readJson.mockResolvedValue([...mockQueue]);
            mockedFileService.writeJson.mockResolvedValue(undefined);

            await queueService.removeByTargetId(dataDir, 'unit1.json');

            // Should write old data to the entity file
            expect(mockedFileService.writeJson).toHaveBeenCalledWith(
                expect.stringContaining('unit1.json'),
                oldData
            );
        });

        it('bulkRemoveFromQueue reverts all removed entities on disk', async () => {
            const oldData1 = { name: 'Original1' };
            const oldData2 = { name: 'Original2' };
            const mockQueue: any[] = [
                { target_id: 'u1.json', field: 'entity', old: oldData1, new: { name: 'New1' }, category: 'units' },
                { target_id: 'u2.json', field: 'entity', old: oldData2, new: { name: 'New2' }, category: 'units' },
                { target_id: 'u3.json', field: 'entity', old: { name: 'Keep' }, new: { name: 'Keep2' }, category: 'units' }
            ];
            mockedFileService.exists.mockResolvedValue(true);
            mockedFileService.readJson.mockResolvedValue([...mockQueue]);
            mockedFileService.writeJson.mockResolvedValue(undefined);

            await queueService.bulkRemoveFromQueue(dataDir, [0, 1]);

            // Should revert both removed entities
            expect(mockedFileService.writeJson).toHaveBeenCalledWith(
                expect.stringContaining('u1.json'),
                oldData1
            );
            expect(mockedFileService.writeJson).toHaveBeenCalledWith(
                expect.stringContaining('u2.json'),
                oldData2
            );
        });

        it('removeFromQueue deletes file if old is undefined (creation revert)', async () => {
            const mockQueue: any[] = [
                { target_id: 'new_unit.json', field: 'entity', old: undefined, new: { name: 'Created' }, category: 'units' }
            ];
            mockedFileService.exists.mockResolvedValue(true);
            mockedFileService.readJson.mockResolvedValue([...mockQueue]);
            mockedFileService.writeJson.mockResolvedValue(undefined);
            mockedFileService.deleteFile.mockResolvedValue(undefined);

            await queueService.removeFromQueue(dataDir, 0);

            // Should delete the file since old was undefined
            expect(mockedFileService.deleteFile).toHaveBeenCalledWith(
                expect.stringContaining('new_unit.json')
            );
        });
    });
});
