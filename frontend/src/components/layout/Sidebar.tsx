// ============================================================
// Laundry OMS — Sidebar Navigation
// ============================================================

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  const NAV_ITEMS = [
    { href: '/dashboard', label: 'Dashboard', icon: '◆' },
    { href: '/pos', label: 'POS', icon: '⊞' },
    { href: '/orders', label: 'Orders', icon: '☰' },
    { href: '/customers', label: 'Customers', icon: '●' },
    { href: '/reports', label: 'Reports', icon: '▤' },
    { href: '/settings/services', label: 'Services', icon: '⚙' },
    ...(isAdmin ? [{ href: '/admin/users', label: 'Users', icon: '◎' }] : []),
  ];

  return (
    <aside className="w-[72px] bg-[var(--color-navy)] flex flex-col items-center py-6 gap-2 shrink-0">
      {/* Brand mark */}
      <Link href="/dashboard" className="w-10 h-10 rounded-xl bg-[var(--color-accent)] flex items-center justify-center mb-6 no-underline">
        <span className="text-white font-bold text-lg">L</span>
      </Link>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center justify-center w-14 h-14 rounded-xl
                transition-all duration-150 no-underline
                ${isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }
              `}
            >
              <span className="text-xl leading-none mb-1">{item.icon}</span>
              <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <Link
        href="/login"
        onClick={() => {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }}
        className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center no-underline hover:bg-white/20 transition-colors"
      >
        <span className="text-white/60 text-xs font-semibold">↩</span>
      </Link>
    </aside>
  );
}
