import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PasswordInput } from '../components/PasswordInput';

export default function ProfilePage() {
  const { user, updateProfile, changePassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNew = searchParams.get('new') === '1';

  // ── Name form ────────────────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName]   = useState(user?.lastName ?? '');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError]     = useState('');
  const [nameSaved, setNameSaved]     = useState(false);

  async function handleNameSubmit(e: FormEvent) {
    e.preventDefault();
    setNameLoading(true);
    setNameError('');
    setNameSaved(false);
    try {
      await updateProfile(firstName.trim(), lastName.trim());
      if (isNew) navigate('/dashboard');
      else setNameSaved(true);
    } catch {
      setNameError('Failed to save. Please try again.');
    } finally {
      setNameLoading(false);
    }
  }

  // ── Password form ─────────────────────────────────────────────────────────────
  const [current, setCurrent]   = useState('');
  const [newPwd, setNewPwd]     = useState('');
  const [confirm, setConfirm]   = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError]     = useState('');
  const [pwdSaved, setPwdSaved]     = useState(false);

  async function handlePwdSubmit(e: FormEvent) {
    e.preventDefault();
    if (newPwd !== confirm) { setPwdError('Passwords do not match.'); return; }
    setPwdLoading(true);
    setPwdError('');
    setPwdSaved(false);
    try {
      await changePassword(current, newPwd);
      setPwdSaved(true);
      setCurrent(''); setNewPwd(''); setConfirm('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setPwdError(msg ?? 'Failed to change password.');
    } finally {
      setPwdLoading(false);
    }
  }

  return (
    <div className="max-w-lg space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isNew ? 'Welcome to TaskFlow! 👋' : 'Your Profile'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isNew ? 'Tell us your name to get started.' : 'Manage your personal details and password.'}
        </p>
      </div>

      {/* ── Name card ─────────────────────────────────────────────────────────── */}
      <div className="card space-y-4">
        <h2 className="text-base font-semibold text-gray-800">Personal details</h2>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Email</p>
          <p className="text-gray-700">{user?.email}</p>
        </div>

        {nameError && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{nameError}</div>}
        {nameSaved && <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">Profile saved.</div>}

        <form onSubmit={handleNameSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="input w-full"
                placeholder="First"
                autoFocus={isNew}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="input w-full"
                placeholder="Last"
              />
            </div>
          </div>

          <button type="submit" disabled={nameLoading} className="btn-primary">
            {nameLoading ? 'Saving…' : isNew ? 'Continue to Dashboard →' : 'Save changes'}
          </button>
        </form>
      </div>

      {/* ── Change password card ──────────────────────────────────────────────── */}
      {!isNew && (
        <div className="card space-y-4">
          <h2 className="text-base font-semibold text-gray-800">Change password</h2>

          {pwdError && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{pwdError}</div>}
          {pwdSaved && <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">Password changed successfully.</div>}

          <form onSubmit={handlePwdSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
              <PasswordInput
                autoComplete="current-password"
                required
                value={current}
                onChange={v => { setCurrent(v); setPwdError(''); }}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <PasswordInput
                autoComplete="new-password"
                required
                minLength={8}
                value={newPwd}
                onChange={v => { setNewPwd(v); setPwdError(''); }}
                className="input w-full"
                placeholder="Minimum 8 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
              <PasswordInput
                autoComplete="new-password"
                required
                value={confirm}
                onChange={v => { setConfirm(v); setPwdError(''); }}
                className="input w-full"
                hasError={!!pwdError && pwdError === 'Passwords do not match.'}
              />
            </div>
            <button type="submit" disabled={pwdLoading} className="btn-primary">
              {pwdLoading ? 'Changing…' : 'Change password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
