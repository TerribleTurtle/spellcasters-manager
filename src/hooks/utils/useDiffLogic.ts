import { useState } from 'react';
import { useToast } from '@/components/ui/toast-context';

export function useDiffLogic<T>(initialData: T | Partial<T> | undefined) {
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
        executeSave: (finalData: T) => Promise<void>
    ) => {
        // Safe check for new entities or simple diff
        const isNew = !initialData || (Object.keys(initialData).length === 0);
        
        // Merge for comparison
        // We clean up empty strings to undefined to match "missing" keys in JSON
        const sanitizedNewData = { ...newData };
        for (const key in sanitizedNewData) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((sanitizedNewData as any)[key] === "") {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (sanitizedNewData as any)[key] = undefined;
            }
        }

        // Deep clean undefineds to actually remove the keys for clean diffing
        const finalData = JSON.parse(JSON.stringify({ ...initialData, ...sanitizedNewData })) as T;
        
        // Inject last_modified so the user sees it in the diff preview
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (finalData as any).last_modified = new Date().toISOString();

        // If not new, check for diff (using JSON stringify for simple deep check)
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
