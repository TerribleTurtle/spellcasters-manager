import { ZodObject, ZodOptional, ZodDefault, ZodEnum, ZodNumber, ZodString, ZodBoolean, ZodArray, ZodRecord, ZodAny, ZodTypeAny } from "zod";
import type { EditorField } from "@/components/editors/TableEditor";

/**
 * Configuration for schemaToFields — controls exclusions, labels, ordering, and descriptions.
 */
export interface SchemaFieldsConfig {
  /** Field names to exclude from the editor (e.g. 'id', '$schema', 'mechanics') */
  exclude?: string[];
  /** Override labels: { field_name: "Display Label" } */
  labels?: Record<string, string>;
  /** Override descriptions: { field_name: "Helper text" } */
  descriptions?: Record<string, string>;
  /** Custom ordering — fields appear in this order, unlisted fields come after */
  order?: string[];
}

/**
 * Unwrap optional and default wrappers to get the inner Zod type.
 */
function unwrap(schema: ZodTypeAny): ZodTypeAny {
  if (schema instanceof ZodOptional || schema instanceof ZodDefault) {
    return unwrap((schema as ZodOptional<ZodTypeAny> | ZodDefault<ZodTypeAny>)._def.innerType);
  }
  return schema;
}

/**
 * Extract min/max/step from ZodNumber checks array.
 */
function extractNumberConstraints(schema: ZodNumber): { min?: number; max?: number; step?: number } {
  const result: { min?: number; max?: number; step?: number } = {};
  
  // Zod 4 direct properties
  const unknownSchema = schema as unknown as Record<string, unknown>;
  if (unknownSchema.minValue !== undefined && unknownSchema.minValue !== null) result.min = unknownSchema.minValue as number;
  if (unknownSchema.maxValue !== undefined && unknownSchema.maxValue !== null) result.max = unknownSchema.maxValue as number;
  if (unknownSchema.step !== undefined && typeof unknownSchema.step !== 'function') result.step = unknownSchema.step as number;

  // Zod 3 fallback (checks array)
  for (const check of (schema._def.checks || [])) {
    const unknownCheck = check as unknown as Record<string, unknown>;
    if (unknownCheck.kind === 'min') result.min = unknownCheck.value as number;
    if (unknownCheck.kind === 'max') result.max = unknownCheck.value as number;
    if (unknownCheck.kind === 'multipleOf') result.step = unknownCheck.value as number;
  }
  return result;
}

/**
 * Convert a field name to a human-readable label.
 * e.g. "movement_speed" → "Movement Speed", "dps" → "DPS"
 */
