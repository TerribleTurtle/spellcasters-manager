import { useCallback, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { ImagePlus, RefreshCw, UploadCloud } from "lucide-react";

import { assetService } from "@/services/AssetService";
import { useToast } from "@/components/ui/toast-context";
import { AssetPicker } from './dialogs/AssetPicker';
import { cn } from "@/lib/utils";

interface VisualAssetHelpersProps {
  unitName: string;
  currentIcon?: string;
  onUpload: (filename: string) => void;
  compact?: boolean;
}

export function VisualAssetHelpers({ currentIcon, onUpload, unitName, compact }: VisualAssetHelpersProps) {
  const { success, error } = useToast();
  const [pickerOpen, setPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop();
    const targetName = `${unitName.toLowerCase().replace(/\s+/g, '_')}.${ext}`;

    assetService.upload(file, targetName)
    .then(data => {
      if (data.success) {
        onUpload(data.filename);
        success(`Uploaded: ${data.filename}`);
      }
    })
    .catch(() => {

        error("Upload failed");
      });

    // Reset so re-selecting the same file triggers onChange
    e.target.value = '';
  }, [unitName, onUpload, success, error]);

  return (
    <div className={cn("space-y-4", compact && "space-y-0 h-full")}>
        {!compact && (
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium leading-none">Unit Icon</h3>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                        <UploadCloud className="w-4 h-4 mr-2" />
                        Upload
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
                        <ImagePlus className="w-4 h-4 mr-2" />
                        Browse Library
                    </Button>
                </div>
            </div>
        )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
      
      {/* Preview Card */}
      <div 
        className={cn(
            "relative group overflow-hidden transition-all duration-200 cursor-pointer",
            compact 
                ? "w-full h-full rounded-md border bg-muted/30 hover:border-primary/50" 
                : "rounded-xl border bg-muted/30 hover:border-primary/50"
        )}
        onClick={() => setPickerOpen(true)}
        title="Click to change icon"
      >
        {compact ? (
            // Compact Mode: Just the image
            <div className="w-full h-full flex items-center justify-center bg-background">
                 {currentIcon ? (
                     <img 
                        src={`/api/assets/${currentIcon}`} 
                        alt="Icon" 
                        className="w-full h-full object-cover" 
                     />
                 ) : (
                     <UploadCloud className="w-6 h-6 text-muted-foreground/30" />
                 )}
                 
                 {/* Hover Overlay */}
                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 text-white" />
                 </div>
            </div>
        ) : (
            // Full Mode
            <div className="flex p-4 gap-4 items-start">
                 {/* Icon Preview */}
                 <div className="shrink-0 w-24 h-24 bg-background rounded-lg border shadow-sm overflow-hidden flex items-center justify-center">
                     {currentIcon ? (
                         <img 
                            src={`/api/assets/${currentIcon}`} 
                            alt="Icon" 
                            className="w-full h-full object-cover" 
                         />
                     ) : (
                         <UploadCloud className="w-8 h-8 text-muted-foreground/30" />
                     )}
                 </div>
    
                 {/* Meta / Actions */}
                 <div className="flex-1 space-y-2 min-w-0">
                      <div className="space-y-1">
                          <p className="text-sm font-medium truncate">
                            {currentIcon || "No Asset Selected"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Click to browse library, or use Upload above.
                          </p>
                      </div>
                      
                      {currentIcon && (
                          <div className="flex gap-2">
                              <Button 
                                variant="secondary" 
                                size="xs" 
                                className="h-7 text-xs"
                                onClick={(e) => { e.stopPropagation(); setPickerOpen(true); }}
                              >
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Change
                              </Button>
                          </div>
                      )}
                 </div>
            </div>
        )}
      </div>

      <AssetPicker 
         open={pickerOpen} 
         onOpenChange={setPickerOpen}
         onSelect={(filename) => onUpload(filename)}
      />

    </div>
  )
}
