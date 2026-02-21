import { Request, Response, NextFunction } from 'express';
import express from 'express';
import cors from 'cors';
import { logger } from './utils/logger.js';
import { AppError } from './utils/AppError.js';

/**
 * Registers all middleware on the Express app.
 */
export function registerMiddleware(app: express.Express, dataDir: string, assetsDir: string): void {
    app.use(cors());
    app.use(express.json({ limit: '1mb' }));

    // Request Logger
    app.use((req: Request, res: Response, next: NextFunction) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
        });
        next();
    });

    // Context Middleware (Dependency Injection-lite)
    app.use((req: Request, res: Response, next: NextFunction) => {
        req.context = { dataDir, assetsDir };
        next();
    });
}

/**
 * Registers the global error handler (must be registered AFTER routes).
 */
export function registerErrorHandler(app: express.Express): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        if (err instanceof AppError) {
            logger.warn(`[${err.code}] ${req.method} ${req.url}: ${err.message}`);
            res.status(err.statusCode).json({
                error: err.message,
                code: err.code,
                ...(err.details ? { details: err.details } : {})
            });
            return;
        }

        logger.error(`[Error] ${req.method} ${req.url}:`, { error: err.message, stack: err.stack });
        res.status(500).json({ error: "Internal Server Error", details: err.message });
    });
}
