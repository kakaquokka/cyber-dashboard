export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type Phase = 'planning' | 'assessment' | 'reporting' | 'closed';

export interface Engagement {
  id: string;
  clientName: string;
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
