// ============================================================
// APPOINTMENTS API
// API para gerenciamento de agendamentos
// ============================================================

import api from '@/lib/api';
import type {
  Appointment,
  AppointmentListResponse,
  AppointmentQuery,
  CreateAppointmentData,
  UpdateAppointmentData,
  RescheduleAppointmentData,
  CancelAppointmentData,
  DoctorSchedule,
} from '@/types/appointment';

export const appointmentsApi = {
  // Listar agendamentos
  list: async (query?: AppointmentQuery): Promise<AppointmentListResponse> => {
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
    const response = await api.get<AppointmentListResponse>(
      `/appointments?${params.toString()}`
    );
    return response.data;
  },

  // Buscar agendamento por ID
  getById: async (id: string): Promise<Appointment> => {
    const response = await api.get<Appointment>(`/appointments/${id}`);
    return response.data;
  },

  // Criar agendamento
  create: async (data: CreateAppointmentData): Promise<Appointment> => {
    const response = await api.post<Appointment>('/appointments', data);
    return response.data;
  },

  // Atualizar agendamento
  update: async (id: string, data: UpdateAppointmentData): Promise<Appointment> => {
    const response = await api.patch<Appointment>(`/appointments/${id}`, data);
    return response.data;
  },

  // Deletar agendamento
  delete: async (id: string): Promise<void> => {
    await api.delete(`/appointments/${id}`);
  },

  // Confirmar agendamento
  confirm: async (id: string): Promise<Appointment> => {
    const response = await api.post<Appointment>(`/appointments/${id}/confirm`);
    return response.data;
  },

  // Check-in do paciente
  checkIn: async (id: string): Promise<Appointment> => {
    const response = await api.post<Appointment>(`/appointments/${id}/check-in`);
    return response.data;
  },

  // Iniciar atendimento
  start: async (id: string): Promise<Appointment> => {
    const response = await api.post<Appointment>(`/appointments/${id}/start`);
    return response.data;
  },

  // Finalizar atendimento
  complete: async (id: string, notes?: string): Promise<Appointment> => {
    const response = await api.post<Appointment>(`/appointments/${id}/complete`, {
      notes,
    });
    return response.data;
  },

  // Cancelar agendamento
  cancel: async (id: string, data: CancelAppointmentData): Promise<Appointment> => {
    const response = await api.post<Appointment>(`/appointments/${id}/cancel`, data);
    return response.data;
  },

  // Reagendar
  reschedule: async (
    id: string,
    data: RescheduleAppointmentData
  ): Promise<Appointment> => {
    const response = await api.post<Appointment>(`/appointments/${id}/reschedule`, data);
    return response.data;
  },

  // Marcar como no-show
  noShow: async (id: string): Promise<Appointment> => {
    const response = await api.post<Appointment>(`/appointments/${id}/no-show`);
    return response.data;
  },

  // Buscar agenda do dia
  getDaySchedule: async (
    date: string,
    doctorId?: string,
    clinicId?: string
  ): Promise<DoctorSchedule[]> => {
    const params = new URLSearchParams({ date });
    if (doctorId) params.append('doctorId', doctorId);
    if (clinicId) params.append('clinicId', clinicId);
    const response = await api.get<DoctorSchedule[]>(
      `/appointments/schedule/day?${params.toString()}`
    );
    return response.data;
  },

  // Buscar agenda da semana
  getWeekSchedule: async (
    startDate: string,
    endDate: string,
    doctorId?: string,
    clinicId?: string
  ): Promise<DoctorSchedule[]> => {
    const params = new URLSearchParams({ startDate, endDate });
    if (doctorId) params.append('doctorId', doctorId);
    if (clinicId) params.append('clinicId', clinicId);
    const response = await api.get<DoctorSchedule[]>(
      `/appointments/schedule/week?${params.toString()}`
    );
    return response.data;
  },

  // Buscar proximos agendamentos do paciente
  getPatientUpcoming: async (
    patientId: string,
    limit?: number
  ): Promise<Appointment[]> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', String(limit));
    const response = await api.get<Appointment[]>(
      `/appointments/patient/${patientId}/upcoming?${params.toString()}`
    );
    return response.data;
  },

  // Buscar historico de agendamentos do paciente
  getPatientHistory: async (
    patientId: string,
    page?: number,
    limit?: number
  ): Promise<AppointmentListResponse> => {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    if (limit) params.append('limit', String(limit));
    const response = await api.get<AppointmentListResponse>(
      `/appointments/patient/${patientId}/history?${params.toString()}`
    );
    return response.data;
  },

  // Buscar agenda do medico
  getDoctorSchedule: async (
    doctorId: string,
    startDate: string,
    endDate: string
  ): Promise<Appointment[]> => {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await api.get<Appointment[]>(
      `/appointments/doctor/${doctorId}/schedule?${params.toString()}`
    );
    return response.data;
  },

  // Enviar lembrete
  sendReminder: async (id: string): Promise<void> => {
    await api.post(`/appointments/${id}/send-reminder`);
  },

  // Gerar link de telemedicina
  generateTelemedicineLink: async (id: string): Promise<{ link: string }> => {
    const response = await api.post<{ link: string }>(
      `/appointments/${id}/telemedicine-link`
    );
    return response.data;
  },

  // Buscar estatisticas
  getStats: async (
    startDate: string,
    endDate: string,
    doctorId?: string,
    clinicId?: string
  ): Promise<{
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
    telemedicine: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    averageDuration: number;
  }> => {
    const params = new URLSearchParams({ startDate, endDate });
    if (doctorId) params.append('doctorId', doctorId);
    if (clinicId) params.append('clinicId', clinicId);
    const response = await api.get(`/appointments/stats?${params.toString()}`);
    return response.data;
  },
};

export default appointmentsApi;
