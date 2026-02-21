import React, { useState } from "react";
import { RotateCcw, Trash2, ChevronDown, ChevronRight, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { useWatch, useFormContext } from "react-hook-form";
import { Hero } from "@/types";
import { getTypeColor } from "./abilityColors";
import { AbilityFeatures } from "./AbilityFeatures";

interface AbilityItemProps {
    index: number;
    remove: (index: number) => void;
    initialData?: Hero;
    onTypeChange: (index: number, newType: string) => void;
}

export const AbilityItem = React.memo(({ index, remove, initialData, onTypeChange }: AbilityItemProps) => {
  const { control } = useFormContext();
  const ability = useWatch({
    control,
    name: `abilities.${index}`
  });

  const abilityType = (ability?.type as string) || "Other";
  const colors = getTypeColor(abilityType);
  const [mechExpanded, setMechExpanded] = useState(() => {
    // Auto-expand if there are existing mechanics
    const m = ability?.mechanics;
    return !!(m && (m.cleave || (m.features && m.features.length > 0)));
  });

  // Helper to check if a field is modified and get original value
  const getFieldStatus = (fieldName: string, currentValue: unknown) => {
    if (!initialData?.abilities || !Array.isArray(initialData.abilities) || !initialData.abilities[index]) {
       return { isModified: false, original: null };
    }
    
    const originalAbility = initialData.abilities[index] as Record<string, unknown>;
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
                    onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val);
                        onTypeChange(index, val);
                    }}
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

      {/* ── Combat Stats Row (Damage, Duration, Charges) ── */}
      <div className="grid grid-cols-3 gap-2">
        <FormField
          control={control}
          name={`abilities.${index}.damage`}
          render={({ field }) => {
            const { isModified, original } = getFieldStatus("damage", field.value);
            return (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-xs">Damage</FormLabel>
                  {isModified && (
                    <Button type="button" variant="ghost" size="icon" className="h-4 w-4 ml-2" title={`Reset to: ${original}`} onClick={() => field.onChange(original)}>
                      <RotateCcw className="w-3 h-3 text-muted-foreground hover:text-primary" />
                    </Button>
                  )}
                </div>
                <FormControl>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="—"
                    {...field}
                    value={field.value ?? ""}
                    onChange={e => {
                      const v = e.target.value;
                      field.onChange(v === "" ? undefined : Number(v));
                    }}
                    className="h-8 text-xs"
                  />
                </FormControl>
                {isModified && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">Was: <span className="font-medium text-destructive/80">{String(original)}</span></p>
                )}
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={control}
          name={`abilities.${index}.duration`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Duration (s)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="—"
                  {...field}
                  value={field.value ?? ""}
                  onChange={e => {
                    const v = e.target.value;
                    field.onChange(v === "" ? undefined : Number(v));
                  }}
                  className="h-8 text-xs"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`abilities.${index}.charges`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Charges</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="—"
                  {...field}
                  value={field.value ?? ""}
                  onChange={e => {
                    const v = e.target.value;
                    field.onChange(v === "" ? undefined : Number(v));
                  }}
                  className="h-8 text-xs"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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

      {/* ── Mechanics Section (Cleave + Features) ── */}
      <div className="border-t border-border/30 pt-2 mt-1">
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
          onClick={() => setMechExpanded(prev => !prev)}
        >
          {mechExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <Settings className="w-3 h-3" />
          <span className="font-medium">Mechanics</span>
        </button>

        {mechExpanded && (
          <div className="space-y-3 pt-2 pl-1">
            {/* Cleave toggle */}
            <FormField
              control={control}
              name={`abilities.${index}.mechanics.cleave`}
              render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`ability-${index}-cleave`}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={!!field.value}
                    onChange={e => field.onChange(e.target.checked || undefined)}
                  />
                  <label htmlFor={`ability-${index}-cleave`} className="text-xs font-medium leading-none">
                    Cleave
                  </label>
                </div>
              )}
            />

            {/* Features sub-list */}
            <AbilityFeatures abilityIndex={index} />
          </div>
        )}
      </div>
    </div>
  );
});
