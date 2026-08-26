export type CategoryType = 
  | 'kickoff' 
  | 'presentation' 
  | 'discussion' 
  | 'decision' 
  | 'action_items' 
  | 'wrap_up' 
  | 'brainstorm';

export interface Participant {
  id: string;
  name: string;
  role: string;
  department?: string;
  attendance: 'required' | 'optional';
  whyRequired: string;
  suggestedPrep?: string;
  avatarUrl?: string;
}

export interface AgendaTopic {
  id: string;
  title: string;
  durationMinutes: number;
  category: CategoryType;
  leadSpeaker: string;
  description: string;
  discussionPoints: string[];
  expectedDeliverable: string;
  priority?: 'high' | 'medium' | 'low';
  completed?: boolean;
}

export interface MeetingAgenda {
  title: string;
  objective: string;
  totalDuration: number; // in minutes
  meetingType: string;
  summary: string;
  participants: Participant[];
  topics: AgendaTopic[];
  preMeetingChecklist: string[];
  risksAndWatchouts?: string[];
  scheduledDate?: string; // e.g. YYYY-MM-DD
  scheduledTime?: string; // e.g. 10:00
}

export interface MeetingSettings {
  targetDuration: number;
  meetingType: string;
  customInstructions?: string;
  language: 'es' | 'en';
  focusArea?: string;
}

export interface UploadedFileMeta {
  name: string;
  size: number;
  type: string;
  lastModified?: number;
  textSnippet?: string;
  base64Data?: string;
}
