import path from 'path';
import fs from 'fs';
import { fileService } from './fileService.js';
import { gitService } from './gitService.js';
import { Change, Patch, PatchType } from '../../src/domain/schemas.js';
import { stripInternalFields } from '../../src/domain/utils.js';
import { logger } from '../utils/logger.js';
import { auditLogger } from '../utils/auditLogger.js';

export class PatchService {
    private gitService: typeof gitService;

    constructor() {
        this.gitService = gitService;
    }

    /**
     * Reads the current queue of pending changes from queue.json.
     * Returns an empty array if the file doesn't exist or is invalid.
     */
    async readQueueSafe(dataDir: string): Promise<Change[]> {
        const queueFile = path.join(dataDir, 'queue.json');
        if (await fileService.exists(queueFile)) {
            try {
                return await fileService.readJson<Change[]>(queueFile);
            } catch (e) {
                if ((e as NodeJS.ErrnoException).code !== 'ENOENT') {
                    logger.warn("Failed to read queue.json", { error: e });
                }
                return [];
            }
        }
        return [];
    }

    async getQueue(dataDir: string): Promise<Change[]> {
        return this.readQueueSafe(dataDir);
    }

    async addToQueue(dataDir: string, change: Change): Promise<Change[]> {
        const queueFile = path.join(dataDir, 'queue.json');
        const queue = await this.readQueueSafe(dataDir);
        
        const timestampedChange = { ...change, timestamp: new Date().toISOString() };
        queue.push(timestampedChange);
        
        await fileService.writeJson(queueFile, queue);
        auditLogger.logAction(dataDir, 'QUEUE_ADD', { change: timestampedChange });
        return queue;
    }

    async updateQueueItem(dataDir: string, index: number, change: Change): Promise<Change[]> {
        const queueFile = path.join(dataDir, 'queue.json');
        const queue = await this.readQueueSafe(dataDir);

        if (index < 0 || index >= queue.length) {
            throw new Error("Queue item not found");
        }

        queue[index] = change;
        await fileService.writeJson(queueFile, queue);
        auditLogger.logAction(dataDir, 'QUEUE_UPDATE', { index, change });
        return queue;
    }

    async removeFromQueue(dataDir: string, index: number): Promise<Change[]> {
        const queueFile = path.join(dataDir, 'queue.json');
        const queue = await this.readQueueSafe(dataDir);

        if (index < 0 || index >= queue.length) {
            throw new Error("Queue item not found");
        }

        queue.splice(index, 1);
        await fileService.writeJson(queueFile, queue);
        auditLogger.logAction(dataDir, 'QUEUE_REMOVE', { index });
        return queue;
    }

    async bulkRemoveFromQueue(dataDir: string, indices: number[]): Promise<Change[]> {
        const queueFile = path.join(dataDir, 'queue.json');
        const queue = await this.readQueueSafe(dataDir);

        // Sort descending to prevent index shifting during splice
        const sortedIndices = [...indices].sort((a, b) => b - a);
        const maxIdx = queue.length - 1;

        // Validation
        for (const idx of sortedIndices) {
            if (idx < 0 || idx > maxIdx) {
                 throw new Error(`Queue index ${idx} out of bounds (length: ${queue.length})`);
            }
        }

        // Remove
        for (const idx of sortedIndices) {
            queue.splice(idx, 1);
        }

        await fileService.writeJson(queueFile, queue);
        auditLogger.logAction(dataDir, 'QUEUE_REMOVE_BULK', { indices: sortedIndices, count: sortedIndices.length });
        return queue;
    }

