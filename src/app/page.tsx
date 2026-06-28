'use client';

import { useEffect, useState } from 'react';
import { loadData, saveData } from '@/lib/storage';
import { Engagement, Task, Deliverable } from '@/lib/types';
import { seedEngagements, seedTasks, seedDeliverables } from '@/lib/seeds';
import { PriorityBadge } from '@/components/Badge';
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { CalendarEvent } from '@/lib/types';
import { seedEvents } from '@/lib/seeds';
import { LeaveRecord } from '@/lib/types';
import { seedLeaveRecords } from '@/lib/seeds';

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

export default function OverviewPage() {
  const [miniCalOffset, setMiniCalOffset] = useState(0);
  const [miniCalPopup, setMiniCalPopup] = useState<{ dateStr: string; x: number; y: number } | null>(null);
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [calEvents, setCalEvents] = useState<CalendarEvent[]>([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', priority: 'medium' as Task['priority'], dueDate: '', engagementId: '' });
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);

  useEffect(() => {
    loadData('engagements', seedEngagements).then(setEngagements);
    loadData('tasks', seedTasks).then(setTasks);
    loadData('deliverables', seedDeliverables).then(setDeliverables);
    loadData('events', seedEvents).then(setCalEvents);
    loadData('leave_records', seedLeaveRecords).then(setLeaveRecords);
  }, []);

  const activeEngagements = engagements.filter(e => e.phase !== 'closed' && e.phase !== 'partnership');
  const pendingTasks = tasks.filter(t => !t.done).sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.priority] - order[b.priority];
  });
  const doneDeliverables = deliverables.filter(d => d.done).length;
  const upcomingDeadlines = engagements
    .filter(e => e.phase !== 'closed' && e.phase !== 'partnership' && e.deadline && differenceInDays(new Date(e.deadline), new Date()) <= 7)
    .length;

  function formatDateInput(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 4) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
  }

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
        const upcomingLeave = (leaveRecords || [])
          .filter(r => {
            try {
              return r.startDate?.length === 10 && r.endDate?.length === 10 &&
                r.endDate >= todayStr && new Date(r.startDate) <= in7;
            } catch { return false; }
          })
          .sort((a, b) => a.startDate.localeCompare(b.startDate));

        if (upcoming.length === 0 && upcomingDels.length === 0 && upcomingLeave.length === 0) return null;

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
              {upcomingLeave.filter(r => r.startDate?.length === 10 && r.endDate?.length === 10).map(r => (
                <div key={r.id} className="flex items-center gap-3 py-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-800">{r.type} leave</span>
                    {r.notes && <span className="text-xs text-gray-400 ml-2">· {r.notes}</span>}
                  </div>
                  <span className="text-xs text-blue-500 shrink-0 font-medium">
                    {r.startDate === r.endDate
                      ? format(new Date(r.startDate), 'd MMM')
                      : `${format(new Date(r.startDate), 'd MMM')} – ${format(new Date(r.endDate), 'd MMM')}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Mini two-week calendar */}
      {(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dayOfWeek = today.getDay();
        const thisSunday = new Date(today);
        thisSunday.setDate(today.getDate() - dayOfWeek);
        const startDay = new Date(thisSunday);
        startDay.setDate(thisSunday.getDate() + miniCalOffset);
        const endDay = new Date(startDay);
        endDay.setDate(startDay.getDate() + 13);

        return (
          <div className="bg-white border border-gray-100 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setMiniCalOffset(o => o - 14)} className="text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors">‹</button>
              <h2 className="text-sm font-medium text-gray-500">
                {format(startDay, 'd MMM')} – {format(endDay, 'd MMM')}
              </h2>
              <button onClick={() => setMiniCalOffset(o => o + 14)} className="text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors">›</button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-[10px] text-gray-300 font-medium">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 14 }).map((_, i) => {
                const day = new Date(startDay);
                day.setDate(startDay.getDate() + i);
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayEvts = calEvents.filter(e => e.date === dateStr);
                const dayDels = deliverables.filter(d => !d.done && d.dueDate === dateStr);
                const dayLeave = (leaveRecords || []).filter(r => {
                  try {
                    return r.startDate?.length === 10 && r.endDate?.length === 10 &&
                      r.startDate <= dateStr && r.endDate >= dateStr;
                  } catch { return false; }
                });
                const hasItems = dayEvts.length > 0 || dayDels.length > 0 || dayLeave.length > 0;
                const todayFlag = isToday(day);

                return (
                  <div key={i} className="relative group">
                    {/* The day cell */}
                    <div
                      onClick={() => {
                        if (!hasItems) return;
                        setMiniCalPopup(prev =>
                          prev?.dateStr === dateStr ? null : { dateStr, x: 0, y: 0 }
                        );
                      }}
                      className={`flex flex-col items-center py-2 rounded-lg transition-colors select-none
                        ${todayFlag ? 'bg-blue-50' : ''}
                        ${hasItems ? 'md:cursor-default cursor-pointer hover:bg-gray-50' : 'cursor-default'}
                      `}
                    >
                      <span className={`text-sm font-medium ${todayFlag ? 'text-blue-600' : 'text-gray-700'}`}>
                        {format(day, 'd')}
                      </span>
                      <div className="flex gap-0.5 mt-1 h-1.5">
                        {dayEvts.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                        {dayDels.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-400" />}
                        {dayLeave.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                      </div>
                    </div>

                    {/* Desktop hover tooltip */}
                    {hasItems && (
                      <div className="hidden md:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <div className="bg-gray-900 text-white rounded-xl p-3 shadow-xl text-xs">
                          <div className="font-medium text-gray-300 mb-2">{format(day, 'EEE, d MMM')}</div>
                          {dayEvts.map(e => (
                            <div key={e.id} className="flex items-start gap-1.5 mb-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1" />
                              <div>
                                <div className="text-white">{e.title}</div>
                                <div className="text-gray-400">{e.time}{e.endTime ? ` – ${e.endTime}` : ''} · {e.mode === 'online' ? e.meetingApp : e.location}</div>
                              </div>
                            </div>
                          ))}
                          {dayDels.map(d => {
                            const eng = engagements.find(en => en.id === d.engagementId);
                            return (
                              <div key={d.id} className="flex items-start gap-1.5 mb-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1" />
                                <div>
                                  <div className="text-white">{d.title}</div>
                                  {eng && <div className="text-gray-400">{eng.clientName}</div>}
                                </div>
                              </div>
                            );
                          })}
                          {dayLeave.map(r => (
                            <div key={r.id} className="flex items-start gap-1.5 mb-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0 mt-1" />
                              <div>
                                <div className="text-white">{r.type} leave · {r.days} day{r.days !== 1 ? 's' : ''}</div>
                                {r.notes && <div className="text-gray-400">{r.notes}</div>}
                              </div>
                            </div>
                          ))}
                          {/* Tooltip arrow */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-3 pt-3 border-t border-gray-50">
              <span className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />Event</span>
              <span className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Deliverable</span>
              <span className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />Leave</span>
            </div>
          </div>
        );
      })()}

      {/* Mobile popup for mini calendar */}
      {miniCalPopup && (() => {
        const { dateStr } = miniCalPopup;
        const day = new Date(dateStr);
        const dayEvts = calEvents.filter(e => e.date === dateStr);
        const dayDels = deliverables.filter(d => !d.done && d.dueDate === dateStr);
        const dayLeave = (leaveRecords || []).filter(r => {
                  try {
                    return r.startDate?.length === 10 && r.endDate?.length === 10 &&
                      r.startDate <= dateStr && r.endDate >= dateStr;
                  } catch { return false; }
                });
        return (
          <div className="md:hidden fixed inset-0 bg-black/40 flex items-end justify-center z-50" onClick={() => setMiniCalPopup(null)}>
            <div className="bg-white rounded-t-2xl p-5 w-full shadow-xl max-h-[60vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">{format(day, 'EEEE, d MMMM yyyy')}</h2>
                <button onClick={() => setMiniCalPopup(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="space-y-3">
                {dayEvts.map(e => (
                  <div key={e.id} className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0 mt-1" />
                    <div>
                      <div className="text-sm font-medium text-gray-800">{e.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{e.time}{e.endTime ? ` – ${e.endTime}` : ''} · {e.mode === 'online' ? e.meetingApp : e.location}</div>
                    </div>
                  </div>
                ))}
                {dayDels.map(d => {
                  const eng = engagements.find(en => en.id === d.engagementId);
                  return (
                    <div key={d.id} className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-red-400 shrink-0 mt-1" />
                      <div>
                        <div className="text-sm font-medium text-gray-800">{d.title}</div>
                        {eng && <div className="text-xs text-gray-400 mt-0.5">Due · {eng.clientName}</div>}
                      </div>
                    </div>
                  );
                })}
                {dayLeave.filter(r => r.startDate?.length === 10).map(r => (
                  <div key={r.id} className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-green-400 shrink-0 mt-1" />
                    <div>
                      <div className="text-sm font-medium text-gray-800">{r.type} leave · {r.days} day{r.days !== 1 ? 's' : ''}</div>
                      {r.notes && <div className="text-xs text-gray-400 mt-0.5">{r.notes}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Legend */}
      <div className="flex gap-4 mb-4 text-xs text-gray-400">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />Meeting / event</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Deliverable due</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />Leave</span>
      </div>

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
                    {eng.deadline && <span className="text-xs text-gray-400">{dueDateLabel(eng.deadline)}</span>}
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
                <div className="w-full min-w-0">
                  <label className="block text-xs text-gray-500 mb-1">Due date</label>
                    <input
                      type="text"
                      placeholder="YYYY-MM-DD"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      value={taskForm.dueDate}
                      onChange={e => setTaskForm(f => ({ ...f, dueDate: formatDateInput(e.target.value) }))}
                    />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Linked engagement <span className="text-gray-300">(optional)</span></label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={taskForm.engagementId} onChange={e => setTaskForm(f => ({ ...f, engagementId: e.target.value }))}>
                  <option value="">— none —</option>
                  {engagements.filter(e => e.phase !== 'closed').map(e => <option key={e.id} value={e.id}>{e.clientName}{e.engagementName ? ` — ${e.engagementName}` : ''}</option>)}
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