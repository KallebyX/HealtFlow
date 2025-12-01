import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsNumber,
  IsUUID,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsString,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  NotificationChannel,
  NotificationType,
  NotificationStatus,
  NotificationPriority,
  TemplateCategory,
} from './create-notification.dto';

// ==================== Base Query DTO ====================

export class BasePaginationQueryDto {
  @ApiPropertyOptional({ description: 'Página', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Itens por página', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Campo para ordenação' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], description: 'Direção' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

// ==================== Notification Query DTOs ====================

export class NotificationQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({ description: 'ID do usuário' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ enum: NotificationType, description: 'Tipo' })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({ enum: NotificationType, isArray: true, description: 'Tipos' })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationType, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  types?: NotificationType[];

  @ApiPropertyOptional({ enum: NotificationChannel, description: 'Canal' })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @ApiPropertyOptional({ enum: NotificationStatus, description: 'Status' })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @ApiPropertyOptional({ enum: NotificationStatus, isArray: true, description: 'Status' })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationStatus, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  statuses?: NotificationStatus[];

  @ApiPropertyOptional({ enum: NotificationPriority, description: 'Prioridade' })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiPropertyOptional({ description: 'Apenas não lidas' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  unreadOnly?: boolean;

  @ApiPropertyOptional({ description: 'Data de criação início' })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({ description: 'Data de criação fim' })
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiPropertyOptional({ description: 'ID da entidade relacionada' })
  @IsOptional()
  @IsString()
  relatedEntityId?: string;

  @ApiPropertyOptional({ description: 'Tipo da entidade relacionada' })
  @IsOptional()
  @IsString()
  relatedEntityType?: string;
}

export class UserNotificationsQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({ enum: NotificationType, description: 'Tipo' })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({ enum: NotificationChannel, description: 'Canal' })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @ApiPropertyOptional({ description: 'Apenas não lidas' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  unreadOnly?: boolean;

  @ApiPropertyOptional({ description: 'Data início' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Data fim' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

export class NotificationHistoryQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({ description: 'ID do usuário' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ enum: NotificationChannel, description: 'Canal' })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @ApiPropertyOptional({ enum: NotificationStatus, description: 'Status' })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @ApiPropertyOptional({ description: 'Data início' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Data fim' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Apenas falhas' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  failedOnly?: boolean;
}

// ==================== Template Query DTOs ====================

export class TemplateQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({ description: 'Busca por código ou nome' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: TemplateCategory, description: 'Categoria' })
  @IsOptional()
  @IsEnum(TemplateCategory)
  category?: TemplateCategory;

  @ApiPropertyOptional({ enum: NotificationType, description: 'Tipo de notificação' })
  @IsOptional()
  @IsEnum(NotificationType)
  notificationType?: NotificationType;

  @ApiPropertyOptional({ enum: NotificationChannel, description: 'Canal suportado' })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @ApiPropertyOptional({ description: 'Apenas ativos' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  activeOnly?: boolean;
}

// ==================== Scheduled Notification Query DTOs ====================

export class ScheduledNotificationQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({ description: 'ID do usuário' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ enum: NotificationType, description: 'Tipo' })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({ description: 'Apenas ativos' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  activeOnly?: boolean;

  @ApiPropertyOptional({ description: 'Data de início (agendamento) desde' })
  @IsOptional()
  @IsDateString()
  scheduledFrom?: string;

  @ApiPropertyOptional({ description: 'Data de início (agendamento) até' })
  @IsOptional()
  @IsDateString()
  scheduledTo?: string;

  @ApiPropertyOptional({ description: 'Apenas recorrentes' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  recurringOnly?: boolean;

  @ApiPropertyOptional({ description: 'ID da entidade relacionada' })
  @IsOptional()
  @IsString()
  relatedEntityId?: string;
}

// ==================== Device Token Query DTOs ====================

export class DeviceTokenQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({ description: 'ID do usuário' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Plataforma' })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({ description: 'Apenas ativos' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  activeOnly?: boolean;
}

// ==================== Statistics Query DTOs ====================

export class NotificationStatisticsQueryDto {
  @ApiPropertyOptional({ description: 'Data início' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data fim' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: NotificationChannel, description: 'Canal' })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @ApiPropertyOptional({ enum: NotificationType, description: 'Tipo' })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({ description: 'Granularidade (hour, day, week, month)' })
  @IsOptional()
  @IsString()
  granularity?: string;

  @ApiPropertyOptional({ description: 'Agrupar por canal' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  groupByChannel?: boolean;

  @ApiPropertyOptional({ description: 'Agrupar por tipo' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  groupByType?: boolean;

  @ApiPropertyOptional({ description: 'Agrupar por status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  groupByStatus?: boolean;
}

export class DeliveryReportQueryDto {
  @ApiPropertyOptional({ description: 'Data início' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data fim' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: NotificationChannel, description: 'Canal' })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @ApiPropertyOptional({ description: 'Incluir detalhes' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeDetails?: boolean;
}

// ==================== Bulk Operations Query DTOs ====================

export class BulkNotificationQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({ description: 'ID do lote' })
  @IsOptional()
  @IsUUID()
  batchId?: string;

  @ApiPropertyOptional({ enum: NotificationStatus, description: 'Status' })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @ApiPropertyOptional({ description: 'Data de criação início' })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({ description: 'Data de criação fim' })
  @IsOptional()
  @IsDateString()
  createdTo?: string;
}

// ==================== Preferences Query DTOs ====================

export class PreferencesQueryDto {
  @ApiPropertyOptional({ description: 'ID do usuário' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ enum: NotificationChannel, description: 'Canal' })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @ApiPropertyOptional({ enum: NotificationType, description: 'Tipo' })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;
}

// ==================== Dashboard Query DTOs ====================

export class NotificationDashboardQueryDto {
  @ApiPropertyOptional({ description: 'Período (today, week, month)' })
  @IsOptional()
  @IsString()
  period?: string;

  @ApiPropertyOptional({ description: 'Data início' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data fim' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
