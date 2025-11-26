
import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto dismiss
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none w-max max-w-[90vw]">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`
              pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border backdrop-blur-md animate-in slide-in-from-top-2 fade-in
              ${toast.type === 'success' ? 'bg-green-900/80 border-green-500/50 text-green-100 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : ''}
              ${toast.type === 'error' ? 'bg-red-900/80 border-red-500/50 text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : ''}
              ${toast.type === 'info' ? 'bg-nexus-blue/80 border-nexus-blue/50 text-blue-100 shadow-[0_0_20px_rgba(0,136,255,0.3)]' : ''}
            `}
          >
            {toast.type === 'success' && <CheckCircle2 size={16} />}
            {toast.type === 'error' && <AlertCircle size={16} />}
            {toast.type === 'info' && <Info size={16} />}
            
            <span className="text-sm font-medium font-sans">{toast.message}</span>
            
            <button 
              onClick={() => removeToast(toast.id)}
              className="ml-2 opacity-70 hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
