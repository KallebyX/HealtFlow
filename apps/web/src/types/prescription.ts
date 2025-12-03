// ============================================================
// PRESCRIPTION TYPES
// Tipos para prescricoes sincronizados com o backend
// ============================================================

export enum PrescriptionStatus {
  DRAFT = 'DRAFT',
  PENDING_SIGNATURE = 'PENDING_SIGNATURE',
  SIGNED = 'SIGNED',
  DISPENSED = 'DISPENSED',
  PARTIALLY_DISPENSED = 'PARTIALLY_DISPENSED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum PrescriptionType {
  SIMPLE = 'SIMPLE',
  CONTROLLED = 'CONTROLLED',
  ANTIMICROBIAL = 'ANTIMICROBIAL',
  SPECIAL = 'SPECIAL',
}

export enum MedicationType {
  REFERENCE = 'REFERENCE',
  GENERIC = 'GENERIC',
  SIMILAR = 'SIMILAR',
  MANIPULATED = 'MANIPULATED',
}

export enum RouteOfAdministration {
  ORAL = 'ORAL',
  SUBLINGUAL = 'SUBLINGUAL',
  TOPICAL = 'TOPICAL',
  INTRAVENOUS = 'INTRAVENOUS',
  INTRAMUSCULAR = 'INTRAMUSCULAR',
  SUBCUTANEOUS = 'SUBCUTANEOUS',
  INHALATION = 'INHALATION',
  NASAL = 'NASAL',
  OPHTHALMIC = 'OPHTHALMIC',
  OTIC = 'OTIC',
  RECTAL = 'RECTAL',
  VAGINAL = 'VAGINAL',
  TRANSDERMAL = 'TRANSDERMAL',
}

export interface PrescriptionMedication {
  id: string;
  prescriptionId: string;
  medicationName: string;
  activeIngredient?: string;
  concentration?: string;
  pharmaceuticalForm?: string;
  medicationType: MedicationType;
  quantity: number;
  unit: string;
  dosage: string;
  frequency: string;
  duration?: string;
  route: RouteOfAdministration;
  instructions?: string;
  continuousUse: boolean;
  substituteAllowed: boolean;
  order: number;
}

export interface PrescriptionPatient {
  id: string;
  fullName: string;
  socialName?: string;
  cpf: string;
  birthDate: string;
}

export interface PrescriptionDoctor {
  id: string;
  fullName: string;
  socialName?: string;
  crm: string;
  crmState: string;
  specialties: string[];
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  consultationId?: string;
  clinicId?: string;

  // Type and Status
  type: PrescriptionType;
  status: PrescriptionStatus;

  // Content
  medications: PrescriptionMedication[];
  recommendations?: string;
  warnings?: string;

  // Dates
  prescriptionDate: string;
  expirationDate?: string;
  signedAt?: string;
  dispensedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;

  // Digital Signature
  digitalSignature?: string;
  signatureVerified: boolean;
  qrCode?: string;
  validationCode?: string;

  // Print Info
  printCount: number;
  lastPrintedAt?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Relations
  patient?: PrescriptionPatient;
  doctor?: PrescriptionDoctor;
}

