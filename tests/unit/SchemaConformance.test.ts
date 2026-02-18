
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { UnitSchema, ConsumableSchema, SpellSchema } from '../../src/domain/schemas';
import { MagicSchoolSchema, EffectTypeSchema, BuffTargetSchema, SizeSchema } from '../../src/domain/schemas/enums';




function getEnumValues(schemaPath: string, refPath?: string): string[] {
    if (!fs.existsSync(schemaPath)) {
        return [];
    }
    const content = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
    if (!refPath) {
         return [];
    }
    
    const defs = content.definitions;
    if (defs && defs[refPath]) {
        return defs[refPath].enum;
    }
    return [];
}

describe('Schema Conformance', () => {
    const SCHEMAS_DIR = path.resolve(__dirname, '../../schemas/v2');
    const DEFS_DIR = path.resolve(SCHEMAS_DIR, 'definitions');
    const ENUMS_FILE = path.resolve(DEFS_DIR, 'enums.schema.json');
    const MAGIC_FILE = path.resolve(DEFS_DIR, 'magic.schema.json');

    describe('Enums Alignment', () => {
        it('MagicSchool matches definitions/magic.schema.json', () => {
            const jsonEnums = getEnumValues(MAGIC_FILE, 'magic_school');
            const zodEnums = MagicSchoolSchema.options;
            expect(zodEnums.sort()).toEqual(jsonEnums.sort());
        });

        it('EffectType matches definitions/enums.schema.json', () => {
             const jsonEnums = getEnumValues(ENUMS_FILE, 'consumable_effect_enum');
             const zodEnums = EffectTypeSchema.options;
             expect(zodEnums.sort()).toEqual(jsonEnums.sort());
        });

        it('BuffTarget matches consumables.schema.json properties', () => {
             const file = path.resolve(SCHEMAS_DIR, 'consumables.schema.json');
             const content = JSON.parse(fs.readFileSync(file, 'utf-8'));
             const jsonEnums = content.properties.buff_target.enum;
             const zodEnums = BuffTargetSchema.options;
             expect(zodEnums.sort()).toEqual(jsonEnums.sort());
        });

        it('Size matches definitions/enums.schema.json', () => {
            const jsonEnums = getEnumValues(ENUMS_FILE, 'size_enum');
            const zodEnums = SizeSchema.options;
            expect(zodEnums.sort()).toEqual(jsonEnums.sort());
        });
    });

    describe('Zod Schema Field Presence', () => {
        it('UnitSchema does NOT contain tier or cost', () => {
            const shape = UnitSchema.shape;
            expect(shape).not.toHaveProperty('tier');
            expect(shape).not.toHaveProperty('cost');
        });

        it('UnitSchema DOES contain size', () => {
            const shape = UnitSchema.shape;
            expect(shape).toHaveProperty('size');
        });

        it('ConsumableSchema does NOT contain rarity, cooldown, cost', () => {
             const shape = ConsumableSchema.shape;
             expect(shape).not.toHaveProperty('rarity');
             expect(shape).not.toHaveProperty('cooldown');
             expect(shape).not.toHaveProperty('cost');
        });

        it('SpellSchema matches expected structure', () => {
            const shape = SpellSchema.shape;
            expect(shape).toHaveProperty('magic_school');
            expect(shape).toHaveProperty('cooldown'); 
            expect(shape).toHaveProperty('charges');
            expect(shape).not.toHaveProperty('tier'); 
        });
    });

    describe('Full Property Coverage', () => {
        function getAllProperties(schemaPath: string): string[] {
            const keys = new Set<string>();

            // Helper to find a definition within a loaded JSON object using a #/ pointer
            function resolveLocal(ref: string, root: any): any {
                const parts = ref.split('/').filter(p => p && p !== '#');
                let current = root;
                for (const part of parts) {
                    if (current.definitions && current.definitions[part]) {
                        current = current.definitions[part];
                    } else if (current[part]) {
                        current = current[part];
                    } else {
                        return null;
                    }
                }
                return current;
            }

            function visit(obj: any, currentDir: string, rootSchema: any) {
                if (!obj) return;
                
                if (obj.properties) {
                    Object.keys(obj.properties).forEach(k => keys.add(k));
                }
                
                if (obj.allOf) {
                    obj.allOf.forEach((item: any) => visit(item, currentDir, rootSchema));
                }
                
                if (obj.$ref) {
                    const ref = obj.$ref as string;
                    if (ref.startsWith('#')) {
                        // Local ref: resolve against the CURRENT root schema
                        const resolved = resolveLocal(ref, rootSchema);
                        visit(resolved, currentDir, rootSchema);
                    } else {
                        // File ref: load new file, which becomes the NEW root for its own local refs
                        const [file, pointer] = ref.split('#');
                        const filePath = path.resolve(currentDir, file);
                        
                        if (fs.existsSync(filePath)) {
                            const newContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                            const newDir = path.dirname(filePath);
                            
                            if (pointer) {
                                const resolved = resolveLocal(pointer, newContent);
                                visit(resolved, newDir, newContent);
                            } else {
                                visit(newContent, newDir, newContent);
                            }
                        }
                    }
                }
            }

            const initialContent = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
            visit(initialContent, path.dirname(schemaPath), initialContent);
            return Array.from(keys);
        }

        it('UnitSchema contains all fields from units.schema.json', () => {
            const jsonFields = getAllProperties(path.resolve(SCHEMAS_DIR, 'units.schema.json'));
            const zodShape = UnitSchema.shape;
            const zodFields = Object.keys(zodShape);
            
            // Sanity check to ensure we are actually finding inherited props
            expect(jsonFields).toContain('damage'); // inherited from stats/combat
            expect(jsonFields).toContain('description'); // inherited from core/identity

            const missingInZod = jsonFields.filter(f => !zodFields.includes(f) && f !== 'mechanics'); 
            expect(missingInZod).toEqual([]);
        });

        it('ConsumableSchema contains all fields from consumables.schema.json', () => {
            const jsonFields = getAllProperties(path.resolve(SCHEMAS_DIR, 'consumables.schema.json'));
            const zodShape = ConsumableSchema.shape;
            const zodFields = Object.keys(zodShape);
            
            const missingInZod = jsonFields.filter(f => !zodFields.includes(f) && f !== 'mechanics');
            expect(missingInZod).toEqual([]);
        });

        it('SpellSchema contains all fields from spells.schema.json', () => {
            const jsonFields = getAllProperties(path.resolve(SCHEMAS_DIR, 'spells.schema.json'));
            const zodShape = SpellSchema.shape;
            const zodFields = Object.keys(zodShape);
            
            const missingInZod = jsonFields.filter(f => !zodFields.includes(f) && f !== 'mechanics');
            expect(missingInZod).toEqual([]);
        });
    });
});

