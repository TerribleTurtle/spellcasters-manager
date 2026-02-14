

import { Request, Response } from 'express';
import path from 'path';
import { fileService } from '../services/fileService.js';
import { UnitSchema } from '../../src/domain/schemas.js';

export const listFiles = (req: Request, res: Response) => {
    const { category } = req.params as { category: string };
    const { dataDir } = req.context;
    const dirPath = path.join(dataDir, category);
    
    const files = fileService.listFiles(dirPath);
    res.json(files);
};

export const getData = (req: Request, res: Response) => {
    const { category, filename } = req.params as { category: string; filename: string };
    const { dataDir } = req.context;
    const filePath = path.join(dataDir, category, filename);

    // Security check
    if (!filePath.startsWith(dataDir)) {
        res.status(403).send('Forbidden');
        return;
    }

    try {
        const data = fileService.readJson(filePath);
        res.json(data);
    } catch (e) {
        res.status(404).send('File not found');
    }
};

export const saveData = (req: Request, res: Response) => {
    const { category, filename } = req.params as { category: string; filename: string };
    const { dataDir, mode } = req.context;
    const filePath = path.join(dataDir, category, filename);
    let newData = req.body;

    try {
        // Validation Gate
        if (category === 'units') {
             newData = UnitSchema.parse(newData);
        }

        fileService.writeJson(filePath, newData);
        console.log(`[Server][${mode.toUpperCase()}] Saved ${category}/${filename}`);
        res.json({ success: true });
    } catch (e) {
        console.error("Save Error:", e);
        res.status(400).json({ error: (e as Error).message });
    }
};
