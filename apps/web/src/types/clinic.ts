// ============================================================
// CLINIC TYPES
// Tipos para gestão de clínicas
// ============================================================

export interface Clinic {
  id: string;
  name: string;
  tradeName?: string;
  cnpj: string;
  cnes?: string;
  phone: string;
  email: string;
  website?: string;
  logoUrl?: string;
  description?: string;

  // Address
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude?: number;
  longitude?: number;

  // Operating hours
  operatingHours: OperatingHours;

  // Settings
  settings: ClinicSettings;

  // Relations
  specialties: string[];
  rooms: Room[];
  employees: Employee[];
  doctors: any[];

  // Stats
  totalPatients?: number;
  totalDoctors?: number;
  totalAppointmentsMonth?: number;
  averageRating?: number;

  // Metadata
  status: ClinicStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Room {
  id: string;
  clinicId: string;
  name: string;
  type: RoomType;
  floor?: string;
  capacity: number;
  equipment?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  userId: string;
  clinicId: string;
  role: EmployeeRole;
  department?: string;
  hireDate: string;
  workSchedule?: WorkSchedule;
  permissions: string[];
  isActive: boolean;

  // User data
  user?: {
    id: string;
    email: string;
    fullName: string;
    phone?: string;
    avatarUrl?: string;
    status: string;
  };

  createdAt: string;
  updatedAt: string;
}

export interface OperatingHours {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

export interface DaySchedule {
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
  breakStart?: string;
  breakEnd?: string;
}

export interface WorkSchedule {
  monday?: { start: string; end: string }[];
  tuesday?: { start: string; end: string }[];
  wednesday?: { start: string; end: string }[];
  thursday?: { start: string; end: string }[];
  friday?: { start: string; end: string }[];
  saturday?: { start: string; end: string }[];
  sunday?: { start: string; end: string }[];
}

export interface ClinicSettings {
  appointmentDuration: number;
  appointmentInterval: number;
  allowOnlineBooking: boolean;
  confirmationRequired: boolean;
  confirmationDeadlineHours: number;
  cancellationDeadlineHours: number;
  maxDaysInAdvance: number;
  minHoursInAdvance: number;
  autoConfirmEnabled: boolean;
  reminderSms: boolean;
  reminderEmail: boolean;
  reminderWhatsapp: boolean;
  reminderPush: boolean;
  reminderHoursBefore: number;
}

export enum ClinicStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
}

export enum RoomType {
  CONSULTATION = 'CONSULTATION',
  EXAMINATION = 'EXAMINATION',
  PROCEDURE = 'PROCEDURE',
  SURGERY = 'SURGERY',
  LABORATORY = 'LABORATORY',
  IMAGING = 'IMAGING',
  WAITING = 'WAITING',
  RECEPTION = 'RECEPTION',
  OTHER = 'OTHER',
}

export enum EmployeeRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  RECEPTIONIST = 'RECEPTIONIST',
  NURSE = 'NURSE',
  TECHNICIAN = 'TECHNICIAN',
  BILLING = 'BILLING',
  PHARMACIST = 'PHARMACIST',
  LAB_TECHNICIAN = 'LAB_TECHNICIAN',
  OTHER = 'OTHER',
}

// API Types
export interface ClinicListResponse {
  data: Clinic[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ClinicQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: ClinicStatus;
  city?: string;
  state?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateClinicData {
  name: string;
  tradeName?: string;
  cnpj: string;
  cnes?: string;
  phone: string;
  email: string;
  website?: string;
  description?: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  specialties?: string[];
  operatingHours?: OperatingHours;
}

export interface UpdateClinicData extends Partial<CreateClinicData> {
  settings?: Partial<ClinicSettings>;
  status?: ClinicStatus;
}

export interface CreateRoomData {
  name: string;
  type: RoomType;
  floor?: string;
  capacity?: number;
  equipment?: string[];
}

export interface CreateEmployeeData {
  email: string;
  fullName: string;
  phone?: string;
  role: EmployeeRole;
  department?: string;
  hireDate?: string;
  permissions?: string[];
}

// Helper functions
export function getClinicStatusLabel(status: ClinicStatus): string {
  const labels: Record<ClinicStatus, string> = {
    [ClinicStatus.ACTIVE]: 'Ativa',
    [ClinicStatus.INACTIVE]: 'Inativa',
    [ClinicStatus.PENDING]: 'Pendente',
    [ClinicStatus.SUSPENDED]: 'Suspensa',
  };
  return labels[status] || status;
}

export function getClinicStatusColor(status: ClinicStatus): string {
  const colors: Record<ClinicStatus, string> = {
    [ClinicStatus.ACTIVE]: 'bg-green-100 text-green-800',
    [ClinicStatus.INACTIVE]: 'bg-gray-100 text-gray-800',
    [ClinicStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [ClinicStatus.SUSPENDED]: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getRoomTypeLabel(type: RoomType): string {
  const labels: Record<RoomType, string> = {
    [RoomType.CONSULTATION]: 'Consultório',
    [RoomType.EXAMINATION]: 'Sala de Exames',
    [RoomType.PROCEDURE]: 'Sala de Procedimentos',
    [RoomType.SURGERY]: 'Centro Cirúrgico',
    [RoomType.LABORATORY]: 'Laboratório',
    [RoomType.IMAGING]: 'Imagem',
    [RoomType.WAITING]: 'Sala de Espera',
    [RoomType.RECEPTION]: 'Recepção',
    [RoomType.OTHER]: 'Outro',
  };
  return labels[type] || type;
}

export function getEmployeeRoleLabel(role: EmployeeRole): string {
  const labels: Record<EmployeeRole, string> = {
    [EmployeeRole.ADMIN]: 'Administrador',
    [EmployeeRole.MANAGER]: 'Gerente',
    [EmployeeRole.RECEPTIONIST]: 'Recepcionista',
    [EmployeeRole.NURSE]: 'Enfermeiro(a)',
    [EmployeeRole.TECHNICIAN]: 'Técnico(a)',
    [EmployeeRole.BILLING]: 'Faturista',
    [EmployeeRole.PHARMACIST]: 'Farmacêutico(a)',
    [EmployeeRole.LAB_TECHNICIAN]: 'Técnico de Laboratório',
    [EmployeeRole.OTHER]: 'Outro',
  };
  return labels[role] || role;
}

export function getEmployeeRoleColor(role: EmployeeRole): string {
  const colors: Record<EmployeeRole, string> = {
    [EmployeeRole.ADMIN]: 'bg-purple-100 text-purple-800',
    [EmployeeRole.MANAGER]: 'bg-blue-100 text-blue-800',
    [EmployeeRole.RECEPTIONIST]: 'bg-green-100 text-green-800',
    [EmployeeRole.NURSE]: 'bg-pink-100 text-pink-800',
    [EmployeeRole.TECHNICIAN]: 'bg-orange-100 text-orange-800',
    [EmployeeRole.BILLING]: 'bg-yellow-100 text-yellow-800',
    [EmployeeRole.PHARMACIST]: 'bg-teal-100 text-teal-800',
    [EmployeeRole.LAB_TECHNICIAN]: 'bg-cyan-100 text-cyan-800',
    [EmployeeRole.OTHER]: 'bg-gray-100 text-gray-800',
  };
  return colors[role] || 'bg-gray-100 text-gray-800';
}
