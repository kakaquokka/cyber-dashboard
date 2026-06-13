'use client';

import { useEffect, useState } from 'react';
import { loadData, saveData, deleteRow } from '@/lib/storage';
import { Engagement, Phase } from '@/lib/types';
import { seedEngagements } from '@/lib/seeds';
import { PhaseBadge } from '@/components/Badge';
import { format, differenceInDays } from 'date-fns';

const phases: Phase[] = ['planning', 'fieldwork', 'reporting', 'closed'];
const allFrameworks = ['ISO 27001', 'NIST CSF', 'MAS TRM', 'CIS Controls', 'CSMS', 'PCI DSS', 'SOC 2'];

const emptyForm: Omit<Engagement, 'id'> = {
  clientName: '', phase: 'planning', progress: 0,
  deadline: '', frameworks: [], notes: '',
};

export default function EngagementsPage() {
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Engagement | null>(null);
  const [form, setForm] = useState<Omit<Engagement, 'id'>>(emptyForm);

  useEffect(() => { loadData('engagements', seedEngagements).then(setEngagements); }, []);

  function openNew() { setEditing(null); setForm(emptyForm); setShowModal(true); }
  function openEdit(e: Engagement) { setEditing(e); setForm({ clientName: e.clientName, phase: e.phase, progress: e.progress, deadline: e.deadline, frameworks: e.frameworks, notes: e.notes }); setShowModal(true); }

  function save() {
    if (!form.clientName.trim() || !form.deadline) return;
    let updated: Engagement[];
    if (editing) {
      updated = engagements.map(e => e.id === editing.id ? { ...editing, ...form } : e);
    } else {
      const newEng: Engagement = { ...form, id: `eng-${Date.now()}` };
      updated = [...engagements, newEng];
    }
    setEngagements(updated);
    saveData('engagements', updated);
    setShowModal(false);
  }

  function remove(id: string) {
    if (!confirm('Remove this engagement?')) return;
    const updated = engagements.filter(e => e.id !== id);
    setEngagements(updated);
    deleteRow('engagements', id);
  }

  function toggleFramework(fw: string) {
    setForm(f => ({
      ...f,
      frameworks: f.frameworks.includes(fw) ? f.frameworks.filter(x => x !== fw) : [...f.frameworks, fw],
    }));
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Engagements</h1>
          <p className="text-sm text-gray-500 mt-0.5">{engagements.filter(e => e.phase !== 'closed').length} active</p>
        </div>
        <button onClick={openNew} className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
          + New engagement
        </button>
      </div>

      <div className="space-y-3">
        {engagements.map(eng => {
          const daysLeft = differenceInDays(new Date(eng.deadline), new Date());
          return (
            <div key={eng.id} className="bg-white border border-gray-100 rounded-xl p-4">
              {/* Row 1: name + actions */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-base font-medium text-gray-900">{eng.clientName}</span>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEdit(eng)} className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-50 transition-colors">Edit</button>
                  <button onClick={() => remove(eng.id)} className="text-xs text-gray-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors">Remove</button>
                </div>
              </div>

              {/* Row 2: phase badge + framework tags */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <PhaseBadge phase={eng.phase} />
                {eng.frameworks.map(fw => (
                  <span key={fw} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{fw}</span>
                ))}
              </div>

              {/* Notes */}
              {eng.notes && <p className="text-sm text-gray-400 mb-3 truncate">{eng.notes}</p>}

              {/* Row 3: progress bar */}
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Progress</span><span>{eng.progress}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${eng.progress >= 80 ? 'bg-red-400' : eng.progress >= 50 ? 'bg-amber-400' : 'bg-blue-400'}`}
                    style={{ width: `${eng.progress}%` }}
                  />
                </div>
              </div>

              {/* Row 4: deadline */}
              <span className={`text-xs font-medium ${daysLeft < 0 ? 'text-red-600' : daysLeft <= 3 ? 'text-amber-600' : 'text-gray-400'}`}>
                {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today' : `${daysLeft}d left`} · {format(new Date(eng.deadline), 'd MMM yyyy')}
              </span>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-screen overflow-y-auto">
            <h2 className="text-base font-semibold text-gray-900 mb-5">{editing ? 'Edit engagement' : 'New engagement'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Client name</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} placeholder="e.g. Bank A" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Phase</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={form.phase} onChange={e => setForm(f => ({ ...f, phase: e.target.value as Phase }))}>
                    {phases.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Deadline</label>
                  <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Progress — {form.progress}%</label>
                <input type="range" min={0} max={100} step={5} className="w-full" value={form.progress} onChange={e => setForm(f => ({ ...f, progress: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-2">Frameworks</label>
                <div className="flex flex-wrap gap-2">
                  {allFrameworks.map(fw => (
                    <button key={fw} onClick={() => toggleFramework(fw)} className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${form.frameworks.includes(fw) ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                      {fw}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Notes</label>
                <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Scope, key focus areas, etc." />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="text-sm text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={save} className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
