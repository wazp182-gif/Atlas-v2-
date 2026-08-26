import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';
import {
  AtlasMemoryDoc,
  AtlasUserPreferences,
  AtlasConversationContext,
  AtlasConversationMessage,
  AtlasAgentAction
} from '../types/atlasMemory';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Default preference preset
export const DEFAULT_USER_PREFERENCES: AtlasUserPreferences = {
  theme: 'cyan',
  visualizerMode: 'orb',
  preferredBranchId: 'todas',
  autoVoiceSynthesis: false,
  proactiveAlerts: true,
  defaultView: 'calendar_tasks',
  particleDensity: 'normal',
  updatedAt: new Date().toISOString(),
};

// Default context preset
export const DEFAULT_CONVERSATION_CONTEXT: AtlasConversationContext = {
  activeSessionId: `session-${Date.now()}`,
  recentTopics: ['Supervisión de Sucursales', 'Cortes de Caja', 'Rotulación PEPS'],
  unresolvedQueries: [],
  lastExecutiveSummary: 'Consolidación operativa en curso.',
  lastActiveBranchId: 'todas',
  lastInteractionTimestamp: new Date().toISOString(),
  totalMessagesCount: 0,
};

const MEMORY_COLLECTION = 'atlas_memory';

/**
 * Reads the entire Atlas Long-Term Memory document for a given user.
 */
export async function getAtlasMemory(userId: string): Promise<AtlasMemoryDoc | null> {
  if (!userId) return null;
  const docPath = `${MEMORY_COLLECTION}/${userId}`;
  try {
    const memoryRef = doc(db, MEMORY_COLLECTION, userId);
    const snap = await getDoc(memoryRef);
    if (!snap.exists()) {
      return null;
    }
    return snap.data() as AtlasMemoryDoc;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, docPath);
  }
}

/**
 * Initializes or updates long-term memory for a user.
 */
