'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { IconClock } from '@/components/ui/Icons';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/pos': 'Point of Sale',
  '/orders': 'Order Board',
  '/orders/archive': 'Order Archive',
  '/customers': 'Customers',
  '/reports': 'Reports',
  '/settings/services': 'Services',
  '/admin/users': 'User Management',
};

function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/orders/') && pathname !== '/orders/archive') return 'Order Detail';
  if (pathname.startsWith('/customers/') && !pathname.includes('/edit')) return 'Customer Profile';
  if (pathname.includes('/edit')) return 'Edit Customer';
  if (pathname.includes('/invoice')) return 'Invoice';
  return PAGE_TITLES[pathname] || 'Dashboard';
}

export function Header() {
  const pathname = usePathname();
  const { user } = useAuth();
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

  const title = getPageTitle(pathname);

  return (
    <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-slate-200 flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
      <h1 className="text-lg font-semibold text-[var(--color-text-primary)] m-0">
        {title}
      </h1>
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center">
              <span className="text-xs font-bold text-[var(--color-accent)]">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-[var(--color-text-primary)] leading-tight">
                {user.name}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] capitalize leading-tight">
                {user.role}
              </p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] font-medium tabular-nums">
          <IconClock size={14} />
          {currentTime}
        </div>
        <div className="relative">
          <div className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
          <div className="absolute inset-0 w-2 h-2 rounded-full bg-[var(--color-success)] animate-ping opacity-50" />
        </div>
      </div>
    </header>
  );
}
