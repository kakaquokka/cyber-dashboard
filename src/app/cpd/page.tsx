'use client';

import { useEffect, useState } from 'react';
import { loadData, saveData, deleteRow } from '@/lib/storage';
import { CpdEntry } from '@/lib/types';
import { seedCpd } from '@/lib/seeds';
import { format } from 'date-fns';

const CPD_TARGET = 40;

const categoryColors: Record<string, string> = {
  course: 'bg-blue-100 text-blue-800',
  webinar: 'bg-purple-100 text-purple-800',
  conference: 'bg-amber-100 text-amber-800',
  'self-study': 'bg-green-100 text-green-800',
  workshop: 'bg-teal-100 text-teal-800',
};
const defaultCategoryColor = 'bg-gray-100 text-gray-600';

const presetCategories = ['course', 'webinar', 'conference', 'self-study', 'workshop'];

const emptyForm: Omit<CpdEntry, 'id'> = {
  title: '', provider: '', date: '', hours: 1, category: 'webinar',
};

export default function CpdPage() {
  const [entries, setEntries] = useState<CpdEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Omit<CpdEntry, 'id'>>(emptyForm);
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => { loadData('cpd', seedCpd).then(setEntries); }, []);

  const totalHours = entries.reduce((s, e) => s + e.hours, 0);
  const pct = Math.min(Math.round((totalHours / CPD_TARGET) * 100), 100);

  const byCategory = presetCategories.map(cat => ({
    cat, hours: entries.filter(e => e.category === cat).reduce((s, e) => s + e.hours, 0),
  })).filter(c => c.hours > 0);

  function formatDateInput(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 4) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
  }

  function save() {
    if (!form.title.trim() || !form.date || form.hours <= 0) return;
    const updated = [...entries, { ...form, id: `cpd-${Date.now()}` }].sort((a, b) => b.date.localeCompare(a.date));
    setEntries(updated);
    saveData('cpd', updated);
    setShowModal(false);
    setForm(emptyForm);
  }

  function remove(id: string) {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    deleteRow('cpd', id);
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">CPD log</h1>
          <p className="text-sm text-gray-500 mt-0.5">{new Date().getFullYear()} · {totalHours} of {CPD_TARGET} hours</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setShowModal(true); }} className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
          + Log activity
        </button>
      </div>

      {/* Summary */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
        <div className="flex items-end justify-between mb-3">
          <div>
            <span className="text-3xl font-semibold text-gray-900">{totalHours}</span>
            <span className="text-sm text-gray-400 ml-1">/ {CPD_TARGET} hrs</span>
          </div>
          <span className="text-sm font-medium text-gray-500">{pct}% complete</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-purple-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex flex-wrap gap-3">
          {byCategory.map(({ cat, hours }) => (
            <span key={cat} className={`text-xs font-medium px-2.5 py-1 rounded-md capitalize ${categoryColors[cat] || defaultCategoryColor}`}>
              {cat}: {hours}h
            </span>
          ))}
        </div>
      </div>

      {/* Entries list */}
      <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
        {entries.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-12">No CPD entries yet. Log your first activity.</p>
        )}
        {entries.map(entry => (
          <div key={entry.id} className="flex items-center gap-4 px-5 py-4">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-purple-700">{entry.hours}h</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800">{entry.title}</div>
              <div className="text-xs text-gray-400 mt-0.5">{entry.provider} · {format(new Date(entry.date), 'd MMM yyyy')}</div>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-md capitalize shrink-0 ${categoryColors[entry.category] || defaultCategoryColor}`}>
              {entry.category}
            </span>
            <button onClick={() => remove(entry.id)} className="text-xs text-gray-300 hover:text-red-500 transition-colors" aria-label="Remove entry">✕</button>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-lg shadow-xl max-h-[60vh] overflow-y-auto">
            <h2 className="text-base font-semibold text-gray-900 mb-5">Log CPD activity</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Title</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. ISACA CISA Webinar" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Provider / organiser</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} placeholder="e.g. ISACA" />
              </div>
              <div className="flex flex-col gap-3">
                <div className="w-full min-w-0">
                  <label className="block text-xs text-gray-500 mb-1">Date</label>
                  <input
                    type="text"
                    placeholder="YYYY-MM-DD"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: formatDateInput(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Hours</label>
                  <input type="number" min={0.5} step={0.5} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: Number(e.target.value) }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-2">Category</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {presetCategories.map(cat => (
                    <button key={cat} type="button" onClick={() => { setForm(f => ({ ...f, category: cat })); setShowCustomInput(false); }} className={`text-xs px-2.5 py-1 rounded-md border capitalize transition-colors ${form.category === cat ? (categoryColors[cat] || defaultCategoryColor) + ' border-transparent' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                      {cat}
                    </button>
                  ))}
                  <button type="button" onClick={() => setShowCustomInput(true)} className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${showCustomInput || !presetCategories.includes(form.category) ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                    Other
                  </button>
                </div>
                {(showCustomInput || !presetCategories.includes(form.category)) && (
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="e.g. Internal training"
                    value={customCategory || (!presetCategories.includes(form.category) ? form.category : '')}
                    onChange={e => { setCustomCategory(e.target.value); setForm(f => ({ ...f, category: e.target.value })); }}
                  />
                )}
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
