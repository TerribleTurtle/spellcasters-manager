/**
 * @vitest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useDataMutation } from './useDataMutation';
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

describe('useDataMutation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Save & Delete Operations', () => {
        it('saveEntity calls dataService.save and shows success toast', async () => {
            const { result } = renderHook(() => useDataMutation({
                category: 'units',
                filename: 'u1.json',
                entityLabel: 'Unit',
                initialData: { name: 'Old' },
            }));

            await act(async () => {
                await result.current.saveEntity({ name: 'New Name' }, false);
            });

            expect(mockDataService.save).toHaveBeenCalledWith('units', 'u1.json', { name: 'New Name' }, false);
            expect(mockToast.success).toHaveBeenCalledWith('Saved Unit');
        });

        it('saveEntity supports queue mode and shows different toast', async () => {
            const { result } = renderHook(() => useDataMutation({
                category: 'units',
                filename: 'u1.json',
                initialData: { name: 'Old' }
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

        it('deleteEntity calls dataService.delete and triggers callbacks', async () => {
            const onSave = vi.fn();
            const onSuccess = vi.fn();
            
            const { result } = renderHook(() => useDataMutation({
                category: 'units',
                filename: 'u1.json',
                entityLabel: 'Unit',
                initialData: { name: 'Old' },
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
            mockDataService.save.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 10)));

            const { result } = renderHook(() => useDataMutation({
                category: 'units', 
                filename: 'u1.json',
                initialData: {}
            }));

            let promise: Promise<void>;
            await act(async () => {
                promise = result.current.saveEntity({}, false);
            });

            await act(async () => { await promise!; });
            expect(result.current.isSaving).toBe(false);
        });
    });

    describe('Diff/Preview Logic', () => {
        it('requestSave calculates delta and triggers preview', async () => {
            const executeSave = vi.fn();
            const { result } = renderHook(() => useDataMutation({
                category: 'units',
                filename: 'u1.json',
                initialData: { name: 'Old', health: 100 },
                rawInitialData: { name: 'Old', health: 100 }
            }));

            act(() => {
                result.current.requestSave('silent', { name: 'New', health: 100 }, executeSave);
            });

            expect(result.current.preview).toBeTruthy();
            expect((result.current.preview!.newData as any).name).toBe('New'); // Verify new name
            expect((result.current.preview!.newData as any).health).toBe(100); // Verify unmodified field remains
            expect(executeSave).not.toHaveBeenCalled(); // Waiting for preview confirm
        });

        it('requestSave skips preview when skipPreview is true', async () => {
            const executeSave = vi.fn();
            const { result } = renderHook(() => useDataMutation({
                category: 'units',
                filename: 'u1.json',
                initialData: { name: 'Old', health: 100 },
                rawInitialData: { name: 'Old', health: 100 }
            }));

            act(() => {
                result.current.requestSave('silent', { name: 'New', health: 100 }, executeSave, true);
            });

            expect(result.current.preview).toBeNull();
            expect(executeSave).toHaveBeenCalled();
            expect((executeSave.mock.calls[0][0] as any).name).toBe('New');
        });

        it('requestSave shows toast and aborts when no changes detected', async () => {
            const executeSave = vi.fn();
            const { result } = renderHook(() => useDataMutation({
                category: 'units',
                filename: 'u1.json',
                initialData: { name: 'Old', health: 100 },
                rawInitialData: { name: 'Old', health: 100 }
            }));

            act(() => {
                result.current.requestSave('silent', { name: 'Old', health: 100 }, executeSave);
            });

            expect(result.current.preview).toBeNull();
            expect(executeSave).not.toHaveBeenCalled();
            expect(mockToast.success).toHaveBeenCalledWith("No changes detected");
        });

        it('closePreview resets preview state', async () => {
            const executeSave = vi.fn();
            const { result } = renderHook(() => useDataMutation({
                category: 'units',
                filename: 'u1.json',
                initialData: { name: 'Old' },
                rawInitialData: { name: 'Old' }
            }));

            act(() => {
                result.current.requestSave('silent', { name: 'New' }, executeSave);
            });
            expect(result.current.preview).toBeTruthy();

            act(() => {
                result.current.closePreview();
            });
            expect(result.current.preview).toBeNull();
        });
    });
});
