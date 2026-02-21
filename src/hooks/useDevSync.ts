import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/components/ui/toast-context";
import { httpClient } from "@/lib/httpClient";

export interface DevConfig {
    dataDir: string;
    label: 'live' | 'mock';
    livePath: string;
    mockPath: string;
}

export function useDevSync(onRefresh: () => void) {
    const { success, error } = useToast();
    const [devConfig, setDevConfig] = useState<DevConfig | null>(null);
    const [devLoading, setDevLoading] = useState<string | null>(null);

    const fetchDevConfig = useCallback(async () => {
        try {
            const cfg = await httpClient.request<DevConfig>('/api/dev/config');
            setDevConfig(cfg);
        } catch {
            // Server might be restarting, ignore
        }
    }, []);

    useEffect(() => { 
        const t = setTimeout(() => void fetchDevConfig(), 0);
        return () => clearTimeout(t);
    }, [fetchDevConfig]);

    const pollUntilReady = useCallback(async () => {
        const maxAttempts = 30;
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(r => setTimeout(r, 1500));
            try {
                await httpClient.request('/api/health');
                return true;
            } catch {
                // still down
            }
        }
        return false;
    }, []);

    const handleSwitchPath = async () => {
        if (!devConfig) return;
        const target = devConfig.label === 'live' ? 'mock' : 'live';
        setDevLoading('switch');
        try {
            await httpClient.request('/api/dev/switch-path', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target })
            });
            success(`Switching to ${target}… restarting server`);
            await pollUntilReady();
            window.location.reload();
        } catch (err) {
            error('Switch failed: ' + (err as Error).message);
            setDevLoading(null);
        }
    };

    const handleSync = async () => {
        setDevLoading('sync');
        try {
            await httpClient.request('/api/dev/sync', { method: 'POST' });
            success('Sync complete! Reloading…');
            onRefresh();
            setDevLoading(null);
            await fetchDevConfig();
        } catch (err) {
            error('Sync failed: ' + (err as Error).message);
            setDevLoading(null);
        }
    };

    const handleWipeAndCopy = async () => {
        setDevLoading('wipe');
        try {
            await httpClient.request('/api/dev/sync?clean=true', { method: 'POST' });
            success('Wipe & Copy complete! Reloading…');
            onRefresh();
            setDevLoading(null);
            await fetchDevConfig();
        } catch (err) {
            error('Wipe & Copy failed: ' + (err as Error).message);
            setDevLoading(null);
        }
    };

    return {
        devConfig,
        devLoading,
        handleSwitchPath,
        handleSync,
        handleWipeAndCopy
    };
}
