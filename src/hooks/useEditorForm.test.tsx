/**
 * @vitest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useEditorForm } from './useEditorForm';
import { z } from 'zod';
import { describe, it, expect, vi } from 'vitest';

// Mock dependencies
vi.mock("@/hooks/useEditorActions", () => ({
  useEditorActions: () => ({
    handleSave: vi.fn(),
    handleAddToQueue: vi.fn(),
    handleDelete: vi.fn(),
    isSaving: false,
    preview: null,
    closePreview: vi.fn(),
    handleClientValidation: vi.fn(),
    setError: vi.fn(),
  })
}));

describe('useEditorForm Dirty State', () => {
    const TestSchema = z.object({
        id: z.string(),
        name: z.string(),
        tags: z.array(z.string()).optional(),
        stats: z.object({
            health: z.number()
        }).optional()
    });

    const defaultConfig = {
        schema: TestSchema,
        fieldConfig: {},
        category: 'units',
        label: 'Test Unit',
        defaultValues: {
            tags: [],
            stats: { health: 100 }
        }
    };

    const initialData = {
        id: 'test-1',
        name: 'Test Unit',
        tags: ['a', 'b'],
        stats: { health: 100 }
    };

    it('should be clean initially', () => {
        const onDirtyChange = vi.fn();
        
        renderHook(() => useEditorForm({
            config: defaultConfig as any,
            filename: 'test.json',
            initialData,
            onDirtyChange
        }));

        // The debounced dirty check fires only on form.watch() changes,
        // so onDirtyChange should NOT have been called on mount (no change occurred).
        expect(onDirtyChange).not.toHaveBeenCalled();
    });

    it('should be dirty when primitive value changes', async () => {
        const onDirtyChange = vi.fn();
        vi.useFakeTimers();
        
        const { result } = renderHook(() => useEditorForm({
            config: defaultConfig as any,
            filename: 'test.json',
            initialData,
            onDirtyChange
        }));

        act(() => {
            result.current.form.setValue('name', 'Changed Name');
        });

        // Fast-forward debounce timer
        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(onDirtyChange).toHaveBeenLastCalledWith(true);
        vi.useRealTimers();
    });

    it('should be clean when primitive value reverted', async () => {
        const onDirtyChange = vi.fn();
        vi.useFakeTimers();
        
        const { result } = renderHook(() => useEditorForm({
            config: defaultConfig as any,
            filename: 'test.json',
            initialData,
            onDirtyChange
        }));

        // Change
        act(() => {
            result.current.form.setValue('name', 'Changed Name');
            vi.advanceTimersByTime(300);
        });
        expect(onDirtyChange).toHaveBeenLastCalledWith(true);

        // Revert
        act(() => {
            result.current.form.setValue('name', 'Test Unit');
            vi.advanceTimersByTime(300);
        });
        expect(onDirtyChange).toHaveBeenLastCalledWith(false);
        vi.useRealTimers();
    });

    it('should be clean when complex object reverted (Deep Equality Fix)', async () => {
        const onDirtyChange = vi.fn();
        vi.useFakeTimers();
        
        const { result } = renderHook(() => useEditorForm({
            config: defaultConfig as any,
            filename: 'test.json',
            initialData,
            onDirtyChange
        }));

        // 1. Change deep value
        act(() => {
            result.current.form.setValue('stats.health', 50);
            vi.advanceTimersByTime(300);
        });
        expect(onDirtyChange).toHaveBeenLastCalledWith(true);

        // 2. Revert deep value (creates new object reference for `stats`)
        act(() => {
            result.current.form.setValue('stats', { health: 100 });
            vi.advanceTimersByTime(300);
        });
        
        expect(onDirtyChange).toHaveBeenLastCalledWith(false);
        vi.useRealTimers();
    });

    it('should be clean when array reverted (Deep Equality Fix)', async () => {
        const onDirtyChange = vi.fn();
        vi.useFakeTimers();
        
        const { result } = renderHook(() => useEditorForm({
            config: defaultConfig as any,
            filename: 'test.json',
            initialData,
            onDirtyChange
        }));

        // 1. Change array
        act(() => {
            result.current.form.setValue('tags', ['a', 'b', 'c']);
            vi.advanceTimersByTime(300);
        });
        expect(onDirtyChange).toHaveBeenLastCalledWith(true);

        // 2. Revert array (new reference)
        act(() => {
            result.current.form.setValue('tags', ['a', 'b']);
            vi.advanceTimersByTime(300);
        });

        expect(onDirtyChange).toHaveBeenLastCalledWith(false);
        vi.useRealTimers();
    });
});
