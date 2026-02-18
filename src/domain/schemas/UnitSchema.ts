import { z } from "zod";
import {
  UnitTypeSchema,
  CategorySchema,
  MagicSchoolSchema,
  RankSchema,
  MovementTypeSchema,
  HeroClassSchema,
  SizeSchema,
} from "./enums.js";

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
  // tier: removed (strict alignment)
  rank: RankSchema.optional(),
  size: SizeSchema.optional(),

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
  // cost: removed (strict alignment)

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
  last_modified: z.string().optional(),
  game_version: z.string().optional(),

  // Schema ref
  $schema: z.string().optional(),
});
export type Unit = z.infer<typeof UnitSchema>;

// --- Hero ---
// abilities accepts BOTH formats to preserve legacy data shape:
//   Array format (new):  [{ name, type, ... }, ...]
//   Object format (legacy): { passive: [...], primary: {...}, defense: {...}, ultimate: {...} }
export const HeroSchema = UnitSchema.extend({
  hero_class: HeroClassSchema.optional(),
  class: z.string().optional(), // Legacy field — preserved on disk, mapped to hero_class in editor
  difficulty: z.coerce.number().min(1).max(3).optional(),
  abilities: z
    .union([z.array(z.any()), z.record(z.string(), z.any())])
    .optional(),
  ultimate_ability: z.any().optional(),
});
export type Hero = z.infer<typeof HeroSchema>;
