import { Control } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Unit } from "@/types";
import { Heart, Sword, Crosshair, Footprints } from "lucide-react";
import { cn } from "@/lib/utils";



export function UnitStatsPanel({ control }: { control: Control<any> }) {
  
  const StatCard = ({ icon: Icon, label, colorClass, name }: { icon: any, label: string, colorClass: string, name: keyof Unit }) => (
    <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem className="relative overflow-hidden border border-border/50 rounded-xl bg-card/30 p-4 transition-all hover:border-border hover:bg-card/50 group">
             <div className={cn("absolute top-0 right-0 p-3 opacity-10 transition-transform group-hover:scale-110 group-hover:opacity-20", colorClass)}>
                 <Icon className="w-12 h-12" />
             </div>
             
            <FormLabel className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider mb-2">
                <Icon className={cn("w-4 h-4", colorClass)} /> {label}
            </FormLabel>
            <FormControl>
              <Input 
                type="number" 
                {...field} 
                value={field.value as string | number || ''}
                className="font-mono text-3xl font-bold bg-transparent border-none shadow-none p-0 h-auto focus-visible:ring-0 relative z-10" 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
  )

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
       <StatCard icon={Heart} label="Health" colorClass="text-red-500" name="health" />
       <StatCard icon={Sword} label="Damage" colorClass="text-orange-500" name="damage" />
       <StatCard icon={Crosshair} label="Range" colorClass="text-blue-500" name="range" />
       <StatCard icon={Footprints} label="Speed" colorClass="text-green-500" name="movement" />
    </div>
  );
}
