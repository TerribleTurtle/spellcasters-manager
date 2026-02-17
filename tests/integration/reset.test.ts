
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import * as DataController from '../../server/controllers/dataController';

// Mock Config
vi.mock('../../server/config', () => ({
    DEV_DATA_DIR: 'mock_dev_data',
    LIVE_DATA_DIR: 'mock_live_data'
}));

// Mock child_process
const mockExec = vi.fn((cmd, cb) => cb(null, 'mock stdout', ''));
const mockExecFile = vi.fn((file, args, cb) => cb(null, 'mock stdout', ''));

vi.mock('child_process', () => ({
    exec: mockExec,
    execFile: mockExecFile
}));

const app = express();
app.use(express.json());
// Mock Context Middleware
app.use((req, res, next) => {
    (req as any).context = { mode: 'dev' };
    next();
});
app.post('/api/admin/reset', DataController.resetDevData);

describe('POST /api/admin/reset', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
        delete process.env.NODE_ENV;
    });

    it('should trigger sync script in dev mode', async () => {
        const res = await request(app).post('/api/admin/reset');
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
        
        // Expect execFile to be called
        expect(mockExecFile).toHaveBeenCalledWith(npmCmd, ['run', 'sync-data:clean'], expect.any(Function));
    });

    it('should block reset in production', async () => {
        process.env.NODE_ENV = 'production';
        const res = await request(app).post('/api/admin/reset');
        
        expect(res.status).toBe(403);
        expect(mockExecFile).not.toHaveBeenCalled();
    });
});
