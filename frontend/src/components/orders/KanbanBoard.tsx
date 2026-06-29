// ============================================================
// Laundry OMS — Kanban Board
// Fetches orders via TanStack Query, supports optimistic updates
// ============================================================

'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '@/lib/api';
import { ORDER_STATUSES, type Order, type OrderStatus, type OrderListResponse } from '@/types';
import { KanbanColumn } from './KanbanColumn';

export function KanbanBoard() {
  const queryClient = useQueryClient();
  const [updatingOrderIds, setUpdatingOrderIds] = useState<Set<string>>(new Set());

  // Fetch active orders
  const { data, isLoading, isError, error } = useQuery<OrderListResponse>({
    queryKey: ['orders'],
    queryFn: () => orderApi.listActive(),
  });

  // Optimistic status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      orderApi.updateStatus(orderId, { status }),

    // Optimistic update
    onMutate: async ({ orderId, status }) => {
      // Mark as updating
      setUpdatingOrderIds((prev) => new Set(prev).add(orderId));

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['orders'] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<OrderListResponse>(['orders']);

      // Optimistically update the cache
      queryClient.setQueryData<OrderListResponse>(['orders'], (old) => {
        if (!old) return old;
        return {
          ...old,
          orders: old.orders.map((order) =>
            order.id === orderId ? { ...order, status } : order
          ),
        };
      });

      return { previousData };
    },

    // On error, rollback
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['orders'], context.previousData);
      }
    },

    // Always refetch after settle
    onSettled: (_data, _error, variables) => {
      setUpdatingOrderIds((prev) => {
        const next = new Set(prev);
        next.delete(variables.orderId);
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const handleAdvance = (orderId: string, nextStatus: OrderStatus) => {
    updateStatusMutation.mutate({ orderId, status: nextStatus });
  };

  // Group orders by status
  const ordersByStatus = useMemo(() => {
    const grouped: Record<OrderStatus, Order[]> = {
      Received: [],
      Washing: [],
      Pressing: [],
      Ready: [],
      Delivered: [],
    };

    if (data?.orders) {
      for (const order of data.orders) {
        if (grouped[order.status]) {
          grouped[order.status].push(order);
        }
      }
    }

    return grouped;
  }, [data]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 h-full">
        {ORDER_STATUSES.filter((s) => s !== 'Delivered').map((status) => (
          <div key={status} className="min-w-[280px] max-w-[320px] w-full shrink-0">
            <div className="h-10 bg-slate-100 rounded-t-xl animate-pulse" />
            <div className="bg-slate-50/50 border border-slate-200 rounded-b-xl p-3 space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-28 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="card p-8 text-center">
        <p className="text-[var(--color-error)] font-medium mb-2">Failed to load orders</p>
        <p className="text-sm text-[var(--color-text-muted)]">
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </p>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['orders'] })}
          className="btn-primary mt-4"
        >
          Retry
        </button>
      </div>
    );
  }

  // Active statuses (exclude Delivered from board by default)
  const activeStatuses = ORDER_STATUSES.filter((s) => s !== 'Delivered');

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-full">
      {activeStatuses.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          orders={ordersByStatus[status]}
          onAdvance={handleAdvance}
          updatingOrderIds={updatingOrderIds}
        />
      ))}
    </div>
  );
}
