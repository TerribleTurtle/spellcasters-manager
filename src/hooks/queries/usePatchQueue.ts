import { useState, useCallback } from "react";
import { Change } from "@/types";
import { safeArray } from "@/lib/guards";

export function usePatchQueue() {
    const [pendingChanges, setPendingChanges] = useState<number>(0);
    const [queuedIds, setQueuedIds] = useState<Set<string>>(new Set());

    const fetchQueue = useCallback(async () => {
        try {
            const { patchService } = await import("@/services/PatchService");
            const rawChanges = await patchService.getQueue();
            
            const changes = safeArray<Change>(rawChanges);
            setPendingChanges(changes.length);
            const ids = new Set(changes.map(c => c.target_id || ""));
            setQueuedIds(ids);
        } catch (err) {
            console.error("Failed to fetch queue:", err);
        }
    }, []);

    return { pendingChanges, queuedIds, fetchQueue };
}
