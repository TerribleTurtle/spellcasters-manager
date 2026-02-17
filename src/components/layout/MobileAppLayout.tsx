import { AppView } from '@/types';
import { AppSidebar } from './AppSidebar';
import { EntityListHash } from '../grimoire/EntityList';

interface MobileAppLayoutProps {
    isOpen: boolean;
    onClose: () => void;
    view: AppView;
    setView: (view: AppView) => void;
    items: EntityListHash[];
    selectedUnit: string | null;
    onSelectUnit: (unit: string) => void;
    currentCategory: string;
    onSelectCategory: (category: string) => void;
    pendingChanges: number;
    queuedIds: Set<string>;
}

export function MobileAppLayout({ 
    isOpen, onClose, view, setView, items, selectedUnit, onSelectUnit, currentCategory, onSelectCategory, pendingChanges, queuedIds
}: MobileAppLayoutProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 md:hidden bg-background/80 backdrop-blur-sm" onClick={onClose}>
            <div className="absolute inset-y-0 left-0 w-3/4 max-w-xs bg-card h-full shadow-2xl animate-in slide-in-from-left duration-300" onClick={e => e.stopPropagation()}>
                <AppSidebar 
                    view={view} 
                    setView={setView} 
                    items={items} 
                    selectedUnit={selectedUnit} 
                    onSelectUnit={(u) => { 
                        onSelectUnit(u); 
                        onClose(); 
                    }}
                    currentCategory={currentCategory}
                    onSelectCategory={(c) => {
                        onSelectCategory(c);
                        onClose();
                    }}
                    pendingChanges={pendingChanges}
                    queuedIds={queuedIds}
                />
            </div>
        </div>
    );
}
