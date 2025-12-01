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
  ReportType,
  TimeGranularity,
  ScheduleFrequency,
  ComparisonType,
} from './create-analytics.dto';

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

// ==================== Analytics Base Query ====================

export class AnalyticsBaseQueryDto {
  @ApiPropertyOptional({ description: 'Data de início' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data de fim' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'ID da clínica' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'IDs das clínicas' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  clinicIds?: string[];

  @ApiPropertyOptional({ enum: TimeGranularity, description: 'Granularidade' })
  @IsOptional()
  @IsEnum(TimeGranularity)
  granularity?: TimeGranularity;

  @ApiPropertyOptional({ description: 'Incluir comparativo' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeComparison?: boolean;

  @ApiPropertyOptional({ enum: ComparisonType })
  @IsOptional()
  @IsEnum(ComparisonType)
  comparisonType?: ComparisonType;
}

// ==================== Operational Analytics Query ====================

export class OperationalAnalyticsQueryDto extends AnalyticsBaseQueryDto {
  @ApiPropertyOptional({ description: 'ID do médico' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiPropertyOptional({ description: 'IDs dos médicos' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  doctorIds?: string[];

  @ApiPropertyOptional({ description: 'Tipo de agendamento' })
  @IsOptional()
  @IsString()
  appointmentType?: string;

  @ApiPropertyOptional({ description: 'Especialidade' })
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiPropertyOptional({ description: 'Incluir breakdown por médico' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  groupByDoctor?: boolean;

  @ApiPropertyOptional({ description: 'Incluir breakdown por tipo' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  groupByType?: boolean;

  @ApiPropertyOptional({ description: 'Incluir breakdown por status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  groupByStatus?: boolean;

  @ApiPropertyOptional({ description: 'Incluir métricas de tempo de espera' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeWaitTime?: boolean;

  @ApiPropertyOptional({ description: 'Incluir taxa de no-show' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeNoShowRate?: boolean;

  @ApiPropertyOptional({ description: 'Incluir taxa de ocupação' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeOccupancy?: boolean;
}

// ==================== Financial Analytics Query ====================

export class FinancialAnalyticsQueryDto extends AnalyticsBaseQueryDto {
  @ApiPropertyOptional({ description: 'ID do convênio' })
  @IsOptional()
  @IsUUID()
  insuranceId?: string;

  @ApiPropertyOptional({ description: 'Tipo de faturamento' })
  @IsOptional()
  @IsString()
  billingType?: string;

  @ApiPropertyOptional({ description: 'Método de pagamento' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Incluir breakdown por tipo' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  groupByType?: boolean;

  @ApiPropertyOptional({ description: 'Incluir breakdown por convênio' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  groupByInsurance?: boolean;

  @ApiPropertyOptional({ description: 'Incluir breakdown por médico' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  groupByDoctor?: boolean;

  @ApiPropertyOptional({ description: 'Incluir receivables' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeReceivables?: boolean;

  @ApiPropertyOptional({ description: 'Incluir aging report' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeAging?: boolean;
}

// ==================== Clinical Analytics Query ====================

export class ClinicalAnalyticsQueryDto extends AnalyticsBaseQueryDto {
  @ApiPropertyOptional({ description: 'ID do médico' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiPropertyOptional({ description: 'Código CID' })
  @IsOptional()
  @IsString()
  icdCode?: string;

  @ApiPropertyOptional({ description: 'Especialidade' })
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiPropertyOptional({ description: 'Incluir top diagnósticos' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeTopDiagnoses?: boolean;

  @ApiPropertyOptional({ description: 'Incluir top medicamentos' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeTopMedications?: boolean;

  @ApiPropertyOptional({ description: 'Incluir top exames' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeTopExams?: boolean;

  @ApiPropertyOptional({ description: 'Incluir breakdown por gênero' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  groupByGender?: boolean;

  @ApiPropertyOptional({ description: 'Incluir breakdown por faixa etária' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  groupByAgeGroup?: boolean;
}

// ==================== Patient Analytics Query ====================

export class PatientAnalyticsQueryDto extends AnalyticsBaseQueryDto {
  @ApiPropertyOptional({ description: 'Faixa etária mínima' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  ageMin?: number;

  @ApiPropertyOptional({ description: 'Faixa etária máxima' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Max(150)
  ageMax?: number;

  @ApiPropertyOptional({ description: 'Gênero' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ description: 'Cidade' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Estado' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'ID do convênio' })
  @IsOptional()
  @IsUUID()
  insuranceId?: string;

  @ApiPropertyOptional({ description: 'Incluir demographics' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeDemographics?: boolean;

  @ApiPropertyOptional({ description: 'Incluir retenção' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeRetention?: boolean;

  @ApiPropertyOptional({ description: 'Incluir novos vs retornos' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeNewVsReturning?: boolean;

  @ApiPropertyOptional({ description: 'Incluir churn' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeChurn?: boolean;
}

// ==================== Doctor Analytics Query ====================

export class DoctorAnalyticsQueryDto extends AnalyticsBaseQueryDto {
  @ApiPropertyOptional({ description: 'ID do médico' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiPropertyOptional({ description: 'Especialidade' })
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiPropertyOptional({ description: 'Incluir produtividade' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeProductivity?: boolean;

  @ApiPropertyOptional({ description: 'Incluir satisfação' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeSatisfaction?: boolean;

  @ApiPropertyOptional({ description: 'Incluir receita' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeRevenue?: boolean;

  @ApiPropertyOptional({ description: 'Incluir ranking' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeRanking?: boolean;
}

// ==================== Laboratory Analytics Query ====================

export class LaboratoryAnalyticsQueryDto extends AnalyticsBaseQueryDto {
  @ApiPropertyOptional({ description: 'Código do exame' })
  @IsOptional()
  @IsString()
  testCode?: string;

  @ApiPropertyOptional({ description: 'Categoria do exame' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Incluir TAT (turnaround time)' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeTAT?: boolean;

  @ApiPropertyOptional({ description: 'Incluir taxa de rejeição' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeRejectionRate?: boolean;

  @ApiPropertyOptional({ description: 'Incluir valores críticos' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeCriticalValues?: boolean;

  @ApiPropertyOptional({ description: 'Agrupar por categoria' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  groupByCategory?: boolean;
}

// ==================== Telemedicine Analytics Query ====================

export class TelemedicineAnalyticsQueryDto extends AnalyticsBaseQueryDto {
  @ApiPropertyOptional({ description: 'ID do médico' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiPropertyOptional({ description: 'Tipo de sessão' })
  @IsOptional()
  @IsString()
  sessionType?: string;

  @ApiPropertyOptional({ description: 'Incluir métricas de conexão' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeConnectionMetrics?: boolean;

  @ApiPropertyOptional({ description: 'Incluir satisfação' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeSatisfaction?: boolean;

  @ApiPropertyOptional({ description: 'Incluir duração média' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeDuration?: boolean;
}

// ==================== Custom Report Query ====================

export class CustomReportQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({ description: 'Busca por nome' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ReportType, description: 'Tipo base' })
  @IsOptional()
  @IsEnum(ReportType)
  baseType?: ReportType;

  @ApiPropertyOptional({ description: 'ID do criador' })
  @IsOptional()
  @IsUUID()
  createdBy?: string;

  @ApiPropertyOptional({ description: 'Apenas públicos' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  publicOnly?: boolean;

  @ApiPropertyOptional({ description: 'Apenas ativos' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  activeOnly?: boolean;
}

// ==================== Scheduled Report Query ====================

export class ScheduledReportQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({ description: 'ID do relatório' })
  @IsOptional()
  @IsString()
  reportIdOrType?: string;

  @ApiPropertyOptional({ enum: ScheduleFrequency, description: 'Frequência' })
  @IsOptional()
  @IsEnum(ScheduleFrequency)
  frequency?: ScheduleFrequency;

  @ApiPropertyOptional({ description: 'Apenas ativos' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  activeOnly?: boolean;

  @ApiPropertyOptional({ description: 'ID do criador' })
  @IsOptional()
  @IsUUID()
  createdBy?: string;
}

// ==================== Dashboard Query ====================

export class DashboardQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({ description: 'Busca por nome' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'ID do criador' })
  @IsOptional()
  @IsUUID()
  createdBy?: string;

  @ApiPropertyOptional({ description: 'Apenas públicos' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  publicOnly?: boolean;

  @ApiPropertyOptional({ description: 'Apenas padrão' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  defaultOnly?: boolean;
}

// ==================== KPI Query ====================

export class KPIQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({ description: 'Busca por nome ou código' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Categoria' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Apenas ativos' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  activeOnly?: boolean;
}

export class KPIValueQueryDto extends AnalyticsBaseQueryDto {
  @ApiPropertyOptional({ description: 'IDs dos KPIs' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  kpiIds?: string[];

  @ApiPropertyOptional({ description: 'Códigos dos KPIs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  kpiCodes?: string[];
}

// ==================== Cohort Query ====================

export class CohortQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({ description: 'Busca por nome' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Entidade base' })
  @IsOptional()
  @IsString()
  baseEntity?: string;

  @ApiPropertyOptional({ description: 'Apenas dinâmicas' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  dynamicOnly?: boolean;

  @ApiPropertyOptional({ description: 'ID do criador' })
  @IsOptional()
  @IsUUID()
  createdBy?: string;
}

// ==================== Export Query ====================

export class ExportQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({ description: 'Tipo de dados' })
  @IsOptional()
  @IsString()
  dataType?: string;

  @ApiPropertyOptional({ description: 'Status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Data início' })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({ description: 'Data fim' })
  @IsOptional()
  @IsDateString()
  createdTo?: string;
}

// ==================== Trending Query ====================

export class TrendingQueryDto {
  @ApiPropertyOptional({ description: 'Data início' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data fim' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'ID da clínica' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'Limite de itens' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(5)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Categoria' })
  @IsOptional()
  @IsString()
  category?: string;
}
