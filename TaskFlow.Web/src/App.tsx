import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage          from './pages/LoginPage';
import RegisterPage       from './pages/RegisterPage';
import VerifyEmailPage    from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage  from './pages/ResetPasswordPage';
import DashboardPage      from './pages/DashboardPage';
import ProjectsPage       from './pages/ProjectsPage';
import TasksPage          from './pages/TasksPage';
import BillingPage        from './pages/BillingPage';
import ProfilePage        from './pages/ProfilePage';
import AdminPage          from './pages/AdminPage';
import HelpPage           from './pages/HelpPage';
import DownloadPage       from './pages/DownloadPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public routes ──────────────────────────────────────── */}
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/verify-email"    element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password"  element={<ResetPasswordPage />} />

          {/* ── Protected routes (any authenticated user) ──────────── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/projects"  element={<ProjectsPage />} />
              <Route path="/tasks"     element={<TasksPage />} />
              <Route path="/billing"   element={<BillingPage />} />
              <Route path="/profile"   element={<ProfilePage />} />
              <Route path="/help"      element={<HelpPage />} />
              <Route path="/download"  element={<DownloadPage />} />
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
