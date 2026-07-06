// ============================================================
// Laundry OMS — API Client
// ============================================================

import type {
  CreateCustomerPayload,
  CreateOrderPayload,
  CreatePaymentPayload,
  CreateServicePayload,
  CreateUserPayload,
  Customer,
  CustomerSearchResponse,
  DailySummary,
  DashboardStats,
  Invoice,
  LoginRequest,
  LoginResponse,
  Order,
  OrderListAllParams,
  OrderListResponse,
  Payment,
  RevenueReport,
  Service,
  ServiceBreakdown,
  TopCustomer,
  UpdateServicePayload,
  UpdateStatusPayload,
  UpdateUserPayload,
  User,
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// --- Utility ---

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `API Error: ${res.status}`);
  }

  return res.json();
}

// --- Customer API ---

export const customerApi = {
  search: (query: string) =>
    request<CustomerSearchResponse>(`/customers/search?q=${encodeURIComponent(query)}`),

  create: (data: CreateCustomerPayload) =>
    request<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// --- Order API ---

export const orderApi = {
  listActive: () =>
    request<OrderListResponse>('/orders'),

  create: (data: CreateOrderPayload) =>
    request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStatus: (orderId: string, data: UpdateStatusPayload) =>
    request<Order>(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// --- Auth API ---

export const authApi = {
  login: (data: LoginRequest) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  me: () =>
    request<User>('/auth/me'),
};

// --- User API ---

export const userApi = {
  list: () =>
    request<User[]>('/users'),
  get: (id: string) =>
    request<User>(`/users/${id}`),
  create: (data: CreateUserPayload) =>
    request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateUserPayload) =>
    request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deactivate: (id: string) =>
    request<void>(`/users/${id}`, {
      method: 'DELETE',
    }),
};

// Extended Customer API

export const customerApiExtended = {
  listAll: (q?: string) =>
    request<{customers: Customer[]; count: number}>(`/customers${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  get: (id: string) =>
    request<Customer>(`/customers/${id}`),
  update: (id: string, data: Partial<CreateCustomerPayload>) =>
    request<Customer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<void>(`/customers/${id}`, {
      method: 'DELETE',
    }),
};

// Order API extended methods

export const orderApiExtended = {
  listAll: (params?: OrderListAllParams) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.from) searchParams.set('from', params.from);
    if (params?.to) searchParams.set('to', params.to);
    if (params?.customer_id) searchParams.set('customer_id', params.customer_id);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));
    const qs = searchParams.toString();
    return request<{orders: Order[]; count: number}>(`/orders/all${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) =>
    request<Order>(`/orders/${id}`),
  update: (id: string, data: {notes?: string; promised_date?: string}) =>
    request<Order>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  cancel: (id: string) =>
    request<Order>(`/orders/${id}/cancel`, {
      method: 'PATCH',
    }),
};

// --- Payment API ---

export const paymentApi = {
  create: (orderId: string, data: CreatePaymentPayload) =>
    request<Payment>(`/orders/${orderId}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  listByOrder: (orderId: string) =>
    request<Payment[]>(`/orders/${orderId}/payments`),
};

// --- Invoice API ---

export const invoiceApi = {
  getByOrder: (orderId: string) =>
    request<Invoice>(`/orders/${orderId}/invoice`),
  markPrinted: (orderId: string) =>
    request<void>(`/orders/${orderId}/invoice/printed`, {
      method: 'PATCH',
    }),
};

// --- Service API ---

export const serviceApi = {
  list: () =>
    request<Service[]>('/services'),
  get: (id: string) =>
    request<Service>(`/services/${id}`),
  create: (data: CreateServicePayload) =>
    request<Service>('/services', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateServicePayload) =>
    request<Service>(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<void>(`/services/${id}`, {
      method: 'DELETE',
    }),
};

// --- Report API ---

export const reportApi = {
  dailySummary: (date?: string) =>
    request<DailySummary>(`/reports/daily${date ? `?date=${date}` : ''}`),
  revenue: (from: string, to: string) =>
    request<RevenueReport[]>(`/reports/revenue?from=${from}&to=${to}`),
  services: (from: string, to: string) =>
    request<ServiceBreakdown[]>(`/reports/services?from=${from}&to=${to}`),
  topCustomers: (from: string, to: string, limit?: number) =>
    request<TopCustomer[]>(`/reports/top-customers?from=${from}&to=${to}${limit ? `&limit=${limit}` : ''}`),
};

// --- Dashboard API ---

export const dashboardApi = {
  stats: () =>
    request<DashboardStats>('/dashboard/stats'),
};

// --- Health ---

export const healthApi = {
  check: () => request<{ status: string; database: string }>('/health'),
};
