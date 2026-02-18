import { UseFormSetError } from 'react-hook-form';
import { useEntityMutation } from './mutations/useEntityMutation';
import { useDiffLogic } from './utils/useDiffLogic';
import { useToast } from '@/components/ui/toast-context';
import { ValidationError } from '@/services/DataService';
import { flattenFormErrors } from '@/lib/formUtils';

export interface UseEditorActionsProps<T extends Record<string, unknown>> {
    category: string;
    filename: string;
    initialData: T | Partial<T> | undefined;
    /** Pre-normalization snapshot from disk — preserves original file layout on save */
    rawInitialData?: T | Partial<T> | undefined;
    onSave?: (data?: T, filename?: string) => void;
    onNavigateToScribe?: () => void;
    label?: string; // e.g. "Unit", "Hero", "Item" - defaults to capitalized category
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setError?: UseFormSetError<any>;
}

export function useEditorActions<T extends Record<string, unknown>>({
    category,
    filename,
    initialData,
    rawInitialData,
    onSave,
    onNavigateToScribe,
    label,
    setError
}: UseEditorActionsProps<T>) {
    const { error } = useToast();
    
    // Determine user-friendly label if not provided
    const entityLabel = label || category.charAt(0).toUpperCase() + category.slice(1, -1); // "units" -> "Unit"

    // 1. Mutation Logic
    const { isSaving, saveEntity, deleteEntity } = useEntityMutation<T>({
        category,
        filename,
        entityLabel,
        onSave,
        onNavigateToScribe
    });

    // 2. Diff/Preview Logic — rawInitialData preserves original file structure
    const { preview, closePreview, requestSave } = useDiffLogic(initialData, rawInitialData);

    // 3. Helpers (Validation & Error Handling)
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
        const issues = flattenFormErrors(errors);

        if (issues.length > 0) {
            // Show top 3 errors to avoid spam
            const message = issues.slice(0, 3).join(', ') + (issues.length > 3 ? ` (+${issues.length - 3} more)` : '');
            error(`Validation Failed: ${message}`);
        } else {
            error("Validation Failed: Please check required fields.");
        }
    };

    // 4. Exposed Actions (Delegators)

    /**
     * Save — writes file to disk + records in audit log (patches.json).
     * Does NOT create a git commit.
     */
    /**
     * Save — writes file to disk + records in audit log (patches.json).
     * Does NOT create a git commit.
     */
    const handleSave = (data: Partial<T>, filenameOverride?: string, skipPreview: boolean = false) => {
        requestSave('silent', data, async (payload) => {
            try {
                 
                await saveEntity(payload, false, filenameOverride);
            } catch (err) {
                handleSaveError(err, "Error saving");
            }
        }, skipPreview);
    };

    /**
     * Queue — writes file + adds to the patch queue for batch release later.
     */
    const handleAddToQueue = (data: Partial<T>, filenameOverride?: string, skipPreview: boolean = false) => {
        requestSave('queue', data, async (payload) => {
            try {
                 
                await saveEntity(payload, true, filenameOverride);
            } catch (err) {
                handleSaveError(err, "Error adding to queue");
            }
        }, skipPreview);
    };
    
    const handleDelete = async (onSuccess?: () => void) => {
         try {
            await deleteEntity(onSuccess);
         } catch {
             error(`Failed to delete ${entityLabel}`);
         }
    };

    return {
        handleDelete,
        handleSave,
        handleAddToQueue,
        isSaving,
        preview,
        closePreview,
        handleClientValidation
    };

}
