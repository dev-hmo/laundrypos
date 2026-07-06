'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { invoiceApi } from '@/lib/api';
import type { Invoice } from '@/types';

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();

  const { data: invoice, isLoading, isError, error } = useQuery<Invoice>({
    queryKey: ['invoice', id],
    queryFn: () => invoiceApi.getByOrder(id),
    enabled: !!id,
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto card p-8">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="card p-8 text-center max-w-2xl mx-auto">
        <p className="text-[var(--color-error)] font-medium">Invoice not found</p>
        <p className="text-sm text-[var(--color-text-muted)]">{error instanceof Error ? error.message : ''}</p>
      </div>
    );
  }

  const balanceDue = invoice.balance_due;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="no-print flex justify-end mb-4">
        <button onClick={handlePrint} className="btn-primary">
          🖨 Print Invoice
        </button>
      </div>

      <div className="card p-8" id="invoice">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">INVOICE</h1>
          <p className="text-lg font-medium text-[var(--color-accent)]">{invoice.invoice_number}</p>
          <p className="text-sm text-[var(--color-text-muted)]">
            Issued: {new Date(invoice.issued_at).toLocaleDateString()}
          </p>
        </div>

        <div className="mb-6 p-4 bg-[var(--color-surface-overlay)] rounded-lg">
          <p className="font-semibold">{invoice.customer_name}</p>
          {invoice.customer_phone && <p className="text-sm text-[var(--color-text-secondary)]">{invoice.customer_phone}</p>}
        </div>

        <table className="w-full mb-6">
          <thead>
            <tr className="border-b border-slate-300">
              <th className="text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase pb-2">Service</th>
              <th className="text-right text-xs font-semibold text-[var(--color-text-muted)] uppercase pb-2">Details</th>
              <th className="text-right text-xs font-semibold text-[var(--color-text-muted)] uppercase pb-2">Price</th>
              <th className="text-right text-xs font-semibold text-[var(--color-text-muted)] uppercase pb-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100">
                <td className="py-3 text-sm font-medium">{item.service_type}</td>
                <td className="py-3 text-sm text-right text-[var(--color-text-secondary)] tabular-nums">
                  {item.weight_kg > 0 ? `${item.weight_kg} kg` : `${item.quantity} item(s)`}
                </td>
                <td className="py-3 text-sm text-right tabular-nums">${item.unit_price.toFixed(2)}</td>
                <td className="py-3 text-sm text-right font-medium tabular-nums">${item.subtotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-1 text-sm border-t border-slate-300 pt-4">
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Subtotal</span>
            <span className="tabular-nums">${(invoice.total_amount - invoice.tax_amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Tax</span>
            <span className="tabular-nums">${invoice.tax_amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-200">
            <span>Total</span>
            <span className="tabular-nums">${invoice.total_amount.toFixed(2)}</span>
          </div>
        </div>

        {invoice.payments.length > 0 && (
          <div className="mt-6 space-y-1 text-sm">
            <h3 className="font-semibold text-[var(--color-text-secondary)] mb-2">Payments</h3>
            {invoice.payments.map((payment) => (
              <div key={payment.id} className="flex justify-between">
                <span className="capitalize">{payment.method} {payment.reference ? `(${payment.reference})` : ''}</span>
                <span className="tabular-nums">-${payment.amount.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold pt-2 border-t border-slate-200">
              <span>Balance Due</span>
              <span className={`tabular-nums ${balanceDue > 0 ? 'text-[var(--color-error)]' : 'text-emerald-600'}`}>
                ${balanceDue.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {invoice.printed && (
          <p className="text-xs text-[var(--color-text-muted)] text-center mt-8">
            Printed on {new Date(invoice.issued_at).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
