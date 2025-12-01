import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsUUID,
  IsEmail,
  IsArray,
  ValidateNested,
  IsEnum,
  IsBoolean,
  IsDateString,
  Min,
  Max,
  IsObject,
  MinLength,
  MaxLength,
  Matches,
  ArrayMinSize,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// ==================== Enums ====================

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  WHATSAPP = 'WHATSAPP',
  IN_APP = 'IN_APP',
}

export enum NotificationType {
  // Appointment
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
  APPOINTMENT_CONFIRMED = 'APPOINTMENT_CONFIRMED',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  APPOINTMENT_RESCHEDULED = 'APPOINTMENT_RESCHEDULED',

  // Consultation
  CONSULTATION_STARTED = 'CONSULTATION_STARTED',
  CONSULTATION_COMPLETED = 'CONSULTATION_COMPLETED',
  PRESCRIPTION_READY = 'PRESCRIPTION_READY',

  // Laboratory
  LAB_ORDER_CREATED = 'LAB_ORDER_CREATED',
  LAB_RESULTS_READY = 'LAB_RESULTS_READY',
  LAB_CRITICAL_VALUE = 'LAB_CRITICAL_VALUE',
  SAMPLE_COLLECTION_REMINDER = 'SAMPLE_COLLECTION_REMINDER',

  // Telemedicine
  TELEMEDICINE_SESSION_STARTING = 'TELEMEDICINE_SESSION_STARTING',
  TELEMEDICINE_SESSION_INVITE = 'TELEMEDICINE_SESSION_INVITE',

  // Billing
  INVOICE_CREATED = 'INVOICE_CREATED',
  INVOICE_DUE_REMINDER = 'INVOICE_DUE_REMINDER',
  INVOICE_OVERDUE = 'INVOICE_OVERDUE',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',

  // Medication
  MEDICATION_REMINDER = 'MEDICATION_REMINDER',
  PRESCRIPTION_EXPIRING = 'PRESCRIPTION_EXPIRING',
  REFILL_REMINDER = 'REFILL_REMINDER',

  // Health
  HEALTH_CHECK_REMINDER = 'HEALTH_CHECK_REMINDER',
  VACCINATION_REMINDER = 'VACCINATION_REMINDER',
  PREVENTIVE_EXAM_REMINDER = 'PREVENTIVE_EXAM_REMINDER',

  // Account
  WELCOME = 'WELCOME',
  PASSWORD_RESET = 'PASSWORD_RESET',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PHONE_VERIFICATION = 'PHONE_VERIFICATION',
  ACCOUNT_ACTIVATED = 'ACCOUNT_ACTIVATED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',

  // Gamification
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
  LEVEL_UP = 'LEVEL_UP',
  CHALLENGE_COMPLETED = 'CHALLENGE_COMPLETED',
  POINTS_EARNED = 'POINTS_EARNED',
  STREAK_MILESTONE = 'STREAK_MILESTONE',

  // System
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  NEW_FEATURE = 'NEW_FEATURE',
  PROMOTIONAL = 'PROMOTIONAL',

  // General
  CUSTOM = 'CUSTOM',
  BROADCAST = 'BROADCAST',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum ScheduleType {
  IMMEDIATE = 'IMMEDIATE',
  SCHEDULED = 'SCHEDULED',
  RECURRING = 'RECURRING',
}

export enum RecurrencePattern {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  CUSTOM = 'CUSTOM',
}

export enum TemplateCategory {
  APPOINTMENT = 'APPOINTMENT',
  BILLING = 'BILLING',
  LABORATORY = 'LABORATORY',
  TELEMEDICINE = 'TELEMEDICINE',
  MEDICATION = 'MEDICATION',
  HEALTH = 'HEALTH',
  ACCOUNT = 'ACCOUNT',
  GAMIFICATION = 'GAMIFICATION',
  MARKETING = 'MARKETING',
  SYSTEM = 'SYSTEM',
}

// ==================== Notification DTOs ====================

export class NotificationRecipientDto {
  @ApiProperty({ description: 'ID do usuário' })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ description: 'Email (sobrescreve padrão)' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Telefone (sobrescreve padrão)' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Variáveis personalizadas' })
  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;
}

