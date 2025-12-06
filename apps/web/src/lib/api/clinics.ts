// ============================================================
// CLINICS API
// API para gerenciamento de clínicas
// ============================================================

import api from '@/lib/api';
import type {
  Clinic,
  ClinicListResponse,
  ClinicQuery,
  CreateClinicData,
  UpdateClinicData,
  Room,
  CreateRoomData,
  Employee,
  CreateEmployeeData,
} from '@/types/clinic';

export const clinicsApi = {
  // Listar clínicas
  list: async (query?: ClinicQuery): Promise<ClinicListResponse> => {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get<ClinicListResponse>(`/clinics?${params.toString()}`);
    return response.data;
  },

  // Buscar clínica por ID
  getById: async (id: string): Promise<Clinic> => {
    const response = await api.get<Clinic>(`/clinics/${id}`);
    return response.data;
  },

  // Criar clínica
  create: async (data: CreateClinicData): Promise<Clinic> => {
    const response = await api.post<Clinic>('/clinics', data);
    return response.data;
  },

  // Atualizar clínica
  update: async (id: string, data: UpdateClinicData): Promise<Clinic> => {
    const response = await api.patch<Clinic>(`/clinics/${id}`, data);
    return response.data;
  },

  // Deletar clínica
  delete: async (id: string): Promise<void> => {
    await api.delete(`/clinics/${id}`);
  },

  // Estatísticas da clínica
  getStats: async (id: string): Promise<any> => {
    const response = await api.get(`/clinics/${id}/stats`);
    return response.data;
  },

  // ========== SALAS ==========

  // Listar salas
  listRooms: async (clinicId: string): Promise<Room[]> => {
    const response = await api.get<Room[]>(`/clinics/${clinicId}/rooms`);
    return response.data;
  },

  // Criar sala
  createRoom: async (clinicId: string, data: CreateRoomData): Promise<Room> => {
    const response = await api.post<Room>(`/clinics/${clinicId}/rooms`, data);
    return response.data;
  },

  // Atualizar sala
  updateRoom: async (clinicId: string, roomId: string, data: Partial<CreateRoomData>): Promise<Room> => {
    const response = await api.patch<Room>(`/clinics/${clinicId}/rooms/${roomId}`, data);
    return response.data;
  },

  // Deletar sala
  deleteRoom: async (clinicId: string, roomId: string): Promise<void> => {
    await api.delete(`/clinics/${clinicId}/rooms/${roomId}`);
  },

  // ========== FUNCIONÁRIOS ==========

  // Listar funcionários
  listEmployees: async (clinicId: string): Promise<Employee[]> => {
    const response = await api.get<Employee[]>(`/clinics/${clinicId}/employees`);
    return response.data;
  },

  // Adicionar funcionário
  addEmployee: async (clinicId: string, data: CreateEmployeeData): Promise<Employee> => {
    const response = await api.post<Employee>(`/clinics/${clinicId}/employees`, data);
    return response.data;
  },

  // Atualizar funcionário
  updateEmployee: async (clinicId: string, employeeId: string, data: Partial<CreateEmployeeData>): Promise<Employee> => {
    const response = await api.patch<Employee>(`/clinics/${clinicId}/employees/${employeeId}`, data);
    return response.data;
  },

  // Remover funcionário
  removeEmployee: async (clinicId: string, employeeId: string): Promise<void> => {
    await api.delete(`/clinics/${clinicId}/employees/${employeeId}`);
  },

  // ========== MÉDICOS ==========

  // Listar médicos da clínica
  listDoctors: async (clinicId: string): Promise<any[]> => {
    const response = await api.get(`/clinics/${clinicId}/doctors`);
    return response.data;
  },

  // Vincular médico
  addDoctor: async (clinicId: string, doctorId: string): Promise<void> => {
    await api.post(`/clinics/${clinicId}/doctors/${doctorId}`);
  },

  // Desvincular médico
  removeDoctor: async (clinicId: string, doctorId: string): Promise<void> => {
    await api.delete(`/clinics/${clinicId}/doctors/${doctorId}`);
  },

  // ========== CONFIGURAÇÕES ==========

  // Buscar configurações
  getSettings: async (clinicId: string): Promise<any> => {
    const response = await api.get(`/clinics/${clinicId}/settings`);
    return response.data;
  },

  // Atualizar configurações
  updateSettings: async (clinicId: string, data: any): Promise<any> => {
    const response = await api.patch(`/clinics/${clinicId}/settings`, data);
    return response.data;
  },

  // ========== HORÁRIOS ==========

  // Buscar horários de funcionamento
  getOperatingHours: async (clinicId: string): Promise<any> => {
    const response = await api.get(`/clinics/${clinicId}/operating-hours`);
    return response.data;
  },

  // Atualizar horários de funcionamento
  updateOperatingHours: async (clinicId: string, data: any): Promise<any> => {
    const response = await api.patch(`/clinics/${clinicId}/operating-hours`, data);
    return response.data;
  },

  // ========== ESPECIALIDADES ==========

  // Listar especialidades
  listSpecialties: async (clinicId: string): Promise<string[]> => {
    const response = await api.get<string[]>(`/clinics/${clinicId}/specialties`);
    return response.data;
  },

  // Adicionar especialidade
  addSpecialty: async (clinicId: string, specialty: string): Promise<void> => {
    await api.post(`/clinics/${clinicId}/specialties`, { specialty });
  },

  // Remover especialidade
  removeSpecialty: async (clinicId: string, specialty: string): Promise<void> => {
    await api.delete(`/clinics/${clinicId}/specialties/${encodeURIComponent(specialty)}`);
  },
};

export default clinicsApi;
