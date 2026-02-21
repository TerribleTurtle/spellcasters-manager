import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Calendar, Layers } from "lucide-react";

interface HistoryToolbarProps {
    viewMode: 'patches' | 'changes';
    setViewMode: (mode: 'patches' | 'changes') => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    startDate: string;
    setStartDate: (date: string) => void;
    endDate: string;
    setEndDate: (date: string) => void;
    tagFilter: string;
    setTagFilter: (tag: string) => void;
}

export function HistoryToolbar({
    viewMode, setViewMode,
    searchTerm, setSearchTerm,
    startDate, setStartDate,
    endDate, setEndDate,
    tagFilter, setTagFilter
}: HistoryToolbarProps) {
    return (
        <div className="flex flex-wrap items-center gap-2 p-2 border-b border-border/40 bg-background/30 backdrop-blur-md sticky top-0 z-10">
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

            <div className="hidden sm:block h-6 w-px bg-border/50 mx-1" />

            {/* Filters */}
            <div className="relative flex-1 min-w-[140px] max-w-xs">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                <Input 
                    className="h-9 pl-8 text-xs bg-background/50" 
                    placeholder="Search entities..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="hidden sm:flex items-center gap-1">
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
                <SelectTrigger className="w-[120px] sm:w-[140px] h-9 text-xs bg-background/50">
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
    );
}
