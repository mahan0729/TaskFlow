/**
 * RegisterPage — new account creation form.
 * Validates that passwords match client-side before submitting.
 * On success navigates to /dashboard.
 */
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { user, register, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [matchError, setMatchError] = useState('');

  // Already logged in — skip registration
  if (user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // Client-side password confirmation check
    if (password !== confirm) {
      setMatchError('Passwords do not match.');
      return;
    }
    setMatchError('');

    try {
      await register(email, password);
      navigate('/dashboard');
    } catch {
      // Error displayed via AuthContext
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">TaskFlow</h1>
          <p className="mt-2 text-sm text-gray-500">Create your free account</p>
        </div>

        <div className="card">
          {/* Server-side error banner */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className="input"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError(); }}
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="input"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError(); setMatchError(''); }}
                placeholder="Minimum 8 characters"
              />
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                className={`input ${matchError ? 'border-red-400' : ''}`}
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setMatchError(''); }}
                placeholder="••••••••"
              />
              {/* Client-side match error */}
              {matchError && (
                <p className="mt-1 text-xs text-red-600">{matchError}</p>
              )}
            </div>

            {/* Free plan notice */}
            <p className="text-xs text-gray-500">
              Free accounts include up to 10 tasks. Upgrade to Pro for unlimited.
            </p>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          {/* Login link */}
          <p className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
