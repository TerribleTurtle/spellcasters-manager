import { Change } from "@/types";
import { ensureJsonExt } from "./pathUtils";

/**
 * Extracts a candidate ID from a Change object.
 * Checks target_id, new.id, old.id, new.entity_id, old.entity_id.
 * 
 * @param change The change object
 * @returns The best guess ID or null
 */
export function extractChangeTargetId(change: Change): string | null {
    if (change.target_id) return ensureJsonExt(change.target_id);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newItem = change.new as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const oldItem = change.old as any;

    if (newItem?.id) return ensureJsonExt(newItem.id);
    if (oldItem?.id) return ensureJsonExt(oldItem.id);

    if (newItem?.entity_id) return ensureJsonExt(newItem.entity_id);
    if (oldItem?.entity_id) return ensureJsonExt(oldItem.entity_id);

    return null;

}
