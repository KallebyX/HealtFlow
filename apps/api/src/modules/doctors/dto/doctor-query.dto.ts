import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@prisma/client';

export class DoctorQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Número da página', minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, description: 'Itens por página', minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Busca por nome, CRM ou especialidade' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar por especialidade' })
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiPropertyOptional({ description: 'Filtrar por múltiplas especialidades' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @ApiPropertyOptional({ description: 'Filtrar por estado do CRM' })
  @IsOptional()
  @IsString()
  crmState?: string;

  @ApiPropertyOptional({ description: 'Filtrar por status do CRM', enum: ['ACTIVE', 'SUSPENDED', 'INACTIVE'] })
  @IsOptional()
  @IsString()
  crmStatus?: string;

  @ApiPropertyOptional({ enum: Gender, description: 'Filtrar por gênero' })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ description: 'Filtrar por clínica (ID)' })
  @IsOptional()
  @IsString()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'Apenas médicos com telemedicina habilitada' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  telemedicineEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Apenas médicos com certificado digital' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasDigitalCertificate?: boolean;

  @ApiPropertyOptional({ description: 'Apenas médicos disponíveis em determinada data' })
  @IsOptional()
  @IsDateString()
  availableOn?: string;

  @ApiPropertyOptional({
    description: 'Campo para ordenação',
    enum: ['fullName', 'crm', 'createdAt', 'updatedAt'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Direção da ordenação',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Incluir médicos inativos/deletados' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeDeleted?: boolean;
}

export class AvailableSlotsQueryDto {
  @ApiPropertyOptional({ description: 'ID da clínica' })
  @IsOptional()
  @IsString()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'Data inicial', example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data final', example: '2024-01-20' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Apenas telemedicina' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  telemedicineOnly?: boolean;

  @ApiPropertyOptional({ description: 'Duração do slot em minutos' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(10)
  @Max(120)
  duration?: number;
}

export class DoctorStatsQueryDto {
  @ApiPropertyOptional({ description: 'Data inicial para estatísticas' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data final para estatísticas' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filtrar por clínica' })
  @IsOptional()
  @IsString()
  clinicId?: string;

  @ApiPropertyOptional({
    description: 'Agrupar por',
    enum: ['day', 'week', 'month', 'year'],
  })
  @IsOptional()
  @IsString()
  groupBy?: 'day' | 'week' | 'month' | 'year';
}
