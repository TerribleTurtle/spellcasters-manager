
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { schemaToFields } from '../../src/domain/schemaToFields';

describe('schemaToFields', () => {
    it('converts ZodString to text input', () => {
        const schema = z.object({ name: z.string() });
        const fields = schemaToFields(schema);
        expect(fields).toHaveLength(1);
        expect(fields[0]).toMatchObject({
            name: 'name',
            type: 'text',
            required: true,
            label: 'Name'
        });
    });

    it('converts ZodNumber to number input', () => {
        const schema = z.object({ 
            age: z.number().min(0).max(100)
        });
        const fields = schemaToFields(schema);
        expect(fields[0]).toMatchObject({
            name: 'age',
            type: 'number',
            min: 0,
            max: 100
        });
    });

    it('converts ZodEnum to select', () => {
        const schema = z.object({
            role: z.enum(['Admin', 'User'])
        });
        const fields = schemaToFields(schema);
        expect(fields[0]).toMatchObject({
            name: 'role',
            type: 'select',
            options: ['Admin', 'User']
        });
    });

    it('handles ZodOptional correctly (required=false)', () => {
        const schema = z.object({
            bio: z.string().optional()
        });
        const fields = schemaToFields(schema);
        expect(fields[0].required).toBe(false);
    });

    it('applies configuration: exclude', () => {
        const schema = z.object({ id: z.string(), name: z.string() });
        const fields = schemaToFields(schema, { exclude: ['id'] });
        expect(fields).toHaveLength(1);
        expect(fields[0].name).toBe('name');
    });

    it('applies configuration: label override', () => {
        const schema = z.object({ dps: z.number() });
        const fields = schemaToFields(schema, { labels: { dps: 'Damage Per Second' } });
        expect(fields[0].label).toBe('Damage Per Second');
    });

    it('applies configuration: ordering', () => {
        const schema = z.object({ a: z.string(), b: z.string(), c: z.string() });
        const fields = schemaToFields(schema, { order: ['c', 'a'] }); // b is unordered
        // Expected: c, a, b
        expect(fields[0].name).toBe('c');
        expect(fields[1].name).toBe('a');
        expect(fields[2].name).toBe('b');
    });

    it('auto-labels fields using title case', () => {
        const schema = z.object({ first_name: z.string() });
        const fields = schemaToFields(schema);
        expect(fields[0].label).toBe('First Name');
    });

    it('handles known acronyms in auto-labeling', () => {
        const schema = z.object({ dps: z.number(), hp: z.number() });
        const fields = schemaToFields(schema);
        const labels = fields.map(f => f.label);
        expect(labels).toContain('DPS');
        expect(labels).toContain('HP');
    });
});
