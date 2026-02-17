import path from 'path';
import { fileService } from './fileService.js';
import { Change, ChangeSchema } from '../../src/domain/schemas/index.js';
import { logger } from '../utils/logger.js';
import { auditLogger } from '../utils/auditLogger.js';
import { AppError } from '../utils/AppError.js';

export class QueueService {
    /**
     * Reads the current queue of pending changes from queue.json.
     * Returns an empty array if the file doesn't exist or is invalid.
     */
    async readQueueSafe(dataDir: string): Promise<Change[]> {
        const queueFile = path.join(dataDir, 'queue.json');
        if (await fileService.exists(queueFile)) {
            try {
                return await fileService.readJson<Change[]>(queueFile);
            } catch (e) {
                if ((e as NodeJS.ErrnoException).code !== 'ENOENT') {
                    logger.warn("Failed to read queue.json", { error: e });
                }
                return [];
            }
        }
        return [];
    }

    async getQueue(dataDir: string): Promise<Change[]> {
        return this.readQueueSafe(dataDir);
    }

    async addToQueue(dataDir: string, change: Change): Promise<Change[]> {
        // Validate change object against schema
        const parseResult = ChangeSchema.safeParse(change);
        if (!parseResult.success) {
            throw AppError.badRequest('Invalid change object', {
                fields: parseResult.error.issues.map(e => ({ path: e.path.join('.'), message: e.message }))
            });
        }

        const queueFile = path.join(dataDir, 'queue.json');
        const queue = await this.readQueueSafe(dataDir);
        
        const timestampedChange = { ...change, timestamp: new Date().toISOString() };
        
        // Check for existing pending change for the same target_id and field
        const existingIndex = queue.findIndex(c => c.target_id === change.target_id && c.field === change.field);

        if (existingIndex !== -1) {
            const existing = queue[existingIndex];
            // Merge: Keep original 'old' value, update to latest 'new' value
            queue[existingIndex] = {
                ...existing,
                ...timestampedChange,
                old: existing.old, // Preserve the original starting state
                new: change.new    // Update to the latest state
            };
            auditLogger.logAction(dataDir, 'QUEUE_UPDATE_MERGE', { target_id: change.target_id });
        } else {
            queue.push(timestampedChange);
            auditLogger.logAction(dataDir, 'QUEUE_ADD', { change: timestampedChange });
        }
        
        await fileService.writeJson(queueFile, queue);
        return queue;
    }

    async updateQueueItem(dataDir: string, index: number, change: Change): Promise<Change[]> {
        // Validate change object against schema
        const parseResult = ChangeSchema.safeParse(change);
        if (!parseResult.success) {
            throw AppError.badRequest('Invalid change object', {
                fields: parseResult.error.issues.map(e => ({ path: e.path.join('.'), message: e.message }))
            });
        }

        const queueFile = path.join(dataDir, 'queue.json');
        const queue = await this.readQueueSafe(dataDir);

        if (index < 0 || index >= queue.length) {
            throw AppError.notFound("Queue item not found");
        }

        queue[index] = change;
        await fileService.writeJson(queueFile, queue);
        auditLogger.logAction(dataDir, 'QUEUE_UPDATE', { index, change });
        return queue;
    }

    async removeByTargetId(dataDir: string, targetId: string): Promise<Change[]> {
        const queueFile = path.join(dataDir, 'queue.json');
        const queue = await this.readQueueSafe(dataDir);
        
        // Filter out changes that target this file (by ID or filename)
        const newQueue = queue.filter(c => 
            c.target_id !== targetId && 
            c.target_id !== `${targetId}.json` &&
            c.target_id !== targetId.replace('.json', '')
        );
        
        if (newQueue.length !== queue.length) {
            await fileService.writeJson(queueFile, newQueue);
            auditLogger.logAction(dataDir, 'QUEUE_REMOVE_BY_TARGET', { targetId });
        }
        return newQueue;
    }

    async removeFromQueue(dataDir: string, index: number): Promise<Change[]> {
        const queueFile = path.join(dataDir, 'queue.json');
        const queue = await this.readQueueSafe(dataDir);

        if (index < 0 || index >= queue.length) {
            throw AppError.notFound("Queue item not found");
        }

        queue.splice(index, 1);
        await fileService.writeJson(queueFile, queue);
        auditLogger.logAction(dataDir, 'QUEUE_REMOVE', { index });
        return queue;
    }

    async bulkRemoveFromQueue(dataDir: string, indices: number[]): Promise<Change[]> {
        const queueFile = path.join(dataDir, 'queue.json');
        const queue = await this.readQueueSafe(dataDir);

        // Sort descending to prevent index shifting during splice
        const sortedIndices = [...indices].sort((a, b) => b - a);
        const maxIdx = queue.length - 1;

        // Validation
        for (const idx of sortedIndices) {
            if (idx < 0 || idx > maxIdx) {
                 throw AppError.badRequest(`Queue index ${idx} out of bounds (length: ${queue.length})`);
            }
        }

        // Remove
        for (const idx of sortedIndices) {
            queue.splice(idx, 1);
        }

        await fileService.writeJson(queueFile, queue);
        auditLogger.logAction(dataDir, 'QUEUE_REMOVE_BULK', { indices: sortedIndices, count: sortedIndices.length });
        return queue;
    }
    
    /**
     * Calculates the diff between old and new data and adds it to the queue.
     */
    async enqueueEntityChange(dataDir: string, newData: unknown, category: string, filename: string): Promise<void> {
        const filePath = path.join(dataDir, category, filename);
        if (await fileService.exists(filePath)) {
            const oldData = await fileService.readJson(filePath);
            
            const change: Change = {
                target_id: filename,
                name: String((newData as Record<string, unknown>).name || filename),
                field: 'entity',
                old: oldData,
                new: newData,
                category: category,
            };
            await this.addToQueue(dataDir, change);
        }
    }
}

export const queueService = new QueueService();
