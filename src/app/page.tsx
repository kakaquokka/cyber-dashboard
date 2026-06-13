'use client';

import { useEffect, useState } from 'react';
import { loadData, saveData } from '@/lib/storage';
import { Engagement, Client, Task, Deliverable, CpdEntry } from '@/lib/types';
import { seedEngagements, seedClients, seedTasks, seedDeliverables, seedCpd } from '@/lib/seeds';
import { PriorityBadge } from '@/components/Badge';
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns';

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
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [cpd, setCpd] = useState<CpdEntry[]>([]);

  useEffect(() => {
    setEngagements(loadData('engagements', seedEngagements));
    setClients(loadData('clients', seedClients));
    setTasks(loadData('tasks', seedTasks));
    setDeliverables(loadData('deliverables', seedDeliverables));
    setCpd(loadData('cpd', seedCpd));
  }, []);

  const activeEngagements = engagements.filter(e => e.phase !== 'closed');
  const pendingTasks = tasks.filter(t => !t.done).sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.priority] - order[b.priority];
  });
  const doneDeliverables = deliverables.filter(d => d.done).length;
  const cpdTotal = cpd.reduce((s, c) => s + c.hours, 0);
  const upcomingDeadlines = engagements
    .filter(e => e.phase !== 'closed' && differenceInDays(new Date(e.deadline), new Date()) <= 7)
    .length;

  function toggleTask(id: string) {
    const updated = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setTasks(updated);
    saveData('tasks', updated);
  }

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">Good morning</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {format(new Date(), 'EEEE, d MMMM yyyy')} · Week {format(new Date(), 'w')}
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active engagements', value: activeEngagements.length, sub: `${engagements.filter(e => e.phase === 'fieldwork').length} in fieldwork` },
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        {/* Priority tasks */}
        <div className="md:col-span-3 bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="text-sm font-medium text-gray-500 mb-4">Priority tasks</h2>
          {pendingTasks.length === 0 && (
            <p className="text-sm text-gray-400">All tasks done. Nice work.</p>
          )}
          <ul className="space-y-0 divide-y divide-gray-50">
            {pendingTasks.slice(0, 6).map(task => {
              const eng = engagements.find(e => e.id === task.engagementId);
              return (
                <li key={task.id} className="flex items-center gap-3 py-2.5">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="w-4 h-4 rounded border border-gray-300 hover:border-blue-400 shrink-0 flex items-center justify-center transition-colors"
                    aria-label={`Mark "${task.title}" as done`}
                  />
                  <span className="flex-1 text-sm text-gray-800 truncate">{task.title}</span>
                  {eng && <span className="text-xs text-gray-400 shrink-0">{eng.clientName}</span>}
                  <span className={`text-xs shrink-0 font-medium ${dueDateColor(task.dueDate)}`}>
                    {dueDateLabel(task.dueDate)}
                  </span>
                  <PriorityBadge priority={task.priority} />
                </li>
              );
            })}
          </ul>
        </div>

        {/* Client contacts */}
        <div className="md:col-span-2 bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="text-sm font-medium text-gray-500 mb-4">Client contacts</h2>
          <ul className="space-y-0 divide-y divide-gray-50">
            {clients.slice(0, 4).map((c, i) => (
              <li key={c.id} className="flex items-center gap-3 py-2.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                  {initials(c.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{c.name}</div>
                  <div className="text-xs text-gray-400 truncate">{c.company} · {c.role}</div>
                </div>
              </li>
            ))}
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
      <div className="bg-white border border-gray-100 rounded-xl p-5">
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
    </div>
  );
}
