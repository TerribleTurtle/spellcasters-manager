
import { Request, Response } from 'express';
import path from 'path';
import { fileService } from '../services/fileService.js';
import { UnitSchema, HeroSchema, ConsumableSchema, Change } from '../../src/domain/schemas.js';
import { logger } from '../utils/logger.js';
import { z } from 'zod';


const CategorySchemaMap: Record<string, z.ZodTypeAny> = {
    heroes: HeroSchema.passthrough(),
    units: UnitSchema.passthrough(),
    spells: ConsumableSchema.passthrough(),
    consumables: ConsumableSchema.passthrough(),
};


/**
 * Lists all JSON files in a specific category directory.
 * Responds with an array of filenames.
 */
export const listFiles = async (req: Request, res: Response) => {
    const { category } = req.params as { category: string };
    const { dataDir } = req.context;
    // Normalize paths
    const resolvedDataDir = path.resolve(dataDir);
    const dirPath = path.resolve(resolvedDataDir, category);
    
    // Security check
    if (!dirPath.startsWith(resolvedDataDir)) {
         res.status(403).send('Forbidden');
         return;
    }

    const files = await fileService.listFiles(dirPath, ['.json']);
    res.json(files);
};

/**
 * Reads and returns the content of a specific JSON file.
 */
export const getData = async (req: Request, res: Response) => {
    const { category, filename } = req.params as { category: string; filename: string };
    const { dataDir } = req.context;
    
    const resolvedDataDir = path.resolve(dataDir);
    const filePath = path.resolve(resolvedDataDir, category, filename);

    // Security check
    if (!filePath.startsWith(resolvedDataDir)) {
        res.status(403).send('Forbidden');
        return;
    }

    try {
        const data = await fileService.readJson(filePath);
        res.json(data);
    } catch {
        res.status(404).send('File not found');
    }
};

/**
 * Bulk loads all data for a specific category.
 * Returns an array of entity objects with injected _filename and _category metadata.
 */
export const getCategoryData = async (req: Request, res: Response) => {
    const { category } = req.params as { category: string };
    const { dataDir } = req.context;
    
    const resolvedDataDir = path.resolve(dataDir);
    const dirPath = path.resolve(resolvedDataDir, category);
    
    if (!dirPath.startsWith(resolvedDataDir)) {
         res.status(403).send('Forbidden');
         return;
    }

    try {
        const files = await fileService.listFiles(dirPath, ['.json']);
        
        // Parallel Processing for Bulk Load
        const items = (await Promise.all(files.map(async file => {
            try {
                const filePath = path.join(dirPath, file);
                const content = await fileService.readJson(filePath);
                // Inject metadata for frontend registry
                return { ...content as object, _filename: file, _category: category };
            } catch (e) {
                logger.warn(`Failed to read ${category}/${file}`, { error: e });
                return null;
            }
        }))).filter(item => item !== null); // Filter out failed reads

        res.json(items);
    } catch (e) {
        logger.error(`Bulk load failed for ${category}`, { error: e });
        res.status(500).json({ error: "Failed to load category data" });
    }
};

// Helper to append to queue.json safely
const appendToQueue = async (dataDir: string, change: Change) => {
    const queueFile = path.join(dataDir, 'queue.json');
    let queue: Change[] = [];
    if (await fileService.exists(queueFile)) {
        try {
            queue = await fileService.readJson<Change[]>(queueFile);
        } catch (e) {
            logger.warn("Corrupt queue.json, resetting", { error: e });
            queue = [];
        }
    }
    queue.push(change);
    await fileService.writeJson(queueFile, queue);
};

/**
 * Saves data to a JSON file.
 * Optionally appends a change entry to the patch queue if `?queue=true` is set.
 */
