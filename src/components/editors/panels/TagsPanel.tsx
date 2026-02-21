import { Plus, X, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWatch, useFormContext } from "react-hook-form";
import { useState } from "react";


export function TagsPanel() {
  const { setValue, control } = useFormContext();
  const tags = useWatch({ control, name: "tags" }) as string[] || [];
  const [newTag, setNewTag] = useState("");

  const handleAdd = () => {
    const trimmed = newTag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setValue("tags", [...tags, trimmed], { shouldDirty: true });
      setNewTag("");
    }
  };

  const handleRemove = (tagToRemove: string) => {
    setValue("tags", tags.filter(t => t !== tagToRemove), { shouldDirty: true });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-3 p-4 border border-border/50 rounded-lg bg-card/40 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Tag className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Tags</h3>
        <span className="text-xs text-muted-foreground">({tags.length})</span>
      </div>

      <div className="flex flex-wrap gap-2 min-h-8">
        {tags.map((tag) => (
          <div
            key={tag}
            className="flex items-center gap-1 bg-secondary/80 px-2.5 py-1 rounded-full text-xs font-medium border border-border/50 animate-in fade-in zoom-in duration-200"
          >
            <span>{tag}</span>
            <button
              type="button"
              className="text-muted-foreground hover:text-destructive transition-colors"
              onClick={() => handleRemove(tag)}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {tags.length === 0 && (
             <span className="text-xs text-muted-foreground italic py-1">No tags added</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add tag (e.g. homing)..."
          className="h-8 text-xs max-w-[200px]"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={!newTag.trim()}
          className="h-8"
        >
          <Plus className="w-3 h-3 mr-1" /> Add
        </Button>
      </div>
    </div>
  );
}
