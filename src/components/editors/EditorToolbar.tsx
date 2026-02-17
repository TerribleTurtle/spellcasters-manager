import { Save, ListPlus, RotateCcw, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditorToolbarProps {
  filename: string;
  isNew?: boolean;
  isSaving: boolean;
  isDirty: boolean;
  isRestored: boolean;
  label: string;
  generatedFilename: string;
  onDuplicate?: (data: unknown) => void;
  getValues: () => Record<string, unknown>;
  onSave: () => void;
  onQueue: () => void;
  onReset: () => void;
}

export function EditorToolbar({
  filename,
  isNew,
  isSaving,
  isDirty,
  isRestored,
  label,
  generatedFilename,
  onDuplicate,
  getValues,
  onSave,
  onQueue,
  onReset,
}: EditorToolbarProps) {
  const displayFilename = isNew ? generatedFilename || "new_entity.json" : filename;

  return (
    <div className="flex items-center justify-between gap-4 py-3 px-4 bg-card/50 border border-border rounded-lg">
      {/* Left side: filename info */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-medium text-muted-foreground truncate">
          {isNew ? `New ${label}` : displayFilename}
        </span>
        {isRestored && (
          <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-medium">
            Restored
          </span>
        )}
        {isDirty && !isSaving && (
          <span className="text-xs text-muted-foreground/60">• Unsaved</span>
        )}
      </div>

      {/* Right side: action buttons */}
      <div className="flex items-center gap-2 shrink-0">
        {!isNew && onDuplicate && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => onDuplicate(getValues())}
            disabled={isSaving}
            title={`Duplicate ${label}`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Duplicate</span>
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={onReset}
          disabled={isSaving || !isDirty}
          title="Reset changes"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={onQueue}
          disabled={isSaving}
          title="Queue for next patch"
        >
          <ListPlus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Queue</span>
        </Button>

        <Button
          type="button"
          variant="default"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={onSave}
          disabled={isSaving}
          title="Save now"
        >
          {isSaving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">Save</span>
        </Button>
      </div>
    </div>
  );
}
