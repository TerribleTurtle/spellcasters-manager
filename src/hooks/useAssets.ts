
import { useState, useEffect, useCallback } from 'react';
import { assetService } from '@/services/AssetService';
import { useToast } from '@/components/ui/toast-context';

export function useAssets() {
    const [assets, setAssets] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { error } = useToast();

    const refresh = useCallback(async () => {
        setIsLoading(true);
        try {
            const list = await assetService.list();
            setAssets(list);
        } catch (err) {

            error("Failed to load assets: " + (err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [error]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { assets, isLoading, refresh };
}
