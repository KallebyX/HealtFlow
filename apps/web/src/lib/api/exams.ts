// ============================================================
// EXAMS API
// API para gerenciamento de exames laboratoriais
// ============================================================

import api from '@/lib/api';
import type {
  ExamRequest,
  ExamListResponse,
  ExamQuery,
  CreateExamRequestData,
  UpdateExamRequestData,
  CreateExamResultData,
} from '@/types/exam';

export const examsApi = {
  // Listar exames
  list: async (query?: ExamQuery): Promise<ExamListResponse> => {
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
    const response = await api.get<ExamListResponse>(
      `/exams?${params.toString()}`
    );
    return response.data;
  },

  // Buscar exame por ID
  getById: async (id: string): Promise<ExamRequest> => {
    const response = await api.get<ExamRequest>(`/exams/${id}`);
    return response.data;
  },

  // Criar solicitacao de exame
  create: async (data: CreateExamRequestData): Promise<ExamRequest> => {
    const response = await api.post<ExamRequest>('/exams', data);
    return response.data;
  },

  // Atualizar exame
  update: async (id: string, data: UpdateExamRequestData): Promise<ExamRequest> => {
    const response = await api.patch<ExamRequest>(`/exams/${id}`, data);
    return response.data;
  },

  // Deletar exame
  delete: async (id: string): Promise<void> => {
    await api.delete(`/exams/${id}`);
  },

  // Agendar coleta
  schedule: async (
    id: string,
    scheduledDate: string,
    scheduledTime: string,
    labId?: string
  ): Promise<ExamRequest> => {
    const response = await api.post<ExamRequest>(`/exams/${id}/schedule`, {
      scheduledDate,
      scheduledTime,
      labId,
    });
    return response.data;
  },

  // Registrar coleta
  collect: async (id: string): Promise<ExamRequest> => {
    const response = await api.post<ExamRequest>(`/exams/${id}/collect`);
    return response.data;
  },

  // Iniciar analise
  startAnalysis: async (id: string): Promise<ExamRequest> => {
    const response = await api.post<ExamRequest>(`/exams/${id}/start-analysis`);
    return response.data;
  },

  // Adicionar resultados
  addResults: async (
    id: string,
    results: CreateExamResultData[]
  ): Promise<ExamRequest> => {
    const response = await api.post<ExamRequest>(`/exams/${id}/results`, {
      results,
    });
    return response.data;
  },

  // Finalizar e validar resultados
  complete: async (
    id: string,
    interpretation?: string,
    validatedBy?: string
  ): Promise<ExamRequest> => {
    const response = await api.post<ExamRequest>(`/exams/${id}/complete`, {
      interpretation,
      validatedBy,
    });
    return response.data;
  },

  // Cancelar exame
  cancel: async (id: string, reason: string): Promise<ExamRequest> => {
    const response = await api.post<ExamRequest>(`/exams/${id}/cancel`, {
      reason,
    });
    return response.data;
  },

  // Upload de resultado (arquivo)
  uploadResult: async (id: string, file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ url: string }>(
      `/exams/${id}/upload-result`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Gerar PDF do resultado
  generatePdf: async (id: string): Promise<Blob> => {
    const response = await api.get(`/exams/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Buscar exames do paciente
  getByPatient: async (
    patientId: string,
    query?: ExamQuery
  ): Promise<ExamListResponse> => {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get<ExamListResponse>(
      `/exams/patient/${patientId}?${params.toString()}`
    );
    return response.data;
  },

  // Buscar exames com valores criticos
  getCriticalValues: async (): Promise<ExamRequest[]> => {
    const response = await api.get<ExamRequest[]>('/exams/critical-values');
    return response.data;
  },

  // Notificar valor critico
  notifyCriticalValue: async (id: string): Promise<void> => {
    await api.post(`/exams/${id}/notify-critical`);
  },

  // Buscar catalogo de exames
  getCatalog: async (category?: string): Promise<any[]> => {
    const response = await api.get<any[]>('/exams/catalog', {
      params: { category },
    });
    return response.data;
  },

  // Buscar laboratorios
  getLabs: async (): Promise<any[]> => {
    const response = await api.get<any[]>('/exams/labs');
    return response.data;
  },
};

export default examsApi;
