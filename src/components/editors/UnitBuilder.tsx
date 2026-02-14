import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import {
  Form,
} from "@/components/ui/form"
import { useToast } from "@/components/ui/toast-context"

import { UnitHeaderPanel } from "./panels/UnitHeaderPanel";
import { UnitMetaPanel } from "./panels/UnitMetaPanel";
import { UnitStatsPanel } from "./panels/UnitStatsPanel";
import { AppMode } from "@/types";
import { UnitSchema } from "@/domain/schemas";
import { z } from "zod";

import { unitService } from "@/services/UnitService";

type UnitFormValues = z.infer<typeof UnitSchema>

interface UnitBuilderProps {
  mode: AppMode;
  onUnitCreated?: (filename: string) => void;
}

export function UnitBuilder({ mode, onUnitCreated }: UnitBuilderProps) {
    const { success, error } = useToast();

    // 1. Generate UUID for new unit
    const newId = crypto.randomUUID();

    // 2. Setup Form with Defaults
    const form = useForm<UnitFormValues>({
        resolver: zodResolver(UnitSchema) as any,
        defaultValues: {
            id: newId,
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
            tags: [],
        },
    })
    
    // Watch name to preview filename
    const watchedName = form.watch("name");
    const generatedFilename = watchedName 
        ? watchedName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') + ".json" 
        : "unit_name.json";

    // 3. Handle Submit
    async function onSubmit(data: UnitFormValues) {
        try {
            // Re-generate filename to be safe
            const filename = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') + ".json";
            
            await unitService.save(filename, data, mode);       
            success(`Created: ${filename}`);
            
            if(onUnitCreated) onUnitCreated(filename);
        } catch (err) {
            console.error(err);
            error("Failed to create unit");
        }
    }

    return (
        <div className="w-full max-w-5xl mx-auto pb-20">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
                    
                    {/* Action Bar */}
                    <div className="flex items-center justify-between mb-4">
                        <div>
                             <h2 className="text-2xl font-bold tracking-tight">Create New Unit</h2>
                             <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <span>Will be saved as:</span>
                                <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono text-xs">
                                    {generatedFilename}
                                </code>
                             </div>
                        </div>
                        <div className="flex gap-2">
                            <Button type="button" variant="ghost" onClick={() => form.reset()}>Reset Defaults</Button>
                            <Button type="submit" disabled={!form.formState.isValid}>Create Unit</Button>
                        </div>
                    </div>

                    {/* Editor Panels */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                        <UnitHeaderPanel 
                            control={form.control} 
                            mode={mode} 
                            unitName={form.watch("name") || "New Unit"}
                            onIconUpload={(filename) => form.setValue("icon", filename)}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
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
