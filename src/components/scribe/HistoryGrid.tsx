import { useState, useEffect, useCallback } from 'react';
import { AppMode, Patch, Change } from "@/types";
import { patchService } from "@/services/PatchService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DiffCard } from './DiffCard';
import { Search, Filter, Calendar, Layers, RotateCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"


interface HistoryGridProps {
    mode: AppMode;
}

interface FlatChange extends Change {
    patch_version: string;
    patch_date: string;
    patch_title: string;
}

export function HistoryGrid({ mode }: HistoryGridProps) {
    const [rollbackCandidate, setRollbackCandidate] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'patches' | 'changes'>('patches');
    const [searchTerm, setSearchTerm] = useState("");
    const [tagFilter, setTagFilter] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [data, setData] = useState<Patch[] | FlatChange[]>([]);
    const [loading, setLoading] = useState(true);
    const { success, error } = useToast();

    const fetchData = useCallback(async (isDebounced = false) => {
        if (!isDebounced) setLoading(true);
        try {
            const filters: Record<string, string | boolean> = {};
            if (tagFilter !== 'all') filters.tag = tagFilter;
            if (searchTerm) filters.entity = searchTerm;
            if (startDate) filters.from = startDate;
            if (endDate) filters.to = endDate;
            if (viewMode === 'changes') filters.flat = true;

            const result = await patchService.getHistory(mode, filters);
            setData(result);
        } catch {
            error("Failed to load history");
        } finally {
            setLoading(false);
        }
    }, [mode, tagFilter, searchTerm, startDate, endDate, viewMode, error]);

    const handleRollback = (patchId: string) => {
        setRollbackCandidate(patchId);
    };

    const confirmRollback = async () => {
        if (!rollbackCandidate) return;
        
        // Close dialog first, then let grid loading state take over
        const targetId = rollbackCandidate;
        setRollbackCandidate(null);
        setLoading(true);
        
        try {
            const res = await patchService.rollback(mode, targetId);
            if (res.success) {
                await fetchData();
                success("Rollback Successful! A revert patch has been created.");
            } else {
                error("Rollback failed.");
            }
        } catch {
            error("Rollback failed.");
        } finally {
            setLoading(false);
        }
    };

    // Immediate fetch on mode/viewMode change
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Debounced fetch on filter changes
    useEffect(() => {
        // Skip initial mount if handled by the other effect, but here the deps are different
        // We set loading true immediately for feedback
        setLoading(true);
        const timer = setTimeout(() => fetchData(true), 300);
        return () => clearTimeout(timer);
    }, [fetchData]);

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center gap-2 p-2 border-b border-border/40 bg-background/30 backdrop-blur-md sticky top-0 z-10">
                
                {/* View Mode Toggle */}
                <div className="flex bg-muted/50 p-1 rounded-lg">
                    <button 
                        onClick={() => setViewMode('patches')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'patches' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            Patches
                        </div>
                    </button>
                    <button 
                        onClick={() => setViewMode('changes')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'changes' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <div className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5" />
                            Changes
                        </div>
                    </button>
                </div>

                <div className="h-6 w-px bg-border/50 mx-1" />

                {/* Filters */}
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                    <Input 
                        className="h-9 pl-8 text-xs bg-background/50" 
                        placeholder="Search entities (e.g. 'Fireball')..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-1">
                    <Input 
                        type="date" 
                        className="h-9 w-32 text-xs bg-background/50" 
                        value={startDate} 
                        onChange={e => setStartDate(e.target.value)} 
                        title="Start Date"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input 
                        type="date" 
                        className="h-9 w-32 text-xs bg-background/50" 
                        value={endDate} 
                        onChange={e => setEndDate(e.target.value)} 
                        title="End Date"
                    />
                </div>

                <Select value={tagFilter} onValueChange={setTagFilter}>
                    <SelectTrigger className="w-[140px] h-9 text-xs bg-background/50">
                        <div className="flex items-center gap-2">
                            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                            <SelectValue placeholder="Filter Tag" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Tags</SelectItem>
                        <SelectItem value="Balance">Balance</SelectItem>
                        <SelectItem value="Bugfix">Bugfix</SelectItem>
                        <SelectItem value="Rework">Rework</SelectItem>
                        <SelectItem value="Content">Content</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {loading && (
                    <div className="space-y-4 max-w-3xl mx-auto p-1">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="border border-border/50 bg-card/30 rounded-xl overflow-hidden p-3 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-5 w-16 rounded" />
                                        <Skeleton className="h-5 w-48 rounded" />
                                    </div>
                                    <Skeleton className="h-4 w-24 rounded" />
                                </div>
                                <div className="space-y-2 pl-2 border-l-2 border-border/30">
                                    <Skeleton className="h-4 w-3/4 rounded" />
                                    <Skeleton className="h-4 w-1/2 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && data.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        {searchTerm || tagFilter !== 'all' || startDate || endDate ? (
                             <>
                                <Search className="w-10 h-10 opacity-20 mb-2" />
                                <p className="text-sm">No records found matching your query.</p>
                                <Button 
                                    variant="link" 
                                    onClick={() => {
                                        setSearchTerm("");
                                        setTagFilter("all");
                                        setStartDate("");
                                        setEndDate("");
                                    }}
                                    className="text-xs mt-1"
                                >
                                    Clear all filters
                                </Button>
                             </>
                        ) : (
                             <>
                                <Layers className="w-10 h-10 opacity-20 mb-2" />
                                <p className="text-sm">No patches published yet.</p>
                                <p className="text-xs opacity-60 mt-1">Changes you commit will appear here.</p>
                             </>
                        )}
                    </div>
                )}

                {!loading && viewMode === 'patches' && (
                     <div className="space-y-4 max-w-3xl mx-auto">
                        {(data as Patch[]).map(patch => (
                            <div key={patch.id} className="group relative border border-border/50 bg-card/30 rounded-xl overflow-hidden hover:border-border transition-colors">
                                <div className="p-3 bg-muted/20 border-b border-border/30 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">{patch.version}</span>
                                        <span className="text-sm font-semibold">{patch.title}</span>
                                        <div className="flex gap-1">
                                            {patch.tags?.map(t => (
                                                <span key={t} className="text-mini px-1.5 py-0.5 bg-background border rounded-full text-muted-foreground">#{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">{patch.date}</span>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRollback(patch.id);
                                            }} 
                                            title="Rollback Patch"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="p-3 bg-card/50">
                                    <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                                        <Layers className="w-3 h-3" />
                                        {patch.changes.length} changes
                                    </div>
                                    {/* Preview top 3 changes */}
                                    <div className="space-y-2 pl-2 border-l-2 border-border/30">
                                        {patch.changes.slice(0, 3).map((change, i) => (
                                            <div key={i} className="text-xs flex items-center gap-2 text-foreground/80">
                                                <span className={`w-1.5 h-1.5 rounded-full ${change.new === undefined ? 'bg-red-500' : change.old === undefined ? 'bg-green-500' : 'bg-blue-500'}`} />
                                                <span className="font-medium">{change.name}</span>
                                                <span className="text-muted-foreground">.{change.field}</span>
                                            </div>
                                        ))}
                                        {patch.changes.length > 3 && (
                                            <div className="text-mini text-muted-foreground italic pl-3">+ {patch.changes.length - 3} more</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                     </div>
                )}

                {!loading && viewMode === 'changes' && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 pb-10">
                        {(data as FlatChange[]).map((change, idx) => (
                            <div key={idx} className="relative">
                                <div className="absolute -top-2 right-2 z-10">
                                    <span className="text-mini font-mono bg-background border px-1.5 rounded text-muted-foreground shadow-sm">
                                        v{change.patch_version}
                                    </span>
                                </div>
                                <DiffCard change={change} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <AlertDialog open={!!rollbackCandidate} onOpenChange={(open) => !open && setRollbackCandidate(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Rollback Patch?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to rollback this patch? This will create a new patch that inverts all changes.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRollback} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Rollback
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
