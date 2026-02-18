
import { describe, it, expect } from 'vitest';
import { normalizeForDiff, normalizeAbilities, denormalizeAbilities } from '../../src/domain/diff-utils';

describe('diff-utils', () => {
    describe('normalizeAbilities (Legacy -> Array)', () => {
        it('should return empty array for null/undefined', () => {
            expect(normalizeAbilities(null)).toEqual([]);
            expect(normalizeAbilities(undefined)).toEqual([]);
        });

        it('should return array as-is if already an array', () => {
            const arr = [{ name: 'Fireball', type: 'Primary' }];
            expect(normalizeAbilities(arr)).toEqual(arr);
        });

        it('should convert legacy object format to array', () => {
            const legacy = {
                passive: [
                    { name: 'P1', description: 'D1' }
                ],
                primary: { name: 'Pri', damage: 10 },
                defense: { name: 'Def', cooldown: 5 },
                ultimate: { name: 'Ult', mana: 100 }
            };

            const expected = [
                { name: 'P1', description: 'D1', type: 'Passive', mana_cost: 0, cooldown: 0 },
                { name: 'Pri', damage: 10, type: 'Primary', mana_cost: 0, cooldown: 0 },
                { name: 'Def', cooldown: 5, type: 'Defense', mana_cost: 0 },
                { name: 'Ult', mana: 100, type: 'Ultimate', mana_cost: 0, cooldown: 0 }
            ];

            expect(normalizeAbilities(legacy)).toEqual(expected);
        });
    });

    describe('denormalizeAbilities (Array -> Object)', () => {
        it('should convert array format back to object and strip injected defaults', () => {
            const input = [
                { name: 'P1', type: 'Passive', description: 'D1', mana_cost: 0, cooldown: 0 },
                { name: 'Pri', type: 'Primary', damage: 10, mana_cost: 0, cooldown: 0 },
                { name: 'Def', type: 'Defense', cooldown: 5 },
                { name: 'Ult', type: 'Ultimate', mana: 100, mana_cost: 0, cooldown: 0 }
            ];

            const expected = {
                passive: [{ name: 'P1', description: 'D1' }],
                primary: { name: 'Pri', damage: 10 },
                defense: { name: 'Def', cooldown: 5 },  // cooldown: 5 preserved (non-zero)
                ultimate: { name: 'Ult', mana: 100 }
            };

            expect(denormalizeAbilities(input)).toEqual(expected);
        });

        it('should handle undefined/null entries gracefully', () => {
            const input = [
                null,
                { name: 'P1', type: 'Passive' }
            ];
            const expected = {
                passive: [{ name: 'P1' }],
                primary: {},
                defense: {},
                ultimate: {}
            };
            expect(denormalizeAbilities(input)).toEqual(expected);
        });
    });

    describe('normalizeForDiff (Target: Object)', () => {
        it('should normalize Array-based abilities TO Object-based (for clean diffs)', () => {
            const hero = {
                name: 'Test Hero',
                abilities: [
                    { name: 'Pri', type: 'Primary', mana_cost: 0, cooldown: 0 }
                ]
            };

            const expected = {
                name: 'Test Hero',
                abilities: {
                    passive: [],
                    primary: { name: 'Pri' },
                    defense: {},
                    ultimate: {}
                }
            };

            expect(normalizeForDiff(hero)).toEqual(expected);
        });

        it('should leave Object-based abilities as-is (already normalized)', () => {
            const hero = {
                name: 'Test Hero',
                abilities: {
                    passive: [],
                    primary: { name: 'Pri' },
                    defense: {},
                    ultimate: {}
                }
            };

            expect(normalizeForDiff(hero)).toEqual(hero);
        });

        it('should leave other fields untouched', () => {
            const unit = {
                name: 'Grunt',
                health: 100
            };
            expect(normalizeForDiff(unit)).toEqual(unit);
        });
    });
});
