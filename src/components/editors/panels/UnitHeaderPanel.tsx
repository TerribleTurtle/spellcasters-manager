
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { VisualAssetHelpers } from "../VisualAssetHelpers";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

import { useFormContext } from "react-hook-form";

export function UnitHeaderPanel({ onIconUpload, unitName, onDelete, displayIcon }: { onIconUpload: (f:string)=>void, unitName: string, onDelete?: () => void, displayIcon?: string }) {
  const { control } = useFormContext();
  return (
    <div className="flex items-center gap-4 p-4 border border-border/50 rounded-lg bg-card/40 backdrop-blur-sm shadow-sm mb-4">
       
       {/* Icon - Compact */}
       <div className="shrink-0 w-16 h-16">
          <FormField
            control={control}
            name="icon"
            render={({ field }) => (
               <VisualAssetHelpers 
                  unitName={unitName}
                  currentIcon={field.value || displayIcon}
                  onUpload={onIconUpload}
                  compact // Pass a prop if VisualAssetHelpers supports it, or it will just fit the container
               />
            )}
          />
       </div>

       {/* Name Input - Compact */}
       <div className="flex-1 min-w-0">
          <FormField
            control={control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormControl>
                  <Input 
                    placeholder="Entity Name" 
                    {...field} 
                    className="text-2xl font-bold tracking-tight border-none px-0 h-auto bg-transparent shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/30 truncate" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
       </div>

       {/* Delete Action */}
        {onDelete && (
            <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                onClick={onDelete}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors focus-ring rounded-sm shrink-0"
                title="Delete Entity"
            >
                <Trash2 className="w-5 h-5" />
            </Button>
        )}
    </div>
  );
}
