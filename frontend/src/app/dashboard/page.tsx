'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import { IconOrders, IconDollar, IconPackage, IconCustomers } from '@/components/ui/Icons';
import type { ReactNode } from 'react';
import type { DashboardStats } from '@/types';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  accent: string;
  delay?: number;
}

function StatCard({ label, value, icon, accent, delay = 0 }: StatCardProps) {
  return (
    <div
      className="card p-5 animate-slide-up flex items-start gap-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--color-text-muted)] mb-0.5 truncate">
          {label}
        </p>
        <p className="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums">
          {value}
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, isError, error } = useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardApi.stats(),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-5">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
                <div className="h-7 w-16 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
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
        <button
          onClick={() => window.location.reload()}
          className="btn-primary mt-4"
        >
          Retry
        </button>
      </div>
    );
  }

  const stats = data as DashboardStats;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          label="Orders Today"
          value={stats.orders_today}
          icon={<IconOrders size={22} className="text-white" />}
          accent="bg-gradient-to-br from-[var(--color-accent)] to-blue-600"
          delay={0}
        />
        <StatCard
          label="Revenue Today"
          value={`$${stats.revenue_today.toFixed(2)}`}
          icon={<IconDollar size={22} className="text-white" />}
          accent="bg-gradient-to-br from-emerald-500 to-green-600"
          delay={75}
        />
        <StatCard
          label="Pending Orders"
          value={stats.pending_orders}
          icon={<IconPackage size={22} className="text-white" />}
          accent="bg-gradient-to-br from-amber-500 to-yellow-600"
          delay={150}
        />
        <StatCard
          label="Total Customers"
          value={stats.total_customers}
          icon={<IconCustomers size={22} className="text-white" />}
          accent="bg-gradient-to-br from-purple-500 to-violet-600"
          delay={225}
        />
      </div>
    </div>
  );
}
