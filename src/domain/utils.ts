/**
 * Recursively removes keys starting with '_' from an object or array.
 * Useful for sanitizing internal state before persistence or display.
 * 
 * @param obj The object to sanitize
 * @returns A new object with internal fields removed
 */
export function stripInternalFields(obj: unknown): unknown {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(stripInternalFields);

    return Object.entries(obj)
        .filter(([key]) => !key.startsWith('_'))
        .reduce((acc, [key, val]) => {
            (acc as Record<string, unknown>)[key] = stripInternalFields(val);
            return acc;
        }, {});
}