export class CreateNotificationDto {
  @ApiProperty({ enum: NotificationType, description: 'Tipo da notificação' })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ enum: NotificationChannel, isArray: true, description: 'Canais de envio' })
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  @ArrayMinSize(1)
  channels: NotificationChannel[];

  @ApiProperty({ type: [NotificationRecipientDto], description: 'Destinatários' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationRecipientDto)
  @ArrayMinSize(1)
  recipients: NotificationRecipientDto[];

  @ApiPropertyOptional({ description: 'Título da notificação' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: 'Mensagem da notificação' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  message?: string;

  @ApiPropertyOptional({ description: 'ID do template' })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Variáveis para o template' })
  @IsOptional()
  @IsObject()
  templateVariables?: Record<string, any>;

  @ApiPropertyOptional({ enum: NotificationPriority, description: 'Prioridade' })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiPropertyOptional({ enum: ScheduleType, description: 'Tipo de agendamento' })
  @IsOptional()
  @IsEnum(ScheduleType)
  scheduleType?: ScheduleType;

  @ApiPropertyOptional({ description: 'Data/hora de envio agendado' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ description: 'ID da entidade relacionada' })
  @IsOptional()
  @IsString()
  relatedEntityId?: string;

  @ApiPropertyOptional({ description: 'Tipo da entidade relacionada' })
  @IsOptional()
  @IsString()
  relatedEntityType?: string;

  @ApiPropertyOptional({ description: 'URL de ação' })
  @IsOptional()
  @IsString()
  actionUrl?: string;

  @ApiPropertyOptional({ description: 'Texto do botão de ação' })
  @IsOptional()
  @IsString()
  actionText?: string;

  @ApiPropertyOptional({ description: 'URL da imagem' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Metadata adicional' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'TTL em segundos para expiração' })
  @IsOptional()
  @IsNumber()
  @Min(60)
  @Max(2592000) // 30 days
  ttl?: number;
}

export class SendSingleNotificationDto {
  @ApiProperty({ description: 'ID do usuário destinatário' })
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: NotificationType, description: 'Tipo da notificação' })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiPropertyOptional({ enum: NotificationChannel, isArray: true, description: 'Canais' })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels?: NotificationChannel[];

  @ApiPropertyOptional({ description: 'Título' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Mensagem' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ description: 'ID do template' })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Variáveis do template' })
  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;

  @ApiPropertyOptional({ description: 'ID da entidade relacionada' })
  @IsOptional()
  @IsString()
  relatedEntityId?: string;

  @ApiPropertyOptional({ description: 'Tipo da entidade relacionada' })
  @IsOptional()
  @IsString()
  relatedEntityType?: string;
}

export class SendBulkNotificationDto {
  @ApiProperty({ enum: NotificationType, description: 'Tipo da notificação' })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ enum: NotificationChannel, isArray: true, description: 'Canais' })
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels: NotificationChannel[];

  @ApiPropertyOptional({ description: 'IDs dos usuários (se não usar filtros)' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  userIds?: string[];

  @ApiPropertyOptional({ description: 'Filtros de audiência' })
  @IsOptional()
  @IsObject()
  audienceFilters?: {
    roles?: string[];
    clinicIds?: string[];
    tags?: string[];
    ageRange?: { min?: number; max?: number };
    gender?: string;
    city?: string;
    state?: string;
  };

  @ApiPropertyOptional({ description: 'ID do template' })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Variáveis do template' })
  @IsOptional()
  @IsObject()
  templateVariables?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Título' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Mensagem' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ enum: ScheduleType, description: 'Tipo de agendamento' })
  @IsOptional()
  @IsEnum(ScheduleType)
  scheduleType?: ScheduleType;

  @ApiPropertyOptional({ description: 'Data/hora de envio' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ enum: NotificationPriority, description: 'Prioridade' })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;
}

