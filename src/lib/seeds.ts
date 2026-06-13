import { Engagement, Client, Task, Deliverable, CpdEntry } from './types';

export const seedEngagements: Engagement[] = [
  { id: 'eng-1', clientName: 'Bank A', phase: 'assessment', progress: 75, deadline: '2025-06-20', frameworks: ['ISO 27001', 'MAS TRM'], notes: 'Focus on access control and privileged accounts.' },
  { id: 'eng-2', clientName: 'Corp B', phase: 'reporting', progress: 50, deadline: '2025-06-24', frameworks: ['ISO 27001'], notes: 'ISMS gap analysis in progress.' },
  { id: 'eng-3', clientName: 'FinTech C', phase: 'planning', progress: 20, deadline: '2025-07-10', frameworks: ['NIST CSF', 'MAS TRM'], notes: 'Scope still being finalised with client.' },
  { id: 'eng-4', clientName: 'Gov D', phase: 'reporting', progress: 90, deadline: '2025-06-18', frameworks: ['CSMS'], notes: 'Nearly complete — final review pending.' },
  { id: 'eng-5', clientName: 'Retailer E', phase: 'planning', progress: 10, deadline: '2025-07-25', frameworks: ['PCI DSS', 'NIST CSF'], notes: 'Kickoff scheduled for next week.' },
];

export const seedClients: Client[] = [
  { id: 'cli-1', name: 'Tanaka Noboru', role: 'IT Audit Lead', email: 't.noboru@banka.co.jp', phone: '+81 3-1234-5678', engagementId: 'eng-1', company: 'Bank A' },
  { id: 'cli-2', name: 'Sarah Lim', role: 'CISO', email: 's.lim@corpb.com', phone: '+65 9123 4567', engagementId: 'eng-2', company: 'Corp B' },
  { id: 'cli-3', name: 'Raj Kumar', role: 'Head of Compliance', email: 'r.kumar@fintechc.io', phone: '+65 8234 5678', engagementId: 'eng-3', company: 'FinTech C' },
  { id: 'cli-4', name: 'Miyamoto Kenji', role: 'Security Manager', email: 'm.kenji@govd.go.jp', phone: '+81 3-9876-5432', engagementId: 'eng-4', company: 'Gov D' },
  { id: 'cli-5', name: 'Jennifer Tan', role: 'Head of IT', email: 'j.tan@retailere.com', phone: '+65 9345 6789', engagementId: 'eng-5', company: 'Retailer E' },
];

export const seedTasks: Task[] = [
  { id: 'task-1', engagementId: 'eng-1', title: 'Finalise access control findings', priority: 'critical', dueDate: new Date().toISOString().split('T')[0], done: false },
  { id: 'task-2', engagementId: 'eng-2', title: 'Draft ISMS gap analysis report', priority: 'high', dueDate: '2025-06-17', done: false },
  { id: 'task-3', engagementId: 'eng-3', title: 'Review pentest scope with client', priority: 'high', dueDate: '2025-06-18', done: false },
  { id: 'task-4', engagementId: 'eng-2', title: 'Update ISO 27001 control mapping', priority: 'medium', dueDate: '2025-06-19', done: false },
  { id: 'task-5', engagementId: 'eng-5', title: 'Prep client readout slides', priority: 'low', dueDate: '2025-06-21', done: false },
];

export const seedDeliverables: Deliverable[] = [
  { id: 'del-1', engagementId: 'eng-1', title: 'Kickoff deck', dueDate: '2025-05-15', done: true },
  { id: 'del-2', engagementId: 'eng-2', title: 'Assessment plan', dueDate: '2025-05-28', done: true },
  { id: 'del-3', engagementId: 'eng-4', title: 'Risk assessment', dueDate: '2025-06-01', done: true },
  { id: 'del-4', engagementId: 'eng-1', title: 'Draft audit report', dueDate: '2025-06-20', done: false },
  { id: 'del-5', engagementId: 'eng-2', title: 'Gap analysis report', dueDate: '2025-06-24', done: false },
  { id: 'del-6', engagementId: 'eng-3', title: 'Pentest scoping document', dueDate: '2025-07-01', done: false },
  { id: 'del-7', engagementId: 'eng-4', title: 'Final CSMS review report', dueDate: '2025-06-18', done: false },
];

export const seedCpd: CpdEntry[] = [
  { id: 'cpd-1', title: 'ISO 27001 Lead Auditor', provider: 'BSI Group', date: '2025-05-10', hours: 16, category: 'course' },
  { id: 'cpd-2', title: 'ISACA CISA Webinar', provider: 'ISACA', date: '2025-06-10', hours: 2, category: 'webinar' },
  { id: 'cpd-3', title: 'MAS TRM Update Session', provider: 'MAS', date: '2025-04-22', hours: 3, category: 'conference' },
];
