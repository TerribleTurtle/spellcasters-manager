import { AppMode, AppView } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, ChevronRight, Home, Zap, Shield } from "lucide-react";

interface AppHeaderProps {
    mode: AppMode;
    setMode: (mode: AppMode) => void;
    view: AppView;
    filename: string | null;
    onToggleSidebar: () => void;
}

export function AppHeader({ mode, setMode, view, filename, onToggleSidebar }: AppHeaderProps) {
    return (
        <header className="h-16 border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
            
            {/* Left: Breadcrumbs & Sidebar Toggle */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={onToggleSidebar}>
                    <Menu className="w-5 h-5" />
                </Button>

                <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
                  <Home className="w-4 h-4 text-muted-foreground/70" />
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                  <span className="text-muted-foreground">Spellcasters</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                  {view === 'scribe' ? (
                       <span className="text-foreground">The Scribe</span>
                  ) : view === 'builder' ? (
                        <span className="text-foreground">Unit Builder</span>
                  ) : (
                       <>
                        <span className="text-muted-foreground">Grimoire</span>
                        {filename && (
                            <>
                                <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                                <span className="text-foreground">{filename.replace('.json', '')}</span>
                            </>
                        )}
                       </>
                  )}
                </nav>
            </div>

            {/* Right: Environment Switcher */}
            <div className="flex items-center gap-4">
                <div className="flex items-center bg-card/50 border border-border rounded-full p-1 pl-3 pr-1 backdrop-blur-sm">
                    <span className="text-xs font-medium mr-3 text-muted-foreground uppercase tracking-wider">
                        Environment
                    </span>
                    
                    <div className="flex bg-muted/50 rounded-full p-0.5 relative">
                        {/* Selected Indicator */}
                         <div className={cn(
                            "absolute inset-y-0.5 w-[calc(50%-2px)] rounded-full transition-all duration-300 shadow-sm",
                             mode === 'dev' ? "left-0.5 bg-blue-600" : "left-[50%] bg-red-600"
                         )} />

                        <button 
                            onClick={() => setMode('dev')}
                            className={cn(
                                "relative z-10 px-3 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5",
                                mode === 'dev' ? "text-white" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Zap className="w-3 h-3" />
                            DEV
                        </button>
                        <button 
                             onClick={() => setMode('live')}
                             className={cn(
                                "relative z-10 px-3 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5",
                                mode === 'live' ? "text-white" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Shield className="w-3 h-3" />
                            LIVE
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
