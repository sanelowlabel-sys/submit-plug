import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  Sparkles,
  Music2,
  ListMusic
} from 'lucide-react';
import { ToastNotification } from '../../types';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      id="global-toast-container"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      aria-live="polite"
    >
      {toasts.map((toast: ToastNotification) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 animate-slideUp ${
              isSuccess
                ? 'bg-[#141d17]/95 border-emerald-500/40 text-emerald-100 shadow-emerald-950/30'
                : isError
                ? 'bg-[#211416]/95 border-[#BE1E2F]/60 text-red-100 shadow-red-950/30'
                : isWarning
                ? 'bg-[#241d13]/95 border-amber-500/40 text-amber-100 shadow-amber-950/30'
                : 'bg-[#181818]/95 border-[#383838] text-white shadow-black/50'
            }`}
          >
            <div className="mt-0.5 flex-shrink-0">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {isError && <AlertCircle className="w-4 h-4 text-[#BE1E2F]" />}
              {isWarning && <AlertCircle className="w-4 h-4 text-amber-400" />}
              {!isSuccess && !isError && !isWarning && <Sparkles className="w-4 h-4 text-[#BE1E2F]" />}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="text-xs font-title font-bold tracking-wide leading-tight">
                {toast.title}
              </div>
              <div className="text-[11px] opacity-80 mt-0.5 leading-snug break-words font-sans">
                {toast.message}
              </div>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/40 hover:text-white p-0.5 rounded transition-colors flex-shrink-0 cursor-pointer"
              title="Dismiss notification"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
