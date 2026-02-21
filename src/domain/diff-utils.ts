
/**
 * Utility functions for normalizing data before diffing.
 * This ensures that legacy data formats (e.g. Object-based abilities)
 * are comparable to new data formats (e.g. Array-based abilities)
 * without showing massive false-positive diffs.
 */

import { abilitiesToArrayFormat, abilitiesToObjectFormat } from './abilityTransformer.js';

/**
 * Recursively normalizes data for diffing purposes.
 * Currently tracks:
 * - Legacy Hero Abilities (Object -> Array)
 */
export function normalizeForDiff(data: unknown): unknown {
    if (typeof data !== 'object' || data === null) {
        return data;
    }

    if (Array.isArray(data)) {
        return data.map(normalizeForDiff);
    }

    // Handle specific fields
    const normalized = { ...(data as Record<string, unknown>) };

    // 1. Normalize Abilities (Hero)
    // Always normalize TO Object format for proper diffing
    if ('abilities' in normalized) {
        if (Array.isArray(normalized.abilities)) {
            normalized.abilities = denormalizeAbilities(normalized.abilities);
        } else {
            // Already object, just ensure children are normalized?
            // Actually, keep it simple.
        }
    }

    // Recurse for other fields
    for (const key in normalized) {
         if (key !== 'abilities') {
             normalized[key] = normalizeForDiff(normalized[key]);
         }
    }

    return normalized;
}

/**
 * Converts Array-based abilities back to the canonical Object format.
 * Delegates to abilitiesToObjectFormat.
 */
export function denormalizeAbilities(abilities: unknown[]): unknown {
    return abilitiesToObjectFormat(abilities);
}

/**
 * DEPRECATED: Only used by legacy tests or if we ever need to go back.
 * Converts legacy Object-based abilities to Array-based abilities.
 * Delegates to abilitiesToArrayFormat.
 */
export function normalizeAbilities(abilities: unknown): unknown[] {
    return abilitiesToArrayFormat(abilities);
}
