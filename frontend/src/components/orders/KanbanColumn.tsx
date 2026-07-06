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
      <div className={`flex items-center gap-2 px-4 py-3 rounded-t-xl border ${colors.border} ${colors.bg}`}>
        <h3 className={`text-sm font-semibold ${colors.text}`}>
          {label}
        </h3>
        <span className={`inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 
                         text-[11px] font-bold rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
          {orders.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 bg-slate-50/50 border-x border-b 
                      border-slate-200 rounded-b-xl min-h-[200px]">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-text-muted)] opacity-40">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            <p className="text-xs text-[var(--color-text-muted)]">No orders</p>
          </div>
        ) : (
          orders.map((order, i) => (
            <div key={order.id} className="animate-slide-up" style={{ animationDelay: `${i * 30}ms` }}>
              <OrderCard
                order={order}
                onAdvance={onAdvance}
                isUpdating={updatingOrderIds.has(order.id)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
