
/**
 * Recursively sorts object keys to ensure deterministic JSON output.
 * 
 * Priority Order (Top):
 * 1. $schema
 * 2. id, entity_id
 * 3. name
 * 4. class, hero_class, category, type, version, date
 * 
 * Metadata Order (Bottom):
 * 1. last_modified
 * 
 * All other keys are sorted alphabetically in between.
 */
export function sortKeys(value: unknown): unknown {
    if (value === null || value === undefined) {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map(sortKeys);
    }

    if (typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        const keys = Object.keys(obj);
        
        // Priority keys (appear at the top)
        const priorityKeys = [
            '$schema',
            'id', 'entity_id',
            'name',
            'version', 'date', 'type',
            'class', 'hero_class', 'category'
        ];

        // Metadata keys (appear at the bottom)
        const metadataKeys = [
            'last_modified'
        ];

        keys.sort((a, b) => {
            // 1. Priority Keys
            const aPriority = priorityKeys.indexOf(a);
            const bPriority = priorityKeys.indexOf(b);
            
            if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;
            if (aPriority !== -1) return -1;
            if (bPriority !== -1) return 1;

            // 2. Metadata Keys
            const aMeta = metadataKeys.indexOf(a);
            const bMeta = metadataKeys.indexOf(b);

            if (aMeta !== -1 && bMeta !== -1) return aMeta - bMeta;
            if (aMeta !== -1) return 1; // Push to bottom
            if (bMeta !== -1) return -1; // Push to bottom

            // 3. Alphabetical for everything else
            return a.localeCompare(b);
        });

        const sortedObj: Record<string, unknown> = {};
        for (const key of keys) {
            sortedObj[key] = sortKeys(obj[key]);
        }
        return sortedObj;
    }

    return value;
}
