import { RotateCcw, Trash2, Plus, ChevronDown, ChevronRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { safeArray } from "@/lib/guards";
import { useFieldArray, Control, useWatch, FieldValues } from "react-hook-form";
import React, { useState } from "react";
import { Hero } from "@/types";

interface HeroAbilitiesPanelProps {
  control: Control<FieldValues>;
  initialData?: Hero;
}

/** Color theme for each ability type */
const TYPE_COLORS: Record<string, { border: string; bg: string; badge: string; badgeText: string }> = {
  Passive: {
    border: "border-l-emerald-500",
    bg: "bg-emerald-500/5",
    badge: "bg-emerald-500/15 text-emerald-400",
    badgeText: "Passive",
  },
  Primary: {
    border: "border-l-blue-500",
    bg: "bg-blue-500/5",
    badge: "bg-blue-500/15 text-blue-400",
    badgeText: "Primary",
  },
  Secondary: {
    border: "border-l-indigo-500",
    bg: "bg-indigo-500/5",
    badge: "bg-indigo-500/15 text-indigo-400",
    badgeText: "Secondary",
  },
  Defense: {
    border: "border-l-amber-500",
    bg: "bg-amber-500/5",
    badge: "bg-amber-500/15 text-amber-400",
    badgeText: "Defense",
  },
  Ultimate: {
    border: "border-l-purple-500",
    bg: "bg-purple-500/5",
    badge: "bg-purple-500/15 text-purple-400",
    badgeText: "Ultimate",
  },
  Other: {
    border: "border-l-gray-500",
    bg: "bg-gray-500/5",
    badge: "bg-gray-500/15 text-gray-400",
    badgeText: "Other",
  },
};

function getTypeColor(type: string | undefined) {
  return TYPE_COLORS[type || "Other"] || TYPE_COLORS.Other;
}

const AbilityItem = React.memo(({ index, control, remove, initialData }: { index: number; control: Control<FieldValues>; remove: (index: number) => void; initialData?: Hero }) => {
  const ability = useWatch({
    control,
    name: `abilities.${index}`
  });

  const abilityType = (ability?.type as string) || "Other";
  const colors = getTypeColor(abilityType);

  // Helper to check if a field is modified and get original value
  const getFieldStatus = (fieldName: string, currentValue: unknown) => {
    if (!initialData?.abilities || !Array.isArray(initialData.abilities) || !initialData.abilities[index]) {
       return { isModified: false, original: null };
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const originalAbility = initialData.abilities[index] as any;
    const originalValue = originalAbility[fieldName];
    const isModified = originalValue !== currentValue;
    
    return { isModified, original: originalValue };
  };

  return (
    <div
      className={cn(
        "relative border rounded-md p-4 space-y-3 border-l-[3px] transition-colors",
        colors.border, colors.bg
      )}
    >
      {/* Type badge + delete */}
      <div className="flex items-center justify-between">
        <span className={cn("text-mini px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider", colors.badge)}>
          {colors.badgeText}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => remove(index)}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-3">
          <FormField
            control={control}
            name={`abilities.${index}.name`}
            render={({ field }) => {
              const { isModified, original } = getFieldStatus("name", field.value);
              return (
              <FormItem>
                <div className="flex items-center justify-between">
                   <FormLabel className="text-xs">Ability Name</FormLabel>
                   {isModified && (
                      <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-2"
                          title={`Reset to: ${original}`}
                          onClick={() => field.onChange(original)}
                      >
                          <RotateCcw className="w-3 h-3 text-muted-foreground hover:text-primary" />
                      </Button>
                   )}
                </div>
                <FormControl>
                  <Input {...field} placeholder="Fireball" className="h-8 text-xs" />
                </FormControl>
                {isModified && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                          Was: <span className="font-medium text-destructive/80">{String(original)}</span>
                      </p>
                )}
                <FormMessage />
              </FormItem>
            )}}
          />
          <FormField
            control={control}
            name={`abilities.${index}.type`}
            render={({ field }) => {
              const { isModified, original } = getFieldStatus("type", field.value);
              return (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-xs">Type</FormLabel>
                   {isModified && (
                      <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-2"
                          title={`Reset to: ${original}`}
                          onClick={() => field.onChange(original)}
                      >
                          <RotateCcw className="w-3 h-3 text-muted-foreground hover:text-primary" />
                      </Button>
                   )}
                </div>
                <FormControl>
                  <select 
                    className="flex h-8 w-full items-center rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    {...field}
                  >
                    <option value="Passive">Passive</option>
                    <option value="Primary">Primary</option>
                    <option value="Secondary">Secondary</option>
                    <option value="Defense">Defense</option>
                    <option value="Ultimate">Ultimate</option>
                    <option value="Other">Other</option>
                  </select>
                </FormControl>
                {isModified && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                          Was: <span className="font-medium text-destructive/80">{String(original)}</span>
                      </p>
                )}
                <FormMessage />
              </FormItem>
            )}}
          />
        </div>
     
        <div className="grid grid-cols-2 gap-2">
          <FormField
            control={control}
            name={`abilities.${index}.mana_cost`}
            render={({ field }) => {
              const { isModified, original } = getFieldStatus("mana_cost", field.value);
              return (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-xs">Mana Cost</FormLabel>
                   {isModified && (
                      <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-2"
                          title={`Reset to: ${original}`}
                          onClick={() => field.onChange(original)}
                      >
                          <RotateCcw className="w-3 h-3 text-muted-foreground hover:text-primary" />
                      </Button>
                   )}
                </div>
                <FormControl>
                  <Input 
                      type="number" 
                      {...field} 
                      onChange={e => {
                          const val = e.target.value;
                          field.onChange(val === "" ? "" : Number(val));
                      }}
                      className="h-8 text-xs" 
                  />
                </FormControl>
                {isModified && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                          Was: <span className="font-medium text-destructive/80">{String(original)}</span>
                      </p>
                )}
                <FormMessage />
              </FormItem>
            )}}
          />
          <FormField
            control={control}
            name={`abilities.${index}.cooldown`}
            render={({ field }) => {
              const { isModified, original } = getFieldStatus("cooldown", field.value);
              return (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-xs">Cooldown (s)</FormLabel>
                   {isModified && (
                      <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-2"
                          title={`Reset to: ${original}`}
                          onClick={() => field.onChange(original)}
                      >
                          <RotateCcw className="w-3 h-3 text-muted-foreground hover:text-primary" />
                      </Button>
                   )}
                </div>
                <FormControl>
                  <Input 
                      type="number" 
                      {...field} 
                      onChange={e => {
                          const val = e.target.value;
                          field.onChange(val === "" ? "" : Number(val));
                      }}
                      className="h-8 text-xs" 
                  />
                </FormControl>
                {isModified && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                          Was: <span className="font-medium text-destructive/80">{String(original)}</span>
                      </p>
                )}
                <FormMessage />
              </FormItem>
            )}}
          />
        </div>
      </div>

      <FormField
        control={control}
        name={`abilities.${index}.description`}
        render={({ field }) => {
              const { isModified, original } = getFieldStatus("description", field.value);
              return (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel className="text-xs">Description</FormLabel>
                   {isModified && (
                      <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-2"
                          title={`Reset to: ${original}`}
                          onClick={() => field.onChange(original)}
                      >
                          <RotateCcw className="w-3 h-3 text-muted-foreground hover:text-primary" />
                      </Button>
                   )}
            </div>
            <FormControl>
              <Textarea {...field} placeholder="Deals 50 damage..." className="resize-none h-16 text-xs" />
            </FormControl>
                {isModified && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                          Was: <span className="font-medium text-destructive/80">{String(original)}</span>
                      </p>
                )}
            <FormMessage />
          </FormItem>
        )}}
      />
    </div>
  );
});

