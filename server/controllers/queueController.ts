import { Request, Response, NextFunction } from 'express';
import { queueService } from '../services/queueService.js';
import { AppError } from '../utils/AppError.js';

export const getQueue = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { dataDir } = req.context;
        const queue = await queueService.getQueue(dataDir);
        res.json(queue);
    } catch (error: unknown) {
        next(error);
    }
};

export const addToQueue = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { change } = req.body;
        const { dataDir } = req.context;
        
        if (!change) {
            return next(AppError.badRequest("Change object required"));
        }

        const queue = await queueService.addToQueue(dataDir, change);
        res.json({ success: true, queueLength: queue.length });
    } catch (error: unknown) {
        next(error);
    }
};

export const updateQueueItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { index, change } = req.body;
        const { dataDir } = req.context;

        if (index === undefined || !change) {
            return next(AppError.badRequest("Index and change object required"));
        }

        await queueService.updateQueueItem(dataDir, index, change);
        res.json({ success: true });
    } catch (error: unknown) {
        next(error);
    }
};

export const removeFromQueue = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { index } = req.body;
        const { dataDir } = req.context;

        if (index === undefined) {
             return next(AppError.badRequest("Index required"));
        }

        const queue = await queueService.removeFromQueue(dataDir, index);
        res.json({ success: true, queueLength: queue.length });
    } catch (error: unknown) {
        next(error);
    }
};

export const bulkRemoveFromQueue = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { indices } = req.body;
        const { dataDir } = req.context;

        if (!Array.isArray(indices) || indices.length === 0) {
            return next(AppError.badRequest("Non-empty indices array required"));
        }

        const queue = await queueService.bulkRemoveFromQueue(dataDir, indices);
        res.json({ success: true, queueLength: queue.length });
    } catch (error: unknown) {
        next(error);
    }
};
