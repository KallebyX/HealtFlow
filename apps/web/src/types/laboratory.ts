// ============================================================
// LABORATORY TYPES
// Tipos para módulo de laboratório
// ============================================================

export interface Laboratory {
  id: string;
  name: string;
  cnpj: string;
  technicalDirector: string;
  technicalDirectorLicense: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LabOrder {
  id: string;
  patientId: string;
  patient: {
    id: string;
    fullName: string;
    socialName?: string;
    birthDate: string;
    cpf: string;
  };
  doctorId: string;
  doctor: {
    id: string;
    fullName: string;
    crm: string;
    crmState: string;
    specialty: string;
  };
  clinicId?: string;
  laboratoryId?: string;
  laboratory?: Laboratory;

  orderNumber: string;
  status: LabOrderStatus;
  priority: LabPriority;

  items: LabOrderItem[];
  clinicalInfo?: string;
  notes?: string;

  scheduledDate?: string;
  collectedAt?: string;
  completedAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface LabOrderItem {
  id: string;
  labOrderId: string;
  examCode: string;
  examName: string;
  material: string;
  tube?: string;
  status: LabItemStatus;
  result?: LabResult;
  scheduledDate?: string;
  collectedAt?: string;
  analyzedAt?: string;
  releasedAt?: string;
  notes?: string;
}

export interface LabResult {
  id: string;
  labOrderItemId: string;
  parameters: LabParameter[];
  conclusion?: string;
  observations?: string;
  method?: string;
  equipment?: string;
  technician?: string;
  reviewer?: string;
  reviewedAt?: string;
  signedBy?: string;
  signedAt?: string;
  pdfUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LabParameter {
  name: string;
  value: string;
  unit: string;
  referenceMin?: number;
  referenceMax?: number;
  referenceText?: string;
  flag?: 'normal' | 'low' | 'high' | 'critical' | 'abnormal';
}

export interface LabExamCatalog {
  id: string;
  code: string;
  name: string;
  description?: string;
  material: string;
  tube?: string;
  tubeColor?: string;
  minVolume?: string;
  preparation?: string;
  stability?: string;
  turnaroundTime: string;
  urgentTurnaroundTime?: string;
  price: number;
  cbhpmCode?: string;
  tussCode?: string;
  loincCode?: string;
  referenceValues: ReferenceValue[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReferenceValue {
  gender?: 'MALE' | 'FEMALE' | 'ANY';
  ageMin?: number;
  ageMax?: number;
  ageUnit?: 'days' | 'months' | 'years';
  condition?: string;
  min?: number;
  max?: number;
  text?: string;
  unit: string;
}

export interface LabSample {
  id: string;
  labOrderItemId: string;
  barcode: string;
  collectedAt: string;
  collectedBy: string;
  status: SampleStatus;
  rejectionReason?: string;
  temperature?: number;
  volume?: string;
  quality?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Enums
export enum LabOrderStatus {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  COLLECTING = 'COLLECTING',
  COLLECTED = 'COLLECTED',
  IN_ANALYSIS = 'IN_ANALYSIS',
  PARTIAL = 'PARTIAL',
  COMPLETED = 'COMPLETED',
  RELEASED = 'RELEASED',
  CANCELLED = 'CANCELLED',
}

export enum LabItemStatus {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  COLLECTED = 'COLLECTED',
  IN_ANALYSIS = 'IN_ANALYSIS',
  COMPLETED = 'COMPLETED',
  RELEASED = 'RELEASED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum LabPriority {
  ROUTINE = 'ROUTINE',
  URGENT = 'URGENT',
  EMERGENCY = 'EMERGENCY',
}

export enum SampleStatus {
  COLLECTED = 'COLLECTED',
  RECEIVED = 'RECEIVED',
  IN_ANALYSIS = 'IN_ANALYSIS',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
}

// API Types
export interface LabOrderListResponse {
  data: LabOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LabOrderQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: LabOrderStatus;
  priority?: LabPriority;
  patientId?: string;
  doctorId?: string;
  laboratoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateLabOrderData {
  patientId: string;
  doctorId: string;
  clinicId?: string;
  laboratoryId?: string;
  priority?: LabPriority;
  items: {
    examCode: string;
    examName: string;
    material: string;
  }[];
  clinicalInfo?: string;
  notes?: string;
  scheduledDate?: string;
}

export interface CreateLabResultData {
  labOrderItemId: string;
  parameters: LabParameter[];
  conclusion?: string;
  observations?: string;
  method?: string;
  equipment?: string;
}

// Helper functions
export function getLabOrderStatusLabel(status: LabOrderStatus): string {
  const labels: Record<LabOrderStatus, string> = {
    [LabOrderStatus.PENDING]: 'Pendente',
    [LabOrderStatus.SCHEDULED]: 'Agendado',
    [LabOrderStatus.COLLECTING]: 'Em Coleta',
    [LabOrderStatus.COLLECTED]: 'Coletado',
    [LabOrderStatus.IN_ANALYSIS]: 'Em Análise',
    [LabOrderStatus.PARTIAL]: 'Parcial',
    [LabOrderStatus.COMPLETED]: 'Concluído',
    [LabOrderStatus.RELEASED]: 'Liberado',
    [LabOrderStatus.CANCELLED]: 'Cancelado',
  };
  return labels[status] || status;
}

export function getLabOrderStatusColor(status: LabOrderStatus): string {
  const colors: Record<LabOrderStatus, string> = {
    [LabOrderStatus.PENDING]: 'bg-gray-100 text-gray-800',
    [LabOrderStatus.SCHEDULED]: 'bg-blue-100 text-blue-800',
    [LabOrderStatus.COLLECTING]: 'bg-yellow-100 text-yellow-800',
    [LabOrderStatus.COLLECTED]: 'bg-indigo-100 text-indigo-800',
    [LabOrderStatus.IN_ANALYSIS]: 'bg-purple-100 text-purple-800',
    [LabOrderStatus.PARTIAL]: 'bg-orange-100 text-orange-800',
    [LabOrderStatus.COMPLETED]: 'bg-green-100 text-green-800',
    [LabOrderStatus.RELEASED]: 'bg-emerald-100 text-emerald-800',
    [LabOrderStatus.CANCELLED]: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getLabPriorityLabel(priority: LabPriority): string {
  const labels: Record<LabPriority, string> = {
    [LabPriority.ROUTINE]: 'Rotina',
    [LabPriority.URGENT]: 'Urgente',
    [LabPriority.EMERGENCY]: 'Emergência',
  };
  return labels[priority] || priority;
}

export function getLabPriorityColor(priority: LabPriority): string {
  const colors: Record<LabPriority, string> = {
    [LabPriority.ROUTINE]: 'bg-gray-100 text-gray-800',
    [LabPriority.URGENT]: 'bg-orange-100 text-orange-800',
    [LabPriority.EMERGENCY]: 'bg-red-100 text-red-800',
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
}

export function getParameterFlag(value: number, min?: number, max?: number): LabParameter['flag'] {
  if (min === undefined && max === undefined) return 'normal';

  if (min !== undefined && value < min * 0.5) return 'critical';
  if (max !== undefined && value > max * 1.5) return 'critical';
  if (min !== undefined && value < min) return 'low';
  if (max !== undefined && value > max) return 'high';

  return 'normal';
}

export function getFlagLabel(flag: LabParameter['flag']): string {
  const labels: Record<string, string> = {
    normal: 'Normal',
    low: 'Baixo',
    high: 'Alto',
    critical: 'Crítico',
    abnormal: 'Alterado',
  };
  return labels[flag || 'normal'] || 'Normal';
}

export function getFlagColor(flag: LabParameter['flag']): string {
  const colors: Record<string, string> = {
    normal: 'text-green-600',
    low: 'text-yellow-600',
    high: 'text-orange-600',
    critical: 'text-red-600 font-bold',
    abnormal: 'text-purple-600',
  };
  return colors[flag || 'normal'] || 'text-gray-600';
}
