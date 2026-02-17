import { Control, useWatch } from "react-hook-form";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Undo2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export interface EditorField {
  label: string;
  name: string;
  type: "text" | "number" | "select";
  required?: boolean;
  options?: string[]; // For select type
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  description?: string;
}

interface TableEditorProps {
  fields: EditorField[];
  control: Control<any>;
  initialData: any;
}

type RowStatus = "clean" | "modified" | "schema-missing";

function getRowStatus(_fieldName: string, initialValue: any, currentValue: any): RowStatus {
  // Normalize empty values to null for comparison
  const normalize = (v: any) => (v === undefined || v === null || v === "") ? null : v;
  
  const v1 = normalize(initialValue);
  const v2 = normalize(currentValue);

  // If both are empty, it's clean
  if (v1 === null && v2 === null) return "clean";

  // Schema-missing: the field isn't in the JSON at all (initial is undefined/null) AND user hasn't touched it (current is null)
  // Actually, if it's not in JSON, it's "schema-missing" only if the user ADDS a value.
  // Wait, original logic: if initial is missing, it's schema-missing.
  // But if I add a value, is it modified or schema-missing?
  // Let's stick to: "New Field" if it wasn't there.
  if (initialValue === undefined) {
      // If user has set a value, it's a "New Field" that is also being edited.
      // If user hasn't set a value (v2 is null), it's just missing. Default to clean?
      // No, let's keep it simple: matches original intent.
      return (v2 !== null) ? "schema-missing" : "clean";
  }
  
  // Loose equality for numbers/strings (e.g. 1 == "1") but strict for nulls
  // If v1 is number, try to cast v2
  if (typeof v1 === 'number' && typeof v2 === 'string') {
      if (v2 === '' && v1 === 0) return "modified"; // 0 -> ""
      return (v1 === Number(v2)) ? "clean" : "modified";
  }

  return (v1 == v2) ? "clean" : "modified";
}

const STATUS_STYLES: Record<RowStatus, { input: string; badge: string; badgeText: string }> = {
  clean: {
    input: "",
    badge: "",
    badgeText: "",
  },
  modified: {
    input: "border-amber-500/50 focus-visible:ring-amber-500/20",
    badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    badgeText: "Edited",
  },
  "schema-missing": {
    input: "border-cyan-500/50 focus-visible:ring-cyan-500/20",
    badge: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
    badgeText: "New Field",
  },
};

