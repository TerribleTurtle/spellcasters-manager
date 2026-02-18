
import { describe, it, expect } from 'vitest';
import { UnitSchema, HeroSchema, ConsumableSchema } from '@/domain/schemas';
import { UNIT_FIELD_CONFIG, HERO_FIELD_CONFIG, SPELL_FIELD_CONFIG, CONSUMABLE_FIELD_CONFIG, SchemaFieldsConfig } from '@/domain/schemaToFields';
import { ZodObject, ZodOptional, ZodTypeAny } from 'zod';

// Helper to get all keys from a ZodObject
function getSchemaKeys(schema: ZodObject<any>): string[] {
    return Object.keys(schema.shape);
}

// Fields handled by custom panels or system logic, not TableEditor
const KNOWN_PANEL_FIELDS = [
    'mechanics', // MechanicsPanel
    'tags',      // TagsPanel
    'abilities', // HeroAbilitiesPanel
    'ultimate_ability', // HeroAbilitiesPanel
    'icon',      // UnitHeaderPanel
    'name',      // UnitHeaderPanel
    'description', // TableEditor (but often separate in UI design, though currently in TableEditor)
    'id',        // System
    'entity_id', // System
    '$schema',   // System
    'changelog', // HistoryPanel
    'last_modified', // System
    'image_required', // System
    'type',      // System/Discriminator
    'game_version', // System
];

describe('Editor Field Coverage Audit', () => {

    function audit(entityName: string, schema: ZodObject<any>, config: SchemaFieldsConfig, prefix = ''): string[] {
        const schemaFields = getSchemaKeys(schema);
        const configuredFields = new Set([
            ...(config.exclude || []),
            ...(config.order || []),
            ...Object.keys(config.labels || {}),
        ]);

        const missing: string[] = [];

        schemaFields.forEach(field => {
            const fullPath = prefix ? `${prefix}.${field}` : field;
            
            // Check 1: Is it explicitly configured/excluded?
            if (configuredFields.has(field)) return;
            
            // Check 2: Is it a known panel field?
            if (KNOWN_PANEL_FIELDS.includes(field)) return;

            // Check 3: Is it nested?
            const shape = schema.shape[field];
            let inner = shape;
            if (inner instanceof ZodOptional || inner instanceof ZodTypeAny && 'unwrap' in inner) {
                 // basic unwrap attempt, though Zod types vary
                 inner = (inner as any)._def.innerType || inner;
            }

            if (inner instanceof ZodObject) {
                // It's a nested object (e.g. 'mechanics' if it wasn't a record, but here mechanics is Record)
                // If the PARENT is not configured, we dive in. 
                // BUT if the parent isn't in 'order' or 'exclude', it's technically unconfigured ITSELF.
                // So we log the parent as missing.
                missing.push(fullPath); 
            } else {
                // It's a leaf field (string, number, array, record)
                // If not in config/panels, it's missing.
                missing.push(fullPath);
            }
        });

        if (missing.length > 0 && !prefix) {
            console.warn(`\n[${entityName}] The following fields are NOT explicitly configured (ordered or excluded):`);
            missing.forEach(f => console.warn(` - ${f}`));
        } else if (!prefix) {
            console.log(`\n[${entityName}] All fields covered via config or known panels.`);
        }

        return missing;
    }

    it('audits Unit Editor coverage', () => {
        const missing = audit('Unit', UnitSchema, UNIT_FIELD_CONFIG);
        expect(missing).toEqual([]); 
    });

    it('audits Hero Editor coverage', () => {
        const missing = audit('Hero', HeroSchema, HERO_FIELD_CONFIG);
        expect(missing).toEqual([]);
    });

    it('audits Spell Editor coverage', () => {
        // Spell uses UnitSchema but matches SPELL_FIELD_CONFIG
        const missing = audit('Spell', UnitSchema, SPELL_FIELD_CONFIG);
        expect(missing).toEqual([]);
    });

    it('audits Item Editor coverage', () => {
        const missing = audit('Item', ConsumableSchema, CONSUMABLE_FIELD_CONFIG);
        expect(missing).toEqual([]);
    });
});
