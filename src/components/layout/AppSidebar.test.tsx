/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AppSidebar } from './AppSidebar';
import { describe, it, expect, vi } from 'vitest';

// Mock dependencies
vi.mock('@/lib/httpClient', () => ({
    httpClient: {
        request: vi.fn().mockResolvedValue({})
    }
}));

vi.mock('@/components/ui/toast-context', () => ({
    useToast: () => ({ success: vi.fn(), error: vi.fn() })
}));

// Mock EntityList to avoid deep rendering of recursive components and virtualizer issues in jsdom
vi.mock('../grimoire/EntityList', () => ({
    EntityList: ({ items }: { items: any[] }) => (
        <div data-testid="entity-list">
            {items?.length} Items
        </div>
    )
}));



describe('AppSidebar Smoke Tests', () => {
    const mockProps = {
        view: 'forge' as const,
        setView: vi.fn(),
        items: [
            { id: 'rocket_soldier.json', category: 'units' },
            { id: 'astral_monk.json', category: 'heroes' }
        ],
        selectedUnit: null,
        onSelectUnit: vi.fn(),
        currentCategory: 'units',
        onSelectCategory: vi.fn(),
        pendingChanges: 0,
        queuedIds: new Set<string>(),
        onCreate: vi.fn(),
        onRefresh: vi.fn()
    };

    it('renders navigation buttons', () => {
        render(
            <AppSidebar {...mockProps} />
        );

        // Studio (Forge) and Patch Manager (Scribe) are main nav items
        expect(screen.getByText('Studio')).toBeInTheDocument();
        expect(screen.getByText('Patch Manager')).toBeInTheDocument();
    });

    it('renders category selector', () => {
        render(
            <AppSidebar {...mockProps} />
        );

        expect(screen.getByText('Grimoire')).toBeInTheDocument();
    });

    it('renders sync button (dev tools)', () => {
        render(
            <AppSidebar {...mockProps} />
        );

        // Look for the sync button by title
        const syncBtn = screen.getByTitle('Sync live → mock (preserves queue)');
        expect(syncBtn).toBeInTheDocument();
    });
});
