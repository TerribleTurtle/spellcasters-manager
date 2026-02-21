/**
 * Utility functions for transforming Hero abilities between Array and Object formats.
 * 
 * The raw disk data (legacy) stores abilities as an Object:
 * { passive: [], primary: {}, defense: {}, ultimate: {} }
 * 
 * The UI forms and diffs need abilities as a unified Array:
 * [ { type: 'Passive' }, { type: 'Primary' } ]
 */

/**
 * Converts legacy Object-based abilities to Array-based abilities.
 * Injects baseline defaults (`mana_cost: 0`, `cooldown: 0`) for predictable UI rendering.
 */
export function abilitiesToArrayFormat(abilities: unknown): unknown[] {
    if (!abilities) return [];
    
    // If already an array (modern format), return as-is
    if (Array.isArray(abilities)) {
        return abilities;
    }

    // If it's the legacy object format, convert it
    const converted: unknown[] = [];

    // Helper to add ability with type
    const add = (ability: unknown, type: string) => {
        if (!ability || typeof ability !== 'object') return;
        converted.push({ 
            mana_cost: 0,
            cooldown: 0,
            ...(ability as Record<string, unknown>), 
            type 
        });
    };

    const abilitiesObj = abilities as Record<string, unknown>;

    // 1. Passives (Array)
    if (Array.isArray(abilitiesObj.passive)) {
        abilitiesObj.passive.forEach((p: unknown) => add(p, 'Passive'));
    }

    // 2. Primary (Object)
    add(abilitiesObj.primary, 'Primary');

    // 3. Secondary (Object) - Some legacy data might have this
    add(abilitiesObj.secondary, 'Secondary');

    // 4. Defense (Object)
    add(abilitiesObj.defense, 'Defense');

    // 5. Ultimate (Object)
    add(abilitiesObj.ultimate, 'Ultimate');

    return converted;
}

/**
 * Converts Array-based abilities back to the canonical Object format.
 * 
 * IMPORTANT: Strips fields injected by UI defaults:
 *   - `type` (implied by the Object key)
 *   - `mana_cost` when 0
 *   - `cooldown` when 0
 *   - empty `mechanics.features` arrays
 * 
 * This ensures round-trip save fidelity (no spurious diffs).
 */
export function abilitiesToObjectFormat(abilities: unknown[]): unknown {
    if (!Array.isArray(abilities)) return abilities; // Already object or invalid

    const converted: Record<string, unknown> = {
        passive: [],
        primary: {},
        defense: {},
        ultimate: {}
    };

    abilities.forEach((ability: unknown) => {
        if (!ability || typeof ability !== 'object' || !('type' in ability)) return;
        
        const clean = { ...(ability as Record<string, unknown>) };

        // Strip fields injected by UI defaults (not present in source)
        delete clean.type;                              // Implied by Object key
        if (clean.mana_cost === 0) delete clean.mana_cost;  // Default injected on load
        if (clean.cooldown === 0) delete clean.cooldown;    // Default injected on load

        // Strip empty mechanics.features injected by normalizeHero (editorConfig.ts)
        if (clean.mechanics) {
            const mechanicsObj = clean.mechanics as Record<string, unknown>;
            if (Array.isArray(mechanicsObj.features) && mechanicsObj.features.length === 0) {
                delete mechanicsObj.features;
            }
            if (Object.keys(mechanicsObj).length === 0) {
                delete clean.mechanics;
            }
        }

        const typeStr = (ability as Record<string, unknown>).type as string;

        switch (typeStr) {
            case 'Passive':
                (converted.passive as unknown[]).push(clean);
                break;
            case 'Primary':
                if (converted.primary && Object.keys(converted.primary).length > 0) {
                     if (!converted.other) converted.other = [];
                     (converted.other as unknown[]).push(clean);
                } else {
                    converted.primary = clean;
                }
                break;
            case 'Defense':
                 if (converted.defense && Object.keys(converted.defense).length > 0) {
                     if (!converted.other) converted.other = [];
                     (converted.other as unknown[]).push(clean);
                } else {
                    converted.defense = clean;
                }
                break;
            case 'Ultimate':
                 if (converted.ultimate && Object.keys(converted.ultimate).length > 0) {
                     if (!converted.other) converted.other = [];
                     (converted.other as unknown[]).push(clean);
                } else {
                    converted.ultimate = clean;
                }
                break;
            default:
                if (!converted.other) converted.other = [];
                (converted.other as unknown[]).push(clean);
        }
    });

    return converted;
}
