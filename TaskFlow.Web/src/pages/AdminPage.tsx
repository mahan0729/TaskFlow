/**
 * AdminPage — platform stats and user management.
 * Only reachable by users with the "Admin" role (enforced by ProtectedRoute and the API).
 */
import { useEffect, useState } from 'react';
import { getAdminStats, getAdminUsers, updateUserRole, updateUserPlan, deleteUser, createUser } from '../services/admin.service';
import { PasswordInput } from '../components/PasswordInput';
import type { AdminStats, AdminUser } from '../types';

const EMPTY_FORM = { email: '', password: '', role: 'User' as 'User' | 'Admin' };

export default function AdminPage() {
  const [stats, setStats]   = useState<AdminStats | null>(null);
  const [users, setUsers]   = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [s, u] = await Promise.all([getAdminStats(), getAdminUsers()]);
        setStats(s);
        setUsers(u);
      } catch {
        setError('Failed to load admin data.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /** Toggles a user between User and Admin roles */
  async function handleRoleToggle(user: AdminUser) {
    const newRole = user.role === 'Admin' ? 'User' : 'Admin';
    if (!confirm(`Change ${user.email}'s role to ${newRole}?`)) return;
    try {
      await updateUserRole(user.id, newRole);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
    } catch {
      setError('Failed to update role.');
    }
  }

  async function handlePlanToggle(user: AdminUser) {
    const newPlan = user.plan === 'Pro' ? 'Free' : 'Pro';
    if (!confirm(`Change ${user.email}'s plan to ${newPlan}?`)) return;
    try {
      await updateUserPlan(user.id, newPlan);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, plan: newPlan, stripeSubscriptionId: newPlan === 'Free' ? null : u.stripeSubscriptionId } : u));
    } catch {
      setError('Failed to update plan.');
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      await createUser(form.email, form.password, form.role);
      const [s, u] = await Promise.all([getAdminStats(), getAdminUsers()]);
      setStats(s);
      setUsers(u);
      setShowCreate(false);
      setForm(EMPTY_FORM);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setCreateError(msg ?? 'Failed to create user.');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(user: AdminUser) {
    if (!confirm(`Permanently delete ${user.email} and all their data?`)) return;
    try {
      await deleteUser(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
    } catch {
      setError('Failed to delete user.');
    }
  }

  if (loading) return <p className="text-gray-500">Loading admin data…</p>;

  return (
    <div className="space-y-8">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-1">Platform overview and user management.</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setCreateError(''); }}
          className="btn-primary text-sm"
        >
          + Create User
        </button>
      </div>

      {/* Create User modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Create User</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input w-full"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
                <PasswordInput
                  required
                  minLength={8}
                  value={form.password}
                  onChange={v => setForm(f => ({ ...f, password: v }))}
                  className="input w-full"
                  placeholder="Min 8 characters"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value as 'User' | 'Admin' }))}
                  className="input w-full"
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              {createError && <p className="text-xs text-red-600">{createError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={creating} className="btn-primary flex-1">
                  {creating ? 'Creating…' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setForm(EMPTY_FORM); }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}

      {/* ── Platform stats ─────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <StatCard label="Total Users"    value={stats.totalUsers}    />
          <StatCard label="Free Users"     value={stats.freeUsers}     />
          <StatCard label="Pro Users"      value={stats.proUsers}      color="text-primary-600" />
          <StatCard label="Total Projects" value={stats.totalProjects} />
          <StatCard label="Total Tasks"    value={stats.totalTasks}    />
        </div>
      )}

      {/* ── User table ─────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Users ({users.length})</h2>

        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Email', 'Role', 'Plan', 'Projects', 'Tasks', 'Joined'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                  <th className="sticky right-0 bg-gray-50 border-l border-gray-200 text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-gray-900 font-medium">
                        {user.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : <span className="text-gray-400 italic text-xs">No name set</span>}
                      </p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </td>

                    {/* Role badge */}
                    <td className="px-4 py-3">
                      <span className={`badge ${user.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                        {user.role}
                      </span>
                    </td>

                    {/* Plan badge — hover to see Stripe subscription ID */}
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${user.plan === 'Pro' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}
                        title={user.stripeSubscriptionId ?? undefined}
                      >
                        {user.plan}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-gray-600">{user.projectCount}</td>
                    <td className="px-4 py-3 text-gray-600">{user.taskCount}</td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>

                    {/* Sticky Actions */}
                    <td className="sticky right-0 bg-white border-l border-gray-100 px-4 py-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleRoleToggle(user)}
                          className="text-xs text-primary-600 hover:underline whitespace-nowrap"
                        >
                          {user.role === 'Admin' ? 'Remove Admin' : 'Make Admin'}
                        </button>
                        <button
                          onClick={() => handlePlanToggle(user)}
                          className="text-xs text-emerald-600 hover:underline whitespace-nowrap"
                        >
                          {user.plan === 'Pro' ? 'Set Free' : 'Set Pro'}
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = 'text-gray-900' }: { label: string; value: number; color?: string }) {
  return (
    <div className="card text-center">
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
