import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast-context"
import { cn } from "@/lib/utils"


import { Book, Hammer, Sword, Scroll, Globe, PawPrint, Castle, FlaskConical, Plus, Download, Upload, FolderSync, ArrowLeftRight, Trash2, Loader2 } from "lucide-react"
import { EntityList } from "../grimoire/EntityList"
import { EntityListHash } from "@/types";
import { AppView } from "@/types";
import { httpClient } from "@/lib/httpClient";

interface DevConfig {
    dataDir: string;
    label: 'live' | 'mock';
    livePath: string;
    mockPath: string;
}

interface AppSidebarProps {
    view: AppView;
    setView: (view: AppView) => void;
    items: EntityListHash[];
    selectedUnit: string | null;
    onSelectUnit: (unit: string) => void;
    className?: string;
    currentCategory: string;
    onSelectCategory: (category: string) => void;
    pendingChanges: number;
    queuedIds: Set<string>;
    onCreate?: () => void;
    onRefresh: () => void;
}

export function AppSidebar({ 
    view, setView, 
    items, 
    selectedUnit, onSelectUnit,
    className,
    currentCategory,
    onSelectCategory,
    pendingChanges,
    queuedIds,
    onCreate,
    onRefresh
}: AppSidebarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { success, error } = useToast();

    // ── Dev Config State ──
    const [devConfig, setDevConfig] = useState<DevConfig | null>(null);
    const [devLoading, setDevLoading] = useState<string | null>(null); // null | 'switch' | 'sync' | 'wipe'

    const fetchDevConfig = useCallback(async () => {
        try {
            const cfg = await httpClient.request<DevConfig>('/api/dev/config');
            setDevConfig(cfg);
        } catch {
            // Server might be restarting, ignore
        }
    }, []);

    useEffect(() => { 
        // Defer fetch to avoid synchronous setState warning
        const t = setTimeout(() => void fetchDevConfig(), 0);
        return () => clearTimeout(t);
    }, [fetchDevConfig]);

    const pollUntilReady = useCallback(async () => {
        const maxAttempts = 30;
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(r => setTimeout(r, 1500));
            try {
                await httpClient.request('/api/health');
                return true;
            } catch {
                // still down
            }
        }
        return false;
    }, []);

    const handleSwitchPath = async () => {
        if (!devConfig) return;
        const target = devConfig.label === 'live' ? 'mock' : 'live';
        setDevLoading('switch');
        try {
            await httpClient.request('/api/dev/switch-path', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target })
            });
            success(`Switching to ${target}… restarting server`);
            // Server will restart — poll until it's back
            await pollUntilReady();
            window.location.reload();
        } catch (err) {
            error('Switch failed: ' + (err as Error).message);
            setDevLoading(null);
        }
    };

    const handleSync = async () => {
        setDevLoading('sync');
        try {
            await httpClient.request('/api/dev/sync', { method: 'POST' });
            success('Sync complete! Reloading…');
            onRefresh();
            setDevLoading(null);
            await fetchDevConfig();
        } catch (err) {
            error('Sync failed: ' + (err as Error).message);
            setDevLoading(null);
        }
    };

    const handleWipeAndCopy = async () => {
        setDevLoading('wipe');
        try {
            await httpClient.request('/api/dev/sync?clean=true', { method: 'POST' });
            success('Wipe & Copy complete! Reloading…');
            onRefresh();
            setDevLoading(null);
            await fetchDevConfig();
        } catch (err) {
            error('Wipe & Copy failed: ' + (err as Error).message);
            setDevLoading(null);
        }
    };

    const handleExport = async () => {
        try {
            // Initiate download
            // We use direct window.location for GET download or fetch blob
            const response = await httpClient.request('/api/data/export');
            // Assuming httpClient returns JSON response with data... wait, export endpoint returns JSON.
            // We want to download it as a file.
            // If we use httpClient, we get the object. We need to blob it.
            
            const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch {
            error("Export Failed");
        }
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                await httpClient.request('/api/data/import', {
                    method: 'POST',
                    body: json
                });
                success("Import Successful! Reloading...");
                setTimeout(() => window.location.reload(), 1000);
            } catch (err) {
                error("Import Failed: " + (err as Error).message);
            }
        };
        reader.readAsText(file);
        
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

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

            {/* Category Selector */}
            <div className="p-4 pb-0 space-y-2">
                 <div className="flex items-center justify-between px-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Library</h3>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onCreate} title="Create New">
                        <Plus className="w-3 h-3" />
                    </Button>
                 </div>
                 <div className="grid grid-cols-3 gap-1 bg-muted/30 p-1 rounded-lg">
                    {/* Row 1 */}
                    <Button 
                        variant={currentCategory === 'all' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        className={cn("h-8", currentCategory === 'all' && "bg-background shadow-sm")}
                        onClick={() => onSelectCategory('all')}
                        title="All"
                    >
                        <Globe className="w-4 h-4" />
                    </Button>
                    <Button 
                        variant={currentCategory === 'hero' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        className={cn("h-8", currentCategory === 'hero' && "bg-background shadow-sm")}
                        onClick={() => onSelectCategory('hero')}
                        title="Spellcasters"
                    >
                        <Sword className="w-4 h-4" />
                    </Button>
                    <Button 
                        variant={currentCategory === 'unit' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        className={cn("h-8", currentCategory === 'unit' && "bg-background shadow-sm")}
                        onClick={() => onSelectCategory('unit')}
                        title="Creatures"
                    >
                        <PawPrint className="w-4 h-4" />
                    </Button>

                    {/* Row 2 */}
                    <Button 
                        variant={currentCategory === 'structure' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        className={cn("h-8", currentCategory === 'structure' && "bg-background shadow-sm")}
                        onClick={() => onSelectCategory('structure')}
                        title="Buildings"
                    >
                        <Castle className="w-4 h-4" />
                    </Button>
                    <Button 
                        variant={currentCategory === 'spell' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        className={cn("h-8", currentCategory === 'spell' && "bg-background shadow-sm")}
                        onClick={() => onSelectCategory('spell')}
                        title="Spells"
                    >
                        <Scroll className="w-4 h-4" />
                    </Button>
                    <Button 
                        variant={currentCategory === 'consumable' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        className={cn("h-8", currentCategory === 'consumable' && "bg-background shadow-sm")}
                        onClick={() => onSelectCategory('consumable')}
                        title="Consumables"
                    >
                        <FlaskConical className="w-4 h-4" />
                    </Button>
                 </div>
                 <div className="text-center text-mini text-muted-foreground uppercase tracking-widest font-medium py-1">
                     {currentCategory}
                 </div>
            </div>
            
            <div className="px-6 my-2">
                <div className="h-px bg-border/50" />
            </div>

            {/* Main Navigation */}
            <div className="px-4 space-y-1">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Tools</h3>
                <Button 
                    variant={view === 'forge' ? "secondary" : "ghost"} 
                    className={cn(
                        "w-full justify-start h-11 transition-all duration-200", 
                        view === 'forge' 
                            ? "bg-primary/10 text-primary hover:bg-primary/20" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )} 
                    onClick={() => setView('forge')}
                >
                    <Hammer className="w-4 h-4 mr-2" />
                    Studio
                </Button>
                <Button 
                    variant={view === 'scribe' ? "secondary" : "ghost"} 
                    className={cn(
                        "w-full justify-start h-11 transition-all duration-200 relative", 
                        view === 'scribe' 
                            ? "bg-primary/10 text-primary hover:bg-primary/20" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )} 
                    onClick={() => setView('scribe')}
                >
                    <Scroll className="w-4 h-4 mr-2" />
                    Patch Manager
                    {pendingChanges > 0 && (
                        <span className="ml-auto text-mini bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-mono font-bold">
                            {pendingChanges}
                        </span>
                    )}
                </Button>
            </div>

            <div className="px-6 my-2">
                <div className="h-px bg-border/50" />
            </div>

            {/* Unit List */}
            <EntityList 
                items={items} 
                selectedUnit={selectedUnit} 
                onSelectUnit={onSelectUnit}
                currentView={currentCategory === 'all' ? 'Library' : currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1) + 's'}
                queuedIds={queuedIds}
            />
            
            {/* Footer / System Tools */}
            <div className="p-4 border-t border-border/50 bg-background/20 mt-auto space-y-3">
                <div className="space-y-2">
                   <h3 className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">System Params</h3> 
                   <div className="grid grid-cols-2 gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs h-7 bg-background/50 hover:bg-background border-primary/20 hover:border-primary/50" 
                            onClick={handleExport}
                        >
                            <Download className="w-3 h-3 mr-1.5" />
                            Export
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs h-7 bg-background/50 hover:bg-background border-primary/20 hover:border-primary/50" 
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="w-3 h-3 mr-1.5" />
                            Import
                        </Button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept=".json" 
                            onChange={handleImport} 
                        />
                   </div>
                </div>

                {/* Data Source */}
                <div className="space-y-2 pt-2 border-t border-border/10">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">Data Source</h3>
                        {devConfig && (
                            <span className={cn(
                                "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full tracking-wide",
                                devConfig.label === 'live'
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "bg-amber-500/20 text-amber-400"
                            )}>
                                {devConfig.label === 'live' ? '● Live' : '● Mock'}
                            </span>
                        )}
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-[10px] h-7 bg-background/50 hover:bg-background border-primary/20 hover:border-primary/50"
                            onClick={handleSwitchPath}
                            disabled={!!devLoading || !devConfig}
                            title={devConfig ? `Switch to ${devConfig.label === 'live' ? 'Mock' : 'Live'}` : 'Loading…'}
                        >
                            {devLoading === 'switch' ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowLeftRight className="w-3 h-3 mr-1" />}
                            {devLoading !== 'switch' && 'Switch'}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-[10px] h-7 bg-background/50 hover:bg-background border-primary/20 hover:border-primary/50"
                            onClick={handleSync}
                            disabled={!!devLoading}
                            title="Sync live → mock (preserves queue)"
                        >
                            {devLoading === 'sync' ? <Loader2 className="w-3 h-3 animate-spin" /> : <FolderSync className="w-3 h-3 mr-1" />}
                            {devLoading !== 'sync' && 'Sync'}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-[10px] h-7 bg-background/50 hover:bg-background border-destructive/20 hover:border-destructive/50 hover:text-destructive"
                            onClick={handleWipeAndCopy}
                            disabled={!!devLoading}
                            title="Wipe mock_data & fresh copy from live (clears queue)"
                        >
                            {devLoading === 'wipe' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3 mr-1" />}
                            {devLoading !== 'wipe' && 'Wipe'}
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity cursor-default pt-2 border-t border-border/10">
                    <div className="w-6 h-6 rounded-full bg-linear-to-tr from-primary to-accent flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-white/10">
                        DM
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-semibold leading-none">Dungeon Master</span>
                        <span className="text-[9px] text-muted-foreground leading-none mt-0.5">Online</span>
                    </div>
                </div>
            </div>
        </aside>
    )
}
