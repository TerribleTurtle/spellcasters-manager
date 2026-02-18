import path from 'path';
import { fileService } from './fileService.js';
import { gitService } from './gitService.js';
import { publisherService } from './publisherService.js';
import { backupService } from './backupService.js';
import { queueService } from './queueService.js';
import { Change, ChangeSchema, Patch, PatchType } from '../../src/domain/schemas/index.js';
import { logger } from '../utils/logger.js';
import { auditLogger } from '../utils/auditLogger.js';
import { AppError } from '../utils/AppError.js';
import { ensureJsonExt } from '../utils/pathUtils.js';
import { buildSlimChange } from '../utils/slimChange.js';
import { sortKeys } from '../utils/jsonUtils.js';

export class PatchService {
    private gitService: typeof gitService;

    constructor() {
        this.gitService = gitService;
    }

    async readQueueSafe(dataDir: string): Promise<Change[]> {
        // Delegated to QueueService, but kept here privately if needed by commitPatch or similar?
        // Actually commitPatch needs it. Let's import QueueService here too or keep a helper.
        // Better: Import queueService.
        return queueService.readQueueSafe(dataDir);
    }

    async quickSave(dataDir: string, change: Change, version: string, tags: string[] = []): Promise<Patch> {
        // 1. Create the patch entry on disk
        const patchEntry = await this.recordPatch(dataDir, `Quick Save: ${change.name} (${change.field})`, 'Hotfix', [change], tags, version || 'quick');

        // 2. Publish static API files (changelog, timeline) if community-api
        const publishedFiles = await publisherService.publishIfNeeded(dataDir);

        // 3. Commit it
        const patchesFile = path.join(dataDir, 'patches.json');
        
        // Stage only the files we actually touched
        const touchedFiles = [patchesFile, ...publishedFiles];
        // The entity file was already saved by saveData before quickSave was called
        if (change.category) {
            const entityFile = path.join(dataDir, change.category, 
                ensureJsonExt(change.target_id));
            touchedFiles.push(entityFile);
        }

        // Capture git diff before committing
        const diff = await this.gitService.getStagedDiff(dataDir, touchedFiles);
        if (diff) {
             patchEntry.diff = diff;
             // Update patch on disk with diff
             const patches = await fileService.readJson<Patch[]>(patchesFile);
             const idx = patches.findIndex(p => p.id === patchEntry.id);
             if (idx !== -1) {
                 patches[idx] = patchEntry;
                 await fileService.writeJson(patchesFile, patches);
             }
        }

        await this.gitService.commitPatch(dataDir, patchEntry, `[QUICK] ${patchEntry.title}`, touchedFiles);
        auditLogger.logAction(dataDir, 'PATCH_QUICKSAVE', { patchId: patchEntry.id, title: patchEntry.title });
        return patchEntry;
    }

    /**
     * Records a patch entry to patches.json WITHOUT committing to git.
     * This ensures an audit trail for every filesystem change.
     */
    async recordPatch(dataDir: string, title: string, type: PatchType, changes: Change[], tags: string[] = [], version: string = 'auto'): Promise<Patch> {
        // Validate changes
        for (const change of changes) {
            const parseResult = ChangeSchema.safeParse(change);
            if (!parseResult.success) {
                throw AppError.badRequest('Invalid change object', {
                    fields: parseResult.error.issues.map(e => ({ path: e.path.join('.'), message: e.message }))
                });
            }
        }

        const patchEntry: Patch = {
            id: `patch_${Date.now()}`,
            version: version,
            type,
            title,
            date: new Date().toISOString().split('T')[0],
            tags: tags,
            changes: changes
        };

        const patchesFile = path.join(dataDir, 'patches.json');
        let patches: Patch[] = [];

        if (await fileService.exists(patchesFile)) {
            // SAFETY: Backup patches.json before appending
            // Only back up if we aren't already in a massive batch operation? 
            // For now, safety first.
            await backupService.backupFile(dataDir, patchesFile);
            patches = await fileService.readJson<Patch[]>(patchesFile);
        }
        patches.unshift(patchEntry);
        await fileService.writeJson(patchesFile, sortKeys(patches));
        
        return patchEntry;
    }

