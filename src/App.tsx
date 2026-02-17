import { useEffect, useState, useCallback } from 'react'
import { ForgePage } from "@/components/forge/ForgePage"
import { ScribePanel } from "@/components/scribe/ScribePanel"
import { AppLayout } from "@/components/layout/AppLayout"
import { httpClient } from "@/lib/httpClient"
import { AppMode, Change } from "./types"
import { AppView } from "@/types";
import { useToast } from "@/components/ui/toast-context"
import { EntityListHash } from "@/components/grimoire/EntityList";

import { useNavigationGuard } from "@/hooks/useNavigationGuard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function App() {
  // State
  const [currentCategory, setCurrentCategory] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('category') || 'all';
  });
  const [registry, setRegistry] = useState<Record<string, any[]>>({}); 
  const [items, setItems] = useState<EntityListHash[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null)
  const [unitData, setUnitData] = useState<any | null>(null)
  const [view, setView] = useState<AppView>(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('view');
    return (v === 'forge' || v === 'scribe') ? v : 'forge';
  })
  const [pendingChanges, setPendingChanges] = useState<number>(0)
  const [queuedIds, setQueuedIds] = useState<Set<string>>(new Set())
  const { error } = useToast();

  // Dirty state — editors report into this; beforeunload guards browser close
  const [isDirty, setIsDirty] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Navigation Guard (In-App)
  const { handleNavigation, dialogOpen, confirmAction, cancelAction } = useNavigationGuard({ isDirty });
  
  // Environment Mode
  const [mode, setMode] = useState<AppMode>(() => {
      const params = new URLSearchParams(window.location.search);
      return params.get('mode') === 'live' ? 'live' : 'dev';
  });

  // URL State Sync
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (view) params.set('view', view);
    if (currentCategory) params.set('category', currentCategory);
    params.set('mode', mode);
    
    const newSearch = params.toString();
    const currentSearch = window.location.search.replace('?', '');
    
    if (newSearch !== currentSearch) {
        window.history.replaceState(null, '', `?${newSearch}`);
    }
  }, [view, currentCategory, mode]);

  const checkHealth = useCallback(() => {
      httpClient.request<{ status: string; dataDir: string; mode: string; liveAvailable?: boolean }>(`/api/health?mode=${mode}`)
      .then(data => {
          if (mode === 'live' && !data.liveAvailable) {
              error("WARNING: Live Data Directory not found!");
          }
      })
      .catch((err: Error) => {
        error(`Health Check Failed: ${err.message}`);
      });
  }, [mode, error]);

  const fetchQueue = useCallback(() => {
    import("@/services/PatchService").then(({ patchService }) => {
        patchService.getQueue(mode)
        .then((changes: Change[]) => {
            setPendingChanges(changes.length);
            const ids = new Set(changes.map(c => c.target_id || ""));
            setQueuedIds(ids);
        })
        .catch(() => {});
    });
  }, [mode]);

  // Fetch Data
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(() => {
    setIsLoading(true);
    import("@/services/DataService").then(({ dataService }) => {
        // Bulk Load Optimization (Phase 2) + Error Resilience (Phase 4)
        Promise.allSettled([
            dataService.getBulk('units', mode),
            dataService.getBulk('heroes', mode),
            dataService.getBulk('consumables', mode),
            dataService.getBulk('spells', mode),
            dataService.getBulk('titans', mode)
        ]).then((results) => {
            const [unitsRes, heroesRes, consumablesRes, spellsRes, titansRes] = results;
            
            // Helper to extract data or log error
            const getResult = (res: PromiseSettledResult<any>, label: string) => {
                if (res.status === 'fulfilled') return res.value;
                console.error(`Failed to load ${label}:`, res.reason);
                error(`Failed to load ${label}. See console.`);
                return [];
            };

            setRegistry({
                units: getResult(unitsRes, 'units'),
                heroes: getResult(heroesRes, 'heroes'),
                consumables: getResult(consumablesRes, 'consumables'),
                spells: getResult(spellsRes, 'spells'),
                titans: getResult(titansRes, 'titans')
            });
        }).finally(() => setIsLoading(false));
    });
  }, [mode, error]);

  // Compute filtered items from registry
  useEffect(() => {
    const allItems: EntityListHash[] = [];

    // Mapping: UI Tab ID -> Filter Predicate
    const CATEGORY_MAP: Record<string, (folder: string, entity: any) => boolean> = {
        'all': () => true,
        'hero': (folder) => folder === 'heroes',
        'unit': (folder, entity) => folder === 'units' && entity.category === 'Creature',
        'structure': (folder, entity) => folder === 'units' && entity.category === 'Building',
        'spell': (folder) => folder === 'spells',
        'consumable': (folder) => folder === 'consumables',
        'titan': (folder) => folder === 'titans', // Future-proof
    };
    
    const filterFn = CATEGORY_MAP[currentCategory] || (() => false);
    
    for (const [folder, entities] of Object.entries(registry)) {
      for (const entity of entities) {
        if (filterFn(folder, entity)) {
             allItems.push({
                id: entity._filename,
                category: entity._category || folder, // Keep original folder for icon pathing
            });
        }
      }
    }
    
    allItems.sort((a, b) => (a.id || '').localeCompare(b.id || ''));
    setItems(allItems);
  }, [registry, currentCategory]);

  // Fetch unit data when selection changes
  useEffect(() => {
    if (!selectedUnit) {
      setUnitData(null);
      return;
    }
    
    for (const entities of Object.values(registry)) {
      const found = entities.find(e => e._filename === selectedUnit);
      if (found) {
        setUnitData(found);
        return;
      }
    }
    setUnitData(null);
  }, [selectedUnit, registry]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
    fetchQueue();
    checkHealth();
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Callbacks ---
  const handleSelectUnit = useCallback((filename: string) => {
    handleNavigation(() => {
        setSelectedUnit(filename);
        setView('forge');
        setIsDirty(false);
        setIsCreating(false);
    });
  }, [handleNavigation]);

  const handleCreateStart = useCallback(() => {
    handleNavigation(() => {
        setSelectedUnit(null);
        setUnitData(null);
        setIsCreating(true);
        setIsDirty(false);
    });
  }, [handleNavigation]);

  const handleDuplicate = useCallback((data: any) => {
      handleNavigation(() => {
          // Enter creation mode with pre-filled data
          setSelectedUnit(null);
          // Deep clone and strip ID to avoid mutation/reference issues
          const cloned = JSON.parse(JSON.stringify(data));
          delete cloned.id;
          delete cloned._filename;
          
          setUnitData(cloned);
          setIsCreating(true);
          setIsDirty(true); // Technically dirty immediately as it differs from "nothing"
      });
  }, [handleNavigation]);

  const handleCreateCancel = useCallback(() => {
    setIsCreating(false);
    setIsDirty(false);
  }, []);

  const handleEntityCreated = useCallback(() => {
    setIsCreating(false);
    setIsDirty(false);
    fetchData();
    fetchQueue();
  }, [fetchData, fetchQueue]);

  const handleClearSelection = useCallback(() => {
    setSelectedUnit(null);
    setUnitData(null);
    setIsDirty(false);
  }, []);

  const handleOpenInEditor = useCallback((change: Change) => {
    if (change.target_id) {
      const filename = change.target_id.endsWith('.json') ? change.target_id : `${change.target_id}.json`;
      handleNavigation(() => {
        setView('forge');
        setSelectedUnit(filename);
      });
    }
  }, []);

  if (isLoading && Object.keys(registry).length === 0) {
      return (
          <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
              <div className="flex flex-col items-center gap-4">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-lg font-medium text-muted-foreground animate-pulse">Summoning Grimoire...</p>
              </div>
          </div>
      );
  }

  return (
    <AppLayout
        mode={mode}
        setMode={setMode}
        view={view}
        setView={(v: AppView) => handleNavigation(() => { setView(v); setIsDirty(false); })}
        items={items}
        selectedUnit={selectedUnit}
        onSelectUnit={handleSelectUnit}
        currentCategory={currentCategory}
        onSelectCategory={setCurrentCategory}
        pendingChanges={pendingChanges}
        queuedIds={queuedIds}
    >
        <div className="relative z-10 h-full">
            {view === 'forge' ? (
                <div className="animate-in fade-in duration-500 h-full">
                    <ForgePage 
                        mode={mode}
                        selectedUnit={selectedUnit}
                        unitData={unitData}
                        currentCategory={currentCategory}
                        editorType={unitData?._category}
                        onUnitSaved={() => {
                            setIsDirty(false);
                            fetchData();
                            fetchQueue();
                        }}
                        onUnitCreated={handleEntityCreated}
                        onNavigateToScribe={() => handleNavigation(() => { setView('scribe'); setIsDirty(false); })}
                        onClearSelection={handleClearSelection}
                        onDirtyChange={setIsDirty}
                        isCreating={isCreating}
                        onCreateStart={handleCreateStart}
                        onCreateCancel={handleCreateCancel}
                        onDuplicate={handleDuplicate}
                    />
                </div>
            ) : view === 'scribe' ? (
                <div className="animate-in fade-in duration-500 h-full">
                    <ScribePanel mode={mode} onOpenInEditor={handleOpenInEditor} />
                </div>
            ) : (
                 <div className="flex items-center justify-center h-full text-muted-foreground">
                    Unknown View
                 </div>
            )}
            
            <AlertDialog open={dialogOpen} onOpenChange={(open) => !open && cancelAction()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={cancelAction}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmAction}>Discard Changes</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    </AppLayout>
  )
}

export default App
