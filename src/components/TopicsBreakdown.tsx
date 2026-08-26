import React, { useState } from 'react';
import { 
  ListTree, 
  Clock, 
  Target, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Plus, 
  Tag,
  BarChart3,
  Flame,
  HelpCircle
} from 'lucide-react';
import { MeetingAgenda, AgendaTopic, CategoryType } from '../types/agenda';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Avatar } from './ui/tabs';

interface TopicsBreakdownProps {
  agenda: MeetingAgenda;
  onUpdateAgenda: (updated: MeetingAgenda) => void;
}

export function TopicsBreakdown({ agenda, onUpdateAgenda }: TopicsBreakdownProps) {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  const totalMinutes = agenda.topics.reduce((acc, t) => acc + t.durationMinutes, 0);

  // Group stats by category
  const categoryStats = agenda.topics.reduce((acc, topic) => {
    acc[topic.category] = (acc[topic.category] || 0) + topic.durationMinutes;
    return acc;
  }, {} as Record<string, number>);

  const filteredTopics = selectedCategoryFilter === 'all'
    ? agenda.topics
    : agenda.topics.filter((t) => t.category === selectedCategoryFilter);

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                Desglose de Temas & Asignación de Tiempos
              </span>
              <Badge variant="outline" className="text-xs border-zinc-300 dark:border-zinc-700">
                {agenda.topics.length} Temas Totales
              </Badge>
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
              Estructura Analítica de la Reunión
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Tiempos estrictamente calibrados para evitar desviaciones y garantizar el cumplimiento del objetivo.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-zinc-100 dark:bg-zinc-800/90 px-4 py-2 rounded-xl text-center border border-zinc-200 dark:border-zinc-700">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-mono">
                Tiempo Total
              </span>
              <span className="text-lg font-bold font-mono text-cyan-600 dark:text-cyan-400">
                {totalMinutes} min
              </span>
            </div>
          </div>
        </div>

        {/* Category distribution pill filters */}
        <div className="pt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-zinc-500 text-[11px] font-medium mr-1">Filtrar por categoría:</span>
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              selectedCategoryFilter === 'all'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
            }`}
          >
            Todos ({agenda.topics.length})
          </button>
          {Object.entries(categoryStats).map(([cat, mins]) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedCategoryFilter === cat
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
              }`}
            >
              <span className="capitalize">{cat.replace('_', ' ')}</span>
              <span className="font-mono text-[10px] opacity-75">({mins}m)</span>
            </button>
          ))}
        </div>
      </div>

      {/* Topics List Table & Cards */}
      <div className="space-y-4">
        {filteredTopics.map((topic, index) => {
          const percentOfMeeting = Math.round((topic.durationMinutes / totalMinutes) * 100);

          return (
            <div
              key={topic.id}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-5 shadow-xs transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Left Section: Number, Title, Category, Description */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                      #{index + 1}
                    </span>
                    <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {topic.category.toUpperCase().replace('_', ' ')}
                    </span>
                    {topic.priority && (
                      <Badge
                        variant={topic.priority === 'high' ? 'destructive' : 'secondary'}
                        className="text-[10px] uppercase"
                      >
                        Prioridad {topic.priority}
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {topic.title}
                  </h3>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
                    {topic.description}
                  </p>

                  {/* Discussion points */}
                  {topic.discussionPoints && topic.discussionPoints.length > 0 && (
                    <div className="mt-3 pt-2">
                      <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                        Preguntas y Focos de Discusión:
                      </span>
                      <div className="mt-1.5 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {topic.discussionPoints.map((point, pIdx) => (
                          <div
                            key={pIdx}
                            className="flex items-start gap-2 p-2 rounded-md bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/80 text-xs text-zinc-700 dark:text-zinc-300"
                          >
                            <HelpCircle className="h-3.5 w-3.5 text-cyan-500 shrink-0 mt-0.5" />
                            <span>{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Deliverable */}
                  {topic.expectedDeliverable && (
                    <div className="mt-3 flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-lg text-xs text-emerald-900 dark:text-emerald-300">
                      <Target className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                      <div>
                        <strong className="font-semibold text-emerald-800 dark:text-emerald-200">
                          Resultado / Decisión Concreta Requerida:{' '}
                        </strong>
                        <span>{topic.expectedDeliverable}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Section: Time stats & Lead speaker card */}
                <div className="w-full lg:w-64 shrink-0 flex flex-col gap-3 pt-3 lg:pt-0 lg:border-l lg:border-zinc-200 dark:lg:border-zinc-800 lg:pl-5">
                  {/* Time box */}
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-zinc-500 font-medium">Tiempo asignado:</span>
                      <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 text-sm">
                        {topic.durationMinutes} min
                      </span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-cyan-500 h-full rounded-full"
                        style={{ width: `${percentOfMeeting}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-400 text-right block mt-1">
                      Representa el {percentOfMeeting}% de la reunión
                    </span>
                  </div>

                  {/* Speaker card */}
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                    <Avatar name={topic.leadSpeaker} className="h-8 w-8 text-xs font-bold" />
                    <div className="overflow-hidden">
                      <span className="text-[10px] text-zinc-400 font-mono uppercase block">
                        Líder / Facilitador
                      </span>
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate block">
                        {topic.leadSpeaker}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
