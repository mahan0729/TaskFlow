/* ──────────────────────────────────────────────────────────────
   Central type definitions — mirrors the API response models.
   Keep in sync with TaskFlow.API/Models/*.cs
   ────────────────────────────────────────────────────────────── */

/** Returned by /api/auth/login, /api/auth/refresh, and /api/auth/verify-email */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  email: string;
  role: 'User' | 'Admin';
  plan: 'Free' | 'Pro';
  firstName: string | null;
  lastName: string | null;
}

/** Stored in localStorage to persist the session across page reloads */
export interface StoredAuth {
  accessToken: string;
  refreshToken: string;
  email: string;
  role: 'User' | 'Admin';
  plan: 'Free' | 'Pro';
  firstName: string | null;
  lastName: string | null;
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
  status: 'Backlog' | 'Grooming' | 'Ready' | 'Dev' | 'QA' | 'Demo' | 'UAT' | 'Production';
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  assignedToUserId: number | null;
  assignedToName: string | null;
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
  firstName: string | null;
  lastName: string | null;
  role: 'User' | 'Admin';
  plan: 'Free' | 'Pro';
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  projectCount: number;
  taskCount: number;
  createdAt: string;
}
