'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { customerApiExtended } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import type { Customer } from '@/types';

export default function EditCustomerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [preferences, setPreferences] = useState('');

  const { data: customer, isLoading, isError } = useQuery<Customer>({
    queryKey: ['customer', id],
    queryFn: () => customerApiExtended.get(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone);
      setEmail(customer.email || '');
      setPreferences(customer.preferences || '');
    }
  }, [customer]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Customer>) => customerApiExtended.update(id, data),
    onSuccess: () => {
      toast('Customer updated', 'success');
      router.push(`/customers/${id}`);
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ name, phone, email, preferences });
  };

  if (isLoading) {
    return (
      <div className="card p-6 max-w-lg">
        <div className="h-6 w-48 bg-slate-100 rounded animate-pulse mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <div className="card p-8 text-center">
        <p className="text-[var(--color-error)] font-medium">Customer not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <div className="card p-6">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-6">Edit Customer</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Preferences</label>
            <textarea
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              className="input-field"
              rows={3}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={updateMutation.isPending} className="btn-primary">
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
