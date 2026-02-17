import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, action?: { label: string; onClick: () => void }) => void;
  success: (message: string, action?: { label: string; onClick: () => void }) => void;
  error: (message: string, action?: { label: string; onClick: () => void }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info', action?: { label: string; onClick: () => void }) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type, action }]);

    // Auto-dismiss (longer if action present)
    setTimeout(() => {
      removeToast(id);
    }, action ? 6000 : 4000);
  }, [removeToast]);

  const success = useCallback((message: string, action?: { label: string; onClick: () => void }) => toast(message, 'success', action), [toast]);
  const errorFn = useCallback((message: string, action?: { label: string; onClick: () => void }) => toast(message, 'error', action), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error: errorFn }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`
              pointer-events-auto min-w-[300px] p-4 rounded-lg shadow-2xl border flex items-start gap-3 
              animate-in slide-in-from-right-full fade-in duration-300
              ${t.type === 'error' ? 'bg-destructive/95 text-destructive-foreground border-destructive' : ''}
              ${t.type === 'success' ? 'bg-green-600/95 text-white border-green-700' : ''}
              ${t.type === 'info' ? 'bg-background/95 text-foreground border-border backdrop-blur-sm' : ''}
            `}
          >
            {t.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
            {t.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
            {t.type === 'info' && <Info className="w-5 h-5 shrink-0 text-primary" />}
            
            <div className="flex-1 text-sm font-medium pt-0.5">{t.message}</div>
            
            {t.action && (
              <button 
                onClick={() => {
                  t.action!.onClick();
                  removeToast(t.id);
                }}
                className="text-xs font-semibold underline hover:no-underline transition-all mr-2"
              >
                {t.action.label}
              </button>
            )}
            
            <button onClick={() => removeToast(t.id)} className="opacity-70 hover:opacity-100 transition-opacity">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
