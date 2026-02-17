
import { useState, useEffect, useCallback } from 'react';
import { assetService } from '@/services/AssetService';
import { AppMode } from '@/types';
import { useToast } from '@/components/ui/toast-context';

export function useAssets(mode: AppMode) {
    const [assets, setAssets] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { error } = useToast();

    const refresh = useCallback(async () => {
        setIsLoading(true);
        try {
            const list = await assetService.list(mode);
            setAssets(list);
        } catch (err) {

            error("Failed to load assets: " + (err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [mode, error]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { assets, isLoading, refresh };
}
