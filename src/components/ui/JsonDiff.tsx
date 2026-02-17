import { diff, Diff } from 'deep-diff';
import { cn } from "@/lib/utils";
import { stripInternalFields } from "@/domain/utils";
import { ArrowRight, Plus, Minus, Edit2 } from "lucide-react";

interface JsonDiffProps {
  oldData: any;
  newData: any;
  className?: string;
}

export function JsonDiff({ oldData, newData, className }: JsonDiffProps) {
  // If primitives/simple types, just show direct comparison
  if (typeof oldData !== 'object' || oldData === null || typeof newData !== 'object' || newData === null) {
      return (
          <div className={cn("flex items-center gap-2 text-xs font-mono", className)}>
             <span className="line-through text-red-400 decoration-red-400/50 opacity-70">{String(oldData)}</span>
             <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
             <span className="text-green-500 font-bold">{String(newData)}</span>
          </div>
      );
  }

  // Filter out internal props (starting with _)
  const cleanOld = stripInternalFields(oldData);
  const cleanNew = stripInternalFields(newData);

  // Calculate deep diff
  const changes = diff(cleanOld, cleanNew);

  if (!changes || changes.length === 0) {
      return <div className="text-xs text-muted-foreground italic">No changes detected (Deep Equal)</div>;
  }

  // Render list of changes
  return (
      <div className={cn("space-y-1 font-mono text-xs", className)}>
          {changes.map((change, idx) => (
              <div key={idx} className="flex items-start gap-2 bg-muted/30 p-1.5 rounded-sm border border-border/20">
                  <ChangeIcon kind={change.kind} />
                  <div className="flex-1 min-w-0 overflow-x-auto">
                      <span className="text-muted-foreground font-semibold mr-1">
                          {change.path ? change.path.join('.') : 'root'}:
                      </span>
                      <ChangeValue change={change} />
                  </div>
              </div>
          ))}
      </div>
  );
}

function ChangeIcon({ kind }: { kind: string }) {
    switch(kind) {
        case 'N': return <span title="Added"><Plus className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" /></span>;
        case 'D': return <span title="Removed"><Minus className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" /></span>;
        case 'E': return <span title="Modified"><Edit2 className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" /></span>;
        case 'A': return <span title="Array Change"><Edit2 className="w-3.5 h-3.5 text-orange-500 mt-0.5 shrink-0" /></span>;
        default: return <div className="w-3.5 h-3.5" title="Unknown" />;
    }
}



const SYSTEM_FIELDS = [
    'last_modified', 
    '$schema', 
    'changelog', 
    'image_required', 
    'stack_size', 
    'entity_id'
];

type ChangeCategory = 'USER' | 'SCHEMA' | 'SYSTEM';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getChangeCategory(change: Diff<any, any>): ChangeCategory {
    const key = change.path ? change.path[change.path.length - 1] : '';
    
    // 1. System Fields
    if (SYSTEM_FIELDS.includes(String(key))) return 'SYSTEM';

    // 2. Schema Defaults (New fields with default values)
    if (change.kind === 'N') {
        const val = change.rhs;
        if (val === 0) return 'SCHEMA';
        if (val === "") return 'SCHEMA';
        if (val === false) return 'SCHEMA';
        if (val === "Common") return 'SCHEMA';
        if (val === 1 && key === 'stack_size') return 'SCHEMA';
    }

    // 3. User Edits
    return 'USER';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChangeValue({ change }: { change: Diff<any, any> }) {
    const category = getChangeCategory(change);
    const isDimmed = category !== 'USER';

    // N - New, D - Deleted, E - Edited, A - Array
    switch(change.kind) {
        case 'N': // New
            return <ChangeWrapper isDimmed={isDimmed} category={category}><span className="text-green-500">{JSON.stringify(change.rhs)}</span></ChangeWrapper>;
        case 'D': // Deleted
            return <ChangeWrapper isDimmed={isDimmed} category={category}><span className="text-red-500 line-through decoration-red-500/50">{JSON.stringify(change.lhs)}</span></ChangeWrapper>;
        case 'E': // Edited
            return (
                <ChangeWrapper isDimmed={isDimmed} category={category}>
                    <span className="inline-flex items-center gap-1 flex-wrap">
                        <span className="text-red-400 line-through decoration-red-400/50 opacity-80">{JSON.stringify(change.lhs)}</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground/40" />
                        <span className="text-green-500">{JSON.stringify(change.rhs)}</span>
                    </span>
                </ChangeWrapper>
            );
        case 'A': // Array Change
            return (
                <div className="ml-2 pl-2 border-l-2 border-orange-500/20">
                     <div className="flex items-center gap-2 mb-1">
                        <span className="text-orange-500 text-mini uppercase font-bold tracking-wider">Array [{change.index}]</span>
                        <CategoryBadge category={category} />
                     </div>
                    <ChangeValue change={change.item} />
                </div>
            );
        default:
            return <span>Unknown Change</span>;
    }
}

function CategoryBadge({ category }: { category: ChangeCategory }) {
    if (category === 'USER') return <span className="text-micro font-bold bg-primary/20 text-primary px-1 rounded mr-1.5 align-middle">USER</span>;
    if (category === 'SCHEMA') return <span className="text-micro font-mono border border-border/50 text-muted-foreground px-1 rounded mr-1.5 align-middle opacity-70">DEF</span>;
    return <span className="text-micro font-mono bg-muted text-muted-foreground px-1 rounded mr-1.5 align-middle opacity-50">SYS</span>;
}

function ChangeWrapper({ children, isDimmed, category }: { children: React.ReactNode; isDimmed: boolean; category: ChangeCategory }) {
    return (
        <span className={cn("flex-1", isDimmed && "opacity-60 grayscale-[0.5]")}>
            <CategoryBadge category={category} />
            {children}
        </span>
    );
}