export function TableEditor({ fields, control, initialData }: TableEditorProps) {
  // Watch all fields to detect changes against initialData
  const formValues = useWatch({ control });
  const [showAll, setShowAll] = useState(false);

  // Filter visible fields
  // Show if: 
  // 1. showAll is true
  // 2. Field is required
  // 3. Field has a value in initialData (it's populated)
  // 4. Field has a value in current formValues (user just typed in it)
  const visibleFields = fields.filter(field => {
      if (showAll) return true;
      if (field.required) return true;
      
      const initialVal = initialData?.[field.name];
      if (initialVal !== undefined && initialVal !== null && initialVal !== "") return true;

      const currentVal = formValues?.[field.name];
      // Also show if user acts on it (though usually they can't reach it if hidden, unless retconned)
      if (currentVal !== undefined && currentVal !== null && currentVal !== "") return true;
      
      return false;
  });

  const hiddenCount = fields.length - visibleFields.length;

  // Count statuses for legend
  const statusCounts = { modified: 0, "schema-missing": 0 };
  fields.forEach(field => {
    const status = getRowStatus(field.name, initialData?.[field.name], formValues?.[field.name]);
    if (status !== "clean") statusCounts[status]++;
  });

  return (
    <div className="space-y-4">
      {/* Two-column grid layout */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        {visibleFields.map((field) => {
          const currentValue = initialData?.[field.name];
          const newValue = formValues?.[field.name];
          const status = getRowStatus(field.name, currentValue, newValue);
          const styles = STATUS_STYLES[status];

          return (
            <div key={field.name} className={cn(
                "group relative p-3 rounded-md border border-transparent transition-all",
                status === "clean" ? "bg-card/40 border-border/40 hover:border-border/80" : "",
                status === "modified" ? "bg-amber-500/5 border-amber-500/30" : "",
                status === "schema-missing" ? "bg-cyan-500/5 border-cyan-500/30" : ""
            )}>
              {/* Field Label & Indicators */}
              <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-2">
                     <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                         {field.label}
                     </span>
                     {status !== "clean" && (
                        <span 
                          className={cn("text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm font-bold", styles.badge)}
                          title={status === "modified" ? "Value changed from current" : "This field is not present in the source JSON"}
                        >
                          {styles.badgeText}
                        </span>
                      )}
                 </div>
                 {field.required && <span className="text-destructive text-xs" title="Required">*</span>}
              </div>
              
              {/* Note / Description */}
              {field.description && <p className="text-[10px] text-muted-foreground mb-2">{field.description}</p>}

              <FormField
                  control={control}
                  name={field.name}
                  render={({ field: formField }) => (
                    <FormItem className="space-y-0 w-full">
                        <div className="flex items-center gap-2">
                        <FormControl>
                          {field.type === 'select' ? (
                            <Select 
                              onValueChange={(v) => formField.onChange(v === '_clear_' ? '' : v)} 
                              value={formField.value || undefined}
                            >
                              <SelectTrigger className={cn("h-9 text-sm bg-background/50", status !== "clean" && styles.input)}>
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                {!field.required && <SelectItem value="_clear_" className="text-muted-foreground italic text-xs">None</SelectItem>}
                                {field.options?.map(opt => (
                                  <SelectItem key={opt} value={opt} className="text-sm">{opt}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input 
                              type={field.type} 
                              {...formField}
                              value={formField.value ?? ""}
                              min={field.min}
                              max={field.max}
                              step={field.step}
                              onChange={e => {
                                const val = field.type === 'number' ? 
                                  (e.target.value === '' ? '' : Number(e.target.value)) : 
                                  e.target.value;
                                formField.onChange(val);
                              }}
                              className={cn(
                                "h-9 text-sm bg-background/50 font-mono",
                                "transition-all", 
                                status !== "clean" && styles.input
                              )} 
                            />
                          )}
                        </FormControl>
                        
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 transition-opacity",
                                (status === "modified" || (currentValue !== undefined && currentValue !== newValue)) 
                                    ? "opacity-0 group-hover:opacity-100" 
                                    : "invisible pointer-events-none" 
                            )}
                            onClick={() => formField.onChange(currentValue)}
                            title={`Reset to: ${currentValue}`}
                            tabIndex={-1} // Prevent tabbing to invisible button
                          >
                            <Undo2 className="w-3 h-3" />
                          </Button>
                      </div>
                      <FormMessage className="mt-1 text-xs" />
                    </FormItem>
                  )}
                />

                {/* Current Value (if different) helper */}
                 {status === "modified" && (
                    <div className="mt-1.5 text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                        <span className="opacity-70">WAS:</span>
                        <span className="opacity-100 bg-muted/50 px-1 rounded">{String(currentValue)}</span>
                    </div>
                 )}
            </div>
          );
        })}
      </div>

       {/* Show/Hide Toggle — only show if there are hidden fields or user expanded */}
       {(hiddenCount > 0 || showAll) && (
       <div className="flex justify-center pt-2">
            <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAll(!showAll)}
                className="text-xs text-muted-foreground hover:text-foreground"
            >
                {showAll ? "Show Less" : `Show ${hiddenCount} More Fields...`}
            </Button>
       </div>
       )}
      
      {/* Legend */}
      {(statusCounts.modified > 0 || statusCounts["schema-missing"] > 0) && (
        <div className="px-3 py-2 rounded-md border border-border/40 bg-muted/20 flex items-center gap-4 text-[10px] text-muted-foreground mt-4">
          <div className="flex items-center gap-1">
            <Info className="w-3 h-3" />
            <span>Legend:</span>
          </div>
          {statusCounts.modified > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Edited ({statusCounts.modified})</span>
            </div>
          )}
          {statusCounts["schema-missing"] > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-cyan-500" />
              <span>New Field ({statusCounts["schema-missing"]})</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
