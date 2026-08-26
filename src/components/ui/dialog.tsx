import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      {/* Content Container */}
      <div className="relative z-50 w-full max-w-lg my-auto rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex flex-col space-y-1.5 text-center sm:text-left mb-4 ${className}`} {...props}>{children}</div>;
}

export function DialogTitle({ className = '', children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={`text-lg font-semibold leading-none tracking-tight ${className}`} {...props}>{children}</h2>;
}

export function DialogDescription({ className = '', children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`text-sm text-zinc-500 dark:text-zinc-400 mt-1 ${className}`} {...props}>{children}</p>;
}

export function DialogFooter({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6 gap-2 ${className}`} {...props}>{children}</div>;
}
