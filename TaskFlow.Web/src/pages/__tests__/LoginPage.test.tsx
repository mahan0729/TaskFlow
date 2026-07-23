import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import LoginPage from '../LoginPage';
import type { StoredAuth } from '../../types';

type AuthContextValue = {
  user: StoredAuth | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<{ email: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  updateProfile: (firstName: string, lastName: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
};

function makeAuthContext(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: null,
    loading: false,
    error: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    clearError: vi.fn(),
    verifyEmail: vi.fn(),
    resendVerification: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
    ...overrides,
  };
}

function renderLogin(ctx: AuthContextValue) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={ctx}>
        <LoginPage />
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('LoginPage', () => {
  it('renders email input, password input, and sign-in button', () => {
    renderLogin(makeAuthContext());
    expect(screen.getByPlaceholderText(/you@example\.com/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows loading state while submitting', () => {
    renderLogin(makeAuthContext({ loading: true }));
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });

  it('shows error banner when auth context has an error', () => {
    renderLogin(makeAuthContext({ error: 'Invalid email or password.' }));
    expect(screen.getByText('Invalid email or password.')).toBeInTheDocument();
  });

  it('calls login with email and password on submit', async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    renderLogin(makeAuthContext({ login }));

    await userEvent.type(screen.getByPlaceholderText(/you@example\.com/i), 'matt@example.com');
    // PasswordInput renders a nested input — find by type
    await userEvent.type(screen.getByDisplayValue(''), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(login).toHaveBeenCalledWith('matt@example.com', 'Password1!');
  });

  it('clears error when email input changes', async () => {
    const clearError = vi.fn();
    renderLogin(makeAuthContext({ clearError }));

    await userEvent.type(screen.getByPlaceholderText(/you@example\.com/i), 'a');

    expect(clearError).toHaveBeenCalled();
  });
});
