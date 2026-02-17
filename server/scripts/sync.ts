import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load .env
dotenv.config();

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config (Mirroring index.ts default, but checking for mock_data preference)
const DEV_DATA_DIR = process.env.DEV_DATA_DIR || path.resolve(__dirname, '../../mock_data'); // server/../mock_data -> root/mock_data

const SOURCE_DIR = process.env.LIVE_DATA_DIR || path.resolve(__dirname, '../../../spellcasters-community-api/data');

console.log(`[Sync] Copying data...`);
console.log(`[Source] LIVE: ${SOURCE_DIR}`);
console.log(`[Target] DEV:  ${DEV_DATA_DIR}`);

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
    // Assuming LIVE_DATA_DIR points to ".../data", assets should be at ".../assets"
    // And DEV_DATA_DIR points to "mock_data", so we want "mock_data/assets"
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
    
    console.log(`[Sync] Complete! ✅`);
} catch (err) {
    console.error(`[Sync] Failed! ❌`, err);
    process.exit(1);
}
