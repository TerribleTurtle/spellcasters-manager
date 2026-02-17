import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as QueueController from '../../server/controllers/queueController';
import { queueService } from '../../server/services/queueService';
import { Response } from 'express';
import { createMockRequest, MockRequest } from '../helpers/mockRequest';

// Mock PatchService
vi.mock('../../server/services/queueService');

describe('QueueController', () => {
    let mockReq: MockRequest;
    let mockRes: Partial<Response>;
    let jsonSpy: any;
    let statusSpy: any;
    let nextSpy: any;

    const mockedQueueService = vi.mocked(queueService);

    beforeEach(() => {
        vi.clearAllMocks();
        jsonSpy = vi.fn();
        nextSpy = vi.fn();
        statusSpy = vi.fn().mockReturnValue({ json: jsonSpy });
        mockRes = {
            json: jsonSpy,
            status: statusSpy,
        } as unknown as Response;

        mockReq = createMockRequest({
            body: {},
            context: { dataDir: 'root/data', mode: 'dev' }
        });
    });

    it('getQueue delegates to queueService', async () => {
        const mockQueue = [{ target_id: 'c1' }];
        mockedQueueService.getQueue.mockResolvedValue(mockQueue);
        
        await QueueController.getQueue(mockReq, mockRes as Response, nextSpy);

        expect(queueService.getQueue).toHaveBeenCalledWith('root/data');
        expect(jsonSpy).toHaveBeenCalledWith(mockQueue);
    });

    it('addToQueue delegates to queueService', async () => {
        mockReq.body = { change: { target_id: 'u1' } };
        // Service returns the new queue array
        mockedQueueService.addToQueue.mockResolvedValue([{}, {}]); 
        
        await QueueController.addToQueue(mockReq, mockRes as Response, nextSpy);

        expect(queueService.addToQueue).toHaveBeenCalledWith('root/data', expect.anything());
        // Controller returns { success: true, queueLength: 2 }
        expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({ success: true, queueLength: 2 }));
    });

    it('addToQueue returns 400 if change missing', async () => {
        mockReq.body = {};
        await QueueController.addToQueue(mockReq, mockRes as Response, nextSpy);
        expect(nextSpy).toHaveBeenCalledWith(expect.objectContaining({ 
            message: "Change object required",
            code: "BAD_REQUEST" 
        }));
        expect(statusSpy).not.toHaveBeenCalled();
    });

    it('updateQueueItem delegates to queueService', async () => {
        mockReq.body = { index: 0, change: {} };
        mockedQueueService.updateQueueItem.mockResolvedValue({ success: true } as any);

        await QueueController.updateQueueItem(mockReq, mockRes as Response, nextSpy);
        expect(queueService.updateQueueItem).toHaveBeenCalledWith('root/data', 0, {});
        expect(jsonSpy).toHaveBeenCalledWith({ success: true });
    });

    it('updateQueueItem handles not found error', async () => {
        mockReq.body = { index: 99, change: {} };
        mockedQueueService.updateQueueItem.mockRejectedValue(new Error("Queue item not found"));

        await QueueController.updateQueueItem(mockReq, mockRes as Response, nextSpy);
        expect(nextSpy).toHaveBeenCalledWith(expect.objectContaining({ message: "Queue item not found" }));
    });

    it('bulkRemoveFromQueue delegates to queueService and handles success', async () => {
        mockReq.body = { indices: [0, 1] };
        // Service returns the new queue array
        mockedQueueService.bulkRemoveFromQueue.mockResolvedValue([{}, {}, {}]); 
        
        await QueueController.bulkRemoveFromQueue(mockReq, mockRes as Response, nextSpy);

        expect(queueService.bulkRemoveFromQueue).toHaveBeenCalledWith('root/data', [0, 1]);
        // Controller returns { success: true, queueLength: 3 }
        expect(jsonSpy).toHaveBeenCalledWith({ success: true, queueLength: 3 });
    });

    it('bulkRemoveFromQueue returns 400 for invalid input', async () => {
        mockReq.body = { indices: [] }; // Empty
        await QueueController.bulkRemoveFromQueue(mockReq, mockRes as Response, nextSpy);
        expect(nextSpy).toHaveBeenCalledWith(expect.objectContaining({ 
            message: "Non-empty indices array required",
            code: "BAD_REQUEST" 
        }));

        mockReq.body = {}; // Missing
        await QueueController.bulkRemoveFromQueue(mockReq, mockRes as Response, nextSpy);
        expect(nextSpy).toHaveBeenCalledWith(expect.objectContaining({ 
            message: "Non-empty indices array required",
            code: "BAD_REQUEST" 
        }));
    });
});
