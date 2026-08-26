import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Building2, 
  ShieldAlert, 
  FileText,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { IncidenciaCapitan } from '../types/operaciones';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ModuloIncidenciasProps {
  incidencias: IncidenciaCapitan[];
  onRefresh: () => void;
}

export function ModuloIncidencias({ incidencias, onRefresh }: ModuloIncidenciasProps) {
  const { userProfile, user, isAdmin, isAdminZona, logAuditEvent } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form
  const [sucursalId, setSucursalId] = useState(userProfile?.sucursalId || 'suc-central');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState<'baja' | 'media' | 'alta' | 'critica'>('media');
  const [tipo, setTipo] = useState<'personal' | 'equipo' | 'materia_prima' | 'seguridad' | 'cliente' | 'otro'>('equipo');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const branchNames: Record<string, string> = {
        'suc-central': 'Sucursal Central',
        'suc-norte': 'Sucursal Zona Norte',
        'suc-sur': 'Sucursal Zona Sur',
        'suc-oriente': 'Sucursal Oriente',
        'suc-poniente': 'Sucursal Poniente',
      };

      const nuevaIncidencia = {
        sucursalId,
        sucursalNombre: branchNames[sucursalId] || sucursalId,
        autorUid: user.uid,
        autorNombre: userProfile?.nombre || user.email || 'Capitán',
        titulo,
        descripcion,
        prioridad,
        tipo,
        estado: 'abierta',
        fecha: new Date().toISOString().split('T')[0],
        creadoEn: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'incidencias_capitanes'), nuevaIncidencia);
      await logAuditEvent('CREAR_INCIDENCIA', 'incidencias_capitanes', docRef.id, {
        sucursalId,
        prioridad,
        titulo,
      });

      setShowModal(false);
      onRefresh();
      setTitulo('');
      setDescripcion('');
    } catch (err: any) {
      console.error('Error al guardar incidencia:', err);
      alert('Error en Firestore: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolver = async (incidenciaId: string) => {
    try {
      await updateDoc(doc(db, 'incidencias_capitanes', incidenciaId), {
        estado: 'resuelta',
        resolucion: `Resuelta por ${userProfile?.nombre || 'Admin'} el ${new Date().toLocaleDateString()}`,
      });
      await logAuditEvent('RESOLVER_INCIDENCIA', 'incidencias_capitanes', incidenciaId);
      onRefresh();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <span>Incidencias Operativas & Bitácora de Turno</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Registro de eventualidades en sucursales, personal, averías técnicas y resolución en tiempo real.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer shadow-md transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Reportar Incidencia</span>
        </button>
      </div>

      {/* Incidencias Feed */}
      <div className="space-y-3">
        {incidencias.length === 0 ? (
          <div className="p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-center text-zinc-500 text-xs">
            No hay incidencias operativas reportadas.
          </div>
        ) : (
          incidencias.map((inc) => (
            <div
              key={inc.id}
              className={`p-4 rounded-xl border ${
                inc.prioridad === 'critica'
                  ? 'border-red-500/50 bg-red-500/5'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60'
              } space-y-2 shadow-xs transition-all`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      inc.prioridad === 'critica'
                        ? 'bg-red-600 text-white'
                        : inc.prioridad === 'alta'
                        ? 'bg-amber-600 text-white'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {inc.prioridad} • {inc.tipo}
                  </span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {inc.titulo}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      inc.estado === 'resuelta'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                    }`}
                  >
                    {inc.estado}
                  </span>
                  {inc.estado === 'abierta' && (isAdmin || isAdminZona) && (
                    <button
                      onClick={() => handleResolver(inc.id)}
                      className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded cursor-pointer transition-colors"
                    >
                      Marcar Resuelta
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-zinc-600 dark:text-zinc-300">{inc.descripcion}</p>

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400 flex justify-between items-center font-mono">
                <span>
                  Sucursal: <strong className="text-zinc-700 dark:text-zinc-300 font-sans">{inc.sucursalNombre || inc.sucursalId}</strong> • Por: {inc.autorNombre}
                </span>
                <span>{inc.fecha}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Reportar Incidencia
                  </h3>
                  <p className="text-xs text-zinc-500">Notificación al equipo de supervisión</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Sucursal:
                  </label>
                  <select
                    value={sucursalId}
                    onChange={(e) => setSucursalId(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  >
                    <option value="suc-central">Sucursal Central</option>
                    <option value="suc-norte">Sucursal Zona Norte</option>
                    <option value="suc-sur">Sucursal Zona Sur</option>
                    <option value="suc-oriente">Sucursal Oriente</option>
                    <option value="suc-poniente">Sucursal Poniente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Prioridad:
                  </label>
                  <select
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  >
                    <option value="baja">Baja (Mantenimiento menor)</option>
                    <option value="media">Media (Afecta ritmo)</option>
                    <option value="alta">Alta (Urgente)</option>
                    <option value="critica">Crítica (Detiene operación)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Tipo de Incidencia:
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                >
                  <option value="equipo">Avería de Equipo / Freidora / Terminal</option>
                  <option value="materia_prima">Faltante de Insumos / Calidad</option>
                  <option value="personal">Falta de Personal / Retardo</option>
                  <option value="seguridad">Seguridad e Higiene</option>
                  <option value="cliente">Queja / Evento con Cliente</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Título Breve:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Falla en compresor de cámara fría 1"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Descripción Detallada:
                </label>
                <textarea
                  rows={3}
                  required
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Explicación clara de lo sucedido y acciones temporales tomadas..."
                  className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-500 text-white cursor-pointer transition-colors disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Enviar Reporte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
