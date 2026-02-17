import { useFieldArray, Control, useWatch } from "react-hook-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Zap, ChevronDown, ChevronRight } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";

interface HeroAbilitiesPanelProps {
  control: Control<any>;
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

export function HeroAbilitiesPanel({ control }: HeroAbilitiesPanelProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "abilities",
  });

  // Collapsed by default
  const [isExpanded, setIsExpanded] = useState(false);

  // Watch abilities to get type values
  const abilities = useWatch({ control, name: "abilities" }) || [];

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
            {abilities.map((a: any, i: number) => {
              const colors = getTypeColor(a?.type);
              return (
                <span key={i} className={cn("text-micro px-1.5 py-0.5 rounded-full font-medium", colors.badge)}>
                  {a?.name || colors.badgeText}
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

          {fields.map((field, index) => {
            const abilityType = abilities[index]?.type || "Other";
            const colors = getTypeColor(abilityType);

            return (
              <div
                key={field.id}
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
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Ability Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Fireball" className="h-8 text-xs" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`abilities.${index}.type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Type</FormLabel>
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
               
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={control}
                      name={`abilities.${index}.mana_cost`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Mana Cost</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} className="h-8 text-xs" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`abilities.${index}.cooldown`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Cooldown (s)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} className="h-8 text-xs" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={control}
                  name={`abilities.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Deals 50 damage..." className="resize-none h-16 text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            );
          })}

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
