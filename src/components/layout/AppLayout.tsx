import { ReactNode, useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { AppMode, AppView } from '@/types';
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  view: AppView;
  setView: (view: AppView) => void;
  status: string; // Deprecated but kept for compatibility if needed, or we display it elsewhere
  units: string[];
  selectedUnit: string | null;
  onSelectUnit: (unit: string) => void;
}

export function AppLayout({
  children,
  mode,
  setMode,
  view,
  setView,
  units,
  selectedUnit,
  onSelectUnit
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen w-full bg-background text-foreground flex overflow-hidden font-sans selection:bg-primary/30 selection:text-primary-foreground">
        
        {/* Background Texture */}
        <div className="fixed inset-0 z-0 pointer-events-none">
             <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
             <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-accent/10"></div>
             {/* Dynamic Glow based on mode */}
             <div className={cn(
                 "absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-10 transition-colors duration-1000",
                 mode === 'live' ? "bg-red-500" : "bg-blue-500"
             )} />
        </div>

        {/* Sidebar - Desktop (Fixed) */}
        <div className="hidden md:block w-72 h-full z-20 relative shrink-0">
             <AppSidebar 
                view={view} 
                setView={setView} 
                units={units} 
                selectedUnit={selectedUnit} 
                onSelectUnit={onSelectUnit}
             />
        </div>

        {/* Sidebar - Mobile (Drawer) */}
        {sidebarOpen && (
            <div className="fixed inset-0 z-50 md:hidden bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}>
                <div className="absolute inset-y-0 left-0 w-3/4 max-w-xs bg-card h-full shadow-2xl" onClick={e => e.stopPropagation()}>
                    <AppSidebar 
                        view={view} 
                        setView={setView} 
                        units={units} 
                        selectedUnit={selectedUnit} 
                        onSelectUnit={(u) => { onSelectUnit(u); setSidebarOpen(false); }}
                    />
                </div>
            </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative z-10 h-full overflow-hidden">
             
             <AppHeader 
                mode={mode} 
                setMode={setMode} 
                view={view} 
                filename={selectedUnit}
                onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
             />

             <main className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar p-0">
                <div className="container max-w-6xl mx-auto p-6 md:p-10 min-h-full animate-in fade-in duration-500 slide-in-from-bottom-2">
                    {children}
                </div>
             </main>
        </div>
    </div>
  );
}
