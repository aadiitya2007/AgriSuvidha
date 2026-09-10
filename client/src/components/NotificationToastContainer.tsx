import React, { useEffect, useState } from 'react';
import { useNotifications, ToastItem } from '../context/NotificationContext';
import {
  CheckCircle2,
  X,
  CreditCard,
  CalendarCheck,
  BellRing,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  PackageCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SingleToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

const SingleToast: React.FC<SingleToastProps> = ({ toast, onDismiss }) => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const duration = toast.durationMs || 6500;

  useEffect(() => {
    if (isPaused) return;
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          onDismiss(toast.id);
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPaused, duration, toast.id, onDismiss]);

  // Determine Category Styling
  const getCategoryConfig = () => {
    switch (toast.category) {
      case 'PAYMENT':
        return {
          badge: 'DBT PAYMENT SUCCESS (प्रत्यक्ष लाभ हस्तांतरण)',
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          borderColor: 'border-emerald-500',
          bgGradient: 'from-emerald-500/10 via-emerald-500/5 to-white',
          iconBg: 'bg-emerald-600 text-white shadow-emerald-500/30',
          progressBar: 'bg-emerald-600',
          icon: <CheckCircle2 className="w-5 h-5 text-white" />,
          accentText: 'text-emerald-700',
        };
      case 'PROCUREMENT':
        return {
          badge: 'LOT INSPECTED & GRADED (गुणवत्ता स्वीकृत)',
          badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
          borderColor: 'border-sky-500',
          bgGradient: 'from-sky-500/10 via-sky-500/5 to-white',
          iconBg: 'bg-sky-600 text-white shadow-sky-500/30',
          progressBar: 'bg-sky-600',
          icon: <ShieldCheck className="w-5 h-5 text-white" />,
          accentText: 'text-sky-700',
        };
      case 'SLOT':
        return {
          badge: 'SLOT BOOKING CONFIRMED (स्लॉट सुरक्षित)',
          badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
          borderColor: 'border-indigo-500',
          bgGradient: 'from-indigo-500/10 via-indigo-500/5 to-white',
          iconBg: 'bg-indigo-600 text-white shadow-indigo-500/30',
          progressBar: 'bg-indigo-600',
          icon: <CalendarCheck className="w-5 h-5 text-white" />,
          accentText: 'text-indigo-700',
        };
      case 'QUEUE':
        return {
          badge: 'GATE CALL ANNOUNCEMENT (गेट पर बुलावा)',
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
          borderColor: 'border-amber-500',
          bgGradient: 'from-amber-500/10 via-amber-500/5 to-white',
          iconBg: 'bg-amber-600 text-white shadow-amber-500/30',
          progressBar: 'bg-amber-600',
          icon: <BellRing className="w-5 h-5 text-white" />,
          accentText: 'text-amber-700',
        };
      case 'INCIDENT':
        return {
          badge: 'MANDI ADVISORY & HELPLINE (मंडी चेतावनी)',
          badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
          borderColor: 'border-rose-500',
          bgGradient: 'from-rose-500/10 via-rose-500/5 to-white',
          iconBg: 'bg-rose-600 text-white shadow-rose-500/30',
          progressBar: 'bg-rose-600',
          icon: <AlertTriangle className="w-5 h-5 text-white" />,
          accentText: 'text-rose-700',
        };
      default:
        return {
          badge: 'SYSTEM UPDATE (एग्री-सुविधा सूचना)',
          badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
          borderColor: 'border-emerald-500',
          bgGradient: 'from-slate-500/10 via-slate-500/5 to-white',
          iconBg: 'bg-slate-700 text-white shadow-slate-500/30',
          progressBar: 'bg-emerald-600',
          icon: <PackageCheck className="w-5 h-5 text-white" />,
          accentText: 'text-emerald-700',
        };
    }
  };

  const config = getCategoryConfig();

  const handleAction = () => {
    onDismiss(toast.id);
    if (toast.actionUrl) {
      navigate(toast.actionUrl);
    } else if (toast.category === 'PAYMENT') {
      navigate('/farmer/procurement');
    } else if (toast.category === 'SLOT') {
      navigate('/farmer/bookings');
    } else if (toast.category === 'QUEUE') {
      navigate('/farmer/queue');
    }
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 ${config.borderColor} overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-top-4 pointer-events-auto group`}
      style={{
        boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.18), 0 10px 15px -5px rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* Subtle background glow */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient} pointer-events-none`} />

      <div className="relative p-3.5 sm:p-4">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${config.badgeColor}`}
          >
            {config.badge}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-mono">Just now</span>
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md ${config.iconBg}`}
          >
            {config.icon}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
              {toast.title}
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-3">
              {toast.body}
            </p>

            {/* Quick Action Link */}
            <div className="mt-2.5 flex items-center gap-2">
              <button
                onClick={handleAction}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-900 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-emerald-200 transition-all cursor-pointer"
              >
                <span>{toast.category === 'PAYMENT' ? 'View Payment Receipt' : 'Open Details'}</span>
                <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-emerald-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-dismiss progress bar */}
      <div className="w-full bg-slate-100 h-1 overflow-hidden">
        <div
          className={`h-full transition-all ease-linear ${config.progressBar}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const NotificationToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useNotifications();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-18 right-3 sm:right-6 z-[9999] flex flex-col gap-2.5 max-w-md w-[calc(100vw-1.5rem)] sm:w-96 pointer-events-none"
    >
      {toasts.map((toast) => (
        <SingleToast key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
};
