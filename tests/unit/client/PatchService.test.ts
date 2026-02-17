import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PatchService } from '../../../src/services/PatchService';

// vi.hoisted ensures this runs before vi.mock's factory
const { requestMock } = vi.hoisted(() => ({
    requestMock: vi.fn()
}));

vi.mock('@/lib/httpClient', () => ({
    httpClient: { request: requestMock },
    HttpClient: class {},
    HttpError: class extends Error {}
}));

describe('Client PatchService', () => {
    let service: PatchService;
    const mode = 'dev';

    beforeEach(() => {
        vi.clearAllMocks();
        service = new PatchService();
    });

    it('getQueue calls correct endpoint', async () => {
        const mockQueue = [{ target_id: '1' }];
        requestMock.mockResolvedValue(mockQueue);

        const result = await service.getQueue(mode);

        expect(requestMock).toHaveBeenCalledWith(`/api/patches/queue?mode=${mode}`);
        expect(result).toEqual(mockQueue);
    });

    it('addToQueue sends POST request', async () => {
        const change = { target_id: '1', field: 'name', new: 'B' };
        requestMock.mockResolvedValue({ success: true });

        await service.addToQueue(mode, change as any);

        expect(requestMock).toHaveBeenCalledWith(
            `/api/patches/queue?mode=${mode}`,
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ change })
            })
        );
    });

    it('commit sends POST request with payload', async () => {
        const payload = { title: 'T', version: '1.0', type: 'fix', tags: [] };
        requestMock.mockResolvedValue({ success: true });

        await service.commit(mode, payload);

        expect(requestMock).toHaveBeenCalledWith(
            `/api/patches/commit?mode=${mode}`,
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify(payload)
            })
        );
    });

    it('getHistory constructs query parameters', async () => {
        requestMock.mockResolvedValue([]);

        await service.getHistory(mode, { tag: 'buff', from: '2023-01-01' });

        const expectedUrl = `/api/patches/history?mode=${mode}&tag=buff&from=2023-01-01`;
        expect(requestMock).toHaveBeenCalledWith(expectedUrl);
    });
});
