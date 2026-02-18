import { z } from "zod";

// --- Enums ---
export const UnitTypeSchema = z.enum(['Unit', 'Titan', 'Structure']);
export type UnitType = z.infer<typeof UnitTypeSchema>;

export const CategorySchema = z.enum(['Creature', 'Building', 'Spell', 'Consumable', 'Spellcaster', 'Titan']);
export type Category = z.infer<typeof CategorySchema>;

export const MagicSchoolSchema = z.enum([
  'Elemental', 'Wild', 'War', 'Astral', 'Holy', 
  'Technomancy', 'Necromancy', 'Titan', 
  'Dark', 'Frost', 'Lightning'
]);
export type MagicSchool = z.infer<typeof MagicSchoolSchema>;

export const RankSchema = z.enum(['I', 'II', 'III', 'IV', 'V']);
export type Rank = z.infer<typeof RankSchema>;

export const MovementTypeSchema = z.enum(['Ground', 'Flying', 'Hover']);
export type MovementType = z.infer<typeof MovementTypeSchema>;

export const HeroClassSchema = z.enum(['Duelist', 'Conqueror', 'Enchanter']);
export type HeroClass = z.infer<typeof HeroClassSchema>;

export const EffectTypeSchema = z.enum(['Heal', 'Charge_Refill', 'Buff', 'Capture']);
export type EffectType = z.infer<typeof EffectTypeSchema>;

export const BuffTargetSchema = z.enum(['Damage', 'Defense', 'Health', 'Speed', 'Range']);
export type BuffTarget = z.infer<typeof BuffTargetSchema>;

export const SizeSchema = z.enum(['Small', 'Medium', 'Large']);
export type Size = z.infer<typeof SizeSchema>;

export const RaritySchema = z.enum(['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']); // Still needed? API doesn't have it on consumable.
// Wait, ConsumableSchema had it. API doesn't. Strict alignment means we should probably remove it from ConsumableSchema later.
// But keeping the enum definition here doesn't hurt if we remove usage.

export const PatchTypeSchema = z.enum(['Patch', 'Hotfix', 'Content']);
export type PatchType = z.infer<typeof PatchTypeSchema>;
