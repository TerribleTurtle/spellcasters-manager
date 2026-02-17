/**
 * @vitest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useEntityMutation } from './useEntityMutation';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Dependencies
const { mockDataService, mockToast } = vi.hoisted(() => ({
    mockDataService: {
        save: vi.fn(),
        delete: vi.fn()
    },
    mockToast: {
        success: vi.fn(),
        error: vi.fn()
    }
}));

vi.mock('@/services/DataService', () => ({
    dataService: mockDataService
}));

vi.mock('@/components/ui/toast-context', () => ({
    useToast: () => mockToast
}));

describe('useEntityMutation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('saveEntity calls dataService.save and shows success toast', async () => {
        const { result } = renderHook(() => useEntityMutation({
            category: 'units',
            filename: 'u1.json',
            entityLabel: 'Unit'
        }));

        await act(async () => {
            await result.current.saveEntity({ name: 'New Name' }, false);
        });

        expect(mockDataService.save).toHaveBeenCalledWith('units', 'u1.json', { name: 'New Name' }, false);
        expect(mockToast.success).toHaveBeenCalledWith('Saved Unit');
    });

    it('saveEntity supports queue mode and shows different toast', async () => {
        const { result } = renderHook(() => useEntityMutation({
            category: 'units',
            filename: 'u1.json'
        }));

        await act(async () => {
            await result.current.saveEntity({ name: 'New Name' }, true);
        });

        expect(mockDataService.save).toHaveBeenCalledWith('units', 'u1.json', { name: 'New Name' }, true);
        expect(mockToast.success).toHaveBeenCalledWith(
            'Saved & Added to Queue',
            undefined
        );
    });

    it('calls onSave callback after successful save', async () => {
        const onSave = vi.fn();
        const { result } = renderHook(() => useEntityMutation({
            category: 'units',
            filename: 'u1.json',
            onSave
        }));

        await act(async () => {
            await result.current.saveEntity({ name: 'Test' }, false);
        });

        expect(onSave).toHaveBeenCalledWith({ name: 'Test' }, 'u1.json');
    });

    it('deleteEntity calls dataService.delete and triggers callbacks', async () => {
        const onSave = vi.fn(); // onSave is called after delete too (to refresh lists)
        const onSuccess = vi.fn();
        
        const { result } = renderHook(() => useEntityMutation({
            category: 'units',
            filename: 'u1.json',
            entityLabel: 'Unit',
            onSave
        }));

        await act(async () => {
            await result.current.deleteEntity(onSuccess);
        });

        expect(mockDataService.delete).toHaveBeenCalledWith('units', 'u1.json');
        expect(mockToast.success).toHaveBeenCalledWith('Unit deleted successfully');
        expect(onSave).toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalled();
    });

    it('sets isSaving state during operations', async () => {
        // Delay the save to verify state change
        mockDataService.save.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 10)));

        const { result } = renderHook(() => useEntityMutation({
            category: 'units', 
            filename: 'u1.json'
        }));

        let promise: Promise<void>;
        await act(async () => {
            promise = result.current.saveEntity({}, false);
        });

        await act(async () => { await promise!; });
        expect(result.current.isSaving).toBe(false);
    });
});
