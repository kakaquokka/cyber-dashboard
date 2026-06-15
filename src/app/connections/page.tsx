'use client';

import { useEffect, useState } from 'react';
import { loadData, saveData, deleteRow } from '@/lib/storage';
import { Connection, ConnectionType, ClientStatus, ColleagueStatus, Engagement } from '@/lib/types';
import { seedConnections, seedEngagements } from '@/lib/seeds';

const avatarColors = [
  'bg-blue-100 text-blue-800', 'bg-green-100 text-green-800',
  'bg-purple-100 text-purple-800', 'bg-amber-100 text-amber-800',
  'bg-pink-100 text-pink-800', 'bg-teal-100 text-teal-800',
];

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

const clientStatusStyles: Record<ClientStatus, string> = {
  engaging: 'bg-blue-100 text-blue-800',
  potential: 'bg-amber-100 text-amber-800',
};

const colleagueStatusStyles: Record<ColleagueStatus, string> = {
  current: 'bg-green-100 text-green-800',
  past: 'bg-gray-100 text-gray-600',
};

const emptyForm: Omit<Connection, 'id'> = {
  name: '', role: '', email: '', companyPhone: '', mobilePhone: '', company: '',
  type: 'client', clientStatus: 'engaging', colleagueStatus: 'current', engagementId: '',
};

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Connection | null>(null);
  const [form, setForm] = useState<Omit<Connection, 'id'>>(emptyForm);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | ConnectionType>('all');

  useEffect(() => {
    loadData('connections', seedConnections).then(setConnections);
    loadData('engagements', seedEngagements).then(setEngagements);
  }, []);

  const filtered = connections.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      (c.role?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesFilter = filter === 'all' ? true : c.type === filter;
    return matchesSearch && matchesFilter;
  });

  // Group clients by status
  const clientGroups: { label: string; status: ClientStatus }[] = [
    { label: 'Engaging', status: 'engaging' },
    { label: 'Potential', status: 'potential' },
  ];

  const colleagueGroups: { label: string; status: ColleagueStatus }[] = [
    { label: 'Current colleagues', status: 'current' },
    { label: 'Past colleagues', status: 'past' },
  ];

  function openNew() { setEditing(null); setForm(emptyForm); setShowModal(true); }
  function openEdit(c: Connection) {
    setEditing(c);
    setForm({
      name: c.name, role: c.role || '', email: c.email || '',
      companyPhone: c.companyPhone || '', mobilePhone: c.mobilePhone || '', company: c.company,
      type: c.type, clientStatus: c.clientStatus || 'engaging', colleagueStatus: c.colleagueStatus || 'current',
      engagementId: c.engagementId || '',
    });
    setShowModal(true);
  }

  async function save() {
    if (!form.name.trim() || !form.company.trim()) return;
    let updated: Connection[];
    if (editing) {
      updated = connections.map(c => c.id === editing.id ? { ...editing, ...form } : c);
    } else {
      updated = [...connections, { ...form, id: `conn-${Date.now()}` }];
    }
    setConnections(updated);
    await saveData('connections', updated);
    setShowModal(false);
  }

  async function remove(id: string) {
    if (!confirm('Remove this connection?')) return;
    const updated = connections.filter(c => c.id !== id);
    setConnections(updated);
    deleteRow('connections', id);
  }

  function renderCard(c: Connection, i: number) {
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
              {c.email && (
                <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-xs text-blue-600 hover:underline">
                  <span className="text-gray-400">✉</span> {c.email}
                </a>
              )}
              {c.companyPhone && (
                <a href={`tel:${c.companyPhone}`} className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900">
                  <span className="text-gray-400">☎</span> {c.companyPhone} <span className="text-gray-300">(office)</span>
                </a>
              )}
              {c.mobilePhone && (
                <a href={`tel:${c.mobilePhone}`} className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900">
                  <span className="text-gray-400">✆</span> {c.mobilePhone} <span className="text-gray-300">(mobile)</span>
                </a>
              )}
              {eng && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>◈</span>
                  <span>{eng.clientName}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Connections</h1>
          <p className="text-sm text-gray-500 mt-0.5">{connections.length} total</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <input
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 w-full sm:w-56"
            placeholder="Search connections..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button onClick={openNew} className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
            + Add connection
          </button>
        </div>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 mb-6">
        {(['all', 'client', 'colleague'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-lg border capitalize transition-colors ${filter === f ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
            {f === 'all' ? 'All' : f === 'client' ? 'Clients' : 'Colleagues'}
          </button>
        ))}
      </div>

      {/* Clients grouped */}
      {filter !== 'colleague' && clientGroups.map(({ label, status }) => {
        const items = filtered.filter(c => c.type === 'client' && c.clientStatus === status);
        if (items.length === 0) return null;
        return (
          <div key={status} className="mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              {label}
              <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${clientStatusStyles[status]}`}>{items.length}</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((c, i) => renderCard(c, i))}
            </div>
          </div>
        );
      })}

      {/* Colleagues grouped */}
      {filter !== 'client' && colleagueGroups.map(({ label, status }) => {
        const items = filtered.filter(c => c.type === 'colleague' && c.colleagueStatus === status);
        if (items.length === 0) return null;
        return (
          <div key={status} className="mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              {label}
              <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${colleagueStatusStyles[status]}`}>{items.length}</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((c, i) => renderCard(c, i))}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-12">No connections found.</p>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-md shadow-xl max-h-[75vh] overflow-y-auto">
            <h2 className="text-base font-semibold text-gray-900 mb-5">{editing ? 'Edit connection' : 'New connection'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-2">Type</label>
                <div className="flex gap-2">
                  {(['client', 'colleague'] as ConnectionType[]).map(t => (
                    <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={`flex-1 text-sm py-2 rounded-lg border capitalize transition-colors ${form.type === t ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                      {t === 'client' ? 'Client' : 'Colleague'}
                    </button>
                  ))}
                </div>
              </div>

              {[
                { label: 'Full name', key: 'name', placeholder: 'e.g. Tanaka Noboru', required: true },
                { label: 'Company', key: 'company', placeholder: 'e.g. Bank A', required: true },
                { label: 'Role', key: 'role', placeholder: 'e.g. IT Audit Lead', required: false },
                { label: 'Email', key: 'email', placeholder: 'name@company.com', required: false },
                { label: 'Company phone', key: 'companyPhone', placeholder: '+81 3-1234-5678', required: false },
                { label: 'Mobile phone', key: 'mobilePhone', placeholder: '+81 90-1234-5678', required: false },
              ].map(({ label, key, placeholder, required }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 mb-1">{label}{!required && <span className="text-gray-300"> (optional)</span>}</label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={(form as Record<string, string>)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                  />
                </div>
              ))}

              {form.type === 'client' ? (
                <>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">Status</label>
                    <div className="flex gap-2">
                      {(['engaging', 'potential'] as ClientStatus[]).map(s => (
                        <button key={s} type="button" onClick={() => setForm(f => ({ ...f, clientStatus: s }))}
                          className={`flex-1 text-xs px-2 py-2 rounded-lg border capitalize transition-colors ${form.clientStatus === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Linked engagement</label>
                    <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={form.engagementId} onChange={e => setForm(f => ({ ...f, engagementId: e.target.value }))}>
                      <option value="">— none —</option>
                      {engagements.map(e => <option key={e.id} value={e.id}>{e.clientName}</option>)}
                    </select>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Status</label>
                  <div className="flex gap-2">
                    {(['current', 'past'] as ColleagueStatus[]).map(s => (
                      <button key={s} type="button" onClick={() => setForm(f => ({ ...f, colleagueStatus: s }))}
                        className={`flex-1 text-sm py-2 rounded-lg border capitalize transition-colors ${form.colleagueStatus === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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