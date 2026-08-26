import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  Search,
  Sparkles,
  Bot,
  Send,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Code2,
  Copy,
  Download,
  Play,
  Layers,
  ArrowRight,
  ExternalLink,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  FileCode,
  CheckCheck,
  Zap,
  Terminal,
  ShieldCheck,
  ChevronRight,
  Compass,
  Cpu,
  Trash2,
  BookOpen,
  Activity,
  Server
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  WebAgentRole,
  WebAgentModel,
  WebAgentMessage,
  AgentSkill,
  GroundingMetadata
} from '../types/webAgent';
import { validateSkill } from '../lib/skillValidator';
import { DEFAULT_AGENT_SKILLS } from '../lib/defaultSkills';
import { AtlasAuditConsole } from './AtlasAuditConsole';

const ROLE_PRESETS: { id: WebAgentRole; title: string; desc: string; icon: string }[] = [

  {
    id: 'auditor_operativo',
    title: 'Auditor Operativo',
    desc: 'Investiga normativas sanitarias (NOM-251, HACCP), PEPS y procedimientos de cocina.',
    icon: '📋',
  },
  {
    id: 'investigador_mercado',
    title: 'Investigador de Mercado',
    desc: 'Compara precios de insumos, menús de competidores y tendencias gastronómicas.',
    icon: '📊',
  },
  {
    id: 'normativa_sanitaria',
    title: 'Auditor Sanitario',
    desc: 'Verifica leyes de inocuidad, temperaturas seguras y prevención de contaminación.',
    icon: '🛡️',
  },
  {
    id: 'director_general',
    title: 'Director Autónomo',
    desc: 'Desglosa tareas complejas, formula planes tácticos y genera Skills.',
    icon: '⚡',
  },
];

const MODEL_OPTIONS: { id: WebAgentModel; name: string; tag: string; desc: string }[] = [
  {
    id: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash',
    tag: 'Recomendado',
    desc: 'Mayor capacidad de razonamiento con Google Search Grounding en tiempo real',
  },
  {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    tag: 'Alta Velocidad',
    desc: 'Búsqueda web rápida y extracción estructurada de información',
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro',
    tag: 'Razonamiento Complejo',
    desc: 'Para tareas analíticas profundas y arquitectura de skills complejas',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    tag: 'Ultra Rápido',
    desc: 'Respuestas veloces para consultas puntuales y síntesis directas',
  },
];

const QUICK_PROMPTS = [
  'Auditar temperaturas críticas y tiempos de conservación según NOM-251 y HACCP.',
  'Investigar proveedores mayoristas y precios de referencia para aceite y harina.',
  'Analizar tendencias de delivery y combos populares en restaurantes de la zona.',
  'Crear checklist de rotulación PEPS para cocina y cámaras de refrigeración.',
];

