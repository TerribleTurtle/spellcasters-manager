import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { User, Sword, Box, Scroll, Hammer } from "lucide-react"

interface UnitListItemProps {
    filename: string;
    isActive: boolean;
    onSelect: () => void;
    category: string; // "hero", "unit", "spell", "structure", "consumable"
    isQueued?: boolean;
}

export function EntityListItem({ filename, isActive, onSelect, category, isQueued }: UnitListItemProps) {
    const name = filename.replace('.json', '').replace(/_/g, ' ');
    
    // Deterministic icon based on category
    const getIcon = () => {
        switch(category) {
            case 'hero': 
            case 'heroes': return <Sword className="w-4 h-4" />;
            case 'spell': 
            case 'spells': return <Scroll className="w-4 h-4" />; 
            case 'structure': return <Hammer className="w-4 h-4" />; 
            case 'consumable': 
            case 'items': return <Box className="w-4 h-4" />;
            case 'titan': return <User className="w-4 h-4" />; // Or a specific Titan icon
            case 'creature':
            case 'unit':
            case 'units':
            default: return <User className="w-4 h-4" />;
        }
    }

    const getSubtitle = () => {
         switch(category) {
            case 'hero':
            case 'heroes': return "Hero";
            case 'spell':
            case 'spells': return "Spell";
            case 'consumable':
            case 'items': 
            case 'consumables': return "Item";
            case 'titan':
            case 'titans': return "Titan";
            case 'structure': return "Building";
            case 'unit': 
            case 'units': return "Creature";
            default: return category.charAt(0).toUpperCase() + category.slice(1);
        }
    }

    // Color Theme Helper
    const getTheme = () => {
        if (isActive) return "text-primary bg-primary/10 border-primary/20"; // Active overrides category hue

        switch(category) {
            case 'hero': return "text-purple-400 group-hover:text-purple-300 group-hover:bg-purple-950/30";
            case 'titan': return "text-yellow-400 group-hover:text-yellow-300 group-hover:bg-yellow-950/30";
            case 'spell': return "text-sky-400 group-hover:text-sky-300 group-hover:bg-sky-950/30";
            case 'structure': return "text-slate-400 group-hover:text-slate-300 group-hover:bg-slate-800/50";
            case 'consumable': return "text-emerald-400 group-hover:text-emerald-300 group-hover:bg-emerald-950/30";
            case 'unit': 
            default: return "text-amber-400 group-hover:text-amber-300 group-hover:bg-amber-950/30";
        }
    }

    const tierMatch = filename.match(/_t(\d+)/);
    const tier = tierMatch ? tierMatch[1] : null;

    return (
        <Button
            variant="ghost"
            onClick={onSelect}
            className={cn(
                "w-full justify-start h-auto text-left px-3 py-3 rounded-lg text-sm transition-all duration-200 group relative overflow-hidden border border-border/40 focus-ring",
                isActive 
                    ? "bg-primary/5 text-primary font-medium border-primary/20 shadow-[0_0_15px_-3px_rgba(var(--primary),0.2)]" 
                    : "text-muted-foreground hover:text-foreground" // Base fallback, overridden by getTheme in icon/container
            )}
        >
            {/* Active Indicator Glow */}
            {isActive && (
                <div className="absolute inset-0 bg-linear-to-r from-primary/10 via-transparent to-transparent opacity-50" />
            )}

            {/* Hover/Theme Background (Subtle) */}
            <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                !isActive && getTheme().split(" ").filter(c => c.includes("bg-")).join(" ") // Extract BG classes
            )} />

            {/* Icon Container with Theme Color */}
            <div className={cn(
                "relative z-10 transition-transform duration-300 shrink-0 mr-3 p-1.5 rounded-md bg-secondary/50", 
                isActive ? "text-primary scale-110" : cn("opacity-70 group-hover:opacity-100 group-hover:scale-110", getTheme().split(" ").filter(c => c.includes("text-")).join(" "))
            )}>
                {getIcon()}
            </div>
            
            <div className="flex-1 min-w-0 relative z-10 flex flex-col items-start gap-0.5">
                <div className={cn("truncate font-medium capitalize", isActive ? "text-primary" : "text-foreground/80 group-hover:text-foreground")}>{name}</div>
                <div className="flex items-center gap-2 text-xs opacity-60 font-normal">
                   <span className={cn(!isActive && getTheme().split(" ").filter(c => c.includes("text-")).join(" "))}>{getSubtitle()}</span>
                   {tier && (
                       <>
                           <span className="w-1 h-1 rounded-full bg-current" />
                           <span>Tier {tier}</span>
                       </>
                   )}
                </div>
            </div>
            
            {/* Queue Badge */}
            {isQueued && (
                <div className="absolute right-2 top-2 z-20">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-queued-ping opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-queued"></span>
                    </span>
                </div>
            )}
        </Button>
    )
}
