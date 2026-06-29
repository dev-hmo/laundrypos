// ============================================================
// Laundry OMS — Root Layout
// ============================================================

import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/lib/queryClient';
import { ToastProvider } from '@/components/ui/Toast';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'Laundry OMS — Order Management',
  description: 'Professional garment care order management system for retail operations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <QueryProvider>
          <ToastProvider>
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-6 bg-[var(--color-surface)]">
                  {children}
                </main>
              </div>
            </div>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
