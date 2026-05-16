import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const icons = {
    success: <CheckCircle size={16} className="text-success shrink-0" />,
    error: <XCircle size={16} className="text-danger shrink-0" />,
    warning: <AlertCircle size={16} className="text-warning shrink-0" />,
  };

  const borders = {
    success: 'border-success/30',
    error: 'border-danger/30',
    warning: 'border-warning/30',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-in flex items-center gap-3 bg-bg-surface border ${borders[t.type]} rounded-lg px-4 py-3 shadow-xl pointer-events-auto min-w-[260px] max-w-[380px]`}
          >
            {icons[t.type]}
            <span className="text-sm text-text-primary flex-1">{t.message}</span>
            <button onClick={() => remove(t.id)} className="text-text-muted hover:text-text-primary transition-colors">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
