import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus, Gender, BloodType } from '@prisma/client';

export class PatientQueryDto {
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

  @ApiPropertyOptional({ description: 'Busca por nome, CPF, telefone ou email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: UserStatus, description: 'Filtrar por status' })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ enum: Gender, description: 'Filtrar por gênero' })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ enum: BloodType, description: 'Filtrar por tipo sanguíneo' })
  @IsOptional()
  @IsEnum(BloodType)
  bloodType?: BloodType;

  @ApiPropertyOptional({ description: 'Filtrar por convênio (ID)' })
  @IsOptional()
  @IsString()
  healthInsuranceId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por clínica (ID)' })
  @IsOptional()
  @IsString()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'Filtrar pacientes com alergias' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasAllergies?: boolean;

  @ApiPropertyOptional({ description: 'Filtrar pacientes com condições crônicas' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasChronicConditions?: boolean;

  @ApiPropertyOptional({ description: 'Data de nascimento mínima' })
  @IsOptional()
  @IsDateString()
  birthDateFrom?: string;

  @ApiPropertyOptional({ description: 'Data de nascimento máxima' })
  @IsOptional()
  @IsDateString()
  birthDateTo?: string;

  @ApiPropertyOptional({ description: 'Idade mínima' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  ageMin?: number;

  @ApiPropertyOptional({ description: 'Idade máxima' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Max(150)
  ageMax?: number;

  @ApiPropertyOptional({ description: 'Data de cadastro inicial' })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({ description: 'Data de cadastro final' })
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiPropertyOptional({
    description: 'Campo para ordenação',
    enum: ['fullName', 'birthDate', 'createdAt', 'updatedAt', 'lastActivityDate'],
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

  @ApiPropertyOptional({ description: 'Incluir pacientes inativos/deletados' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeDeleted?: boolean;
}

export class PatientStatsQueryDto {
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
