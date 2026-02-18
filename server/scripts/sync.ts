import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

// Load .env
dotenv.config();

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config
// TARGET_DIR = where we write the copy (defaults to DATA_DIR from .env, then mock_data)
// SOURCE_DIR = where we read from (defaults to the live API repo)
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const TARGET_DIR = process.env.DATA_DIR || path.resolve(PROJECT_ROOT, 'mock_data');
const SOURCE_DIR = process.env.SYNC_SOURCE || path.resolve(PROJECT_ROOT, '../spellcasters-community-api/data');
const BACKUP_ROOT = path.resolve(PROJECT_ROOT, 'root/backups');
const MAX_RESET_BACKUPS = 3;

console.log(`[Sync] Copying data...`);
console.log(`[Source] ${SOURCE_DIR}`);
console.log(`[Target] ${TARGET_DIR}`);

// ── SAFETY: Never write into the source directory ──
const resolvedSource = path.resolve(SOURCE_DIR);
const resolvedTarget = path.resolve(TARGET_DIR);
if (resolvedTarget === resolvedSource || resolvedTarget.startsWith(resolvedSource + path.sep)) {
    console.error(`[ABORT] DATA_DIR resolves inside SYNC_SOURCE. Refusing to overwrite source data.`);
    process.exit(1);
}

if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`[Error] Source directory not found: ${SOURCE_DIR}`);
    process.exit(1);
}

// Preserve existing queue unless --clean flag is used
const queueFile = path.join(TARGET_DIR, 'queue.json');
let queueData = '[]';
const cleanQueue = process.argv.includes('--clean');

if (fs.existsSync(queueFile) && !cleanQueue) {
    queueData = fs.readFileSync(queueFile, 'utf-8');
    console.log(`[Sync] Preserving queue.json (${JSON.parse(queueData).length} items)`);
} else if (cleanQueue) {
    console.log(`[Sync] 🧹 Wiping queue.json due to --clean flag`);
}

// ── BACKUP: Snapshot dev data before wiping ──
if (fs.existsSync(TARGET_DIR)) {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(BACKUP_ROOT, `sync_backup_${timestamp}`);
        console.log(`[Sync] 📦 Backing up target data to ${backupDir}...`);
        copyRecursive(TARGET_DIR, backupDir);

        // Prune old reset backups (keep latest N)
        const allBackups = fs.readdirSync(BACKUP_ROOT)
            .filter(d => d.startsWith('sync_backup_'))
            .sort();
        while (allBackups.length > MAX_RESET_BACKUPS) {
            const old = allBackups.shift()!;
            const oldPath = path.join(BACKUP_ROOT, old);
            console.log(`[Sync] 🗑️  Pruning old backup: ${old}`);
            fs.rmSync(oldPath, { recursive: true, force: true });
        }
    } catch (e) {
        console.warn(`[Sync] ⚠️ Backup failed (continuing anyway):`, e);
    }
}

// Clean Target (Delete all, we want to mirror Live)
if (fs.existsSync(TARGET_DIR)) {
    console.log(`[Sync] Cleaning target directory...`);
    fs.rmSync(TARGET_DIR, { recursive: true, force: true });
}
// Recreate
fs.mkdirSync(TARGET_DIR, { recursive: true });

// Copy Recursive
function copyRecursive(src: string, dest: string) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.name === '.git' || entry.name === 'node_modules') continue;

        if (entry.isDirectory()) {
            copyRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Copy source
try {
    console.log(`[Sync] Copying data...`);
    copyRecursive(SOURCE_DIR, TARGET_DIR);
    
    // Copy Assets
    const SOURCE_ASSETS_DIR = path.resolve(SOURCE_DIR, '../assets');
    const TARGET_ASSETS_DIR = path.resolve(TARGET_DIR, '../assets');
    
    if (fs.existsSync(SOURCE_ASSETS_DIR)) {
        console.log(`[Sync] Copying assets...`);
        console.log(`[Source] ASSETS: ${SOURCE_ASSETS_DIR}`);
        console.log(`[Target] ASSETS: ${TARGET_ASSETS_DIR}`);
        copyRecursive(SOURCE_ASSETS_DIR, TARGET_ASSETS_DIR);
    } else {
        console.warn(`[Sync] ⚠️ Source assets dir not found at ${SOURCE_ASSETS_DIR}`);
    }

    // Copy Schemas
    const SOURCE_SCHEMAS_DIR = path.resolve(SOURCE_DIR, '../schemas');
    const TARGET_SCHEMAS_DIR = path.resolve(PROJECT_ROOT, 'schemas');

    if (fs.existsSync(SOURCE_SCHEMAS_DIR)) {
        console.log(`[Sync] Copying schemas...`);
        console.log(`[Source] SCHEMAS: ${SOURCE_SCHEMAS_DIR}`);
        console.log(`[Target] SCHEMAS: ${TARGET_SCHEMAS_DIR}`);
        // Schemas are critical, so we might want to ensure clean copy if valid
        copyRecursive(SOURCE_SCHEMAS_DIR, TARGET_SCHEMAS_DIR);
    } else {
        console.warn(`[Sync] ⚠️ Source schemas dir not found at ${SOURCE_SCHEMAS_DIR}`);
    }
    
    // Restore Queue
    fs.writeFileSync(queueFile, queueData);

    // ── GIT: Reset working tree for mock_data ──
    try {
        // Compute the git-relative path for mock_data
        const relTargetDir = path.relative(PROJECT_ROOT, TARGET_DIR).replace(/\\/g, '/');
        console.log(`[Sync] 🔄 Resetting git state for ${relTargetDir}...`);
        execSync(`git checkout -- ${relTargetDir}`, { cwd: PROJECT_ROOT, stdio: 'pipe' });
        console.log(`[Sync] Git state clean.`);
    } catch (gitErr) {
        // Non-fatal: the data is already synced, git state is just cosmetic
        console.warn(`[Sync] ⚠️ Git checkout failed (non-fatal):`, (gitErr as Error).message);
    }
    
    console.log(`[Sync] Complete! ✅`);
} catch (err) {
    console.error(`[Sync] Failed! ❌`, err);
    process.exit(1);
}
