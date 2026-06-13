'use client';

import { useEffect, useState } from 'react';
import { loadData, saveData, deleteRow } from '@/lib/storage';
import { Task, Engagement } from '@/lib/types';
import { seedTasks, seedEngagements } from '@/lib/seeds';
import { PriorityBadge } from '@/components/Badge';
import { format, differenceInDays, isToday, isTomorrow } from 'date-fns';

function dueDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  const diff = differenceInDays(d, new Date());
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  return format(d, 'd MMM');
}

function dueDateColor(dateStr: string): string {
  const diff = differenceInDays(new Date(dateStr), new Date());
  if (diff < 0) return 'text-red-600';
  if (diff <= 2) return 'text-amber-600';
  return 'text-gray-400';
}

const emptyForm = { title: '', priority: 'medium' as Task['priority'], dueDate: '', engagementId: '' };

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('pending');

  useEffect(() => {
    loadData('tasks', seedTasks).then(setTasks);
    loadData('engagements', seedEngagements).then(setEngagements);
  }, []);

  const filtered = tasks
    .filter(t => filter === 'all' ? true : filter === 'done' ? t.done : !t.done)
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.priority] - order[b.priority];
    });

  function openNew() { setEditingTask(null); setForm(emptyForm); setShowModal(true); }
  function openEdit(t: Task) {
    setEditingTask(t);
    setForm({ title: t.title, priority: t.priority, dueDate: t.dueDate, engagementId: t.engagementId || '' });
    setShowModal(true);
  }

  async function save() {
    if (!form.title.trim() || !form.dueDate) return;
    let updated: Task[];
    if (editingTask) {
      updated = tasks.map(t => t.id === editingTask.id ? { ...editingTask, ...form } : t);
    } else {
      updated = [...tasks, { ...form, id: `task-${Date.now()}`, done: false }];
    }
    setTasks(updated);
    await saveData('tasks', updated);
    setShowModal(false);
  }

  async function toggleDone(id: string) {
    const updated = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setTasks(updated);
    await saveData('tasks', updated);
  }

  async function remove(id: string) {
    if (!confirm('Remove this task?')) return;
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    deleteRow('tasks', id);
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500 mt-0.5">{tasks.filter(t => !t.done).length} open</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden text-xs">
            {(['pending', 'all', 'done'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 capitalize transition-colors ${filter === f ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={openNew} className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
            + Add task
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-12">No tasks here.</p>
        )}
        {filtered.map(task => {
          const eng = engagements.find(e => e.id === task.engagementId);
          return (
            <div key={task.id} className="flex items-center gap-3 px-4 py-3">
              <button
                onClick={() => toggleDone(task.id)}
                className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors ${task.done ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-400'}`}
              >
                {task.done && <span className="text-white text-[9px] font-bold leading-none">✓</span>}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`text-sm truncate ${task.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>{task.title}</div>
                {eng && <div className="text-xs text-gray-400 mt-0.5">{eng.clientName}{eng.engagementName ? ` — ${eng.engagementName}` : ''}</div>}
              </div>
              <span className={`text-xs font-medium shrink-0 ${dueDateColor(task.dueDate)}`}>{dueDateLabel(task.dueDate)}</span>
              <PriorityBadge priority={task.priority} />
              <button onClick={() => openEdit(task)} className="text-xs text-gray-300 hover:text-gray-600 transition-colors ml-1">✎</button>
              <button onClick={() => remove(task.id)} className="text-xs text-gray-300 hover:text-red-500 transition-colors ml-1">✕</button>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-md shadow-xl max-h-[75vh] overflow-y-auto">
            <h2 className="text-base font-semibold text-gray-900 mb-5">{editingTask ? 'Edit task' : 'New task'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Task</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Finalise access control findings" />
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Priority</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Task['priority'] }))}>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Due date</label>
                  <input type="date" className="w-full max-w-full block border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Linked engagement <span className="text-gray-300">(optional)</span></label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={form.engagementId} onChange={e => setForm(f => ({ ...f, engagementId: e.target.value }))}>
                  <option value="">— none —</option>
                  {engagements.map(e => <option key={e.id} value={e.id}>{e.clientName}{e.engagementName ? ` — ${e.engagementName}` : ''}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="text-sm text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={save} className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}