import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
} from "@/components/ui/form"
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


import { UnitHeaderPanel } from "./panels/UnitHeaderPanel";
import { SavePreviewDialog } from "./dialogs/SavePreviewDialog";
import { TableEditor } from "./TableEditor";
import { EntityHistoryPanel } from "./panels/EntityHistoryPanel";
import { AppMode } from "@/types";
import { ConsumableSchema, Consumable } from "@/domain/schemas";
import { schemaToFields, CONSUMABLE_FIELD_CONFIG } from "@/domain/schemaToFields";
import { TagSelect } from "@/components/ui/TagSelect";
import { TabBar } from "@/components/ui/TabBar";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useEditorActions } from "@/hooks/useEditorActions";
import { Save, GitBranchPlus, Copy } from "lucide-react";

type ConsumableFormValues = z.infer<typeof ConsumableSchema>

interface ConsumableEditorProps {
  initialData?: Consumable;
  filename: string;
  mode: AppMode;
  onSave?: () => void;
  onNavigateToScribe?: () => void;
  onDirtyChange?: (dirty: boolean) => void;

  isNew?: boolean;
  onDuplicate?: (data: any) => void;
}

const CONSUMABLE_FIELDS = schemaToFields(ConsumableSchema, CONSUMABLE_FIELD_CONFIG);

