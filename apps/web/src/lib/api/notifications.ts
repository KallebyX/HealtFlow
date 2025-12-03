// ============================================================
// NOTIFICATIONS API
// API para gerenciamento de notificacoes
// ============================================================

import api from '@/lib/api';
import type {
  Notification,
  NotificationListResponse,
  NotificationQuery,
  NotificationPreferences,
} from '@/types/notification';

export const notificationsApi = {
  // Listar notificacoes
  list: async (query?: NotificationQuery): Promise<NotificationListResponse> => {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach((v) => params.append(key, String(v)));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }
    const response = await api.get<NotificationListResponse>(
      `/notifications?${params.toString()}`
    );
    return response.data;
  },

  // Buscar notificacao por ID
  getById: async (id: string): Promise<Notification> => {
    const response = await api.get<Notification>(`/notifications/${id}`);
    return response.data;
  },

  // Contar nao lidas
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<{ count: number }>('/notifications/unread-count');
    return response.data.count;
  },

  // Marcar como lida
  markAsRead: async (id: string): Promise<Notification> => {
    const response = await api.post<Notification>(`/notifications/${id}/read`);
    return response.data;
  },

  // Marcar todas como lidas
  markAllAsRead: async (): Promise<void> => {
    await api.post('/notifications/read-all');
  },

  // Arquivar notificacao
  archive: async (id: string): Promise<Notification> => {
    const response = await api.post<Notification>(`/notifications/${id}/archive`);
    return response.data;
  },

  // Deletar notificacao
  delete: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },

  // Deletar todas as lidas
  deleteAllRead: async (): Promise<void> => {
    await api.delete('/notifications/read');
  },

  // Buscar preferencias
  getPreferences: async (): Promise<NotificationPreferences> => {
    const response = await api.get<NotificationPreferences>('/notifications/preferences');
    return response.data;
  },

  // Atualizar preferencias
  updatePreferences: async (
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> => {
    const response = await api.patch<NotificationPreferences>(
      '/notifications/preferences',
      preferences
    );
    return response.data;
  },

  // Registrar device para push
  registerDevice: async (token: string, platform: 'web' | 'ios' | 'android'): Promise<void> => {
    await api.post('/notifications/devices', { token, platform });
  },

  // Remover device
  unregisterDevice: async (token: string): Promise<void> => {
    await api.delete('/notifications/devices', { data: { token } });
  },
};

export default notificationsApi;
