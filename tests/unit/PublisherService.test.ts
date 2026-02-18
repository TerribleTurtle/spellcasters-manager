import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFileService } = vi.hoisted(() => ({
    mockFileService: {
        writeJson: vi.fn().mockResolvedValue(undefined),
        ensureDir: vi.fn().mockResolvedValue(undefined),
        exists: vi.fn().mockResolvedValue(false),
        listFiles: vi.fn().mockResolvedValue([]),
        deleteFile: vi.fn().mockResolvedValue(undefined),
        readJson: vi.fn().mockResolvedValue([])
    }
}));

vi.mock('../../server/services/fileService.js', () => ({ fileService: mockFileService }));
vi.mock('../../server/utils/logger.js', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

import { PublisherService } from '../../server/services/publisherService';
import type { Patch, Change } from '../../src/domain/schemas/index';

function createChange(overrides: Partial<Change> = {}): Change {
    return {
        target_id: 'unit1.json',
        name: 'Test Unit',
        field: 'damage',
        old: 10,
        new: 15,
        category: 'units',
        ...overrides
    };
}

function createPatch(overrides: Partial<Patch> = {}): Patch {
    return {
        id: 'p1',
        title: 'Balance Pass',
        version: '1.0.1',
        type: 'Balance',
        date: '2024-01-15',
        tags: ['balance'],
        changes: [createChange()],
        ...overrides
    };
}

describe('PublisherService', () => {
    let service: PublisherService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new PublisherService();
        mockFileService.listFiles.mockResolvedValue([]);
        mockFileService.exists.mockResolvedValue(false);
    });

    it('does nothing for empty patches array', async () => {
        await service.publish('/api', []);
        expect(mockFileService.writeJson).not.toHaveBeenCalled();
    });

    // ── Paginated Changelog ──────────────────────────────────────────

    it('writes changelog_page_1.json and changelog_index.json for a small set', async () => {
        const patches = [createPatch()];
        await service.publish('/api', patches);

        // Page file
        expect(mockFileService.writeJson).toHaveBeenCalledWith(
            expect.stringContaining('changelog_page_1.json'),
            expect.any(Array)
        );

        // Index manifest
        const indexCall = mockFileService.writeJson.mock.calls.find(
            (c: unknown[]) => (c[0] as string).includes('changelog_index.json')
        );
        expect(indexCall).toBeDefined();
        const index = indexCall![1] as { total_patches: number; page_size: number; total_pages: number; pages: string[] };
        expect(index.total_patches).toBe(1);
        expect(index.total_pages).toBe(1);
        expect(index.pages).toEqual(['changelog_page_1.json']);
    });

    it('paginates 120 patches into 3 page files', async () => {
        const patches: Patch[] = [];
        for (let i = 0; i < 120; i++) {
            patches.push(createPatch({ id: `p${i}`, version: `1.0.${i}` }));
        }

        await service.publish('/api', patches);

        // Should have page 1, 2, 3
        for (let page = 1; page <= 3; page++) {
            expect(mockFileService.writeJson).toHaveBeenCalledWith(
                expect.stringContaining(`changelog_page_${page}.json`),
                expect.any(Array)
            );
        }

        // Index should reflect 3 pages
        const indexCall = mockFileService.writeJson.mock.calls.find(
            (c: unknown[]) => (c[0] as string).includes('changelog_index.json')
        );
        const index = indexCall![1] as { total_patches: number; total_pages: number; pages: string[] };
        expect(index.total_patches).toBe(120);
        expect(index.total_pages).toBe(3);
        expect(index.pages).toHaveLength(3);
    });

    it('cleans up orphaned page files before writing new ones', async () => {
        // Simulate 5 old page files existing
        mockFileService.listFiles.mockResolvedValue([
            'changelog_page_1.json',
            'changelog_page_2.json',
            'changelog_page_3.json',
            'changelog_page_4.json',
            'changelog_page_5.json',
            'other_file.json'  // Should NOT be deleted
        ]);

        const patches = [createPatch()]; // Only 1 page needed now
        await service.publish('/api', patches);

        // All 5 old pages should be deleted
        expect(mockFileService.deleteFile).toHaveBeenCalledTimes(5);
        // 'other_file.json' should NOT be deleted
        expect(mockFileService.deleteFile).not.toHaveBeenCalledWith(
            expect.stringContaining('other_file.json')
        );
    });

    // ── changelog_latest.json ────────────────────────────────────────

    it('writes changelog_latest.json', async () => {
        const patches = [createPatch()];
        await service.publish('/api', patches);

        expect(mockFileService.writeJson).toHaveBeenCalledWith(
            expect.stringContaining('changelog_latest.json'),
            expect.any(Object)
        );
    });

    // ── Timeline ─────────────────────────────────────────────────────

    it('generates timeline files per entity', async () => {
        const patches = [createPatch({
            changes: [
                createChange({ target_id: 'u1.json', new: { damage: 15 } }),
                createChange({ target_id: 'u2.json', new: { hp: 200 } })
            ]
        })];

        await service.publish('/api', patches);

        expect(mockFileService.ensureDir).toHaveBeenCalledWith(
            expect.stringContaining('timeline')
        );

        const timelineCalls = mockFileService.writeJson.mock.calls.filter(
            (c: unknown[]) => (c[0] as string).includes('timeline')
        );
        expect(timelineCalls.length).toBe(2);
    });

    // ── Error Handling ───────────────────────────────────────────────

    it('throws when fileService fails', async () => {
        mockFileService.listFiles.mockRejectedValueOnce(new Error('Disk full'));
        await expect(service.publish('/api', [createPatch()])).rejects.toThrow('Disk full');
    });

    // ── publishIfNeeded ──────────────────────────────────────────────

    it('skips publish for non-community-api directories', async () => {
        await service.publishIfNeeded('/some/local/data');
        expect(mockFileService.writeJson).not.toHaveBeenCalled();
    });

    it('publishes when dataDir is in community-api', async () => {
        const dataDir = '/projects/spellcasters-community-api/data';
        const patches = [createPatch()];

        mockFileService.exists.mockResolvedValue(true);
        mockFileService.readJson.mockResolvedValue(patches);

        await service.publishIfNeeded(dataDir);

        // Should have written changelog files
        expect(mockFileService.writeJson).toHaveBeenCalledWith(
            expect.stringContaining('changelog_index.json'),
            expect.any(Object)
        );
    });

    it('does not throw when publishIfNeeded encounters errors', async () => {
        const dataDir = '/projects/spellcasters-community-api/data';

        mockFileService.exists.mockResolvedValue(true);
        mockFileService.readJson.mockRejectedValueOnce(new Error('Read failed'));

        // Should NOT throw — and should return empty array
        const result = await service.publishIfNeeded(dataDir);
        expect(result).toEqual([]);
    });

    // ── Return Values & Double Extension Fix ─────────────────────────

    it('returns list of all written file paths', async () => {
        const patches = [createPatch({
            changes: [createChange({ target_id: 'hero1.json', new: { hp: 100 } })]
        })];

        const writtenFiles = await service.publish('/api', patches);

        // Should include: changelog_page_1, changelog_index, changelog_latest, timeline/hero1
        expect(writtenFiles.length).toBeGreaterThanOrEqual(4);
        expect(writtenFiles.some(f => f.includes('changelog_page_1.json'))).toBe(true);
        expect(writtenFiles.some(f => f.includes('changelog_index.json'))).toBe(true);
        expect(writtenFiles.some(f => f.includes('changelog_latest.json'))).toBe(true);
        expect(writtenFiles.some(f => f.includes('timeline'))).toBe(true);
    });

    it('does not produce double .json.json extensions on timeline files', async () => {
        const patches = [createPatch({
            changes: [createChange({ target_id: 'unit1.json', new: { damage: 20 } })]
        })];

        await service.publish('/api', patches);

        const timelineCalls = mockFileService.writeJson.mock.calls.filter(
            (c: unknown[]) => (c[0] as string).includes('timeline')
        );
        expect(timelineCalls.length).toBe(1);

        const timelinePath = timelineCalls[0][0] as string;
        // Should be timeline/unit1.json, NOT timeline/unit1.json.json
        expect(timelinePath).toMatch(/timeline[/\\]unit1\.json$/);
        expect(timelinePath).not.toMatch(/\.json\.json$/);
    });

    it('returns empty array for empty patches', async () => {
        const result = await service.publish('/api', []);
        expect(result).toEqual([]);
    });
});
