import { Patch, Change } from "@/types";
import { Button } from "@/components/ui/button";
import { RotateCcw, Layers } from "lucide-react";
import { safeArray } from "@/lib/guards";

interface PatchCardProps {
    patch: Patch;
    onRollback: (patchId: string) => void;
}

export function PatchCard({ patch, onRollback }: PatchCardProps) {
    return (
        <div className="group relative border border-border/50 bg-card/30 rounded-xl overflow-hidden hover:border-border transition-colors">
            <div className="p-3 bg-muted/20 border-b border-border/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">{patch.version}</span>
                    <span className="text-sm font-semibold">{patch.title}</span>
                    <div className="flex gap-1">
                        {patch.tags?.map(t => (
                            <span key={t} className="text-mini px-1.5 py-0.5 bg-background border rounded-full text-muted-foreground">#{t}</span>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{patch.date}</span>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10" 
                        onClick={(e) => {
                            e.stopPropagation();
                            onRollback(patch.id);
                        }} 
                        title="Rollback Patch"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>
            <div className="p-3 bg-card/50">
                <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                    <Layers className="w-3 h-3" />
                    {safeArray<Change>(patch.changes).length} changes
                </div>
                {/* Preview top 3 changes */}
                <div className="space-y-2 pl-2 border-l-2 border-border/30">
                    {safeArray<Change>(patch.changes).slice(0, 3).map((change, i) => (
                        <div key={i} className="text-xs flex items-center gap-2 text-foreground/80">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                                change.change_type === 'delete' ? 'bg-red-500' :
                                change.change_type === 'add' ? 'bg-green-500' :
                                change.change_type === 'edit' ? 'bg-blue-500' :
                                change.new === undefined ? 'bg-red-500' : change.old === undefined ? 'bg-green-500' : 'bg-blue-500'
                            }`} />
                            <span className="font-medium">{change.name}</span>
                            <span className="text-muted-foreground">.{change.field}</span>
                        </div>
                    ))}
                    {safeArray<Change>(patch.changes).length > 3 && (
                        <div className="text-mini text-muted-foreground italic pl-3">+ {safeArray<Change>(patch.changes).length - 3} more</div>
                    )}
                </div>
                
                 {/* Diff Preview */}
                 {patch.diff && (
                    <details className="mt-3 pt-2 border-t border-border/30 group/diff">
                        <summary className="text-xs text-muted-foreground hover:text-primary cursor-pointer list-none flex items-center gap-1">
                            <span className="font-mono text-[10px] bg-muted px-1 rounded opacity-70 group-open/diff:bg-primary/10 group-open/diff:text-primary">GIT</span>
                            <span className="group-open/diff:hidden">Show Full Diff</span>
                            <span className="hidden group-open/diff:inline">Hide Diff</span>
                        </summary>
                        <pre className="text-[10px] font-mono bg-black/80 text-green-400 p-2 rounded overflow-x-auto whitespace-pre-wrap mt-2">
                            {patch.diff}
                        </pre>
                    </details>
                )}
            </div>
        </div>
    );
}
