
import { describe, it, expect } from 'vitest';
import { buildSlimChange } from '../../server/utils/slimChange';

describe('buildSlimChange normalization', () => {
    it('should produce slim diffs when abilities change from Object to Array format', () => {
        // Legacy format (Object-based abilities) — what's on disk
        const oldData = {
            name: 'Test Hero',
            health: 300,
            abilities: {
                passive: [{ name: 'P1', description: 'D1' }],
                primary: { name: 'Fireball', damage: 28 },
                defense: { name: 'Shield', cooldown: 8 },
                ultimate: { name: 'Nova', description: 'Big boom' }
            }
        };

        // New format (Array-based abilities) — what the editor produces
        const newData = {
            name: 'Test Hero',
            health: 300,
            abilities: [
                { name: 'P1', description: 'D1', type: 'Passive', mana_cost: 0, cooldown: 0 },
                { name: 'Fireball', damage: 32, type: 'Primary', mana_cost: 0, cooldown: 0 }, // damage changed 28→32
                { name: 'Shield', cooldown: 8, type: 'Defense', mana_cost: 0 },
                { name: 'Nova', description: 'Big boom', type: 'Ultimate', mana_cost: 0, cooldown: 0 }
            ]
        };

        const change = buildSlimChange('test_hero.json', 'Test Hero', 'entity', 'heroes', oldData, newData);

        // Should NOT have old/new snapshots
        expect(change.old).toBeUndefined();
        expect(change.new).toBeUndefined();

        // Should have diffs, and they should be small (just the damage change)
        expect(change.diffs).toBeDefined();
        expect(change.diffs!.length).toBeLessThanOrEqual(3);
        
        // Verify the damage change is captured
        const damageDiff = change.diffs!.find(
            d => d.path?.includes('damage') || 
                 (d.path?.includes('abilities') && d.lhs === 28 && d.rhs === 32)
        );
        expect(damageDiff).toBeDefined();
    });

    it('should produce minimal diffs when only format changes (Object→Array, same content)', () => {
        // Legacy format
        const oldData = {
            name: 'Test Hero',
            abilities: {
                passive: [{ name: 'P1', description: 'D1' }],
                primary: { name: 'Fireball', damage: 28 }
            }
        };

        // Same content in Array format (includes extra metadata fields from normalization)
        const newData = {
            name: 'Test Hero',
            abilities: [
                { name: 'P1', description: 'D1', type: 'Passive', mana_cost: 0, cooldown: 0 },
                { name: 'Fireball', damage: 28, type: 'Primary', mana_cost: 0, cooldown: 0 }
            ]
        };

        const change = buildSlimChange('test_hero.json', 'Test Hero', 'entity', 'heroes', oldData, newData);

        // Format conversion may produce small residual diffs from normalization
        // metadata (type, mana_cost, cooldown) that exist in array format but not object format.
        // The key invariant: no VALUE diffs on shared fields like name/damage.
        expect(change.diffs).toBeDefined();
        expect(change.diffs!.length).toBeLessThanOrEqual(3);
    });

    it('should still produce correct diffs for non-ability fields', () => {
        const oldData = { name: 'Test Hero', health: 300, difficulty: 2 };
        const newData = { name: 'Test Hero', health: 350, difficulty: 3 };

        const change = buildSlimChange('test_hero.json', 'Test Hero', 'entity', 'heroes', oldData, newData);

        expect(change.diffs).toBeDefined();
        expect(change.diffs!.length).toBe(2); // health + difficulty
        expect(change.old).toBeUndefined();
        expect(change.new).toBeUndefined();
    });
});
