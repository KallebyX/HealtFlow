import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  NotificationChannel,
  NotificationType,
  NotificationStatus,
  NotificationPriority,
  ScheduleType,
  RecurrencePattern,
  TemplateCategory,
} from './create-notification.dto';

// ==================== Notification Response DTOs ====================

export class NotificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional()
  userName?: string;

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty({ enum: NotificationChannel })
  channel: NotificationChannel;

  @ApiProperty({ enum: NotificationStatus })
  status: NotificationStatus;

  @ApiProperty({ enum: NotificationPriority })
  priority: NotificationPriority;

  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  message?: string;

  @ApiPropertyOptional()
  templateId?: string;

  @ApiPropertyOptional()
  templateCode?: string;

  @ApiPropertyOptional()
  templateVariables?: Record<string, any>;

  @ApiPropertyOptional()
  relatedEntityId?: string;

  @ApiPropertyOptional()
  relatedEntityType?: string;

  @ApiPropertyOptional()
  actionUrl?: string;

  @ApiPropertyOptional()
  actionText?: string;

  @ApiPropertyOptional()
  imageUrl?: string;

  @ApiPropertyOptional()
  scheduledAt?: Date;

  @ApiPropertyOptional()
  sentAt?: Date;

  @ApiPropertyOptional()
  deliveredAt?: Date;

  @ApiPropertyOptional()
  readAt?: Date;

  @ApiPropertyOptional()
  failedAt?: Date;

  @ApiPropertyOptional()
  failureReason?: string;

  @ApiPropertyOptional()
  externalMessageId?: string;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiProperty()
  isRead: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class NotificationListResponseDto {
  @ApiProperty({ type: [NotificationResponseDto] })
  data: NotificationResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiPropertyOptional()
  unreadCount?: number;
}

export class InAppNotificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  message?: string;

  @ApiPropertyOptional()
  imageUrl?: string;

  @ApiPropertyOptional()
  actionUrl?: string;

  @ApiPropertyOptional()
  actionText?: string;

  @ApiProperty()
  isRead: boolean;

  @ApiPropertyOptional()
  relatedEntityId?: string;

  @ApiPropertyOptional()
  relatedEntityType?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  readAt?: Date;
}

export class InAppNotificationListResponseDto {
  @ApiProperty({ type: [InAppNotificationResponseDto] })
  data: InAppNotificationResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  unreadCount: number;
}

export class NotificationBatchResponseDto {
  @ApiProperty()
  batchId: string;

  @ApiProperty()
  totalRecipients: number;

  @ApiProperty()
  queued: number;

  @ApiProperty()
  sent: number;

  @ApiProperty()
  failed: number;

  @ApiProperty({ enum: NotificationChannel, isArray: true })
  channels: NotificationChannel[];

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiPropertyOptional()
  scheduledAt?: Date;
}

export class SendNotificationResultDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  notificationId: string;

  @ApiPropertyOptional()
  batchId?: string;

  @ApiProperty({ enum: NotificationChannel, isArray: true })
  channels: NotificationChannel[];

  @ApiPropertyOptional()
  externalMessageIds?: Record<string, string>;

  @ApiPropertyOptional()
  errors?: Array<{
    channel: NotificationChannel;
    error: string;
  }>;

  @ApiProperty()
  createdAt: Date;
}

// ==================== Scheduled Notification Response DTOs ====================

export class ScheduleRecurrenceResponseDto {
  @ApiProperty({ enum: RecurrencePattern })
  pattern: RecurrencePattern;

  @ApiPropertyOptional()
  interval?: number;

  @ApiPropertyOptional()
  daysOfWeek?: number[];

  @ApiPropertyOptional()
  dayOfMonth?: number;

  @ApiPropertyOptional()
  time?: string;

  @ApiPropertyOptional()
  endDate?: Date;

  @ApiPropertyOptional()
  maxOccurrences?: number;

  @ApiPropertyOptional()
  occurrencesCount?: number;
}

