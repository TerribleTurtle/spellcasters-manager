import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import dotenv from 'dotenv';
import * as DataController from './controllers/dataController.js';
import * as PatchController from './controllers/patchController.js';
import * as QueueController from './controllers/queueController.js';
import * as HealthController from './controllers/healthController.js';
import * as AssetController from './controllers/assetController.js';
import { fileService } from './services/fileService.js';
import { UnitSchema, HeroSchema, ConsumableSchema } from '../src/domain/schemas.js';
import { logger } from './utils/logger.js';
import fs from 'fs'; // Needed for multer config
import { z } from 'zod';

// Load .env
dotenv.config();

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// --- Config ---
// Prefer Env Vars, fallback to relative paths
const DEV_DATA_DIR = process.env.DEV_DATA_DIR || path.resolve(__dirname, '../../mock_data');
const LIVE_DATA_DIR = process.env.LIVE_DATA_DIR || path.resolve(__dirname, '../../spellcasters-community-api/data');
const ASSETS_DIR = path.join(DEV_DATA_DIR, 'assets'); // Default upload location

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Request Logger
app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    });
    next();
});

// Context Middleware (Dependency Injection-lite)
app.use((req: Request, res: Response, next: NextFunction) => {
    const mode = (req.query.mode === 'live' ? 'live' : 'dev');
    const dataDir = mode === 'live' ? LIVE_DATA_DIR : DEV_DATA_DIR;
    req.context = { mode, dataDir };
    next();
});

// Multer Config
// We keep basic config here to pass to route
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync(ASSETS_DIR)) {
            fs.mkdirSync(ASSETS_DIR, { recursive: true });
        }
        cb(null, ASSETS_DIR);
    },
    filename: function (req, file, cb) {
        // Warning for large files (Non-blocking)
        if (req.headers['content-length'] && parseInt(req.headers['content-length']) > 5 * 1024 * 1024) {
             logger.warn(`[Upload] Warning: File ${file.originalname} is larger than 5MB. Consider optimizing.`);
        }
        // SECURITY: Sanitize filename to prevent path traversal
        cb(null, path.basename(file.originalname));
    }
});
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB Hard Limit
});

// --- Routes ---



// Data
app.get('/api/bulk/:category', DataController.getCategoryData); // Bulk Load (new)
app.post('/api/save/:category/batch', DataController.saveBatch); // Fix: Moved above :filename
app.get('/api/list/:category', DataController.listFiles);
app.get('/api/data/:category/:filename', DataController.getData);
app.post('/api/save/:category/:filename', DataController.saveData);
app.delete('/api/data/:category/:filename', DataController.deleteData);
app.get('/api/data/export', DataController.exportData);
app.post('/api/data/import', DataController.importData);
app.post('/api/admin/reset', DataController.resetDevData);

// Patches
app.get('/api/patches/queue', QueueController.getQueue);
app.post('/api/patches/queue', QueueController.addToQueue);
app.put('/api/patches/queue', QueueController.updateQueueItem);
app.delete('/api/patches/queue/bulk', QueueController.bulkRemoveFromQueue);
app.delete('/api/patches/queue', QueueController.removeFromQueue);

app.get('/api/health', HealthController.getHealth);
app.post('/api/patches/quick-commit', PatchController.quickSave);
app.get('/api/patches/history', PatchController.getPatchHistory);
app.post('/api/patches/commit', PatchController.commitPatch);
app.post('/api/patches/:id/rollback', PatchController.rollbackPatch);

// Assets
app.get('/api/assets/list', AssetController.listAssets);
app.post('/api/assets/upload', upload.single('file'), AssetController.uploadAsset);

// Static Assets
// We serve both to allow switching. Context middleware doesn't affect static serve easily.
app.use('/api/assets/dev', express.static(DEV_DATA_DIR + '/assets'));
app.use('/api/assets/live', express.static(LIVE_DATA_DIR + '/assets'));



// --- Boot Validation ---
const validateDataOnBoot = () => {
    logger.info('[Boot] Validating data integrity...');
    const schemas: Record<string, z.ZodTypeAny> = {
        heroes: HeroSchema,
        units: UnitSchema,
        spells: ConsumableSchema,
        consumables: ConsumableSchema
    };

    let errorCount = 0;
    const categories = Object.keys(schemas);

    categories.forEach(category => {
        const dirPath = path.join(DEV_DATA_DIR, category);
        if (fileService.existsSync(dirPath)) {
            const files = fileService.listFilesSync(dirPath, ['.json']);
            files.forEach(file => {
                try {
                    const filePath = path.join(dirPath, file);
                    const data = fileService.readJsonSync(filePath);
                    const schema = schemas[category];
                    if (schema) {
                        const result = schema.safeParse(data);
                        if (!result.success) {
                            logger.warn(`[Boot] Data Warning: ${category}/${file} is invalid:`);
                        }
                    }
                } catch (e) {
                     logger.error(`[Boot] Read Error: ${category}/${file}`, { error: e });
                     errorCount++;
                }
            });
        }
    });

    if (errorCount === 0) {
        logger.info('[Boot] Data integrity check PASSED.');
    } else {
        logger.warn(`[Boot] Data integrity check COMPLETED with ${errorCount} warnings.`);
    }
};

// --- Start ---
app.listen(PORT, () => {
    logger.info(`[Server] Running on http://localhost:${PORT}`);
    validateDataOnBoot();
});

// Global Error Handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(`[Error] ${req.method} ${req.url}:`, { error: err.message, stack: err.stack });
    res.status(500).json({ error: "Internal Server Error", details: err.message });
});
