import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/toast-context";
import { getRegisteredCategories } from "@/config/entityRegistry";
import { BaseEntity } from "@/types";

export function useEntityData() {
     
    const [registry, setRegistry] = useState<Record<string, BaseEntity[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    const { error } = useToast();

    const fetchData = useCallback(() => {
        setIsLoading(true);
        import("@/services/DataService").then(({ dataService }) => {
            const categories = getRegisteredCategories();
            const promises = categories.map(cat => dataService.getBulk(cat));

            Promise.allSettled(promises).then((results) => {
                 
                const newRegistry: Record<string, BaseEntity[]> = {};

                results.forEach((res, index) => {
                    const category = categories[index];
                    if (res.status === 'fulfilled') {
                        const val = res.value as unknown; // Force unknown first
                        if (Array.isArray(val)) {
                            newRegistry[category] = val as BaseEntity[];
                        } else {
                            newRegistry[category] = [];
                        }
                    } else {
                        error(`Failed to load ${category}.`);
                        newRegistry[category] = [];
                    }
                });
    
                setRegistry(newRegistry);
            }).finally(() => setIsLoading(false));
        });
    }, [error]);

    return { registry, isLoading, fetchData };
}