export class ScheduledNotificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional()
  userName?: string;

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty({ enum: NotificationChannel, isArray: true })
  channels: NotificationChannel[];

  @ApiPropertyOptional()
  templateId?: string;

  @ApiPropertyOptional()
  templateCode?: string;

  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  message?: string;

  @ApiPropertyOptional()
  variables?: Record<string, any>;

  @ApiProperty()
  startDate: Date;

  @ApiPropertyOptional()
  nextRunAt?: Date;

  @ApiPropertyOptional()
  lastRunAt?: Date;

  @ApiPropertyOptional({ type: ScheduleRecurrenceResponseDto })
  recurrence?: ScheduleRecurrenceResponseDto;

  @ApiPropertyOptional()
  relatedEntityId?: string;

  @ApiPropertyOptional()
  relatedEntityType?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  executionsCount: number;

  @ApiPropertyOptional()
  lastExecutionStatus?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ScheduledNotificationListResponseDto {
  @ApiProperty({ type: [ScheduledNotificationResponseDto] })
  data: ScheduledNotificationResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

// ==================== Template Response DTOs ====================

export class NotificationTemplateResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: TemplateCategory })
  category: TemplateCategory;

  @ApiProperty({ enum: NotificationType })
  notificationType: NotificationType;

  @ApiProperty({ enum: NotificationChannel, isArray: true })
  supportedChannels: NotificationChannel[];

  @ApiPropertyOptional()
  emailSubject?: string;

  @ApiPropertyOptional()
  emailBody?: string;

  @ApiPropertyOptional()
  emailBodyText?: string;

  @ApiPropertyOptional()
  smsMessage?: string;

  @ApiPropertyOptional()
  pushTitle?: string;

  @ApiPropertyOptional()
  pushBody?: string;

  @ApiPropertyOptional()
  whatsappMessage?: string;

  @ApiPropertyOptional()
  whatsappTemplateId?: string;

  @ApiPropertyOptional()
  inAppTitle?: string;

  @ApiPropertyOptional()
  inAppMessage?: string;

  @ApiPropertyOptional()
  availableVariables?: string[];

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  defaultLocale?: string;

  @ApiPropertyOptional()
  translations?: Record<string, any>;

  @ApiProperty()
  usageCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class NotificationTemplateListResponseDto {
  @ApiProperty({ type: [NotificationTemplateResponseDto] })
  data: NotificationTemplateResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

// ==================== Preferences Response DTOs ====================

export class ChannelPreferenceResponseDto {
  @ApiProperty({ enum: NotificationChannel })
  channel: NotificationChannel;

  @ApiProperty()
  enabled: boolean;

  @ApiPropertyOptional()
  quietHoursStart?: string;

  @ApiPropertyOptional()
  quietHoursEnd?: string;
}

export class TypePreferenceResponseDto {
  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty()
  enabled: boolean;

  @ApiPropertyOptional({ enum: NotificationChannel, isArray: true })
  allowedChannels?: NotificationChannel[];
}

export class NotificationPreferencesResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  allNotificationsEnabled: boolean;

  @ApiProperty({ type: [ChannelPreferenceResponseDto] })
  channelPreferences: ChannelPreferenceResponseDto[];

  @ApiProperty({ type: [TypePreferenceResponseDto] })
  typePreferences: TypePreferenceResponseDto[];

  @ApiPropertyOptional()
  timezone?: string;

  @ApiPropertyOptional()
  preferredLocale?: string;

  @ApiProperty()
  marketingEmails: boolean;

  @ApiProperty()
  marketingSms: boolean;

  @ApiProperty()
  updatedAt: Date;
}

// ==================== Device Token Response DTOs ====================

export class DeviceTokenResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  token: string;

  @ApiProperty()
  platform: string;

  @ApiPropertyOptional()
  deviceId?: string;

  @ApiPropertyOptional()
  deviceName?: string;

  @ApiPropertyOptional()
  appVersion?: string;

  @ApiPropertyOptional()
  osVersion?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  lastUsedAt?: Date;

  @ApiProperty()
  createdAt: Date;
}

export class DeviceTokenListResponseDto {
  @ApiProperty({ type: [DeviceTokenResponseDto] })
  data: DeviceTokenResponseDto[];

  @ApiProperty()
  total: number;
}

// ==================== Statistics Response DTOs ====================

export class NotificationStatisticsResponseDto {
  @ApiProperty()
  period: {
    start: Date;
    end: Date;
  };

  @ApiProperty()
  total: number;

