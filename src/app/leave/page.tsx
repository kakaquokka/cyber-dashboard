'use client';

import { useEffect, useState } from 'react';
import { loadData, saveData, deleteRow } from '@/lib/storage';
import { LeaveBalance, LeaveRecord } from '@/lib/types';
import { seedLeaveBalances, seedLeaveRecords } from '@/lib/seeds';
import { format, differenceInCalendarDays, parseISO } from 'date-fns';

const coreLeaveTypes = ['AL', 'BL', 'NPL', 'CL'];

const leaveColors: Record<string, string> = {
  AL: 'bg-blue-100 text-blue-800',
  BL: 'bg-pink-100 text-pink-800',
  NPL: 'bg-gray-100 text-gray-600',
  CL: 'bg-amber-100 text-amber-800',
};
const leaveBarColors: Record<string, string> = {
  AL: 'bg-blue-400',
  BL: 'bg-pink-400',
  NPL: 'bg-gray-400',
  CL: 'bg-amber-400',
};
const defaultColor = 'bg-purple-100 text-purple-800';
const defaultBarColor = 'bg-purple-400';

function leaveColor(type: string) { return leaveColors[type] || defaultColor; }
function leaveBar(type: string) { return leaveBarColors[type] || defaultBarColor; }

function formatDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

const currentYear = new Date().getFullYear();

const emptyRecord: Omit<LeaveRecord, 'id'> = {
  type: 'AL', startDate: '', endDate: '', days: 1, notes: '',
};

const emptyBalance: Omit<LeaveBalance, 'id' | 'used'> = {
  year: currentYear, type: 'AL', entitled: 0,
};

