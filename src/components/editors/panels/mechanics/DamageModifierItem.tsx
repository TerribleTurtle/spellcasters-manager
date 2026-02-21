import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { CategorySchema } from "@/types";

interface DamageModifierItemProps {
  index: number;
  onRemove: () => void;
}

export function DamageModifierItem({ index, onRemove }: DamageModifierItemProps) {
  const { control } = useFormContext();
  const categories = CategorySchema.options;

  return (
    <div className="relative border rounded-md p-4 space-y-3 border-l-[3px] border-l-slate-500 bg-slate-500/5">
      <div className="flex items-center justify-between">
         <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Damage Modifier</h4>
         <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
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
}
