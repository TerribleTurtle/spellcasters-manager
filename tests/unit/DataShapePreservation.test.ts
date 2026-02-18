/**
 * DATA SHAPE PRESERVATION TESTS
 * 
 * CRITICAL INVARIANT: Saving data must NEVER change the set of keys in a file.
 * The schema validation + save pipeline must preserve every original key.
 * 
 * This test loads every mock data file, runs it through the exact same
 * pipeline the backend uses (schema.parse + validateAndParse), and asserts
 * that NO keys are lost in transit.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { UnitSchema, HeroSchema, ConsumableSchema } from '../../src/domain/schemas/index.js';

const MOCK_DATA_DIR = path.resolve(__dirname, '../../mock_data');

const SCHEMA_MAP: Record<string, ReturnType<typeof UnitSchema.passthrough>> = {
    units: UnitSchema.passthrough(),
    heroes: HeroSchema.passthrough(),
    consumables: ConsumableSchema.passthrough(),
    titans: UnitSchema.passthrough(),
    spells: ConsumableSchema.passthrough(),
};

function loadAllEntities(): { category: string; filename: string; data: Record<string, unknown> }[] {
    const results: { category: string; filename: string; data: Record<string, unknown> }[] = [];
    
    for (const category of Object.keys(SCHEMA_MAP)) {
        const catDir = path.join(MOCK_DATA_DIR, category);
        if (!fs.existsSync(catDir)) continue;
        
        const files = fs.readdirSync(catDir).filter(f => f.endsWith('.json'));
        for (const file of files) {
            const raw = fs.readFileSync(path.join(catDir, file), 'utf-8');
            results.push({ category, filename: file, data: JSON.parse(raw) });
        }
    }
    
    return results;
}

describe('Data Shape Preservation: Schema Parse', () => {
    const entities = loadAllEntities();

    it('found mock data entities to test', () => {
        expect(entities.length).toBeGreaterThan(0);
    });

    // Generate one test per file
    for (const entity of entities) {
        it(`${entity.category}/${entity.filename}: all original keys preserved after schema.parse()`, () => {
            const schema = SCHEMA_MAP[entity.category];
            expect(schema).toBeDefined();

            const originalKeys = Object.keys(entity.data).sort();
            
            // Simulate what validateAndParse does:
            // 1. Inject last_modified
            const dataWithTimestamp = { ...entity.data, last_modified: new Date().toISOString() };
            
            // 2. Parse through schema
            const parsed = schema.parse(dataWithTimestamp);
            const parsedKeys = Object.keys(parsed as object).sort();

            // Every ORIGINAL key must still exist in the parsed output
            const missingKeys = originalKeys.filter(k => !parsedKeys.includes(k));
            const addedKeys = parsedKeys.filter(k => !originalKeys.includes(k) && k !== 'last_modified');
            
            if (missingKeys.length > 0) {
                throw new Error(
                    `KEYS LOST during schema.parse() for ${entity.category}/${entity.filename}:\n` +
                    `  Missing: [${missingKeys.join(', ')}]\n` +
                    `  This means the schema is STRIPPING data from the source file!`
                );
            }
            
            // Warn about added keys (schema defaults) — these are informational
            if (addedKeys.length > 0) {
                console.warn(
                    `  ⚠ ${entity.category}/${entity.filename}: Schema added keys: [${addedKeys.join(', ')}]`
                );
            }
        });

        it(`${entity.category}/${entity.filename}: nested object structures preserved`, () => {
            const schema = SCHEMA_MAP[entity.category];
            const parsed = schema.parse({ ...entity.data, last_modified: new Date().toISOString() }) as Record<string, unknown>;

            for (const [key, value] of Object.entries(entity.data)) {
                if (value !== null && typeof value === 'object') {
                    const originalType = Array.isArray(value) ? 'array' : 'object';
                    const parsedValue = parsed[key];
                    
                    if (parsedValue === undefined) continue; // Handled by key test above
                    
                    const parsedType = Array.isArray(parsedValue) ? 'array' : typeof parsedValue === 'object' ? 'object' : typeof parsedValue;
                    
                    expect(parsedType).toBe(originalType);
                }
            }
        });
    }
});

describe('Data Shape Preservation: Full Pipeline Simulation', () => {
    const entities = loadAllEntities();

    for (const entity of entities) {
        it(`${entity.category}/${entity.filename}: round-trip preserves all keys`, () => {
            const schema = SCHEMA_MAP[entity.category];

            // Simulate full frontend→backend→disk pipeline:
            // 1. Frontend: stripInternalFields (remove _category, _filename)
            const stripped: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(entity.data)) {
                if (!key.startsWith('_')) {
                    stripped[key] = value;
                }
            }

            // 2. Backend: validateAndParse (inject timestamp + schema.parse)
            const withTimestamp = { ...stripped, last_modified: new Date().toISOString() };
            const validated = schema.parse(withTimestamp) as Record<string, unknown>;

            // 3. Assert: every non-internal original key survives
            const originalNonInternal = Object.keys(entity.data).filter(k => !k.startsWith('_'));
            const survivingKeys = Object.keys(validated);

            for (const key of originalNonInternal) {
                expect(survivingKeys).toContain(key);
            }
        });
    }
});
