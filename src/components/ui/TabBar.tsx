import { cn } from "@/lib/utils";

export interface TabItem {
    value: string;
    label: React.ReactNode;
    count?: number;
}

interface TabBarProps {
    items: TabItem[];
    activeValue: string;
    onValueChange: (value: string) => void;
    variant?: 'default' | 'sticky';
    className?: string;
}

export function TabBar({ items, activeValue, onValueChange, variant = 'default', className }: TabBarProps) {
    return (
        <div className={cn(
            "flex items-center w-full border-b border-border/40",
            variant === 'sticky' && "sticky top-0 z-10 bg-background/80 backdrop-blur-sm",
            className
        )}>
            {items.map((item) => {
                const isActive = activeValue === item.value;
                return (
                    <button
                        key={item.value}
                        type="button"
                        onClick={() => onValueChange(item.value)}
                        className={cn(
                            "relative flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all outline-none select-none",
                            "hover:text-foreground hover:bg-muted/50",
                            isActive 
                                ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary" 
                                : "text-muted-foreground",
                             variant === 'sticky' && "flex-1" // ScribePanel tabs are full width (flex-1)
                        )}
                    >
                        {item.label}
                        {item.count !== undefined && (
                            <span className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold leading-none",
                                isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                            )}>
                                {item.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
