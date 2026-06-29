/**
 * Projects service — wraps the /api/projects endpoints.
 */
import { api } from './api';
import type { Project } from '../types';

/** Fetches all projects for the authenticated user */
export async function getProjects(): Promise<Project[]> {
  const { data } = await api.get<Project[]>('/api/projects');
  return data;
}

/** Fetches a single project by ID */
export async function getProject(id: number): Promise<Project> {
  const { data } = await api.get<Project>(`/api/projects/${id}`);
  return data;
}

/** Creates a new project */
export async function createProject(payload: {
  name: string;
  description?: string;
  color?: string;
}): Promise<Project> {
  const { data } = await api.post<Project>('/api/projects', payload);
  return data;
}

/** Updates an existing project */
export async function updateProject(id: number, payload: {
  name: string;
  description?: string;
  color: string;
}): Promise<Project> {
  const { data } = await api.put<Project>(`/api/projects/${id}`, payload);
  return data;
}

/** Deletes a project and all its tasks */
export async function deleteProject(id: number): Promise<void> {
  await api.delete(`/api/projects/${id}`);
}
