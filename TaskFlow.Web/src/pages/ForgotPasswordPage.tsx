import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-800 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-5%] w-80 h-80 bg-violet-500/20 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm mb-4 shadow-glass">
            <span className="text-2xl font-black text-white">TF</span>
          </div>
          <h1 className="text-3xl font-black text-white">Forgot password?</h1>
          <p className="mt-1 text-blue-200 text-sm">We'll send a reset code to your email</p>
        </div>

        <div className="card-glass">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white font-semibold">Code sent!</p>
              <p className="text-blue-200 text-sm">If <strong>{email}</strong> is registered, a 6-digit reset code is on its way.</p>
              <button
                onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`)}
                className="w-full py-3 rounded-xl bg-white text-primary-700 font-bold text-sm hover:bg-blue-50 transition-all"
              >
                Enter reset code →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  className="input-glass"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-white text-primary-700 font-bold text-sm hover:bg-blue-50 active:scale-95 shadow-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending…' : 'Send reset code'}
              </button>
            </form>
          )}

          <p className="mt-5 text-center text-sm text-blue-200">
            Remember it?{' '}
            <Link to="/login" className="text-white font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
