import { useEffect, useMemo, useState } from "react";
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
  const { normalizedInitial, baseData, displayIcon } = useMemo(() => {
    if (!initialData)
      return { normalizedInitial: null, baseData: null, displayIcon: "" };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let base = { ...initialData } as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current = { ...initialData } as any;

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
  useEffect(() => {
    if (normalizedInitial) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      form.reset(normalizedInitial as any);
    }
  }, [normalizedInitial, form]);

  // Report dirty state to parent
  useEffect(() => {
    onDirtyChange?.(form.formState.isDirty);
  }, [form.formState.isDirty, onDirtyChange]);

  // Editor actions (save, queue, delete, diff preview)
  const editorActions = useEditorActions({
    category: config.category,
    filename,
    initialData: baseData || initialData,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSave: (data?: any, savedFilename?: string) => {
      if (data) form.reset(data);
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
    editorActions.handleSave(data, isNew ? generatedFilename : undefined);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleQueueAction = (data: any) => {
    editorActions.handleAddToQueue(data, isNew ? generatedFilename : undefined);
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
    handleReset,
  };
}