export const ModuloWebAgentSkills: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'web_agent' | 'skill_creator' | 'atlas_audit'>('web_agent');

  // --- Web Agent State ---

  const [messages, setMessages] = useState<WebAgentMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'agent',
      text: `### 🌐 Bienvenido al Agente Web & Centro de Habilidades (Skills)

Soy tu Agente Autónomo con **Google Search Grounding en tiempo real**. Puedo navegar la web, verificar normativas de inocuidad alimentaria, auditar precios de insumos con proveedores y ejecutar tareas estructuradas.

¿En qué tarea o investigación web te puedo ayudar hoy?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.7-flash',
      roleUsed: 'auditor_operativo',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<WebAgentRole>('auditor_operativo');
  const [selectedModel, setSelectedModel] = useState<WebAgentModel>('gemini-3.7-flash');
  const [enableSearch, setEnableSearch] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // --- Skill Creator State ---
  const [skills, setSkills] = useState<AgentSkill[]>(DEFAULT_AGENT_SKILLS);
  const [selectedSkillId, setSelectedSkillId] = useState<string>(DEFAULT_AGENT_SKILLS[0].id);
  const [editingContent, setEditingContent] = useState<string>(DEFAULT_AGENT_SKILLS[0].content);
  const [skillPrompt, setSkillPrompt] = useState('');
  const [isGeneratingSkill, setIsGeneratingSkill] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const selectedSkill = skills.find((s) => s.id === selectedSkillId) || skills[0];
  const validationResult = validateSkill(editingContent);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // When selected skill changes in sidebar
  const handleSelectSkill = (skill: AgentSkill) => {
    setSelectedSkillId(skill.id);
    setEditingContent(skill.content);
  };

  // Send message to Web Agent
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputQuery).trim();
    if (!textToSend || isSending) return;

    const userMessage: WebAgentMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputQuery('');
    setIsSending(true);

    try {
      const response = await fetch('/api/web-agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ sender: m.sender, text: m.text })),
          role: selectedRole,
          model: selectedModel,
          enableSearch,
        }),
      });

      const data = await response.json();

      const agentMessage: WebAgentMessage = {
        id: `msg-res-${Date.now()}`,
        sender: 'agent',
        text: data.text || 'Sin respuesta del agente.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        grounding: data.grounding,
        suggestedActions: data.suggestedActions,
        modelUsed: data.modelUsed || selectedModel,
        roleUsed: data.roleUsed || selectedRole,
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch (err) {
      console.error('Error enviando mensaje al Agente Web:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          sender: 'system',
          text: 'Error de conexión con el servicio web del Agente. Por favor, intenta de nuevo.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // AI Skill Generator from prompt
  const handleGenerateSkillWithAI = async () => {
    if (!skillPrompt.trim() || isGeneratingSkill) return;

    setIsGeneratingSkill(true);
    try {
      const response = await fetch('/api/skills/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: skillPrompt.trim(),
          category: 'custom',
          allowedTools: ['googleSearch', 'urlContext'],
        }),
      });

      const data = await response.json();
      if (data.content) {
        const val = validateSkill(data.content);
        const newSkill: AgentSkill = {
          id: `skill-${Date.now()}`,
          name: val.parsedFrontmatter?.name || 'custom-generated-skill',
          description: val.parsedFrontmatter?.description || skillPrompt.slice(0, 120),
          content: data.content,
          allowedTools: val.parsedFrontmatter?.['allowed-tools'] || ['googleSearch'],
          valid: val.valid,
          validationErrors: val.errors,
          category: 'custom',
          createdAt: new Date().toISOString(),
        };

        setSkills((prev) => [newSkill, ...prev]);
        setSelectedSkillId(newSkill.id);
        setEditingContent(data.content);
        setSkillPrompt('');
      }
    } catch (err) {
      console.error('Error generando skill:', err);
    } finally {
      setIsGeneratingSkill(false);
    }
  };

  // Save changes to current skill
  const handleSaveSkill = () => {
    const val = validateSkill(editingContent);
    setSkills((prev) =>
      prev.map((s) =>
        s.id === selectedSkillId
          ? {
              ...s,
              name: val.parsedFrontmatter?.name || s.name,
              description: val.parsedFrontmatter?.description || s.description,
              content: editingContent,
              valid: val.valid,
              validationErrors: val.errors,
            }
          : s
      )
    );
  };

  // Create empty skill
  const handleCreateNewSkill = () => {
    const id = `custom-skill-${Date.now()}`;
    const name = `nueva-habilidad-${skills.length + 1}`;
    const initialContent = `---
name: ${name}
description: Describe aquí de forma concisa el propósito y alcance de la habilidad operativa.
allowed-tools:
  - googleSearch
license: Apache-2.0
user-invocable: true
---

# ${name}

## Objetivo
Detallar el objetivo específico de esta habilidad operativa.

## Pasos de Ejecución
1. Primer paso del procedimiento.
2. Segundo paso con validación en la web.
3. Síntesis y entrega de resultados.