export function ConsumableEditor({ initialData, filename, mode, onSave, onNavigateToScribe, onDirtyChange, isNew, onDuplicate }: ConsumableEditorProps) {
  const [quickTag, setQuickTag] = useState("fix");
  const [reason, setReason] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editorTab, setEditorTab] = useState<'edit' | 'history'>('edit');

  // Generate ID for new item if not provided
  const [nextId] = useState(() => isNew ? crypto.randomUUID() : "");

  // Normalize data BEFORE creating the form to prevent first-render dropdown flicker
  const normalizedInitial = useMemo(() => {
    if (!initialData) return null;
    const data = { ...initialData } as ConsumableFormValues;
    // Auto-infer icon if missing
    if (!data.icon) {
       const namePart = filename.replace('.json', '').toLowerCase().replace(/\s+/g, '_');
       const category = (initialData as any)._category || 'consumables';
       data.icon = `${category}/${namePart}.png`;
    }
    return data;
  }, [initialData, filename]);

  const form = useForm<ConsumableFormValues>({
    resolver: zodResolver(ConsumableSchema) as any,
    defaultValues: normalizedInitial || {
      id: nextId,
      name: "",
      description: "",
      icon: "",
      effect_type: "Heal",
      value: 0,
      duration: 0,
      cooldown: 0,
      rarity: "Common",
      stack_size: 1,
      cost: 0,
    },
  })

  // Re-sync form when initialData changes (e.g. navigating between entities)
  useEffect(() => {
    if (normalizedInitial) {
      form.reset(normalizedInitial);
    }
  }, [normalizedInitial, form])

  // Report dirty state to parent
  useEffect(() => {
    onDirtyChange?.(form.formState.isDirty);
  }, [form.formState.isDirty, onDirtyChange]);

    /* --- Consolidate Actions --- */
  const { handleDelete, handleSilentSave, handleQuickSave, handleAddToQueue, isSaving, preview, closePreview, handleClientValidation } = useEditorActions({
    category: 'consumables',
    filename,
    mode,
    initialData: normalizedInitial || initialData,
    onSave,
    onNavigateToScribe,
    label: "Item",
    setError: form.setError
  });

  const confirmDelete = () => handleDelete(() => setShowDeleteDialog(false));

  // Dynamic filename for creation
  const watchedName = form.watch("name");
  const generatedFilename = isNew && watchedName 
      ? watchedName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') + ".json" 
      : filename;

  const handleSilentSaveAction = (data: any) => {
      handleSilentSave(data, isNew ? generatedFilename : undefined);
  };

  const handleSaveAction = (data: any, tag: string) => {
      handleQuickSave(data, tag, isNew ? generatedFilename : undefined, reason || undefined);
  };

  const handleQueueAction = (data: any) => {
      handleAddToQueue(data, isNew ? generatedFilename : undefined);
  };

  useKeyboardShortcuts({
      onSave: form.handleSubmit(handleSilentSaveAction, handleClientValidation),
      onShiftSave: form.handleSubmit((data) => handleSaveAction(data, quickTag), handleClientValidation),
  });

  return (
    <div className="w-full max-w-4xl mx-auto pb-20">
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            
            {/* Action Bar */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold tracking-tight">{filename.replace('.json', '')}</h2>
                <div className="flex items-center gap-2">
                   <Button 
                     type="button" 
                     variant="ghost" 
                     size="sm"
                     onClick={() => form.reset()} 
                     disabled={isSaving}
                   >
                     Reset
                   </Button>
                   
                   {!isNew && onDuplicate && (
                       <Button
                           type="button"
                           variant="ghost"
                           size="sm"
                           onClick={() => onDuplicate(form.getValues())}
                           disabled={isSaving}
                           title="Duplicate this item (enters creation mode)"
                       >
                           <Copy className="w-4 h-4 mr-1.5" />
                           Duplicate
                       </Button>
                   )}

                   {/* Silent Save — Ctrl+S */}
                   <Button 
                     type="button" 
                     variant="outline"
                     size="sm"
                     onClick={form.handleSubmit(handleSilentSaveAction, handleClientValidation)}
                     disabled={isSaving}
                     title="Save file only, no patch entry (Ctrl+S)"
                   >
                     <Save className="w-4 h-4 mr-1.5" />
                     {isNew ? "Create" : "Save"}
                   </Button>

                   {/* Patch Save — Ctrl+Shift+S */}
                   <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-md border border-border">
                       <TagSelect value={quickTag} onChange={setQuickTag} />
                       <Button 
                            type="button" 
                            size="sm" 
                            variant="secondary"
                            onClick={form.handleSubmit((data) => handleSaveAction(data, quickTag), handleClientValidation)}
                            disabled={isSaving}
                            title="Save + create patch entry (Ctrl+Shift+S)"
                        >
                            {isNew ? "Create + Tag" : "Save + Tag"}
                       </Button>
                   </div>

                   <Button 
                        type="button" 
                        size="sm"
                        onClick={form.handleSubmit(handleQueueAction, handleClientValidation)}
                        disabled={isSaving}
                        title="Save + add to patch queue for batch commit"
                   >
                        <GitBranchPlus className="w-4 h-4 mr-1.5" />
                        {isNew ? "Create & Queue" : "Queue"}
                   </Button>
                </div>
            </div>

            {/* Reason / Note (optional — shows in patch history) */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Reason / note (optional — shown in patch history)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-8 text-xs flex-1"
              />
            </div>

            {isNew && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
                    <span>Will be saved as:</span>
                    <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono text-xs">
                        {generatedFilename}
                    </code>
                </div>
            )}

            {/* Header (Name, Icon, Description) */}
            <UnitHeaderPanel 
               control={form.control} 
               mode={mode} 
               unitName={form.watch("name")}
               onIconUpload={(filename) => form.setValue("icon", filename)}
               onDelete={isNew ? undefined : () => setShowDeleteDialog(true)}
            />
            {/* Tab Switcher */}
            <TabBar 
              items={[
                { value: 'edit', label: 'Edit Fields' },
                { value: 'history', label: 'Patch History' }
              ]}
              activeValue={editorTab}
              onValueChange={(v) => setEditorTab(v as 'edit' | 'history')}
            />

            {editorTab === 'edit' ? (
              <TableEditor 
                  fields={CONSUMABLE_FIELDS} 
                  control={form.control} 
                  initialData={normalizedInitial} 
              />
            ) : (
              <EntityHistoryPanel
                entityId={filename.replace('.json', '')}
                mode={mode}
                onRetcon={(field, oldValue) => {
                  form.setValue(field as any, oldValue, { shouldDirty: true });
                  setEditorTab('edit');
                }}
              />
            )}
          </form>
        </Form>
        
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete 
                        <span className="font-bold text-foreground mx-1">{form.getValues("name")}</span>
                        from the {mode} database.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete Item
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {preview && (
            <SavePreviewDialog 
                isOpen={preview.isOpen}
                onOpenChange={(open) => !open && closePreview()}
                onConfirm={preview.onConfirm}
                onCancel={closePreview}
                oldData={preview.oldData}
                newData={preview.newData}
                saveType={preview.saveType}
                isNew={isNew}
            />
        )}
    </div>
  )
}
