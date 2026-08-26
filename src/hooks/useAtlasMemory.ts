import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AtlasMemoryDoc,
  AtlasUserPreferences,
  AtlasConversationContext,
  AtlasConversationMessage,
  AtlasAgentAction
} from '../types/atlasMemory';
import {
  getAtlasMemory,
  initOrUpdateAtlasMemory,
  saveAtlasPreferences,
  updateConversationContext,
  appendConversationMessage,
  clearConversationMessages,
  logAtlasAgentAction,
  subscribeToAtlasMemory,
  subscribeToAtlasActions,
  DEFAULT_USER_PREFERENCES,
  DEFAULT_CONVERSATION_CONTEXT
} from '../lib/atlasMemory';

export interface UseAtlasMemoryOptions {
  userId?: string;
  userEmail?: string;
  userName?: string;
  initialPreferences?: Partial<AtlasUserPreferences>;
  autoSubscribe?: boolean;
}

export interface UseAtlasMemoryReturn {
  memoryDoc: AtlasMemoryDoc | null;
  preferences: AtlasUserPreferences;
  context: AtlasConversationContext;
  messages: AtlasConversationMessage[];
  agentActions: AtlasAgentAction[];
  isLoading: boolean;
  error: string | null;
  // Methods to interact with Firestore 'atlas_memory' collection
  savePreferences: (updates: Partial<AtlasUserPreferences>) => Promise<void>;
  saveContext: (updates: Partial<AtlasConversationContext>) => Promise<void>;
  sendMessage: (text: string, sender?: 'user' | 'atlas', actionType?: AtlasConversationMessage['actionType'], metadata?: Record<string, unknown>) => Promise<AtlasConversationMessage>;
  addMessage: (message: AtlasConversationMessage) => Promise<void>;
  clearHistory: () => Promise<void>;
  recordAction: (action: Omit<AtlasAgentAction, 'id' | 'timestamp'>) => Promise<string>;
  refreshMemory: () => Promise<void>;
}

/**
 * Custom React Hook that interacts with the 'atlas_memory' collection in Firestore
 * to store, retrieve, and update user conversation history, preferences, and agent actions in real-time.
 */
