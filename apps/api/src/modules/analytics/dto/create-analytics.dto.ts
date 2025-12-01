import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsUUID,
  IsArray,
  ValidateNested,
  IsEnum,
  IsBoolean,
  IsDateString,
  Min,
  Max,
  IsObject,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// ==================== Enums ====================

export enum ReportType {
  OPERATIONAL = 'OPERATIONAL',
  FINANCIAL = 'FINANCIAL',
  CLINICAL = 'CLINICAL',
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  APPOINTMENT = 'APPOINTMENT',
  BILLING = 'BILLING',
  LABORATORY = 'LABORATORY',
  TELEMEDICINE = 'TELEMEDICINE',
  CUSTOM = 'CUSTOM',
}

export enum ReportFormat {
  JSON = 'JSON',
  CSV = 'CSV',
  XLSX = 'XLSX',
  PDF = 'PDF',
}

export enum TimeGranularity {
  HOUR = 'HOUR',
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  QUARTER = 'QUARTER',
  YEAR = 'YEAR',
}

export enum MetricType {
  COUNT = 'COUNT',
  SUM = 'SUM',
  AVERAGE = 'AVERAGE',
  MEDIAN = 'MEDIAN',
  MIN = 'MIN',
  MAX = 'MAX',
  PERCENTAGE = 'PERCENTAGE',
  RATE = 'RATE',
  TREND = 'TREND',
}

export enum DashboardWidgetType {
  NUMBER = 'NUMBER',
  CHART_LINE = 'CHART_LINE',
  CHART_BAR = 'CHART_BAR',
  CHART_PIE = 'CHART_PIE',
  CHART_AREA = 'CHART_AREA',
  TABLE = 'TABLE',
  LIST = 'LIST',
  GAUGE = 'GAUGE',
  MAP = 'MAP',
  HEATMAP = 'HEATMAP',
  FUNNEL = 'FUNNEL',
}

export enum ScheduleFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
}

export enum ComparisonType {
  PREVIOUS_PERIOD = 'PREVIOUS_PERIOD',
  SAME_PERIOD_LAST_YEAR = 'SAME_PERIOD_LAST_YEAR',
  CUSTOM = 'CUSTOM',
}

// ==================== Report DTOs ====================

