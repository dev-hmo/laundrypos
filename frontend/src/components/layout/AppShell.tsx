'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import type { ReactNode } from 'react';

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  const isLoginPage = pathname === '/login';
  const showLayout = isAuthenticated && !isLoginPage && !isLoading;

  if (isLoginPage || (!isAuthenticated && !isLoading)) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-[var(--color-surface)]">
          {children}
        </main>
      </div>
    </div>
  );
}
