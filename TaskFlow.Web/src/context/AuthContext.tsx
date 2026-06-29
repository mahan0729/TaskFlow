/**
 * AuthContext — provides the current user's auth state to the entire app.
 *
 * Persists tokens and user info in localStorage so the session survives
 * page reloads. The Axios interceptor in api.ts reads from the same keys.
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { StoredAuth } from '../types';
import * as authService from '../services/auth.service';

// ── Context shape ─────────────────────────────────────────────────────────────

interface AuthContextValue {
  /** Currently authenticated user, or null if logged out */
  user: StoredAuth | null;
  /** True while a login or register request is in flight */
  loading: boolean;
  /** Error message from the last failed auth attempt */
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Clears the error banner (called when the user edits the form) */
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Storage helpers ───────────────────────────────────────────────────────────

/** Reads all auth fields from localStorage and returns a StoredAuth or null */
function readStoredAuth(): StoredAuth | null {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const email = localStorage.getItem('email');
  const role = localStorage.getItem('role') as StoredAuth['role'] | null;
  const plan = localStorage.getItem('plan') as StoredAuth['plan'] | null;

  if (!accessToken || !refreshToken || !email || !role || !plan) return null;
  return { accessToken, refreshToken, email, role, plan };
}

/** Persists all auth fields to localStorage */
function writeStoredAuth(auth: StoredAuth): void {
  localStorage.setItem('accessToken', auth.accessToken);
  localStorage.setItem('refreshToken', auth.refreshToken);
  localStorage.setItem('email', auth.email);
  localStorage.setItem('role', auth.role);
  localStorage.setItem('plan', auth.plan);
}

/** Removes all auth fields from localStorage */
function clearStoredAuth(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('email');
  localStorage.removeItem('role');
  localStorage.removeItem('plan');
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialise from localStorage so the user stays logged in after a reload
  const [user, setUser] = useState<StoredAuth | null>(readStoredAuth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(email, password);
      const stored: StoredAuth = { ...response };
      writeStoredAuth(stored);
      setUser(stored);
    } catch (err: unknown) {
      // Surface the API error message if available, otherwise a generic fallback
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Invalid email or password.';
      setError(message);
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
      const stored: StoredAuth = { ...response };
      writeStoredAuth(stored);
      setUser(stored);
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

  const logout = useCallback(async () => {
    try {
      // Revoke refresh tokens on the server first
      await authService.logout();
    } finally {
      // Always clear local state even if the server call fails
      clearStoredAuth();
      setUser(null);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/** Consume auth state anywhere inside <AuthProvider> */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
