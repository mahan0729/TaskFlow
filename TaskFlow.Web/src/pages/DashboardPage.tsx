/**
 * DashboardPage — summary stats, recent tasks, and project overview.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProjects } from '../services/projects.service';
import { getTasks } from '../services/tasks.service';
import type { Project, Task } from '../types';

const PRIORITY_DOT: Record<Task['priority'], string> = {
  Low:    'bg-emerald-400',
  Medium: 'bg-amber-400',
  High:   'bg-red-400',
};

const STATUS_BADGE: Record<Task['status'], string> = {
  Todo:       'bg-gray-100 text-gray-600',
  InProgress: 'bg-blue-100 text-blue-700',
  Done:       'bg-emerald-100 text-emerald-700',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks]       = useState<Task[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

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

  const doneTasks       = tasks.filter(t => t.status === 'Done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'InProgress').length;

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  if (loading) return <LoadingState />;
  if (error)   return <p className="text-red-500">{error}</p>;

  const firstName = user?.firstName ?? user?.email?.split('@')[0] ?? 'there';

  return (
    <div className="space-y-8">

      {/* ── Page header ────────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-black text-gray-900">
          Good {getGreeting()}, <Link to="/profile" className="text-primary-600 hover:underline">{firstName}</Link> 👋
        </h1>
        <p className="mt-1 text-gray-500">Here's what's happening with your work today.</p>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Projects"    value={projects.length}  accent="from-blue-500 to-blue-600" />
        <StatCard label="Total Tasks" value={tasks.length}     accent="from-violet-500 to-violet-600" />
        <StatCard label="In Progress" value={inProgressTasks}  accent="from-amber-500 to-orange-500" />
        <StatCard label="Completed"   value={doneTasks}         accent="from-emerald-500 to-teal-500" />
      </div>

      {/* Free plan warning */}
      {user?.plan === 'Free' && tasks.length >= 8 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <div>
            <p className="font-semibold text-amber-800 text-sm">Approaching task limit</p>
            <p className="text-amber-600 text-xs mt-0.5">
              {tasks.length}/10 tasks used on the Free plan.
            </p>
          </div>
          <Link to="/billing" className="btn-primary text-xs">Upgrade to Pro</Link>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">

        {/* ── Recent tasks (3/5 width) ──────────────────────────────── */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Recent Tasks</h2>
            <Link to="/tasks" className="text-sm text-primary-600 font-medium hover:underline">
              View all →
            </Link>
          </div>

          {recentTasks.length === 0 ? (
            <EmptyState
              message="No tasks yet"
              action={<Link to="/tasks" className="btn-primary text-sm mt-3">Create your first task</Link>}
            />
          ) : (
            <div className="card p-0 overflow-hidden">
              <ul className="divide-y divide-gray-50">
                {recentTasks.map(task => (
                  <li key={task.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{task.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{task.projectName}</p>
                    </div>
                    <span className={`badge ${STATUS_BADGE[task.status]}`}>
                      {task.status === 'InProgress' ? 'In Progress' : task.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ── Projects sidebar (2/5 width) ──────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Projects</h2>
            <Link to="/projects" className="text-sm text-primary-600 font-medium hover:underline">
              Manage →
            </Link>
          </div>

          {projects.length === 0 ? (
            <EmptyState
              message="No projects yet"
              action={<Link to="/projects" className="btn-primary text-sm mt-3">New Project</Link>}
            />
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 6).map(project => (
                <div key={project.id} className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
                  {/* Color circle */}
                  <div
                    className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: project.color + '22', border: `2px solid ${project.color}40` }}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{project.name}</p>
                    <p className="text-xs text-gray-400">
                      {project.taskCount} {project.taskCount === 1 ? 'task' : 'tasks'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Gradient stat card */
function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${accent} p-5 shadow-md`}>
      <p className="text-3xl font-black text-white">{value}</p>
      <p className="text-sm text-white/80 mt-1 font-medium">{label}</p>
    </div>
  );
}

/** Empty state with centered message and optional action */
function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
        <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p className="text-gray-400 text-sm font-medium">{message}</p>
      {action}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-10 bg-gray-200 rounded-xl w-64" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-2xl" />)}
      </div>
      <div className="h-64 bg-gray-200 rounded-2xl" />
    </div>
  );
}

/** Returns a time-appropriate greeting */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
