'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { customerApiExtended, orderApiExtended } from '@/lib/api';
import Link from 'next/link';
import { IconPackage, IconCalendar, IconDollar, IconEdit } from '@/components/ui/Icons';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Customer, Order } from '@/types';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: customer, isLoading: loadingCustomer, isError: errorCustomer } = useQuery<Customer>({
    queryKey: ['customer', id],
    queryFn: () => customerApiExtended.get(id),
    enabled: !!id,
  });

  const { data: ordersData, isLoading: loadingOrders } = useQuery({
    queryKey: ['orders', 'customer', id],
    queryFn: () => orderApiExtended.listAll({ customer_id: id, limit: 20 }),
    enabled: !!id,
  });

  if (loadingCustomer) {
    return (
      <div className="space-y-6">
        <div className="card p-6">
          <div className="h-6 w-48 bg-slate-100 rounded animate-pulse mb-3" />
          <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (errorCustomer || !customer) {
    return (
      <div className="card p-8 text-center">
        <p className="text-[var(--color-error)] font-medium">Customer not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">{customer.name}</h2>
            <div className="mt-2 space-y-1 text-sm text-[var(--color-text-secondary)]">
              <p>Phone: {customer.phone}</p>
              {customer.email && <p>Email: {customer.email}</p>}
              {customer.preferences && <p>Preferences: {customer.preferences}</p>}
              <p className="text-xs text-[var(--color-text-muted)]">
                Customer since {new Date(customer.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Link href={`/customers/${id}/edit`} className="btn-secondary text-sm flex items-center gap-1.5">
            <IconEdit size={14} /> Edit
          </Link>
        </div>
      </div>

      <div className="card overflow-hidden rounded-xl">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center gap-2">
          <IconPackage size={16} className="text-[var(--color-text-muted)]" />
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
            Order History ({ordersData?.count || 0})
          </h3>
        </div>
        {loadingOrders ? (
          <div className="p-5 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : ordersData?.orders.length === 0 ? (
          <div className="py-8">
            <EmptyState icon={IconPackage} title="No orders yet" description="This customer hasn't placed any orders." />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-[var(--color-surface-overlay)]">
                <th className="text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase px-5 py-3">Order</th>
                <th className="text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase px-5 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-[var(--color-text-muted)] uppercase px-5 py-3">Total</th>
                <th className="text-right text-xs font-semibold text-[var(--color-text-muted)] uppercase px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ordersData?.orders.map((order: Order) => (
                <tr key={order.id} className="hover:bg-[var(--color-surface-overlay)]/50 transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/orders/${order.id}`} className="text-sm text-[var(--color-accent)] hover:underline font-medium">
                      #{order.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      order.status === 'Delivered'
                        ? 'bg-slate-100 text-slate-500'
                        : order.status === 'Ready'
                        ? 'bg-emerald-50 text-emerald-700'
                        : order.status === 'Washing' || order.status === 'Pressing'
                        ? 'bg-cyan-50 text-cyan-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-right tabular-nums font-semibold">${order.total_amount.toFixed(2)}</td>
                  <td className="px-5 py-3 text-sm text-right text-[var(--color-text-muted)] tabular-nums">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
