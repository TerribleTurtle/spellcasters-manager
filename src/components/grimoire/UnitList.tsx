import { useState, useMemo } from 'react';
import { UnitListItem } from './UnitListItem';
import { Search } from 'lucide-react';


interface UnitListProps {
    units: string[];
    selectedUnit: string | null;
    onSelectUnit: (unit: string) => void;
}

export function UnitList({ units, selectedUnit, onSelectUnit }: UnitListProps) {
    const [search, setSearch] = useState("");

    const filteredUnits = useMemo(() => {
        if (!search) return units;
        const lower = search.toLowerCase();
        return units.filter(u => u.toLowerCase().includes(lower));
    }, [units, search]);

    return (
        <div className="flex-1 flex flex-col min-h-0">
             {/* Header & Search */}
             <div className="px-4 pb-2 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Grimoire</span>
                    <span className="text-[10px] font-mono bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-full border border-border/50">
                        {filteredUnits.length}
                    </span>
                </div>

                <div className="relative group">
                    <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input 
                        type="text" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search units..." 
                        className="w-full bg-secondary/50 border border-border/60 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/50 text-foreground"
                    />
                </div>
             </div>

             {/* Scrollable List */}
             <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar pb-4">
                 {filteredUnits.length === 0 ? (
                     <div className="p-4 text-center text-muted-foreground text-sm opacity-60">
                         No units found.
                     </div>
                 ) : (
                     filteredUnits.map(file => (
                         <UnitListItem 
                            key={file} 
                            filename={file} 
                            isActive={selectedUnit === file}
                            onSelect={() => onSelectUnit(file)}
                         />
                     ))
                 )}
             </div>
        </div>
    )
}
