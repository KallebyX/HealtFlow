// ============================================================
// NOTIFICATION TYPES
// Tipos para notificacoes sincronizados com o backend
// ============================================================

export enum NotificationType {
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
  APPOINTMENT_CONFIRMED = 'APPOINTMENT_CONFIRMED',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  APPOINTMENT_RESCHEDULED = 'APPOINTMENT_RESCHEDULED',
  EXAM_READY = 'EXAM_READY',
  EXAM_CRITICAL = 'EXAM_CRITICAL',
  PRESCRIPTION_SIGNED = 'PRESCRIPTION_SIGNED',
  PRESCRIPTION_EXPIRING = 'PRESCRIPTION_EXPIRING',
  PAYMENT_DUE = 'PAYMENT_DUE',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  BIRTHDAY_REMINDER = 'BIRTHDAY_REMINDER',
  FOLLOW_UP_REMINDER = 'FOLLOW_UP_REMINDER',
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum NotificationChannel {
  PUSH = 'PUSH',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  IN_APP = 'IN_APP',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  channel: NotificationChannel;

  // Content
  title: string;
  message: string;
  imageUrl?: string;

  // Action
  actionUrl?: string;
  actionLabel?: string;

  // Related entities
  relatedEntityType?: string;
  relatedEntityId?: string;

  // Status
  read: boolean;
  readAt?: string;
  archived: boolean;
  archivedAt?: string;

  // Delivery
  sentAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  failureReason?: string;

  // Timestamps
  createdAt: string;
  expiresAt?: string;
}

export interface NotificationListResponse {
  data: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}

export interface NotificationQuery {
  page?: number;
  limit?: number;
  type?: NotificationType | NotificationType[];
  priority?: NotificationPriority;
  read?: boolean;
  archived?: boolean;
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  appointmentReminders: boolean;
  examResults: boolean;
  prescriptionAlerts: boolean;
  paymentReminders: boolean;
  marketingMessages: boolean;
}

// Helper functions
export function getNotificationTypeLabel(type: NotificationType): string {
  const labels: Record<NotificationType, string> = {
    [NotificationType.APPOINTMENT_REMINDER]: 'Lembrete de Consulta',
    [NotificationType.APPOINTMENT_CONFIRMED]: 'Consulta Confirmada',
    [NotificationType.APPOINTMENT_CANCELLED]: 'Consulta Cancelada',
    [NotificationType.APPOINTMENT_RESCHEDULED]: 'Consulta Reagendada',
    [NotificationType.EXAM_READY]: 'Exame Pronto',
    [NotificationType.EXAM_CRITICAL]: 'Exame Critico',
    [NotificationType.PRESCRIPTION_SIGNED]: 'Prescricao Assinada',
    [NotificationType.PRESCRIPTION_EXPIRING]: 'Prescricao Expirando',
    [NotificationType.PAYMENT_DUE]: 'Pagamento Pendente',
    [NotificationType.PAYMENT_RECEIVED]: 'Pagamento Recebido',
    [NotificationType.DOCUMENT_UPLOADED]: 'Documento Enviado',
    [NotificationType.MESSAGE_RECEIVED]: 'Mensagem Recebida',
    [NotificationType.SYSTEM_ALERT]: 'Alerta do Sistema',
    [NotificationType.BIRTHDAY_REMINDER]: 'Aniversario',
    [NotificationType.FOLLOW_UP_REMINDER]: 'Lembrete de Retorno',
  };
  return labels[type];
}

export function getNotificationTypeIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    [NotificationType.APPOINTMENT_REMINDER]: 'calendar',
    [NotificationType.APPOINTMENT_CONFIRMED]: 'calendar-check',
    [NotificationType.APPOINTMENT_CANCELLED]: 'calendar-x',
    [NotificationType.APPOINTMENT_RESCHEDULED]: 'calendar-clock',
    [NotificationType.EXAM_READY]: 'flask-conical',
    [NotificationType.EXAM_CRITICAL]: 'alert-triangle',
    [NotificationType.PRESCRIPTION_SIGNED]: 'file-text',
    [NotificationType.PRESCRIPTION_EXPIRING]: 'clock',
    [NotificationType.PAYMENT_DUE]: 'credit-card',
    [NotificationType.PAYMENT_RECEIVED]: 'check-circle',
    [NotificationType.DOCUMENT_UPLOADED]: 'file-up',
    [NotificationType.MESSAGE_RECEIVED]: 'message-square',
    [NotificationType.SYSTEM_ALERT]: 'bell',
    [NotificationType.BIRTHDAY_REMINDER]: 'cake',
    [NotificationType.FOLLOW_UP_REMINDER]: 'repeat',
  };
  return icons[type];
}

export function getNotificationPriorityColor(priority: NotificationPriority): string {
  const colors: Record<NotificationPriority, string> = {
    [NotificationPriority.LOW]: 'text-gray-500',
    [NotificationPriority.NORMAL]: 'text-blue-500',
    [NotificationPriority.HIGH]: 'text-orange-500',
    [NotificationPriority.URGENT]: 'text-red-500',
  };
  return colors[priority];
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `${diffMins}min atras`;
  if (diffHours < 24) return `${diffHours}h atras`;
  if (diffDays < 7) return `${diffDays}d atras`;
  return date.toLocaleDateString('pt-BR');
}
