export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'admin_zona'
  | 'admin_zona_cocina'
  | 'admin_zona_produccion'
  | 'operador'
  | 'operador_cocina'
  | 'operador_produccion'
  // Legacy aliases
  | 'admin_sec'
  | 'capitan'
  | 'usuario_cocina'
  | 'usuario_produccion'
  | 'jefe_zona';

export interface UserProfile {
  uid: string;
  email: string;
  nombre: string;
  rol: UserRole;
  area?: 'general' | 'cocina' | 'produccion' | 'administracion';
  sucursalId?: string;
  sucursalesAsignadas?: string[];
  activo: boolean;
  telefono?: string;
  fechaCreacion?: any;
  ultimoAcceso?: any;
  fotoURL?: string;
}

export interface Sucursal {
  id: string;
  nombre: string;
  codigo: string;
  zona: string;
  direccion: string;
  telefono?: string;
  activa: boolean;
  gerenteEncargado?: string;
}

export interface ConteoCaja {
  id: string;
  sucursalId: string;
  sucursalNombre?: string;
  capitanId: string;
  capitanNombre: string;
  fecha: string;
  turno: 'matutino' | 'vespertino' | 'nocturno';
  totalEsperado: number;
  totalContado: number;
  diferencia: number;
  desgloseBilletes?: Record<string, number>;
  desgloseMonedas?: Record<string, number>;
  tarjetas?: number;
  transferencias?: number;
  gastosCajaChica?: { concepto: string; monto: number }[];
  observaciones?: string;
  estado: 'aprobado' | 'descuadre' | 'pendiente_revision';
  creadoEn: any;
}

export interface InventarioItem {
  id: string;
  sucursalId: string;
  categoria: 'refrescos' | 'pan_postres' | 'cocina' | 'produccion' | 'insumos';
  nombre: string;
  unidad: string;
  stockActual: number;
  stockMinimo: number;
  costoUnitario?: number;
  ultimaActualizacion: any;
  actualizadoPor: string;
}

export interface VentaHora {
  id: string;
  idSucursal: string;
  sucursalNombre?: string;
  fecha: string;
  hora: number; // 0-23
  totalVenta: number;
  numeroTickets: number;
  ticketPromedio: number;
  creadoPorUID: string;
  creadoPorNombre: string;
  creadoEn: any;
}

export interface IncidenciaCapitan {
  id: string;
  sucursalId: string;
  sucursalNombre?: string;
  autorUid: string;
  autorNombre: string;
  titulo: string;
  descripcion: string;
  prioridad: 'baja' | 'media' | 'alta' | 'critica';
  tipo: 'personal' | 'equipo' | 'materia_prima' | 'seguridad' | 'cliente' | 'otro';
  estado: 'abierta' | 'en_proceso' | 'resuelta';
  resolucion?: string;
  fotos?: string[];
  fecha: string;
  creadoEn: any;
}

export interface ChecklistCocina {
  id: string;
  sucursalId: string;
  sucursalNombre?: string;
  fecha: string;
  turno: 'apertura' | 'operacion' | 'cierre';
  responsableUid: string;
  responsableNombre: string;
  temperaturaCamaras: { camara: string; tempCelsius: number; ok: boolean }[];
  limpiezaSuperficies: boolean;
  rotulacionPEPS: boolean;
  aceiteFreidorasCalidad: 'optimo' | 'medio' | 'cambiar';
  desinfeccionVegetales: boolean;
  cumplimientoPorcentaje: number;
  observaciones?: string;
  estado: 'completo' | 'incompleto' | 'con_observaciones';
  creadoEn: any;
}

export interface ChecklistProduccion {
  id: string;
  sucursalId: string;
  sucursalNombre?: string;
  lote: string;
  lineaProduccion: string;
  responsableUid: string;
  responsableNombre: string;
  unidadesProducidas: number;
  mermas: number;
  controlCalidadAprobado: boolean;
  insumosUtilizados: { insumo: string; cantidad: number; unidad: string }[];
  observaciones?: string;
  creadoEn: any;
}

export interface EtiquetaRegistro {
  id: string;
  sucursalId: string;
  sucursalNombre?: string;
  tipoColor: 'rojo' | 'amarillo' | 'azul'; // 🔴🟡🔵
  nombreProducto: string;
  lote: string;
  fechaElaboracion: string;
  fechaCaducidad: string;
  usuarioResponsable: {
    uid: string;
    nombre: string;
  };
  temperaturaAlmacen?: number;
  estado: 'vigente' | 'proximo_vencer' | 'merma' | 'consumido';
  creadoEn: any;
}

export interface BitacoraLog {
  id: string;
  usuarioUid: string;
  usuarioNombre: string;
  usuarioRol: string;
  accion: string;
  coleccionAfectada: string;
  documentoId?: string;
  detalles: any;
  sucursalId?: string;
  ip?: string;
  userAgent?: string;
  timestamp: any;
}
