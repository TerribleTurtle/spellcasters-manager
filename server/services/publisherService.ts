import path from 'path';
import { fileService } from './fileService.js';
import { Patch } from '../../src/domain/schemas/index.js';
import { stripInternalFields } from '../../src/domain/utils.js';
import { logger } from '../utils/logger.js';

/** Maximum patches per changelog page file. */
const CHANGELOG_PAGE_SIZE = 50;

export class PublisherService {
    /**
     * Convenience wrapper: loads patches.json and publishes static files
     * **only** when the data directory belongs to the community API repo.
     *
     * Safe to call from any save/delete path — it no-ops for local data dirs.
     */
    async publishIfNeeded(dataDir: string): Promise<string[]> {
        // Allow both the official community-api repo AND the local manager repo (for dev/testing)
        // Check is case-insensitive to handle Windows paths or user inconsistencies
        const lowerDir = dataDir.toLowerCase();
        if (!lowerDir.includes('spellcasters-community-api') && !lowerDir.includes('spellcasters-manager')) {
            return [];
        }

        try {
            const apiRoot = path.resolve(dataDir, '..');
            const patchesFile = path.join(dataDir, 'patches.json');

            if (!(await fileService.exists(patchesFile))) return [];

            const patches = await fileService.readJson<Patch[]>(patchesFile);
            return await this.publish(apiRoot, patches);
        } catch (err) {
            // Never let publishing failures break the primary save path
            logger.error('publishIfNeeded failed (non-fatal):', { error: err });
            return [];
        }
    }

    /**
     * Generates static API files from the patch history.
     *
     * Output (matches community-api schemas/v2):
     *   - changelog_index.json        — pagination manifest
     *   - changelog_page_N.json       — paginated patch arrays
     *   - changelog_latest.json       — most recent patch entry
     *   - timeline/{entity_id}.json   — per-entity stat snapshots
     */
    async publish(apiRoot: string, patches: Patch[]): Promise<string[]> {
        if (!patches || patches.length === 0) return [];

        try {
            const writtenFiles: string[] = [];
            const sanitizedPatches = stripInternalFields(patches);

            // ── 1. Paginated Changelog ──────────────────────────────────
            writtenFiles.push(...await this.writeChangelogPages(apiRoot, sanitizedPatches));

            // ── 2. changelog.json (full array — standard endpoint) ───────
            const changelogFile = path.join(apiRoot, 'changelog.json');
            await fileService.writeJson(changelogFile, sanitizedPatches);
            writtenFiles.push(changelogFile);

            // ── 3. changelog_latest.json ────────────────────────────────
            if (sanitizedPatches.length > 0) {
                const latestFile = path.join(apiRoot, 'changelog_latest.json');
                await fileService.writeJson(latestFile, sanitizedPatches[0]);
                writtenFiles.push(latestFile);
            }

            // ── 3. Timeline ────────────────────────────────────────────
            writtenFiles.push(...await this.writeTimeline(apiRoot, patches));

            logger.info(`Published static files for version ${patches[0].version}`);
            return writtenFiles;
        } catch (error) {
            logger.error('Static File Gen Error:', { error });
            throw error;
        }
    }

    // ── Changelog Pagination ────────────────────────────────────────────

    /**
     * Splits patches into page files and writes a changelog_index.json manifest.
     * Cleans up orphaned page files from previous runs before writing.
     */
    private async writeChangelogPages(apiRoot: string, sanitizedPatches: unknown[]): Promise<string[]> {
        const writtenFiles: string[] = [];
        const totalPatches = sanitizedPatches.length;
        const totalPages = Math.max(1, Math.ceil(totalPatches / CHANGELOG_PAGE_SIZE));

        // Clean up old page files before writing new ones
        await this.removeOrphanedPages(apiRoot);

        // Write page files
        const pageFilenames: string[] = [];
        for (let page = 1; page <= totalPages; page++) {
            const start = (page - 1) * CHANGELOG_PAGE_SIZE;
            const end = start + CHANGELOG_PAGE_SIZE;
            const pageData = sanitizedPatches.slice(start, end);
            const filename = `changelog_page_${page}.json`;
            const fullPath = path.join(apiRoot, filename);

            await fileService.writeJson(fullPath, pageData);
            pageFilenames.push(filename);
            writtenFiles.push(fullPath);
        }

        // Write the index manifest
        const index = {
            total_patches: totalPatches,
            page_size: CHANGELOG_PAGE_SIZE,
            total_pages: totalPages,
            pages: pageFilenames
        };
        const indexPath = path.join(apiRoot, 'changelog_index.json');
        await fileService.writeJson(indexPath, index);
        writtenFiles.push(indexPath);
        return writtenFiles;
    }

    /**
     * Removes any existing changelog_page_*.json files to prevent stale data.
     */
    private async removeOrphanedPages(apiRoot: string): Promise<void> {
        const files = await fileService.listFiles(apiRoot, ['.json']);
        const pageFiles = files.filter(f => /^changelog_page_\d+\.json$/.test(f));

        for (const file of pageFiles) {
            await fileService.deleteFile(path.join(apiRoot, file));
        }
    }

    // ── Timeline ────────────────────────────────────────────────────────

    /**
     * Builds per-entity timeline files with stat snapshots at each patch version.
     */
    private async writeTimeline(apiRoot: string, patches: Patch[]): Promise<string[]> {
        const writtenFiles: string[] = [];
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
                if (exists) continue;

                // Slim patches: read entity from disk (change.new is not stored)
                // Legacy patches: use change.new as fallback
                let snapshot: unknown = null;
                if (change.new) {
                    snapshot = stripInternalFields(change.new);
                } else if (change.category && change.change_type !== 'delete') {
                    const entityPath = path.join(apiRoot, 'data', change.category, change.target_id);
                    try {
                        if (await fileService.exists(entityPath)) {
                            const entityData = await fileService.readJson(entityPath);
                            snapshot = stripInternalFields(entityData);
                        }
                    } catch {
                        logger.warn(`Could not read entity for timeline: ${entityPath}`);
                    }
                }

                if (snapshot) {
                    // Strip changelog from snapshot — patch data lives in patches.json only
                    if (typeof snapshot === 'object' && snapshot !== null && 'changelog' in snapshot) {
                        delete (snapshot as Record<string, unknown>).changelog;
                    }
                    timelineMap[change.target_id].push({
                        version: patch.version,
                        date: patch.date,
                        snapshot
                    });
                }
            }
        }

        for (const [id, history] of Object.entries(timelineMap)) {
            // Strip existing .json extension to prevent double extensions (target_id = "unit1.json")
            const basename = id.replace(/\.json$/i, '');
            const filePath = path.join(timelineDir, `${basename}.json`);
            await fileService.writeJson(filePath, history);
            writtenFiles.push(filePath);
        }
        return writtenFiles;
    }
}

export const publisherService = new PublisherService();
