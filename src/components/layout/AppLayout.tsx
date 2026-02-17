import { ReactNode, useState } from 'react';
import { AppHeader } from './AppHeader';
import { AppMode, AppView } from '@/types';
import { cn } from "@/lib/utils";
import { DesktopAppLayout } from './DesktopAppLayout';
import { MobileAppLayout } from './MobileAppLayout';
import { EntityListHash } from '../grimoire/EntityList';

interface AppLayoutProps {
  children: ReactNode;
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  view: AppView;
  setView: (view: AppView) => void;
  items: EntityListHash[];
  selectedUnit: string | null;
  onSelectUnit: (unit: string) => void;
  currentCategory: string;
  onSelectCategory: (category: string) => void;
  pendingChanges: number;
  queuedIds: Set<string>;
}

export function AppLayout({
  children,
  mode,
  setMode,
  view,
  setView,
  items,
  selectedUnit,
  onSelectUnit,
  currentCategory,
  onSelectCategory,
  pendingChanges,
  queuedIds
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={cn(
        "h-screen w-full max-w-[1400px] mx-auto border-x border-border/50 shadow-2xl bg-background text-foreground flex overflow-hidden font-sans selection:bg-primary/30 selection:text-primary-foreground",
        mode === 'live' && "theme-live"
    )}>
        
        {/* Background Texture */}
        <div className="fixed inset-0 z-0 pointer-events-none">
             <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
             <div className="absolute inset-0 bg-linear-to-br from-background via-background/95 to-accent/10"></div>
                {/* Environment Indicator Line */}
                <div className={`h-1 w-full shrink-0 ${mode === 'live' ? 'bg-env-live' : 'bg-env-dev'}`} />
             {/* Dynamic Glow based on mode */}
             <div className={cn(
                 "absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-10 transition-colors duration-1000",
                 mode === 'live' ? "bg-env-live" : "bg-env-dev"
             )} />
        </div>

        {/* Sidebar - Desktop */}
        <DesktopAppLayout 
            view={view} 
            setView={setView} 
            items={items} 
            selectedUnit={selectedUnit} 
            onSelectUnit={onSelectUnit}
            currentCategory={currentCategory}
            onSelectCategory={onSelectCategory}
            pendingChanges={pendingChanges}
            queuedIds={queuedIds}
        />

        {/* Sidebar - Mobile (Drawer) */}
        <MobileAppLayout 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)}
            view={view} 
            setView={setView} 
            items={items} 
            selectedUnit={selectedUnit} 
            onSelectUnit={onSelectUnit}
            currentCategory={currentCategory}
            onSelectCategory={onSelectCategory}
            pendingChanges={pendingChanges}
            queuedIds={queuedIds}
        />

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
                <div className="container max-w-7xl mx-auto p-6 md:p-10 min-h-full animate-in fade-in duration-500 slide-in-from-bottom-2">
                    {children}
                </div>
             </main>
        </div>
    </div>
  );
}
