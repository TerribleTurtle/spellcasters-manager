import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

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
        const newPath = path.join(assetsDir, targetFilename);

        try {
            // Rename logic
            try {
                fs.renameSync(oldPath, newPath);
            } catch (e) {
                // Cross-device fallback
                fs.copyFileSync(oldPath, newPath);
                fs.unlinkSync(oldPath);
            }
            console.log(`[Server] Uploaded and moved to ${newPath}`);
            res.json({ success: true, filename: targetFilename });
        } catch (err) {
             console.error("Error moving file:", err);
             res.status(500).send("Error moving file");
        }
    } else {
        res.json({ success: true, filename: req.file.filename });
    }
};
