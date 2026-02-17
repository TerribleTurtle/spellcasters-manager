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

        expect(onDirtyChange).toHaveBeenLastCalledWith(false);
    });

    it('should be dirty when primitive value changes', async () => {
        const onDirtyChange = vi.fn();
        
        const { result } = renderHook(() => useEditorForm({
            config: defaultConfig as any,
            filename: 'test.json',
            initialData,
            onDirtyChange
        }));

        act(() => {
            result.current.form.setValue('name', 'Changed Name');
        });

        // RHF updates are async-ish in hooks sometimes, but usually sync with act
        expect(onDirtyChange).toHaveBeenLastCalledWith(true);
    });

    it('should be clean when primitive value reverted', async () => {
        const onDirtyChange = vi.fn();
        
        const { result } = renderHook(() => useEditorForm({
            config: defaultConfig as any,
            filename: 'test.json',
            initialData,
            onDirtyChange
        }));

        act(() => {
            result.current.form.setValue('name', 'Changed Name');
        });
        expect(onDirtyChange).toHaveBeenLastCalledWith(true);

        act(() => {
            result.current.form.setValue('name', 'Test Unit');
        });
        expect(onDirtyChange).toHaveBeenLastCalledWith(false);
    });

    it('should be clean when complex object reverted (Deep Equality Fix)', async () => {
        const onDirtyChange = vi.fn();
        
        const { result } = renderHook(() => useEditorForm({
            config: defaultConfig as any,
            filename: 'test.json',
            initialData,
            onDirtyChange
        }));

        // 1. Change deep value
        act(() => {
            result.current.form.setValue('stats.health', 50);
        });
        expect(onDirtyChange).toHaveBeenLastCalledWith(true);

        // 2. Revert deep value (creates new object reference for `stats`)
        act(() => {
            result.current.form.setValue('stats', { health: 100 });
        });
        
        // Strict equality would fail here because {health:100} !== initialData.stats
        // But our fix uses JSON.stringify, so it should be false (clean)
        expect(onDirtyChange).toHaveBeenLastCalledWith(false);
    });

    it('should be clean when array reverted (Deep Equality Fix)', async () => {
        const onDirtyChange = vi.fn();
        
        const { result } = renderHook(() => useEditorForm({
            config: defaultConfig as any,
            filename: 'test.json',
            initialData,
            onDirtyChange
        }));

        // 1. Change array
        act(() => {
            result.current.form.setValue('tags', ['a', 'b', 'c']);
        });
        expect(onDirtyChange).toHaveBeenLastCalledWith(true);

        // 2. Revert array (new reference)
        act(() => {
            result.current.form.setValue('tags', ['a', 'b']);
        });

        expect(onDirtyChange).toHaveBeenLastCalledWith(false);
    });
});
