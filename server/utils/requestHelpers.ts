import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { z } from 'zod';
import { logger } from './logger.js';
import { AppError } from './AppError.js';

// Extend Express Request/Response types if needed, or just use locals
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Locals {
            resolvedPath?: string;
            resolvedDir?: string;
        }
    }
}

/**
 * Middleware to validate that the requested category and filename (if present)
 * are valid and reside within the allowed data directory.
 * 
 * Sets res.locals.resolvedPath (if filename exists) or res.locals.resolvedDir.
 */
export const validatePath = (req: Request, res: Response, next: NextFunction) => {
    const { category, filename } = req.params;
    const { dataDir } = req.context || {}; // Context injected by earlier middleware

    if (!dataDir) {
        logger.error("Data directory not found in request context");
        return next(AppError.internal("Internal Server Error"));
    }

    const resolvedDataDir = path.resolve(dataDir);
    
    if (category) {
        // Normalize backslashes to forward slashes for cross-platform safety
        // This ensures Windows-style paths (..\..\) catch traversal even on Linux
        const safeCategory = (category as string).replace(/\\/g, '/');
        const dirPath = path.resolve(resolvedDataDir, safeCategory);
        
        if (!dirPath.startsWith(resolvedDataDir)) {
            logger.warn(`[Security] Blocked directory traversal attempt: ${category}`);
            return next(AppError.forbidden('Forbidden'));
        }
        res.locals.resolvedDir = dirPath;

        if (filename) {
            const safeFilename = (filename as string).replace(/\\/g, '/');
            const filePath = path.resolve(dirPath, safeFilename);
            
            if (!filePath.startsWith(dirPath)) {
                logger.warn(`[Security] Blocked file traversal attempt: ${category}/${filename}`);
                return next(AppError.forbidden('Forbidden'));
            }
            res.locals.resolvedPath = filePath;
        }
    }
    
    next();
};

/**
 * Helper to validate data against a Zod schema and inject metadata.
 * Returns the parsed data or throws a generic error (after handling the response logic).
 * 
 * Note: If validation fails, this function sends the response. 
 * The caller should return immediately if it returns null.
 */
export const validateAndParse = <T>(
    data: unknown, 
    schema: z.ZodType<T> | undefined, 
    identifier: string
): T => {
    let validData = data;
    
    // Inject last_modified

    if (typeof validData === 'object' && validData !== null) {
        validData = { ...validData, last_modified: new Date().toISOString() };
    }

    if (schema) {
        try {
            return schema.parse(validData);
        } catch (validationError) {
            if (validationError instanceof z.ZodError) {
                logger.warn(`Validation Failed for ${identifier}:`, { error: validationError.issues });
                const fields = validationError.issues.map(e => ({
                    path: e.path.join('.'),
                    message: e.message
                }));
                throw AppError.badRequest("Validation Failed", { fields });
            }
            logger.warn(`Validation Failed for ${identifier}:`, { error: validationError });
            throw AppError.badRequest("Validation Failed");
        }
    }
    
    
    return validData as T;
};

/**
 * Removes keys starting with '_' from an object (shallow).
 */
export const stripInternalFields = (data: unknown): unknown => {
    if (Array.isArray(data)) {
        return data.map(stripInternalFields);
    }
    if (data !== null && typeof data === 'object') {
        const clean: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
            if (!key.startsWith('_')) {
                clean[key] = value;
            }
        }
        return clean;
    }
    return data;
};
