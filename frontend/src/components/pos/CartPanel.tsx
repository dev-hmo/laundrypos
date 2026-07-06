'use client';

import { useCartStore } from '@/stores/useCartStore';
import { orderApi } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/Toast';
import { useState } from 'react';
import type { CreateOrderPayload } from '@/types';

export function CartPanel() {
  const {
    items,
    customerId,
    getSubtotal,
    getDiscount,
    getTax,
    getGrandTotal,
    discountPercent,
    removeItem,
    updateWeight,
    updateQuantity,
    setDiscount,
    clearCart,
  } = useCartStore();

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showDiscountInput, setShowDiscountInput] = useState(false);

  const createOrderMutation = useMutation({
    mutationFn: (payload: CreateOrderPayload) => orderApi.create(payload),
    onSuccess: () => {
      clearCart();
      toast('Order placed successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err: Error) => {
      toast(err.message || 'Failed to place order', 'error');
    },
  });

  const handlePlaceOrder = () => {
    if (!customerId || items.length === 0) return;

    const payload: CreateOrderPayload = {
      customer_id: customerId,
      tax_amount: getTax(),
      total_amount: getGrandTotal(),
      items: items.map((item) => ({
        service_type: item.serviceType,
        weight_kg: item.weightKg,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.subtotal,
      })),
    };

    createOrderMutation.mutate(payload);
  };

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const tax = getTax();
  const grandTotal = getGrandTotal();
  const canSubmit = customerId && items.length > 0 && !createOrderMutation.isPending;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
          Cart
          {items.length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold
                           bg-[var(--color-accent)] text-white rounded-full">
              {items.length}
            </span>
          )}
        </h2>
        {items.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors"
            aria-label="Clear all items"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0" role="list" aria-label="Cart items">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-3xl mb-3 opacity-30" aria-hidden="true">🧺</div>
            <p className="text-sm text-[var(--color-text-muted)]">
              Select a service to begin
            </p>
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={item.id}
              className="card p-3 animate-slide-in"
              style={{ animationDelay: `${index * 50}ms` }}
              role="listitem"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {item.serviceName}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    ${item.unitPrice.toFixed(2)}/{item.unit}
                  </p>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-error)]
                             transition-colors p-1 -mr-1 text-lg leading-none"
                  aria-label={`Remove ${item.serviceName}`}
                >
                  &times;
                </button>
              </div>

              <div className="flex items-center justify-between">
                {item.unit === 'kg' ? (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[var(--color-text-muted)]">Weight:</label>
                    <StepperInput
                      value={item.weightKg}
                      step={0.5}
                      min={0}
                      onChange={(v) => updateWeight(item.id, v)}
                      ariaLabel={`${item.serviceName} weight in kilograms`}
                    />
                    <span className="text-xs text-[var(--color-text-muted)]">kg</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[var(--color-text-muted)]">Qty:</label>
                    <StepperInput
                      value={item.quantity}
                      step={1}
                      min={1}
                      onChange={(v) => updateQuantity(item.id, v)}
                      ariaLabel={`${item.serviceName} quantity`}
                    />
                  </div>
                )}

                <p className="text-sm font-bold text-[var(--color-text-primary)] tabular-nums">
                  ${item.subtotal.toFixed(2)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totals and Submit */}
      {items.length > 0 && (
        <div className="border-t border-slate-200 pt-4 mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">Subtotal</span>
            <span className="font-medium tabular-nums">${subtotal.toFixed(2)}</span>
          </div>

          {/* Discount */}
          <div className="flex justify-between text-sm items-center">
            <button
              onClick={() => setShowDiscountInput(!showDiscountInput)}
              className="text-xs text-[var(--color-accent)] hover:underline"
              aria-label={showDiscountInput ? 'Hide discount' : 'Add discount'}
            >
              {discountPercent > 0 ? `Discount (${discountPercent}%)` : '+ Add discount'}
            </button>
            {discountPercent > 0 && (
              <span className="font-medium text-emerald-600 tabular-nums">
                -${discount.toFixed(2)}
              </span>
            )}
          </div>
          {showDiscountInput && (
            <div className="flex items-center gap-2 animate-fade-in">
              <label className="text-xs text-[var(--color-text-muted)]">Discount %:</label>
              <input
                type="number"
                value={discountPercent || ''}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="input-field w-20 text-center text-sm"
                min="0"
                max="100"
                placeholder="0"
                aria-label="Discount percentage"
              />
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">Tax (5%)</span>
            <span className="font-medium tabular-nums">${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-100">
            <span>Total</span>
            <span className="text-[var(--color-accent)] tabular-nums">
              ${grandTotal.toFixed(2)}
            </span>
          </div>

          {createOrderMutation.isError && (
            <p className="text-xs text-[var(--color-error)] mt-1" role="alert">
              {createOrderMutation.error?.message || 'Failed to place order'}
            </p>
          )}

          <button
            id="place-order-btn"
            onClick={handlePlaceOrder}
            disabled={!canSubmit}
            className="btn-primary w-full mt-3 text-base py-3"
            aria-label={!customerId ? 'Select a customer first' : `Place order for $${grandTotal.toFixed(2)}`}
          >
            {createOrderMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : !customerId ? (
              'Select Customer First'
            ) : (
              `Place Order — $${grandTotal.toFixed(2)}`
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function StepperInput({
  value,
  step,
  min,
  onChange,
  ariaLabel,
}: {
  value: number;
  step: number;
  min: number;
  onChange: (val: number) => void;
  ariaLabel?: string;
}) {
  const dec = () => onChange(value - step);
  const inc = () => onChange(value + step);

  return (
    <div className="flex items-center border border-slate-200 rounded-md overflow-hidden">
      <button
        onClick={dec}
        className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 transition-colors text-sm font-medium"
        aria-label={`Decrease`}
      >
        &minus;
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || min)}
        className="w-14 h-8 text-center text-sm font-medium border-x border-slate-200
                   focus:outline-none bg-white"
        step={step}
        min={min}
        aria-label={ariaLabel}
      />
      <button
        onClick={inc}
        className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 transition-colors text-sm font-medium"
        aria-label={`Increase`}
      >
        +
      </button>
    </div>
  );
}
