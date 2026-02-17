import fs from 'fs';
import path from 'path';

import { logger } from './logger.js';

export class AuditLogger {
    /**
     * Appends a structured log entry to audit.jsonl in the data directory.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async logAction(dataDir: string, action: string, details: Record<string, any>, user: string = "Operator") {
        const logFile = path.join(dataDir, 'audit.jsonl');
        
        const entry = {
            timestamp: new Date().toISOString(),
            action: action.toUpperCase(),
            user,
            details
        };

        // Non-blocking write, but return promise so we can wait if needed
        return fs.promises.appendFile(logFile, JSON.stringify(entry) + '\n').catch(err => {
            logger.error("Failed to write to audit log", { error: err });
        });
    }
}

export const auditLogger = new AuditLogger();
