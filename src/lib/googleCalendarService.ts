/**
 * Google Calendar Integration Service for Atlas Director
 * Handles OAuth Token acquisition via Google Identity Services,
 * reading calendar events, creating meetings, scheduling automatic reminders,
 * and generating smart operational meeting suggestions.
 */

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{ email: string; displayName?: string }>;
  conferenceData?: {
    createRequest?: {
      requestId: string;
      conferenceSolutionKey: { type: string };
    };
    entryPoints?: Array<{ entryPointType: string; uri: string }>;
  };
  hangoutLink?: string;
  htmlLink?: string;
  status?: string;
  colorId?: string;
}

export interface SmartMeetingSuggestion {
  id: string;
  title: string;
  reason: string;
  priority: 'critica' | 'alta' | 'media' | 'rutina';
  branchName: string;
  branchId?: string;
  suggestedDurationMinutes: number;
  suggestedDate: string; // YYYY-MM-DD
  suggestedTime: string; // HH:MM
  suggestedAttendees: string[];
  agendaTopics: string[];
  originEventType: 'incidencia' | 'caja' | 'cocina_peps' | 'ventas';
  originEventId?: string;
}

declare global {
  interface Window {
    google?: any;
  }
}

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const TOKEN_STORAGE_KEY = 'atlas_gcal_access_token';
const TOKEN_EXPIRY_KEY = 'atlas_gcal_token_expires_at';

// Check if current stored token is valid
export function getStoredCalendarToken(): string | null {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!token) return null;
  if (expiry && Date.now() > parseInt(expiry, 10)) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    return null;
  }
  return token;
}

// Store token locally
export function storeCalendarToken(token: string, expiresInSeconds: number = 3590) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  const expiresAt = Date.now() + expiresInSeconds * 1000;
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString());
}

// Clear calendar token
export function clearCalendarToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

// Request Token using Google Identity Services (GSI)
export function requestGoogleCalendarAccess(clientId?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // If running in development without a hardcoded client ID, allow mock/fallback or GIS client
    const targetClientId = clientId || (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '763285078460-atlas-calendar.apps.googleusercontent.com';

    if (typeof window === 'undefined') {
      reject(new Error('Window is not defined'));
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      // If script is not yet loaded or blocked, check stored token or resolve with fallback session
      const stored = getStoredCalendarToken();
      if (stored) {
        resolve(stored);
        return;
      }
      reject(new Error('El cliente de Google Identity Services no está listo. Por favor recarga la página.'));
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: targetClientId,
        scope: CALENDAR_SCOPE,
        callback: (response: any) => {
          if (response.error) {
            console.error('Error in Google OAuth:', response);
            reject(new Error(response.error_description || response.error));
            return;
          }
          if (response.access_token) {
            const expiresIn = response.expires_in ? parseInt(response.expires_in, 10) : 3600;
            storeCalendarToken(response.access_token, expiresIn);
            resolve(response.access_token);
          } else {
            reject(new Error('No se recibió token de acceso de Google Calendar.'));
          }
        },
      });

      client.requestAccessToken({ prompt: 'consent' });
    } catch (err: any) {
      console.warn('Google Identity Client error:', err);
      reject(err);
    }
  });
}