export const saveData = async (req: Request, res: Response) => {
    const { category, filename } = req.params as { category: string; filename: string };
    const { queue } = req.query; // ?queue=true
    const { dataDir } = req.context;
    
    const resolvedDataDir = path.resolve(dataDir);
    const filePath = path.resolve(resolvedDataDir, category, filename);
    
    // Security check
    if (!filePath.startsWith(resolvedDataDir)) {
        res.status(403).send('Forbidden');
        return;
    }

    let newData = req.body;

    // Inject last_modified
    newData.last_modified = new Date().toISOString();

    try {
        // Validation Gate
        // Schema-Driven Validation
        const schema = CategorySchemaMap[category];
        if (schema) {
            try {
                newData = schema.parse(newData);
            } catch (validationError) {
                if (validationError instanceof z.ZodError) {
                     logger.warn(`Validation Failed for ${category}/${filename}:`, { error: validationError.issues });
                     res.status(400).json({ 
                        error: "Validation Failed", 
                        fields: validationError.issues.map(e => ({
                            path: e.path.join('.'),
                            message: e.message
                        }))
                     });
                     return;
                }
                logger.warn(`Validation Failed for ${category}/${filename}:`, { error: validationError });
                throw new Error("Validation Failed");
            }
        }

        // If queue requested, calculate diff and append
        if (queue === 'true' && await fileService.exists(filePath)) {
            const oldData = await fileService.readJson(filePath);
            
            // ... (Diff Logic from before) ...
            
            const change: Change = {
                target_id: newData.id,
                name: newData.name,
                field: 'entity', // Generic 'entity' constraint for now
                old: oldData, // Can be heavy, but accurate
                new: newData
            };
            await appendToQueue(dataDir, change);
        }

        await fileService.writeJson(filePath, newData);

        res.json({ success: true, last_modified: newData.last_modified });
    } catch (e: unknown) {
        logger.error("Save Error:", { error: e });
        res.status(400).json({ error: (e as Error).message });
    }

};

/**
 * Deletes a specific JSON file and its associated assets (if implemented).
 */
export const deleteData = async (req: Request, res: Response) => {
    const { category, filename } = req.params as { category: string; filename: string };
    const { dataDir } = req.context;

    const resolvedDataDir = path.resolve(dataDir);
    const filePath = path.resolve(resolvedDataDir, category, filename);

    // Security check
    if (!filePath.startsWith(resolvedDataDir)) {
        res.status(403).send('Forbidden');
        return;
    }

    try {
        if (await fileService.exists(filePath)) {
            await fileService.deleteFile(filePath);

            // Clean existing queue items regarding this file
            const queueFile = path.join(dataDir, 'queue.json');
            if (await fileService.exists(queueFile)) {
                try {
                    const queue = await fileService.readJson<Change[]>(queueFile);
                    // Filter out changes that target this file (by ID or filename)
                    // We assume target_id might match filename or filename.json
                    const newQueue = queue.filter(c => 
                        c.target_id !== filename && 
                        c.target_id !== `${filename}.json` &&
                        c.target_id !== filename.replace('.json', '')
                    );
                    
                    if (newQueue.length !== queue.length) {
                        await fileService.writeJson(queueFile, newQueue);
                    }
                } catch (e) {
                    logger.warn("Failed to clean queue during delete", { error: e });
                }
            }

            res.json({ success: true });
        } else {
            res.status(404).json({ error: "File not found" });
        }
    } catch (e) {
        logger.error("Delete Error:", { error: e });
        res.status(500).json({ error: "Delete failed" });
    }
};

// --- Reset / Sync ---

/**
 * Resets the DEV data directory by mirroring the LIVE data directory.
 * WARNING: Destructive operation for local DEV changes.
 */
export const resetDevData = async (req: Request, res: Response) => {
    try {
        const { mode } = req.context;
        
        // Security check: Only allow in 'dev' app mode
        if (mode !== 'dev') {
             return res.status(403).json({ error: "Reset is only allowed in dev mode" });
        }
        if (process.env.NODE_ENV === 'production') {
             return res.status(403).json({ error: "Cannot reset data in production environment" });
        }
        // We'll trust the sync script to do the heavy lifting
        // Using execFile is safer than exec (no shell interpretation)
        const { execFile } = await import('child_process');
        
        const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
        
        execFile(npmCmd, ['run', 'sync-data:clean'], (error, stdout, stderr) => {
            if (error) {
                logger.error(`[Admin] Reset failed: ${error.message}`);
                logger.error(`[Admin] Stderr: ${stderr}`);
                return res.status(500).json({ 
                    error: "Reset failed", 
                    details: stderr || error.message 
                });
            }

            res.json({ success: true, message: "Dev data reset from Live source" });
        });

    } catch (err: unknown) {
        logger.error("[Admin] Error resetting data:", { error: err });
        res.status(500).json({ error: "Internal Server Error" });
    }
};;

/**
 * Batches multiple file writes in a single request.
 * Used for mass updates or migrations.
 */
