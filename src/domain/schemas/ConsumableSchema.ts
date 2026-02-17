import { z } from "zod";
import { CategorySchema, EffectTypeSchema, RaritySchema } from "./enums.js";

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
