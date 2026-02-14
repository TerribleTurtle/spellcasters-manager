import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import dotenv from 'dotenv';
import * as DataController from './controllers/dataController.js';
import * as PatchController from './controllers/patchController.js';
import * as AssetController from './controllers/assetController.js';

// Load .env
dotenv.config();

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// --- Config ---
// Prefer Env Vars, fallback to relative paths
const DEV_DATA_DIR = process.env.DEV_DATA_DIR || path.resolve(__dirname, '../data');
const LIVE_DATA_DIR = process.env.LIVE_DATA_DIR || path.resolve(__dirname, '../../spellcasters-community-api/data');
const ASSETS_DIR = path.join(DEV_DATA_DIR, 'assets'); // Default upload location

// --- Middleware ---
app.use(cors());
app.use(express.json());

// Context Middleware (Dependency Injection-lite)
app.use((req: Request, res: Response, next: NextFunction) => {
    const mode = (req.query.mode === 'live' ? 'live' : 'dev') as any; // Cast for now or import AppMode
    const dataDir = mode === 'live' ? LIVE_DATA_DIR : DEV_DATA_DIR;
    req.context = { mode, dataDir };
    next();
});

// Multer Config
// We keep basic config here to pass to route
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync(ASSETS_DIR)) {
            fs.mkdirSync(ASSETS_DIR, { recursive: true });
        }
        cb(null, ASSETS_DIR);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
import fs from 'fs'; // Needed for multer config above
const upload = multer({ storage: storage });

// --- Routes ---

// Health
app.get('/api/health', (req, res) => {
    const { dataDir, mode } = (req as any).context;
    res.json({ status: 'ok', dataDir, mode, liveAvailable: fs.existsSync(LIVE_DATA_DIR) });
});

// Data
app.get('/api/list/:category', DataController.listFiles);
app.get('/api/data/:category/:filename', DataController.getData);
app.post('/api/save/:category/:filename', DataController.saveData);

// Patches
app.get('/api/patches/draft', PatchController.getDraftDiff);
app.post('/api/patches/commit', PatchController.commitPatch);

// Assets
app.post('/api/assets/upload', upload.single('file'), AssetController.uploadAsset);

// Static Assets
// We serve both to allow switching. Context middleware doesn't affect static serve easily.
app.use('/api/assets/dev', express.static(DEV_DATA_DIR + '/assets'));
app.use('/api/assets/live', express.static(LIVE_DATA_DIR + '/assets'));


// --- Start ---
app.listen(PORT, () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
});
