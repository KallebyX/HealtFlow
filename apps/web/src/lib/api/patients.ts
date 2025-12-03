// ============================================================
// PATIENTS API
// API para gerenciamento de pacientes
// ============================================================

import api from '@/lib/api';
import type {
  Patient,
  PatientListResponse,
  PatientQuery,
  CreatePatientData,
  UpdatePatientData,
} from '@/types/patient';

export const patientsApi = {
  // Listar pacientes
  list: async (query?: PatientQuery): Promise<PatientListResponse> => {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get<PatientListResponse>(`/patients?${params.toString()}`);
    return response.data;
  },

  // Buscar paciente por ID
  getById: async (id: string): Promise<Patient> => {
    const response = await api.get<Patient>(`/patients/${id}`);
    return response.data;
  },

  // Criar paciente
  create: async (data: CreatePatientData): Promise<Patient> => {
    const response = await api.post<Patient>('/patients', data);
    return response.data;
  },

  // Atualizar paciente
  update: async (id: string, data: UpdatePatientData): Promise<Patient> => {
    const response = await api.patch<Patient>(`/patients/${id}`, data);
    return response.data;
  },

  // Deletar paciente (soft delete)
  delete: async (id: string): Promise<void> => {
    await api.delete(`/patients/${id}`);
  },

  // Restaurar paciente
  restore: async (id: string): Promise<Patient> => {
    const response = await api.post<Patient>(`/patients/${id}/restore`);
    return response.data;
  },

  // Buscar historico medico
  getMedicalHistory: async (id: string): Promise<any> => {
    const response = await api.get(`/patients/${id}/medical-history`);
    return response.data;
  },

  // Buscar documentos
  getDocuments: async (id: string): Promise<any[]> => {
    const response = await api.get(`/patients/${id}/documents`);
    return response.data;
  },

  // Upload de documento
  uploadDocument: async (id: string, file: File, metadata: any): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(metadata).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, String(value));
      }
    });
    const response = await api.post(`/patients/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Buscar sinais vitais
  getVitalSigns: async (id: string): Promise<any[]> => {
    const response = await api.get(`/patients/${id}/vital-signs`);
    return response.data;
  },

  // Adicionar sinal vital
  addVitalSign: async (id: string, data: any): Promise<any> => {
    const response = await api.post(`/patients/${id}/vital-signs`, data);
    return response.data;
  },

  // Buscar consultas do paciente
  getAppointments: async (id: string): Promise<any[]> => {
    const response = await api.get(`/patients/${id}/appointments`);
    return response.data;
  },

  // Buscar prescricoes do paciente
  getPrescriptions: async (id: string): Promise<any[]> => {
    const response = await api.get(`/patients/${id}/prescriptions`);
    return response.data;
  },

  // Buscar exames do paciente
  getLabResults: async (id: string): Promise<any[]> => {
    const response = await api.get(`/patients/${id}/lab-results`);
    return response.data;
  },

  // Estatisticas de pacientes
  getStats: async (query?: any): Promise<any> => {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/patients/stats?${params.toString()}`);
    return response.data;
  },
};

export default patientsApi;
