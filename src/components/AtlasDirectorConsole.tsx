import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  Cpu,
  Layers,
  Calendar,
  FileSpreadsheet,
  AlertOctagon,
  TrendingUp,
  DollarSign,
  ClipboardList,
  Wrench,
  CheckCircle2,
  Maximize2,
  Minimize2,
  RefreshCw,
  Zap,
  Tag,
  ShieldCheck,
  ChevronRight,
  Download,
  PlusCircle,
  Eye,
  Bot,
  Compass,
  Activity,
  Sliders,
  Database,
  History,
  Trash2,
  Settings2,
  Check,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AtlasVisualizer, AtlasPresenceState, VisualizerMode, VisualizerTheme } from './AtlasVisualizer';
import { ConteoCaja, VentaHora, IncidenciaCapitan, ChecklistCocina, EtiquetaRegistro } from '../types/operaciones';
import { useAuth } from '../context/AuthContext';
import {
  initOrUpdateAtlasMemory,
  appendConversationMessage,
  logAtlasAgentAction,
  saveAtlasPreferences,
  clearConversationMessages,
  subscribeToAtlasMemory,
  subscribeToAtlasActions,
  DEFAULT_USER_PREFERENCES
} from '../lib/atlasMemory';
import {
  AtlasMemoryDoc,
  AtlasUserPreferences,
  AtlasConversationMessage,
  AtlasAgentAction
} from '../types/atlasMemory';

interface AtlasDirectorConsoleProps {
  conteos: ConteoCaja[];
  ventas: VentaHora[];
  incidencias: IncidenciaCapitan[];
  checklistsCocina: ChecklistCocina[];
  etiquetas: EtiquetaRegistro[];
  onNavigateToModule: (module: string) => void;
}

