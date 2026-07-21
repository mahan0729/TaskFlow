/**
 * Layout — dark navy sidebar + blue-tinted content area.
 * The sidebar collapses to icons only on small screens (future enhancement).
 */
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Icon components — inline SVG to avoid an icon library dependency */
const Icons = {
  Dashboard: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Projects: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  Tasks: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  Billing: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  Admin: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-sky-50 to-violet-50">

      {/* ── Dark navy sidebar ─────────────────────────────────────── */}
      <aside className="w-64 flex-shrink-0 flex flex-col bg-slate-900 shadow-2xl">

        {/* Brand */}
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
              <span className="text-sm font-black text-white">TF</span>
            </div>
            <div>
              <p className="text-white font-bold text-base leading-none">TaskFlow</p>
              {/* Plan badge */}
              <span className={`text-xs font-semibold ${user?.plan === 'Pro' ? 'text-blue-400' : 'text-slate-400'}`}>
                {user?.plan ?? 'Free'} Plan
              </span>
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <SideLink to="/dashboard" icon={<Icons.Dashboard />} label="Dashboard" />
          <SideLink to="/projects"  icon={<Icons.Projects />}  label="Projects" />
          <SideLink to="/tasks"     icon={<Icons.Tasks />}     label="Tasks" />
          <SideLink to="/billing"   icon={<Icons.Billing />}   label="Billing" />

          {/* Admin link — only shown to Admin role users */}
          {user?.role === 'Admin' && (
            <SideLink to="/admin" icon={<Icons.Admin />} label="Admin Panel" />
          )}
        </nav>

        {/* User footer */}
        <div className="px-3 py-4 border-t border-white/10">
          {/* Clickable name / email → profile page */}
          <Link
            to="/profile"
            className="block px-4 py-2 mb-1 rounded-lg hover:bg-white/5 transition-colors group"
            title="Edit your profile"
          >
            <p className="text-sm text-white font-medium truncate group-hover:text-blue-200 transition-colors">
              {user?.firstName
                ? `${user.firstName} ${user.lastName ?? ''}`.trim()
                : user?.email}
            </p>
            {user?.firstName && (
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            )}
            {user?.role === 'Admin' && (
              <span className="text-xs text-purple-400 font-semibold">Admin</span>
            )}
          </Link>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="nav-link w-full text-left text-red-300 hover:bg-red-500/10 hover:text-red-200"
          >
            <Icons.Logout />
            Sign out
          </button>

          {/* Copyright */}
          <p className="mt-3 px-4 text-xs text-slate-600 select-none">
            &copy; {new Date().getFullYear()} Matt Mahan
          </p>
        </div>
      </aside>

      {/* ── Main content area ─────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

/** Individual sidebar navigation link */
function SideLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `nav-link ${isActive ? 'nav-link-active' : ''}`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}
