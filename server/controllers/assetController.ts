import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';
import { NextFunction } from 'express';

// Note: Multer middleware must run BEFORE this controller to populate req.file
export const uploadAsset = (req: Request, res: Response, next: NextFunction) => {
    const { assetsDir } = req.context;

    if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
    }

    if (!req.file) {
        return next(AppError.badRequest('No file uploaded.'));
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
             return next(AppError.internal("Error moving file", { originalError: err }));
        }
    } else {
        res.json({ success: true, filename: req.file.filename });
    }
};

export const listAssets = (req: Request, res: Response) => {
    const { assetsDir } = req.context;
    
    // Support common image formats
    const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
    
    // List image files in the assets directory
    const files = fs.existsSync(assetsDir) 
        ? fs.readdirSync(assetsDir).filter(f => extensions.some(ext => f.toLowerCase().endsWith(ext)))
        : [];
        
    res.json({ assets: files });
};