export class ReportFilterDto {
  @ApiPropertyOptional({ description: 'IDs das clínicas' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  clinicIds?: string[];

  @ApiPropertyOptional({ description: 'IDs dos médicos' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  doctorIds?: string[];

  @ApiPropertyOptional({ description: 'IDs dos pacientes' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  patientIds?: string[];

  @ApiPropertyOptional({ description: 'IDs dos convênios' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  insuranceIds?: string[];

  @ApiPropertyOptional({ description: 'Especialidades' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @ApiPropertyOptional({ description: 'Tipos de consulta' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  appointmentTypes?: string[];

  @ApiPropertyOptional({ description: 'Status' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  statuses?: string[];

  @ApiPropertyOptional({ description: 'Tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Faixa etária mínima' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  ageMin?: number;

  @ApiPropertyOptional({ description: 'Faixa etária máxima' })
  @IsOptional()
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

  @ApiPropertyOptional({ description: 'Filtros customizados' })
  @IsOptional()
  @IsObject()
  custom?: Record<string, any>;
}

export class GenerateReportDto {
  @ApiProperty({ enum: ReportType, description: 'Tipo do relatório' })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiProperty({ description: 'Data de início' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Data de fim' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ type: ReportFilterDto, description: 'Filtros' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReportFilterDto)
  filters?: ReportFilterDto;

  @ApiPropertyOptional({ enum: TimeGranularity, description: 'Granularidade temporal' })
  @IsOptional()
  @IsEnum(TimeGranularity)
  granularity?: TimeGranularity;

  @ApiPropertyOptional({ description: 'Agrupar por' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  groupBy?: string[];

  @ApiPropertyOptional({ enum: ReportFormat, description: 'Formato de saída' })
  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat;

  @ApiPropertyOptional({ description: 'Incluir comparativo' })
  @IsOptional()
  @IsBoolean()
  includeComparison?: boolean;

  @ApiPropertyOptional({ enum: ComparisonType, description: 'Tipo de comparação' })
  @IsOptional()
  @IsEnum(ComparisonType)
  comparisonType?: ComparisonType;

  @ApiPropertyOptional({ description: 'Incluir tendências' })
  @IsOptional()
  @IsBoolean()
  includeTrends?: boolean;

  @ApiPropertyOptional({ description: 'Incluir previsões' })
  @IsOptional()
  @IsBoolean()
  includeForecast?: boolean;

  @ApiPropertyOptional({ description: 'Métricas específicas' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metrics?: string[];
}

export class CreateCustomReportDto {
  @ApiProperty({ description: 'Nome do relatório' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ enum: ReportType, description: 'Tipo base do relatório' })
  @IsEnum(ReportType)
  baseType: ReportType;

  @ApiProperty({ description: 'Configuração de métricas' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MetricConfigDto)
  metrics: MetricConfigDto[];

  @ApiPropertyOptional({ type: ReportFilterDto, description: 'Filtros padrão' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReportFilterDto)
  defaultFilters?: ReportFilterDto;

  @ApiPropertyOptional({ enum: TimeGranularity, description: 'Granularidade padrão' })
  @IsOptional()
  @IsEnum(TimeGranularity)
  defaultGranularity?: TimeGranularity;

  @ApiPropertyOptional({ description: 'Agrupar por padrão' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  defaultGroupBy?: string[];

  @ApiPropertyOptional({ description: 'Layout da visualização' })
  @IsOptional()
  @IsObject()
  visualization?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Se é público' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class MetricConfigDto {
  @ApiProperty({ description: 'Nome da métrica' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Campo de origem' })
  @IsString()
  @IsNotEmpty()
  field: string;

  @ApiProperty({ enum: MetricType, description: 'Tipo de agregação' })
  @IsEnum(MetricType)
  aggregation: MetricType;

  @ApiPropertyOptional({ description: 'Label para exibição' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ description: 'Formato de exibição' })
  @IsOptional()
  @IsString()
  format?: string;

  @ApiPropertyOptional({ description: 'Condição de filtro' })
  @IsOptional()
  @IsObject()
  condition?: Record<string, any>;
}

export class UpdateCustomReportDto {
  @ApiPropertyOptional({ description: 'Nome do relatório' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Configuração de métricas' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MetricConfigDto)
  metrics?: MetricConfigDto[];

  @ApiPropertyOptional({ type: ReportFilterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReportFilterDto)
  defaultFilters?: ReportFilterDto;

  @ApiPropertyOptional({ description: 'Layout da visualização' })
  @IsOptional()
  @IsObject()
  visualization?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Se é público' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Se está ativo' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ==================== Scheduled Report DTOs ====================

export class CreateScheduledReportDto {
  @ApiProperty({ description: 'ID do relatório customizado ou tipo do relatório' })
  @IsString()
  @IsNotEmpty()
  reportIdOrType: string;

  @ApiProperty({ description: 'Nome do agendamento' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: ScheduleFrequency, description: 'Frequência' })
  @IsEnum(ScheduleFrequency)
  frequency: ScheduleFrequency;

  @ApiPropertyOptional({ description: 'Dia da semana (0-6) para semanal' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @ApiPropertyOptional({ description: 'Dia do mês (1-28) para mensal' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(28)
  dayOfMonth?: number;

  @ApiPropertyOptional({ description: 'Horário de execução (HH:mm)' })
  @IsOptional()
  @IsString()
  executionTime?: string;

  @ApiProperty({ enum: ReportFormat, description: 'Formato' })
  @IsEnum(ReportFormat)
  format: ReportFormat;

  @ApiProperty({ description: 'Destinatários (emails)' })
  @IsArray()
  @IsString({ each: true })
  recipients: string[];

  @ApiPropertyOptional({ type: ReportFilterDto, description: 'Filtros' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReportFilterDto)
  filters?: ReportFilterDto;

  @ApiPropertyOptional({ description: 'Período do relatório (últimos N dias)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  periodDays?: number;

  @ApiPropertyOptional({ description: 'Se está ativo' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateScheduledReportDto {
  @ApiPropertyOptional({ description: 'Nome do agendamento' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: ScheduleFrequency })
  @IsOptional()
  @IsEnum(ScheduleFrequency)
  frequency?: ScheduleFrequency;

  @ApiPropertyOptional({ description: 'Dia da semana' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @ApiPropertyOptional({ description: 'Dia do mês' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(28)
  dayOfMonth?: number;

  @ApiPropertyOptional({ description: 'Horário de execução' })
  @IsOptional()
  @IsString()
  executionTime?: string;

  @ApiPropertyOptional({ enum: ReportFormat })
  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat;

  @ApiPropertyOptional({ description: 'Destinatários' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recipients?: string[];

  @ApiPropertyOptional({ type: ReportFilterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReportFilterDto)
  filters?: ReportFilterDto;

  @ApiPropertyOptional({ description: 'Se está ativo' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ==================== Dashboard DTOs ====================

export class CreateDashboardDto {
  @ApiProperty({ description: 'Nome do dashboard' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Se é o dashboard padrão' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Se é público' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Layout do grid' })
  @IsOptional()
  @IsObject()
  layout?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Filtros globais do dashboard' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReportFilterDto)
  globalFilters?: ReportFilterDto;

  @ApiPropertyOptional({ description: 'Período padrão (dias)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  defaultPeriodDays?: number;

  @ApiPropertyOptional({ description: 'Auto refresh em segundos' })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(3600)
  refreshInterval?: number;
}

export class UpdateDashboardDto {
  @ApiPropertyOptional({ description: 'Nome' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Se é o dashboard padrão' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Se é público' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Layout' })
  @IsOptional()
  @IsObject()
  layout?: Record<string, any>;

  @ApiPropertyOptional({ type: ReportFilterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReportFilterDto)
  globalFilters?: ReportFilterDto;

  @ApiPropertyOptional({ description: 'Período padrão' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  defaultPeriodDays?: number;

  @ApiPropertyOptional({ description: 'Auto refresh' })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(3600)
  refreshInterval?: number;
}

export class CreateWidgetDto {
  @ApiProperty({ description: 'Título do widget' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ enum: DashboardWidgetType, description: 'Tipo do widget' })
  @IsEnum(DashboardWidgetType)
  type: DashboardWidgetType;

  @ApiProperty({ description: 'Configuração de dados' })
  @IsObject()
  dataConfig: {
    reportType?: ReportType;
    customReportId?: string;
    metrics?: MetricConfigDto[];
    filters?: ReportFilterDto;
    groupBy?: string[];
  };

  @ApiPropertyOptional({ description: 'Posição no grid' })
  @IsOptional()
  @IsObject()
  position?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };

  @ApiPropertyOptional({ description: 'Configuração visual' })
  @IsOptional()
  @IsObject()
  visualConfig?: {
    colors?: string[];
    showLegend?: boolean;
    showLabels?: boolean;
    format?: string;
  };

  @ApiPropertyOptional({ description: 'Ações/links' })
  @IsOptional()
  @IsObject()
  actions?: {
    drillDown?: string;
    link?: string;
  };
}

export class UpdateWidgetDto {
  @ApiPropertyOptional({ description: 'Título' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ enum: DashboardWidgetType })
  @IsOptional()
  @IsEnum(DashboardWidgetType)
  type?: DashboardWidgetType;

  @ApiPropertyOptional({ description: 'Configuração de dados' })
  @IsOptional()
  @IsObject()
  dataConfig?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Posição' })
  @IsOptional()
  @IsObject()
  position?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Configuração visual' })
  @IsOptional()
  @IsObject()
  visualConfig?: Record<string, any>;
}

// ==================== KPI DTOs ====================

export class CreateKPIDto {
  @ApiProperty({ description: 'Nome do KPI' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: 'Código único' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ description: 'Categoria' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ enum: MetricType, description: 'Tipo de cálculo' })
  @IsEnum(MetricType)
  calculationType: MetricType;

  @ApiProperty({ description: 'Fórmula ou campo' })
  @IsString()
  @IsNotEmpty()
  formula: string;

  @ApiPropertyOptional({ description: 'Meta' })
  @IsOptional()
  @IsNumber()
  target?: number;

  @ApiPropertyOptional({ description: 'Unidade de medida' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: 'Formato de exibição' })
  @IsOptional()
  @IsString()
  format?: string;

  @ApiPropertyOptional({ description: 'Limite de alerta (amarelo)' })
  @IsOptional()
  @IsNumber()
  warningThreshold?: number;

  @ApiPropertyOptional({ description: 'Limite crítico (vermelho)' })
  @IsOptional()
  @IsNumber()
  criticalThreshold?: number;

  @ApiPropertyOptional({ description: 'Se maior é melhor' })
  @IsOptional()
  @IsBoolean()
  higherIsBetter?: boolean;

  @ApiPropertyOptional({ type: ReportFilterDto, description: 'Filtros aplicados' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReportFilterDto)
  filters?: ReportFilterDto;
}

export class UpdateKPIDto {
  @ApiPropertyOptional({ description: 'Nome' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Meta' })
  @IsOptional()
  @IsNumber()
  target?: number;

  @ApiPropertyOptional({ description: 'Limite de alerta' })
  @IsOptional()
  @IsNumber()
  warningThreshold?: number;

  @ApiPropertyOptional({ description: 'Limite crítico' })
  @IsOptional()
  @IsNumber()
  criticalThreshold?: number;

  @ApiPropertyOptional({ description: 'Se está ativo' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ==================== Export DTOs ====================

export class ExportDataDto {
  @ApiProperty({ description: 'Tipo de dados' })
  @IsString()
  @IsNotEmpty()
  dataType: string;

  @ApiProperty({ description: 'Data início' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Data fim' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ enum: ReportFormat, description: 'Formato' })
  @IsEnum(ReportFormat)
  format: ReportFormat;

  @ApiPropertyOptional({ type: ReportFilterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReportFilterDto)
  filters?: ReportFilterDto;

  @ApiPropertyOptional({ description: 'Campos a incluir' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[];

  @ApiPropertyOptional({ description: 'Incluir campos relacionados' })
  @IsOptional()
  @IsBoolean()
  includeRelations?: boolean;

  @ApiPropertyOptional({ description: 'Anonimizar dados sensíveis' })
  @IsOptional()
  @IsBoolean()
  anonymize?: boolean;
}

// ==================== Query Execution DTOs ====================

export class ExecuteQueryDto {
  @ApiProperty({ description: 'Query SQL ou similar (com permissões)' })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiPropertyOptional({ description: 'Parâmetros' })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Limite de resultados' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10000)
  limit?: number;
}

// ==================== Cohort DTOs ====================

export class CreateCohortDto {
  @ApiProperty({ description: 'Nome da coorte' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ description: 'Entidade base (patient, doctor, etc)' })
  @IsString()
  @IsNotEmpty()
  baseEntity: string;

  @ApiProperty({ description: 'Critérios de inclusão' })
  @IsObject()
  criteria: {
    filters: ReportFilterDto;
    dateRange?: {
      field: string;
      start: string;
      end: string;
    };
    conditions?: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
  };

  @ApiPropertyOptional({ description: 'Se é dinâmica (atualiza automaticamente)' })
  @IsOptional()
  @IsBoolean()
  isDynamic?: boolean;
}

export class CohortAnalysisDto {
  @ApiProperty({ description: 'ID da coorte' })
  @IsUUID()
  cohortId: string;

  @ApiProperty({ description: 'Métricas a analisar' })
  @IsArray()
  @IsString({ each: true })
  metrics: string[];

  @ApiProperty({ description: 'Data início' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Data fim' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ enum: TimeGranularity })
  @IsOptional()
  @IsEnum(TimeGranularity)
  granularity?: TimeGranularity;

  @ApiPropertyOptional({ description: 'Segmentar por' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  segmentBy?: string[];
}
