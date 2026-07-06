// ============================================================
// Laundry OMS — Header Bar
// ============================================================

'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/pos': 'Point of Sale',
  '/orders': 'Order Board',
  '/customers': 'Customers',
  '/reports': 'Reports',
  '/settings/services': 'Services',
  '/admin/users': 'User Management',
};

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const update = () => {
      setCurrentTime(
        new Date().toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  const title = PAGE_TITLES[pathname] || 'Dashboard';

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)] m-0">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-[var(--color-text-primary)] leading-tight">
                {user.name}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] capitalize leading-tight">
                {user.role}
              </p>
            </div>
            <button
              onClick={logout}
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors"
            >
              Logout
            </button>
          </div>
        )}
        <span className="text-sm text-[var(--color-text-secondary)] font-medium tabular-nums">
          {currentTime}
        </span>
        <div className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse-soft" title="System Online" />
      </div>
    </header>
  );
}