export async function initOrUpdateAtlasMemory(
  userId: string,
  userEmail: string,
  userName: string,
  initialPreferences?: Partial<AtlasUserPreferences>
): Promise<AtlasMemoryDoc> {
  const docPath = `${MEMORY_COLLECTION}/${userId}`;
  try {
    const memoryRef = doc(db, MEMORY_COLLECTION, userId);
    const snap = await getDoc(memoryRef);

    if (!snap.exists()) {
      const newMemory: AtlasMemoryDoc = {
        id: userId,
        userId,
        userEmail: userEmail || 'usuario@lct.com',
        userName: userName || 'Director de Operaciones',
        preferences: {
          ...DEFAULT_USER_PREFERENCES,
          ...(initialPreferences || {}),
          updatedAt: new Date().toISOString(),
        },
        context: {
          ...DEFAULT_CONVERSATION_CONTEXT,
          activeSessionId: `sess-${Date.now()}`,
        },
        recentMessages: [
          {
            id: `msg-welcome-${Date.now()}`,
            sender: 'atlas',
            text: `Núcleo de Atlas en línea y sincronizado. Memoria a largo plazo cargada. ¿Qué reporte o tarea en sucursales requieres que orqueste hoy?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actionType: 'general',
          },
        ],
        lastActionTimestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(memoryRef, newMemory);
      return newMemory;
    } else {
      const data = snap.data() as AtlasMemoryDoc;
      return data;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }
}

/**
 * Saves or updates user preferences inside Atlas Memory.
 */
export async function saveAtlasPreferences(
  userId: string,
  preferences: Partial<AtlasUserPreferences>
): Promise<void> {
  if (!userId) return;
  const docPath = `${MEMORY_COLLECTION}/${userId}`;
  try {
    const memoryRef = doc(db, MEMORY_COLLECTION, userId);
    await setDoc(
      memoryRef,
      {
        preferences: {
          ...preferences,
          updatedAt: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, docPath);
  }
}

/**
 * Updates conversation context (topics, active session, branch focus).
 */
export async function updateConversationContext(
  userId: string,
  contextUpdates: Partial<AtlasConversationContext>
): Promise<void> {
  if (!userId) return;
  const docPath = `${MEMORY_COLLECTION}/${userId}`;
  try {
    const memoryRef = doc(db, MEMORY_COLLECTION, userId);
    await setDoc(
      memoryRef,
      {
        context: {
          ...contextUpdates,
          lastInteractionTimestamp: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, docPath);
  }
}

/**
 * Appends a new conversation message to the user's Atlas long-term memory.
 * Limits in-memory array to the last 40 messages to maintain ultra-fast reads.
 */
export async function appendConversationMessage(
  userId: string,
  message: AtlasConversationMessage
): Promise<void> {
  if (!userId) return;
  const docPath = `${MEMORY_COLLECTION}/${userId}`;
  try {
    const memoryRef = doc(db, MEMORY_COLLECTION, userId);
    const snap = await getDoc(memoryRef);

    if (snap.exists()) {
      const existing = snap.data() as AtlasMemoryDoc;
      const updatedMessages = [...(existing.recentMessages || []), message].slice(-40);
      const updatedCount = (existing.context?.totalMessagesCount || 0) + 1;

      await updateDoc(memoryRef, {
        recentMessages: updatedMessages,
        'context.totalMessagesCount': updatedCount,
        'context.lastInteractionTimestamp': new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      await setDoc(memoryRef, {
        id: userId,
        userId,
        recentMessages: [message],
        context: {
          ...DEFAULT_CONVERSATION_CONTEXT,
          totalMessagesCount: 1,
        },
        preferences: DEFAULT_USER_PREFERENCES,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }
}

/**
 * Clears conversation messages context for the user while keeping preferences intact.
 */
export async function clearConversationMessages(userId: string): Promise<void> {
  if (!userId) return;
  const docPath = `${MEMORY_COLLECTION}/${userId}`;
  try {
    const memoryRef = doc(db, MEMORY_COLLECTION, userId);
    const welcomeMsg: AtlasConversationMessage = {
      id: `msg-reset-${Date.now()}`,
      sender: 'atlas',
      text: `Memoria de sesión restablecida. Listo para un nuevo ciclo operativo.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionType: 'general',
    };

    await updateDoc(memoryRef, {
      recentMessages: [welcomeMsg],
      'context.activeSessionId': `sess-${Date.now()}`,
      'context.unresolvedQueries': [],
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, docPath);
  }
}

/**
 * Logs an agent action (e.g. report generation, checklist creation, emergency alert)
 * into a dedicated subcollection `atlas_memory/{userId}/actions`.
 */
export async function logAtlasAgentAction(
  userId: string,
  action: Omit<AtlasAgentAction, 'id' | 'timestamp'>
): Promise<string> {
  if (!userId) return '';
  const subcollectionPath = `${MEMORY_COLLECTION}/${userId}/actions`;
  try {
    const actionsRef = collection(db, MEMORY_COLLECTION, userId, 'actions');
    const newDoc = await addDoc(actionsRef, {
      ...action,
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp(),
    });

    // Also update parent memory timestamp
    const memoryRef = doc(db, MEMORY_COLLECTION, userId);
    await updateDoc(memoryRef, {
      lastActionTimestamp: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).catch(() => {
      // Non-blocking if doc doesn't exist
    });

    return newDoc.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, subcollectionPath);
  }
}

/**
 * Fetches recent agent actions executed for this user/orchestrator.
 */
export async function getRecentAtlasActions(
  userId: string,
  maxLimit: number = 20
): Promise<AtlasAgentAction[]> {
  if (!userId) return [];
  const subcollectionPath = `${MEMORY_COLLECTION}/${userId}/actions`;
  try {
    const actionsRef = collection(db, MEMORY_COLLECTION, userId, 'actions');
    const q = query(actionsRef, orderBy('timestamp', 'desc'), limit(maxLimit));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<AtlasAgentAction, 'id'>),
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, subcollectionPath);
  }
}

/**
 * Subscribes to real-time updates for a user's Atlas long-term memory.
 */
export function subscribeToAtlasMemory(
  userId: string,
  onUpdate: (memory: AtlasMemoryDoc | null) => void,
  onError?: (error: Error) => void
): () => void {
  if (!userId) return () => {};
  const memoryRef = doc(db, MEMORY_COLLECTION, userId);

  return onSnapshot(
    memoryRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as AtlasMemoryDoc);
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.warn('Atlas memory snapshot warning:', err);
      if (onError) {
        onError(err);
      }
    }
  );
}

/**
 * Subscribes in real-time to agent actions subcollection.
 */
export function subscribeToAtlasActions(
  userId: string,
  onUpdate: (actions: AtlasAgentAction[]) => void,
  maxLimit: number = 15
): () => void {
  if (!userId) return () => {};
  const actionsRef = collection(db, MEMORY_COLLECTION, userId, 'actions');
  const q = query(actionsRef, orderBy('timestamp', 'desc'), limit(maxLimit));

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<AtlasAgentAction, 'id'>),
      }));
      onUpdate(list);
    },
    (err) => {
      console.warn('Atlas actions snapshot warning:', err);
    }
  );
}

export { useAtlasMemory } from '../hooks/useAtlasMemory';
export type { UseAtlasMemoryOptions, UseAtlasMemoryReturn } from '../hooks/useAtlasMemory';
