// ============================================================
// Laundry OMS — Kanban Column
// ============================================================

'use client';

import type { Order, OrderStatus } from '@/types';
import { STATUS_COLORS, STATUS_LABELS } from '@/types';
import { OrderCard } from './OrderCard';

interface KanbanColumnProps {
  status: OrderStatus;
  orders: Order[];
  onAdvance: (orderId: string, nextStatus: OrderStatus) => void;
  updatingOrderIds: Set<string>;
}

export function KanbanColumn({ status, orders, onAdvance, updatingOrderIds }: KanbanColumnProps) {
  const colors = STATUS_COLORS[status];
  const label = STATUS_LABELS[status];

  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] w-full shrink-0">
      {/* Column header */}
      <div className={`flex items-center gap-2 px-3 py-2.5 rounded-t-xl border ${colors.border} ${colors.bg}`}>
        <h3 className={`text-sm font-semibold ${colors.text}`}>
          {label}
        </h3>
        <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 
                         text-[10px] font-bold rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
          {orders.length}
        </span>
      </div>

      {/* Column body */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-50/50 border-x border-b 
                      border-slate-200 rounded-b-xl min-h-[200px]">
        {orders.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-xs text-[var(--color-text-muted)] text-center">
              No orders
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onAdvance={onAdvance}
              isUpdating={updatingOrderIds.has(order.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
