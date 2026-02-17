import { Request, Response } from 'express';
import { patchService } from '../services/patchService.js';
import { backupService } from '../services/backupService.js';
import { logger } from '../utils/logger.js';
import { Change } from '../../src/domain/schemas.js';

/**
 * "Silent Save + Tag" - Saves a file and immediately creates a patch entry
 * without going through the queue.
 */
export const quickSave = async (req: Request, res: Response) => {
    try {
        const { change, tags, version } = req.body;
        const { dataDir } = req.context;

        if (!change) {
            res.status(400).json({ error: "Change object required" });
            return;
        }

        const patch = await patchService.quickSave(dataDir, change, version, tags);
        res.json({ success: true, patch });
    } catch (error: unknown) {
        logger.error("quickSave Error:", { error });
        res.status(500).json({ error: (error as Error).message });
    }
};

/**
 * Commits all queued changes into a new versioned patch.
 * Writes to patches.json and triggers a git commit.
 */
export const commitPatch = async (req: Request, res: Response) => {
    try {
        const { title, version, type, tags } = req.body;
        const { dataDir } = req.context;

        // Phase 4: Create backup before commit
        try {
            backupService.createBackup(dataDir);
        } catch (backupError) {
            logger.error("Pre-commit backup failed", { error: backupError });
            res.status(500).json({ error: "Backup failed. Commit aborted." });
            return;
        }

        const patch = await patchService.commitPatch(dataDir, title, version, type, tags);
        res.json({ success: true, patch });
    } catch (error: unknown) {
        logger.error("commitPatch Error:", { error });
        const msg = (error as Error).message;
        if (msg === "No queued changes to commit") {
            res.status(400).json({ error: msg });
        } else {
            res.status(500).json({ error: msg });
        }
    }
};

/**
 * Retrieves the history of published patches.
 * Supports filtering by tag or entity ID.
 */
export const getPatchHistory = async (req: Request, res: Response) => {
    try {
        const { dataDir } = req.context;
        const { tag, entity, flat, from, to } = req.query;

        const patches = await patchService.getPatchHistory(dataDir, tag as string, from as string, to as string);

        // Flatten logic if requested (for search/aggregate view)
        // Kept in controller as it's view-specific logic
        if (flat === 'true') {
            const flattened = patches.flatMap(p => 
                p.changes.map((c: any) => ({
                    ...c,
                    patch_version: p.version,
                    patch_date: p.date,
                    patch_title: p.title
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
        logger.error("getPatchHistory Error:", { error });
        res.status(500).json({ error: (error as Error).message });
    }
};

/**
 * Reverts a specific patch by creating a counter-patch with inverse changes.
 */
export const rollbackPatch = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { dataDir } = req.context;

        const patch = await patchService.rollbackPatch(dataDir, id as string);
        res.json({ success: true, patch });
    } catch (error: unknown) {
        logger.error("rollbackPatch Error:", { error });
        const msg = (error as Error).message;
        if (msg === "No patches found" || msg === "Patch not found") {
            res.status(404).json({ error: msg });
        } else {
            res.status(500).json({ error: msg });
        }
    }
};
