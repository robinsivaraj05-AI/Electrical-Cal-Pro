import { api } from './client';

// ─── Auth ───────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  company?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  settings?: UserSettings;
}

export interface UserSettings {
  id: string;
  userId: string;
  theme: string;
  unitSystem: string;
  standard: string;
  companyName?: string;
  engineerName?: string;
  logoUrl?: string;
  autoSave: boolean;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
  message: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }),
  register: (data: { email: string; password: string; name: string; company?: string }) =>
    api.post<LoginResponse>('/auth/register', data),
  me: () => api.get<{ user: AuthUser }>('/auth/me'),
  updateProfile: (data: { name?: string; company?: string }) =>
    api.put<{ user: AuthUser; message: string }>('/auth/profile', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put<{ message: string }>('/auth/password', { currentPassword, newPassword }),
};

// ─── Projects ────────────────────────────────────────────────────────────────

export interface ApiProject {
  id: string;
  name: string;
  client?: string;
  engineer: string;
  projectNo?: string;
  revision: string;
  date?: string;
  companyName?: string;
  description?: string;
  status: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { calculations: number };
}

export const projectsApi = {
  list: (params?: { status?: string; search?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return api.get<{ projects: ApiProject[]; pagination: { page: number; limit: number; total: number; pages: number } }>(
      `/projects${qs ? `?${qs}` : ''}`
    );
  },
  create: (data: Partial<ApiProject>) =>
    api.post<{ project: ApiProject; message: string }>('/projects', data),
  get: (id: string) =>
    api.get<{ project: ApiProject & { calculations: ApiCalculation[] } }>(`/projects/${id}`),
  update: (id: string, data: Partial<ApiProject>) =>
    api.put<{ project: ApiProject; message: string }>(`/projects/${id}`, data),
  delete: (id: string) =>
    api.delete<{ message: string }>(`/projects/${id}`),
  stats: (id: string) =>
    api.get<{ totalCalcs: number; calcByType: { type: string; count: number }[]; recentCalcs: ApiCalculation[] }>(
      `/projects/${id}/stats`
    ),
};

// ─── Calculations ────────────────────────────────────────────────────────────

export interface ApiCalculation {
  id: string;
  projectId: string;
  type: string;
  title: string;
  inputs: Record<string, unknown>;
  results: Record<string, unknown>;
  notes?: string;
  standard?: string;
  tags?: string;
  revision: string;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string };
}

export const calculationsApi = {
  list: (params?: { projectId?: string; type?: string; search?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.projectId) q.set('projectId', params.projectId);
    if (params?.type) q.set('type', params.type);
    if (params?.search) q.set('search', params.search);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return api.get<{ calculations: ApiCalculation[]; pagination: { page: number; limit: number; total: number } }>(
      `/calculations${qs ? `?${qs}` : ''}`
    );
  },
  save: (data: {
    projectId: string;
    type: string;
    title: string;
    inputs: Record<string, unknown>;
    results: Record<string, unknown>;
    notes?: string;
    standard?: string;
    tags?: string;
  }) => api.post<{ calculation: ApiCalculation; message: string }>('/calculations', data),
  get: (id: string) =>
    api.get<{ calculation: ApiCalculation }>(`/calculations/${id}`),
  update: (id: string, data: Partial<ApiCalculation>) =>
    api.put<{ calculation: ApiCalculation; message: string }>(`/calculations/${id}`, data),
  delete: (id: string) =>
    api.delete<{ message: string }>(`/calculations/${id}`),
  byProject: (projectId: string) =>
    api.get<{ calculations: ApiCalculation[] }>(`/calculations/project/${projectId}`),
};

// ─── Settings ────────────────────────────────────────────────────────────────

export const settingsApi = {
  get: () => api.get<{ settings: UserSettings }>('/settings'),
  update: (data: Partial<UserSettings>) =>
    api.put<{ settings: UserSettings; message: string }>('/settings', data),
};

// ─── Dashboard ───────────────────────────────────────────────────────────────

export const dashboardApi = {
  stats: () =>
    api.get<{
      stats: { totalProjects: number; totalCalcs: number; calcByType: { type: string; count: number }[] };
      recentCalcs: ApiCalculation[];
      recentProjects: ApiProject[];
    }>('/dashboard/stats'),
};