export class MarkNotificationReadDto {
  @ApiProperty({ description: 'IDs das notificações' })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  notificationIds: string[];
}

export class CancelNotificationDto {
  @ApiProperty({ description: 'Motivo do cancelamento' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

// ==================== Schedule/Reminder DTOs ====================

export class ScheduleRecurrenceDto {
  @ApiProperty({ enum: RecurrencePattern, description: 'Padrão de recorrência' })
  @IsEnum(RecurrencePattern)
  pattern: RecurrencePattern;

  @ApiPropertyOptional({ description: 'Intervalo (a cada N dias/semanas/meses)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  interval?: number;

  @ApiPropertyOptional({ description: 'Dias da semana (0=Dom, 6=Sab)' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  daysOfWeek?: number[];

  @ApiPropertyOptional({ description: 'Dia do mês' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(31)
  dayOfMonth?: number;

  @ApiPropertyOptional({ description: 'Horário (HH:mm)' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  time?: string;

  @ApiPropertyOptional({ description: 'Data de término' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Máximo de ocorrências' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxOccurrences?: number;
}

export class CreateScheduledNotificationDto {
  @ApiProperty({ description: 'ID do usuário' })
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: NotificationType, description: 'Tipo' })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ enum: NotificationChannel, isArray: true, description: 'Canais' })
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels: NotificationChannel[];

  @ApiPropertyOptional({ description: 'ID do template' })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Título' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Mensagem' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ description: 'Variáveis' })
  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;

  @ApiProperty({ description: 'Data/hora de início' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ type: ScheduleRecurrenceDto, description: 'Recorrência' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ScheduleRecurrenceDto)
  recurrence?: ScheduleRecurrenceDto;

  @ApiPropertyOptional({ description: 'ID da entidade relacionada' })
  @IsOptional()
  @IsString()
  relatedEntityId?: string;

  @ApiPropertyOptional({ description: 'Tipo da entidade relacionada' })
  @IsOptional()
  @IsString()
  relatedEntityType?: string;

  @ApiPropertyOptional({ description: 'Ativo' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateScheduledNotificationDto {
  @ApiPropertyOptional({ description: 'Título' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Mensagem' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ enum: NotificationChannel, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels?: NotificationChannel[];

  @ApiPropertyOptional({ description: 'Data/hora de início' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ type: ScheduleRecurrenceDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ScheduleRecurrenceDto)
  recurrence?: ScheduleRecurrenceDto;

  @ApiPropertyOptional({ description: 'Ativo' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ==================== Template DTOs ====================

export class CreateNotificationTemplateDto {
  @ApiProperty({ description: 'Código único do template' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9_]+$/)
  code: string;

  @ApiProperty({ description: 'Nome do template' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: TemplateCategory, description: 'Categoria' })
  @IsEnum(TemplateCategory)
  category: TemplateCategory;

  @ApiProperty({ enum: NotificationType, description: 'Tipo de notificação' })
  @IsEnum(NotificationType)
  notificationType: NotificationType;

  @ApiProperty({ enum: NotificationChannel, isArray: true, description: 'Canais suportados' })
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  supportedChannels: NotificationChannel[];

  @ApiPropertyOptional({ description: 'Assunto do email' })
  @IsOptional()
  @IsString()
  emailSubject?: string;

  @ApiPropertyOptional({ description: 'Corpo do email (HTML)' })
  @IsOptional()
  @IsString()
  emailBody?: string;

  @ApiPropertyOptional({ description: 'Corpo do email (texto)' })
  @IsOptional()
  @IsString()
  emailBodyText?: string;

  @ApiPropertyOptional({ description: 'Mensagem SMS' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  smsMessage?: string;

  @ApiPropertyOptional({ description: 'Título push' })
  @IsOptional()
  @IsString()
  pushTitle?: string;

  @ApiPropertyOptional({ description: 'Corpo push' })
  @IsOptional()
  @IsString()
  pushBody?: string;

  @ApiPropertyOptional({ description: 'Mensagem WhatsApp' })
  @IsOptional()
  @IsString()
  whatsappMessage?: string;

  @ApiPropertyOptional({ description: 'ID do template WhatsApp' })
  @IsOptional()
  @IsString()
  whatsappTemplateId?: string;

  @ApiPropertyOptional({ description: 'Título in-app' })
  @IsOptional()
  @IsString()
  inAppTitle?: string;

  @ApiPropertyOptional({ description: 'Mensagem in-app' })
  @IsOptional()
  @IsString()
  inAppMessage?: string;

  @ApiPropertyOptional({ description: 'Variáveis disponíveis' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  availableVariables?: string[];

  @ApiPropertyOptional({ description: 'Se é ativo' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Idioma padrão' })
  @IsOptional()
  @IsString()
  defaultLocale?: string;

  @ApiPropertyOptional({ description: 'Traduções' })
  @IsOptional()
  @IsObject()
  translations?: Record<string, {
    emailSubject?: string;
    emailBody?: string;
    smsMessage?: string;
    pushTitle?: string;
    pushBody?: string;
    whatsappMessage?: string;
    inAppTitle?: string;
    inAppMessage?: string;
  }>;
}

export class UpdateNotificationTemplateDto {
  @ApiPropertyOptional({ description: 'Nome' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Assunto do email' })
  @IsOptional()
  @IsString()
  emailSubject?: string;

  @ApiPropertyOptional({ description: 'Corpo do email' })
  @IsOptional()
  @IsString()
  emailBody?: string;

  @ApiPropertyOptional({ description: 'Mensagem SMS' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  smsMessage?: string;

  @ApiPropertyOptional({ description: 'Título push' })
  @IsOptional()
  @IsString()
  pushTitle?: string;

  @ApiPropertyOptional({ description: 'Corpo push' })
  @IsOptional()
  @IsString()
  pushBody?: string;

  @ApiPropertyOptional({ description: 'Mensagem WhatsApp' })
  @IsOptional()
  @IsString()
  whatsappMessage?: string;

  @ApiPropertyOptional({ description: 'Título in-app' })
  @IsOptional()
  @IsString()
  inAppTitle?: string;

  @ApiPropertyOptional({ description: 'Mensagem in-app' })
  @IsOptional()
  @IsString()
  inAppMessage?: string;

  @ApiPropertyOptional({ description: 'Ativo' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Traduções' })
  @IsOptional()
  @IsObject()
  translations?: Record<string, any>;
}

export class TestTemplateDto {
  @ApiProperty({ description: 'ID do template' })
  @IsUUID()
  templateId: string;

  @ApiProperty({ enum: NotificationChannel, description: 'Canal para teste' })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @ApiProperty({ description: 'Email ou telefone para teste' })
  @IsString()
  @IsNotEmpty()
  recipient: string;

  @ApiPropertyOptional({ description: 'Variáveis de teste' })
  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;
}

// ==================== Preferences DTOs ====================

export class ChannelPreferenceDto {
  @ApiProperty({ enum: NotificationChannel, description: 'Canal' })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @ApiProperty({ description: 'Habilitado' })
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ description: 'Horário de início (não perturbe)' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  quietHoursStart?: string;

  @ApiPropertyOptional({ description: 'Horário de fim (não perturbe)' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  quietHoursEnd?: string;
}

export class TypePreferenceDto {
  @ApiProperty({ enum: NotificationType, description: 'Tipo de notificação' })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'Habilitado' })
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ enum: NotificationChannel, isArray: true, description: 'Canais permitidos' })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  allowedChannels?: NotificationChannel[];
}

export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional({ description: 'Todas as notificações ativas' })
  @IsOptional()
  @IsBoolean()
  allNotificationsEnabled?: boolean;

  @ApiPropertyOptional({ type: [ChannelPreferenceDto], description: 'Preferências por canal' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChannelPreferenceDto)
  channelPreferences?: ChannelPreferenceDto[];

  @ApiPropertyOptional({ type: [TypePreferenceDto], description: 'Preferências por tipo' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TypePreferenceDto)
  typePreferences?: TypePreferenceDto[];

  @ApiPropertyOptional({ description: 'Timezone' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Idioma preferido' })
  @IsOptional()
  @IsString()
  preferredLocale?: string;

  @ApiPropertyOptional({ description: 'Receber emails de marketing' })
  @IsOptional()
  @IsBoolean()
  marketingEmails?: boolean;

  @ApiPropertyOptional({ description: 'Receber SMS de marketing' })
  @IsOptional()
  @IsBoolean()
  marketingSms?: boolean;
}

// ==================== Device Token DTOs ====================

export class RegisterDeviceTokenDto {
  @ApiProperty({ description: 'Token do dispositivo' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: 'Plataforma (ios, android, web)' })
  @IsString()
  @IsNotEmpty()
  platform: string;

  @ApiPropertyOptional({ description: 'ID do dispositivo' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({ description: 'Nome do dispositivo' })
  @IsOptional()
  @IsString()
  deviceName?: string;

  @ApiPropertyOptional({ description: 'Versão do app' })
  @IsOptional()
  @IsString()
  appVersion?: string;

  @ApiPropertyOptional({ description: 'Versão do OS' })
  @IsOptional()
  @IsString()
  osVersion?: string;
}

export class UnregisterDeviceTokenDto {
  @ApiProperty({ description: 'Token do dispositivo' })
  @IsString()
  @IsNotEmpty()
  token: string;
}

// ==================== Webhook DTOs ====================

export class EmailWebhookDto {
  @ApiProperty({ description: 'ID da mensagem' })
  @IsString()
  messageId: string;

  @ApiProperty({ description: 'Evento (delivered, opened, clicked, bounced, etc)' })
  @IsString()
  event: string;

  @ApiPropertyOptional({ description: 'Timestamp do evento' })
  @IsOptional()
  @IsDateString()
  timestamp?: string;

  @ApiPropertyOptional({ description: 'Email do destinatário' })
  @IsOptional()
  @IsEmail()
  recipient?: string;

  @ApiPropertyOptional({ description: 'Dados adicionais' })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}

export class SmsWebhookDto {
  @ApiProperty({ description: 'ID da mensagem' })
  @IsString()
  messageId: string;

  @ApiProperty({ description: 'Status (sent, delivered, failed)' })
  @IsString()
  status: string;

  @ApiPropertyOptional({ description: 'Timestamp' })
  @IsOptional()
  @IsDateString()
  timestamp?: string;

  @ApiPropertyOptional({ description: 'Telefone do destinatário' })
  @IsOptional()
  @IsString()
  recipient?: string;

  @ApiPropertyOptional({ description: 'Código de erro' })
  @IsOptional()
  @IsString()
  errorCode?: string;

  @ApiPropertyOptional({ description: 'Mensagem de erro' })
  @IsOptional()
  @IsString()
  errorMessage?: string;
}

// ==================== Statistics DTOs ====================

export class NotificationStatsQueryDto {
  @ApiPropertyOptional({ description: 'Data início' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data fim' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: NotificationChannel, description: 'Filtrar por canal' })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @ApiPropertyOptional({ enum: NotificationType, description: 'Filtrar por tipo' })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({ description: 'Agrupar por' })
  @IsOptional()
  @IsString()
  groupBy?: string;
}
