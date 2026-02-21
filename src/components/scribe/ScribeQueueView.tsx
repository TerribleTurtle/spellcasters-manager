import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Change, PatchType } from "@/types"
import { patchService } from "@/services/PatchService"
import { useToast } from "@/components/ui/toast-context"
import { Sparkles, Plus, Loader2, Trash2 } from "lucide-react"
import { DiffCard } from './DiffCard';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export interface ScribeQueueViewProps {
  changes: Change[];
  onQueueRefresh: () => void;
  onDataReverted?: () => void;
  onOpenInEditor?: (change: Change) => void;
}

export function ScribeQueueView({ changes, onQueueRefresh, onDataReverted, onOpenInEditor }: ScribeQueueViewProps) {
  const [existingVersions, setExistingVersions] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState("");
  const [version, setVersion] = useState("1.0.1");
  const [type, setType] = useState<PatchType>("Patch");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkRemoveOpen, setBulkRemoveOpen] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const { success, error } = useToast();

  useEffect(() => {
    setSelectedIndices(new Set());
  }, [changes]);

  // Fetch unique existing versions for conflict checking
  useEffect(() => {
    patchService.getHistory({ flat: false }).then((patches) => {
        if(Array.isArray(patches)) {
           const versions = new Set(patches.map((p: Record<string, unknown>) => p.version as string));
           setExistingVersions(versions);
           
            if (type === 'Hotfix' && patches.length > 0) {
               const latest = (patches[0] as Record<string, unknown>).version as string; // History is desc
               const parts = latest.split('.');
              const lastNum = parseInt(parts[parts.length - 1]);
              if (!isNaN(lastNum)) {
                 parts[parts.length - 1] = (lastNum + 1).toString();
                 setVersion(parts.join('.'));
              }
           } else if (type !== 'Hotfix') {
               setVersion(""); // Clear for non-hotfix
           }
        }
    }).catch(() => {});
  }, [type]);

  // Sync title with version for Hotfix
  useEffect(() => {
      if (type === 'Hotfix') {
          setTitle(`Hotfix ${version}`);
      }
  }, [type, version]);

  const toggleSelection = (index: number) => {
      const next = new Set(selectedIndices);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      setSelectedIndices(next);
  };

  const toggleSelectAll = () => {
      if (selectedIndices.size === changes.length && changes.length > 0) {
          setSelectedIndices(new Set());
      } else {
          const all = new Set(changes.map((_, i) => i));
          setSelectedIndices(all);
      }
  };

  const handleBulkRemove = async () => {
      if (selectedIndices.size === 0) return;
      setBulkRemoveOpen(true);
  };

  const confirmBulkRemove = async () => {
      setLoading(true);
      try {
          const indices = Array.from(selectedIndices);
          await patchService.bulkRemoveFromQueue(indices);
          success(`Removed ${indices.length} items`);
          onQueueRefresh();
          onDataReverted?.();
      } catch {
          error("Failed to remove items");
      } finally {
          setLoading(false);
          setBulkRemoveOpen(false);
      }
  };

  const handlePublish = async () => {
    setLoading(true);
    try {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      const data = await patchService.commit({ 
          title, 
          version, 
          type, 
          tags: tagList,
          changes
      });
      if (data.success) {
        success("Patch Published Successfully!");
        setDialogOpen(false);
        const newVersions = new Set(existingVersions);
        newVersions.add(version);
        setExistingVersions(newVersions);
        onQueueRefresh();
      } else {
        error("Error publishing patch");
      }
    } catch {
      error("Failed to publish");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
          {changes.length > 0 && (
              <div className="flex items-center justify-between pb-2 border-b border-border/30">
                  <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 cursor-pointer accent-primary"
                        checked={selectedIndices.size === changes.length && changes.length > 0}
                        onChange={toggleSelectAll}
                      />
                      <span className="text-xs text-muted-foreground font-medium">
                          {selectedIndices.size === 0 ? "Select All" : `${selectedIndices.size} selected`}
                      </span>
                  </div>
              </div>
          )}

          {changes.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-40 text-muted-foreground pt-10">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                        <Sparkles className="w-5 h-5 opacity-40" />
                    </div>
                    <p className="text-sm font-medium">No pending changes</p>
                    <p className="text-xs opacity-60 text-center max-w-[200px] mt-1">
                        Edits added to the queue will appear here.
                    </p>
                 </div>
             ) : (
                 changes.map((change, idx) => (
                    <div key={idx} className="w-full">
                        <DiffCard 
                           change={change} 
                           index={idx}
                           onUpdate={() => { onQueueRefresh(); onDataReverted?.(); }} 
                           onOpenInEditor={onOpenInEditor} 
                           isSelected={selectedIndices.has(idx)}
                           onSelect={() => toggleSelection(idx)}
                        />
                    </div>
                 ))
             )}
      </div>

      <div className="p-4 border-t border-border/40 bg-background/50 backdrop-blur-sm shrink-0 sticky bottom-0 z-10 w-full mt-auto">
         {selectedIndices.size > 0 ? (
             <div className="flex items-center gap-2">
                 <Button variant="outline" className="flex-1" onClick={() => setSelectedIndices(new Set())}>
                     Cancel
                 </Button>
                 <Button variant="destructive" className="flex-2" onClick={handleBulkRemove} disabled={loading}>
                     <Trash2 className="w-4 h-4 mr-2" />
                     Remove Selected ({selectedIndices.size})
                 </Button>
             </div>
         ) : (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
             <DialogTrigger asChild>
                 <Button className="w-full" disabled={changes.length === 0}>
                     <Plus className="w-4 h-4 mr-2" />
                     Create Patch
                 </Button>
             </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create New Patch</DialogTitle>
                    <DialogDescription>
                        Bundle the {changes.length} pending changes into a new version.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                        <Label className="sm:text-right">Version</Label>
                        <Input 
                            value={version} 
                            onChange={e => setVersion(e.target.value)} 
                            className="sm:col-span-3 font-mono" 
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                        <Label className="sm:text-right">Type</Label>
                        <Select value={type} onValueChange={(val) => setType(val as PatchType)}>
                            <SelectTrigger className="sm:col-span-3">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Patch">Patch (Minor)</SelectItem>
                                <SelectItem value="Hotfix">Hotfix (Critical)</SelectItem>
                                <SelectItem value="Content">Content Update (Major)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                        <Label className="sm:text-right">Title</Label>
                        <Input 
                            value={title} 
                            onChange={e => setTitle(e.target.value)} 
                            placeholder={type === 'Hotfix' ? 'e.g. Fix for crash in Level 5' : 'e.g. Winter Balance Update'}
                            className="sm:col-span-3" 
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                        <Label className="sm:text-right">Tags</Label>
                        <Input 
                            value={tags} 
                            placeholder="Balance, Rework, etc."
                            onChange={e => setTags(e.target.value)} 
                            className="sm:col-span-3" 
                        />
                    </div>
                </div>

                {existingVersions.has(version) && (
                    <div className="bg-yellow-500/10 border border-yellow-500/50 rounded p-3 mb-4 flex items-start gap-2">
                         <span className="text-yellow-500 text-lg">⚠️</span>
                         <div className="text-xs text-yellow-500">
                             <strong>Version Conflict:</strong> A patch with version <code>{version}</code> already exists.
                             <br />
                             Proceeding will <strong>merge</strong> these changes into the existing patch.
                         </div>
                    </div>
                )}

                {/* Warning for empty version on Patch/Content */}
                {type !== 'Hotfix' && !version.trim() && (
                    <div className="bg-blue-500/10 border border-blue-500/50 rounded p-3 mb-4 flex items-start gap-2">
                         <span className="text-blue-500 text-lg">ℹ️</span>
                         <div className="text-xs text-blue-500">
                             <strong>Manual Version Required:</strong> For {type} updates, please enter the version number manually (e.g. matching the live game release).
                         </div>
                    </div>
                )}

                <DialogFooter>
                    <Button onClick={handlePublish} disabled={loading || !version.trim() || !title.trim()}>
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Publishing...
                            </>
                        ) : (
                            existingVersions.has(version) ? 'Merge & Update' : 'Publish Patch'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
         </Dialog>
         )}
      </div>

      <AlertDialog open={bulkRemoveOpen} onOpenChange={setBulkRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Selected Items?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to remove {selectedIndices.size} items from the queue. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkRemove} disabled={loading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Remove Items
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
