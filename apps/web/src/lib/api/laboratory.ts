// ============================================================
// LABORATORY API
// API para módulo de laboratório
// ============================================================

import api from '@/lib/api';
import type {
  Laboratory,
  LabOrder,
  LabOrderListResponse,
  LabOrderQuery,
  CreateLabOrderData,
  LabResult,
  CreateLabResultData,
  LabExamCatalog,
  LabSample,
} from '@/types/laboratory';

export const laboratoryApi = {
  // ========== LABORATÓRIOS ==========

  // Listar laboratórios
  listLaboratories: async (): Promise<Laboratory[]> => {
    const response = await api.get<Laboratory[]>('/laboratories');
    return response.data;
  },

  // Buscar laboratório por ID
  getLaboratory: async (id: string): Promise<Laboratory> => {
    const response = await api.get<Laboratory>(`/laboratories/${id}`);
    return response.data;
  },

  // ========== PEDIDOS ==========

  // Listar pedidos
  listOrders: async (query?: LabOrderQuery): Promise<LabOrderListResponse> => {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get<LabOrderListResponse>(`/laboratory/orders?${params.toString()}`);
    return response.data;
  },

  // Buscar pedido por ID
  getOrder: async (id: string): Promise<LabOrder> => {
    const response = await api.get<LabOrder>(`/laboratory/orders/${id}`);
    return response.data;
  },

  // Criar pedido
  createOrder: async (data: CreateLabOrderData): Promise<LabOrder> => {
    const response = await api.post<LabOrder>('/laboratory/orders', data);
    return response.data;
  },

  // Atualizar status do pedido
  updateOrderStatus: async (id: string, status: string, notes?: string): Promise<LabOrder> => {
    const response = await api.patch<LabOrder>(`/laboratory/orders/${id}/status`, { status, notes });
    return response.data;
  },

  // Cancelar pedido
  cancelOrder: async (id: string, reason: string): Promise<LabOrder> => {
    const response = await api.post<LabOrder>(`/laboratory/orders/${id}/cancel`, { reason });
    return response.data;
  },

  // ========== COLETA ==========

  // Registrar coleta
  registerCollection: async (orderId: string, data: { collectedBy: string; notes?: string }): Promise<LabOrder> => {
    const response = await api.post<LabOrder>(`/laboratory/orders/${orderId}/collect`, data);
    return response.data;
  },

  // Gerar etiquetas
  generateLabels: async (orderId: string): Promise<{ labels: { barcode: string; examName: string; material: string }[] }> => {
    const response = await api.get(`/laboratory/orders/${orderId}/labels`);
    return response.data;
  },

  // Registrar amostra
  registerSample: async (orderItemId: string, data: Partial<LabSample>): Promise<LabSample> => {
    const response = await api.post<LabSample>(`/laboratory/items/${orderItemId}/sample`, data);
    return response.data;
  },

  // Rejeitar amostra
  rejectSample: async (sampleId: string, reason: string): Promise<LabSample> => {
    const response = await api.post<LabSample>(`/laboratory/samples/${sampleId}/reject`, { reason });
    return response.data;
  },

  // ========== RESULTADOS ==========

  // Lançar resultado
  createResult: async (data: CreateLabResultData): Promise<LabResult> => {
    const response = await api.post<LabResult>('/laboratory/results', data);
    return response.data;
  },

  // Atualizar resultado
  updateResult: async (id: string, data: Partial<CreateLabResultData>): Promise<LabResult> => {
    const response = await api.patch<LabResult>(`/laboratory/results/${id}`, data);
    return response.data;
  },

  // Validar resultado
  validateResult: async (id: string, reviewer: string): Promise<LabResult> => {
    const response = await api.post<LabResult>(`/laboratory/results/${id}/validate`, { reviewer });
    return response.data;
  },

  // Liberar resultado
  releaseResult: async (id: string, signedBy: string): Promise<LabResult> => {
    const response = await api.post<LabResult>(`/laboratory/results/${id}/release`, { signedBy });
    return response.data;
  },

  // Gerar PDF do laudo
  generatePdf: async (orderId: string): Promise<{ url: string }> => {
    const response = await api.get(`/laboratory/orders/${orderId}/pdf`);
    return response.data;
  },

  // ========== CATÁLOGO DE EXAMES ==========

  // Listar exames do catálogo
  listExamCatalog: async (search?: string): Promise<LabExamCatalog[]> => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await api.get<LabExamCatalog[]>(`/laboratory/catalog${params}`);
    return response.data;
  },

  // Buscar exame do catálogo
  getExamFromCatalog: async (code: string): Promise<LabExamCatalog> => {
    const response = await api.get<LabExamCatalog>(`/laboratory/catalog/${code}`);
    return response.data;
  },

  // ========== RELATÓRIOS ==========

  // Estatísticas do laboratório
  getStats: async (dateFrom?: string, dateTo?: string): Promise<any> => {
    const params = new URLSearchParams();
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    const response = await api.get(`/laboratory/stats?${params.toString()}`);
    return response.data;
  },

  // Relatório de produção
  getProductionReport: async (dateFrom: string, dateTo: string): Promise<any> => {
    const response = await api.get(`/laboratory/reports/production?dateFrom=${dateFrom}&dateTo=${dateTo}`);
    return response.data;
  },

  // Relatório de TAT (Turnaround Time)
  getTatReport: async (dateFrom: string, dateTo: string): Promise<any> => {
    const response = await api.get(`/laboratory/reports/tat?dateFrom=${dateFrom}&dateTo=${dateTo}`);
    return response.data;
  },

  // Valores críticos
  getCriticalValues: async (): Promise<any[]> => {
    const response = await api.get('/laboratory/critical-values');
    return response.data;
  },

  // Confirmar notificação de valor crítico
  acknowledgeCriticalValue: async (resultId: string, notifiedTo: string): Promise<void> => {
    await api.post(`/laboratory/results/${resultId}/acknowledge-critical`, { notifiedTo });
  },
};

export default laboratoryApi;
