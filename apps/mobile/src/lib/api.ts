import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getToken(): Promise<string | null> {
    return AsyncStorage.getItem('accessToken');
  }

  private async getRefreshToken(): Promise<string | null> {
    return AsyncStorage.getItem('refreshToken');
  }

  private async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await AsyncStorage.multiSet([
      ['accessToken', accessToken],
      ['refreshToken', refreshToken],
    ]);
  }

  private async clearTokens(): Promise<void> {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
  }

  private async refreshAccessToken(): Promise<boolean> {
    const refreshToken = await this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        await this.clearTokens();
        return false;
      }

      const data = await response.json();
      await this.setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      await this.clearTokens();
      return false;
    }
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { skipAuth = false, ...fetchOptions } = options;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers || {}),
    };

    if (!skipAuth) {
      const token = await this.getToken();
      if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
    }

    let response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    // Handle 401 - try to refresh token
    if (response.status === 401 && !skipAuth) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        const newToken = await this.getToken();
        (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...fetchOptions,
          headers,
        });
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient(API_URL);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ accessToken: string; refreshToken: string; user: unknown }>(
      '/auth/login',
      { email, password },
      { skipAuth: true }
    ),

  register: (data: { email: string; password: string; fullName: string; cpf: string }) =>
    api.post<{ accessToken: string; refreshToken: string; user: unknown }>(
      '/auth/register',
      data,
      { skipAuth: true }
    ),

  logout: () => api.post('/auth/logout', {}),

  me: () => api.get<{ user: unknown }>('/auth/me'),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }, { skipAuth: true }),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }, { skipAuth: true }),
};

// Patient API
export const patientApi = {
  getProfile: () => api.get<unknown>('/patients/me'),
  updateProfile: (data: unknown) => api.patch<unknown>('/patients/me', data),
};

// Appointments API
export const appointmentsApi = {
  list: (params?: { status?: string; upcoming?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.upcoming) query.set('upcoming', 'true');
    return api.get<unknown>(`/appointments/my?${query.toString()}`);
  },
  getById: (id: string) => api.get<unknown>(`/appointments/${id}`),
  cancel: (id: string, reason?: string) =>
    api.post<unknown>(`/appointments/${id}/cancel`, { reason }),
  confirm: (id: string) => api.post<unknown>(`/appointments/${id}/confirm`, {}),
};

// Prescriptions API
export const prescriptionsApi = {
  list: () => api.get<unknown>('/prescriptions/my'),
  getById: (id: string) => api.get<unknown>(`/prescriptions/${id}`),
};

// Exams API
export const examsApi = {
  list: () => api.get<unknown>('/exams/my'),
  getById: (id: string) => api.get<unknown>(`/exams/${id}`),
};

// Gamification API
export const gamificationApi = {
  getProfile: () => api.get<unknown>('/gamification/profile'),
  getBadges: () => api.get<unknown>('/gamification/badges'),
  getChallenges: () => api.get<unknown>('/gamification/challenges'),
  getLeaderboard: () => api.get<unknown>('/gamification/leaderboard'),
};

// Notifications API
export const notificationsApi = {
  list: () => api.get<unknown>('/notifications/my'),
  markAsRead: (id: string) => api.patch<unknown>(`/notifications/${id}/read`, {}),
  markAllAsRead: () => api.post<unknown>('/notifications/read-all', {}),
};

// Health Monitoring API
export const healthApi = {
  getMetrics: (type?: string) => {
    const query = type ? `?type=${type}` : '';
    return api.get<unknown>(`/health/metrics${query}`);
  },
  getStats: () => api.get<unknown>('/health/stats'),
  addMetric: (data: {
    type: string;
    value: number;
    secondaryValue?: number;
    measuredAt: string;
    notes?: string;
  }) => api.post<unknown>('/health/metrics', data),
  getHistory: (type: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ type });
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    return api.get<unknown>(`/health/history?${params.toString()}`);
  },
};

// Telemedicine API
export const telemedicineApi = {
  getSession: (appointmentId: string) => api.get<unknown>(`/telemedicine/session/${appointmentId}`),
  joinSession: (appointmentId: string) => api.post<unknown>(`/telemedicine/session/${appointmentId}/join`, {}),
  leaveSession: (appointmentId: string) => api.post<unknown>(`/telemedicine/session/${appointmentId}/leave`, {}),
  getToken: (appointmentId: string) => api.get<unknown>(`/telemedicine/token/${appointmentId}`),
};

// Settings API
export const settingsApi = {
  getPreferences: () => api.get<unknown>('/settings/preferences'),
  updatePreferences: (data: Record<string, unknown>) => api.patch<unknown>('/settings/preferences', data),
  updateNotificationSettings: (data: Record<string, boolean>) => api.patch<unknown>('/settings/notifications', data),
};
