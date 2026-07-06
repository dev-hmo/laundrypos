'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { KanbanBoard } from '@/components/orders/KanbanBoard';
import { IconOrders, IconPackage } from '@/components/ui/Icons';

export default function OrdersPage() {
  const pathname = usePathname();
  const isArchive = pathname === '/orders/archive';

  return (
    <div className="h-[calc(100vh-7rem)] animate-fade-in">
      <div className="flex items-center gap-4 mb-5">
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
          <Link
            href="/orders"
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all no-underline ${
              !isArchive
                ? 'bg-[var(--color-accent)] text-white shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-slate-50'
            }`}
          >
            <IconOrders size={16} />
            Active
          </Link>
          <Link
            href="/orders/archive"
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all no-underline ${
              isArchive
                ? 'bg-[var(--color-accent)] text-white shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-slate-50'
            }`}
          >
            <IconPackage size={16} />
            Archive
          </Link>
        </div>
      </div>
      {!isArchive && <KanbanBoard />}
    </div>
  );
}
