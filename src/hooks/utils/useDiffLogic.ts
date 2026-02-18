import { useState } from 'react';
import { useToast } from '@/components/ui/toast-context';

/**
 * @param initialData - Normalized data (used for detecting what the user changed)
 * @param rawData - Pre-normalization snapshot from disk (used as save base to preserve file layout)
 */
export function useDiffLogic<T>(initialData: T | Partial<T> | undefined, rawData?: T | Partial<T> | undefined) {
    const { success } = useToast();
    const [preview, setPreview] = useState<{
        isOpen: boolean;
        oldData: unknown;
        newData: unknown;
        saveType: 'silent' | 'queue';
        onConfirm: () => Promise<void>;
    } | null>(null);

    const closePreview = () => setPreview(null);

    const requestSave = (
        type: 'silent' | 'queue',
        newData: Partial<T>,
        executeSave: (finalData: T) => Promise<void>,
        skipPreview: boolean = false
    ) => {
        // Safe check for new entities or simple diff
        const isNew = !initialData || (Object.keys(initialData).length === 0);
        
        // Clean up empty strings to undefined to match "missing" keys in JSON
        const sanitizedNewData = { ...newData };
        for (const key in sanitizedNewData) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((sanitizedNewData as any)[key] === "") {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (sanitizedNewData as any)[key] = undefined;
            }
        }

        // DELTA-ONLY SAVE: Find only the fields the user actually changed
        // by comparing form state against the normalized initial (same structure).
        // Then apply ONLY those changes to the raw disk data, preserving the
        // original file layout (field names, data structures, ordering).
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userChanges: Record<string, any> = {};
        if (!isNew && initialData) {
            for (const key in sanitizedNewData) {
                const formVal = JSON.stringify((sanitizedNewData as Record<string, unknown>)[key]);
                const initVal = JSON.stringify((initialData as Record<string, unknown>)[key]);
                if (formVal !== initVal) {
                    userChanges[key] = (sanitizedNewData as Record<string, unknown>)[key];
                }
            }
        }

        // Build final payload: raw disk data + only user changes + timestamp
        const base = rawData || initialData;
        const finalData = isNew
            ? JSON.parse(JSON.stringify({ ...initialData, ...sanitizedNewData })) as T
            : JSON.parse(JSON.stringify({ ...base, ...userChanges })) as T;
        
        // Inject last_modified so the user sees it in the diff preview
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (finalData as any).last_modified = new Date().toISOString();

        // For the diff preview, compare raw disk data vs final payload
        // so the user sees exactly what will change on disk
        const diffBase = rawData || initialData;
        const hasChanges = JSON.stringify(diffBase) !== JSON.stringify(finalData);

        if (!isNew && !hasChanges) {
             success("No changes detected");
             return;
        }
        
        // SKIP LOGIC
        if (isNew || skipPreview) {
             void executeSave(finalData);
             return;
        }

        setPreview({
            isOpen: true,
            oldData: diffBase,
            newData: finalData,
            saveType: type,
            onConfirm: async () => {
                await executeSave(finalData);
                setPreview(null);
            }
        });
    };

    return {
        preview,
        closePreview,
        requestSave
    };
}
