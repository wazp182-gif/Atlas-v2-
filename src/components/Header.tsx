import React from 'react';
import { 
  Clock, 
  Users, 
  ListTree, 
  Play, 
  Share2, 
  Sun, 
  Moon, 
  FileText,
  Sparkles,
  Cpu
} from 'lucide-react';
import { Button } from './ui/button';
import { CustomLLMConfig } from '../types/llmConfig';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  hasAgenda: boolean;
  onOpenLiveMode: () => void;
  onOpenExport: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenLLMConfig: () => void;
  llmConfig: CustomLLMConfig;
}

export function Header({
  activeTab,
  onTabChange,
  hasAgenda,
  onOpenLiveMode,
  onOpenExport,
  darkMode,
  onToggleDarkMode,
  onOpenLLMConfig,
  llmConfig,
}: HeaderProps) {
  const navItems = [
    { id: 'timeline', label: 'Línea de Tiempo', icon: Clock },
    { id: 'topics', label: 'Temas & Tiempos', icon: ListTree },
    { id: 'participants', label: 'Interesados', icon: Users },
    { id: 'summary', label: 'Resumen Ejecutivo', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90 px-4 lg:px-8 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* Zone 1: Brand title (One line) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
            AgendaCraft AI
          </span>
        </div>

        {/* Zone 2: Navigation Links (Single line, 1-2 word labels) */}
        {hasAgenda ? (
          <nav className="hidden md:flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900/80 p-1 rounded-lg border border-zinc-200/80 dark:border-zinc-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-white text-zinc-950 shadow-xs dark:bg-zinc-800 dark:text-zinc-50 font-semibold'
                      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        ) : (
          <div className="hidden md:flex items-center text-xs text-zinc-500 dark:text-zinc-400">
            <span>Agente Inteligente de Agendas de Reuniones</span>
          </div>
        )}

        {/* Zone 3: Primary Actions (1-2 primary actions) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* AI Provider Indicator & Selector Button */}
          <button
            onClick={onOpenLLMConfig}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
              llmConfig.provider === 'ollama'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-300'
                : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800'
            }`}
            title="Configurar motor de IA (Gemini / Ollama Local)"
          >
            <Cpu className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {llmConfig.provider === 'ollama' ? 'Ollama' : 'Gemini'}
            </span>
          </button>

          {hasAgenda && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenExport}
                className="gap-1.5 text-xs"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Exportar</span>
                <span className="sm:hidden">Exportar</span>
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={onOpenLiveMode}
                className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span className="whitespace-nowrap">Facilitar</span>
              </Button>
            </>
          )}

          <button
            onClick={onToggleDarkMode}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
            aria-label="Cambiar tema"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