export default function LeavePage() {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [records, setRecords] = useState<LeaveRecord[]>([]);

  // Modals
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);

  // Editing
  const [editingRecord, setEditingRecord] = useState<LeaveRecord | null>(null);
  const [editingBalance, setEditingBalance] = useState<LeaveBalance | null>(null);

  // Forms
  const [recordForm, setRecordForm] = useState<Omit<LeaveRecord, 'id'>>(emptyRecord);
  const [balanceForm, setBalanceForm] = useState<Omit<LeaveBalance, 'id' | 'used'>>(emptyBalance);

  // Custom type state
  const [recordCustomType, setRecordCustomType] = useState('');
  const [showRecordCustomType, setShowRecordCustomType] = useState(false);
  const [balanceCustomType, setBalanceCustomType] = useState('');
  const [showBalanceCustomType, setShowBalanceCustomType] = useState(false);

  useEffect(() => {
    loadData('leave_balances', seedLeaveBalances).then(setBalances);
    loadData('leave_records', seedLeaveRecords).then(setRecords);
  }, []);

  // Compute used days per type from records
  function usedDays(type: string) {
    return records.filter(r => r.type === type).reduce((s, r) => s + r.days, 0);
  }

  // All types available across balances
  const allTypes = [...new Set([...coreLeaveTypes, ...balances.map(b => b.type)])];

  // Auto-calculate days from dates
  function handleDateChange(field: 'startDate' | 'endDate', value: string) {
    const formatted = formatDateInput(value);
    const updated = { ...recordForm, [field]: formatted };
    // If only start date is filled, default end date to same day and days to 1
    if (field === 'startDate' && formatted.length === 10 && !updated.endDate) {
      updated.endDate = formatted;
      updated.days = 1;
    }
    if (updated.startDate.length === 10 && updated.endDate.length === 10) {
      try {
        const diff = differenceInCalendarDays(parseISO(updated.endDate), parseISO(updated.startDate)) + 1;
        updated.days = diff > 0 ? diff : 1;
      } catch { /* invalid date */ }
    }
    setRecordForm(updated);
  }

  // Save leave record
  async function saveRecord() {
    const type = showRecordCustomType && recordCustomType.trim()
      ? recordCustomType.trim()
      : recordForm.type;
    if (!recordForm.startDate || !type) return;
    const endDate = recordForm.endDate || recordForm.startDate;
    const entry = { ...recordForm, type, endDate };
    let updated: LeaveRecord[];
    if (editingRecord) {
      updated = records.map(r => r.id === editingRecord.id ? { ...editingRecord, ...entry } : r);
    } else {
      updated = [...records, { ...entry, id: `lr-${Date.now()}` }];
    }
    updated.sort((a, b) => b.startDate.localeCompare(a.startDate));
    setRecords(updated);
    await saveData('leave_records', updated);
    closeRecordModal();
  }

  function closeRecordModal() {
    setShowRecordModal(false);
    setEditingRecord(null);
    setRecordForm(emptyRecord);
    setShowRecordCustomType(false);
    setRecordCustomType('');
  }

  function openEditRecord(r: LeaveRecord) {
    setEditingRecord(r);
    const isCustom = !coreLeaveTypes.includes(r.type) && !balances.find(b => b.type === r.type && coreLeaveTypes.includes(b.type));
    setRecordForm({ type: r.type, startDate: r.startDate, endDate: r.endDate, days: r.days, notes: r.notes || '' });
    setShowRecordCustomType(isCustom);
    setRecordCustomType(isCustom ? r.type : '');
    setShowRecordModal(true);
  }

  async function deleteRecord(id: string) {
    if (!confirm('Remove this leave record?')) return;
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    deleteRow('leave_records', id);
  }

  // Save leave balance
  async function saveBalance() {
    const type = showBalanceCustomType && balanceCustomType.trim()
      ? balanceCustomType.trim()
      : balanceForm.type;
    if (!type || balanceForm.entitled < 0) return;

    let updated: LeaveBalance[];
    if (editingBalance) {
      updated = balances.map(b =>
        b.id === editingBalance.id ? { ...b, entitled: balanceForm.entitled } : b
      );
    } else {
      // Check if type already exists
      const exists = balances.find(b => b.type === type && b.year === currentYear);
      if (exists) {
        updated = balances.map(b =>
          b.type === type && b.year === currentYear ? { ...b, entitled: balanceForm.entitled } : b
        );
      } else {
        updated = [...balances, {
          id: `lb-${Date.now()}`,
          year: currentYear,
          type,
          entitled: balanceForm.entitled,
          used: 0,
        }];
      }
    }
    setBalances(updated);
    await saveData('leave_balances', updated);
    closeBalanceModal();
  }

  function closeBalanceModal() {
    setShowBalanceModal(false);
    setEditingBalance(null);
    setBalanceForm(emptyBalance);
    setShowBalanceCustomType(false);
    setBalanceCustomType('');
  }

  function openEditBalance(b: LeaveBalance) {
    setEditingBalance(b);
    setBalanceForm({ year: b.year, type: b.type, entitled: b.entitled });
    setShowBalanceCustomType(false);
    setShowBalanceModal(true);
  }

  async function deleteBalance(id: string) {
    if (!confirm('Remove this leave type balance?')) return;
    const updated = balances.filter(b => b.id !== id);
    setBalances(updated);
    deleteRow('leave_balances', id);
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl pb-24">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Leave Balance</h1>
          <p className="text-sm text-gray-500 mt-0.5">{currentYear} · 1 Jan – 31 Dec</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setEditingBalance(null); setBalanceForm(emptyBalance); setShowBalanceCustomType(false); setBalanceCustomType(''); setShowBalanceModal(true); }}
            className="text-sm border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            + Add balance
          </button>
          <button
            onClick={() => { setEditingRecord(null); setRecordForm(emptyRecord); setShowRecordCustomType(false); setRecordCustomType(''); setShowRecordModal(true); }}
            className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            + Log leave
          </button>
        </div>
      </div>

      {/* Summary strip */}
      {balances.length > 0 && (() => {
        const totalEntitled = balances.reduce((s, b) => s + b.entitled, 0);
        const totalUsed = balances.reduce((s, b) => s + usedDays(b.type), 0);
        const totalRemaining = totalEntitled - totalUsed;
        return (
          <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-gray-500">{currentYear} · All leave types combined</div>
              <div className="text-xs text-gray-400">{totalEntitled > 0 ? Math.round((totalUsed / totalEntitled) * 100) : 0}% used</div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center">
                <div className="text-2xl font-semibold text-gray-900">{totalRemaining}</div>
                <div className="text-xs text-gray-400 mt-0.5">Remaining</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-amber-500">{totalUsed}</div>
                <div className="text-xs text-gray-400 mt-0.5">Used</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-gray-400">{totalEntitled}</div>
                <div className="text-xs text-gray-400 mt-0.5">Entitled</div>
              </div>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-400 rounded-full transition-all"
                style={{ width: `${totalEntitled > 0 ? Math.min((totalUsed / totalEntitled) * 100, 100) : 0}%` }}
              />
            </div>
          </div>
        );
      })()}

      {/* Balance cards */}
      <div className="space-y-3 mb-8">
        {balances.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">No leave balances yet. Add one to get started.</p>
        )}
        {balances.map(b => {
          const used = usedDays(b.type);
          const remaining = b.entitled - used;
          const pct = b.entitled > 0 ? Math.min((used / b.entitled) * 100, 100) : 0;
          return (
            <div key={b.id} className="bg-white border border-gray-100 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${leaveColor(b.type)}`}>{b.type}</span>
                  <span className="text-sm font-medium text-gray-700">
                    {b.type === 'AL' ? 'Annual Leave' :
                     b.type === 'BL' ? 'Birthday Leave' :
                     b.type === 'NPL' ? 'No-paid Leave' :
                     b.type === 'CL' ? 'Compensatory Leave' : b.type}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditBalance(b)} className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-50 transition-colors">Edit</button>
                  <button onClick={() => deleteBalance(b.id)} className="text-xs text-gray-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors">Remove</button>
                </div>
              </div>

              {/* Three stats */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-gray-900">{b.entitled}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Entitled</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-amber-600">{used}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Used</div>
                </div>
                <div className={`rounded-lg p-3 text-center ${remaining < 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <div className={`text-lg font-semibold ${remaining < 0 ? 'text-red-600' : remaining === 0 ? 'text-gray-400' : 'text-green-600'}`}>{remaining}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Remaining</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-red-400' : leaveBar(b.type)}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{Math.round(pct)}% used</span>
                {remaining < 0 && <span className="text-red-500">{Math.abs(remaining)} over limit</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Leave records */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-500">Leave taken</h2>
        <span className="text-xs text-gray-400">{records.length} records · {records.reduce((s, r) => s + r.days, 0)} days total</span>
      </div>

      {records.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No leave taken yet.</p>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
          {records.map(r => (
            <div key={r.id} className="flex items-start gap-3 px-4 py-3">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-md shrink-0 mt-0.5 ${leaveColor(r.type)}`}>{r.type}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-800">
                  {r.startDate.length === 10 && r.endDate.length === 10
                    ? r.startDate === r.endDate
                      ? format(parseISO(r.startDate), 'd MMM yyyy')
                      : `${format(parseISO(r.startDate), 'd MMM')} – ${format(parseISO(r.endDate), 'd MMM yyyy')}`
                    : r.startDate}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {r.days} day{r.days !== 1 ? 's' : ''}{r.notes ? ` · ${r.notes}` : ''}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEditRecord(r)} className="text-xs text-gray-300 hover:text-gray-600 transition-colors px-1">✎</button>
                <button onClick={() => deleteRecord(r.id)} className="text-xs text-gray-300 hover:text-red-500 transition-colors px-1">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit balance modal */}
      {showBalanceModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-md shadow-xl max-h-[75vh] overflow-y-auto">
            <h2 className="text-base font-semibold text-gray-900 mb-5">
              {editingBalance ? `Edit ${editingBalance.type} balance` : 'Add leave balance'}
            </h2>
            <div className="space-y-4">
              {/* Type selector — only when adding new */}
              {!editingBalance && (
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Leave type</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {allTypes.map(t => (
                      <button key={t} type="button"
                        onClick={() => { setBalanceForm(f => ({ ...f, type: t })); setShowBalanceCustomType(false); setBalanceCustomType(''); }}
                        className={`text-xs px-2.5 py-1 rounded-md border capitalize transition-colors ${balanceForm.type === t && !showBalanceCustomType ? leaveColor(t) + ' border-transparent' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                        {t}
                      </button>
                    ))}
                    <button type="button"
                      onClick={() => setShowBalanceCustomType(true)}
                      className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${showBalanceCustomType ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                      Other
                    </button>
                  </div>
                  {showBalanceCustomType && (
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="e.g. ML (Maternity Leave)"
                      value={balanceCustomType}
                      onChange={e => { setBalanceCustomType(e.target.value); setBalanceForm(f => ({ ...f, type: e.target.value })); }}
                    />
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs text-gray-500 mb-1">Total days entitled this year</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={balanceForm.entitled}
                  onChange={e => setBalanceForm(f => ({ ...f, entitled: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={closeBalanceModal} className="text-sm text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={saveBalance} className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit record modal */}
      {showRecordModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-md shadow-xl max-h-[75vh] overflow-y-auto">
            <h2 className="text-base font-semibold text-gray-900 mb-5">
              {editingRecord ? 'Edit leave record' : 'Log leave'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-2">Leave type</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {allTypes.map(t => (
                    <button key={t} type="button"
                      onClick={() => { setRecordForm(f => ({ ...f, type: t })); setShowRecordCustomType(false); setRecordCustomType(''); }}
                      className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${recordForm.type === t && !showRecordCustomType ? leaveColor(t) + ' border-transparent' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                      {t}
                    </button>
                  ))}
                  <button type="button"
                    onClick={() => setShowRecordCustomType(true)}
                    className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${showRecordCustomType ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                    Other
                  </button>
                </div>
                {showRecordCustomType && (
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="e.g. ML"
                    value={recordCustomType}
                    onChange={e => { setRecordCustomType(e.target.value); setRecordForm(f => ({ ...f, type: e.target.value })); }}
                  />
                )}
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Start date</label>
                <input
                  type="text"
                  placeholder="YYYY-MM-DD"
                  maxLength={10}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={recordForm.startDate}
                  onChange={e => handleDateChange('startDate', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">End date <span className="text-gray-300">(leave blank for 1 day)</span></label>
                <input
                  type="text"
                  placeholder="YYYY-MM-DD"
                  maxLength={10}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={recordForm.endDate}
                  onChange={e => handleDateChange('endDate', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Number of days</label>
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={recordForm.days}
                  onChange={e => setRecordForm(f => ({ ...f, days: Number(e.target.value) }))}
                />
                <p className="text-xs text-gray-400 mt-1">Auto-calculated from dates. Adjust for half days.</p>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Notes <span className="text-gray-300">(optional)</span></label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="e.g. Family trip"
                  value={recordForm.notes}
                  onChange={e => setRecordForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={closeRecordModal} className="text-sm text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={saveRecord} className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}