/**
 * @vitest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useEntitySelection } from './useEntitySelection';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Dependencies
const { mockNavigation, mockResolve } = vi.hoisted(() => ({
    mockNavigation: {
        handleNavigation: vi.fn(),
        dialogOpen: false,
        confirmAction: vi.fn(),
        cancelAction: vi.fn()
    },
    mockResolve: vi.fn()
}));

vi.mock('@/hooks/useNavigationGuard', () => ({
    useNavigationGuard: () => mockNavigation
}));

vi.mock('@/lib/resolveEntityTarget', () => ({
    resolveEntityTarget: mockResolve
}));

vi.mock('@/components/ui/toast-context', () => ({
    useToast: () => ({ error: vi.fn() })
}));

describe('useEntitySelection', () => {
    const mockProps = {
        registry: {
            units: [
                { _filename: 'u1.json', id: 'u1', name: 'Unit 1', _category: 'units' },
                { _filename: 'u2.json', id: 'u2', name: 'Unit 2', _category: 'units' }
            ],
            heroes: [
                { _filename: 'h1.json', id: 'h1', name: 'Hero 1', _category: 'heroes' }
            ]
        },
        currentCategory: 'units',
        setCurrentCategory: vi.fn(),
        setView: vi.fn(),
        fetchData: vi.fn(),
        fetchQueue: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Default navigation handler just executes the action
        mockNavigation.handleNavigation.mockImplementation((cb: () => void) => cb());
    });

    it('handleSelectUnit updates selection and view', () => {
        const { result } = renderHook(() => useEntitySelection(mockProps as any));

        act(() => {
            result.current.handleSelectUnit('u1.json');
        });

        expect(result.current.selectedUnit).toBe('u1.json');
        expect(mockProps.setView).toHaveBeenCalledWith('forge');
        expect(result.current.unitData).toEqual(mockProps.registry.units[0]);
    });

    it('handleCreateStart clears selection and sets creating flag', () => {
        const { result } = renderHook(() => useEntitySelection(mockProps as any));

        act(() => {
            // First select one
            result.current.handleSelectUnit('u1.json');
        });
        
        act(() => {
            result.current.handleCreateStart();
        });

        expect(result.current.selectedUnit).toBeNull();
        expect(result.current.isCreating).toBe(true);
        expect(result.current.unitData).toBeNull();
    });

    it('handleDuplicate creates clean copy with override data', () => {
        const { result } = renderHook(() => useEntitySelection(mockProps as any));
        const sourceData = { id: 'u1', name: 'Unit 1', stats: { hp: 10 }, _filename: 'u1.json', _category: 'units' };

        act(() => {
            result.current.handleDuplicate(sourceData);
        });

        expect(result.current.isCreating).toBe(true);
        expect(result.current.isDirty).toBe(true);
        
        // Check stripped fields in override data
        // unitData reflects the override with identity fields stripped
        const overridden = result.current.unitData as any;
        expect(overridden).toBeDefined();
        expect(overridden.id).toBeUndefined();
        expect(overridden._filename).toBeUndefined();
        expect(overridden.name).toBeUndefined();
        expect(overridden.stats.hp).toBe(10); // Data preserved
    });

    it('handleDuplicate switches category if needed', () => {
         const { result } = renderHook(() => useEntitySelection(mockProps as any));
         const heroData = { id: 'h1', name: 'Hero 1', _filename: 'h1.json', _category: 'heroes' };

         act(() => {
             result.current.handleDuplicate(heroData);
         });

         expect(mockProps.setCurrentCategory).toHaveBeenCalledWith('heroes');
    });

    it('handleOpenInEditor resolves target ID and switches view', () => {
        const change = { target_id: 'u2', category: 'units' };
        mockResolve.mockReturnValue({ filename: 'u2.json', category: 'units' });

        const { result } = renderHook(() => useEntitySelection(mockProps as any));

        act(() => {
            result.current.handleOpenInEditor(change as any);
        });

        expect(mockResolve).toHaveBeenCalledWith('u2.json', mockProps.registry);
        expect(result.current.selectedUnit).toBe('u2.json');
        expect(mockProps.setView).toHaveBeenCalledWith('forge');
    });

    it('handleEntityCreated updates state and fetches data', () => {
        const { result } = renderHook(() => useEntitySelection(mockProps as any));
        
        act(() => {
            result.current.handleCreateStart();
        });
        expect(result.current.isCreating).toBe(true);

        act(() => {
            result.current.handleEntityCreated('new.json');
        });

        expect(result.current.isCreating).toBe(false);
        expect(result.current.selectedUnit).toBe('new.json');
        expect(mockProps.fetchData).toHaveBeenCalled();
        expect(mockProps.fetchQueue).toHaveBeenCalled();
    });
});
