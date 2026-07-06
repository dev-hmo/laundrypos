'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportApi } from '@/lib/api';
import type { DailySummary, RevenueReport, ServiceBreakdown, TopCustomer } from '@/types';

type Tab = 'daily' | 'revenue' | 'services' | 'customers';

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

  const tabs: { key: Tab; label: string }[] = [
    { key: 'daily', label: 'Daily Summary' },
    { key: 'revenue', label: 'Revenue' },
    { key: 'services', label: 'Service Breakdown' },
    { key: 'customers', label: 'Top Customers' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 card p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.key
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
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
          <h3 className="text-lg font-bold mb-4">Daily Summary — {today}</h3>
          {loadingDaily ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : dailySummary ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryCard label="Total Orders" value={dailySummary.total_orders} />
              <SummaryCard label="Revenue" value={`$${dailySummary.total_revenue.toFixed(2)}`} color="text-emerald-600" />
              <SummaryCard label="Tax" value={`$${dailySummary.total_tax.toFixed(2)}`} />
              <SummaryCard label="Discount" value={`$${dailySummary.total_discount.toFixed(2)}`} />
              <SummaryCard label="Cash" value={`$${dailySummary.cash_amount.toFixed(2)}`} />
              <SummaryCard label="Card" value={`$${dailySummary.card_amount.toFixed(2)}`} />
              <SummaryCard label="Mobile" value={`$${dailySummary.mobile_amount.toFixed(2)}`} />
              <SummaryCard label="Avg Order" value={`$${dailySummary.avg_order_value.toFixed(2)}`} />
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">No data available for today</p>
          )}
        </div>
      )}

      {activeTab === 'revenue' && (
        <div className="card p-6">
          <h3 className="text-lg font-bold mb-4">Revenue Report</h3>
          {loadingRevenue ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : revenueData && revenueData.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full">
                <thead>
                  <tr className="bg-[var(--color-surface-overlay)]">
                    <th className="text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase px-4 py-2">Date</th>
                    <th className="text-right text-xs font-semibold text-[var(--color-text-muted)] uppercase px-4 py-2">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueData.map((r) => (
                    <tr key={r.date} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-sm">{r.date}</td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums font-medium">${r.amount.toFixed(2)}</td>
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
          <h3 className="text-lg font-bold mb-4">Service Breakdown</h3>
          {loadingServices ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : serviceData && serviceData.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full">
                <thead>
                  <tr className="bg-[var(--color-surface-overlay)]">
                    <th className="text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase px-4 py-2">Service</th>
                    <th className="text-right text-xs font-semibold text-[var(--color-text-muted)] uppercase px-4 py-2">Orders</th>
                    <th className="text-right text-xs font-semibold text-[var(--color-text-muted)] uppercase px-4 py-2">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceData.map((s) => (
                    <tr key={s.service_name} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-sm font-medium">{s.service_name}</td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums">{s.count}</td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums font-medium">${s.revenue.toFixed(2)}</td>
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
          <h3 className="text-lg font-bold mb-4">Top Customers</h3>
          {loadingCustomers ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : topCustomers && topCustomers.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full">
                <thead>
                  <tr className="bg-[var(--color-surface-overlay)]">
                    <th className="text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase px-4 py-2">Customer</th>
                    <th className="text-right text-xs font-semibold text-[var(--color-text-muted)] uppercase px-4 py-2">Orders</th>
                    <th className="text-right text-xs font-semibold text-[var(--color-text-muted)] uppercase px-4 py-2">Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.map((c, i) => (
                    <tr key={c.customer_id} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-sm font-medium">{c.customer_name}</td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums">{c.order_count}</td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums font-medium">${c.total_spent.toFixed(2)}</td>
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

function SummaryCard({ label, value, color = 'text-[var(--color-text-primary)]' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="p-4 rounded-lg bg-[var(--color-surface-overlay)]">
      <p className="text-xs font-medium text-[var(--color-text-muted)] mb-1">{label}</p>
      <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}
