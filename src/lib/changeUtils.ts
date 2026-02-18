import { Change } from "@/types";
import { ensureJsonExt } from "./pathUtils";

/**
 * Extracts the target ID from a Change object.
 * target_id is always present on Change objects.
 * 
 * @param change The change object
 * @returns The target ID or null
 */
export function extractChangeTargetId(change: Change): string | null {
    if (change.target_id) return ensureJsonExt(change.target_id);
    return null;
}

