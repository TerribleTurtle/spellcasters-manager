import { Control } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AppMode } from "@/types";
import { VisualAssetHelpers } from "../VisualAssetHelpers";



export function UnitHeaderPanel({ control, mode, onIconUpload, unitName }: { control: Control<any>, mode: AppMode, onIconUpload: (f:string)=>void, unitName: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 p-6 border border-border/50 rounded-xl bg-card/50 backdrop-blur-sm shadow-sm relative overflow-hidden group">
       {/* Background Decoration */}
       <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 transition-opacity opacity-50 group-hover:opacity-100" />

       {/* Left: Icon & visual */}
       <div className="flex flex-col gap-4">
          <FormField
            control={control}
            name="icon"
            render={({ field }) => (
               <VisualAssetHelpers 
                  unitName={unitName}
                  currentIcon={field.value}
                  mode={mode}
                  onUpload={onIconUpload}
               />
            )}
          />
       </div>

       {/* Right: Info */}
       <div className="space-y-6">
          <FormField
            control={control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormControl>
                  <Input 
                    placeholder="Unit Name" 
                    {...field} 
                    className="text-4xl font-extrabold tracking-tight border-none px-0 h-auto bg-transparent shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/30" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
              control={control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lore & Description</FormLabel>
                  <FormControl>
                    <Textarea 
                        placeholder="Describe the unit's role and background..." 
                        className="min-h-[120px] resize-none bg-background/50 border-border/50 focus:border-primary/50 transition-colors" 
                        {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
       </div>
    </div>
  );
}
