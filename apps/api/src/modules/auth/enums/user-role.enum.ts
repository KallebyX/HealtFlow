// ============================================================
// USER ROLE ENUM
// Enum completo de roles para controle de acesso (RBAC)
// ============================================================

export enum UserRole {
  // System Administration
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',

  // Clinic Administration
  CLINIC_ADMIN = 'CLINIC_ADMIN',
  CLINIC_MANAGER = 'CLINIC_MANAGER',

  // Healthcare Professionals
  DOCTOR = 'DOCTOR',
  NURSE = 'NURSE',
  PHARMACIST = 'PHARMACIST',
  PHYSIOTHERAPIST = 'PHYSIOTHERAPIST',
  PSYCHOLOGIST = 'PSYCHOLOGIST',
  NUTRITIONIST = 'NUTRITIONIST',
  DENTIST = 'DENTIST',

  // Laboratory
  LAB_TECHNICIAN = 'LAB_TECHNICIAN',
  LAB_MANAGER = 'LAB_MANAGER',

  // Administrative Staff
  RECEPTIONIST = 'RECEPTIONIST',
  BILLING_CLERK = 'BILLING_CLERK',
  SECRETARY = 'SECRETARY',

  // Patients
  PATIENT = 'PATIENT',

  // External
  INSURANCE_AGENT = 'INSURANCE_AGENT',
  SUPPLIER = 'SUPPLIER',

  // Guest/Limited
  GUEST = 'GUEST',
}

// Permission levels for hierarchical access
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

// Role groups for easier permission management
export const ROLE_GROUPS = {
  ADMINS: [
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.CLINIC_ADMIN,
  ],
  MANAGERS: [
    UserRole.CLINIC_ADMIN,
    UserRole.CLINIC_MANAGER,
    UserRole.LAB_MANAGER,
  ],
  HEALTHCARE_PROVIDERS: [
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.PHARMACIST,
    UserRole.PHYSIOTHERAPIST,
    UserRole.PSYCHOLOGIST,
    UserRole.NUTRITIONIST,
    UserRole.DENTIST,
  ],
  CLINICAL_STAFF: [
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.LAB_TECHNICIAN,
    UserRole.PHARMACIST,
  ],
  LAB_STAFF: [
    UserRole.LAB_TECHNICIAN,
    UserRole.LAB_MANAGER,
  ],
  ADMINISTRATIVE_STAFF: [
    UserRole.RECEPTIONIST,
    UserRole.BILLING_CLERK,
    UserRole.SECRETARY,
  ],
  EXTERNAL: [
    UserRole.INSURANCE_AGENT,
    UserRole.SUPPLIER,
  ],
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

// Helper function to check if a role has access
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// Helper function to check if user is in any of the required roles
export function hasAnyRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}

// Helper function to check if user is in a role group
export function isInRoleGroup(userRole: UserRole, groupName: keyof typeof ROLE_GROUPS): boolean {
  return ROLE_GROUPS[groupName].includes(userRole);
}
