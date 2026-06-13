export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type Phase = 'planning' | 'assessment' | 'reporting' | 'closed';

export interface Engagement {
  id: string;
  clientName: string;
  engagementName: string;
  phase: Phase;
  progress: number;
  deadline: string;
  frameworks: string[];
  notes: string;
}

export interface Client {
  id: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
  engagementId: string;
  company: string;
}

export interface Task {
  id: string;
  engagementId?: string;
  title: string;
  priority: Priority;
  dueDate: string;
  done: boolean;
}

export interface Deliverable {
  id: string;
  engagementId: string;
  title: string;
  dueDate: string;
  done: boolean;
}

export interface CpdEntry {
  id: string;
  title: string;
  provider: string;
  date: string;
  hours: number;
  category: 'course' | 'webinar' | 'conference' | 'self-study' | 'workshop';
}

export type MeetingMode = 'online' | 'offline';
export type MeetingApp = 'Zoom' | 'Teams' | 'Google Meet' | 'Webex' | 'Other';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;       // YYYY-MM-DD
  time: string;       // HH:MM
  endTime?: string;
  mode: MeetingMode;
  meetingApp?: MeetingApp;
  meetingLink?: string;
  location?: string;
  notes?: string;
  engagementId?: string;
}