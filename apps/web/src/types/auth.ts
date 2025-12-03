// ============================================================
// AUTH TYPES
// Tipos para autenticação sincronizados com o backend
// ============================================================

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  CLINIC_ADMIN = 'CLINIC_ADMIN',
  CLINIC_MANAGER = 'CLINIC_MANAGER',
  DOCTOR = 'DOCTOR',
  NURSE = 'NURSE',
  PHARMACIST = 'PHARMACIST',
  PHYSIOTHERAPIST = 'PHYSIOTHERAPIST',
  PSYCHOLOGIST = 'PSYCHOLOGIST',
  NUTRITIONIST = 'NUTRITIONIST',
  DENTIST = 'DENTIST',
  LAB_TECHNICIAN = 'LAB_TECHNICIAN',
  LAB_MANAGER = 'LAB_MANAGER',
  RECEPTIONIST = 'RECEPTIONIST',
  BILLING_CLERK = 'BILLING_CLERK',
  SECRETARY = 'SECRETARY',
  PATIENT = 'PATIENT',
  INSURANCE_AGENT = 'INSURANCE_AGENT',
  SUPPLIER = 'SUPPLIER',
  GUEST = 'GUEST',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
  BLOCKED = 'BLOCKED',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
}

export interface PatientInfo {
  id: string;
  fullName: string;
  socialName?: string;
  avatarUrl?: string;
  level?: number;
  levelName?: string;
  totalPoints?: number;
}

export interface DoctorInfo {
  id: string;
  fullName: string;
  crm: string;
  crmState: string;
  specialties: string[];
  profilePhotoUrl?: string;
  telemedicineEnabled?: boolean;
}

export interface EmployeeInfo {
  id: string;
  fullName: string;
  position: string;
  department?: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  lastLoginAt?: string;
  patient?: PatientInfo;
  doctor?: DoctorInfo;
  employee?: EmployeeInfo;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  message?: string;
  requires2FA?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  twoFactorCode?: string;
  rememberMe?: boolean;
}

export interface RegisterPatientData {
  email: string;
  password: string;
  cpf: string;
  fullName: string;
  socialName?: string;
  birthDate: string;
  gender: Gender;
  phone: string;
  phoneSecondary?: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  allergies?: string[];
  height?: number;
  weight?: number;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  researchConsent?: boolean;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

// Role hierarchy for permission checks
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 100,
  [UserRole.ADMIN]: 90,
  [UserRole.CLINIC_ADMIN]: 80,
  [UserRole.CLINIC_MANAGER]: 70,
  [UserRole.DOCTOR]: 60,
  [UserRole.LAB_MANAGER]: 55,
  [UserRole.NURSE]: 50,
  [UserRole.PHARMACIST]: 50,
  [UserRole.PHYSIOTHERAPIST]: 50,
  [UserRole.PSYCHOLOGIST]: 50,
  [UserRole.NUTRITIONIST]: 50,
  [UserRole.DENTIST]: 50,
  [UserRole.LAB_TECHNICIAN]: 45,
  [UserRole.RECEPTIONIST]: 40,
  [UserRole.BILLING_CLERK]: 40,
  [UserRole.SECRETARY]: 40,
  [UserRole.PATIENT]: 20,
  [UserRole.INSURANCE_AGENT]: 15,
  [UserRole.SUPPLIER]: 10,
  [UserRole.GUEST]: 5,
};

export const ROLE_GROUPS = {
  ADMINS: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLINIC_ADMIN],
  MANAGERS: [UserRole.CLINIC_ADMIN, UserRole.CLINIC_MANAGER, UserRole.LAB_MANAGER],
  HEALTHCARE_PROVIDERS: [
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.PHARMACIST,
    UserRole.PHYSIOTHERAPIST,
    UserRole.PSYCHOLOGIST,
    UserRole.NUTRITIONIST,
    UserRole.DENTIST,
  ],
  CLINICAL_STAFF: [UserRole.DOCTOR, UserRole.NURSE, UserRole.LAB_TECHNICIAN, UserRole.PHARMACIST],
  ADMINISTRATIVE_STAFF: [UserRole.RECEPTIONIST, UserRole.BILLING_CLERK, UserRole.SECRETARY],
  ALL_STAFF: [
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.CLINIC_ADMIN,
    UserRole.CLINIC_MANAGER,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.PHARMACIST,
    UserRole.PHYSIOTHERAPIST,
    UserRole.PSYCHOLOGIST,
    UserRole.NUTRITIONIST,
    UserRole.DENTIST,
    UserRole.LAB_TECHNICIAN,
    UserRole.LAB_MANAGER,
    UserRole.RECEPTIONIST,
    UserRole.BILLING_CLERK,
    UserRole.SECRETARY,
  ],
};

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function hasAnyRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}

export function isInRoleGroup(
  userRole: UserRole,
  groupName: keyof typeof ROLE_GROUPS
): boolean {
  return ROLE_GROUPS[groupName].includes(userRole);
}

export function getUserDisplayName(user: User): string {
  if (user.patient?.socialName) return user.patient.socialName;
  if (user.patient?.fullName) return user.patient.fullName;
  if (user.doctor?.fullName) return user.doctor.fullName;
  if (user.employee?.fullName) return user.employee.fullName;
  return user.email.split('@')[0];
}

export function getUserAvatar(user: User): string | undefined {
  if (user.patient?.avatarUrl) return user.patient.avatarUrl;
  if (user.doctor?.profilePhotoUrl) return user.doctor.profilePhotoUrl;
  return undefined;
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    [UserRole.SUPER_ADMIN]: 'Super Administrador',
    [UserRole.ADMIN]: 'Administrador',
    [UserRole.CLINIC_ADMIN]: 'Admin. Clinica',
    [UserRole.CLINIC_MANAGER]: 'Gerente de Clinica',
    [UserRole.DOCTOR]: 'Medico',
    [UserRole.NURSE]: 'Enfermeiro(a)',
    [UserRole.PHARMACIST]: 'Farmaceutico(a)',
    [UserRole.PHYSIOTHERAPIST]: 'Fisioterapeuta',
    [UserRole.PSYCHOLOGIST]: 'Psicologo(a)',
    [UserRole.NUTRITIONIST]: 'Nutricionista',
    [UserRole.DENTIST]: 'Dentista',
    [UserRole.LAB_TECHNICIAN]: 'Tecnico de Lab.',
    [UserRole.LAB_MANAGER]: 'Gerente de Lab.',
    [UserRole.RECEPTIONIST]: 'Recepcionista',
    [UserRole.BILLING_CLERK]: 'Faturista',
    [UserRole.SECRETARY]: 'Secretario(a)',
    [UserRole.PATIENT]: 'Paciente',
    [UserRole.INSURANCE_AGENT]: 'Agente de Convenio',
    [UserRole.SUPPLIER]: 'Fornecedor',
    [UserRole.GUEST]: 'Visitante',
  };
  return labels[role] || role;
}
