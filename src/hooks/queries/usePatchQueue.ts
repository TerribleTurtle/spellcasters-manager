import { useState, useCallback } from "react";
import { Change } from "@/types";

export function usePatchQueue() {
    const [pendingChanges, setPendingChanges] = useState<number>(0);
    const [queuedIds, setQueuedIds] = useState<Set<string>>(new Set());

    const fetchQueue = useCallback(() => {
        import("@/services/PatchService").then(({ patchService }) => {
            patchService.getQueue()
            .then((changes: Change[]) => {
                setPendingChanges(changes.length);
                const ids = new Set(changes.map(c => c.target_id || ""));
                setQueuedIds(ids);
            })
            .catch((err) => {
                console.error("Failed to fetch queue:", err);
            });
        });
    }, []);

    return { pendingChanges, queuedIds, fetchQueue };
}
