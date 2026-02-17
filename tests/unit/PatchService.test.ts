import { describe, it, expect, vi, beforeEach } from 'vitest';
import { patchService } from '../../server/services/patchService';
import { fileService } from '../../server/services/fileService';
import fs from 'fs';

// Mock dependencies
vi.mock('../../server/services/fileService');
vi.mock('fs');

// Mock GitService instance methods
const mocks = vi.hoisted(() => ({
    commitPatch: vi.fn(),
    getStagedDiff: vi.fn().mockResolvedValue('')
}));

vi.mock('../../server/services/gitService', () => {
    return {
        GitService: class {
            commitPatch = mocks.commitPatch;
            getStagedDiff = mocks.getStagedDiff;
        },
        gitService: {
            commitPatch: mocks.commitPatch,
            getStagedDiff: mocks.getStagedDiff
        }
    };
});

describe('PatchService', () => {
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
            const queue = await patchService.getQueue(dataDir);
            expect(queue).toEqual([]);
        });

        it('getQueue returns queue content', async () => {
            const mockQueue = [{ target_id: 'c1' }];
            mockedFileService.exists.mockResolvedValue(true);
            mockedFileService.readJson.mockResolvedValue(mockQueue);
            
            const queue = await patchService.getQueue(dataDir);
            expect(queue).toEqual(mockQueue);
        });

        it('addToQueue adds item and returns updated queue', async () => {
            const change: any = { target_id: 'u1', field: 'name', new: 'B' };
            mockedFileService.exists.mockResolvedValue(false); // New queue

            const queue = await patchService.addToQueue(dataDir, change);

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

            const queue = await patchService.removeFromQueue(dataDir, 0);

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

            const change: any = { target_id: 'c1', val: 'new' };
            await patchService.updateQueueItem(dataDir, 0, change);

            expect(mockedFileService.writeJson).toHaveBeenCalledWith(
                expect.stringMatching(/queue\.json/),
                [{ target_id: 'c1', val: 'new' }]
            );
        });
    });

    describe('Commit Logic', () => {
        it('commitPatch creates new patch and clears queue', async () => {
            // Queue has 1 item
            mockedFileService.exists.mockResolvedValue(true);
            mockedFileService.readJson.mockImplementation(async (path: string) => {
                if (path.includes('queue.json')) return [{ target_id: 'u1', field: 'name', new: 'B' }];
                if (path.includes('patches.json')) return []; 
                return [];
            });

            await patchService.commitPatch(dataDir, 'Patch 1.0', '1.0', 'balance', ['nerf']);

            // Expect patches.json update
            expect(mockedFileService.writeJson).toHaveBeenCalledWith(
                expect.stringMatching(/patches\.json/),
                expect.arrayContaining([
                    expect.objectContaining({ version: '1.0', changes: expect.any(Array) })
                ])
            );
            // Expect queue clear
            expect(mockedFileService.writeJson).toHaveBeenCalledWith(
                expect.stringMatching(/queue\.json/),
                []
            );
            // Expect git commit
            expect(mocks.commitPatch).toHaveBeenCalled();
        });

        it('quickSave creates immediate patch', async () => {
            const change: any = { target_id: 'u1', name: 'Quick Fix' };
            mockedFileService.exists.mockResolvedValue(false);

            await patchService.quickSave(dataDir, change, 'quick', ['fix']);

            expect(mockedFileService.writeJson).toHaveBeenCalledWith(
                expect.stringMatching(/patches\.json/),
                expect.arrayContaining([
                    expect.objectContaining({ version: 'quick', changes: expect.any(Array) })
                ])
            );
            expect(mocks.commitPatch).toHaveBeenCalled();
        });
    });

    describe('Patch History', () => {
        it('getPatchHistory returns patches', async () => {
            const mockPatches: any[] = [{ id: 'p1', tags: ['buff'] }];
            mockedFileService.exists.mockResolvedValue(true);
            mockedFileService.readJson.mockResolvedValue(mockPatches);

            const patches = await patchService.getPatchHistory(dataDir);
            expect(patches).toEqual(mockPatches);
        });

        it('getPatchHistory filters by tag', async () => {
            const mockPatches: any[] = [
                { id: 'p1', tags: ['buff'] },
                { id: 'p2', tags: ['nerf'] }
            ];
            mockedFileService.exists.mockResolvedValue(true);
            mockedFileService.readJson.mockResolvedValue(mockPatches);

            const patches = await patchService.getPatchHistory(dataDir, 'nerf');
            expect(patches).toEqual([{ id: 'p2', tags: ['nerf'] }]);
        });

        it('getPatchHistory filters by date range', async () => {
            const mockPatches: any[] = [
                { id: 'p1', date: '2023-01-01' },
                { id: 'p2', date: '2023-01-15' },
                { id: 'p3', date: '2023-02-01' }
            ];
            mockedFileService.exists.mockResolvedValue(true);
            mockedFileService.readJson.mockResolvedValue(mockPatches);
            
            // Filter 1: From
             const fromRes = await patchService.getPatchHistory(dataDir, undefined, '2023-01-10');
             expect(fromRes).toHaveLength(2);
             expect(fromRes.map(p => p.id)).toEqual(['p2', 'p3']);

            // Filter 2: To
             const toRes = await patchService.getPatchHistory(dataDir, undefined, undefined, '2023-01-20');
             expect(toRes).toHaveLength(2);
             expect(toRes.map(p => p.id)).toEqual(['p1', 'p2']);

             // Filter 3: Range
             const rangeRes = await patchService.getPatchHistory(dataDir, undefined, '2023-01-10', '2023-01-20');
             expect(rangeRes).toHaveLength(1);
             expect(rangeRes[0].id).toEqual('p2');
        });
    });
});
