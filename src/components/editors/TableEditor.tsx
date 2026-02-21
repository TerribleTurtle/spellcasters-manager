import { useWatch, FieldValues, useFormContext } from "react-hook-form";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { TableEditorRow } from "./TableEditorRow";
import { getRowStatus } from "./tableEditorUtils";
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

interface TableEditorProps<TFieldValues extends FieldValues> {
  fields: EditorField[];
  initialData: TFieldValues | null;
}


export function TableEditor<TFieldValues extends FieldValues>({
  fields,
  initialData,
}: TableEditorProps<TFieldValues>) {
  const { control } = useFormContext<TFieldValues>();
  // Watch all fields to detect changes against initialData
  const formValues = useWatch({ control });
  const [showAll, setShowAll] = useState(false);

  // Filter visible fields
  // Show if:
  // 1. showAll is true
  // 2. Field is required
  // 3. Field has a value in initialData (it's populated)
  // 4. Field has a value in current formValues (user just typed in it)
  const visibleFields = fields.filter((field) => {
    if (showAll) return true;
    if (field.required) return true;

    const initialVal = initialData?.[field.name];
    if (initialVal !== undefined && initialVal !== null && initialVal !== "")
      return true;

    const currentVal = formValues?.[field.name];
    // Also show if user acts on it (though usually they can't reach it if hidden, unless retconned)
    if (currentVal !== undefined && currentVal !== null && currentVal !== "")
      return true;

    return false;
  });

  const hiddenCount = fields.length - visibleFields.length;

  // Count statuses for legend
  const statusCounts = { modified: 0, "schema-missing": 0 };
  fields.forEach((field) => {
    const status = getRowStatus(
      initialData?.[field.name as keyof TFieldValues],
      (formValues as Record<string, unknown>)?.[field.name]
    );
    if (status !== "clean") statusCounts[status as keyof typeof statusCounts]++;
  });

  return (
    <div className="space-y-4">
      {/* Two-column grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 md:gap-y-4">
        {visibleFields.map((field) => {
          const currentValue = initialData?.[field.name as keyof TFieldValues];
          const newValue = (formValues as Record<string, unknown>)?.[
            field.name
          ];
          const status = getRowStatus(currentValue, newValue);

          return (
            <TableEditorRow
              key={field.name}
              field={field}
              status={status}
              currentValue={currentValue}
              newValue={newValue}
            />
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
