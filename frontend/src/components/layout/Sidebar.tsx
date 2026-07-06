'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  IconDashboard, IconPOS, IconOrders, IconCustomers,
  IconReports, IconServices, IconUsers, IconLogout,
} from '@/components/ui/Icons';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: IconDashboard },
  { href: '/pos', label: 'POS', icon: IconPOS },
  { href: '/orders', label: 'Orders', icon: IconOrders },
  { href: '/customers', label: 'Customers', icon: IconCustomers },
  { href: '/reports', label: 'Reports', icon: IconReports },
  { href: '/settings/services', label: 'Services', icon: IconServices },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isAdmin, logout } = useAuth();

  const items = [
    ...NAV_ITEMS,
    ...(isAdmin ? [{ href: '/admin/users', label: 'Users', icon: IconUsers }] : []),
  ];

  return (
    <aside className="w-16 lg:w-56 bg-[var(--color-navy)] flex flex-col shrink-0 transition-all duration-200">
      {/* Brand */}
      <div className="h-16 flex items-center px-3 lg:px-5 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-2.5 no-underline min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          <span className="hidden lg:block text-white font-bold text-sm tracking-wide truncate">
            Laundry OMS
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 lg:px-3 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg no-underline
                transition-all duration-150 group
                ${isActive
                  ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }
              `}
              title={item.label}
            >
              <Icon size={20} className="shrink-0" />
              <span className="hidden lg:block text-sm font-medium truncate">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-2 lg:px-3 py-3 border-t border-white/10">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full
                     text-white/40 hover:text-white/70 hover:bg-white/5
                     transition-all duration-150 cursor-pointer border-none"
          aria-label="Logout"
        >
          <IconLogout size={20} className="shrink-0" />
          <span className="hidden lg:block text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
