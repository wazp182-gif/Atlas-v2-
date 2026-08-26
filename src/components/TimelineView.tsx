import React, { useState } from 'react';
import { 
  Clock, 
  User, 
  CheckCircle, 
  Target, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Edit3, 
  Check, 
  Sparkles,
  Layers,
  Calendar,
  AlertTriangle,
  Play
} from 'lucide-react';
import { MeetingAgenda, AgendaTopic, CategoryType } from '../types/agenda';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input, Textarea } from './ui/input';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { addMinutesToTime } from '../lib/exportUtils';
import { Avatar } from './ui/tabs';

interface TimelineViewProps {
  agenda: MeetingAgenda;
  startTime: string;
  onStartTimeChange: (newTime: string) => void;
  startDate: string;
  onStartDateChange: (newDate: string) => void;
  onUpdateAgenda: (updated: MeetingAgenda) => void;
  onStartLiveMeeting: () => void;
}

const CATEGORY_STYLES: Record<CategoryType, { label: string; badge: string; border: string; bg: string }> = {
  kickoff: {
    label: 'Apertura / Kickoff',
    badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    border: 'border-indigo-500/50',
    bg: 'bg-indigo-950/10',
  },
  presentation: {
    label: 'Presentación',
    badge: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    border: 'border-sky-500/50',
    bg: 'bg-sky-950/10',
  },
  discussion: {
    label: 'Debate / Discusión',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    border: 'border-amber-500/50',
    bg: 'bg-amber-950/10',
  },
  decision: {
    label: 'Toma de Decisiones',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    border: 'border-emerald-500/50',
    bg: 'bg-emerald-950/10',
  },
  action_items: {
    label: 'Acuerdos & Acciones',
    badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    border: 'border-cyan-500/50',
    bg: 'bg-cyan-950/10',
  },
  wrap_up: {
    label: 'Cierre / Conclusiones',
    badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    border: 'border-purple-500/50',
    bg: 'bg-purple-950/10',
  },
  brainstorm: {
    label: 'Ideación / Brainstorm',
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    border: 'border-rose-500/50',
    bg: 'bg-rose-950/10',
  },
};

