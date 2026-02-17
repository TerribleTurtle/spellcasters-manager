export class AppError extends Error {
    constructor(
        public statusCode: number,
        public code: string,
        message: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        public details?: any
    ) {
        super(message);
        this.name = 'AppError';
        // Restore prototype chain for instanceof checks
        Object.setPrototypeOf(this, AppError.prototype);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static badRequest(message: string, details?: any) {
        return new AppError(400, 'BAD_REQUEST', message, details);
    }

    static notFound(message: string) {
        return new AppError(404, 'NOT_FOUND', message);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static internal(message: string, details?: any) {
        return new AppError(500, 'INTERNAL_ERROR', message, details);
    }

    static unauthorized(message: string) {
        return new AppError(401, 'UNAUTHORIZED', message);
    }

    static forbidden(message: string) {
        return new AppError(403, 'FORBIDDEN', message);
    }
}
