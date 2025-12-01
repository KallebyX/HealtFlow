// User Types
export type UserRole =
  | 'SUPER_ADMIN'
  | 'CLINIC_ADMIN'
  | 'DOCTOR'
  | 'NURSE'
  | 'RECEPTIONIST'
  | 'PATIENT'
  | 'PHARMACIST'
  | 'LAB_TECHNICIAN';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

// Patient Types
export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'NOT_INFORMED';

export type MaritalStatus =
  | 'SINGLE'
  | 'MARRIED'
  | 'DIVORCED'
  | 'WIDOWED'
  | 'SEPARATED'
  | 'CIVIL_UNION'
  | 'OTHER';

export type BloodType =
  | 'A_POSITIVE'
  | 'A_NEGATIVE'
  | 'B_POSITIVE'
  | 'B_NEGATIVE'
  | 'AB_POSITIVE'
  | 'AB_NEGATIVE'
  | 'O_POSITIVE'
  | 'O_NEGATIVE';

// Appointment Types
export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'RESCHEDULED';

export type AppointmentType =
  | 'FIRST_VISIT'
  | 'FOLLOW_UP'
  | 'RETURN'
  | 'EMERGENCY'
  | 'TELEMEDICINE'
  | 'EXAM'
  | 'PROCEDURE';

// Consultation Types
export type ConsultationStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

// Prescription Types
export type PrescriptionStatus =
  | 'DRAFT'
  | 'SIGNED'
  | 'PARTIALLY_DISPENSED'
  | 'FULLY_DISPENSED'
  | 'CANCELLED'
  | 'EXPIRED';

export type PrescriptionType = 'SIMPLE' | 'CONTROLLED' | 'ANTIMICROBIAL';

export type ControlLevel =
  | 'COMMON'
  | 'CONTROLLED_C1'
  | 'CONTROLLED_C2'
  | 'CONTROLLED_C3'
  | 'CONTROLLED_C4'
  | 'CONTROLLED_C5'
  | 'CONTROLLED_A'
  | 'CONTROLLED_B'
  | 'ANTIMICROBIAL';

// Lab Types
export type LabOrderStatus =
  | 'PENDING'
  | 'COLLECTED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'RELEASED'
  | 'CANCELLED';

// Billing Types
export type InvoiceStatus =
  | 'PENDING'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentMethod =
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'PIX'
  | 'BOLETO'
  | 'CASH'
  | 'INSURANCE'
  | 'TRANSFER';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';

// Notification Types
export type NotificationType = 'PUSH' | 'EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP';

export type NotificationStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

// Telemedicine Types
export type TelemedicineSessionStatus =
  | 'SCHEDULED'
  | 'WAITING'
  | 'IN_PROGRESS'
  | 'ENDED'
  | 'CANCELLED';

// Triage Types
export type TriageLevel = 'RED' | 'YELLOW' | 'GREEN' | 'BLUE';

// Task Types
export type TaskStatus = 'PENDING' | 'COMPLETED' | 'SKIPPED' | 'EXPIRED';

// Audit Types
export type AuditAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'EXPORT'
  | 'SIGN'
  | 'VERIFY'
  | 'ACCESS';

// Address Type
export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  lat?: number;
  lng?: number;
}

// Emergency Contact Type
export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Pagination Query
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
