// Re-export all types from shared package
export * from '@healthflow/shared';

// Additional API-specific types

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
  expiresIn: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  cpf: string;
  phone: string;
  birthDate: string;
  gender: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  status: string;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  patient?: PatientProfile;
  doctor?: DoctorProfile;
}

export interface PatientProfile {
  id: string;
  fullName: string;
  socialName?: string;
  cpf: string;
  birthDate: string;
  gender: string;
  phone: string;
  avatarUrl?: string;
  level: number;
  levelName: string;
  totalPoints: number;
  currentStreak: number;
}

export interface DoctorProfile {
  id: string;
  fullName: string;
  cpf: string;
  crm: string;
  crmState: string;
  specialties: string[];
  profilePhotoUrl?: string;
  telemedicineEnabled: boolean;
}

// Appointment Types
export interface CreateAppointmentRequest {
  patientId: string;
  doctorId: string;
  clinicId: string;
  scheduledDate: string;
  scheduledTime: string;
  type: string;
  isTelemedicine: boolean;
  reason?: string;
}

export interface AppointmentSlot {
  time: string;
  available: boolean;
}

// Consultation Types
export interface SOAPNote {
  subjective: {
    chiefComplaint: string;
    historyOfPresentIllness: string;
    reviewOfSystems?: Record<string, string>;
    allergies?: string[];
    medications?: string[];
  };
  objective: {
    vitalSigns?: VitalSignsData;
    physicalExam?: Record<string, string>;
    labResults?: LabResultSummary[];
  };
  assessment: {
    diagnoses: Diagnosis[];
    clinicalReasoning?: string;
    prognosis?: string;
  };
  plan: {
    medications?: MedicationPlan[];
    procedures?: string[];
    referrals?: string[];
    labOrders?: string[];
    followUp?: string;
    patientEducation?: string[];
  };
}

export interface Diagnosis {
  icd10Code: string;
  description: string;
  type: 'primary' | 'secondary';
  certainty: 'confirmed' | 'suspected' | 'ruled_out';
}

export interface MedicationPlan {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface VitalSignsData {
  systolicBp?: number;
  diastolicBp?: number;
  heartRate?: number;
  respiratoryRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  bloodGlucose?: number;
  painScale?: number;
}

export interface LabResultSummary {
  examName: string;
  value: string;
  unit: string;
  referenceRange: string;
  isAbnormal: boolean;
}

// Gamification Types
export interface GamificationProfile {
  level: number;
  levelName: string;
  totalPoints: number;
  pointsToNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  badges: Badge[];
  recentActivities: Activity[];
}

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  iconUrl?: string;
  category: string;
  earnedAt?: string;
}

export interface Activity {
  id: string;
  action: string;
  points: number;
  description: string;
  createdAt: string;
}

// Telemedicine Types
export interface TelemedicineRoom {
  roomId: string;
  roomUrl: string;
  token: string;
  provider: string;
}

export interface TelemedicineParticipant {
  id: string;
  name: string;
  role: 'doctor' | 'patient';
  joinedAt?: string;
  isConnected: boolean;
}
