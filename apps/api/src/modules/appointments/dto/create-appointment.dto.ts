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
  ValidateNested,
  IsNumber,
  IsUrl,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { AppointmentType, AppointmentStatus } from '@prisma/client';

// ═══════════════════════════════════════════════════════════════════════════════
// APPOINTMENT TYPE ENUM (se não existir no Prisma)
// ═══════════════════════════════════════════════════════════════════════════════

export enum AppointmentTypeEnum {
  FIRST_VISIT = 'FIRST_VISIT',
  FOLLOW_UP = 'FOLLOW_UP',
  RETURN = 'RETURN',
  EXAM = 'EXAM',
  PROCEDURE = 'PROCEDURE',
  TELEMEDICINE = 'TELEMEDICINE',
  EMERGENCY = 'EMERGENCY',
  ROUTINE = 'ROUTINE',
  VACCINATION = 'VACCINATION',
  PRE_OPERATIVE = 'PRE_OPERATIVE',
  POST_OPERATIVE = 'POST_OPERATIVE',
}

export enum AppointmentStatusEnum {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  RESCHEDULED = 'RESCHEDULED',
}

export enum RecurrenceType {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
}

export enum CancellationReason {
  PATIENT_REQUEST = 'PATIENT_REQUEST',
  DOCTOR_UNAVAILABLE = 'DOCTOR_UNAVAILABLE',
  CLINIC_CLOSED = 'CLINIC_CLOSED',
  EMERGENCY = 'EMERGENCY',
  NO_SHOW = 'NO_SHOW',
  RESCHEDULED = 'RESCHEDULED',
  INSURANCE_ISSUE = 'INSURANCE_ISSUE',
  DUPLICATE = 'DUPLICATE',
  OTHER = 'OTHER',
}

