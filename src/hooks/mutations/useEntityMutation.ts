import { useState } from 'react';
import { useToast } from '@/components/ui/toast-context';
import { dataService } from '@/services/DataService';

interface UseEntityMutationProps<T extends Record<string, unknown>> {
    category: string;
    filename: string;
    entityLabel?: string;
    onSave?: (data?: T, filename?: string) => void;
    onNavigateToScribe?: () => void;
}

export function useEntityMutation<T extends Record<string, unknown>>({
    category,
    filename,
    entityLabel = 'Entity',
    onSave,
    onNavigateToScribe,
}: UseEntityMutationProps<T>) {
    const [isSaving, setIsSaving] = useState(false);
    const { success } = useToast();

    const saveEntity = async (payload: T, queue: boolean, filenameOverride?: string) => {
         setIsSaving(true);
         const targetFilename = filenameOverride || filename;
         try {
             await dataService.save(category, targetFilename, payload, queue);
             
             if (queue) {
                 success(
                     "Saved & Added to Queue",
                     onNavigateToScribe ? { label: "Review in Scribe ->", onClick: onNavigateToScribe } : undefined
                 );
             } else {
                 success(`Saved ${entityLabel}`);
             }

             if (onSave) onSave(payload, targetFilename);
         } finally {
             setIsSaving(false);
         }
    };

    const deleteEntity = async (onSuccess?: () => void) => {
        setIsSaving(true);
        try {
            await dataService.delete(category, filename);
            success(`${entityLabel} deleted successfully`);
            if (onSave) onSave();
            if (onSuccess) onSuccess();
        } finally {
            setIsSaving(false);
        }
    };

    return {
        isSaving,
        saveEntity,
        deleteEntity
    };
}
