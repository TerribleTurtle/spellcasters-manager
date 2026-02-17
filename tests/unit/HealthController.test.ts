import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as HealthController from '../../server/controllers/healthController';
import { createMockRequest, MockRequest } from '../helpers/mockRequest';
import { Response } from 'express';

const { mockAccess, mockExistsSync, mockReadFileSync } = vi.hoisted(() => {
    return {
        mockAccess: vi.fn(),
        mockExistsSync: vi.fn(),
        mockReadFileSync: vi.fn(),
    };
});

vi.mock('fs', () => ({
    default: {
        promises: {
            access: mockAccess
        },
        constants: { R_OK: 4, W_OK: 2 },
        existsSync: mockExistsSync,
        readFileSync: mockReadFileSync
    }
}));

describe('HealthController', () => {
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
            context: { dataDir: 'root/data', mode: 'dev' }
        });
    });

    it('returns healthy status when dataDir is accessible', async () => {
        mockAccess.mockResolvedValue(undefined);
        mockExistsSync.mockReturnValue(true);
        mockReadFileSync.mockReturnValue(JSON.stringify({ version: '1.2.3' }));

        await HealthController.getHealth(mockReq, mockRes as Response);

        expect(mockAccess).toHaveBeenCalledWith('root/data', expect.anything());
        expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
            status: 'healthy',
            dataDirAccessible: true,
            version: '1.2.3'
        }));
    });

    it('returns unhealthy status when dataDir is inaccessible', async () => {
        mockAccess.mockRejectedValue(new Error("EACCES"));

        await HealthController.getHealth(mockReq, mockRes as Response);

        expect(statusSpy).toHaveBeenCalledWith(503);
        expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
            status: 'unhealthy',
            error: "EACCES"
        }));
    });
    
    it('handles missing package.json gracefully', async () => {
        mockAccess.mockResolvedValue(undefined);
        mockExistsSync.mockReturnValue(false); // No package.json

        await HealthController.getHealth(mockReq, mockRes as Response);

        expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
            status: 'healthy',
            version: 'unknown'
        }));
    });
});
