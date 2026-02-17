import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { WifiOff, Activity } from "lucide-react";

interface HealthStatus {
    status: 'healthy' | 'unhealthy' | 'unknown';
    timestamp?: string;
    version?: string;
    error?: string;
}

export function HealthIndicator() {
    const [health, setHealth] = useState<HealthStatus>({ status: 'unknown' });

    useEffect(() => {
        const checkHealth = async () => {
            try {
                // Use fetch directly to avoid global error handling for background checks if any
                const res = await fetch('/api/health');
                if (res.ok) {
                    const data = await res.json();
                    setHealth({ status: 'healthy', ...data });
                } else {
                    const error = await res.text();
                    setHealth({ status: 'unhealthy', error });
                }
            } catch (err) {
                setHealth({ status: 'unhealthy', error: (err as Error).message });
            }
        };

        checkHealth();
        const interval = setInterval(checkHealth, 30000); // 30s
        return () => clearInterval(interval);
    }, []);

    const isConnected = health.status === 'healthy';

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-help select-none",
                        isConnected 
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                            : "bg-destructive/10 border-destructive/20 text-destructive animate-pulse"
                    )}>
                        {isConnected ? (
                            <>
                                <div className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </div>
                                <span className="hidden sm:inline font-mono">{health.version || 'v?.?.?'}</span>
                            </>
                        ) : (
                            <>
                                <WifiOff className="w-3 h-3" />
                                <span className="hidden sm:inline">Offline</span>
                            </>
                        )}
                    </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs bg-popover/95 backdrop-blur-sm p-3 border-border/50 shadow-lg">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                            <Activity className="w-3 h-3 text-muted-foreground" />
                            <span className="font-semibold text-foreground">System Status</span>
                        </div>
                        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-muted-foreground">
                            <span>State:</span>
                            <span className={cn("font-medium", isConnected ? "text-emerald-500" : "text-destructive")}>
                                {health.status.toUpperCase()}
                            </span>
                            
                            <span>Version:</span>
                            <span className="font-mono text-foreground">{health.version || 'Unknown'}</span>
                            
                            <span>Last Check:</span>
                            <span>{health.timestamp ? new Date(health.timestamp).toLocaleTimeString() : '-'}</span>

                            {health.error && (
                                <>
                                    <span>Error:</span>
                                    <span className="text-destructive max-w-[200px] truncate" title={health.error}>
                                        {health.error}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
