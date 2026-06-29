/**
 * Admin service — wraps the /api/admin endpoints.
 * These calls will fail with 403 if the current user is not an Admin.
 */
import { api } from './api';
import type { AdminStats, AdminUser } from '../types';

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

/** Updates a user's role */
export async function updateUserRole(userId: number, role: 'User' | 'Admin'): Promise<void> {
  await api.put(`/api/admin/users/${userId}/role`, { role });
}

/** Deletes a user and all their data */
export async function deleteUser(userId: number): Promise<void> {
  await api.delete(`/api/admin/users/${userId}`);
}
