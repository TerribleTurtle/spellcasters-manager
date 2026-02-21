import { Plus, ChevronDown, ChevronRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { safeArray } from "@/lib/guards";
import { useFieldArray, useWatch, useFormContext } from "react-hook-form";
import React, { useState } from "react";
import { Hero } from "@/types";
import { AbilityItem } from "./abilities/AbilityItem";
import { getTypeColor } from "./abilities/abilityColors";

interface HeroAbilitiesPanelProps {
  initialData?: Hero;
}

export function HeroAbilitiesPanel({ initialData }: HeroAbilitiesPanelProps) {
  const { control, setValue, getValues } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "abilities",
  });

  // Enforce unique types for Primary, Defense, Ultimate
  const handleTypeChange = React.useCallback((changedIndex: number, newType: string) => {
       const uniqueTypes = ['Primary', 'Defense', 'Ultimate'];
       if (!uniqueTypes.includes(newType)) return;

       const currentAbilities = getValues("abilities");
       if (!currentAbilities || !Array.isArray(currentAbilities)) return;

       currentAbilities.forEach((ability: Record<string, unknown>, i: number) => {
           if (i !== changedIndex && ability.type === newType) {
                // Swap the existing one to "Other"
                setValue(`abilities.${i}.type`, "Other", { shouldDirty: true });
           }
       });
  }, [getValues, setValue]);

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
              remove={remove} 
              initialData={initialData} 
              onTypeChange={handleTypeChange}
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