export function TimelineView({
  agenda,
  startTime,
  onStartTimeChange,
  startDate,
  onStartDateChange,
  onUpdateAgenda,
  onStartLiveMeeting,
}: TimelineViewProps) {
  const [editingTopic, setEditingTopic] = useState<AgendaTopic | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New topic template
  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState(10);
  const [newSpeaker, setNewSpeaker] = useState(agenda.participants[0]?.name || 'Facilitador');
  const [newCategory, setNewCategory] = useState<CategoryType>('discussion');
  const [newDeliverable, setNewDeliverable] = useState('');
  const [newPoints, setNewPoints] = useState('');

  // Calculate cumulative offsets
  let runningMinutes = 0;
  const topicsWithTimes = agenda.topics.map((topic) => {
    const start = addMinutesToTime(startTime, runningMinutes);
    const end = addMinutesToTime(startTime, runningMinutes + topic.durationMinutes);
    runningMinutes += topic.durationMinutes;
    return { ...topic, calculatedStart: start, calculatedEnd: end };
  });

  const totalCalculated = runningMinutes;

  // Move topic up or down
  const moveTopic = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= agenda.topics.length) return;
    const newTopics = [...agenda.topics];
    const [moved] = newTopics.splice(index, 1);
    newTopics.splice(targetIndex, 0, moved);
    onUpdateAgenda({ ...agenda, topics: newTopics });
  };

  // Adjust duration (+/- 5 min)
  const adjustDuration = (topicId: string, delta: number) => {
    const newTopics = agenda.topics.map((t) => {
      if (t.id === topicId) {
        const newDur = Math.max(5, t.durationMinutes + delta);
        return { ...t, durationMinutes: newDur };
      }
      return t;
    });
    const newTotal = newTopics.reduce((acc, t) => acc + t.durationMinutes, 0);
    onUpdateAgenda({ ...agenda, topics: newTopics, totalDuration: newTotal });
  };

  // Delete topic
  const deleteTopic = (topicId: string) => {
    const newTopics = agenda.topics.filter((t) => t.id !== topicId);
    const newTotal = newTopics.reduce((acc, t) => acc + t.durationMinutes, 0);
    onUpdateAgenda({ ...agenda, topics: newTopics, totalDuration: newTotal });
  };

  // Save edit
  const handleSaveEdit = () => {
    if (!editingTopic) return;
    const newTopics = agenda.topics.map((t) => (t.id === editingTopic.id ? editingTopic : t));
    const newTotal = newTopics.reduce((acc, t) => acc + t.durationMinutes, 0);
    onUpdateAgenda({ ...agenda, topics: newTopics, totalDuration: newTotal });
    setEditingTopic(null);
  };

  // Add new topic
  const handleAddTopic = () => {
    if (!newTitle.trim()) return;
    const addedTopic: AgendaTopic = {
      id: `topic-${Date.now()}`,
      title: newTitle.trim(),
      durationMinutes: Number(newDuration) || 10,
      category: newCategory,
      leadSpeaker: newSpeaker.trim() || 'Facilitador',
      description: 'Punto añadido manualmente a la agenda.',
      discussionPoints: newPoints.split('\n').map((p) => p.trim()).filter(Boolean),
      expectedDeliverable: newDeliverable.trim() || 'Conclusión y acuerdos acordados.',
    };

    const newTopics = [...agenda.topics, addedTopic];
    const newTotal = newTopics.reduce((acc, t) => acc + t.durationMinutes, 0);
    onUpdateAgenda({ ...agenda, topics: newTopics, totalDuration: newTotal });

    // Reset
    setNewTitle('');
    setNewDuration(10);
    setNewDeliverable('');
    setNewPoints('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Meeting Context & Timeline Schedule Controller */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wide">
                Línea de Tiempo Operativa
              </span>
              <Badge variant="outline" className="text-xs border-zinc-300 dark:border-zinc-700">
                {agenda.topics.length} bloques estructurados
              </Badge>
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
              {agenda.title}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-3xl">
              <strong className="text-zinc-700 dark:text-zinc-300">Objetivo: </strong>
              {agenda.objective}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={onStartLiveMeeting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shadow-md text-xs"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Iniciar Modo Facilitador</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="gap-1.5 text-xs border-zinc-300 dark:border-zinc-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Añadir Tema</span>
            </Button>
          </div>
        </div>

        {/* Schedule Timing Pickers & Total Timeline Bar */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-zinc-400" />
              <span className="text-zinc-500">Fecha:</span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="h-8 w-36 text-xs bg-zinc-50 dark:bg-zinc-950 font-mono"
              />
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-500" />
              <span className="text-zinc-500">Hora de inicio:</span>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => onStartTimeChange(e.target.value)}
                className="h-8 w-28 text-xs bg-zinc-50 dark:bg-zinc-950 font-mono font-bold"
              />
            </div>

            <div className="text-zinc-500">
              Finalización estimada:{' '}
              <strong className="text-cyan-600 dark:text-cyan-400 font-mono text-sm">
                {addMinutesToTime(startTime, totalCalculated)}
              </strong>
            </div>
          </div>

          {/* Duration Badge */}
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/80 px-3 py-1.5 rounded-lg">
            <span className="text-zinc-500">Tiempo acumulado:</span>
            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
              {totalCalculated} min
            </span>
          </div>
        </div>

        {/* Visual Progress Bar of Meeting Timeline Segments */}
        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/60">
          <div className="text-[11px] text-zinc-400 mb-1.5 flex justify-between">
            <span>Distribución en bloques:</span>
            <span>100% cubierto</span>
          </div>
          <div className="h-2.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex gap-0.5 p-0.5">
            {topicsWithTimes.map((t, idx) => {
              const pct = (t.durationMinutes / totalCalculated) * 100;
              const catStyle = CATEGORY_STYLES[t.category] || CATEGORY_STYLES.discussion;
              const bgColors = {
                kickoff: 'bg-indigo-500',
                presentation: 'bg-sky-500',
                discussion: 'bg-amber-500',
                decision: 'bg-emerald-500',
                action_items: 'bg-cyan-500',
                wrap_up: 'bg-purple-500',
                brainstorm: 'bg-rose-500',
              };
              const color = bgColors[t.category] || 'bg-cyan-500';

              return (
                <div
                  key={t.id}
                  style={{ width: `${pct}%` }}
                  className={`h-full rounded-xs transition-all ${color}`}
                  title={`${idx + 1}. ${t.title} (${t.durationMinutes} min)`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Vertical Interactive Timeline */}
      <div className="relative pl-6 sm:pl-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-cyan-500 before:via-zinc-300 dark:before:via-zinc-700 before:to-zinc-200 dark:before:to-zinc-800 space-y-4">
        {topicsWithTimes.map((topic, index) => {
          const catStyle = CATEGORY_STYLES[topic.category] || CATEGORY_STYLES.discussion;

          return (
            <div key={topic.id} className="relative group">
              {/* Timeline Node Icon/Bullet */}
              <div className="absolute -left-6 sm:-left-8 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-zinc-900 border-2 border-cyan-500 text-[11px] font-mono font-bold text-cyan-600 dark:text-cyan-400 shadow-xs z-10">
                {index + 1}
              </div>

              {/* Topic Card Container */}
              <div
                className={`rounded-xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/90 p-4 sm:p-5 transition-all shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 ${catStyle.bg}`}
              >
                {/* Header Row: Times, Category, Duration pills & Reordering actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Time Slot Badge */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 text-zinc-100 dark:bg-zinc-950 dark:text-cyan-300 font-mono text-xs font-bold border border-zinc-800">
                      <Clock className="h-3 w-3 text-cyan-400" />
                      <span>
                        {topic.calculatedStart} - {topic.calculatedEnd}
                      </span>
                    </div>

                    {/* Duration Badge */}
                    <Badge variant="outline" className="font-mono text-xs border-zinc-300 dark:border-zinc-700">
                      {topic.durationMinutes} min
                    </Badge>

                    {/* Category Badge */}
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${catStyle.badge}`}
                    >
                      {catStyle.label}
                    </span>
                  </div>

                  {/* Right Actions: Minutes +/- and Reorder Controls */}
                  <div className="flex items-center gap-1 self-end sm:self-auto opacity-90 group-hover:opacity-100 transition-opacity">
                    {/* Duration quick adjuster */}
                    <div className="flex items-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs">
                      <button
                        type="button"
                        onClick={() => adjustDuration(topic.id, -5)}
                        title="Restar 5 minutos"
                        className="px-2 py-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 font-mono text-zinc-600 dark:text-zinc-300 cursor-pointer"
                      >
                        -5m
                      </button>
                      <span className="px-1 text-[10px] text-zinc-400">|</span>
                      <button
                        type="button"
                        onClick={() => adjustDuration(topic.id, 5)}
                        title="Sumar 5 minutos"
                        className="px-2 py-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 font-mono text-cyan-600 dark:text-cyan-400 cursor-pointer"
                      >
                        +5m
                      </button>
                    </div>

                    {/* Move Up/Down */}
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveTopic(index, 'up')}
                      className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-20 cursor-pointer"
                      title="Mover arriba"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={index === agenda.topics.length - 1}
                      onClick={() => moveTopic(index, 'down')}
                      className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-20 cursor-pointer"
                      title="Mover abajo"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>

                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={() => setEditingTopic(topic)}
                      className="p-1 text-zinc-400 hover:text-cyan-500 cursor-pointer"
                      title="Editar contenido del tema"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => deleteTopic(topic.id)}
                      className="p-1 text-zinc-400 hover:text-red-500 cursor-pointer"
                      title="Eliminar tema"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Topic Title & Lead Speaker */}
                <div className="mt-3 flex flex-col md:flex-row md:items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      {topic.title}
                    </h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed">
                      {topic.description}
                    </p>
                  </div>

                  {/* Speaker Pill */}
                  <div className="flex items-center gap-2 shrink-0 bg-zinc-100/80 dark:bg-zinc-800/80 px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-700/60 self-start">
                    <Avatar name={topic.leadSpeaker} className="h-5 w-5 text-[10px]" />
                    <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                      {topic.leadSpeaker}
                    </span>
                  </div>
                </div>

                {/* Discussion Points & Questions */}
                {topic.discussionPoints && topic.discussionPoints.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-dashed border-zinc-200 dark:border-zinc-800/70">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Puntos Clave a Debatir:
                    </span>
                    <ul className="mt-1.5 space-y-1 text-xs text-zinc-700 dark:text-zinc-300">
                      {topic.discussionPoints.map((point, pIdx) => (
                        <li key={pIdx} className="flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Expected Deliverable Banner */}
                {topic.expectedDeliverable && (
                  <div className="mt-3 flex items-start gap-2 bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/30 p-2.5 rounded-lg text-xs text-emerald-900 dark:text-emerald-300">
                    <Target className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                    <div>
                      <strong className="font-semibold text-emerald-800 dark:text-emerald-200">
                        Entregable / Decisión esperada:{' '}
                      </strong>
                      <span>{topic.expectedDeliverable}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Topic Modal */}
      {editingTopic && (
        <Dialog open={Boolean(editingTopic)} onOpenChange={(open) => !open && setEditingTopic(null)}>
          <DialogHeader>
            <DialogTitle>Editar Tema de la Agenda</DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 text-xs py-2">
            <div>
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Título del Tema:</label>
              <Input
                value={editingTopic.title}
                onChange={(e) => setEditingTopic({ ...editingTopic, title: e.target.value })}
                className="mt-1 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-zinc-700 dark:text-zinc-300">Duración (min):</label>
                <Input
                  type="number"
                  min="5"
                  max="180"
                  value={editingTopic.durationMinutes}
                  onChange={(e) =>
                    setEditingTopic({ ...editingTopic, durationMinutes: Number(e.target.value) || 5 })
                  }
                  className="mt-1 text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-medium text-zinc-700 dark:text-zinc-300">Líder / Expositor:</label>
                <Input
                  value={editingTopic.leadSpeaker}
                  onChange={(e) => setEditingTopic({ ...editingTopic, leadSpeaker: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Categoría:</label>
              <select
                value={editingTopic.category}
                onChange={(e) => setEditingTopic({ ...editingTopic, category: e.target.value as CategoryType })}
                className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1 text-xs mt-1"
              >
                {Object.entries(CATEGORY_STYLES).map(([key, info]) => (
                  <option key={key} value={key}>
                    {info.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Descripción:</label>
              <Textarea
                value={editingTopic.description}
                onChange={(e) => setEditingTopic({ ...editingTopic, description: e.target.value })}
                className="mt-1 text-xs h-16"
              />
            </div>

            <div>
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Entregable o Decisión:</label>
              <Input
                value={editingTopic.expectedDeliverable}
                onChange={(e) => setEditingTopic({ ...editingTopic, expectedDeliverable: e.target.value })}
                className="mt-1 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditingTopic(null)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSaveEdit} className="bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-bold">
              Guardar Cambios
            </Button>
          </DialogFooter>
        </Dialog>
      )}

      {/* Add New Topic Modal */}
      {isAddModalOpen && (
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogHeader>
            <DialogTitle>Añadir Nuevo Bloque a la Agenda</DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 text-xs py-2">
            <div>
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Título del Bloque:</label>
              <Input
                placeholder="Ej: Revisión de métricas de retención Q3"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-zinc-700 dark:text-zinc-300">Duración (minutos):</label>
                <Input
                  type="number"
                  min="5"
                  max="120"
                  value={newDuration}
                  onChange={(e) => setNewDuration(Number(e.target.value) || 5)}
                  className="mt-1 text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-medium text-zinc-700 dark:text-zinc-300">Líder o Expositor:</label>
                <Input
                  placeholder="Nombre o rol"
                  value={newSpeaker}
                  onChange={(e) => setNewSpeaker(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Categoría:</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as CategoryType)}
                className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1 text-xs mt-1"
              >
                {Object.entries(CATEGORY_STYLES).map(([key, info]) => (
                  <option key={key} value={key}>
                    {info.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Puntos a debatir (uno por línea):</label>
              <Textarea
                placeholder="Punto 1&#10;Punto 2&#10;Pregunta detonante"
                value={newPoints}
                onChange={(e) => setNewPoints(e.target.value)}
                className="mt-1 text-xs h-20 font-mono"
              />
            </div>

            <div>
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Entregable o Decisión Concreta:</label>
              <Input
                placeholder="Ej: Aprobación del roadmap o asignación de responsables"
                value={newDeliverable}
                onChange={(e) => setNewDeliverable(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleAddTopic} disabled={!newTitle.trim()} className="bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-bold">
              Añadir a la Agenda
            </Button>
          </DialogFooter>
        </Dialog>
      )}
    </div>
  );
}
