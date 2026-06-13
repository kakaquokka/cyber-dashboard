'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Overview' },
  { href: '/engagements', label: 'Engagements' },
  { href: '/tasks', label: 'Tasks' },
  { href: '/deliverables', label: 'Deliverables' },
  { href: '/clients', label: 'Clients' },
  { href: '/cpd', label: 'CPD' },
  { href: '/calendar', label: 'Calendar' },
];

export default function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden flex overflow-x-auto gap-1 px-4 py-3 bg-gray-950 scrollbar-hide shrink-0">
      {navItems.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`whitespace-nowrap text-sm px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
            pathname === href
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}