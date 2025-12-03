// ============================================================
// APPOINTMENT TYPES
// Tipos para agendamentos sincronizados com o backend
// ============================================================

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  RESCHEDULED = 'RESCHEDULED',
}

export enum AppointmentType {
  CONSULTATION = 'CONSULTATION',
  FOLLOW_UP = 'FOLLOW_UP',
  EXAM = 'EXAM',
  PROCEDURE = 'PROCEDURE',
  TELEMEDICINE = 'TELEMEDICINE',
  EMERGENCY = 'EMERGENCY',
}

export interface AppointmentPatient {
  id: string;
  fullName: string;
  socialName?: string;
  cpf: string;
  phone: string;
  profilePhotoUrl?: string;
}

export interface AppointmentDoctor {
  id: string;
  fullName: string;
  socialName?: string;
  crm: string;
  crmState: string;
  specialties: string[];
  profilePhotoUrl?: string;
}

export interface AppointmentClinic {
  id: string;
  tradeName: string;
  logoUrl?: string;
  phone?: string;
  address?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  clinicId?: string;

  // Scheduling
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  endTime: string;

  // Type and Status
  type: AppointmentType;
  status: AppointmentStatus;

  // Details
  reason?: string;
  symptoms?: string;
  notes?: string;
  internalNotes?: string;

  // Telemedicine
  isTelemedicine: boolean;
  telemedicineLink?: string;
  telemedicineProvider?: string;

  // Insurance
  healthInsuranceId?: string;
  authorizationCode?: string;

  // Check-in/out
  checkedInAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  cancelledBy?: string;

  // Reminders
  reminderSentAt?: string;
  confirmationSentAt?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  createdBy?: string;

  // Relations
  patient?: AppointmentPatient;
  doctor?: AppointmentDoctor;
  clinic?: AppointmentClinic;
}

export interface AppointmentListResponse {
  data: Appointment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AppointmentQuery {
  page?: number;
  limit?: number;
  patientId?: string;
  doctorId?: string;
  clinicId?: string;
  status?: AppointmentStatus | AppointmentStatus[];
  type?: AppointmentType | AppointmentType[];
  dateFrom?: string;
  dateTo?: string;
  isTelemedicine?: boolean;
  search?: string;
  sortBy?: 'scheduledDate' | 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateAppointmentData {
  patientId: string;
  doctorId: string;
  clinicId?: string;
  scheduledDate: string;
  scheduledTime: string;
  duration?: number;
  type: AppointmentType;
  reason?: string;
  symptoms?: string;
  notes?: string;
  isTelemedicine?: boolean;
  healthInsuranceId?: string;
}

export interface UpdateAppointmentData {
  scheduledDate?: string;
  scheduledTime?: string;
  duration?: number;
  type?: AppointmentType;
  status?: AppointmentStatus;
  reason?: string;
  symptoms?: string;
  notes?: string;
  internalNotes?: string;
  isTelemedicine?: boolean;
  healthInsuranceId?: string;
  authorizationCode?: string;
}

export interface RescheduleAppointmentData {
  scheduledDate: string;
  scheduledTime: string;
  reason?: string;
}

export interface CancelAppointmentData {
  reason: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Appointment;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
}

export interface DaySlot {
  date: string;
  time: string;
  available: boolean;
  appointmentId?: string;
  appointment?: Appointment;
}

export interface DoctorSchedule {
  doctorId: string;
  doctorName: string;
  date: string;
  slots: DaySlot[];
}

// Helper functions
export function getAppointmentStatusLabel(status: AppointmentStatus): string {
  const labels: Record<AppointmentStatus, string> = {
    [AppointmentStatus.SCHEDULED]: 'Agendado',
    [AppointmentStatus.CONFIRMED]: 'Confirmado',
    [AppointmentStatus.WAITING]: 'Na espera',
    [AppointmentStatus.IN_PROGRESS]: 'Em atendimento',
    [AppointmentStatus.COMPLETED]: 'Concluido',
    [AppointmentStatus.CANCELLED]: 'Cancelado',
    [AppointmentStatus.NO_SHOW]: 'Nao compareceu',
    [AppointmentStatus.RESCHEDULED]: 'Reagendado',
  };
  return labels[status];
}

export function getAppointmentStatusColor(status: AppointmentStatus): string {
  const colors: Record<AppointmentStatus, string> = {
    [AppointmentStatus.SCHEDULED]: 'bg-blue-100 text-blue-800',
    [AppointmentStatus.CONFIRMED]: 'bg-green-100 text-green-800',
    [AppointmentStatus.WAITING]: 'bg-yellow-100 text-yellow-800',
    [AppointmentStatus.IN_PROGRESS]: 'bg-purple-100 text-purple-800',
    [AppointmentStatus.COMPLETED]: 'bg-gray-100 text-gray-800',
    [AppointmentStatus.CANCELLED]: 'bg-red-100 text-red-800',
    [AppointmentStatus.NO_SHOW]: 'bg-orange-100 text-orange-800',
    [AppointmentStatus.RESCHEDULED]: 'bg-indigo-100 text-indigo-800',
  };
  return colors[status];
}

export function getAppointmentTypeLabel(type: AppointmentType): string {
  const labels: Record<AppointmentType, string> = {
    [AppointmentType.CONSULTATION]: 'Consulta',
    [AppointmentType.FOLLOW_UP]: 'Retorno',
    [AppointmentType.EXAM]: 'Exame',
    [AppointmentType.PROCEDURE]: 'Procedimento',
    [AppointmentType.TELEMEDICINE]: 'Telemedicina',
    [AppointmentType.EMERGENCY]: 'Emergencia',
  };
  return labels[type];
}

export function getAppointmentTypeColor(type: AppointmentType): string {
  const colors: Record<AppointmentType, string> = {
    [AppointmentType.CONSULTATION]: 'bg-blue-500',
    [AppointmentType.FOLLOW_UP]: 'bg-green-500',
    [AppointmentType.EXAM]: 'bg-purple-500',
    [AppointmentType.PROCEDURE]: 'bg-orange-500',
    [AppointmentType.TELEMEDICINE]: 'bg-cyan-500',
    [AppointmentType.EMERGENCY]: 'bg-red-500',
  };
  return colors[type];
}

export function formatAppointmentDateTime(date: string, time: string): string {
  const dateObj = new Date(`${date}T${time}`);
  return dateObj.toLocaleString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isAppointmentEditable(status: AppointmentStatus): boolean {
  return [
    AppointmentStatus.SCHEDULED,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.WAITING,
  ].includes(status);
}

export function isAppointmentCancellable(status: AppointmentStatus): boolean {
  return [
    AppointmentStatus.SCHEDULED,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.WAITING,
  ].includes(status);
}
