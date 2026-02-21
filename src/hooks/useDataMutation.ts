import { useState } from "react";
import { useToast } from "@/components/ui/toast-context";
import { dataService } from "@/services/DataService";

export interface UseDataMutationProps<T extends Record<string, unknown>> {
  category: string;
  filename: string;
  entityLabel?: string;
  initialData: T | Partial<T> | undefined;
  rawInitialData?: T | Partial<T> | undefined;
  onSave?: (data?: T, filename?: string) => void;
  onNavigateToScribe?: () => void;
}

export function useDataMutation<T extends Record<string, unknown>>({
  category,
  filename,
  entityLabel = "Entity",
  initialData,
  rawInitialData,
  onSave,
  onNavigateToScribe,
}: UseDataMutationProps<T>) {
  const { success } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Preview State
  const [preview, setPreview] = useState<{
    isOpen: boolean;
    oldData: unknown;
    newData: unknown;
    saveType: "silent" | "queue";
    onConfirm: () => Promise<void>;
  } | null>(null);

  const closePreview = () => setPreview(null);

  // Core Save Logic
  const saveEntity = async (
    payload: T,
    queue: boolean,
    filenameOverride?: string
  ) => {
    setIsSaving(true);
    const targetFilename = filenameOverride || filename;
    try {
      await dataService.save(category, targetFilename, payload, queue);

      if (queue) {
        success(
          "Saved & Added to Queue",
          onNavigateToScribe
            ? { label: "Review in Scribe ->", onClick: onNavigateToScribe }
            : undefined
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

  // Diff/Payload generation Logic
  const requestSave = (
    type: "silent" | "queue",
    newData: Partial<T>,
    executeSave: (finalData: T) => Promise<void>,
    skipPreview: boolean = false
  ) => {
    // Safe check for new entities or simple diff
    const isNew = !initialData || Object.keys(initialData).length === 0;

    // Clean up empty strings to undefined to match "missing" keys in JSON
    const sanitizedNewData = { ...newData };
    for (const key in sanitizedNewData) {
      if ((sanitizedNewData as Record<string, unknown>)[key] === "") {
        (sanitizedNewData as Record<string, unknown>)[key] = undefined;
      }
    }

    // DELTA-ONLY SAVE
    // Why: The editor form only knows about normalized fields. If we sent the
    // entire form state, we'd overwrite fields the editor never rendered
    // (e.g. legacy keys, unknown metadata). Instead, we diff form values
    // against initialData and only send the keys the user actually touched.
    const userChanges: Record<string, unknown> = {};
    if (!isNew && initialData) {
      for (const key in sanitizedNewData) {
        const formVal = JSON.stringify(
          (sanitizedNewData as Record<string, unknown>)[key]
        );
        const initVal = JSON.stringify(
          (initialData as Record<string, unknown>)[key]
        );
        if (formVal !== initVal) {
          userChanges[key] = (sanitizedNewData as Record<string, unknown>)[key];
        }
      }
    }

    // RAW BASE MERGING
    // Why: We start from rawInitialData (the un-normalized JSON on disk) and
    // layer only the changed fields on top. This preserves the original file
    // shape and any keys the schema doesn't cover, preventing the "shrinking
    // file" problem where saves progressively drop unknown fields.
    const base = rawInitialData || initialData;
    const finalData = isNew
      ? (JSON.parse(
          JSON.stringify({ ...initialData, ...sanitizedNewData })
        ) as T)
      : (JSON.parse(JSON.stringify({ ...base, ...userChanges })) as T);

    // For the diff preview, compare raw disk data vs final payload
    const diffBase = rawInitialData || initialData;
    const hasChanges = JSON.stringify(diffBase) !== JSON.stringify(finalData);

    if (!isNew && !hasChanges) {
      success("No changes detected");
      return;
    }

    (finalData as Record<string, unknown>).last_modified =
      new Date().toISOString();

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
      },
    });
  };

  return {
    isSaving,
    saveEntity,
    deleteEntity,
    preview,
    closePreview,
    requestSave,
  };
}
