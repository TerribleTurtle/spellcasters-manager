/**
 * Recursively extracts error messages from a nested error object (e.g. from react-hook-form).
 * Returns a flat array of formatted error strings like "field.subfield: error message".
 * 
 * @param errors The error object to traverse
 * @param parentKey Internal recursion key
 */
export function flattenFormErrors(errors: unknown): string[] {
    const issues: string[] = [];
    
    const extract = (obj: unknown, prefix = '') => {
        if (!obj || typeof obj !== 'object') return;
        
        for (const [key, value] of Object.entries(obj)) {
            const currentPath = prefix ? `${prefix}.${key}` : key;
            
            // value is typed as any here since Object.entries of unknown object is problematic, but we can do type checks
            const v = value as Record<string, unknown>;
            if (v?.message && typeof v.message === 'string') {
                issues.push(`${currentPath}: ${v.message}`);
            } else if (typeof v === 'object' && v !== null) {
                // If it has a 'type' or 'ref' property it might be a leaf node without message
                // but usually RHF errors have message. If deeper nesting:
                extract(v, currentPath);
            }
        }
    };

    extract(errors);
    return issues;
}
