/**
 * Regression tests for useDiffLogic delta-only save behavior.
 * 
 * CRITICAL INVARIANT: When a user edits a single field, only that field
 * (plus last_modified) should change in the saved output. The original
 * file structure (field names, data shapes) MUST be preserved exactly.
 */
import { describe, it, expect } from 'vitest';

// --- Pure function extracted from useDiffLogic logic for testability ---

interface DeltaSaveResult {
    finalData: Record<string, unknown>;
    userChanges: Record<string, unknown>;
}

/**
 * Core delta-save algorithm: compares form state against normalized initial
 * to find user changes, then applies ONLY those to raw disk data.
 */
function computeDeltaSave(
    rawDiskData: Record<string, unknown>,
    normalizedInitial: Record<string, unknown>,
    formState: Record<string, unknown>
): DeltaSaveResult {
    const userChanges: Record<string, unknown> = {};
    for (const key in formState) {
        const formVal = JSON.stringify(formState[key]);
        const initVal = JSON.stringify(normalizedInitial[key]);
        if (formVal !== initVal) {
            userChanges[key] = formState[key];
        }
    }

    const finalData = JSON.parse(JSON.stringify({ ...rawDiskData, ...userChanges }));
    finalData.last_modified = '2026-02-17T00:00:00.000Z';

    return { finalData, userChanges };
}

// --- Test Data ---

/** Raw hero data as it exists on disk (legacy format) */
const RAW_HERO_DISK = {
    name: "Astral Monk",
    class: "Duelist",          // ← Legacy field name (NOT hero_class)
    difficulty: 2,
    health: 300,
    abilities: {               // ← Legacy Object format
        passive: [
            { name: "Arcane Alignment", description: "All Astral spells recharge faster." }
        ],
        primary: {
            name: "Astral Fists",
            description: "Pierces through enemies.",
            damage: 32,
        },
        defense: {
            name: "Veil Shift",
            description: "Turns invisible.",
            charges: 2,
        },
        ultimate: {
            name: "Dimension of Varani",
            description: "Conjures a time bubble.",
        }
    },
    entity_id: "astral_monk",
};

/** normalizeHero() output — what the editor works with */
const NORMALIZED_HERO = {
    name: "Astral Monk",
    class: "Duelist",
    hero_class: "Duelist",     // ← Added by normalizer
    difficulty: 2,
    health: 300,
    abilities: [               // ← Converted to Array by normalizer
        { name: "Arcane Alignment", description: "All Astral spells recharge faster.", type: "Passive", mana_cost: 0, cooldown: 0 },
        { name: "Astral Fists", description: "Pierces through enemies.", damage: 32, type: "Primary", mana_cost: 0, cooldown: 0 },
        { name: "Veil Shift", description: "Turns invisible.", charges: 2, type: "Defense", mana_cost: 0, cooldown: 0 },
        { name: "Dimension of Varani", description: "Conjures a time bubble.", type: "Ultimate", mana_cost: 0, cooldown: 0 },
    ],
    entity_id: "astral_monk",
};


describe('DeltaSave: Field Preservation', () => {

    it('changing only difficulty should NOT touch abilities or class fields', () => {
        const formState = { ...NORMALIZED_HERO, difficulty: 3 }; // User changed 2→3

        const { finalData, userChanges } = computeDeltaSave(RAW_HERO_DISK, NORMALIZED_HERO, formState);

        // ONLY difficulty should be in userChanges
        expect(Object.keys(userChanges)).toEqual(['difficulty']);
        expect(userChanges.difficulty).toBe(3);

        // Final data must preserve the original "class" field (NOT renamed to hero_class)
        expect(finalData.class).toBe("Duelist");
        expect(finalData).not.toHaveProperty('hero_class');

        // Final data must preserve Object abilities (NOT converted to Array)
        expect(Array.isArray(finalData.abilities)).toBe(false);
        expect(finalData.abilities).toHaveProperty('passive');
        expect(finalData.abilities).toHaveProperty('primary');
        expect(finalData.abilities).toHaveProperty('defense');
        expect(finalData.abilities).toHaveProperty('ultimate');

        // Difficulty IS updated
        expect(finalData.difficulty).toBe(3);
        
        // Timestamp IS injected
        expect(finalData.last_modified).toBeDefined();
    });

    it('changing no fields should produce zero userChanges', () => {
        const formState = { ...NORMALIZED_HERO }; // No changes

        const { userChanges } = computeDeltaSave(RAW_HERO_DISK, NORMALIZED_HERO, formState);

        expect(Object.keys(userChanges)).toEqual([]);
    });

    it('changing health should only write health to disk', () => {
        const formState = { ...NORMALIZED_HERO, health: 500 };

        const { finalData, userChanges } = computeDeltaSave(RAW_HERO_DISK, NORMALIZED_HERO, formState);

        expect(Object.keys(userChanges)).toEqual(['health']);
        
        // Original structure untouched
        expect(finalData.class).toBe("Duelist");
        expect(Array.isArray(finalData.abilities)).toBe(false);
        expect(finalData.health).toBe(500);
    });

    it('original disk keys are ALL preserved in output', () => {
        const formState = { ...NORMALIZED_HERO, difficulty: 3 };
        const { finalData } = computeDeltaSave(RAW_HERO_DISK, NORMALIZED_HERO, formState);

        // Every key from the original disk file must still exist
        for (const key of Object.keys(RAW_HERO_DISK)) {
            expect(finalData).toHaveProperty(key);
        }
    });

    it('works correctly for already-normalized data (no legacy migration)', () => {
        // If raw == normalized, any change should still work cleanly
        const modernHero = {
            name: "New Hero",
            hero_class: "Tank",
            difficulty: 1,
            health: 400,
            abilities: [],
        };

        const formState = { ...modernHero, difficulty: 2 };
        const { finalData, userChanges } = computeDeltaSave(modernHero, modernHero, formState);

        expect(Object.keys(userChanges)).toEqual(['difficulty']);
        expect(finalData.difficulty).toBe(2);
        expect(finalData.hero_class).toBe("Tank");
    });

    it('does NOT add ghost fields (hero_class) if not in raw data', () => {
        // normalized has hero_class, raw does NOT
        // formState has hero_class (same as normalized)
        const { finalData } = computeDeltaSave(RAW_HERO_DISK, NORMALIZED_HERO, NORMALIZED_HERO);

        expect(finalData).not.toHaveProperty('hero_class');
        expect(finalData.class).toBe("Duelist");
    });

    it('does NOT change type of abilities from Object to Array', () => {
        // normalized has Array abilities, raw has Object
        // formState has Array abilities (same as normalized)
        const { finalData } = computeDeltaSave(RAW_HERO_DISK, NORMALIZED_HERO, NORMALIZED_HERO);

        expect(Array.isArray(finalData.abilities)).toBe(false); // Must stay Object
        expect(finalData.abilities).toHaveProperty('passive');
    });
});
