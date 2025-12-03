// ============================================================
// MOBILE APP TYPES
// ============================================================

export interface User {
  id: string;
  email: string;
  fullName: string;
  socialName?: string;
  avatarUrl?: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface Patient {
  id: string;
  userId: string;
  fullName: string;
  socialName?: string;
  cpf: string;
  birthDate: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodType?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  allergies?: string[];
  medications?: string[];
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  clinicId: string;
  scheduledAt: string;
  duration: number;
  status: AppointmentStatus;
  type: AppointmentType;
  notes?: string;
  doctor?: {
    id: string;
    fullName: string;
    specialty?: string;
    avatarUrl?: string;
  };
  clinic?: {
    id: string;
    name: string;
    address?: string;
  };
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export enum AppointmentType {
  CONSULTATION = 'CONSULTATION',
  FOLLOW_UP = 'FOLLOW_UP',
  EXAM = 'EXAM',
  PROCEDURE = 'PROCEDURE',
  TELEMEDICINE = 'TELEMEDICINE',
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  issuedAt: string;
  validUntil: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  medications: PrescriptionMedication[];
  doctor?: {
    id: string;
    fullName: string;
    crm: string;
    crmState: string;
  };
  signedAt?: string;
  pdfUrl?: string;
}

export interface PrescriptionMedication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface LabExam {
  id: string;
  patientId: string;
  doctorId: string;
  name: string;
  category: string;
  requestedAt: string;
  collectedAt?: string;
  resultAt?: string;
  status: 'REQUESTED' | 'COLLECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  resultPdfUrl?: string;
  hasCriticalValues: boolean;
}

// Gamification
export interface GamificationProfile {
  id: string;
  patientId: string;
  level: number;
  currentXp: number;
  totalXp: number;
  xpToNextLevel: number;
  streak: number;
  badges: Badge[];
  rank?: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
  category: 'HEALTH' | 'ENGAGEMENT' | 'ACHIEVEMENT' | 'SPECIAL';
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  startDate: string;
  endDate: string;
  progress: number;
  target: number;
  isCompleted: boolean;
  category: string;
}

// Notifications
export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'APPOINTMENT' | 'PRESCRIPTION' | 'EXAM' | 'GAMIFICATION' | 'SYSTEM';
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
