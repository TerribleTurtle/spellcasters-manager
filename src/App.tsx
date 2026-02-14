// Add this to your App.tsx or a new context
import { useEffect, useState } from 'react'
import { UnitBuilder } from "@/components/editors/UnitBuilder"
import { UnitEditor } from "@/components/editors/UnitEditor"
import { ScribePanel } from "@/components/scribe/ScribePanel"
import { AppLayout } from "@/components/layout/AppLayout"
import { api } from "@/lib/api"
import { unitService } from "@/services/UnitService"
// import { Badge } from "@/components/ui/badge" // Removed: Unused & Missing
// import { Switch } from "@/components/ui/switch" // Removed: Missing
import { Unit, AppMode } from "./types"
import { AppView } from "@/types";
import { useToast } from "@/components/ui/toast-context"

function App() {
  const [units, setUnits] = useState<string[]>([])
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null)
  const [unitData, setUnitData] = useState<Unit | null>(null)
  const [status, setStatus] = useState<string>('Loading...')
  const [view, setView] = useState<AppView>('editor')
  const { error } = useToast();
  
  // Environment Mode
  const [mode, setMode] = useState<AppMode>('dev');

  useEffect(() => {
    checkHealth();
    fetchUnits();
  }, [mode]) // Refresh when mode changes

  const checkHealth = () => {
      api.getHealth(mode)
      .then(data => {
          setStatus(`Connected to ${data.mode.toUpperCase()} (${data.dataDir})`);
          if (mode === 'live' && !data.liveAvailable) {
              error("WARNING: Live Data Directory not found!");
          }
      })
      .catch((err: Error) => {
        setStatus(`Error: ${err.message}`);
        error(`Health Check Failed: ${err.message}`);
      });
  }

  const fetchUnits = () => {
    unitService.getAll(mode)
      .then(setUnits)
      .catch(console.error);
  }

  const handleSelectUnit = async (filename: string) => {
    setSelectedUnit(filename);
    setView('editor');
    try {
      const data = await unitService.getById(filename, mode);
      setUnitData(data);
    } catch (err) {
      console.error(err);
      error("Error loading unit");
    }
  }

  const handleUnitCreated = (filename: string) => {
      fetchUnits(); // Refresh list
      handleSelectUnit(filename); // Load and select new unit
  }

  return (
    <AppLayout
        mode={mode}
        setMode={setMode}
        view={view}
        setView={setView}
        status={status}
        units={units}
        selectedUnit={selectedUnit}
        onSelectUnit={handleSelectUnit}
    >
        {/* Watermark for Live Mode */}
        {mode === 'live' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5 select-none z-0">
                <span className="text-[10rem] font-black -rotate-12 text-red-500">LIVE</span>
            </div>
        )}

        <div className="relative z-10">
            {view === 'scribe' ? (
                <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
                     <ScribePanel mode={mode} />
                </div>
            ) : view === 'builder' ? (
                <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
                    <UnitBuilder mode={mode} onUnitCreated={handleUnitCreated} />
                </div>
            ) : (
                selectedUnit && unitData ? (
                    <div className="animate-in fade-in duration-300">
                        <UnitEditor 
                            key={selectedUnit + mode} 
                            filename={selectedUnit} 
                            initialData={unitData} 
                            mode={mode} 
                            onSave={() => {
                                // Unit saved
                            }}
                        />
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground animate-pulse">
                        <div className="w-16 h-16 bg-muted rounded-full mb-4 flex items-center justify-center">
                            <span className="text-4xl">🧙‍♂️</span>
                        </div>
                        <p className="text-lg font-medium">Select a unit from the Grimoire to begin.</p>
                        <p className="text-sm opacity-60">Or open The Scribe to manage patches.</p>
                    </div>
                )
            )}
        </div>
    </AppLayout>
  )
}

export default App
