import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  InvoiceStatus,
  InvoiceType,
  PaymentMethod,
  PaymentStatus,
  InsuranceClaimStatus,
  InsuranceDenialReason,
  PaymentPlanStatus,
  DiscountType,
  TaxType,
  PriceTableType,
  RefundReason,
} from './create-billing.dto';

// ==================== Invoice Response DTOs ====================

export class InvoiceItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitPrice: number;

  @ApiPropertyOptional()
  discount?: number;

  @ApiPropertyOptional({ enum: DiscountType })
  discountType?: DiscountType;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  total: number;

  @ApiPropertyOptional()
  serviceId?: string;

  @ApiPropertyOptional()
  serviceType?: string;

  @ApiPropertyOptional()
  consultationId?: string;

  @ApiPropertyOptional()
  labOrderId?: string;

  @ApiPropertyOptional()
  doctorId?: string;

  @ApiPropertyOptional()
  doctorName?: string;

  @ApiPropertyOptional()
  serviceDate?: Date;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  coveredByInsurance?: boolean;

  @ApiPropertyOptional()
  insuranceCoverage?: number;

  @ApiPropertyOptional()
  priceTableCode?: string;
}

export class InvoiceTaxResponseDto {
  @ApiProperty({ enum: TaxType })
  type: TaxType;

  @ApiProperty()
  percentage: number;

  @ApiProperty()
  value: number;

  @ApiPropertyOptional()
  withheld?: boolean;
}

export class InvoicePaymentSummaryDto {
  @ApiProperty()
  totalPaid: number;

  @ApiProperty()
  totalPending: number;

  @ApiProperty()
  totalRefunded: number;

  @ApiProperty()
  paymentsCount: number;

  @ApiPropertyOptional()
  lastPaymentDate?: Date;

  @ApiPropertyOptional()
  lastPaymentMethod?: PaymentMethod;
}

export class InvoiceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  invoiceNumber: string;

  @ApiProperty()
  patientId: string;

  @ApiPropertyOptional()
  patientName?: string;

  @ApiPropertyOptional()
  patientCpf?: string;

  @ApiProperty()
  clinicId: string;

  @ApiPropertyOptional()
  clinicName?: string;

  @ApiProperty({ enum: InvoiceType })
  type: InvoiceType;

  @ApiProperty({ enum: InvoiceStatus })
  status: InvoiceStatus;

  @ApiProperty({ type: [InvoiceItemResponseDto] })
  items: InvoiceItemResponseDto[];

  @ApiProperty()
  subtotal: number;

  @ApiPropertyOptional()
  globalDiscount?: number;

  @ApiPropertyOptional({ enum: DiscountType })
  globalDiscountType?: DiscountType;

  @ApiPropertyOptional()
  discountReason?: string;

  @ApiProperty()
  discountTotal: number;

  @ApiPropertyOptional({ type: [InvoiceTaxResponseDto] })
  taxes?: InvoiceTaxResponseDto[];

  @ApiProperty()
  taxTotal: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  amountPaid: number;

  @ApiProperty()
  amountDue: number;

  @ApiProperty()
  issueDate: Date;

  @ApiPropertyOptional()
  dueDate?: Date;

  @ApiPropertyOptional()
  paidDate?: Date;

  @ApiPropertyOptional()
  insuranceId?: string;

  @ApiPropertyOptional()
  insuranceName?: string;

  @ApiPropertyOptional()
  insuranceAuthorizationNumber?: string;

  @ApiPropertyOptional()
  insuranceCoverage?: number;

  @ApiPropertyOptional()
  patientResponsibility?: number;

  @ApiPropertyOptional()
  consultationId?: string;

  @ApiPropertyOptional()
  appointmentId?: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  internalNotes?: string;

  @ApiPropertyOptional()
  externalReference?: string;

  @ApiPropertyOptional()
  sentAt?: Date;

  @ApiPropertyOptional()
  daysOverdue?: number;

  @ApiPropertyOptional({ type: InvoicePaymentSummaryDto })
  paymentSummary?: InvoicePaymentSummaryDto;

  @ApiPropertyOptional()
  acceptedPaymentMethods?: PaymentMethod[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  createdBy?: string;
}

