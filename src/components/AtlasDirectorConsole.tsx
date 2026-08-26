import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  ChevronDown,
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
  Clock,
  Globe,
  FileCode2,
  Search,
  Filter,
  BookOpen,
  Terminal,
  CheckCheck,
  ListFilter,
  Copy,
  Bell,
  BellRing,
  Video,
  ExternalLink,
  CalendarPlus,
  AlertTriangle,
  Users,
  CheckCircle,
  X,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AtlasVisualizer, AtlasPresenceState, VisualizerMode, VisualizerTheme } from './AtlasVisualizer';
import { ConteoCaja, VentaHora, IncidenciaCapitan, ChecklistCocina, EtiquetaRegistro } from '../types/operaciones';
import { useAuth } from '../context/AuthContext';
import { useAtlasMemory } from '../hooks/useAtlasMemory';
import {
  AtlasMemoryDoc,
  AtlasUserPreferences,
  AtlasConversationMessage,
  AtlasAgentAction
} from '../types/atlasMemory';
import {
  ATLAS_LOCALE_DATABASE,
  ATLAS_DOCFX_CONFIG,
  ATLAS_DIATAXIS_SAMPLE_AUDIT,
  ATLAS_OVERRIDE_SET,
  searchAtlasLocales
} from '../lib/atlasLocaleData';
import { LocaleCultureEntry } from '../types/atlasKnowledge';
import {
  getStoredCalendarToken,
  clearCalendarToken,
  requestGoogleCalendarAccess,
  listUpcomingEvents,
  createGoogleCalendarEvent,
  createOperationalReminder,
  generateSmartMeetingSuggestions,
  GoogleCalendarEvent,
  SmartMeetingSuggestion
} from '../lib/googleCalendarService';

interface AtlasDirectorConsoleProps {
  conteos: ConteoCaja[];
  ventas: VentaHora[];
  incidencias: IncidenciaCapitan[];
  checklistsCocina: ChecklistCocina[];
  etiquetas: EtiquetaRegistro[];
  onNavigateToModule?: (module: string) => void;
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

  // Agent Visual & Kinematic State: 'idle' | 'processing' | 'response' | 'listening'
  const [agentState, setAgentState] = useState<AtlasPresenceState>('idle');
  const [activePromptText, setActivePromptText] = useState<string | undefined>(undefined);
  const [activePromptSubtext, setActivePromptSubtext] = useState<string | undefined>(undefined);

  const [inputQuery, setInputQuery] = useState('');
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [activeGeneratedView, setActiveGeneratedView] = useState<'calendar_tasks' | 'form_builder' | 'branch_radar' | 'code_audit' | 'culture_matrix' | 'docfx_validator'>('calendar_tasks');
  const [isMemoryDrawerOpen, setIsMemoryDrawerOpen] = useState(false);
  const [memoryTab, setMemoryTab] = useState<'context' | 'actions' | 'preferences'>('context');

