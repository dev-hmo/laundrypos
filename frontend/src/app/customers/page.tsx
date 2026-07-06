'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApiExtended } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconSearch, IconCustomers, IconEdit, IconTrash, IconPlus, IconX } from '@/components/ui/Icons';
import Link from 'next/link';
import type { Customer } from '@/types';

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => customerApiExtended.listAll(search || undefined),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customerApiExtended.delete(id),
    onSuccess: () => {
      toast('Customer deleted', 'success');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ name: string; phone: string; email: string }> }) =>
      customerApiExtended.update(id, data),
    onSuccess: () => {
      toast('Customer updated', 'success');
      setEditCustomer(null);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const startEdit = (c: Customer) => {
    setEditCustomer(c);
    setEditName(c.name);
    setEditPhone(c.phone);
    setEditEmail(c.email || '');
  };

  const saveEdit = () => {
    if (!editCustomer) return;
    updateMutation.mutate({
      id: editCustomer.id,
      data: { name: editName, phone: editPhone, email: editEmail },
    });
  };

  const confirmDelete = (customer: Customer) => {
    if (window.confirm(`Delete customer "${customer.name}"? This cannot be undone.`)) {
      deleteMutation.mutate(customer.id);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
            placeholder="Search customers..."
          />
        </div>
        <Link href="/pos" className="btn-primary shrink-0">
          <IconPlus size={16} />
          New Customer
        </Link>
      </div>

      {isLoading && (
        <div className="card overflow-hidden">
          <div className="divide-y divide-slate-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isError && (
        <div className="card p-8 text-center">
          <p className="text-[var(--color-error)] font-medium">Failed to load customers</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
        </div>
      )}

      {data && data.customers.length === 0 && (
        <EmptyState
          icon={IconCustomers}
          title={search ? 'No customers found' : 'No customers yet'}
          description={search ? 'Try a different search term' : 'Create your first customer from the POS page'}
          action={
            !search && <Link href="/pos" className="btn-primary"><IconPlus size={16} />New Customer</Link>
          }
        />
      )}

      {data && data.customers.length > 0 && (
        <div className="card overflow-hidden">
          <div className="divide-y divide-slate-100">
            {data.customers.map((customer) => (
              <div key={customer.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--color-surface-overlay)]/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-[var(--color-accent)]">
                    {customer.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/customers/${customer.id}`} className="text-sm font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-accent)] no-underline transition-colors">
                    {customer.name}
                  </Link>
                  <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)] mt-0.5">
                    <span>{customer.phone}</span>
                    {customer.email && <span className="truncate">{customer.email}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(customer)}
                    className="btn-ghost p-2 rounded-lg"
                    title="Edit customer"
                  >
                    <IconEdit size={16} />
                  </button>
                  <button
                    onClick={() => confirmDelete(customer)}
                    className="btn-ghost p-2 rounded-lg text-[var(--color-error)] hover:bg-[var(--color-error-light)]"
                    title="Delete customer"
                  >
                    <IconTrash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {editCustomer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={() => setEditCustomer(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">Edit Customer</h3>
              <button onClick={() => setEditCustomer(null)} className="btn-ghost p-1.5 rounded-lg">
                <IconX size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Name</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Phone</label>
                <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Email</label>
                <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="input-field" type="email" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditCustomer(null)} className="btn-secondary">Cancel</button>
              <button onClick={saveEdit} disabled={updateMutation.isPending} className="btn-primary">
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
