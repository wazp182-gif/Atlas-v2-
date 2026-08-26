import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  RefreshCw,
  Power,
  ToggleLeft,
  ToggleRight,
  Database,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers,
  Sparkles,
  Search,
  Sliders
} from 'lucide-react';
import { AtlasAgentStatus, AgentSkill } from '../types/webAgent';

interface AtlasAuditConsoleProps {
  onSelectAgent?: (agentId: string) => void;
  onLaunchSkillTest?: (skillName: string) => void;
}

export const AtlasAuditConsole: React.FC<AtlasAuditConsoleProps> = ({
  onSelectAgent,
  onLaunchSkillTest
}) => {
  const [agents, setAgents] = useState<AtlasAgentStatus[]>([
    { id: "agent_director", name: "Atlas Director", role: "Orquestador Principal", task: "Supervisando red y balance operativo", memory_usage_kb: 240, status: "IDLE" },
    { id: "agent_operations", name: "Agente Operaciones", role: "Gestor de Sucursales LCT", task: "Auditoría de aperturas y checklist", memory_usage_kb: 180, status: "WORKING" },
    { id: "agent_inventarios", name: "Agente Inventarios", role: "Control de Existencias", task: "Revisión stock crítico y rotación PEPS", memory_usage_kb: 120, status: "WORKING" },
    { id: "agent_rh", name: "Agente Recursos Humanos", role: "Faltas e Incidencias", task: "En espera de corte de turno", memory_usage_kb: 95, status: "IDLE" },
    { id: "agent_balance", name: "Agente Balances", role: "Cuadre Diario y Finanzas", task: "Conciliación de cortes y caja chica", memory_usage_kb: 310, status: "IDLE" },
    { id: "agent_master_studio", name: "Master Studio", role: "Pipelines de Procesamiento", task: "Procesando batches de datos", memory_usage_kb: 450, status: "WORKING" },
    { id: "agent_powerbi", name: "Agente Power BI", role: "Métricas y Dashboards", task: "Sincronizando KPIs operativos", memory_usage_kb: 210, status: "IDLE" },
    { id: "agent_auditor", name: "Agente Auditor", role: "Seguridad y Políticas", task: "Inspección de logs y permisos", memory_usage_kb: 130, status: "IDLE" },
    { id: "agent_knowledge", name: "Knowledge Engine", role: "Búsqueda RAG y Documentos", task: "Indexando base de conocimiento", memory_usage_kb: 512, status: "IDLE" },
    { id: "agent_skills", name: "Skills Manager", role: "Ejecución de Módulos", task: "Escaneando manifiestos YAML y specs", memory_usage_kb: 115, status: "WORKING" },
    { id: "agent_web", name: "Web Surfer & Extractor", role: "Búsqueda Gemini Web", task: "Ejecución con Search Grounding", memory_usage_kb: 85, status: "IDLE" }
  ]);

  const [skills, setSkills] = useState<any[]>([
    {
      manifest: {
        name: "web-market-researcher",
        version: "1.0.0",
        description: "Investiga tendencias del mercado gastronómico y precios con Google Search.",
        category: "web_research",
        enabled: true,
        required_permissions: ["googleSearch", "urlContext"]
      },
      enabled: true,
      status: "ACTIVE"
    },
    {
      manifest: {
        name: "food-safety-compliance-check",
        version: "1.2.0",
        description: "Audita normativas sanitarias oficiales (NOM-251, HACCP) y temperaturas de inocuidad.",
        category: "compliance",
        enabled: true,
        required_permissions: ["googleSearch"]
      },
      enabled: true,
      status: "ACTIVE"
    },
    {
      manifest: {
        name: "supplier-price-comparison",
        version: "1.1.0",
        description: "Rastrea y compara precios mayoristas de insumos alimenticios en tiempo real.",
        category: "finance",
        enabled: true,
        required_permissions: ["googleSearch", "urlContext"]
      },
      enabled: true,
      status: "ACTIVE"
    },
    {
      manifest: {
        name: "docfx-diataxis-audit",
        version: "1.0.0",
        description: "Valida y reestructura manuales de procedimientos operativos según Diátaxis.",
        category: "operations",
        enabled: true,
        required_permissions: ["googleSearch"]
      },
      enabled: true,
      status: "ACTIVE"
    }
  ]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString());
  const [togglingSkill, setTogglingSkill] = useState<string | null>(null);

  // Fetch agent status from API
  const fetchStatus = async () => {
    setIsRefreshing(true);
    try {
      const [resAgents, resSkills] = await Promise.all([
        fetch('/api/v1/debug/agents/status').then(r => r.json()),
        fetch('/api/v1/debug/skills/list').then(r => r.json())
      ]);

      if (resAgents.agents && Array.isArray(resAgents.agents)) {
        setAgents(resAgents.agents);
      }
      if (resSkills.skills && Array.isArray(resSkills.skills)) {
        setSkills(resSkills.skills);
      }
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.warn("Using active in-memory state for Atlas agents:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initial fetch and 5s auto-polling
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  // Toggle skill active state
  const handleToggleSkill = async (skillName: string, currentEnabled: boolean) => {
    setTogglingSkill(skillName);
    const newEnabled = !currentEnabled;
    try {
      await fetch('/api/v1/debug/skills/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skill_name: skillName,
          enabled: newEnabled
        })
      });

      // Update local state immediately
      setSkills(prev => prev.map(s => {
        if (s.manifest.name === skillName) {
          return {
            ...s,
            enabled: newEnabled,
            status: newEnabled ? "ACTIVE" : "DISABLED",
            manifest: { ...s.manifest, enabled: newEnabled }
          };
        }
        return s;
      }));
    } catch (err) {
      console.error("Error toggling skill:", err);
    } finally {
      setTogglingSkill(null);
    }
  };

  // Metrics
  const totalMemoryKb = agents.reduce((acc, curr) => acc + curr.memory_usage_kb, 0);
  const activeWorkingCount = agents.filter(a => a.status === 'WORKING').length;
  const activeSkillsCount = skills.filter(s => s.enabled).length;

  return (
    <div className="space-y-6">
      {/* Top Banner with Glassmorphism & Status */}
      <div className="p-6 rounded-2xl bg-zinc-950/90 border border-cyan-500/30 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
              <h2 className="text-xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
                ATLAS CORE — CONSOLA DE AUDITORÍA & 11 AGENTES
              </h2>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              Monitoreo en tiempo real de memoria activa, hilos de ejecución autónomos y escáner YAML de habilidades.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-[11px] font-mono text-zinc-400">Última sincronización</div>
              <div className="text-xs font-mono font-bold text-cyan-400">{lastSyncTime}</div>
            </div>
            <button
              onClick={fetchStatus}
              disabled={isRefreshing}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-cyan-500/40 text-cyan-300 hover:text-cyan-200 text-xs font-mono font-semibold flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Sincronizando...' : 'Refrescar'}</span>
            </button>
          </div>
        </div>

        {/* Global Key Metrics KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-zinc-800/80">
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono text-zinc-400">Total Agentes</div>
              <div className="text-lg font-bold font-mono text-white">{agents.length} Activos</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono text-zinc-400">En Ejecución</div>
              <div className="text-lg font-bold font-mono text-emerald-400">{activeWorkingCount} / {agents.length}</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-950/80 text-indigo-400 border border-indigo-800">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono text-zinc-400">Memoria Asignada</div>
              <div className="text-lg font-bold font-mono text-indigo-300">{totalMemoryKb} KB</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-950/80 text-amber-400 border border-amber-800">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono text-zinc-400">Skills YAML</div>
              <div className="text-lg font-bold font-mono text-amber-300">{activeSkillsCount} Habilitados</div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: 11 AGENTS LIVE STATUS GRID */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            <span>Red Operativa de Agentes Autónomos (11 Agentes)</span>
          </h3>
          <span className="text-[11px] font-mono text-zinc-400">Loop de monitoreo activo</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {agents.map((agent) => {
            const isWorking = agent.status === 'WORKING';
            return (
              <div
                key={agent.id}
                onClick={() => onSelectAgent?.(agent.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isWorking
                    ? 'bg-zinc-900/90 border-emerald-500/50 shadow-lg shadow-emerald-950/20'
                    : 'bg-zinc-950/80 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <strong className="text-xs font-mono font-bold text-white block truncate">
                      {agent.name}
                    </strong>
                    <span className="text-[10px] text-zinc-400 block font-mono">
                      {agent.role}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 flex items-center gap-1 ${
                      isWorking
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 animate-pulse'
                        : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                    }`}
                  >
                    <span>●</span>
                    <span>{agent.status}</span>
                  </span>
                </div>

                <div className="mt-3 p-2.5 rounded-lg bg-black/40 border border-zinc-800/80 text-[11px] font-mono">
                  <div className="text-[10px] text-zinc-500 uppercase">Tarea actual:</div>
                  <div className="text-amber-300 truncate mt-0.5">{agent.task}</div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-2 border-t border-zinc-800/50">
                  <span className="flex items-center gap-1">
                    <Database className="h-3 w-3 text-cyan-400" />
                    <span>Memoria: <strong className="text-cyan-300">{agent.memory_usage_kb} KB</strong></span>
                  </span>
                  <span className="text-zinc-500">ID: {agent.id.replace('agent_', '')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: DYNAMIC SKILLS & YAML SCANNER REGISTRY */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold font-mono text-cyan-400 uppercase tracking-wider">
              Gestor de Habilidades Dinámicas (YAML Scanner & Hot-Reload)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Watcher Loop Activo (10s)</span>
          </span>
        </div>

        <div className="rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-zinc-900/90 text-cyan-400 border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Habilidad / Manifiesto YAML</th>
                  <th className="py-3 px-4">Versión</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Permisos</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acción Dinámica</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {skills.map((item, idx) => {
                  const m = item.manifest;
                  const isEnabled = item.enabled;
                  const isBusy = togglingSkill === m.name;
                  return (
                    <tr key={idx} className="hover:bg-zinc-900/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{m.name}</span>
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1 max-w-md">
                          {m.description}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-zinc-300">{m.version || '1.0.0'}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 text-[10px]">
                          {m.category || 'general'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1 flex-wrap">
                          {(m.required_permissions || ['googleSearch']).map((perm: string, pIdx: number) => (
                            <span key={pIdx} className="px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800 text-[9px]">
                              {perm}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold ${
                            isEnabled ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isEnabled ? '● ACTIVE' : '○ DISABLED'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onLaunchSkillTest?.(m.name)}
                            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                            title="Probar en Web Agent"
                          >
                            <Play className="h-2.5 w-2.5" />
                            <span>Ejecutar</span>
                          </button>
                          <button
                            onClick={() => handleToggleSkill(m.name, isEnabled)}
                            disabled={isBusy}
                            className={`px-3 py-1 rounded text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50 ${
                              isEnabled
                                ? 'bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-700'
                                : 'bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-700'
                            }`}
                          >
                            {isBusy ? 'Actualizando...' : isEnabled ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AtlasAuditConsole;
