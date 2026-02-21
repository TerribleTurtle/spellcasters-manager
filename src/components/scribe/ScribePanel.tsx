import { useEffect, useState, useCallback } from 'react';
import { Button } from "@/components/ui/button"
import { Change } from "@/types"
import { patchService } from "@/services/PatchService"
import { Scroll, RefreshCcw } from "lucide-react"
import { HistoryGrid } from './HistoryGrid';
import { TabBar } from "@/components/ui/TabBar";
import { ScribeQueueView } from './ScribeQueueView';

interface ScribePanelProps {
  refreshTrigger?: number;
  onOpenInEditor?: (change: Change) => void;
  onQueueChange?: () => void;
  onDataReverted?: () => void;
}

export function ScribePanel({ refreshTrigger = 0, onOpenInEditor, onQueueChange, onDataReverted }: ScribePanelProps) {
  const [changes, setChanges] = useState<Change[]>([]);
  const [activeTab, setActiveTab] = useState<'draft' | 'history'>('draft');

  const fetchQueue = useCallback(() => {
    patchService.getQueue()
      .then(newChanges => {
         setChanges(newChanges);
         onQueueChange?.();
      })
      .catch(() => {})
  }, [onQueueChange]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue, refreshTrigger, activeTab]);

  return (
    <div className="flex flex-col h-full w-full bg-muted/5">
      {/* 1. Header */}
      <div className="h-14 border-b border-border/40 flex items-center justify-between px-4 bg-background/50 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2">
             <Scroll className="w-4 h-4 text-muted-foreground" />
             <span className="font-semibold text-sm">Changes</span>
             <span className="text-mini bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-mono font-bold">
                {changes.length}
             </span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={fetchQueue} title="Refresh Feed">
             <RefreshCcw className="w-3.5 h-3.5" />
          </Button>
      </div>

      {/* 2. Content Area */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        <div className="shrink-0 border-b border-border/40 bg-background/50 backdrop-blur-sm z-10 sticky top-0">
            <TabBar 
                variant="sticky"
                items={[
                    { value: 'draft', label: 'Queue', count: changes.length },
                    { value: 'history', label: 'History' }
                ]}
                activeValue={activeTab}
                onValueChange={(v) => setActiveTab(v as 'draft' | 'history')}
            />
        </div>

        <div className="flex-1 flex flex-col min-h-0">
            {activeTab === 'draft' ? (
                <ScribeQueueView 
                   changes={changes}
                   onQueueRefresh={fetchQueue}
                   onDataReverted={onDataReverted}
                   onOpenInEditor={onOpenInEditor}
                />
            ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                    <HistoryGrid />
                </div>
            )}
        </div>
      </div>
    </div>
  )
}
