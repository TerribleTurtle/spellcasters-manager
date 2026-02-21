import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { createTempEnv, TempEnv } from '../helpers/tempEnv';

describe('tempEnv helper', () => {
    let env: TempEnv;

    afterEach(async () => {
        if (env) await env.cleanup();
    });

    it('creates data and assets directories with default categories', async () => {
        env = await createTempEnv();

        expect(fs.existsSync(env.dataDir)).toBe(true);
        expect(fs.existsSync(env.assetsDir)).toBe(true);

        const expectedCategories = ['units', 'heroes', 'spells', 'consumables', 'titans'];
        for (const cat of expectedCategories) {
            expect(fs.existsSync(path.join(env.dataDir, cat))).toBe(true);
        }
    });

    it('creates only requested categories', async () => {
        env = await createTempEnv(['units']);

        expect(fs.existsSync(path.join(env.dataDir, 'units'))).toBe(true);
        expect(fs.existsSync(path.join(env.dataDir, 'heroes'))).toBe(false);
    });

    it('seeds a JSON fixture into the correct path', async () => {
        env = await createTempEnv(['units']);
        const fixture = { id: 'u1', name: 'Archer', tier: 'common' };

        await env.seedFile('units', 'archer.json', fixture);

        const filePath = path.join(env.dataDir, 'units', 'archer.json');
        expect(fs.existsSync(filePath)).toBe(true);

        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        expect(content).toEqual(fixture);
    });

    it('cleanup removes the entire temp directory', async () => {
        env = await createTempEnv();
        const rootDir = path.dirname(env.dataDir);

        expect(fs.existsSync(rootDir)).toBe(true);
        await env.cleanup();
        expect(fs.existsSync(rootDir)).toBe(false);
    });
});
