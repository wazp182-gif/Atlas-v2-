import React, { useState } from 'react';
import { 
  Tag, 
  Plus, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Search,
  Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { EtiquetaRegistro } from '../types/operaciones';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ModuloEtiquetasProps {
  etiquetas: EtiquetaRegistro[];
  onRefresh: () => void;
}

export function ModuloEtiquetas({ etiquetas, onRefresh }: ModuloEtiquetasProps) {
  const { userProfile, user, logAuditEvent } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterColor, setFilterColor] = useState('all');

  // Form
  const [sucursalId, setSucursalId] = useState(userProfile?.sucursalId || 'suc-central');
  const [tipoColor, setTipoColor] = useState<'rojo' | 'amarillo' | 'azul'>('rojo');
  const [nombreProducto, setNombreProducto] = useState('');
  const [lote, setLote] = useState('LOT-' + Math.floor(1000 + Math.random() * 9000));
  const [fechaElaboracion, setFechaElaboracion] = useState(new Date().toISOString().split('T')[0]);
  const [diasCaducidad, setDiasCaducidad] = useState(3);

  const calculateCaducidad = (baseDate: string, days: number) => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const fechaCaducidad = calculateCaducidad(fechaElaboracion, diasCaducidad);

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

      const nuevaEtiqueta = {
        sucursalId,
        sucursalNombre: branchNames[sucursalId] || sucursalId,
        tipoColor,
        nombreProducto,
        lote,
        fechaElaboracion,
        fechaCaducidad,
        usuarioResponsable: {
          uid: user.uid,
          nombre: userProfile?.nombre || user.email || 'Operador',
        },
        estado: 'vigente',
        creadoEn: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'etiquetas_registros'), nuevaEtiqueta);
      await logAuditEvent('CREAR_ETIQUETA_PEPS', 'etiquetas_registros', docRef.id, {
        sucursalId,
        tipoColor,
        nombreProducto,
      });

      setShowModal(false);
      onRefresh();
      setNombreProducto('');
    } catch (err: any) {
      console.error('Error al registrar etiqueta:', err);
      alert('Error en Firestore: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = etiquetas.filter((e) => {
    if (filterColor !== 'all' && e.tipoColor !== filterColor) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Tag className="h-6 w-6 text-purple-500" />
            <span>Sistema de Etiquetas & Rotulación PEPS 🔴🟡🔵</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Control de insumos preparados, primeras entradas - primeras salidas y prevención de mermas.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer shadow-md transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Nueva Etiqueta PEPS</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilterColor('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
            filterColor === 'all'
              ? 'bg-zinc-800 text-white'
              : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
          }`}
        >
          Todas las Etiquetas ({etiquetas.length})
        </button>
        <button
          onClick={() => setFilterColor('rojo')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
            filterColor === 'rojo'
              ? 'bg-red-600 text-white'
              : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
          }`}
        >
          <span>🔴 Carnes / Aves Preparadas</span>
        </button>
        <button
          onClick={() => setFilterColor('amarillo')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
            filterColor === 'amarillo'
              ? 'bg-amber-500 text-zinc-950 font-bold'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
          }`}
        >
          <span>🟡 Lácteos / Salsas / Postres</span>
        </button>
        <button
          onClick={() => setFilterColor('azul')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
            filterColor === 'azul'
              ? 'bg-blue-600 text-white'
              : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
          }`}
        >
          <span>🔵 Vegetales / Frutas Procesadas</span>
        </button>
      </div>

      {/* Grid of Active Labels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-zinc-500 text-xs">
            No hay etiquetas registradas con este filtro.
          </div>
        ) : (
          filtered.map((item) => {
            const colorBg =
              item.tipoColor === 'rojo'
                ? 'border-red-500/40 bg-red-500/5'
                : item.tipoColor === 'amarillo'
                ? 'border-amber-500/40 bg-amber-500/5'
                : 'border-blue-500/40 bg-blue-500/5';

            const badgeColor =
              item.tipoColor === 'rojo'
                ? 'bg-red-500 text-white'
                : item.tipoColor === 'amarillo'
                ? 'bg-amber-400 text-zinc-950'
                : 'bg-blue-500 text-white';

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border ${colorBg} bg-white dark:bg-zinc-900/80 space-y-3 shadow-xs relative overflow-hidden`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${badgeColor}`}>
                    {item.tipoColor.toUpperCase()} • {item.lote}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {item.sucursalNombre || item.sucursalId}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {item.nombreProducto}
                  </h4>
                  <p className="text-xs text-zinc-500">
                    Responsable: {item.usuarioResponsable?.nombre || 'Operador'}
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-zinc-400 block font-sans">Elaborado:</span>
                    <strong className="text-zinc-700 dark:text-zinc-300">{item.fechaElaboracion}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block font-sans">Caducidad PEPS:</span>
                    <strong className="text-red-600 dark:text-red-400">{item.fechaCaducidad}</strong>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Tag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Generar Etiqueta PEPS
                  </h3>
                  <p className="text-xs text-zinc-500">Impresión y registro de insumos</p>
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
                  Código de Color Sanitario:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoColor('rojo')}
                    className={`py-2 text-xs font-bold rounded-lg border text-center cursor-pointer transition-all ${
                      tipoColor === 'rojo'
                        ? 'border-red-500 bg-red-500/10 text-red-500 ring-2 ring-red-500'
                        : 'border-zinc-300 dark:border-zinc-800 text-zinc-500'
                    }`}
                  >
                    🔴 Rojo (Carnes)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoColor('amarillo')}
                    className={`py-2 text-xs font-bold rounded-lg border text-center cursor-pointer transition-all ${
                      tipoColor === 'amarillo'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-500 ring-2 ring-amber-500'
                        : 'border-zinc-300 dark:border-zinc-800 text-zinc-500'
                    }`}
                  >
                    🟡 Amarillo (Lácteos)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoColor('azul')}
                    className={`py-2 text-xs font-bold rounded-lg border text-center cursor-pointer transition-all ${
                      tipoColor === 'azul'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-500 ring-2 ring-blue-500'
                        : 'border-zinc-300 dark:border-zinc-800 text-zinc-500'
                    }`}
                  >
                    🔵 Azul (Verduras)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Nombre del Insumo / Producto Preparado:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Pechuga Marinada / Salsa Especial / Lechuga Picada"
                  value={nombreProducto}
                  onChange={(e) => setNombreProducto(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Lote Generado:
                  </label>
                  <input
                    type="text"
                    required
                    value={lote}
                    onChange={(e) => setLote(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Vida Útil (Días):
                  </label>
                  <select
                    value={diasCaducidad}
                    onChange={(e) => setDiasCaducidad(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  >
                    <option value={1}>1 Día (Uso Rápido)</option>
                    <option value={2}>2 Días</option>
                    <option value={3}>3 Días (Estándar)</option>
                    <option value={5}>5 Días (Congelados)</option>
                    <option value={7}>7 Días</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-sans">Fecha de Elaboración:</span>
                  <span>{fechaElaboracion}</span>
                </div>
                <div className="flex justify-between font-bold text-red-600 dark:text-red-400">
                  <span className="font-sans">Caducidad Calculada:</span>
                  <span>{fechaCaducidad}</span>
                </div>
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
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-purple-600 hover:bg-purple-500 text-white cursor-pointer transition-colors disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Crear Etiqueta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
