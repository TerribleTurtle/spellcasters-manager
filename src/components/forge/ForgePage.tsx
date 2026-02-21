import { Change } from "@/types";
import { useState } from "react";
import { PreviewPanel } from "@/components/preview/PreviewPanel";
import { cn } from "@/lib/utils";
import { Hammer, X, Loader2, Plus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EDITOR_MAP } from "@/config/editorRegistry";



interface ForgePageProps {
  selectedUnit: string | null;
  unitData: Record<string, unknown> | null;
  currentCategory: string;
  onUnitSaved: () => void;
  onUnitCreated: (filename: string) => void;
  onNavigateToScribe?: () => void;
  onClearSelection?: () => void;
  editorType?: string; // "units", "heroes", "consumables", "spells"
  onDirtyChange?: (dirty: boolean) => void;
  isCreating?: boolean;
  onCreateCancel?: () => void;

  onCreateStart?: () => void;
  onDuplicate?: (data: unknown) => void;
  restoredChange?: Change | null;
  onDiscardRestoredChange?: () => void;
}

export function ForgePage({
  selectedUnit,
  unitData,
  currentCategory,
  onUnitSaved,
  onUnitCreated,

  onNavigateToScribe,
  onClearSelection,
  editorType,
  onDirtyChange,
  isCreating,
    onCreateCancel,
  onCreateStart,
  onDuplicate,
  restoredChange,
  onDiscardRestoredChange
}: ForgePageProps) {
  const [showPreview, setShowPreview] = useState(false);

  const handleSave = () => {
    onUnitSaved();
  };

  // If in creation mode, render the appropriate editor with isNew={true}
  if (isCreating) {
      const EditorComponent = EDITOR_MAP[currentCategory];
      if (EditorComponent) {
          return (
            <div className="flex h-full w-full overflow-hidden bg-background">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <EditorComponent 
                        filename="new_entity.json"
                        initialData={unitData}
                        onSave={(_data, filename) => onUnitCreated(filename || 'new_entity.json')} 
                        isNew={true}
                        onNavigateToScribe={onNavigateToScribe}
                        onDirtyChange={onDirtyChange}
                    />
                </div>
            </div>
          );
      }
      return <div className="p-6">Editor not available for {currentCategory} <Button variant="link" onClick={onCreateCancel}>Cancel</Button></div>;
  }

  const renderEditor = () => {
    if (!selectedUnit) {
      // Empty state — no entity selected
      return (
        <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground/50 border-2 border-dashed border-border/50 rounded-xl m-8 bg-card/10">
            <Hammer className="w-16 h-16 mb-4 opacity-10" />
            <h3 className="text-xl font-semibold mb-2 text-foreground/80">Studio</h3>
            <p className="max-w-md text-center mb-6">Select an entity from the sidebar to edit, or create a new one below.</p>
            {onCreateStart && (
                <Button onClick={onCreateStart} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create New {currentCategory.endsWith('s') ? currentCategory.slice(0, -1) : currentCategory}
                </Button>
            )}
        </div>
      );
    }

    if (!unitData || (unitData._filename && unitData._filename !== selectedUnit)) return (
      <div className="flex items-center justify-center p-10 h-full min-h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );

    // Show Editor
    const key = `${selectedUnit}`; // Force re-mount on selection change
    const type = editorType || currentCategory;
    const EditorComponent = EDITOR_MAP[type];

    if (EditorComponent) {
        return (
            <EditorComponent 
                key={key} 
                filename={selectedUnit} 
                initialData={unitData}
                onSave={handleSave} 
                onNavigateToScribe={onNavigateToScribe} 
                onDirtyChange={onDirtyChange} 
                onDuplicate={onDuplicate}
                restoredChange={restoredChange}
                onDiscardRestoredChange={onDiscardRestoredChange}
            />
        );
    }
    
    return (
        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <Hammer className="w-12 h-12 mb-4 opacity-20" />
            <p>Editor for {currentCategory} not found.</p>
        </div>
    );
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {/* Left Column: Editor (Fluid) */}
      <div className="flex-1 h-full overflow-y-auto custom-scrollbar relative flex flex-col min-w-0">
         
         {/* Inline View Switcher Toolbar */}
         <div className="border-b border-border bg-card/30 backdrop-blur-sm px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Hammer className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Studio</span>
            </div>
            
            <div className="flex items-center gap-2">
                {selectedUnit && (
                  <Button
                      variant={showPreview ? "secondary" : "ghost"}
                      size="sm"
                      className="gap-2 text-xs"
                      onClick={() => setShowPreview(!showPreview)}
                      title="Toggle Live Preview"
                  >
                      <Eye className={cn("w-4 h-4", showPreview && "text-primary")} />
                      <span className="hidden sm:inline">{showPreview ? "Hide Preview" : "Show Preview"}</span>
                  </Button>
                )}

                {selectedUnit && onClearSelection && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0 ml-2 text-muted-foreground hover:text-foreground"
                        onClick={onClearSelection}
                        title="Close Editor"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                )}
            </div>
         </div>

         <div className="min-h-full">
            <div className="p-3 sm:p-6">
                {renderEditor()}
            </div>
         </div>
      </div>

      {/* Right Column: Preview Panel */}
      <PreviewPanel isOpen={showPreview && !!selectedUnit} unitData={unitData} onClose={() => setShowPreview(false)} />
    </div>
  );
}
