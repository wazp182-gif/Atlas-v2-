import React, { useState } from 'react';
import { 
  TrendingUp, 
  Plus, 
  Calendar, 
  Clock, 
  DollarSign, 
  Receipt, 
  Building2, 
  BarChart3,
  Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { VentaHora } from '../types/operaciones';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ModuloVentasProps {
  ventas: VentaHora[];
  onRefresh: () => void;
}

export function ModuloVentas({ ventas, onRefresh }: ModuloVentasProps) {
  const { userProfile, user, logAuditEvent } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [idSucursal, setIdSucursal] = useState(userProfile?.sucursalId || 'suc-central');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [hora, setHora] = useState(new Date().getHours());
  const [totalVenta, setTotalVenta] = useState('');
  const [numeroTickets, setNumeroTickets] = useState('');

  const ticketPromedio = Number(numeroTickets) > 0 ? (Number(totalVenta) || 0) / Number(numeroTickets) : 0;

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

      const nuevaVenta = {
        idSucursal,
        sucursalNombre: branchNames[idSucursal] || idSucursal,
        fecha,
        hora: Number(hora),
        totalVenta: Number(totalVenta) || 0,
        numeroTickets: Number(numeroTickets) || 0,
        ticketPromedio,
        creadoPorUID: user.uid,
        creadoPorNombre: userProfile?.nombre || user.email || 'Capitán',
        creadoEn: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'registros_ventas'), nuevaVenta);
      await logAuditEvent('REGISTRAR_VENTA_HORA', 'registros_ventas', docRef.id, {
        idSucursal,
        totalVenta: nuevaVenta.totalVenta,
        hora: nuevaVenta.hora,
      });

      setShowModal(false);
      onRefresh();
      setTotalVenta('');
      setNumeroTickets('');
    } catch (err: any) {
      console.error('Error guardando venta:', err);
      alert('Error al registrar venta en Firestore: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-cyan-500" />
            <span>Registro de Ventas por Hora & Desempeño</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Monitoreo en tiempo real de ingresos por franja horaria y ticket promedio por sucursal.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow-md transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Registrar Venta por Hora</span>
        </button>
      </div>

      {/* Sales list */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Fecha & Hora</th>
                <th className="py-3 px-4">Sucursal</th>
                <th className="py-3 px-4">Registrado Por</th>
                <th className="py-3 px-4 text-right">No. Tickets</th>
                <th className="py-3 px-4 text-right">Venta Total</th>
                <th className="py-3 px-4 text-right">Ticket Promedio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono">
              {ventas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500 font-sans text-xs">
                    No hay registros de ventas por hora para mostrar.
                  </td>
                </tr>
              ) : (
                ventas.map((v) => (
                  <tr key={v.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 px-4 font-sans font-medium text-zinc-900 dark:text-zinc-100">
                      {v.fecha} • <strong className="text-cyan-600 dark:text-cyan-400">{String(v.hora).padStart(2, '0')}:00 hrs</strong>
                    </td>
                    <td className="py-3 px-4 font-sans font-semibold text-zinc-800 dark:text-zinc-200">
                      {v.sucursalNombre || v.idSucursal}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      {v.creadoPorNombre}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {v.numeroTickets}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-zinc-900 dark:text-zinc-100">
                      ${v.totalVenta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                      ${v.ticketPromedio.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Captura de Ventas por Hora
                  </h3>
                  <p className="text-xs text-zinc-500">Módulo de sincronización operativa</p>
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
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Sucursal:
                </label>
                <select
                  value={idSucursal}
                  onChange={(e) => setIdSucursal(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                >
                  <option value="suc-central">Sucursal Central</option>
                  <option value="suc-norte">Sucursal Zona Norte</option>
                  <option value="suc-sur">Sucursal Zona Sur</option>
                  <option value="suc-oriente">Sucursal Oriente</option>
                  <option value="suc-poniente">Sucursal Poniente</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Fecha:
                  </label>
                  <input
                    type="date"
                    required
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Hora (Franja):
                  </label>
                  <select
                    value={hora}
                    onChange={(e) => setHora(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  >
                    {Array.from({ length: 24 }).map((_, i) => (
                      <option key={i} value={i}>
                        {String(i).padStart(2, '0')}:00 hrs
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Venta Total ($):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={totalVenta}
                    onChange={(e) => setTotalVenta(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    No. de Tickets:
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={numeroTickets}
                    onChange={(e) => setNumeroTickets(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              {Number(totalVenta) > 0 && Number(numeroTickets) > 0 && (
                <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-xs flex justify-between items-center text-cyan-600 dark:text-cyan-300">
                  <span>Ticket Promedio Calculado:</span>
                  <span className="font-mono font-bold text-sm">${ticketPromedio.toFixed(2)}</span>
                </div>
              )}

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
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer transition-colors disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar Venta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
