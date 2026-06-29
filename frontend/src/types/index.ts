// ============================================================
// Laundry OMS — Shared TypeScript Types
// ============================================================

// --- Database Enums ---

export type OrderStatus = 'Received' | 'Washing' | 'Pressing' | 'Ready' | 'Delivered';

export const ORDER_STATUSES: OrderStatus[] = [
  'Received',
  'Washing',
  'Pressing',
  'Ready',
  'Delivered',
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  Received: 'Received',
  Washing: 'Washing',
  Pressing: 'Pressing',
  Ready: 'Ready for Pickup',
  Delivered: 'Delivered',
};

export const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string; border: string }> = {
  Received: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Washing: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  Pressing: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  Ready: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Delivered: { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200' },
};

// --- Customer ---

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  preferences?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerPayload {
  name: string;
  phone: string;
  email?: string;
  preferences?: string;
}

// --- Order ---

export interface Order {
  id: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  status: OrderStatus;
  total_amount: number;
  tax_amount: number;
  promised_date?: string;
  notes?: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  service_type: string;
  weight_kg: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface CreateOrderPayload {
  customer_id: string;
  promised_date?: string;
  notes?: string;
  tax_amount: number;
  total_amount: number;
  items: {
    service_type: string;
    weight_kg: number;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }[];
}

export interface UpdateStatusPayload {
  status: OrderStatus;
}

// --- API Responses ---

export interface OrderListResponse {
  orders: Order[];
  count: number;
}

export interface CustomerSearchResponse {
  customers: Customer[];
  count: number;
}

// --- Service Catalog (frontend-only) ---

export interface ServiceOption {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
  unit: 'kg' | 'item';
  icon: string;
}

export const SERVICE_CATALOG: ServiceOption[] = [
  {
    id: 'wash-fold',
    name: 'Wash & Fold',
    description: 'Standard wash, dry, and fold service',
    unitPrice: 2.50,
    unit: 'kg',
    icon: '🧺',
  },
  {
    id: 'dry-cleaning',
    name: 'Dry Cleaning',
    description: 'Professional solvent-based cleaning',
    unitPrice: 8.00,
    unit: 'kg',
    icon: '👔',
  },
  {
    id: 'pressing',
    name: 'Pressing Only',
    description: 'Steam press and finishing',
    unitPrice: 3.00,
    unit: 'item',
    icon: '♨️',
  },
  {
    id: 'stain-treatment',
    name: 'Stain Treatment',
    description: 'Targeted stain removal service',
    unitPrice: 5.00,
    unit: 'item',
    icon: '💧',
  },
  {
    id: 'alterations',
    name: 'Alterations',
    description: 'Hemming, repairs, and adjustments',
    unitPrice: 12.00,
    unit: 'item',
    icon: '✂️',
  },
];
