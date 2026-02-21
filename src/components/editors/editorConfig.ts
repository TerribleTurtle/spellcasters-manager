import { ZodObject, ZodTypeAny } from "zod";
import { SchemaFieldsConfig, UNIT_FIELD_CONFIG, HERO_FIELD_CONFIG, CONSUMABLE_FIELD_CONFIG, SPELL_FIELD_CONFIG } from "@/domain/schemaToFields";
import { UnitSchema, HeroSchema, ConsumableSchema, SpellSchema } from "@/domain/schemas";
import { abilitiesToArrayFormat } from "@/domain/abilityTransformer";

import { HeroAbilitiesPanel } from "./panels/HeroAbilitiesPanel";
import { MechanicsPanel } from "./panels/MechanicsPanel";
import { TagsPanel } from "./panels/TagsPanel";
import { Change, Unit, Hero, Consumable, Spell } from "@/types";
import { z } from "zod";

export interface EditorProps {
  initialData?: unknown;
  filename: string;
  onSave?: (data?: unknown, filename?: string) => void;
  onNavigateToScribe?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  isNew?: boolean;
  onDuplicate?: (data: unknown) => void;
  restoredChange?: Change | null;
  onDiscardRestoredChange?: () => void;
}

export interface EntityEditorConfig<T> {
  schema: ZodObject<Record<string, ZodTypeAny>>;
  fieldConfig: SchemaFieldsConfig;
  category: string;
  label: string;
  defaultValues: Partial<T>;
  normalize?: (data: Record<string, unknown>) => T;
  extraPanels?: React.ComponentType<{ initialData?: T }>[];
  skipDiff?: boolean;
}

// --- Normalization Logic ---

type HeroFormValues = z.infer<typeof HeroSchema>;

const normalizeHero = (data: Record<string, unknown>): HeroFormValues => {
    // 1. Normalize Class
    if (data.class && !data.hero_class) {
      data.hero_class = data.class;
    }

    // 2. Normalize Abilities (Object -> Array)
    data.abilities = abilitiesToArrayFormat(data.abilities);

    // 3. Ensure every ability has mechanics.features initialised.
    //    useFieldArray for mechanics.features will inject an empty [] into
    //    the form state at render time.  If the normalised defaults don't
    //    already contain it, the dirty-check sees a diff and falsely marks
    //    the form as modified (Bug: Fire Elementalist false dirty on open,
    //    Iron Sorcerer phantom features mutation).
    if (Array.isArray(data.abilities)) {
      data.abilities = (data.abilities as Record<string, unknown>[]).map((a: Record<string, unknown>) => ({
        ...a,
        mechanics: {
          features: [],
          ...(a.mechanics || {}),
        },
      }));
    }

    return data as HeroFormValues;
};

// --- Configurations ---

export const UNIT_EDITOR_CONFIG: EntityEditorConfig<Unit> = {
  schema: UnitSchema,
  fieldConfig: UNIT_FIELD_CONFIG,
  category: 'units',
  label: 'Unit',
  defaultValues: {
     name: "",
     icon: "",
  },
  // No normalize needed for Unit
  extraPanels: [MechanicsPanel, TagsPanel],
};

export const HERO_EDITOR_CONFIG: EntityEditorConfig<Hero> = {
  schema: HeroSchema,
  fieldConfig: HERO_FIELD_CONFIG,
  category: 'heroes',
  label: 'Hero',
  defaultValues: {
    name: "",
    icon: "",
    type: "Unit",
    // tier: removed
    description: "",
    health: 200,
    damage: 15,
    range: 1,
    movement_speed: 3,
    movement_type: "Ground",
    // cost: removed
    abilities: [],
  },
  normalize: normalizeHero,
  extraPanels: [HeroAbilitiesPanel, MechanicsPanel, TagsPanel],
};

export const CONSUMABLE_EDITOR_CONFIG: EntityEditorConfig<Consumable> = {
  schema: ConsumableSchema,
  fieldConfig: CONSUMABLE_FIELD_CONFIG,
  category: 'consumables',
  label: 'Item',
  defaultValues: {
      name: "",
      effect_type: "Heal",
      // rarity: removed
      value: 0,
      duration: 0,
      // cooldown: removed
      stack_size: 1,
      buff_target: "Health", // Valid enum value
      description: "",
  },
  // Consumable has trivial normalization (identity), can omit or add if strict
  extraPanels: [MechanicsPanel],
};

export const SPELL_EDITOR_CONFIG: EntityEditorConfig<Spell> = {
    schema: SpellSchema,
    fieldConfig: SPELL_FIELD_CONFIG,
    category: 'spells',
    label: 'Spell',
    defaultValues: {
        name: "",
        icon: "",
        type: "Unit", // Technically spells don't have 'type' in schema but it might be used by system? Schema doesn't have it.
        description: "",
        damage: 0,
        range: 0,
        charges: 1,
        recharge_time: 0,
        // New spell defaults
        radius: 0,
        value: 0,
        duration: 0,
        cooldown: 0,
    } as unknown as Spell, // RHF generic variance workaround — Spell matches Schema shape but TS can't prove it
    extraPanels: [MechanicsPanel, TagsPanel],
};
