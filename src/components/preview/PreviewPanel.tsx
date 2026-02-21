import { SitePreview } from "./SitePreview";
import { Unit } from "@/domain/schemas";
import { cn } from "@/lib/utils";
import { Hammer, X } from "lucide-react";
import { Button } from "@/components/ui/button";



export function PreviewPanel({ isOpen, unitData, onClose }: { isOpen: boolean, unitData: unknown, onClose?: () => void }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Mobile: full-screen overlay */}
      <div className="fixed inset-0 z-50 flex flex-col bg-background md:hidden">
        {/* Header */}
        <div className="h-14 border-b border-border flex items-center px-4 bg-muted/20 shrink-0">
            <span className="font-semibold text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Preview
            </span>
            <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-mono opacity-70">PREVIEW</span>
                {onClose && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                )}
            </div>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden relative">
            {unitData ? (
                 <SitePreview data={unitData as Unit} />
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
                    <Hammer className="w-12 h-12 mb-4 opacity-20" />
                    <p>Select a unit to preview.</p>
                </div>
            )}
        </div>
      </div>

      {/* Desktop: side panel */}
      <div 
          className={cn(
              "hidden md:flex border-l border-border bg-background transition-all duration-300 ease-in-out overflow-hidden flex-col shadow-xl z-20 shrink-0",
              "w-[360px] opacity-100"
          )}
      >
          <div className="h-14 border-b border-border flex items-center px-4 bg-muted/20 shrink-0">
              <span className="font-semibold text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Preview
              </span>
              <div className="ml-auto text-xs text-muted-foreground font-mono opacity-70">
                  PREVIEW
              </div>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden relative">
              {unitData ? (
                   <SitePreview data={unitData as Unit} />
              ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
                      <Hammer className="w-12 h-12 mb-4 opacity-20" />
                      <p>Select a unit to preview.</p>
                  </div>
              )}
          </div>
      </div>
    </>
  );
}
