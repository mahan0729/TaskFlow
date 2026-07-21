import { api } from './api';
import type { AuthResponse } from '../types';

export interface RegisterPendingResponse {
  email: string;
  message: string;
}

export async function register(email: string, password: string): Promise<RegisterPendingResponse> {
  const { data } = await api.post<RegisterPendingResponse>('/api/auth/register', { email, password });
  return data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/api/auth/login', { email, password });
  return data;
}

export async function verifyEmail(email: string, code: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/api/auth/verify-email', { email, code });
  return data;
}

export async function resendVerification(email: string): Promise<void> {
  await api.post('/api/auth/resend-verification', { email });
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post('/api/auth/forgot-password', { email });
}

export async function resetPassword(email: string, code: string, newPassword: string): Promise<void> {
  await api.post('/api/auth/reset-password', { email, code, newPassword });
}

export async function updateProfile(firstName: string, lastName: string): Promise<{ firstName: string; lastName: string }> {
  const { data } = await api.put<{ firstName: string; lastName: string }>('/api/auth/profile', { firstName, lastName });
  return data;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.put('/api/auth/change-password', { currentPassword, newPassword });
}

export async function logout(): Promise<void> {
  await api.post('/api/auth/logout');
}
