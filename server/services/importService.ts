import path from 'path';
import { fileService } from './fileService.js';
import { patchService } from './patchService.js';
import { queueService } from './queueService.js';
import { backupService } from './backupService.js';
import { logger } from '../utils/logger.js';
import { Change } from '../../src/domain/schemas/index.js';
import { getSchemaForCategory, getRegisteredCategories } from '../../src/config/entityRegistry.js';
import { AppError } from '../utils/AppError.js';

export class ImportService {

    /**
     * Exports all data for registered categories.
     */
    async exportData(dataDir: string): Promise<unknown> {
        const categories = getRegisteredCategories();
        const exportPayload: Record<string, unknown> = {
            meta: {
                version: "1.0",
                exportedAt: new Date().toISOString(),
                source: 'production' 
            },
            data: {}
        };

        const resolvedDataDir = path.resolve(dataDir);
        for (const category of categories) {
            const dirPath = path.resolve(resolvedDataDir, category);
            if (!await fileService.exists(dirPath)) continue;

            const files = await fileService.listFiles(dirPath, ['.json']);
            (exportPayload.data as Record<string, unknown[]>)[category] = [];

            for (const file of files) {
                try {
                    const filePath = path.resolve(dirPath, file);
                    const content = await fileService.readJson(filePath);
                    (exportPayload.data as Record<string, unknown[]>)[category].push(content);
                } catch (e) {
                    logger.warn(`Failed to export ${category}/${file}`, { error: e });
                }
            }
        }
        return exportPayload;
    }

    /**
     * Imports data from a backup/export object.
     */
    async importData(dataDir: string, data: unknown, queue: boolean = false): Promise<{ success: boolean; imported: number; errors: string[] }> {
        const resolvedDataDir = path.resolve(dataDir);
        
        const report = {
            success: true,
            imported: 0,
            errors: [] as string[]
        };

        if (!data || typeof data !== 'object') {
             throw AppError.badRequest("Invalid backup format: missing 'data' object");
        }

        // 1. SAFETY: Create backup before applying imports
        try {
            logger.info("[Import] Creating safety backup...");
            await backupService.createBackup(dataDir);
        } catch (e) {
            logger.error("[Import] Safety backup failed. Aborting import.", { error: e });
            throw AppError.internal("Safety backup failed. Import aborted.");
        }

        // Collect changes during the write loop (avoids a second iteration)
        const changes: Change[] = [];

        for (const [category, items] of Object.entries(data as Record<string, unknown>)) {
            if (!Array.isArray(items)) continue;
            

            for (const item of (items as Record<string, unknown>[])) {
                const rawId = (item as Record<string, unknown>).id;
                if (!rawId) {
                    report.errors.push(`Skipped item in ${category}: missing ID`);
                    continue;
                }
                const id = String(rawId);

                try {
                    const filename = id.endsWith('.json') ? id : `${id}.json`;
                    const filePath = path.resolve(resolvedDataDir, category, filename);

                    // SECURITY: Prevent path traversal
                    if (!filePath.startsWith(resolvedDataDir)) {
                         logger.warn(`[Import] Blocked path traversal attempt: ${category}/${filename}`);
                         report.errors.push(`Skipped ${category}/${id}: Invalid path`);
                         continue;
                    }

                    // SAFETY: Validate against category schema
                    const schema = getSchemaForCategory(category);
                    if (schema) {
                        const parseResult = schema.safeParse(item);
                        if (!parseResult.success) {
                            const fields = parseResult.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
                            report.errors.push(`Skipped ${category}/${id}: Validation failed (${fields})`);
                            continue;
                        }
                    }

                    if (queue) {
                        // QUEUE MODE: Enqueue as change instead of writing
                        await queueService.enqueueEntityChange(dataDir, item, category, filename);
                        report.imported++;
                    } else {
                        // DIRECT WRITE MODE
                        await fileService.ensureDir(path.dirname(filePath));
                        await fileService.writeJson(filePath, item);
                        report.imported++;

                        // Collect change for audit patch (single-pass)
                        changes.push({
                            target_id: filename,
                            name: String((item as Record<string, unknown>).name || filename),
                            field: 'entity',
                            old: undefined,
                            new: item,
                            category: category
                        });
                    }
                } catch (e) {
                    report.errors.push(`Failed to import ${category}/${id}: ${(e as Error).message}`);
                }
            }
        }

        if (!queue && changes.length > 0) {
            await patchService.recordPatch(
                dataDir, 
                `Import: ${changes.length} items`, 
                'Content', 
                changes
            );
        }

        return report;
    }
}

export const importService = new ImportService();
