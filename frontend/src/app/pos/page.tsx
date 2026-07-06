// ============================================================
// Laundry OMS — POS Checkout Page
// ============================================================

'use client';

import { useState } from 'react';
import { ServiceSelector } from '@/components/pos/ServiceSelector';
import { CartPanel } from '@/components/pos/CartPanel';
import { CustomerSearch } from '@/components/pos/CustomerSearch';
import { PaymentModal } from '@/components/pos/PaymentModal';
import { useCartStore } from '@/stores/useCartStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi, paymentApi } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import type { CreateOrderPayload, CreatePaymentPayload } from '@/types';

export default function POSPage() {
  const [showPayment, setShowPayment] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const { clearCart, getGrandTotal, getTax, items, customerId } = useCartStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createOrderMutation = useMutation({
    mutationFn: (payload: CreateOrderPayload) => orderApi.create(payload),
    onSuccess: (order) => {
      setLastOrderId(order.id);
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
      clearCart();
      setShowPayment(false);
      setLastOrderId(null);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Payment failed', 'error');
    }
  };

  const handleClosePayment = () => {
    setShowPayment(false);
    setLastOrderId(null);
    clearCart();
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-7rem)] pos-layout">
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
          totalAmount={getGrandTotal()}
          onComplete={handlePaymentComplete}
          onClose={handleClosePayment}
        />
      )}
    </div>
  );
}
