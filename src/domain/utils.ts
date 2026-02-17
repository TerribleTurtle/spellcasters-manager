/**
 * Recursively removes keys starting with '_' from an object or array.
 * Useful for sanitizing internal state before persistence or display.
 * 
 * @param obj The object to sanitize
 * @returns A new object with internal fields removed
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stripInternalFields(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(stripInternalFields);

    return Object.entries(obj)
        .filter(([key]) => !key.startsWith('_'))
        .reduce((acc, [key, val]) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (acc as any)[key] = stripInternalFields(val);
            return acc;
        }, {});
}
