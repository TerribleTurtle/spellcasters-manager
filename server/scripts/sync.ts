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

const LOCAL_STATE_ITEMS = ['queue.json', 'patches.json', 'audit.jsonl', 'backups', 'queue_backups'];

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

const cleanQueue = process.argv.includes('--clean');

// Cache local state if we are doing a regular sync
const localStateCache = new Map<string, string | null>(); // key -> content, null means directory exists

if (!cleanQueue && fs.existsSync(TARGET_DIR)) {
    console.log(`[Sync] Preserving local state items: ${LOCAL_STATE_ITEMS.join(', ')}`);
    for (const item of LOCAL_STATE_ITEMS) {
        const itemPath = path.join(TARGET_DIR, item);
        if (fs.existsSync(itemPath)) {
            const stat = fs.statSync(itemPath);
            if (stat.isDirectory()) {
                // If it's a directory like 'backups' or 'queue_backups', we will rename it to a temp path
                const tempPath = path.join(BACKUP_ROOT, `_temp_cache_${item}_${Date.now()}`);
                if (!fs.existsSync(BACKUP_ROOT)) fs.mkdirSync(BACKUP_ROOT, { recursive: true });
                fs.renameSync(itemPath, tempPath);
                localStateCache.set(item, tempPath); // Store the temp path
            } else {
                localStateCache.set(item, fs.readFileSync(itemPath, 'utf-8'));
            }
        }
    }
} else if (cleanQueue) {
    console.log(`[Sync] 🧹 Wiping queue, patches, and temp backups due to --clean flag`);
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
function copyRecursive(src: string, dest: string, ignoreItems: string[] = []) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.name === '.git' || entry.name === 'node_modules' || ignoreItems.includes(entry.name)) continue;

        if (entry.isDirectory()) {
            copyRecursive(srcPath, destPath, ignoreItems);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Copy source
try {
    console.log(`[Sync] Copying data...`);
    copyRecursive(SOURCE_DIR, TARGET_DIR, LOCAL_STATE_ITEMS);
    
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
    
    // Restore Local State Items or Initialize
    if (!cleanQueue) {
        for (const [item, dataOrTempPath] of localStateCache.entries()) {
            const restorePath = path.join(TARGET_DIR, item);
            if (item === 'backups' || item === 'queue_backups') {
                if (dataOrTempPath && fs.existsSync(dataOrTempPath)) {
                    fs.renameSync(dataOrTempPath, restorePath);
                }
            } else if (typeof dataOrTempPath === 'string') {
                fs.writeFileSync(restorePath, dataOrTempPath);
            }
        }
    }
    
    // Ensure queue.json and patches.json exist
    const queueFile = path.join(TARGET_DIR, 'queue.json');
    const patchesFile = path.join(TARGET_DIR, 'patches.json');
    if (!fs.existsSync(queueFile)) fs.writeFileSync(queueFile, '[]');
    if (!fs.existsSync(patchesFile)) fs.writeFileSync(patchesFile, '[]');

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
