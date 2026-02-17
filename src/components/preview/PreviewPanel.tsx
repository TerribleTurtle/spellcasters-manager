import { SitePreview } from "./SitePreview";
import { cn } from "@/lib/utils";
import { AppMode } from "@/types";
import { Hammer } from "lucide-react";

interface PreviewPanelProps {
  isOpen: boolean;
  unitData: any;
  mode: AppMode;
}

export function PreviewPanel({ isOpen, unitData, mode }: PreviewPanelProps) {
  return (
    <div 
        className={cn(
            "border-l border-border bg-background transition-all duration-300 ease-in-out overflow-hidden flex flex-col shadow-xl z-20 shrink-0",
            isOpen ? "w-[360px] opacity-100" : "w-0 opacity-0"
        )}
    >
        {/* Header - Fixed to top of panel */}
        <div className="h-14 border-b border-border flex items-center px-4 bg-muted/20 shrink-0">
            <span className="font-semibold text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Preview
            </span>
            <div className="ml-auto text-xs text-muted-foreground font-mono opacity-70">
                {mode === 'live' ? 'PROD' : 'DEV'} MOCK
            </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
            {unitData ? (
                 <SitePreview data={unitData} mode={mode} />
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
                    <Hammer className="w-12 h-12 mb-4 opacity-20" />
                    <p>Select a unit to preview.</p>
                </div>
            )}
        </div>
    </div>
  );
}
