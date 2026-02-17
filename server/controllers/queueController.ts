import { Request, Response } from 'express';
import { patchService } from '../services/patchService.js';
import { logger } from '../utils/logger.js';

export const getQueue = async (req: Request, res: Response) => {
    try {
        const { dataDir } = req.context;
        const queue = await patchService.getQueue(dataDir);
        res.json(queue);
    } catch (error: unknown) {
        logger.error("getQueue Error:", { error });
        res.status(500).json({ error: (error as Error).message });
    }
};

export const addToQueue = async (req: Request, res: Response) => {
    try {
        const { change } = req.body;
        const { dataDir } = req.context;
        
        if (!change) {
            res.status(400).json({ error: "Change object required" });
            return;
        }

        const queue = await patchService.addToQueue(dataDir, change);
        res.json({ success: true, queueLength: queue.length });
    } catch (error: unknown) {
        logger.error("addToQueue Error:", { error });
        res.status(500).json({ error: (error as Error).message });
    }
};

export const updateQueueItem = async (req: Request, res: Response) => {
    try {
        const { index, change } = req.body;
        const { dataDir } = req.context;

        if (index === undefined || !change) {
            res.status(400).json({ error: "Index and change object required" });
            return;
        }

        await patchService.updateQueueItem(dataDir, index, change);
        res.json({ success: true });
    } catch (error: unknown) {
        const msg = (error as Error).message;
        if (msg === "Queue item not found") {
            res.status(404).json({ error: msg });
        } else {
            logger.error("updateQueueItem Error:", { error });
            res.status(500).json({ error: msg });
        }
    }
};

export const removeFromQueue = async (req: Request, res: Response) => {
    try {
        const { index } = req.body;
        const { dataDir } = req.context;

        if (index === undefined) {
            res.status(400).json({ error: "Index required" });
            return;
        }

        const queue = await patchService.removeFromQueue(dataDir, index);
        res.json({ success: true, queueLength: queue.length });
    } catch (error: unknown) {
        const msg = (error as Error).message;
        if (msg === "Queue item not found") {
            res.status(404).json({ error: msg });
        } else {
            logger.error("removeFromQueue Error:", { error });
            res.status(500).json({ error: msg });
        }
    }
};

export const bulkRemoveFromQueue = async (req: Request, res: Response) => {
    try {
        const { indices } = req.body;
        const { dataDir } = req.context;

        if (!Array.isArray(indices) || indices.length === 0) {
            res.status(400).json({ error: "Non-empty indices array required" });
            return;
        }

        const queue = await patchService.bulkRemoveFromQueue(dataDir, indices);
        res.json({ success: true, queueLength: queue.length });
    } catch (error: unknown) {
        logger.error("bulkRemoveFromQueue Error:", { error });
        res.status(500).json({ error: (error as Error).message });
    }
};