export function HeroAbilitiesPanel({ control, initialData }: HeroAbilitiesPanelProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "abilities",
  });

  // Collapsed by default
  const [isExpanded, setIsExpanded] = useState(false);

  // Watch abilities to get type values ONLY for the summary header
  // This is still a bit heavy, but much better than passing it down to every child
  const rawAbilities = useWatch({ control, name: "abilities" });
  const abilities = safeArray<Record<string, unknown>>(rawAbilities);

  return (
    <div className="space-y-0">
      {/* Header — always visible, acts as toggle */}
      <button
        type="button"
        className="w-full flex items-center justify-between py-3 px-1 group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-semibold flex items-center gap-2">
          {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          <Zap className="w-4 h-4 text-yellow-500" />
          Hero Abilities
          <span className="text-xs font-normal text-muted-foreground">({fields.length})</span>
        </h3>
        {!isExpanded && fields.length > 0 && (
          <div className="flex items-center gap-1.5">
            {abilities.map((a: Record<string, unknown>, i: number) => {
              const colors = getTypeColor(a?.type as string | undefined);
              return (
                <span key={i} className={cn("text-micro px-1.5 py-0.5 rounded-full font-medium", colors.badge)}>
                  {String(a?.name || colors.badgeText)}
                </span>
              );
            })}
          </div>
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="space-y-3 pb-2">
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ name: "", description: "", type: "Other", mana_cost: 0, cooldown: 0 })}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Ability
            </Button>
          </div>

          {fields.map((field, index) => (
            <AbilityItem 
              key={field.id} 
              index={index} 
              control={control} 
              remove={remove} 
              initialData={initialData} 
            />
          ))}

          {fields.length === 0 && (
            <div className="text-center p-6 border border-dashed rounded-lg text-muted-foreground bg-muted/20 text-sm">
              No abilities added yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
