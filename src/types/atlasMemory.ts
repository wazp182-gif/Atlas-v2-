export interface AtlasUserPreferences {
  theme: 'cyan' | 'sapphire' | 'violet' | 'emerald' | 'amber';
  visualizerMode: 'orb' | 'vortex' | 'flow' | 'matrix';
  preferredBranchId?: string;
  autoVoiceSynthesis: boolean;
  proactiveAlerts: boolean;
  defaultView: 'calendar_tasks' | 'branch_radar' | 'form_builder' | 'code_audit' | 'culture_matrix' | 'docfx_validator';
  particleDensity: 'normal' | 'high' | 'ultra';
  updatedAt: string;
}

export interface AtlasConversationMessage {
  id: string;
  sender: 'user' | 'atlas' | 'system';
  text: string;
  timestamp: string;
  actionType?: 'report' | 'calendar' | 'fix' | 'form' | 'branch_status' | 'peps' | 'audit' | 'general';
  dataPayload?: Record<string, any>;
  metadata?: {
    sentiment?: 'positive' | 'neutral' | 'urgent' | 'inquiry';
    tokensEstimate?: number;
    resolved?: boolean;
  };
}

export interface AtlasAgentAction {
  id: string;
  actionType: string;
  title: string;
  description: string;
  status: 'success' | 'pending' | 'failed' | 'simulated';
  timestamp: string;
  targetModule?: string;
  payload?: Record<string, any>;
  executedByUid: string;
  executedByName: string;
}

export interface AtlasNotificationEvent {
  id: string;
  type: 'incidencia_critica' | 'caja_descuadre' | 'cocina_peps' | 'recordatorio_calendar' | 'meta_alcanzada';
  title: string;
  description: string;
  branchName?: string;
  branchId?: string;
  priority: 'critica' | 'alta' | 'media' | 'info';
  timestamp: string;
  sourceDocId?: string;
  suggestedActionText?: string;
  suggestedMeetingTitle?: string;
  resolved?: boolean;
}

export interface AtlasConversationContext {
  activeSessionId: string;
  recentTopics: string[];
  unresolvedQueries: string[];
  knownAlertIds?: string[];
  lastExecutiveSummary?: string;
  lastActiveBranchId?: string;
  lastInteractionTimestamp: string;
  totalMessagesCount: number;
}

export interface AtlasMemoryDoc {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  preferences: AtlasUserPreferences;
  context: AtlasConversationContext;
  recentMessages: AtlasConversationMessage[];
  lastActionTimestamp?: string;
  createdAt: string;
  updatedAt: string;
}
