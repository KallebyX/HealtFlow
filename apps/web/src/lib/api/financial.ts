import { apiClient } from './client';
import type {
  Payment,
  PaymentQuery,
  Invoice,
  InvoiceQuery,
  Plan,
  Subscription,
  Transaction,
  TransactionQuery,
  FinancialSummary,
  RevenueByPeriod,
  RevenueByService,
  PaymentsByMethod,
  ListResponse,
  InvoiceItem,
} from '@/types/financial';

// ============================================================
// PAYMENTS API
// ============================================================

export const paymentsApi = {
  async list(query?: PaymentQuery): Promise<ListResponse<Payment>> {
    const params = new URLSearchParams();

    if (query?.page) params.set('page', query.page.toString());
    if (query?.limit) params.set('limit', query.limit.toString());
    if (query?.patientId) params.set('patientId', query.patientId);
    if (query?.dateFrom) params.set('dateFrom', query.dateFrom);
    if (query?.dateTo) params.set('dateTo', query.dateTo);
    if (query?.minAmount) params.set('minAmount', query.minAmount.toString());
    if (query?.maxAmount) params.set('maxAmount', query.maxAmount.toString());

    if (query?.status) {
      const statuses = Array.isArray(query.status) ? query.status : [query.status];
      statuses.forEach((s) => params.append('status', s));
    }

    if (query?.method) {
      const methods = Array.isArray(query.method) ? query.method : [query.method];
      methods.forEach((m) => params.append('method', m));
    }

    const url = `/payments${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.get<ListResponse<Payment>>(url);
  },

  async getById(id: string): Promise<Payment> {
    return apiClient.get<Payment>(`/payments/${id}`);
  },

  async create(data: Partial<Payment>): Promise<Payment> {
    return apiClient.post<Payment>('/payments', data);
  },

  async processRefund(id: string, amount?: number): Promise<Payment> {
    return apiClient.post<Payment>(`/payments/${id}/refund`, { amount });
  },

  async cancel(id: string): Promise<Payment> {
    return apiClient.post<Payment>(`/payments/${id}/cancel`, {});
  },

  async getRecent(limit = 10): Promise<Payment[]> {
    const response = await this.list({ limit });
    return response.data;
  },
};

// ============================================================
// INVOICES API
// ============================================================

export const invoicesApi = {
  async list(query?: InvoiceQuery): Promise<ListResponse<Invoice>> {
    const params = new URLSearchParams();

    if (query?.page) params.set('page', query.page.toString());
    if (query?.limit) params.set('limit', query.limit.toString());
    if (query?.patientId) params.set('patientId', query.patientId);
    if (query?.dateFrom) params.set('dateFrom', query.dateFrom);
    if (query?.dateTo) params.set('dateTo', query.dateTo);
    if (query?.overdue !== undefined) params.set('overdue', query.overdue.toString());

    if (query?.status) {
      const statuses = Array.isArray(query.status) ? query.status : [query.status];
      statuses.forEach((s) => params.append('status', s));
    }

    const url = `/invoices${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.get<ListResponse<Invoice>>(url);
  },

  async getById(id: string): Promise<Invoice> {
    return apiClient.get<Invoice>(`/invoices/${id}`);
  },

  async create(data: {
    patientId: string;
    items: Omit<InvoiceItem, 'id' | 'invoiceId'>[];
    dueDate: string;
    notes?: string;
    terms?: string;
  }): Promise<Invoice> {
    return apiClient.post<Invoice>('/invoices', data);
  },

  async update(id: string, data: Partial<Invoice>): Promise<Invoice> {
    return apiClient.patch<Invoice>(`/invoices/${id}`, data);
  },

  async send(id: string): Promise<Invoice> {
    return apiClient.post<Invoice>(`/invoices/${id}/send`, {});
  },

  async markAsPaid(id: string, paymentMethod: string): Promise<Invoice> {
    return apiClient.post<Invoice>(`/invoices/${id}/pay`, { paymentMethod });
  },

  async cancel(id: string): Promise<Invoice> {
    return apiClient.post<Invoice>(`/invoices/${id}/cancel`, {});
  },

  async downloadPdf(id: string): Promise<Blob> {
    return apiClient.get<Blob>(`/invoices/${id}/pdf`, {
      responseType: 'blob',
    } as never);
  },

  async getOverdue(): Promise<Invoice[]> {
    const response = await this.list({ overdue: true });
    return response.data;
  },
};

// ============================================================
// PLANS API
// ============================================================

export const plansApi = {
  async list(): Promise<Plan[]> {
    return apiClient.get<Plan[]>('/plans');
  },

  async getById(id: string): Promise<Plan> {
    return apiClient.get<Plan>(`/plans/${id}`);
  },

  async getActive(): Promise<Plan[]> {
    const plans = await this.list();
    return plans.filter((p) => p.isActive);
  },
};

// ============================================================
// SUBSCRIPTIONS API
// ============================================================

export const subscriptionsApi = {
  async getCurrent(): Promise<Subscription> {
    return apiClient.get<Subscription>('/subscriptions/current');
  },

  async getById(id: string): Promise<Subscription> {
    return apiClient.get<Subscription>(`/subscriptions/${id}`);
  },

  async subscribe(planId: string, billingCycle: string): Promise<Subscription> {
    return apiClient.post<Subscription>('/subscriptions', { planId, billingCycle });
  },

  async changePlan(planId: string): Promise<Subscription> {
    return apiClient.post<Subscription>('/subscriptions/change-plan', { planId });
  },

  async cancel(reason?: string): Promise<Subscription> {
    return apiClient.post<Subscription>('/subscriptions/cancel', { reason });
  },

  async reactivate(): Promise<Subscription> {
    return apiClient.post<Subscription>('/subscriptions/reactivate', {});
  },

  async toggleAutoRenew(autoRenew: boolean): Promise<Subscription> {
    return apiClient.patch<Subscription>('/subscriptions/auto-renew', { autoRenew });
  },
};

// ============================================================
// TRANSACTIONS API
// ============================================================

export const transactionsApi = {
  async list(query?: TransactionQuery): Promise<ListResponse<Transaction>> {
    const params = new URLSearchParams();

    if (query?.page) params.set('page', query.page.toString());
    if (query?.limit) params.set('limit', query.limit.toString());
    if (query?.dateFrom) params.set('dateFrom', query.dateFrom);
    if (query?.dateTo) params.set('dateTo', query.dateTo);

    if (query?.type) {
      const types = Array.isArray(query.type) ? query.type : [query.type];
      types.forEach((t) => params.append('type', t));
    }

    if (query?.category) {
      const categories = Array.isArray(query.category) ? query.category : [query.category];
      categories.forEach((c) => params.append('category', c));
    }

    const url = `/transactions${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.get<ListResponse<Transaction>>(url);
  },

  async create(data: Partial<Transaction>): Promise<Transaction> {
    return apiClient.post<Transaction>('/transactions', data);
  },
};

// ============================================================
// ANALYTICS API
// ============================================================

export const financialAnalyticsApi = {
  async getSummary(period?: { start: string; end: string }): Promise<FinancialSummary> {
    const params = new URLSearchParams();
    if (period?.start) params.set('start', period.start);
    if (period?.end) params.set('end', period.end);

    const url = `/financial/summary${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.get<FinancialSummary>(url);
  },

  async getRevenueByPeriod(
    groupBy: 'day' | 'week' | 'month' | 'year',
    period?: { start: string; end: string }
  ): Promise<RevenueByPeriod[]> {
    const params = new URLSearchParams();
    params.set('groupBy', groupBy);
    if (period?.start) params.set('start', period.start);
    if (period?.end) params.set('end', period.end);

    return apiClient.get<RevenueByPeriod[]>(`/financial/revenue-by-period?${params.toString()}`);
  },

  async getRevenueByService(period?: { start: string; end: string }): Promise<RevenueByService[]> {
    const params = new URLSearchParams();
    if (period?.start) params.set('start', period.start);
    if (period?.end) params.set('end', period.end);

    const url = `/financial/revenue-by-service${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.get<RevenueByService[]>(url);
  },

  async getPaymentsByMethod(period?: { start: string; end: string }): Promise<PaymentsByMethod[]> {
    const params = new URLSearchParams();
    if (period?.start) params.set('start', period.start);
    if (period?.end) params.set('end', period.end);

    const url = `/financial/payments-by-method${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.get<PaymentsByMethod[]>(url);
  },

  async getCashFlow(
    period?: { start: string; end: string }
  ): Promise<{ date: string; inflow: number; outflow: number; balance: number }[]> {
    const params = new URLSearchParams();
    if (period?.start) params.set('start', period.start);
    if (period?.end) params.set('end', period.end);

    const url = `/financial/cash-flow${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.get(url);
  },

  async getAccountsReceivable(): Promise<{
    total: number;
    current: number;
    overdue30: number;
    overdue60: number;
    overdue90: number;
  }> {
    return apiClient.get('/financial/accounts-receivable');
  },
};
