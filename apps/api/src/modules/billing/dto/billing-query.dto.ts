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
  InvoiceStatus,
  InvoiceType,
  PaymentMethod,
  PaymentStatus,
  InsuranceClaimStatus,
  PaymentPlanStatus,
  PriceTableType,
} from './create-billing.dto';

// ==================== Base Query DTO ====================

export class BasePaginationQueryDto {
  @ApiPropertyOptional({ description: 'Número da página', default: 1 })
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

  @ApiPropertyOptional({ description: 'Direção da ordenação', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

// ==================== Invoice Query DTOs ====================

export class InvoiceQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({ description: 'Busca por número ou referência' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'ID do paciente' })
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiPropertyOptional({ description: 'ID da clínica' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'ID do médico' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiPropertyOptional({ enum: InvoiceStatus, description: 'Status da fatura' })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @ApiPropertyOptional({ enum: InvoiceStatus, isArray: true, description: 'Status múltiplos' })
  @IsOptional()
  @IsArray()
  @IsEnum(InvoiceStatus, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  statuses?: InvoiceStatus[];

  @ApiPropertyOptional({ enum: InvoiceType, description: 'Tipo da fatura' })
  @IsOptional()
  @IsEnum(InvoiceType)
  type?: InvoiceType;

  @ApiPropertyOptional({ description: 'Data de emissão início' })
  @IsOptional()
  @IsDateString()
  issueDateFrom?: string;

  @ApiPropertyOptional({ description: 'Data de emissão fim' })
  @IsOptional()
  @IsDateString()
  issueDateTo?: string;

  @ApiPropertyOptional({ description: 'Data de vencimento início' })
  @IsOptional()
  @IsDateString()
  dueDateFrom?: string;

  @ApiPropertyOptional({ description: 'Data de vencimento fim' })
  @IsOptional()
  @IsDateString()
  dueDateTo?: string;

  @ApiPropertyOptional({ description: 'Valor mínimo' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Valor máximo' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxAmount?: number;

  @ApiPropertyOptional({ description: 'Apenas faturas em atraso' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  overdue?: boolean;

  @ApiPropertyOptional({ description: 'ID do convênio' })
  @IsOptional()
  @IsUUID()
  insuranceId?: string;

  @ApiPropertyOptional({ description: 'Com convênio' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  hasInsurance?: boolean;

  @ApiPropertyOptional({ description: 'ID da consulta relacionada' })
  @IsOptional()
  @IsUUID()
  consultationId?: string;

  @ApiPropertyOptional({ description: 'Incluir itens' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeItems?: boolean;

  @ApiPropertyOptional({ description: 'Incluir pagamentos' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includePayments?: boolean;

  @ApiPropertyOptional({ description: 'Incluir dados do paciente' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includePatient?: boolean;
}

export class PatientInvoicesQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({ enum: InvoiceStatus, description: 'Status da fatura' })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @ApiPropertyOptional({ enum: InvoiceType, description: 'Tipo da fatura' })
  @IsOptional()
  @IsEnum(InvoiceType)
  type?: InvoiceType;

  @ApiPropertyOptional({ description: 'Data início' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Data fim' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Apenas pendentes' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  pendingOnly?: boolean;
}

export class OverdueInvoicesQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({ description: 'ID da clínica' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'Dias em atraso mínimo' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  minDaysOverdue?: number;

  @ApiPropertyOptional({ description: 'Dias em atraso máximo' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxDaysOverdue?: number;

  @ApiPropertyOptional({ description: 'Valor mínimo' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Agrupar por paciente' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  groupByPatient?: boolean;
}

// ==================== Payment Query DTOs ====================

export class PaymentQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({ description: 'ID da fatura' })
  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @ApiPropertyOptional({ description: 'ID do paciente' })
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiPropertyOptional({ description: 'ID da clínica' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ enum: PaymentMethod, description: 'Método de pagamento' })
  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @ApiPropertyOptional({ enum: PaymentStatus, description: 'Status do pagamento' })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional({ description: 'Data de pagamento início' })
  @IsOptional()
  @IsDateString()
  paidDateFrom?: string;

  @ApiPropertyOptional({ description: 'Data de pagamento fim' })
  @IsOptional()
  @IsDateString()
  paidDateTo?: string;

  @ApiPropertyOptional({ description: 'Valor mínimo' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Valor máximo' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxAmount?: number;

  @ApiPropertyOptional({ description: 'Incluir dados da fatura' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeInvoice?: boolean;

  @ApiPropertyOptional({ description: 'Incluir dados do paciente' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includePatient?: boolean;
}

export class PaymentReconciliationQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({ description: 'ID da clínica' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'Data início' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Data fim' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ enum: PaymentMethod, description: 'Método de pagamento' })
  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Apenas pendentes de reconciliação' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  pendingOnly?: boolean;

  @ApiPropertyOptional({ description: 'Gateway de pagamento' })
  @IsOptional()
  @IsString()
  gateway?: string;
}

// ==================== Insurance Claim Query DTOs ====================

export class InsuranceClaimQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({ description: 'Busca por número ou guia' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'ID do convênio' })
  @IsOptional()
  @IsUUID()
  insuranceId?: string;

  @ApiPropertyOptional({ description: 'ID do paciente' })
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiPropertyOptional({ description: 'ID da clínica' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ enum: InsuranceClaimStatus, description: 'Status do claim' })
  @IsOptional()
  @IsEnum(InsuranceClaimStatus)
  status?: InsuranceClaimStatus;

  @ApiPropertyOptional({ enum: InsuranceClaimStatus, isArray: true, description: 'Status múltiplos' })
  @IsOptional()
  @IsArray()
  @IsEnum(InsuranceClaimStatus, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  statuses?: InsuranceClaimStatus[];

  @ApiPropertyOptional({ description: 'Data de submissão início' })
  @IsOptional()
  @IsDateString()
  submittedFrom?: string;

  @ApiPropertyOptional({ description: 'Data de submissão fim' })
  @IsOptional()
  @IsDateString()
  submittedTo?: string;

  @ApiPropertyOptional({ description: 'Valor mínimo' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Valor máximo' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxAmount?: number;

  @ApiPropertyOptional({ description: 'Apenas negados' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  deniedOnly?: boolean;

  @ApiPropertyOptional({ description: 'Apenas pendentes de pagamento' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  pendingPayment?: boolean;

  @ApiPropertyOptional({ description: 'Incluir fatura' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeInvoice?: boolean;

  @ApiPropertyOptional({ description: 'Incluir paciente' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includePatient?: boolean;
}

export class InsuranceBatchQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({ description: 'ID do convênio' })
  @IsOptional()
  @IsUUID()
  insuranceId?: string;

  @ApiPropertyOptional({ description: 'ID da clínica' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'Data de competência' })
  @IsOptional()
  @IsDateString()
  competenceDate?: string;

  @ApiPropertyOptional({ description: 'Status do lote' })
  @IsOptional()
  @IsString()
  status?: string;
}

// ==================== Payment Plan Query DTOs ====================

export class PaymentPlanQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({ description: 'ID do paciente' })
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiPropertyOptional({ description: 'ID da clínica' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ enum: PaymentPlanStatus, description: 'Status do plano' })
  @IsOptional()
  @IsEnum(PaymentPlanStatus)
  status?: PaymentPlanStatus;

  @ApiPropertyOptional({ description: 'Com parcelas em atraso' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  hasOverdueInstallments?: boolean;

  @ApiPropertyOptional({ description: 'Data de criação início' })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({ description: 'Data de criação fim' })
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiPropertyOptional({ description: 'Incluir parcelas' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeInstallments?: boolean;
}

export class InstallmentQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({ description: 'ID do plano de pagamento' })
  @IsOptional()
  @IsUUID()
  paymentPlanId?: string;

  @ApiPropertyOptional({ description: 'Status da parcela' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Data de vencimento início' })
  @IsOptional()
  @IsDateString()
  dueDateFrom?: string;

  @ApiPropertyOptional({ description: 'Data de vencimento fim' })
  @IsOptional()
  @IsDateString()
  dueDateTo?: string;

  @ApiPropertyOptional({ description: 'Apenas em atraso' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  overdueOnly?: boolean;

  @ApiPropertyOptional({ description: 'Apenas pendentes' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  pendingOnly?: boolean;
}

// ==================== Price Table Query DTOs ====================

export class PriceTableQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({ description: 'Busca por nome' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: PriceTableType, description: 'Tipo de tabela' })
  @IsOptional()
  @IsEnum(PriceTableType)
  type?: PriceTableType;

  @ApiPropertyOptional({ description: 'ID do convênio' })
  @IsOptional()
  @IsUUID()
  insuranceId?: string;

  @ApiPropertyOptional({ description: 'Apenas ativas' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  activeOnly?: boolean;

  @ApiPropertyOptional({ description: 'Data de vigência' })
  @IsOptional()
  @IsDateString()
  validOn?: string;

  @ApiPropertyOptional({ description: 'Incluir itens' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeItems?: boolean;
}

export class PriceTableItemQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({ description: 'Busca por código ou descrição' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'ID da tabela de preços' })
  @IsOptional()
  @IsUUID()
  priceTableId?: string;

  @ApiPropertyOptional({ description: 'Categoria' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Código TUSS' })
  @IsOptional()
  @IsString()
  tussCode?: string;

  @ApiPropertyOptional({ description: 'Apenas ativos' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  activeOnly?: boolean;
}

// ==================== Financial Report Query DTOs ====================

export class FinancialReportQueryDto {
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

  @ApiPropertyOptional({ description: 'ID do médico' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiPropertyOptional({ description: 'ID do convênio' })
  @IsOptional()
  @IsUUID()
  insuranceId?: string;

  @ApiPropertyOptional({ description: 'Tipo de relatório' })
  @IsOptional()
  @IsString()
  reportType?: string;

  @ApiPropertyOptional({ description: 'Agrupar por' })
  @IsOptional()
  @IsString()
  groupBy?: string;

  @ApiPropertyOptional({ description: 'Incluir comparativo período anterior' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeComparison?: boolean;
}

export class RevenueQueryDto {
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

  @ApiPropertyOptional({ description: 'Granularidade (day, week, month, year)' })
  @IsOptional()
  @IsString()
  granularity?: string;

  @ApiPropertyOptional({ description: 'Agrupar por tipo' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  groupByType?: boolean;

  @ApiPropertyOptional({ description: 'Agrupar por convênio' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  groupByInsurance?: boolean;

  @ApiPropertyOptional({ description: 'Agrupar por médico' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  groupByDoctor?: boolean;
}

export class CashFlowQueryDto {
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

  @ApiPropertyOptional({ description: 'Granularidade' })
  @IsOptional()
  @IsString()
  granularity?: string;

  @ApiPropertyOptional({ description: 'Incluir projeções' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeProjections?: boolean;
}

// ==================== Receivables Query DTOs ====================

export class ReceivablesQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({ description: 'ID da clínica' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'ID do paciente' })
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiPropertyOptional({ description: 'Data de vencimento início' })
  @IsOptional()
  @IsDateString()
  dueDateFrom?: string;

  @ApiPropertyOptional({ description: 'Data de vencimento fim' })
  @IsOptional()
  @IsDateString()
  dueDateTo?: string;

  @ApiPropertyOptional({ description: 'Apenas em atraso' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  overdueOnly?: boolean;

  @ApiPropertyOptional({ description: 'Tipo de recebível' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Agrupar por paciente' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  groupByPatient?: boolean;

  @ApiPropertyOptional({ description: 'Agrupar por convênio' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  groupByInsurance?: boolean;
}

export class AgingReportQueryDto {
  @ApiPropertyOptional({ description: 'ID da clínica' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'Data de referência' })
  @IsOptional()
  @IsDateString()
  referenceDate?: string;

  @ApiPropertyOptional({ description: 'Agrupar por' })
  @IsOptional()
  @IsString()
  groupBy?: string;

  @ApiPropertyOptional({ description: 'ID do convênio' })
  @IsOptional()
  @IsUUID()
  insuranceId?: string;
}

// ==================== Commission Query DTOs ====================

export class CommissionQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({ description: 'ID do médico' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiPropertyOptional({ description: 'ID da clínica' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'Data início' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data fim' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Apenas pendentes de pagamento' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  pendingPayment?: boolean;

  @ApiPropertyOptional({ description: 'Tipo de serviço' })
  @IsOptional()
  @IsString()
  serviceType?: string;
}

export class CommissionRulesQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({ description: 'ID do médico' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiPropertyOptional({ description: 'ID da clínica' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'Apenas ativas' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  activeOnly?: boolean;

  @ApiPropertyOptional({ description: 'Tipo de serviço' })
  @IsOptional()
  @IsString()
  serviceType?: string;
}

// ==================== Statistics Query DTOs ====================

export class BillingStatisticsQueryDto {
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

  @ApiPropertyOptional({ description: 'Granularidade' })
  @IsOptional()
  @IsString()
  granularity?: string;

  @ApiPropertyOptional({ description: 'Incluir comparativo período anterior' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeComparison?: boolean;

  @ApiPropertyOptional({ description: 'Incluir breakdown por tipo' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeTypeBreakdown?: boolean;

  @ApiPropertyOptional({ description: 'Incluir breakdown por convênio' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeInsuranceBreakdown?: boolean;

  @ApiPropertyOptional({ description: 'Incluir breakdown por método de pagamento' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includePaymentMethodBreakdown?: boolean;
}

// ==================== Dashboard Query DTOs ====================

export class BillingDashboardQueryDto {
  @ApiPropertyOptional({ description: 'ID da clínica' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'Período (today, week, month, year)' })
  @IsOptional()
  @IsString()
  period?: string;

  @ApiPropertyOptional({ description: 'Data início customizada' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data fim customizada' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

// ==================== Export Query DTOs ====================

export class BillingExportQueryDto {
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

  @ApiPropertyOptional({ description: 'Tipo de dados (invoices, payments, claims)' })
  @IsOptional()
  @IsString()
  dataType?: string;

  @ApiPropertyOptional({ description: 'Formato (csv, xlsx, pdf)' })
  @IsOptional()
  @IsString()
  format?: string;

  @ApiPropertyOptional({ description: 'Incluir detalhes' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeDetails?: boolean;
}

// ==================== Notification Query DTOs ====================

export class PaymentReminderQueryDto {
  @ApiPropertyOptional({ description: 'Dias antes do vencimento' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  daysBeforeDue?: number;

  @ApiPropertyOptional({ description: 'Dias após vencimento' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  daysAfterDue?: number;

  @ApiPropertyOptional({ description: 'ID da clínica' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'Excluir já notificados' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  excludeNotified?: boolean;
}
