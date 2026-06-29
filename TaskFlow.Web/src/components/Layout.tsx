/**
 * Layout — top navigation bar + main content area.
 * Rendered inside all authenticated routes via React Router's <Outlet>.
 */
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top navigation bar ─────────────────────────────────────── */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Brand */}
            <Link to="/dashboard" className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary-600">TaskFlow</span>
              {/* Pro badge shown when user has an active Pro subscription */}
              {user?.plan === 'Pro' && (
                <span className="badge bg-primary-100 text-primary-700">Pro</span>
              )}
            </Link>

            {/* Main navigation links */}
            <div className="hidden sm:flex items-center gap-6">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${
                    isActive ? 'text-primary-600' : 'text-gray-600 hover:text-gray-900'
                  }`
                }
              >
                Dashboard
              </NavLink>

              <NavLink
                to="/projects"
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${
                    isActive ? 'text-primary-600' : 'text-gray-600 hover:text-gray-900'
                  }`
                }
              >
                Projects
              </NavLink>

              <NavLink
                to="/tasks"
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${
                    isActive ? 'text-primary-600' : 'text-gray-600 hover:text-gray-900'
                  }`
                }
              >
                Tasks
              </NavLink>

              {/* Billing link — shows current plan */}
              <NavLink
                to="/billing"
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${
                    isActive ? 'text-primary-600' : 'text-gray-600 hover:text-gray-900'
                  }`
                }
              >
                Billing
              </NavLink>

              {/* Admin link — only visible to Admin role users */}
              {user?.role === 'Admin' && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `text-sm font-medium transition-colors ${
                      isActive ? 'text-primary-600' : 'text-gray-600 hover:text-gray-900'
                    }`
                  }
                >
                  Admin
                </NavLink>
              )}
            </div>

            {/* User menu */}
            <div className="flex items-center gap-4">
              <span className="hidden sm:block text-sm text-gray-500">{user?.email}</span>
              <button onClick={handleLogout} className="btn-secondary text-xs">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Page content ───────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Child route renders here via React Router's Outlet */}
        <Outlet />
      </main>
    </div>
  );
}
