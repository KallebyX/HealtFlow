// ============================================================
// FINANCIAL TYPES
// Tipos para modulo financeiro
// ============================================================

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PIX = 'PIX',
  BOLETO = 'BOLETO',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH = 'CASH',
  INSURANCE = 'INSURANCE',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  CANCELLED = 'CANCELLED',
  SUSPENDED = 'SUSPENDED',
  TRIAL = 'TRIAL',
  PAST_DUE = 'PAST_DUE',
}

export enum PlanType {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
  CUSTOM = 'CUSTOM',
}

export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMIANNUAL = 'SEMIANNUAL',
  ANNUAL = 'ANNUAL',
}

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  REFUND = 'REFUND',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum ExpenseCategory {
  SALARY = 'SALARY',
  RENT = 'RENT',
  UTILITIES = 'UTILITIES',
  SUPPLIES = 'SUPPLIES',
  EQUIPMENT = 'EQUIPMENT',
  MARKETING = 'MARKETING',
  SOFTWARE = 'SOFTWARE',
  TAXES = 'TAXES',
  INSURANCE = 'INSURANCE',
  OTHER = 'OTHER',
}

// ============================================================
// INTERFACES
// ============================================================

export interface Payment {
  id: string;
  invoiceId?: string;
  patientId?: string;
  clinicId: string;

  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;

  description?: string;
  reference?: string;

  // Card info (masked)
  cardLast4?: string;
  cardBrand?: string;

  // PIX info
  pixKey?: string;
  pixQrCode?: string;

  // Boleto info
  boletoUrl?: string;
  boletoBarcode?: string;
  boletoDueDate?: string;

  // Gateway info
  gatewayId?: string;
  gatewayResponse?: Record<string, unknown>;

  // Timestamps
  paidAt?: string;
  failedAt?: string;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  patient?: {
    id: string;
    fullName: string;
  };
  invoice?: Invoice;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  serviceCode?: string;
  serviceDate?: string;
}

export interface Invoice {
  id: string;
  number: string;
  patientId: string;
  clinicId: string;

  status: InvoiceStatus;

  // Amounts
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  amountDue: number;

  currency: string;

  // Dates
  issueDate: string;
  dueDate: string;
  paidAt?: string;

  // Items
  items: InvoiceItem[];

  // Notes
  notes?: string;
  terms?: string;

  // PDF
  pdfUrl?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Relations
  patient?: {
    id: string;
    fullName: string;
    email?: string;
  };
  payments?: Payment[];
}

export interface PlanFeature {
  id: string;
  name: string;
  description?: string;
  included: boolean;
  limit?: number;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  type: PlanType;

  // Pricing
  price: number;
  currency: string;
  billingCycle: BillingCycle;

  // Trial
  trialDays: number;

  // Features
  features: PlanFeature[];

  // Limits
  maxUsers: number;
  maxPatients: number;
  maxAppointments: number;
  maxStorage: number; // in GB

  // Flags
  isActive: boolean;
  isPopular: boolean;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  clinicId: string;
  planId: string;

  status: SubscriptionStatus;

  // Dates
  startDate: string;
  endDate?: string;
  trialEndDate?: string;
  cancelledAt?: string;

  // Billing
  billingCycle: BillingCycle;
  nextBillingDate: string;
  lastBillingDate?: string;

  // Amounts
  currentPrice: number;
  discount: number;

  // Auto-renewal
  autoRenew: boolean;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Relations
  plan?: Plan;
  clinic?: {
    id: string;
    name: string;
  };
}

export interface Transaction {
  id: string;
  clinicId: string;

  type: TransactionType;
  category?: ExpenseCategory;

  amount: number;
  currency: string;

  description: string;
  reference?: string;

  // Related entities
  paymentId?: string;
  invoiceId?: string;

