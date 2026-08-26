import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Building2, 
  KeyRound, 
  CheckCircle2, 
  UserPlus, 
  Search,
  Lock,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserProfile, UserRole, BitacoraLog } from '../types/operaciones';
import { collection, getDocs, doc, updateDoc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function ModuloSeguridadUsuarios() {
  const { userProfile, isSuperAdmin, isAdmin, logAuditEvent } = useAuth();
  const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
  const [logs, setLogs] = useState<BitacoraLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const fetchUsersAndLogs = async () => {
    setLoading(true);
    try {
      // Users
      const uSnap = await getDocs(collection(db, 'usuarios'));
      const uList: UserProfile[] = [];
      uSnap.forEach((d) => uList.push(d.data() as UserProfile));
      setUsuarios(uList);

      // Audit logs
      const lSnap = await getDocs(query(collection(db, 'bitacora'), orderBy('timestamp', 'desc'), limit(20)));
      const lList: BitacoraLog[] = [];
      lSnap.forEach((d) => lList.push({ id: d.id, ...d.data() } as BitacoraLog));
      setLogs(lList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndLogs();
  }, []);

  const handleUpdateRole = async (targetUid: string, newRole: UserRole) => {
    if (!isAdmin) {
      alert('Solo administradores pueden reasignar roles de seguridad.');
      return;
    }
    try {
      await updateDoc(doc(db, 'usuarios', targetUid), {
        rol: newRole,
      });
      await logAuditEvent('CAMBIO_ROL_USUARIO', 'usuarios', targetUid, { nuevoRol: newRole });
      fetchUsersAndLogs();
      alert('Rol actualizado correctamente bajo el esquema RBAC.');
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-indigo-500" />
          <span>Gestión de Roles RBAC & Bitácora de Auditoría</span>
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Control de acceso a sucursales, privilegios por jerarquía y registro criptográfico de eventos inmutables.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Management */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Usuarios y Asignación de Permisos ({usuarios.length})</span>
          </h3>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Usuario</th>
                    <th className="py-3 px-4">Sucursal Base</th>
                    <th className="py-3 px-4">Rol Asignado</th>
                    <th className="py-3 px-4 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {usuarios.map((u) => (
                    <tr key={u.uid} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">{u.nombre}</div>
                        <div className="text-[11px] text-zinc-400 font-mono">{u.email}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-cyan-600 dark:text-cyan-400">
                        {u.sucursalId || 'suc-central'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-bold">
                          {u.rol}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isAdmin && (
                          <select
                            value={u.rol}
                            onChange={(e) => handleUpdateRole(u.uid, e.target.value as UserRole)}
                            className="text-xs px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 focus:outline-none"
                          >
                            <option value="super_admin">super_admin</option>
                            <option value="admin">admin</option>
                            <option value="admin_zona">admin_zona</option>
                            <option value="admin_zona_cocina">admin_zona_cocina</option>
                            <option value="admin_zona_produccion">admin_zona_produccion</option>
                            <option value="operador">operador</option>
                            <option value="operador_cocina">operador_cocina</option>
                            <option value="operador_produccion">operador_produccion</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Audit Log Stream */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span>Bitácora de Auditoría (Inmutable)</span>
          </h3>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 space-y-3 shadow-xs max-h-[500px] overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-xs text-zinc-500">No hay registros de auditoría aún.</p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/80 space-y-1 text-xs"
                >
                  <div className="flex justify-between items-center">
                    <strong className="text-indigo-600 dark:text-indigo-400 font-mono text-[11px]">
                      {log.accion}
                    </strong>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {log.timestamp ? 'Reciente' : 'Inmutable'}
                    </span>
                  </div>
                  <div className="text-zinc-600 dark:text-zinc-300 text-[11px]">
                    Usuario: <span className="font-semibold">{log.usuarioNombre}</span> ({log.usuarioRol})
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono truncate">
                    Colección: {log.coleccionAfectada} {log.documentoId ? `• Doc: ${log.documentoId}` : ''}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
