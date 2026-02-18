import { useEffect, useState } from 'react'
import { ForgePage } from "@/components/forge/ForgePage"
import { ScribePanel } from "@/components/scribe/ScribePanel"
import { AppLayout } from "@/components/layout/AppLayout"
import { AppView } from "@/types";
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
import { useAppData } from "@/hooks/useAppData";
import { useEntitySelection } from "@/hooks/useEntitySelection";

function App() {
  // Navigation State (URL Sync)
  const [currentCategory, setCurrentCategory] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('category') || 'all';
  });

  const [view, setView] = useState<AppView>(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('view');
    return (v === 'forge' || v === 'scribe') ? v : 'forge';
  });

  // URL State Sync
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (view) params.set('view', view);
    if (currentCategory) params.set('category', currentCategory);
    
    const newSearch = params.toString();
    const currentSearch = window.location.search.replace('?', '');
    
    if (newSearch !== currentSearch) {
        window.history.replaceState(null, '', `?${newSearch}`);
    }
  }, [view, currentCategory]);

  // Hook 1: Data & Registry
  const { 
      registry, 
      items, 
      pendingChanges, 
      queuedIds, 
      isLoading, 
      fetchData, 
      fetchQueue 
  } = useAppData(currentCategory);

  // Hook 2: Selection & Editing
  const {
      selectedUnit,
      unitData,
      isCreating,
      restoredChange,
      handleSelectUnit,
      handleCreateStart,
      handleDuplicate,
      handleCreateCancel,
      handleEntityCreated,
      handleClearSelection,
      handleOpenInEditor,
      setIsDirty,
      setRestoredChange,
      handleNavigation,
      dialogOpen,
      confirmAction,
      cancelAction
  } = useEntitySelection({
      registry,
      currentCategory,
      setCurrentCategory,
      setView,
      fetchData,
      fetchQueue
  });

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
        view={view}
        setView={(v: AppView) => handleNavigation(() => { setView(v); setIsDirty(false); setRestoredChange(null); })}
        items={items}
        selectedUnit={selectedUnit}
        onSelectUnit={handleSelectUnit}
        currentCategory={currentCategory}
        onSelectCategory={setCurrentCategory}
        pendingChanges={pendingChanges}
        queuedIds={queuedIds}
        onRefresh={() => {
            fetchData();
            fetchQueue();
        }}
    >
        <div className="relative z-10 h-full">
            {view === 'forge' ? (
                <div className="animate-in fade-in duration-500 h-full">
                    <ForgePage 
                        selectedUnit={selectedUnit}
                        unitData={unitData}
                        currentCategory={currentCategory}
                        editorType={unitData?._category}
                        restoredChange={restoredChange}
                        onUnitSaved={() => {
                            setIsDirty(false);
                            setRestoredChange(null);
                            fetchData();
                            fetchQueue();
                        }}
                        onDiscardRestoredChange={() => setRestoredChange(null)}
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
                    <ScribePanel 
                        onOpenInEditor={handleOpenInEditor} 
                        onQueueChange={fetchQueue}
                        onDataReverted={() => { fetchData(); setIsDirty(false); }}
                    />
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
