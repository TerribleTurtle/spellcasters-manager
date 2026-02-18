import { Plus, Trash2, ChevronDown, ChevronRight, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

import { useFieldArray, Control, useWatch } from "react-hook-form";
import { useState } from "react";
import { Unit, CategorySchema } from "@/types";

interface MechanicsPanelProps {
  control: Control<Unit>;
  initialData?: Unit;
}

export function MechanicsPanel({ control }: MechanicsPanelProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "mechanics.damage_modifiers",
  });

  // Collapsed by default
  const [isExpanded, setIsExpanded] = useState(false);

  // Watch modifiers to display summary in header
  useWatch({ control, name: "mechanics.damage_modifiers" });

  const categories = CategorySchema.options;

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
          <span className="text-xs font-normal text-muted-foreground">({fields.length})</span>
        </h3>
        {!isExpanded && fields.length > 0 && (
          <div className="flex items-center gap-1.5">
             <span className="text-xs text-muted-foreground">{fields.length} modifier{fields.length !== 1 ? 's' : ''}</span>
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
            <div className="text-center p-6 border border-dashed rounded-lg text-muted-foreground bg-muted/20 text-sm">
              No mechanics added yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
