// ============================================================
// Laundry OMS — API Client
// ============================================================

import type {
  CreateCustomerPayload,
  CreateOrderPayload,
  Customer,
  CustomerSearchResponse,
  Order,
  OrderListResponse,
  UpdateStatusPayload,
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

// --- Health ---

export const healthApi = {
  check: () => request<{ status: string; database: string }>('/health'),
};
