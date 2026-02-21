import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dataService } from '../../server/services/dataService';
import { createTempEnv, TempEnv } from '../helpers/tempEnv';
import fs from 'fs';
import path from 'path';

// We do want to mute backups and queue so we only test the core I/O behaviors of dataService
vi.mock('../../server/services/backupService', () => ({
    backupService: {
        backupFile: vi.fn().mockResolvedValue('backup'),
        createBackup: vi.fn().mockResolvedValue('backup_path')
    }
}));

vi.mock('../../server/services/queueService', () => ({
    queueService: {
        enqueueEntityChange: vi.fn().mockResolvedValue(undefined)
    }
}));

describe('Integration: ServerDataService', () => {
    let env: TempEnv;

    beforeEach(async () => {
        vi.clearAllMocks();
        env = await createTempEnv();
    });

    afterEach(async () => {
        if (env) await env.cleanup();
    });

    it('saveData creates a new file if it does not exist', async () => {
        const payload = { id: 'h1', name: 'Paladin', tier: 'epic' };

        await dataService.saveData(env.dataDir, 'heroes', 'paladin.json', payload);

        const filePath = path.join(env.dataDir, 'heroes', 'paladin.json');
        expect(fs.existsSync(filePath)).toBe(true);

        const saved = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        expect(saved).toEqual(expect.objectContaining(payload));
    });

    it('saveData preserves existing fields not in the payload (shape preservation)', async () => {
        const existingData = {
            id: 'h2',
            name: 'Mage',
            tier: 'rare',
            legacy_metadata: { source: 'kickstarter_promo' }
        };
        await env.seedFile('heroes', 'mage.json', existingData);

        // Edit just the name
        const payload = {
            id: 'h2',
            name: 'Archmage',
            tier: 'rare'
            // legacy_metadata is omitted here by the frontend
        };

        await dataService.saveData(env.dataDir, 'heroes', 'mage.json', payload);

        const filePath = path.join(env.dataDir, 'heroes', 'mage.json');
        const saved = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        // It should update name but preserve the legacy_metadata
        expect(saved.name).toBe('Archmage');
        expect(saved.legacy_metadata).toBeDefined();
        expect(saved.legacy_metadata.source).toBe('kickstarter_promo');
    });

    it('saveBatch updates multiple files simultaneously', async () => {
        await env.seedFile('units', 'u1.json', { id: 'u1', name: 'A' });
        await env.seedFile('units', 'u2.json', { id: 'u2', name: 'B' });

        const batch = [
            { filename: 'u1.json', data: { id: 'u1', name: 'A-Updated' } },
            { filename: 'u2.json', data: { id: 'u2', name: 'B' } }, // Clean - won't be written
            { filename: 'u3.json', data: { id: 'u3', name: 'C' } }  // New file
        ];

        await dataService.saveBatch(env.dataDir, 'units', batch);

        const u1 = JSON.parse(fs.readFileSync(path.join(env.dataDir, 'units', 'u1.json'), 'utf-8'));
        const u3 = JSON.parse(fs.readFileSync(path.join(env.dataDir, 'units', 'u3.json'), 'utf-8'));

        expect(u1.name).toBe('A-Updated');
        expect(u3.name).toBe('C');
    });
});
