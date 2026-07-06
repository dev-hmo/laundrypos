'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApiExtended } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
            placeholder="Search customers..."
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-sm">🔍</span>
        </div>
        <Link href="/pos" className="btn-primary">
          + New Customer
        </Link>
      </div>

      {isLoading && (
        <div className="card p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="card p-8 text-center">
          <p className="text-[var(--color-error)] font-medium">Failed to load customers</p>
          <p className="text-sm text-[var(--color-text-muted)]">{error instanceof Error ? error.message : ''}</p>
        </div>
      )}

      {data && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-[var(--color-surface-overlay)]">
                <th className="text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-4 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-4 py-3">Phone</th>
                <th className="text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-4 py-3">Email</th>
                <th className="text-right text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.customers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-sm text-[var(--color-text-muted)]">
                    No customers found
                  </td>
                </tr>
              ) : (
                data.customers.map((customer) => (
                  <tr key={customer.id} className="border-b border-slate-100 hover:bg-[var(--color-surface-overlay)] transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/customers/${customer.id}`} className="text-sm font-medium text-[var(--color-accent)] hover:underline">
                        {customer.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">{customer.phone}</td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">{customer.email || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => startEdit(customer)}
                        className="text-xs text-[var(--color-accent)] hover:underline mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete this customer?')) deleteMutation.mutate(customer.id);
                        }}
                        className="text-xs text-[var(--color-error)] hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {editCustomer && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setEditCustomer(null)}>
          <div className="card p-6 w-full max-w-md mx-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Edit Customer</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Name</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Phone</label>
                <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Email</label>
                <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="input-field" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditCustomer(null)} className="btn-secondary">Cancel</button>
              <button onClick={saveEdit} disabled={updateMutation.isPending} className="btn-primary">
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
