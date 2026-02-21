import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { useFieldArray, useFormContext } from "react-hook-form";


interface AbilityFeaturesProps {
  abilityIndex: number;
}

/** Sub-component for the mechanics.features array within an ability */
export const AbilityFeatures = ({ abilityIndex }: AbilityFeaturesProps) => {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `abilities.${abilityIndex}.mechanics.features`,
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Features</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 text-xs px-2"
          onClick={() => append({ name: "", description: "" })}
        >
          <Plus className="w-3 h-3 mr-1" />
          Add
        </Button>
      </div>
      {fields.map((feat, fi) => (
        <div key={feat.id} className="flex items-start gap-2 bg-background/50 rounded p-2 border border-border/30">
          <div className="flex-1 space-y-1.5">
            <FormField
              control={control}
              name={`abilities.${abilityIndex}.mechanics.features.${fi}.name`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Knockback" className="h-7 text-xs" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`abilities.${abilityIndex}.mechanics.features.${fi}.description`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} placeholder="Description..." className="h-7 text-xs" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0 mt-0.5"
            onClick={() => remove(fi)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      ))}
      {fields.length === 0 && (
        <p className="text-[10px] text-muted-foreground/60 italic px-1">No features.</p>
      )}
    </div>
  );
};
