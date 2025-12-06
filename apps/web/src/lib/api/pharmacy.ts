// ============================================================
// PHARMACY API
// API para módulo de farmácia
// ============================================================

import api from '@/lib/api';
import type {
  Pharmacy,
  Dispensation,
  DispensationListResponse,
  DispensationQuery,
  CreateDispensationData,
  PrescriptionValidation,
  ControlledMedicationInventory,
  InventoryMovement,
  SngpcReport,
} from '@/types/pharmacy';

export const pharmacyApi = {
  // ========== FARMÁCIAS ==========

  // Listar farmácias
  listPharmacies: async (): Promise<Pharmacy[]> => {
    const response = await api.get<Pharmacy[]>('/pharmacies');
    return response.data;
  },

  // Buscar farmácia por ID
  getPharmacy: async (id: string): Promise<Pharmacy> => {
    const response = await api.get<Pharmacy>(`/pharmacies/${id}`);
    return response.data;
  },

  // ========== VALIDAÇÃO DE RECEITAS ==========

  // Validar receita por QR Code
  validateByQrCode: async (qrCode: string): Promise<PrescriptionValidation> => {
    const response = await api.post<PrescriptionValidation>('/pharmacy/validate/qrcode', { qrCode });
    return response.data;
  },

  // Validar receita por código
  validateByCode: async (prescriptionCode: string): Promise<PrescriptionValidation> => {
    const response = await api.post<PrescriptionValidation>('/pharmacy/validate/code', { prescriptionCode });
    return response.data;
  },

  // Validar receita por ID
  validateById: async (prescriptionId: string): Promise<PrescriptionValidation> => {
    const response = await api.get<PrescriptionValidation>(`/pharmacy/validate/${prescriptionId}`);
    return response.data;
  },

  // ========== DISPENSAÇÃO ==========

  // Listar dispensações
  listDispensations: async (query?: DispensationQuery): Promise<DispensationListResponse> => {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get<DispensationListResponse>(`/pharmacy/dispensations?${params.toString()}`);
    return response.data;
  },

  // Buscar dispensação por ID
  getDispensation: async (id: string): Promise<Dispensation> => {
    const response = await api.get<Dispensation>(`/pharmacy/dispensations/${id}`);
    return response.data;
  },

  // Criar dispensação
  createDispensation: async (data: CreateDispensationData): Promise<Dispensation> => {
    const response = await api.post<Dispensation>('/pharmacy/dispensations', data);
    return response.data;
  },

  // Cancelar dispensação
  cancelDispensation: async (id: string, reason: string): Promise<Dispensation> => {
    const response = await api.post<Dispensation>(`/pharmacy/dispensations/${id}/cancel`, { reason });
    return response.data;
  },

  // ========== ESTOQUE DE CONTROLADOS ==========

  // Listar inventário de controlados
  listControlledInventory: async (pharmacyId: string): Promise<ControlledMedicationInventory[]> => {
    const response = await api.get<ControlledMedicationInventory[]>(`/pharmacy/${pharmacyId}/inventory/controlled`);
    return response.data;
  },

  // Buscar item do inventário
  getInventoryItem: async (pharmacyId: string, itemId: string): Promise<ControlledMedicationInventory> => {
    const response = await api.get<ControlledMedicationInventory>(`/pharmacy/${pharmacyId}/inventory/${itemId}`);
    return response.data;
  },

  // Registrar entrada de estoque
  registerEntry: async (
    pharmacyId: string,
    data: {
      medicationName: string;
      concentration: string;
      form: string;
      list: string;
      quantity: number;
      batchNumber: string;
      expirationDate: string;
      manufacturer?: string;
      invoiceNumber?: string;
      notes?: string;
    }
  ): Promise<InventoryMovement> => {
    const response = await api.post<InventoryMovement>(`/pharmacy/${pharmacyId}/inventory/entry`, data);
    return response.data;
  },

  // Registrar ajuste de estoque
  registerAdjustment: async (
    pharmacyId: string,
    itemId: string,
    data: { quantity: number; type: 'ADJUSTMENT' | 'LOSS'; notes: string }
  ): Promise<InventoryMovement> => {
    const response = await api.post<InventoryMovement>(`/pharmacy/${pharmacyId}/inventory/${itemId}/adjustment`, data);
    return response.data;
  },

  // Buscar movimentações
  getMovements: async (pharmacyId: string, itemId: string, limit?: number): Promise<InventoryMovement[]> => {
    const params = limit ? `?limit=${limit}` : '';
    const response = await api.get<InventoryMovement[]>(`/pharmacy/${pharmacyId}/inventory/${itemId}/movements${params}`);
    return response.data;
  },

  // ========== SNGPC ==========

  // Listar relatórios SNGPC
  listSngpcReports: async (pharmacyId: string): Promise<SngpcReport[]> => {
    const response = await api.get<SngpcReport[]>(`/pharmacy/${pharmacyId}/sngpc/reports`);
    return response.data;
  },

  // Gerar relatório SNGPC
  generateSngpcReport: async (pharmacyId: string, period: string): Promise<SngpcReport> => {
    const response = await api.post<SngpcReport>(`/pharmacy/${pharmacyId}/sngpc/generate`, { period });
    return response.data;
  },

  // Enviar relatório SNGPC
  submitSngpcReport: async (pharmacyId: string, reportId: string): Promise<SngpcReport> => {
    const response = await api.post<SngpcReport>(`/pharmacy/${pharmacyId}/sngpc/reports/${reportId}/submit`);
    return response.data;
  },

  // Buscar inventário para SNGPC
  getSngpcInventory: async (pharmacyId: string, period: string): Promise<any> => {
    const response = await api.get(`/pharmacy/${pharmacyId}/sngpc/inventory?period=${period}`);
    return response.data;
  },

  // ========== ESTATÍSTICAS ==========

  // Estatísticas da farmácia
  getStats: async (pharmacyId: string, dateFrom?: string, dateTo?: string): Promise<any> => {
    const params = new URLSearchParams();
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    const response = await api.get(`/pharmacy/${pharmacyId}/stats?${params.toString()}`);
    return response.data;
  },

  // Relatório de dispensações
  getDispensationReport: async (pharmacyId: string, dateFrom: string, dateTo: string): Promise<any> => {
    const response = await api.get(`/pharmacy/${pharmacyId}/reports/dispensations?dateFrom=${dateFrom}&dateTo=${dateTo}`);
    return response.data;
  },
};

export default pharmacyApi;