  @ApiProperty()
  sent: number;

  @ApiProperty()
  delivered: number;

  @ApiProperty()
  read: number;

  @ApiProperty()
  failed: number;

  @ApiProperty()
  deliveryRate: number;

  @ApiProperty()
  readRate: number;

  @ApiPropertyOptional()
  byChannel?: Record<string, {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    deliveryRate: number;
  }>;

  @ApiPropertyOptional()
  byType?: Record<string, {
    total: number;
    sent: number;
    delivered: number;
    readRate: number;
  }>;

  @ApiPropertyOptional()
  byStatus?: Record<string, number>;

  @ApiPropertyOptional()
  trends?: Array<{
    date: string;
    total: number;
    sent: number;
    delivered: number;
    failed: number;
  }>;

  @ApiPropertyOptional()
  comparison?: {
    previousPeriod: {
      start: Date;
      end: Date;
    };
    totalChange: number;
    deliveryRateChange: number;
    readRateChange: number;
  };
}

export class DeliveryReportResponseDto {
  @ApiProperty()
  period: {
    start: Date;
    end: Date;
  };

  @ApiProperty()
  totalSent: number;

  @ApiProperty()
  totalDelivered: number;

  @ApiProperty()
  totalFailed: number;

  @ApiProperty()
  totalBounced: number;

  @ApiProperty()
  deliveryRate: number;

  @ApiProperty()
  bounceRate: number;

  @ApiPropertyOptional()
  byChannel?: Record<string, {
    sent: number;
    delivered: number;
    failed: number;
    bounced: number;
    deliveryRate: number;
  }>;

  @ApiPropertyOptional()
  failureReasons?: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;

  @ApiPropertyOptional()
  hourlyBreakdown?: Array<{
    hour: number;
    sent: number;
    delivered: number;
    deliveryRate: number;
  }>;
}

// ==================== Dashboard Response DTOs ====================

export class NotificationDashboardResponseDto {
  @ApiProperty()
  period: string;

  @ApiProperty()
  summary: {
    totalSent: number;
    totalDelivered: number;
    totalRead: number;
    totalFailed: number;
    deliveryRate: number;
    readRate: number;
  };

  @ApiProperty()
  todayStats: {
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  };

  @ApiPropertyOptional({ type: [NotificationResponseDto] })
  recentNotifications?: NotificationResponseDto[];

  @ApiPropertyOptional({ type: [NotificationResponseDto] })
  failedNotifications?: NotificationResponseDto[];

  @ApiPropertyOptional({ type: [ScheduledNotificationResponseDto] })
  upcomingScheduled?: ScheduledNotificationResponseDto[];

  @ApiPropertyOptional()
  channelBreakdown?: Array<{
    channel: NotificationChannel;
    count: number;
    percentage: number;
    deliveryRate: number;
  }>;

  @ApiPropertyOptional()
  typeBreakdown?: Array<{
    type: NotificationType;
    count: number;
    percentage: number;
    readRate: number;
  }>;

  @ApiPropertyOptional()
  alerts?: Array<{
    type: string;
    message: string;
    count: number;
    severity: string;
  }>;
}

// ==================== Queue Response DTOs ====================

export class NotificationQueueStatusResponseDto {
  @ApiProperty()
  pending: number;

  @ApiProperty()
  processing: number;

  @ApiProperty()
  delayed: number;

  @ApiProperty()
  failed: number;

  @ApiPropertyOptional()
  byChannel?: Record<string, {
    pending: number;
    processing: number;
    failed: number;
  }>;

  @ApiPropertyOptional()
  byPriority?: Record<string, number>;

  @ApiProperty()
  averageProcessingTime: number;

  @ApiProperty()
  throughputPerMinute: number;

  @ApiProperty()
  lastProcessedAt: Date;
}

// ==================== Webhook Response DTOs ====================

export class WebhookEventResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  notificationId: string;

  @ApiProperty()
  event: string;

  @ApiProperty({ enum: NotificationChannel })
  channel: NotificationChannel;

  @ApiPropertyOptional()
  recipient?: string;

  @ApiPropertyOptional()
  externalMessageId?: string;

  @ApiPropertyOptional()
  data?: Record<string, any>;

  @ApiProperty()
  processedAt: Date;
}
