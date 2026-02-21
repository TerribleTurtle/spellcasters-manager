import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';

/**
 * Creates a configured multer instance for file uploads.
 */
export function createUpload(assetsDir: string): multer.Multer {
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            if (!fs.existsSync(assetsDir)) {
                fs.mkdirSync(assetsDir, { recursive: true });
            }
            cb(null, assetsDir);
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

    return multer({
        storage: storage,
        limits: { fileSize: 5 * 1024 * 1024 } // 5MB Hard Limit
    });
}
