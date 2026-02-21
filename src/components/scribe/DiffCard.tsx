import { Plus, Trash2, Tag, Edit2, X, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Change } from "@/types";
import { safeArray } from "@/lib/guards";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { patchService } from "@/services/PatchService";
import { useToast } from "@/components/ui/toast-context";
import { JsonDiff } from "@/components/ui/JsonDiff";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DiffCardProps {
    change: Change;
    index?: number;
    onUpdate?: () => void;
    onOpenInEditor?: (change: Change) => void;
    isSelected?: boolean;
    onSelect?: () => void;
}

export function DiffCard({ change, index, onUpdate, onOpenInEditor, isSelected, onSelect }: DiffCardProps) {
    // Slim patches use change_type; queue items use old/new presence
    const isNew = change.change_type === 'add' || (change.change_type === undefined && (change.old === undefined || change.old === null || change.old === ""));
    const isDelete = change.change_type === 'delete' || (change.change_type === undefined && (change.new === undefined || change.new === null || change.new === ""));
    
    const [isEditingTags, setIsEditingTags] = useState(false);
    const [tagInput, setTagInput] = useState("");
    const { success, error } = useToast();
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
    const [showEditorConfirm, setShowEditorConfirm] = useState(false);
    const [loadingAction, setLoadingAction] = useState(false);

    const handleAddTag = async () => {
        if (!tagInput.trim() || index === undefined) return;
        
        try {
            const currentTags = safeArray<string>(change.tags);
            if (currentTags.includes(tagInput.trim())) {
                setTagInput("");
                return;
            }

            const newTags = [...currentTags, tagInput.trim()];
            const updatedChange = { ...change, tags: newTags };

            await patchService.updateQueueItem(index, updatedChange);
            setTagInput("");
            if (onUpdate) onUpdate();
            success("Tag added");
        } catch {
            error("Failed to update tags");
        }
    };

    const handleRemoveTag = async (tagToRemove: string) => {
        if (index === undefined) return;

        try {
            const currentTags = safeArray<string>(change.tags);
            const newTags = currentTags.filter(t => t !== tagToRemove);
            const updatedChange = { ...change, tags: newTags };

            await patchService.updateQueueItem(index, updatedChange);
            if (onUpdate) onUpdate();
            success("Tag removed");
        } catch {
            error("Failed to update tags");
        }
    };

    const handleRemoveChange = () => {
        if (index === undefined) return;
        setShowRemoveConfirm(true);
    };

    const confirmRemoveChange = async (e: React.MouseEvent) => {
        e.preventDefault();
        setLoadingAction(true);
        try {
            await patchService.removeFromQueue(index!);
            if (onUpdate) onUpdate();
            success("Change removed from queue");
            setShowRemoveConfirm(false);
        } catch {
            error("Failed to remove change");
        } finally {
            setLoadingAction(false);
        }
    };

    const handleOpenEditor = () => {
        if (index === undefined || !onOpenInEditor) return;
        setShowEditorConfirm(true);
    };

    const confirmOpenEditor = async (e: React.MouseEvent) => {
        e.preventDefault();
        setLoadingAction(true);
        try {
            // 1. Remove from Queue
            await patchService.removeFromQueue(index!);
            // 2. Refresh list (optional but good for sync)
            if (onUpdate) onUpdate();
            // 3. Open
            onOpenInEditor!(change);
            success("Draft restored to editor");
            setShowEditorConfirm(false);
        } catch {
            error("Failed to move to editor");
        } finally {
            setLoadingAction(false);
        }
    };


    return (
        <div className={cn(
            "group relative overflow-hidden rounded-xl border border-border/50 bg-card/50 p-4 transition-all hover:border-border hover:bg-card/80 hover:shadow-md",
            isSelected && "border-primary bg-primary/5 hover:bg-primary/10"
        )}>
            <div className="flex items-start gap-4">
                
                {/* Selection Checkbox */}
                {onSelect && (
                    <div className="pt-3 pl-1">
                        <input 
                            type="checkbox" 
                            checked={isSelected} 
                            onChange={onSelect}
                            className="w-4 h-4 cursor-pointer accent-primary" 
                        />
                    </div>
                )}
                
                {/* Icon Box */}
                <div className={cn(
                    "p-2.5 rounded-lg shrink-0 mt-1",
                    isNew ? "bg-green-500/10 text-green-500" :
                    isDelete ? "bg-red-500/10 text-red-500" :
                    "bg-blue-500/10 text-blue-500"
                )}>
                    {isNew ? <Plus className="w-5 h-5" /> :
                     isDelete ? <Trash2 className="w-5 h-5" /> :
                     <Edit2 className="w-5 h-5" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-3">
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-1">
                         <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                            <span className="font-bold text-sm tracking-tight">{change.name}</span>
                            {/* Category Badge */}
                            {change.category && (
                                <span className="px-1.5 py-0.5 rounded-sm bg-secondary text-secondary-foreground text-mini font-semibold uppercase tracking-wider border border-border/50">
                                    {change.category}
                                </span>
                            )}
                            {change.new === undefined && <span className="bg-destructive/10 text-destructive px-1.5 py-0.5 rounded text-mini font-bold uppercase tracking-wider">Deleted</span>}
                            {change.old === undefined && <span className="bg-success/10 text-success px-1.5 py-0.5 rounded text-mini font-bold uppercase tracking-wider">New</span>}
                            {change.new !== undefined && change.old !== undefined && <span className="bg-info/10 text-info px-1.5 py-0.5 rounded text-mini font-bold uppercase tracking-wider">Edit</span>}
                            <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">
                                {change.field}
                            </span>
                        </div>
                    </div>

                    {/* Diff Row */}
                    <div className="flex flex-col gap-2 text-sm bg-background/50 p-2 rounded-md border border-border/30">
                         <JsonDiff oldData={change.old} newData={change.new} diffs={change.diffs} />
                    </div>

                    {/* Meta Controls */}
                    <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-border/30">
                         <div className="flex flex-wrap gap-1">
                             <Tag className="w-3 h-3 text-muted-foreground mt-1 mr-1" />
                             {safeArray<string>(change.tags).map(t => (
                                 <div key={t} className="flex items-center gap-1 text-mini bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-medium border border-primary/20 group/tag">
                                     {t}
                                     {index !== undefined && (
                                    <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveTag(t)}
                                            className="h-6 w-6 p-0.5 hover:text-destructive focus-ring rounded-sm -mr-1"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </Button>
                                     )}
                                 </div>
                             ))}
                         </div>

                         {index !== undefined && (
                             <div className="flex items-center gap-1 ml-auto">
                                 {isEditingTags ? (
                                     <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-5 duration-200">
                                         <Input 
                                            className="h-6 w-24 text-mini" 
                                            placeholder="Add tag..." 
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                            autoFocus
                                         />
                                         <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleAddTag}>
                                             <Check className="w-3 h-3 text-green-500" />
                                         </Button>
                                         <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsEditingTags(false)}>
                                             <X className="w-3 h-3 text-muted-foreground" />
                                         </Button>
                                     </div>
                                 ) : (
                                     <Button 
                                        variant="ghost" 
                                        size="xs" 
                                        className="h-6 text-mini text-muted-foreground hover:text-foreground"
                                        onClick={() => setIsEditingTags(true)}
                                     >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Tag
                                     </Button>
                                 )}
                             </div>
                         )}

                        {/* Queue Actions */}
                         {index !== undefined && (
                             <div className="flex items-center gap-1 pl-2 border-l border-border/30 ml-2">
                                 {onOpenInEditor && (
                                     <Button 
                                        variant="ghost" 
                                        size="xs" 
                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                                        title="Open in Editor (Restore Draft)"
                                        onClick={handleOpenEditor}
                                     >
                                         <Edit2 className="w-4 h-4" />
                                     </Button>
                                 )}
                                 <Button 
                                    variant="ghost" 
                                    size="xs" 
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                    title="Remove Change"
                                    onClick={handleRemoveChange}
                                 >
                                     <Trash2 className="w-4 h-4" />
                                 </Button>
                             </div>
                         )}
                    </div>
                </div>
            </div>
            {/* Dialogs */}
            <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Change?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove this change? This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loadingAction}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRemoveChange} disabled={loadingAction} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {loadingAction ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showEditorConfirm} onOpenChange={setShowEditorConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Open in Editor?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove the change from the queue and load its state into the editor.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loadingAction}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmOpenEditor} disabled={loadingAction}>
                            {loadingAction ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Edit2 className="w-4 h-4 mr-2" />}
                            Open & Restore
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
