import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300 disabled:pointer-events-none disabled:opacity-50 select-none whitespace-nowrap cursor-pointer';

    const variants = {
      default: 'bg-zinc-900 text-zinc-50 shadow-sm hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200',
      destructive: 'bg-red-600 text-white shadow-sm hover:bg-red-700 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-800',
      outline: 'border border-zinc-200 bg-white hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800 dark:text-zinc-100',
      secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700',
      ghost: 'hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-100',
      link: 'text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100',
    };

    const sizes = {
      default: 'h-9 px-4 py-2 text-sm rounded-md',
      sm: 'h-8 rounded-md px-3 text-xs',
      lg: 'h-10 rounded-md px-6 text-base',
      icon: 'h-9 w-9 rounded-md',
    };

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
