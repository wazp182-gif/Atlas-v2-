import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
  children?: React.ReactNode;
  className?: string;
}

export function Badge({ className = '', variant = 'default', children, ...props }: BadgeProps) {
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 whitespace-nowrap';

  const variants = {
    default: 'border-transparent bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900',
    secondary: 'border-transparent bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100',
    destructive: 'border-transparent bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800/40',
    outline: 'text-zinc-950 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800',
    success: 'border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    warning: 'border border-amber-200 dark:border-amber-800/40 bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    info: 'border border-sky-200 dark:border-sky-800/40 bg-sky-50 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300',
  };

  return (
    <div className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}
