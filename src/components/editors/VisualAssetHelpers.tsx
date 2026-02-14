import { useDropzone } from 'react-dropzone'
import { useCallback } from 'react';

import { AppMode } from "@/types"
import { assetService } from "@/services/AssetService"
import { useToast } from "@/components/ui/toast-context"

interface VisualAssetHelpersProps {
  unitName: string;
  currentIcon?: string;
  mode: AppMode;
  onUpload: (filename: string) => void;
}

export function VisualAssetHelpers({ currentIcon, onUpload, unitName, mode }: VisualAssetHelpersProps) {
  const { success, error } = useToast();
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Auto-rename logic: "fireball_wizard.png"
    const ext = file.name.split('.').pop();
    const targetName = `${unitName.toLowerCase().replace(/\s+/g, '_')}.${ext}`;

    assetService.upload(file, targetName, mode)
    .then(data => {
      if (data.success) {
        onUpload(data.filename);
        success(`Uploaded: ${data.filename}`);
      }
    })
    .catch((err) => {
        console.error(err);
        error("Upload failed");
    });

  }, [unitName, onUpload, mode, success, error]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Unit Icon</h3>
      
      <div className="flex gap-4">
        {/* Preview */}
        <div className="shrink-0 w-24 h-24 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center overflow-hidden relative group">
             {currentIcon ? (
                <>
                <img src={`/api/assets/${mode}/${currentIcon}`} alt="Icon" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-xs text-white font-medium">Change</span>
                </div>
                </>
             ) : (
                <div className="flex flex-col items-center gap-1 text-muted-foreground/50">
                    <span className="text-xs">No Icon</span>
                </div>
             )}
        </div>

        {/* Dropzone */}
        <div 
            {...getRootProps()} 
            className={`flex-1 rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-4 cursor-pointer transition-all duration-200 
                ${isDragActive 
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                    : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50'
                }`}
        >
          <input {...getInputProps()} />
          <div className="text-center space-y-1">
             <p className="text-sm font-medium text-foreground">
                {isDragActive ? "Drop art here!" : "Click or drag art"}
             </p>
             <p className="text-xs text-muted-foreground">
                Supports PNG, JPG, GIF
             </p>
          </div>
        </div>
      </div>
    </div>
  )
}
