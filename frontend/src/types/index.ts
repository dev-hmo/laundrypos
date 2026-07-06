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

// --- User & Auth ---
export type UserRole = 'admin' | 'manager' | 'staff';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface UpdateUserPayload {
  email?: string;
  name?: string;
  role?: UserRole;
  is_active?: boolean;
}

// --- Payment ---
export type PaymentMethod = 'cash' | 'card' | 'mobile';

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  paid_at: string;
  created_at: string;
}

export interface CreatePaymentPayload {
  amount: number;
  method: PaymentMethod;
  reference?: string;
}

// --- Invoice ---
export interface Invoice {
  id: string;
  order_id: string;
  invoice_number: string;
  issued_at: string;
  printed: boolean;
  customer_name: string;
  customer_phone: string;
  items: OrderItem[];
  total_amount: number;
  tax_amount: number;
  payments: Payment[];
  balance_due: number;
}

// --- Service Catalog (API) ---
export interface Service {
  id: string;
  service_id: string;
  name: string;
  description: string;
  unit: 'kg' | 'item';
  unit_price: number;
  is_active: boolean;
  created_at: string;
}

export interface CreateServicePayload {
  service_id: string;
  name: string;
  description?: string;
  unit: 'kg' | 'item';
  unit_price: number;
}

export interface UpdateServicePayload {
  name?: string;
  description?: string;
  unit?: 'kg' | 'item';
  unit_price?: number;
  is_active?: boolean;
}

// --- Reports ---
export interface DailySummary {
  date: string;
  total_orders: number;
  total_revenue: number;
  total_tax: number;
  total_discount: number;
  cash_amount: number;
  card_amount: number;
  mobile_amount: number;
  avg_order_value: number;
}

export interface RevenueReport {
  date: string;
  amount: number;
}

export interface ServiceBreakdown {
  service_name: string;
  count: number;
  revenue: number;
}

export interface TopCustomer {
  customer_id: string;
  customer_name: string;
  order_count: number;
  total_spent: number;
}

// --- Dashboard ---
export interface DashboardStats {
  orders_today: number;
  revenue_today: number;
  pending_orders: number;
  total_customers: number;
}

// --- Extended types ---
export interface OrderListAllParams {
  status?: string;
  from?: string;
  to?: string;
  customer_id?: string;
  limit?: number;
  offset?: number;
}
