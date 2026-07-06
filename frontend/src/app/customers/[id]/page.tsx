'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { customerApiExtended, orderApiExtended } from '@/lib/api';
import Link from 'next/link';
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
          <Link href={`/customers/${id}/edit`} className="btn-secondary text-sm">
            Edit
          </Link>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
            Order History ({ordersData?.count || 0})
          </h3>
        </div>
        {loadingOrders ? (
          <div className="p-4 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : ordersData?.orders.length === 0 ? (
          <p className="text-center py-12 text-sm text-[var(--color-text-muted)]">No orders yet</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-[var(--color-surface-overlay)]">
                <th className="text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase px-4 py-2">Order</th>
                <th className="text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase px-4 py-2">Status</th>
                <th className="text-right text-xs font-semibold text-[var(--color-text-muted)] uppercase px-4 py-2">Total</th>
                <th className="text-right text-xs font-semibold text-[var(--color-text-muted)] uppercase px-4 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {ordersData?.orders.map((order: Order) => (
                <tr key={order.id} className="border-b border-slate-100 hover:bg-[var(--color-surface-overlay)]">
                  <td className="px-4 py-3">
                    <Link href={`/orders/${order.id}`} className="text-sm text-[var(--color-accent)] hover:underline font-medium">
                      #{order.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right tabular-nums">${order.total_amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-right text-[var(--color-text-muted)]">
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
