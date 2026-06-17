'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logout } from '@/lib/auth';

const navItems = [
  { href: '/', label: 'Overview', icon: '⬡' },
  { href: '/engagements', label: 'Engagements', icon: '◈' },
  { href: '/tasks', label: 'Tasks', icon: '☑' },
  { href: '/deliverables', label: 'Deliverables', icon: '◻' },
  { href: '/calendar', label: 'Calendar', icon: '◫' },
  { href: '/leave', label: 'Leave', icon: '◑' },
  { href: '/connections', label: 'Connections', icon: '◎' },
  { href: '/cpd', label: 'CPD log', icon: '◇' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <div
      style={{
        width: '208px',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#030712',
        padding: '24px 16px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Branding */}
      <div style={{ marginBottom: '24px', paddingLeft: '8px', flexShrink: 0 }}>
        <div className="text-white font-semibold text-sm tracking-wide">KAKA's</div>
        <div className="text-white font-semibold text-sm tracking-wide">Working Dashboard</div>
      </div>

      {/* Nav links — fills middle space */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors ${
                active ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
              }`}
            >
              <span className="text-base leading-none">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom — always pinned */}
      <div
        style={{
          flexShrink: 0,
          paddingTop: '16px',
          paddingLeft: '8px',
          borderTop: '1px solid #1f2937',
        }}
      >
        <div className="text-xs text-gray-600">
          {new Date().toLocaleDateString('en-GB', {
            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
          })}
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-gray-600 hover:text-gray-300 mt-2 transition-colors block"
        >
          Lock dashboard
        </button>
      </div>
    </div>
  );
}