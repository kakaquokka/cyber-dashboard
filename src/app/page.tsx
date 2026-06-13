'use client';

import { useEffect, useState } from 'react';
import { loadData, saveData } from '@/lib/storage';
import { Engagement, Task, Deliverable, CpdEntry } from '@/lib/types';
import { seedEngagements, seedTasks, seedDeliverables, seedCpd } from '@/lib/seeds';
import { PriorityBadge } from '@/components/Badge';
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { CalendarEvent } from '@/lib/types';
import { seedEvents } from '@/lib/seeds';

function dueDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  const diff = differenceInDays(d, new Date());
  if (diff < 0) return 'Overdue';
  return format(d, 'd MMM');
}

function dueDateColor(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d) || differenceInDays(d, new Date()) < 0) return 'text-red-600';
  if (differenceInDays(d, new Date()) <= 2) return 'text-amber-600';
  return 'text-gray-400';
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

const avatarColors = [
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-purple-100 text-purple-800',
  'bg-amber-100 text-amber-800',
  'bg-pink-100 text-pink-800',
];

export default function OverviewPage() {
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [cpd, setCpd] = useState<CpdEntry[]>([]);
  const [calEvents, setCalEvents] = useState<CalendarEvent[]>([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', priority: 'medium' as Task['priority'], dueDate: '', engagementId: '' });

  useEffect(() => {
    loadData('engagements', seedEngagements).then(setEngagements);
    loadData('tasks', seedTasks).then(setTasks);
    loadData('deliverables', seedDeliverables).then(setDeliverables);
    loadData('cpd', seedCpd).then(setCpd);
    loadData('events', seedEvents).then(setCalEvents);
  }, []);

  const activeEngagements = engagements.filter(e => e.phase !== 'closed' && e.phase !== 'partnership');
  const pendingTasks = tasks.filter(t => !t.done).sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.priority] - order[b.priority];
  });
  const doneDeliverables = deliverables.filter(d => d.done).length;
  const cpdTotal = cpd.reduce((s, c) => s + c.hours, 0);
  const upcomingDeadlines = engagements
    .filter(e => e.phase !== 'closed' && differenceInDays(new Date(e.deadline), new Date()) <= 7)
    .length;

  async function toggleTask(id: string) {
    const updated = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setTasks(updated);
    await saveData('tasks', updated);
  }

  async function addTask() {
    if (!taskForm.title.trim() || !taskForm.dueDate) return;
    const newTask: Task = { ...taskForm, id: `task-${Date.now()}`, done: false };
    const updated = [...tasks, newTask];
    setTasks(updated);
    await saveData('tasks', updated);
    setShowTaskModal(false);
    setTaskForm({ title: '', priority: 'medium', dueDate: '', engagementId: '' });
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl pb-24">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">
          {(() => {
            const hour = new Date().getHours();
            if (hour >= 6 && hour < 12) return 'Good morning';
            if (hour >= 12 && hour < 18) return 'Good afternoon';
            if (hour >= 18) return 'Good evening';
            return 'Good evening';
          })()}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {format(new Date(), 'EEEE, d MMMM yyyy')}
        </p>
      </div>

      {/* Upcoming schedule — reminder strip */}
      {(() => {
        const today = new Date();
        const todayStr = format(today, 'yyyy-MM-dd');
        const in7 = new Date(today.getTime() + 7 * 86400000);
        const upcoming = calEvents
          .filter(e => e.date >= todayStr && new Date(e.date) <= in7)
          .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
          .slice(0, 5);
        const upcomingDels = deliverables
          .filter(d => !d.done && d.dueDate >= todayStr && new Date(d.dueDate) <= in7)
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

        if (upcoming.length === 0 && upcomingDels.length === 0) return null;

        return (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
            <h2 className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-3">Coming up — next 7 days</h2>
            <div className="space-y-2">
              {upcoming.map(evt => (
                <div key={evt.id} className="flex items-center gap-3 py-1">
                  <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-800">{evt.title}</span>
                    <span className="text-xs text-gray-400 ml-2">{evt.mode === 'online' ? evt.meetingApp : evt.location}</span>
                  </div>
                  <span className="text-xs text-blue-500 shrink-0 font-medium">
                    {isToday(new Date(evt.date)) ? 'Today' : format(new Date(evt.date), 'd MMM')} {evt.time}
                  </span>
                </div>
              ))}
              {upcomingDels.map(d => {
                const eng = engagements.find(e => e.id === d.engagementId);
                return (
                  <div key={d.id} className="flex items-center gap-3 py-1">
                    <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-800">{d.title}</span>
                      {eng && <span className="text-xs text-gray-400 ml-2">— {eng.clientName}</span>}
                    </div>
                    <span className={`text-xs shrink-0 font-medium ${dueDateColor(d.dueDate)}`}>
                      {dueDateLabel(d.dueDate)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active engagements', value: activeEngagements.length, sub: `${engagements.filter(e => e.phase === 'assessment').length} in assessment` },
          { label: 'Open tasks', value: pendingTasks.length, sub: `${pendingTasks.filter(t => t.priority === 'critical').length} critical` },
          { label: 'Deadlines this week', value: upcomingDeadlines, sub: 'across all engagements' },
          { label: 'Deliverables done', value: `${doneDeliverables}/${deliverables.length}`, sub: `${Math.round((doneDeliverables / Math.max(deliverables.length, 1)) * 100)}% complete` },
        ].map(m => (
          <div key={m.label} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">{m.label}</div>
            <div className="text-2xl font-semibold text-gray-900">{m.value}</div>
            <div className="text-xs text-gray-400 mt-1">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Tasks + Clients */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-500">Priority tasks</h2>
            <div className="flex items-center gap-2">
              <a href="/tasks" className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-50 transition-colors">View all</a>
              <button onClick={() => setShowTaskModal(true)} className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-50 transition-colors">+ Add task</button>
            </div>
          </div>
          {pendingTasks.length === 0 && (
            <p className="text-sm text-gray-400">No open tasks. Add one to get started.</p>
          )}
          <ul className="space-y-0 divide-y divide-gray-50">
            {pendingTasks.slice(0, 6).map(task => {
              const eng = engagements.find(e => e.id === task.engagementId);
              return (
                <li key={task.id} className="flex items-start gap-3 py-2.5">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="w-4 h-4 rounded border border-gray-300 hover:border-blue-400 shrink-0 flex items-center justify-center transition-colors mt-0.5"
                    aria-label={`Mark "${task.title}" as done`}
                  />
                  {/* Mobile: stacked. Desktop: single row */}
                  <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center md:gap-3">
                    <span className="text-sm text-gray-800 flex-1 md:truncate">{task.title}</span>
                    <div className="flex items-center gap-2 mt-1 md:mt-0 flex-wrap md:flex-nowrap shrink-0">
                      {eng && <span className="text-xs text-gray-400">{eng.clientName}</span>}
                      <span className={`text-xs font-medium ${dueDateColor(task.dueDate)}`}>
                        {dueDateLabel(task.dueDate)}
                      </span>
                      <PriorityBadge priority={task.priority} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Engagement progress + Deliverables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Engagement progress */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="text-sm font-medium text-gray-500 mb-4">Engagement progress</h2>
          <ul className="space-y-3">
            {activeEngagements.map(eng => (
              <li key={eng.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-800">{eng.clientName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{dueDateLabel(eng.deadline)}</span>
                    <span className="text-xs font-medium text-gray-600">{eng.progress}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${eng.progress >= 80 ? 'bg-red-400' : eng.progress >= 50 ? 'bg-amber-400' : 'bg-blue-400'}`}
                    style={{ width: `${eng.progress}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Deliverables checklist */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-500">Deliverables</h2>
            <span className="text-xs text-gray-400">{doneDeliverables} of {deliverables.length} done</span>
          </div>
          <ul className="divide-y divide-gray-50">
            {deliverables.slice(0, 6).map(d => {
              const eng = engagements.find(e => e.id === d.engagementId);
              return (
                <li key={d.id} className="flex items-center gap-3 py-2">
                  <div className={`w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center ${d.done ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                    {d.done && <span className="text-white text-[9px] font-bold leading-none">✓</span>}
                  </div>
                  <span className={`flex-1 text-sm truncate ${d.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {d.title}
                  </span>
                  {eng && <span className="text-xs text-gray-400 shrink-0">{eng.clientName}</span>}
                  {!d.done && (
                    <span className={`text-xs shrink-0 font-medium ${dueDateColor(d.dueDate)}`}>
                      {dueDateLabel(d.dueDate)}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* CPD strip */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-500">CPD — {new Date().getFullYear()}</h2>
          <span className="text-xs text-gray-400">{cpdTotal} / 40 hrs · {Math.round((cpdTotal / 40) * 100)}% of annual target</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
          {cpd.slice(0, 3).map(entry => (
            <div key={entry.id} className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-400 capitalize mb-1">{entry.category}</div>
              <div className="text-sm font-medium text-gray-800 truncate">{entry.title}</div>
              <div className="text-xs text-gray-400 mt-1">{entry.hours} hrs · {format(new Date(entry.date), 'd MMM yyyy')}</div>
            </div>
          ))}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>Annual target</span>
              <span>{cpdTotal} / 40 hrs</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-400 rounded-full transition-all"
                style={{ width: `${Math.min((cpdTotal / 40) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-md shadow-xl">
            <h2 className="text-base font-semibold text-gray-900 mb-5">New task</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Task</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Finalise access control findings" />
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Priority</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value as Task['priority'] }))}>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Due date</label>
                  <input type="date" className="w-full max-w-full block border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={taskForm.dueDate} onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Linked engagement <span className="text-gray-300">(optional)</span></label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={taskForm.engagementId} onChange={e => setTaskForm(f => ({ ...f, engagementId: e.target.value }))}>
                  <option value="">— none —</option>
                  {engagements.map(e => <option key={e.id} value={e.id}>{e.clientName}{e.engagementName ? ` — ${e.engagementName}` : ''}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowTaskModal(false)} className="text-sm text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={addTask} className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700">Save</button>
            </div>
          </div>
        </div>
      )}
    
    </div>
  );
}