// ═══════════════════════════════════════════════════════════════════════════════
// NESTED DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class RecurrenceDto {
  @ApiProperty({ enum: RecurrenceType, description: 'Tipo de recorrência' })
  @IsEnum(RecurrenceType)
  type: RecurrenceType;

  @ApiPropertyOptional({ description: 'Intervalo em dias/semanas/meses' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  interval?: number;

  @ApiPropertyOptional({ description: 'Data final da recorrência' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Número máximo de ocorrências' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(52)
  maxOccurrences?: number;

  @ApiPropertyOptional({ description: 'Dias da semana (0=Dom, 6=Sáb)', type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  daysOfWeek?: number[];
}

export class ReminderDto {
  @ApiProperty({ description: 'Tipo de lembrete', enum: ['EMAIL', 'SMS', 'WHATSAPP', 'PUSH'] })
  @IsString()
  type: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH';

  @ApiProperty({ description: 'Minutos antes do agendamento' })
  @IsInt()
  @Min(5)
  @Max(10080) // 7 dias
  minutesBefore: number;

  @ApiPropertyOptional({ description: 'Mensagem personalizada' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  customMessage?: string;
}

export class AppointmentInsuranceDto {
  @ApiProperty({ description: 'ID do convênio' })
  @IsUUID()
  insuranceId: string;

  @ApiPropertyOptional({ description: 'Número da guia' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  authorizationNumber?: string;

  @ApiPropertyOptional({ description: 'Código do procedimento' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  procedureCode?: string;

  @ApiPropertyOptional({ description: 'Valor autorizado' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  authorizedAmount?: number;
}

export class TelemedicineInfoDto {
  @ApiPropertyOptional({ description: 'URL da sala de vídeo' })
  @IsOptional()
  @IsUrl()
  roomUrl?: string;

  @ApiPropertyOptional({ description: 'Provedor de vídeo', enum: ['WHEREBY', 'ZOOM', 'GOOGLE_MEET', 'TEAMS', 'CUSTOM'] })
  @IsOptional()
  @IsString()
  provider?: 'WHEREBY' | 'ZOOM' | 'GOOGLE_MEET' | 'TEAMS' | 'CUSTOM';

  @ApiPropertyOptional({ description: 'Senha da sala' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  password?: string;

  @ApiPropertyOptional({ description: 'Instruções para o paciente' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  instructions?: string;
}

export class PreAppointmentFormDto {
  @ApiPropertyOptional({ description: 'Motivo principal da consulta' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  chiefComplaint?: string;

  @ApiPropertyOptional({ description: 'Sintomas atuais', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  currentSymptoms?: string[];

  @ApiPropertyOptional({ description: 'Duração dos sintomas' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  symptomsDuration?: string;

  @ApiPropertyOptional({ description: 'Medicamentos em uso', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  currentMedications?: string[];

  @ApiPropertyOptional({ description: 'Alergias conhecidas', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @ApiPropertyOptional({ description: 'Observações adicionais' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  additionalNotes?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE APPOINTMENT DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class CreateAppointmentDto {
  @ApiProperty({ description: 'ID do paciente' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ description: 'ID do médico' })
  @IsUUID()
  doctorId: string;

  @ApiProperty({ description: 'ID da clínica' })
  @IsUUID()
  clinicId: string;

  @ApiPropertyOptional({ description: 'ID da sala/consultório' })
  @IsOptional()
  @IsUUID()
  roomId?: string;

  @ApiProperty({ description: 'Data e hora de início' })
  @IsDateString()
  startTime: string;

  @ApiPropertyOptional({ description: 'Data e hora de término' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ description: 'Duração em minutos', default: 30 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(480)
  durationMinutes?: number;

  @ApiProperty({ enum: AppointmentTypeEnum, description: 'Tipo de consulta' })
  @IsEnum(AppointmentTypeEnum)
  type: AppointmentTypeEnum;

  @ApiPropertyOptional({ enum: AppointmentStatusEnum, description: 'Status inicial', default: 'SCHEDULED' })
  @IsOptional()
  @IsEnum(AppointmentStatusEnum)
  status?: AppointmentStatusEnum;

  @ApiPropertyOptional({ description: 'ID da especialidade' })
  @IsOptional()
  @IsUUID()
  specialtyId?: string;

  @ApiPropertyOptional({ description: 'ID do procedimento' })
  @IsOptional()
  @IsUUID()
  procedureId?: string;

  @ApiPropertyOptional({ description: 'Motivo da consulta' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Instruções para o paciente' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  patientInstructions?: string;

  @ApiPropertyOptional({ description: 'É primeira consulta com este médico?', default: false })
  @IsOptional()
  @IsBoolean()
  isFirstVisit?: boolean;

  @ApiPropertyOptional({ description: 'Consulta de retorno?', default: false })
  @IsOptional()
  @IsBoolean()
  isReturn?: boolean;

  @ApiPropertyOptional({ description: 'ID da consulta original (para retornos)' })
  @IsOptional()
  @IsUUID()
  originalAppointmentId?: string;

  @ApiPropertyOptional({ description: 'Valor da consulta' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: 'Consulta particular?', default: false })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional({ description: 'Dados do convênio', type: AppointmentInsuranceDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AppointmentInsuranceDto)
  insurance?: AppointmentInsuranceDto;

  @ApiPropertyOptional({ description: 'Configuração de recorrência', type: RecurrenceDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RecurrenceDto)
  recurrence?: RecurrenceDto;

  @ApiPropertyOptional({ description: 'Lembretes configurados', type: [ReminderDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReminderDto)
  reminders?: ReminderDto[];

  @ApiPropertyOptional({ description: 'Informações de telemedicina', type: TelemedicineInfoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => TelemedicineInfoDto)
  telemedicine?: TelemedicineInfoDto;

  @ApiPropertyOptional({ description: 'Formulário pré-consulta', type: PreAppointmentFormDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PreAppointmentFormDto)
  preAppointmentForm?: PreAppointmentFormDto;

  @ApiPropertyOptional({ description: 'Prioridade (1=normal, 5=urgente)', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  priority?: number;

  @ApiPropertyOptional({ description: 'Tags/etiquetas', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Cor no calendário' })
  @IsOptional()
  @IsString()
  @MaxLength(7)
  color?: string;

  @ApiPropertyOptional({ description: 'Metadados adicionais' })
  @IsOptional()
  metadata?: Record<string, any>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE APPOINTMENT DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {}

// ═══════════════════════════════════════════════════════════════════════════════
// RESCHEDULE APPOINTMENT DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class RescheduleAppointmentDto {
  @ApiProperty({ description: 'Nova data e hora de início' })
  @IsDateString()
  newStartTime: string;

  @ApiPropertyOptional({ description: 'Nova data e hora de término' })
  @IsOptional()
  @IsDateString()
  newEndTime?: string;

  @ApiPropertyOptional({ description: 'Nova duração em minutos' })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(480)
  newDurationMinutes?: number;

  @ApiPropertyOptional({ description: 'Novo médico' })
  @IsOptional()
  @IsUUID()
  newDoctorId?: string;

  @ApiPropertyOptional({ description: 'Nova sala' })
  @IsOptional()
  @IsUUID()
  newRoomId?: string;

  @ApiProperty({ description: 'Motivo do reagendamento' })
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  reason: string;

  @ApiPropertyOptional({ description: 'Notificar paciente?', default: true })
  @IsOptional()
  @IsBoolean()
  notifyPatient?: boolean;

  @ApiPropertyOptional({ description: 'Notificar médico?', default: true })
  @IsOptional()
  @IsBoolean()
  notifyDoctor?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CANCEL APPOINTMENT DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class CancelAppointmentDto {
  @ApiProperty({ enum: CancellationReason, description: 'Motivo do cancelamento' })
  @IsEnum(CancellationReason)
  reason: CancellationReason;

  @ApiPropertyOptional({ description: 'Observações adicionais' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ description: 'Cancelado pelo paciente?', default: false })
  @IsOptional()
  @IsBoolean()
  cancelledByPatient?: boolean;

  @ApiPropertyOptional({ description: 'Notificar paciente?', default: true })
  @IsOptional()
  @IsBoolean()
  notifyPatient?: boolean;

  @ApiPropertyOptional({ description: 'Notificar médico?', default: true })
  @IsOptional()
  @IsBoolean()
  notifyDoctor?: boolean;

  @ApiPropertyOptional({ description: 'Reembolsar pagamento?', default: false })
  @IsOptional()
  @IsBoolean()
  refund?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIRM APPOINTMENT DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class ConfirmAppointmentDto {
  @ApiPropertyOptional({ description: 'Confirmado pelo paciente?', default: true })
  @IsOptional()
  @IsBoolean()
  confirmedByPatient?: boolean;

  @ApiPropertyOptional({ description: 'Método de confirmação', enum: ['PHONE', 'SMS', 'WHATSAPP', 'EMAIL', 'APP', 'WEBSITE'] })
  @IsOptional()
  @IsString()
  confirmationMethod?: 'PHONE' | 'SMS' | 'WHATSAPP' | 'EMAIL' | 'APP' | 'WEBSITE';

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHECK-IN DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class CheckInDto {
  @ApiPropertyOptional({ description: 'Hora do check-in (auto se não informado)' })
  @IsOptional()
  @IsDateString()
  checkInTime?: string;

  @ApiPropertyOptional({ description: 'Acompanhante presente?', default: false })
  @IsOptional()
  @IsBoolean()
  hasCompanion?: boolean;

  @ApiPropertyOptional({ description: 'Nome do acompanhante' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  companionName?: string;

  @ApiPropertyOptional({ description: 'Documentos verificados?', default: false })
  @IsOptional()
  @IsBoolean()
  documentsVerified?: boolean;

  @ApiPropertyOptional({ description: 'Pagamento realizado?', default: false })
  @IsOptional()
  @IsBoolean()
  paymentCompleted?: boolean;

  @ApiPropertyOptional({ description: 'Observações da recepção' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  receptionNotes?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// START APPOINTMENT DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class StartAppointmentDto {
  @ApiPropertyOptional({ description: 'Hora de início (auto se não informado)' })
  @IsOptional()
  @IsDateString()
  actualStartTime?: string;

  @ApiPropertyOptional({ description: 'Sala onde ocorre' })
  @IsOptional()
  @IsUUID()
  roomId?: string;

  @ApiPropertyOptional({ description: 'Observações iniciais' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  initialNotes?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLETE APPOINTMENT DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class CompleteAppointmentDto {
  @ApiPropertyOptional({ description: 'Hora de término (auto se não informado)' })
  @IsOptional()
  @IsDateString()
  actualEndTime?: string;

  @ApiPropertyOptional({ description: 'Resumo da consulta' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  summary?: string;

  @ApiPropertyOptional({ description: 'Próximos passos' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  nextSteps?: string;

  @ApiPropertyOptional({ description: 'Necessita retorno?', default: false })
  @IsOptional()
  @IsBoolean()
  needsFollowUp?: boolean;

  @ApiPropertyOptional({ description: 'Prazo para retorno (dias)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  followUpDays?: number;

  @ApiPropertyOptional({ description: 'Agendar retorno automaticamente?', default: false })
  @IsOptional()
  @IsBoolean()
  scheduleFollowUp?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// NO SHOW DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class NoShowDto {
  @ApiPropertyOptional({ description: 'Tentou contato?', default: false })
  @IsOptional()
  @IsBoolean()
  contactAttempted?: boolean;

  @ApiPropertyOptional({ description: 'Método de contato utilizado' })
  @IsOptional()
  @IsString()
  contactMethod?: string;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ description: 'Cobrar taxa de no-show?', default: false })
  @IsOptional()
  @IsBoolean()
  chargeNoShowFee?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// WAITING LIST DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class AddToWaitingListDto {
  @ApiProperty({ description: 'ID do paciente' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ description: 'ID do médico desejado' })
  @IsUUID()
  doctorId: string;

  @ApiProperty({ description: 'ID da clínica' })
  @IsUUID()
  clinicId: string;

  @ApiPropertyOptional({ description: 'ID da especialidade' })
  @IsOptional()
  @IsUUID()
  specialtyId?: string;

  @ApiPropertyOptional({ description: 'Data preferida' })
  @IsOptional()
  @IsDateString()
  preferredDate?: string;

  @ApiPropertyOptional({ description: 'Período preferido', enum: ['MORNING', 'AFTERNOON', 'EVENING', 'ANY'] })
  @IsOptional()
  @IsString()
  preferredPeriod?: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'ANY';

  @ApiPropertyOptional({ description: 'Dias da semana disponíveis', type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  availableDays?: number[];

  @ApiPropertyOptional({ description: 'Prioridade (1=normal, 5=urgente)', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  priority?: number;

  @ApiPropertyOptional({ description: 'Motivo da urgência' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  urgencyReason?: string;

  @ApiPropertyOptional({ description: 'Notificar por', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notifyBy?: ('EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH')[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// BATCH OPERATIONS DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class BatchCancelDto {
  @ApiProperty({ description: 'IDs dos agendamentos', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  appointmentIds: string[];

  @ApiProperty({ enum: CancellationReason, description: 'Motivo do cancelamento' })
  @IsEnum(CancellationReason)
  reason: CancellationReason;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ description: 'Notificar pacientes?', default: true })
  @IsOptional()
  @IsBoolean()
  notifyPatients?: boolean;
}

export class BatchConfirmDto {
  @ApiProperty({ description: 'IDs dos agendamentos', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  appointmentIds: string[];

  @ApiPropertyOptional({ description: 'Método de confirmação' })
  @IsOptional()
  @IsString()
  confirmationMethod?: string;
}
