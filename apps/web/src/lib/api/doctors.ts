// ============================================================
// DOCTORS API
// API para gerenciamento de médicos
// ============================================================

import api from '@/lib/api';
import type {
  Doctor,
  DoctorListResponse,
  DoctorQuery,
  CreateDoctorData,
  UpdateDoctorData,
  AvailableSlotsResponse,
  DoctorStats,
} from '@/types/doctor';

export const doctorsApi = {
  // Listar médicos
  list: async (query?: DoctorQuery): Promise<DoctorListResponse> => {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get<DoctorListResponse>(`/doctors?${params.toString()}`);
    return response.data;
  },

  // Buscar médico por ID
  getById: async (id: string): Promise<Doctor> => {
    const response = await api.get<Doctor>(`/doctors/${id}`);
    return response.data;
  },

  // Criar médico
  create: async (data: CreateDoctorData): Promise<Doctor> => {
    const response = await api.post<Doctor>('/doctors', data);
    return response.data;
  },

  // Atualizar médico
  update: async (id: string, data: UpdateDoctorData): Promise<Doctor> => {
    const response = await api.patch<Doctor>(`/doctors/${id}`, data);
    return response.data;
  },

  // Deletar médico (soft delete)
  delete: async (id: string): Promise<void> => {
    await api.delete(`/doctors/${id}`);
  },

  // Buscar horários disponíveis
  getAvailableSlots: async (
    id: string,
    startDate: string,
    endDate: string,
    clinicId?: string
  ): Promise<AvailableSlotsResponse> => {
    const params = new URLSearchParams({
      startDate,
      endDate,
    });
    if (clinicId) {
      params.append('clinicId', clinicId);
    }
    const response = await api.get<AvailableSlotsResponse>(
      `/doctors/${id}/available-slots?${params.toString()}`
    );
    return response.data;
  },

  // Buscar estatísticas do médico
  getStats: async (id: string, startDate?: string, endDate?: string): Promise<DoctorStats> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await api.get<DoctorStats>(`/doctors/${id}/stats?${params.toString()}`);
    return response.data;
  },

  // Atualizar horários de trabalho
  updateWorkingHours: async (id: string, workingHours: any[]): Promise<Doctor> => {
    const response = await api.patch<Doctor>(`/doctors/${id}/working-hours`, { workingHours });
    return response.data;
  },

  // Upload de foto de perfil
  uploadProfilePhoto: async (id: string, file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ url: string }>(`/doctors/${id}/profile-photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Upload de assinatura
  uploadSignature: async (id: string, file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ url: string }>(`/doctors/${id}/signature`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Validar CRM
  validateCRM: async (crm: string, crmState: string): Promise<any> => {
    const response = await api.get(`/doctors/validate-crm?crm=${crm}&crmState=${crmState}`);
    return response.data;
  },

  // Buscar especialidades disponíveis
  getSpecialties: async (): Promise<string[]> => {
    const response = await api.get<string[]>('/doctors/specialties');
    return response.data;
  },
};

export default doctorsApi;
