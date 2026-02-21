import { useMemo, useState } from "react";
import { Form } from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UnitHeaderPanel } from "./panels/UnitHeaderPanel";
import { SavePreviewDialog } from "./dialogs/SavePreviewDialog";
import { TableEditor } from "./TableEditor";
import { EntityHistoryPanel } from "./panels/EntityHistoryPanel";
import { TabBar } from "@/components/ui/TabBar";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useEditorForm } from "@/hooks/useEditorForm";
import { EditorToolbar } from "./EditorToolbar";
import { EditorProps, EntityEditorConfig } from "./editorConfig";
import { schemaToFields } from "@/domain/schemaToFields";
import { SubmitHandler } from "react-hook-form";

interface GenericEntityEditorProps<T> extends EditorProps {
  config: EntityEditorConfig<T>;
}

export function GenericEntityEditor<T extends { id?: string }>({ 
    config,
    isNew,
    onDuplicate,
    restoredChange,
    ...props
}: GenericEntityEditorProps<T>) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editorTab, setEditorTab] = useState<'edit' | 'history'>('edit');

  const {
    form,
    baseData,
    displayIcon,
    generatedFilename,
    watchedName,
    editorActions,
    handleSaveAction: handleBasicSave,
    handleQueueAction,
    handleQuickQueueAction,
    handleReset,
  } = useEditorForm<T>({
    ...props,
    config,
    isNew,
    restoredChange,
  });

  const { handleDelete, isSaving, preview, closePreview, handleClientValidation } = editorActions;

  const confirmDelete = () => handleDelete(() => setShowDeleteDialog(false));

  const fields = useMemo(() => schemaToFields(config.schema, config.fieldConfig), [config.schema, config.fieldConfig]);

  useKeyboardShortcuts({
      onSave: form.handleSubmit(handleBasicSave as SubmitHandler<Record<string, unknown>>, handleClientValidation),
  });

  return (
    <div className="w-full max-w-4xl mx-auto pb-20">
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            
            <EditorToolbar
              filename={props.filename}
              isNew={isNew}
              isSaving={isSaving}
              isDirty={form.formState.isDirty}
              isRestored={!!restoredChange}
              label={config.label}
              generatedFilename={generatedFilename}
              onDuplicate={onDuplicate}
              getValues={form.getValues}
              onSave={form.handleSubmit(handleBasicSave as SubmitHandler<Record<string, unknown>>, handleClientValidation)}
              onQueue={form.handleSubmit(handleQueueAction as SubmitHandler<Record<string, unknown>>, handleClientValidation)}
              onQuickQueue={form.handleSubmit(handleQuickQueueAction as SubmitHandler<Record<string, unknown>>, handleClientValidation)}
              onReset={handleReset}
            />

             <UnitHeaderPanel 
                unitName={watchedName}
                onIconUpload={(filename) => (form as { setValue: (name: string, value: unknown) => void }).setValue("icon", filename)}
                onDelete={isNew ? undefined : () => setShowDeleteDialog(true)}
                displayIcon={displayIcon}
            />

            <TabBar 
              items={[
                { value: 'edit', label: 'Edit Fields' },
                { value: 'history', label: 'Patch History' }
              ]}
              activeValue={editorTab}
              onValueChange={(v) => setEditorTab(v as 'edit' | 'history')}
            />

            {editorTab === 'edit' ? (
              <>
                  <TableEditor 
                      fields={fields} 
                      initialData={baseData} 
                  />
                  
                  {config.extraPanels?.map((Panel, i) => (
                      <div key={i} className="mt-8">
                          <Panel initialData={baseData ?? undefined} />
                      </div>
                  ))}
              </>
            ) : (
              <EntityHistoryPanel
                entityId={props.filename.replace('.json', '')}
                onRetcon={(field, oldValue) => {
                  (form as { setValue: (name: string, value: unknown, options?: Record<string, boolean>) => void }).setValue(field, oldValue, { shouldDirty: true });
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
                        <span className="font-bold text-foreground mx-1">{watchedName}</span>
                        from the database.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete {config.label}
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