    /**
     * Bundles all queued changes into a single Patch object, writes it to patches.json,
     * clears the queue, and creates a git commit.
     */
    async commitPatch(dataDir: string, title: string, version: string, type: PatchType, tags: string[] = []): Promise<Patch> {
        const patchesFile = path.join(dataDir, 'patches.json');
        const queueFile = path.join(dataDir, 'queue.json');
        const fullChanges = await this.readQueueSafe(dataDir);

        if (fullChanges.length === 0) {
            throw AppError.badRequest("No queued changes to commit");
        }

        // Backup Queue FIRST (preserves full old/new snapshots for disaster recovery)
        await backupService.backupQueue(dataDir, fullChanges);

        // Slim the queue changes: convert full old/new snapshots → compact diffs
        // The queue backup above retains the full data; patches.json only needs diffs.
        const finalChanges: Change[] = fullChanges.map(change => {
            if (change.old !== undefined || change.new !== undefined) {
                return buildSlimChange(
                    change.target_id,
                    change.name,
                    change.field,
                    change.category || '',
                    change.old,
                    change.new
                );
            }
            // Already slim (shouldn't happen, but safe)
            return change;
        });

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

        try {
            await fileService.writeJson(patchesFile, sortKeys(patches));
            await fileService.writeJson(queueFile, sortKeys([]));

            const publishedFiles = await publisherService.publishIfNeeded(dataDir);

            // Stage only the files we actually touched
            const touchedFiles = [patchesFile, queueFile, ...publishedFiles];
            // Entity files were already saved by saveData calls before commit
            for (const change of finalChanges) {
                if (change.category) {
                    const entityFile = path.join(dataDir, change.category, 
                        ensureJsonExt(change.target_id));
                    touchedFiles.push(entityFile);
                }
            }

            // Capture git diff before committing
            const diff = await this.gitService.getStagedDiff(dataDir, touchedFiles);
            if (diff) patchEntry.diff = diff;

            // Re-write patches with diff included
            await fileService.writeJson(patchesFile, sortKeys(patches));

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
     * 
     * Supports both slim diffs (new format) and legacy old/new snapshots.
     */
    async rollbackPatch(dataDir: string, id: string): Promise<Patch> {
        const patchesFile = path.join(dataDir, 'patches.json');
        if (!(await fileService.exists(patchesFile))) throw AppError.notFound("No patches found");

        const patches = await fileService.readJson<Patch[]>(patchesFile);
        const patchIdx = patches.findIndex(p => p.id === id);
        if (patchIdx === -1) throw AppError.notFound("Patch not found");

        const originalPatch = patches[patchIdx];
        const invertedChanges: Change[] = [];
        const categories = await fileService.listDirectories(dataDir, ['queue_backups']);

        for (const change of originalPatch.changes) {
            // Resolve file path for this entity
            let filePath: string | null = null;
            for (const cat of categories) {
                const p = path.join(dataDir, cat, ensureJsonExt(change.target_id));
                if (await fileService.exists(p)) {
                    filePath = p;
                    break;
                }
            }
            if (!filePath && change.category) {
                filePath = path.join(dataDir, change.category, ensureJsonExt(change.target_id));
            }
            if (!filePath) {
                logger.warn(`Could not find file for ${change.target_id}, skipping rollback.`);
                continue;
            }

            // --- Slim diff rollback (new format) ---
            // Detect slim patch by change_type (always present) OR diffs array
            if (change.change_type || (change.diffs && Array.isArray(change.diffs) && change.diffs.length > 0)) {
                if (change.change_type === 'add') {
                    // Entity was added → rollback = delete it
                    if (await fileService.exists(filePath)) {
                        await fileService.deleteFile(filePath);
                    }
                    invertedChanges.push({
                        ...change,
                        change_type: 'delete',
                        diffs: (change.diffs || []).map(d => ({ ...d, lhs: d.rhs, rhs: d.lhs })),
                        name: `Revert: ${change.name}`,
                        reason: `Rollback of ${originalPatch.title}`
                    });
                } else if (change.change_type === 'delete') {
                    // Entity was deleted → can't fully reconstruct from diffs alone
                    // Log warning — user should restore from backup
                    logger.warn(`Cannot fully rollback deletion of ${change.target_id} from diffs alone. Restore from backup.`);
                    invertedChanges.push({
                        ...change,
                        change_type: 'add',
                        diffs: (change.diffs || []).map(d => ({ ...d, lhs: d.rhs, rhs: d.lhs })),
                        name: `Revert: ${change.name}`,
                        reason: `Rollback of ${originalPatch.title} (manual restore may be needed)`
                    });
                } else {
                    // Edit → read current file, apply inverse diffs
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    let content: any = {};
                    if (await fileService.exists(filePath)) {
                        content = await fileService.readJson(filePath);
                    }

                    if (change.diffs) {
                        for (const d of change.diffs) {
                            if (!d.path || d.path.length === 0) continue;
                            this.applyInverseDiff(content, d);
                        }
                    }

                    await fileService.writeJson(filePath, sortKeys(content));
                    invertedChanges.push({
                        ...change,
                        diffs: (change.diffs || []).map(d => ({ ...d, lhs: d.rhs, rhs: d.lhs })),
                        name: `Revert: ${change.name}`,
                        reason: `Rollback of ${originalPatch.title}`
                    });
                }
            }
            // --- Legacy rollback (old/new format) ---
            else if (change.old !== undefined || change.new !== undefined) {
                const inverted: Change = {
                    ...change,
                    old: change.new,
                    new: change.old,
                    name: `Revert: ${change.name}`,
                    reason: `Rollback of ${originalPatch.title}`
                };
                invertedChanges.push(inverted);

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let content: any = {};
                if (await fileService.exists(filePath)) content = await fileService.readJson(filePath);

                if (inverted.new === undefined && (inverted.field === 'ROOT' || !inverted.field)) {
                    await fileService.deleteFile(filePath);
                } else if (inverted.old === undefined && (inverted.field === 'ROOT' || !inverted.field)) {
                    content = inverted.new;
                    await fileService.writeJson(filePath, content);
                } else {
                    if (content) content = this.applyChangeToObject(content, inverted.field, inverted.new);
                    await fileService.writeJson(filePath, sortKeys(content));
                }
            } else {
                logger.warn(`Change for ${change.target_id} has neither diffs nor old/new — skipping.`);
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
        await fileService.writeJson(patchesFile, sortKeys(patches));

        // Publish static API files (changelog, timeline) if community-api
        const publishedFiles = await publisherService.publishIfNeeded(dataDir);

        // Stage only patchesFile + the entity files we actually reverted
        const touchedFiles = [patchesFile, ...publishedFiles];
        for (const change of originalPatch.changes) {
            const cat = change.category;
            if (cat) {
                touchedFiles.push(path.join(dataDir, cat, ensureJsonExt(change.target_id)));
            }
        }

        await this.gitService.commitPatch(dataDir, revertPatch, `[ROLLBACK] ${originalPatch.title}`, touchedFiles);
        auditLogger.logAction(dataDir, 'PATCH_ROLLBACK', { originalId: id, revertId: revertPatch.id });
        
        return revertPatch;
    }

    /**
     * Applies the inverse of a single deep-diff entry to an object.
     * Supports N (new→delete), D (deleted→restore), E (edit→revert), A (array).
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private applyInverseDiff(obj: any, d: any): void {
        if (!d.path || d.path.length === 0) return;

        // Navigate to parent
        let current = obj;
        for (let i = 0; i < d.path.length - 1; i++) {
            const key = d.path[i];
            if (current[key] === undefined || current[key] === null) {
                current[key] = typeof d.path[i + 1] === 'number' ? [] : {};
            }
            current = current[key];
        }

        const lastKey = d.path[d.path.length - 1];

        switch (d.kind) {
            case 'E': // Edit → revert to old value
                current[lastKey] = d.lhs;
                break;
            case 'N': // New field → delete it
                delete current[lastKey];
                break;
            case 'D': // Deleted field → restore it
                current[lastKey] = d.lhs;
                break;
            case 'A': // Array change → apply inverse recursively
                if (d.item) {
                    if (d.item.kind === 'N') {
                        // Item was added → remove it
                        if (Array.isArray(current[lastKey])) {
                            current[lastKey].splice(d.index, 1);
                        }
                    } else if (d.item.kind === 'D') {
                        // Item was deleted → add it back
                        if (Array.isArray(current[lastKey])) {
                            current[lastKey].splice(d.index, 0, d.item.lhs);
                        }
                    } else if (d.item.kind === 'E') {
                        // Item was edited → revert
                        if (Array.isArray(current[lastKey])) {
                            current[lastKey][d.index] = d.item.lhs;
                        }
                    }
                }
                break;
        }
    }

    private static readonly DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

    private applyChangeToObject(obj: Record<string, unknown>, pathStr: string, value: unknown): Record<string, unknown> {
        if (!pathStr || pathStr === 'ROOT') return value as Record<string, unknown>;
        
        const parts = pathStr.split('.');

        // SECURITY: Reject paths that target prototype chain
        if (parts.some(p => PatchService.DANGEROUS_KEYS.has(p))) {
            logger.warn(`[Security] Blocked prototype pollution attempt via path: ${pathStr}`);
            return obj;
        }

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


    /**
     * Calculates the diff between old and new data and adds it to the queue.
     */
    async enqueueEntityChange(dataDir: string, newData: unknown, category: string, filename: string): Promise<void> {
        return queueService.enqueueEntityChange(dataDir, newData, category, filename);
    }
}

export const patchService = new PatchService();
