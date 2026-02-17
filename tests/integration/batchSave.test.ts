
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { saveBatch } from '../../server/controllers/dataController';
import { fileService } from '../../server/services/fileService';

vi.mock('../../server/services/fileService');

const app: Express = express();
app.use(express.json());
app.use((req, res, next) => {
    (req as any).context = { dataDir: 'root/data', mode: 'dev' };
    next();
});
app.post('/api/data/:category/batch', saveBatch);

describe('Integration: Batch Save', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should save multiple valid items', async () => {
        const payload = [
            { filename: 'u1.json', data: { id: 'u1', name: 'Valid1' } },
            { filename: 'u2.json', data: { id: 'u2', name: 'Valid2' } }
        ];

        const res = await request(app)
            .post('/api/data/test-cat/batch') // Use test-cat to skip schema validation
            .send(payload);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.results).toHaveLength(2);
        
        expect(fileService.writeJson).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failure', async () => {
        // Mock writeJson to fail for specific file
        (fileService.writeJson as any).mockImplementation((path: string) => {
            if (path.includes('bad.json')) throw new Error('write error');
        });

        const payload = [
            { filename: 'good.json', data: { name: 'Good' } },
            { filename: 'bad.json', data: { name: 'Bad' } }
        ];

        const res = await request(app)
            .post('/api/data/test-cat/batch')
            .send(payload);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        const results = res.body.results;
        
        expect(results.find((r: any) => r.filename === 'good.json').success).toBe(true);
        expect(results.find((r: any) => r.filename === 'bad.json').success).toBe(false);
        expect(results.find((r: any) => r.filename === 'bad.json').error).toBe('write error');
    });
});
