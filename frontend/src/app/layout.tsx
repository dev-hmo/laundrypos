// ============================================================
// Laundry OMS — Root Layout
// ============================================================

import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/lib/queryClient';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/lib/auth';
import { AppShell } from '@/components/layout/AppShell';

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
          <AuthProvider>
            <ToastProvider>
              <AppShell>
                {children}
              </AppShell>
            </ToastProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
