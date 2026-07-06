'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderApiExtended } from '@/lib/api';
import Link from 'next/link';
import type { Order } from '@/types';

export default function OrdersArchivePage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['orders', 'archive', statusFilter, fromDate, toDate],
    queryFn: () =>
      orderApiExtended.listAll({
        status: statusFilter || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        limit: 100,
      }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field w-auto"
        >
          <option value="">All Statuses</option>
          <option value="Received">Received</option>
          <option value="Washing">Washing</option>
          <option value="Pressing">Pressing</option>
          <option value="Ready">Ready</option>
          <option value="Delivered">Delivered</option>
        </select>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="input-field w-auto"
          placeholder="From"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="input-field w-auto"
          placeholder="To"
        />
      </div>

      {isLoading && (
        <div className="card p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="card p-8 text-center">
          <p className="text-[var(--color-error)] font-medium">Failed to load orders</p>
          <p className="text-sm text-[var(--color-text-muted)]">{error instanceof Error ? error.message : ''}</p>
        </div>
      )}

      {data && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-[var(--color-surface-overlay)]">
                <th className="text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase px-4 py-3">Order</th>
                <th className="text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase px-4 py-3">Customer</th>
                <th className="text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase px-4 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-[var(--color-text-muted)] uppercase px-4 py-3">Total</th>
                <th className="text-right text-xs font-semibold text-[var(--color-text-muted)] uppercase px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-sm text-[var(--color-text-muted)]">No orders found</td>
                </tr>
              ) : (
                data.orders.map((order: Order) => (
                  <tr key={order.id} className="border-b border-slate-100 hover:bg-[var(--color-surface-overlay)] transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/orders/${order.id}`} className="text-sm font-medium text-[var(--color-accent)] hover:underline">
                        #{order.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">{order.customer_name || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right tabular-nums">${order.total_amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--color-text-muted)] tabular-nums">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
