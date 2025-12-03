// ============================================================
// CONSULTATIONS API
// API para gerenciamento de consultas/prontuario
// ============================================================

import api from '@/lib/api';
import type {
  Consultation,
  ConsultationListResponse,
  ConsultationQuery,
  CreateConsultationData,
  UpdateConsultationData,
} from '@/types/consultation';

export const consultationsApi = {
  // Listar consultas
  list: async (query?: ConsultationQuery): Promise<ConsultationListResponse> => {
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
    const response = await api.get<ConsultationListResponse>(
      `/consultations?${params.toString()}`
    );
    return response.data;
  },

  // Buscar consulta por ID
  getById: async (id: string): Promise<Consultation> => {
    const response = await api.get<Consultation>(`/consultations/${id}`);
    return response.data;
  },

  // Iniciar nova consulta
  create: async (data: CreateConsultationData): Promise<Consultation> => {
    const response = await api.post<Consultation>('/consultations', data);
    return response.data;
  },

  // Atualizar consulta
  update: async (id: string, data: UpdateConsultationData): Promise<Consultation> => {
    const response = await api.patch<Consultation>(`/consultations/${id}`, data);
    return response.data;
  },

  // Finalizar consulta
  complete: async (id: string): Promise<Consultation> => {
    const response = await api.post<Consultation>(`/consultations/${id}/complete`);
    return response.data;
  },

  // Cancelar consulta
  cancel: async (id: string, reason?: string): Promise<Consultation> => {
    const response = await api.post<Consultation>(`/consultations/${id}/cancel`, {
      reason,
    });
    return response.data;
  },

  // Assinar prontuario
  sign: async (id: string, password?: string): Promise<Consultation> => {
    const response = await api.post<Consultation>(`/consultations/${id}/sign`, {
      password,
    });
    return response.data;
  },

  // Upload de anexo
  uploadAttachment: async (id: string, file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ url: string }>(
      `/consultations/${id}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Remover anexo
  removeAttachment: async (id: string, attachmentId: string): Promise<void> => {
    await api.delete(`/consultations/${id}/attachments/${attachmentId}`);
  },

  // Gerar PDF do prontuario
  generatePdf: async (id: string): Promise<Blob> => {
    const response = await api.get(`/consultations/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Buscar historico de consultas do paciente
  getPatientHistory: async (
    patientId: string,
    query?: ConsultationQuery
  ): Promise<ConsultationListResponse> => {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get<ConsultationListResponse>(
      `/consultations/patient/${patientId}/history?${params.toString()}`
    );
    return response.data;
  },

  // Buscar templates de anamnese
  getTemplates: async (specialty?: string): Promise<any[]> => {
    const response = await api.get<any[]>('/consultations/templates', {
      params: { specialty },
    });
    return response.data;
  },

  // Buscar codigos CID-10
  searchICD: async (query: string): Promise<{ code: string; description: string }[]> => {
    const response = await api.get<{ code: string; description: string }[]>(
      '/consultations/icd/search',
      { params: { q: query } }
    );
    return response.data;
  },
};

export default consultationsApi;
