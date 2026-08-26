import React from 'react';

interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextType | undefined>(undefined);

export function Tabs({
  value,
  onValueChange,
  className = '',
  children,
}: {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={`w-full ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={`inline-flex h-9 items-center justify-center rounded-lg bg-zinc-100 p-1 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 ${className}`}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  className = '',
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');

  const isActive = context.value === value;

  return (
    <button
      type="button"
      onClick={() => context.onValueChange(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer ${
        isActive
          ? 'bg-white text-zinc-950 shadow-xs dark:bg-zinc-950 dark:text-zinc-50 font-semibold'
          : 'hover:text-zinc-900 dark:hover:text-zinc-200'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  className = '',
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');

  if (context.value !== value) return null;

  return <div className={`mt-2 focus-visible:outline-none ${className}`}>{children}</div>;
}

// Avatar helper
export function Avatar({ name, className = '' }: { name: string; className?: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'P';

  // Deterministic color based on name
  const colors = [
    'bg-blue-600 text-white',
    'bg-emerald-600 text-white',
    'bg-violet-600 text-white',
    'bg-amber-600 text-white',
    'bg-rose-600 text-white',
    'bg-cyan-600 text-white',
    'bg-indigo-600 text-white',
    'bg-teal-600 text-white',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorClass = colors[Math.abs(hash) % colors.length];

  return (
    <div
      className={`relative flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full font-medium text-xs shadow-xs ${colorClass} ${className}`}
    >
      {initials}
    </div>
  );
}
