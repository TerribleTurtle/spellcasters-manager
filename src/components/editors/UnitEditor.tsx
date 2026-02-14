import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
} from "@/components/ui/form"

import { UnitHeaderPanel } from "./panels/UnitHeaderPanel";
import { UnitMetaPanel } from "./panels/UnitMetaPanel";
import { UnitStatsPanel } from "./panels/UnitStatsPanel";
import { AppMode, Unit } from "@/types";
import { UnitSchema } from "@/domain/schemas";
import { unitService } from "@/services/UnitService";
import { useToast } from "@/components/ui/toast-context";

type UnitFormValues = z.infer<typeof UnitSchema>

interface UnitEditorProps {
  initialData?: Unit;
  filename: string;
  mode: AppMode;
  onSave?: () => void;
}

export function UnitEditor({ initialData, filename, mode, onSave }: UnitEditorProps) {
  const { success, error } = useToast();

  const form = useForm<any>({
    resolver: zodResolver(UnitSchema),
    defaultValues: {
      id: "",
      name: "",
      icon: "",
      type: "Unit",
      tier: 1,
      description: "",
      health: 100,
      damage: 10,
      range: 1,
      movement: 3,
      cost: 1,
    },
  })

  // Load initial data
  useEffect(() => {
    if (initialData) {
      const data = { ...initialData } as UnitFormValues;
      
      // Auto-infer icon if missing
      if (!data.icon) {
         data.icon = filename.replace('.json', '.png');
      }

      // Ensure the data matches the form expectations
      form.reset(data);
    }
  }, [initialData, form, filename])

  async function onSubmit(data: UnitFormValues) {
    try {
      // Cast data to Unit because UnitFormValues (Zod) and Unit (API) might be slightly loose here
      // Ideally Zod schema matches exactly.
      await unitService.save(filename, data, mode);
      
      if (onSave) onSave()
      success("Unit Saved Successfully!")
    } catch (err) {
      console.error(err)
      error("Error saving unit")
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto pb-20">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Action Bar */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold tracking-tight">{filename.replace('.json', '')}</h2>
                <div className="flex gap-2">
                   <Button type="button" variant="ghost" onClick={() => form.reset()}>Reset</Button>
                   <Button type="submit">Save Changes</Button>
                </div>
            </div>

            <UnitHeaderPanel 
               control={form.control} 
               mode={mode} 
               unitName={form.watch("name")}
               onIconUpload={(filename) => form.setValue("icon", filename)}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                     <UnitStatsPanel control={form.control} />
                </div>
                <div>
                     <UnitMetaPanel control={form.control} />
                </div>
            </div>
            
          </form>
        </Form>
    </div>
  )
}