// Fetch upcoming events from Google Calendar API
export async function listUpcomingEvents(
  token: string,
  maxResults: number = 10,
  timeMin?: string
): Promise<GoogleCalendarEvent[]> {
  try {
    const minTime = timeMin || new Date().toISOString();
    const url = new URL(`${CALENDAR_API_BASE}/calendars/primary/events`);
    url.searchParams.append('timeMin', minTime);
    url.searchParams.append('singleEvents', 'true');
    url.searchParams.append('orderBy', 'startTime');
    url.searchParams.append('maxResults', maxResults.toString());

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        clearCalendarToken();
        throw new Error('Token expirado o no autorizado. Por favor re-conecta tu cuenta de Google.');
      }
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Error Calendar API: ${res.status}`);
    }

    const data = await res.json();
    return data.items || [];
  } catch (err: any) {
    console.error('Error fetching calendar events:', err);
    throw err;
  }
}

// Create a new event on Google Calendar
export async function createGoogleCalendarEvent(
  token: string,
  event: Partial<GoogleCalendarEvent>
): Promise<GoogleCalendarEvent> {
  try {
    const url = `${CALENDAR_API_BASE}/calendars/primary/events?conferenceDataVersion=1`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!res.ok) {
      if (res.status === 401) {
        clearCalendarToken();
        throw new Error('Token expirado. Por favor re-autentica Google Calendar.');
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Error al crear evento: ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    console.error('Error creating calendar event:', err);
    throw err;
  }
}

// Quick Add / Create operational reminder event
export async function createOperationalReminder(
  token: string,
  title: string,
  dateISO: string,
  notes?: string
): Promise<GoogleCalendarEvent> {
  const startTime = new Date(dateISO);
  const endTime = new Date(startTime.getTime() + 30 * 60000); // 30 mins

  const newEvent: Partial<GoogleCalendarEvent> = {
    summary: `🔔 [ATLAS Recordatorio] ${title}`,
    description: `${notes || ''}\n\nCreado automáticamente por ATLAS Director de Operaciones.`,
    start: {
      dateTime: startTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    colorId: '11', // Bold Red
  };

  return createGoogleCalendarEvent(token, newEvent);
}

// Smart Heuristic Engine: Analyzes branch discrepancies and suggests operational meetings
export function generateSmartMeetingSuggestions(
  incidencias: Array<{
    id: string;
    titulo: string;
    descripcion: string;
    prioridad: string;
    sucursalNombre?: string;
    sucursalId?: string;
    autorNombre?: string;
    fecha: string;
  }>,
  conteosCaja: Array<{
    id: string;
    sucursalNombre?: string;
    sucursalId?: string;
    capitanNombre?: string;
    diferencia: number;
    estado: string;
    fecha: string;
    turno: string;
  }>,
  checklistsCocina: Array<{
    id: string;
    sucursalNombre?: string;
    sucursalId?: string;
    responsableNombre?: string;
    limpiezaSuperficies?: boolean;
    rotulacionPEPS?: boolean;
    aceiteFreidorasCalidad?: string;
    fecha: string;
    turno: string;
  }>
): SmartMeetingSuggestion[] {
  const suggestions: SmartMeetingSuggestion[] = [];
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // 1. Incidencias críticas o altas
  const criticalIncidencias = incidencias.filter(
    (i) => i.prioridad === 'critica' || i.prioridad === 'alta'
  );

  criticalIncidencias.slice(0, 3).forEach((inc, idx) => {
    suggestions.push({
      id: `sug-inc-${inc.id}`,
      title: `Auditoría Urgente: ${inc.titulo}`,
      reason: `Incidencia ${inc.prioridad.toUpperCase()} reportada en ${inc.sucursalNombre || 'Sucursal'}: "${inc.descripcion.slice(0, 70)}..."`,
      priority: inc.prioridad === 'critica' ? 'critica' : 'alta',
      branchName: inc.sucursalNombre || 'Sucursal Principal',
      branchId: inc.sucursalId,
      suggestedDurationMinutes: 45,
      suggestedDate: tomorrowStr,
      suggestedTime: idx === 0 ? '10:00' : idx === 1 ? '11:30' : '16:00',
      suggestedAttendees: [inc.autorNombre || 'Capitán de Turno', 'director@lct.com', 'gerencia.zona@lct.com'],
      agendaTopics: [
        `Revisión de causa raíz de la falla reportada: ${inc.titulo}`,
        `Plan de contención inmediato para ${inc.sucursalNombre || 'la sucursal'}`,
        `Asignación de responsables y fecha límite de resolución`,
        `Verificación de protocolos de seguridad y servicio al cliente`,
      ],
      originEventType: 'incidencia',
      originEventId: inc.id,
    });
  });

  // 2. Descuadres en Cierre de Caja
  const descuadres = conteosCaja.filter(
    (c) => c.estado === 'descuadre' || Math.abs(c.diferencia) >= 100
  );

  descuadres.slice(0, 2).forEach((caja, idx) => {
    const diffText = caja.diferencia < 0 ? `Faltante de $${Math.abs(caja.diferencia).toFixed(2)}` : `Sobrante de $${caja.diferencia.toFixed(2)}`;
    suggestions.push({
      id: `sug-caja-${caja.id}`,
      title: `Aclaración de Cierre de Caja - Turno ${caja.turno.toUpperCase()}`,
      reason: `Descuadre financiero detectado en ${caja.sucursalNombre || 'Sucursal'}: ${diffText}.`,
      priority: Math.abs(caja.diferencia) > 500 ? 'alta' : 'media',
      branchName: caja.sucursalNombre || 'Sucursal Centro',
      branchId: caja.sucursalId,
      suggestedDurationMinutes: 30,
      suggestedDate: tomorrowStr,
      suggestedTime: idx === 0 ? '09:30' : '15:00',
      suggestedAttendees: [caja.capitanNombre || 'Cajero / Capitán', 'auditoria.cajas@lct.com'],
      agendaTopics: [
        `Cotejo de tickets de venta vs corte Z y terminales bancarias`,
        `Revisión de retiros parciales y fondo de caja chica`,
        `Firma de acta administrativa o ajuste contable justificado`,
      ],
      originEventType: 'caja',
      originEventId: caja.id,
    });
  });

  // 3. Cocina: Incumplimiento de rotulación PEPS o aceite degradado
  const kitchenIssues = checklistsCocina.filter(
    (ck) => ck.rotulacionPEPS === false || ck.aceiteFreidorasCalidad === 'cambiar'
  );

  if (kitchenIssues.length > 0) {
    const firstIssue = kitchenIssues[0];
    suggestions.push({
      id: `sug-peps-${firstIssue.id}`,
      title: `Comité de Inocuidad y Estándar PEPS Cocina`,
      reason: `Desviación en rotulación de insumos PEPS o cambio de aceite en ${firstIssue.sucursalNombre || 'Cocina Central'}.`,
      priority: 'media',
      branchName: firstIssue.sucursalNombre || 'Cocina Central',
      branchId: firstIssue.sucursalId,
      suggestedDurationMinutes: 40,
      suggestedDate: tomorrowStr,
      suggestedTime: '17:00',
      suggestedAttendees: [firstIssue.responsableNombre || 'Jefe de Cocina', 'control.calidad@lct.com'],
      agendaTopics: [
        `Auditoría de caducidades en cámaras de refrigeración y congelación`,
        `Re-capacitación inmediata en etiquetado PEPS y temperaturas mínimas`,
        `Reposición de insumos y verificación del estado de freidoras`,
      ],
      originEventType: 'cocina_peps',
      originEventId: firstIssue.id,
    });
  }

  // Fallback if no issues: Standard weekly operational review
  if (suggestions.length === 0) {
    suggestions.push({
      id: `sug-default-weekly`,
      title: `Reunión de Alineación Operativa y Ventas Semanal`,
      reason: `Seguimiento proactivo de metas comerciales y satisfacción de comensales en todas las sucursales.`,
      priority: 'rutina',
      branchName: 'Todas las Sucursales',
      suggestedDurationMinutes: 60,
      suggestedDate: tomorrowStr,
      suggestedTime: '11:00',
      suggestedAttendees: ['directorio@lct.com', 'capitanes@lct.com', 'gerencia.operaciones@lct.com'],
      agendaTopics: [
        `Revisión de ticket promedio y ventas por hora de la semana`,
        `Cumplimiento de checklists de apertura y cierre`,
        `Feedback de capitanes y planes de incentivos`,
      ],
      originEventType: 'ventas',
    });
  }

  return suggestions;
}
