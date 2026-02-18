import { z } from "zod";
import { PatchTypeSchema } from "./enums.js";

// --- Change Type ---
export const ChangeTypeSchema = z.enum(['add', 'edit', 'delete']);
export type ChangeType = z.infer<typeof ChangeTypeSchema>;

// --- Patch / Changes ---
export const ChangeSchema = z.object({
  target_id: z.string(),
  name: z.string(),
  field: z.string(),
  old: z.any().optional(),
  new: z.any().optional(),
  // Slim diff storage (replaces full old/new snapshots in patches.json)
  change_type: ChangeTypeSchema.optional(),
  diffs: z.array(z.any()).optional(),
  // Version History Fields
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  reason: z.string().optional(),
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
