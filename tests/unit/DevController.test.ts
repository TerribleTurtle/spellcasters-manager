import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';

// Mock dependencies before importing the module
const mockExecFile = vi.fn();
vi.mock('child_process', () => ({
    execFile: (...args: unknown[]) => mockExecFile(...args)
}));

vi.mock('fs', async () => {
    const actual = await vi.importActual<typeof import('fs')>('fs');
    return {
        ...actual,
        default: {
            ...actual,
            existsSync: vi.fn().mockReturnValue(true),
            readFileSync: vi.fn().mockReturnValue('DATA_DIR=old/path'),
            writeFileSync: vi.fn(),
            utimesSync: vi.fn()
        }
    };
});

vi.mock('../utils/logger.js', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

import fs from 'fs';
import { getConfig, switchPath, syncData } from '../../server/controllers/devController';

describe('DevController', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let nextSpy: NextFunction;
    let jsonSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        jsonSpy = vi.fn();
        mockRes = { json: jsonSpy, locals: {} };
        nextSpy = vi.fn();
        mockReq = {
            context: { mode: 'dev', dataDir: 'root/data' },
            body: {},
            query: {}
        } as unknown as Partial<Request>;
    });

    describe('getConfig', () => {
        it('returns config with label mock when dataDir is not live', () => {
            (mockReq as Request).context = { mode: 'dev', dataDir: 'root/data' } as Request['context'];

            getConfig(mockReq as Request, mockRes as Response);

            expect(jsonSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    label: 'mock'
                })
            );
        });
    });

    describe('switchPath', () => {
        it('rejects invalid target values', async () => {
            mockReq.body = { target: 'invalid' };

            await switchPath(mockReq as Request, mockRes as Response, nextSpy);

            expect(nextSpy).toHaveBeenCalledWith(
                expect.objectContaining({ statusCode: 400 })
            );
        });

        it('rejects if target directory does not exist', async () => {
            mockReq.body = { target: 'mock' };
            (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

            await switchPath(mockReq as Request, mockRes as Response, nextSpy);

            expect(nextSpy).toHaveBeenCalledWith(
                expect.objectContaining({ statusCode: 400 })
            );
        });

        it('switches to mock path and rewrites .env', async () => {
            mockReq.body = { target: 'mock' };
            (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);

            await switchPath(mockReq as Request, mockRes as Response, nextSpy);

            expect(fs.writeFileSync).toHaveBeenCalled();
            expect(jsonSpy).toHaveBeenCalledWith(
                expect.objectContaining({ ok: true, label: 'mock' })
            );
        });
    });

    describe('syncData', () => {
        it('calls execFile with correct tsx path', async () => {
            mockReq.query = {};
            mockExecFile.mockImplementation(
                (_cmd: string, _args: string[], _opts: object, cb: (err: Error | null, stdout: string, stderr: string) => void) => {
                    cb(null, 'done', '');
                }
            );

            await syncData(mockReq as Request, mockRes as Response, nextSpy);

            expect(mockExecFile).toHaveBeenCalled();
            const callArgs = mockExecFile.mock.calls[0];
            // Verify tsx binary path contains node_modules/.bin
            expect(callArgs[0]).toContain('node_modules');
            expect(callArgs[0]).toContain('.bin');
            // On Windows, should use tsx.cmd
            if (process.platform === 'win32') {
                expect(callArgs[0]).toContain('tsx.cmd');
            }
            expect(jsonSpy).toHaveBeenCalledWith({ ok: true, clean: false });
        });

        it('passes --clean flag when query param is set', async () => {
            mockReq.query = { clean: 'true' };
            mockExecFile.mockImplementation(
                (_cmd: string, _args: string[], _opts: object, cb: (err: Error | null, stdout: string, stderr: string) => void) => {
                    cb(null, 'done', '');
                }
            );

            await syncData(mockReq as Request, mockRes as Response, nextSpy);

            const scriptArgs = mockExecFile.mock.calls[0][1] as string[];
            expect(scriptArgs).toContain('--clean');
            expect(jsonSpy).toHaveBeenCalledWith({ ok: true, clean: true });
        });

        it('calls next with error when sync fails', async () => {
            mockReq.query = {};
            mockExecFile.mockImplementation(
                (_cmd: string, _args: string[], _opts: object, cb: (err: Error | null, stdout: string, stderr: string) => void) => {
                    cb(new Error('spawn ENOENT'), '', 'error output');
                }
            );

            await syncData(mockReq as Request, mockRes as Response, nextSpy);

            expect(nextSpy).toHaveBeenCalledWith(
                expect.objectContaining({ statusCode: 500 })
            );
        });
    });
});
