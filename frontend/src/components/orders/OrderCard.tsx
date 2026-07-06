'use client';

import Link from 'next/link';
import type { Order, OrderStatus } from '@/types';
import { ORDER_STATUSES, STATUS_COLORS } from '@/types';

interface OrderCardProps {
  order: Order;
  onAdvance: (orderId: string, nextStatus: OrderStatus) => void;
  isUpdating: boolean;
}

const NEXT_LABELS: Record<string, string> = {
  Received: 'Start Wash',
  Washing: 'Start Press',
  Pressing: 'Mark Ready',
  Ready: 'Deliver',
};

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
    <div className={`card p-3.5 ${isUpdating ? 'opacity-60 animate-pulse-soft' : ''}`}>
      <Link href={`/orders/${order.id}`} className="no-underline">
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0">
            <p className="text-[11px] font-mono text-[var(--color-text-muted)] mb-0.5">
              #{shortId}
            </p>
            <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate max-w-[160px]">
              {order.customer_name || 'Customer'}
            </p>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 
                           ${statusColor.bg} ${statusColor.text} ${statusColor.border} border`}>
            {order.status}
          </span>
        </div>

        <p className="text-xs text-[var(--color-text-secondary)] mb-2.5 line-clamp-2 leading-relaxed">
          {itemSummary}
        </p>
      </Link>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-[var(--color-text-muted)]">{timeAgo}</span>
          <span className="text-sm font-bold text-[var(--color-text-primary)] tabular-nums">
            ${order.total_amount.toFixed(2)}
          </span>
        </div>

        {nextStatus && (
          <button
            onClick={() => onAdvance(order.id, nextStatus)}
            disabled={isUpdating}
            className="text-xs font-semibold text-white bg-[var(--color-accent)] 
                       hover:bg-[var(--color-accent-hover)] px-2.5 py-1.5 rounded-md transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-sm"
          >
            {NEXT_LABELS[nextStatus] || nextStatus}
          </button>
        )}
      </div>

      {order.promised_date && (
        <div className="mt-2 pt-2 border-t border-slate-100">
          <p className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            Promise: {new Date(order.promised_date).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric',
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
