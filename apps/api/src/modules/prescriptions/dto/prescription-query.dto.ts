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
import { PrescriptionType, PrescriptionStatus } from './create-prescription.dto';

// ═══════════════════════════════════════════════════════════════════════════════
// PRESCRIPTION QUERY DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class PrescriptionQueryDto {
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

  @ApiPropertyOptional({ description: 'ID da consulta' })
  @IsOptional()
  @IsUUID()
  consultationId?: string;

  @ApiPropertyOptional({ enum: PrescriptionType, description: 'Tipo de receita' })
  @IsOptional()
  @IsEnum(PrescriptionType)
  type?: PrescriptionType;

  @ApiPropertyOptional({ enum: PrescriptionStatus, description: 'Status' })
  @IsOptional()
  @IsEnum(PrescriptionStatus)
  status?: PrescriptionStatus;

  @ApiPropertyOptional({ enum: PrescriptionStatus, isArray: true, description: 'Múltiplos status' })
  @IsOptional()
  @IsArray()
  @IsEnum(PrescriptionStatus, { each: true })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  statuses?: PrescriptionStatus[];

  @ApiPropertyOptional({ description: 'Data de início (a partir de)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data de fim (até)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Apenas assinadas', default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  signedOnly?: boolean;

  @ApiPropertyOptional({ description: 'Apenas válidas (não expiradas)', default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  validOnly?: boolean;

  @ApiPropertyOptional({ description: 'Apenas dispensadas', default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  dispensedOnly?: boolean;

  @ApiPropertyOptional({ description: 'Apenas renovações', default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  renewalsOnly?: boolean;

  @ApiPropertyOptional({ description: 'Busca por medicamento' })
  @IsOptional()
  @IsString()
  medicationSearch?: string;

  @ApiPropertyOptional({ description: 'Ordenar por', enum: ['createdAt', 'signedAt', 'expiresAt'] })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'signedAt' | 'expiresAt';

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
// PATIENT PRESCRIPTIONS QUERY DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class PatientPrescriptionsQueryDto {
  @ApiPropertyOptional({ description: 'Apenas ativas (não expiradas e não canceladas)', default: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  activeOnly?: boolean;

  @ApiPropertyOptional({ description: 'Incluir medicamentos atuais', default: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeCurrentMedications?: boolean;

  @ApiPropertyOptional({ description: 'Período (dias para trás)', default: 365 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  @Type(() => Number)
  periodDays?: number;

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
// PRESCRIPTION STATS QUERY DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class PrescriptionStatsQueryDto {
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

  @ApiPropertyOptional({ description: 'Incluir top medicamentos', default: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeTopMedications?: boolean;

  @ApiPropertyOptional({ description: 'Limite de top medicamentos', default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  topMedicationsLimit?: number;
}
