import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import os from 'os';
import { fileService } from './services/fileService.js';
import { getSchemaForCategory, getRegisteredCategories } from '../src/config/entityRegistry.js';
import { logger } from './utils/logger.js';
import { registerMiddleware, registerErrorHandler } from './middleware.js';
import { registerRoutes } from './routes.js';

// Load .env
dotenv.config();

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// --- Config ---
// Single DATA_DIR — change the path in .env and restart. No modes.
const DATA_DIR = process.env.DATA_DIR || path.resolve(__dirname, '../../spellcasters-community-api/data');

// Assets are always a sibling to the data directory (both in live and mock envs)
const ASSETS_DIR = path.resolve(DATA_DIR, '../assets');

// --- Setup ---
registerMiddleware(app, DATA_DIR, ASSETS_DIR);
registerRoutes(app, ASSETS_DIR);

// --- Boot Validation ---
const validateDataOnBoot = () => {
    logger.info('[Boot] Validating data integrity...');
    
    let errorCount = 0;
    const categories = getRegisteredCategories();

    categories.forEach(category => {
        const dirPath = path.join(DATA_DIR, category);
        if (fileService.existsSync(dirPath)) {
            const files = fileService.listFilesSync(dirPath, ['.json']);
            files.forEach(file => {
                try {
                    const filePath = path.join(dirPath, file);
                    const data = fileService.readJsonSync(filePath);
                    const schema = getSchemaForCategory(category);
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
app.listen(PORT, '0.0.0.0', () => {
    logger.info(`[Server] Running on http://localhost:${PORT}`);
    
    // Log LAN IP for mobile testing
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name] || []) {
            if (net.family === 'IPv4' && !net.internal) {
                logger.info(`[Network] LAN Access: http://${net.address}:${PORT}`);
            }
        }
    }

    validateDataOnBoot();
});

// Global Error Handler (must be registered AFTER routes)
registerErrorHandler(app);
