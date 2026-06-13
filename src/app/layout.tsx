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
      <body className={`${inter.className} bg-gray-50 text-gray-900`} style={{ margin: 0, padding: 0 }}>
        <AuthGuard>
          {/* Fixed sidebar — completely outside document flow */}
          <div
            className="hidden md:flex"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '208px',
              height: '100vh',
              zIndex: 50,
            }}
          >
            <Sidebar />
          </div>

          {/* Mobile top nav */}
          <div
            className="md:hidden"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}
          >
            <MobileNav />
          </div>

          {/* Scrollable content — offset by sidebar width */}
          <div
            style={{
              marginLeft: '208px',
              height: '100vh',
              overflowY: 'auto',
            }}
            className="max-md:ml-0 max-md:pt-12"
          >
            <main>{children}</main>
          </div>
        </AuthGuard>
      </body>
    </html>
  );
}