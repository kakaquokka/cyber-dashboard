import { Priority, Phase } from '@/lib/types';

const priorityStyles: Record<Priority, string> = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-amber-100 text-amber-800',
  medium: 'bg-blue-100 text-blue-800',
  low: 'bg-green-100 text-green-800',
};

const phaseStyles: Record<Phase, string> = {
  planning: 'bg-purple-100 text-purple-800',
  fieldwork: 'bg-amber-100 text-amber-800',
  reporting: 'bg-blue-100 text-blue-800',
  closed: 'bg-gray-100 text-gray-600',
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-md capitalize ${priorityStyles[priority]}`}>
      {priority}
    </span>
  );
}

export function PhaseBadge({ phase }: { phase: Phase }) {
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-md capitalize ${phaseStyles[phase]}`}>
      {phase}
    </span>
  );
}

export function StatusBadge({ done }: { done: boolean }) {
  return done ? (
    <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-md bg-green-100 text-green-800">Done</span>
  ) : (
    <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">Pending</span>
  );
}