export function useAtlasMemory({
  userId = 'default_director',
  userEmail = 'director@lct.com',
  userName = 'Director de Operaciones',
  initialPreferences,
  autoSubscribe = true
}: UseAtlasMemoryOptions = {}): UseAtlasMemoryReturn {
  const initialPreferencesRef = useRef(initialPreferences);
  useEffect(() => {
    initialPreferencesRef.current = initialPreferences;
  }, [initialPreferences]);

  const [memoryDoc, setMemoryDoc] = useState<AtlasMemoryDoc | null>(null);
  const [preferences, setPreferences] = useState<AtlasUserPreferences>(() => ({
    ...DEFAULT_USER_PREFERENCES,
    ...(initialPreferences || {})
  }));
  const [context, setContext] = useState<AtlasConversationContext>(DEFAULT_CONVERSATION_CONTEXT);
  const [messages, setMessages] = useState<AtlasConversationMessage[]>([]);
  const [agentActions, setAgentActions] = useState<AtlasAgentAction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  // Initialize or fetch long-term memory once per user
  const initializeMemory = useCallback(async () => {
    if (!userId) return;
    try {
      setIsLoading(true);
      setError(null);
      const docData = await initOrUpdateAtlasMemory(
        userId,
        userEmail,
        userName,
        initialPreferencesRef.current
      );
      if (isMountedRef.current && docData) {
        setMemoryDoc(docData);
        if (docData.preferences) setPreferences(docData.preferences);
        if (docData.context) setContext(docData.context);
        if (docData.recentMessages) setMessages(docData.recentMessages);
      }
    } catch (err: unknown) {
      console.error('Error initializing Atlas Memory:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [userId, userEmail, userName]);

  // Real-time synchronization subscriptions
  useEffect(() => {
    isMountedRef.current = true;
    if (!userId) return;

    initializeMemory();

    if (!autoSubscribe) return;

    // Subscribe to memory doc changes
    const unsubscribeMemory = subscribeToAtlasMemory(
      userId,
      (updatedDoc) => {
        if (!isMountedRef.current) return;
        if (updatedDoc) {
          setMemoryDoc(updatedDoc);
          if (updatedDoc.preferences) {
            setPreferences((prev) => {
              // Only update if actually different to prevent unnecessary renders
              const isDifferent =
                prev.theme !== updatedDoc.preferences.theme ||
                prev.visualizerMode !== updatedDoc.preferences.visualizerMode ||
                prev.defaultView !== updatedDoc.preferences.defaultView ||
                prev.particleDensity !== updatedDoc.preferences.particleDensity ||
                prev.autoVoiceSynthesis !== updatedDoc.preferences.autoVoiceSynthesis ||
                prev.proactiveAlerts !== updatedDoc.preferences.proactiveAlerts ||
                prev.preferredBranchId !== updatedDoc.preferences.preferredBranchId;
              return isDifferent ? updatedDoc.preferences : prev;
            });
          }
          if (updatedDoc.context) setContext(updatedDoc.context);
          if (updatedDoc.recentMessages) setMessages(updatedDoc.recentMessages);
        }
      },
      (err) => {
        if (!isMountedRef.current) return;
        console.warn('Real-time Atlas memory subscription error:', err);
        setError(err.message);
      }
    );

    // Subscribe to actions subcollection
    const unsubscribeActions = subscribeToAtlasActions(
      userId,
      (actionsList) => {
        if (!isMountedRef.current) return;
        setAgentActions(actionsList);
      },
      25
    );

    return () => {
      isMountedRef.current = false;
      unsubscribeMemory();
      unsubscribeActions();
    };
  }, [userId, autoSubscribe]);

  // Update preferences in Firestore
  const savePreferencesHandler = useCallback(
    async (updates: Partial<AtlasUserPreferences>) => {
      if (!userId) return;
      try {
        setPreferences((prev) => ({ ...prev, ...updates, updatedAt: new Date().toISOString() }));
        await saveAtlasPreferences(userId, updates);
      } catch (err: unknown) {
        console.error('Error saving Atlas preferences to Firestore:', err);
        setError(err instanceof Error ? err.message : String(err));
        throw err;
      }
    },
    [userId]
  );

  // Update context in Firestore
  const saveContextHandler = useCallback(
    async (updates: Partial<AtlasConversationContext>) => {
      if (!userId) return;
      try {
        setContext((prev) => ({ ...prev, ...updates, lastInteractionTimestamp: new Date().toISOString() }));
        await updateConversationContext(userId, updates);
      } catch (err: unknown) {
        console.error('Error updating Atlas context in Firestore:', err);
        setError(err instanceof Error ? err.message : String(err));
        throw err;
      }
    },
    [userId]
  );

  // Append a message to conversation history
  const addMessageHandler = useCallback(
    async (message: AtlasConversationMessage) => {
      if (!userId) return;
      try {
        setMessages((prev) => [...prev, message].slice(-40));
        await appendConversationMessage(userId, message);
      } catch (err: unknown) {
        console.error('Error appending conversation message to Firestore:', err);
        setError(err instanceof Error ? err.message : String(err));
        throw err;
      }
    },
    [userId]
  );

  // Helper to send and save a new message
  const sendMessageHandler = useCallback(
    async (
      text: string,
      sender: 'user' | 'atlas' = 'user',
      actionType: AtlasConversationMessage['actionType'] = 'general',
      metadata?: Record<string, unknown>
    ): Promise<AtlasConversationMessage> => {
      const newMsg: AtlasConversationMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        sender,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionType,
        metadata
      };

      await addMessageHandler(newMsg);
      return newMsg;
    },
    [addMessageHandler]
  );

  // Clear conversation history
  const clearHistoryHandler = useCallback(async () => {
    if (!userId) return;
    try {
      setMessages([
        {
          id: `msg-reset-${Date.now()}`,
          sender: 'atlas',
          text: `Memoria de sesión restablecida. Listo para un nuevo ciclo operativo.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionType: 'general'
        }
      ]);
      await clearConversationMessages(userId);
    } catch (err: unknown) {
      console.error('Error clearing conversation history in Firestore:', err);
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  }, [userId]);

  // Record an executed agent action
  const recordActionHandler = useCallback(
    async (action: Omit<AtlasAgentAction, 'id' | 'timestamp'>): Promise<string> => {
      if (!userId) return '';
      try {
        const actionId = await logAtlasAgentAction(userId, action);
        return actionId;
      } catch (err: unknown) {
        console.error('Error recording agent action in Firestore:', err);
        setError(err instanceof Error ? err.message : String(err));
        return '';
      }
    },
    [userId]
  );

  // Manual refresh
  const refreshMemoryHandler = useCallback(async () => {
    await initializeMemory();
  }, [initializeMemory]);

  return {
    memoryDoc,
    preferences,
    context,
    messages,
    agentActions,
    isLoading,
    error,
    savePreferences: savePreferencesHandler,
    saveContext: saveContextHandler,
    sendMessage: sendMessageHandler,
    addMessage: addMessageHandler,
    clearHistory: clearHistoryHandler,
    recordAction: recordActionHandler,
    refreshMemory: refreshMemoryHandler
  };
}
