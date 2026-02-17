import { z } from "zod";

// --- Enums ---
export const UnitTypeSchema = z.enum(['Unit', 'Titan', 'Structure']);
export type UnitType = z.infer<typeof UnitTypeSchema>;

export const CategorySchema = z.enum(['Creature', 'Building', 'Spell', 'Consumable', 'Spellcaster', 'Titan']);
export type Category = z.infer<typeof CategorySchema>;

export const MagicSchoolSchema = z.enum(['Astral', 'Elemental', 'Holy', 'Necromancy', 'Technomancy', 'War', 'Wild', 'Titan']);
export type MagicSchool = z.infer<typeof MagicSchoolSchema>;

export const RankSchema = z.enum(['I', 'II', 'III', 'IV', 'V']);
export type Rank = z.infer<typeof RankSchema>;

export const MovementTypeSchema = z.enum(['Ground', 'Flying', 'Hover']);
export type MovementType = z.infer<typeof MovementTypeSchema>;

export const HeroClassSchema = z.enum(['Duelist', 'Conqueror', 'Enchanter']);
export type HeroClass = z.infer<typeof HeroClassSchema>;

export const EffectTypeSchema = z.enum(['Heal', 'Buff', 'Capture', 'Charge_Refill', 'Shield', 'Damage']);
export type EffectType = z.infer<typeof EffectTypeSchema>;

export const RaritySchema = z.enum(['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']);
export type Rarity = z.infer<typeof RaritySchema>;

export const PatchTypeSchema = z.enum(['Patch', 'Hotfix', 'Content']);
export type PatchType = z.infer<typeof PatchTypeSchema>;

export const AppModeSchema = z.enum(['dev', 'live']);
export type AppMode = z.infer<typeof AppModeSchema>;

// --- Unit ---
export const UnitSchema = z.object({
  // Core Identifiers
  id: z.string().optional(), 
  entity_id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  
  // Categorization
  type: UnitTypeSchema.optional(),
  category: CategorySchema.optional(),
  magic_school: MagicSchoolSchema.optional(),
  
  // Progression
  tier: z.coerce.number().min(1).max(5).optional(),
  rank: RankSchema.optional(),

  // Meta
  description: z.string().optional(),
  icon: z.string().optional(),
  image_required: z.boolean().optional(),
  tags: z.array(z.string()).optional(),

  // Combat Stats
  health: z.coerce.number().min(1).optional(),
  damage: z.coerce.number().min(0).optional(),
  range: z.coerce.number().min(0).optional(),
  dps: z.coerce.number().min(0).optional(),
  attack_interval: z.coerce.number().min(0).optional(),
  cost: z.coerce.number().min(0).optional(),

  // Movement
  movement_speed: z.coerce.number().min(0).optional(),
  movement_type: MovementTypeSchema.optional(),

  // Timing
  charges: z.coerce.number().min(0).optional(),
  recharge_time: z.coerce.number().min(0).optional(),
  cast_time: z.coerce.number().min(0).optional(),
  population: z.coerce.number().min(0).optional(),

  // Titan-specific
  passive_health_regen: z.coerce.number().min(0).optional(),
  heal_amount: z.coerce.number().min(0).optional(),
  
  // Complex (handled by custom panels, not TableEditor)
  mechanics: z.record(z.string(), z.any()).optional(),
  changelog: z.array(z.any()).optional(),
  last_modified: z.string().optional(),
  
  // Schema ref
  $schema: z.string().optional(),
});
export type Unit = z.infer<typeof UnitSchema>;

// --- Hero ---
export const HeroSchema = UnitSchema.extend({
  hero_class: HeroClassSchema.optional(),
  difficulty: z.coerce.number().min(1).max(3).optional(),
  abilities: z.array(z.any()).optional(),
  ultimate_ability: z.any().optional(),
});
export type Hero = z.infer<typeof HeroSchema>;

// --- Consumable (Item) ---
export const ConsumableSchema = z.object({
  id: z.string().optional(),
  entity_id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  category: CategorySchema.optional(),
  
  // Game Data
  effect_type: EffectTypeSchema.optional(),
  value: z.coerce.number().optional(),
  duration: z.coerce.number().min(0).optional(),
  cooldown: z.coerce.number().min(0).optional(),
  rarity: RaritySchema.optional(),
  stack_size: z.coerce.number().min(1).optional(),
  buff_target: z.string().optional(),
  
  cost: z.coerce.number().min(0).optional(),
  image_required: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  mechanics: z.record(z.string(), z.any()).optional(),
  changelog: z.array(z.any()).optional(),
  last_modified: z.string().optional(),
  $schema: z.string().optional(),
});
export type Consumable = z.infer<typeof ConsumableSchema>;

// --- Balance Direction ---
export const BalanceDirectionSchema = z.enum(['buff', 'nerf', 'rework', 'fix']);
export type BalanceDirection = z.infer<typeof BalanceDirectionSchema>;

// --- Patch / Changes ---
export const ChangeSchema = z.object({
  target_id: z.string(),
  name: z.string(),
  field: z.string(),
  old: z.any(),
  new: z.any(),
  // Version History Fields
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  reason: z.string().optional(),
  balance_direction: BalanceDirectionSchema.optional(),
});
export type Change = z.infer<typeof ChangeSchema>;

export const PatchSchema = z.object({
  id: z.string(),
  version: z.string(),
  type: PatchTypeSchema,
  title: z.string(),
  date: z.string(),
  tags: z.array(z.string()).optional(),
  changes: z.array(ChangeSchema),
  diff: z.string().optional(),
});
export type Patch = z.infer<typeof PatchSchema>;

// --- API Responses ---
export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
}
