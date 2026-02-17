import { Request, Response, NextFunction } from 'express';
import { patchService } from '../services/patchService.js';
import { backupService } from '../services/backupService.js';
import { logger } from '../utils/logger.js';
import { Change } from '../../src/domain/schemas/index.js';
import { AppError } from '../utils/AppError.js';

/**
 * "Silent Save + Tag" - Saves a file and immediately creates a patch entry
 * without going through the queue.
 */
export const quickSave = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { change, tags, version } = req.body;
        const { dataDir } = req.context;

        if (!change) {
            return next(AppError.badRequest("Change object required"));
        }

        const patch = await patchService.quickSave(dataDir, change, version, tags);
        res.json({ success: true, patch });
    } catch (error: unknown) {
        next(error);
    }
};

/**
 * Commits all queued changes into a new versioned patch.
 * Writes to patches.json and triggers a git commit.
 */
export const commitPatch = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { title, version, type, tags } = req.body;
        const { dataDir } = req.context;

        // Phase 4: Create backup before commit
        try {
            await backupService.createBackup(dataDir);
        } catch (backupError) {
            logger.error("Pre-commit backup failed", { error: backupError });
            throw AppError.internal("Backup failed. Commit aborted.");
        }

        const patch = await patchService.commitPatch(dataDir, title, version, type, tags);
        res.json({ success: true, patch });
    } catch (error: unknown) {
        next(error);
    }
};

/**
 * Retrieves the history of published patches.
 * Supports filtering by tag or entity ID.
 */
export const getPatchHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { dataDir } = req.context;
        const { tag, entity, flat, from, to } = req.query;

        const patches = await patchService.getPatchHistory(dataDir, tag as string, from as string, to as string);

        // Flatten logic if requested (for search/aggregate view)
        // Kept in controller as it's view-specific logic
        if (flat === 'true') {
            const flattened = patches.flatMap(p => 
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                p.changes.map((c: any) => ({
                    ...c,
                    patch_version: p.version,
                    patch_date: p.date,
                    patch_title: p.title,
                    patch_tags: p.tags,
                    patch_diff: p.diff
                }))
            );
            
            // Filter by Entity ID or Name if flattened
            if (entity) {
                const search = String(entity).toLowerCase();
                const filtered = flattened.filter((c: Change) => 
                    (c.target_id && c.target_id.toLowerCase().includes(search)) || 
                    (c.name && c.name.toLowerCase().includes(search))
                );
                res.json(filtered);
                return;
            }

            res.json(flattened);
            return;
        }

        res.json(patches);
    } catch (error: unknown) {
        next(error);
    }
};

/**
 * Reverts a specific patch by creating a counter-patch with inverse changes.
 */
export const rollbackPatch = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { dataDir } = req.context;

        const patch = await patchService.rollbackPatch(dataDir, id as string);
        res.json({ success: true, patch });
    } catch (error: unknown) {
        next(error);
    }
};
