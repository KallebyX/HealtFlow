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
import { LabOrderPriority, LabOrderStatus, SampleType } from './create-lab-order.dto';

export class LabOrderQueryDto {
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

  @ApiPropertyOptional({ description: 'Filtrar por médico solicitante' })
  @IsOptional()
  @IsUUID()
  requestingDoctorId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por clínica/laboratório' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por consulta' })
  @IsOptional()
  @IsUUID()
  consultationId?: string;

  @ApiPropertyOptional({ enum: LabOrderStatus, description: 'Filtrar por status' })
  @IsOptional()
  @IsEnum(LabOrderStatus)
  status?: LabOrderStatus;

  @ApiPropertyOptional({ enum: LabOrderStatus, isArray: true, description: 'Filtrar por múltiplos status' })
  @IsOptional()
  @IsArray()
  @IsEnum(LabOrderStatus, { each: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  statuses?: LabOrderStatus[];

  @ApiPropertyOptional({ enum: LabOrderPriority, description: 'Filtrar por prioridade' })
  @IsOptional()
  @IsEnum(LabOrderPriority)
  priority?: LabOrderPriority;

  @ApiPropertyOptional({ description: 'Data inicial (criação)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data final (criação)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Data inicial da coleta' })
  @IsOptional()
  @IsDateString()
  collectionStartDate?: string;

  @ApiPropertyOptional({ description: 'Data final da coleta' })
  @IsOptional()
  @IsDateString()
  collectionEndDate?: string;

  @ApiPropertyOptional({ description: 'Filtrar urgentes' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isUrgent?: boolean;

  @ApiPropertyOptional({ description: 'Com valores críticos' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  hasCriticalValues?: boolean;

  @ApiPropertyOptional({ description: 'Pendentes de coleta' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  pendingCollection?: boolean;

  @ApiPropertyOptional({ description: 'Pendentes de resultado' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  pendingResults?: boolean;

  @ApiPropertyOptional({ description: 'Coleta domiciliar' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  homeCollection?: boolean;

  @ApiPropertyOptional({ description: 'Busca por código ou nome do exame' })
  @IsOptional()
  @IsString()
  testSearch?: string;

  @ApiPropertyOptional({ description: 'Busca por código de barras do tubo' })
  @IsOptional()
  @IsString()
  tubeBarcode?: string;

  @ApiPropertyOptional({ description: 'Ordenação', enum: ['createdAt', 'updatedAt', 'priority', 'status', 'patientName'] })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Direção da ordenação', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ description: 'Incluir pedidos cancelados' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeCancelled?: boolean = false;
}

export class LabResultQueryDto {
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

  @ApiPropertyOptional({ description: 'Filtrar por pedido de exame' })
  @IsOptional()
  @IsUUID()
  labOrderId?: string;

  @ApiPropertyOptional({ description: 'Código do exame' })
  @IsOptional()
  @IsString()
  testCode?: string;

  @ApiPropertyOptional({ description: 'Data inicial do resultado' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data final do resultado' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Apenas valores críticos' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  criticalOnly?: boolean;

  @ApiPropertyOptional({ description: 'Apenas valores alterados' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  abnormalOnly?: boolean;

  @ApiPropertyOptional({ description: 'Validados' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  validated?: boolean;

  @ApiPropertyOptional({ description: 'Pendentes de validação' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  pendingValidation?: boolean;

  @ApiPropertyOptional({ description: 'Ordenação' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'analysisDateTime';

  @ApiPropertyOptional({ description: 'Direção da ordenação' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class LabTestCatalogQueryDto {
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

  @ApiPropertyOptional({ description: 'Busca por código ou nome' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: SampleType, description: 'Tipo de amostra' })
  @IsOptional()
  @IsEnum(SampleType)
  sampleType?: SampleType;

  @ApiPropertyOptional({ description: 'Categoria do exame' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Subcategoria do exame' })
  @IsOptional()
  @IsString()
  subcategory?: string;

  @ApiPropertyOptional({ description: 'Apenas exames ativos' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  activeOnly?: boolean = true;

  @ApiPropertyOptional({ description: 'Disponíveis na clínica' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'Convênio aceito' })
  @IsOptional()
  @IsString()
  insuranceCode?: string;

  @ApiPropertyOptional({ description: 'Ordenação' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'testName';

  @ApiPropertyOptional({ description: 'Direção da ordenação' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';
}

export class PatientLabHistoryQueryDto {
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

  @ApiPropertyOptional({ description: 'Código do exame específico' })
  @IsOptional()
  @IsString()
  testCode?: string;

  @ApiPropertyOptional({ description: 'Período inicial' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Período final' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Incluir gráfico de evolução' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeChart?: boolean = false;

  @ApiPropertyOptional({ description: 'Categoria do exame' })
  @IsOptional()
  @IsString()
  category?: string;
}

export class CollectionScheduleQueryDto {
  @ApiPropertyOptional({ description: 'Data da agenda' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Data inicial' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data final' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'ID do coletor' })
  @IsOptional()
  @IsUUID()
  collectorId?: string;

  @ApiPropertyOptional({ description: 'Apenas coletas domiciliares' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  homeCollectionOnly?: boolean;

  @ApiPropertyOptional({ description: 'ID da clínica' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'Incluir realizadas' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeCompleted?: boolean = false;
}

export class WorklistQueryDto {
  @ApiPropertyOptional({ description: 'ID da clínica/laboratório' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'Setor do laboratório' })
  @IsOptional()
  @IsString()
  sector?: string;

  @ApiPropertyOptional({ description: 'Equipamento' })
  @IsOptional()
  @IsString()
  equipment?: string;

  @ApiPropertyOptional({ enum: SampleType, description: 'Tipo de amostra' })
  @IsOptional()
  @IsEnum(SampleType)
  sampleType?: SampleType;

  @ApiPropertyOptional({ description: 'Apenas urgentes' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  urgentOnly?: boolean;

  @ApiPropertyOptional({ description: 'Pendentes de análise' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  pendingAnalysis?: boolean = true;

  @ApiPropertyOptional({ description: 'Ordenação por prioridade' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  orderByPriority?: boolean = true;

  @ApiPropertyOptional({ description: 'Limite de itens' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500)
  limit?: number = 100;
}

export class CriticalValuesQueryDto {
  @ApiPropertyOptional({ description: 'ID da clínica' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'Apenas não notificados' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  unnotifiedOnly?: boolean = true;

  @ApiPropertyOptional({ description: 'Data inicial' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data final' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Limite de itens' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}

export class LabStatisticsQueryDto {
  @ApiPropertyOptional({ description: 'ID da clínica' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'Período inicial' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Período final' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Agrupamento', enum: ['day', 'week', 'month', 'year'] })
  @IsOptional()
  @IsEnum(['day', 'week', 'month', 'year'])
  groupBy?: string = 'day';

  @ApiPropertyOptional({ description: 'Incluir TAT (turnaround time)' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeTAT?: boolean = true;

  @ApiPropertyOptional({ description: 'Incluir taxa de rejeição' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeRejectionRate?: boolean = true;
}