  // Executive Clean View & Voice Settings
  const [isVoiceOutputEnabled, setIsVoiceOutputEnabled] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [showDeepTools, setShowDeepTools] = useState<boolean>(false);
  const [isMinimalMode, setIsMinimalMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('atlas_director_minimal_mode') === 'true';
    } catch {
      return false;
    }
  });
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const recognitionRef = useRef<any>(null);

  // Culture & DocFX Engine State
  const [selectedLocaleCode, setSelectedLocaleCode] = useState<string>('es');
  const [localeSearchQuery, setLocaleSearchQuery] = useState<string>('');
  const [activeDocItemKey, setActiveDocItemKey] = useState<'classDocItem' | 'structDocItem' | 'interfaceDocItem' | 'enumDocItem'>('classDocItem');
  const [diataxisFilterRole, setDiataxisFilterRole] = useState<'all' | 'tutorial' | 'how-to' | 'explanation' | 'reference'>('all');
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Google Calendar Integration State
  const [gcalToken, setGcalToken] = useState<string | null>(() => getStoredCalendarToken());
  const [gcalEvents, setGcalEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isLoadingGcalEvents, setIsLoadingGcalEvents] = useState(false);
  const [isConnectingGcal, setIsConnectingGcal] = useState(false);
  const [gcalError, setGcalError] = useState<string | null>(null);
  const [gcalSuccessMsg, setGcalSuccessMsg] = useState<string | null>(null);
  const [isCustomMeetingOpen, setIsCustomMeetingOpen] = useState(false);
  const [customMeetingForm, setCustomMeetingForm] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '11:00',
    durationMinutes: 45,
    description: '',
    location: 'Google Meet / En Línea',
    attendees: 'director@lct.com, capitanes@lct.com',
    withMeetLink: true,
  });

  // Proactive Alerts from Firestore Data State
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());
  const [showProactiveAlertsModal, setShowProactiveAlertsModal] = useState(false);

  // 🔊 Audio Speech Synthesis (Atlas / J.A.R.V.I.S. Executive Voice en Español)
  const speakText = useCallback((textToSpeak: string) => {
    if (!('speechSynthesis' in window) || !isVoiceOutputEnabled) return;
    
    try {
      window.speechSynthesis.cancel();
      // Clean emojis, markdown symbols, bullets, asterisks, URLs and formatting for smooth natural speech
      const clean = textToSpeak
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F0F5}]/gu, '')
        .replace(/^[#\*\-•\d\.\s]+/gm, '')
        .replace(/[*_~`>#]/g, '')
        .replace(/https?:\/\/\S+/g, 'enlace web')
        .replace(/[\(\)\[\]\{\}]/g, '')
        .replace(/\$/g, ' pesos ')
        .replace(/\n+/g, '. ')
        .replace(/\s{2,}/g, ' ')
        .trim();

      if (!clean) return;

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = 'es-MX';
      utterance.rate = 1.02;
      utterance.pitch = 0.98; // Refined executive cadence (J.A.R.V.I.S. style)

      const voices = window.speechSynthesis.getVoices();
      // Prioritize natural Spanish voices (es-MX, es-ES, es-US, Google español, Microsoft Raul / Jorge / Alvaro)
      const esVoice = voices.find(
        (v) =>
          (v.lang.startsWith('es') && (v.name.toLowerCase().includes('raul') || v.name.toLowerCase().includes('jorge') || v.name.toLowerCase().includes('alvaro') || v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('mexic') || v.name.toLowerCase().includes('sabina') || v.name.toLowerCase().includes('paul'))) ||
          v.lang === 'es-MX' ||
          v.lang.startsWith('es')
      );
      if (esVoice) utterance.voice = esVoice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      setIsSpeaking(false);
    }
  }, [isVoiceOutputEnabled]);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Atlas Long-Term Memory Firestore Hook
  const initialPrefs = useMemo(() => ({
    theme: 'cyan' as const,
    visualizerMode: 'orb' as const,
    defaultView: 'calendar_tasks' as const
  }), []);

  const {
    memoryDoc,
    preferences: atlasPreferences,
    context: atlasContext,
    messages,
    agentActions,
    isLoading: isLoadingMemory,
    savePreferences,
    saveContext,
    sendMessage,
    addMessage,
    clearHistory,
    recordAction
  } = useAtlasMemory({
    userId,
    userEmail,
    userName,
    initialPreferences: initialPrefs
  });

  const visualizerTheme = atlasPreferences?.theme || 'cyan';
  const visualizerMode = atlasPreferences?.visualizerMode || 'orb';

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const initialViewLoadedRef = useRef(false);

  // 1. Smart meeting suggestions computed from branch data
  const smartMeetingSuggestions = useMemo(() => {
    return generateSmartMeetingSuggestions(incidencias, conteos, checklistsCocina);
  }, [incidencias, conteos, checklistsCocina]);

  // 2. Proactive operational alerts computed from Firestore collections
  const proactiveAlerts = useMemo(() => {
    const alerts: Array<{
      id: string;
      type: 'incidencia_critica' | 'caja_descuadre' | 'cocina_peps';
      title: string;
      description: string;
      branchName: string;
      branchId?: string;
      priority: 'critica' | 'alta' | 'media';
      timestamp: string;
      sourceData: any;
      suggestedMeetingTitle: string;
    }> = [];

    // Incidencias abiertas críticas o altas
    incidencias
      .filter((i) => (i.prioridad === 'critica' || i.prioridad === 'alta') && i.estado !== 'resuelta' && (i as any).estado !== 'resuelto')
      .forEach((inc) => {
        alerts.push({
          id: `alert-inc-${inc.id}`,
          type: 'incidencia_critica',
          title: `Incidencia ${inc.prioridad.toUpperCase()}: ${inc.titulo}`,
          description: inc.descripcion,
          branchName: inc.sucursalNombre || 'Sucursal Principal',
          branchId: inc.sucursalId,
          priority: inc.prioridad === 'critica' ? 'critica' : 'alta',
          timestamp: inc.fecha || new Date().toISOString(),
          sourceData: inc,
          suggestedMeetingTitle: `Mesa de Crisis: ${inc.titulo} (${inc.sucursalNombre || 'Sucursal'})`,
        });
      });

    // Descuadres de caja
    conteos
      .filter((c) => c.estado === 'descuadre' || Math.abs(c.diferencia || (c as any).diferenciaTotal || 0) > 50)
      .forEach((caja) => {
        const diff = Math.abs(caja.diferencia || (caja as any).diferenciaTotal || 0);
        alerts.push({
          id: `alert-caja-${caja.id}`,
          type: 'caja_descuadre',
          title: `Descuadre de Caja: $${diff.toFixed(2)} (${caja.turno})`,
          description: `El turno ${caja.turno} en ${caja.sucursalNombre || 'sucursal'} reportó diferencia de $${diff.toFixed(2)}.`,
          branchName: caja.sucursalNombre || 'Sucursal',
          branchId: caja.sucursalId,
          priority: diff > 500 ? 'alta' : 'media',
          timestamp: caja.fecha || new Date().toISOString(),
          sourceData: caja,
          suggestedMeetingTitle: `Aclaración de Corte de Caja - ${caja.sucursalNombre || 'Sucursal'} (${caja.turno})`,
        });
      });

    // Cocina PEPS
    checklistsCocina
      .filter((ck) => ck.rotulacionPEPS === false || ck.aceiteFreidorasCalidad === 'cambiar')
      .forEach((ck) => {
        alerts.push({
          id: `alert-peps-${ck.id}`,
          type: 'cocina_peps',
          title: `Alerta de Inocuidad Cocina / PEPS`,
          description: `Falla detectada en rotulación PEPS o aceite degradado en ${ck.sucursalNombre || 'Cocina Central'}.`,
          branchName: ck.sucursalNombre || 'Cocina Central',
          branchId: ck.sucursalId,
          priority: 'media',
          timestamp: ck.fecha || new Date().toISOString(),
          sourceData: ck,
          suggestedMeetingTitle: `Comité de Calidad PEPS - ${ck.sucursalNombre || 'Cocina Central'}`,
        });
      });

    return alerts.filter((a) => !dismissedAlertIds.has(a.id));
  }, [incidencias, conteos, checklistsCocina, dismissedAlertIds]);

  // Fetch Google Calendar events when token is present
  const fetchGcalEvents = useCallback(async (tokenToUse?: string) => {
    const token = tokenToUse || gcalToken;
    if (!token) return;
    try {
      setIsLoadingGcalEvents(true);
      setGcalError(null);
      const events = await listUpcomingEvents(token, 10);
      setGcalEvents(events);
    } catch (err: any) {
      console.warn('Error fetching GCal events:', err);
      setGcalError(err.message || 'No se pudieron sincronizar los eventos de Google Calendar.');
    } finally {
      setIsLoadingGcalEvents(false);
    }
  }, [gcalToken]);

  useEffect(() => {
    if (gcalToken) {
      fetchGcalEvents(gcalToken);
    }
  }, [gcalToken, fetchGcalEvents]);

  // Connect Google Calendar with Atlas
  const handleConnectGoogleCalendar = async () => {
    try {
      setIsConnectingGcal(true);
      setGcalError(null);
      const token = await requestGoogleCalendarAccess();
      setGcalToken(token);
      await fetchGcalEvents(token);
      setGcalSuccessMsg('Google Calendar conectado exitosamente con Atlas.');
      setTimeout(() => setGcalSuccessMsg(null), 4000);

      recordAction({
        actionType: 'calendar_auth',
        title: 'Vinculación de Google Calendar',
        description: 'Autenticación exitosa con OAuth para Google Workspace Calendar.',
        status: 'success',
        targetModule: 'calendar_tasks',
        executedByUid: userId,
        executedByName: userName,
      }).catch((e) => console.warn('Action err:', e));

      addMessage({
        id: `msg-gcal-${Date.now()}`,
        sender: 'atlas',
        text: '✦ Google Calendar conectado correctamente. He sincronizado tus eventos próximos y habilitado la programación de reuniones ejecutivas con Google Meet.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionType: 'calendar',
      }).catch((e) => console.warn('Msg err:', e));
    } catch (err: any) {
      console.error('Failed to connect Google Calendar:', err);
      setGcalError(err.message || 'No se pudo conectar con Google Calendar.');
    } finally {
      setIsConnectingGcal(false);
    }
  };

  const handleDisconnectGoogleCalendar = () => {
    clearCalendarToken();
    setGcalToken(null);
    setGcalEvents([]);
    setGcalSuccessMsg('Google Calendar desconectado.');
    setTimeout(() => setGcalSuccessMsg(null), 3000);
  };

  // Schedule a Smart Meeting suggestion onto Google Calendar
  const handleScheduleSmartMeeting = async (suggestion: SmartMeetingSuggestion) => {
    if (!gcalToken) {
      await handleConnectGoogleCalendar();
      return;
    }

    try {
      setAgentState('processing');
      setActivePromptText(`✦ Agendando: "${suggestion.title}"`);
      setActivePromptSubtext('Creando evento en Google Calendar y vinculando sala Google Meet...');

      const startDate = new Date(`${suggestion.suggestedDate}T${suggestion.suggestedTime}:00`);
      const endDate = new Date(startDate.getTime() + suggestion.suggestedDurationMinutes * 60000);

      const newEvent: Partial<GoogleCalendarEvent> = {
        summary: `🏢 [ATLAS] ${suggestion.title}`,
        description: `${suggestion.reason}\n\nTemas de Agenda:\n${suggestion.agendaTopics.map((t) => `• ${t}`).join('\n')}\n\nSucursal: ${suggestion.branchName}\nOrquestado automáticamente por Atlas Director.`,
        start: {
          dateTime: startDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        attendees: suggestion.suggestedAttendees.map((email) => ({ email })),
      };

      await createGoogleCalendarEvent(gcalToken, newEvent);

      setAgentState('response');
      setActivePromptText(`✦ Reunión Programada en Google Calendar`);
      setActivePromptSubtext(`${suggestion.title} - ${suggestion.suggestedDate} a las ${suggestion.suggestedTime} hrs`);

      setGcalSuccessMsg(`Reunión "${suggestion.title}" agendada en Google Calendar.`);
      setTimeout(() => setGcalSuccessMsg(null), 5000);

      fetchGcalEvents();

      recordAction({
        actionType: 'calendar_schedule',
        title: `Reunión: ${suggestion.title}`,
        description: `Agendada para ${suggestion.suggestedDate} ${suggestion.suggestedTime} (${suggestion.branchName}).`,
        status: 'success',
        targetModule: 'calendar_tasks',
        executedByUid: userId,
        executedByName: userName,
      }).catch((e) => console.warn('Action err:', e));

      addMessage({
        id: `msg-sched-${Date.now()}`,
        sender: 'atlas',
        text: `✦ He programado la reunión "${suggestion.title}" para el ${suggestion.suggestedDate} a las ${suggestion.suggestedTime} hrs con ${suggestion.suggestedAttendees.length} participantes y enlace Google Meet. Guardado en tu Google Calendar y memoria de Atlas.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionType: 'calendar',
      }).catch((e) => console.warn('Msg err:', e));

      setTimeout(() => {
        setAgentState('idle');
        setActivePromptText(undefined);
        setActivePromptSubtext(undefined);
      }, 1600);
    } catch (err: any) {
      console.error('Error scheduling meeting:', err);
      setGcalError(err.message || 'Error al agendar en Google Calendar.');
      setAgentState('idle');
    }
  };

  // Create Quick Reminder in Google Calendar
  const handleCreateQuickReminder = async (title: string, notes?: string) => {
    if (!gcalToken) {
      await handleConnectGoogleCalendar();
      return;
    }
    try {
      setAgentState('processing');
      setActivePromptText(`✦ Creando recordatorio: "${title}"`);
      const reminderDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      await createOperationalReminder(gcalToken, title, reminderDate, notes);

      setAgentState('response');
      setGcalSuccessMsg(`Recordatorio "${title}" creado en Google Calendar.`);
      setTimeout(() => setGcalSuccessMsg(null), 4000);
      fetchGcalEvents();

      recordAction({
        actionType: 'calendar_reminder',
        title: `Recordatorio: ${title}`,
        description: notes || 'Recordatorio de auditoría operativa creado en Google Calendar.',
        status: 'success',
        targetModule: 'calendar_tasks',
        executedByUid: userId,
        executedByName: userName,
      }).catch((e) => console.warn('Action err:', e));

      addMessage({
        id: `msg-remind-${Date.now()}`,
        sender: 'atlas',
        text: `✦ Recordatorio de supervisión agendado en Google Calendar: "${title}" para dentro de 2 horas.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionType: 'calendar',
      }).catch((e) => console.warn('Msg err:', e));

      setTimeout(() => setAgentState('idle'), 1400);
    } catch (err: any) {
      setGcalError(err.message || 'Error al crear recordatorio.');
      setAgentState('idle');
    }
  };

  // Custom Meeting Form Submit
  const handleCreateCustomMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gcalToken) {
      await handleConnectGoogleCalendar();
      return;
    }
    try {
      setAgentState('processing');
      const startDateTime = new Date(`${customMeetingForm.date}T${customMeetingForm.startTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + customMeetingForm.durationMinutes * 60000);
      const attendeesList = customMeetingForm.attendees
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean)
        .map((email) => ({ email }));

      const eventPayload: Partial<GoogleCalendarEvent> = {
        summary: customMeetingForm.title,
        description: `${customMeetingForm.description}\n\nCreado vía Atlas Director Console.`,
        location: customMeetingForm.location,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        attendees: attendeesList,
      };

      await createGoogleCalendarEvent(gcalToken, eventPayload);
      setIsCustomMeetingOpen(false);
      setGcalSuccessMsg(`Evento "${customMeetingForm.title}" creado en Google Calendar.`);
      setTimeout(() => setGcalSuccessMsg(null), 4000);
      fetchGcalEvents();

      recordAction({
        actionType: 'calendar_custom',
        title: customMeetingForm.title,
        description: `Evento agendado para ${customMeetingForm.date} ${customMeetingForm.startTime}`,
        status: 'success',
        targetModule: 'calendar_tasks',
        executedByUid: userId,
        executedByName: userName,
      }).catch((e) => console.warn('Action err:', e));

      setAgentState('response');
      setTimeout(() => setAgentState('idle'), 1400);
    } catch (err: any) {
      setGcalError(err.message || 'Error al crear evento personalizado.');
      setAgentState('idle');
    }
  };

  // Dismiss a proactive alert
  const handleDismissAlert = (alertId: string) => {
    setDismissedAlertIds((prev) => new Set([...prev, alertId]));
  };

  // Ask Atlas directly about a specific alert
  const handleAskAtlasAboutAlert = (alert: any) => {
    handleExecuteCommand(`Analiza la ${alert.title} en ${alert.branchName} y sugiere un plan de acción inmediato con los capitanes de turno.`);
    setShowProactiveAlertsModal(false);
  };

  // Sync initial default view loaded from memory once
  useEffect(() => {
    if (!initialViewLoadedRef.current && atlasPreferences?.defaultView) {
      initialViewLoadedRef.current = true;
      setActiveGeneratedView(atlasPreferences.defaultView);
    }
  }, [atlasPreferences?.defaultView]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeGeneratedView]);

  // 4 Core Executive Quick Actions (Ultra-Clean & Natural)
  const quickActions = [
    { label: '🕒 ¿Qué hora es?', command: '¿Qué hora es actualmente?' },
    { label: '💰 Ventas de hoy', command: '¿Cuál es el total de ventas acumuladas registradas hoy?' },
    { label: '⚖️ Cortes y Arqueos', command: '¿Tenemos algún arqueo de caja con faltante o descuadre hoy?' },
    { label: '🚨 Incidencias', command: '¿Existen incidencias operativas de prioridad alta o crítica pendientes?' },
  ];

  // Stop recognition helper
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn('Stop recognition err:', e);
      }
      recognitionRef.current = null;
    }
    setIsListeningVoice(false);
    setAgentState('idle');
  }, []);

  // Process user command -> Send to J.A.R.V.I.S. Engine -> Speak synthesized response -> Settle
  const handleExecuteCommand = async (textToSend?: string) => {
    const query = (textToSend || inputQuery || liveTranscript).trim();
    if (!query) return;

    // Stop speaking any previous audio
    stopSpeaking();
    stopListening();

    const userMsg: AtlasConversationMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionType: 'general',
    };

    setInputQuery('');
    setLiveTranscript('');

    // Save user message to Firestore atlas_memory collection via hook
    addMessage(userMsg).catch((e) => console.warn('Could not sync user msg:', e));

    // Phase 1: Particle Acceleration to 'processing'
    setAgentState('processing');
    setActivePromptText(`✦ Atlas orquestando: "${query.slice(0, 50)}${query.length > 50 ? '...' : ''}"`);
    setActivePromptSubtext('Consultando núcleo de inteligencia ejecutiva J.A.R.V.I.S....');

    // Context metrics to assist if queried
    const totalVentas = ventas.reduce((acc, v) => acc + (Number(v.totalVenta) || Number((v as any).montoTotal) || 0), 0);
    const descuadres = conteos.filter((c) => c.estado === 'descuadre' || Math.abs(Number(c.diferencia) || 0) > 20);
    const totalDescuadreMonto = descuadres.reduce((acc, c) => acc + Math.abs(Number(c.diferencia) || 0), 0);
    const incidenciasCriticas = incidencias.filter((i) => (i.prioridad === 'critica' || i.prioridad === 'alta') && i.estado !== 'resuelta' && (i as any).estado !== 'resuelto');
    const cocinaAlertas = checklistsCocina.filter((ck) => ck.rotulacionPEPS === false || ck.aceiteFreidorasCalidad === 'cambiar');

    let responseText = '';
    let targetView: 'calendar_tasks' | 'form_builder' | 'branch_radar' | 'code_audit' | 'culture_matrix' | 'docfx_validator' = 'calendar_tasks';
    let actionType: AtlasConversationMessage['actionType'] = 'general';
    let actionTitle = 'Respuesta Ejecutiva J.A.R.V.I.S.';
    let actionDesc = 'Procesamiento de orden mediante núcleo Gemini.';

    // Quick check for minimal mode toggles in voice/text
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('modo minimal') || lowerQuery.includes('modo zen') || lowerQuery.includes('ocultar metricas') || lowerQuery.includes('oculta metricas') || lowerQuery.includes('pantalla limpia') || lowerQuery.includes('vista limpia')) {
      setIsMinimalMode(true);
      try { localStorage.setItem('atlas_director_minimal_mode', 'true'); } catch {}
      responseText = 'Modo minimalista activado, Señor. He despejado el entorno para enfocarnos únicamente en el visualizador de partículas y el canal de voz.';
    } else if (lowerQuery.includes('modo completo') || lowerQuery.includes('modo normal') || lowerQuery.includes('mostrar metricas') || lowerQuery.includes('muestra metricas') || lowerQuery.includes('panel completo') || lowerQuery.includes('ver todo')) {
      setIsMinimalMode(false);
      try { localStorage.setItem('atlas_director_minimal_mode', 'false'); } catch {}
      responseText = 'Modo detallado restaurado, Señor. Todas las métricas y paneles de supervisión están nuevamente visibles.';
    }

    if (!responseText) {
      try {
        const response = await fetch('/api/atlas/jarvis-command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestText: query,
            contextData: {
              totalVentas,
              ventasCount: ventas.length,
              descuadresCount: descuadres.length,
              totalDescuadreMonto,
              incidenciasCriticasCount: incidenciasCriticas.length,
              cocinaAlertasCount: cocinaAlertas.length,
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const respuesta_ia = data.consolidated_response || data.text || data.response;
          if (respuesta_ia) {
            responseText = respuesta_ia;
          }
        }
      } catch (apiErr) {
        console.warn('Backend Jarvis call warning, executing local executive reasoning:', apiErr);
      }
    }

    // Fallback if API response is empty
    if (!responseText) {
      const lower = query.toLowerCase();
      const tz = 'America/Mexico_City';
      const now = new Date();
      const horaStr = new Intl.DateTimeFormat('es-MX', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true }).format(now);
      const fechaStr = new Intl.DateTimeFormat('es-MX', { timeZone: tz, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(now);

      if (lower.includes('hora') || lower.includes('tiempo')) {
        responseText = `Son exactamente las ${horaStr}, Señor.`;
      } else if (lower.includes('fecha') || lower.includes('dia') || lower.includes('día')) {
        responseText = `Hoy es ${fechaStr}, Señor.`;
      } else if (lower.includes('venta') || lower.includes('vendido') || lower.includes('ingreso') || lower.includes('corte')) {
        targetView = 'branch_radar';
        actionType = 'report';
        responseText = ventas.length > 0
          ? `Las ventas acumuladas de hoy ascienden a $${totalVentas.toLocaleString('es-MX', { minimumFractionDigits: 2 })} en ${ventas.length} cortes horarios, Señor.`
          : `No se han registrado cortes de venta el día de hoy, Señor.`;
      } else if (lower.includes('caja') || lower.includes('descuadre') || lower.includes('arqueo') || lower.includes('faltante')) {
        targetView = 'branch_radar';
        actionType = 'branch_status';
        responseText = descuadres.length > 0
          ? `Se identificaron ${descuadres.length} arqueos con descuadre por un monto acumulado de $${totalDescuadreMonto.toFixed(2)}, Señor.`
          : `Los arqueos de caja se encuentran 100% cuadrados y sin anomalías, Señor.`;
      } else if (lower.includes('incidencia') || lower.includes('problema') || lower.includes('alerta') || lower.includes('queja')) {
        targetView = 'branch_radar';
        actionType = 'branch_status';
        responseText = incidenciasCriticas.length > 0
          ? `Hay ${incidenciasCriticas.length} incidencias críticas pendientes de atención en sucursal, Señor.`
          : `No hay incidencias prioritarias abiertas en este momento, Señor.`;
      } else {
        responseText = `A su orden, Señor. Procesando su solicitud: "${query}".`;
      }
    }

    // Phase 2: Particle Bloom to 'response'
    setAgentState('response');

    const atlasMsg: AtlasConversationMessage = {
      id: `atlas-${Date.now()}`,
      sender: 'atlas',
      text: responseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionType,
    };

    setActiveGeneratedView(targetView);
    setActivePromptText(`✦ Atlas: "${responseText.split('\n')[0].replace(/[#*•]/g, '').slice(0, 50)}..."`);
    setActivePromptSubtext('Respuesta lista. Reproduciendo síntesis de voz...');

    // 🔊 Speak response out loud!
    speakText(responseText);

    // Persist to Firestore atlas_memory via hook
    addMessage(atlasMsg).catch((e) => console.warn('Sync err:', e));
    recordAction({
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
    }, 1800);
  };

  // Real Speech Recognition (Speech-to-Text en Español)
  const toggleVoice = () => {
    if (isListeningVoice) {
      stopListening();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Fallback if browser doesn't support Web Speech Recognition API
      alert('Tu navegador no cuenta con la API de reconocimiento de voz. Puedes escribir tu instrucción directamente en el recuadro.');
      return;
    }

    try {
      stopSpeaking();
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-MX';
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListeningVoice(true);
        setAgentState('listening');
        setActivePromptText('✦ Atlas escuchando tu voz...');
        setActivePromptSubtext('Habla con claridad en español, transcribiendo...');
        setLiveTranscript('');
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setLiveTranscript(currentTranscript);
        setInputQuery(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListeningVoice(false);
        setAgentState('idle');
        setActivePromptText(undefined);
        setActivePromptSubtext(undefined);
      };

      recognition.onend = () => {
        setIsListeningVoice(false);
        setAgentState('idle');
        // If we captured a transcript, automatically submit it!
        if (inputQuery.trim() || liveTranscript.trim()) {
          const finalPrompt = inputQuery.trim() || liveTranscript.trim();
          handleExecuteCommand(finalPrompt);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setIsListeningVoice(false);
      setAgentState('idle');
    }
  };

  // Sincronización de estados del agente con la superficie materializada
  const handleSwitchView = (targetView: 'calendar_tasks' | 'form_builder' | 'branch_radar' | 'code_audit' | 'culture_matrix' | 'docfx_validator', viewLabel: string) => {
    if (activeGeneratedView === targetView && agentState === 'idle') return;
    
    // Transición a 'processing' (aceleración y concentración de partículas)
    setAgentState('processing');
    setActivePromptText(`✦ Atlas materializando: ${viewLabel}`);
    setActivePromptSubtext('Reconfigurando partículas y módulos en tiempo real...');

    setTimeout(() => {
      setActiveGeneratedView(targetView);
      // Transición a 'response' (onda expansiva y proyección lumínica)
      setAgentState('response');
      setActivePromptText(`✦ Superficie activa: ${viewLabel}`);
      setActivePromptSubtext('Módulo renderizado y sincronizado con el núcleo.');

      // Guardar preferencia de vista
      handleUpdatePreferences({ defaultView: targetView });

      // Retorno a 'idle' fluido
      setTimeout(() => {
        setAgentState('idle');
        setActivePromptText(undefined);
        setActivePromptSubtext(undefined);
      }, 1400);
    }, 450);
  };

  // Cambio manual directo de estados del agente
  const handleManualStateChange = (targetState: AtlasPresenceState) => {
    setAgentState(targetState);
    if (targetState === 'processing') {
      setActivePromptText('✦ Atlas en modo: Procesamiento Cuántico');
      setActivePromptSubtext('Aceleración sináptica y condensación de partículas activa.');
    } else if (targetState === 'response') {
      setActivePromptText('✦ Atlas en modo: Proyección de Respuesta');
      setActivePromptSubtext('Emisión de haces de luz radiantes y dispersión.');
    } else if (targetState === 'idle') {
      setActivePromptText(undefined);
      setActivePromptSubtext(undefined);
    }
  };

  // User preference update in Firestore via useAtlasMemory hook
  const handleUpdatePreferences = (updated: Partial<AtlasUserPreferences>) => {
    if (updated.defaultView) setActiveGeneratedView(updated.defaultView);
    savePreferences(updated).catch((e) => console.warn('Could not save prefs:', e));
  };

  return (
    <div className="space-y-5">
      {/* Top Header: Clean Executive Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/90 border border-zinc-800/80 px-4 py-3 rounded-2xl shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/90 border border-cyan-500/40 text-cyan-400 shadow-inner">
            <Bot className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-zinc-100 tracking-tight">
                Atlas · Director Ejecutivo
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                Voz y Memoria Activas
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Habla o escribe tu instrucción. Atlas entiende el contexto operativo en tiempo real.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Minimal Mode Toggle Button */}
          <button
            onClick={() => {
              const next = !isMinimalMode;
              setIsMinimalMode(next);
              try { localStorage.setItem('atlas_director_minimal_mode', String(next)); } catch {}
            }}
            title={isMinimalMode ? 'Modo Minimal activo (clic para ver métricas y paneles completos)' : 'Activar Modo Minimal (oculta paneles técnicos)'}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              isMinimalMode
                ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white border-cyan-400 font-bold shadow-cyan-500/20 ring-2 ring-cyan-400/40'
                : 'bg-zinc-950/70 hover:bg-zinc-800 text-zinc-300 border-zinc-700/60'
            }`}
          >
            {isMinimalMode ? <Sparkles className="h-3.5 w-3.5 text-white animate-spin [animation-duration:3s]" /> : <Minimize2 className="h-3.5 w-3.5 text-zinc-400" />}
            <span>{isMinimalMode ? '✨ Modo Minimal' : 'Modo Minimal'}</span>
          </button>

          {/* Voice Output Toggle */}
          <button
            onClick={() => {
              if (isSpeaking) stopSpeaking();
              setIsVoiceOutputEnabled(!isVoiceOutputEnabled);
            }}
            title={isVoiceOutputEnabled ? 'Voz de Atlas activada (clic para silenciar)' : 'Voz de Atlas silenciada (clic para activar)'}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isVoiceOutputEnabled
                ? 'bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border-cyan-500/40 shadow-sm'
                : 'bg-zinc-950/70 hover:bg-zinc-800 text-zinc-500 border-zinc-800'
            }`}
          >
            {isVoiceOutputEnabled ? <Volume2 className="h-3.5 w-3.5 text-cyan-400" /> : <VolumeX className="h-3.5 w-3.5 text-zinc-500" />}
            <span>{isVoiceOutputEnabled ? 'Voz: Activa' : 'Voz: Silencio'}</span>
          </button>

          {/* Proactive Alerts Badge */}
          {!isMinimalMode && (
            <button
              onClick={() => setShowProactiveAlertsModal(true)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                proactiveAlerts.length > 0
                  ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border-rose-500/50 animate-pulse'
                  : 'bg-zinc-950/70 hover:bg-zinc-800 text-zinc-400 border-zinc-700/60'
              }`}
            >
              <Bell className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Alertas</span>
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-[10px] text-zinc-950 font-bold">
                {proactiveAlerts.length}
              </span>
            </button>
          )}

          {/* Collapsible Deep Tools Switch */}
          {!isMinimalMode && (
            <button
              onClick={() => setShowDeepTools(!showDeepTools)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                showDeepTools
                  ? 'bg-purple-950/90 text-purple-300 border-purple-500/50'
                  : 'bg-zinc-950/70 hover:bg-zinc-800 text-zinc-300 border-zinc-700/60'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{showDeepTools ? 'Ocultar Herramientas' : 'Herramientas de Supervisión'}</span>
              <span className="sm:hidden">Herramientas</span>
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${showDeepTools ? 'rotate-180' : ''}`} />
            </button>
          )}

          {/* Memory drawer button */}
          <button
            onClick={() => setIsMemoryDrawerOpen(true)}
            title="Ver memoria a largo plazo"
            className="p-1.5 rounded-xl bg-zinc-950/70 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 cursor-pointer"
          >
            <Database className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 🌟 MAIN EXECUTIVE CANVAS: Atlas Visualizer & Voice Orb 🌟 */}
      <div className="relative rounded-2xl bg-zinc-950 border border-cyan-500/30 p-2 shadow-2xl shadow-cyan-950/30 overflow-hidden">
        {/* Living Particle Canvas Visualizer */}
        <AtlasVisualizer
          state={agentState}
          onStateChange={(st) => setAgentState(st)}
          mode={visualizerMode}
          theme={visualizerTheme}
          height={isMinimalMode ? 390 : 320}
          activePrompt={activePromptText}
          subtext={activePromptSubtext}
        />

        {/* Live Audio & Speaking Waveform Bar */}
        {(isListeningVoice || isSpeaking) && (
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between px-4 py-2 rounded-xl bg-zinc-950/90 border border-cyan-500/50 backdrop-blur-md z-10 animate-fade-in">
            <div className="flex items-center gap-3">
              {isListeningVoice ? (
                <>
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                  </span>
                  <span className="text-xs font-semibold text-rose-300">
                    🎙️ Escuchando tu voz... {liveTranscript ? `"${liveTranscript}"` : 'Habla en español'}
                  </span>
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 text-cyan-400 animate-pulse" />
                  <span className="text-xs font-semibold text-cyan-300 flex items-center gap-2">
                    <span>Atlas hablando...</span>
                    <span className="flex gap-0.5 items-end h-3">
                      <span className="w-0.5 h-3 bg-cyan-400 animate-bounce" />
                      <span className="w-0.5 h-2 bg-cyan-400 animate-bounce [animation-delay:0.1s]" />
                      <span className="w-0.5 h-3.5 bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-0.5 h-1.5 bg-cyan-400 animate-bounce [animation-delay:0.3s]" />
                    </span>
                  </span>
                </>
              )}
            </div>

            <button
              onClick={() => {
                if (isListeningVoice) stopListening();
                if (isSpeaking) stopSpeaking();
              }}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-medium transition-all cursor-pointer"
            >
              Detener
            </button>
          </div>
        )}

        {/* Real-time Interaction Omnibar */}
        <div className="p-3.5 bg-zinc-900/95 border-t border-zinc-800/80 rounded-b-xl space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="flex-1 w-full relative flex items-center">
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleExecuteCommand()}
                placeholder="Pide un informe, consulta ventas, cajas, incidencias o habla por voz..."
                className="w-full bg-zinc-950/90 border border-zinc-700/80 rounded-xl px-4 py-3 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all pr-28 shadow-inner"
              />

              <div className="absolute right-2 flex items-center gap-1.5">
                {/* Voice Mic Button */}
                <button
                  onClick={toggleVoice}
                  title={isListeningVoice ? 'Detener micrófono' : 'Hablar con Atlas por micrófono'}
                  className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-md ${
                    isListeningVoice
                      ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
                      : 'bg-cyan-950/80 hover:bg-cyan-900 text-cyan-400 border border-cyan-500/40 hover:scale-105'
                  }`}
                >
                  {isListeningVoice ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>

                {/* Send Button */}
                <button
                  onClick={() => handleExecuteCommand()}
                  disabled={!inputQuery.trim() || agentState === 'processing'}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1 shadow-md transition-all cursor-pointer hover:scale-105"
                >
                  <span>Enviar</span>
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* 4 Clean High-Frequency Executive Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-mono text-zinc-400 shrink-0 mr-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-cyan-400" /> Órdenes Clave:
            </span>
            {quickActions.map((qa, idx) => (
              <button
                key={idx}
                onClick={() => handleExecuteCommand(qa.command)}
                className="px-3 py-1.5 rounded-xl bg-zinc-800/90 hover:bg-cyan-950 hover:text-cyan-300 hover:border-cyan-500/50 text-zinc-300 text-xs font-medium whitespace-nowrap border border-zinc-700/60 transition-all cursor-pointer shadow-sm hover:shadow-cyan-950/30"
              >
                {qa.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 📋 LATEST EXECUTIVE BRIEFING CARD (Clean Response Container) 📋 */}
      {messages.length > 0 && (
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Respuesta Ejecutiva de Atlas
                </span>
                <span className="text-[10px] text-zinc-400 ml-2 font-mono">
                  {messages[messages.length - 1]?.timestamp}
                </span>
              </div>
            </div>

            {/* Readout Audio Controls */}
            <div className="flex items-center gap-1.5">
              {isSpeaking ? (
                <button
                  onClick={stopSpeaking}
                  className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Pause className="h-3 w-3" />
                  <span>Pausar Audio</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    const lastMsg = [...messages].reverse().find((m) => m.sender === 'atlas');
                    if (lastMsg) speakText(lastMsg.text);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Play className="h-3 w-3" />
                  <span>Escuchar</span>
                </button>
              )}
            </div>
          </div>

          {/* Response Text Presentation */}
          <div className="space-y-3 pt-1">
            {(() => {
              const lastAtlasMsg = [...messages].reverse().find((m) => m.sender === 'atlas') || messages[messages.length - 1];
              return (
                <div className="p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-800/90 text-zinc-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                  {lastAtlasMsg?.text}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 📊 EXECUTIVE OPERATIONAL PULSE (Hidden in Minimal Mode) 📊 */}
      {!isMinimalMode && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-zinc-400">Ventas Registradas Hoy</span>
              <h4 className="text-base font-bold text-emerald-400">
                ${ventas.reduce((acc, v) => acc + (Number(v.totalVenta) || Number((v as any).montoTotal) || 0), 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </h4>
              <span className="text-[10px] text-zinc-500 font-mono">{ventas.length} cortes horarios</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-zinc-400">Estado de Arqueos</span>
              {(() => {
                const descuadres = conteos.filter((c) => c.estado === 'descuadre' || Math.abs(Number(c.diferencia) || 0) > 20);
                return (
                  <>
                    <h4 className={`text-base font-bold ${descuadres.length > 0 ? 'text-amber-400' : 'text-cyan-400'}`}>
                      {descuadres.length > 0 ? `${descuadres.length} Descuadres` : '100% Cuadrado'}
                    </h4>
                    <span className="text-[10px] text-zinc-500 font-mono">{conteos.length} arqueos auditados</span>
                  </>
                );
              })()}
            </div>
            <div className="p-2.5 rounded-xl bg-cyan-950/60 text-cyan-400 border border-cyan-500/20">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-zinc-400">Incidencias Abiertas</span>
              {(() => {
                const criticas = incidencias.filter((i) => (i.prioridad === 'critica' || i.prioridad === 'alta') && i.estado !== 'resuelta' && (i as any).estado !== 'resuelto');
                return (
                  <>
                    <h4 className={`text-base font-bold ${criticas.length > 0 ? 'text-rose-400' : 'text-zinc-200'}`}>
                      {criticas.length > 0 ? `${criticas.length} Prioritarias` : 'Sin Incidentes'}
                    </h4>
                    <span className="text-[10px] text-zinc-500 font-mono">{incidencias.length} registros totales</span>
                  </>
                );
              })()}
            </div>
            <div className="p-2.5 rounded-xl bg-rose-950/60 text-rose-400 border border-rose-500/20">
              <AlertOctagon className="h-5 w-5" />
            </div>
          </div>
        </div>
      )}

      {/* ✨ Minimal Mode Focus Ambient Strip ✨ */}
      {isMinimalMode && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-zinc-950/80 border border-cyan-500/20 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-mono text-[11px] text-zinc-300">
              Entorno Minimalista J.A.R.V.I.S. · Visualizador de partículas y voz activa
            </span>
          </div>
          <button
            onClick={() => {
              setIsMinimalMode(false);
              try { localStorage.setItem('atlas_director_minimal_mode', 'false'); } catch {}
            }}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer flex items-center gap-1 font-medium"
          >
            <Maximize2 className="h-3 w-3" />
            <span>Ver métricas completas</span>
          </button>
        </div>
      )}

      {/* 🛠️ COLLAPSIBLE DEEP SUPERVISION TOOLS (Shown on request & when not in Minimal mode) 🛠️ */}
      <AnimatePresence>
        {!isMinimalMode && showDeepTools && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-4 pt-2 overflow-hidden"
          >
            {/* Navigation Tabs for Specialized Views */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-purple-400" />
                <h2 className="text-xs font-bold tracking-wider uppercase text-zinc-300">
                  Herramientas Especializadas de Supervisión
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => handleSwitchView('calendar_tasks', 'Agenda & Tareas de Supervisión')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    activeGeneratedView === 'calendar_tasks'
                      ? 'bg-cyan-600 text-white font-semibold'
                      : 'text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  📅 Agenda & Meet
                </button>
                <button
                  onClick={() => handleSwitchView('form_builder', 'Formatos de Rotulación & PEPS')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    activeGeneratedView === 'form_builder'
                      ? 'bg-cyan-600 text-white font-semibold'
                      : 'text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  🏷️ Formatos PEPS
                </button>
                <button
                  onClick={() => handleSwitchView('branch_radar', 'Radar Operativo de Sucursales')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    activeGeneratedView === 'branch_radar'
                      ? 'bg-cyan-600 text-white font-semibold'
                      : 'text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  🚨 Radar Sucursales
                </button>
                <button
                  onClick={() => handleSwitchView('code_audit', 'Diagnóstico de Integridad & RBAC')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    activeGeneratedView === 'code_audit'
                      ? 'bg-cyan-600 text-white font-semibold'
                      : 'text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  ⚡ Diagnóstico RBAC
                </button>
                <button
                  onClick={() => handleSwitchView('culture_matrix', 'Matriz de Culturas & Formatos')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    activeGeneratedView === 'culture_matrix'
                      ? 'bg-cyan-600 text-white font-semibold'
                      : 'text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  🌍 Matriz Culturas
                </button>
                <button
                  onClick={() => handleSwitchView('docfx_validator', 'Validador DocFX & Diátaxis QA')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    activeGeneratedView === 'docfx_validator'
                      ? 'bg-cyan-600 text-white font-semibold'
                      : 'text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  📑 DocFX QA
                </button>
              </div>
            </div>

            {/* View: Calendar & Meeting Orchestration Hub */}
        {activeGeneratedView === 'calendar_tasks' && (
          <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-6 animate-fadeIn">
            {/* Header & OAuth Connection Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2">
                      <span>Google Calendar & Orquestación de Reuniones</span>
                      {gcalToken ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Conectado
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-950 text-amber-300 border border-amber-800">
                          Pendiente de Conectar
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Lectura de agenda, sugerencias inteligentes basadas en sucursales y creación de reuniones con Google Meet.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {gcalToken ? (
                  <>
                    <button
                      onClick={() => fetchGcalEvents()}
                      disabled={isLoadingGcalEvents}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isLoadingGcalEvents ? 'animate-spin text-cyan-400' : ''}`} />
                      <span>Sincronizar</span>
                    </button>
                    <button
                      onClick={() => setIsCustomMeetingOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      <span>Nueva Reunión</span>
                    </button>
                    <button
                      onClick={handleDisconnectGoogleCalendar}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-medium cursor-pointer"
                      title="Desvincular Google Calendar"
                    >
                      Desconectar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleConnectGoogleCalendar}
                    disabled={isConnectingGcal}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-950/50 disabled:opacity-50 transition-all"
                  >
                    <CalendarPlus className="h-4 w-4" />
                    <span>{isConnectingGcal ? 'Conectando con Google...' : 'Conectar con Google Calendar'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Notification messages */}
            {gcalSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between animate-fadeIn">
                <span className="flex items-center gap-2">
                  <CheckCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  {gcalSuccessMsg}
                </span>
                <button onClick={() => setGcalSuccessMsg(null)} className="text-emerald-400 hover:text-white">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {gcalError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between animate-fadeIn">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                  {gcalError}
                </span>
                <button onClick={() => setGcalError(null)} className="text-rose-400 hover:text-white">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Section 1: Smart Meeting Suggestions (Heuristic AI Engine) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    Sugerencias Inteligentes de Reunión por Atlas
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Propuestas generadas automáticamente a partir de incidencias críticas, descuadres de caja y listas de cocina.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">
                  {smartMeetingSuggestions.length} sugerencias activas
                </span>
              </div>

              {smartMeetingSuggestions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {smartMeetingSuggestions.map((sug) => (
                    <div
                      key={sug.id}
                      className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              sug.priority === 'critica'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : sug.priority === 'alta'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-blue-950 text-blue-300 border border-blue-800'
                            }`}
                          >
                            {sug.priority}
                          </span>
                          <span className="text-[11px] text-zinc-400 font-mono flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {sug.suggestedDate} {sug.suggestedTime} hrs
                          </span>
                        </div>

                        <div>
                          <h5 className="text-xs font-bold text-zinc-100">{sug.title}</h5>
                          <span className="text-[10px] text-cyan-400 font-mono block mt-0.5">
                            📍 {sug.branchName} ({sug.suggestedDurationMinutes} min)
                          </span>
                        </div>

                        <p className="text-[11px] text-zinc-400 leading-relaxed bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/60">
                          {sug.reason}
                        </p>

                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">
                            Temas de Agenda:
                          </span>
                          <ul className="space-y-0.5">
                            {sug.agendaTopics.map((top, idx) => (
                              <li key={idx} className="text-[11px] text-zinc-300 flex items-start gap-1.5">
                                <span className="text-cyan-400 leading-none">•</span>
                                <span className="line-clamp-1">{top}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                          <Users className="h-3 w-3 text-zinc-400" /> {sug.suggestedAttendees.length} invitados
                        </span>
                        <button
                          onClick={() => handleScheduleSmartMeeting(sug)}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                        >
                          <Video className="h-3 w-3" />
                          <span>Agendar en Google</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 text-xs">
                  No hay incidentes críticos ni descuadres pendientes. Las sucursales operan bajo parámetros normales.
                </div>
              )}
            </div>

            {/* Section 2: Upcoming Google Calendar Events */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-cyan-400" />
                  Próximos Eventos en Google Calendar
                </h4>
                {gcalToken && (
                  <span className="text-[11px] font-mono text-zinc-400">
                    {gcalEvents.length} eventos leídos
                  </span>
                )}
              </div>

              {gcalToken ? (
                isLoadingGcalEvents ? (
                  <div className="p-8 text-center bg-zinc-950 rounded-xl border border-zinc-800 text-xs text-zinc-400 flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />
                    <span>Sincronizando con Google Calendar API...</span>
                  </div>
                ) : gcalEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {gcalEvents.map((evt) => {
                      const startTime = evt.start?.dateTime
                        ? new Date(evt.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Todo el día';
                      const startDate = evt.start?.dateTime
                        ? new Date(evt.start.dateTime).toLocaleDateString([], { month: 'short', day: 'numeric' })
                        : evt.start?.date || '';

                      return (
                        <div
                          key={evt.id}
                          className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {startDate} - {startTime}
                            </span>
                            {evt.hangoutLink && (
                              <a
                                href={evt.hangoutLink}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-0.5 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-[10px] font-semibold flex items-center gap-1"
                              >
                                <Video className="h-2.5 w-2.5" />
                                <span>Meet</span>
                              </a>
                            )}
                          </div>
                          <h5 className="font-bold text-zinc-200 line-clamp-1">{evt.summary}</h5>
                          {evt.description && (
                            <p className="text-[11px] text-zinc-400 line-clamp-2">{evt.description}</p>
                          )}
                          <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80 text-[10px] text-zinc-400 font-mono">
                            <span>{evt.attendees?.length || 0} asistentes</span>
                            {evt.htmlLink && (
                              <a
                                href={evt.htmlLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
                              >
                                <span>Ver en Google</span>
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center bg-zinc-950 rounded-xl border border-zinc-800 text-xs text-zinc-400">
                    No se encontraron eventos próximos en los siguientes 7 días. Puedes crear uno con el botón "Nueva Reunión" o agendar las sugerencias de Atlas.
                  </div>
                )
              ) : (
                <div className="p-6 rounded-xl bg-zinc-950 border border-zinc-800 text-center space-y-3">
                  <CalendarPlus className="h-8 w-8 text-cyan-400 mx-auto opacity-60" />
                  <div>
                    <h5 className="text-xs font-bold text-zinc-200">Vincula tu cuenta de Google Workspace</h5>
                    <p className="text-[11px] text-zinc-400 max-w-md mx-auto mt-0.5">
                      Permite que Atlas sincronice tu agenda en tiempo real, agende reuniones de supervisión de cortes y cree recordatorios automáticos.
                    </p>
                  </div>
                  <button
                    onClick={handleConnectGoogleCalendar}
                    disabled={isConnectingGcal}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Conectar Google Calendar</span>
                  </button>
                </div>
              )}
            </div>

            {/* Section 3: Quick Operational Reminders */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs sm:text-sm font-bold text-zinc-100 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Recordatorios Rápidos de Supervisión Operativa
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    title: 'Auditoría de Corte Intermedio',
                    desc: 'Verificar cierre de terminales y saldo en sucursales principales.',
                  },
                  {
                    title: 'Inspección de Cámaras y PEPS',
                    desc: 'Revisar temperaturas ≤ 4°C y rotulación de carnes y lácteos.',
                  },
                  {
                    title: 'Revisión de Aceite de Freidoras',
                    desc: 'Comprobar tiras de prueba de calidad de aceite en cocina.',
                  },
                ].map((rem, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between space-y-2 text-xs"
                  >
                    <div>
                      <h5 className="font-bold text-zinc-200">{rem.title}</h5>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{rem.desc}</p>
                    </div>
                    <button
                      onClick={() => handleCreateQuickReminder(rem.title, rem.desc)}
                      className="w-full py-1.5 rounded-lg bg-zinc-800 hover:bg-cyan-950 hover:text-cyan-300 hover:border-cyan-500/40 border border-zinc-700/60 text-zinc-300 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <PlusCircle className="h-3 w-3" />
                      <span>Agendar Recordatorio (+2h)</span>
                    </button>
                  </div>
                ))}
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

        {/* View 6: Global Culture & Format Matrix */}
        {activeGeneratedView === 'culture_matrix' && (
          <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-5 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-cyan-400" />
                  Matriz de Culturas, Formatos & Nombres de Meses
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Base de conocimiento con 60+ culturas verificadas en .NET 10 y .NET Framework 4.8 (ICU/NLS), patrones de fecha, hora y nombres de meses en crudo.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-1 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-semibold flex items-center gap-1">
                  <CheckCheck className="h-3 w-3 text-cyan-400" />
                  {ATLAS_LOCALE_DATABASE.length} Culturas Registradas
                </span>
                <span className="px-2 py-1 rounded-lg bg-purple-950 border border-purple-500/40 text-purple-300 text-[10px] font-mono font-semibold flex items-center gap-1">
                  <span>Overrides:</span> {ATLAS_OVERRIDE_SET.join(', ')}
                </span>
              </div>
            </div>

            {/* Cross-Platform Probe Telemetry Bar */}
            <div className="p-3 rounded-xl bg-zinc-950/90 border border-zinc-800/90 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-400" />
                <span className="font-semibold text-zinc-200">Sonda de Compatibilidad Multiplataforma:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                <span className="px-2 py-0.5 rounded bg-zinc-900 border border-emerald-500/40 text-emerald-400">
                  macOS .NET 10 (ICU) ✓
                </span>
                <span className="px-2 py-0.5 rounded bg-zinc-900 border border-emerald-500/40 text-emerald-400">
                  Linux .NET 10 (Ubuntu ICU) ✓
                </span>
                <span className="px-2 py-0.5 rounded bg-zinc-900 border border-emerald-500/40 text-emerald-400">
                  Windows .NET 10 (win-x64) ✓
                </span>
                <span className="px-2 py-0.5 rounded bg-zinc-900 border border-emerald-500/40 text-emerald-400">
                  Windows .NET 4.8 (NLS) ✓
                </span>
              </div>
            </div>

            {/* Locale Search & Selector Grid */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                  <input
                    type="text"
                    value={localeSearchQuery}
                    onChange={(e) => setLocaleSearchQuery(e.target.value)}
                    placeholder="Filtrar por código de cultura (ej: es, en-US, ta, ar, he, zu-ZA, ja)..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                {localeSearchQuery && (
                  <button
                    onClick={() => setLocaleSearchQuery('')}
                    className="text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer px-2 py-1"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {/* Grid of Culture Badges */}
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-xl bg-zinc-950 border border-zinc-800/80">
                {searchAtlasLocales(localeSearchQuery).map((loc) => {
                  const isSelected = (selectedLocaleCode || 'es') === loc.locale;
                  const isOverride = ATLAS_OVERRIDE_SET.includes(loc.locale);
                  return (
                    <button
                      key={loc.locale}
                      onClick={() => setSelectedLocaleCode(loc.locale)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-cyan-600 text-white font-bold shadow-sm'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                      }`}
                    >
                      <span>{loc.locale}</span>
                      {isOverride && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Locale en FinalOverrideSet" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Locale Deep Inspector */}
            {(() => {
              const currentLoc = ATLAS_LOCALE_DATABASE.find(l => l.locale === (selectedLocaleCode || 'es')) || ATLAS_LOCALE_DATABASE[0];
              const isOverride = ATLAS_OVERRIDE_SET.includes(currentLoc.locale);

              return (
                <div className="space-y-4 pt-2">
                  <div className="p-4 rounded-xl bg-zinc-950 border border-cyan-500/30 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono font-bold text-sm">
                          {currentLoc.locale}
                        </span>
                        <span className="text-xs font-semibold text-zinc-200">
                          Especificación de Formato & Patrones
                        </span>
                        {isOverride && (
                          <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/50 text-amber-300 text-[10px] font-mono">
                            FinalOverrideSet Activo
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(currentLoc, null, 2));
                          setCopiedItem(`locale-${currentLoc.locale}`);
                          setTimeout(() => setCopiedItem(null), 2000);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] flex items-center gap-1.5 cursor-pointer font-mono"
                      >
                        {copiedItem === `locale-${currentLoc.locale}` ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span>Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copiar JSON</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Pattern Matrix */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Fecha Corta</span>
                        <span className="font-mono text-cyan-300 font-bold block truncate">{currentLoc.short_date_pattern}</span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Fecha Larga</span>
                        <span className="font-mono text-cyan-300 font-bold block truncate">{currentLoc.long_date_pattern}</span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Hora (Corta / Larga)</span>
                        <span className="font-mono text-emerald-300 font-bold block truncate">
                          {currentLoc.short_time_pattern} | {currentLoc.long_time_pattern}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Separador / AM / PM</span>
                        <span className="font-mono text-amber-300 font-bold block truncate">
                          Dec: "{currentLoc.number_decimal_separator}" | AM: "{currentLoc.am_designator}" | PM: "{currentLoc.pm_designator}"
                        </span>
                      </div>
                    </div>

                    {/* Month Names Enumeration (12 Months in Raw & Genitive) */}
                    {currentLoc.month_names_raw && currentLoc.month_names_raw.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
                          <span>Nombres de Meses en Crudo (DateTimeFormat.MonthNames):</span>
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-1.5 text-xs font-mono">
                          {currentLoc.month_names_raw.map((mName, idx) => (
                            <div key={idx} className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] truncate">
                              <span className="text-zinc-500 mr-1.5 font-bold">[{idx + 1}]</span>
                              <span className="text-zinc-200">{mName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reference Sample Tests */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-semibold text-zinc-300">
                        Pruebas de Formato con Fechas de Referencia:
                      </span>
                      <div className="max-h-48 overflow-y-auto rounded-lg border border-zinc-800 divide-y divide-zinc-800/80 font-mono text-xs">
                        {currentLoc.dates.map((d, i) => (
                          <div key={i} className="p-2.5 bg-zinc-900/60 hover:bg-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400">Ref: {d.ref}</span>
                              <span className="text-cyan-300 font-semibold">{d.short}</span>
                            </div>
                            <div className="text-right text-[11px] text-zinc-300 truncate">
                              <span className="text-zinc-400 mr-2">[{d.month_standalone}]</span>
                              <span className="text-zinc-100">{d.long}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* View 7: DocFX Schema & Diátaxis QA Validator */}
        {activeGeneratedView === 'docfx_validator' && (
          <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-5 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <FileCode2 className="h-4 w-4 text-purple-400" />
                  Validador DocFX & Suite de Calidad Diátaxis
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Inspección de orden de 33 secciones DocItem, modo de tabla de contenidos 'Grouped' y verificación automática de reglas Diátaxis.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-semibold flex items-center gap-1">
                  <Check className="h-3 w-3 text-emerald-400" />
                  Diátaxis QA: 100% Passed
                </span>
                <span className="px-2 py-1 rounded-lg bg-purple-950 border border-purple-500/40 text-purple-300 text-[10px] font-mono font-semibold">
                  TOC: Grouped
                </span>
              </div>
            </div>

            {/* DocItem Schema Tabs */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-zinc-400 mr-1">Esquema DocItem:</span>
                  {[
                    { id: 'classDocItem', label: 'ClassDocItem' },
                    { id: 'structDocItem', label: 'StructDocItem' },
                    { id: 'interfaceDocItem', label: 'InterfaceDocItem' },
                    { id: 'enumDocItem', label: 'EnumDocItem' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveDocItemKey(tab.id as any)}
                      className={`px-3 py-1 rounded-lg font-mono text-xs font-medium cursor-pointer transition-colors ${
                        activeDocItemKey === tab.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(ATLAS_DOCFX_CONFIG, null, 2));
                    setCopiedItem('docfx-config');
                    setTimeout(() => setCopiedItem(null), 2000);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] flex items-center gap-1.5 cursor-pointer font-mono"
                >
                  {copiedItem === 'docfx-config' ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span>Esquema Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copiar Configuración DocFX</span>
                    </>
                  )}
                </button>
              </div>

              {/* Sections Sequence List */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Secuencia Ordenada de Secciones ({ATLAS_DOCFX_CONFIG[activeDocItemKey].Sections.length} elementos):</span>
                  <span className="text-purple-300 font-mono">Modo TOC: {ATLAS_DOCFX_CONFIG.tableOfContentsMode}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2.5 rounded-lg bg-zinc-900/70 border border-zinc-800/80 font-mono text-xs">
                  {ATLAS_DOCFX_CONFIG[activeDocItemKey].Sections.map((sec, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-zinc-950 text-zinc-300 border border-zinc-800 text-[11px]"
                    >
                      <span className="text-purple-400 mr-1 font-bold">{idx + 1}.</span>
                      {sec}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Diátaxis Documentation Quality Suite */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-2 uppercase tracking-wider">
                  <BookOpen className="h-4 w-4 text-cyan-400" />
                  Auditoría Diátaxis & Contratos de Escenario
                </h4>

                <div className="flex items-center gap-1 text-xs">
                  <span className="text-zinc-400 mr-1 hidden sm:inline">Filtrar Rol:</span>
                  {(['all', 'tutorial', 'how-to', 'explanation'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setDiataxisFilterRole(r)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono capitalize cursor-pointer ${
                        diataxisFilterRole === r
                          ? 'bg-cyan-600 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {ATLAS_DIATAXIS_SAMPLE_AUDIT
                  .filter((p) => diataxisFilterRole === 'all' || p.role === diataxisFilterRole)
                  .map((page, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                          {page.role}
                        </span>
                        <span className="flex items-center gap-1 text-emerald-400 font-mono text-[10px]">
                          <Check className="h-3 w-3" /> Validado
                        </span>
                      </div>

                      <h5 className="font-bold text-zinc-100">{page.title}</h5>
                      <p className="text-[11px] text-zinc-400 font-mono">{page.pagePath}</p>
                      <p className="text-[11px] text-purple-300 font-semibold">Persona: {page.persona}</p>

                      <div className="space-y-1 pt-1 border-t border-zinc-800/80">
                        {page.checks.map((c) => (
                          <div key={c.id} className="flex items-start gap-1.5 text-[11px] text-zinc-300">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-zinc-200">{c.description}: </span>
                              <span className="text-zinc-400">{c.details}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>

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
                          clearHistory().catch((e) => console.warn('Could not clear history:', e));
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

      {/* 📅 Modal: Nueva Reunión Personalizada en Google Calendar */}
      <AnimatePresence>
        {isCustomMeetingOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
                    <CalendarPlus className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-100">Programar Reunión en Google Calendar</h3>
                </div>
                <button
                  onClick={() => setIsCustomMeetingOpen(false)}
                  className="text-zinc-400 hover:text-zinc-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCustomMeeting} className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Título de la Reunión / Auditoría *</label>
                  <input
                    type="text"
                    required
                    value={customMeetingForm.title}
                    onChange={(e) => setCustomMeetingForm({ ...customMeetingForm, title: e.target.value })}
                    placeholder="Ej. Junta de Revisión de Cortes - Sucursal Central"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">Fecha</label>
                    <input
                      type="date"
                      required
                      value={customMeetingForm.date}
                      onChange={(e) => setCustomMeetingForm({ ...customMeetingForm, date: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-100 font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">Hora Inicio</label>
                    <input
                      type="time"
                      required
                      value={customMeetingForm.startTime}
                      onChange={(e) => setCustomMeetingForm({ ...customMeetingForm, startTime: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-100 font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">Duración (min)</label>
                    <input
                      type="number"
                      min={15}
                      step={15}
                      value={customMeetingForm.durationMinutes}
                      onChange={(e) => setCustomMeetingForm({ ...customMeetingForm, durationMinutes: Number(e.target.value) })}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-100 font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Invitados (correos separados por coma)</label>
                  <input
                    type="text"
                    value={customMeetingForm.attendees}
                    onChange={(e) => setCustomMeetingForm({ ...customMeetingForm, attendees: e.target.value })}
                    placeholder="capitan@lct.com, director@lct.com"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Descripción / Puntos de Agenda</label>
                  <textarea
                    rows={3}
                    value={customMeetingForm.description}
                    onChange={(e) => setCustomMeetingForm({ ...customMeetingForm, description: e.target.value })}
                    placeholder="Detalles sobre las incidencias a discutir, metas de venta o procesos PEPS..."
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsCustomMeetingOpen(false)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <CalendarPlus className="h-3.5 w-3.5" />
                    <span>Guardar en Google Calendar</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🚨 Modal: Centro de Gestión de Alertas Operativas Firestore */}
      <AnimatePresence>
        {showProactiveAlertsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-rose-950 text-rose-400 border border-rose-800">
                    <BellRing className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100">
                      Alertas Operativas & Eventos de Sucursal ({proactiveAlerts.length})
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Monitoreo continuo de incidencias, descuadres y calidad de cocina.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowProactiveAlertsModal(false)}
                  className="text-zinc-400 hover:text-zinc-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-y-auto space-y-3 flex-1 pr-1">
                {proactiveAlerts.length > 0 ? (
                  proactiveAlerts.map((al) => (
                    <div
                      key={al.id}
                      className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              al.priority === 'critica'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : al.priority === 'alta'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-blue-950 text-blue-300 border border-blue-800'
                            }`}
                          >
                            {al.priority}
                          </span>
                          <span className="font-bold text-zinc-200">{al.title}</span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {al.branchName}
                        </span>
                      </div>

                      <p className="text-[11px] text-zinc-400 leading-relaxed">{al.description}</p>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              handleCreateQuickReminder(`Auditoría: ${al.title}`, al.description);
                              setShowProactiveAlertsModal(false);
                            }}
                            className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Calendar className="h-3 w-3" />
                            <span>Crear Recordatorio</span>
                          </button>
                          <button
                            onClick={() => {
                              handleScheduleSmartMeeting({
                                id: al.id,
                                title: al.suggestedMeetingTitle,
                                branchName: al.branchName,
                                reason: al.description,
                                priority: al.priority,
                                suggestedDate: new Date().toISOString().split('T')[0],
                                suggestedTime: '16:00',
                                suggestedDurationMinutes: 30,
                                suggestedAttendees: ['director@lct.com', 'capitan@lct.com'],
                                agendaTopics: [
                                  'Causa raíz del incidente o descuadre',
                                  'Plan de remediación y ajuste operativo',
                                  'Revisión de bitácoras y firma de conformidad',
                                ],
                                originEventType: al.eventType || 'incidencia',
                                originEventId: al.id,
                              });
                              setShowProactiveAlertsModal(false);
                            }}
                            className="px-2.5 py-1 rounded bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Video className="h-3 w-3" />
                            <span>Agendar Reunión</span>
                          </button>
                          <button
                            onClick={() => handleAskAtlasAboutAlert(al)}
                            className="px-2.5 py-1 rounded bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Bot className="h-3 w-3" />
                            <span>Consultar con Atlas</span>
                          </button>
                        </div>

                        <button
                          onClick={() => handleDismissAlert(al.id)}
                          className="text-[10px] text-zinc-500 hover:text-zinc-300 font-medium cursor-pointer"
                        >
                          Marcar como Atendida
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center bg-zinc-950 rounded-xl border border-zinc-800 text-zinc-400 text-xs">
                    No hay alertas pendientes en ninguna sucursal.
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-zinc-800 flex justify-end shrink-0">
                <button
                  onClick={() => setShowProactiveAlertsModal(false)}
                  className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer"
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
