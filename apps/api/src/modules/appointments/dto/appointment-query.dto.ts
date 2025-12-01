import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsArray,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentTypeEnum, AppointmentStatusEnum } from './create-appointment.dto';

// ═══════════════════════════════════════════════════════════════════════════════
// APPOINTMENT QUERY DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class AppointmentQueryDto {
  @ApiPropertyOptional({ description: 'ID da clínica' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'ID do médico' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiPropertyOptional({ description: 'ID do paciente' })
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiPropertyOptional({ description: 'ID da sala' })
  @IsOptional()
  @IsUUID()
  roomId?: string;

  @ApiPropertyOptional({ description: 'ID da especialidade' })
  @IsOptional()
  @IsUUID()
  specialtyId?: string;

  @ApiPropertyOptional({ enum: AppointmentTypeEnum, description: 'Tipo de consulta' })
  @IsOptional()
  @IsEnum(AppointmentTypeEnum)
  type?: AppointmentTypeEnum;

  @ApiPropertyOptional({ enum: AppointmentStatusEnum, description: 'Status do agendamento' })
  @IsOptional()
  @IsEnum(AppointmentStatusEnum)
  status?: AppointmentStatusEnum;

  @ApiPropertyOptional({ enum: AppointmentStatusEnum, isArray: true, description: 'Múltiplos status' })
  @IsOptional()
  @IsArray()
  @IsEnum(AppointmentStatusEnum, { each: true })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  statuses?: AppointmentStatusEnum[];

  @ApiPropertyOptional({ description: 'Data de início (a partir de)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data de fim (até)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Apenas data específica' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Consultas de hoje apenas', default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  today?: boolean;

  @ApiPropertyOptional({ description: 'Consultas da semana atual', default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  thisWeek?: boolean;

  @ApiPropertyOptional({ description: 'Consultas do mês atual', default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  thisMonth?: boolean;

  @ApiPropertyOptional({ description: 'Apenas telemedicina', default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  telemedicineOnly?: boolean;

  @ApiPropertyOptional({ description: 'Apenas presencial', default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  inPersonOnly?: boolean;

  @ApiPropertyOptional({ description: 'Apenas primeira consulta', default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  firstVisitOnly?: boolean;

  @ApiPropertyOptional({ description: 'Apenas retornos', default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  returnsOnly?: boolean;

  @ApiPropertyOptional({ description: 'Particular ou convênio', enum: ['PRIVATE', 'INSURANCE', 'ALL'] })
  @IsOptional()
  @IsString()
  paymentType?: 'PRIVATE' | 'INSURANCE' | 'ALL';

  @ApiPropertyOptional({ description: 'ID do convênio' })
  @IsOptional()
  @IsUUID()
  insuranceId?: string;

  @ApiPropertyOptional({ description: 'Prioridade mínima' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  minPriority?: number;

  @ApiPropertyOptional({ description: 'Busca por nome do paciente' })
  @IsOptional()
  @IsString()
  patientSearch?: string;

  @ApiPropertyOptional({ description: 'Busca por nome do médico' })
  @IsOptional()
  @IsString()
  doctorSearch?: string;

  @ApiPropertyOptional({ description: 'Tags para filtrar', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  tags?: string[];

  @ApiPropertyOptional({ description: 'Incluir cancelados', default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeCancelled?: boolean;

  @ApiPropertyOptional({ description: 'Incluir no-shows', default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeNoShows?: boolean;

  @ApiPropertyOptional({ description: 'Ordenar por', enum: ['startTime', 'createdAt', 'patientName', 'doctorName', 'status', 'priority'] })
  @IsOptional()
  @IsString()
  sortBy?: 'startTime' | 'createdAt' | 'patientName' | 'doctorName' | 'status' | 'priority';

  @ApiPropertyOptional({ description: 'Ordem', enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Página', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Itens por página', default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALENDAR QUERY DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class CalendarQueryDto {
  @ApiPropertyOptional({ description: 'ID da clínica' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'IDs dos médicos', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  doctorIds?: string[];

  @ApiPropertyOptional({ description: 'IDs das salas', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  roomIds?: string[];

  @ApiPropertyOptional({ description: 'Data de início do período' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data de fim do período' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Visualização', enum: ['day', 'week', 'month', 'agenda'], default: 'week' })
  @IsOptional()
  @IsString()
  view?: 'day' | 'week' | 'month' | 'agenda';

  @ApiPropertyOptional({ description: 'Incluir bloqueios de agenda', default: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeBlocks?: boolean;

  @ApiPropertyOptional({ description: 'Incluir férias', default: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeVacations?: boolean;

  @ApiPropertyOptional({ description: 'Agrupar por', enum: ['doctor', 'room', 'specialty', 'none'], default: 'none' })
  @IsOptional()
  @IsString()
  groupBy?: 'doctor' | 'room' | 'specialty' | 'none';
}

// ═══════════════════════════════════════════════════════════════════════════════
// AVAILABLE SLOTS QUERY DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class AvailableSlotsQueryDto {
  @ApiPropertyOptional({ description: 'ID do médico' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiPropertyOptional({ description: 'ID da clínica' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'ID da especialidade' })
  @IsOptional()
  @IsUUID()
  specialtyId?: string;

  @ApiPropertyOptional({ description: 'ID da sala' })
  @IsOptional()
  @IsUUID()
  roomId?: string;

  @ApiProperty({ description: 'Data de início' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ description: 'Data de fim (default: 7 dias)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Duração necessária (minutos)', default: 30 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(480)
  @Type(() => Number)
  durationMinutes?: number;

  @ApiPropertyOptional({ description: 'Tipo de consulta' })
  @IsOptional()
  @IsEnum(AppointmentTypeEnum)
  appointmentType?: AppointmentTypeEnum;

  @ApiPropertyOptional({ description: 'Apenas telemedicina', default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  telemedicineOnly?: boolean;

  @ApiPropertyOptional({ description: 'Horário mais cedo do dia (HH:mm)' })
  @IsOptional()
  @IsString()
  earliestTime?: string;

  @ApiPropertyOptional({ description: 'Horário mais tarde do dia (HH:mm)' })
  @IsOptional()
  @IsString()
  latestTime?: string;

  @ApiPropertyOptional({ description: 'Dias da semana desejados', type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? [parseInt(value)] : value?.map((v: string) => parseInt(v))))
  daysOfWeek?: number[];

  @ApiPropertyOptional({ description: 'Limite de slots retornados', default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// WAITING LIST QUERY DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class WaitingListQueryDto {
  @ApiPropertyOptional({ description: 'ID da clínica' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'ID do médico' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiPropertyOptional({ description: 'ID do paciente' })
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiPropertyOptional({ description: 'ID da especialidade' })
  @IsOptional()
  @IsUUID()
  specialtyId?: string;

  @ApiPropertyOptional({ description: 'Prioridade mínima' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  minPriority?: number;

  @ApiPropertyOptional({ description: 'Status', enum: ['WAITING', 'CONTACTED', 'SCHEDULED', 'CANCELLED', 'EXPIRED'] })
  @IsOptional()
  @IsString()
  status?: 'WAITING' | 'CONTACTED' | 'SCHEDULED' | 'CANCELLED' | 'EXPIRED';

  @ApiPropertyOptional({ description: 'Data preferida (a partir de)' })
  @IsOptional()
  @IsDateString()
  preferredDateFrom?: string;

  @ApiPropertyOptional({ description: 'Data preferida (até)' })
  @IsOptional()
  @IsDateString()
  preferredDateTo?: string;

  @ApiPropertyOptional({ description: 'Ordenar por', enum: ['createdAt', 'priority', 'preferredDate'] })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'priority' | 'preferredDate';

  @ApiPropertyOptional({ description: 'Ordem', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Página', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Itens por página', default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// APPOINTMENT STATS QUERY DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class AppointmentStatsQueryDto {
  @ApiPropertyOptional({ description: 'ID da clínica' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'ID do médico' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiPropertyOptional({ description: 'Data de início do período' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data de fim do período' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Agrupar por', enum: ['day', 'week', 'month', 'year'], default: 'day' })
  @IsOptional()
  @IsString()
  groupBy?: 'day' | 'week' | 'month' | 'year';

  @ApiPropertyOptional({ description: 'Comparar com período anterior', default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  comparePrevious?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// REMINDERS QUERY DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class RemindersQueryDto {
  @ApiPropertyOptional({ description: 'ID da clínica' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'Tipo de lembrete', enum: ['EMAIL', 'SMS', 'WHATSAPP', 'PUSH'] })
  @IsOptional()
  @IsString()
  type?: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH';

  @ApiPropertyOptional({ description: 'Status', enum: ['PENDING', 'SENT', 'FAILED', 'CANCELLED'] })
  @IsOptional()
  @IsString()
  status?: 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED';

  @ApiPropertyOptional({ description: 'Data de envio (a partir de)' })
  @IsOptional()
  @IsDateString()
  scheduledFrom?: string;

  @ApiPropertyOptional({ description: 'Data de envio (até)' })
  @IsOptional()
  @IsDateString()
  scheduledTo?: string;

  @ApiPropertyOptional({ description: 'Página', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Itens por página', default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}