    async quickSave(dataDir: string, change: Change, version: string, tags: string[] = []): Promise<Patch> {
        const patchEntry: Patch = {
            id: `patch_${Date.now()}`,
            version: version || 'quick',
            type: 'Hotfix',
            title: `Quick Save: ${change.name} (${change.field})`,
            date: new Date().toISOString().split('T')[0],
            tags: tags,
            changes: [change]
        };

        const patchesFile = path.join(dataDir, 'patches.json');
        let patches: Patch[] = [];

        if (await fileService.exists(patchesFile)) {
            patches = await fileService.readJson<Patch[]>(patchesFile);
        }
        patches.unshift(patchEntry);
        await fileService.writeJson(patchesFile, patches);

        // Stage only the files we actually touched
        const touchedFiles = [patchesFile];
        // The entity file was already saved by saveData before quickSave was called
        if (change.category) {
            const entityFile = path.join(dataDir, change.category, 
                change.target_id.endsWith('.json') ? change.target_id : `${change.target_id}.json`);
            touchedFiles.push(entityFile);
        }

        // Capture git diff before committing
        const diff = await this.gitService.getStagedDiff(dataDir, touchedFiles);
        if (diff) patchEntry.diff = diff;

        await this.gitService.commitPatch(dataDir, patchEntry, `[QUICK] ${patchEntry.title}`, touchedFiles);
        auditLogger.logAction(dataDir, 'PATCH_QUICKSAVE', { patchId: patchEntry.id, title: patchEntry.title });
        return patchEntry;
    }

    /**
     * Bundles all queued changes into a single Patch object, writes it to patches.json,
     * clears the queue, and creates a git commit.
     */
    async commitPatch(dataDir: string, title: string, version: string, type: PatchType, tags: string[] = []): Promise<Patch> {
        const patchesFile = path.join(dataDir, 'patches.json');
        const queueFile = path.join(dataDir, 'queue.json');
        const finalChanges = await this.readQueueSafe(dataDir);

        if (finalChanges.length === 0) {
            throw new Error("No queued changes to commit");
        }

        let patches: Patch[] = [];
        if (await fileService.exists(patchesFile)) {
            patches = await fileService.readJson<Patch[]>(patchesFile);
        }

        const existingIdx = patches.findIndex(p => p.version === version);
        let patchEntry: Patch;

        if (existingIdx >= 0) {
            const existing = patches[existingIdx];
            for (const newChange of finalChanges) {
                const dupeIdx = existing.changes.findIndex(c => 
                    c.target_id === newChange.target_id && c.field === newChange.field
                );
                if (dupeIdx >= 0) existing.changes[dupeIdx] = newChange;
                else existing.changes.push(newChange);
            }

            existing.date = new Date().toISOString().split('T')[0];
            existing.title = title || existing.title;
            const mergedTags = new Set([...(existing.tags || []), ...tags]);
            existing.tags = Array.from(mergedTags);
            patchEntry = existing;
            patches[existingIdx] = existing;
        } else {
            patchEntry = {
                id: `patch_${version.replace(/\./g, '_')}`,
                version,
                type,
                title,
                date: new Date().toISOString().split('T')[0],
                tags,
                changes: finalChanges
            };
            patches.unshift(patchEntry);
        }

        // Backup Queue
        if (finalChanges.length > 0) {
            try {
                const backupDir = path.join(dataDir, 'queue_backups');
                await fileService.ensureDir(backupDir);
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const backupFile = path.join(backupDir, `queue_backup_${timestamp}.json`);
                await fileService.writeJson(backupFile, finalChanges);

                const files = await fileService.listFiles(backupDir, ['.json']);
                const sortedFiles = files.filter(f => f.startsWith('queue_backup_')).sort();
                
                while (sortedFiles.length > 5) {
                    const toDelete = sortedFiles.shift();
                    if (toDelete) await fileService.deleteFile(path.join(backupDir, toDelete));
                }
            } catch (e) {
                logger.error("Queue Backup Failed:", { error: e });
            }
        }

        try {
            await fileService.writeJson(patchesFile, patches);
            await fileService.writeJson(queueFile, []);

            if (dataDir.includes('spellcasters-community-api')) {
                try {
                    const apiRoot = path.resolve(dataDir, '..');
                    await this.publishStaticFiles(apiRoot, patches);
                } catch (err) {
                    logger.error("Static File Gen Error:", { error: err });
                }
            }

            // Stage only the files we actually touched
            const touchedFiles = [patchesFile, queueFile];
            // Entity files were already saved by saveData calls before commit
            for (const change of finalChanges) {
                if (change.category) {
                    const entityFile = path.join(dataDir, change.category, 
                        change.target_id.endsWith('.json') ? change.target_id : `${change.target_id}.json`);
                    touchedFiles.push(entityFile);
                }
            }

            // Capture git diff before committing
            const diff = await this.gitService.getStagedDiff(dataDir, touchedFiles);
            if (diff) patchEntry.diff = diff;

            // Re-write patches with diff included
            await fileService.writeJson(patchesFile, patches);

            const commitMsg = existingIdx >= 0 
                ? `[UPDATE] ${title} (${version})`
                : `[${type.toUpperCase()}] ${title} (${version})`;
            
            await this.gitService.commitPatch(dataDir, patchEntry, commitMsg, touchedFiles);
            logger.info(`Patch ${version} committed successfully with ${finalChanges.length} changes.`);
            auditLogger.logAction(dataDir, 'PATCH_COMMIT', { version, title, changeCount: finalChanges.length });
            return patchEntry;
        } catch (e) {
            logger.error("Commit Patch Failed", { error: e });
            throw e;
        }
    }

