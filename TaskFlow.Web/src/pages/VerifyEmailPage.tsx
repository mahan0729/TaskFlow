import { useState, useRef, type FormEvent, type ClipboardEvent, type KeyboardEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const navigate = useNavigate();
  const { verifyEmail, resendVerification } = useAuth();

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const code = digits.join('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (code.length < 6) return;
    setLoading(true);
    setError('');
    try {
      await verifyEmail(email, code);
      // New user — send to profile to set their name
      navigate('/profile?new=1');
    } catch {
      setError('Invalid or expired code. Try again or request a new one.');
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

  async function handleResend() {
    try {
      await resendVerification(email);
      setCooldown(60);
      const timer = setInterval(() => {
        setCooldown(c => { if (c <= 1) { clearInterval(timer); return 0; } return c - 1; });
      }, 1000);
    } catch {
      setError('Failed to resend. Please try again.');
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
          <h1 className="text-3xl font-black text-white">Check your email</h1>
          <p className="mt-2 text-blue-200 text-sm">We sent a 6-digit code to</p>
          <p className="text-white font-semibold">{email}</p>
        </div>

        <div className="card-glass">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/20 border border-red-300/30 text-sm text-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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

            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full py-3 rounded-xl bg-white text-primary-700 font-bold text-sm hover:bg-blue-50 active:scale-95 shadow-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying…' : 'Verify email'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-blue-200">
            Didn't get it?{' '}
            {cooldown > 0
              ? <span className="text-blue-300">Resend in {cooldown}s</span>
              : <button onClick={handleResend} className="text-white font-semibold hover:underline">Resend code</button>
            }
          </p>
        </div>
      </div>
    </div>
  );
}
