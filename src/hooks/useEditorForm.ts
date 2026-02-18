import { useEffect, useMemo, useState, useRef } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEditorActions } from "@/hooks/useEditorActions";
import { EntityEditorConfig, EditorProps } from "@/components/editors/editorConfig";

interface UseEditorFormOptions<T> extends EditorProps {
  config: EntityEditorConfig<T>;
}

interface UseEditorFormReturn<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let base = { ...initialData } as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current = { ...initialData } as any;

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const category = (initialData as any)._category || config.category;
    const icon =
      current.icon || `${category}/${filename.replace(".json", ".png")}`;

    return {
      normalizedInitial: current as T,
      baseData: base as T,
      rawInitialData: rawSnapshot as T,
      displayIcon: icon,
    };
  }, [initialData, filename, restoredChange, config]);

  const form = useForm<T>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(config.schema) as any,
    defaultValues: (normalizedInitial || {
      id: newEntityId,
      ...config.defaultValues,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any,
  });

  // Re-sync form when initialData changes
  const { reset } = form;
  useEffect(() => {
    if (normalizedInitial) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      reset(normalizedInitial as any);
    }
  }, [normalizedInitial, reset]);

  // Debounced dirty check to avoid blocking the render loop on every keystroke
  // We use form.watch with a callback (subscription) instead of a hook (re-render)
  const dirtyTimer = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    // Subscribe to all changes
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
    initialData: baseData || initialData,
    rawInitialData: rawInitialData || undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSave: (data?: any, savedFilename?: string) => {
      if (data) {
          form.reset(data);
          onDirtyChange?.(false);
      }
      onSave?.(data, savedFilename);
    },
    onNavigateToScribe,
    label: config.label,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setError: form.setError as any,
  });

  // Dynamic filename for creation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const watchedName = form.watch("name" as any);
  const generatedFilename =
    isNew && watchedName
      ? watchedName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "") + ".json"
      : filename;

  // Pre-bound action handlers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSaveAction = (data: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    editorActions.handleSave(data, isNew ? generatedFilename : undefined, (config as any).skipDiff);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleQueueAction = (data: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    editorActions.handleAddToQueue(data, isNew ? generatedFilename : undefined, (config as any).skipDiff);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleQuickQueueAction = (data: any) => {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form: form as any,
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
