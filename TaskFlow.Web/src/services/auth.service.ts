/**
 * Auth service — wraps the /api/auth endpoints.
 * All functions return typed responses from the API.
 */
import { api } from './api';
import type { AuthResponse } from '../types';

/** Registers a new user and returns tokens on success */
export async function register(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/api/auth/register', { email, password });
  return data;
}

/** Authenticates a user and returns tokens on success */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/api/auth/login', { email, password });
  return data;
}

/** Revokes all refresh tokens for the current user (server-side logout) */
export async function logout(): Promise<void> {
  await api.post('/api/auth/logout');
}
