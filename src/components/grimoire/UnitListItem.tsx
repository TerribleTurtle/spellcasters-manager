import { cn } from "@/lib/utils"
import { Club, Shield, Ghost, Hexagon } from "lucide-react"

interface UnitListItemProps {
    filename: string;
    isActive: boolean;
    onSelect: () => void;
}

export function UnitListItem({ filename, isActive, onSelect }: UnitListItemProps) {
    const name = filename.replace('.json', '');
    
    // Deterministic icon based on name length (temporary until we have real data)
    // This gives a bit of visual variety without needing to fetch data yet
    const getIcon = () => {
        const len = name.length;
        if (len % 4 === 0) return <Ghost className="w-4 h-4" />
        if (len % 3 === 0) return <Shield className="w-4 h-4" />
        if (len % 2 === 0) return <Club className="w-4 h-4" />
        return <Hexagon className="w-4 h-4" />
    }

    return (
        <button
            onClick={onSelect}
            className={cn(
                "w-full text-left px-3 py-3 rounded-lg text-sm transition-all duration-300 flex items-center gap-3 group relative overflow-hidden border border-transparent",
                isActive 
                    ? "bg-primary/5 text-primary font-medium border-primary/20 shadow-[0_0_15px_-3px_rgba(var(--primary),0.2)]" 
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-border/50"
            )}
        >
            {/* Active Indicator Glow */}
            {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent opacity-50" />
            )}

            <div className={cn(
                "relative z-10 transition-transform duration-300", 
                isActive ? "text-primary scale-110" : "opacity-50 group-hover:opacity-100 group-hover:scale-110"
            )}>
                {getIcon()}
            </div>
            
            <div className="flex-1 min-w-0 relative z-10">
                <div className="truncate font-medium">{name}</div>
                {/* Micro-stats (Mocked for visual checking) */}
                <div className="flex items-center gap-2 text-[10px] opacity-60 mt-0.5">
                   <span>Unit</span>
                   <span className="w-1 h-1 rounded-full bg-current" />
                   <span>Tier {name.length % 5 + 1}</span>
                </div>
            </div>
            
            {/* Hover Chevron (Hidden by default, visible on hover) */}
            <div className={cn(
                "absolute right-2 opacity-0 transition-all duration-300 -translate-x-2",
                isActive ? "opacity-100 translate-x-0 text-primary" : "group-hover:opacity-100 group-hover:translate-x-0"
            )}>
                 {/* Small dot or chevron */}
                 <div className="w-1.5 h-1.5 rounded-full bg-current" />
            </div>
        </button>
    )
}
