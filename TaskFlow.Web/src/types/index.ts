/* ──────────────────────────────────────────────────────────────
   Central type definitions — mirrors the API response models.
   Keep in sync with TaskFlow.API/Models/*.cs
   ────────────────────────────────────────────────────────────── */

/** Returned by /api/auth/login and /api/auth/refresh */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  email: string;
  role: 'User' | 'Admin';
  plan: 'Free' | 'Pro';
}

/** Stored in localStorage to persist the session across page reloads */
export interface StoredAuth {
  accessToken: string;
  refreshToken: string;
  email: string;
  role: 'User' | 'Admin';
  plan: 'Free' | 'Pro';
}

/** A project belonging to the current user */
export interface Project {
  id: number;
  name: string;
  description: string | null;
  color: string;
  taskCount: number;
  createdAt: string; // ISO 8601 UTC string
}

/** An individual task within a project */
export interface Task {
  id: number;
  projectId: number;
  projectName: string;
  title: string;
  description: string | null;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Todo' | 'InProgress' | 'Done';
  dueDate: string | null; // ISO 8601 UTC string, null if no due date
  createdAt: string;
  updatedAt: string;
}

/** Query parameters for filtering the task list */
export interface TaskFilter {
  projectId?: number;
  status?: Task['status'];
  priority?: Task['priority'];
}

/** Current subscription status returned by /api/subscription/status */
export interface SubscriptionStatus {
  plan: 'Free' | 'Pro';
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
}

/** Platform stats shown on the admin dashboard */
export interface AdminStats {
  totalUsers: number;
  freeUsers: number;
  proUsers: number;
  totalProjects: number;
  totalTasks: number;
}

/** A single user row in the admin user list */
export interface AdminUser {
  id: number;
  email: string;
  role: 'User' | 'Admin';
  plan: 'Free' | 'Pro';
  projectCount: number;
  taskCount: number;
  createdAt: string;
}
