
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dataService } from '../../server/services/dataService'; // Lowercase instance export
import { importService } from '../../server/services/importService';
import { fileService } from '../../server/services/fileService';
import { backupService } from '../../server/services/backupService';
import { queueService } from '../../server/services/queueService';
import { getSchemaForCategory } from '../../src/config/entityRegistry';

// Mock dependencies
vi.mock('../../server/services/fileService');
vi.mock('../../server/services/importService', async (importOriginal) => {
    const mod = await importOriginal<typeof import('../../server/services/importService')>();
    return { importService: mod.importService };
});
vi.mock('../../server/services/backupService', () => ({
    backupService: {
        createBackup: vi.fn().mockResolvedValue('backup_path')
    }
}));
vi.mock('../../server/services/patchService', () => ({
    patchService: {
        recordPatch: vi.fn().mockResolvedValue({ id: 'mock-patch' })
    }
}));
vi.mock('../../server/services/queueService', () => ({
    queueService: {
        enqueueEntityChange: vi.fn().mockResolvedValue(undefined)
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
            await importService.importData(dataDir, mockImportData);
            
            expect(backupService.createBackup).toHaveBeenCalledWith(dataDir);
        });

        it('writes directly to file by default (queue=false)', async () => {
             await importService.importData(dataDir, mockImportData);
             
             expect(fileService.writeJson).toHaveBeenCalledWith(
                 expect.stringContaining('units'),
                 expect.objectContaining({ name: 'Imported Unit' })
             );
             expect(queueService.enqueueEntityChange).not.toHaveBeenCalled();
        });

        it('enqueues changes in queue mode (queue=true)', async () => {
             await importService.importData(dataDir, mockImportData, true);
             
             expect(queueService.enqueueEntityChange).toHaveBeenCalledWith(
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

            const result = await importService.importData(dataDir, invalidData);
            
            expect(result.errors.length).toBeGreaterThan(0);
            expect(fileService.writeJson).not.toHaveBeenCalled();
        });
    });

    describe('saveData — TYPE GUARD', () => {
        const passthroughSchema = { parse: (d: unknown) => d };

        beforeEach(() => {
            vi.mocked(getSchemaForCategory).mockReturnValue(passthroughSchema as any);
            vi.mocked(fileService.writeJson).mockResolvedValue(undefined);
            // backupFile may not be in mock — add it
            (backupService as any).backupFile = vi.fn().mockResolvedValue(null);
        });

        it('allows object → array normalization (e.g. legacy abilities)', async () => {
            // Existing file has abilities as an object (legacy)
            vi.mocked(fileService.exists).mockResolvedValue(true);
            vi.mocked(fileService.readJson).mockResolvedValue({
                name: 'Shadow Weaver',
                abilities: { primary: { name: 'Slash' }, defense: { name: 'Block' } }
            });

            // Frontend sends abilities as an array (normalized)
            const payload = {
                name: 'Shadow Weaver',
                abilities: [
                    { name: 'Slash', type: 'Primary', cooldown: 10 },
                    { name: 'Block', type: 'Defense', cooldown: 5 }
                ]
            };

            await dataService.saveData(dataDir, 'heroes', 'shadow_weaver.json', payload);

            // Should write with the OBJECT format (denormalized) per schema
            const writtenData = vi.mocked(fileService.writeJson).mock.calls[0][1] as Record<string, unknown>;
            expect(Array.isArray(writtenData.abilities)).toBe(false);
            expect(writtenData.abilities).toHaveProperty('primary');
            expect((writtenData.abilities as any).primary.name).toBe('Slash');
        });

        it('blocks incompatible type changes (string → number)', async () => {
            vi.mocked(fileService.exists).mockResolvedValue(true);
            vi.mocked(fileService.readJson).mockResolvedValue({
                name: 'Grunt',
                description: 'A basic unit'
            });

            // Frontend accidentally sends description as a number
            const payload = {
                name: 'Grunt',
                description: 42
            };

            await dataService.saveData(dataDir, 'units', 'grunt.json', payload);

            // Should revert description to original string
            const writtenData = vi.mocked(fileService.writeJson).mock.calls[0][1] as Record<string, unknown>;
            expect(writtenData.description).toBe('A basic unit');
            expect(typeof writtenData.description).toBe('string');
        });

        it('preserves missing keys from existing file (SHAPE GUARD)', async () => {
            vi.mocked(fileService.exists).mockResolvedValue(true);
            vi.mocked(fileService.readJson).mockResolvedValue({
                name: 'Grunt',
                health: 100,
                legacy_field: 'preserve_me'
            });

            // Frontend payload is missing legacy_field
            const payload = {
                name: 'Grunt',
                health: 150
            };

            await dataService.saveData(dataDir, 'units', 'grunt.json', payload);

            const writtenData = vi.mocked(fileService.writeJson).mock.calls[0][1] as Record<string, unknown>;
            expect(writtenData.legacy_field).toBe('preserve_me');
            expect(writtenData.health).toBe(150);
        });

        it('does not revert when types match', async () => {
            vi.mocked(fileService.exists).mockResolvedValue(true);
            vi.mocked(fileService.readJson).mockResolvedValue({
                name: 'Grunt',
                health: 100
            });

            const payload = {
                name: 'Grunt',
                health: 200
            };

            await dataService.saveData(dataDir, 'units', 'grunt.json', payload);

            const writtenData = vi.mocked(fileService.writeJson).mock.calls[0][1] as Record<string, unknown>;
            expect(writtenData.health).toBe(200);
        });
    });
});
