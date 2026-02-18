import { z } from "zod";
import { CategorySchema, MagicSchoolSchema, RankSchema } from "./enums.js";

// --- Spell ---
export const SpellSchema = z.object({
  // Core Identifiers (inherited from core.schema.json#/definitions/identity)
  id: z.string().optional(),
  entity_id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),

  // Categorization
  category: CategorySchema.optional(), // Enforced "Spell" in valid data, but optional in partials
  
  // Magic Props (inherited from magic.schema.json)
  magic_school: MagicSchoolSchema.optional(),
  rank: RankSchema.optional(),

  // Resource Cost (inherited from resource.schema.json)
  charges: z.coerce.number().min(0).optional(),
  recharge_time: z.coerce.number().min(0).optional(),
  cast_time: z.coerce.number().min(0).optional(),
  population: z.coerce.number().min(0).optional(),

  // Ability Stats (inherited from stats.schema.json#/definitions/ability_stats)
  damage: z.coerce.number().min(0).optional(),
  range: z.coerce.number().min(0).optional(),
  value: z.coerce.number().min(0).optional(),
  radius: z.coerce.number().min(0).optional(),
  duration: z.coerce.number().min(0).optional(),
  cooldown: z.coerce.number().min(0).optional(),

  // Meta (inherited from core.schema.json#/definitions/meta)
  last_modified: z.string().optional(),
  game_version: z.string().optional(),
  $schema: z.string().optional(),
  
  // Assets (inherited from core.schema.json#/definitions/assets)
  image_required: z.boolean().optional(),
  icon: z.string().optional(),

  // Mechanics
  mechanics: z.record(z.string(), z.any()).optional(),
});

export type Spell = z.infer<typeof SpellSchema>;
