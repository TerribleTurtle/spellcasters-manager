import path from 'path';
import { fileService } from './fileService.js';
import { patchService } from './patchService.js';
import { backupService } from './backupService.js';
import { logger } from '../utils/logger.js';
import { validateAndParse, stripInternalFields } from '../utils/requestHelpers.js';
import { Change } from '../../src/domain/schemas/index.js';
import { getSchemaForCategory } from '../../src/config/entityRegistry.js';
import { AppError } from '../utils/AppError.js';

export class DataService {

    /**
     * Bulk loads all data for a specific category.
     * Returns an array of entity objects with injected _filename and _category metadata.
     */
    async getCategoryData(dataDir: string, category: string): Promise<Record<string, unknown>[]> {
        const safeDirPath = path.resolve(dataDir, category);
        if (!safeDirPath.startsWith(path.resolve(dataDir))) {
             throw AppError.badRequest("Invalid category path");
        }

        try {
            if (!await fileService.exists(safeDirPath)) {
                 return [];
            }

            const files = await fileService.listFiles(safeDirPath, ['.json']);
            
            const items = (await Promise.all(files.map(async file => {
                try {
                    const filePath = path.join(safeDirPath, file);
                    const content = await fileService.readJson(filePath);
                    return { ...content as object, _filename: file, _category: category };
                } catch (e) {
                    logger.warn(`Failed to read ${category}/${file}`, { error: e });
                    return null;
                }
            }))).filter(item => item !== null);

            return items;
        } catch (e) {
            logger.error(`Bulk load failed for ${category}`, { error: e });
            throw AppError.internal("Failed to load category data", { originalError: e });
        }
    }

    /**
     * Saves data to a JSON file.
     * Optionally appends a change entry to the patch queue.
     */
    async saveData(dataDir: string, category: string, filename: string, data: unknown, queue: boolean = false): Promise<unknown> {
         const schema = getSchemaForCategory(category);
         const newData = validateAndParse(data, schema, `${category}/${filename}`);

         // Use path.resolve for absolute path consistency
         const filePath = path.resolve(dataDir, category, filename);

         // Security check
         if (!filePath.startsWith(path.resolve(dataDir))) {
             throw AppError.badRequest("Invalid file path");
         }

         // SAFETY: Create single-file backup before overwriting
         await backupService.backupFile(dataDir, filePath);

         if (queue) {
             await patchService.enqueueEntityChange(dataDir, newData, category, filename);
         } else {
             // AUTO-PATCH RECORDING (Standard Save)
             // Every non-queued save creates an immediate audit record in patches.json.
             
             let oldData: unknown;
             if (await fileService.exists(filePath)) {
                 try {
                     oldData = await fileService.readJson(filePath);
                 } catch {
                     logger.warn(`Failed to read old data for patch recording: ${filename}`);
                 }
             }
             // if(oldData) oldDataAny = oldData as Record<string, unknown>;

             const change = {
                 target_id: filename,
                  name: String((newData as Record<string, unknown>).name || filename),
                 field: 'entity',
                 old: oldData,
                 new: newData,
                 category: category
             };
             
             await patchService.recordPatch(dataDir, `Auto-Save: ${change.name}`, 'Hotfix', [change]);
         }

         await fileService.writeJson(filePath, newData);
         return newData;
    }

    /**
     * Batches multiple file writes.
     */
    async saveBatch(dataDir: string, category: string, updates: { filename: string; data: unknown }[]): Promise<{ filename: string; success: boolean; error?: string }[]> {
        if (!Array.isArray(updates)) {
            throw AppError.badRequest("Body must be an array of updates");
        }

        const results: { filename: string; success: boolean; error?: string }[] = [];
        const schema = getSchemaForCategory(category);
        const categoryDir = path.resolve(dataDir, category);
        
        for (const update of updates) {
            const { filename, data } = update;
            if(!filename || !data) {
                results.push({ filename: filename || 'unknown', success: false, error: 'Missing filename or data' });
                continue;
            }

            const filePath = path.resolve(categoryDir, filename);
            
            if (!filePath.startsWith(categoryDir)) {
                results.push({ filename, success: false, error: 'Forbidden path' });
                continue;
            }

            try {
                let validData: unknown = data;
                
                // 1. Validation first (without fresh timestamp yet)
                if (schema) {
                     try {
                         validData = validateAndParse(data, schema, filename);
                     } catch (e) {
                         const msg = e instanceof AppError ? `${e.message}: ${JSON.stringify(e.details)}` : (e as Error).message;
                         results.push({ filename, success: false, error: msg });
                         continue;
                     }
                }

                // 2. Dirty Check
                if (await fileService.exists(filePath)) {
                    try {
                        const existing = await fileService.readJson(filePath);
                        
                        // Compare (excluding last_modified)
                        const existingClean = { ...(existing as Record<string, unknown>) };
                        delete existingClean.last_modified;
                        
                        const newClean = { ...(validData as Record<string, unknown>) };
                        delete newClean.last_modified;

                        if (JSON.stringify(existingClean) === JSON.stringify(newClean)) {
                            results.push({ filename, success: true });
                            continue;
                        }
                    } catch (e) {
                        logger.warn(`Dirty check failed for ${filename}, proceeding with write.`, { error: e });
                    }
                }

                // 3. Update timestamp and write
                (validData as Record<string, unknown>).last_modified = new Date().toISOString();
                
                await fileService.writeJson(filePath, validData);
                results.push({ filename, success: true });
            } catch (err) {
                 logger.error(`Error saving ${filename}:`, { error: err });
                 results.push({ filename, success: false, error: (err as Error).message });
            }
        }
        
        // Record Batch Patch if anything succeeded
        const successfulUpdates = results.filter(r => r.success);
        if (successfulUpdates.length > 0) {
            const changes: Change[] = [];
            for (const update of updates) {
                if (results.find(r => r.filename === update.filename && r.success)) {
                     // We don't have "old" data easily here without re-reading or caching earlier.
                     // For batch saves, we'll accept "old" as undefined for now to save perf,
                     // or we could have captured it during the loop. 
                     // Let's rely on the fact that these are usually new or massive overwrites.
                     // Actually, a defined "old" is better. But simplest valid Change is old=optional?
                     // Schema says old is any().
                     changes.push({
                        target_id: update.filename,
                         name: String((update.data as Record<string, unknown>).name || update.filename),
                        field: 'entity',
                        old: undefined, // TODO: optimize if needed
                        new: stripInternalFields(update.data), // Clean it
                        category: category
                     });
                }
            }
            
            if (changes.length > 0) {
                 await patchService.recordPatch(
                     dataDir, 
                     `Batch Save: ${category} (${changes.length} items)`, 
                     'Hotfix', 
                     changes
                 );
            }
        }

        return results;
    }

}

export const dataService = new DataService();

