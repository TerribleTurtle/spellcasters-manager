import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { RotateCcw, AlertTriangle, Loader2 } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/components/ui/toast-context"
import { dataService } from "@/services/DataService"

interface ResetDataDialogProps {
  onResetComplete?: () => void;
}

export function ResetDataDialog({ onResetComplete }: ResetDataDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();

  const handleReset = async () => {
    setIsLoading(true);
    try {
      const result = await dataService.resetDevData();
      if (result.success) {
        success("Environment Reset");
        setOpen(false);
        setStep(1); // Reset step
        if (onResetComplete) onResetComplete();
        window.location.reload();
      } else {
        error("Reset Failed");
      }
    } catch {
      error("Failed to reset data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
      setOpen(isOpen);
      if (!isOpen) setStep(1); // Reset on close
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-950/30">
           <RotateCcw className="mr-2 h-4 w-4" />
           Reset Dev Data
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-red-500/20 bg-card/95 backdrop-blur-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="h-5 w-5" />
            {step === 1 ? "Reset Development Data?" : "Are you ABSOLUTELY sure?"}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3" asChild>
            <div>
              {step === 1 ? (
                  <>
                    <div className="text-sm text-muted-foreground">
                        This action will <strong>permanently delete</strong> all local data in your input/mock environment and replace it with fresh data from the Live source.
                    </div>
                    <div className="font-medium text-foreground">
                        Any unsaved changes or local experiments will be lost.
                    </div>
                  </>
              ) : (
                  <>
                    <div className="text-sm text-red-400 font-bold bg-red-950/30 p-2 rounded-md border border-red-900/50">
                        Warning: This action cannot be undone.
                    </div>
                    <div className="text-sm text-muted-foreground">
                        You are about to wipe your entire development environment data. 
                        Please confirm you understand that all temporary work will be destroyed.
                    </div>
                  </>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} onClick={() => setStep(1)}>Cancel</AlertDialogCancel>
          {step === 1 ? (
              <Button 
                variant="destructive"
                onClick={(e) => {
                    e.preventDefault();
                    setStep(2);
                }}
              >
                Yes, Reset Data
              </Button>
          ) : (
              <AlertDialogAction 
                onClick={(e) => {
                e.preventDefault();
                handleReset();
                }}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700 text-white border-none font-bold"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting...
                    </>
                ) : "I UNDERSTAND - WIPE EVERYTHING"}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
