import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  Sparkles, 
  BookOpen, 
  Trash2, 
  Edit2, 
  ShieldCheck, 
  AlertCircle,
  Mail,
  Check
} from 'lucide-react';
import { MeetingAgenda, Participant } from '../types/agenda';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input, Textarea } from './ui/input';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Avatar } from './ui/tabs';

interface ParticipantsViewProps {
  agenda: MeetingAgenda;
  onUpdateAgenda: (updated: MeetingAgenda) => void;
}

export function ParticipantsView({ agenda, onUpdateAgenda }: ParticipantsViewProps) {
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New participant state
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newAttendance, setNewAttendance] = useState<'required' | 'optional'>('required');
  const [newWhy, setNewWhy] = useState('');
  const [newPrep, setNewPrep] = useState('');

  const requiredCount = agenda.participants.filter((p) => p.attendance === 'required').length;
  const optionalCount = agenda.participants.filter((p) => p.attendance === 'optional').length;

  const handleDelete = (id: string) => {
    const updated = agenda.participants.filter((p) => p.id !== id);
    onUpdateAgenda({ ...agenda, participants: updated });
  };

  const handleSaveEdit = () => {
    if (!editingParticipant) return;
    const updated = agenda.participants.map((p) =>
      p.id === editingParticipant.id ? editingParticipant : p
    );
    onUpdateAgenda({ ...agenda, participants: updated });
    setEditingParticipant(null);
  };

  const handleAddParticipant = () => {
    if (!newName.trim()) return;
    const newP: Participant = {
      id: `p-${Date.now()}`,
      name: newName.trim(),
      role: newRole.trim() || 'Stakeholder',
      department: newDepartment.trim() || 'General',
      attendance: newAttendance,
      whyRequired: newWhy.trim() || 'Participante clave para la toma de acuerdos.',
      suggestedPrep: newPrep.trim() || 'Revisar la documentación previa adjunta.',
    };

    onUpdateAgenda({ ...agenda, participants: [...agenda.participants, newP] });
    setNewName('');
    setNewRole('');
    setNewDepartment('');
    setNewWhy('');
    setNewPrep('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
              Mapeo de Stakeholders
            </span>
            <Badge variant="outline" className="text-xs border-zinc-300 dark:border-zinc-700">
              {agenda.participants.length} participantes detectados
            </Badge>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
            Interesados y Participantes Clave
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Roles estratégicos identificados automáticamente a partir del documento para garantizar decisiones vinculantes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-500/20">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {requiredCount} Obligatorios
            </span>
            <span className="flex items-center gap-1 font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-700">
              <span className="h-2 w-2 rounded-full bg-zinc-400" />
              {optionalCount} Opcionales
            </span>
          </div>

          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="gap-1.5 text-xs bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-bold dark:bg-cyan-400"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Añadir Asistente</span>
          </Button>
        </div>
      </div>

      {/* Participants Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agenda.participants.map((participant) => {
          const isReq = participant.attendance === 'required';

          return (
            <div
              key={participant.id}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-5 transition-all shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 flex flex-col justify-between"
            >
              <div>
                {/* Header: Avatar, Name, Role & Attendance Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={participant.name} className="h-10 w-10 text-sm font-bold" />
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        {participant.name}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                        {participant.role} {participant.department ? `• ${participant.department}` : ''}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      isReq
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    {isReq ? 'Requerido' : 'Opcional'}
                  </span>
                </div>

                {/* Why Required Box */}
                <div className="mt-4 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/80 text-xs">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="h-3 w-3" />
                    Impacto / Razón de su asistencia:
                  </span>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {participant.whyRequired}
                  </p>
                </div>

                {/* Suggested Pre-Meeting Preparation */}
                {participant.suggestedPrep && (
                  <div className="mt-2.5 flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400 px-1">
                    <BookOpen className="h-3.5 w-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-zinc-700 dark:text-zinc-300">Preparación previa: </strong>
                      <span>{participant.suggestedPrep}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingParticipant(participant)}
                  className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-cyan-500 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <Edit2 className="h-3 w-3" />
                  <span>Editar</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(participant.id)}
                  className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-red-500 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Participant Dialog */}
      {editingParticipant && (
        <Dialog open={Boolean(editingParticipant)} onOpenChange={(open) => !open && setEditingParticipant(null)}>
          <DialogHeader>
            <DialogTitle>Editar Participante / Interesado</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-xs py-2">
            <div>
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Nombre:</label>
              <Input
                value={editingParticipant.name}
                onChange={(e) => setEditingParticipant({ ...editingParticipant, name: e.target.value })}
                className="mt-1 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-zinc-700 dark:text-zinc-300">Cargo / Rol:</label>
                <Input
                  value={editingParticipant.role}
                  onChange={(e) => setEditingParticipant({ ...editingParticipant, role: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <label className="font-medium text-zinc-700 dark:text-zinc-300">Departamento / Área:</label>
                <Input
                  value={editingParticipant.department || ''}
                  onChange={(e) => setEditingParticipant({ ...editingParticipant, department: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Tipo de Asistencia:</label>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="editAtt"
                    checked={editingParticipant.attendance === 'required'}
                    onChange={() => setEditingParticipant({ ...editingParticipant, attendance: 'required' })}
                  />
                  <span>🟢 Obligatorio (Requerido)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="editAtt"
                    checked={editingParticipant.attendance === 'optional'}
                    onChange={() => setEditingParticipant({ ...editingParticipant, attendance: 'optional' })}
                  />
                  <span>⚪ Opcional</span>
                </label>
              </div>
            </div>

            <div>
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Razón fundamental de su asistencia:</label>
              <Textarea
                value={editingParticipant.whyRequired}
                onChange={(e) => setEditingParticipant({ ...editingParticipant, whyRequired: e.target.value })}
                className="mt-1 text-xs h-16"
              />
            </div>

            <div>
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Preparación previa requerida:</label>
              <Input
                value={editingParticipant.suggestedPrep || ''}
                onChange={(e) => setEditingParticipant({ ...editingParticipant, suggestedPrep: e.target.value })}
                className="mt-1 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditingParticipant(null)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSaveEdit} className="bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-bold">
              Guardar Cambios
            </Button>
          </DialogFooter>
        </Dialog>
      )}

      {/* Add Participant Dialog */}
      {isAddModalOpen && (
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogHeader>
            <DialogTitle>Añadir Nuevo Interesado</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-xs py-2">
            <div>
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Nombre Completo:</label>
              <Input
                placeholder="Ej: Lic. Martín Ramos"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-zinc-700 dark:text-zinc-300">Cargo / Posición:</label>
                <Input
                  placeholder="Ej: Lead Cloud Architect"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <label className="font-medium text-zinc-700 dark:text-zinc-300">Área / Departamento:</label>
                <Input
                  placeholder="Ej: DevOps & SRE"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Asistencia:</label>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="newAtt"
                    checked={newAttendance === 'required'}
                    onChange={() => setNewAttendance('required')}
                  />
                  <span>🟢 Obligatorio</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="newAtt"
                    checked={newAttendance === 'optional'}
                    onChange={() => setNewAttendance('optional')}
                  />
                  <span>⚪ Opcional</span>
                </label>
              </div>
            </div>

            <div>
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Razón e impacto en la reunión:</label>
              <Textarea
                placeholder="Por qué su presencia es crucial para autorizar o aportar..."
                value={newWhy}
                onChange={(e) => setNewWhy(e.target.value)}
                className="mt-1 text-xs h-16"
              />
            </div>

            <div>
              <label className="font-medium text-zinc-700 dark:text-zinc-300">Preparación recomendada:</label>
              <Input
                placeholder="Lectura de informe previo, métricas de SLA..."
                value={newPrep}
                onChange={(e) => setNewPrep(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleAddParticipant} disabled={!newName.trim()} className="bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-bold">
              Añadir Asistente
            </Button>
          </DialogFooter>
        </Dialog>
      )}
    </div>
  );
}
