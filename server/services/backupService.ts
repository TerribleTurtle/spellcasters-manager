import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger.js';

export class BackupService {
    async createBackup(dataDir: string): Promise<string> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDirName = `full_backup_${timestamp}`;
        
        const backupRoot = path.join(path.dirname(dataDir), 'backups');
        const targetDir = path.join(backupRoot, backupDirName);

        try {
            // Check if backupRoot exists, if not create it
            try {
                await fsPromises.access(backupRoot);
            } catch {
                await fsPromises.mkdir(backupRoot, { recursive: true });
            }

            await fsPromises.mkdir(targetDir, { recursive: true });
            
            // Async recursive copy
            // Node 16.7+ supports fs.cp (async)
            if (fsPromises.cp) {
                await fsPromises.cp(dataDir, targetDir, { recursive: true });
            } else {
                 // Fallback
                 await this.copyRecursive(dataDir, targetDir);
            }
            
            logger.info(`Backup created at ${targetDir}`);
            return targetDir;
        } catch (error) {
            logger.error('Backup creation failed', { error });
            throw error;
        }
    }

    private async copyRecursive(src: string, dest: string) {
        const stats = await fsPromises.stat(src);
        if (stats.isDirectory()) {
            try {
                await fsPromises.access(dest);
            } catch {
                await fsPromises.mkdir(dest);
            }
            const children = await fsPromises.readdir(src);
            await Promise.all(children.map(childItemName => 
                this.copyRecursive(path.join(src, childItemName), path.join(dest, childItemName))
            ));
        } else {
            await fsPromises.copyFile(src, dest);
        }
    }
}

export const backupService = new BackupService();
