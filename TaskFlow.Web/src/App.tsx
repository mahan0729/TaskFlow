/**
 * App — root component that wires up routing and global providers.
 *
 * Route structure:
 *   /               → redirects to /dashboard
 *   /login          → LoginPage (public)
 *   /register       → RegisterPage (public)
 *   /dashboard      → DashboardPage (protected)
 *   /projects       → ProjectsPage (protected)
 *   /tasks          → TasksPage (protected)
 *   /billing        → BillingPage (protected)
 *   /admin          → AdminPage (protected, Admin role only)
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage  from './pages/ProjectsPage';
import TasksPage     from './pages/TasksPage';
import BillingPage   from './pages/BillingPage';
import AdminPage     from './pages/AdminPage';

export default function App() {
  return (
    /* AuthProvider wraps the entire tree so any component can call useAuth() */
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public routes ──────────────────────────────────────── */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ── Protected routes (any authenticated user) ──────────── */}
          <Route element={<ProtectedRoute />}>
            {/* Layout provides the nav bar; child pages render via <Outlet /> */}
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/projects"  element={<ProjectsPage />} />
              <Route path="/tasks"     element={<TasksPage />} />
              <Route path="/billing"   element={<BillingPage />} />
            </Route>
          </Route>

          {/* ── Admin-only routes ──────────────────────────────────── */}
          <Route element={<ProtectedRoute requiredRole="Admin" />}>
            <Route element={<Layout />}>
              <Route path="/admin" element={<AdminPage />} />
            </Route>
          </Route>

          {/* ── Default redirect ───────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
