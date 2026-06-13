'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Overview', icon: '⬡' },
  { href: '/engagements', label: 'Engagements', icon: '◈' },
  { href: '/clients', label: 'Clients', icon: '◎' },
  { href: '/deliverables', label: 'Deliverables', icon: '◻' },
  { href: '/cpd', label: 'CPD log', icon: '◇' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-52 min-h-screen bg-gray-950 text-gray-400 flex flex-col px-4 py-6 shrink-0">
      <div className="mb-8 px-2">
        <div className="text-white font-semibold text-sm tracking-wide">Cyber Advisory</div>
        <div className="text-gray-500 text-xs mt-0.5">Personal dashboard</div>
      </div>

      <nav className="flex flex-col gap-1">
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-gray-800 text-white'
                  : 'hover:bg-gray-900 hover:text-gray-200'
              }`}
            >
              <span className="text-base leading-none">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-2 pt-6 border-t border-gray-800">
        <div className="text-xs text-gray-600">
          {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>
    </aside>
  );
}
