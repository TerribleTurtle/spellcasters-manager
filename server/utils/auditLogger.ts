import fs from 'fs';
import path from 'path';

export class AuditLogger {
    /**
     * Appends a structured log entry to audit.jsonl in the data directory.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    logAction(dataDir: string, action: string, details: Record<string, any>, user: string = "Operator") {
        const logFile = path.join(dataDir, 'audit.jsonl');
        
        const entry = {
            timestamp: new Date().toISOString(),
            action: action.toUpperCase(),
            user,
            details
        };

        try {
            fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
        } catch (error) {
            console.error("Failed to write to audit log:", error);
            // Don't throw, we don't want to break the app flow for logging failure?
            // "Admin Safety" might argue we should, but for now silent fail + console error is safer for UX.
        }
    }
}

export const auditLogger = new AuditLogger();
