/**
 * TasksPage — filterable task list with create/edit/delete.
 * Tasks are displayed as cards grouped by status column (Todo / In Progress / Done).
 * Free plan users see a paywall banner when they hit the 10-task limit.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { getTasks, createTask, updateTask, deleteTask } from '../services/tasks.service';
import { getProjects } from '../services/projects.service';
import { useAuth } from '../context/AuthContext';
import type { Task, Project } from '../types';

const STATUSES: Task['status'][] = ['Todo', 'InProgress', 'Done'];
const PRIORITIES: Task['priority'][] = ['Low', 'Medium', 'High'];

/** Tailwind classes for priority badges */
const PRIORITY_BADGE: Record<Task['priority'], string> = {
  Low:    'bg-green-100 text-green-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  High:   'bg-red-100 text-red-700',
};

/** Default form for creating a new task */
const EMPTY_FORM = {
  projectId: 0,
  title: '',
  description: '',
  priority: 'Medium' as Task['priority'],
  status: 'Todo' as Task['status'],
  dueDate: '',
};

/** Free plan task limit — must match AuthService.FreeTaskLimit on the API */
const FREE_LIMIT = 10;

export default function TasksPage() {
  const { user } = useAuth();

  const [tasks, setTasks]       = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  // Filter bar state
  const [filterProject, setFilterProject] = useState<number | ''>('');
  const [filterStatus,  setFilterStatus]  = useState<Task['status'] | ''>('');
  const [filterPriority, setFilterPriority] = useState<Task['priority'] | ''>('');

  // Modal state
  const [showModal, setShowModal]         = useState(false);
  const [editingTask, setEditingTask]     = useState<Task | null>(null);
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [saving, setSaving]               = useState(false);
  const [hitLimit, setHitLimit]           = useState(false);

  // Load tasks and projects on mount
  useEffect(() => {
    async function load() {
      try {
        const [t, p] = await Promise.all([getTasks(), getProjects()]);
        setTasks(t);
        setProjects(p);
        // Set default project in form to the first available project
        if (p.length > 0) setForm(f => ({ ...f, projectId: p[0].id }));
      } catch {
        setError('Failed to load tasks.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Apply client-side filters for instant UI feedback (server also supports query params)
  const filtered = tasks.filter(t => {
    if (filterProject && t.projectId !== filterProject) return false;
    if (filterStatus  && t.status   !== filterStatus)   return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  /** Tasks grouped by status for the kanban-style columns */
  function tasksByStatus(status: Task['status']) {
    return filtered.filter(t => t.status === status);
  }

  function openModal(task?: Task) {
    setHitLimit(false);
    if (task) {
      setEditingTask(task);
      setForm({
        projectId:   task.projectId,
        title:       task.title,
        description: task.description ?? '',
        priority:    task.priority,
        status:      task.status,
        dueDate:     task.dueDate ? task.dueDate.split('T')[0] : '',
      });
    } else {
      // Check Free plan limit before opening the create form
      if (user?.plan === 'Free' && tasks.length >= FREE_LIMIT) {
        setHitLimit(true);
        setShowModal(true);
        return;
      }
      setEditingTask(null);
      setForm({ ...EMPTY_FORM, projectId: projects[0]?.id ?? 0 });
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingTask(null);
    setHitLimit(false);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        dueDate: form.dueDate || undefined,
      };

      if (editingTask) {
        const updated = await updateTask(editingTask.id, payload);
        setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
      } else {
        const created = await createTask(payload);
        setTasks(prev => [...prev, created]);
      }
      closeModal();
    } catch (err: unknown) {
      // 402 means Free plan limit reached (race condition if multiple tabs)
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 402) {
        setHitLimit(true);
      } else {
        setError('Failed to save task. Please try again.');
        closeModal();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(task: Task) {
    if (!confirm(`Delete "${task.title}"?`)) return;
    try {
      await deleteTask(task.id);
      setTasks(prev => prev.filter(t => t.id !== task.id));
    } catch {
      setError('Failed to delete task.');
    }
  }

  if (loading) return <p className="text-gray-500">Loading tasks…</p>;

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500 mt-1">
            {tasks.length}{user?.plan === 'Free' ? `/${FREE_LIMIT}` : ''} tasks
          </p>
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          + New Task
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}

      {/* ── Filter bar ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        {/* Project filter */}
        <select
          className="input w-auto text-sm"
          value={filterProject}
          onChange={e => setFilterProject(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        {/* Status filter */}
        <select
          className="input w-auto text-sm"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as Task['status'] | '')}
        >
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s === 'InProgress' ? 'In Progress' : s}</option>)}
        </select>

        {/* Priority filter */}
        <select
          className="input w-auto text-sm"
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value as Task['priority'] | '')}
        >
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        {/* Clear filters */}
        {(filterProject || filterStatus || filterPriority) && (
          <button
            className="text-sm text-gray-400 hover:text-gray-600"
            onClick={() => { setFilterProject(''); setFilterStatus(''); setFilterPriority(''); }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ── Kanban columns ─────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-3 gap-6">
        {STATUSES.map(status => (
          <div key={status}>
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-semibold text-gray-700">
                {status === 'InProgress' ? 'In Progress' : status}
              </h2>
              <span className="badge bg-gray-100 text-gray-600">
                {tasksByStatus(status).length}
              </span>
            </div>

            {/* Task cards */}
            <div className="space-y-3">
              {tasksByStatus(status).map(task => (
                <div key={task.id} className="card p-4 hover:shadow-md transition-shadow">
                  {/* Title + actions */}
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 leading-snug">{task.title}</p>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => openModal(task)}
                        className="text-xs text-gray-400 hover:text-primary-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(task)}
                        className="text-xs text-gray-400 hover:text-red-500"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {/* Description preview */}
                  {task.description && (
                    <p className="mt-1 text-xs text-gray-400 line-clamp-2">{task.description}</p>
                  )}

                  {/* Footer: project name + priority badge + due date */}
                  <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs text-gray-400 truncate">{task.projectName}</span>
                    <div className="flex items-center gap-2">
                      {task.dueDate && (
                        <span className="text-xs text-gray-400">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      <span className={`badge ${PRIORITY_BADGE[task.priority]}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {tasksByStatus(status).length === 0 && (
                <p className="text-xs text-gray-300 text-center py-4">Empty</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Create / Edit modal ───────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">

            {/* Free plan paywall — shown instead of the form */}
            {hitLimit ? (
              <div className="text-center py-4">
                <p className="text-lg font-semibold text-gray-900 mb-2">Task limit reached</p>
                <p className="text-sm text-gray-500 mb-6">
                  Free accounts are limited to {FREE_LIMIT} tasks. Upgrade to Pro for unlimited tasks.
                </p>
                <div className="flex gap-3 justify-center">
                  <button onClick={closeModal} className="btn-secondary">Cancel</button>
                  <Link to="/billing" onClick={closeModal} className="btn-primary">
                    Upgrade to Pro
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingTask ? 'Edit Task' : 'New Task'}
                </h2>

                <form onSubmit={handleSave} className="space-y-4">
                  {/* Project */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
                    <select
                      required
                      className="input"
                      value={form.projectId}
                      onChange={e => setForm(f => ({ ...f, projectId: Number(e.target.value) }))}
                    >
                      <option value={0} disabled>Select a project</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      required
                      className="input"
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="What needs to be done?"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      rows={3}
                      className="input resize-none"
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Optional details…"
                    />
                  </div>

                  {/* Priority + Status row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <select
                        className="input"
                        value={form.priority}
                        onChange={e => setForm(f => ({ ...f, priority: e.target.value as Task['priority'] }))}
                      >
                        {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        className="input"
                        value={form.status}
                        onChange={e => setForm(f => ({ ...f, status: e.target.value as Task['status'] }))}
                      >
                        {STATUSES.map(s => (
                          <option key={s} value={s}>{s === 'InProgress' ? 'In Progress' : s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Due date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      className="input"
                      value={form.dueDate}
                      onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
                    <button type="submit" disabled={saving} className="btn-primary flex-1">
                      {saving ? 'Saving…' : editingTask ? 'Save Changes' : 'Create Task'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
