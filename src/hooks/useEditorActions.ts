import { useState } from 'react';
import { useToast } from '@/components/ui/toast-context';
import { dataService } from '@/services/DataService';
import { patchService } from '@/services/PatchService';
import { AppMode } from '@/types';
import { UseFormSetError } from 'react-hook-form';
import { ValidationError } from '@/services/DataService';

interface UseEditorActionsProps<T> {
    category: string;
    filename: string;
    mode: AppMode;
    initialData: T;
    onSave?: () => void;
    onNavigateToScribe?: () => void;
    label?: string; // e.g. "Unit", "Hero", "Item" - defaults to capitalized category
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setError?: UseFormSetError<any>;
}

export function useEditorActions<T>({
    category,
    filename,
    mode,
    initialData,
    onSave,
    onNavigateToScribe,
    label,
    setError
}: UseEditorActionsProps<T>) {
    const [isSaving, setIsSaving] = useState(false);
    const { success, error } = useToast();
    // Determine user-friendly label if not provided
    const entityLabel = label || category.charAt(0).toUpperCase() + category.slice(1, -1); // "units" -> "Unit"

    const handleDelete = async (onSuccess?: () => void) => {
        setIsSaving(true);
        try {
            await dataService.delete(category, filename, mode);
            success(`${entityLabel} deleted successfully`);
            if (onSave) onSave();
            if (onSuccess) onSuccess();
        } catch {
            error(`Failed to delete ${entityLabel.toLowerCase()}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveError = (err: unknown, defaultMessage: string) => {
        if (err instanceof ValidationError && setError) {
            err.fields.forEach(f => {
                setError(f.path, { type: 'server', message: f.message });
            });
            error("Validation Failed: Please check the form for errors.");
        } else {
            error(defaultMessage);
        }
    };

    /**
     * Handles client-side Zod validation errors from react-hook-form
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleClientValidation = (errors: any) => {
        const issues: string[] = [];
        
        // Recursively extract error messages
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const extractErrors = (obj: any) => {
            for (const key in obj) {
                if (obj[key]?.message && typeof obj[key].message === 'string') {
                    issues.push(`${key}: ${obj[key].message}`);
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    extractErrors(obj[key]);
                }
            }
        };
        extractErrors(errors);

        if (issues.length > 0) {
            // Show top 3 errors to avoid spam
            const message = issues.slice(0, 3).join(', ') + (issues.length > 3 ? ` (+${issues.length - 3} more)` : '');
            error(`Validation Failed: ${message}`);
        } else {
            error("Validation Failed: Please check required fields.");
        }
    };

    // --- Diff / Preview Logic ---
    const [preview, setPreview] = useState<{
        isOpen: boolean;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        oldData: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        newData: any;
        saveType: 'silent' | 'quick' | 'queue';
        onConfirm: () => Promise<void>;
    } | null>(null);

    const closePreview = () => setPreview(null);

    // Helper to check for changes and trigger flow
    const requestSave = (
        type: 'silent' | 'quick' | 'queue',
        newData: Partial<T>,
        executeSave: () => Promise<void>
    ) => {
        // Safe check for new entities or simple diff
        const isNew = !initialData || (Object.keys(initialData).length === 0);
        
        // Merge for comparison
        const finalData = { ...initialData, ...newData };
        
        // If not new, check for diff (using JSON stringify for simple deep check, or deep-diff if strictly needed)
        // Using simple JSON comparison for efficiency here as we just need "isDirty"
        const hasChanges = JSON.stringify(initialData) !== JSON.stringify(finalData);

        if (!isNew && !hasChanges) {
             success("No changes detected");
             return;
        }

        setPreview({
            isOpen: true,
            oldData: initialData,
            newData: finalData,
            saveType: type,
            onConfirm: async () => {
                await executeSave();
                setPreview(null);
            }
        });
    };

    /**
     * Silent Save — writes the JSON file only.
     */
    const handleSilentSave = (data: Partial<T>, filenameOverride?: string) => {
        requestSave('silent', data, async () => {
            setIsSaving(true);
            const targetFilename = filenameOverride || filename;
            try {
                const payload = { ...initialData, ...data };
                await dataService.save(category, targetFilename, payload, mode, false);
                if (onSave) onSave();
                success(`Saved ${entityLabel}`);
            } catch (err) {
                handleSaveError(err, "Error saving");
            } finally {
                setIsSaving(false);
            }
        });
    };

    /**
     * Quick Save — writes file + creates tagged patch.
     */
    const handleQuickSave = (data: Partial<T> & { id?: string; name?: string }, quickTag: string = 'quick-edit', filenameOverride?: string, reason?: string) => {
        requestSave('quick', data, async () => {
            setIsSaving(true);
            const targetFilename = filenameOverride || filename;
            try {
                const payload = { ...initialData, ...data };
                await dataService.save(category, targetFilename, payload, mode, false);
                
                // Commit Patch
                await patchService.quickCommit(mode, {
                    change: {
                        target_id: data.id || targetFilename,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        name: data.name || (initialData as any).name || targetFilename,
                        field: 'quick-edit',
                        old: initialData,
                        new: payload,
                        ...(reason ? { reason } : {}),
                    },
                    tags: [quickTag]
                });

                if (onSave) onSave();
                success(`Quick Saved! (Tag: ${quickTag})`);
            } catch (err) {
                handleSaveError(err, "Error during quick save");
            } finally {
                setIsSaving(false);
            }
        });
    };

    /**
     * Queue Save — writes file + adds to patch queue.
     */
    const handleAddToQueue = (data: Partial<T>, filenameOverride?: string) => {
        requestSave('queue', data, async () => {
            setIsSaving(true);
            const targetFilename = filenameOverride || filename;
            try {
                const payload = { ...initialData, ...data };
                await dataService.save(category, targetFilename, payload, mode, true);

                if (onSave) onSave();
                success(
                    "Saved & Added to Queue",
                    onNavigateToScribe ? { label: "Review in Scribe →", onClick: onNavigateToScribe } : undefined
                );
            } catch (err) {
                handleSaveError(err, "Error adding to queue");
            } finally {
                setIsSaving(false);
            }
        });
    };

    return {
        handleDelete,
        handleSilentSave,
        handleQuickSave,
        handleAddToQueue,
        isSaving,
        preview,
        closePreview,
        handleClientValidation
    };

}
