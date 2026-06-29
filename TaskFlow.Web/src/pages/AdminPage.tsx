/**
 * AdminPage — platform stats and user management.
 * Only reachable by users with the "Admin" role (enforced by ProtectedRoute and the API).
 */
import { useEffect, useState } from 'react';
import { getAdminStats, getAdminUsers, updateUserRole, deleteUser } from '../services/admin.service';
import type { AdminStats, AdminUser } from '../types';

export default function AdminPage() {
  const [stats, setStats]   = useState<AdminStats | null>(null);
  const [users, setUsers]   = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-sm text-gray-500 mt-1">Platform overview and user management.</p>
      </div>

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
                  {['Email', 'Role', 'Plan', 'Projects', 'Tasks', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-900 font-medium">{user.email}</td>

                    {/* Role badge */}
                    <td className="px-4 py-3">
                      <span className={`badge ${user.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                        {user.role}
                      </span>
                    </td>

                    {/* Plan badge */}
                    <td className="px-4 py-3">
                      <span className={`badge ${user.plan === 'Pro' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>
                        {user.plan}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-gray-600">{user.projectCount}</td>
                    <td className="px-4 py-3 text-gray-600">{user.taskCount}</td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleRoleToggle(user)}
                          className="text-xs text-primary-600 hover:underline"
                        >
                          {user.role === 'Admin' ? 'Remove Admin' : 'Make Admin'}
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
