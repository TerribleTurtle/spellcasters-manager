import { describe, it, expect } from 'vitest';
import { abilitiesToArrayFormat, abilitiesToObjectFormat } from '../../src/domain/abilityTransformer';

describe('abilityTransformer', () => {
    describe('abilitiesToArrayFormat', () => {
        it('returns empty array for null/undefined', () => {
            expect(abilitiesToArrayFormat(null)).toEqual([]);
            expect(abilitiesToArrayFormat(undefined)).toEqual([]);
        });

        it('returns array as-is if already an array', () => {
            const arr = [{ name: 'Fireball', type: 'Primary' }];
            expect(abilitiesToArrayFormat(arr)).toEqual(arr);
        });

        it('converts legacy object format to array with defaults injected', () => {
            const legacy = {
                passive: [{ name: 'Aura', description: 'Heals' }],
                primary: { name: 'Strike', damage: 10 },
                defense: { name: 'Shield', cooldown: 5 },
                ultimate: { name: 'Meteor', mana: 100 }
            };

            const result = abilitiesToArrayFormat(legacy);

            expect(result).toEqual([
                { name: 'Aura', description: 'Heals', type: 'Passive', mana_cost: 0, cooldown: 0 },
                { name: 'Strike', damage: 10, type: 'Primary', mana_cost: 0, cooldown: 0 },
                { name: 'Shield', cooldown: 5, type: 'Defense', mana_cost: 0 },
                { name: 'Meteor', mana: 100, type: 'Ultimate', mana_cost: 0, cooldown: 0 }
            ]);
        });

        it('handles legacy data with secondary ability', () => {
            const legacy = {
                passive: [],
                primary: { name: 'Slash' },
                secondary: { name: 'Stab' },
                defense: null,
                ultimate: null
            };

            const result = abilitiesToArrayFormat(legacy);

            expect(result).toHaveLength(2); // primary + secondary (no passive items, defense/ultimate null)
            expect(result[1]).toMatchObject({ name: 'Stab', type: 'Secondary' });
        });

        it('skips null/undefined ability slots gracefully', () => {
            const legacy = {
                passive: [],
                primary: null,
                defense: undefined,
                ultimate: { name: 'Nuke' }
            };

            const result = abilitiesToArrayFormat(legacy);
            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({ name: 'Nuke', type: 'Ultimate' });
        });
    });

    describe('abilitiesToObjectFormat', () => {
        it('returns input as-is if not an array', () => {
            const obj = { passive: [], primary: {} };
            expect(abilitiesToObjectFormat(obj as unknown as unknown[])).toEqual(obj);
        });

        it('converts array to object format and strips injected defaults', () => {
            const input = [
                { name: 'Aura', type: 'Passive', mana_cost: 0, cooldown: 0 },
                { name: 'Strike', type: 'Primary', damage: 10, mana_cost: 0, cooldown: 0 },
                { name: 'Shield', type: 'Defense', cooldown: 5 },
                { name: 'Meteor', type: 'Ultimate', mana: 100, mana_cost: 0, cooldown: 0 }
            ];

            const result = abilitiesToObjectFormat(input);

            expect(result).toEqual({
                passive: [{ name: 'Aura' }],
                primary: { name: 'Strike', damage: 10 },
                defense: { name: 'Shield', cooldown: 5 },
                ultimate: { name: 'Meteor', mana: 100 }
            });
        });

        it('strips empty mechanics.features injected by normalizeHero', () => {
            const input = [
                { name: 'Slash', type: 'Primary', mana_cost: 0, cooldown: 0, mechanics: { features: [] } }
            ];

            const result = abilitiesToObjectFormat(input) as Record<string, unknown>;

            // mechanics should be completely stripped (features was empty, mechanics becomes empty)
            expect(result.primary).toEqual({ name: 'Slash' });
        });

        it('preserves non-empty mechanics.features', () => {
            const input = [
                { name: 'Slash', type: 'Primary', mana_cost: 0, cooldown: 0, mechanics: { features: ['cleave'], knockback: true } }
            ];

            const result = abilitiesToObjectFormat(input) as Record<string, unknown>;

            expect((result.primary as Record<string, unknown>).mechanics).toEqual({
                features: ['cleave'],
                knockback: true
            });
        });

        it('handles duplicate type slots by routing to other', () => {
            const input = [
                { name: 'Strike1', type: 'Primary', mana_cost: 0, cooldown: 0 },
                { name: 'Strike2', type: 'Primary', mana_cost: 0, cooldown: 0 }
            ];

            const result = abilitiesToObjectFormat(input) as Record<string, unknown>;

            expect(result.primary).toEqual({ name: 'Strike1' });
            expect(result.other).toEqual([{ name: 'Strike2' }]);
        });
    });

    describe('round-trip fidelity', () => {
        it('object -> array -> object produces identical output', () => {
            const original = {
                passive: [{ name: 'Aura', description: 'Heals nearby' }],
                primary: { name: 'Strike', damage: 10 },
                defense: { name: 'Shield', cooldown: 5 },
                ultimate: { name: 'Meteor', mana: 100 }
            };

            const asArray = abilitiesToArrayFormat(original);
            const backToObject = abilitiesToObjectFormat(asArray);

            expect(backToObject).toEqual(original);
        });
    });
});