export class InvoiceListResponseDto {
  @ApiProperty({ type: [InvoiceResponseDto] })
  data: InvoiceResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiPropertyOptional()
  summary?: {
    totalAmount: number;
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
    overdueCount: number;
  };
}

export class InvoiceSummaryResponseDto {
  @ApiProperty()
  totalInvoices: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  paidAmount: number;

  @ApiProperty()
  pendingAmount: number;

  @ApiProperty()
  overdueAmount: number;

  @ApiPropertyOptional()
  byStatus?: Record<string, { count: number; amount: number }>;

  @ApiPropertyOptional()
  byType?: Record<string, { count: number; amount: number }>;
}

// ==================== Payment Response DTOs ====================

export class PaymentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  invoiceId: string;

  @ApiPropertyOptional()
  invoiceNumber?: string;

  @ApiPropertyOptional()
  patientId?: string;

  @ApiPropertyOptional()
  patientName?: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ enum: PaymentMethod })
  method: PaymentMethod;

  @ApiProperty({ enum: PaymentStatus })
  status: PaymentStatus;

  @ApiPropertyOptional()
  gatewayTransactionId?: string;

  @ApiPropertyOptional()
  gatewayResponse?: Record<string, any>;

  @ApiPropertyOptional()
  cardLastFour?: string;

  @ApiPropertyOptional()
  cardBrand?: string;

  @ApiPropertyOptional()
  installments?: number;

  @ApiPropertyOptional()
  pixCode?: string;

  @ApiPropertyOptional()
  pixQrCode?: string;

  @ApiPropertyOptional()
  pixExpiresAt?: Date;

  @ApiPropertyOptional()
  boletoUrl?: string;

  @ApiPropertyOptional()
  boletoBarcode?: string;

  @ApiPropertyOptional()
  boletoExpiresAt?: Date;

  @ApiPropertyOptional()
  referenceNumber?: string;

  @ApiPropertyOptional()
  bankName?: string;

  @ApiPropertyOptional()
  receiptUrl?: string;

  @ApiPropertyOptional()
  paidAt?: Date;

  @ApiPropertyOptional()
  refundedAt?: Date;

  @ApiPropertyOptional()
  refundedAmount?: number;

  @ApiPropertyOptional({ enum: RefundReason })
  refundReason?: RefundReason;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  processedBy?: string;
}

export class PaymentListResponseDto {
  @ApiProperty({ type: [PaymentResponseDto] })
  data: PaymentResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiPropertyOptional()
  summary?: {
    totalAmount: number;
    totalCompleted: number;
    totalPending: number;
    totalRefunded: number;
    byMethod: Record<string, { count: number; amount: number }>;
  };
}

export class PixPaymentResponseDto {
  @ApiProperty()
  paymentId: string;

  @ApiProperty()
  pixCode: string;

  @ApiProperty()
  pixQrCodeUrl: string;

  @ApiProperty()
  pixQrCodeBase64: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  expiresAt: Date;

  @ApiPropertyOptional()
  description?: string;
}

export class BoletoPaymentResponseDto {
  @ApiProperty()
  paymentId: string;

  @ApiProperty()
  boletoUrl: string;

  @ApiProperty()
  boletoBarcode: string;

  @ApiProperty()
  boletoPdfUrl: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  dueDate: Date;

  @ApiPropertyOptional()
  instructions?: string;
}

export class CardPaymentResponseDto {
  @ApiProperty()
  paymentId: string;

  @ApiProperty({ enum: PaymentStatus })
  status: PaymentStatus;

  @ApiPropertyOptional()
  authorizationCode?: string;

  @ApiPropertyOptional()
  transactionId?: string;

  @ApiProperty()
  amount: number;

  @ApiPropertyOptional()
  installments?: number;

  @ApiPropertyOptional()
  cardLastFour?: string;

  @ApiPropertyOptional()
  cardBrand?: string;
}

// ==================== Insurance Claim Response DTOs ====================

