import { z } from "zod";
import { BalanceDirectionSchema, PatchTypeSchema } from "./enums.js";

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
