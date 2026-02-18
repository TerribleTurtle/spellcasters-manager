import { z } from "zod";
import { CategorySchema, EffectTypeSchema, BuffTargetSchema } from "./enums.js";

// --- Consumable (Item) ---
export const ConsumableSchema = z.object({
  id: z.string().optional(),
  entity_id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  category: CategorySchema.optional(),
  
  // Game Data
  // Game Data
  effect_type: EffectTypeSchema.optional(),
  value: z.coerce.number().optional(),
  duration: z.coerce.number().min(0).optional(),
  // cooldown: removed (strict alignment)
  // rarity: removed (strict alignment)
  stack_size: z.coerce.number().min(1).optional(),
  buff_target: BuffTargetSchema.optional(),
  
  // cost: removed (strict alignment)
  image_required: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  // Mechanics
  mechanics: z.record(z.string(), z.any()).optional(),
  last_modified: z.string().optional(),
  game_version: z.string().optional(),
  // Schema ref
  $schema: z.string().optional(),
});
export type Consumable = z.infer<typeof ConsumableSchema>;
