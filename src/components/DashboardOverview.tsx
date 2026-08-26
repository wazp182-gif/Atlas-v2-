import React from 'react';
import { 
  Building2, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  ClipboardCheck, 
  Tag, 
  Users, 
  Package, 
  ShieldCheck, 
  Plus, 
  CheckCircle2,
  Clock,
  Flame,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ConteoCaja, VentaHora, IncidenciaCapitan, ChecklistCocina, EtiquetaRegistro } from '../types/operaciones';

interface DashboardOverviewProps {
  onNavigate: (module: string) => void;
  conteos: ConteoCaja[];
  ventas: VentaHora[];
  incidencias: IncidenciaCapitan[];
  checklistsCocina: ChecklistCocina[];
  etiquetas: EtiquetaRegistro[];
}

export function DashboardOverview({
  onNavigate,
  conteos,
  ventas,
  incidencias,
  checklistsCocina,
  etiquetas,
}: DashboardOverviewProps) {
  const { userProfile, isAdmin, isAdminZona, isSuperAdmin } = useAuth();

  // Calculate high-level KPIs
  const totalVentasHoy = ventas.reduce((acc, v) => acc + (v.totalVenta || 0), 0);
  const totalTicketsHoy = ventas.reduce((acc, v) => acc + (v.numeroTickets || 0), 0);
  const ticketPromedio = totalTicketsHoy > 0 ? totalVentasHoy / totalTicketsHoy : 0;

  const conteosDescuadrados = conteos.filter((c) => Math.abs(c.diferencia) > 50).length;
  const incidenciasAbiertas = incidencias.filter((i) => i.estado === 'abierta').length;
  const etiquetasProximasVencer = etiquetas.filter((e) => e.estado === 'proximo_vencer').length;

  const rolLabelMap: Record<string, string> = {
    super_admin: 'Super Administrador (Dirección Matriz)',
    admin: 'Administrador General',
    admin_zona: 'Administrador de Zona / Regional',
    admin_zona_cocina: 'Admin de Zona Cocina',
    admin_zona_produccion: 'Admin de Zona Producción',
    operador: 'Capitán de Turno / Operador',
    operador_cocina: 'Operador de Cocina',
    operador_produccion: 'Operador de Producción',
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Role & Branch Verification */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Operación Activa • Sesión Verificada
            </span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Bienvenido, {userProfile?.nombre || 'Usuario'}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Rol: <strong className="text-zinc-800 dark:text-zinc-200">{rolLabelMap[userProfile?.rol || 'operador'] || userProfile?.rol}</strong> • Sucursal Base:{' '}
            <strong className="text-cyan-600 dark:text-cyan-400 uppercase">{userProfile?.sucursalId || 'Central'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('conteos')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            <DollarSign className="h-4 w-4" />
            <span>Nuevo Corte / Conteo</span>
          </button>
          <button
            onClick={() => onNavigate('incidencias')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs font-semibold cursor-pointer transition-colors"
          >
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span>Reportar Incidencia</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
            <span>Ventas Registradas Hoy</span>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 font-mono">
            ${totalVentasHoy.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {totalTicketsHoy} tickets • Promedio ${ticketPromedio.toFixed(1)}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
            <span>Alertas de Caja / Cortes</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 font-mono">
            {conteosDescuadrados}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {conteosDescuadrados > 0 ? 'Descuadres detectados > $50' : 'Cajas cuadradas al día'}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
            <span>Incidencias Operativas</span>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 font-mono">
            {incidenciasAbiertas}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {incidenciasAbiertas > 0 ? 'Requieren atención de Capitán/Admin' : 'Sin incidencias pendientes'}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
            <span>Etiquetas PEPS 🔴🟡🔵</span>
            <Tag className="h-4 w-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 font-mono">
            {etiquetas.length}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {etiquetasProximasVencer} por vencer en las próximas 48h
          </div>
        </div>
      </div>

      {/* Modules Quick Launch Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Módulos Operativos Conectados (Firestore RBAC)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Module 1: Conteos de Caja */}
          <div
            onClick={() => onNavigate('conteos')}
            className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <DollarSign className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
            </div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-3">
              Conteos y Cortes de Caja
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Desglose de efectivo, monedas, vouchers con validación de descuadre y aprobación.
            </p>
          </div>

          {/* Module 2: Ventas por Hora */}
          <div
            onClick={() => onNavigate('ventas')}
            className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-cyan-500/50 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                <TrendingUp className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-zinc-400 group-hover:text-cyan-500 transition-colors" />
            </div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-3">
              Registro de Ventas por Hora
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Ingreso de tickets por franja horaria con cálculo de ticket promedio y metas de sucursal.
            </p>
          </div>

          {/* Module 3: Checklists de Cocina & Actividades */}
          <div
            onClick={() => onNavigate('cocina')}
            className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-amber-500/50 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-zinc-400 group-hover:text-amber-500 transition-colors" />
            </div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-3">
              Checklists de Cocina & PEPS
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Temperaturas de cámaras frías, calidad de aceite, desinfección y apertura/cierre.
            </p>
          </div>

          {/* Module 4: Registro de Etiquetas 🔴🟡🔵 */}
          <div
            onClick={() => onNavigate('etiquetas')}
            className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-purple-500/50 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Tag className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-zinc-400 group-hover:text-purple-500 transition-colors" />
            </div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-3">
              Control de Etiquetas 🔴🟡🔵
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Rotulación de insumos preparados, fechas de caducidad y alertas de merma por color.
            </p>
          </div>

          {/* Module 5: Incidencias de Capitanes */}
          <div
            onClick={() => onNavigate('incidencias')}
            className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-red-500/50 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-zinc-400 group-hover:text-red-500 transition-colors" />
            </div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-3">
              Incidencias & Bitácora
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Reporte de fallas en equipo, personal, insumos y seguimiento hasta su resolución.
            </p>
          </div>

          {/* Module 6: Usuarios & Seguridad RBAC (Admins) */}
          {(isAdmin || isAdminZona) && (
            <div
              onClick={() => onNavigate('usuarios')}
              className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-indigo-500/50 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
              </div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-3">
                Administración de Personal & RBAC
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Asignación de sucursales, roles de seguridad, bitácora de auditoría inmutable.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