  // Date
  transactionDate: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface FinancialSummary {
  period: {
    start: string;
    end: string;
  };

  revenue: {
    total: number;
    consultations: number;
    procedures: number;
    subscriptions: number;
    other: number;
  };

  expenses: {
    total: number;
    byCategory: Record<ExpenseCategory, number>;
  };

  profit: {
    gross: number;
    net: number;
    margin: number;
  };

  invoices: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
  };

  payments: {
    total: number;
    completed: number;
    pending: number;
    failed: number;
  };

  comparison: {
    revenueChange: number;
    expenseChange: number;
    profitChange: number;
  };
}

export interface RevenueByPeriod {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface RevenueByService {
  service: string;
  revenue: number;
  percentage: number;
  count: number;
}

export interface PaymentsByMethod {
  method: PaymentMethod;
  amount: number;
  count: number;
  percentage: number;
}

// ============================================================
// QUERY TYPES
// ============================================================

export interface PaymentQuery {
  page?: number;
  limit?: number;
  status?: PaymentStatus | PaymentStatus[];
  method?: PaymentMethod | PaymentMethod[];
  patientId?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface InvoiceQuery {
  page?: number;
  limit?: number;
  status?: InvoiceStatus | InvoiceStatus[];
  patientId?: string;
  dateFrom?: string;
  dateTo?: string;
  overdue?: boolean;
}

export interface TransactionQuery {
  page?: number;
  limit?: number;
  type?: TransactionType | TransactionType[];
  category?: ExpenseCategory | ExpenseCategory[];
  dateFrom?: string;
  dateTo?: string;
}

export interface ListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export function getPaymentStatusLabel(status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    [PaymentStatus.PENDING]: 'Pendente',
    [PaymentStatus.PROCESSING]: 'Processando',
    [PaymentStatus.COMPLETED]: 'Concluido',
    [PaymentStatus.FAILED]: 'Falhou',
    [PaymentStatus.REFUNDED]: 'Reembolsado',
    [PaymentStatus.CANCELLED]: 'Cancelado',
    [PaymentStatus.PARTIALLY_REFUNDED]: 'Parcialmente Reembolsado',
  };
  return labels[status];
}

export function getPaymentStatusColor(status: PaymentStatus): string {
  const colors: Record<PaymentStatus, string> = {
    [PaymentStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [PaymentStatus.PROCESSING]: 'bg-blue-100 text-blue-800',
    [PaymentStatus.COMPLETED]: 'bg-green-100 text-green-800',
    [PaymentStatus.FAILED]: 'bg-red-100 text-red-800',
    [PaymentStatus.REFUNDED]: 'bg-purple-100 text-purple-800',
    [PaymentStatus.CANCELLED]: 'bg-gray-100 text-gray-800',
    [PaymentStatus.PARTIALLY_REFUNDED]: 'bg-orange-100 text-orange-800',
  };
  return colors[status];
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  const labels: Record<PaymentMethod, string> = {
    [PaymentMethod.CREDIT_CARD]: 'Cartao de Credito',
    [PaymentMethod.DEBIT_CARD]: 'Cartao de Debito',
    [PaymentMethod.PIX]: 'PIX',
    [PaymentMethod.BOLETO]: 'Boleto',
    [PaymentMethod.BANK_TRANSFER]: 'Transferencia',
    [PaymentMethod.CASH]: 'Dinheiro',
    [PaymentMethod.INSURANCE]: 'Convenio',
  };
  return labels[method];
}

export function getInvoiceStatusLabel(status: InvoiceStatus): string {
  const labels: Record<InvoiceStatus, string> = {
    [InvoiceStatus.DRAFT]: 'Rascunho',
    [InvoiceStatus.PENDING]: 'Pendente',
    [InvoiceStatus.SENT]: 'Enviada',
    [InvoiceStatus.PAID]: 'Paga',
    [InvoiceStatus.OVERDUE]: 'Vencida',
    [InvoiceStatus.CANCELLED]: 'Cancelada',
    [InvoiceStatus.PARTIALLY_PAID]: 'Parcialmente Paga',
  };
  return labels[status];
}

export function getInvoiceStatusColor(status: InvoiceStatus): string {
  const colors: Record<InvoiceStatus, string> = {
    [InvoiceStatus.DRAFT]: 'bg-gray-100 text-gray-800',
    [InvoiceStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [InvoiceStatus.SENT]: 'bg-blue-100 text-blue-800',
    [InvoiceStatus.PAID]: 'bg-green-100 text-green-800',
    [InvoiceStatus.OVERDUE]: 'bg-red-100 text-red-800',
    [InvoiceStatus.CANCELLED]: 'bg-gray-100 text-gray-800',
    [InvoiceStatus.PARTIALLY_PAID]: 'bg-orange-100 text-orange-800',
  };
  return colors[status];
}

export function getSubscriptionStatusLabel(status: SubscriptionStatus): string {
  const labels: Record<SubscriptionStatus, string> = {
    [SubscriptionStatus.ACTIVE]: 'Ativa',
    [SubscriptionStatus.INACTIVE]: 'Inativa',
    [SubscriptionStatus.CANCELLED]: 'Cancelada',
    [SubscriptionStatus.SUSPENDED]: 'Suspensa',
    [SubscriptionStatus.TRIAL]: 'Periodo de Teste',
    [SubscriptionStatus.PAST_DUE]: 'Pagamento Atrasado',
  };
  return labels[status];
}

export function getSubscriptionStatusColor(status: SubscriptionStatus): string {
  const colors: Record<SubscriptionStatus, string> = {
    [SubscriptionStatus.ACTIVE]: 'bg-green-100 text-green-800',
    [SubscriptionStatus.INACTIVE]: 'bg-gray-100 text-gray-800',
    [SubscriptionStatus.CANCELLED]: 'bg-red-100 text-red-800',
    [SubscriptionStatus.SUSPENDED]: 'bg-orange-100 text-orange-800',
    [SubscriptionStatus.TRIAL]: 'bg-blue-100 text-blue-800',
    [SubscriptionStatus.PAST_DUE]: 'bg-red-100 text-red-800',
  };
  return colors[status];
}

export function getPlanTypeLabel(type: PlanType): string {
  const labels: Record<PlanType, string> = {
    [PlanType.FREE]: 'Gratuito',
    [PlanType.BASIC]: 'Basico',
    [PlanType.PROFESSIONAL]: 'Profissional',
    [PlanType.ENTERPRISE]: 'Empresarial',
    [PlanType.CUSTOM]: 'Personalizado',
  };
  return labels[type];
}

export function getBillingCycleLabel(cycle: BillingCycle): string {
  const labels: Record<BillingCycle, string> = {
    [BillingCycle.MONTHLY]: 'Mensal',
    [BillingCycle.QUARTERLY]: 'Trimestral',
    [BillingCycle.SEMIANNUAL]: 'Semestral',
    [BillingCycle.ANNUAL]: 'Anual',
  };
  return labels[cycle];
}

export function getExpenseCategoryLabel(category: ExpenseCategory): string {
  const labels: Record<ExpenseCategory, string> = {
    [ExpenseCategory.SALARY]: 'Salarios',
    [ExpenseCategory.RENT]: 'Aluguel',
    [ExpenseCategory.UTILITIES]: 'Utilidades',
    [ExpenseCategory.SUPPLIES]: 'Suprimentos',
    [ExpenseCategory.EQUIPMENT]: 'Equipamentos',
    [ExpenseCategory.MARKETING]: 'Marketing',
    [ExpenseCategory.SOFTWARE]: 'Software',
    [ExpenseCategory.TAXES]: 'Impostos',
    [ExpenseCategory.INSURANCE]: 'Seguros',
    [ExpenseCategory.OTHER]: 'Outros',
  };
  return labels[category];
}

export function formatCurrency(amount: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}