## Criterios de Validación
- Checklist de verificación.
`;

    const newSkill: AgentSkill = {
      id,
      name,
      description: 'Habilidad creada por el usuario',
      content: initialContent,
      allowedTools: ['googleSearch'],
      valid: true,
      category: 'custom',
      createdAt: new Date().toISOString(),
    };

    setSkills((prev) => [newSkill, ...prev]);
    setSelectedSkillId(id);
    setEditingContent(initialContent);
  };

  // Copy skill content
  const handleCopySkill = () => {
    navigator.clipboard.writeText(editingContent);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  // Export skill to file
  const handleExportSkill = () => {
    const blob = new Blob([editingContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedSkill?.name || 'SKILL'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Test skill in Web Agent
  const handleTestSkillInAgent = (skill: AgentSkill) => {
    setActiveTab('web_agent');
    const query = `Ejecuta la habilidad [${skill.name}]: ${skill.description}`;
    setTimeout(() => {
      handleSendMessage(query);
    }, 100);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Globe className="h-5 w-5" />
              </span>
              <h2 className="text-xl font-bold text-zinc-100 tracking-tight">
                Agente Web & Creador de Skills (Habilidades)
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Navegación e investigación web fundamentada con Google Search Grounding, ejecución de tareas en tiempo real y estudio de creación y validación de Skills estándar Apache 2.0.
            </p>
          </div>

          {/* Module Switcher Tabs */}
          <div className="flex items-center p-1 bg-zinc-950/80 rounded-xl border border-zinc-800 shrink-0 flex-wrap gap-1">
            <button
              onClick={() => setActiveTab('web_agent')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'web_agent'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Search className="h-3.5 w-3.5" />
              <span>Agente Web & Tareas</span>
            </button>
            <button
              onClick={() => setActiveTab('skill_creator')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'skill_creator'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Wrench className="h-3.5 w-3.5" />
              <span>Skill Creator & Validador</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800">
                {skills.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('atlas_audit')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'atlas_audit'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Activity className="h-3.5 w-3.5 text-cyan-300" />
              <span>Atlas Audit (11 Agentes)</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: 🌐 WEB AGENT & MULTI-TURN SEARCH CHATBOT */}
      {/* ========================================================================= */}
      {activeTab === 'web_agent' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Controls & Configuration Sidebar */}
          <div className="space-y-5">
            {/* Role Selector */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Bot className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Rol del Agente Web</span>
                </label>
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Multi-Turn</span>
              </div>
              <div className="space-y-2">
                {ROLE_PRESETS.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                      selectedRole === role.id
                        ? 'bg-cyan-950/40 border-cyan-500/50 text-zinc-100 shadow-sm'
                        : 'bg-zinc-950/50 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold text-zinc-200">
                      <span>{role.icon}</span>
                      <span>{role.title}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                      {role.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Model Selector */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-cyan-400" />
                <span>Modelo de Inteligencia</span>
              </label>
              <div className="space-y-2">
                {MODEL_OPTIONS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedModel(m.id)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                      selectedModel === m.id
                        ? 'bg-zinc-800 border-cyan-500/60 text-zinc-100 shadow-sm'
                        : 'bg-zinc-950/50 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-200">{m.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-300 font-mono">
                        {m.tag}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{m.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Google Search Grounding Switch */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800">
                  <Search className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">Google Search</h4>
                  <p className="text-[10px] text-zinc-400">Grounding en vivo con enlaces</p>
                </div>
              </div>
              <button
                onClick={() => setEnableSearch(!enableSearch)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
                  enableSearch ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
                    enableSearch ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Quick Task Starters */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span>Consultas Rápidas</span>
              </label>
              <div className="space-y-1.5">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="w-full text-left p-2 rounded-lg bg-zinc-950/60 hover:bg-zinc-800/80 border border-zinc-800/60 hover:border-zinc-700 text-[11px] text-zinc-300 transition-colors cursor-pointer line-clamp-2 leading-relaxed"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Chat & Interactive Feed */}
          <div className="lg:col-span-3 flex flex-col h-[700px] rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl overflow-hidden">
            {/* Chat Header Bar */}
            <div className="px-4 py-3 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-zinc-200">
                  Canal Activo • {ROLE_PRESETS.find((r) => r.id === selectedRole)?.title}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
                  {selectedModel}
                </span>
                {enableSearch && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-mono flex items-center gap-1">
                    <Search className="h-2.5 w-2.5" />
                    <span>Search Grounding Activo</span>
                  </span>
                )}
              </div>

              <button
                onClick={() =>
                  setMessages([
                    {
                      id: 'reset-msg',
                      sender: 'agent',
                      text: 'Historial reiniciado. ¿Qué nueva tarea o investigación web deseas emprender?',
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    },
                  ])
                }
                className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Limpiar hilo"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-[11px]">Limpiar</span>
              </button>
            </div>

            {/* Scrollable Message List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-3xl rounded-2xl p-4 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-cyan-600 text-white rounded-tr-xs shadow-md'
                        : msg.sender === 'system'
                        ? 'bg-rose-950/80 text-rose-200 border border-rose-800'
                        : 'bg-zinc-950/90 text-zinc-200 border border-zinc-800/80 rounded-tl-xs shadow-sm'
                    }`}
                  >
                    {/* Header badge inside message */}
                    {msg.sender === 'agent' && (
                      <div className="flex items-center gap-2 pb-2 mb-2 border-b border-zinc-800/80 text-[10px] text-zinc-400 font-mono">
                        <span className="text-cyan-400 font-bold">Atlas Web Agent</span>
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                        {msg.modelUsed && <span>• {msg.modelUsed}</span>}
                      </div>
                    )}

                    {/* Message Body with clean paragraph & markdown rendering */}
                    <div className="space-y-2 whitespace-pre-wrap font-sans text-[12px]">
                      {msg.text}
                    </div>

                    {/* Grounding Citations / Verified Sources */}
                    {msg.grounding && msg.grounding.sources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Fuentes Verificadas de Google Search ({msg.grounding.sources.length})</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {msg.grounding.sources.map((src, sIdx) => (
                            <a
                              key={sIdx}
                              href={src.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800 hover:border-emerald-500/50 transition-all flex items-start justify-between gap-2 group cursor-pointer"
                            >
                              <div className="min-w-0 flex-1">
                                <span className="text-[11px] font-semibold text-zinc-200 group-hover:text-emerald-300 line-clamp-1">
                                  {src.title}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
                                  {src.domain || 'web'}
                                </span>
                              </div>
                              <ExternalLink className="h-3 w-3 text-zinc-500 group-hover:text-emerald-400 shrink-0 mt-0.5" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suggested Next Actions */}
                    {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-zinc-800/60 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                          Siguiente paso:
                        </span>
                        {msg.suggestedActions.map((act, aIdx) => (
                          <button
                            key={aIdx}
                            onClick={() => handleSendMessage(act)}
                            className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-cyan-950/60 border border-zinc-700 hover:border-cyan-500/50 text-[11px] text-zinc-300 hover:text-cyan-200 transition-colors cursor-pointer"
                          >
                            + {act}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 px-1">{msg.timestamp}</span>
                </div>
              ))}

              {isSending && (
                <div className="flex items-start gap-2">
                  <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2.5 shadow-sm">
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                    <span className="animate-pulse">
                      Navegando y consultando Google Search con {selectedModel}...
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-zinc-950/90 border-t border-zinc-800">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    placeholder={`Pregunta a ${ROLE_PRESETS.find((r) => r.id === selectedRole)?.title} o solicita una tarea web...`}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                    disabled={isSending}
                  />
                  <div className="absolute right-2.5 top-2.5 text-zinc-500">
                    <Globe className="h-4 w-4" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!inputQuery.trim() || isSending}
                  className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Ejecutar</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: 🛠️ SKILL CREATOR & VALIDATOR STUDIO */}
      {/* ========================================================================= */}
      {activeTab === 'skill_creator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Skill Catalog & AI Skill Generator */}
          <div className="space-y-5">
            {/* AI Generator Box */}
            <div className="p-4 rounded-2xl bg-zinc-900 border border-cyan-500/30 shadow-lg space-y-3 relative overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
                  <Sparkles className="h-4 w-4" />
                </span>
                <h4 className="text-xs font-bold text-zinc-100">Generador de Skills con IA</h4>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Describe lo que debe hacer la habilidad y Gemini redactará el archivo <code className="text-cyan-300">SKILL.md</code> validado según el estándar Apache 2.0.
              </p>

              <div className="space-y-2">
                <textarea
                  value={skillPrompt}
                  onChange={(e) => setSkillPrompt(e.target.value)}
                  placeholder="Ej: Skill para auditar precios de harina y aceite en proveedores de la región..."
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500 min-h-[70px]"
                />
                <button
                  onClick={handleGenerateSkillWithAI}
                  disabled={!skillPrompt.trim() || isGeneratingSkill}
                  className="w-full py-2 px-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  {isGeneratingSkill ? (
                    <>
                      <div className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Generando Skill con Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Crear Habilidad Automática</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Catalog of Registered Skills */}
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-cyan-400" />
                  <h4 className="text-xs font-bold text-zinc-200">Catálogo de Skills ({skills.length})</h4>
                </div>
                <button
                  onClick={handleCreateNewSkill}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>Nueva</span>
                </button>
              </div>

              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {skills.map((skill) => {
                  const isSelected = skill.id === selectedSkillId;
                  const isValid = skill.valid;
                  return (
                    <div
                      key={skill.id}
                      onClick={() => handleSelectSkill(skill)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-800/90 border-cyan-500/70 shadow-sm'
                          : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <FileCode className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                          <span className="font-mono text-xs font-bold text-zinc-100 truncate">
                            {skill.name}
                          </span>
                        </div>
                        {isValid ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 shrink-0">
                            Válido
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-rose-950 text-rose-400 border border-rose-800 shrink-0">
                            Inválido
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                        {skill.description}
                      </p>

                      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-zinc-800/60">
                        <div className="flex gap-1">
                          {skill.allowedTools.map((tool, tIdx) => (
                            <span
                              key={tIdx}
                              className="text-[9px] font-mono px-1 py-0.2 rounded bg-zinc-900 text-zinc-400"
                            >
                              {tool}
                            </span>
                          ))}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTestSkillInAgent(skill);
                          }}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 hover:underline"
                        >
                          <Play className="h-2.5 w-2.5" />
                          <span>Probar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Columns (Span 2): Live Editor & Specification Validator */}
          <div className="lg:col-span-2 space-y-4">
            {/* Editor Action Bar */}
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-zinc-100">
                  {selectedSkill?.name || 'SKILL.md'}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {editingContent.length} chars
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySkill}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  title="Copiar contenido"
                >
                  {copiedSuccess ? (
                    <>
                      <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleExportSkill}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  title="Descargar archivo SKILL.md"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Exportar .md</span>
                </button>

                <button
                  onClick={handleSaveSkill}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1 shadow-md transition-all cursor-pointer"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Guardar</span>
                </button>
              </div>
            </div>

            {/* Validation Diagnostic Status Box */}
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
                validationResult.valid
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              }`}
            >
              {validationResult.valid ? (
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 space-y-1">
                <div className="font-bold flex items-center justify-between">
                  <span>Diagnóstico del Validador (Apache 2.0 / SKILL.md):</span>
                  <span className="font-mono text-[11px]">
                    {validationResult.valid ? 'COMPLIANT ✅' : 'FAIL ❌'}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {validationResult.message}
                </p>
                {validationResult.errors.length > 0 && (
                  <ul className="list-disc pl-4 text-[11px] space-y-0.5 text-rose-300 mt-1">
                    {validationResult.errors.map((err, eIdx) => (
                      <li key={eIdx}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Code / Markdown Editor Canvas */}
            <div className="rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-2xl">
              <div className="px-4 py-2 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                <span>SKILL.md (Frontmatter YAML + Cuerpo Markdown)</span>
                <span>UTF-8</span>
              </div>
              <textarea
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                className="w-full h-[450px] p-4 bg-zinc-950 font-mono text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 leading-relaxed resize-none"
                spellCheck={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: 🧠 ATLAS CORE — CONSOLA DE AUDITORÍA & 11 AGENTES */}
      {/* ========================================================================= */}
      {activeTab === 'atlas_audit' && (
        <AtlasAuditConsole
          onSelectAgent={(agentId) => {
            setActiveTab('web_agent');
            handleSendMessage(`Diagnosticar e iniciar tarea directa con el agente [${agentId}].`);
          }}
          onLaunchSkillTest={(skillName) => {
            setActiveTab('web_agent');
            handleSendMessage(`Ejecutar y validar en caliente la habilidad dinámica: ${skillName}.`);
          }}
        />
      )}
    </div>
  );
};

export default ModuloWebAgentSkills;

