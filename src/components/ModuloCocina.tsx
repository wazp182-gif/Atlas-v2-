import React, { useState } from 'react';
import { 
  ClipboardCheck, 
  Plus, 
  Thermometer, 
  Flame, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ChecklistCocina } from '../types/operaciones';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ModuloCocinaProps {
  checklistsCocina: ChecklistCocina[];
  onRefresh: () => void;
}

export function ModuloCocina({ checklistsCocina, onRefresh }: ModuloCocinaProps) {
  const { userProfile, user, logAuditEvent } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form
  const [sucursalId, setSucursalId] = useState(userProfile?.sucursalId || 'suc-central');
  const [turno, setTurno] = useState<'apertura' | 'operacion' | 'cierre'>('apertura');
  const [tempCamara1, setTempCamara1] = useState('3.5');
  const [tempCamara2, setTempCamara2] = useState('-18.0');
  const [limpiezaSuperficies, setLimpiezaSuperficies] = useState(true);
  const [rotulacionPEPS, setRotulacionPEPS] = useState(true);
  const [aceiteFreidoras, setAceiteFreidoras] = useState<'optimo' | 'medio' | 'cambiar'>('optimo');
  const [desinfeccionVegetales, setDesinfeccionVegetales] = useState(true);
  const [observaciones, setObservaciones] = useState('');

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

      const checks = [
        limpiezaSuperficies,
        rotulacionPEPS,
        aceiteFreidoras !== 'cambiar',
        desinfeccionVegetales,
        Number(tempCamara1) <= 4,
        Number(tempCamara2) <= -15,
      ];
      const cumplidos = checks.filter(Boolean).length;
      const porcentaje = Math.round((cumplidos / checks.length) * 100);

      const nuevoChecklist = {
        sucursalId,
        sucursalNombre: branchNames[sucursalId] || sucursalId,
        fecha: new Date().toISOString().split('T')[0],
        turno,
        responsableUid: user.uid,
        responsableNombre: userProfile?.nombre || user.email || 'Cocinero',
        temperaturaCamaras: [
          { camara: 'Refrigeración Frutas/Lácteos', tempCelsius: Number(tempCamara1), ok: Number(tempCamara1) <= 4 },
          { camara: 'Congelación Carnes', tempCelsius: Number(tempCamara2), ok: Number(tempCamara2) <= -15 },
        ],
        limpiezaSuperficies,
        rotulacionPEPS,
        aceiteFreidorasCalidad: aceiteFreidoras,
        desinfeccionVegetales,
        cumplimientoPorcentaje: porcentaje,
        observaciones: observaciones.trim() || 'Sin observaciones',
        estado: porcentaje >= 90 ? 'completo' : 'con_observaciones',
        creadoEn: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'cocina_checklists'), nuevoChecklist);
      await logAuditEvent('CREAR_CHECKLIST_COCINA', 'cocina_checklists', docRef.id, {
        sucursalId,
        turno,
        cumplimientoPorcentaje: porcentaje,
      });

      setShowModal(false);
      onRefresh();
    } catch (err: any) {
      console.error('Error guardando checklist:', err);
      alert('Error en Firestore: ' + err.message);
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
            <ClipboardCheck className="h-6 w-6 text-amber-500" />
            <span>Checklists de Cocina & Calidad Sanitaria</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Registro estandarizado de temperaturas, rotulación PEPS, aceites y puntos críticos de control.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer shadow-md transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Realizar Checklist Operativo</span>
        </button>
      </div>

      {/* Grid of Checklists */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {checklistsCocina.length === 0 ? (
          <div className="col-span-full py-12 text-center text-zinc-500 text-xs">
            No hay checklists de cocina completados hoy.
          </div>
        ) : (
          checklistsCocina.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
                  {item.fecha} • <span className="capitalize">{item.turno}</span>
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    item.cumplimientoPorcentaje >= 90
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}
                >
                  {item.cumplimientoPorcentaje}% Cumplimiento
                </span>
              </div>

              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Sucursal: <strong className="text-zinc-800 dark:text-zinc-200">{item.sucursalNombre || item.sucursalId}</strong>
                <br />
                Responsable: <span className="text-zinc-700 dark:text-zinc-300">{item.responsableNombre}</span>
              </div>

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-300">
                  <span className="flex items-center gap-1.5">
                    <Thermometer className="h-3.5 w-3.5 text-cyan-500" />
                    Cámaras Frías:
                  </span>
                  <span className="font-mono font-medium">
                    {item.temperaturaCamaras?.map((c) => `${c.tempCelsius}°C`).join(' / ') || 'Verificado'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-300">
                  <span className="flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5 text-amber-500" />
                    Aceite Freidoras:
                  </span>
                  <span className="capitalize font-medium">{item.aceiteFreidorasCalidad}</span>
                </div>
              </div>

              {item.observaciones && (
                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-950 text-[11px] text-zinc-500 dark:text-zinc-400 italic">
                  "{item.observaciones}"
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Nuevo Checklist de Cocina
                  </h3>
                  <p className="text-xs text-zinc-500">Evaluación de estándares operativos</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                    <option value="apertura">Apertura</option>
                    <option value="operacion">Operación / Intermedio</option>
                    <option value="cierre">Cierre</option>
                  </select>
                </div>
              </div>

              {/* Temperatures */}
              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 space-y-2">
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
                  Lecturas de Temperatura (°C):
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-500 mb-1">Refrigeración (Max 4°C):</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={tempCamara1}
                      onChange={(e) => setTempCamara1(e.target.value)}
                      className="w-full text-xs font-mono px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-500 mb-1">Congelación (Max -15°C):</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={tempCamara2}
                      onChange={(e) => setTempCamara2(e.target.value)}
                      className="w-full text-xs font-mono px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>
              </div>

              {/* Quality checkboxes */}
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={limpiezaSuperficies}
                    onChange={(e) => setLimpiezaSuperficies(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-0"
                  />
                  <span>Limpieza y sanitización de tablas, cuchillos y mesones OK</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rotulacionPEPS}
                    onChange={(e) => setRotulacionPEPS(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-0"
                  />
                  <span>Rotulación PEPS y fechas visibles en todos los contenedores</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={desinfeccionVegetales}
                    onChange={(e) => setDesinfeccionVegetales(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-0"
                  />
                  <span>Desinfección de verduras con microbicida en tiempo normativo</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Estado del Aceite de Freidoras:
                </label>
                <select
                  value={aceiteFreidoras}
                  onChange={(e) => setAceiteFreidoras(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                >
                  <option value="optimo">Óptimo (Transparente y sin olor)</option>
                  <option value="medio">Medio (Operativo sin humo)</option>
                  <option value="cambiar">Requiere Cambio Inmediato</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Observaciones:
                </label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Detalles sobre faltantes o ajustes realizados..."
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
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-500 text-white cursor-pointer transition-colors disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Firmar Checklist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
