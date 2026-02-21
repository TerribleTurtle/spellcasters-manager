import path from 'path';
import { fileService } from './fileService.js';
import { patchService } from './patchService.js';
import { queueService } from './queueService.js';
import { publisherService } from './publisherService.js';
import { backupService } from './backupService.js';
import { logger } from '../utils/logger.js';
import { validateAndParse } from '../utils/requestHelpers.js';
import { Change } from '../../src/domain/schemas/index.js';
import { getSchemaForCategory } from '../../src/config/entityRegistry.js';
import { AppError } from '../utils/AppError.js';
import { buildSlimChange } from '../utils/slimChange.js';
import { denormalizeAbilities } from '../../src/domain/diff-utils.js';
import { sortKeys } from '../utils/jsonUtils.js';

export class DataService {

    /**
     * Bulk loads all data for a specific category.
     * Returns an array of entity objects with injected _filename and _category metadata.
     * 
     * @param dataDir - The absolute path to the root data directory
     * @param category - The entity category folder name (e.g., 'heroes', 'units')
     * @returns Array of parsed JSON objects with `_filename` and `_category` appended
     * 
     * @example
     * const heroes = await dataService.getCategoryData('/path/to/data', 'heroes');
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
     * 
     * @param dataDir - The absolute path to the root data directory
     * @param category - The entity category folder name
     * @param filename - The filename to write (e.g., 'hero1.json')
     * @param data - The entity data object to persist
     * @param queue - If true, the change is queued instead of instantly patched
     * @returns The normalized data that was written to disk
     * 
     * @example
     * const saved = await dataService.saveData('/data', 'heroes', 'hero1.json', { name: 'Hero' }, true);
     */
    async saveData(dataDir: string, category: string, filename: string, data: unknown, queue: boolean = false): Promise<unknown> {
         const schema = getSchemaForCategory(category);
         const newData = validateAndParse(data, schema, `${category}/${filename}`);

         // [FIX] Denormalize Abilities (Array -> Object) for Heroes
         // This ensures we write the schema-compliant Object format to disk,
         // even though the Editor works with Arrays.
         if (category === 'heroes' && 'abilities' in (newData as Record<string, unknown>)) {
             const anyData = newData as Record<string, unknown>;
             if (Array.isArray(anyData.abilities)) {
                 anyData.abilities = denormalizeAbilities(anyData.abilities);
             }
         }

         // Use path.resolve for absolute path consistency
         const filePath = path.resolve(dataDir, category, filename);

         // Security check
         if (!filePath.startsWith(path.resolve(dataDir))) {
             throw AppError.badRequest("Invalid file path");
         }

         // SAFETY: Create single-file backup before overwriting
         await backupService.backupFile(dataDir, filePath);

         // Read existing data once — shared by shape guard, type guard, and patch recording
         let existingData: Record<string, unknown> | null = null;
         if (await fileService.exists(filePath)) {
             try {
                 existingData = await fileService.readJson(filePath) as Record<string, unknown>;
             } catch {
                 logger.warn(`[SHAPE GUARD] Could not read existing file for key check: ${filename}`);
             }
         }

         // KEY PRESERVATION GUARD: Never drop existing fields from a file.
         // If the incoming data is missing keys that exist on disk, merge
         // the original values back in. This prevents normalization or
         // frontend bugs from silently corrupting data shape.
         let safeData = newData;
         if (existingData) {
                 const incoming = safeData as Record<string, unknown>;
                 const missingKeys = Object.keys(existingData).filter(k => !(k in incoming));
                 
                 if (missingKeys.length > 0) {
                     logger.warn(`[SHAPE GUARD] ${category}/${filename}: incoming data missing keys [${missingKeys.join(', ')}] — preserving originals`);
                     const merged = { ...existingData, ...incoming };
                     safeData = merged as typeof newData;
                 }

                 // TYPE GUARD: Prevent incompatible type changes (e.g. string -> number)
                 // If a key exists in both but has an incompatible type, revert to original.
                 // NOTE: object -> array is allowed (known normalization path, e.g. legacy abilities)
                 const inc = safeData as Record<string, unknown>;
                 for (const key in existingData) {
                     if (key in inc) {
                         const oldVal = existingData[key];
                         const newVal = inc[key];
                         
                         // Skip null/undefined checks for simplicity (allow nulling out)
                         if (oldVal === null || oldVal === undefined || newVal === null || newVal === undefined) continue;

                         const oldType = Array.isArray(oldVal) ? 'array' : typeof oldVal;
                         const newType = Array.isArray(newVal) ? 'array' : typeof newVal;

                         if (oldType !== newType) {
                              // Allow object -> array (legacy normalization, e.g. abilities)
                              if (oldType === 'object' && newType === 'array') {
                                   logger.info(`[TYPE GUARD] ${category}/${filename}: key '${key}' normalized from ${oldType} to ${newType} — allowing`);
                                   continue;
                              }
                              // Allow array -> object (save denormalization, e.g. abilities)
                              if (oldType === 'array' && newType === 'object') {
                                   logger.info(`[TYPE GUARD] ${category}/${filename}: key '${key}' denormalized from ${oldType} to ${newType} — allowing`);
                                   continue;
                              }
                              logger.warn(`[TYPE GUARD] ${category}/${filename}: key '${key}' changed type from ${oldType} to ${newType} — preserving original`);
                              inc[key] = oldVal;
                         }
                     }
                 }
         }

         // Stamp last_modified before diff/queue so the recorded change
         // and the persisted file have the same timestamp.
         (safeData as Record<string, unknown>).last_modified = new Date().toISOString();

         if (queue) {
             await queueService.enqueueEntityChange(dataDir, safeData, category, filename);
         } else {
             // AUTO-PATCH RECORDING (Standard Save)
              // Every non-queued save creates an immediate audit record in patches.json.
              // Uses slim diffs instead of full old/new snapshots.
              const changeName = String((safeData as Record<string, unknown>).name || filename);
              const change = buildSlimChange(filename, changeName, 'entity', category, existingData, safeData);
              
              await patchService.recordPatch(dataDir, `Auto-Save: ${changeName}`, 'Hotfix', [change]);
         }

         await fileService.writeJson(filePath, sortKeys(safeData));

         // Publish static API files if this is the community-api data dir
         await publisherService.publishIfNeeded(dataDir);

         return safeData;
    }

