// ============================================================
// Laundry OMS — Customer Search (POS)
// ============================================================

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { customerApi } from '@/lib/api';
import { useCartStore } from '@/stores/useCartStore';
import type { Customer } from '@/types';

export function CustomerSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);

  const { customerId, customerName, customerPhone, setCustomer, clearCustomer } = useCartStore();

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await customerApi.search(value);
        setResults(data.customers);
        setShowDropdown(true);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  const handleSelect = (customer: Customer) => {
    setCustomer(customer.id, customer.name, customer.phone);
    setQuery('');
    setShowDropdown(false);
  };

  const handleClear = () => {
    clearCustomer();
    setQuery('');
  };

  if (customerId) {
    return (
      <div className="card p-3 flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[var(--color-accent-light)] flex items-center justify-center">
            <span className="text-sm font-semibold text-[var(--color-accent)]">
              {customerName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-tight">
              {customerName}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">{customerPhone}</p>
          </div>
        </div>
        <button
          onClick={handleClear}
          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors px-2 py-1"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
        Customer
      </h2>

      <div className="relative">
        <input
          id="customer-search"
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by phone or name..."
          className="input-field pr-10"
          autoComplete="off"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-slate-300 border-t-[var(--color-accent)] rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Search results dropdown */}
      {showDropdown && (
        <div className="absolute z-20 w-full mt-1 card shadow-lg max-h-48 overflow-y-auto animate-scale-in">
          {results.length > 0 ? (
            results.map((customer) => (
              <button
                key={customer.id}
                onClick={() => handleSelect(customer)}
                className="w-full px-3 py-2.5 text-left hover:bg-slate-50 transition-colors
                           flex items-center gap-3 border-b border-slate-100 last:border-0"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-slate-500">
                    {customer.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">{customer.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{customer.phone}</p>
                </div>
              </button>
            ))
          ) : (
            <div className="px-3 py-4 text-center">
              <p className="text-sm text-[var(--color-text-muted)] mb-2">No customers found</p>
              <button
                onClick={() => { setShowDropdown(false); setShowNewForm(true); }}
                className="text-sm font-medium text-[var(--color-accent)] hover:underline"
              >
                + Add New Customer
              </button>
            </div>
          )}
        </div>
      )}

      {/* New customer form */}
      {showNewForm && (
        <NewCustomerForm
          initialPhone={query}
          onCreated={(customer) => {
            handleSelect(customer);
            setShowNewForm(false);
          }}
          onCancel={() => setShowNewForm(false)}
        />
      )}
    </div>
  );
}

function NewCustomerForm({
  initialPhone,
  onCreated,
  onCancel,
}: {
  initialPhone: string;
  onCreated: (customer: Customer) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(initialPhone);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const customer = await customerApi.create({ name: name.trim(), phone: phone.trim() });
      onCreated(customer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-3 card p-4 animate-scale-in">
      <h3 className="text-sm font-semibold mb-3">New Customer</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          className="input-field"
          autoFocus
          required
        />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone number"
          className="input-field"
          required
        />
        {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" className="btn-primary flex-1" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Add Customer'}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
