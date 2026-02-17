import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAssets } from "@/hooks/useAssets";
import { assetService } from "@/services/AssetService";
import { useToast } from "@/components/ui/toast-context";
import { Search, UploadCloud } from "lucide-react";

interface AssetPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (filename: string) => void;
}

export function AssetPicker({ open, onOpenChange, onSelect }: AssetPickerProps) {
  const { assets, isLoading, refresh } = useAssets();
  const [search, setSearch] = useState("");
  const { success, error } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredAssets = assets.filter((asset) =>
    asset.toLowerCase().includes(search.toLowerCase())
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { filename } = await assetService.upload(file, file.name);
      success(`Uploaded ${filename}`);
      refresh();
    } catch {
      error("Failed to upload asset");
    }

    e.target.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Asset Library</DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex gap-4 py-4 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-muted/20 rounded-md p-4 border">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            
            {/* Upload Tile */}
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-4 cursor-pointer transition-all focus-ring border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50"
            >
                <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-xs text-muted-foreground font-medium text-center">
                Upload New
                </span>
            </button>

            {/* Assets */}
            {isLoading ? (
                 <div className="contents">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="aspect-square rounded-lg border bg-muted/10 animate-pulse" />
                    ))}
                 </div>
            ) : filteredAssets.map((asset) => (
                <button
                    key={asset}
                    onClick={() => {
                        onSelect(asset);
                        onOpenChange(false);
                    }}
                    className="group relative aspect-square rounded-lg border bg-background overflow-hidden hover:ring-2 hover:ring-primary focus-ring transition-all"
                >
                    <img
                        src={`/api/assets/${asset}`}
                        alt={asset}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        loading="lazy"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[10px] text-white truncate text-center font-medium">
                        {asset}
                        </p>
                    </div>
                </button>
            ))}
            
            {!isLoading && filteredAssets.length === 0 && (
                 <div className="col-span-full py-10 text-center text-muted-foreground">No matching assets found.</div>
            )}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
