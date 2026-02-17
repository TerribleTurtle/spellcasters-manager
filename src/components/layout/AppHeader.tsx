import { AppView } from "@/types";
import { Button } from "@/components/ui/button";
import { Menu, ChevronRight, Home } from "lucide-react";

interface AppHeaderProps {
    view: AppView;
    filename: string | null;
    onToggleSidebar: () => void;
}

export function AppHeader({ view, filename, onToggleSidebar }: AppHeaderProps) {
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
                       <span className="text-foreground">Patch Manager</span>
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

            {/* Right: Environment Switcher (Removed) */}
            {/* The entire div for environment switcher is removed */}
            {/* <div className="flex items-center gap-3">
                
                <HealthIndicator />
                <div className="flex items-center bg-card/50 border border-border rounded-full p-1 pl-3 pr-1 backdrop-blur-sm">
                    <span className="text-xs font-medium mr-3 text-muted-foreground uppercase tracking-wider">
                        Environment
                    </span>
                    
                    <div className="flex bg-muted/50 rounded-full p-0.5 relative">
                         <div className={cn(
                            "absolute inset-y-1 w-[calc(50%-4px)] rounded-md transition-all duration-300 shadow-sm",
                             mode === 'dev' ? "left-1 bg-env-dev text-white" : "left-[calc(50%+2px)] bg-env-live text-white"
                         )} />

                        <Button 
                            variant="ghost"
                            onClick={() => handleModeSwitch('dev')}
                            className={cn(
                                "relative z-10 px-3 py-1.5 h-auto rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 hover:bg-transparent",
                                mode === 'dev' ? "text-white hover:text-white" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Zap className="w-3 h-3" />
                            DEV
                        </Button>
                        <Button 
                             variant="ghost"
                             onClick={() => handleModeSwitch('live')}
                             className={cn(
                                "relative z-10 px-3 py-1.5 h-auto rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 hover:bg-transparent",
                                mode === 'live' ? "text-white hover:text-white" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Shield className="w-3 h-3" />
                            LIVE
                        </Button>
                    </div>
                </div>
            </div> */}

            {/* AlertDialog for mode switch (Removed) */}
            {/* <AlertDialog open={!!pendingMode} onOpenChange={(open) => !open && setPendingMode(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Switch Environment?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingMode === 'live' ? (
                                <>
                                    You are about to switch to <strong>LIVE</strong> mode. 
                                    <br/><br/>
                                    Any changes you make here will affect the actual game data. 
                                    The theme will change to indicate this dangerous state.
                                </>
                            ) : (
                                <>
                                    Returning to <strong>DEV</strong> mode (Sandbox).
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmModeSwitch}
                            className={pendingMode === 'live' ? "bg-destructive hover:bg-destructive/90" : ""}
                        >
                            {pendingMode === 'live' ? "Switch to Live" : "Switch to Dev"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog> */}
        </header>
    );
}
