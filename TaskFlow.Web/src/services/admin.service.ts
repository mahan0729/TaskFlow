/**
 * Admin service — wraps the /api/admin endpoints.
 * These calls will fail with 403 if the current user is not an Admin.
 */
import { api } from './api';
import type { AdminStats, AdminUser, AdminProject } from '../types';

/** Returns platform-wide aggregate stats for the admin dashboard */
export async function getAdminStats(): Promise<AdminStats> {
  const { data } = await api.get<AdminStats>('/api/admin/stats');
  return data;
}

/** Returns a paginated list of all users */
export async function getAdminUsers(page = 1, pageSize = 20): Promise<AdminUser[]> {
  const { data } = await api.get<AdminUser[]>('/api/admin/users', {
    params: { page, pageSize },
  });
  return data;
}

/** Creates a new user account and returns the new user's id */
export async function createUser(email: string, password: string, role: 'User' | 'Admin'): Promise<{ id: number }> {
  const { data } = await api.post<{ id: number }>('/api/admin/users', { email, password, role });
  return data;
}

/** Updates a user's name fields */
export async function editUser(userId: number, firstName: string, lastName: string): Promise<void> {
  await api.put(`/api/admin/users/${userId}`, { firstName, lastName });
}

/** Returns all projects across all users, ordered by most recent first */
export async function getAdminProjects(): Promise<AdminProject[]> {
  const { data } = await api.get<AdminProject[]>('/api/admin/projects');
  return data;
}

/** Sends a download email to an existing user by ID */
export async function sendDownloadEmail(userId: number): Promise<void> {
  await api.post(`/api/admin/users/${userId}/send-download`);
}

/** Sends a download email to any email address (recipient need not be a user) */
export async function sendDownloadEmailToAddress(email: string, name: string): Promise<void> {
  await api.post('/api/admin/send-download', { email, name });
}

/** Updates a user's role */
export async function updateUserRole(userId: number, role: 'User' | 'Admin'): Promise<void> {
  await api.put(`/api/admin/users/${userId}/role`, { role });
}

/** Manually overrides a user's subscription plan */
export async function updateUserPlan(userId: number, plan: 'Free' | 'Pro'): Promise<void> {
  await api.put(`/api/admin/users/${userId}/plan`, { plan });
}

/** Deletes a user and all their data */
export async function deleteUser(userId: number): Promise<void> {
  await api.delete(`/api/admin/users/${userId}`);
}
