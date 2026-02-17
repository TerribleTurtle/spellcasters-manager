import { useState, useCallback } from 'react';
import { useUnsavedChanges } from './useUnsavedChanges';

interface UseNavigationGuardProps {
    isDirty: boolean; // Is the current form dirty?
}

interface NavigationGuardResult {
    /**
     * Wraps a navigation action with a dirty check.
     * If dirty, shows a dialog.
     * If not dirty, executes the action immediately.
     */
    handleNavigation: (action: () => void) => void;
    
    /**
     * State for the confirmation dialog.
     * Pass these to your AlertDialog component.
     */
    dialogOpen: boolean;
    confirmAction: () => void;
    cancelAction: () => void;
}

/**
 * Enhanced navigation guard that handles both browser-level (beforeunload)
 * and in-app navigation interception.
 */
export function useNavigationGuard({ isDirty }: UseNavigationGuardProps): NavigationGuardResult {
    // 1. Browser-level guard (native)
    useUnsavedChanges(isDirty);

    // 2. In-app guard state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

    const handleNavigation = useCallback((action: () => void) => {
        if (!isDirty) {
            action();
            return;
        }

        // Stash the action and open dialog
        setPendingAction(() => action);
        setDialogOpen(true);
    }, [isDirty]);

    const confirmAction = useCallback(() => {
        if (pendingAction) {
            pendingAction();
        }
        setDialogOpen(false);
        setPendingAction(null);
    }, [pendingAction]);

    const cancelAction = useCallback(() => {
        setDialogOpen(false);
        setPendingAction(null);
    }, []);

    return {
        handleNavigation,
        dialogOpen,
        confirmAction,
        cancelAction
    };
}
