import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { GitService } from '../services/gitService.js';
import { Patch } from '../../src/types/index.js';
import { fileService } from '../services/fileService.js';

const gitService = new GitService('.'); // Root handled dynamically inside methods usually

export const getDraftDiff = async (req: Request, res: Response) => {
    const { dataDir } = req.context;
    // We instantiate logic here or reuse a global service.
    // GitService logic handles dynamic root detection based on dataDir.
    const changes = await gitService.getDiff(dataDir);
    res.json(changes);
};

export const commitPatch = async (req: Request, res: Response) => {
    const { title, version, type } = req.body;
    const { dataDir } = req.context;
    const patchesFile = path.join(dataDir, 'patches.json');

    // 1. Get Diff
    const changes = await gitService.getDiff(dataDir);
    if (changes.length === 0) {
        res.status(400).json({ error: "No changes to commit" });
        return;
    }

    // 2. Create Patch Entry
    const patchEntry: Patch = {
        id: `patch_${version.replace(/\./g, '_')}`,
        version,
        type,
        title,
        date: new Date().toISOString().split('T')[0],
        changes
    };

    // 3. Append to patches.json
    let patches: Patch[] = [];
    if (fileService.exists(patchesFile)) {
        patches = fileService.readJson<Patch[]>(patchesFile);
    }
    patches.unshift(patchEntry);
    fileService.writeJson(patchesFile, patches);

    // 4. Git Commit
    try {
        await gitService.commitPatch(dataDir, patchEntry, `[${type}] ${title} (${version})`);
        res.json({ success: true, patch: patchEntry });
    } catch (err) {
        console.error("Git Commit Error:", err);
        res.status(500).json({ error: "Failed to commit to git" });
    }
};
