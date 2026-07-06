'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import type { DashboardStats } from '@/types';

export default function DashboardPage() {
  const { data, isLoading, isError, error } = useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardApi.stats(),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-6">
            <div className="h-4 w-24 bg-slate-100 rounded animate-pulse mb-3" />
            <div className="h-8 w-16 bg-slate-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="card p-8 text-center">
        <p className="text-[var(--color-error)] font-medium mb-2">Failed to load dashboard</p>
        <p className="text-sm text-[var(--color-text-muted)]">
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </p>
      </div>
    );
  }

  const stats = data as DashboardStats;

  const cards = [
    { label: 'Orders Today', value: stats.orders_today, color: 'text-[var(--color-accent)]' },
    { label: 'Revenue Today', value: `$${stats.revenue_today.toFixed(2)}`, color: 'text-emerald-600' },
    { label: 'Pending Orders', value: stats.pending_orders, color: 'text-amber-600' },
    { label: 'Total Customers', value: stats.total_customers, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="card p-6">
            <p className="text-sm font-medium text-[var(--color-text-muted)] mb-1">{card.label}</p>
            <p className={`text-3xl font-bold ${card.color} tabular-nums`}>{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