    /**
     * Batches multiple file writes.
     * 
     * @param dataDir - The absolute path to the root data directory
     * @param category - The entity category folder name
     * @param updates - An array of filename/data pairs to write
     * @returns An array of results indicating success/failure per file
     * 
     * @example
     * const results = await dataService.saveBatch('/data', 'heroes', [{ filename: 'hero1.json', data: { name: 'Hero 1' } }]);
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

                // 2. Dirty Check — also captures existing data for patch recording
                let existingBatchData: unknown = undefined;
                if (await fileService.exists(filePath)) {
                    try {
                        existingBatchData = await fileService.readJson(filePath);
                        
                        // Compare (excluding last_modified)
                        const existingClean = { ...(existingBatchData as Record<string, unknown>) };
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
                
                await fileService.writeJson(filePath, sortKeys(validData));
                results.push({ filename, success: true, _oldData: existingBatchData } as typeof results[0] & { _oldData?: unknown });
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
                const result = results.find(r => r.filename === update.filename && r.success);
                if (result) {
                     const updateName = String((update.data as Record<string, unknown>).name || update.filename);
                     // Use existing data captured during dirty-check for real diffs
                     const oldData = (result as typeof result & { _oldData?: unknown })._oldData;
                     changes.push(buildSlimChange(
                         update.filename,
                         updateName,
                         'entity',
                         category,
                         oldData,
                         update.data
                     ));
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

    /**
     * Deletes an entity and handles necessary side-effects (auditing, queue cleanup, static publishing).
     * 
     * @param dataDir - The absolute path to the root data directory
     * @param category - The entity category folder name
     * @param filename - The filename to delete
     * @param filePath - The fully resolved absolute path to the file
     */
    async deleteEntity(dataDir: string, category: string, filename: string, filePath: string): Promise<void> {
        if (await fileService.exists(filePath)) {
            // AUDIT: Record delete patch before destroying data
            try {
                const oldData = await fileService.readJson(filePath);
                const deleteName = String((oldData as Record<string, unknown>).name || filename);
                const change = buildSlimChange(filename, deleteName, 'DELETE', category, oldData, undefined);
                await patchService.recordPatch(dataDir, `Delete: ${deleteName}`, 'Hotfix', [change]);
            } catch (auditErr) {
                logger.warn("Failed to record delete audit patch", { error: auditErr });
                // Continue with delete even if audit fails
            }

            await fileService.deleteFile(filePath);
            await queueService.removeByTargetId(dataDir, filename);

            // Publish static API files if this is the community-api data dir
            await publisherService.publishIfNeeded(dataDir);
        } else {
            throw AppError.notFound("File not found");
        }
    }
}

export const dataService = new DataService();

