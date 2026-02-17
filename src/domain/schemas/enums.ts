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

export const BalanceDirectionSchema = z.enum(['buff', 'nerf', 'rework', 'fix']);
export type BalanceDirection = z.infer<typeof BalanceDirectionSchema>;
