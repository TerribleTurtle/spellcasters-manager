import { z } from "zod";

// --- Enums ---
export const UnitTypeSchema = z.enum(['Unit', 'Titan', 'Structure']);
export type UnitType = z.infer<typeof UnitTypeSchema>;

export const PatchTypeSchema = z.enum(['Patch', 'Hotfix', 'Content']);
export type PatchType = z.infer<typeof PatchTypeSchema>;

export const AppModeSchema = z.enum(['dev', 'live']);
export type AppMode = z.infer<typeof AppModeSchema>;

// --- Unit ---
export const UnitSchema = z.object({
  // Core Identifiers (Support both formats during transition)
  id: z.string().optional(), 
  entity_id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  
  // Categorization
  type: UnitTypeSchema.optional(), // UI uses this
  category: z.string().optional(), // Data uses this
  
  // Progression
  tier: z.coerce.number().min(1).max(5).optional(), // UI uses this
  rank: z.string().optional(), // Data uses this (e.g. "III")

  // Meta
  description: z.string().optional(),
  icon: z.string().optional(),
  image_required: z.boolean().optional(),
  tags: z.array(z.string()).optional(),

  // Stats (Make optional to prevent load failure)
  health: z.coerce.number().min(1).optional(),
  damage: z.coerce.number().min(0).optional(),
  range: z.coerce.number().min(0).optional(),
  movement: z.coerce.number().min(0).optional(),
  cost: z.coerce.number().min(0).optional(),
  
  // Extra Data Fields found in JSON
  dps: z.number().optional(),
  attack_interval: z.number().optional(),
  charges: z.number().optional(),
  recharge_time: z.number().optional(),
  cast_time: z.number().optional(),
  population: z.number().optional(),
  magic_school: z.string().optional(),
  changelog: z.array(z.any()).optional(),
  
  // Schema ref
  $schema: z.string().optional(),
});
export type Unit = z.infer<typeof UnitSchema>;

// --- Patch / Changes ---
export const ChangeSchema = z.object({
  target_id: z.string(),
  name: z.string(),
  field: z.string(),
  old: z.any(),
  new: z.any(),
});
export type Change = z.infer<typeof ChangeSchema>;

export const PatchSchema = z.object({
  id: z.string(),
  version: z.string(),
  type: PatchTypeSchema,
  title: z.string(),
  date: z.string(),
  changes: z.array(ChangeSchema),
});
export type Patch = z.infer<typeof PatchSchema>;

// --- API Responses ---
export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
}
