import { z } from 'zod';
import { UnitSchema, HeroSchema, ConsumableSchema } from '../domain/schemas/index.js';

export interface EntityConfig {
    folder: string;           // API folder name: 'units', 'heroes', etc.
    schema: z.ZodTypeAny;     // Zod validation schema
    singularLabel: string;    // "Unit", "Hero", "Item"
}

export const ENTITY_REGISTRY: Record<string, EntityConfig> = {
    units:       { folder: 'units',       schema: UnitSchema.passthrough(),       singularLabel: 'Unit' },
    heroes:      { folder: 'heroes',      schema: HeroSchema.passthrough(),       singularLabel: 'Hero' },
    spells:      { folder: 'spells',      schema: ConsumableSchema.passthrough(), singularLabel: 'Spell' },
    consumables: { folder: 'consumables', schema: ConsumableSchema.passthrough(), singularLabel: 'Item' },
    titans:      { folder: 'titans',      schema: UnitSchema.passthrough(),       singularLabel: 'Titan' },
};

export const CATEGORY_KEYS = Object.keys(ENTITY_REGISTRY) as Array<keyof typeof ENTITY_REGISTRY>;
export type EntityCategory = typeof CATEGORY_KEYS[number];

// Convenience helpers
export const getSchemaForCategory = (category: string) => ENTITY_REGISTRY[category]?.schema;
export const getRegisteredCategories = () => CATEGORY_KEYS;
export const getFolderForCategory = (category: string) => ENTITY_REGISTRY[category]?.folder;
