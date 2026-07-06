'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportApi } from '@/lib/api';
import { IconCalendar, IconDollar, IconReports, IconCustomers } from '@/components/ui/Icons';
import type { DailySummary, RevenueReport, ServiceBreakdown, TopCustomer } from '@/types';

type Tab = 'daily' | 'revenue' | 'services' | 'customers';

const TABS: { key: Tab; label: string; icon: typeof IconReports }[] = [
  { key: 'daily', label: 'Daily Summary', icon: IconCalendar },
  { key: 'revenue', label: 'Revenue', icon: IconDollar },
  { key: 'services', label: 'Service Breakdown', icon: IconReports },
  { key: 'customers', label: 'Top Customers', icon: IconCustomers },
];

function SummaryCard({ label, value, color = 'text-[var(--color-text-primary)]' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="p-4 rounded-xl bg-[var(--color-surface-overlay)] card-hover">
      <p className="text-xs font-medium text-[var(--color-text-muted)] mb-1">{label}</p>
      <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

export default function ReportsPage() {
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const [activeTab, setActiveTab] = useState<Tab>('daily');
  const [fromDate, setFromDate] = useState(weekAgo);
  const [toDate, setToDate] = useState(today);

  const { data: dailySummary, isLoading: loadingDaily } = useQuery<DailySummary>({
    queryKey: ['reports', 'daily', today],
    queryFn: () => reportApi.dailySummary(today),
    enabled: activeTab === 'daily',
  });

  const { data: revenueData, isLoading: loadingRevenue } = useQuery<RevenueReport[]>({
    queryKey: ['reports', 'revenue', fromDate, toDate],
    queryFn: () => reportApi.revenue(fromDate, toDate),
    enabled: activeTab === 'revenue',
  });

  const { data: serviceData, isLoading: loadingServices } = useQuery<ServiceBreakdown[]>({
    queryKey: ['reports', 'services', fromDate, toDate],
    queryFn: () => reportApi.services(fromDate, toDate),
    enabled: activeTab === 'services',
  });

  const { data: topCustomers, isLoading: loadingCustomers } = useQuery<TopCustomer[]>({
    queryKey: ['reports', 'topCustomers', fromDate, toDate],
    queryFn: () => reportApi.topCustomers(fromDate, toDate, 10),
    enabled: activeTab === 'customers',
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeTab === tab.key
                    ? 'bg-[var(--color-accent)] text-white shadow-sm'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-slate-50'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
        {activeTab !== 'daily' && (
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] mb-1">From</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="input-field w-auto" />
            </div>
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] mb-1">To</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="input-field w-auto" />
            </div>
          </div>
        )}
      </div>

      {activeTab === 'daily' && (
        <div className="card p-6">
          <h3 className="text-base font-bold mb-5 text-[var(--color-text-primary)]">
            Daily Summary &mdash; {today}
          </h3>
          {loadingDaily ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : dailySummary ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryCard label="Total Orders" value={dailySummary.total_orders} />
              <SummaryCard label="Revenue" value={`$${dailySummary.total_revenue.toFixed(2)}`} color="text-emerald-600" />
              <SummaryCard label="Tax" value={`$${dailySummary.total_tax.toFixed(2)}`} />
              <SummaryCard label="Avg Order" value={`$${dailySummary.avg_order_value.toFixed(2)}`} />
              <SummaryCard label="Cash" value={`$${dailySummary.cash_amount.toFixed(2)}`} color="text-amber-600" />
              <SummaryCard label="Card" value={`$${dailySummary.card_amount.toFixed(2)}`} color="text-blue-600" />
              <SummaryCard label="Mobile" value={`$${dailySummary.mobile_amount.toFixed(2)}`} color="text-purple-600" />
              <SummaryCard label="Discount" value={`$${dailySummary.total_discount.toFixed(2)}`} color="text-[var(--color-text-muted)]" />
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">No data available for today</p>
          )}
        </div>
      )}

      {activeTab === 'revenue' && (
        <div className="card p-6">
          <h3 className="text-base font-bold mb-5">Revenue Report</h3>
          {loadingRevenue ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : revenueData && revenueData.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full">
                <thead>
                  <tr className="bg-[var(--color-surface-overlay)]">
                    <th className="text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase px-5 py-3">Date</th>
                    <th className="text-right text-xs font-semibold text-[var(--color-text-muted)] uppercase px-5 py-3">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {revenueData.map((r) => (
                    <tr key={r.date} className="hover:bg-[var(--color-surface-overlay)]/50 transition-colors">
                      <td className="px-5 py-3 text-sm">{r.date}</td>
                      <td className="px-5 py-3 text-sm text-right tabular-nums font-semibold">${r.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">No revenue data for this period</p>
          )}
        </div>
      )}

      {activeTab === 'services' && (
        <div className="card p-6">
          <h3 className="text-base font-bold mb-5">Service Breakdown</h3>
          {loadingServices ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : serviceData && serviceData.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full">
                <thead>
                  <tr className="bg-[var(--color-surface-overlay)]">
                    <th className="text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase px-5 py-3">Service</th>
                    <th className="text-right text-xs font-semibold text-[var(--color-text-muted)] uppercase px-5 py-3">Orders</th>
                    <th className="text-right text-xs font-semibold text-[var(--color-text-muted)] uppercase px-5 py-3">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {serviceData.map((s) => (
                    <tr key={s.service_name} className="hover:bg-[var(--color-surface-overlay)]/50 transition-colors">
                      <td className="px-5 py-3 text-sm font-medium">{s.service_name}</td>
                      <td className="px-5 py-3 text-sm text-right tabular-nums">{s.count}</td>
                      <td className="px-5 py-3 text-sm text-right tabular-nums font-semibold">${s.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">No service data for this period</p>
          )}
        </div>
      )}

      {activeTab === 'customers' && (
        <div className="card p-6">
          <h3 className="text-base font-bold mb-5">Top Customers</h3>
          {loadingCustomers ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : topCustomers && topCustomers.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full">
                <thead>
                  <tr className="bg-[var(--color-surface-overlay)]">
                    <th className="text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase px-5 py-3">Customer</th>
                    <th className="text-right text-xs font-semibold text-[var(--color-text-muted)] uppercase px-5 py-3">Orders</th>
                    <th className="text-right text-xs font-semibold text-[var(--color-text-muted)] uppercase px-5 py-3">Total Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topCustomers.map((c) => (
                    <tr key={c.customer_id} className="hover:bg-[var(--color-surface-overlay)]/50 transition-colors">
                      <td className="px-5 py-3 text-sm font-medium">{c.customer_name}</td>
                      <td className="px-5 py-3 text-sm text-right tabular-nums">{c.order_count}</td>
                      <td className="px-5 py-3 text-sm text-right tabular-nums font-semibold">${c.total_spent.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">No customer data for this period</p>
          )}
        </div>
      )}
    </div>
  );
}
