import { AuthStatusResponse, AuditLog, MovieProject, SystemStatus } from '../types.ts';

const TOKEN_KEY = 'gs_edit_auth_token';

export const api = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Clear expired token
      this.clearToken();
      window.dispatchEvent(new Event('gs_auth_unauthorized'));
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Server error occurred');
    }
    return data;
  },

  // Auth Endpoints
  async getAuthStatus(): Promise<AuthStatusResponse> {
    return this.request<AuthStatusResponse>('/api/auth/status');
  },

  async initOwner(password: string, name?: string): Promise<{ success: boolean; token: string }> {
    const data = await this.request<{ success: boolean; token: string }>('/api/auth/init-owner', {
      method: 'POST',
      body: JSON.stringify({ email: 'cinematiclovestories694@gmail.com', password, name }),
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  },

  async login(password: string): Promise<{ success: boolean; token: string }> {
    const data = await this.request<{ success: boolean; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'cinematiclovestories694@gmail.com', password }),
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  },

  async requestCode(purpose: 'login' | 'reset-password'): Promise<{ success: boolean; message: string; verificationCode?: string }> {
    return this.request('/api/auth/request-code', {
      method: 'POST',
      body: JSON.stringify({ email: 'cinematiclovestories694@gmail.com', purpose }),
    });
  },

  async verifyCode(code: string, purpose: 'login' | 'reset-password'): Promise<{ success: boolean; token?: string }> {
    const data = await this.request<{ success: boolean; token?: string }>('/api/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ email: 'cinematiclovestories694@gmail.com', code, purpose }),
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  },

  async resetPassword(code: string, newPassword: string): Promise<{ success: boolean; token: string }> {
    const data = await this.request<{ success: boolean; token: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'cinematiclovestories694@gmail.com', code, newPassword }),
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean }> {
    return this.request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async updateProfile(name: string): Promise<{ success: boolean }> {
    return this.request('/api/auth/update-profile', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  async revokeAllSessions(): Promise<{ success: boolean }> {
    return this.request('/api/auth/revoke-all-sessions', {
      method: 'POST',
    });
  },

  async getAuditLog(): Promise<{ auditLogs: AuditLog[] }> {
    return this.request('/api/auth/audit-log');
  },

  async logout(): Promise<void> {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    }
    this.clearToken();
  },

  // Project Endpoints
  async getProjects(): Promise<{ projects: MovieProject[] }> {
    return this.request('/api/projects');
  },

  async getProject(id: string): Promise<{ project: MovieProject }> {
    return this.request(`/api/projects/${id}`);
  },

  async saveProject(project: MovieProject): Promise<{ success: boolean; project: MovieProject }> {
    return this.request('/api/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  },

  async deleteProject(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/projects/${id}`, {
      method: 'DELETE',
    });
  },

  // AI Generation Endpoints
  async generateScript(prompt: string, durationOption: 5 | 10, visualStyle: string): Promise<{ script: any }> {
    return this.request('/api/ai/story-breakdown', {
      method: 'POST',
      body: JSON.stringify({ prompt, durationOption, visualStyle }),
    });
  },

  async generateSceneVisual(scene: any, characters: any[], visualStyle: string): Promise<{ imageUrl: string; source: string }> {
    return this.request('/api/ai/generate-scene-visual', {
      method: 'POST',
      body: JSON.stringify({ scene, characters, visualStyle }),
    });
  },

  // System Status
  async getSystemStatus(): Promise<SystemStatus> {
    return this.request('/api/system/status');
  },
};
