import { useEffect, useCallback, useMemo } from "react";
import { httpClient } from "@/lib/httpClient";
import { EntityListHash, BaseEntity } from "@/types";
import { useToast } from "@/components/ui/toast-context";
import { getRegisteredCategories, ENTITY_REGISTRY } from "@/config/entityRegistry";
import { useEntityData } from "./queries/useEntityData";
import { usePatchQueue } from "./queries/usePatchQueue";

export function useAppData(currentCategory: string) {
    const { registry, isLoading: isDataLoading, fetchData } = useEntityData();
    const { pendingChanges, queuedIds, fetchQueue } = usePatchQueue();
    // const [items, setItems] = useState<EntityListHash[]>([]);
    const { error } = useToast();

    const checkHealth = useCallback(async () => {
        try {
            await httpClient.request<{ status: string; dataDir: string; liveAvailable?: boolean }>(`/api/health`);
            // Healthy
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            error(`Health Check Failed: ${errorMsg}`);
        }
    }, [error]);

    // Initial Load
    useEffect(() => {
        // Defer load to avoid synchronous setState warning
        const t = setTimeout(() => void fetchData(), 0);
        fetchQueue();
        checkHealth();
        return () => clearTimeout(t);
    }, [fetchData, fetchQueue, checkHealth]);

    // Compute filtered items
    const items = useMemo(() => {
        const allItems: EntityListHash[] = [];
    
        const CATEGORY_MAP: Record<string, (folder: string, entity: BaseEntity) => boolean> = {
            'all': () => true,
            'hero': (folder) => folder === 'heroes',
            'unit': (folder, entity) => folder === 'units' && entity.category === 'Creature',
            'structure': (folder, entity) => folder === 'units' && entity.category === 'Building',
            'spell': (folder) => folder === 'spells',
            'consumable': (folder) => folder === 'consumables',
            'titan': (folder) => folder === 'titans', 
        };
        
        getRegisteredCategories().forEach(cat => {
            if (!CATEGORY_MAP[cat] && !CATEGORY_MAP[ENTITY_REGISTRY[cat].singularLabel.toLowerCase()]) {
                 CATEGORY_MAP[cat] = (folder) => folder === cat;
            }
        });
        
        const filterFn = CATEGORY_MAP[currentCategory] || (() => false);
        
        for (const [folder, entities] of Object.entries(registry)) {
          for (const entity of entities) {
            if (filterFn(folder, entity)) {
                 allItems.push({
                    id: entity._filename || '',
                    category: entity._category || folder, 
                });
            }
          }
        }
        
        allItems.sort((a, b) => (a.id || '').localeCompare(b.id || ''));
        return allItems;
      }, [registry, currentCategory]);

    return {
        registry,
        items,
        pendingChanges,
        queuedIds,
        isLoading: isDataLoading,
        fetchData,
        fetchQueue
    };
}
