import { useEffect, useMemo, useState, useRef } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEditorActions } from "@/hooks/useEditorActions";
import {
  EntityEditorConfig,
  EditorProps,
} from "@/components/editors/editorConfig";

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

  // NORMALIZATION PIPELINE
  // Why: The editor works with normalized data (e.g. abilities as arrays), but
  // we must track the raw disk format separately so we can merge user changes
  // back onto the original file without accidentally dropping fields the editor
  // doesn't know about. rawInitialData = pre-normalization snapshot.
  const { normalizedInitial, baseData, rawInitialData, displayIcon } =
    useMemo(() => {
      if (!initialData)
        return {
          normalizedInitial: null,
          baseData: null,
          rawInitialData: null,
          displayIcon: "",
        };

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

      const category =
        (initialData as Record<string, unknown>)._category || config.category;
      const icon = String(
        current.icon || `${category}/${filename.replace(".json", ".png")}`
      );

      return {
        normalizedInitial: current as T,
        baseData: base as T,
        rawInitialData: rawSnapshot as T,
        displayIcon: icon,
      };
    }, [initialData, filename, restoredChange, config]);

  const form = useForm<T>({
    // RHF generic variance workaround — see https://github.com/react-hook-form/react-hook-form/discussions/7764
    resolver: zodResolver(
      config.schema
    ) as import("react-hook-form").Resolver<T>,
    defaultValues: (normalizedInitial || {
      id: newEntityId,
      ...config.defaultValues,
    }) as import("react-hook-form").DefaultValues<T>,
  });

  // Re-sync form when initialData changes
  const { reset } = form;
  useEffect(() => {
    if (normalizedInitial) {
      reset(normalizedInitial as import("react-hook-form").DefaultValues<T>);
    }
  }, [normalizedInitial, reset]);

  // DEBOUNCED DIRTY CHECK
  // Why: RHF's built-in `isDirty` triggers on every field mount and is unreliable
  // with Zod-normalized data. Instead we subscribe to all changes via `form.watch`
  // and deep-compare JSON strings on a 300ms debounce. This avoids blocking the
  // render loop on every keystroke while still giving accurate dirty status.
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
        const isActuallyDirty =
          JSON.stringify(current) !== JSON.stringify(defaults);
        onDirtyChange?.(isActuallyDirty);
      }, 300);
    });

    return () => subscription.unsubscribe();
  }, [form, onDirtyChange]);

  // Editor actions (save, queue, delete, diff preview)
  const editorActions = useEditorActions({
    category: config.category,
    filename,
    initialData: (baseData || initialData) as
      | Record<string, unknown>
      | undefined,
    rawInitialData: rawInitialData || undefined,
    onSave: (data?: Record<string, unknown>, savedFilename?: string) => {
      if (data) {
        // [FIX] Do NOT reset form here — it causes a race condition with parent re-fetch.
        // Why: After save, the parent component re-fetches from the server which updates
        // `initialData`. This triggers the useEffect above to reset the form with fresh
        // server data. If we also reset here, we'd clobber the updated defaults with
        // stale values, causing a phantom "unsaved changes" state.
        onDirtyChange?.(false);
      }
      onSave?.(data, savedFilename);
    },
    onNavigateToScribe,
    label: config.label,
    // RHF generic variance workaround
    setError:
      form.setError as unknown as import("react-hook-form").UseFormSetError<
        Record<string, unknown>
      >,
  });

  // Dynamic filename for creation
  const watchedName = (form.watch(
    "name" as import("react-hook-form").Path<T>
  ) ?? "") as string;
  const generatedFilename =
    isNew && watchedName
      ? watchedName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "") + ".json"
      : filename;

  // Pre-bound action handlers
  const handleSaveAction = (data: Record<string, unknown>) => {
    editorActions.handleSave(
      data,
      isNew ? generatedFilename : undefined,
      config.skipDiff
    );
  };

  const handleQueueAction = (data: Record<string, unknown>) => {
    editorActions.handleAddToQueue(
      data,
      isNew ? generatedFilename : undefined,
      config.skipDiff
    );
  };

  const handleQuickQueueAction = (data: Record<string, unknown>) => {
    // Force skipPreview = true
    editorActions.handleAddToQueue(
      data,
      isNew ? generatedFilename : undefined,
      true
    );
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
