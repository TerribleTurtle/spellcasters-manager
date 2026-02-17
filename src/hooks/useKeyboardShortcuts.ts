import { useEffect } from 'react';

interface UseKeyboardShortcutsProps {
    /** Ctrl+S — Silent save (no patch entry) */
    onSave?: () => void;
    /** Ctrl+Shift+S — Save with patch entry */
    onShiftSave?: () => void;
    onEscape?: () => void;
}

export function useKeyboardShortcuts({ onSave, onShiftSave, onEscape }: UseKeyboardShortcutsProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if input/textarea is focused (except for save shortcuts)
            const isInInput = 
                document.activeElement instanceof HTMLInputElement ||
                document.activeElement instanceof HTMLTextAreaElement ||
                document.activeElement?.getAttribute('contenteditable') === 'true';

            // Save shortcuts work even in inputs
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (e.shiftKey) {
                    onShiftSave?.();
                } else {
                    onSave?.();
                }
                return;
            }

            if (isInInput) {
                if (e.key === 'Escape') {
                    (document.activeElement as HTMLElement).blur();
                }
                return;
            }

            // Escape
            if (e.key === 'Escape') {
                e.preventDefault();
                onEscape?.();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onSave, onShiftSave, onEscape]);
}
