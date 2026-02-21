import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { CategorySchema } from "@/types";
import { CALCULATION_UNITS } from "@/domain/constants";

interface BonusDamageItemProps {
  index: number;
  onRemove: () => void;
}

export function BonusDamageItem({ index, onRemove }: BonusDamageItemProps) {
  const { control } = useFormContext();
  const categories = CategorySchema.options;

  return (
    <div className="relative border rounded-md p-4 space-y-3 border-l-[3px] border-l-amber-500 bg-amber-500/5">
      <div className="flex items-center justify-between">
         <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600">Bonus Damage</h4>
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
}