export class InsuranceClaimResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  claimNumber: string;

  @ApiProperty()
  invoiceId: string;

  @ApiPropertyOptional()
  invoiceNumber?: string;

  @ApiProperty()
  insuranceId: string;

  @ApiPropertyOptional()
  insuranceName?: string;

  @ApiProperty()
  patientId: string;

  @ApiPropertyOptional()
  patientName?: string;

  @ApiPropertyOptional()
  membershipNumber?: string;

  @ApiPropertyOptional()
  priorAuthorizationNumber?: string;

  @ApiPropertyOptional()
  guideNumber?: string;

  @ApiProperty()
  totalAmount: number;

  @ApiPropertyOptional()
  approvedAmount?: number;

  @ApiPropertyOptional()
  paidAmount?: number;

  @ApiPropertyOptional()
  deniedAmount?: number;

  @ApiProperty({ enum: InsuranceClaimStatus })
  status: InsuranceClaimStatus;

  @ApiPropertyOptional()
  procedures?: string[];

  @ApiPropertyOptional()
  diagnosisCodes?: string[];

  @ApiPropertyOptional()
  serviceDate?: Date;

  @ApiPropertyOptional()
  submittedAt?: Date;

  @ApiPropertyOptional()
  reviewedAt?: Date;

  @ApiPropertyOptional()
  paidAt?: Date;

  @ApiPropertyOptional({ enum: InsuranceDenialReason })
  denialReason?: InsuranceDenialReason;

  @ApiPropertyOptional()
  denialExplanation?: string;

  @ApiPropertyOptional()
  deniedItems?: string[];

  @ApiPropertyOptional()
  appealDeadline?: Date;

  @ApiPropertyOptional()
  responseProtocol?: string;

  @ApiPropertyOptional()
  attachments?: string[];

  @ApiPropertyOptional()
  clinicalNotes?: string;

  @ApiPropertyOptional()
  internalNotes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class InsuranceClaimListResponseDto {
  @ApiProperty({ type: [InsuranceClaimResponseDto] })
  data: InsuranceClaimResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiPropertyOptional()
  summary?: {
    totalClaims: number;
    totalAmount: number;
    approvedAmount: number;
    deniedAmount: number;
    pendingAmount: number;
    byStatus: Record<string, { count: number; amount: number }>;
  };
}

export class InsuranceBatchResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  batchNumber: string;

  @ApiProperty()
  insuranceId: string;

  @ApiPropertyOptional()
  insuranceName?: string;

  @ApiProperty()
  clinicId: string;

  @ApiProperty()
  competenceDate: Date;

  @ApiProperty()
  claimsCount: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  submittedAt?: Date;

  @ApiPropertyOptional()
  processedAt?: Date;

  @ApiPropertyOptional({ type: [InsuranceClaimResponseDto] })
  claims?: InsuranceClaimResponseDto[];

  @ApiProperty()
  createdAt: Date;
}

// ==================== Payment Plan Response DTOs ====================

export class InstallmentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  number: number;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  dueDate: Date;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  paidAt?: Date;

  @ApiPropertyOptional()
  paidAmount?: number;

  @ApiPropertyOptional()
  paymentId?: string;

  @ApiPropertyOptional()
  daysOverdue?: number;

  @ApiPropertyOptional()
  lateFee?: number;

  @ApiPropertyOptional()
  interest?: number;

  @ApiProperty()
  totalDue: number;
}

export class PaymentPlanResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  invoiceId: string;

  @ApiPropertyOptional()
  invoiceNumber?: string;

  @ApiProperty()
  patientId: string;

  @ApiPropertyOptional()
  patientName?: string;

  @ApiProperty()
  originalAmount: number;

  @ApiPropertyOptional()
  downPayment?: number;

  @ApiProperty()
  financedAmount: number;

  @ApiProperty()
  installmentsCount: number;

  @ApiProperty()
  installmentAmount: number;

  @ApiPropertyOptional()
  monthlyInterestRate?: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty({ enum: PaymentPlanStatus })
  status: PaymentPlanStatus;

  @ApiPropertyOptional({ enum: PaymentMethod })
  paymentMethod?: PaymentMethod;

  @ApiProperty()
  paidInstallments: number;

  @ApiProperty()
  pendingInstallments: number;

  @ApiProperty()
  overdueInstallments: number;

  @ApiProperty()
  totalPaid: number;

  @ApiProperty()
  totalPending: number;

  @ApiPropertyOptional({ type: [InstallmentResponseDto] })
  installments?: InstallmentResponseDto[];

  @ApiPropertyOptional()
  nextInstallment?: InstallmentResponseDto;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaymentPlanListResponseDto {
  @ApiProperty({ type: [PaymentPlanResponseDto] })
  data: PaymentPlanResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiPropertyOptional()
  summary?: {
    totalPlans: number;
    totalFinanced: number;
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
    overdueCount: number;
  };
}

