/**
 * Tasks service — wraps the /api/tasks endpoints.
 */
import { api } from './api';
import type { Task, TaskFilter } from '../types';

/** Fetches tasks with optional filtering by project, status, or priority */
export async function getTasks(filter?: TaskFilter): Promise<Task[]> {
  const { data } = await api.get<Task[]>('/api/tasks', { params: filter });
  return data;
}

/** Fetches a single task by ID */
export async function getTask(id: number): Promise<Task> {
  const { data } = await api.get<Task>(`/api/tasks/${id}`);
  return data;
}

/** Creates a new task. Returns 402 if the Free plan task limit is reached. */
export async function createTask(payload: {
  projectId: number;
  title: string;
  description?: string;
  priority?: Task['priority'];
  status?: Task['status'];
  dueDate?: string;
}): Promise<Task> {
  const { data } = await api.post<Task>('/api/tasks', payload);
  return data;
}

/** Updates an existing task */
export async function updateTask(id: number, payload: {
  projectId: number;
  title: string;
  description?: string;
  priority: Task['priority'];
  status: Task['status'];
  dueDate?: string | null;
}): Promise<Task> {
  const { data } = await api.put<Task>(`/api/tasks/${id}`, payload);
  return data;
}

/** Toggles assignment of a task to the current user (assign if unassigned, unassign if already assigned) */
export async function assignTask(id: number): Promise<Task> {
  const { data } = await api.put<Task>(`/api/tasks/${id}/assign`);
  return data;
}

/** Deletes a task by ID */
export async function deleteTask(id: number): Promise<void> {
  await api.delete(`/api/tasks/${id}`);
}
