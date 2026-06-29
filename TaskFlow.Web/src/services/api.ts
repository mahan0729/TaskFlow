/**
 * Axios instance pre-configured for the TaskFlow API.
 *
 * Request interceptor:  attaches the JWT access token from localStorage.
 * Response interceptor: on 401, attempts a token refresh and retries the
 *                        original request once. If refresh fails, clears
 *                        storage and redirects to /login.
 */
import axios, { type InternalAxiosRequestConfig } from 'axios';

// Base URL — Vite proxy rewrites /api/* to the .NET API in development.
// In production this will be the deployed Azure App Service URL.
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5213';

/** Shared axios instance used by all service modules */
export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor ───────────────────────────────────────────────────────
// Reads the access token from localStorage and injects it as a Bearer header
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor ──────────────────────────────────────────────────────
// Handles 401 Unauthorized responses by attempting a silent token refresh
api.interceptors.response.use(
  // Pass through successful responses unchanged
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401 and only once per request (_retry flag prevents loops)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          // Call refresh endpoint directly (not through the intercepted instance)
          const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken });

          // Store the new tokens
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);

          // Retry the original request with the new access token
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch {
          // Refresh failed — clear all auth state and force re-login
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        // No refresh token available — go to login
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);
