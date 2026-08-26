import React, { useState } from 'react';
import { 
  DollarSign, 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowDownRight, 
  Filter, 
  Search, 
  Building2,
  Trash2,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ConteoCaja } from '../types/operaciones';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ModuloConteosProps {
  conteos: ConteoCaja[];
  onRefresh: () => void;
}

export function ModuloConteos({ conteos, onRefresh }: ModuloConteosProps) {
  const { userProfile, user, isAdmin, isAdminZona, hasBranchAccess, logAuditEvent } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterBranch, setFilterBranch] = useState('all');

  // Form State
  const [sucursalId, setSucursalId] = useState(userProfile?.sucursalId || 'suc-central');
  const [turno, setTurno] = useState<'matutino' | 'vespertino' | 'nocturno'>('matutino');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [totalEsperado, setTotalEsperado] = useState('');
  const [totalContado, setTotalContado] = useState('');
  const [tarjetas, setTarjetas] = useState('');
  const [transferencias, setTransferencias] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const diferencia = (Number(totalContado) || 0) - (Number(totalEsperado) || 0);

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

      const nuevoConteo = {
        sucursalId,
        sucursalNombre: branchNames[sucursalId] || sucursalId,
        capitanId: user.uid,
        capitanNombre: userProfile?.nombre || user.email || 'Capitán',
        fecha,
        turno,
        totalEsperado: Number(totalEsperado) || 0,
        totalContado: Number(totalContado) || 0,
        diferencia,
        tarjetas: Number(tarjetas) || 0,
        transferencias: Number(transferencias) || 0,
        observaciones: observaciones.trim() || 'Sin observaciones',
        estado: Math.abs(diferencia) === 0 ? 'aprobado' : 'descuadre',
        creadoEn: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'conteos'), nuevoConteo);
      await logAuditEvent('CREAR_CONTEO_CAJA', 'conteos', docRef.id, {
        sucursalId,
        diferencia,
        totalContado: nuevoConteo.totalContado,
      });

      setShowModal(false);
      onRefresh();
      // Reset
      setTotalEsperado('');
      setTotalContado('');
      setTarjetas('');
      setTransferencias('');
      setObservaciones('');
    } catch (err: any) {
      console.error('Error al guardar conteo:', err);
      alert('Error al guardar el conteo en Firestore: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredConteos = conteos.filter((c) => {
    if (filterBranch !== 'all' && c.sucursalId !== filterBranch) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-emerald-500" />
            <span>Conteos de Caja & Arqueos Diarios</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Registro con verificación de firma de capitán y validación de descuadres en tiempo real.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-md transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Registrar Conteo de Caja</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Filtrar por sucursal:</span>
        <select
          value={filterBranch}
          onChange={(e) => setFilterBranch(e.target.value)}
          className="text-xs px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none"
        >
          <option value="all">Todas las Sucursales Autorizadas</option>
          <option value="suc-central">Sucursal Central</option>
          <option value="suc-norte">Sucursal Zona Norte</option>
          <option value="suc-sur">Sucursal Zona Sur</option>
          <option value="suc-oriente">Sucursal Oriente</option>
          <option value="suc-poniente">Sucursal Poniente</option>
        </select>
      </div>

      {/* Table of conteos */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Fecha & Turno</th>
                <th className="py-3 px-4">Sucursal</th>
                <th className="py-3 px-4">Capitán / Responsable</th>
                <th className="py-3 px-4 text-right">Total Esperado</th>
                <th className="py-3 px-4 text-right">Total Contado</th>
                <th className="py-3 px-4 text-right">Diferencia</th>
                <th className="py-3 px-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono">
              {filteredConteos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500 font-sans text-xs">
                    No se encontraron registros de conteos de caja.
                  </td>
                </tr>
              ) : (
                filteredConteos.map((conteo) => (
                  <tr key={conteo.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 px-4 font-sans font-medium text-zinc-900 dark:text-zinc-100">
                      {conteo.fecha} • <span className="capitalize">{conteo.turno}</span>
                    </td>
                    <td className="py-3 px-4 font-sans font-semibold text-cyan-600 dark:text-cyan-400">
                      {conteo.sucursalNombre || conteo.sucursalId}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      {conteo.capitanNombre}
                    </td>
                    <td className="py-3 px-4 text-right">
                      ${conteo.totalEsperado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-zinc-900 dark:text-zinc-100">
                      ${conteo.totalContado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-bold ${
                        conteo.diferencia === 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : conteo.diferencia > 0
                          ? 'text-cyan-600 dark:text-cyan-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {conteo.diferencia > 0 ? `+$${conteo.diferencia.toFixed(2)}` : `$${conteo.diferencia.toFixed(2)}`}
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          conteo.diferencia === 0
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                        }`}
                      >
                        {conteo.diferencia === 0 ? 'Cuadrado' : 'Descuadre'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal to register new conteo */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Nuevo Conteo / Arqueo de Caja
                  </h3>
                  <p className="text-xs text-zinc-500">Registrado por: {userProfile?.nombre}</p>
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
                    Turno:
                  </label>
                  <select
                    value={turno}
                    onChange={(e) => setTurno(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  >
                    <option value="matutino">Matutino</option>
                    <option value="vespertino">Vespertino</option>
                    <option value="nocturno">Nocturno / Cierre</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Fecha del Arqueo:
                </label>
                <input
                  type="date"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Total Esperado (Sistema $):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={totalEsperado}
                    onChange={(e) => setTotalEsperado(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Total Físico Contado ($):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={totalContado}
                    onChange={(e) => setTotalContado(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              {/* Real-time difference indicator */}
              {(totalEsperado || totalContado) && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-center justify-between font-mono ${
                    diferencia === 0
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                  }`}
                >
                  <span className="font-sans font-semibold">Diferencia Calculada:</span>
                  <span className="text-sm font-bold">
                    {diferencia > 0 ? `+$${diferencia.toFixed(2)} (Sobrante)` : `$${diferencia.toFixed(2)} ${diferencia < 0 ? '(Faltante)' : ''}`}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Observaciones / Justificación de Descuadre:
                </label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Detalles sobre billetes falsos, gastos no registrados o devoluciones..."
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
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer transition-colors disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar y Certificar Conteo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
