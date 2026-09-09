import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onDismiss,
  className,
}) => {
  const styles = {
    info: 'bg-sky-50 border-sky-200 text-sky-900',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    error: 'bg-red-50 border-red-200 text-red-900',
  };

  const icons = {
    info: <Info className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />,
    error: <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />,
  };

  return (
    <div
      role="alert"
      className={twMerge(
        clsx('p-4 border rounded-xl flex items-start gap-3 relative', styles[variant], className)
      )}
    >
      {icons[variant]}
      <div className="flex-1 text-sm">
        {title && <h4 className="font-semibold mb-1">{title}</h4>}
        <div className="opacity-90 leading-relaxed">{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 hover:opacity-75 transition-opacity"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
