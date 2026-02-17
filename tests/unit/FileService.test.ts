
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fileService } from '../../server/services/fileService';
import path from 'path';
import fs from 'fs';

const TEST_DIR = path.join(__dirname, 'temp_fs_test');

describe('FileService (Integration)', () => {
    beforeEach(() => {
        if (fs.existsSync(TEST_DIR)) {
            fs.rmSync(TEST_DIR, { recursive: true, force: true });
        }
        fs.mkdirSync(TEST_DIR);
    });

    afterEach(() => {
        if (fs.existsSync(TEST_DIR)) {
            fs.rmSync(TEST_DIR, { recursive: true, force: true });
        }
    });

    it('ensureDir creates directory recursively', async () => {
        const nested = path.join(TEST_DIR, 'a', 'b');
        await fileService.ensureDir(nested);
        expect(fs.existsSync(nested)).toBe(true);
    });

    it('ensureDirSync creates directory recursively', () => {
        const nested = path.join(TEST_DIR, 'c', 'd');
        fileService.ensureDirSync(nested);
        expect(fs.existsSync(nested)).toBe(true);
    });

    it('writeJson creates file and parent directories (async)', async () => {
        const filePath = path.join(TEST_DIR, 'sub', 'test.json');
        const data = { foo: 'bar' };
        
        await fileService.writeJson(filePath, data);
        
        expect(fs.existsSync(filePath)).toBe(true);
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(JSON.parse(content)).toEqual(data);
    });

    it('readJson reads existing file (async)', async () => {
        const filePath = path.join(TEST_DIR, 'read.json');
        const data = { id: 1 };
        fs.writeFileSync(filePath, JSON.stringify(data));

        const result = await fileService.readJson(filePath);
        expect(result).toEqual(data);
    });

    it('readJsonSync reads existing file (sync)', () => {
        const filePath = path.join(TEST_DIR, 'read_sync.json');
        const data = { id: 2 };
        fs.writeFileSync(filePath, JSON.stringify(data));

        const result = fileService.readJsonSync(filePath);
        expect(result).toEqual(data);
    });

    it('readJson throws if file missing', async () => {
        const filePath = path.join(TEST_DIR, 'missing.json');
        await expect(fileService.readJson(filePath)).rejects.toThrow();
    });

    it('deleteFile removes file (async)', async () => {
        const filePath = path.join(TEST_DIR, 'delete.json');
        fs.writeFileSync(filePath, '{}');
        
        await fileService.deleteFile(filePath);
        expect(fs.existsSync(filePath)).toBe(false);
    });

    it('listFiles filters by extension (async)', async () => {
        fs.writeFileSync(path.join(TEST_DIR, 'a.json'), '{}');
        fs.writeFileSync(path.join(TEST_DIR, 'b.txt'), '');
        
        const files = await fileService.listFiles(TEST_DIR, ['.json']);
        expect(files).toContain('a.json');
        expect(files).not.toContain('b.txt');
    });

    it('listFilesSync filters by extension (sync)', () => {
        fs.writeFileSync(path.join(TEST_DIR, 'c.json'), '{}');
        fs.writeFileSync(path.join(TEST_DIR, 'd.txt'), '');
        
        const files = fileService.listFilesSync(TEST_DIR, ['.json']);
        expect(files).toContain('c.json');
        expect(files).not.toContain('d.txt');
    });
});
