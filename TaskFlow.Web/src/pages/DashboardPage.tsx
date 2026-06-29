/**
 * DashboardPage — summary of the user's projects and tasks.
 * Shows stat cards at the top, then recent tasks, then a project list.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProjects } from '../services/projects.service';
import { getTasks } from '../services/tasks.service';
import type { Project, Task } from '../types';

/** Color dot for priority labels */
const PRIORITY_COLORS: Record<Task['priority'], string> = {
  Low:    'bg-green-400',
  Medium: 'bg-yellow-400',
  High:   'bg-red-400',
};

/** Badge colors for status labels */
const STATUS_BADGE: Record<Task['status'], string> = {
  Todo:       'bg-gray-100 text-gray-700',
  InProgress: 'bg-blue-100 text-blue-700',
  Done:       'bg-green-100 text-green-700',
};

export default function DashboardPage() {
  const { user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks]       = useState<Task[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  // Load projects and all tasks in parallel on mount
  useEffect(() => {
    async function load() {
      try {
        const [p, t] = await Promise.all([getProjects(), getTasks()]);
        setProjects(p);
        setTasks(t);
      } catch {
        setError('Failed to load dashboard data. Please refresh.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Derived stats
  const doneTasks       = tasks.filter(t => t.status === 'Done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'InProgress').length;

  // Show the 5 most recently updated tasks
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  if (loading) return <p className="text-gray-500">Loading dashboard…</p>;
  if (error)   return <p className="text-red-600">{error}</p>;

  return (
    <div className="space-y-8">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here's what's happening with your tasks today.
        </p>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Projects"    value={projects.length} color="text-primary-600" />
        <StatCard label="Total Tasks" value={tasks.length}    color="text-gray-700" />
        <StatCard label="In Progress" value={inProgressTasks} color="text-blue-600" />
        <StatCard label="Done"        value={doneTasks}        color="text-green-600" />
      </div>

      {/* Free plan limit warning */}
      {user?.plan === 'Free' && tasks.length >= 8 && (
        <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-800 flex items-center justify-between">
          <span>
            You're using <strong>{tasks.length}/10</strong> tasks on the Free plan.
          </span>
          <Link to="/billing" className="btn-primary text-xs ml-4">
            Upgrade to Pro
          </Link>
        </div>
      )}

      {/* ── Recent tasks ───────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Tasks</h2>
          <Link to="/tasks" className="text-sm text-primary-600 hover:underline">View all</Link>
        </div>

        {recentTasks.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-400 text-sm">No tasks yet.</p>
            <Link to="/tasks" className="btn-primary mt-4 inline-flex">Create your first task</Link>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <ul className="divide-y divide-gray-100">
              {recentTasks.map(task => (
                <li key={task.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  {/* Priority dot */}
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_COLORS[task.priority]}`} />

                  {/* Task info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    <p className="text-xs text-gray-400">{task.projectName}</p>
                  </div>

                  {/* Status badge */}
                  <span className={`badge ${STATUS_BADGE[task.status]}`}>
                    {task.status === 'InProgress' ? 'In Progress' : task.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── Projects overview ──────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
          <Link to="/projects" className="text-sm text-primary-600 hover:underline">Manage</Link>
        </div>

        {projects.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-400 text-sm">No projects yet.</p>
            <Link to="/projects" className="btn-primary mt-4 inline-flex">Create a project</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(project => (
              <div key={project.id} className="card flex items-start gap-4">
                {/* Color swatch */}
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                  style={{ backgroundColor: project.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{project.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {project.taskCount} {project.taskCount === 1 ? 'task' : 'tasks'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Small numeric stat card used in the summary row */
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card text-center">
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
