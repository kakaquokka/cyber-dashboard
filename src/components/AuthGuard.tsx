'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthed } from '@/lib/auth';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (pathname === '/login') {
      setChecked(true);
      setAuthed(true);
      return;
    }
    const auth = isAuthed();
    if (!auth) {
      router.replace('/login');
    } else {
      setAuthed(true);
      setChecked(true);
    }
  }, [pathname, router]);

  // Show nothing while checking — prevents flash
  if (!checked) return null;

  // If not authed and not on login, show nothing while redirect happens
  if (!authed && pathname !== '/login') return null;

  return <>{children}</>;
}