import { Plus, Trash2, ChevronDown, ChevronRight, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

import { useFieldArray, useWatch, useFormContext } from "react-hook-form";
import { useState } from "react";
import { CategorySchema } from "@/types";

// --- Constants from schema ---
const CALCULATION_UNITS = ["flat", "percent_max_hp", "percent_current_hp"] as const;

export function MechanicsPanel() {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "mechanics.damage_modifiers",
  });

  const { fields: bonusFields, append: appendBonus, remove: removeBonus } = useFieldArray({
    control,
    name: "mechanics.bonus_damage" as never,
  });

  // Collapsed by default
  const [isExpanded, setIsExpanded] = useState(false);

  // Watch modifiers to display summary in header
  useWatch({ control, name: "mechanics.damage_modifiers" });

  const categories = CategorySchema.options;

  // Count total mechanics items for the header badge
  const totalItems = fields.length + bonusFields.length;

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
          <Settings className="w-4 h-4 text-slate-500" />
          Mechanics
          <span className="text-xs font-normal text-muted-foreground">({totalItems})</span>
        </h3>
        {!isExpanded && totalItems > 0 && (
          <div className="flex items-center gap-1.5">
             <span className="text-xs text-muted-foreground">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
          </div>
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="space-y-6 pb-2">

          {/* ── Scalar Properties ── */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-1">Properties</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {/* Waves */}
              <FormField
                control={control}
                name={"mechanics.waves" as never}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Waves</FormLabel>
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
                          field.onChange(v === "" ? undefined : parseInt(v, 10));
                        }}
                        className="h-8 text-xs"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Interval */}
              <FormField
                control={control}
                name={"mechanics.interval" as never}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Interval (s)</FormLabel>
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
                          field.onChange(v === "" ? undefined : parseFloat(v));
                        }}
                        className="h-8 text-xs"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Capture Speed Modifier */}
              <FormField
                control={control}
                name={"mechanics.capture_speed_modifier" as never}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Capture Speed (x)</FormLabel>
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
                          field.onChange(v === "" ? undefined : parseFloat(v));
                        }}
                        className="h-8 text-xs"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Boolean toggles */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 px-1 pt-1">
              {/* Stagger Modifier */}
              <FormField
                control={control}
                name={"mechanics.stagger_modifier" as never}
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="mech-stagger"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={!!field.value}
                      onChange={e => field.onChange(e.target.checked || undefined)}
                    />
                    <label htmlFor="mech-stagger" className="text-xs font-medium leading-none">
                      Stagger
                    </label>
                  </div>
                )}
              />

              {/* Pierce */}
              <FormField
                control={control}
                name={"mechanics.pierce" as never}
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="mech-pierce"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={!!field.value}
                      onChange={e => field.onChange(e.target.checked || undefined)}
                    />
                    <label htmlFor="mech-pierce" className="text-xs font-medium leading-none">
                      Pierce
                    </label>
                  </div>
                )}
              />

              {/* Auto Capture Altars */}
              <FormField
                control={control}
                name={"mechanics.auto_capture_altars" as never}
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="mech-auto-capture"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={!!field.value}
                      onChange={e => field.onChange(e.target.checked || undefined)}
                    />
                    <label htmlFor="mech-auto-capture" className="text-xs font-medium leading-none">
                      Auto Capture Altars
                    </label>
                  </div>
                )}
              />
            </div>
          </div>

          {/* ── Damage Modifiers ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Damage Modifiers</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ multiplier: 1.0, target_types: [] })}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Modifier
              </Button>
            </div>

            {fields.map((field, index) => {
              return (
                <div
                  key={field.id}
                  className="relative border rounded-md p-4 space-y-3 border-l-[3px] border-l-slate-500 bg-slate-500/5"
                >
                  <div className="flex items-center justify-between">
                     <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Damage Modifier</h4>
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

                  <div className="grid grid-cols-1 gap-4">
                    {/* Multiplier */}
                    <FormField
                      control={control}
                      name={`mechanics.damage_modifiers.${index}.multiplier`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Multiplier (x)</FormLabel>
                          <FormControl>
                            <Input
                               type="number"
                               step="0.1"
                               {...field}
                               onChange={e => field.onChange(parseFloat(e.target.value))}
                               className="h-8 text-xs"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Target Types */}
                    <FormField
                      control={control}
                      name={`mechanics.damage_modifiers.${index}.target_types`}
                      render={({ field }) => {
                          const currentValues = (field.value as string[]) || [];
                          return (
                              <FormItem>
                                  <FormLabel className="text-xs block mb-2">Target Types</FormLabel>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                      {categories.map(category => (
                                          <div key={category} className="flex items-center space-x-2">
                                              <input
                                                  type="checkbox"
                                                  id={`cat-${index}-${category}`}
                                                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                  checked={currentValues.includes(category)}
                                                  onChange={(e) => {
                                                      if (e.target.checked) {
                                                          field.onChange([...currentValues, category]);
                                                      } else {
                                                          field.onChange(currentValues.filter(v => v !== category));
                                                      }
                                                  }}
                                              />
                                              <label 
                                                  htmlFor={`cat-${index}-${category}`} 
                                                  className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                              >
                                                  {category}
                                              </label>
                                          </div>
                                      ))}
                                  </div>
                                  <FormMessage />
                              </FormItem>
                          );
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {fields.length === 0 && (
              <div className="text-center p-4 border border-dashed rounded-lg text-muted-foreground bg-muted/20 text-xs">
                No damage modifiers.
              </div>
            )}
          </div>

          {/* ── Bonus Damage ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600">Bonus Damage</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendBonus({ value: 0, unit: "flat", target_types: [] } as never)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Bonus
              </Button>
            </div>

            {bonusFields.map((field, index) => {
              return (
                <div
                  key={field.id}
                  className="relative border rounded-md p-4 space-y-3 border-l-[3px] border-l-amber-500 bg-amber-500/5"
                >
                  <div className="flex items-center justify-between">
                     <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600">Bonus Damage</h4>
                     <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeBonus(index)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Value */}
                    <FormField
                      control={control}
                      name={`mechanics.bonus_damage.${index}.value` as never}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Value</FormLabel>
                          <FormControl>
                            <Input
                               type="number"
                               step="0.1"
                               {...field}
                               onChange={e => field.onChange(parseFloat(e.target.value))}
                               className="h-8 text-xs"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Unit */}
                    <FormField
                      control={control}
                      name={`mechanics.bonus_damage.${index}.unit` as never}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Unit</FormLabel>
                          <FormControl>
                            <select
                              {...field}
                              value={(field.value as string) ?? "flat"}
                              onChange={e => field.onChange(e.target.value)}
                              className="w-full h-8 text-xs rounded-md border border-input bg-background px-3 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                              {CALCULATION_UNITS.map(u => (
                                <option key={u} value={u}>{u.replace(/_/g, ' ')}</option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Target Types */}
                  <FormField
                    control={control}
                    name={`mechanics.bonus_damage.${index}.target_types` as never}
                    render={({ field }) => {
                        const currentValues = (field.value as string[]) || [];
                        return (
                            <FormItem>
                                <FormLabel className="text-xs block mb-2">Target Types</FormLabel>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {categories.map(category => (
                                        <div key={category} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id={`bonus-${index}-${category}`}
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                checked={currentValues.includes(category)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        field.onChange([...currentValues, category]);
                                                    } else {
                                                        field.onChange(currentValues.filter((v: string) => v !== category));
                                                    }
                                                }}
                                            />
                                            <label 
                                                htmlFor={`bonus-${index}-${category}`} 
                                                className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                {category}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        );
                    }}
                  />
                </div>
              );
            })}

            {bonusFields.length === 0 && (
              <div className="text-center p-4 border border-dashed rounded-lg text-muted-foreground bg-muted/20 text-xs">
                No bonus damage.
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
