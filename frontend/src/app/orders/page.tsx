// ============================================================
// Laundry OMS — Orders Page (Kanban Board)
// ============================================================

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { KanbanBoard } from '@/components/orders/KanbanBoard';

export default function OrdersPage() {
  const pathname = usePathname();
  const isArchive = pathname === '/orders/archive';

  return (
    <div className="h-[calc(100vh-7rem)]">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex gap-1 card p-1">
          <Link
            href="/orders"
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors no-underline ${
              !isArchive
                ? 'bg-[var(--color-accent)] text-white'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            Active
          </Link>
          <Link
            href="/orders/archive"
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors no-underline ${
              isArchive
                ? 'bg-[var(--color-accent)] text-white'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            Archive
          </Link>
        </div>
      </div>
      {!isArchive && <KanbanBoard />}
    </div>
  );
}