function fieldNameToLabel(name: string): string {
  // Special acronyms
  const acronyms: Record<string, string> = {
    dps: 'DPS',
    id: 'ID',
    hp: 'HP',
  };
  if (acronyms[name]) return acronyms[name];

  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Walk a ZodObject schema and emit an EditorField[] array.
 * 
 * - `z.enum()`        → select dropdown with options
 * - `z.number()`      → number input with min/max
 * - `z.string()`      → text input
 * - `z.boolean()`     → excluded (or future checkbox)
 * - `z.array/record`  → excluded (complex types handled elsewhere)
 */
export function schemaToFields(
  schema: ZodObject<Record<string, ZodTypeAny>>,
  config: SchemaFieldsConfig = {}
): EditorField[] {
  const { exclude = [], labels = {}, descriptions = {}, order = [] } = config;
  const shape = schema.shape;
  const fields: EditorField[] = [];

  for (const [name, rawType] of Object.entries(shape)) {
    // Skip excluded fields
    if (exclude.includes(name)) continue;

    // Determine if this field is required (not wrapped in ZodOptional)
    const isRequired = !(rawType instanceof ZodOptional);
    const inner = unwrap(rawType as ZodTypeAny);

    // Skip complex types — they need custom panels
    if (inner instanceof ZodArray || inner instanceof ZodRecord || inner instanceof ZodAny || inner instanceof ZodBoolean) {
      continue;
    }

    const label = labels[name] || fieldNameToLabel(name);
    const description = descriptions[name];

    // Enum → Select dropdown
    if (inner instanceof ZodEnum) {
      fields.push({
        label,
        name,
        type: 'select',
        required: isRequired,
        options: inner.options as string[],
        description,
      });
      continue;
    }



    // Number → Number input
    if (inner instanceof ZodNumber) {
      const constraints = extractNumberConstraints(inner);
      fields.push({
        label,
        name,
        type: 'number',
        required: isRequired,
        ...constraints,
        description,
      });
      continue;
    }

    // String → Text input (fallback)
    if (inner instanceof ZodString) {
      fields.push({
        label,
        name,
        type: 'text',
        required: isRequired,
        description,
      });
      continue;
    }
  }

  // Apply custom ordering
  if (order.length > 0) {
    fields.sort((a, b) => {
      const aIdx = order.indexOf(a.name);
      const bIdx = order.indexOf(b.name);
      // Both in order list → sort by order position
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      // Only one in order list → it comes first
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      // Neither → keep original position
      return 0;
    });
  }

  return fields;
}

// --- Field exclusion sets for each entity type ---

/** Fields handled by custom panels or not user-editable */
const SYSTEM_FIELDS = [
  '$schema', 'id', 'entity_id', 'name', 'icon',
  'mechanics', 'tags',
  'image_required', 'last_modified',
];

export const UNIT_FIELD_CONFIG: SchemaFieldsConfig = {
  exclude: [...SYSTEM_FIELDS, 'type'],
  labels: {
    movement_speed: 'Speed',
    movement_type: 'Move Type',
    attack_interval: 'Atk Interval',
    recharge_time: 'Recharge (s)',
    cast_time: 'Cast Time (s)',
    passive_health_regen: 'Passive Regen',
    heal_amount: 'Heal Amount',
  },
  order: [
    'category', 'magic_school', 'rank', 'size', 'population',
    'health', 'damage', 'dps', 'attack_interval', 'range',
    'movement_speed', 'movement_type',
    'charges', 'recharge_time', 'cast_time',
    'passive_health_regen', 'heal_amount',
    'description',
  ],
};

export const HERO_FIELD_CONFIG: SchemaFieldsConfig = {
  exclude: [
    ...SYSTEM_FIELDS, 'type', 'abilities', 'ultimate_ability',
    'magic_school', 'passive_health_regen', 'heal_amount', 'class', 'size'
  ],
  labels: {
    hero_class: 'Class',
    movement_speed: 'Speed',
    movement_type: 'Move Type',
    attack_interval: 'Atk Interval',
    recharge_time: 'Recharge (s)',
    cast_time: 'Cast Time (s)',
  },
  order: [
    'hero_class', 'category', 'difficulty', 'rank', 'population',
    'health', 'damage', 'dps', 'attack_interval', 'range',
    'movement_speed', 'movement_type',
    'charges', 'recharge_time', 'cast_time',
    'description',
  ],
};

export const CONSUMABLE_FIELD_CONFIG: SchemaFieldsConfig = {
  exclude: [...SYSTEM_FIELDS, 'mechanics'],
  labels: {
    effect_type: 'Effect',
    stack_size: 'Max Stack',
    buff_target: 'Buff Target',
  },
  order: [
    'category', 'effect_type',
    'value', 'duration', 'stack_size',
    'buff_target',
    'description',
  ],
};

export const SPELL_FIELD_CONFIG: SchemaFieldsConfig = {
  exclude: [
    ...SYSTEM_FIELDS, 'type',
    'health', 'movement_speed', 'movement_type', 'population',
    'passive_health_regen', 'heal_amount', 'size',
  ],
  labels: {
    magic_school: 'School',
    attack_interval: 'Interval',
    recharge_time: 'Recharge (s)',
    cast_time: 'Cast Time (s)',
  },
  order: [
    'category', 'magic_school', 'rank',
    'damage', 'dps', 'range', 'radius',
    'value', 'duration', 'cooldown',
    'charges', 'recharge_time', 'cast_time',
    'description',
  ],
};
