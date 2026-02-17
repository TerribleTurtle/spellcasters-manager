import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';

const PROJECT_ROOT = path.resolve(process.cwd());
const ENV_PATH = path.join(PROJECT_ROOT, '.env');

// Known paths
const LIVE_PATH = process.env.SYNC_SOURCE || path.resolve(PROJECT_ROOT, '../spellcasters-community-api/data');
const MOCK_PATH = path.resolve(PROJECT_ROOT, 'mock_data');

/**
 * GET /api/dev/config
 * Returns the current DATA_DIR and whether it points at the live repo.
 */
export const getConfig = (req: Request, res: Response) => {
    const { dataDir } = req.context;
    const resolvedDir = path.resolve(dataDir);
    const resolvedLive = path.resolve(LIVE_PATH);
    const isLive = resolvedDir === resolvedLive || resolvedDir.startsWith(resolvedLive + path.sep);

    res.json({
        dataDir: resolvedDir,
        label: isLive ? 'live' : 'mock',
        livePath: resolvedLive,
        mockPath: MOCK_PATH
    });
};

/**
 * POST /api/dev/switch-path
 * Body: { target: "live" | "mock" }
 * Rewrites .env DATA_DIR and touches server/index.ts to trigger tsx watch restart.
 */
export const switchPath = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { target } = req.body;
        if (target !== 'live' && target !== 'mock') {
            throw AppError.badRequest('target must be "live" or "mock"');
        }

        const newPath = target === 'live' ? LIVE_PATH : MOCK_PATH;

        // Verify target directory exists
        if (!fs.existsSync(newPath)) {
            throw AppError.badRequest(`Target directory does not exist: ${newPath}`);
        }

        // Rewrite .env
        rewriteEnvDataDir(newPath);

        logger.info(`[Dev] Switched DATA_DIR to: ${newPath} (${target})`);

        // Touch server/index.ts to trigger tsx watch restart
        triggerRestart();

        res.json({ ok: true, dataDir: newPath, label: target });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/dev/sync
 * Query: ?clean=true for wipe & copy (--clean flag)
 * Runs the sync.ts script to copy live data → mock_data.
 */
export const syncData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const clean = req.query.clean === 'true';
        const args = [path.join(PROJECT_ROOT, 'server/scripts/sync.ts')];
        if (clean) args.push('--clean');

        logger.info(`[Dev] Starting sync${clean ? ' (clean)' : ''}...`);

        // Use npx tsx to run the sync script
        // On Windows the .bin shim is a .cmd file — execFile needs the full name
        // and shell:true so the OS can interpret the batch script.
        const isWin = process.platform === 'win32';
        const tsxBin = isWin ? 'tsx.cmd' : 'tsx';
        const tsxPath = path.join(PROJECT_ROOT, 'node_modules', '.bin', tsxBin);

        await new Promise<void>((resolve, reject) => {
            execFile(tsxPath, args, { cwd: PROJECT_ROOT, timeout: 60000, shell: isWin }, (error, stdout, stderr) => {
                if (stdout) logger.info(`[Sync] ${stdout}`);
                if (stderr) logger.warn(`[Sync] ${stderr}`);
                if (error) {
                    logger.error(`[Sync] Failed:`, { error: error.message });
                    reject(AppError.internal('Sync failed: ' + error.message));
                } else {
                    logger.info(`[Sync] Complete.`);
                    resolve();
                }
            });
        });

        res.json({ ok: true, clean });
    } catch (error) {
        next(error);
    }
};

// ── Helpers ──

function rewriteEnvDataDir(newPath: string) {
    let envContent = '';
    if (fs.existsSync(ENV_PATH)) {
        envContent = fs.readFileSync(ENV_PATH, 'utf-8');
    }

    // Replace or insert DATA_DIR line
    const dataLine = `DATA_DIR=${newPath}`;
    if (/^DATA_DIR=.*/m.test(envContent)) {
        envContent = envContent.replace(/^DATA_DIR=.*/m, dataLine);
    } else {
        envContent = envContent.trimEnd() + '\n' + dataLine + '\n';
    }

    fs.writeFileSync(ENV_PATH, envContent, 'utf-8');
}

function triggerRestart() {
    // Touch server/index.ts to trigger tsx watch to restart the server
    const serverEntry = path.join(PROJECT_ROOT, 'server', 'index.ts');
    try {
        const now = new Date();
        fs.utimesSync(serverEntry, now, now);
    } catch {
        logger.warn('[Dev] Could not touch server/index.ts — manual restart may be needed.');
    }
}
