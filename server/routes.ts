import express from 'express';
import * as DataController from './controllers/dataController.js';
import * as PatchController from './controllers/patchController.js';
import * as QueueController from './controllers/queueController.js';
import * as HealthController from './controllers/healthController.js';
import * as AssetController from './controllers/assetController.js';
import * as DevController from './controllers/devController.js';
import { createUpload } from './config/multer.js';

/**
 * Registers all API routes on the Express app.
 */
export function registerRoutes(app: express.Express, assetsDir: string): void {
    const upload = createUpload(assetsDir);

    // Data
    app.get('/api/bulk/:category', DataController.validatePath, DataController.getCategoryData); 
    app.post('/api/save/:category/batch', DataController.validatePath, DataController.saveBatch); 
    app.get('/api/list/:category', DataController.validatePath, DataController.listFiles);
    app.get('/api/data/:category/:filename', DataController.validatePath, DataController.getData);
    app.post('/api/save/:category/:filename', DataController.validatePath, DataController.saveData);
    app.delete('/api/data/:category/:filename', DataController.validatePath, DataController.deleteData);

    app.get('/api/data/export', DataController.exportData);
    app.post('/api/data/import', DataController.importData);

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
    app.use('/api/assets', express.static(assetsDir));

    // Dev Tools
    app.get('/api/dev/config', DevController.getConfig);
    app.post('/api/dev/switch-path', DevController.switchPath);
    app.post('/api/dev/sync', DevController.syncData);
}
