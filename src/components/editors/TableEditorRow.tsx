import { Path, useFormContext, FieldValues } from "react-hook-form";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Undo2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorField } from "./TableEditor";
import { RowStatus, STATUS_STYLES } from "./tableEditorUtils";

interface TableEditorRowProps {
  field: EditorField;
  status: RowStatus;
  currentValue: unknown;
  newValue: unknown;
}

export function TableEditorRow<TFieldValues extends FieldValues>({
  field,
  status,
  currentValue,
  newValue,
}: TableEditorRowProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext<TFieldValues>();
  
  const styles = STATUS_STYLES[status];

  return (
    <div
      className={cn(
        "group relative p-3 rounded-md border border-transparent transition-all",
        status === "clean"
          ? "bg-card/40 border-border/40 hover:border-border/80"
          : "",
        status === "modified"
          ? "bg-amber-500/5 border-amber-500/30"
          : "",
        status === "schema-missing"
          ? "bg-cyan-500/5 border-cyan-500/30"
          : ""
      )}
    >
      {/* Field Label & Indicators */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {field.label}
          </span>
          {field.type === "number" &&
            (field.min !== undefined || field.max !== undefined) && (
              <span className="text-[10px] text-muted-foreground font-mono opacity-70">
                {field.min !== undefined &&
                  field.max !== undefined &&
                  `(${field.min}–${field.max})`}
                {field.min !== undefined &&
                  field.max === undefined &&
                  `(≥ ${field.min})`}
                {field.max !== undefined &&
                  field.min === undefined &&
                  `(≤ ${field.max})`}
              </span>
            )}
          {status !== "clean" && (
            <span
              className={cn(
                "text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm font-bold",
                styles.badge
              )}
              title={
                status === "modified"
                  ? "Value changed from current"
                  : "This field is not present in the source JSON"
              }
            >
              {styles.badgeText}
            </span>
          )}
        </div>
        {field.required && (
          <span className="text-destructive text-xs" title="Required">
            *
          </span>
        )}
        {errors[field.name as Path<TFieldValues>] && (
          <span className="text-[10px] font-medium text-destructive animate-in fade-in slide-in-from-right-1">
            {String(
              errors[field.name as Path<TFieldValues>]?.message ??
                "Invalid"
            )}
          </span>
        )}
      </div>

      {/* Note / Description */}
      {field.description && (
        <p className="text-[10px] text-muted-foreground mb-2">
          {field.description}
        </p>
      )}

      <FormField
        control={control}
        name={field.name as Path<TFieldValues>}
        render={({ field: formField }) => (
          <FormItem className="space-y-0 w-full">
            <div className="flex items-center gap-2">
              <FormControl>
                {field.type === "select" ? (
                  <Select
                    onValueChange={(v) =>
                      formField.onChange(v === "_clear_" ? "" : v)
                    }
                    value={formField.value || undefined}
                  >
                    <SelectTrigger
                      className={cn(
                        "h-11 md:h-9 text-sm bg-background/50",
                        status !== "clean" && styles.input
                      )}
                    >
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {!field.required && (
                        <SelectItem
                          value="_clear_"
                          className="text-muted-foreground italic text-xs"
                        >
                          None
                        </SelectItem>
                      )}
                      {field.options?.map((opt) => (
                        <SelectItem
                          key={opt}
                          value={opt}
                          className="text-sm"
                        >
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type === "number" ? (
                  <div className="flex items-center gap-0 w-full">
                    <button
                      type="button"
                      tabIndex={-1}
                      className="h-11 w-11 md:h-9 md:w-8 shrink-0 flex items-center justify-center rounded-l-md border border-r-0 border-input bg-secondary/50 text-muted-foreground hover:bg-primary/20 hover:text-primary active:bg-primary/30 transition-colors"
                      onClick={() => {
                        const cur = Number(formField.value) || 0;
                        const step = field.step || 1;
                        const next = cur - step;
                        if (field.min !== undefined && next < field.min)
                          return;
                        formField.onChange(next);
                      }}
                    >
                      <Minus className="w-4 h-4 md:w-3 md:h-3" />
                    </button>
                    <Input
                      type="number"
                      {...formField}
                      value={formField.value ?? ""}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      onChange={(e) => {
                        const val =
                          e.target.value === ""
                            ? ""
                            : Number(e.target.value);
                        formField.onChange(val);
                      }}
                      onBlur={(e) => {
                        // Clamp value on blur
                        let val = Number(e.target.value);
                        if (field.min !== undefined && val < field.min)
                          val = field.min;
                        if (field.max !== undefined && val > field.max)
                          val = field.max;
                        if (val !== Number(e.target.value)) {
                          formField.onChange(val);
                        }
                        formField.onBlur();
                      }}
                      className={cn(
                        "h-11 md:h-9 text-sm bg-background/50 font-mono text-center rounded-none border-x-0",
                        "transition-all",
                        status !== "clean" && styles.input
                      )}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="h-11 w-11 md:h-9 md:w-8 shrink-0 flex items-center justify-center rounded-r-md border border-l-0 border-input bg-secondary/50 text-muted-foreground hover:bg-primary/20 hover:text-primary active:bg-primary/30 transition-colors"
                      onClick={() => {
                        const cur = Number(formField.value) || 0;
                        const step = field.step || 1;
                        const next = cur + step;
                        if (field.max !== undefined && next > field.max)
                          return;
                        formField.onChange(next);
                      }}
                    >
                      <Plus className="w-4 h-4 md:w-3 md:h-3" />
                    </button>
                  </div>
                ) : (
                  <Input
                    type={field.type}
                    {...formField}
                    value={formField.value ?? ""}
                    onChange={(e) => formField.onChange(e.target.value)}
                    className={cn(
                      "h-11 md:h-9 text-sm bg-background/50 font-mono",
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
                  status === "modified" ||
                    (currentValue !== undefined &&
                      currentValue !== newValue)
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
          </FormItem>
        )}
      />

      {/* Current Value (if different) helper */}
      {status === "modified" && (
        <div className="mt-1.5 text-[10px] text-muted-foreground font-mono flex items-center gap-1">
          <span className="opacity-70">WAS:</span>
          <span className="opacity-100 bg-muted/50 px-1 rounded">
            {String(currentValue)}
          </span>
        </div>
      )}
    </div>
  );
}
