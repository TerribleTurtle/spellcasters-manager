import { useEffect } from 'react';
import { AppView } from '@/types';

/**
 * Synchronizes application state (view and category) with the browser URL
 * without triggering a page reload.
 */
export function useUrlSync(view: AppView, currentCategory: string) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (view) params.set('view', view);
    if (currentCategory) params.set('category', currentCategory);
    
    const newSearch = params.toString();
    const currentSearch = window.location.search.replace('?', '');
    
    if (newSearch !== currentSearch) {
        window.history.replaceState(null, '', `?${newSearch}`);
    }
  }, [view, currentCategory]);
}
