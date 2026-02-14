import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Change, PatchType, AppMode } from "@/types"
import { patchService } from "@/services/PatchService"
import { useToast } from "@/components/ui/toast-context"
import { Scroll, RefreshCcw, Send, Sparkles } from "lucide-react"
import { DiffCard } from './DiffCard'

interface ScribePanelProps {
  mode: AppMode;
}

export function ScribePanel({ mode }: ScribePanelProps) {
  const [changes, setChanges] = useState<Change[]>([]);
  const [title, setTitle] = useState("Balance Update");
  const [version, setVersion] = useState("1.0.1");
  const [type, setType] = useState<PatchType>("Patch");
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const fetchDraft = () => {
    patchService.getDraft(mode)
      .then(setChanges)
      .catch(console.error);
  }

  useEffect(() => {
    fetchDraft();
  }, [mode]); // Refresh when mode changes

  const handlePublish = async () => {
    setLoading(true);
    try {
      const data = await patchService.commit(mode, { title, version, type });
      if (data.success) {
        success("Patch Published Successfully!");
        setChanges([]); // Clear draft
        // Reset defaults
        setTitle("Balance Update");
        setVersion(v => {
            const parts = v.split('.');
            if(parts.length === 3) {
                return `${parts[0]}.${parts[1]}.${parseInt(parts[2]) + 1}`;
            }
            return v;
        });
      } else {
        error("Error publishing patch");
      }
    } catch (err) {
      console.error(err);
      error("Failed to publish");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8 h-full max-w-6xl mx-auto pb-10">
      
      {/* Left Column: Controls */}
      <div className="space-y-6">
          <Card className="border-border/50 bg-card/30 backdrop-blur-sm shadow-xl sticky top-20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                 <div className="p-2 bg-primary/20 rounded-lg text-primary">
                    <Sparkles className="w-5 h-5" />
                 </div>
                 New Patch
              </CardTitle>
              <CardDescription>Configure version and metadata.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Version Number</Label>
                  <Input 
                    value={version} 
                    onChange={e => setVersion(e.target.value)} 
                    className="font-mono bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                   <Label>Update Type</Label>
                   <Select value={type} onValueChange={(val) => setType(val as PatchType)}>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Patch">Patch (Minor)</SelectItem>
                        <SelectItem value="Hotfix">Hotfix (Critical)</SelectItem>
                        <SelectItem value="Content">Content Update (Major)</SelectItem>
                      </SelectContent>
                   </Select>
                </div>

                <div className="space-y-2">
                  <Label>Patch Title</Label>
                  <Input 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    className="bg-background/50"
                  />
                </div>
            </CardContent>
            <CardFooter className="flex-col gap-3 pt-2">
                 <Button 
                    className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-lg shadow-primary/20" 
                    size="lg"
                    onClick={handlePublish} 
                    disabled={loading || changes.length === 0}
                 >
                    {loading ? (
                        <>Publishing...</>
                    ) : (
                        <>
                            <Send className="w-4 h-4 mr-2" /> Publish Patch
                        </>
                    )}
                 </Button>
                 {changes.length === 0 && (
                     <p className="text-xs text-muted-foreground text-center">No changes to publish.</p>
                 )}
            </CardFooter>
          </Card>
      </div>

      {/* Right Column: Feed */}
      <div className="space-y-6">
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <Scroll className="w-5 h-5 text-muted-foreground" />
                 <h2 className="text-lg font-semibold tracking-tight">Change Feed</h2>
                 <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-mono font-bold">
                    {changes.length}
                 </span>
              </div>
              <Button variant="ghost" size="sm" onClick={fetchDraft}>
                 <RefreshCcw className="w-3 h-3 mr-2" /> Refresh
              </Button>
          </div>

          <div className="grid gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {changes.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-20 border-[3px] border-dashed border-border/30 rounded-2xl bg-muted/5 text-muted-foreground">
                    <Scroll className="w-12 h-12 mb-4 opacity-20" />
                    <p className="font-medium">The spellbook is unchanged.</p>
                    <p className="text-sm opacity-60">Edit units in the Forge to see changes here.</p>
                 </div>
             ) : (
                 changes.map((change, idx) => (
                    <DiffCard key={idx} change={change} />
                 ))
             )}
          </div>
      </div>

    </div>
  )
}
