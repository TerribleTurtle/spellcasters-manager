import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { JsonDiff } from "@/components/ui/JsonDiff";
import { Save, GitBranchPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export type SaveType = 'silent' | 'queue';

interface SavePreviewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  oldData: unknown;
  newData: unknown;
  saveType: SaveType;
  isNew?: boolean;
}

export function SavePreviewDialog({ 
  isOpen, 
  onOpenChange, 
  onConfirm, 
  onCancel, 
  oldData, 
  newData, 
  saveType, 
  isNew 
}: SavePreviewDialogProps) {
  
  const getActionLabel = () => {
      switch(saveType) {
          case 'silent': return isNew ? "Create File" : "Save File";
          case 'queue': return "Add to Queue";
      }
  };

  const getIcon = () => {
      switch(saveType) {
          case 'silent': return <Save className="w-4 h-4 mr-2" />;
          case 'queue': return <GitBranchPlus className="w-4 h-4 mr-2" />;
      }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <AlertDialogHeader>
          <AlertDialogTitle>Review Changes</AlertDialogTitle>
          <AlertDialogDescription>
            Please review the changes before saving.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="flex-1 overflow-y-auto border rounded-md p-4 bg-muted/20 min-h-[200px]">
            <JsonDiff oldData={oldData} newData={newData} className="text-sm" />
        </div>

        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <Button onClick={onConfirm} className="gap-1 min-w-[100px]">
              {getIcon()}
              {getActionLabel()}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
