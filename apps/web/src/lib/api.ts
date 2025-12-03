// ============================================================
// API CLIENT
// Cliente HTTP para comunicação com o backend
// ============================================================

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { AuthResponse, LoginCredentials, RegisterPatientData, ForgotPasswordData, ResetPasswordData } from '@/types/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Cria instância do axios
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Token storage keys
const ACCESS_TOKEN_KEY = 'healthflow_access_token';
const REFRESH_TOKEN_KEY = 'healthflow_refresh_token';

// Token management (client-side only)
export const tokenManager = {
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setTokens: (accessToken: string, refreshToken: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  clearTokens: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

// Request interceptor - adiciona token de autorização
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - trata erros e refresh token
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Se receber 401 e não é retry, tenta refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = tokenManager.getRefreshToken();
      if (refreshToken) {
        try {
          const response = await axios.post<AuthResponse>(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          tokenManager.setTokens(accessToken, newRefreshToken);

          // Atualiza header e reenvia request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return api(originalRequest);
        } catch {
          // Refresh falhou, limpa tokens
          tokenManager.clearTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

// ============================================================
// AUTH API
// ============================================================

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  registerPatient: async (data: RegisterPatientData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register/patient', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    const refreshToken = tokenManager.getRefreshToken();
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken });
      } catch {
        // Ignora erros no logout
      }
    }
    tokenManager.clearTokens();
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/refresh', { refreshToken });
    return response.data;
  },

  forgotPassword: async (data: ForgotPasswordData): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/forgot-password', data);
    return response.data;
  },

  resetPassword: async (data: ResetPasswordData): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/reset-password', data);
    return response.data;
  },

  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/verify-email', { token });
    return response.data;
  },

  resendVerification: async (email: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/resend-verification', { email });
    return response.data;
  },

  getProfile: async (): Promise<AuthResponse['user']> => {
    const response = await api.get<AuthResponse['user']>('/auth/profile');
    return response.data;
  },

  // 2FA
  setup2FA: async (): Promise<{ secret: string; qrCode: string }> => {
    const response = await api.post<{ secret: string; qrCode: string }>('/auth/2fa/setup');
    return response.data;
  },

  enable2FA: async (code: string): Promise<{ backupCodes: string[] }> => {
    const response = await api.post<{ backupCodes: string[] }>('/auth/2fa/enable', { code });
    return response.data;
  },

  disable2FA: async (code: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/2fa/disable', { code });
    return response.data;
  },

  verify2FA: async (code: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/2fa/verify', { code });
    return response.data;
  },
};

// ============================================================
// GENERIC API HELPERS
// ============================================================

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
  details?: Record<string, string[]>;
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    if (axiosError.response?.status === 401) {
      return 'Sessao expirada. Por favor, faca login novamente.';
    }
    if (axiosError.response?.status === 403) {
      return 'Voce nao tem permissao para realizar esta acao.';
    }
    if (axiosError.response?.status === 404) {
      return 'Recurso nao encontrado.';
    }
    if (axiosError.response?.status === 422) {
      return 'Dados invalidos. Verifique as informacoes e tente novamente.';
    }
    if (axiosError.response?.status && axiosError.response.status >= 500) {
      return 'Erro interno do servidor. Tente novamente mais tarde.';
    }
    if (axiosError.code === 'ECONNABORTED') {
      return 'Tempo limite excedido. Verifique sua conexao.';
    }
    if (!axiosError.response) {
      return 'Erro de conexao. Verifique sua internet.';
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ocorreu um erro inesperado.';
}

export default api;
