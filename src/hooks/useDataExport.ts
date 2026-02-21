import { useRef } from "react";
import { useToast } from "@/components/ui/toast-context";
import { httpClient } from "@/lib/httpClient";

export function useDataExport() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { success, error } = useToast();

    const handleExport = async () => {
        try {
            const response = await httpClient.request('/api/data/export');
            const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch {
            error("Export Failed");
        }
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                await httpClient.request('/api/data/import', {
                    method: 'POST',
                    body: json
                });
                success("Import Successful! Reloading...");
                setTimeout(() => window.location.reload(), 1000);
            } catch (err) {
                error("Import Failed: " + (err as Error).message);
            }
        };
        reader.readAsText(file);
        
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return {
        fileInputRef,
        handleExport,
        handleImport
    };
}
