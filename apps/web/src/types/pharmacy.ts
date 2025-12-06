// ============================================================
// PHARMACY TYPES
// Tipos para módulo de farmácia
// ============================================================

export interface Pharmacy {
  id: string;
  name: string;
  cnpj: string;
  technicalResponsible: string;
  crfNumber: string;
  crfState: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  anvisaLicense?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Dispensation {
  id: string;
  pharmacyId: string;
  pharmacy?: Pharmacy;
  prescriptionId: string;
  prescription?: {
    id: string;
    prescriptionNumber: string;
    type: string;
    patient: {
      id: string;
      fullName: string;
      cpf: string;
    };
    doctor: {
      id: string;
      fullName: string;
      crm: string;
      crmState: string;
    };
  };

  dispensationNumber: string;
  status: DispensationStatus;
  type: DispensationType;

  items: DispensationItem[];

  dispensedTo: 'PATIENT' | 'REPRESENTATIVE';
  representativeName?: string;
  representativeCpf?: string;
  representativeRelation?: string;

  dispensedById: string;
  dispensedBy?: {
    id: string;
    fullName: string;
    crfNumber?: string;
  };

  validatedAt?: string;
  dispensedAt: string;
  notes?: string;

  createdAt: string;
  updatedAt: string;
}

export interface DispensationItem {
  id: string;
  dispensationId: string;
  prescriptionItemId?: string;

  medicationName: string;
  concentration: string;
  form: string;
  quantity: number;

  manufacturer?: string;
  batchNumber?: string;
  expirationDate?: string;

  notes?: string;
}

export interface PrescriptionValidation {
  isValid: boolean;
  prescription?: {
    id: string;
    prescriptionNumber: string;
    type: string;
    status: string;
    validUntil: string;
    daysRemaining: number;
    patient: {
      id: string;
      fullName: string;
      cpf: string;
      birthDate: string;
    };
    doctor: {
      id: string;
      fullName: string;
      crm: string;
      crmState: string;
      specialty: string;
      digitalSignature: {
        isValid: boolean;
        signedAt: string;
        certificate: string;
      };
    };
    items: {
      id: string;
      medicationName: string;
      concentration: string;
      form: string;
      quantity: number;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
      dispensedQuantity: number;
      remainingQuantity: number;
      isFullyDispensed: boolean;
    }[];
  };
  validationErrors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
}

export interface ControlledMedicationInventory {
  id: string;
  pharmacyId: string;
  medicationName: string;
  concentration: string;
  form: string;
  list: ControlledList;

  currentStock: number;
  minimumStock: number;

  entries: InventoryMovement[];

  lastCountDate?: string;
  lastCountBy?: string;

  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  inventoryId: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;

  batchNumber?: string;
  expirationDate?: string;
  manufacturer?: string;
  invoiceNumber?: string;

  dispensationId?: string;
  dispensation?: Dispensation;

  notes?: string;
  performedById: string;
  performedBy?: {
    id: string;
    fullName: string;
  };

  createdAt: string;
}

export interface SngpcReport {
  id: string;
  pharmacyId: string;
  period: string;
  startDate: string;
  endDate: string;
  status: SngpcReportStatus;

  summary: {
    totalDispensations: number;
    totalMedications: number;
    byList: {
      list: ControlledList;
      count: number;
    }[];
  };

  xmlContent?: string;
  submittedAt?: string;
  submittedBy?: string;
  protocol?: string;

