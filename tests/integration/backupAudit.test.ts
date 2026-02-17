import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { backupService } from '../../server/services/backupService';
import { auditLogger } from '../../server/utils/auditLogger';

describe('Backup & Audit Integration', () => {
    const testDir = path.join(__dirname, 'test-data-safety');
    const backupRoot = path.join(__dirname, 'backups');

    beforeEach(() => {
        // Clean start
        if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
        if (fs.existsSync(backupRoot)) fs.rmSync(backupRoot, { recursive: true, force: true });
        
        fs.mkdirSync(testDir, { recursive: true });
        fs.writeFileSync(path.join(testDir, 'test.json'), JSON.stringify({ foo: 'bar' }));
    });

    afterEach(() => {
        // Cleanup
        if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
        if (fs.existsSync(backupRoot)) fs.rmSync(backupRoot, { recursive: true, force: true });
    });

    it('BackupService creates a full backup', async () => {
        const backupPath = await backupService.createBackup(testDir);
        
        // Verify backup folder exists
        expect(fs.existsSync(backupPath)).toBe(true);
        expect(path.basename(backupPath)).toContain('full_backup_');
        
        // Verify content copied
        const backupFile = path.join(backupPath, 'test.json');
        expect(fs.existsSync(backupFile)).toBe(true);
        
        const content = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
        expect(content.foo).toBe('bar');
    });

    it('AuditLogger appends to audit.jsonl', async () => {
        const logFile = path.join(testDir, 'audit.jsonl');
        
        await auditLogger.logAction(testDir, 'TEST_ACTION', { id: 123 }, 'TestUser');
        
        expect(fs.existsSync(logFile)).toBe(true);
        
        const content = fs.readFileSync(logFile, 'utf-8');
        const entry = JSON.parse(content.trim());
        
        expect(entry.action).toBe('TEST_ACTION');
        expect(entry.user).toBe('TestUser');
        expect(entry.details).toEqual({ id: 123 });
        expect(entry.timestamp).toBeDefined();

        // Append second log
        await auditLogger.logAction(testDir, 'SECOND_ACTION', {}, 'TestUser');
        const lines = fs.readFileSync(logFile, 'utf-8').trim().split('\n');
        expect(lines.length).toBe(2);
    });
});
