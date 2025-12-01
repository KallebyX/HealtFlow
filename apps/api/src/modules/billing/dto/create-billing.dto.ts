import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsUUID,
  IsEmail,
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
  Matches,
  ArrayMinSize,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// ==================== Enums ====================

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  SENT = 'SENT',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  DISPUTED = 'DISPUTED',
  WRITE_OFF = 'WRITE_OFF',
}

export enum InvoiceType {
  CONSULTATION = 'CONSULTATION',
  PROCEDURE = 'PROCEDURE',
  LABORATORY = 'LABORATORY',
  IMAGING = 'IMAGING',
  PHARMACY = 'PHARMACY',
  HOSPITALIZATION = 'HOSPITALIZATION',
  EMERGENCY = 'EMERGENCY',
  TELEMEDICINE = 'TELEMEDICINE',
  SUBSCRIPTION = 'SUBSCRIPTION',
  OTHER = 'OTHER',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PIX = 'PIX',
  BANK_TRANSFER = 'BANK_TRANSFER',
  BOLETO = 'BOLETO',
  CHECK = 'CHECK',
  INSURANCE = 'INSURANCE',
  COVENANT = 'COVENANT',
  HEALTH_PLAN = 'HEALTH_PLAN',
  INSTALLMENT = 'INSTALLMENT',
  CREDIT = 'CREDIT',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  AUTHORIZED = 'AUTHORIZED',
  CAPTURED = 'CAPTURED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  CHARGEBACK = 'CHARGEBACK',
  EXPIRED = 'EXPIRED',
}

export enum InsuranceClaimStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  PARTIALLY_APPROVED = 'PARTIALLY_APPROVED',
  DENIED = 'DENIED',
  APPEALED = 'APPEALED',
  RESUBMITTED = 'RESUBMITTED',
  PAID = 'PAID',
  CLOSED = 'CLOSED',
}

export enum InsuranceDenialReason {
  COVERAGE_EXCLUDED = 'COVERAGE_EXCLUDED',
  PRE_EXISTING_CONDITION = 'PRE_EXISTING_CONDITION',
  NOT_MEDICALLY_NECESSARY = 'NOT_MEDICALLY_NECESSARY',
  OUT_OF_NETWORK = 'OUT_OF_NETWORK',
  AUTHORIZATION_REQUIRED = 'AUTHORIZATION_REQUIRED',
  DUPLICATE_CLAIM = 'DUPLICATE_CLAIM',
  FILING_DEADLINE = 'FILING_DEADLINE',
  INCOMPLETE_DOCUMENTATION = 'INCOMPLETE_DOCUMENTATION',
  BENEFIT_LIMIT_REACHED = 'BENEFIT_LIMIT_REACHED',
  INVALID_PROCEDURE_CODE = 'INVALID_PROCEDURE_CODE',
  COORDINATION_OF_BENEFITS = 'COORDINATION_OF_BENEFITS',
  OTHER = 'OTHER',
}

export enum PaymentPlanStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DEFAULTED = 'DEFAULTED',
  CANCELLED = 'CANCELLED',
  RENEGOTIATED = 'RENEGOTIATED',
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export enum TaxType {
  ISS = 'ISS',
  IRRF = 'IRRF',
  INSS = 'INSS',
  PIS = 'PIS',
  COFINS = 'COFINS',
  CSLL = 'CSLL',
}

export enum PriceTableType {
  PRIVATE = 'PRIVATE',
  TUSS = 'TUSS',
  CBHPM = 'CBHPM',
  AMB = 'AMB',
  CUSTOM = 'CUSTOM',
}

export enum RefundReason {
  DUPLICATE_PAYMENT = 'DUPLICATE_PAYMENT',
  SERVICE_NOT_RENDERED = 'SERVICE_NOT_RENDERED',
  OVERCHARGE = 'OVERCHARGE',
  CUSTOMER_REQUEST = 'CUSTOMER_REQUEST',
  SERVICE_QUALITY = 'SERVICE_QUALITY',
  INSURANCE_ADJUSTMENT = 'INSURANCE_ADJUSTMENT',
  OTHER = 'OTHER',
}

// ==================== Invoice DTOs ====================

