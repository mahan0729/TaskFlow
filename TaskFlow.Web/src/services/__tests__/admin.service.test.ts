import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAdminStats, createUser, deleteUser, sendDownloadEmailToAddress } from '../admin.service';

vi.mock('../api', () => ({
  api: {
    get:    vi.fn(),
    post:   vi.fn(),
    put:    vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from '../api';
const mockApi = api as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };

beforeEach(() => vi.clearAllMocks());

describe('getAdminStats', () => {
  it('calls GET /api/admin/stats and returns data', async () => {
    const fakeStats = { totalUsers: 5, freeUsers: 3, proUsers: 2, totalProjects: 10, totalTasks: 42 };
    mockApi.get.mockResolvedValue({ data: fakeStats });

    const result = await getAdminStats();

    expect(mockApi.get).toHaveBeenCalledWith('/api/admin/stats');
    expect(result).toEqual(fakeStats);
  });
});

describe('createUser', () => {
  it('calls POST /api/admin/users with correct body and returns id', async () => {
    mockApi.post.mockResolvedValue({ data: { id: 7 } });

    const result = await createUser('new@example.com', 'Password1!', 'User');

    expect(mockApi.post).toHaveBeenCalledWith('/api/admin/users', {
      email: 'new@example.com',
      password: 'Password1!',
      role: 'User',
    });
    expect(result.id).toBe(7);
  });
});

describe('deleteUser', () => {
  it('calls DELETE /api/admin/users/:id', async () => {
    mockApi.delete.mockResolvedValue({ data: undefined });

    await deleteUser(42);

    expect(mockApi.delete).toHaveBeenCalledWith('/api/admin/users/42');
  });
});

describe('sendDownloadEmailToAddress', () => {
  it('calls POST /api/admin/send-download with email and name', async () => {
    mockApi.post.mockResolvedValue({ data: undefined });

    await sendDownloadEmailToAddress('anyone@example.com', 'John');

    expect(mockApi.post).toHaveBeenCalledWith('/api/admin/send-download', {
      email: 'anyone@example.com',
      name: 'John',
    });
  });
});
