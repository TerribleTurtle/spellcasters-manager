import { Control } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";




export function UnitMetaPanel({ control }: { control: Control<any> }) {
  return (
    <div className="space-y-4 p-6 border border-border/50 rounded-xl bg-card/30 text-card-foreground shadow-sm h-full backdrop-blur-sm">
      <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
        <span className="w-1 h-4 bg-primary rounded-full"/> 
        Classification
      </h3>
      
      <div className="grid grid-cols-1 gap-6">
         <FormField
          control={control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unit Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-background/50 border-border/50">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Unit">Unit</SelectItem>
                  <SelectItem value="Titan">Titan</SelectItem>
                  <SelectItem value="Structure">Structure</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

       <div className="grid grid-cols-2 gap-4 pt-2">
          <FormField
            control={control}
            name="tier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tier</FormLabel>
                <FormControl>
                  <Input type="number" {...field} className="bg-background/50 border-border/50" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={control}
            name="cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost</FormLabel>
                <FormControl>
                  <Input type="number" {...field} className="bg-background/50 border-border/50" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
       </div>
    </div>
  );
}
