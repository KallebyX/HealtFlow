// ============================================================
// DOCTOR TYPES
// Tipos para médicos sincronizados com o backend
// ============================================================

import { Gender, UserStatus } from './auth';

export interface WorkingHours {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  active: boolean;
}

export interface DigitalCertificate {
  id: string;
  type: string;
  issuer: string;
  validFrom: string;
  validUntil: string;
  active: boolean;
}

export interface DoctorCounts {
  appointments: number;
  consultations: number;
  prescriptions: number;
  labOrders: number;
  telemedicineSessions: number;
}

export interface Doctor {
  id: string;
  userId: string;

  // Personal Info
  fullName: string;
  socialName?: string;
  cpf: string;
  birthDate: string;
  gender: Gender;
  phone: string;

  // Professional Info
  crm: string;
  crmState: string;
  crmStatus: string;
  specialties: string[];
  subspecialties?: string[];
  rqe?: string[];
  cns?: string;

  // Profile
  bio?: string;
  profilePhotoUrl?: string;
  signatureUrl?: string;

  // Working Hours
  workingHours?: WorkingHours[];
  appointmentDuration: number;
  telemedicineEnabled: boolean;

  // Digital Certificate
  digitalCertificate?: DigitalCertificate;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;

  // Relations
  user?: {
    id: string;
    email: string;
    status: UserStatus;
    lastLoginAt?: string;
    emailVerified: boolean;
    twoFactorEnabled: boolean;
  };
  clinics?: Array<{
    id: string;
    tradeName: string;
    logoUrl?: string;
  }>;
  _count?: DoctorCounts;
}

export interface DoctorListResponse {
  data: Doctor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DoctorQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: UserStatus;
  specialty?: string;
  crmState?: string;
  clinicId?: string;
  telemedicineEnabled?: boolean;
  sortBy?: 'fullName' | 'crm' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  includeDeleted?: boolean;
}

export interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
  clinicId?: string;
  clinicName?: string;
  isTelemedicine?: boolean;
}

export interface AvailableSlotsResponse {
  doctorId: string;
  doctorName: string;
  slots: TimeSlot[];
  startDate: string;
  endDate: string;
}

export interface DoctorStats {
  totalAppointments: number;
  completedConsultations: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  telemedicineConsultations: number;
  prescriptionsIssued: number;
  labOrdersIssued: number;
  averageConsultationDuration: number;
  patientsSeen: number;
  newPatients: number;
  returningPatients: number;
  revenue?: number;
  startDate?: string;
  endDate?: string;
}

export interface CreateDoctorData {
  email: string;
  password: string;
  fullName: string;
  socialName?: string;
  cpf: string;
  birthDate: string;
  gender: Gender;
  phone: string;
  crm: string;
  crmState: string;
  specialties: string[];
  subspecialties?: string[];
  rqe?: string[];
  cns?: string;
  bio?: string;
  appointmentDuration?: number;
  telemedicineEnabled?: boolean;
  termsAccepted: boolean;
  privacyAccepted: boolean;
}

export interface UpdateDoctorData {
  fullName?: string;
  socialName?: string;
  phone?: string;
  specialties?: string[];
  subspecialties?: string[];
  rqe?: string[];
  cns?: string;
  bio?: string;
  appointmentDuration?: number;
  telemedicineEnabled?: boolean;
  workingHours?: WorkingHours[];
}

// Helper functions
export function getCrmStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ACTIVE: 'Ativo',
    INACTIVE: 'Inativo',
    SUSPENDED: 'Suspenso',
    CANCELLED: 'Cancelado',
  };
  return labels[status] || status;
}

export function getCrmStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIVE: 'text-green-600 bg-green-100',
    INACTIVE: 'text-gray-600 bg-gray-100',
    SUSPENDED: 'text-yellow-600 bg-yellow-100',
    CANCELLED: 'text-red-600 bg-red-100',
  };
  return colors[status] || 'text-gray-600 bg-gray-100';
}

export function getDayOfWeekLabel(day: number): string {
  const days = [
    'Domingo',
    'Segunda-feira',
    'Terca-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sabado',
  ];
  return days[day] || '';
}

export function formatCRM(crm: string, state: string): string {
  return `CRM ${crm}/${state}`;
}
