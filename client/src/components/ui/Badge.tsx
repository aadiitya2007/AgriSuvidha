import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'harvest';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'neutral',
  ...props
}) => {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold';

  const variants = {
    success: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border border-amber-200',
    danger: 'bg-red-100 text-red-800 border border-red-200',
    info: 'bg-sky-100 text-sky-800 border border-sky-200',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
    harvest: 'bg-orange-100 text-orange-800 border border-orange-200',
  };

  return (
    <span className={twMerge(clsx(base, variants[variant], className))} {...props}>
      {children}
    </span>
  );
};
