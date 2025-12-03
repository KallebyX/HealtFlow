// ============================================================
// PATIENT TYPES
// Tipos para pacientes sincronizados com o backend
// ============================================================

import { Gender, UserStatus } from './auth';

export enum BloodType {
  A_POSITIVE = 'A_POSITIVE',
  A_NEGATIVE = 'A_NEGATIVE',
  B_POSITIVE = 'B_POSITIVE',
  B_NEGATIVE = 'B_NEGATIVE',
  AB_POSITIVE = 'AB_POSITIVE',
  AB_NEGATIVE = 'AB_NEGATIVE',
  O_POSITIVE = 'O_POSITIVE',
  O_NEGATIVE = 'O_NEGATIVE',
}

export enum MaritalStatus {
  SINGLE = 'SINGLE',
  MARRIED = 'MARRIED',
  DIVORCED = 'DIVORCED',
  WIDOWED = 'WIDOWED',
  SEPARATED = 'SEPARATED',
  CIVIL_UNION = 'CIVIL_UNION',
}

export enum TriageLevel {
  EMERGENCY = 'EMERGENCY',
  VERY_URGENT = 'VERY_URGENT',
  URGENT = 'URGENT',
  LESS_URGENT = 'LESS_URGENT',
  NON_URGENT = 'NON_URGENT',
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface VitalSignSummary {
  systolicBp?: number;
  diastolicBp?: number;
  heartRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  weight?: number;
  triageLevel?: TriageLevel;
  measuredAt: string;
}

export interface PatientCounts {
  appointments: number;
  consultations: number;
  prescriptions: number;
  tasks: number;
  documents: number;
}

export interface Patient {
  id: string;
  userId: string;

  // Personal Info
  fullName: string;
  socialName?: string;
  cpf: string;
  rg?: string;
  rgIssuer?: string;
  birthDate: string;
  gender: Gender;
  maritalStatus?: MaritalStatus;
  nationality?: string;
  birthPlace?: string;
  motherName?: string;
  fatherName?: string;
  occupation?: string;

  // Contact
  phone: string;
  secondaryPhone?: string;
  email?: string;

  // Address
  address?: Address;

  // Healthcare
  cns?: string;
  bloodType?: BloodType;
  allergies?: string[];
  chronicConditions?: string[];
  currentMedications?: Array<{
    name: string;
    dosage: string;
    frequency: string;
  }>;
  familyHistory?: Array<{
    condition: string;
    relationship: string;
  }>;
  surgicalHistory?: Array<{
    procedure: string;
    date: string;
    notes?: string;
  }>;

  // Health Insurance
  healthInsuranceId?: string;
  insuranceNumber?: string;
  insuranceValidUntil?: string;

  // Biometrics
  height?: number;
  weight?: number;

  // Lifestyle
  smokingStatus?: string;
  alcoholConsumption?: string;
  physicalActivity?: string;

  // Emergency Contact
  emergencyContact?: EmergencyContact;

  // Gamification
  totalPoints: number;
  level: number;
  levelName: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate?: string;

  // Preferences
  preferredLanguage: string;
  preferredTimezone: string;

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
  vitalSigns?: VitalSignSummary[];
  badges?: Array<{
    id: string;
    name: string;
    description: string;
    iconUrl: string;
    earnedAt: string;
  }>;
  clinics?: Array<{
    id: string;
    tradeName: string;
    logoUrl?: string;
  }>;
  _count?: PatientCounts;
}

export interface PatientListResponse {
  data: Patient[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PatientQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: UserStatus;
  gender?: Gender;
  bloodType?: BloodType;
  healthInsuranceId?: string;
  clinicId?: string;
  hasAllergies?: boolean;
  hasChronicConditions?: boolean;
  birthDateFrom?: string;
  birthDateTo?: string;
  ageMin?: number;
  ageMax?: number;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: 'fullName' | 'birthDate' | 'createdAt' | 'updatedAt' | 'lastActivityDate';
  sortOrder?: 'asc' | 'desc';
  includeDeleted?: boolean;
}

export interface CreatePatientData {
  email: string;
  password: string;
  fullName: string;
  socialName?: string;
  cpf: string;
  birthDate: string;
  gender: Gender;
  phone: string;
  secondaryPhone?: string;
  address?: Address;
  emergencyContact?: EmergencyContact;
  allergies?: string[];
  height?: number;
  weight?: number;
  bloodType?: BloodType;
  cns?: string;
}

export interface UpdatePatientData {
  fullName?: string;
  socialName?: string;
  phone?: string;
  secondaryPhone?: string;
  address?: Address;
  emergencyContact?: EmergencyContact;
  allergies?: string[];
  chronicConditions?: string[];
  height?: number;
  weight?: number;
  bloodType?: BloodType;
  maritalStatus?: MaritalStatus;
  occupation?: string;
  smokingStatus?: string;
  alcoholConsumption?: string;
  physicalActivity?: string;
}

// Helper functions
export function getBloodTypeLabel(bloodType: BloodType): string {
  const labels: Record<BloodType, string> = {
    [BloodType.A_POSITIVE]: 'A+',
    [BloodType.A_NEGATIVE]: 'A-',
    [BloodType.B_POSITIVE]: 'B+',
    [BloodType.B_NEGATIVE]: 'B-',
    [BloodType.AB_POSITIVE]: 'AB+',
    [BloodType.AB_NEGATIVE]: 'AB-',
    [BloodType.O_POSITIVE]: 'O+',
    [BloodType.O_NEGATIVE]: 'O-',
  };
  return labels[bloodType];
}

export function getMaritalStatusLabel(status: MaritalStatus): string {
  const labels: Record<MaritalStatus, string> = {
    [MaritalStatus.SINGLE]: 'Solteiro(a)',
    [MaritalStatus.MARRIED]: 'Casado(a)',
    [MaritalStatus.DIVORCED]: 'Divorciado(a)',
    [MaritalStatus.WIDOWED]: 'Viuvo(a)',
    [MaritalStatus.SEPARATED]: 'Separado(a)',
    [MaritalStatus.CIVIL_UNION]: 'Uniao Estavel',
  };
  return labels[status];
}

export function getTriageLevelLabel(level: TriageLevel): string {
  const labels: Record<TriageLevel, string> = {
    [TriageLevel.EMERGENCY]: 'Emergencia',
    [TriageLevel.VERY_URGENT]: 'Muito Urgente',
    [TriageLevel.URGENT]: 'Urgente',
    [TriageLevel.LESS_URGENT]: 'Pouco Urgente',
    [TriageLevel.NON_URGENT]: 'Nao Urgente',
  };
  return labels[level];
}

export function getTriageLevelColor(level: TriageLevel): string {
  const colors: Record<TriageLevel, string> = {
    [TriageLevel.EMERGENCY]: 'text-red-600 bg-red-100',
    [TriageLevel.VERY_URGENT]: 'text-orange-600 bg-orange-100',
    [TriageLevel.URGENT]: 'text-yellow-600 bg-yellow-100',
    [TriageLevel.LESS_URGENT]: 'text-green-600 bg-green-100',
    [TriageLevel.NON_URGENT]: 'text-blue-600 bg-blue-100',
  };
  return colors[level];
}

export function getGenderLabel(gender: Gender): string {
  const labels: Record<Gender, string> = {
    [Gender.MALE]: 'Masculino',
    [Gender.FEMALE]: 'Feminino',
    [Gender.OTHER]: 'Outro',
    [Gender.PREFER_NOT_TO_SAY]: 'Prefiro nao informar',
  };
  return labels[gender];
}
