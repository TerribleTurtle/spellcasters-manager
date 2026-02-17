import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger.js';

// Note: Multer middleware must run BEFORE this controller to populate req.file
export const uploadAsset = (req: Request, res: Response) => {
    const { dataDir } = req.context;
    const assetsDir = path.join(dataDir, 'assets');

    if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
    }

    if (!req.file) {
        res.status(400).send('No file uploaded.');
        return;
    }

    const targetFilename = req.body.targetFilename;
    if (targetFilename) {
        const oldPath = req.file.path;
        // Security: Sanitize filename to prevent path traversal
        const safeFilename = path.basename(targetFilename);
        const newPath = path.join(assetsDir, safeFilename);

        try {
            // Rename logic
            try {
                fs.renameSync(oldPath, newPath);
            } catch {
                // Cross-device fallback
                fs.copyFileSync(oldPath, newPath);
                fs.unlinkSync(oldPath);
            }

            res.json({ success: true, filename: targetFilename });
        } catch (err: unknown) {
             logger.error("Error moving file:", { error: err });
             res.status(500).send("Error moving file");
        }
    } else {
        res.json({ success: true, filename: req.file.filename });
    }
};

export const listAssets = (req: Request, res: Response) => {
    const { dataDir } = req.context;
    const assetsDir = path.join(dataDir, 'assets');
    
    // Support common image formats
    const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
    
    // We can't import fileService easily because it's a sibling module? 
    // Actually we can, but let's just use it if we can import it.
    // Looking at the file imports, we don't have fileService imported yet.
    // Let's rely on fs direct usage or import fileService if preferred. 
    // Consistency: use fileService.
    const files = fs.existsSync(assetsDir) 
        ? fs.readdirSync(assetsDir).filter(f => extensions.some(ext => f.toLowerCase().endsWith(ext)))
        : [];
        
    res.json({ assets: files });
};
