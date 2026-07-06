'use client';

import { useState, useEffect } from 'react';
import { ServiceSelector } from '@/components/pos/ServiceSelector';
import { CartPanel } from '@/components/pos/CartPanel';
import { CustomerSearch } from '@/components/pos/CustomerSearch';
import { PaymentModal } from '@/components/pos/PaymentModal';
import { useCartStore } from '@/stores/useCartStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi, paymentApi } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { IconReceipt } from '@/components/ui/Icons';
import type { CreateOrderPayload, CreatePaymentPayload } from '@/types';

export default function POSPage() {
  const [showPayment, setShowPayment] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrderTotal, setLastOrderTotal] = useState(0);
  const { clearCart, getGrandTotal, getTax, items, customerId, getItemCount } = useCartStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createOrderMutation = useMutation({
    mutationFn: (payload: CreateOrderPayload) => orderApi.create(payload),
    onSuccess: (order) => {
      setLastOrderId(order.id);
      setLastOrderTotal(getGrandTotal());
      setShowPayment(true);
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

  const handlePaymentComplete = async (data: CreatePaymentPayload) => {
    if (!lastOrderId) return;
    try {
      await paymentApi.create(lastOrderId, data);
      toast('Payment complete', 'success');
      setShowPayment(false);
      setShowReceipt(true);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Payment failed', 'error');
    }
  };

  const handleClosePayment = () => {
    setShowPayment(false);
    setLastOrderId(null);
    clearCart();
  };

  const handleNewOrder = () => {
    clearCart();
    setShowReceipt(false);
    setLastOrderId(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') return;
      if (e.key === 'Enter' && !e.shiftKey) {
        const placeBtn = document.getElementById('place-order-btn');
        if (placeBtn && !placeBtn.hasAttribute('disabled')) {
          placeBtn.click();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (showReceipt && lastOrderId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-7rem)] animate-fade-in">
        <div className="card p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-success-light)] flex items-center justify-center mx-auto mb-4">
            <IconReceipt size={28} className="text-[var(--color-success)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">Order Complete</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-2">
            Order #{lastOrderId.slice(0, 8)}
          </p>
          <p className="text-3xl font-bold text-[var(--color-accent)] mb-6">
            ${lastOrderTotal.toFixed(2)}
          </p>
          <div className="flex gap-3">
            <a
              href={`/orders/${lastOrderId}/invoice`}
              target="_blank"
              className="btn-primary flex-1"
            >
              <IconReceipt size={16} />
              View Invoice
            </a>
            <button onClick={handleNewOrder} className="btn-secondary flex-1">
              New Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-7rem)] pos-layout animate-fade-in">
      {/* Left: Services + Customer */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2">
        <CustomerSearch />
        <ServiceSelector />
      </div>

      {/* Right: Cart */}
      <div className="w-[380px] xl:w-[420px] shrink-0 bg-white rounded-xl border border-slate-200 p-5 
                      shadow-sm flex flex-col overflow-hidden pos-cart">
        <CartPanel onPlaceOrder={handlePlaceOrder} isPlacing={createOrderMutation.isPending} error={createOrderMutation.error} />
      </div>

      {showPayment && lastOrderId && (
        <PaymentModal
          orderId={lastOrderId}
          totalAmount={lastOrderTotal}
          onComplete={handlePaymentComplete}
          onClose={handleClosePayment}
        />
      )}
    </div>
  );
}
