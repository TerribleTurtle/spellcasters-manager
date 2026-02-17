
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validatePath } from '../../server/utils/requestHelpers';
import { Response } from 'express';
import { createMockRequest, MockRequest } from '../helpers/mockRequest';
// We need to verify calls to next with AppError
import { AppError } from '../../server/utils/AppError';
import path from 'path';

describe('Middleware: validatePath', () => {
    let mockReq: MockRequest;
    let mockRes: Partial<Response>;
    let nextSpy: any;
    let statusSpy: any;
    let sendSpy: any;
    let jsonSpy: any;

    const ROOT_DIR = '/root/data';

    beforeEach(() => {
        vi.clearAllMocks();
        jsonSpy = vi.fn();
        sendSpy = vi.fn();
        statusSpy = vi.fn().mockReturnValue({ send: sendSpy, json: jsonSpy });
        nextSpy = vi.fn();
        
        mockRes = {
            locals: {},
            status: statusSpy,
            send: sendSpy,
            json: jsonSpy
        } as unknown as Response;

        mockReq = createMockRequest({
            params: {},
            context: { dataDir: ROOT_DIR, mode: 'dev' }
        });
    });

    it('calls next() if no category or filename present', () => {
        validatePath(mockReq, mockRes as Response, nextSpy);
        expect(nextSpy).toHaveBeenCalled();
        expect(statusSpy).not.toHaveBeenCalled();
    });

    it('resolves directory when category is present', () => {
        mockReq.params = { category: 'units' };
        validatePath(mockReq, mockRes as Response, nextSpy);
        
        expect(nextSpy).toHaveBeenCalled();
        expect(mockRes.locals?.resolvedDir).toBe(path.resolve(ROOT_DIR, 'units'));
    });

    it('resolves file path when filename is present', () => {
        mockReq.params = { category: 'units', filename: 'u1.json' };
        validatePath(mockReq, mockRes as Response, nextSpy);
        
        expect(nextSpy).toHaveBeenCalled();
        expect(mockRes.locals?.resolvedDir).toBe(path.resolve(ROOT_DIR, 'units'));
        expect(mockRes.locals?.resolvedPath).toBe(path.resolve(ROOT_DIR, 'units/u1.json'));
    });

    it('blocks directory traversal in category', () => {
        mockReq.params = { category: '../secrets' };
        validatePath(mockReq, mockRes as Response, nextSpy);
        
        expect(nextSpy).toHaveBeenCalledWith(expect.any(AppError));
        expect(nextSpy.mock.calls[0][0]).toMatchObject({ statusCode: 403, message: 'Forbidden' });
        expect(statusSpy).not.toHaveBeenCalled();
    });

    it('blocks file traversal in filename', () => {
        mockReq.params = { category: 'units', filename: '../../secrets.txt' };
        validatePath(mockReq, mockRes as Response, nextSpy);
        
        expect(nextSpy).toHaveBeenCalledWith(expect.any(AppError));
        expect(nextSpy.mock.calls[0][0]).toMatchObject({ statusCode: 403, message: 'Forbidden' });
        expect(statusSpy).not.toHaveBeenCalled();
    });

    it('handles payload injection attempts in path', () => {
        mockReq.params = { category: 'units', filename: '..././.../etc/passwd' };
        validatePath(mockReq, mockRes as Response, nextSpy);
        // Should resolve to something outside or be caught
        // path.resolve('/root/data/units', '..././.../etc/passwd') -> /root/data/units/.../etc/passwd
        // Wait, '...' is valid directory name. 
        // usage of '..' is the danger.
        // If I use '..', path.resolve handles it.
        
        // Clear nextSpy for the second call in this test
        nextSpy.mockClear();

        mockReq.params = { category: 'units', filename: '..\\..\\windows\\system32' };
        validatePath(mockReq, mockRes as Response, nextSpy);
        expect(nextSpy).toHaveBeenCalledWith(expect.any(AppError));
        expect(nextSpy.mock.calls[0][0]).toMatchObject({ statusCode: 403, message: 'Forbidden' });
        expect(statusSpy).not.toHaveBeenCalled();
    });

    it('fails safely if context is missing', () => {
        mockReq.context = undefined as any;
        validatePath(mockReq, mockRes as Response, nextSpy);
        
        // Should call next(AppError)
        expect(nextSpy).toHaveBeenCalledWith(expect.any(AppError));
        expect(nextSpy.mock.calls[0][0]).toMatchObject({ statusCode: 500, message: 'Internal Server Error' });
        expect(statusSpy).not.toHaveBeenCalled();
    });
});

