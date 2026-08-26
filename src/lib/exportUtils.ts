import { MeetingAgenda } from '../types/agenda';

// Format time string HH:MM plus minutes offset
export function addMinutesToTime(startTime: string, minutesToAdd: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const date = new Date();
  date.setHours(hours || 9, minutes || 0, 0, 0);
  date.setMinutes(date.getMinutes() + minutesToAdd);
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function formatTimeRange(startTime: string, durationMinutes: number): string {
  const endTime = addMinutesToTime(startTime, durationMinutes);
  return `${startTime} - ${endTime}`;
}

// Generate an .ics iCalendar file for Google Calendar, Outlook, Apple Calendar
export function generateIcsContent(agenda: MeetingAgenda, scheduledDate?: string, scheduledTime?: string): string {
  const dateStr = scheduledDate || new Date().toISOString().split('T')[0];
  const timeStr = scheduledTime || '10:00';
  const [year, month, day] = dateStr.split('-');
  const [hours, minutes] = timeStr.split(':');

  const startDate = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes));
  const endDate = new Date(startDate.getTime() + agenda.totalDuration * 60000);

  const formatIcsDate = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const now = new Date();
  const uid = `agendacraft-${Date.now()}@agendacraft.app`;

  let description = `🎯 OBJETIVO:\\n${agenda.objective.replace(/\n/g, '\\n')}\\n\\n`;
  description += `⏱️ DURACIÓN TOTAL: ${agenda.totalDuration} min\\n\\n`;
  
  description += `👥 PARTICIPANTES CLAVE:\\n`;
  agenda.participants.forEach((p) => {
    description += `• ${p.name} (${p.role}) - ${p.attendance === 'required' ? '[OBLIGATORIO]' : '[OPCIONAL]'}\\n`;
  });

  description += `\\n📋 AGENDA Y TIEMPOS:\\n`;
  let currentOffset = 0;
  agenda.topics.forEach((t, index) => {
    const startT = addMinutesToTime(timeStr, currentOffset);
    const endT = addMinutesToTime(timeStr, currentOffset + t.durationMinutes);
    description += `${index + 1}. [${startT} - ${endT}] ${t.title} (${t.durationMinutes}m) - Líder: ${t.leadSpeaker}\\n`;
    description += `   Entregable: ${t.expectedDeliverable}\\n`;
    currentOffset += t.durationMinutes;
  });

  if (agenda.preMeetingChecklist?.length > 0) {
    description += `\\n✅ CHECKLIST PREVIO:\\n`;
    agenda.preMeetingChecklist.forEach((c) => {
      description += `• ${c}\\n`;
    });
  }

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AgendaCraft AI//Meeting Facilitator//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatIcsDate(now)}
DTSTART:${formatIcsDate(startDate)}
DTEND:${formatIcsDate(endDate)}
SUMMARY:${agenda.title}
DESCRIPTION:${description}
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR`;
}

// Trigger browser download for .ics
export function downloadIcsFile(agenda: MeetingAgenda, scheduledDate?: string, scheduledTime?: string) {
  const icsData = generateIcsContent(agenda, scheduledDate, scheduledTime);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${agenda.title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}_agenda.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Generate direct Google Calendar Event URL
export function generateGoogleCalendarUrl(agenda: MeetingAgenda, scheduledDate?: string, scheduledTime?: string): string {
  const dateStr = scheduledDate || new Date().toISOString().split('T')[0];
  const timeStr = scheduledTime || '10:00';
  const [year, month, day] = dateStr.split('-');
  const [hours, minutes] = timeStr.split(':');

  const startDate = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes));
  const endDate = new Date(startDate.getTime() + agenda.totalDuration * 60000);

  const formatGCalDate = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  let details = `🎯 OBJETIVO:\n${agenda.objective}\n\n`;
  details += `👥 PARTICIPANTES:\n`;
  agenda.participants.forEach((p) => {
    details += `• ${p.name} (${p.role}) - ${p.attendance === 'required' ? '[Requerido]' : '[Opcional]'}\n`;
  });
  details += `\n📋 LÍNEA DE TIEMPO:\n`;
  let currentOffset = 0;
  agenda.topics.forEach((t, i) => {
    const startT = addMinutesToTime(timeStr, currentOffset);
    const endT = addMinutesToTime(timeStr, currentOffset + t.durationMinutes);
    details += `${i + 1}. [${startT} - ${endT}] ${t.title} (${t.durationMinutes} min) - ${t.leadSpeaker}\n`;
    currentOffset += t.durationMinutes;
  });

  if (agenda.preMeetingChecklist?.length) {
    details += `\n✅ CHECKLIST PREVIO:\n`;
    agenda.preMeetingChecklist.forEach((item) => {
      details += `• ${item}\n`;
    });
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: agenda.title,
    dates: `${formatGCalDate(startDate)}/${formatGCalDate(endDate)}`,
    details: details,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Generate Clean Markdown
export function generateMarkdown(agenda: MeetingAgenda, scheduledDate?: string, scheduledTime?: string): string {
  const timeStr = scheduledTime || '10:00';
  let md = `# 📅 ${agenda.title}\n\n`;
  md += `**Tipo de Reunión:** ${agenda.meetingType} | **Duración Total:** ${agenda.totalDuration} min | **Fecha tentativa:** ${scheduledDate || 'Por definir'} ${timeStr}\n\n`;
  md += `## 🎯 Objetivo Principal\n${agenda.objective}\n\n`;
  
  if (agenda.summary) {
    md += `## 💡 Resumen Ejecutivo\n${agenda.summary}\n\n`;
  }

  md += `## 👥 Interesados y Participantes\n`;
  md += `| Asistente | Rol / Área | Asistencia | Rol en Reunión / Preparación |\n`;
  md += `|-----------|------------|------------|-----------------------------|\n`;
  agenda.participants.forEach((p) => {
    const att = p.attendance === 'required' ? '🟢 Requerido' : '⚪ Opcional';
    const dept = p.department ? `(${p.department})` : '';
    md += `| **${p.name}** | ${p.role} ${dept} | ${att} | ${p.whyRequired} ${p.suggestedPrep ? `*(Prep: ${p.suggestedPrep})*` : ''} |\n`;
  });
  md += `\n`;

  md += `## ⏱️ Línea de Tiempo y Temas de la Agenda\n\n`;
  let currentOffset = 0;
  agenda.topics.forEach((t, i) => {
    const startT = addMinutesToTime(timeStr, currentOffset);
    const endT = addMinutesToTime(timeStr, currentOffset + t.durationMinutes);
    md += `### ${i + 1}. [${startT} - ${endT}] ${t.title} (${t.durationMinutes} min)\n`;
    md += `- **Líder / Facilitador:** ${t.leadSpeaker}\n`;
    md += `- **Categoría:** ${t.category.toUpperCase()}\n`;
    md += `- **Descripción:** ${t.description}\n`;
    if (t.discussionPoints?.length) {
      md += `- **Puntos de Discusión:**\n`;
      t.discussionPoints.forEach((dp) => {
        md += `  - ${dp}\n`;
      });
    }
    md += `- **Entregable o Decisión Esperada:** 🎯 *${t.expectedDeliverable}*\n\n`;
    currentOffset += t.durationMinutes;
  });

  if (agenda.preMeetingChecklist?.length) {
    md += `## ✅ Checklist Previo para Asistentes\n`;
    agenda.preMeetingChecklist.forEach((item) => {
      md += `- [ ] ${item}\n`;
    });
    md += `\n`;
  }

  if (agenda.risksAndWatchouts?.length) {
    md += `## ⚠️ Riesgos y Puntos de Atención\n`;
    agenda.risksAndWatchouts.forEach((risk) => {
      md += `- ⚠️ ${risk}\n`;
    });
    md += `\n`;
  }

  md += `---\n*Generado con AgendaCraft AI*`;
  return md;
}

// Generate Slack / Teams format
export function generateSlackFormat(agenda: MeetingAgenda, scheduledDate?: string, scheduledTime?: string): string {
  const timeStr = scheduledTime || '10:00';
  let text = `*📅 ${agenda.title}*\n`;
  text += `⏱️ *Duración:* ${agenda.totalDuration} min | 🎯 *Objetivo:* ${agenda.objective}\n\n`;
  
  text += `*👥 Participantes Requeridos:*\n`;
  const reqs = agenda.participants.filter(p => p.attendance === 'required');
  text += reqs.map(p => `• *${p.name}* (${p.role})`).join('\n') + '\n\n';

  text += `*📋 Línea de Tiempo:*\n`;
  let currentOffset = 0;
  agenda.topics.forEach((t, i) => {
    const startT = addMinutesToTime(timeStr, currentOffset);
    const endT = addMinutesToTime(timeStr, currentOffset + t.durationMinutes);
    text += `*${i + 1}. [${startT} - ${endT}] ${t.title}* (${t.durationMinutes}m) - _Líder: ${t.leadSpeaker}_\n`;
    text += `> Entregable: ${t.expectedDeliverable}\n`;
    currentOffset += t.durationMinutes;
  });

  return text;
}
