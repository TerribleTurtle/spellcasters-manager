import { useState, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { EntityListItem } from './EntityListItem';
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { Search, Ghost, ArrowUpDown } from 'lucide-react';

import { EntityListHash } from "@/types";

interface EntityListProps {
    items: EntityListHash[];
    selectedUnit: string | null;
    onSelectUnit: (unit: string) => void;
    currentView?: string; // "All", "Creatures", etc.
    queuedIds: Set<string>;
}

export function EntityList({ items, selectedUnit, onSelectUnit, isLoading = false, currentView = "Grimoire", queuedIds }: EntityListProps & { isLoading?: boolean }) {
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState<'smart' | 'alpha' | 'alpha-desc'>('smart');

    const filteredItems = useMemo(() => {
        let list = items;
        
        // 1. Search
        if (search) {
            const lower = search.toLowerCase();
            list = list.filter(u => u.id.toLowerCase().includes(lower));
        }

        // 2. Sort
        if (sort === 'alpha') {
            return [...list].sort((a, b) => a.id.localeCompare(b.id));
        }
        if (sort === 'alpha-desc') {
            return [...list].sort((a, b) => b.id.localeCompare(a.id));
        }

        return list; // 'smart' preserves App.tsx order
    }, [items, search, sort]);

    const parentRef = useRef<HTMLDivElement>(null);

    // eslint-disable-next-line react-hooks/incompatible-library
    const rowVirtualizer = useVirtualizer({
        count: filteredItems.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 60, // increased height to prevent overlap
        overscan: 5,
    });

    return (
        <div className="flex-1 flex flex-col min-h-0">
            {/* Header & Search */}
             <div className="px-4 pb-2 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{currentView}</span>
                    <span className="text-xs font-mono bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-full border border-border/50">
                        {isLoading ? "..." : filteredItems.length}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative group flex-1">
                        <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input 
                            type="text" 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={`Search...`} 
                            disabled={isLoading}
                            className="w-full bg-secondary/50 border-border/60 pl-9 pr-3 h-9 text-sm focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all placeholder:text-muted-foreground/50"
                        />
                    </div>
                    
                    <Select value={sort} onValueChange={(v) => setSort(v as 'smart' | 'alpha' | 'alpha-desc')}>
                        <SelectTrigger className="w-[40px] px-0 justify-center text-muted-foreground hover:text-foreground bg-secondary/30 h-9">
                            <ArrowUpDown className="w-4 h-4" />
                        </SelectTrigger>
                        <SelectContent align="end">
                            <SelectItem value="smart">Default Sort</SelectItem>
                            <SelectItem value="alpha">A to Z</SelectItem>
                            <SelectItem value="alpha-desc">Z to A</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
             </div>

             {/* Scrollable List */}
             <div 
                ref={parentRef}
                className="flex-1 overflow-y-auto px-2 custom-scrollbar pb-4"
             >
                 {isLoading ? (
                     // Loading Skeletons
                     <div className="space-y-2 p-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-lg border border-transparent">
                                <Skeleton className="w-4 h-4 rounded-full" />
                                <div className="space-y-1.5 flex-1">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2 opacity-50" />
                                </div>
                            </div>
                        ))}
                     </div>

                 ) : filteredItems.length === 0 ? (
                     // Enhanced Empty State
                     <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-3">
                         <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                            <Ghost className="w-6 h-6 text-muted-foreground/50" />
                         </div>
                         <div className="space-y-1">
                             <p className="text-sm font-medium text-foreground">No units found</p>
                             <p className="text-xs text-muted-foreground max-w-[180px] mx-auto">
                                {search ? `No results for "${search}"` : "The Grimoire is empty."}
                             </p>
                         </div>
                         {search && (
                             <button 
                                onClick={() => setSearch("")}
                                className="text-xs text-primary hover:underline hover:text-primary/80 transition-colors"
                             >
                                Clear search
                             </button>
                         )}
                     </div>
                 ) : (
                    <div
                        style={{
                            height: `${rowVirtualizer.getTotalSize()}px`,
                            width: '100%',
                            position: 'relative',
                        }}
                    >
                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                             const item = filteredItems[virtualRow.index];
                             return (
                                 <div
                                     key={item.id}
                                     ref={rowVirtualizer.measureElement}
                                     data-index={virtualRow.index}
                                     style={{
                                         position: 'absolute',
                                         top: 0,
                                         left: 0,
                                         width: '100%',
                                         transform: `translateY(${virtualRow.start}px)`,
                                     }}
                                     className="py-1 hover:z-10" // reduced gap for tighter fit
                                 >
                                     <EntityListItem 
                                        filename={item.id} 
                                        isActive={selectedUnit === item.id}
                                        onSelect={() => onSelectUnit(item.id)}
                                        category={item.category}
                                        isQueued={queuedIds.has(item.id)}
                                     />
                                 </div>
                             );
                        })}
                    </div>
                 )}
             </div>
        </div>
    )
}
