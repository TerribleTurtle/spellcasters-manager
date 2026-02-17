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

// Config (Mirroring index.ts default, but checking for mock_data preference)
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const DEV_DATA_DIR = process.env.DEV_DATA_DIR || path.resolve(PROJECT_ROOT, 'mock_data');
const SOURCE_DIR = process.env.LIVE_DATA_DIR || path.resolve(PROJECT_ROOT, '../spellcasters-community-api/data');
const BACKUP_ROOT = path.resolve(PROJECT_ROOT, 'root/backups');
const MAX_RESET_BACKUPS = 3;

console.log(`[Sync] Copying data...`);
console.log(`[Source] LIVE: ${SOURCE_DIR}`);
console.log(`[Target] DEV:  ${DEV_DATA_DIR}`);

// ── SAFETY: Never write to LIVE_DATA_DIR ──
const resolvedLive = path.resolve(SOURCE_DIR);
const resolvedDev = path.resolve(DEV_DATA_DIR);
if (resolvedDev === resolvedLive || resolvedDev.startsWith(resolvedLive + path.sep)) {
    console.error(`[ABORT] DEV_DATA_DIR resolves inside LIVE_DATA_DIR. Refusing to modify live data.`);
    process.exit(1);
}

if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`[Error] Source directory not found: ${SOURCE_DIR}`);
    process.exit(1);
}

// Preserve existing queue unless --clean flag is used
const queueFile = path.join(DEV_DATA_DIR, 'queue.json');
let queueData = '[]';
const cleanQueue = process.argv.includes('--clean');

if (fs.existsSync(queueFile) && !cleanQueue) {
    queueData = fs.readFileSync(queueFile, 'utf-8');
    console.log(`[Sync] Preserving queue.json (${JSON.parse(queueData).length} items)`);
} else if (cleanQueue) {
    console.log(`[Sync] 🧹 Wiping queue.json due to --clean flag`);
}

// ── BACKUP: Snapshot dev data before wiping ──
if (fs.existsSync(DEV_DATA_DIR)) {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(BACKUP_ROOT, `dev_reset_${timestamp}`);
        console.log(`[Sync] 📦 Backing up dev data to ${backupDir}...`);
        copyRecursive(DEV_DATA_DIR, backupDir);

        // Prune old reset backups (keep latest N)
        const allBackups = fs.readdirSync(BACKUP_ROOT)
            .filter(d => d.startsWith('dev_reset_'))
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
if (fs.existsSync(DEV_DATA_DIR)) {
    console.log(`[Sync] Cleaning target directory...`);
    fs.rmSync(DEV_DATA_DIR, { recursive: true, force: true });
}
// Recreate
fs.mkdirSync(DEV_DATA_DIR, { recursive: true });

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
    copyRecursive(SOURCE_DIR, DEV_DATA_DIR);
    
    // Copy Assets
    const SOURCE_ASSETS_DIR = path.resolve(SOURCE_DIR, '../assets');
    const DEV_ASSETS_DIR = path.join(DEV_DATA_DIR, 'assets');
    
    if (fs.existsSync(SOURCE_ASSETS_DIR)) {
        console.log(`[Sync] Copying assets...`);
        console.log(`[Source] ASSETS: ${SOURCE_ASSETS_DIR}`);
        console.log(`[Target] ASSETS: ${DEV_ASSETS_DIR}`);
        copyRecursive(SOURCE_ASSETS_DIR, DEV_ASSETS_DIR);
    } else {
        console.warn(`[Sync] ⚠️ Source assets dir not found at ${SOURCE_ASSETS_DIR}`);
    }
    
    // Restore Queue
    fs.writeFileSync(queueFile, queueData);

    // ── GIT: Reset working tree for mock_data ──
    try {
        // Compute the git-relative path for mock_data
        const relDevDir = path.relative(PROJECT_ROOT, DEV_DATA_DIR).replace(/\\/g, '/');
        console.log(`[Sync] 🔄 Resetting git state for ${relDevDir}...`);
        execSync(`git checkout -- ${relDevDir}`, { cwd: PROJECT_ROOT, stdio: 'pipe' });
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
