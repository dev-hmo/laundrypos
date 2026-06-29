// ============================================================
// Laundry OMS — Orders Page (Kanban Board)
// ============================================================

'use client';

import { KanbanBoard } from '@/components/orders/KanbanBoard';

export default function OrdersPage() {
  return (
    <div className="h-[calc(100vh-7rem)]">
      <KanbanBoard />
    </div>
  );
}
