import React from 'react';
import { ToastNotification } from '../hooks/useRealtime';
import { AlertCircle, CheckCircle2, Info, X, ShieldAlert } from 'lucide-react';

interface ToastContainerProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      id="live-toast-container"
      className="fixed bottom-5 left-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => {
        let borderClass = 'border-slate-200 bg-white text-slate-800';
        let IconComponent = Info;
        let iconColor = 'text-blue-600';

        if (toast.type === 'success') {
          borderClass = 'border-emerald-200 bg-emerald-50/95 text-emerald-900';
          IconComponent = CheckCircle2;
          iconColor = 'text-emerald-600';
        } else if (toast.type === 'error') {
          borderClass = 'border-rose-200 bg-rose-50/95 text-rose-900';
          IconComponent = ShieldAlert;
          iconColor = 'text-rose-600';
        } else if (toast.type === 'warning') {
          borderClass = 'border-amber-200 bg-amber-50/95 text-amber-900';
          IconComponent = AlertCircle;
          iconColor = 'text-amber-600';
        }

        return (
          <div
            key={toast.id}
            id={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${borderClass}`}
          >
            <IconComponent className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold leading-tight">{toast.title}</div>
              <div className="text-xs mt-0.5 opacity-90 leading-relaxed break-words">{toast.message}</div>
              <div className="text-[10px] opacity-60 mt-1">تحديث لحظي بدون إعادة تحميل</div>
            </div>
            <button
              id={`dismiss-${toast.id}`}
              onClick={() => onDismiss(toast.id)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg shrink-0 transition-colors"
              aria-label="إغلاق"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
