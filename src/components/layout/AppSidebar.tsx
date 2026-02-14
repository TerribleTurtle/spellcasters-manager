import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { Book, Edit3, Scroll, Hammer } from "lucide-react"
import { UnitList } from "../grimoire/UnitList"
import { AppView } from "@/types";

interface AppSidebarProps {
    view: AppView;
    setView: (view: AppView) => void;
    units: string[];
    selectedUnit: string | null;
    onSelectUnit: (unit: string) => void;
    className?: string; // Allow external layout to control width/stickiness/classes
}

export function AppSidebar({ 
    view, setView, 
    units, 
    selectedUnit, onSelectUnit,
    className
}: AppSidebarProps) {

    return (
        <aside className={cn("border-r border-border bg-card/30 flex flex-col backdrop-blur-xl h-full", className)}>
            {/* Branding */}
            <div className="h-16 flex items-center px-6 border-b border-border/50 bg-background/20">
                <div className="flex items-center gap-3 text-primary">
                    <div className="p-2 bg-primary/20 rounded-lg">
                         <Book className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-foreground">Grimoire</span>
                </div>
            </div>

            {/* Main Navigation */}
            <div className="p-4 space-y-1">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Tools</h3>
                <Button 
                    variant={view === 'editor' ? "secondary" : "ghost"} 
                    className={cn(
                        "w-full justify-start", 
                        view === 'editor' 
                            ? "bg-primary/10 text-primary hover:bg-primary/20" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )} 
                    onClick={() => setView('editor')}
                >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Unit Forge
                </Button>
                <Button 
                    variant={view === 'builder' ? "secondary" : "ghost"} 
                    className={cn(
                        "w-full justify-start", 
                        view === 'builder' 
                            ? "bg-primary/10 text-primary hover:bg-primary/20" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )} 
                    onClick={() => setView('builder')}
                >
                    <Hammer className="w-4 h-4 mr-2" />
                    Unit Builder
                </Button>
                <Button 
                    variant={view === 'scribe' ? "secondary" : "ghost"} 
                    className={cn(
                        "w-full justify-start", 
                        view === 'scribe' 
                            ? "bg-primary/10 text-primary hover:bg-primary/20" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )} 
                    onClick={() => setView('scribe')}
                >
                    <Scroll className="w-4 h-4 mr-2" />
                    The Scribe
                </Button>
            </div>

            <div className="my-2 border-t border-border/50 mx-6 opacity-50" />

            {/* Unit List */}
            <UnitList 
                units={units} 
                selectedUnit={selectedUnit} 
                onSelectUnit={onSelectUnit}
            />
            
            {/* Footer / User / Status */}
            <div className="p-4 border-t border-border/50 bg-background/20">
                <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity cursor-default">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
                        DM
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-medium">Dungeon Master</span>
                        <span className="text-[10px] text-muted-foreground">Online</span>
                    </div>
                </div>
            </div>
        </aside>
    )
}
