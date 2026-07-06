'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceApi } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { IconPlus, IconEdit, IconTrash, IconPackage } from '@/components/ui/Icons';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Service, CreateServicePayload, UpdateServicePayload } from '@/types';

export default function ServicesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<CreateServicePayload>({
    service_id: '',
    name: '',
    description: '',
    unit: 'kg',
    unit_price: 0,
  });

  const { data: services, isLoading, isError, error } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: () => serviceApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateServicePayload) => serviceApi.create(data),
    onSuccess: () => {
      toast('Service created', 'success');
      setShowModal(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServicePayload }) => serviceApi.update(id, data),
    onSuccess: () => {
      toast('Service updated', 'success');
      setEditingService(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => serviceApi.delete(id),
    onSuccess: () => {
      toast('Service deleted', 'success');
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const resetForm = () => {
    setFormData({ service_id: '', name: '', description: '', unit: 'kg', unit_price: 0 });
  };

  const openCreate = () => {
    resetForm();
    setEditingService(null);
    setShowModal(true);
  };

  const openEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      service_id: service.service_id,
      name: service.name,
      description: service.description,
      unit: service.unit,
      unit_price: service.unit_price,
    });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Service Catalog</h2>
        <button onClick={openCreate} className="btn-primary flex items-center gap-1.5">
          <IconPlus size={16} /> Add Service
        </button>
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
          <p className="text-[var(--color-error)] font-medium">Failed to load services</p>
          <p className="text-sm text-[var(--color-text-muted)]">{error instanceof Error ? error.message : ''}</p>
        </div>
      )}

      {services && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-[var(--color-surface-overlay)]">
                <th className="text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase px-4 py-3">Service ID</th>
                <th className="text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase px-4 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase px-4 py-3">Description</th>
                <th className="text-center text-xs font-semibold text-[var(--color-text-muted)] uppercase px-4 py-3">Unit</th>
                <th className="text-right text-xs font-semibold text-[var(--color-text-muted)] uppercase px-4 py-3">Price</th>
                <th className="text-center text-xs font-semibold text-[var(--color-text-muted)] uppercase px-4 py-3">Active</th>
                <th className="text-right text-xs font-semibold text-[var(--color-text-muted)] uppercase px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12">
                    <EmptyState icon={IconPackage} title="No services yet" description="Create your first laundry service to get started." />
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr key={service.id} className="border-b border-slate-100 hover:bg-[var(--color-surface-overlay)] transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-[var(--color-text-muted)]">{service.service_id}</td>
                    <td className="px-4 py-3 text-sm font-medium">{service.name}</td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-muted)] max-w-[200px] truncate">
                      {service.description || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-center capitalize">{service.unit}</td>
                    <td className="px-4 py-3 text-sm text-right tabular-nums">${service.unit_price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block w-2 h-2 rounded-full ${service.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(service)} className="btn-ghost mr-1" title="Edit">
                        <IconEdit size={16} />
                      </button>
                      <button
                        onClick={() => { if (confirm('Delete this service?')) deleteMutation.mutate(service.id); }}
                        className="btn-ghost text-[var(--color-error)]"
                        title="Delete"
                      >
                        <IconTrash size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="card p-6 w-full max-w-md mx-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">
              {editingService ? 'Edit Service' : 'Add Service'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Service ID</label>
                <input
                  value={formData.service_id}
                  onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                  className="input-field"
                  placeholder="e.g., wash-fold"
                  disabled={!!editingService}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Name</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Description</label>
                <input
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as 'kg' | 'item' })}
                    className="input-field"
                  >
                    <option value="kg">Per KG</option>
                    <option value="item">Per Item</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Unit Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                  />
                </div>
              </div>
              {editingService && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={editingService.is_active}
                    onChange={(e) => setEditingService({ ...editingService, is_active: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="is_active" className="text-sm text-[var(--color-text-secondary)]">Active</label>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="btn-primary"
              >
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
