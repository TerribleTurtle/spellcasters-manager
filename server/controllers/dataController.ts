import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { fileService } from '../services/fileService.js';
import { dataService } from '../services/dataService.js';
import { importService } from '../services/importService.js';
import { patchService } from '../services/patchService.js';
import { publisherService } from '../services/publisherService.js';

import { queueService } from '../services/queueService.js';
import { logger } from '../utils/logger.js';
import { validatePath } from '../utils/requestHelpers.js';
import { buildSlimChange } from '../utils/slimChange.js';

export { validatePath };

export const listFiles = async (req: Request, res: Response, next: NextFunction) => {
    const dirPath = res.locals.resolvedDir;
    if (!dirPath) return next(AppError.internal("Path resolution failed"));

    const files = await fileService.listFiles(dirPath, ['.json']);
    res.json(files);
};

export const getData = async (req: Request, res: Response, next: NextFunction) => {
    const filePath = res.locals.resolvedPath;
    if (!filePath) return next(AppError.internal("Path resolution failed"));

    try {
        const data = await fileService.readJson(filePath);
        res.json(data);
    } catch {
        next(AppError.notFound('File not found'));
    }
};

export const getCategoryData = async (req: Request, res: Response, next: NextFunction) => {
    const { category } = req.params as { category: string };
    const { dataDir } = req.context;

    try {
        const items = await dataService.getCategoryData(dataDir, category);
        res.json(items);
    } catch (e) {
        next(e);
    }
};

export const saveData = async (req: Request, res: Response, next: NextFunction) => {
    const { category, filename } = req.params as { category: string; filename: string };
    const { queue } = req.query; 
    const { dataDir } = req.context;

    try {
        const newData = await dataService.saveData(
            dataDir, 
            category, 
            filename, 
            req.body, 
            queue === 'true'
        );
        res.json({ success: true, last_modified: (newData as Record<string, unknown>).last_modified });
    } catch (e) {
        next(e);
    }
};

export const deleteData = async (req: Request, res: Response, next: NextFunction) => {
    const { filename } = req.params as { category: string; filename: string };
    const { category } = req.params as { category: string }; 
    const { dataDir } = req.context;
    const filePath = res.locals.resolvedPath;

    if (!filePath) return next(AppError.internal("Path resolution failed"));

    try {
        if (await fileService.exists(filePath)) {
            // AUDIT: Record delete patch before destroying data
            try {
                const oldData = await fileService.readJson(filePath);
                const deleteName = String((oldData as Record<string, unknown>).name || filename);
                const change = buildSlimChange(filename, deleteName, 'DELETE', category, oldData, undefined);
                await patchService.recordPatch(dataDir, `Delete: ${deleteName}`, 'Hotfix', [change]);
            } catch (auditErr) {
                logger.warn("Failed to record delete audit patch", { error: auditErr });
                // Continue with delete even if audit fails? 
                // Better to warn but proceed, or fail safe? 
                // Proceeding is standard for "delete", but let's log loudly.
            }

            await fileService.deleteFile(filePath);
            await queueService.removeByTargetId(dataDir, filename);

            // Publish static API files if this is the community-api data dir
            await publisherService.publishIfNeeded(dataDir);

            res.json({ success: true });
        } else {
            return next(AppError.notFound("File not found"));
        }
    } catch (e) {
        logger.error("Delete Error:", { error: e });
        next(AppError.internal("Delete failed", { originalError: e }));
    }
};

export const saveBatch = async (req: Request, res: Response, next: NextFunction) => {
    const { category } = req.params as { category: string };
    const { dataDir } = req.context;
    
    try {
        const results = await dataService.saveBatch(dataDir, category, req.body);
        res.json({ success: true, results });
    } catch (e) {
        next(e);
    }
};

export const exportData = async (req: Request, res: Response, next: NextFunction) => {
    const { dataDir } = req.context;

    try {
        const exportPayload = await importService.exportData(dataDir);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="backup-${new Date().toISOString().split('T')[0]}.json"`);
        res.json(exportPayload);
    } catch (e) {
        next(e);
    }
};

export const importData = async (req: Request, res: Response, next: NextFunction) => {
    const { dataDir } = req.context;
    const { data } = req.body;
    const { queue } = req.query;

    try {
        const report = await importService.importData(dataDir, data, queue === 'true');
        res.json(report);
    } catch (e) {
        next(e);
    }
};
