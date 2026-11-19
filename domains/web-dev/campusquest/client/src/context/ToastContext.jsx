import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Info, X, AlertTriangle, AlertCircle } from 'lucide-react';

const ToastContext = createContext(null);

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: 'border-mint/30 bg-mint/10 text-emerald-800 dark:text-emerald-200',
  error: 'border-rose-300/40 bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-200',
  warning: 'border-amber-300/40 bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200',
  info: 'border-brand-300/40 bg-brand-50 text-brand-800 dark:bg-brand-500/10 dark:text-brand-200',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (message, type = 'info', options = {}) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((current) => [...current.slice(-3), { id, message, type, title: options.title }]);
      window.setTimeout(() => dismiss(id), options.duration || 4200);
      return id;
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      toast: push,
      success: (message, options) => push(message, 'success', options),
      error: (message, options) => push(message, 'error', options),
      info: (message, options) => push(message, 'info', options),
      warning: (message, options) => push(message, 'warning', options),
      dismiss,
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-end gap-2 sm:left-auto sm:w-96"
        aria-live="polite"
        role="status"
      >
        {toasts.map((toast) => {
          const Icon = icons[toast.type] || Info;
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex w-full animate-fade-in items-start gap-3 rounded-xl border px-4 py-3 shadow-lift backdrop-blur ${styles[toast.type]}`}
            >
              <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1 text-sm">
                {toast.title ? <p className="font-semibold">{toast.title}</p> : null}
                <p className="leading-snug">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="rounded-md p-1 opacity-60 transition hover:opacity-100"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}

export function useFlashOnMount() {
  useEffect(() => () => undefined, []);
}
