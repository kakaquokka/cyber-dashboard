'use client';

import { useEffect, useState } from 'react';
import { loadData, saveData, deleteRow } from '@/lib/storage';
import { Deliverable, Engagement } from '@/lib/types';
import { seedDeliverables, seedEngagements } from '@/lib/seeds';
import { format, differenceInDays, isToday } from 'date-fns';

function dueDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return 'Due today';
  const diff = differenceInDays(d, new Date());
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 1) return 'Due tomorrow';
  return `Due ${format(d, 'd MMM')}`;
}

function dueDateColor(dateStr: string, done: boolean): string {
  if (done) return 'text-gray-400';
  const diff = differenceInDays(new Date(dateStr), new Date());
  if (diff < 0) return 'text-red-600';
  if (diff <= 2) return 'text-amber-600';
  return 'text-gray-400';
}

const emptyForm: Omit<Deliverable, 'id'> = { engagementId: '', title: '', dueDate: '', done: false };

export default function DeliverablesPage() {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Omit<Deliverable, 'id'>>(emptyForm);
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');
  const [editingDel, setEditingDel] = useState<Deliverable | null>(null);
  const [editForm, setEditForm] = useState({ title: '', dueDate: '', engagementId: '' });

  function openEdit(d: Deliverable) {
    setEditingDel(d);
    setEditForm({ title: d.title, dueDate: d.dueDate, engagementId: d.engagementId });
  }

  async function saveEdit() {
    if (!editingDel || !editForm.title.trim() || !editForm.dueDate) return;
    const updated = deliverables.map(d =>
      d.id === editingDel.id ? { ...d, ...editForm } : d
    );
    setDeliverables(updated);
    await saveData('deliverables', updated);
    setEditingDel(null);
  }

  useEffect(() => {
    loadData('deliverables', seedDeliverables).then(setDeliverables);
    loadData('engagements', seedEngagements).then(setEngagements);
  }, []);

  function toggle(id: string) {
    const updated = deliverables.map(d => d.id === id ? { ...d, done: !d.done } : d);
    setDeliverables(updated);
    saveData('deliverables', updated);
  }

  function remove(id: string) {
    const updated = deliverables.filter(d => d.id !== id);
    setDeliverables(updated);
    deleteRow('deliverables', id);
  }

  function save() {
    if (!form.title.trim() || !form.dueDate) return;
    const updated = [...deliverables, { ...form, id: `del-${Date.now()}` }];
    setDeliverables(updated);
    saveData('deliverables', updated);
    setShowModal(false);
    setForm(emptyForm);
  }

  const filtered = deliverables.filter(d =>
    filter === 'all' ? true : filter === 'done' ? d.done : !d.done
  );

  const grouped = engagements.map(eng => ({
    eng,
    items: filtered.filter(d => d.engagementId === eng.id),
  })).filter(g => g.items.length > 0);

  const ungrouped = filtered.filter(d => !d.engagementId || !engagements.find(e => e.id === d.engagementId));
  const done = deliverables.filter(d => d.done).length;
  const total = deliverables.length;

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Deliverables</h1>
          <p className="text-sm text-gray-500 mt-0.5">{done} of {total} complete</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden text-xs">
            {(['all', 'pending', 'done'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 capitalize transition-colors ${filter === f ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                {f}
              </button>
            ))}
          </div>
          <button onClick={() => { setForm(emptyForm); setShowModal(true); }} className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
            + Add deliverable
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-green-400 rounded-full transition-all" style={{ width: `${Math.round((done / Math.max(total, 1)) * 100)}%` }} />
        </div>
      </div>

      {/* Grouped by company then engagement */}
      <div className="space-y-6">
        {(() => {
          // Get unique companies
          const companies = [...new Set(
            engagements
              .filter(eng => filtered.some(d => d.engagementId === eng.id))
              .map(eng => eng.clientName)
          )];

          return companies.map(company => {
            const companyEngs = engagements.filter(e => e.clientName === company);
            return (
              <div key={company}>
                {/* Company header */}
                <h2 className="text-sm font-semibold text-gray-700 mb-3">{company}</h2>
                <div className="space-y-3 pl-2">
                  {companyEngs.map(eng => {
                    const items = filtered.filter(d => d.engagementId === eng.id);
                    if (items.length === 0) return null;
                    return (
                      <div key={eng.id}>
                        {/* Engagement sub-header */}
                        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                          {eng.engagementName || eng.clientName}
                        </h3>
                        <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
                          {items.map(d => (
                            <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                              <button
                                onClick={() => toggle(d.id)}
                                className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors ${d.done ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-400'}`}
                                aria-label={`Mark "${d.title}" as ${d.done ? 'pending' : 'done'}`}
                              >
                                {d.done && <span className="text-white text-[9px] font-bold leading-none">✓</span>}
                              </button>
                              <div className="flex-1 min-w-0">
                                <span className={`text-sm block truncate ${d.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>{d.title}</span>
                              </div>
                              <span className={`text-xs font-medium shrink-0 ${dueDateColor(d.dueDate, d.done)}`}>
                                {dueDateLabel(d.dueDate)}
                              </span>
                              <button onClick={() => openEdit(d)} className="text-xs text-gray-300 hover:text-gray-600 transition-colors ml-1" aria-label="Edit deliverable">✎</button>
                              <button onClick={() => remove(d.id)} className="text-xs text-gray-300 hover:text-red-500 transition-colors ml-1" aria-label="Remove deliverable">✕</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          });
        })()}

        {ungrouped.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Other</h2>
            <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
              {ungrouped.map(d => (
                <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                  <button onClick={() => toggle(d.id)} className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors ${d.done ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-400'}`}>
                    {d.done && <span className="text-white text-[9px] font-bold">✓</span>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm block truncate ${d.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>{d.title}</span>
                  </div>
                  <span className={`text-xs font-medium shrink-0 ${dueDateColor(d.dueDate, d.done)}`}>{dueDateLabel(d.dueDate)}</span>
                  <button onClick={() => openEdit(d)} className="text-xs text-gray-300 hover:text-gray-600 transition-colors ml-1">✎</button>
                  <button onClick={() => remove(d.id)} className="text-xs text-gray-300 hover:text-red-500 transition-colors ml-1">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-12">No deliverables to show.</p>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-lg shadow-xl max-h-[60vh] overflow-y-auto">
            <h2 className="text-base font-semibold text-gray-900 mb-5">New deliverable</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Title</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Draft audit report" />
              </div>
              <div className="w-full min-w-0">
                <label className="block text-xs text-gray-500 mb-1">Due date</label>
                <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Engagement</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={form.engagementId} onChange={e => setForm(f => ({ ...f, engagementId: e.target.value }))}>
                  <option value="">— none —</option>
                  {engagements.map(e => <option key={e.id} value={e.id}>{e.clientName}</option>)}
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
      {editingDel && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-md shadow-xl">
            <h2 className="text-base font-semibold text-gray-900 mb-5">Edit deliverable</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Title</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Due date</label>
                <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={editForm.dueDate} onChange={e => setEditForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Engagement</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={editForm.engagementId} onChange={e => setEditForm(f => ({ ...f, engagementId: e.target.value }))}>
                  <option value="">— none —</option>
                  {engagements.map(e => <option key={e.id} value={e.id}>{e.clientName}{e.engagementName ? ` — ${e.engagementName}` : ''}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditingDel(null)} className="text-sm text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={saveEdit} className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
