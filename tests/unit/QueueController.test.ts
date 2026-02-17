import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as QueueController from '../../server/controllers/queueController';
import { patchService } from '../../server/services/patchService';
import { Response } from 'express';
import { createMockRequest, MockRequest } from '../helpers/mockRequest';

// Mock PatchService
vi.mock('../../server/services/patchService');

describe('QueueController', () => {
    let mockReq: MockRequest;
    let mockRes: Partial<Response>;
    let jsonSpy: any;
    let statusSpy: any;

    const mockedPatchService = vi.mocked(patchService);

    beforeEach(() => {
        vi.clearAllMocks();
        jsonSpy = vi.fn();
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

    it('getQueue delegates to patchService', async () => {
        const mockQueue = [{ target_id: 'c1' }];
        mockedPatchService.getQueue.mockResolvedValue(mockQueue);
        
        await QueueController.getQueue(mockReq, mockRes as Response);

        expect(patchService.getQueue).toHaveBeenCalledWith('root/data');
        expect(jsonSpy).toHaveBeenCalledWith(mockQueue);
    });

    it('addToQueue delegates to patchService', async () => {
        mockReq.body = { change: { target_id: 'u1' } };
        // Service returns the new queue array
        mockedPatchService.addToQueue.mockResolvedValue([{}, {}]); 
        
        await QueueController.addToQueue(mockReq, mockRes as Response);

        expect(patchService.addToQueue).toHaveBeenCalledWith('root/data', expect.anything());
        // Controller returns { success: true, queueLength: 2 }
        expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({ success: true, queueLength: 2 }));
    });

    it('addToQueue returns 400 if change missing', async () => {
        mockReq.body = {};
        await QueueController.addToQueue(mockReq, mockRes as Response);
        expect(statusSpy).toHaveBeenCalledWith(400);
    });

    it('updateQueueItem delegates to patchService', async () => {
        mockReq.body = { index: 0, change: {} };
        mockedPatchService.updateQueueItem.mockResolvedValue({ success: true });

        await QueueController.updateQueueItem(mockReq, mockRes as Response);
        expect(patchService.updateQueueItem).toHaveBeenCalledWith('root/data', 0, {});
        expect(jsonSpy).toHaveBeenCalledWith({ success: true });
    });

    it('updateQueueItem handles not found error', async () => {
        mockReq.body = { index: 99, change: {} };
        mockedPatchService.updateQueueItem.mockRejectedValue(new Error("Queue item not found"));

        await QueueController.updateQueueItem(mockReq, mockRes as Response);
        expect(statusSpy).toHaveBeenCalledWith(404);
        expect(jsonSpy).toHaveBeenCalledWith({ error: "Queue item not found" });
    });

    it('bulkRemoveFromQueue delegates to patchService and handles success', async () => {
        mockReq.body = { indices: [0, 1] };
        // Service returns the new queue array
        mockedPatchService.bulkRemoveFromQueue.mockResolvedValue([{}, {}, {}]); 
        
        await QueueController.bulkRemoveFromQueue(mockReq, mockRes as Response);

        expect(patchService.bulkRemoveFromQueue).toHaveBeenCalledWith('root/data', [0, 1]);
        // Controller returns { success: true, queueLength: 3 }
        expect(jsonSpy).toHaveBeenCalledWith({ success: true, queueLength: 3 });
    });

    it('bulkRemoveFromQueue returns 400 for invalid input', async () => {
        mockReq.body = { indices: [] }; // Empty
        await QueueController.bulkRemoveFromQueue(mockReq, mockRes as Response);
        expect(statusSpy).toHaveBeenCalledWith(400);

        mockReq.body = {}; // Missing
        await QueueController.bulkRemoveFromQueue(mockReq, mockRes as Response);
        expect(statusSpy).toHaveBeenCalledWith(400);
    });
});
