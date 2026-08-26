import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  CheckCircle, 
  Clock, 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  FileText, 
  Target, 
  Users, 
  Sparkles,
  X,
  Maximize2,
  Minimize2,
  Plus
} from 'lucide-react';
import { MeetingAgenda, AgendaTopic } from '../types/agenda';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar } from './ui/tabs';

interface LiveMeetingModalProps {
  agenda: MeetingAgenda;
  open: boolean;
  onClose: () => void;
}

export function LiveMeetingModal({ agenda, open, onClose }: LiveMeetingModalProps) {
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [liveNotes, setLiveNotes] = useState<string>('');
  const [meetingCompleted, setMeetingCompleted] = useState(false);
  const [topicNotes, setTopicNotes] = useState<Record<string, string>>({});

  const currentTopic = agenda.topics[currentTopicIndex];
  const nextTopic = agenda.topics[currentTopicIndex + 1];

  // Initialize or change timer when topic changes
  useEffect(() => {
    if (currentTopic && open) {
      setSecondsRemaining(currentTopic.durationMinutes * 60);
      setIsRunning(true);
    }
  }, [currentTopicIndex, open]);

  // Timer interval
  useEffect(() => {
    let timer: any = null;
    if (isRunning && secondsRemaining > 0 && open && !meetingCompleted) {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            // Play subtle beep if audio enabled
            if (soundEnabled && typeof window !== 'undefined') {
              try {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = 587.33; // D5
                gain.gain.value = 0.15;
                osc.start();
                osc.stop(ctx.currentTime + 0.3);
              } catch (e) {
                // Ignore audio context errors if restricted
              }
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, secondsRemaining, open, soundEnabled, meetingCompleted]);

  if (!open) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalTopicSeconds = (currentTopic?.durationMinutes || 1) * 60;
  const progressPercent = Math.max(0, Math.min(100, ((totalTopicSeconds - secondsRemaining) / totalTopicSeconds) * 100));

  const isOvertime = secondsRemaining === 0;

  const handleNextTopic = () => {
    if (currentTopicIndex < agenda.topics.length - 1) {
      setCurrentTopicIndex((prev) => prev + 1);
    } else {
      setMeetingCompleted(true);
      setIsRunning(false);
    }
  };

  const handlePrevTopic = () => {
    if (currentTopicIndex > 0) {
      setCurrentTopicIndex((prev) => prev - 1);
    }
  };

  const handleAddMinutes = (mins: number) => {
    setSecondsRemaining((prev) => prev + mins * 60);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/50">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-600 dark:text-cyan-400 font-bold block">
                ATLAS LIVE FACILITATOR
              </span>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-md">
                {agenda.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              title={soundEnabled ? 'Silenciar avisos' : 'Activar sonido de fin de bloque'}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4 text-cyan-400" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              aria-label="Cerrar facilitador en vivo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {!meetingCompleted ? (
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Topic Progress Breadcrumb */}
            <div className="flex items-center justify-between text-xs text-zinc-400 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <span className="font-mono">
                Tema {currentTopicIndex + 1} de {agenda.topics.length}
              </span>
              <div className="flex items-center gap-1.5">
                {agenda.topics.map((t, idx) => (
                  <button
                    key={t.id}
                    onClick={() => setCurrentTopicIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentTopicIndex
                        ? 'w-6 bg-cyan-500'
                        : idx < currentTopicIndex
                        ? 'w-2 bg-emerald-500'
                        : 'w-2 bg-zinc-700'
                    }`}
                    title={t.title}
                  />
                ))}
              </div>
            </div>

            {/* Main Stage: Active Topic & Giant Timer */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left Column: Big Timer & Controls (5 cols) */}
              <div className="md:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-center">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1">
                  Tiempo Restante del Bloque
                </span>

                {/* Big Digital Clock */}
                <div
                  className={`text-5xl sm:text-6xl font-mono font-extrabold tracking-tight ${
                    isOvertime
                      ? 'text-red-500 animate-pulse'
                      : secondsRemaining < 60
                      ? 'text-amber-400'
                      : 'text-zinc-900 dark:text-cyan-400'
                  }`}
                >
                  {formattedTime}
                </div>

                {isOvertime && (
                  <div className="mt-2 text-xs text-red-400 flex items-center gap-1 font-semibold">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>¡Tiempo agotado para este tema!</span>
                  </div>
                )}

                {/* Progress Bar for this block */}
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full mt-4 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      isOvertime ? 'bg-red-500' : 'bg-cyan-500'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Timer Controls */}
                <div className="mt-5 flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setIsRunning(!isRunning)}
                    className={`gap-1.5 font-bold text-xs ${
                      isRunning
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                    <span>{isRunning ? 'Pausar' : 'Reanudar'}</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddMinutes(2)}
                    className="text-xs font-mono border-zinc-700 text-cyan-400"
                    title="Añadir 2 minutos de prórroga al debate"
                  >
                    +2m
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddMinutes(5)}
                    className="text-xs font-mono border-zinc-700 text-cyan-400"
                    title="Añadir 5 minutos"
                  >
                    +5m
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSecondsRemaining(currentTopic.durationMinutes * 60)}
                    className="text-xs border-zinc-700"
                    title="Reiniciar reloj del tema"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Right Column: Active Topic Details (7 cols) */}
              <div className="md:col-span-7 space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      {currentTopic?.category}
                    </span>
                    <span className="text-xs font-mono text-zinc-500">
                      Presupuesto: {currentTopic?.durationMinutes} min
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                    {currentTopic?.title}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {currentTopic?.description}
                  </p>
                </div>

                {/* Lead Speaker */}
                <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                  <Avatar name={currentTopic?.leadSpeaker || 'Facilitador'} className="h-7 w-7 text-xs" />
                  <div className="text-xs">
                    <span className="text-[10px] text-zinc-400 block font-mono">Facilitador del Bloque</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{currentTopic?.leadSpeaker}</span>
                  </div>
                </div>

                {/* Discussion bullets */}
                {currentTopic?.discussionPoints && currentTopic.discussionPoints.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      Puntos Clave / Preguntas de Enfoque:
                    </span>
                    <ul className="space-y-1 text-xs text-zinc-300">
                      {currentTopic.discussionPoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Deliverable alert */}
                {currentTopic?.expectedDeliverable && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
                    <Target className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                    <div>
                      <strong className="font-semibold text-emerald-200">Decisión / Entregable Clave: </strong>
                      <span>{currentTopic.expectedDeliverable}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Next Topic Preview Banner */}
            {nextTopic && (
              <div className="p-3 rounded-xl bg-zinc-100/70 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="text-zinc-500 font-medium">A continuación:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                    {nextTopic.title} ({nextTopic.durationMinutes} min)
                  </span>
                </div>
                <span className="text-zinc-400 font-mono text-[11px] shrink-0">
                  Líder: {nextTopic.leadSpeaker}
                </span>
              </div>
            )}

            {/* Live Notes / Minutes Taking */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-zinc-400 mb-1 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-cyan-400" />
                Notas y Acuerdos Tomados en Vivo:
              </label>
              <textarea
                value={liveNotes}
                onChange={(e) => setLiveNotes(e.target.value)}
                placeholder="Escribe acuerdos tomados, responsables asignados, fechas de entrega..."
                className="w-full h-24 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
              />
            </div>
          </div>
        ) : (
          /* Meeting Complete Screen */
          <div className="p-8 text-center space-y-4 my-auto">
            <div className="h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-100">¡Reunión Facilitada Exitosamente!</h2>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Se han cubierto los {agenda.topics.length} temas dentro de la estructura prevista con Atlas Facilitator.
            </p>

            {liveNotes && (
              <div className="text-left p-4 rounded-xl bg-zinc-950 border border-zinc-800 max-w-lg mx-auto text-xs font-mono text-zinc-300">
                <span className="text-zinc-500 block mb-1">Notas registradas:</span>
                <p className="whitespace-pre-wrap">{liveNotes}</p>
              </div>
            )}

            <div className="pt-4 flex justify-center gap-3">
              <Button onClick={onClose} className="bg-cyan-500 text-zinc-950 font-bold hover:bg-cyan-400">
                Finalizar y Volver a la Agenda
              </Button>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        {!meetingCompleted && (
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevTopic}
              disabled={currentTopicIndex === 0}
              className="text-xs"
            >
              Tema Anterior
            </Button>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleNextTopic}
                className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs gap-1.5"
              >
                <span>
                  {currentTopicIndex === agenda.topics.length - 1 ? 'Finalizar Reunión' : 'Siguiente Tema'}
                </span>
                <SkipForward className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
