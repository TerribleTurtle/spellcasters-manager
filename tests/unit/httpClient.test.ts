import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpClient, HttpError } from '../../src/lib/httpClient';

describe('HttpClient', () => {
    let client: HttpClient;
    const fetchMock = vi.fn();

    const originalFetch = globalThis.fetch;

    beforeEach(() => {
        globalThis.fetch = fetchMock;
        client = new HttpClient();
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    it('request returns parsed JSON on success', async () => {
        const mockData = { id: 1, name: 'Test' };
        fetchMock.mockResolvedValue({
            ok: true,
            headers: { get: () => 'application/json' },
            json: async () => mockData,
        } as any);

        const result = await client.request('/api/test');
        expect(result).toEqual(mockData);
        expect(fetchMock).toHaveBeenCalledWith('/api/test', undefined);
    });

    it('request returns text on success if content-type is not json', async () => {
        const mockText = 'Success';
        fetchMock.mockResolvedValue({
            ok: true,
            headers: { get: () => 'text/plain' },
            text: async () => mockText,
        } as any);

        const result = await client.request('/api/text');
        expect(result).toBe(mockText);
    });

    it('request throws HttpError with JSON body on failure', async () => {
        const errorBody = { error: 'Not Found' };
        fetchMock.mockResolvedValue({
            ok: false,
            status: 404,
            statusText: 'Not Found',
            headers: { get: () => 'application/json' },
            text: async () => JSON.stringify(errorBody),
        } as any);

        await expect(client.request('/api/fail')).rejects.toThrow('Not Found');
        
        try {
            await client.request('/api/fail');
        } catch (e: any) {
            expect(e).toBeInstanceOf(HttpError);
            expect(e.status).toBe(404);
            expect(e.body).toEqual(errorBody);
        }
    });

    it('request throws HttpError with text message on failure parse error', async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            status: 500,
            statusText: 'Server Error',
            headers: { get: () => 'text/html' },
            text: async () => '<html>Error</html>',
        } as any);

        await expect(client.request('/api/fail')).rejects.toThrow('<html>Error</html>');
    });

    it('request throws network error directly', async () => {
        fetchMock.mockRejectedValue(new Error('Network Error'));
        await expect(client.request('/api/net')).rejects.toThrow('Network Error');
    });
});
