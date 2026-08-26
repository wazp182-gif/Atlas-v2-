import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  DollarSign, 
  TrendingUp, 
  ClipboardCheck, 
  Tag, 
  AlertTriangle, 
  ShieldCheck, 
  LogOut, 
  Moon, 
  Sun, 
  Menu, 
  X,
  Layers,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { DashboardOverview } from './components/DashboardOverview';
import { AtlasDirectorConsole } from './components/AtlasDirectorConsole';
import { ModuloConteos } from './components/ModuloConteos';
import { ModuloVentas } from './components/ModuloVentas';
import { ModuloCocina } from './components/ModuloCocina';
import { ModuloEtiquetas } from './components/ModuloEtiquetas';
import { ModuloIncidencias } from './components/ModuloIncidencias';
import { ModuloSeguridadUsuarios } from './components/ModuloSeguridadUsuarios';
import { ConteoCaja, VentaHora, IncidenciaCapitan, ChecklistCocina, EtiquetaRegistro } from './types/operaciones';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from './lib/firebase';

export function App() {
  const { user, userProfile, loading, logout, isAdmin, isAdminZona } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isDark, setIsDark] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Firestore Real-time collections
  const [conteos, setConteos] = useState<ConteoCaja[]>([]);
  const [ventas, setVentas] = useState<VentaHora[]>([]);
  const [incidencias, setIncidencias] = useState<IncidenciaCapitan[]>([]);
  const [checklistsCocina, setChecklistsCocina] = useState<ChecklistCocina[]>([]);
  const [etiquetas, setEtiquetas] = useState<EtiquetaRegistro[]>([]);

  useEffect(() => {
    if (!user) return;

    // Listen to Conteos
    const qConteos = query(collection(db, 'conteos'), orderBy('creadoEn', 'desc'), limit(50));
    const unsubConteos = onSnapshot(qConteos, (snapshot) => {
      const list: ConteoCaja[] = [];
      snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as ConteoCaja));
      setConteos(list);
    }, (err) => console.warn('Conteos listener:', err));

    // Listen to Ventas
    const qVentas = query(collection(db, 'registros_ventas'), orderBy('creadoEn', 'desc'), limit(50));
    const unsubVentas = onSnapshot(qVentas, (snapshot) => {
      const list: VentaHora[] = [];
      snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as VentaHora));
      setVentas(list);
    }, (err) => console.warn('Ventas listener:', err));

    // Listen to Incidencias
    const qIncidencias = query(collection(db, 'incidencias_capitanes'), orderBy('creadoEn', 'desc'), limit(50));
    const unsubIncidencias = onSnapshot(qIncidencias, (snapshot) => {
      const list: IncidenciaCapitan[] = [];
      snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as IncidenciaCapitan));
      setIncidencias(list);
    }, (err) => console.warn('Incidencias listener:', err));

    // Listen to Checklists Cocina
    const qCocina = query(collection(db, 'cocina_checklists'), orderBy('creadoEn', 'desc'), limit(50));
    const unsubCocina = onSnapshot(qCocina, (snapshot) => {
      const list: ChecklistCocina[] = [];
      snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as ChecklistCocina));
      setChecklistsCocina(list);
    }, (err) => console.warn('Cocina listener:', err));

    // Listen to Etiquetas
    const qEtiquetas = query(collection(db, 'etiquetas_registros'), orderBy('creadoEn', 'desc'), limit(50));
    const unsubEtiquetas = onSnapshot(qEtiquetas, (snapshot) => {
      const list: EtiquetaRegistro[] = [];
      snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as EtiquetaRegistro));
      setEtiquetas(list);
    }, (err) => console.warn('Etiquetas listener:', err));

    return () => {
      unsubConteos();
      unsubVentas();
      unsubIncidencias();
      unsubCocina();
      unsubEtiquetas();
    };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-300">
        <div className="h-8 w-8 rounded-full border-3 border-cyan-500 border-t-transparent animate-spin mb-4" />
        <span className="text-xs font-mono tracking-wider">Iniciando entorno Operaciones LCT...</span>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Atlas Director', icon: Sparkles },
    { id: 'tablero', label: 'Tablero Operativo', icon: Layers },
    { id: 'conteos', label: 'Caja & Arqueos', icon: DollarSign },
    { id: 'ventas', label: 'Ventas por Hora', icon: TrendingUp },
    { id: 'cocina', label: 'Checklist Cocina', icon: ClipboardCheck },
    { id: 'etiquetas', label: 'Etiquetas PEPS', icon: Tag },
    { id: 'incidencias', label: 'Incidencias', icon: AlertTriangle },
    ...((isAdmin || isAdminZona) ? [{ id: 'usuarios', label: 'Seguridad RBAC', icon: ShieldCheck }] : []),
  ];

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'dark bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
      {/* Top Bar Header following Contract: [Brand title] — [Nav links] — [Actions] */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          
          {/* Zone 1: Brand title (One single text element) */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-black tracking-tight text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
              OPERACIONES LCT
            </span>
          </div>

          {/* Zone 2: Nav items (Single-line, up to 6 items) */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    active
                      ? 'bg-zinc-900 dark:bg-zinc-800 text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-pointer"
              title="Cambiar tema"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 text-xs">
              <span className="font-semibold truncate max-w-[120px]">{userProfile?.nombre || user.email}</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-600/20 text-cyan-600 dark:text-cyan-400 font-bold">
                {userProfile?.rol || 'operador'}
              </span>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-red-500/10 hover:border-red-500/30 text-zinc-600 dark:text-zinc-400 hover:text-red-500 text-xs font-semibold cursor-pointer transition-colors shrink-0"
              title="Cerrar sesión"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Salir</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-left cursor-pointer ${
                    active
                      ? 'bg-cyan-600 text-white'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeTab === 'dashboard' && (
          <AtlasDirectorConsole
            conteos={conteos}
            ventas={ventas}
            incidencias={incidencias}
            checklistsCocina={checklistsCocina}
            etiquetas={etiquetas}
            onNavigateToModule={(mod) => setActiveTab(mod)}
          />
        )}

        {activeTab === 'tablero' && (
          <DashboardOverview
            onNavigate={(mod) => setActiveTab(mod)}
            conteos={conteos}
            ventas={ventas}
            incidencias={incidencias}
            checklistsCocina={checklistsCocina}
            etiquetas={etiquetas}
          />
        )}

        {activeTab === 'conteos' && (
          <ModuloConteos conteos={conteos} onRefresh={() => {}} />
        )}

        {activeTab === 'ventas' && (
          <ModuloVentas ventas={ventas} onRefresh={() => {}} />
        )}

        {activeTab === 'cocina' && (
          <ModuloCocina checklistsCocina={checklistsCocina} onRefresh={() => {}} />
        )}

        {activeTab === 'etiquetas' && (
          <ModuloEtiquetas etiquetas={etiquetas} onRefresh={() => {}} />
        )}

        {activeTab === 'incidencias' && (
          <ModuloIncidencias incidencias={incidencias} onRefresh={() => {}} />
        )}

        {activeTab === 'usuarios' && (isAdmin || isAdminZona) && (
          <ModuloSeguridadUsuarios />
        )}
      </main>

      {/* Bottom Status bar */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-3 px-4 sm:px-6 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 text-xs flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="font-mono">Firestore DB Conectada: {userProfile?.sucursalId || 'Matriz'}</span>
        </div>
        <div className="font-mono text-[11px]">
          Reglas de Seguridad RBAC v2.0 Activas • Cifrado de Turnos
        </div>
      </footer>
    </div>
  );
}

export default App;