    async getPatchHistory(dataDir: string, tag?: string, from?: string, to?: string): Promise<Patch[]> {
        const patchesFile = path.join(dataDir, 'patches.json');
        if (!(await fileService.exists(patchesFile))) return [];

        let patches = await fileService.readJson<Patch[]>(patchesFile);
        if (tag) {
            patches = patches.filter(p => p.tags && p.tags.includes(tag));
        }
        if (from) {
            patches = patches.filter(p => p.date >= from);
        }
        if (to) {
            patches = patches.filter(p => p.date <= to);
        }
        return patches;
    }

    /**
     * Creates a new patch that inverts the changes of a target patch.
     * Effectively "undoes" a patch while preserving history.
     */
    async rollbackPatch(dataDir: string, id: string): Promise<Patch> {
        const patchesFile = path.join(dataDir, 'patches.json');
        if (!(await fileService.exists(patchesFile))) throw new Error("No patches found");

        const patches = await fileService.readJson<Patch[]>(patchesFile);
        const patchIdx = patches.findIndex(p => p.id === id);
        if (patchIdx === -1) throw new Error("Patch not found");

        const originalPatch = patches[patchIdx];
        const invertedChanges: Change[] = [];
        const fileUpdates: Record<string, Change[]> = {};

        for (const change of originalPatch.changes) {
            const inverted: Change = {
                ...change,
                old: change.new,
                new: change.old,
                name: `Revert: ${change.name}`,
                reason: `Rollback of ${originalPatch.title}`
            };
            invertedChanges.push(inverted);
            if (!fileUpdates[change.target_id]) fileUpdates[change.target_id] = [];
            fileUpdates[change.target_id].push(inverted);
        }

        // Apply to Disk
        const categories = (await fs.promises.readdir(dataDir))
            .filter(async f => (await fs.promises.stat(path.join(dataDir, f))).isDirectory() && !f.startsWith('.') && f !== 'queue_backups' && f !== 'queue.json');

        for (const [targetId, changes] of Object.entries(fileUpdates)) {
            let filePath: string | null = null;
            
            for (const cat of categories) {
                const p = path.join(dataDir, cat, targetId.endsWith('.json') ? targetId : `${targetId}.json`);
                if (await fileService.exists(p)) {
                    filePath = p;
                    break;
                }
            }

            if (!filePath) {
                 const cat = changes.find(c => c.category)?.category;
                 if (cat) filePath = path.join(dataDir, cat, targetId.endsWith('.json') ? targetId : `${targetId}.json`);
            }

            if (!filePath) {
                logger.warn(`Could not find file for ${targetId}, skipping rollback for this file.`);
                continue;
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let content: any = {};
            if (await fileService.exists(filePath)) content = await fileService.readJson(filePath);

            for (const change of changes) {
                if (change.new === undefined && (change.field === 'ROOT' || !change.field)) {
                    await fileService.deleteFile(filePath);
                    content = null;
                    break;
                } else if (change.old === undefined && (change.field === 'ROOT' || !change.field)) {
                    content = change.new;
                } else {
                    if (content) content = this.applyChangeToObject(content, change.field, change.new);
                }
            }

            if (content) {
                const dir = path.dirname(filePath);
                await fileService.ensureDir(dir);
                await fileService.writeJson(filePath, content);
            }
        }

        const revertPatch: Patch = {
            id: `patch_rollback_${Date.now()}`,
            version: `${originalPatch.version}-revert`,
            type: 'Hotfix',
            title: `Revert: ${originalPatch.title}`,
            date: new Date().toISOString().split('T')[0],
            tags: ['rollback'],
            changes: invertedChanges
        };

        patches.unshift(revertPatch);
        await fileService.writeJson(patchesFile, patches);

        // Stage only patchesFile + the entity files we actually reverted
        const touchedFiles = [patchesFile];
        for (const [targetId, changes] of Object.entries(fileUpdates)) {
            const cat = changes.find(c => c.category)?.category;
            if (cat) {
                touchedFiles.push(path.join(dataDir, cat, 
                    targetId.endsWith('.json') ? targetId : `${targetId}.json`));
            }
        }

        await this.gitService.commitPatch(dataDir, revertPatch, `[ROLLBACK] ${originalPatch.title}`, touchedFiles);
        auditLogger.logAction(dataDir, 'PATCH_ROLLBACK', { originalId: id, revertId: revertPatch.id });
        
        return revertPatch;
    }

    private applyChangeToObject(obj: Record<string, unknown>, pathStr: string, value: unknown): Record<string, unknown> {
        if (!pathStr || pathStr === 'ROOT') return value as Record<string, unknown>;
        
        const parts = pathStr.split('.');
        let current: Record<string, unknown> = obj;
        
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current[part] || typeof current[part] !== 'object') {
                current[part] = {};
            }
            current = current[part] as Record<string, unknown>;
        }
        
