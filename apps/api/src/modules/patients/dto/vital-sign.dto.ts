import {
  IsOptional,
  IsNumber,
  IsString,
  IsDateString,
  IsEnum,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TriageLevel } from '@prisma/client';

export class CreateVitalSignDto {
  // ═══════════════════════════════════════════════════════════════════════════════
  // PRESSÃO ARTERIAL
  // ═══════════════════════════════════════════════════════════════════════════════

  @ApiPropertyOptional({ example: 120, description: 'Pressão arterial sistólica (mmHg)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(40)
  @Max(300)
  systolicBp?: number;

  @ApiPropertyOptional({ example: 80, description: 'Pressão arterial diastólica (mmHg)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(20)
  @Max(200)
  diastolicBp?: number;

  // ═══════════════════════════════════════════════════════════════════════════════
  // FREQUÊNCIAS
  // ═══════════════════════════════════════════════════════════════════════════════

  @ApiPropertyOptional({ example: 72, description: 'Frequência cardíaca (bpm)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(20)
  @Max(300)
  heartRate?: number;

  @ApiPropertyOptional({ example: 16, description: 'Frequência respiratória (rpm)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(4)
  @Max(60)
  respiratoryRate?: number;

  // ═══════════════════════════════════════════════════════════════════════════════
  // TEMPERATURA E SATURAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════════

  @ApiPropertyOptional({ example: 36.5, description: 'Temperatura corporal (°C)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(30)
  @Max(45)
  temperature?: number;

  @ApiPropertyOptional({ example: 98, description: 'Saturação de oxigênio (SpO2 %)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(50)
  @Max(100)
  oxygenSaturation?: number;

  // ═══════════════════════════════════════════════════════════════════════════════
  // ANTROPOMETRIA
  // ═══════════════════════════════════════════════════════════════════════════════

  @ApiPropertyOptional({ example: 70.5, description: 'Peso (kg)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  @Max(500)
  weight?: number;

  @ApiPropertyOptional({ example: 175, description: 'Altura (cm)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(30)
  @Max(300)
  height?: number;

  // ═══════════════════════════════════════════════════════════════════════════════
  // GLICEMIA E DOR
  // ═══════════════════════════════════════════════════════════════════════════════

  @ApiPropertyOptional({ example: 95, description: 'Glicemia capilar (mg/dL)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(20)
  @Max(800)
  bloodGlucose?: number;

  @ApiPropertyOptional({ example: 0, description: 'Escala de dor (0-10)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  painScale?: number;

  // ═══════════════════════════════════════════════════════════════════════════════
  // TRIAGEM (preenchido automaticamente, mas pode ser sobrescrito)
  // ═══════════════════════════════════════════════════════════════════════════════

  @ApiPropertyOptional({
    enum: TriageLevel,
    description: 'Nível de triagem (calculado automaticamente se não informado)'
  })
  @IsOptional()
  @IsEnum(TriageLevel)
  triageLevel?: TriageLevel;

  @ApiPropertyOptional({ description: 'Notas da triagem' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  triageNotes?: string;

  // ═══════════════════════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════════════════════

  @ApiPropertyOptional({ description: 'Data/hora da medição (default: agora)' })
  @IsOptional()
  @IsDateString()
  measuredAt?: string;

  @ApiPropertyOptional({
    example: 'manual',
    description: 'Fonte dos dados',
    enum: ['manual', 'healthkit', 'googlefit', 'totem', 'wearable', 'device'],
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  source?: string;

  @ApiPropertyOptional({ description: 'ID do dispositivo que coletou os dados' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceId?: string;

  @ApiPropertyOptional({ description: 'Observações adicionais' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ description: 'ID da consulta associada' })
  @IsOptional()
  @IsString()
  consultationId?: string;

  @ApiPropertyOptional({ description: 'ID do agendamento associado' })
  @IsOptional()
  @IsString()
  appointmentId?: string;
}

export class VitalSignQueryDto {
  @ApiPropertyOptional({ description: 'Data inicial' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data final' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Limite de registros', minimum: 1, maximum: 1000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number = 100;

  @ApiPropertyOptional({
    description: 'Tipo de sinal vital para filtrar',
    enum: ['blood_pressure', 'heart_rate', 'temperature', 'oxygen', 'weight', 'glucose'],
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: 'Fonte dos dados',
    enum: ['manual', 'healthkit', 'googlefit', 'totem', 'wearable', 'device'],
  })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ enum: TriageLevel, description: 'Filtrar por nível de triagem' })
  @IsOptional()
  @IsEnum(TriageLevel)
  triageLevel?: TriageLevel;

  @ApiPropertyOptional({ description: 'Apenas valores anormais' })
  @IsOptional()
  @Type(() => Boolean)
  isAbnormal?: boolean;
}

export class VitalSignResponseDto {
  @ApiProperty({ description: 'ID do registro' })
  id: string;

  @ApiProperty({ description: 'ID do paciente' })
  patientId: string;

  @ApiPropertyOptional({ description: 'Pressão sistólica' })
  systolicBp?: number;

  @ApiPropertyOptional({ description: 'Pressão diastólica' })
  diastolicBp?: number;

  @ApiPropertyOptional({ description: 'Frequência cardíaca' })
  heartRate?: number;

  @ApiPropertyOptional({ description: 'Frequência respiratória' })
  respiratoryRate?: number;

  @ApiPropertyOptional({ description: 'Temperatura' })
  temperature?: number;

  @ApiPropertyOptional({ description: 'Saturação de oxigênio' })
  oxygenSaturation?: number;

  @ApiPropertyOptional({ description: 'Peso' })
  weight?: number;

  @ApiPropertyOptional({ description: 'Altura' })
  height?: number;

  @ApiPropertyOptional({ description: 'Glicemia' })
  bloodGlucose?: number;

  @ApiPropertyOptional({ description: 'Escala de dor' })
  painScale?: number;

  @ApiPropertyOptional({ enum: TriageLevel, description: 'Nível de triagem' })
  triageLevel?: TriageLevel;

  @ApiPropertyOptional({ description: 'Notas de triagem' })
  triageNotes?: string;

  @ApiProperty({ description: 'Data/hora da medição' })
  measuredAt: Date;

  @ApiPropertyOptional({ description: 'Quem registrou' })
  measuredBy?: string;

  @ApiPropertyOptional({ description: 'Fonte dos dados' })
  source?: string;

  @ApiPropertyOptional({ description: 'ID do dispositivo' })
  deviceId?: string;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;
}

export class VitalSignStatsDto {
  @ApiProperty({ description: 'Média de pressão sistólica' })
  avgSystolicBp?: number;

  @ApiProperty({ description: 'Média de pressão diastólica' })
  avgDiastolicBp?: number;

  @ApiProperty({ description: 'Média de frequência cardíaca' })
  avgHeartRate?: number;

  @ApiProperty({ description: 'Média de temperatura' })
  avgTemperature?: number;

  @ApiProperty({ description: 'Média de saturação' })
  avgOxygenSaturation?: number;

  @ApiProperty({ description: 'Peso mínimo no período' })
  minWeight?: number;

  @ApiProperty({ description: 'Peso máximo no período' })
  maxWeight?: number;

  @ApiProperty({ description: 'Total de registros' })
  totalRecords: number;

  @ApiProperty({ description: 'Registros anormais' })
  abnormalRecords: number;

  @ApiProperty({ description: 'Período inicial' })
  startDate: Date;

  @ApiProperty({ description: 'Período final' })
  endDate: Date;
}