  createdAt: string;
  updatedAt: string;
}

// Enums
export enum DispensationStatus {
  PENDING = 'PENDING',
  VALIDATED = 'VALIDATED',
  PARTIAL = 'PARTIAL',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
}

export enum DispensationType {
  SIMPLE = 'SIMPLE',
  CONTROLLED_BLUE = 'CONTROLLED_BLUE',
  CONTROLLED_YELLOW = 'CONTROLLED_YELLOW',
  ANTIMICROBIAL = 'ANTIMICROBIAL',
  SPECIAL = 'SPECIAL',
}

export enum ControlledList {
  A1 = 'A1',
  A2 = 'A2',
  A3 = 'A3',
  B1 = 'B1',
  B2 = 'B2',
  C1 = 'C1',
  C2 = 'C2',
  C3 = 'C3',
  C4 = 'C4',
  C5 = 'C5',
  ANTIMICROBIAL = 'ANTIMICROBIAL',
}

export enum MovementType {
  ENTRY = 'ENTRY',
  DISPENSATION = 'DISPENSATION',
  ADJUSTMENT = 'ADJUSTMENT',
  LOSS = 'LOSS',
  RETURN = 'RETURN',
  TRANSFER = 'TRANSFER',
}

export enum SngpcReportStatus {
  DRAFT = 'DRAFT',
  GENERATED = 'GENERATED',
  SUBMITTED = 'SUBMITTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

// API Types
export interface DispensationListResponse {
  data: Dispensation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DispensationQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: DispensationStatus;
  type?: DispensationType;
  pharmacyId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateDispensationData {
  prescriptionId: string;
  pharmacyId: string;
  items: {
    prescriptionItemId?: string;
    medicationName: string;
    concentration: string;
    form: string;
    quantity: number;
    batchNumber?: string;
    expirationDate?: string;
    manufacturer?: string;
  }[];
  dispensedTo: 'PATIENT' | 'REPRESENTATIVE';
  representativeName?: string;
  representativeCpf?: string;
  representativeRelation?: string;
  notes?: string;
}

// Helper functions
export function getDispensationStatusLabel(status: DispensationStatus): string {
  const labels: Record<DispensationStatus, string> = {
    [DispensationStatus.PENDING]: 'Pendente',
    [DispensationStatus.VALIDATED]: 'Validado',
    [DispensationStatus.PARTIAL]: 'Parcial',
    [DispensationStatus.COMPLETED]: 'Concluído',
    [DispensationStatus.CANCELLED]: 'Cancelado',
    [DispensationStatus.REJECTED]: 'Rejeitado',
  };
  return labels[status] || status;
}

export function getDispensationStatusColor(status: DispensationStatus): string {
  const colors: Record<DispensationStatus, string> = {
    [DispensationStatus.PENDING]: 'bg-gray-100 text-gray-800',
    [DispensationStatus.VALIDATED]: 'bg-blue-100 text-blue-800',
    [DispensationStatus.PARTIAL]: 'bg-yellow-100 text-yellow-800',
    [DispensationStatus.COMPLETED]: 'bg-green-100 text-green-800',
    [DispensationStatus.CANCELLED]: 'bg-red-100 text-red-800',
    [DispensationStatus.REJECTED]: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getDispensationTypeLabel(type: DispensationType): string {
  const labels: Record<DispensationType, string> = {
    [DispensationType.SIMPLE]: 'Simples',
    [DispensationType.CONTROLLED_BLUE]: 'Controlada (Azul)',
    [DispensationType.CONTROLLED_YELLOW]: 'Controlada (Amarela)',
    [DispensationType.ANTIMICROBIAL]: 'Antimicrobiano',
    [DispensationType.SPECIAL]: 'Especial',
  };
  return labels[type] || type;
}

export function getDispensationTypeColor(type: DispensationType): string {
  const colors: Record<DispensationType, string> = {
    [DispensationType.SIMPLE]: 'bg-gray-100 text-gray-800',
    [DispensationType.CONTROLLED_BLUE]: 'bg-blue-100 text-blue-800',
    [DispensationType.CONTROLLED_YELLOW]: 'bg-yellow-100 text-yellow-800',
    [DispensationType.ANTIMICROBIAL]: 'bg-purple-100 text-purple-800',
    [DispensationType.SPECIAL]: 'bg-pink-100 text-pink-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
}

export function getControlledListLabel(list: ControlledList): string {
  const labels: Record<ControlledList, string> = {
    [ControlledList.A1]: 'A1 - Entorpecentes',
    [ControlledList.A2]: 'A2 - Entorpecentes (uso permitido)',
    [ControlledList.A3]: 'A3 - Psicotrópicos',
    [ControlledList.B1]: 'B1 - Psicotrópicos',
    [ControlledList.B2]: 'B2 - Psicotrópicos anorexígenos',
    [ControlledList.C1]: 'C1 - Outras substâncias',
    [ControlledList.C2]: 'C2 - Retinoides',
    [ControlledList.C3]: 'C3 - Imunossupressores',
    [ControlledList.C4]: 'C4 - Anti-retrovirais',
    [ControlledList.C5]: 'C5 - Anabolizantes',
    [ControlledList.ANTIMICROBIAL]: 'Antimicrobiano',
  };
  return labels[list] || list;
}

export function getRecipeTypeFromList(list: ControlledList): DispensationType {
  switch (list) {
    case ControlledList.A1:
    case ControlledList.A2:
    case ControlledList.A3:
      return DispensationType.CONTROLLED_YELLOW;
    case ControlledList.B1:
    case ControlledList.B2:
    case ControlledList.C1:
    case ControlledList.C2:
    case ControlledList.C3:
    case ControlledList.C4:
    case ControlledList.C5:
      return DispensationType.CONTROLLED_BLUE;
    case ControlledList.ANTIMICROBIAL:
      return DispensationType.ANTIMICROBIAL;
    default:
      return DispensationType.SIMPLE;
  }
}
