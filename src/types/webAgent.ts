export type WebAgentRole = 
  | 'auditor_operativo'
  | 'investigador_mercado'
  | 'normativa_sanitaria'
  | 'director_general'
  | 'custom';

export type WebAgentModel = 
  | 'gemini-3.7-flash'
  | 'gemini-3.6-flash'
  | 'gemini-3.1-pro-preview'
  | 'gemini-3.1-flash-lite';

export interface AtlasAgentStatus {
  id: string;
  name: string;
  role: string;
  task: string;
  memory_usage_kb: number;
  status: 'IDLE' | 'WORKING' | 'ALERT' | 'SYNCING';
  lastActive?: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
  domain?: string;
  snippet?: string;
}

export interface GroundingMetadata {
  webSearchQueries?: string[];
  groundingChunks?: Array<{ web?: { uri: string; title: string } }>;
  sources: GroundingSource[];
  searchEntryPoint?: string;
}

export interface WebTaskAction {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  actionType: 'search' | 'extract' | 'synthesize' | 'schedule' | 'create_skill' | 'export';
  details: string;
  url?: string;
  result?: string;
}

export interface WebTaskExecution {
  id: string;
  query: string;
  role: WebAgentRole;
  model: WebAgentModel;
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
  summary: string;
  steps: WebTaskAction[];
  grounding: GroundingMetadata;
  createdAt: string;
}

export interface WebAgentMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: string;
  grounding?: GroundingMetadata;
  suggestedActions?: string[];
  task?: WebTaskExecution;
  skillCode?: string;
  modelUsed?: WebAgentModel;
  roleUsed?: WebAgentRole;
}

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  homepage?: string;
  license?: string;
  version?: string;
  allowedTools: string[];
  userInvocable?: boolean;
  content: string; // The complete SKILL.md with frontmatter
  valid: boolean;
  enabled?: boolean;
  status?: string;
  validationErrors?: string[];
  category: 'web_research' | 'operations' | 'compliance' | 'finance' | 'general' | 'custom';
  createdAt: string;
}

export interface SkillValidationResult {
  valid: boolean;
  message: string;
  parsedFrontmatter?: Record<string, any>;
  errors: string[];
}