// ==================== Price Table Response DTOs ====================

export class PriceTableItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  price: number;

  @ApiPropertyOptional()
  tussCode?: string;

  @ApiPropertyOptional()
  cbhpmCode?: string;

  @ApiPropertyOptional()
  category?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PriceTableResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: PriceTableType })
  type: PriceTableType;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  validFrom: Date;

  @ApiPropertyOptional()
  validUntil?: Date;

  @ApiPropertyOptional()
  insuranceId?: string;

  @ApiPropertyOptional()
  insuranceName?: string;

  @ApiPropertyOptional()
  multiplier?: number;

  @ApiProperty()
  isDefault: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  itemsCount: number;

  @ApiPropertyOptional({ type: [PriceTableItemResponseDto] })
  items?: PriceTableItemResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PriceTableListResponseDto {
  @ApiProperty({ type: [PriceTableResponseDto] })
  data: PriceTableResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

// ==================== Financial Report Response DTOs ====================

export class RevenueDataPointDto {
  @ApiProperty()
  date: string;

  @ApiProperty()
  gross: number;

  @ApiProperty()
  net: number;

  @ApiProperty()
  discounts: number;

  @ApiProperty()
  refunds: number;

  @ApiPropertyOptional()
  byType?: Record<string, number>;

  @ApiPropertyOptional()
  byInsurance?: Record<string, number>;

  @ApiPropertyOptional()
  byDoctor?: Record<string, number>;
}

export class RevenueResponseDto {
  @ApiProperty()
  period: {
    start: Date;
    end: Date;
    granularity: string;
  };

  @ApiProperty()
  totalGross: number;

  @ApiProperty()
  totalNet: number;

  @ApiProperty()
  totalDiscounts: number;

  @ApiProperty()
  totalRefunds: number;

  @ApiProperty({ type: [RevenueDataPointDto] })
  data: RevenueDataPointDto[];

  @ApiPropertyOptional()
  comparison?: {
    previousPeriod: {
      start: Date;
      end: Date;
    };
    grossChange: number;
    grossChangePercentage: number;
    netChange: number;
    netChangePercentage: number;
  };

  @ApiPropertyOptional()
  averages?: {
    dailyGross: number;
    dailyNet: number;
    perInvoice: number;
    perPatient: number;
  };
}

export class CashFlowDataPointDto {
  @ApiProperty()
  date: string;

  @ApiProperty()
  inflow: number;

  @ApiProperty()
  outflow: number;

  @ApiProperty()
  balance: number;

  @ApiProperty()
  cumulativeBalance: number;

  @ApiPropertyOptional()
  details?: {
    payments: number;
    refunds: number;
    insurance: number;
  };
}

export class CashFlowResponseDto {
  @ApiProperty()
  period: {
    start: Date;
    end: Date;
    granularity: string;
  };

  @ApiProperty()
  openingBalance: number;

  @ApiProperty()
  closingBalance: number;

  @ApiProperty()
  totalInflow: number;

  @ApiProperty()
  totalOutflow: number;

  @ApiProperty()
  netFlow: number;

  @ApiProperty({ type: [CashFlowDataPointDto] })
  data: CashFlowDataPointDto[];

  @ApiPropertyOptional()
  projections?: CashFlowDataPointDto[];
}

export class ReceivablesAgingDto {
  @ApiProperty()
  bucket: string;

  @ApiProperty()
  daysRange: string;

  @ApiProperty()
  count: number;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  percentage: number;
}

export class AgingReportResponseDto {
  @ApiProperty()
  referenceDate: Date;

  @ApiProperty()
  totalReceivables: number;

  @ApiProperty()
  totalOverdue: number;

  @ApiProperty()
  overduePercentage: number;

  @ApiProperty({ type: [ReceivablesAgingDto] })
  aging: ReceivablesAgingDto[];

  @ApiPropertyOptional()
  byPatient?: Array<{
    patientId: string;
    patientName: string;
    total: number;
    overdue: number;
    oldestDue: Date;
  }>;

  @ApiPropertyOptional()
  byInsurance?: Array<{
    insuranceId: string;
    insuranceName: string;
    total: number;
    overdue: number;
  }>;
}

export class FinancialReportResponseDto {
  @ApiProperty()
  period: {
    start: Date;
    end: Date;
  };

  @ApiProperty()
  summary: {
    totalRevenue: number;
    totalCollected: number;
    totalPending: number;
    totalOverdue: number;
    averageCollectionTime: number;
    collectionRate: number;
  };

  @ApiPropertyOptional()
  revenue?: RevenueResponseDto;

  @ApiPropertyOptional()
  cashFlow?: CashFlowResponseDto;

  @ApiPropertyOptional()
  aging?: AgingReportResponseDto;

  @ApiPropertyOptional()
  byType?: Array<{
    type: InvoiceType;
    invoicesCount: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
  }>;

  @ApiPropertyOptional()
  byInsurance?: Array<{
    insuranceId: string;
    insuranceName: string;
    claimsCount: number;
    totalAmount: number;
    approvedAmount: number;
    deniedAmount: number;
    pendingAmount: number;
    approvalRate: number;
  }>;

  @ApiPropertyOptional()
  byDoctor?: Array<{
    doctorId: string;
    doctorName: string;
    invoicesCount: number;
    totalAmount: number;
    commission: number;
  }>;

  @ApiPropertyOptional()
  comparison?: {
    previousPeriod: {
      start: Date;
      end: Date;
    };
    revenueChange: number;
    revenueChangePercentage: number;
    collectionRateChange: number;
  };
}

// ==================== Commission Response DTOs ====================

export class CommissionRuleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  doctorId?: string;

  @ApiPropertyOptional()
  doctorName?: string;

  @ApiPropertyOptional()
  clinicId?: string;

  @ApiPropertyOptional()
  clinicName?: string;

  @ApiPropertyOptional({ enum: InvoiceType })
  serviceType?: InvoiceType;

  @ApiProperty()
  percentage: number;

  @ApiPropertyOptional()
  fixedAmount?: number;

  @ApiPropertyOptional()
  validFrom?: Date;

  @ApiPropertyOptional()
  validUntil?: Date;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;
}

