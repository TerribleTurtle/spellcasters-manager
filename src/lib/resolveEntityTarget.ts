import { BaseEntity } from "@/types";
import { ensureJsonExt } from "./pathUtils";

/**
 * Resolves a target ID (filename or entity ID) to a canonical filename
 * by looking it up in the entity registry.
 * 
 * @param targetId The ID to resolve (e.g. "unit_123", "unit_123.json")
 * @param registry The entity registry
 * @returns The resolved filename (e.g. "unit_123.json") or null if not found
 */
export function resolveEntityTarget(
    targetId: string, 
    registry: Record<string, BaseEntity[]>
): { filename: string; category: string } | null {
    if (!targetId) return null;

    // 1. Try direct filename match
    const filename = ensureJsonExt(targetId);
    
    for (const [category, entities] of Object.entries(registry)) {
        if (entities.some(e => e._filename === filename)) {
            return { filename, category };
        }
    }

    // 2. Try match by 'id' field (if targetId is a UUID but filename is different)
    // Note: In our system filename is usually the ID, but this covers edge cases
    for (const [category, entities] of Object.entries(registry)) {
        const match = entities.find(e => e.id === targetId || e.id === filename);
        if (match && match._filename) {
            return { filename: match._filename, category };
        }
    }
    
    // 3. Try match by 'name' (fallback, risky but sometimes used in patches)
    for (const [category, entities] of Object.entries(registry)) {
        const match = entities.find(e => e.name === targetId);
        if (match && match._filename) {
            return { filename: match._filename, category };
        }
    }

    return null;
}
