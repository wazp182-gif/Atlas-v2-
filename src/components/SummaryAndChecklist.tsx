import React, { useState } from 'react';
import { 
  FileText, 
  CheckSquare, 
  Square, 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  Info,
  Layers
} from 'lucide-react';
import { MeetingAgenda } from '../types/agenda';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface SummaryAndChecklistProps {
  agenda: MeetingAgenda;
  onUpdateAgenda: (updated: MeetingAgenda) => void;
}

export function SummaryAndChecklist({ agenda, onUpdateAgenda }: SummaryAndChecklistProps) {
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const toggleCheck = (index: number) => {
    setCheckedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const totalChecklist = agenda.preMeetingChecklist?.length || 0;
  const completedChecklist = Object.values(checkedItems).filter(Boolean).length;
  const checklistProgress = totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Executive Summary Card */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-5 w-5 text-cyan-500" />
          <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
            Contexto Operativo del Documento
          </span>
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Resumen Ejecutivo para la Sesión
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-3 leading-relaxed">
          {agenda.summary || agenda.objective}
        </p>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] text-zinc-400 font-mono uppercase block">Formato de Reunión</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 block">{agenda.meetingType}</span>
          </div>

          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] text-zinc-400 font-mono uppercase block">Duración Estimada</span>
            <span className="font-bold text-cyan-600 dark:text-cyan-400 font-mono mt-0.5 block">{agenda.totalDuration} minutos</span>
          </div>

          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] text-zinc-400 font-mono uppercase block">Convocados Clave</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 block">{agenda.participants.length} personas</span>
          </div>
        </div>
      </div>

      {/* Pre-Meeting Preparation Checklist */}
      {agenda.preMeetingChecklist && agenda.preMeetingChecklist.length > 0 && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Checklist Previo Obligatorio
                </span>
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                Prerrequisitos y Lecturas Previas para los Asistentes
              </h3>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono text-zinc-500">
                {completedChecklist}/{totalChecklist} Completados ({checklistProgress}%)
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {agenda.preMeetingChecklist.map((item, index) => {
              const isChecked = Boolean(checkedItems[index]);
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => toggleCheck(index)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs flex items-start gap-3 cursor-pointer ${
                    isChecked
                      ? 'border-emerald-500/40 bg-emerald-500/5 text-zinc-500 dark:text-zinc-400 line-through'
                      : 'border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40 text-zinc-800 dark:text-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="mt-0.5 text-emerald-500 shrink-0">
                    {isChecked ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 text-zinc-400" />}
                  </div>
                  <span className="leading-relaxed">{item}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Risks & Watchouts */}
      {agenda.risksAndWatchouts && agenda.risksAndWatchouts.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Puntos Sensibles y Alertas del Moderador
            </span>
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Riesgos de Desviación o Bloqueos Potenciales
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 mb-4">
            El facilitador debe cuidar que el debate no se estanque en estos temas sin una moción de acuerdo.
          </p>

          <div className="space-y-2">
            {agenda.risksAndWatchouts.map((risk, rIdx) => (
              <div
                key={rIdx}
                className="flex items-start gap-2.5 p-3 rounded-lg bg-white/80 dark:bg-zinc-900/80 border border-amber-500/20 text-xs text-zinc-800 dark:text-zinc-200"
              >
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{risk}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