        const last = parts[parts.length - 1];
        if (value === undefined) {
            delete current[last];
        } else {
            current[last] = value;
        }
        
        return obj;
    }

    private async publishStaticFiles(apiRoot: string, patches: Patch[]) {
        // 1. changelog.json
        const sanitizedPatches = stripInternalFields(patches);
        await fileService.writeJson(path.join(apiRoot, 'changelog.json'), sanitizedPatches);

        // 2. changelog_latest.json
        if (sanitizedPatches.length > 0) {
            await fileService.writeJson(path.join(apiRoot, 'changelog_latest.json'), sanitizedPatches[0]);
        }

        // 3. balance_index.json
        if (patches.length > 0) {
            const latest = patches[0];
            const entities: Record<string, string> = {};
            const changesByEntity: Record<string, Change[]> = {};
            
            latest.changes.forEach(c => {
                 if (!changesByEntity[c.target_id]) changesByEntity[c.target_id] = [];
                 changesByEntity[c.target_id].push(c);
            });

            for (const [id, changes] of Object.entries(changesByEntity)) {
                 const directions = changes.map(c => c.balance_direction).filter(Boolean);
                 if (directions.length > 0) {
                     if (directions.includes('nerf')) entities[id] = 'nerf';
                     else if (directions.includes('buff')) entities[id] = 'buff';
                     else if (directions.includes('rework')) entities[id] = 'rework';
                     else entities[id] = 'fix';
                 } else {
                     entities[id] = 'rework';
                 }
            }

            const balanceIndex = {
                patch_version: latest.version,
                patch_date: latest.date,
                entities
            };
            await fileService.writeJson(path.join(apiRoot, 'balance_index.json'), balanceIndex);
        }

        // 4. timeline
        const timelineDir = path.join(apiRoot, 'timeline');
        await fileService.ensureDir(timelineDir);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const timelineMap: Record<string, any[]> = {};
        for (let i = patches.length - 1; i >= 0; i--) {
            const patch = patches[i];
            for (const change of patch.changes) {
                if (!timelineMap[change.target_id]) timelineMap[change.target_id] = [];
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const exists = timelineMap[change.target_id].find((t: any) => t.version === patch.version);
                if (!exists && change.new) {
                    timelineMap[change.target_id].push({
                        version: patch.version,
                        date: patch.date,
                        snapshot: stripInternalFields(change.new)
                    });
                }
            }
        }

        for (const [id, history] of Object.entries(timelineMap)) {
            await fileService.writeJson(path.join(timelineDir, `${id}.json`), history);
        }
    }
}

export const patchService = new PatchService();
