// ============================================================
// Laundry OMS — Order Card (Kanban)
// ============================================================

'use client';

import type { Order, OrderStatus } from '@/types';
import { ORDER_STATUSES, STATUS_COLORS } from '@/types';

interface OrderCardProps {
  order: Order;
  onAdvance: (orderId: string, nextStatus: OrderStatus) => void;
  isUpdating: boolean;
}

export function OrderCard({ order, onAdvance, isUpdating }: OrderCardProps) {
  const currentIndex = ORDER_STATUSES.indexOf(order.status);
  const nextStatus = currentIndex < ORDER_STATUSES.length - 1
    ? ORDER_STATUSES[currentIndex + 1]
    : null;

  const statusColor = STATUS_COLORS[order.status];
  const shortId = order.id.substring(0, 8).toUpperCase();

  const timeAgo = getTimeAgo(order.created_at);
  const itemSummary = order.items
    ?.map((item) => item.service_type)
    .join(', ') || '—';

  return (
    <div
      className={`card p-3.5 animate-fade-in ${isUpdating ? 'opacity-60 animate-pulse-soft' : ''}`}
      id={`order-card-${order.id}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-xs font-mono text-[var(--color-text-muted)] mb-0.5">
            #{shortId}
          </p>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            {order.customer_name || 'Customer'}
          </p>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full 
                         ${statusColor.bg} ${statusColor.text} ${statusColor.border} border`}>
          {order.status}
        </span>
      </div>

      {/* Items summary */}
      <p className="text-xs text-[var(--color-text-secondary)] mb-2 line-clamp-2 leading-relaxed">
        {itemSummary}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--color-text-muted)]">{timeAgo}</span>
          <span className="text-sm font-bold text-[var(--color-text-primary)] tabular-nums">
            ${order.total_amount.toFixed(2)}
          </span>
        </div>

        {nextStatus && (
          <button
            onClick={() => onAdvance(order.id, nextStatus)}
            disabled={isUpdating}
            className="text-xs font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]
                       hover:bg-[var(--color-accent-light)] px-2.5 py-1.5 rounded-md transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            {nextStatus}
            <span className="text-[10px]">→</span>
          </button>
        )}
      </div>

      {/* Promised date */}
      {order.promised_date && (
        <div className="mt-2 pt-2 border-t border-slate-100">
          <p className="text-[10px] text-[var(--color-text-muted)]">
            Promise: {new Date(order.promised_date).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
      )}
    </div>
  );
}

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
