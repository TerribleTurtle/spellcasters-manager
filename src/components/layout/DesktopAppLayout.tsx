import { AppView } from '@/types';
import { AppSidebar } from './AppSidebar';
import { EntityListHash } from '../grimoire/EntityList';

interface DesktopAppLayoutProps {
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

export function DesktopAppLayout({ 
    view, setView, items, selectedUnit, onSelectUnit, currentCategory, onSelectCategory, pendingChanges, queuedIds
}: DesktopAppLayoutProps) {
    return (
        <div className="hidden md:block w-72 h-full z-20 relative shrink-0">
             <AppSidebar 
                view={view} 
                setView={setView} 
                items={items} 
                selectedUnit={selectedUnit} 
                onSelectUnit={onSelectUnit}
                currentCategory={currentCategory}
                onSelectCategory={onSelectCategory}
                pendingChanges={pendingChanges}
                queuedIds={queuedIds}
             />
        </div>
    );
}