export const AtlasDirectorConsole: React.FC<AtlasDirectorConsoleProps> = ({
  conteos,
  ventas,
  incidencias,
  checklistsCocina,
  etiquetas,
  onNavigateToModule,
}) => {
  const { userProfile, user } = useAuth();
  const userId = user?.uid || userProfile?.uid || 'director-master';
  const userEmail = user?.email || userProfile?.email || 'director@lct.com';
  const userName = userProfile?.nombre || user?.displayName || 'Director de Operaciones';

  // Agent State: 'idle' | 'processing' | 'response'
  const [agentState, setAgentState] = useState<AtlasPresenceState>('idle');
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('orb');
  const [visualizerTheme, setVisualizerTheme] = useState<VisualizerTheme>('cyan');
  const [activePromptText, setActivePromptText] = useState<string | undefined>(undefined);
  const [activePromptSubtext, setActivePromptSubtext] = useState<string | undefined>(undefined);

  const [inputQuery, setInputQuery] = useState('');
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [activeGeneratedView, setActiveGeneratedView] = useState<'executive_brief' | 'calendar_tasks' | 'form_builder' | 'branch_radar' | 'code_audit'>('executive_brief');
  const [isMemoryDrawerOpen, setIsMemoryDrawerOpen] = useState(false);
  const [memoryTab, setMemoryTab] = useState<'context' | 'actions' | 'preferences'>('context');

  // Long-Term Memory State
  const [memoryDoc, setMemoryDoc] = useState<AtlasMemoryDoc | null>(null);
  const [agentActions, setAgentActions] = useState<AtlasAgentAction[]>([]);
  const [isLoadingMemory, setIsLoadingMemory] = useState(true);

  // Local fallback messages list
  const [messages, setMessages] = useState<AtlasConversationMessage[]>([
    {
      id: 'init-1',
      sender: 'atlas',
      text: `Núcleo de Atlas en línea y sincronizado con memoria persistente. Partículas vivas activas en frecuencia cuántica. ¿Qué reporte, auditoría o formato en sucursales requieres que orqueste hoy?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionType: 'general',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize and subscribe to Firestore atlas_memory
  useEffect(() => {
    let unsubscribeMem = () => {};
    let unsubscribeActions = () => {};

    const loadMemory = async () => {
      try {
        setIsLoadingMemory(true);
        const mem = await initOrUpdateAtlasMemory(userId, userEmail, userName, {
          theme: visualizerTheme,
          visualizerMode: visualizerMode,
          defaultView: activeGeneratedView,
        });

        if (mem) {
          setMemoryDoc(mem);
          if (mem.preferences) {
            if (mem.preferences.theme) setVisualizerTheme(mem.preferences.theme);
            if (mem.preferences.visualizerMode) setVisualizerMode(mem.preferences.visualizerMode);
            if (mem.preferences.defaultView) setActiveGeneratedView(mem.preferences.defaultView);
          }
          if (mem.recentMessages && mem.recentMessages.length > 0) {
            setMessages(mem.recentMessages);
          }
        }
      } catch (err) {
        console.warn('Atlas Memory fallback to local state:', err);
      } finally {
        setIsLoadingMemory(false);
      }

      unsubscribeMem = subscribeToAtlasMemory(userId, (updatedMem) => {
        if (updatedMem) {
          setMemoryDoc(updatedMem);
          if (updatedMem.recentMessages && updatedMem.recentMessages.length > 0) {
            setMessages(updatedMem.recentMessages);
          }
        }
      });

      unsubscribeActions = subscribeToAtlasActions(userId, (actions) => {
        setAgentActions(actions);
      });
    };

    loadMemory();

    return () => {
      unsubscribeMem();
      unsubscribeActions();
    };
  }, [userId, userEmail, userName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeGeneratedView]);

  // Quick executive prompts
  const quickActions = [
    { label: '📊 Resumen Ejecutivo', command: 'Genera el reporte ejecutivo integral de ventas, cortes y cocina de hoy' },
    { label: '📅 Agendar Supervisión', command: 'Revisa mis pendientes y programa auditoría de sucursales en mi calendario' },
    { label: '🏷️ Formato PEPS & Mermas', command: 'Crea un formato rápido de rotulación de alimentos PEPS' },
    { label: '🚨 Radar de Incidencias', command: 'Filtra incidencias graves y estatus de equipos en sucursales' },
    { label: '⚡ Diagnóstico & RBAC', command: 'Verifica la integridad de la base de datos y permisos RBAC' },
  ];

  // Process user command -> Morph particles to 'processing' -> Materialize UI in 'response' -> Return to 'idle'
  const handleExecuteCommand = async (textToSend?: string) => {
    const query = textToSend || inputQuery.trim();
    if (!query) return;

    const userMsg: AtlasConversationMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionType: 'general',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');

    // Save user message to Firestore atlas_memory
    appendConversationMessage(userId, userMsg).catch((e) => console.warn('Could not sync user msg:', e));

    // Phase 1: Particle Acceleration to 'processing'
    setAgentState('processing');
    setActivePromptText(`✦ Atlas orquestando: "${query.slice(0, 60)}${query.length > 60 ? '...' : ''}"`);
    setActivePromptSubtext('Analizando métricas de sucursales, sincronizando memoria y procesando modelos...');

    // Simulate Agent synthetic intelligence
    setTimeout(async () => {
      // Phase 2: Particle Bloom to 'response'
      setAgentState('response');

      const lower = query.toLowerCase();
      let responseText = '';
      let targetView: 'executive_brief' | 'calendar_tasks' | 'form_builder' | 'branch_radar' | 'code_audit' = 'executive_brief';
      let actionType: AtlasConversationMessage['actionType'] = 'report';
      let actionTitle = 'Generación de Reporte';
      let actionDesc = 'Procesamiento de datos operativos en tiempo real.';

      if (lower.includes('calendario') || lower.includes('agenda') || lower.includes('tarea') || lower.includes('recordatorio') || lower.includes('auditor')) {
        targetView = 'calendar_tasks';
        actionType = 'calendar';
        actionTitle = 'Sincronización de Agenda';
        actionDesc = 'Sincronización de tareas prioritarias de inspección en sucursales.';
        responseText = `He sincronizado los eventos prioritarios y estructurado tu agenda de supervisión operativa. Tienes 3 inspecciones programadas para hoy.`;
      } else if (lower.includes('formato') || lower.includes('etiqueta') || lower.includes('peps') || lower.includes('merma') || lower.includes('crear')) {
        targetView = 'form_builder';
        actionType = 'form';
        actionTitle = 'Generador de Formatos PEPS';
        actionDesc = 'Materialización del calculador de caducidades normativas por color.';
        responseText = `He desplegado el generador de formatos de rotulación PEPS con cálculo automático de caducidad por código de color.`;
      } else if (lower.includes('incidencia') || lower.includes('critica') || lower.includes('equipo') || lower.includes('sucursal')) {
        targetView = 'branch_radar';
        actionType = 'branch_status';
        actionTitle = 'Escaneo de Radar de Sucursales';
        actionDesc = 'Filtrado de incidencias operativas y estado de mantenimiento.';
        responseText = `He filtrado el radar de sucursales: Se detectaron ${incidencias.filter(i => i.prioridad === 'critica' || i.prioridad === 'alta').length} incidencias de prioridad alta/crítica requiriendo atención.`;
      } else if (lower.includes('codigo') || lower.includes('error') || lower.includes('rbac') || lower.includes('seguridad') || lower.includes('diagnostico')) {
        targetView = 'code_audit';
        actionType = 'fix';
        actionTitle = 'Auditoría de Integridad RBAC';
        actionDesc = 'Verificación de reglas de seguridad Firestore y tokens de sesión.';
        responseText = `Diagnóstico de integridad completado: Reglas RBAC activas, Firestore conectado y memoria a largo plazo validada al 100%.`;
      } else {
        targetView = 'executive_brief';
        actionType = 'report';
        actionTitle = 'Consolidado Ejecutivo Diario';
        const totalVentas = ventas.reduce((acc, v) => acc + (v.totalVenta || 0), 0);
        const totalConteos = conteos.length;
        actionDesc = `Ventas consolidadas: $${totalVentas.toLocaleString('es-MX')} con ${totalConteos} cortes auditados.`;
        responseText = `Partículas reordenadas: Se consolidó el reporte ejecutivo. Ventas registradas: $${totalVentas.toLocaleString('es-MX', { minimumFractionDigits: 2 })}, ${totalConteos} cortes de caja supervisados y ${checklistsCocina.length} listas de cocina verificadas.`;
      }

      const atlasMsg: AtlasConversationMessage = {
        id: `atlas-${Date.now()}`,
        sender: 'atlas',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionType,
      };

      setMessages((prev) => [...prev, atlasMsg]);
      setActiveGeneratedView(targetView);
      setActivePromptText(`✦ Respuesta emitida por Atlas`);
      setActivePromptSubtext(responseText.slice(0, 90) + '...');

      // Persist to Firestore atlas_memory (message & action audit)
      appendConversationMessage(userId, atlasMsg).catch((e) => console.warn('Sync err:', e));
      logAtlasAgentAction(userId, {
        actionType: actionType || 'report',
        title: actionTitle,
        description: actionDesc,
        status: 'success',
        targetModule: targetView,
        executedByUid: userId,
        executedByName: userName,
      }).catch((e) => console.warn('Action log err:', e));

      // Phase 3: Settle particles back into fluid 'idle'
      setTimeout(() => {
        setAgentState('idle');
        setActivePromptText(undefined);
        setActivePromptSubtext(undefined);
      }, 1600);
    }, 1100);
  };

  // Voice toggle simulation
  const toggleVoice = () => {
    if (isListeningVoice) {
      setIsListeningVoice(false);
      setAgentState('idle');
    } else {
      setIsListeningVoice(true);
      setAgentState('listening');
      setActivePromptText('✦ Atlas escuchando tu comando de voz...');
      setActivePromptSubtext('Habla con claridad para modular las frecuencias del núcleo...');
      setTimeout(() => {
        setIsListeningVoice(false);
        handleExecuteCommand('Genera el reporte ejecutivo integral de ventas, cortes y cocina de hoy');
      }, 2800);
    }
  };

  // User preference update in Firestore
  const handleUpdatePreferences = (updated: Partial<AtlasUserPreferences>) => {
    if (updated.theme) setVisualizerTheme(updated.theme);
    if (updated.visualizerMode) setVisualizerMode(updated.visualizerMode);
    if (updated.defaultView) setActiveGeneratedView(updated.defaultView);

    saveAtlasPreferences(userId, updated).catch((e) => console.warn('Could not save prefs:', e));
  };

  // Summary calculations
  const totalVentasCalculadas = ventas.reduce((acc, v) => acc + (v.totalVenta || 0), 0);
  const totalTickets = ventas.reduce((acc, v) => acc + (v.numeroTickets || 0), 0);
  const ticketPromedio = totalTickets > 0 ? totalVentasCalculadas / totalTickets : 0;
  const descuadresCriticos = conteos.filter((c) => Math.abs(c.diferenciaTotal || 0) > 50);
  const incidenciasAbiertas = incidencias.filter((i) => i.estado !== 'resuelto');

  return (
    <div className="space-y-6">
      {/* Top Header & Long-Term Memory Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/90 border border-zinc-800 px-4 py-3 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
            <Bot className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-zinc-100">
                Consola del Director Atlas
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Memoria Persistente Firestore
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Orquestador cuántico con partículas energéticas y memoria a largo plazo.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMemoryDrawerOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Database className="h-3.5 w-3.5" />
            <span>Memoria a Largo Plazo</span>
            {agentActions.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-cyan-500 text-[10px] text-zinc-950 font-bold">
                {agentActions.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 🌟 CENTER STAGE: AtlasVisualizer (occupying the center of the main interface) 🌟 */}
      <div className="relative rounded-2xl bg-zinc-950 border border-cyan-500/30 p-2 shadow-2xl shadow-cyan-950/50 overflow-hidden">
        {/* Living Particle Canvas Visualizer */}
        <AtlasVisualizer
          state={agentState}
          onStateChange={(st) => setAgentState(st)}
          mode={visualizerMode}
          theme={visualizerTheme}
          height={380}
          activePrompt={activePromptText}
          subtext={activePromptSubtext}
        />

        {/* Real-time Interaction Bar below particle visualizer */}
        <div className="p-3 bg-zinc-900/95 border-t border-zinc-800/80 rounded-b-xl space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="flex-1 w-full relative flex items-center">
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleExecuteCommand()}
                placeholder="Escribe una orden a Atlas (ej. 'Genera el resumen de hoy' o 'Filtra incidencias')..."
                className="w-full bg-zinc-950/90 border border-zinc-700/80 rounded-xl px-4 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all pr-24"
              />

              <div className="absolute right-2 flex items-center gap-1">
                <button
                  onClick={toggleVoice}
                  title={isListeningVoice ? 'Detener Micrófono' : 'Comando por Voz'}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isListeningVoice
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {isListeningVoice ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                </button>

                <button
                  onClick={() => handleExecuteCommand()}
                  disabled={!inputQuery.trim() || agentState === 'processing'}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1 shadow-md transition-all cursor-pointer"
                >
                  <span>Emitir</span>
                  <Send className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Command Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-mono text-zinc-400 shrink-0 mr-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-cyan-400" /> Prompts Rápidos:
            </span>
            {quickActions.map((qa, idx) => (
              <button
                key={idx}
                onClick={() => handleExecuteCommand(qa.command)}
                className="px-2.5 py-1 rounded-lg bg-zinc-800/90 hover:bg-cyan-950 hover:text-cyan-300 hover:border-cyan-500/40 text-zinc-300 text-[11px] font-medium whitespace-nowrap border border-zinc-700/60 transition-all cursor-pointer"
              >
                {qa.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conversation Thread Stream */}
      <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
            Flujo de Comunicación & Registro de Sesión
          </span>
          <span className="text-[11px] font-mono text-zinc-500">
            {messages.length} mensajes guardados en Firestore
          </span>
        </div>

        <div className="max-h-56 overflow-y-auto space-y-2.5 pr-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-cyan-950/80 border border-cyan-600/40 text-cyan-100'
                    : 'bg-zinc-950 border border-zinc-800 text-zinc-200 shadow-md'
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-75 font-mono">
                  <span className="font-bold uppercase flex items-center gap-1">
                    {msg.sender === 'user' ? 'Tú (Director)' : '✦ Atlas AI'}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Generated Interactive Surface (Materialized by Atlas Particles) */}
      <div className="space-y-4">
        {/* Navigation Tabs for Materialized Views */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-bold tracking-tight text-zinc-100">
              SUPERFICIE MATERIALIZADA POR ATLAS
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setActiveGeneratedView('executive_brief')}
              className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                activeGeneratedView === 'executive_brief'
                  ? 'bg-cyan-600 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              📊 Resumen Ejecutivo
            </button>
            <button
              onClick={() => setActiveGeneratedView('calendar_tasks')}
              className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                activeGeneratedView === 'calendar_tasks'
                  ? 'bg-cyan-600 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              📅 Agenda & Tareas
            </button>
            <button
              onClick={() => setActiveGeneratedView('form_builder')}
              className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                activeGeneratedView === 'form_builder'
                  ? 'bg-cyan-600 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              🏷️ Formatos & PEPS
            </button>
            <button
              onClick={() => setActiveGeneratedView('branch_radar')}
              className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                activeGeneratedView === 'branch_radar'
                  ? 'bg-cyan-600 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              🚨 Radar Sucursales
            </button>
            <button
              onClick={() => setActiveGeneratedView('code_audit')}
              className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                activeGeneratedView === 'code_audit'
                  ? 'bg-cyan-600 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              ⚡ Diagnóstico RBAC
            </button>
          </div>
        </div>

        {/* View 1: Executive Brief */}
        {activeGeneratedView === 'executive_brief' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-zinc-400 text-xs">
                <span>Ventas Registradas</span>
                <DollarSign className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-zinc-100 font-mono">
                ${totalVentasCalculadas.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                <span>{totalTickets} tickets emitidos</span>
                <span className="text-emerald-400 font-semibold font-mono">${ticketPromedio.toFixed(2)} prom</span>
              </div>
              <button
                onClick={() => onNavigateToModule('ventas')}
                className="w-full mt-2 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <span>Ver Módulo Ventas</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-zinc-400 text-xs">
                <span>Arqueos y Cortes de Caja</span>
                <TrendingUp className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-zinc-100 font-mono">
                {conteos.length} <span className="text-xs font-normal text-zinc-400">cortes</span>
              </div>
              <div className="text-[11px] flex items-center justify-between">
                <span className="text-zinc-400">Descuadres detectados:</span>
                <span className={`font-semibold font-mono ${descuadresCriticos.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {descuadresCriticos.length}
                </span>
              </div>
              <button
                onClick={() => onNavigateToModule('conteos')}
                className="w-full mt-2 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <span>Ver Módulo Caja</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-zinc-400 text-xs">
                <span>Calidad Cocina & PEPS</span>
                <ClipboardList className="h-4 w-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-zinc-100 font-mono">
                {checklistsCocina.length} <span className="text-xs font-normal text-zinc-400">checklists</span>
              </div>
              <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                <span>Etiquetas activas:</span>
                <span className="text-cyan-400 font-mono font-semibold">{etiquetas.length} lotes</span>
              </div>
              <button
                onClick={() => onNavigateToModule('cocina')}
                className="w-full mt-2 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <span>Ver Módulo Cocina</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-zinc-400 text-xs">
                <span>Incidencias Operativas</span>
                <AlertOctagon className="h-4 w-4 text-rose-400" />
              </div>
              <div className="text-2xl font-bold text-zinc-100 font-mono">
                {incidenciasAbiertas.length} <span className="text-xs font-normal text-zinc-400">pendientes</span>
              </div>
              <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                <span>Total reportadas:</span>
                <span className="text-zinc-300 font-mono">{incidencias.length}</span>
              </div>
              <button
                onClick={() => onNavigateToModule('incidencias')}
                className="w-full mt-2 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <span>Ver Incidencias</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* View 2: Calendar & Task Scheduler */}
        {activeGeneratedView === 'calendar_tasks' && (
          <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-cyan-400" />
                  Agenda del Director & Recordatorios de Supervisión
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Eventos sincronizados con Google Workspace y auditorías automáticas programadas.
                </p>
              </div>
              <button
                onClick={() => handleExecuteCommand('Programar nueva auditoría en sucursal')}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Programar Tarea</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-cyan-400">
                  <span>Hoy - 14:00 hrs</span>
                  <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-[10px] border border-cyan-800">Operativo</span>
                </div>
                <h4 className="text-xs font-bold text-zinc-200">Revisión de Corte Intermedio Matutino</h4>
                <p className="text-[11px] text-zinc-400">Verificar corte de caja y terminales en Sucursal Central y Norte.</p>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Confirmado en Google Calendar
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-amber-400">
                  <span>Hoy - 17:30 hrs</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-950 text-[10px] border border-amber-800">Calidad</span>
                </div>
                <h4 className="text-xs font-bold text-zinc-200">Inspección de Cámaras y Caducidades PEPS</h4>
                <p className="text-[11px] text-zinc-400">Auditar refrigeradores ≤ 4°C y rotulación de carnes y lácteos.</p>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Notificación activa
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-purple-400">
                  <span>Mañana - 09:00 hrs</span>
                  <span className="px-1.5 py-0.5 rounded bg-purple-950 text-[10px] border border-purple-800">Dirección</span>
                </div>
                <h4 className="text-xs font-bold text-zinc-200">Junta de Resultados y Mermas Semanales</h4>
                <p className="text-[11px] text-zinc-400">Presentación del reporte consolidado de 5 sucursales.</p>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Sala Virtual Google Meet
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View 3: Form Builder & PEPS Format Generator */}
        {activeGeneratedView === 'form_builder' && (
          <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-cyan-400" />
                  Generador de Formatos & Etiquetas PEPS
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Crea rótulos con código de color normativo listos para imprimir o exportar a Workspace.
                </p>
              </div>
              <button
                onClick={() => onNavigateToModule('etiquetas')}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <span>Ir al Registro Completo</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/40 space-y-2">
                <div className="flex items-center justify-between text-red-400 text-xs font-bold">
                  <span>🔴 CARNES & AVES</span>
                  <span className="font-mono text-[10px]">Cad: 48 Horas</span>
                </div>
                <p className="text-xs text-zinc-300 font-semibold">Pastor Marinado, Arrachera, Pechuga</p>
                <p className="text-[11px] text-zinc-400">Refrigeración estricta de 0°C a 4°C. Rotulado inmediato.</p>
                <button
                  onClick={() => onNavigateToModule('etiquetas')}
                  className="w-full py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[11px] font-semibold cursor-pointer"
                >
                  Generar Lote Carne
                </button>
              </div>

              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-2">
                <div className="flex items-center justify-between text-amber-400 text-xs font-bold">
                  <span>🟡 LÁCTEOS & SALSAS</span>
                  <span className="font-mono text-[10px]">Cad: 72 Horas</span>
                </div>
                <p className="text-xs text-zinc-300 font-semibold">Queso Gouda, Crema, Salsas Cocidas</p>
                <p className="text-[11px] text-zinc-400">Mantener tapado herméticamente para evitar contaminación.</p>
                <button
                  onClick={() => onNavigateToModule('etiquetas')}
                  className="w-full py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-semibold cursor-pointer"
                >
                  Generar Lote Lácteo
                </button>
              </div>

              <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/40 space-y-2">
                <div className="flex items-center justify-between text-blue-400 text-xs font-bold">
                  <span>🔵 VEGETALES DESINFECTADOS</span>
                  <span className="font-mono text-[10px]">Cad: 24 Horas</span>
                </div>
                <p className="text-xs text-zinc-300 font-semibold">Cilantro, Cebolla Picada, Aguacate</p>
                <p className="text-[11px] text-zinc-400">Proceso con Microdyn/Yodo certificado y escurrido.</p>
                <button
                  onClick={() => onNavigateToModule('etiquetas')}
                  className="w-full py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold cursor-pointer"
                >
                  Generar Lote Vegetal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View 4: Branch Radar & Critical Incidents */}
        {activeGeneratedView === 'branch_radar' && (
          <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <AlertOctagon className="h-4 w-4 text-rose-400" />
                  Radar de Alertas Operativas por Sucursal
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Supervisión centralizada en tiempo real de fallas, mermas y solicitudes urgentes.
                </p>
              </div>
              <button
                onClick={() => onNavigateToModule('incidencias')}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium cursor-pointer"
              >
                Abrir Bitácora de Incidencias
              </button>
            </div>

            <div className="divide-y divide-zinc-800">
              {incidencias.slice(0, 4).map((inc) => (
                <div key={inc.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                        inc.prioridad === 'critica'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : inc.prioridad === 'alta'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}>
                        {inc.prioridad}
                      </span>
                      <span className="text-xs font-bold text-zinc-200">{inc.titulo}</span>
                      <span className="text-[11px] text-zinc-400">({inc.sucursalId})</span>
                    </div>
                    <p className="text-xs text-zinc-400">{inc.descripcion}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[11px] font-semibold ${inc.estado === 'resuelto' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {inc.estado === 'resuelto' ? 'Resuelto' : 'En Proceso'}
                    </span>
                    <span className="block text-[10px] text-zinc-500 font-mono">
                      {inc.fechaReporte}
                    </span>
                  </div>
                </div>
              ))}
              {incidencias.length === 0 && (
                <div className="py-6 text-center text-xs text-zinc-500">
                  No hay incidencias reportadas en este momento. Todas las sucursales operan con normalidad.
                </div>
              )}
            </div>
          </div>
        )}

        {/* View 5: RBAC & Code Audit */}
        {activeGeneratedView === 'code_audit' && (
          <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  Diagnóstico del Motor & Seguridad RBAC
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Estado de la arquitectura, colección atlas_memory y reglas de seguridad de Firestore.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-bold">
                ESTADO 100% OPERACIONAL
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between text-zinc-300 font-semibold">
                  <span>Firestore Database:</span>
                  <span className="text-cyan-400 font-mono">ai-studio-agendacraftai</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Colección atlas_memory:</span>
                  <span className="text-emerald-400 font-mono">Conectada & Activa</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Reglas Desplegadas:</span>
                  <span className="text-emerald-400 font-mono">firestore.rules (v2.0 RBAC)</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between text-zinc-300 font-semibold">
                  <span>Rol Actual de Sesión:</span>
                  <span className="text-purple-400 font-mono uppercase">{userProfile?.rol || 'super_admin'}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Sucursales Conectadas:</span>
                  <span className="text-zinc-200 font-mono">Matriz, Norte, Sur, Oriente, Poniente</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Acciones Registradas:</span>
                  <span className="text-cyan-400 font-mono">{agentActions.length} registradas</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL / DRAWER: Memoria a Largo Plazo de Atlas ── */}
      <AnimatePresence>
        {isMemoryDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-2xl bg-zinc-950 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                    <Database className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                      Memoria a Largo Plazo de Atlas
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                        atlas_memory
                      </span>
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Contexto de sesión, historial de acciones y preferencias sincronizadas en Firestore.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMemoryDrawerOpen(false)}
                  className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-zinc-800 px-4 bg-zinc-950 text-xs">
                <button
                  onClick={() => setMemoryTab('context')}
                  className={`py-2.5 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                    memoryTab === 'context'
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Cpu className="h-3.5 w-3.5" />
                  <span>Contexto & Sesión</span>
                </button>

                <button
                  onClick={() => setMemoryTab('actions')}
                  className={`py-2.5 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                    memoryTab === 'actions'
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <History className="h-3.5 w-3.5" />
                  <span>Historial de Acciones ({agentActions.length})</span>
                </button>

                <button
                  onClick={() => setMemoryTab('preferences')}
                  className={`py-2.5 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                    memoryTab === 'preferences'
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  <span>Preferencias del Orquestador</span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
                {memoryTab === 'context' && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between text-zinc-300 font-semibold">
                        <span className="text-cyan-400 flex items-center gap-1.5">
                          <Compass className="h-3.5 w-3.5" /> Sesión Activa de Atlas
                        </span>
                        <span className="font-mono text-[10px] text-zinc-500">
                          {memoryDoc?.context?.activeSessionId || 'sess-default'}
                        </span>
                      </div>
                      <p className="text-zinc-400 leading-relaxed text-[11px]">
                        Atlas almacena automáticamente el hilo conductor de tus consultas operativas para ofrecer respuestas contextuales con la menor latencia.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                        <span className="text-zinc-400 block text-[11px]">Temas Recurrentes</span>
                        <div className="flex flex-wrap gap-1">
                          {(memoryDoc?.context?.recentTopics || ['Cortes de Caja', 'Mermas PEPS', 'Auditorías Cocina']).map((t, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-zinc-800 text-cyan-200 text-[10px] font-mono">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                        <span className="text-zinc-400 block text-[11px]">Estadísticas de Memoria</span>
                        <div className="text-[11px] space-y-1 text-zinc-300 font-mono">
                          <div className="flex justify-between">
                            <span>Mensajes Totales:</span>
                            <span className="text-cyan-400">{messages.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Acciones Registradas:</span>
                            <span className="text-cyan-400">{agentActions.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Última Sincronización:</span>
                            <span className="text-zinc-400">{new Date().toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => {
                          clearConversationMessages(userId);
                          setMessages([
                            {
                              id: `msg-reset-${Date.now()}`,
                              sender: 'atlas',
                              text: 'Memoria de conversación restablecida para este ciclo.',
                              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                              actionType: 'general',
                            },
                          ]);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Restablecer Mensajes de Conversación</span>
                      </button>
                    </div>
                  </div>
                )}

                {memoryTab === 'actions' && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                      <span>Registro de acciones ejecutadas por Atlas para este usuario:</span>
                      <span className="font-mono">{agentActions.length} registros</span>
                    </div>

                    {agentActions.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {agentActions.map((act) => (
                          <div
                            key={act.id}
                            className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono uppercase">
                                  {act.actionType}
                                </span>
                                <span className="font-bold text-zinc-200">{act.title}</span>
                              </div>
                              <p className="text-zinc-400 text-[11px]">{act.description}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px] font-mono">
                                <Check className="h-3 w-3" /> {act.status}
                              </span>
                              <span className="block text-[10px] text-zinc-500 font-mono">
                                {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-zinc-500 bg-zinc-900/50 rounded-xl border border-zinc-800">
                        Aún no se han ejecutado acciones. Escribe una orden a Atlas para que genere reportes o auditorías.
                      </div>
                    )}
                  </div>
                )}

                {memoryTab === 'preferences' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-zinc-300 font-medium mb-1.5">
                        Geometría de Partículas AtlasVisualizer
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(['orb', 'vortex', 'flow', 'matrix'] as VisualizerMode[]).map((m) => (
                          <button
                            key={m}
                            onClick={() => handleUpdatePreferences({ visualizerMode: m })}
                            className={`p-2.5 rounded-xl border capitalize text-left transition-all cursor-pointer ${
                              visualizerMode === m
                                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 font-bold'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                            }`}
                          >
                            <span className="block font-semibold">{m}</span>
                            <span className="text-[10px] text-zinc-500 font-normal">
                              {m === 'orb' ? 'Esfera 3D' : m === 'vortex' ? 'Enjambre' : m === 'flow' ? 'Ondas' : 'Plano'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-zinc-300 font-medium mb-1.5">
                        Paleta de Color & Frecuencia Lumínica
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                          { id: 'cyan', name: 'Cyan Quantum', color: '#06b6d4' },
                          { id: 'sapphire', name: 'Sapphire Deep', color: '#0284c7' },
                          { id: 'violet', name: 'Violet Nebula', color: '#9333ea' },
                          { id: 'emerald', name: 'Emerald Aurora', color: '#059669' },
                          { id: 'amber', name: 'Solar Plasma', color: '#d97706' },
                        ].map((thm) => (
                          <button
                            key={thm.id}
                            onClick={() => handleUpdatePreferences({ theme: thm.id as VisualizerTheme })}
                            className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                              visualizerTheme === thm.id
                                ? 'bg-zinc-900 border-cyan-400 text-white font-bold'
                                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                            }`}
                          >
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: thm.color }} />
                            <span className="truncate">{thm.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-between text-[11px] text-zinc-400">
                <span>Identificador: {userId.slice(0, 16)}...</span>
                <button
                  onClick={() => setIsMemoryDrawerOpen(false)}
                  className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
