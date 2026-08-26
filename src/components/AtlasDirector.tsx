import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

// ==========================================
// 1. TIPOS E INTERFACES
// ==========================================

export interface AtlasMemoryState {
  lastSummary: string;
  lastTopics: string[];
  pendingActions: string[];
  lastInteractionTimestamp?: any;
}

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
}

export interface NotificationDoc {
  id: string;
  type: 'cierre_caja' | 'tarea_urgente' | 'alerta';
  title: string;
  message: string;
  status: 'pending' | 'read' | 'dismissed';
}

export interface SyncLoopConfig {
  userId: string;
  calendarService: AtlasCalendarService;
  getMemoryContext: () => AtlasMemoryState | null;
  onSuggestSchedule: (message: string, slot: { start: Date; end: Date }) => void;
  intervalMs?: number;
}

// ==========================================
// 2. SERVICIO DE GOOGLE CALENDAR API
// ==========================================

export class AtlasCalendarService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async getUpcomingEvents(maxResults: number = 10): Promise<CalendarEvent[]> {
    const timeMin = new Date().toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
      timeMin
    )}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${this.accessToken}` }
    });
    if (!res.ok) throw new Error(`Google Calendar API Error: ${res.statusText}`);
    const data = await res.json();
    return data.items || [];
  }

  async checkAvailability(startTime: Date, endTime: Date): Promise<boolean> {
    const events = await this.getUpcomingEvents(50);
    const startIso = startTime.getTime();
    const endIso = endTime.getTime();

    const hasConflict = events.some((evt) => {
      const evtStart = new Date(evt.start.dateTime).getTime();
      const evtEnd = new Date(evt.end.dateTime).getTime();
      return Math.max(startIso, evtStart) < Math.min(endIso, evtEnd);
    });

    return !hasConflict;
  }

  async scheduleTimeBlock(event: CalendarEvent): Promise<CalendarEvent> {
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });
    if (!res.ok) throw new Error(`Error al crear evento: ${res.statusText}`);
    return await res.json();
  }
}

// ==========================================
// 3. HOOK DE MEMORIA PERSISTENTE
// ==========================================

export function useAtlasMemory(userId: string) {
  const [memory, setMemory] = useState<AtlasMemoryState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!userId) return;
    let isSubscribed = true;
    const fetchMemory = async () => {
      try {
        const memRef = doc(db, 'users', userId, 'atlas_memory', 'state');
        const snapshot = await getDoc(memRef);
        if (snapshot.exists() && isSubscribed) {
          setMemory(snapshot.data() as AtlasMemoryState);
        } else if (isSubscribed) {
          // Fallback to top-level atlas_memory if available
          const rootMemRef = doc(db, 'atlas_memory', userId);
          const rootSnap = await getDoc(rootMemRef);
          if (rootSnap.exists() && isSubscribed) {
            const data = rootSnap.data() as any;
            setMemory({
              lastSummary: data?.context?.lastExecutiveSummary || '',
              lastTopics: data?.context?.recentTopics || [],
              pendingActions: data?.context?.unresolvedQueries || [],
              lastInteractionTimestamp: data?.context?.lastInteractionTimestamp
            });
          }
        }
      } catch (err) {
        console.warn('Advertencia al cargar memoria de Atlas:', err);
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };
    fetchMemory();

    return () => {
      isSubscribed = false;
    };
  }, [userId]);

  const persistInteractionSummary = useCallback(
    async (summary: string, topics: string[] = [], pendingActions: string[] = []) => {
      if (!userId) return;
      const updatedState: AtlasMemoryState = {
        lastSummary: summary,
        lastTopics: topics,
        pendingActions,
        lastInteractionTimestamp: serverTimestamp()
      };

      try {
        const memRef = doc(db, 'users', userId, 'atlas_memory', 'state');
        await setDoc(memRef, updatedState, { merge: true });
        setMemory(updatedState);
      } catch (err) {
        console.warn('Error al persistir memoria en Atlas:', err);
      }
    },
    [userId]
  );

  return { memory, loading, persistInteractionSummary };
}

// ==========================================
// 4. BUCLE DE SINCRONIZACIÓN (LOOP)
// ==========================================

export function startAtlasDirectorLoop({
  userId,
  calendarService,
  getMemoryContext,
  onSuggestSchedule,
  intervalMs = 60000
}: SyncLoopConfig) {
  let isRunning = true;

  const executeLoop = async () => {
    if (!isRunning) return;

    try {
      const memory = getMemoryContext();

      if (memory?.pendingActions && memory.pendingActions.length > 0) {
        const nextHour = new Date(Date.now() + 30 * 60 * 1000);
        const endSlot = new Date(nextHour.getTime() + 30 * 60 * 1000);

        const isFree = await calendarService.checkAvailability(nextHour, endSlot);

        if (isFree) {
          const actionItem = memory.pendingActions[0];
          onSuggestSchedule(
            `Atlas detectó pendiente: "${actionItem}". Tienes espacio libre a las ${nextHour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. ¿Deseas agendar el bloque?`,
            { start: nextHour, end: endSlot }
          );
        }
      }
    } catch (error) {
      console.error('Error en ciclo operativo de Atlas Director:', error);
    } finally {
      if (isRunning) {
        setTimeout(executeLoop, intervalMs);
      }
    }
  };

  executeLoop();

  return () => {
    isRunning = false;
  };
}

// ==========================================
// 5. COMPONENTE DIRECTOR CON LISTENER FIRESTORE
// ==========================================

export interface AtlasDirectorProps {
  userId: string;
  calendarAccessToken: string;
  onShowToast: (notif: NotificationDoc) => void;
  onSuggestSchedule: (message: string, slot: { start: Date; end: Date }) => void;
}

export const AtlasDirector: React.FC<AtlasDirectorProps> = ({
  userId,
  calendarAccessToken,
  onShowToast,
  onSuggestSchedule
}) => {
  const { memory, persistInteractionSummary } = useAtlasMemory(userId);

  // Listener reactivo de notificaciones y alertas urgentes
  useEffect(() => {
    if (!userId) return;

    const notifQuery = query(
      collection(db, 'notificaciones'),
      where('recipientId', '==', userId),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(notifQuery, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const notif = { id: change.doc.id, ...change.doc.data() } as NotificationDoc;

          onShowToast(notif);

          if (notif.type === 'cierre_caja' || notif.type === 'tarea_urgente') {
            await persistInteractionSummary(
              `Notificación prioritaria: ${notif.title} - ${notif.message}`,
              ['urgencias', notif.type],
              [notif.title]
            );
          }

          await updateDoc(doc(db, 'notificaciones', change.doc.id), {
            status: 'read'
          });
        }
      });
    });

    return () => unsubscribe();
  }, [userId, onShowToast, persistInteractionSummary]);

  // Inicialización del bucle periódico vinculado a memoria y Google Calendar
  useEffect(() => {
    if (!userId || !calendarAccessToken) return;

    const calendarService = new AtlasCalendarService(calendarAccessToken);

    const stopLoop = startAtlasDirectorLoop({
      userId,
      calendarService,
      getMemoryContext: () => memory,
      onSuggestSchedule,
      intervalMs: 60000
    });

    return () => stopLoop();
  }, [userId, calendarAccessToken, memory, onSuggestSchedule]);

  return null;
};

export default AtlasDirector;
