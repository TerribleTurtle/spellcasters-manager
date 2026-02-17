/**
 * Recursively extracts error messages from a nested error object (e.g. from react-hook-form).
 * Returns a flat array of formatted error strings like "field.subfield: error message".
 * 
 * @param errors The error object to traverse
 * @param parentKey Internal recursion key
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function flattenFormErrors(errors: any): string[] {
    const issues: string[] = [];
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extract = (obj: any, prefix = '') => {
        if (!obj) return;
        
        for (const key in obj) {
            const currentPath = prefix ? `${prefix}.${key}` : key;
            const value = obj[key];
            
            if (value?.message && typeof value.message === 'string') {
                issues.push(`${currentPath}: ${value.message}`);
            } else if (typeof value === 'object' && value !== null) {
                // If it has a 'type' or 'ref' property it might be a leaf node without message
                // but usually RHF errors have message. If deeper nesting:
                extract(value, currentPath);
            }
        }
    };

    extract(errors);
    return issues;
}
