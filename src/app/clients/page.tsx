'use client';

import { useEffect, useState } from 'react';
import { loadData, saveData } from '@/lib/storage';
import { Client, Engagement } from '@/lib/types';
import { seedClients, seedEngagements } from '@/lib/seeds';

const avatarColors = [
  'bg-blue-100 text-blue-800', 'bg-green-100 text-green-800',
  'bg-purple-100 text-purple-800', 'bg-amber-100 text-amber-800',
  'bg-pink-100 text-pink-800', 'bg-teal-100 text-teal-800',
];

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

const emptyForm: Omit<Client, 'id'> = {
  name: '', role: '', email: '', phone: '', company: '', engagementId: '',
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<Omit<Client, 'id'>>(emptyForm);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setClients(loadData('clients', seedClients));
    setEngagements(loadData('engagements', seedEngagements));
  }, []);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company.toLowerCase().includes(search.toLowerCase()) ||
    c.role.toLowerCase().includes(search.toLowerCase())
  );

  function openNew() { setEditing(null); setForm(emptyForm); setShowModal(true); }
  function openEdit(c: Client) {
    setEditing(c);
    setForm({ name: c.name, role: c.role, email: c.email, phone: c.phone || '', company: c.company, engagementId: c.engagementId });
    setShowModal(true);
  }

  function save() {
    if (!form.name.trim() || !form.email.trim()) return;
    let updated: Client[];
    if (editing) {
      updated = clients.map(c => c.id === editing.id ? { ...editing, ...form } : c);
    } else {
      updated = [...clients, { ...form, id: `cli-${Date.now()}` }];
    }
    setClients(updated);
    saveData('clients', updated);
    setShowModal(false);
  }

  function remove(id: string) {
    if (!confirm('Remove this contact?')) return;
    const updated = clients.filter(c => c.id !== id);
    setClients(updated);
    saveData('clients', updated);
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-0.5">{clients.length} contacts</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <input
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 w-full sm:w-56"
            placeholder="Search contacts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button onClick={openNew} className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
            + Add contact
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((c, i) => {
          const eng = engagements.find(e => e.id === c.engagementId);
          return (
            <div key={c.id} className="bg-white border border-gray-100 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                  {initials(c.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-gray-900">{c.name}</span>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => openEdit(c)} className="text-xs text-gray-400 hover:text-gray-700 px-1.5 py-0.5 rounded hover:bg-gray-50 transition-colors">Edit</button>
                      <button onClick={() => remove(c.id)} className="text-xs text-gray-400 hover:text-red-600 px-1.5 py-0.5 rounded hover:bg-red-50 transition-colors">Remove</button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{c.company} · {c.role}</div>

                  <div className="mt-3 space-y-1.5">
                    <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-xs text-blue-600 hover:underline">
                      <span className="text-gray-400">✉</span> {c.email}
                    </a>
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900">
                        <span className="text-gray-400">✆</span> {c.phone}
                      </a>
                    )}
                    {eng && (
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>◈</span>
                        <span>{eng.clientName} — <span className="capitalize">{eng.phase}</span></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-2 text-sm text-gray-400 py-12 text-center">
            No contacts found.
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-base font-semibold text-gray-900 mb-5">{editing ? 'Edit contact' : 'New contact'}</h2>
            <div className="space-y-4">
              {[
                { label: 'Full name', key: 'name', placeholder: 'e.g. Tanaka Noboru' },
                { label: 'Company', key: 'company', placeholder: 'e.g. Bank A' },
                { label: 'Role', key: 'role', placeholder: 'e.g. IT Audit Lead' },
                { label: 'Email', key: 'email', placeholder: 'name@company.com' },
                { label: 'Phone', key: 'phone', placeholder: '+81 3-1234-5678' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 mb-1">{label}</label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={(form as Record<string, string>)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Linked engagement</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={form.engagementId} onChange={e => setForm(f => ({ ...f, engagementId: e.target.value }))}>
                  <option value="">— none —</option>
                  {engagements.map(e => <option key={e.id} value={e.id}>{e.clientName}</option>)}
                </select>
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
