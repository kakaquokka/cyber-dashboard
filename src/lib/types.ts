export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type Phase = 'planning' | 'assessment' | 'reporting' | 'closed' | 'partnership';

export interface Engagement {
  id: string;
  clientName: string;
  engagementName: string;
  phase: Phase;
  progress: number;
  deadline: string;
  frameworks: string[];
  notes: string;
  hasPartner?: boolean;
  partnerName?: string;
}

export type ConnectionType = 'client' | 'colleague';
export type ClientStatus = 'engaging' | 'potential';
export type ColleagueStatus = 'current' | 'past';

export interface Connection {
  id: string;
  name: string;
  role?: string;
  email?: string;
  companyPhone?: string;
  mobilePhone?: string;
  company: string;
  type: ConnectionType;
  clientStatus?: ClientStatus;
  colleagueStatus?: ColleagueStatus;
  engagementId?: string;
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
  category: string;
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