export class CommissionEntryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  invoiceId: string;

  @ApiPropertyOptional()
  invoiceNumber?: string;

  @ApiPropertyOptional()
  patientName?: string;

  @ApiProperty()
  serviceDate: Date;

  @ApiProperty()
  serviceType: InvoiceType;

  @ApiProperty()
  invoiceAmount: number;

  @ApiProperty()
  commissionPercentage: number;

  @ApiPropertyOptional()
  commissionFixed?: number;

  @ApiProperty()
  commissionAmount: number;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  paidAt?: Date;
}

export class CommissionReportResponseDto {
  @ApiProperty()
  doctorId: string;

  @ApiPropertyOptional()
  doctorName?: string;

  @ApiProperty()
  period: {
    start: Date;
    end: Date;
  };

  @ApiProperty()
  totalInvoices: number;

  @ApiProperty()
  totalInvoiceAmount: number;

  @ApiProperty()
  totalCommission: number;

  @ApiProperty()
  paidCommission: number;

  @ApiProperty()
  pendingCommission: number;

  @ApiProperty({ type: [CommissionEntryDto] })
  entries: CommissionEntryDto[];

  @ApiPropertyOptional()
  byServiceType?: Record<string, { count: number; amount: number; commission: number }>;
}

// ==================== Statistics Response DTOs ====================

export class BillingStatisticsResponseDto {
  @ApiProperty()
  period: {
    start: Date;
    end: Date;
  };

  @ApiProperty()
  invoices: {
    total: number;
    issued: number;
    paid: number;
    overdue: number;
    cancelled: number;
    averageValue: number;
    medianValue: number;
  };

  @ApiProperty()
  revenue: {
    gross: number;
    net: number;
    discounts: number;
    refunds: number;
    taxes: number;
  };

  @ApiProperty()
  payments: {
    total: number;
    completed: number;
    pending: number;
    failed: number;
    averageTime: number;
  };

  @ApiProperty()
  insurance: {
    claims: number;
    approved: number;
    denied: number;
    pending: number;
    approvalRate: number;
    averageProcessingTime: number;
  };

  @ApiPropertyOptional()
  byType?: Record<string, {
    count: number;
    amount: number;
    percentage: number;
  }>;

