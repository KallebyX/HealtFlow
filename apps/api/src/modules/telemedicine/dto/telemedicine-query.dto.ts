import {
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsBoolean,
  IsString,
  IsNumber,
  Min,
  Max,
  IsArray,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TelemedicineSessionType, TelemedicineSessionStatus } from './create-telemedicine.dto';

export class TelemedicineSessionQueryDto {
  @ApiPropertyOptional({ description: 'Número da página' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Itens por página' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Filtrar por paciente' })
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por médico' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por clínica' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por agendamento' })
  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @ApiPropertyOptional({ enum: TelemedicineSessionStatus, description: 'Status da sessão' })
  @IsOptional()
  @IsEnum(TelemedicineSessionStatus)
  status?: TelemedicineSessionStatus;

  @ApiPropertyOptional({ enum: TelemedicineSessionStatus, isArray: true, description: 'Múltiplos status' })
  @IsOptional()
  @IsArray()
  @IsEnum(TelemedicineSessionStatus, { each: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  statuses?: TelemedicineSessionStatus[];

  @ApiPropertyOptional({ enum: TelemedicineSessionType, description: 'Tipo de sessão' })
  @IsOptional()
  @IsEnum(TelemedicineSessionType)
  sessionType?: TelemedicineSessionType;

  @ApiPropertyOptional({ description: 'Data inicial' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data final' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Apenas hoje' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  todayOnly?: boolean;

  @ApiPropertyOptional({ description: 'Sessões ativas' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  activeOnly?: boolean;

  @ApiPropertyOptional({ description: 'Especialidade' })
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiPropertyOptional({ description: 'É retorno' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isFollowUp?: boolean;

  @ApiPropertyOptional({ description: 'Com gravação' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  hasRecording?: boolean;

  @ApiPropertyOptional({ description: 'Ordenação' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'scheduledStartTime';

  @ApiPropertyOptional({ description: 'Direção da ordenação' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ description: 'Incluir canceladas' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeCancelled?: boolean = false;
}

export class UpcomingSessionsQueryDto {
  @ApiPropertyOptional({ description: 'Número de horas à frente' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(168) // 1 semana
  hoursAhead?: number = 24;

  @ApiPropertyOptional({ description: 'Limite de resultados' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Filtrar por médico' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por paciente' })
  @IsOptional()
  @IsUUID()
  patientId?: string;
}

export class SessionHistoryQueryDto {
  @ApiPropertyOptional({ description: 'Número da página' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Itens por página' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'ID do paciente' })
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiPropertyOptional({ description: 'ID do médico' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiPropertyOptional({ description: 'Período inicial' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Período final' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Incluir estatísticas' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeStats?: boolean = false;
}

export class ChatMessagesQueryDto {
  @ApiPropertyOptional({ description: 'Número da página' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Itens por página' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiPropertyOptional({ description: 'Buscar por conteúdo' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Tipo de mensagem' })
  @IsOptional()
  @IsEnum(['TEXT', 'FILE', 'IMAGE', 'LINK'])
  messageType?: string;

  @ApiPropertyOptional({ description: 'Após timestamp' })
  @IsOptional()
  @IsDateString()
  after?: string;

  @ApiPropertyOptional({ description: 'Antes de timestamp' })
  @IsOptional()
  @IsDateString()
  before?: string;
}

export class SharedFilesQueryDto {
  @ApiPropertyOptional({ description: 'Número da página' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Itens por página' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Categoria do arquivo' })
  @IsOptional()
  @IsEnum(['EXAM_RESULT', 'PRESCRIPTION', 'MEDICAL_REPORT', 'IMAGE', 'OTHER'])
  category?: string;

  @ApiPropertyOptional({ description: 'Tipo MIME' })
  @IsOptional()
  @IsString()
  mimeType?: string;
}

export class TelemedicineStatisticsQueryDto {
  @ApiPropertyOptional({ description: 'ID da clínica' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'ID do médico' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiPropertyOptional({ description: 'Período inicial' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Período final' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Agrupamento' })
  @IsOptional()
  @IsEnum(['day', 'week', 'month', 'year'])
  groupBy?: string = 'day';

  @ApiPropertyOptional({ description: 'Incluir métricas de qualidade' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeQualityMetrics?: boolean = true;

  @ApiPropertyOptional({ description: 'Incluir avaliações' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeRatings?: boolean = true;
}

export class WaitingRoomQueryDto {
  @ApiPropertyOptional({ description: 'ID da sessão' })
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'ID do médico' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiPropertyOptional({ description: 'Apenas aguardando admissão' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  pendingAdmission?: boolean = true;
}

export class RecordingsQueryDto {
  @ApiPropertyOptional({ description: 'Número da página' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Itens por página' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'ID da sessão' })
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'ID do paciente' })
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiPropertyOptional({ description: 'ID do médico' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiPropertyOptional({ description: 'Período inicial' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Período final' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class TechnicalIssuesQueryDto {
  @ApiPropertyOptional({ description: 'Número da página' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Itens por página' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Tipo do problema' })
  @IsOptional()
  @IsString()
  issueType?: string;

  @ApiPropertyOptional({ description: 'Severidade' })
  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  severity?: string;

  @ApiPropertyOptional({ description: 'Período inicial' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Período final' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Apenas não resolvidos' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  unresolvedOnly?: boolean;
}