export const saveBatch = async (req: Request, res: Response) => {
    const { category } = req.params as { category: string };
    const { dataDir } = req.context;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates = req.body as { filename: string; data: any }[];

    if (!Array.isArray(updates)) {
         res.status(400).json({ error: "Body must be an array of updates" });
         return;
    }

    const resolvedDataDir = path.resolve(dataDir);
    const dirPath = path.resolve(resolvedDataDir, category);
    
    // Security check
    if (!dirPath.startsWith(resolvedDataDir)) {
         res.status(403).send('Forbidden');
         return;
    }

    const results: { filename: string; success: boolean; error?: string }[] = [];
    const timestamp = new Date().toISOString();

    try {
        for (const update of updates) {
            const { filename, data } = update;
            if(!filename || !data) {
                results.push({ filename: filename || 'unknown', success: false, error: 'Missing filename or data' });
                continue;
            }

            const filePath = path.resolve(dirPath, filename);
            
            // Sub-security check per file
            if (!filePath.startsWith(dirPath)) {
                results.push({ filename, success: false, error: 'Forbidden path' });
                continue;
            }

            try {
                // Validation Gate (Reuse logic if possible, but keep it simple here)
                let validData = data;
                validData.last_modified = timestamp; // Inject timestamp
                
                // Schema-Driven Validation
                const schema = CategorySchemaMap[category];
                if (schema) {
                    try {
                        validData = schema.parse(validData);
                    } catch (validationError) {
                         if (validationError instanceof z.ZodError) {
                             results.push({ 
                                 filename, 
                                 success: false, 
                                 error: "Validation Failed: " + validationError.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') 
                             });
                             continue;
                         }
                         throw validationError;
                    }
                }

                await fileService.writeJson(filePath, validData);
                results.push({ filename, success: true });
            } catch (err) {
                 logger.error(`Error saving ${filename}:`, { error: err });
                 results.push({ filename, success: false, error: (err as Error).message });
            }
        }
        
        res.json({ success: true, results });

    } catch (e) {
        logger.error("Batch Save Error:", { error: e });
        res.status(500).json({ error: "Batch save failed internally" });
    }
};

export const exportData = async (req: Request, res: Response) => {
    const { dataDir } = req.context;
    const resolvedDataDir = path.resolve(dataDir);
    
    // We export based on known categories to avoid random files
    const categories = Object.keys(CategorySchemaMap);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exportPayload: any = {
        meta: {
            version: "1.0",
            exportedAt: new Date().toISOString(),
            source: req.query.mode || 'dev' 
        },
        data: {}
    };

    try {
        for (const category of categories) {
            const dirPath = path.resolve(resolvedDataDir, category);
            if (!await fileService.exists(dirPath)) continue;

            const files = await fileService.listFiles(dirPath, ['.json']);
            exportPayload.data[category] = [];

            for (const file of files) {
                try {
                    const filePath = path.resolve(dirPath, file);
                    const content = await fileService.readJson(filePath);
                    exportPayload.data[category].push(content);
                } catch (e) {
                    logger.warn(`Failed to export ${category}/${file}`, { error: e });
                }
            }
        }

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="backup-${new Date().toISOString().split('T')[0]}.json"`);
        res.json(exportPayload);

    } catch (e) {
        logger.error("Export Error:", { error: e });
        res.status(500).json({ error: "Export failed" });
    }
};

export const importData = async (req: Request, res: Response) => {
    const { dataDir } = req.context;
    const resolvedDataDir = path.resolve(dataDir);
    
    // Expect generic JSON body
    const { data } = req.body;

    if (!data || typeof data !== 'object') {
        res.status(400).json({ error: "Invalid backup format: missing 'data' object" });
        return;
    }

    const report = {
        success: true,
        imported: 0,
        errors: [] as string[]
    };

    try {
        for (const [category, items] of Object.entries(data)) {
            if (!Array.isArray(items)) continue;

            // Ensure category dir exists
            const dirPath = path.resolve(resolvedDataDir, category);
            if (!await fileService.exists(dirPath)) {
                // Should we create it? Yes, import should restore structure.
                // But fileService.ensureDir isn't exposed directly, but writeJson handles it.
                // We'll rely on writeJson.
            }

            for (const item of items) {
                // Identify ID
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const id = (item as any).id;
                if (!id) {
                    report.errors.push(`Skipped item in ${category}: missing ID`);
                    continue;
                }

                try {
                    // Normalize filename
                    const filename = id.endsWith('.json') ? id : `${id}.json`;
                    const filePath = path.resolve(resolvedDataDir, category, filename);

                    // SECURITY: Prevent path traversal
                    if (!filePath.startsWith(resolvedDataDir)) {
                         logger.warn(`[Import] Blocked path traversal attempt: ${category}/${filename}`);
                         report.errors.push(`Skipped ${category}/${id}: Invalid path`);
                         continue;
                    }

                    // Write
                    await fileService.writeJson(filePath, item);
                    report.imported++;
                } catch (e) {
                    report.errors.push(`Failed to import ${category}/${id}: ${(e as Error).message}`);
                }
            }
        }

        res.json(report);

    } catch (e) {
        logger.error("Import Error:", { error: e });
        res.status(500).json({ error: "Import failed internal error" });
    }
};
