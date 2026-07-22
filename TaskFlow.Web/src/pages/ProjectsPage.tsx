/**
 * ProjectsPage — lists all projects with create, edit, and delete actions.
 * Uses an inline modal form for create/edit to avoid extra route complexity.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { getProjects, createProject, updateProject, deleteProject } from '../services/projects.service';
import { Tooltip } from '../components/Tooltip';
import type { Project } from '../types';

/** Preset color swatches the user can pick for a project */
const COLOR_SWATCHES = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6',
];

/** Default form state for a new project */
const EMPTY_FORM = { name: '', description: '', color: '#6366f1' };

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  // Modal state — null means the modal is closed
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showModal, setShowModal]           = useState(false);
  const [form, setForm]                     = useState(EMPTY_FORM);
  const [saving, setSaving]                 = useState(false);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      setLoading(true);
      const data = await getProjects();
      setProjects(data);
    } catch {
      setError('Failed to load projects.');
    } finally {
      setLoading(false);
    }
  }

  /** Opens the modal pre-filled for editing, or blank for creating */
  function openModal(project?: Project) {
    if (project) {
      setEditingProject(project);
      setForm({ name: project.name, description: project.description ?? '', color: project.color });
    } else {
      setEditingProject(null);
      setForm(EMPTY_FORM);
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingProject(null);
    setForm(EMPTY_FORM);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingProject) {
        // Update existing project
        const updated = await updateProject(editingProject.id, form);
        setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
      } else {
        // Create new project
        const created = await createProject(form);
        setProjects(prev => [...prev, created]);
      }
      closeModal();
    } catch {
      setError('Failed to save project. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(project: Project) {
    if (!confirm(`Delete "${project.name}" and all its tasks? This cannot be undone.`)) return;
    try {
      await deleteProject(project.id);
      setProjects(prev => prev.filter(p => p.id !== project.id));
    } catch {
      setError('Failed to delete project.');
    }
  }

  if (loading) return <p className="text-gray-500">Loading projects…</p>;

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          + New Project
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Project grid */}
      {projects.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400">No projects yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <div key={project.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                {/* Color swatch + name */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  <h3 className="font-semibold text-gray-900">{project.name}</h3>
                </div>

                {/* Actions */}
                <div className="flex gap-2 ml-2">
                  <Tooltip text="Edit project name, description, or color" position="top">
                    <button
                      onClick={() => openModal(project)}
                      className="text-xs text-gray-400 hover:text-primary-600 transition-colors"
                    >
                      Edit
                    </button>
                  </Tooltip>
                  <Tooltip text="Permanently delete this project and all its tasks" position="top">
                    <button
                      onClick={() => handleDelete(project)}
                      className="text-xs text-gray-400 hover:text-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </Tooltip>
                </div>
              </div>

              {/* Description */}
              {project.description && (
                <p className="mt-2 text-sm text-gray-500 line-clamp-2">{project.description}</p>
              )}

              {/* Task count footer */}
              <p className="mt-4 text-xs text-gray-400">
                {project.taskCount} {project.taskCount === 1 ? 'task' : 'tasks'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Create / Edit modal ───────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingProject ? 'Edit Project' : 'New Project'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Website Redesign"
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
                  placeholder="Optional project description…"
                />
              </div>

              {/* Color picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_SWATCHES.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, color }))}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        form.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving…' : editingProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
