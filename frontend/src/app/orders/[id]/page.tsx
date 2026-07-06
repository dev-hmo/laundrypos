'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApiExtended, paymentApi, invoiceApi } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';
import type { Order, Payment, CreatePaymentPayload } from '@/types';

type PaymentMethod = 'cash' | 'card' | 'mobile';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [cashReceived, setCashReceived] = useState(0);

  const { data: order, isLoading, isError, error } = useQuery<Order>({
    queryKey: ['order', id],
    queryFn: () => orderApiExtended.get(id),
    enabled: !!id,
  });

  const { data: payments } = useQuery<Payment[]>({
    queryKey: ['payments', id],
    queryFn: () => paymentApi.listByOrder(id),
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: () => orderApiExtended.cancel(id),
    onSuccess: () => {
      toast('Order cancelled', 'success');
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const paymentMutation = useMutation({
    mutationFn: (data: CreatePaymentPayload) => paymentApi.create(id, data),
    onSuccess: () => {
      toast('Payment recorded', 'success');
      setShowPayment(false);
      queryClient.invalidateQueries({ queryKey: ['payments', id] });
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="card p-6">
          <div className="h-6 w-48 bg-slate-100 rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="card p-8 text-center">
        <p className="text-[var(--color-error)] font-medium">Order not found</p>
        <p className="text-sm text-[var(--color-text-muted)]">{error instanceof Error ? error.message : ''}</p>
      </div>
    );
  }

  const totalPaid = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const balanceDue = order.total_amount - totalPaid;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="card p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
              Order #{order.id.slice(0, 8)}
            </h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
              order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              order.status === 'Ready' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {order.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-6 p-4 bg-[var(--color-surface-overlay)] rounded-lg">
          <div>
            <p className="text-[var(--color-text-muted)]">Customer</p>
            <p className="font-medium">{order.customer_name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-[var(--color-text-muted)]">Phone</p>
            <p className="font-medium">{order.customer_phone || 'N/A'}</p>
          </div>
          {order.promised_date && (
            <div>
              <p className="text-[var(--color-text-muted)]">Promised Date</p>
              <p className="font-medium">{new Date(order.promised_date).toLocaleDateString()}</p>
            </div>
          )}
          {order.notes && (
            <div className="col-span-2">
              <p className="text-[var(--color-text-muted)]">Notes</p>
              <p className="font-medium">{order.notes}</p>
            </div>
          )}
        </div>

        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">Items</h3>
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--color-surface-overlay)]">
                <th className="text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase px-4 py-2">Service</th>
                <th className="text-right text-xs font-semibold text-[var(--color-text-muted)] uppercase px-4 py-2">Qty/Weight</th>
                <th className="text-right text-xs font-semibold text-[var(--color-text-muted)] uppercase px-4 py-2">Unit Price</th>
                <th className="text-right text-xs font-semibold text-[var(--color-text-muted)] uppercase px-4 py-2">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-sm font-medium">{item.service_type}</td>
                  <td className="px-4 py-3 text-sm text-right tabular-nums">
                    {item.weight_kg > 0 ? `${item.weight_kg} kg` : item.quantity > 0 ? `${item.quantity} items` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-right tabular-nums">${item.unit_price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-right tabular-nums font-medium">${item.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 space-y-1 text-sm text-right">
          <div className="flex justify-end gap-8">
            <span className="text-[var(--color-text-muted)]">Subtotal</span>
            <span className="tabular-nums w-24 text-right">${(order.total_amount - order.tax_amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-end gap-8">
            <span className="text-[var(--color-text-muted)]">Tax</span>
            <span className="tabular-nums w-24 text-right">${order.tax_amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-end gap-8 text-base font-bold pt-1 border-t border-slate-200">
            <span>Total</span>
            <span className="tabular-nums w-24 text-right text-[var(--color-accent)]">${order.total_amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {payments && payments.length > 0 && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">Payments</h3>
          <div className="space-y-2">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between text-sm py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${
                    payment.method === 'cash' ? 'bg-emerald-50 text-emerald-700' :
                    payment.method === 'card' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                  }`}>
                    {payment.method}
                  </span>
                  {payment.reference && <span className="text-[var(--color-text-muted)]">{payment.reference}</span>}
                </div>
                <span className="font-medium tabular-nums">${payment.amount.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-bold pt-2">
              <span>Total Paid</span>
              <span className="tabular-nums">${totalPaid.toFixed(2)}</span>
            </div>
            {balanceDue > 0 && (
              <div className="flex justify-between text-sm text-[var(--color-error)]">
                <span>Balance Due</span>
                <span className="tabular-nums">${balanceDue.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        {balanceDue > 0 && order.status !== 'Delivered' && (
          <button
            onClick={() => { setPaymentAmount(balanceDue); setCashReceived(balanceDue); setShowPayment(true); }}
            className="btn-primary"
          >
            Record Payment
          </button>
        )}
        <Link href={`/orders/${id}/invoice`} className="btn-secondary">
          View Invoice
        </Link>
        {order.status !== 'Delivered' && (
          <button
            onClick={() => { if (confirm('Cancel this order?')) cancelMutation.mutate(); }}
            disabled={cancelMutation.isPending}
            className="btn-secondary text-[var(--color-error)] border-red-200 hover:bg-red-50"
          >
            {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
          </button>
        )}
        <button onClick={() => router.back()} className="btn-secondary">Back</button>
      </div>

      {showPayment && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowPayment(false)}>
          <div className="card p-6 w-full max-w-sm mx-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Record Payment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Payment Method</label>
                <div className="flex gap-2">
                  {(['cash', 'card', 'mobile'] as PaymentMethod[]).map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize border transition-colors ${
                        paymentMethod === method
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)] text-[var(--color-accent)]'
                          : 'border-slate-200 text-[var(--color-text-secondary)] hover:border-slate-300'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Amount</label>
                <input type="number" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)} className="input-field" />
              </div>
              {paymentMethod === 'cash' && (
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Cash Received</label>
                  <input type="number" step="0.01" value={cashReceived} onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)} className="input-field" />
                  <p className="text-sm text-[var(--color-text-muted)] mt-1">
                    Change: ${Math.max(0, cashReceived - paymentAmount).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowPayment(false)} className="btn-secondary">Cancel</button>
              <button
                onClick={() => paymentMutation.mutate({ amount: paymentAmount, method: paymentMethod })}
                disabled={paymentMutation.isPending || paymentAmount <= 0}
                className="btn-primary"
              >
                {paymentMutation.isPending ? 'Processing...' : 'Complete Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
