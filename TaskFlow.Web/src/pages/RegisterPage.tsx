/**
 * RegisterPage — same blue gradient as LoginPage for visual consistency.
 */
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PasswordInput } from '../components/PasswordInput';

export default function RegisterPage() {
  const { user, register, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [matchError, setMatchError] = useState('');

  if (user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setMatchError('Passwords do not match.'); return; }
    setMatchError('');
    try {
      const result = await register(email, password);
      navigate(`/verify-email?email=${encodeURIComponent(result.email)}`);
    } catch { /* error shown via AuthContext */ }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-800 flex items-center justify-center px-4 relative overflow-hidden">

      {/* Decorative blurred circles */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-violet-500/20 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">

        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm mb-4 shadow-glass">
            <span className="text-2xl font-black text-white">TF</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">TaskFlow</h1>
          <p className="mt-1 text-blue-200 text-sm">Create your free account</p>
        </div>

        <div className="card-glass">

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/20 border border-red-300/30 text-sm text-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-1.5">Email</label>
              <input
                type="email"
                autoComplete="email"
                required
                className="input-glass"
                value={email}
                onChange={e => { setEmail(e.target.value); clearError(); }}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-100 mb-1.5">Password</label>
              <PasswordInput
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={v => { setPassword(v); clearError(); setMatchError(''); }}
                placeholder="Minimum 8 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-100 mb-1.5">Confirm password</label>
              <PasswordInput
                autoComplete="new-password"
                required
                value={confirm}
                onChange={v => { setConfirm(v); setMatchError(''); }}
                hasError={!!matchError}
              />
              {matchError && <p className="mt-1 text-xs text-red-300">{matchError}</p>}
            </div>

            {/* Free plan note */}
            <p className="text-xs text-blue-300 text-center">
              Free accounts include up to 10 tasks · Upgrade to Pro anytime
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-white text-primary-700 font-bold text-sm
                         hover:bg-blue-50 active:scale-95 shadow-lg transition-all duration-150
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account…' : 'Create free account'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-blue-200">
            Already have an account?{' '}
            <Link to="/login" className="text-white font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
