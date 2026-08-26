import React, { useState } from 'react';
import { Sparkles, Send, RefreshCw, Wand2 } from 'lucide-react';
import { MeetingAgenda } from '../types/agenda';
import { CustomLLMConfig } from '../types/llmConfig';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface AgentRefinerProps {
  agenda: MeetingAgenda;
  onAgendaRefined: (newAgenda: MeetingAgenda) => void;
  llmConfig?: CustomLLMConfig;
}

export function AgentRefiner({ agenda, onAgendaRefined, llmConfig }: AgentRefinerProps) {
  const [prompt, setPrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const quickPrompts = [
    'Ajusta la duración total a 45 minutos manteniendo el foco.',
    'Agrega 10 minutos al tema de decisiones críticas.',
    'Incluye al Gerente de Finanzas (CFO) como participante obligatorio.',
    'Resume los puntos de discusión para mayor dinamismo.',
  ];

  const handleRefine = async (customText?: string) => {
    const textToSend = customText || prompt;
    if (!textToSend.trim() || isRefining) return;

    setIsRefining(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/refine-agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentAgenda: agenda,
          refinementPrompt: textToSend,
          llmConfig,
        }),
      });

      const data = await res.json();
      if (data.success && data.agenda) {
        onAgendaRefined(data.agenda);
        setPrompt('');
      } else {
        setErrorMessage(data.error || 'Error al ajustar la agenda.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Error de conexión con el agente Atlas.');
    } finally {
      setIsRefining(false);
    }
  };

  const providerLabel = llmConfig?.provider === 'ollama'
    ? `Ollama (${llmConfig.ollamaModel || 'Local'})`
    : 'Google Gemini (Flash)';

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-cyan-500/30 bg-zinc-50 dark:bg-cyan-950/20 p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          <span className="text-xs font-bold text-zinc-900 dark:text-cyan-300 uppercase tracking-wider">
            Atlas Agent Assistant • Ajuste en Lenguaje Natural
          </span>
        </div>
        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
          Motor: {providerLabel}
        </span>
      </div>

      <div className="flex gap-2">
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleRefine();
            }
          }}
          placeholder="Pídele al agente cualquier cambio (ej: 'Reduce a 30m', 'Agrega un bloque de preguntas', 'Cambia el moderador del bloque 2')..."
          className="text-xs bg-white dark:bg-zinc-900/90 border-zinc-300 dark:border-cyan-500/30 focus-visible:ring-cyan-500"
          disabled={isRefining}
        />
        <Button
          onClick={() => handleRefine()}
          disabled={!prompt.trim() || isRefining}
          size="sm"
          className="bg-cyan-600 hover:bg-cyan-500 text-white dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-zinc-950 font-bold px-3 gap-1 shrink-0"
        >
          {isRefining ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">{isRefining ? 'Ajustando...' : 'Aplicar'}</span>
        </Button>
      </div>

      {errorMessage && (
        <p className="text-[11px] text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-2 rounded border border-red-200 dark:border-red-800/40">
          {errorMessage}
        </p>
      )}

      {/* Quick suggestions */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 self-center mr-1">Sugerencias rápidas:</span>
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleRefine(qp)}
            disabled={isRefining}
            className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800/80 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 hover:text-cyan-800 dark:hover:text-cyan-300 text-zinc-700 dark:text-zinc-300 transition-colors border border-zinc-300 dark:border-zinc-700/60 cursor-pointer text-left truncate max-w-xs"
          >
            {qp}
          </button>
        ))}
      </div>
    </div>
  );
}
