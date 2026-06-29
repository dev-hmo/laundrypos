import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ServiceOption } from '@/types';

export interface CartItem {
  id: string;
  serviceType: string;
  serviceName: string;
  unitPrice: number;
  unit: 'kg' | 'item';
  weightKg: number;
  quantity: number;
  subtotal: number;
}

interface CartStore {
  items: CartItem[];
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  taxRate: number;
  discountPercent: number;

  getSubtotal: () => number;
  getDiscount: () => number;
  getTax: () => number;
  getGrandTotal: () => number;
  getItemCount: () => number;

  addItem: (service: ServiceOption) => void;
  removeItem: (itemId: string) => void;
  updateWeight: (itemId: string, weight: number) => void;
  updateQuantity: (itemId: string, qty: number) => void;
  setDiscount: (percent: number) => void;
  setCustomer: (id: string, name: string, phone: string) => void;
  clearCustomer: () => void;
  clearCart: () => void;
}

function calculateItemSubtotal(item: CartItem): number {
  if (item.unit === 'kg') {
    return Math.round(item.unitPrice * item.weightKg * 100) / 100;
  }
  return Math.round(item.unitPrice * item.quantity * 100) / 100;
}

function generateItemId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      customerId: null,
      customerName: '',
      customerPhone: '',
      taxRate: 0.05,
      discountPercent: 0,

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.subtotal, 0);
      },

      getDiscount: () => {
        const subtotal = get().getSubtotal();
        return Math.round(subtotal * (get().discountPercent / 100) * 100) / 100;
      },

      getTax: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscount();
        return Math.round((subtotal - discount) * get().taxRate * 100) / 100;
      },

      getGrandTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscount();
        const tax = get().getTax();
        return Math.round((subtotal - discount + tax) * 100) / 100;
      },

      getItemCount: () => get().items.length,

      addItem: (service: ServiceOption) => {
        const newItem: CartItem = {
          id: generateItemId(),
          serviceType: service.id,
          serviceName: service.name,
          unitPrice: service.unitPrice,
          unit: service.unit,
          weightKg: service.unit === 'kg' ? 1.0 : 0,
          quantity: 1,
          subtotal: service.unitPrice,
        };
        set((state) => ({ items: [...state.items, newItem] }));
      },

      removeItem: (itemId: string) => {
        set((state) => ({ items: state.items.filter((item) => item.id !== itemId) }));
      },

      updateWeight: (itemId: string, weight: number) => {
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== itemId) return item;
            const updated = { ...item, weightKg: Math.max(0, weight) };
            updated.subtotal = calculateItemSubtotal(updated);
            return updated;
          }),
        }));
      },

      updateQuantity: (itemId: string, qty: number) => {
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== itemId) return item;
            const updated = { ...item, quantity: Math.max(1, qty) };
            updated.subtotal = calculateItemSubtotal(updated);
            return updated;
          }),
        }));
      },

      setDiscount: (percent: number) => {
        set({ discountPercent: Math.max(0, Math.min(100, percent)) });
      },

      setCustomer: (id: string, name: string, phone: string) => {
        set({ customerId: id, customerName: name, customerPhone: phone });
      },

      clearCustomer: () => {
        set({ customerId: null, customerName: '', customerPhone: '' });
      },

      clearCart: () => {
        set({
          items: [],
          customerId: null,
          customerName: '',
          customerPhone: '',
          discountPercent: 0,
        });
      },
    }),
    {
      name: 'laundry-pos-cart',
      partialize: (state) => ({
        items: state.items,
        customerId: state.customerId,
        customerName: state.customerName,
        customerPhone: state.customerPhone,
        discountPercent: state.discountPercent,
      }),
    }
  )
);
