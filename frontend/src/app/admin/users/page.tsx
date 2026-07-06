'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';
import { IconPlus, IconEdit, IconAlertCircle, IconUsers } from '@/components/ui/Icons';
import { EmptyState } from '@/components/ui/EmptyState';
import type { User, UserRole, CreateUserPayload } from '@/types';

export default function AdminUsersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<CreateUserPayload>({
    email: '',
    password: '',
    name: '',
    role: 'staff',
  });

  const { data: users, isLoading, isError, error } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => userApi.list(),
    enabled: isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateUserPayload) => userApi.create(data),
    onSuccess: () => {
      toast('User created', 'success');
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateUserPayload> }) => userApi.update(id, data),
    onSuccess: () => {
      toast('User updated', 'success');
      setEditUser(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => userApi.deactivate(id),
    onSuccess: () => {
      toast('User deactivated', 'success');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  if (!isAdmin) {
    return (
      <div className="card p-8 text-center space-y-3">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <IconAlertCircle size={24} className="text-[var(--color-error)]" />
          </div>
        </div>
        <p className="text-[var(--color-error)] font-medium">Access denied</p>
        <p className="text-sm text-[var(--color-text-muted)]">This section is restricted to administrators only.</p>
      </div>
    );
  }

  const openEdit = (user: User) => {
    setEditUser(user);
    setFormData({ email: user.email, password: '', name: user.name, role: user.role });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (editUser) {
      const { password, ...rest } = formData;
      updateMutation.mutate({
        id: editUser.id,
        data: password ? { ...rest, password } : rest,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">User Management</h2>
        <button
          onClick={() => { setEditUser(null); setFormData({ email: '', password: '', name: '', role: 'staff' }); setShowModal(true); }}
          className="btn-primary flex items-center gap-1.5"
        >
          <IconPlus size={16} /> Add User
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
          <p className="text-[var(--color-error)] font-medium">Failed to load users</p>
          <p className="text-sm text-[var(--color-text-muted)]">{error instanceof Error ? error.message : ''}</p>
        </div>
      )}

      {users && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-[var(--color-surface-overlay)]">
                <th className="text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase px-4 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase px-4 py-3">Email</th>
                <th className="text-center text-xs font-semibold text-[var(--color-text-muted)] uppercase px-4 py-3">Role</th>
                <th className="text-center text-xs font-semibold text-[var(--color-text-muted)] uppercase px-4 py-3">Active</th>
                <th className="text-right text-xs font-semibold text-[var(--color-text-muted)] uppercase px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12">
                    <EmptyState icon={IconUsers} title="No users found" description="Invite team members to get started." />
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 hover:bg-[var(--color-surface-overlay)] transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-center capitalize">{user.role}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block w-2 h-2 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(user)} className="btn-ghost mr-1" title="Edit">
                        <IconEdit size={16} />
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
              {editUser ? 'Edit User' : 'Add User'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Name</label>
                <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Password {editUser && '(leave blank to keep current)'}
                </label>
                <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="input-field"
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
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
