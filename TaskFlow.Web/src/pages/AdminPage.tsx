/**
 * AdminPage — tabbed admin panel.
 * Tabs: Overview | Users | Projects | Downloads | Billing
 * Only reachable by users with the "Admin" role.
 */
import { useEffect, useState } from 'react';
import {
  getAdminStats, getAdminUsers, getAdminProjects,
  updateUserRole, updateUserPlan, deleteUser,
  createUser, editUser, sendDownloadEmail, sendDownloadEmailToAddress,
} from '../services/admin.service';
import { PasswordInput } from '../components/PasswordInput';
import { Tooltip } from '../components/Tooltip';
import type { AdminStats, AdminUser, AdminProject } from '../types';

type AdminTab = 'overview' | 'users' | 'projects' | 'downloads' | 'billing';

const TABS: { id: AdminTab; label: string }[] = [
  { id: 'overview',   label: 'Overview'   },
  { id: 'users',      label: 'Users'      },
  { id: 'projects',   label: 'Projects'   },
  { id: 'downloads',  label: 'Download Emails' },
  { id: 'billing',    label: 'Billing'    },
];

const EMPTY_FORM = { email: '', password: '', role: 'User' as 'User' | 'Admin', sendDownload: false };

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('overview');

  const [stats,    setStats]    = useState<AdminStats | null>(null);
  const [users,    setUsers]    = useState<AdminUser[]>([]);
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  // Create User modal
  const [showCreate,   setShowCreate]   = useState(false);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [creating,     setCreating]     = useState(false);
  const [createError,  setCreateError]  = useState('');

  // Edit User modal
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editForm,    setEditForm]    = useState({ firstName: '', lastName: '' });
  const [editSaving,  setEditSaving]  = useState(false);
  const [editError,   setEditError]   = useState('');

  // Downloads — existing users
  const [sending,   setSending]   = useState<number | null>(null);
  const [sentSet,   setSentSet]   = useState<Set<number>>(new Set());
  const [sendError, setSendError] = useState('');

  // Downloads — free-form (any email)
  const [freeEmail,    setFreeEmail]    = useState('');
  const [freeName,     setFreeName]     = useState('');
  const [freeSending,  setFreeSending]  = useState(false);
  const [freeSent,     setFreeSent]     = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [s, u, p] = await Promise.all([getAdminStats(), getAdminUsers(), getAdminProjects()]);
        setStats(s);
        setUsers(u);
        setProjects(p);
      } catch {
        setError('Failed to load admin data.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleRoleToggle(user: AdminUser) {
    const newRole = user.role === 'Admin' ? 'User' : 'Admin';
    if (!confirm(`Change ${user.email}'s role to ${newRole}?`)) return;
    try {
      await updateUserRole(user.id, newRole);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
    } catch { setError('Failed to update role.'); }
  }

  async function handlePlanToggle(user: AdminUser) {
    const newPlan = user.plan === 'Pro' ? 'Free' : 'Pro';
    if (!confirm(`Change ${user.email}'s plan to ${newPlan}?`)) return;
    try {
      await updateUserPlan(user.id, newPlan);
      setUsers(prev => prev.map(u => u.id === user.id
        ? { ...u, plan: newPlan, stripeSubscriptionId: newPlan === 'Free' ? null : u.stripeSubscriptionId }
        : u));
    } catch { setError('Failed to update plan.'); }
  }

  function openEdit(user: AdminUser) {
    setEditingUser(user);
    setEditForm({ firstName: user.firstName ?? '', lastName: user.lastName ?? '' });
    setEditError('');
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setEditSaving(true);
    setEditError('');
    try {
      await editUser(editingUser.id, editForm.firstName, editForm.lastName);
      setUsers(prev => prev.map(u => u.id === editingUser.id
        ? { ...u, firstName: editForm.firstName || null, lastName: editForm.lastName || null }
        : u));
      setEditingUser(null);
    } catch { setEditError('Failed to save.'); }
    finally { setEditSaving(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      const created = await createUser(form.email, form.password, form.role);
      if (form.sendDownload && created?.id) {
        await sendDownloadEmail(created.id);
      }
      const [s, u] = await Promise.all([getAdminStats(), getAdminUsers()]);
      setStats(s);
      setUsers(u);
      setShowCreate(false);
      setForm(EMPTY_FORM);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setCreateError(msg ?? 'Failed to create user.');
    } finally { setCreating(false); }
  }

  async function handleDelete(user: AdminUser) {
    if (!confirm(`Permanently delete ${user.email} and all their data?`)) return;
    try {
      await deleteUser(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
    } catch { setError('Failed to delete user.'); }
  }

  async function handleFreeFormSend(e: React.FormEvent) {
    e.preventDefault();
    setFreeSending(true);
    setFreeSent(false);
    setSendError('');
    try {
      await sendDownloadEmailToAddress(freeEmail, freeName);
      setFreeSent(true);
      setFreeEmail('');
      setFreeName('');
    } catch { setSendError('Failed to send email.'); }
    finally { setFreeSending(false); }
  }

  async function handleSendDownload(user: AdminUser) {
    setSending(user.id);
    setSendError('');
    try {
      await sendDownloadEmail(user.id);
      setSentSet(prev => new Set(prev).add(user.id));
    } catch { setSendError(`Failed to send to ${user.email}.`); }
    finally { setSending(null); }
  }

  if (loading) return <p className="text-gray-500">Loading admin data…</p>;

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-sm text-gray-500 mt-1">Platform overview and management.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}

      {/* ── Overview tab ─────────────────────────────────────────────── */}
      {tab === 'overview' && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <StatCard label="Total Users"    value={stats.totalUsers}    />
          <StatCard label="Free Users"     value={stats.freeUsers}     />
          <StatCard label="Pro Users"      value={stats.proUsers}      color="text-primary-600" />
          <StatCard label="Total Projects" value={stats.totalProjects} />
          <StatCard label="Total Tasks"    value={stats.totalTasks}    />
        </div>
      )}

      {/* ── Users tab ────────────────────────────────────────────────── */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => { setShowCreate(true); setCreateError(''); }}
              className="btn-primary text-sm"
            >
              + Create User
            </button>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Email', 'Role', 'Projects', 'Tasks', 'Joined'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                    <th className="sticky right-0 bg-gray-50 border-l border-gray-200 text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-gray-900 font-medium">
                          {user.firstName
                            ? `${user.firstName} ${user.lastName ?? ''}`.trim()
                            : <span className="text-gray-400 italic text-xs">No name set</span>}
                        </p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${user.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{user.projectCount}</td>
                      <td className="px-4 py-3 text-gray-600">{user.taskCount}</td>
                      <td className="px-4 py-3 text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="sticky right-0 bg-white border-l border-gray-100 px-4 py-3">
                        <div className="flex gap-3">
                          <Tooltip text="Edit name" position="top">
                            <button onClick={() => openEdit(user)} className="text-xs text-gray-500 hover:underline whitespace-nowrap">Edit</button>
                          </Tooltip>
                          <Tooltip text={user.role === 'Admin' ? 'Remove admin privileges' : 'Grant admin access'} position="top">
                            <button onClick={() => handleRoleToggle(user)} className="text-xs text-primary-600 hover:underline whitespace-nowrap">
                              {user.role === 'Admin' ? 'Remove Admin' : 'Make Admin'}
                            </button>
                          </Tooltip>
                          <Tooltip text="Permanently delete this user and all their data" position="top">
                            <button onClick={() => handleDelete(user)} className="text-xs text-red-500 hover:underline">Delete</button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Projects tab ─────────────────────────────────────────────── */}
      {tab === 'projects' && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Project', 'Owner', 'Tasks', 'Created'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {projects.map(project => (
                  <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
                        <span className="font-medium text-gray-900">{project.name}</span>
                      </div>
                      {project.description && (
                        <p className="text-xs text-gray-400 mt-0.5 ml-5 line-clamp-1">{project.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900">
                        {project.ownerFirstName
                          ? `${project.ownerFirstName} ${project.ownerLastName ?? ''}`.trim()
                          : project.ownerEmail}
                      </p>
                      {project.ownerFirstName && (
                        <p className="text-xs text-gray-400">{project.ownerEmail}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{project.taskCount}</td>
                    <td className="px-4 py-3 text-gray-400">{new Date(project.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {projects.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-xs">No projects yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Downloads tab ────────────────────────────────────────────── */}
      {tab === 'downloads' && (
        <div className="space-y-6">

          {/* Free-form send — any email address */}
          <div className="card space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Send to anyone</h3>
            <p className="text-xs text-gray-500">Send the Windows download link to any email address — the recipient does not need a TaskFlow account.</p>
            <form onSubmit={handleFreeFormSend} className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-48">
                <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={freeEmail}
                  onChange={e => { setFreeEmail(e.target.value); setFreeSent(false); }}
                  className="input w-full"
                  placeholder="recipient@example.com"
                />
              </div>
              <div className="flex-1 min-w-40">
                <label className="block text-xs font-medium text-gray-600 mb-1">Name (optional)</label>
                <input
                  type="text"
                  value={freeName}
                  onChange={e => setFreeName(e.target.value)}
                  className="input w-full"
                  placeholder="First name"
                />
              </div>
              <button type="submit" disabled={freeSending} className="btn-primary whitespace-nowrap">
                {freeSending ? 'Sending…' : 'Send Download Link'}
              </button>
            </form>
            {freeSent && <p className="text-xs text-green-600">Download link sent successfully.</p>}
          </div>

          {/* Existing users */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Send to existing users</h3>
          {sendError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{sendError}</div>
          )}
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['User', 'Joined', 'Windows'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">
                        {user.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : user.email}
                      </p>
                      {user.firstName && <p className="text-xs text-gray-400">{user.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleSendDownload(user)}
                        disabled={sending === user.id}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${
                          sentSet.has(user.id)
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-white text-primary-600 border-primary-200 hover:bg-primary-50'
                        }`}
                      >
                        {sending === user.id ? 'Sending…' : sentSet.has(user.id) ? 'Sent ✓' : 'Send Download Link'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      )}

      {/* ── Billing tab ──────────────────────────────────────────────── */}
      {tab === 'billing' && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['User', 'Plan', 'Joined'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                  <th className="sticky right-0 bg-gray-50 border-l border-gray-200 text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">
                        {user.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : user.email}
                      </p>
                      {user.firstName && <p className="text-xs text-gray-400">{user.email}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <Tooltip
                        text={user.stripeSubscriptionId ? `Stripe: ${user.stripeSubscriptionId}` : user.plan === 'Pro' ? 'Pro — manually set' : 'Free plan'}
                        position="top"
                      >
                        <span className={`badge ${user.plan === 'Pro' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>
                          {user.plan}
                        </span>
                      </Tooltip>
                      {user.stripeCustomerId && (
                        <p className="text-xs text-gray-400 mt-0.5">Customer: {user.stripeCustomerId}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="sticky right-0 bg-white border-l border-gray-100 px-4 py-3">
                      <Tooltip text={user.plan === 'Pro' ? 'Downgrade to Free plan' : 'Upgrade to Pro without Stripe'} position="top">
                        <button onClick={() => handlePlanToggle(user)} className={`text-xs hover:underline whitespace-nowrap ${user.plan === 'Pro' ? 'text-gray-500' : 'text-emerald-600'}`}>
                          {user.plan === 'Pro' ? 'Set Free' : 'Set Pro'}
                        </button>
                      </Tooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Create User modal ─────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Create User</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input w-full" placeholder="user@example.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
                <PasswordInput required minLength={8} value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} className="input w-full" placeholder="Min 8 characters" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as 'User' | 'Admin' }))} className="input w-full">
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.sendDownload}
                  onChange={e => setForm(f => ({ ...f, sendDownload: e.target.checked }))}
                  className="rounded border-gray-300 text-primary-600"
                />
                <span className="text-xs text-gray-600">Send Windows download link email</span>
              </label>
              {createError && <p className="text-xs text-red-600">{createError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={creating} className="btn-primary flex-1">{creating ? 'Creating…' : 'Create'}</button>
                <button type="button" onClick={() => { setShowCreate(false); setForm(EMPTY_FORM); }} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit User modal ───────────────────────────────────────────── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Edit User</h2>
            <p className="text-xs text-gray-400">{editingUser.email}</p>
            <form onSubmit={handleEditSave} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">First Name</label>
                <input type="text" value={editForm.firstName} onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))} className="input w-full" placeholder="First name" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
                <input type="text" value={editForm.lastName} onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))} className="input w-full" placeholder="Last name" />
              </div>
              {editError && <p className="text-xs text-red-600">{editError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={editSaving} className="btn-primary flex-1">{editSaving ? 'Saving…' : 'Save'}</button>
                <button type="button" onClick={() => setEditingUser(null)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
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
