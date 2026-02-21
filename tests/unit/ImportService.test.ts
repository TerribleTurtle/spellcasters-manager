import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted mocks run before vi.mock factories
const { mockFileService, mockBackupService, mockPatchService, mockQueueService, mockGetSchema, mockGetCategories } = vi.hoisted(() => ({
    mockFileService: {
        exists: vi.fn().mockResolvedValue(true),
        listFiles: vi.fn().mockResolvedValue([]),
        readJson: vi.fn(),
        writeJson: vi.fn().mockResolvedValue(undefined),
        ensureDir: vi.fn().mockResolvedValue(undefined)
    },
    mockBackupService: {
        createBackup: vi.fn().mockResolvedValue('/backups/full_backup_123')
    },
    mockPatchService: {
        recordPatch: vi.fn().mockResolvedValue(undefined)
    },
    mockQueueService: {
        enqueueEntityChange: vi.fn().mockResolvedValue(undefined)
    },
    mockGetSchema: vi.fn().mockReturnValue(null),
    mockGetCategories: vi.fn().mockReturnValue(['units', 'heroes'])
}));

vi.mock('../../server/services/fileService.js', () => ({ fileService: mockFileService }));
vi.mock('../../server/services/backupService.js', () => ({ backupService: mockBackupService }));
vi.mock('../../server/services/patchService.js', () => ({ patchService: mockPatchService }));
vi.mock('../../server/services/queueService.js', () => ({ queueService: mockQueueService }));
vi.mock('../../src/config/entityRegistry.js', () => ({
    getSchemaForCategory: mockGetSchema,
    getRegisteredCategories: mockGetCategories
}));
vi.mock('../../server/utils/logger.js', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

import { ImportService } from '../../server/services/importService';

describe('ImportService', () => {
    let service: ImportService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new ImportService();
        // Re-apply defaults after clearAllMocks wipes them
        mockFileService.exists.mockResolvedValue(true);
        mockFileService.listFiles.mockResolvedValue([]);
        mockFileService.writeJson.mockResolvedValue(undefined);
        mockFileService.ensureDir.mockResolvedValue(undefined);
        mockBackupService.createBackup.mockResolvedValue('/backups/full_backup_123');
        mockQueueService.enqueueEntityChange.mockResolvedValue(undefined);
        mockPatchService.recordPatch.mockResolvedValue(undefined);
        mockGetSchema.mockReturnValue(null);
        mockGetCategories.mockReturnValue(['units', 'heroes']);
    });

    describe('exportData', () => {
        it('exports data for registered categories', async () => {
            mockGetCategories.mockReturnValue(['units']);
            mockFileService.exists.mockResolvedValue(true);
            mockFileService.listFiles.mockResolvedValue(['u1.json']);
            mockFileService.readJson.mockResolvedValue({ id: 'u1', name: 'Archer' });

            const result = await service.exportData('/data') as { meta: { version: string }; data: Record<string, unknown[]> };

            expect(result.meta.version).toBe('1.0');
            expect(result.data.units).toHaveLength(1);
            expect(result.data.units[0]).toEqual({ id: 'u1', name: 'Archer' });
        });

        it('skips categories with no directory', async () => {
            mockGetCategories.mockReturnValue(['units', 'missing']);
            mockFileService.exists
                .mockResolvedValueOnce(true)   // units exists
                .mockResolvedValueOnce(false); // missing does not
            mockFileService.listFiles.mockResolvedValue([]);

            const result = await service.exportData('/data') as { data: Record<string, unknown[]> };

            expect(result.data.units).toBeDefined();
            expect(result.data.missing).toBeUndefined();
        });
    });

    describe('importData', () => {
        it('rejects non-object data', async () => {
            await expect(service.importData('/data', null)).rejects.toThrow('Invalid backup format');
            await expect(service.importData('/data', 'string')).rejects.toThrow('Invalid backup format');
        });

        it('aborts if safety backup fails', async () => {
            mockBackupService.createBackup.mockRejectedValue(new Error('Disk full'));

            const importData = { units: [{ id: 'u1', name: 'Test' }] };

            await expect(service.importData('/data', importData)).rejects.toThrow(
                'Safety backup failed. Import aborted.'
            );
            // Verify NO files were written
            expect(mockFileService.writeJson).not.toHaveBeenCalled();
        });

        it('imports valid items via direct write', async () => {
            const importData = {
                units: [
                    { id: 'u1', name: 'Archer' },
                    { id: 'u2', name: 'Mage' }
                ]
            };

            const result = await service.importData('/data', importData);

            expect(result.imported).toBe(2);
            expect(result.errors).toHaveLength(0);
            expect(mockFileService.writeJson).toHaveBeenCalledTimes(2);
        });

        it('enqueues items in queue mode', async () => {
            const importData = {
                units: [{ id: 'u1', name: 'Archer' }]
            };

            const result = await service.importData('/data', importData, true);

            expect(result.imported).toBe(1);
            expect(mockQueueService.enqueueEntityChange).toHaveBeenCalledTimes(1);
            expect(mockFileService.writeJson).not.toHaveBeenCalled();
        });

        it('skips items with missing ID', async () => {
            const importData = {
                units: [
                    { name: 'No ID Unit' },
                    { id: 'u2', name: 'Valid' }
                ]
            };

            const result = await service.importData('/data', importData);

            expect(result.imported).toBe(1);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain('missing ID');
        });

        it('blocks path traversal attempts', async () => {
            const importData = {
                units: [{ id: '../../etc/passwd', name: 'Evil' }]
            };

            const result = await service.importData('/data', importData);

            expect(result.errors.some(e => e.includes('Invalid path'))).toBe(true);
            expect(mockFileService.writeJson).not.toHaveBeenCalled();
        });

        it('skips items that fail schema validation', async () => {
            mockGetSchema.mockReturnValue({
                safeParse: vi.fn().mockReturnValue({
                    success: false,
                    error: {
                        issues: [{ path: ['tier'], message: 'Required' }]
                    }
                })
            });

            const importData = {
                units: [{ id: 'u1', name: 'Invalid' }]
            };

            const result = await service.importData('/data', importData);

            expect(result.imported).toBe(0);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain('Validation failed');
            expect(result.errors[0]).toContain('tier');
        });

        it('handles partial success (valid + invalid items)', async () => {
            // First call returns a failing schema, subsequent calls succeed
            mockGetSchema.mockReturnValue({
                safeParse: vi.fn()
                    .mockReturnValueOnce({
                        success: false,
                        error: { issues: [{ path: ['tier'], message: 'Required' }] }
                    })
                    .mockReturnValueOnce({ success: true, data: { id: 'u2', name: 'Valid', tier: 1 } })
            });

            const importData = {
                units: [
                    { id: 'u1', name: 'Invalid' },
                    { id: 'u2', name: 'Valid', tier: 1 }
                ]
            };

            const result = await service.importData('/data', importData);

            expect(result.imported).toBe(1);
            expect(result.errors).toHaveLength(1);
            // One file written (the valid one)
            expect(mockFileService.writeJson).toHaveBeenCalledTimes(1);
        });

        it('records a patch after direct import', async () => {
            const importData = {
                units: [{ id: 'u1', name: 'Archer' }]
            };

            await service.importData('/data', importData, false);

            expect(mockPatchService.recordPatch).toHaveBeenCalledWith(
                '/data',
                expect.stringContaining('Import: 1 items'),
                'Content',
                expect.any(Array)
            );
        });
    });
});