export interface PrescriptionListResponse {
  data: Prescription[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PrescriptionQuery {
  page?: number;
  limit?: number;
  patientId?: string;
  doctorId?: string;
  clinicId?: string;
  consultationId?: string;
  status?: PrescriptionStatus | PrescriptionStatus[];
  type?: PrescriptionType | PrescriptionType[];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: 'prescriptionDate' | 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateMedicationData {
  medicationName: string;
  activeIngredient?: string;
  concentration?: string;
  pharmaceuticalForm?: string;
  medicationType: MedicationType;
  quantity: number;
  unit: string;
  dosage: string;
  frequency: string;
  duration?: string;
  route: RouteOfAdministration;
  instructions?: string;
  continuousUse?: boolean;
  substituteAllowed?: boolean;
}

export interface CreatePrescriptionData {
  patientId: string;
  doctorId?: string;
  consultationId?: string;
  clinicId?: string;
  type: PrescriptionType;
  medications: CreateMedicationData[];
  recommendations?: string;
  warnings?: string;
  expirationDate?: string;
}

export interface UpdatePrescriptionData {
  medications?: CreateMedicationData[];
  recommendations?: string;
  warnings?: string;
  expirationDate?: string;
}

// Helper functions
export function getPrescriptionStatusLabel(status: PrescriptionStatus): string {
  const labels: Record<PrescriptionStatus, string> = {
    [PrescriptionStatus.DRAFT]: 'Rascunho',
    [PrescriptionStatus.PENDING_SIGNATURE]: 'Aguardando Assinatura',
    [PrescriptionStatus.SIGNED]: 'Assinada',
    [PrescriptionStatus.DISPENSED]: 'Dispensada',
    [PrescriptionStatus.PARTIALLY_DISPENSED]: 'Parcialmente Dispensada',
    [PrescriptionStatus.EXPIRED]: 'Expirada',
    [PrescriptionStatus.CANCELLED]: 'Cancelada',
  };
  return labels[status];
}

export function getPrescriptionStatusColor(status: PrescriptionStatus): string {
  const colors: Record<PrescriptionStatus, string> = {
    [PrescriptionStatus.DRAFT]: 'bg-gray-100 text-gray-800',
    [PrescriptionStatus.PENDING_SIGNATURE]: 'bg-yellow-100 text-yellow-800',
    [PrescriptionStatus.SIGNED]: 'bg-green-100 text-green-800',
    [PrescriptionStatus.DISPENSED]: 'bg-blue-100 text-blue-800',
    [PrescriptionStatus.PARTIALLY_DISPENSED]: 'bg-orange-100 text-orange-800',
    [PrescriptionStatus.EXPIRED]: 'bg-red-100 text-red-800',
    [PrescriptionStatus.CANCELLED]: 'bg-red-100 text-red-800',
  };
  return colors[status];
}

export function getPrescriptionTypeLabel(type: PrescriptionType): string {
  const labels: Record<PrescriptionType, string> = {
    [PrescriptionType.SIMPLE]: 'Simples',
    [PrescriptionType.CONTROLLED]: 'Controlada',
    [PrescriptionType.ANTIMICROBIAL]: 'Antimicrobiano',
    [PrescriptionType.SPECIAL]: 'Especial',
  };
  return labels[type];
}

export function getPrescriptionTypeColor(type: PrescriptionType): string {
  const colors: Record<PrescriptionType, string> = {
    [PrescriptionType.SIMPLE]: 'bg-blue-100 text-blue-800',
    [PrescriptionType.CONTROLLED]: 'bg-purple-100 text-purple-800',
    [PrescriptionType.ANTIMICROBIAL]: 'bg-orange-100 text-orange-800',
    [PrescriptionType.SPECIAL]: 'bg-red-100 text-red-800',
  };
  return colors[type];
}

export function getMedicationTypeLabel(type: MedicationType): string {
  const labels: Record<MedicationType, string> = {
    [MedicationType.REFERENCE]: 'Referencia',
    [MedicationType.GENERIC]: 'Generico',
    [MedicationType.SIMILAR]: 'Similar',
    [MedicationType.MANIPULATED]: 'Manipulado',
  };
  return labels[type];
}

export function getRouteLabel(route: RouteOfAdministration): string {
  const labels: Record<RouteOfAdministration, string> = {
    [RouteOfAdministration.ORAL]: 'Oral',
    [RouteOfAdministration.SUBLINGUAL]: 'Sublingual',
    [RouteOfAdministration.TOPICAL]: 'Topico',
    [RouteOfAdministration.INTRAVENOUS]: 'Intravenoso',
    [RouteOfAdministration.INTRAMUSCULAR]: 'Intramuscular',
    [RouteOfAdministration.SUBCUTANEOUS]: 'Subcutaneo',
    [RouteOfAdministration.INHALATION]: 'Inalatorio',
    [RouteOfAdministration.NASAL]: 'Nasal',
    [RouteOfAdministration.OPHTHALMIC]: 'Oftalmico',
    [RouteOfAdministration.OTIC]: 'Otico',
    [RouteOfAdministration.RECTAL]: 'Retal',
    [RouteOfAdministration.VAGINAL]: 'Vaginal',
    [RouteOfAdministration.TRANSDERMAL]: 'Transdermico',
  };
  return labels[route];
}

export function isPrescriptionEditable(status: PrescriptionStatus): boolean {
  return [PrescriptionStatus.DRAFT].includes(status);
}

export function canSignPrescription(status: PrescriptionStatus): boolean {
  return [PrescriptionStatus.DRAFT, PrescriptionStatus.PENDING_SIGNATURE].includes(status);
}
