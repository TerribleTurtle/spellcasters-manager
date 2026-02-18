/**
 * Type-narrowing utility guards for defensive data handling.
 * Use these instead of ad-hoc `|| []` or `Array.isArray` checks.
 */

/**
 * Guarantees the return value is an array.
 * Use instead of `value || []` which fails on truthy non-arrays.
 *
 * @example
 * const tags = safeArray(change.tags);      // always string[]
 * const items = safeArray(apiResponse);      // always T[]
 */
export function safeArray<T>(value: unknown): T[] {
    return Array.isArray(value) ? value : [];
}

/**
 * Guarantees the return value is a plain object (not null, not array).
 * Use before `Object.entries()` or `Object.keys()` on untrusted data.
 *
 * @example
 * const mechanics = safeObject(data.mechanics);
 * Object.entries(mechanics).map(...)  // always safe
 */
export function safeObject(value: unknown): Record<string, unknown> {
    return (value && typeof value === 'object' && !Array.isArray(value))
        ? value as Record<string, unknown>
        : {};
}
