import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { StoredAuth } from '../types';
import * as authService from '../services/auth.service';

interface AuthContextValue {
  user: StoredAuth | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  /** Returns the email so the caller can redirect to /verify-email */
  register: (email: string, password: string) => Promise<{ email: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  updateProfile: (firstName: string, lastName: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredAuth(): StoredAuth | null {
  const accessToken  = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const email        = localStorage.getItem('email');
  const role         = localStorage.getItem('role') as StoredAuth['role'] | null;
  const plan         = localStorage.getItem('plan') as StoredAuth['plan'] | null;
  const firstName    = localStorage.getItem('firstName');
  const lastName     = localStorage.getItem('lastName');

  if (!accessToken || !refreshToken || !email || !role || !plan) return null;
  return { accessToken, refreshToken, email, role, plan, firstName, lastName };
}

function writeStoredAuth(auth: StoredAuth): void {
  localStorage.setItem('accessToken',  auth.accessToken);
  localStorage.setItem('refreshToken', auth.refreshToken);
  localStorage.setItem('email',        auth.email);
  localStorage.setItem('role',         auth.role);
  localStorage.setItem('plan',         auth.plan);
  if (auth.firstName) localStorage.setItem('firstName', auth.firstName);
  else localStorage.removeItem('firstName');
  if (auth.lastName) localStorage.setItem('lastName', auth.lastName);
  else localStorage.removeItem('lastName');
}

function clearStoredAuth(): void {
  ['accessToken', 'refreshToken', 'email', 'role', 'plan', 'firstName', 'lastName']
    .forEach(k => localStorage.removeItem(k));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<StoredAuth | null>(readStoredAuth);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(email, password);
      const stored: StoredAuth = { ...response };
      writeStoredAuth(stored);
      setUser(stored);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string; needsVerification?: boolean } } })?.response?.data;
      setError(data?.message ?? 'Invalid email or password.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.register(email, password);
      return { email: response.email };
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Registration failed. Please try again.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyEmail = useCallback(async (email: string, code: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.verifyEmail(email, code);
      const stored: StoredAuth = { ...response };
      writeStoredAuth(stored);
      setUser(stored);
    } finally {
      setLoading(false);
    }
  }, []);

  const resendVerification = useCallback(async (email: string) => {
    await authService.resendVerification(email);
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await authService.forgotPassword(email);
  }, []);

  const resetPassword = useCallback(async (email: string, code: string, newPassword: string) => {
    await authService.resetPassword(email, code, newPassword);
  }, []);

  const updateProfile = useCallback(async (firstName: string, lastName: string) => {
    const result = await authService.updateProfile(firstName, lastName);
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, firstName: result.firstName, lastName: result.lastName };
      writeStoredAuth(updated);
      return updated;
    });
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await authService.changePassword(currentPassword, newPassword);
  }, []);

  const logout = useCallback(async () => {
    try { await authService.logout(); } finally {
      clearStoredAuth();
      setUser(null);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{
      user, loading, error,
      login, register, logout, clearError,
      verifyEmail, resendVerification,
      forgotPassword, resetPassword,
      updateProfile, changePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