export class InvoiceItemDto {
  @ApiProperty({ description: 'Código do item (TUSS, CBHPM, interno)' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Descrição do item' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Quantidade' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Valor unitário' })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ description: 'Desconto do item' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ enum: DiscountType, description: 'Tipo de desconto' })
  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @ApiPropertyOptional({ description: 'ID do serviço/procedimento relacionado' })
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiPropertyOptional({ description: 'Tipo de serviço' })
  @IsOptional()
  @IsString()
  serviceType?: string;

  @ApiPropertyOptional({ description: 'ID da consulta relacionada' })
  @IsOptional()
  @IsUUID()
  consultationId?: string;

  @ApiPropertyOptional({ description: 'ID do exame relacionado' })
  @IsOptional()
  @IsUUID()
  labOrderId?: string;

  @ApiPropertyOptional({ description: 'ID do médico que realizou' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiPropertyOptional({ description: 'Data do serviço' })
  @IsOptional()
  @IsDateString()
  serviceDate?: string;

  @ApiPropertyOptional({ description: 'Observações do item' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Se é coberto pelo convênio' })
  @IsOptional()
  @IsBoolean()
  coveredByInsurance?: boolean;

  @ApiPropertyOptional({ description: 'Código da tabela de preços' })
  @IsOptional()
  @IsString()
  priceTableCode?: string;
}

export class InvoiceTaxDto {
  @ApiProperty({ enum: TaxType, description: 'Tipo de imposto' })
  @IsEnum(TaxType)
  type: TaxType;

  @ApiProperty({ description: 'Percentual do imposto' })
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;

  @ApiProperty({ description: 'Valor do imposto' })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiPropertyOptional({ description: 'Retido na fonte' })
  @IsOptional()
  @IsBoolean()
  withheld?: boolean;
}

export class CreateInvoiceDto {
  @ApiProperty({ description: 'ID do paciente' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ description: 'ID da clínica' })
  @IsUUID()
  clinicId: string;

  @ApiProperty({ enum: InvoiceType, description: 'Tipo da fatura' })
  @IsEnum(InvoiceType)
  type: InvoiceType;

  @ApiProperty({ type: [InvoiceItemDto], description: 'Itens da fatura' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  @ArrayMinSize(1)
  items: InvoiceItemDto[];

  @ApiPropertyOptional({ description: 'Data de vencimento' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'ID do convênio/plano de saúde' })
  @IsOptional()
  @IsUUID()
  insuranceId?: string;

  @ApiPropertyOptional({ description: 'Número de autorização do convênio' })
  @IsOptional()
  @IsString()
  insuranceAuthorizationNumber?: string;

  @ApiPropertyOptional({ description: 'Desconto global' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  globalDiscount?: number;

  @ApiPropertyOptional({ enum: DiscountType, description: 'Tipo de desconto global' })
  @IsOptional()
  @IsEnum(DiscountType)
  globalDiscountType?: DiscountType;

  @ApiPropertyOptional({ description: 'Motivo do desconto' })
  @IsOptional()
  @IsString()
  discountReason?: string;

  @ApiPropertyOptional({ type: [InvoiceTaxDto], description: 'Impostos' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceTaxDto)
  taxes?: InvoiceTaxDto[];

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Observações internas' })
  @IsOptional()
  @IsString()
  internalNotes?: string;

  @ApiPropertyOptional({ description: 'Referência externa' })
  @IsOptional()
  @IsString()
  externalReference?: string;

  @ApiPropertyOptional({ description: 'ID da consulta relacionada' })
  @IsOptional()
  @IsUUID()
  consultationId?: string;

  @ApiPropertyOptional({ description: 'ID do agendamento relacionado' })
  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @ApiPropertyOptional({ description: 'Se deve enviar automaticamente ao paciente' })
  @IsOptional()
  @IsBoolean()
  sendToPatient?: boolean;

  @ApiPropertyOptional({ description: 'Métodos de pagamento aceitos' })
  @IsOptional()
  @IsArray()
  @IsEnum(PaymentMethod, { each: true })
  acceptedPaymentMethods?: PaymentMethod[];
}

export class UpdateInvoiceDto {
  @ApiPropertyOptional({ enum: InvoiceStatus, description: 'Status da fatura' })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @ApiPropertyOptional({ type: [InvoiceItemDto], description: 'Itens da fatura' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items?: InvoiceItemDto[];

  @ApiPropertyOptional({ description: 'Data de vencimento' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Desconto global' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  globalDiscount?: number;

  @ApiPropertyOptional({ enum: DiscountType, description: 'Tipo de desconto global' })
  @IsOptional()
  @IsEnum(DiscountType)
  globalDiscountType?: DiscountType;

  @ApiPropertyOptional({ description: 'Motivo do desconto' })
  @IsOptional()
  @IsString()
  discountReason?: string;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Observações internas' })
  @IsOptional()
  @IsString()
  internalNotes?: string;
}

export class SendInvoiceDto {
  @ApiProperty({ description: 'ID da fatura' })
  @IsUUID()
  invoiceId: string;

  @ApiPropertyOptional({ description: 'Enviar por email' })
  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;

  @ApiPropertyOptional({ description: 'Enviar por SMS' })
  @IsOptional()
  @IsBoolean()
  sendSms?: boolean;

  @ApiPropertyOptional({ description: 'Enviar por WhatsApp' })
  @IsOptional()
  @IsBoolean()
  sendWhatsApp?: boolean;

  @ApiPropertyOptional({ description: 'Email alternativo' })
  @IsOptional()
  @IsEmail()
  alternativeEmail?: string;

  @ApiPropertyOptional({ description: 'Telefone alternativo' })
  @IsOptional()
  @IsString()
  alternativePhone?: string;

  @ApiPropertyOptional({ description: 'Mensagem personalizada' })
  @IsOptional()
  @IsString()
  customMessage?: string;
}

export class CancelInvoiceDto {
  @ApiProperty({ description: 'Motivo do cancelamento' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  reason: string;

  @ApiPropertyOptional({ description: 'Se deve estornar pagamentos' })
  @IsOptional()
  @IsBoolean()
  refundPayments?: boolean;
}

// ==================== Payment DTOs ====================

export class CardPaymentDto {
  @ApiProperty({ description: 'Número do cartão (tokenizado)' })
  @IsString()
  @IsNotEmpty()
  cardToken: string;

  @ApiPropertyOptional({ description: 'ID do cartão salvo' })
  @IsOptional()
  @IsString()
  savedCardId?: string;

  @ApiProperty({ description: 'Nome no cartão' })
  @IsString()
  @IsNotEmpty()
  cardholderName: string;

  @ApiPropertyOptional({ description: 'Número de parcelas' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(24)
  installments?: number;

  @ApiPropertyOptional({ description: 'Salvar cartão para uso futuro' })
  @IsOptional()
  @IsBoolean()
  saveCard?: boolean;

  @ApiPropertyOptional({ description: 'CVV' })
  @IsOptional()
  @IsString()
  cvv?: string;
}

export class PixPaymentDto {
  @ApiPropertyOptional({ description: 'Chave PIX para pagamento (se diferente do padrão)' })
  @IsOptional()
  @IsString()
  pixKey?: string;

  @ApiPropertyOptional({ description: 'Tempo de expiração em minutos' })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(1440)
  expirationMinutes?: number;
}

export class BoletoPaymentDto {
  @ApiPropertyOptional({ description: 'Dias para vencimento' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(90)
  daysToExpire?: number;

  @ApiPropertyOptional({ description: 'Instruções adicionais' })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({ description: 'Multa por atraso (%)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  lateFeePercentage?: number;

  @ApiPropertyOptional({ description: 'Juros por dia de atraso (%)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  dailyInterestPercentage?: number;
}

export class CreatePaymentDto {
  @ApiProperty({ description: 'ID da fatura' })
  @IsUUID()
  invoiceId: string;

  @ApiProperty({ description: 'Valor do pagamento' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: PaymentMethod, description: 'Método de pagamento' })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiPropertyOptional({ type: CardPaymentDto, description: 'Dados do cartão' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CardPaymentDto)
  cardDetails?: CardPaymentDto;

  @ApiPropertyOptional({ type: PixPaymentDto, description: 'Dados do PIX' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PixPaymentDto)
  pixDetails?: PixPaymentDto;

  @ApiPropertyOptional({ type: BoletoPaymentDto, description: 'Dados do boleto' })
  @IsOptional()
  @ValidateNested()
  @Type(() => BoletoPaymentDto)
  boletoDetails?: BoletoPaymentDto;

  @ApiPropertyOptional({ description: 'Referência externa (gateway)' })
  @IsOptional()
  @IsString()
  externalReference?: string;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Metadata adicional' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class ConfirmPaymentDto {
  @ApiProperty({ description: 'ID do pagamento' })
  @IsUUID()
  paymentId: string;

  @ApiPropertyOptional({ description: 'ID da transação no gateway' })
  @IsOptional()
  @IsString()
  gatewayTransactionId?: string;

  @ApiPropertyOptional({ description: 'Comprovante de pagamento' })
  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @ApiPropertyOptional({ description: 'Data efetiva do pagamento' })
  @IsOptional()
  @IsDateString()
  paidAt?: string;
}

export class RefundPaymentDto {
  @ApiProperty({ description: 'ID do pagamento' })
  @IsUUID()
  paymentId: string;

  @ApiPropertyOptional({ description: 'Valor do estorno (parcial)' })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @ApiProperty({ enum: RefundReason, description: 'Motivo do estorno' })
  @IsEnum(RefundReason)
  reason: RefundReason;

  @ApiPropertyOptional({ description: 'Descrição detalhada' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class RecordManualPaymentDto {
  @ApiProperty({ description: 'ID da fatura' })
  @IsUUID()
  invoiceId: string;

  @ApiProperty({ description: 'Valor pago' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: PaymentMethod, description: 'Método de pagamento' })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ description: 'Data do pagamento' })
  @IsDateString()
  paidAt: string;

  @ApiPropertyOptional({ description: 'Número do cheque/transação' })
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiPropertyOptional({ description: 'Banco (para cheque/transferência)' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ description: 'Comprovante URL' })
  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  notes?: string;
}

// ==================== Insurance/Covenant DTOs ====================

export class CreateInsuranceClaimDto {
  @ApiProperty({ description: 'ID da fatura' })
  @IsUUID()
  invoiceId: string;

  @ApiProperty({ description: 'ID do convênio' })
  @IsUUID()
  insuranceId: string;

  @ApiProperty({ description: 'ID do paciente' })
  @IsUUID()
  patientId: string;

  @ApiPropertyOptional({ description: 'Número da carteirinha' })
  @IsOptional()
  @IsString()
  membershipNumber?: string;

  @ApiPropertyOptional({ description: 'Número de autorização prévia' })
  @IsOptional()
  @IsString()
  priorAuthorizationNumber?: string;

  @ApiPropertyOptional({ description: 'Número da guia' })
  @IsOptional()
  @IsString()
  guideNumber?: string;

  @ApiProperty({ description: 'Valor total solicitado' })
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiPropertyOptional({ description: 'Procedimentos incluídos' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  procedures?: string[];

  @ApiPropertyOptional({ description: 'CIDs relacionados' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  diagnosisCodes?: string[];

  @ApiPropertyOptional({ description: 'Documentos anexos' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiPropertyOptional({ description: 'Data do atendimento' })
  @IsOptional()
  @IsDateString()
  serviceDate?: string;

  @ApiPropertyOptional({ description: 'Observações clínicas' })
  @IsOptional()
  @IsString()
  clinicalNotes?: string;
}

export class UpdateInsuranceClaimDto {
  @ApiPropertyOptional({ enum: InsuranceClaimStatus, description: 'Status do claim' })
  @IsOptional()
  @IsEnum(InsuranceClaimStatus)
  status?: InsuranceClaimStatus;

  @ApiPropertyOptional({ description: 'Valor aprovado' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  approvedAmount?: number;

  @ApiPropertyOptional({ description: 'Valor pago' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  paidAmount?: number;

  @ApiPropertyOptional({ description: 'Data do pagamento' })
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @ApiPropertyOptional({ enum: InsuranceDenialReason, description: 'Motivo da negativa' })
  @IsOptional()
  @IsEnum(InsuranceDenialReason)
  denialReason?: InsuranceDenialReason;

  @ApiPropertyOptional({ description: 'Explicação da negativa' })
  @IsOptional()
  @IsString()
  denialExplanation?: string;

  @ApiPropertyOptional({ description: 'Itens negados' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deniedItems?: string[];

  @ApiPropertyOptional({ description: 'Protocolo de resposta' })
  @IsOptional()
  @IsString()
  responseProtocol?: string;

  @ApiPropertyOptional({ description: 'Observações internas' })
  @IsOptional()
  @IsString()
  internalNotes?: string;
}

export class AppealInsuranceClaimDto {
  @ApiProperty({ description: 'ID do claim' })
  @IsUUID()
  claimId: string;

  @ApiProperty({ description: 'Justificativa do recurso' })
  @IsString()
  @IsNotEmpty()
  @MinLength(50)
  justification: string;

  @ApiPropertyOptional({ description: 'Documentos adicionais' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additionalDocuments?: string[];

  @ApiPropertyOptional({ description: 'Literatura médica de suporte' })
  @IsOptional()
  @IsString()
  medicalLiterature?: string;
}

export class BatchInsuranceClaimDto {
  @ApiProperty({ description: 'IDs das faturas para faturamento em lote' })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  invoiceIds: string[];

  @ApiProperty({ description: 'ID do convênio' })
  @IsUUID()
  insuranceId: string;

  @ApiPropertyOptional({ description: 'Data de competência' })
  @IsOptional()
  @IsDateString()
  competenceDate?: string;

  @ApiPropertyOptional({ description: 'Tipo de lote (mensal, semanal)' })
  @IsOptional()
  @IsString()
  batchType?: string;
}

// ==================== Payment Plan DTOs ====================

export class InstallmentDto {
  @ApiProperty({ description: 'Número da parcela' })
  @IsNumber()
  @Min(1)
  number: number;

  @ApiProperty({ description: 'Valor da parcela' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Data de vencimento' })
  @IsDateString()
  dueDate: string;
}

export class CreatePaymentPlanDto {
  @ApiProperty({ description: 'ID da fatura' })
  @IsUUID()
  invoiceId: string;

  @ApiProperty({ description: 'Número de parcelas' })
  @IsNumber()
  @Min(2)
  @Max(48)
  installments: number;

  @ApiPropertyOptional({ description: 'Valor de entrada' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  downPayment?: number;

  @ApiPropertyOptional({ description: 'Método de pagamento das parcelas' })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Taxa de juros mensal (%)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  monthlyInterestRate?: number;

  @ApiPropertyOptional({ description: 'Dia do vencimento' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(28)
  dueDay?: number;

  @ApiPropertyOptional({ description: 'Data do primeiro vencimento' })
  @IsOptional()
  @IsDateString()
  firstDueDate?: string;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'ID do cartão para débito recorrente' })
  @IsOptional()
  @IsString()
  recurringCardId?: string;
}

export class PayInstallmentDto {
  @ApiProperty({ description: 'ID do plano de pagamento' })
  @IsUUID()
  paymentPlanId: string;

  @ApiProperty({ description: 'Número da parcela' })
  @IsNumber()
  @Min(1)
  installmentNumber: number;

  @ApiProperty({ enum: PaymentMethod, description: 'Método de pagamento' })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiPropertyOptional({ description: 'Dados do cartão (se aplicável)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CardPaymentDto)
  cardDetails?: CardPaymentDto;

  @ApiPropertyOptional({ description: 'Valor pago (se diferente do valor da parcela)' })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;
}

export class RenegotiatePaymentPlanDto {
  @ApiProperty({ description: 'ID do plano de pagamento' })
  @IsUUID()
  paymentPlanId: string;

  @ApiProperty({ description: 'Novo número de parcelas' })
  @IsNumber()
  @Min(1)
  @Max(48)
  newInstallments: number;

  @ApiPropertyOptional({ description: 'Nova taxa de juros mensal' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  newInterestRate?: number;

  @ApiPropertyOptional({ description: 'Desconto para renegociação' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiProperty({ description: 'Motivo da renegociação' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

// ==================== Price Table DTOs ====================

export class PriceTableItemDto {
  @ApiProperty({ description: 'Código do item' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Descrição' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Preço' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: 'Código TUSS' })
  @IsOptional()
  @IsString()
  tussCode?: string;

  @ApiPropertyOptional({ description: 'Código CBHPM' })
  @IsOptional()
  @IsString()
  cbhpmCode?: string;

  @ApiPropertyOptional({ description: 'Categoria' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Se é ativo' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreatePriceTableDto {
  @ApiProperty({ description: 'Nome da tabela' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: PriceTableType, description: 'Tipo de tabela' })
  @IsEnum(PriceTableType)
  type: PriceTableType;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Data de vigência início' })
  @IsDateString()
  validFrom: string;

  @ApiPropertyOptional({ description: 'Data de vigência fim' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional({ description: 'ID do convênio (se específica)' })
  @IsOptional()
  @IsUUID()
  insuranceId?: string;

  @ApiPropertyOptional({ type: [PriceTableItemDto], description: 'Itens da tabela' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceTableItemDto)
  items?: PriceTableItemDto[];

  @ApiPropertyOptional({ description: 'Multiplicador sobre tabela base' })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(10)
  multiplier?: number;

  @ApiPropertyOptional({ description: 'Se é a tabela padrão' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdatePriceTableDto {
  @ApiPropertyOptional({ description: 'Nome da tabela' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Data de vigência fim' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional({ description: 'Multiplicador sobre tabela base' })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(10)
  multiplier?: number;

  @ApiPropertyOptional({ description: 'Se é a tabela padrão' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Se está ativa' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ==================== Financial Report DTOs ====================

export class GenerateFinancialReportDto {
  @ApiProperty({ description: 'Data de início' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Data de fim' })
  @IsDateString()
  endDate: string;

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

  @ApiPropertyOptional({ description: 'Formato de exportação' })
  @IsOptional()
  @IsString()
  exportFormat?: string;

  @ApiPropertyOptional({ description: 'Agrupar por' })
  @IsOptional()
  @IsString()
  groupBy?: string;

  @ApiPropertyOptional({ description: 'Incluir detalhes' })
  @IsOptional()
  @IsBoolean()
  includeDetails?: boolean;
}

// ==================== Receivables DTOs ====================

export class AgeReceivablesDto {
  @ApiPropertyOptional({ description: 'ID da clínica' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'Data de referência' })
  @IsOptional()
  @IsDateString()
  referenceDate?: string;

  @ApiPropertyOptional({ description: 'Faixas de vencimento em dias' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  agingBuckets?: number[];
}

export class WriteOffReceivableDto {
  @ApiProperty({ description: 'ID da fatura' })
  @IsUUID()
  invoiceId: string;

  @ApiProperty({ description: 'Motivo da baixa' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  reason: string;

  @ApiPropertyOptional({ description: 'Valor a baixar (se parcial)' })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional({ description: 'Autorizado por' })
  @IsOptional()
  @IsString()
  authorizedBy?: string;
}

// ==================== Commission DTOs ====================

export class CreateCommissionRuleDto {
  @ApiProperty({ description: 'Nome da regra' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'ID do médico' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiPropertyOptional({ description: 'ID da clínica' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'Tipo de serviço' })
  @IsOptional()
  @IsEnum(InvoiceType)
  serviceType?: InvoiceType;

  @ApiProperty({ description: 'Percentual de comissão' })
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;

  @ApiPropertyOptional({ description: 'Valor fixo por serviço' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedAmount?: number;

  @ApiPropertyOptional({ description: 'Data de vigência início' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ description: 'Data de vigência fim' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional({ description: 'Se é ativo' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CalculateCommissionDto {
  @ApiPropertyOptional({ description: 'ID do médico' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiProperty({ description: 'Data de início' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Data de fim' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Considerar apenas pagos' })
  @IsOptional()
  @IsBoolean()
  paidOnly?: boolean;
}

// ==================== Export DTOs ====================

export class ExportBillingDataDto {
  @ApiProperty({ description: 'Data de início' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Data de fim' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Formato (csv, xlsx, pdf)' })
  @IsOptional()
  @IsString()
  format?: string;

  @ApiPropertyOptional({ description: 'Tipo de dados' })
  @IsOptional()
  @IsString()
  dataType?: string;

  @ApiPropertyOptional({ description: 'ID da clínica' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'Incluir detalhes de itens' })
  @IsOptional()
  @IsBoolean()
  includeItemDetails?: boolean;
}
