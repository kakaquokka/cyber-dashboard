'use client';

import { useEffect, useState } from 'react';
import { loadData, saveData, deleteRow, saveItem } from '@/lib/storage';
import { CalendarEvent, Engagement, Deliverable, MeetingApp, MeetingMode } from '@/lib/types';
import { seedEvents, seedEngagements, seedDeliverables } from '@/lib/seeds';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay,
         isToday, getDay, addMonths, subMonths } from 'date-fns';

const meetingApps: MeetingApp[] = ['Zoom', 'Teams', 'Google Meet', 'Webex', 'Other'];

const emptyForm: Omit<CalendarEvent, 'id'> = {
  title: '', date: '', time: '', endTime: '', mode: 'online',
  meetingApp: 'Teams', meetingLink: '', location: '', notes: '', engagementId: '',
};

export default function CalendarPage() {
  const [calEvents, setCalEvents] = useState<CalendarEvent[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<CalendarEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState<Omit<CalendarEvent, 'id'>>(emptyForm);
  const [editForm, setEditForm] = useState<Omit<CalendarEvent, 'id'>>(emptyForm);

  useEffect(() => {
    loadData('events', seedEvents).then(setCalEvents);
    loadData('deliverables', seedDeliverables).then(setDeliverables);
    loadData('engagements', seedEngagements).then(setEngagements);
  }, []);

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const startPad = getDay(startOfMonth(currentMonth)); // 0=Sun

  function itemsForDay(day: Date) {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayEvents = calEvents.filter(e => e.date === dateStr);
    const dayDels = deliverables.filter(d => d.dueDate === dateStr && !d.done);
    return { dayEvents, dayDels };
  }

  function selectedDayItems() {
    if (!selectedDay) return { dayEvents: [], dayDels: [] };
    return itemsForDay(selectedDay);
  }

  async function save() {
    if (!form.title.trim() || !form.date || !form.time) return;
    const newEvt: CalendarEvent = { ...form, id: `evt-${Date.now()}` };
    await saveItem('events', newEvt);
    setCalEvents(prev =>
        [...prev, newEvt].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    );
    setShowModal(false);
    setForm(emptyForm);
    }

  function removeEvent(id: string) {
    const updated = calEvents.filter(e => e.id !== id);
    setCalEvents(updated);
    deleteRow('events', id);
    setShowDetail(null);
  }

  async function saveEdit() {
    if (!editingEvent || !editForm.title.trim() || !editForm.date || !editForm.time) return;
    const updated = { ...editingEvent, ...editForm };
    await saveItem('events', updated);
    setCalEvents(prev =>
        prev.map(e => e.id === editingEvent.id ? updated : e)
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    );
    setEditingEvent(null);
    setShowDetail(null);
    }

  const { dayEvents: selEvents, dayDels: selDels } = selectedDayItems();

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-500 mt-0.5">{format(currentMonth, 'MMMM yyyy')}</p>
        </div>
        <button
          onClick={() => { setForm({ ...emptyForm, date: selectedDay ? format(selectedDay, 'yyyy-MM-dd') : '' }); setShowModal(true); }}
          className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors self-start sm:self-auto"
        >
          + Add event
        </button>
      </div>

      {/* Month navigation */}
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors">‹</button>
        <span className="text-sm font-medium text-gray-700 flex-1 text-center">{format(currentMonth, 'MMMM yyyy')}</span>
        <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors">›</button>
      </div>

      {/* Calendar grid */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden mb-6">
        <div className="grid grid-cols-7 border-b border-gray-100">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-xs text-gray-400 py-2 font-medium">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: startPad }).map((_, i) => (
            <div key={`pad-${i}`} className="h-12 md:h-16 border-b border-r border-gray-50" />
          ))}
          {days.map(day => {
            const { dayEvents, dayDels } = itemsForDay(day);
            const hasItems = dayEvents.length > 0 || dayDels.length > 0;
            const selected = selectedDay && isSameDay(day, selectedDay);
            const today = isToday(day);
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(day)}
                className={`h-12 md:h-16 border-b border-r border-gray-50 flex flex-col items-center pt-1.5 gap-0.5 transition-colors relative
                  ${selected ? 'bg-gray-900' : today ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
              >
                <span className={`text-xs font-medium ${selected ? 'text-white' : today ? 'text-blue-600' : 'text-gray-700'}`}>
                  {format(day, 'd')}
                </span>
                {hasItems && (
                  <div className="flex gap-0.5">
                    {dayEvents.length > 0 && <span className="w-1 h-1 rounded-full bg-blue-400" />}
                    {dayDels.length > 0 && <span className="w-1 h-1 rounded-full bg-red-400" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 text-xs text-gray-400">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />Meeting / event</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Deliverable due</span>
      </div>

      {/* Selected day panel */}
      {selectedDay && (
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <h2 className="text-sm font-medium text-gray-500 mb-3">
            {format(selectedDay, 'EEEE, d MMMM yyyy')}
          </h2>

          {selEvents.length === 0 && selDels.length === 0 && (
            <p className="text-sm text-gray-400">Nothing scheduled. <button onClick={() => { setForm({ ...emptyForm, date: format(selectedDay, 'yyyy-MM-dd') }); setShowModal(true); }} className="text-blue-500 hover:underline">Add an event.</button></p>
          )}

          {selDels.length > 0 && (
            <div className="mb-3">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Deliverables due</div>
              {selDels.map(d => {
                const eng = engagements.find(e => e.id === d.engagementId);
                return (
                  <div key={d.id} className="flex items-center gap-2 py-1.5 text-sm">
                    <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                    <span className="text-gray-800">{d.title}</span>
                    {eng && <span className="text-xs text-gray-400">— {eng.clientName}</span>}
                  </div>
                );
              })}
            </div>
          )}

          {selEvents.length > 0 && (
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Events</div>
              {selEvents.map(evt => (
                <button
                  key={evt.id}
                  onClick={() => setShowDetail(evt)}
                  className="w-full flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800">{evt.title}</div>
                    <div className="text-xs text-gray-400">{evt.time}{evt.endTime ? ` – ${evt.endTime}` : ''} · {evt.mode === 'online' ? evt.meetingApp : evt.location}</div>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">Details →</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Event detail popup */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-md shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900 pr-4">{showDetail.title}</h2>
              <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600 shrink-0">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex gap-2 text-gray-600">
                <span className="text-gray-400 shrink-0">📅</span>
                {format(new Date(showDetail.date), 'EEEE, d MMMM yyyy')}
              </div>
              <div className="flex gap-2 text-gray-600">
                <span className="text-gray-400 shrink-0">🕐</span>
                {showDetail.time}{showDetail.endTime ? ` – ${showDetail.endTime}` : ''}
              </div>
              {showDetail.mode === 'online' ? (
                <>
                  <div className="flex gap-2 text-gray-600">
                    <span className="text-gray-400 shrink-0">💻</span>
                    Online · {showDetail.meetingApp}
                  </div>
                  {showDetail.meetingLink && (
                    <div className="flex gap-2">
                      <span className="text-gray-400 shrink-0">🔗</span>
                      <a href={showDetail.meetingLink} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline break-all">{showDetail.meetingLink}</a>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex gap-2 text-gray-600">
                  <span className="text-gray-400 shrink-0">📍</span>
                  {showDetail.location}
                </div>
              )}
              {showDetail.engagementId && (() => {
                const eng = engagements.find(e => e.id === showDetail.engagementId);
                return eng ? (
                  <div className="flex gap-2 text-gray-600">
                    <span className="text-gray-400 shrink-0">◈</span>
                    {eng.clientName}
                  </div>
                ) : null;
              })()}
              {showDetail.notes && (
                <div className="flex gap-2 text-gray-600">
                  <span className="text-gray-400 shrink-0">📝</span>
                  {showDetail.notes}
                </div>
              )}
            </div>
            <div className="flex justify-between mt-6">
              <button onClick={() => removeEvent(showDetail.id)} className="text-xs text-red-400 hover:text-red-600 px-3 py-1.5 rounded hover:bg-red-50 transition-colors">Remove</button>
              <div className="flex gap-2">
                <button onClick={() => { setEditForm({ title: showDetail.title, date: showDetail.date, time: showDetail.time, endTime: showDetail.endTime || '', mode: showDetail.mode, meetingApp: showDetail.meetingApp || 'Teams', meetingLink: showDetail.meetingLink || '', location: showDetail.location || '', notes: showDetail.notes || '', engagementId: showDetail.engagementId || '' }); setEditingEvent(showDetail); setShowDetail(null); }} className="text-sm text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">Edit</button>
                <button onClick={() => setShowDetail(null)} className="text-sm text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add event modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-lg shadow-xl max-h-[60vh] overflow-y-auto">
            <h2 className="text-base font-semibold text-gray-900 mb-5">New event</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Title</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Bank A Kickoff" />
              </div>
              <div className="flex flex-col gap-3">
                <div className="w-full min-w-0">
                  <label className="block text-xs text-gray-500 mb-1">Date</label>
                  <input type="date" className="w-full max-w-full block border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="w-full min-w-0">
                  <label className="block text-xs text-gray-500 mb-1">Start time</label>
                  <input type="time" className="w-full max-w-full block border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                </div>
              </div>
              <div className="w-full min-w-0">
                <label className="block text-xs text-gray-500 mb-1">End time <span className="text-gray-300">(optional)</span></label>
                <input type="time" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
              </div>

              {/* Online / Offline toggle */}
              <div>
                <label className="block text-xs text-gray-500 mb-2">Meeting type</label>
                <div className="flex gap-2">
                  {(['online', 'offline'] as MeetingMode[]).map(m => (
                    <button key={m} type="button" onClick={() => setForm(f => ({ ...f, mode: m }))}
                      className={`flex-1 text-sm py-2 rounded-lg border capitalize transition-colors ${form.mode === m ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                      {m === 'online' ? '💻 Online' : '📍 In person'}
                    </button>
                  ))}
                </div>
              </div>

              {form.mode === 'online' ? (
                <>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">Meeting app</label>
                    <div className="flex flex-wrap gap-2">
                      {meetingApps.map(app => (
                        <button key={app} type="button" onClick={() => setForm(f => ({ ...f, meetingApp: app }))}
                          className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${form.meetingApp === app ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                          {app}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Meeting link <span className="text-gray-300">(optional)</span></label>
                    <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={form.meetingLink} onChange={e => setForm(f => ({ ...f, meetingLink: e.target.value }))} placeholder="https://..." />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Location</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Client HQ, Level 12 Meeting Room" />
                </div>
              )}

              <div>
                <label className="block text-xs text-gray-500 mb-1">Linked engagement <span className="text-gray-300">(optional)</span></label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={form.engagementId} onChange={e => setForm(f => ({ ...f, engagementId: e.target.value }))}>
                  <option value="">— none —</option>
                  {engagements.map(e => <option key={e.id} value={e.id}>{e.clientName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Notes <span className="text-gray-300">(optional)</span></label>
                <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Agenda, prep notes, etc." />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="text-sm text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={save} className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700">Save</button>
            </div>
          </div>
        </div>
      )}
      {editingEvent && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-lg shadow-xl max-h-[60vh] overflow-y-auto">
            <h2 className="text-base font-semibold text-gray-900 mb-5">Edit event</h2>
            <div className="space-y-4">
                <div>
                <label className="block text-xs text-gray-500 mb-1">Title</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Date</label>
                    <input type="date" className="w-full max-w-full block border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Start time</label>
                    <input type="time" className="w-full max-w-full block border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                  </div>
                </div>
                <div>
                <label className="block text-xs text-gray-500 mb-1">End time <span className="text-gray-300">(optional)</span></label>
                <input type="time" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={editForm.endTime} onChange={e => setEditForm(f => ({ ...f, endTime: e.target.value }))} />
                </div>
                <div>
                <label className="block text-xs text-gray-500 mb-2">Meeting type</label>
                <div className="flex gap-2">
                    {(['online', 'offline'] as MeetingMode[]).map(m => (
                    <button key={m} type="button" onClick={() => setEditForm(f => ({ ...f, mode: m }))}
                        className={`flex-1 text-sm py-2 rounded-lg border capitalize transition-colors ${editForm.mode === m ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                        {m === 'online' ? '💻 Online' : '📍 In person'}
                    </button>
                    ))}
                </div>
                </div>
                {editForm.mode === 'online' ? (
                <>
                    <div>
                    <label className="block text-xs text-gray-500 mb-2">Meeting app</label>
                    <div className="flex flex-wrap gap-2">
                        {meetingApps.map(app => (
                        <button key={app} type="button" onClick={() => setEditForm(f => ({ ...f, meetingApp: app }))}
                            className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${editForm.meetingApp === app ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                            {app}
                        </button>
                        ))}
                    </div>
                    </div>
                    <div>
                    <label className="block text-xs text-gray-500 mb-1">Meeting link <span className="text-gray-300">(optional)</span></label>
                    <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={editForm.meetingLink} onChange={e => setEditForm(f => ({ ...f, meetingLink: e.target.value }))} placeholder="https://..." />
                    </div>
                </>
                ) : (
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Location</label>
                    <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Client HQ, Level 12" />
                </div>
                )}
                <div>
                <label className="block text-xs text-gray-500 mb-1">Linked engagement <span className="text-gray-300">(optional)</span></label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={editForm.engagementId} onChange={e => setEditForm(f => ({ ...f, engagementId: e.target.value }))}>
                    <option value="">— none —</option>
                    {engagements.map(e => <option key={e.id} value={e.id}>{e.clientName}</option>)}
                </select>
                </div>
                <div>
                <label className="block text-xs text-gray-500 mb-1">Notes <span className="text-gray-300">(optional)</span></label>
                <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" rows={2} value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setEditingEvent(null)} className="text-sm text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={saveEdit} className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700">Save</button>
            </div>
            </div>
        </div>
        )}
    </div>
  );
}