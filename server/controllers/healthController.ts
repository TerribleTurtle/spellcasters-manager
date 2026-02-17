import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const packageJsonPath = path.join(process.cwd(), 'package.json');

export const getHealth = async (req: Request, res: Response) => {
    try {
        const { dataDir } = req.context;
        // Check if dataDir is accessible
        await fs.promises.access(dataDir, fs.constants.R_OK | fs.constants.W_OK);
        
        let version = 'unknown';
        try {
            if (fs.existsSync(packageJsonPath)) {
                const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
                version = pkg.version || 'unknown';
            }
        } catch {
            // ignore
        }

        res.json({ 
            status: 'healthy', 
            timestamp: new Date().toISOString(),
            dataDirAccessible: true,
            version
        });
    } catch (error) {
        res.status(503).json({ 
            status: 'unhealthy', 
            timestamp: new Date().toISOString(),
            error: (error as Error).message
        });
    }
};
