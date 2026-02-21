import { useEffect, useMemo, useState, useRef } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEditorActions } from "@/hooks/useEditorActions";
import { EntityEditorConfig, EditorProps } from "@/components/editors/editorConfig";

interface UseEditorFormOptions<T> extends EditorProps {
  config: EntityEditorConfig<T>;
}

interface UseEditorFormReturn<T> {
  form: UseFormReturn<Record<string, unknown>>;
  baseData: T | null;
  displayIcon: string;
  generatedFilename: string;
  watchedName: string;
  editorActions: ReturnType<typeof useEditorActions>;
  // Pre-bound handlers that account for isNew / generatedFilename
  handleSaveAction: (data: T) => void;
  handleQueueAction: (data: T) => void;
  handleQuickQueueAction: (data: T) => void;
  handleReset: () => void;
}

export function useEditorForm<T extends { id?: string }>({
  initialData,
  filename,
  onSave,
  onNavigateToScribe,
  onDirtyChange,
  isNew,
  restoredChange,
  onDiscardRestoredChange,
  config,
}: UseEditorFormOptions<T>): UseEditorFormReturn<T> {
  const [newEntityId] = useState(() => (isNew ? crypto.randomUUID() : ""));

  // Normalize data BEFORE creating the form
  // rawInitialData = pre-normalization snapshot (preserves original file layout on disk)
  const { normalizedInitial, baseData, rawInitialData, displayIcon } = useMemo(() => {
    if (!initialData)
      return { normalizedInitial: null, baseData: null, rawInitialData: null, displayIcon: "" };

    let base = { ...initialData } as Record<string, unknown>;
    let current = { ...initialData } as Record<string, unknown>;

    // Capture raw state BEFORE normalization (deep clone to freeze it)
    const rawSnapshot = JSON.parse(JSON.stringify(base));

    if (restoredChange) {
      if (restoredChange.old) base = { ...base, ...restoredChange.old };
      if (restoredChange.new) current = { ...current, ...restoredChange.new };
    }

    if (config.normalize) {
      base = config.normalize(base);
      current = config.normalize(current);
    }

    const category = (initialData as Record<string, unknown>)._category || config.category;
    const icon =
      String(current.icon || `${category}/${filename.replace(".json", ".png")}`);

    return {
      normalizedInitial: current as T,
      baseData: base as T,
      rawInitialData: rawSnapshot as T,
      displayIcon: icon,
    };
  }, [initialData, filename, restoredChange, config]);

  const form = useForm<T>({
    resolver: zodResolver(config.schema) as import('react-hook-form').Resolver<T>,
    defaultValues: (normalizedInitial || {
      id: newEntityId,
      ...config.defaultValues,
    }) as import('react-hook-form').DefaultValues<T>,
  });

  // Re-sync form when initialData changes
  const { reset } = form;
  useEffect(() => {
    if (normalizedInitial) {
      reset(normalizedInitial as import('react-hook-form').DefaultValues<T>);
    }
  }, [normalizedInitial, reset]);

  // Debounced dirty check to avoid blocking the render loop on every keystroke
  // We use form.watch with a callback (subscription) instead of a hook (re-render)
  const dirtyTimer = useRef<NodeJS.Timeout>(null);
  
  useEffect(() => {
    // Subscribe to all changes
    // eslint-disable-next-line react-hooks/incompatible-library
    const subscription = form.watch(() => {
      if (dirtyTimer.current) {
        clearTimeout(dirtyTimer.current);
      }
      
      dirtyTimer.current = setTimeout(() => {
        const current = form.getValues();
        const defaults = form.formState.defaultValues;
        
        // Deep compare
        const isActuallyDirty = JSON.stringify(current) !== JSON.stringify(defaults);
        onDirtyChange?.(isActuallyDirty);
      }, 300);
    });
    
    return () => subscription.unsubscribe();
  }, [form, onDirtyChange]);

  // Editor actions (save, queue, delete, diff preview)
  const editorActions = useEditorActions({
    category: config.category,
    filename,
    initialData: (baseData || initialData) as Record<string, unknown> | undefined,
    rawInitialData: rawInitialData || undefined,
    onSave: (data?: Record<string, unknown>, savedFilename?: string) => {
      if (data) {
          // [FIX] Do NOT reset form here. It causes a race condition with parent re-fetch.
          // The parent will update initialData -> triggers useEffect -> resets form correctly.
          onDirtyChange?.(false);
      }
      onSave?.(data, savedFilename);
    },
    onNavigateToScribe,
    label: config.label,
    setError: form.setError as unknown as import('react-hook-form').UseFormSetError<Record<string, unknown>>,
  });

  // Dynamic filename for creation
  const watchedName = (form.watch("name" as import("react-hook-form").Path<T>) ?? "") as string;
  const generatedFilename =
    isNew && watchedName
      ? watchedName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "") + ".json"
      : filename;

  // Pre-bound action handlers
  const handleSaveAction = (data: Record<string, unknown>) => {
    editorActions.handleSave(data, isNew ? generatedFilename : undefined, (config as unknown as Record<string, unknown>).skipDiff as boolean);
  };

  const handleQueueAction = (data: Record<string, unknown>) => {
    editorActions.handleAddToQueue(data, isNew ? generatedFilename : undefined, (config as unknown as Record<string, unknown>).skipDiff as boolean);
  };

  const handleQuickQueueAction = (data: Record<string, unknown>) => {
    // Force skipPreview = true
    editorActions.handleAddToQueue(data, isNew ? generatedFilename : undefined, true);
  };

  const handleReset = () => {
    if (form.formState.isDirty) {
      form.reset();
      return;
    }
    if (restoredChange && onDiscardRestoredChange) {
      onDiscardRestoredChange();
    }
  };


  return {
    form: form as unknown as UseFormReturn<Record<string, unknown>>,
    baseData,
    displayIcon,
    generatedFilename,
    watchedName,
    editorActions,
    handleSaveAction,
    handleQueueAction,
    handleQuickQueueAction,
    handleReset,
  };
}
