import { AppMode } from '../../src/domain/schemas.js';

declare global {
  namespace Express {
    interface Request {
      context: {
        mode: AppMode;
        dataDir: string;
      };
    }
  }
}
