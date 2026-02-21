import { useEffect, useState } from "react";
import { patchService } from "@/services/PatchService";
import { History, RotateCcw, ChevronDown, ChevronUp, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PATCH_FIELDS } from "@/domain/constants";


interface HistoryEntry {
  target_id: string;
  name: string;
  field: string;
  old: unknown;
  new: unknown;
  tags?: string[];
  patch_tags?: string[];
  patch_version?: string;
  patch_date?: string;

  patch_title?: string;
  patch_diff?: string;
}

interface EntityHistoryPanelProps {
  entityId: string;
  onRetcon?: (field: string, oldValue: unknown) => void;
}

export function EntityHistoryPanel({ entityId, onRetcon }: EntityHistoryPanelProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      setLoading(true);
      setError(false);
      try {
        const data = await patchService.getHistory({ entity: entityId, flat: true });
        if (!active || !Array.isArray(data)) return;
        
        const entries: HistoryEntry[] = (data as Record<string, unknown>[]).map((item) => ({
          target_id: String(item.target_id ?? ''),
          name: String(item.name ?? ''),
          field: String(item.field ?? ''),
          old: item.old,
          new: item.new,
          tags: Array.isArray(item.tags) ? item.tags as string[] : undefined,
          patch_tags: Array.isArray(item.patch_tags) ? item.patch_tags as string[] : undefined,
          patch_version: String(item.patch_version || item.version || ''),
          patch_date: String(item.patch_date || item.date || ''),
          patch_title: String(item.patch_title || item.title || ''),
          patch_diff: item.patch_diff ? String(item.patch_diff) : undefined,
        }));
        
        if (active) setHistory(entries);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadHistory();

    return () => {
      active = false;
    };
  }, [entityId]);

  if (loading) {
    return (
      <div className="border rounded-md p-4 bg-card/40 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <History className="w-4 h-4 animate-pulse" />
          <span>Loading history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border rounded-md p-4 bg-destructive/10 border-destructive/20 backdrop-blur-sm">
        <div className="flex items-center justify-between text-destructive text-sm">
           <div className="flex items-center gap-2">
              <History className="w-4 h-4" />
              <span>Failed to load history</span>
           </div>
           <Button variant="ghost" size="xs" onClick={() => setLoading(true)} className="h-6 hover:bg-destructive/20 hover:text-destructive">Retry</Button>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="border rounded-md p-4 bg-card/40 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-muted-foreground/50 text-sm">
          <History className="w-4 h-4" />
          <span>No patch history for this entity yet.</span>
        </div>
      </div>
    );
  }

  const displayEntries = expanded ? history : history.slice(0, 5);

  return (
    <div className="border rounded-md overflow-hidden bg-card/40 backdrop-blur-sm shadow-sm">
      {/* Header */}
      <div className="px-3 py-2 bg-muted/50 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <History className="w-3.5 h-3.5" />
          Patch History ({history.length} {history.length === 1 ? "change" : "changes"})
        </div>
        {history.length > 5 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 text-mini text-muted-foreground"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <><ChevronUp className="w-3 h-3 mr-1" /> Show Less</> : <><ChevronDown className="w-3 h-3 mr-1" /> Show All</>}
          </Button>
        )}
      </div>

      {/* Timeline */}
      <div className="divide-y divide-border/30">
        {displayEntries.map((entry, i) => (
          <div
            key={`${entry.field}-${i}`}
            className="px-3 py-2.5 hover:bg-muted/20 transition-colors group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* Field + Date */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-foreground/90">
                    {entry.field === PATCH_FIELDS.QUICK_EDIT ? "Full Edit" : entry.field}
                  </span>
                  {entry.patch_version && (
                    <span className="text-micro px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
                      {entry.patch_version}
                    </span>
                  )}
                  {entry.patch_date && (
                    <span className="text-mini text-muted-foreground/60">
                      {new Date(entry.patch_date).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Diff Toggle */}
                {entry.patch_diff && (
                    <details className="group/diff">
                        <summary className="text-xs text-muted-foreground hover:text-primary cursor-pointer list-none flex items-center gap-1 mb-1">
                            <span className="font-mono text-[10px] bg-muted px-1 rounded opacity-70 group-open/diff:bg-primary/10 group-open/diff:text-primary">GIT</span>
                            <span className="group-open/diff:hidden">Show Diff</span>
                            <span className="hidden group-open/diff:inline">Hide Diff</span>
                        </summary>
                        <pre className="text-[10px] font-mono bg-black/80 text-green-400 p-2 rounded overflow-x-auto whitespace-pre-wrap mt-2 mb-2">
                           {entry.patch_diff}
                        </pre>
                    </details>
                )}

                {/* Old → New (only for non-object fields) */}
                {entry.field !== PATCH_FIELDS.QUICK_EDIT && (
                  <div className="flex items-center gap-1.5 text-mini font-mono">
                    <span className="text-red-400/80 line-through truncate max-w-[120px]">
                      {formatValue(entry.old)}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-emerald-400/80 truncate max-w-[120px]">
                      {formatValue(entry.new)}
                    </span>
                  </div>
                )}

                {/* Tags */}
                {((entry.tags && entry.tags.length > 0) || (entry.patch_tags && entry.patch_tags.length > 0)) && (
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <Tag className="w-2.5 h-2.5 text-muted-foreground/40" />
                    {entry.patch_tags?.map((tag) => (
                      <span
                        key={`pt-${tag}`}
                        className="text-micro px-1 py-0.5 rounded bg-teal-500/10 text-teal-400/80"
                      >
                        {tag}
                      </span>
                    ))}
                    {entry.tags?.map((tag) => (
                      <span
                        key={`ct-${tag}`}
                        className="text-micro px-1 py-0.5 rounded bg-primary/10 text-primary/80"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Retcon Button */}
              {onRetcon && entry.field !== PATCH_FIELDS.QUICK_EDIT && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-mini text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={() => onRetcon(entry.field, entry.old)}
                  title={`Revert "${entry.field}" to previous value`}
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Retcon
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "object") return JSON.stringify(val).slice(0, 40) + "…";
  return String(val);
}
