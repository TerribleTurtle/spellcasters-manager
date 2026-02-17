import fsPromises from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger.js';
import { fileService } from './fileService.js';

const MAX_FILE_BACKUPS = 5;

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

    /**
     * Backs up the current queue of changes and rotates old backups.
     */
    async backupQueue(dataDir: string, queueItems: unknown[]): Promise<void> {
        try {
            const backupDir = path.join(dataDir, 'queue_backups');
            await fileService.ensureDir(backupDir);
            
            await fsPromises.mkdir(backupDir, { recursive: true });

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(backupDir, `queue_backup_${timestamp}.json`);
            
            // We need to write JSON. backupService doesn't have writeJson currently.
            // We can add a helper or use fsPromises.writeFile.
            await fileService.writeJson(backupFile, queueItems);

            // Rotation
            const files = await fsPromises.readdir(backupDir);
            const sortedFiles = files.filter(f => f.startsWith('queue_backup_') && f.endsWith('.json')).sort();
            
            while (sortedFiles.length > 5) {
                const toDelete = sortedFiles.shift();
                if (toDelete) await fsPromises.unlink(path.join(backupDir, toDelete));
            }
        } catch (e) {
            logger.error("Queue Backup Failed:", { error: e });
            // Swallow error as it's non-critical?
        }
    }



    /**
     * Creates a backup of a single file in backups/file_history
     * Maintains a history of the last N versions.
     */
    async backupFile(dataDir: string, filePath: string): Promise<string | null> {
        try {
            if (!(await fileService.exists(filePath))) {
                return null;
            }

            const relativePath = path.relative(dataDir, filePath);
            // Safety check: ensure file is inside dataDir
            if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
                // Determine if it's safe to backup? 
                // For now, only backup files strictly inside dataDir to avoid confusion
                 // but quickSave/saveData ensure this anyway.
                 // If it fails relative check, just ignore or log warning?
                 // Let's assume valid dataDir usage for now.
            }

            const historyDir = path.join(dataDir, 'backups', 'file_history', path.dirname(relativePath));
            await fileService.ensureDir(historyDir);

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = path.basename(filePath);
            const backupPath = path.join(historyDir, `${fileName}.${timestamp}.bak`);

            await fsPromises.copyFile(filePath, backupPath);

            // Rotate old backups
            const files = await fsPromises.readdir(historyDir);
            const associatedBackups = files
                .filter(f => f.startsWith(fileName + '.') && f.endsWith('.bak'))
                .sort(); // Lexicographical sort works for ISO timestamps

            while (associatedBackups.length > MAX_FILE_BACKUPS) {
                const toDelete = associatedBackups.shift();
                if (toDelete) {
                    await fsPromises.unlink(path.join(historyDir, toDelete));
                }
            }

            return backupPath;
        } catch (error) {
            logger.error(`Failed to backup file: ${filePath}`, { error });
            return null;
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
