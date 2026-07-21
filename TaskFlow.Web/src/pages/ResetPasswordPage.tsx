import { useState, useRef, type FormEvent, type ClipboardEvent, type KeyboardEvent } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PasswordInput } from '../components/PasswordInput';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [matchError, setMatchError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const code = digits.join('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (code.length < 6) { setError('Please enter the 6-digit code.'); return; }
    if (password !== confirm) { setMatchError('Passwords do not match.'); return; }
    setError('');
    setMatchError('');
    setLoading(true);
    try {
      await resetPassword(email, code, password);
      navigate('/login?reset=1');
    } catch {
      setError('Invalid or expired reset code.');
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  function handleDigitChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      e.preventDefault();
      setDigits(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-800 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-violet-500/20 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm mb-4 shadow-glass">
            <span className="text-2xl font-black text-white">TF</span>
          </div>
          <h1 className="text-3xl font-black text-white">Reset password</h1>
          <p className="mt-1 text-blue-200 text-sm">Enter the code we sent to <strong>{email}</strong></p>
        </div>

        <div className="card-glass space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-300/30 text-sm text-red-100">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 6-digit code */}
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-3 text-center">Verification code</label>
              <div className="flex justify-center gap-3">
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleDigitChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    onPaste={i === 0 ? handlePaste : undefined}
                    className="w-12 h-14 text-center text-2xl font-bold rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                  />
                ))}
              </div>
            </div>

            {/* New password */}
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-1.5">New password</label>
              <PasswordInput
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={v => { setPassword(v); setMatchError(''); }}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-white text-primary-700 font-bold text-sm hover:bg-blue-50 active:scale-95 shadow-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting…' : 'Reset password'}
            </button>
          </form>

          <p className="text-center text-sm text-blue-200">
            <Link to="/forgot-password" className="text-white hover:underline">Resend code</Link>
            {' · '}
            <Link to="/login" className="text-white hover:underline">Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
