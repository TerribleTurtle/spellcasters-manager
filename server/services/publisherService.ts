import path from 'path';
import { fileService } from './fileService.js';
import { Patch, Change } from '../../src/domain/schemas/index.js';
import { stripInternalFields } from '../../src/domain/utils.js';
import { logger } from '../utils/logger.js';

export class PublisherService {
    /**
     * Generates static API files from the patch history.
     * - changelog.json
     * - changelog_latest.json
     * - balance_index.json
     * - timeline/*.json
     */
    async publish(apiRoot: string, patches: Patch[]): Promise<void> {
        if (!patches || patches.length === 0) return;

        try {
            // 1. changelog.json
            const sanitizedPatches = stripInternalFields(patches);
            await fileService.writeJson(path.join(apiRoot, 'changelog.json'), sanitizedPatches);

            // 2. changelog_latest.json
            if (sanitizedPatches.length > 0) {
                await fileService.writeJson(path.join(apiRoot, 'changelog_latest.json'), sanitizedPatches[0]);
            }

            // 3. balance_index.json
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

            // 4. timeline
            const timelineDir = path.join(apiRoot, 'timeline');
            await fileService.ensureDir(timelineDir);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const timelineMap: Record<string, any[]> = {};
            // Checks for existence of version in timelineMap prevents duplicates if multiple changes for same entity in one patch?
            // Yes.

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

            logger.info(`Published static files for version ${latest.version}`);

        } catch (error) {
            logger.error("Static File Gen Error:", { error });
            throw error; // Let caller decide, or swallow? Original swallowed in commitPatch.
            // But here we might want to throw or log.
        }
    }
}

export const publisherService = new PublisherService();
