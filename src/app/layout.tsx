import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import AuthGuard from '@/components/AuthGuard';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Cyber Advisory Dashboard',
  description: 'Personal working dashboard for cybersecurity advisory work',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <AuthGuard>
          <div className="flex min-h-screen">
            {/* Sidebar — hidden on mobile, visible md and up */}
            <div className="hidden md:block">
              <Sidebar />
            </div>
            {/* Main content area */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Mobile top nav — visible only on mobile */}
              <MobileNav />
              <main className="flex-1 overflow-auto">
                {children}
              </main>
            </div>
          </div>
        </AuthGuard>
      </body>
    </html>
  );
}