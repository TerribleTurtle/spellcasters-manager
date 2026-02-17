import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFileService } = vi.hoisted(() => ({
    mockFileService: {
        writeJson: vi.fn().mockResolvedValue(undefined),
        ensureDir: vi.fn().mockResolvedValue(undefined)
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
    });

    it('does nothing for empty patches array', async () => {
        await service.publish('/api', []);

        expect(mockFileService.writeJson).not.toHaveBeenCalled();
    });

    it('generates changelog.json and changelog_latest.json', async () => {
        const patches = [createPatch()];

        await service.publish('/api', patches);

        // changelog.json
        expect(mockFileService.writeJson).toHaveBeenCalledWith(
            expect.stringContaining('changelog.json'),
            expect.any(Array)
        );

        // changelog_latest.json
        expect(mockFileService.writeJson).toHaveBeenCalledWith(
            expect.stringContaining('changelog_latest.json'),
            expect.any(Object)
        );
    });

    it('generates balance_index.json with correct structure', async () => {
        const patches = [createPatch({
            changes: [
                createChange({ target_id: 'u1.json', balance_direction: 'nerf' })
            ]
        })];

        await service.publish('/api', patches);

        // Find the balance_index call
        const balanceCall = mockFileService.writeJson.mock.calls.find(
            (c: unknown[]) => (c[0] as string).includes('balance_index.json')
        );
        expect(balanceCall).toBeDefined();
        const balanceIndex = balanceCall![1] as { patch_version: string; entities: Record<string, string> };
        expect(balanceIndex.patch_version).toBe('1.0.1');
        expect(balanceIndex.entities['u1.json']).toBe('nerf');
    });

    describe('balance direction tagging logic', () => {
        it('tags entity as nerf when any change is nerf', async () => {
            const patches = [createPatch({
                changes: [
                    createChange({ target_id: 'u1.json', balance_direction: 'buff' }),
                    createChange({ target_id: 'u1.json', balance_direction: 'nerf' })
                ]
            })];

            await service.publish('/api', patches);

            const balanceCall = mockFileService.writeJson.mock.calls.find(
                (c: unknown[]) => (c[0] as string).includes('balance_index.json')
            );
            const balanceIndex = balanceCall![1] as { entities: Record<string, string> };
            // nerf takes priority over buff
            expect(balanceIndex.entities['u1.json']).toBe('nerf');
        });

        it('tags entity as buff when direction is buff only', async () => {
            const patches = [createPatch({
                changes: [
                    createChange({ target_id: 'u1.json', balance_direction: 'buff' })
                ]
            })];

            await service.publish('/api', patches);

            const balanceCall = mockFileService.writeJson.mock.calls.find(
                (c: unknown[]) => (c[0] as string).includes('balance_index.json')
            );
            const balanceIndex = balanceCall![1] as { entities: Record<string, string> };
            expect(balanceIndex.entities['u1.json']).toBe('buff');
        });

        it('tags entity as rework when no balance_direction is set', async () => {
            const patches = [createPatch({
                changes: [
                    createChange({ target_id: 'u1.json', balance_direction: undefined })
                ]
            })];

            await service.publish('/api', patches);

            const balanceCall = mockFileService.writeJson.mock.calls.find(
                (c: unknown[]) => (c[0] as string).includes('balance_index.json')
            );
            const balanceIndex = balanceCall![1] as { entities: Record<string, string> };
            expect(balanceIndex.entities['u1.json']).toBe('rework');
        });
    });

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

        // Should have written timeline files for both entities
        const timelineCalls = mockFileService.writeJson.mock.calls.filter(
            (c: unknown[]) => (c[0] as string).includes('timeline')
        );
        expect(timelineCalls.length).toBe(2);
    });

    it('throws when fileService fails', async () => {
        mockFileService.writeJson.mockRejectedValueOnce(new Error('Disk full'));

        await expect(service.publish('/api', [createPatch()])).rejects.toThrow('Disk full');
    });
});