  @ApiPropertyOptional()
  byPaymentMethod?: Record<string, {
    count: number;
    amount: number;
    percentage: number;
  }>;

  @ApiPropertyOptional()
  byInsurance?: Record<string, {
    claims: number;
    amount: number;
    approvalRate: number;
  }>;

  @ApiPropertyOptional()
  trends?: Array<{
    date: string;
    invoices: number;
    revenue: number;
    payments: number;
  }>;

  @ApiPropertyOptional()
  comparison?: {
    previousPeriod: {
      start: Date;
      end: Date;
    };
    invoicesChange: number;
    revenueChange: number;
    paymentsChange: number;
  };
}

// ==================== Dashboard Response DTOs ====================

export class BillingDashboardResponseDto {
  @ApiProperty()
  period: string;

  @ApiProperty()
  summary: {
    totalRevenue: number;
    totalPending: number;
    totalOverdue: number;
    revenueChange: number;
  };

  @ApiProperty()
  todayStats: {
    invoicesIssued: number;
    paymentsReceived: number;
    paymentsAmount: number;
  };

  @ApiPropertyOptional({ type: [InvoiceResponseDto] })
  recentInvoices?: InvoiceResponseDto[];

  @ApiPropertyOptional({ type: [PaymentResponseDto] })
  recentPayments?: PaymentResponseDto[];

  @ApiPropertyOptional({ type: [InvoiceResponseDto] })
  overdueInvoices?: InvoiceResponseDto[];

  @ApiPropertyOptional({ type: [InsuranceClaimResponseDto] })
  pendingClaims?: InsuranceClaimResponseDto[];

  @ApiPropertyOptional()
  revenueChart?: Array<{
    date: string;
    revenue: number;
    payments: number;
  }>;

  @ApiPropertyOptional()
  paymentMethodsBreakdown?: Array<{
    method: PaymentMethod;
    count: number;
    amount: number;
    percentage: number;
  }>;

  @ApiPropertyOptional()
  alerts?: Array<{
    type: string;
    message: string;
    count: number;
    severity: string;
  }>;
}

// ==================== Notification Response DTOs ====================

export class PaymentReminderResponseDto {
  @ApiProperty()
  invoiceId: string;

  @ApiProperty()
  invoiceNumber: string;

  @ApiProperty()
  patientId: string;

  @ApiProperty()
  patientName: string;

  @ApiPropertyOptional()
  patientEmail?: string;

  @ApiPropertyOptional()
  patientPhone?: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  dueDate: Date;

  @ApiProperty()
  daysOverdue: number;

  @ApiPropertyOptional()
  lastReminderSent?: Date;

  @ApiProperty()
  reminderCount: number;
}

export class PaymentReminderListResponseDto {
  @ApiProperty({ type: [PaymentReminderResponseDto] })
  data: PaymentReminderResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  totalAmount: number;
}

// ==================== Export Response DTOs ====================

export class BillingExportResponseDto {
  @ApiProperty()
  exportId: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  format: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  downloadUrl: string;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  recordsCount: number;

  @ApiProperty()
  createdAt: Date;
}

// ==================== Reconciliation Response DTOs ====================

export class ReconciliationItemDto {
  @ApiProperty()
  paymentId: string;

  @ApiProperty()
  invoiceId: string;

  @ApiPropertyOptional()
  invoiceNumber?: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  method: PaymentMethod;

  @ApiProperty()
  gatewayTransactionId: string;

  @ApiProperty()
  paymentDate: Date;

  @ApiProperty()
  reconciled: boolean;

  @ApiPropertyOptional()
  reconciledAt?: Date;

  @ApiPropertyOptional()
  discrepancy?: number;

  @ApiPropertyOptional()
  discrepancyReason?: string;
}

export class ReconciliationReportResponseDto {
  @ApiProperty()
  period: {
    start: Date;
    end: Date;
  };

  @ApiProperty()
  summary: {
    totalPayments: number;
    totalAmount: number;
    reconciled: number;
    reconciledAmount: number;
    pending: number;
    pendingAmount: number;
    discrepancies: number;
    discrepancyAmount: number;
  };

  @ApiProperty({ type: [ReconciliationItemDto] })
  items: ReconciliationItemDto[];
}
