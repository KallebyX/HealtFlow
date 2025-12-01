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
import { ConsultationType, ConsultationStatus, DiagnosisType } from './create-consultation.dto';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSULTATION QUERY DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class ConsultationQueryDto {
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

  @ApiPropertyOptional({ description: 'ID do agendamento' })
  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @ApiPropertyOptional({ enum: ConsultationType, description: 'Tipo de consulta' })
  @IsOptional()
  @IsEnum(ConsultationType)
  type?: ConsultationType;

  @ApiPropertyOptional({ enum: ConsultationStatus, description: 'Status' })
  @IsOptional()
  @IsEnum(ConsultationStatus)
  status?: ConsultationStatus;

  @ApiPropertyOptional({ enum: ConsultationStatus, isArray: true, description: 'Múltiplos status' })
  @IsOptional()
  @IsArray()
  @IsEnum(ConsultationStatus, { each: true })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  statuses?: ConsultationStatus[];

  @ApiPropertyOptional({ description: 'Data de início (a partir de)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data de fim (até)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Código CID-10 do diagnóstico' })
  @IsOptional()
  @IsString()
  diagnosisCode?: string;

  @ApiPropertyOptional({ description: 'Busca por texto no prontuário' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Apenas assinados', default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  signedOnly?: boolean;

  @ApiPropertyOptional({ description: 'Apenas com prescrição', default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  withPrescription?: boolean;

  @ApiPropertyOptional({ description: 'Apenas com atestado', default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  withCertificate?: boolean;

  @ApiPropertyOptional({ description: 'Apenas com encaminhamento', default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  withReferral?: boolean;

  @ApiPropertyOptional({ description: 'Ordenar por', enum: ['createdAt', 'updatedAt', 'signedAt'] })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'updatedAt' | 'signedAt';

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
// PATIENT HISTORY QUERY DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class PatientHistoryQueryDto {
  @ApiProperty({ description: 'ID do paciente' })
  @IsUUID()
  patientId: string;

  @ApiPropertyOptional({ description: 'ID da clínica' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'ID do médico' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiPropertyOptional({ description: 'Data de início (a partir de)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data de fim (até)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Incluir diagnósticos', default: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeDiagnoses?: boolean;

  @ApiPropertyOptional({ description: 'Incluir prescrições', default: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includePrescriptions?: boolean;

  @ApiPropertyOptional({ description: 'Incluir exames', default: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeExams?: boolean;

  @ApiPropertyOptional({ description: 'Incluir sinais vitais', default: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeVitalSigns?: boolean;

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
// DIAGNOSIS SEARCH QUERY DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class DiagnosisSearchQueryDto {
  @ApiPropertyOptional({ description: 'Termo de busca (código ou descrição)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Capítulo do CID-10 (ex: A00-B99)' })
  @IsOptional()
  @IsString()
  chapter?: string;

  @ApiPropertyOptional({ description: 'Categoria (ex: A00-A09)' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Limite de resultados', default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSULTATION STATS QUERY DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class ConsultationStatsQueryDto {
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

  @ApiPropertyOptional({ description: 'Incluir top diagnósticos', default: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeTopDiagnoses?: boolean;

  @ApiPropertyOptional({ description: 'Limite de top diagnósticos', default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  topDiagnosesLimit?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEDICAL RECORD EXPORT QUERY DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class MedicalRecordExportQueryDto {
  @ApiProperty({ description: 'ID do paciente' })
  @IsUUID()
  patientId: string;

  @ApiPropertyOptional({ description: 'Data de início' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data de fim' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Formato de exportação', enum: ['PDF', 'JSON', 'HL7', 'FHIR'], default: 'PDF' })
  @IsOptional()
  @IsString()
  format?: 'PDF' | 'JSON' | 'HL7' | 'FHIR';

  @ApiPropertyOptional({ description: 'Incluir consultas', default: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeConsultations?: boolean;

  @ApiPropertyOptional({ description: 'Incluir prescrições', default: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includePrescriptions?: boolean;

  @ApiPropertyOptional({ description: 'Incluir exames', default: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeExams?: boolean;

  @ApiPropertyOptional({ description: 'Incluir atestados', default: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeCertificates?: boolean;

  @ApiPropertyOptional({ description: 'Motivo da exportação' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  exportReason?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { MaxLength } from 'class-validator';
