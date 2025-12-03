// ============================================================
// PRESCRIPTIONS API
// API para gerenciamento de prescricoes
// ============================================================

import api from '@/lib/api';
import type {
  Prescription,
  PrescriptionListResponse,
  PrescriptionQuery,
  CreatePrescriptionData,
  UpdatePrescriptionData,
} from '@/types/prescription';

export const prescriptionsApi = {
  // Listar prescricoes
  list: async (query?: PrescriptionQuery): Promise<PrescriptionListResponse> => {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach((v) => params.append(key, String(v)));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }
    const response = await api.get<PrescriptionListResponse>(
      `/prescriptions?${params.toString()}`
    );
    return response.data;
  },

  // Buscar prescricao por ID
  getById: async (id: string): Promise<Prescription> => {
    const response = await api.get<Prescription>(`/prescriptions/${id}`);
    return response.data;
  },

  // Criar prescricao
  create: async (data: CreatePrescriptionData): Promise<Prescription> => {
    const response = await api.post<Prescription>('/prescriptions', data);
    return response.data;
  },

  // Atualizar prescricao
  update: async (id: string, data: UpdatePrescriptionData): Promise<Prescription> => {
    const response = await api.patch<Prescription>(`/prescriptions/${id}`, data);
    return response.data;
  },

  // Deletar prescricao (rascunho apenas)
  delete: async (id: string): Promise<void> => {
    await api.delete(`/prescriptions/${id}`);
  },

  // Assinar prescricao digitalmente
  sign: async (id: string, password?: string): Promise<Prescription> => {
    const response = await api.post<Prescription>(`/prescriptions/${id}/sign`, {
      password,
    });
    return response.data;
  },

  // Verificar assinatura
  verifySignature: async (id: string): Promise<{ valid: boolean; details: any }> => {
    const response = await api.get<{ valid: boolean; details: any }>(
      `/prescriptions/${id}/verify`
    );
    return response.data;
  },

  // Cancelar prescricao
  cancel: async (id: string, reason: string): Promise<Prescription> => {
    const response = await api.post<Prescription>(`/prescriptions/${id}/cancel`, {
      reason,
    });
    return response.data;
  },

  // Marcar como dispensada
  markDispensed: async (id: string, dispensedItems?: string[]): Promise<Prescription> => {
    const response = await api.post<Prescription>(`/prescriptions/${id}/dispense`, {
      dispensedItems,
    });
    return response.data;
  },

  // Duplicar prescricao
  duplicate: async (id: string): Promise<Prescription> => {
    const response = await api.post<Prescription>(`/prescriptions/${id}/duplicate`);
    return response.data;
  },

  // Buscar por codigo de validacao
  getByValidationCode: async (code: string): Promise<Prescription> => {
    const response = await api.get<Prescription>(`/prescriptions/validate/${code}`);
    return response.data;
  },

  // Gerar PDF
  generatePdf: async (id: string): Promise<Blob> => {
    const response = await api.get(`/prescriptions/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Imprimir (registrar impressao)
  print: async (id: string): Promise<{ printCount: number }> => {
    const response = await api.post<{ printCount: number }>(
      `/prescriptions/${id}/print`
    );
    return response.data;
  },

  // Enviar para paciente (email/whatsapp)
  send: async (
    id: string,
    channel: 'email' | 'whatsapp' | 'sms',
    recipient?: string
  ): Promise<void> => {
    await api.post(`/prescriptions/${id}/send`, { channel, recipient });
  },

  // Buscar prescricoes do paciente
  getByPatient: async (
    patientId: string,
    query?: PrescriptionQuery
  ): Promise<PrescriptionListResponse> => {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get<PrescriptionListResponse>(
      `/prescriptions/patient/${patientId}?${params.toString()}`
    );
    return response.data;
  },

  // Buscar medicamentos sugeridos
  searchMedications: async (query: string): Promise<any[]> => {
    const response = await api.get<any[]>(`/prescriptions/medications/search`, {
      params: { q: query },
    });
    return response.data;
  },

  // Verificar interacoes medicamentosas
  checkInteractions: async (medications: string[]): Promise<any[]> => {
    const response = await api.post<any[]>(`/prescriptions/medications/interactions`, {
      medications,
    });
    return response.data;
  },

  // Buscar templates de prescricao
  getTemplates: async (specialty?: string): Promise<any[]> => {
    const response = await api.get<any[]>(`/prescriptions/templates`, {
      params: { specialty },
    });
    return response.data;
  },

  // Salvar como template
  saveAsTemplate: async (
    id: string,
    name: string,
    description?: string
  ): Promise<void> => {
    await api.post(`/prescriptions/${id}/save-template`, { name, description });
  },
};

export default prescriptionsApi;
