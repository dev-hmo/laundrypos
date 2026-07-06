'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { CreatePaymentPayload, PaymentMethod } from '@/types';

interface PaymentModalProps {
  orderId: string;
  totalAmount: number;
  onComplete: (data: CreatePaymentPayload) => Promise<void>;
  onClose: () => void;
}

export function PaymentModal({ orderId, totalAmount, onComplete, onClose }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [amount, setAmount] = useState(totalAmount);
  const [cashReceived, setCashReceived] = useState(totalAmount);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const change = Math.max(0, cashReceived - amount);

  const handleSubmit = async () => {
    setIsProcessing(true);
    await onComplete({ amount, method, reference: method === 'card' ? 'Card' : method === 'mobile' ? 'Mobile' : undefined });
    setIsProcessing(false);
    setIsDone(true);
  };

  if (isDone) {
    return (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
        <div className="card p-6 w-full max-w-sm mx-4 animate-scale-in text-center" onClick={(e) => e.stopPropagation()}>
          <div className="text-4xl mb-4">✅</div>
          <h3 className="text-lg font-bold mb-2">Payment Complete</h3>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            Order #{orderId.slice(0, 8)}
          </p>
          <div className="flex flex-col gap-2">
            <Link href={`/orders/${orderId}/invoice`} className="btn-primary">
              View Invoice
            </Link>
            <button onClick={onClose} className="btn-secondary">
              New Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div className="card p-6 w-full max-w-sm mx-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-2">Payment</h3>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          Order #{orderId.slice(0, 8)} — Total: ${totalAmount.toFixed(2)}
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Method</label>
            <div className="flex gap-2">
              {(['cash', 'card', 'mobile'] as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize border transition-colors ${
                    method === m
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)] text-[var(--color-accent)]'
                      : 'border-slate-200 text-[var(--color-text-secondary)] hover:border-slate-300'
                  }`}
                >
                  {m === 'cash' ? '💵 Cash' : m === 'card' ? '💳 Card' : '📱 Mobile'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="input-field"
            />
          </div>

          {method === 'cash' && (
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Cash Received</label>
              <input
                type="number"
                step="0.01"
                value={cashReceived}
                onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                className="input-field"
              />
              {change > 0 && (
                <p className="text-sm text-emerald-600 font-medium mt-1">
                  Change: ${change.toFixed(2)}
                </p>
              )}
            </div>
          )}

          <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200">
            <span>Total</span>
            <span className="tabular-nums">${totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={isProcessing || amount <= 0} className="btn-primary">
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              'Complete Payment'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
