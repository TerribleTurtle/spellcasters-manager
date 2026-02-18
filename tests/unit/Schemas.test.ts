
import { describe, it, expect } from 'vitest';
import { UnitSchema, HeroSchema, ConsumableSchema, PatchSchema, ChangeSchema } from '../../src/domain/schemas';

describe('Domain Schemas', () => {
    describe('UnitSchema', () => {
        it('validates a correct unit object', () => {
            const validUnit = {
                id: 'u1',
                name: 'Test Unit',
                tier: 1,
                health: 100,
                damage: 10,
                type: 'Unit'
            };
            const result = UnitSchema.safeParse(validUnit);
            expect(result.success).toBe(true);
        });

        it('fails when required fields are missing', () => {
            const invalidUnit = { tier: 1 };
            const result = UnitSchema.safeParse(invalidUnit);
            expect(result.success).toBe(false);
        });
    });

    describe('HeroSchema', () => {
        it('validates a correct hero', () => {
            const hero = {
                name: 'Hero 1',
                type: 'Unit', // Inherited
                hero_class: 'Duelist',
                difficulty: 2,
                health: 500
            };
            const result = HeroSchema.safeParse(hero);
            expect(result.success).toBe(true);
        });

        it('enforces difficulty range (1-3)', () => {
            const invalidHero = { name: 'H', difficulty: 5 };
            const result = HeroSchema.safeParse(invalidHero);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('difficulty');
            }
        });

        it('validates hero_class enum', () => {
            const invalidHero = { name: 'H', hero_class: 'InvalidClass' };
            const result = HeroSchema.safeParse(invalidHero);
            expect(result.success).toBe(false);
        });
    });

    describe('ConsumableSchema', () => {
        it('validates a correct consumable', () => {
            const item = {
                name: 'Potion',
                effect_type: 'Heal',
                stack_size: 5,
                duration: 10
            };
            const result = ConsumableSchema.safeParse(item);
            expect(result.success).toBe(true);
        });

        it('enforces stack_size min 1', () => {
            const invalidItem = { name: 'P', stack_size: 0 };
            const result = ConsumableSchema.safeParse(invalidItem);
            expect(result.success).toBe(false);
        });
    });

    describe('Patch & Change Schema', () => {
        it('validates a correct patch', () => {
            const patch = {
                id: 'p1',
                version: '1.0.0',
                type: 'Patch',
                title: 'Balance Update',
                date: '2023-01-01',
                changes: [
                    { target_id: 'u1', name: 'Unit 1', field: 'damage', old: 10, new: 15 }
                ]
            };
            const result = PatchSchema.safeParse(patch);
            expect(result.success).toBe(true);
        });

        it('validates change object structure', () => {
            const invalidChange = { target_id: 'u1' }; // Missing name, field, old, new
            const result = ChangeSchema.safeParse(invalidChange);
            expect(result.success).toBe(false);
        });
    });
});
