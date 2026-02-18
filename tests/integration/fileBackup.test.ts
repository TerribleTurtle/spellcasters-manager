import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

import { dataService } from '../../server/services/dataService';

vi.mock('../../src/config/entityRegistry', () => ({
    getSchemaForCategory: vi.fn(),
    getRegisteredCategories: vi.fn().mockReturnValue(['units'])
}));

describe('Single File Backup Integration', () => {
    const testDir = path.join(__dirname, 'test-data-backup');
    
    beforeEach(() => {
        // Clean start
        if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
        
        // We do NOT create testDir here because saveData creates necessary subdirectories.
        // But we might need testDir itself? No, saveData handles recursive creation.
        // Wait, for step 1 we might want a clean slate.
    });

    afterEach(() => {
        // Cleanup
        if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
    });

    it('creates a backup when saving data', async () => {
        // Use fake timers to control Date.now()
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
        
        // 1. Initial Save (no backup as file doesn't exist yet)
        await dataService.saveData(testDir, 'units', 'test_unit.json', { name: 'v1' });
        
        const backupRoot = path.join(testDir, 'backups', 'file_history', 'units');
        
        // Should not exist yet, or be empty
        // backupFile returns null if file doesn't exist.
        // So no backup created.
        if (fs.existsSync(backupRoot)) {
             expect(fs.readdirSync(backupRoot).length).toBe(0);
        }

        // 2. Second Save (should create backup of v1)
        vi.advanceTimersByTime(1000); // Advance 1 second to ensure unique timestamp
        await dataService.saveData(testDir, 'units', 'test_unit.json', { name: 'v2' });
        
        // Should have 1 backup
        expect(fs.existsSync(backupRoot)).toBe(true);
        const backups = fs.readdirSync(backupRoot);
        expect(backups.length).toBe(1);
        expect(backups[0]).toContain('test_unit.json');
        
        // Verify backup content is v1
        const backupPath = path.join(backupRoot, backups[0]);
        const backupContent = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
        expect(backupContent.name).toBe('v1');
        
        // Verify current file is v2
        const currentFile = path.join(testDir, 'units', 'test_unit.json');
        const currentContent = JSON.parse(fs.readFileSync(currentFile, 'utf-8'));
        expect(currentContent.name).toBe('v2');
        
        vi.useRealTimers();
    });

    it('rotates backups correctly (max 5)', async () => {
        // Use fake timers to control Date.now()
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
        
        // Setup initial file (v0)
        await dataService.saveData(testDir, 'units', 'rotate.json', { v: 0 });
        
        // Save 6 times (producing v1..v6).
        // Each save(v_i) backs up v_{i-1}.
        // So we get backups for v0, v1, v2, v3, v4, v5.
        // Total 6 backups.
        // Max 5 allowed. Simplest rotation keeps newest 5. So v0 should be deleted.
        
        for (let i = 1; i <= 6; i++) {
            vi.advanceTimersByTime(1000); // Advance 1 second for unique timestamp
            // Small real delay to avoid EPERM from rapid atomic renames on Windows
            await vi.waitFor(async () => {
                await dataService.saveData(testDir, 'units', 'rotate.json', { v: i });
            }, { timeout: 5000 });
        }

        const backupRoot = path.join(testDir, 'backups', 'file_history', 'units');
        const backups = fs.readdirSync(backupRoot);
        
        expect(backups.length).toBe(5);
        
        const sorted = backups.sort();
        
        // Oldest backup should be v1
        const first = JSON.parse(fs.readFileSync(path.join(backupRoot, sorted[0]), 'utf-8'));
        expect(first.v).toBe(1);
        
        // Newest backup should be v5
        const last = JSON.parse(fs.readFileSync(path.join(backupRoot, sorted[4]), 'utf-8'));
        expect(last.v).toBe(5);
        
        vi.useRealTimers();
    });
});
