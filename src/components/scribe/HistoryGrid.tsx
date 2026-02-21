import { useState, useEffect, useCallback } from "react";
import { safeArray } from "@/lib/guards";
import { Patch, Change } from "@/types";
import { patchService } from "@/services/PatchService";
import { Button } from "@/components/ui/button";
import { DiffCard } from "./DiffCard";
import { Search, Layers, RotateCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast-context";
import { HistoryToolbar } from "./HistoryToolbar";
import { PatchCard } from "./PatchCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FlatChange extends Change {
  patch_version: string;
  patch_date: string;
  patch_title: string;
}

export function HistoryGrid() {
  const [rollbackCandidate, setRollbackCandidate] = useState<string | null>(
    null
  );
  const [viewMode, setViewMode] = useState<"patches" | "changes">("patches");
  const [searchTerm, setSearchTerm] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState<Patch[] | FlatChange[]>([]);
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();

  const fetchData = useCallback(
    async (isDebounced = false) => {
      if (!isDebounced) setLoading(true);
      try {
        const filters: Record<string, string | boolean> = {};
        if (tagFilter !== "all") filters.tag = tagFilter;
        if (searchTerm) filters.entity = searchTerm;
        if (startDate) filters.from = startDate;
        if (endDate) filters.to = endDate;
        if (viewMode === "changes") filters.flat = true;

        const result = await patchService.getHistory(filters);
        setData(safeArray(result) as Patch[] | FlatChange[]);
      } catch {
        error("Failed to load history");
      } finally {
        setLoading(false);
      }
    },
    [tagFilter, searchTerm, startDate, endDate, viewMode, error]
  );

  const handleRollback = (patchId: string) => {
    setRollbackCandidate(patchId);
  };

  const confirmRollback = async () => {
    if (!rollbackCandidate) return;

    // Close dialog first, then let grid loading state take over
    const targetId = rollbackCandidate;
    setRollbackCandidate(null);
    setLoading(true);

    try {
      const res = await patchService.rollback(targetId);
      if (res.success) {
        await fetchData();
        success("Rollback Successful! A revert patch has been created.");
      } else {
        error("Rollback failed.");
      }
    } catch {
      error("Rollback failed.");
    } finally {
      setLoading(false);
    }
  };

  // Immediate fetch on mode/viewMode change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Debounced fetch on filter changes
  useEffect(() => {
    // Skip initial mount if handled by the other effect, but here the deps are different
    // We set loading true immediately for feedback
    setLoading(true);
    const timer = setTimeout(() => fetchData(true), 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <HistoryToolbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        tagFilter={tagFilter}
        setTagFilter={setTagFilter}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {loading && (
          <div className="space-y-4 max-w-3xl mx-auto p-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="border border-border/50 bg-card/30 rounded-xl overflow-hidden p-3 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-16 rounded" />
                    <Skeleton className="h-5 w-48 rounded" />
                  </div>
                  <Skeleton className="h-4 w-24 rounded" />
                </div>
                <div className="space-y-2 pl-2 border-l-2 border-border/30">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-4 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && data.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            {searchTerm || tagFilter !== "all" || startDate || endDate ? (
              <>
                <Search className="w-10 h-10 opacity-20 mb-2" />
                <p className="text-sm">No records found matching your query.</p>
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchTerm("");
                    setTagFilter("all");
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="text-xs mt-1"
                >
                  Clear all filters
                </Button>
              </>
            ) : (
              <>
                <Layers className="w-10 h-10 opacity-20 mb-2" />
                <p className="text-sm">No patches published yet.</p>
                <p className="text-xs opacity-60 mt-1">
                  Changes you commit will appear here.
                </p>
              </>
            )}
          </div>
        )}

        {!loading && viewMode === "patches" && (
          <div className="space-y-4 max-w-3xl mx-auto">
            {(data as Patch[]).map((patch) => (
              <PatchCard
                key={patch.id}
                patch={patch}
                onRollback={handleRollback}
              />
            ))}
          </div>
        )}

        {!loading && viewMode === "changes" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 pb-10">
            {(data as FlatChange[]).map((change, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -top-2 right-2 z-10">
                  <span className="text-mini font-mono bg-background border px-1.5 rounded text-muted-foreground shadow-sm">
                    v{change.patch_version}
                  </span>
                </div>
                <DiffCard change={change} />
              </div>
            ))}
          </div>
        )}
      </div>
      <AlertDialog
        open={!!rollbackCandidate}
        onOpenChange={(open) => !open && setRollbackCandidate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rollback Patch?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to rollback this patch? This will create a
              new patch that inverts all changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRollback}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Rollback
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
