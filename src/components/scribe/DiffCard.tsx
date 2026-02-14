import { ArrowRight, Plus, Trash2, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Change } from "@/types";


interface DiffCardProps {
    change: Change;
}

export function DiffCard({ change }: DiffCardProps) {
    // Determine icon and color based on change type (heuristic based on field presence/value)
    // In a real system, we might have explicit 'type' on the Change object.
    // For now: 
    // - New file? -> Plus (Green)
    // - Deleted file? -> Trash (Red)
    // - Modified? -> Edit (Blue/Orange)

    // Since our Change type is simple { name, field, old, new }, we assume mostly modifications for now.
    
    const isNew = change.old === undefined || change.old === null || change.old === "";
    const isDelete = change.new === undefined || change.new === null || change.new === "";
    
    return (
        <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/50 p-4 transition-all hover:border-border hover:bg-card/80 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
                
                {/* Icon Box */}
                <div className={cn(
                    "p-2.5 rounded-lg flex-shrink-0",
                    isNew ? "bg-green-500/10 text-green-500" :
                    isDelete ? "bg-red-500/10 text-red-500" :
                    "bg-blue-500/10 text-blue-500"
                )}>
                    {isNew ? <Plus className="w-5 h-5" /> :
                     isDelete ? <Trash2 className="w-5 h-5" /> :
                     <Edit2 className="w-5 h-5" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm tracking-tight">{change.name}</span>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">
                            {change.field}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm mt-3 bg-background/50 p-2 rounded-md border border-border/30">
                        {/* Old Value */}
                        {!isNew && (
                            <span className="text-red-400/80 line-through decoration-red-400/30 text-xs font-mono truncate max-w-[40%]">
                                {String(change.old)}
                            </span>
                        )}

                        {/* Arrow */}
                        {!isNew && !isDelete && (
                            <ArrowRight className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />
                        )}

                        {/* New Value */}
                        {!isDelete && (
                             <span className="text-green-500 font-bold text-xs font-mono truncate max-w-[40%]">
                                {String(change.new)}
                             </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
