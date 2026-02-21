/**
 * @vitest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useEditorActions } from './useEditorActions';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValidationError } from '@/services/DataService';

// Mock Dependencies
const { mockDataMutation, mockToast } = vi.hoisted(() => ({
    mockDataMutation: {
        saveEntity: vi.fn(),
        deleteEntity: vi.fn(),
        isSaving: false,
        preview: null,
        closePreview: vi.fn(),
        requestSave: vi.fn()
    },
    mockToast: { error: vi.fn() }
}));

vi.mock('./useDataMutation', () => ({
    useDataMutation: () => mockDataMutation
}));

vi.mock('@/components/ui/toast-context', () => ({
    useToast: () => mockToast
}));

describe('useEditorActions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default requestSave implementation: executes the callback immediately
        mockDataMutation.requestSave.mockImplementation((_mode, data, callback) => callback(data));
    });

    it('handleSave calls requestSave then saveEntity', async () => {
        const { result } = renderHook(() => useEditorActions({
            category: 'units',
            filename: 'u1.json',
            initialData: {}
        }));

        await act(async () => {
            result.current.handleSave({ name: 'Test' });
        });

        expect(mockDataMutation.requestSave).toHaveBeenCalledWith('silent', { name: 'Test' }, expect.any(Function), false);
        expect(mockDataMutation.saveEntity).toHaveBeenCalledWith({ name: 'Test' }, false, undefined);
    });

    it('handleAddToQueue calls requestSave then saveEntity with queue=true', async () => {
        const { result } = renderHook(() => useEditorActions({
            category: 'units',
            filename: 'u1.json',
            initialData: {}
        }));

        await act(async () => {
            result.current.handleAddToQueue({ name: 'Test' });
        });

        expect(mockDataMutation.requestSave).toHaveBeenCalledWith('queue', { name: 'Test' }, expect.any(Function), false);
        expect(mockDataMutation.saveEntity).toHaveBeenCalledWith({ name: 'Test' }, true, undefined);
    });

    it('maps ValidationError to setError', async () => {
        const setError = vi.fn();
        const validationError = new ValidationError('Validation Failed', [
            { path: 'stats.health', message: 'Too low' }
        ]);

        mockDataMutation.saveEntity.mockRejectedValue(validationError);

        const { result } = renderHook(() => useEditorActions({
            category: 'units',
            filename: 'u1.json',
            initialData: {},
            setError
        }));

        await act(async () => {
            result.current.handleSave({});
        });

        expect(setError).toHaveBeenCalledWith('stats.health', { type: 'server', message: 'Too low' });
        expect(mockToast.error).toHaveBeenCalledWith('Validation Failed: Please check the form for errors.');
    });

    it('handles generic save errors', async () => {
        mockDataMutation.saveEntity.mockRejectedValue(new Error('Network Error'));

        const { result } = renderHook(() => useEditorActions({
            category: 'units',
            filename: 'u1.json',
            initialData: {}
        }));

        await act(async () => {
            result.current.handleSave({});
        });

        expect(mockToast.error).toHaveBeenCalledWith('Error saving');
    });

    it('handleDelete calls deleteEntity', async () => {
        const onSuccess = vi.fn();
        const { result } = renderHook(() => useEditorActions({
            category: 'units',
            filename: 'u1.json',
            initialData: {}
        }));

        await act(async () => {
            await result.current.handleDelete(onSuccess);
        });

        expect(mockDataMutation.deleteEntity).toHaveBeenCalledWith(onSuccess);
    });
});
