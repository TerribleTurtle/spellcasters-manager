import { useState, useCallback, useMemo } from "react";
import { AppView, Change } from "@/types";
import { useToast } from "@/components/ui/toast-context";
import { useNavigationGuard } from "@/hooks/useNavigationGuard";
import { ensureJsonExt } from "@/lib/pathUtils";
import { resolveEntityTarget } from "@/lib/resolveEntityTarget";
import { extractChangeTargetId } from "@/lib/changeUtils";
import { BaseEntity } from "@/types";

interface UseEntitySelectionProps {
    registry: Record<string, BaseEntity[]>;
    currentCategory: string;
    setCurrentCategory: (cat: string) => void;
    setView: (view: AppView) => void;
    fetchData: () => void;
    fetchQueue: () => void;
}

export function useEntitySelection({ 
    registry, 
    currentCategory, 
    setCurrentCategory, 
    setView,
    fetchData,
    fetchQueue
}: UseEntitySelectionProps) {
    const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
    // Manual override for unitData (used during duplication when data isn't in registry)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [unitDataOverride, setUnitDataOverride] = useState<any | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [restoredChange, setRestoredChange] = useState<Change | null>(null);
    
    const { error } = useToast();
    const { handleNavigation, dialogOpen, confirmAction, cancelAction } = useNavigationGuard({ isDirty });

    // Derive unitData from registry lookup or manual override (no useEffect + setState)
    const unitData = useMemo(() => {
        if (unitDataOverride) return unitDataOverride;
        if (!selectedUnit) return null;
        for (const entities of Object.values(registry)) {
            const found = entities.find(e => e._filename === selectedUnit);
            if (found) return found;
        }
        return null;
    }, [selectedUnit, registry, unitDataOverride]);

    const handleSelectUnit = useCallback((filename: string) => {
        handleNavigation(() => {
            setSelectedUnit(filename);
            setUnitDataOverride(null);
            setView('forge');
            setIsDirty(false);
            setIsCreating(false);
            setRestoredChange(null);
        });
    }, [handleNavigation, setView]);

    const handleCreateStart = useCallback(() => {
        handleNavigation(() => {
            setSelectedUnit(null);
            setUnitDataOverride(null);
            setIsCreating(true);
            setIsDirty(false);
            setRestoredChange(null);
        });
    }, [handleNavigation]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleDuplicate = useCallback((data: any) => {
        handleNavigation(() => {
            setSelectedUnit(null);
            const cloned = JSON.parse(JSON.stringify(data));
            // Switch to the entity's actual category (critical when browsing "all")
            const entityCategory = cloned._category || currentCategory;
            if (entityCategory !== currentCategory) {
                setCurrentCategory(entityCategory);
            }
            delete cloned.id;
            delete cloned._filename;
            // Clear identity fields — user must name the new entity
            delete cloned.name;
            delete cloned.entity_id;
            
            setUnitDataOverride(cloned);
            setIsCreating(true);
            setIsDirty(true);
            setRestoredChange(null);
        });
    }, [handleNavigation, currentCategory, setCurrentCategory]);

    const handleCreateCancel = useCallback(() => {
        setIsCreating(false);
        setIsDirty(false);
        setUnitDataOverride(null);
    }, []);

    const handleEntityCreated = useCallback((filename?: string) => {
        setIsCreating(false);
        setIsDirty(false);
        setUnitDataOverride(null);
        fetchData();
        fetchQueue();
        if (filename) {
            setSelectedUnit(filename);
            setView('forge');
        }
    }, [fetchData, fetchQueue, setView]);

    const handleClearSelection = useCallback(() => {
        setSelectedUnit(null);
        setUnitDataOverride(null);
        setIsDirty(false);
        setRestoredChange(null);
    }, []);

    const handleOpenInEditor = useCallback((change: Change) => {
        let rawId = extractChangeTargetId(change);
        
        // Fallback: Name lookup (if ID missing)
        if (!rawId && change.name) {
          for (const entities of Object.values(registry)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const match = entities.find((e: any) => e.name === change.name);
            if (match?._filename) {
              rawId = match._filename;
              break;
            }
          }
        }
        
        if (rawId) {
          const resolution = resolveEntityTarget(rawId, registry);
          
          let targetCategory = currentCategory;
          let filename = ensureJsonExt(rawId);
          
          if (resolution) {
              filename = resolution.filename;
              targetCategory = resolution.category;
          } else if (change.category) {
              targetCategory = change.category;
          }
    
          handleNavigation(() => {
            setView('forge');
            if (targetCategory !== currentCategory) {
                setCurrentCategory(targetCategory);
            }
            setSelectedUnit(filename);
            setUnitDataOverride(null);
            setIsCreating(false);
            setIsDirty(true);
            setRestoredChange(change);
          });
        } else {
            error("Cannot open in editor: change has no target ID.");
        }
    }, [handleNavigation, registry, currentCategory, setView, setCurrentCategory, error]);

    return {
        selectedUnit,
        unitData,
        isDirty,
        isCreating,
        restoredChange,
        handleSelectUnit,
        handleCreateStart,
        handleDuplicate,
        handleCreateCancel,
        handleEntityCreated,
        handleClearSelection,
        handleOpenInEditor,
        setIsDirty,
        setRestoredChange,
        // Guard Props
        handleNavigation,
        dialogOpen,
        confirmAction,
        cancelAction
    };
}
