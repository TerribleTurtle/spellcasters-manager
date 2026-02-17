
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dataService } from '../../server/services/dataService'; // Lowercase instance export
import { fileService } from '../../server/services/fileService';
import { backupService } from '../../server/services/backupService';
import { patchService } from '../../server/services/patchService';
import { getSchemaForCategory } from '../../src/config/entityRegistry';

// Mock dependencies
vi.mock('../../server/services/fileService');
vi.mock('../../server/services/backupService', () => ({
    backupService: {
        createBackup: vi.fn().mockResolvedValue('backup_path')
    }
}));
vi.mock('../../server/services/patchService', () => ({
    patchService: {
        enqueueEntityChange: vi.fn().mockResolvedValue(undefined),
        recordPatch: vi.fn().mockResolvedValue({ id: 'mock-patch' })
    }
}));
vi.mock('../../src/config/entityRegistry', () => ({
    getSchemaForCategory: vi.fn(),
    getRegisteredCategories: vi.fn().mockReturnValue(['units'])
}));

describe('Server DataService', () => {
    const dataDir = 'root/data';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('saveBatch', () => {
        it('skips writing unmodified files (dirty check)', async () => {
            const updates = [{ filename: 'unit1.json', data: { id: 'u1', name: 'Original' } }];
            
            // Mock exists to return true
            vi.mocked(fileService.exists).mockResolvedValue(true);
            
            // Mock readJson to return identical data
            vi.mocked(fileService.readJson).mockResolvedValue({ id: 'u1', name: 'Original' });
            
            await dataService.saveBatch(dataDir, 'units', updates);

            // Should NOT write because data is identical
            expect(fileService.writeJson).not.toHaveBeenCalled();
        });

        it('writes modified files', async () => {
            const updates = [{ filename: 'unit1.json', data: { id: 'u1', name: 'Changed' } }];
            
            vi.mocked(fileService.exists).mockResolvedValue(true);
            vi.mocked(fileService.readJson).mockResolvedValue({ id: 'u1', name: 'Original' });
            vi.mocked(fileService.writeJson).mockResolvedValue(undefined);

            await dataService.saveBatch(dataDir, 'units', updates);

            expect(fileService.writeJson).toHaveBeenCalled();
        });
        
        it('writes new files (exists=false)', async () => {
             const updates = [{ filename: 'new.json', data: { id: 'new', name: 'New' } }];
             
             vi.mocked(fileService.exists).mockResolvedValue(false);
             vi.mocked(fileService.writeJson).mockResolvedValue(undefined);

             await dataService.saveBatch(dataDir, 'units', updates);

             expect(fileService.writeJson).toHaveBeenCalled();
        });
    });

    describe('importData', () => {
        const mockImportData = {
            units: [
                { id: 'u1', name: 'Imported Unit' }
            ]
        };

        it('creates a safety backup before importing', async () => {
            await dataService.importData(dataDir, mockImportData);
            
            expect(backupService.createBackup).toHaveBeenCalledWith(dataDir);
        });

        it('writes directly to file by default (queue=false)', async () => {
             await dataService.importData(dataDir, mockImportData);
             
             expect(fileService.writeJson).toHaveBeenCalledWith(
                 expect.stringContaining('units'),
                 expect.objectContaining({ name: 'Imported Unit' })
             );
             expect(patchService.enqueueEntityChange).not.toHaveBeenCalled();
        });

        it('enqueues changes in queue mode (queue=true)', async () => {
             await dataService.importData(dataDir, mockImportData, true);
             
             expect(patchService.enqueueEntityChange).toHaveBeenCalledWith(
                 dataDir,
                 expect.objectContaining({ name: 'Imported Unit' }),
                 'units',
                 'u1.json'
             );
             expect(fileService.writeJson).not.toHaveBeenCalled();
        });
        
        it('aborts import if validation fails', async () => {
            const invalidData = {
                units: [{ id: 'u1' }] // Missing name etc, depends on schema mock
            };
            
            // Mock schema to fail
            const mockSchema = {
                safeParse: vi.fn().mockReturnValue({ success: false, error: { issues: [] } })
            }
            vi.mocked(getSchemaForCategory).mockReturnValue(mockSchema as any);

            const result = await dataService.importData(dataDir, invalidData);
            
            expect(result.errors.length).toBeGreaterThan(0);
            expect(fileService.writeJson).not.toHaveBeenCalled();
        });
    });
});
