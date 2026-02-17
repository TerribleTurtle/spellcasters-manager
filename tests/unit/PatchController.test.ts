import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as PatchController from '../../server/controllers/patchController';
import { patchService } from '../../server/services/patchService';
import { Response } from 'express';
import { createMockRequest, MockRequest } from '../helpers/mockRequest';

// Mock PatchService
vi.mock('../../server/services/patchService');
vi.mock('../../server/services/backupService');
const mockedPatchService = vi.mocked(patchService);

describe('PatchController', () => {
    let mockReq: MockRequest;
    let mockRes: Partial<Response>;
    let jsonSpy: any;
    let statusSpy: any;

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

    it('commitPatch delegates to patchService', async () => {
        const mockPatch = { id: 'p1' };
        mockReq.body = { title: 'T', version: '1.0', type: 'balance', tags: [] };
        // Service returns the patch object directly
        mockedPatchService.commitPatch.mockResolvedValue(mockPatch as any);

        await PatchController.commitPatch(mockReq, mockRes as Response);

        expect(patchService.commitPatch).toHaveBeenCalled();
        // Controller returns { success: true, patch: ... }
        expect(jsonSpy).toHaveBeenCalledWith({ success: true, patch: mockPatch });
    });

    it('commitPatch handles service error', async () => {
        mockReq.body = { title: 'T', version: '1.0', type: 'balance', tags: [] };
        mockedPatchService.commitPatch.mockRejectedValue(new Error("No queued changes to commit"));

        await PatchController.commitPatch(mockReq, mockRes as Response);
        expect(statusSpy).toHaveBeenCalledWith(400);
        expect(jsonSpy).toHaveBeenCalledWith({ error: "No queued changes to commit" });
    });

    it('commitPatch returns 500 if backup fails', async () => {
        mockReq.body = { title: 'T', version: '1.0', type: 'balance', tags: [] };
        const { backupService } = await import('../../server/services/backupService');
        vi.mocked(backupService.createBackup).mockImplementation(() => { throw new Error('disk full'); });

        await PatchController.commitPatch(mockReq, mockRes as Response);
        expect(statusSpy).toHaveBeenCalledWith(500);
        expect(jsonSpy).toHaveBeenCalledWith({ error: 'Backup failed. Commit aborted.' });
    });

    it('rollbackPatch delegates to patchService', async () => {
        const mockPatch = { id: 'p1' };
        mockReq.params = { id: 'p1' };
        mockedPatchService.rollbackPatch.mockResolvedValue(mockPatch as any);

        await PatchController.rollbackPatch(mockReq, mockRes as Response);

        expect(patchService.rollbackPatch).toHaveBeenCalledWith('root/data', 'p1');
        // Controller returns { success: true, patch: ... }
        expect(jsonSpy).toHaveBeenCalledWith({ success: true, patch: mockPatch });
    });

    it('getPatchHistory delegates to patchService and handles query params', async () => {
        const mockPatches = [{ id: 'p1' }];
        mockReq.query = { tag: 'buff', limit: '10' };
        mockedPatchService.getPatchHistory.mockResolvedValue(mockPatches as any);

        await PatchController.getPatchHistory(mockReq, mockRes as Response);

        expect(patchService.getPatchHistory).toHaveBeenCalledWith('root/data', 'buff', undefined, undefined);
        expect(jsonSpy).toHaveBeenCalledWith(mockPatches);
    });
});
