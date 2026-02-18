import { ZodObject } from "zod";
import { SchemaFieldsConfig, UNIT_FIELD_CONFIG, HERO_FIELD_CONFIG, CONSUMABLE_FIELD_CONFIG, SPELL_FIELD_CONFIG } from "@/domain/schemaToFields";
import { UnitSchema, HeroSchema, ConsumableSchema, SpellSchema } from "@/domain/schemas";
import { Control } from "react-hook-form";
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDuplicate?: (data: any) => void;
  restoredChange?: Change | null;
  onDiscardRestoredChange?: () => void;
}

export interface EntityEditorConfig<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: ZodObject<any>;
  fieldConfig: SchemaFieldsConfig;
  category: string;
  label: string;
  defaultValues: Partial<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  normalize?: (data: any) => T;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extraPanels?: React.ComponentType<{ control: Control<any>; initialData?: T }>[];
}

// --- Normalization Logic ---

type HeroFormValues = z.infer<typeof HeroSchema>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizeHero = (data: any): HeroFormValues => {
    // 1. Normalize Class
    if (data.class && !data.hero_class) {
      data.hero_class = data.class;
    }

    // 2. Normalize Abilities (Object -> Array)
    if (data.abilities && !Array.isArray(data.abilities)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawAbilities = data.abilities as any;
      const normalizedAbilities: HeroFormValues['abilities'] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const add = (def: any, type: string) => {
        if (!def) return;
        normalizedAbilities.push({
          ...def,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          type: type as any,
          mana_cost: def.mana_cost || 0,
          cooldown: def.cooldown || 0
        });
      };
      if (Array.isArray(rawAbilities.passive)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rawAbilities.passive.forEach((p: any) => add(p, 'Passive'));
      }
      add(rawAbilities.primary, 'Primary');
      add(rawAbilities.defense, 'Defense');
      add(rawAbilities.ultimate, 'Ultimate');
      data.abilities = normalizedAbilities;
    }

    // Ensure abilities is an array (fallback)
    if (!data.abilities) {
      data.abilities = [];
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
    } as unknown as Spell, // Cast needed if type mismatch on legacy fields, but Spell matches Schema now.
    extraPanels: [MechanicsPanel, TagsPanel],
};
