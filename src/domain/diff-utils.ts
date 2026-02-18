
/**
 * Utility functions for normalizing data before diffing.
 * This ensures that legacy data formats (e.g. Object-based abilities)
 * are comparable to new data formats (e.g. Array-based abilities)
 * without showing massive false-positive diffs.
 */

/**
 * Recursively normalizes data for diffing purposes.
 * Currently tracks:
 * - Legacy Hero Abilities (Object -> Array)
 */
 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeForDiff(data: any): any {
    if (typeof data !== 'object' || data === null) {
        return data;
    }

    if (Array.isArray(data)) {
        return data.map(normalizeForDiff);
    }

    // Handle specific fields
    const normalized = { ...data };

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
        if (key !== 'abilities') { // Already handled
             normalized[key] = normalizeForDiff(normalized[key]);
        }
    }

    return normalized;
}

/**
 * Converts Array-based abilities back to the canonical Object format.
 * Array: [ { type: 'Passive', ... }, { type: 'Primary', ... }, ... ]
 * Object: { passive: [], primary: {}, defense: {}, ultimate: {} }
 *
 * IMPORTANT: Strips fields injected by normalizeHero on load:
 *   - `type` (implied by the Object key)
 *   - `mana_cost` when 0 (default injected by normalizeHero)
 *   - `cooldown` when 0 (default injected by normalizeHero)
 * This ensures round-trip fidelity: load → edit → save produces
 * identical output to the source file (minus intentional changes).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function denormalizeAbilities(abilities: any[]): any {
    if (!Array.isArray(abilities)) return abilities; // Already object or invalid

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const converted: any = {
        passive: [],
        primary: {},
        defense: {},
        ultimate: {}
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    abilities.forEach((ability: any) => {
        if (!ability || !ability.type) return;
        
        const clean = { ...ability };

        // Strip fields injected by normalizeHero (not present in source)
        delete clean.type;                              // Implied by Object key
        if (clean.mana_cost === 0) delete clean.mana_cost;  // Default injected on load
        if (clean.cooldown === 0) delete clean.cooldown;    // Default injected on load

        switch (ability.type) {
            case 'Passive':
                converted.passive.push(clean);
                break;
            case 'Primary':
                converted.primary = clean;
                break;
            case 'Defense':
                converted.defense = clean;
                break;
            case 'Ultimate':
                converted.ultimate = clean;
                break;
            default:
                if (!converted.other) converted.other = [];
                converted.other.push(clean);
        }
    });

    return converted;
}

/**
 * DEPRECATED: Only used by legacy tests or if we ever need to go back.
 * Converts legacy Object-based abilities to Array-based abilities.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeAbilities(abilities: any): any[] {
    if (!abilities) return [];
    
    // If already an array, return as-is
    if (Array.isArray(abilities)) {
        return abilities;
    }

    // If it's the legacy object format, convert it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const converted: any[] = [];

    // Helper to add ability with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const add = (ability: any, type: string) => {
        if (!ability) return;
        converted.push({ 
            mana_cost: 0,
            cooldown: 0,
            ...ability, 
            type 
        });
    };

    // 1. Passives (Array)
    if (Array.isArray(abilities.passive)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        abilities.passive.forEach((p: any) => add(p, 'Passive'));
    }

    // 2. Primary (Object)
    add(abilities.primary, 'Primary');

    // 3. Secondary (Object) - Some legacy data might have this
    add(abilities.secondary, 'Secondary');

    // 4. Defense (Object)
    add(abilities.defense, 'Defense');

    // 5. Ultimate (Object)
    add(abilities.ultimate, 'Ultimate');

    return converted;
}
