// ============================================================
// EXAM TYPES
// Tipos para exames laboratoriais sincronizados com o backend
// ============================================================

export enum ExamStatus {
  REQUESTED = 'REQUESTED',
  SCHEDULED = 'SCHEDULED',
  COLLECTED = 'COLLECTED',
  IN_ANALYSIS = 'IN_ANALYSIS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
}

export enum ExamPriority {
  ROUTINE = 'ROUTINE',
  URGENT = 'URGENT',
  EMERGENCY = 'EMERGENCY',
}

export enum ExamCategory {
  HEMATOLOGY = 'HEMATOLOGY',
  BIOCHEMISTRY = 'BIOCHEMISTRY',
  IMMUNOLOGY = 'IMMUNOLOGY',
  MICROBIOLOGY = 'MICROBIOLOGY',
  URINALYSIS = 'URINALYSIS',
  PARASITOLOGY = 'PARASITOLOGY',
  HORMONES = 'HORMONES',
  TUMOR_MARKERS = 'TUMOR_MARKERS',
  IMAGING = 'IMAGING',
  PATHOLOGY = 'PATHOLOGY',
  GENETICS = 'GENETICS',
  TOXICOLOGY = 'TOXICOLOGY',
  OTHER = 'OTHER',
}

export interface ExamResult {
  id: string;
  examRequestId: string;
  parameter: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  isAbnormal: boolean;
  isCritical: boolean;
  notes?: string;
  methodology?: string;
}

export interface ExamPatient {
  id: string;
  fullName: string;
  socialName?: string;
  cpf: string;
  birthDate: string;
}

export interface ExamDoctor {
  id: string;
  fullName: string;
  socialName?: string;
  crm: string;
  crmState: string;
}

export interface ExamLab {
  id: string;
  name: string;
  cnes?: string;
  phone?: string;
}

export interface ExamRequest {
  id: string;
  patientId: string;
  requestingDoctorId: string;
  consultationId?: string;
  clinicId?: string;
  labId?: string;

  // Exam Info
  examCode: string;
  examName: string;
  category: ExamCategory;
  description?: string;

  // Status
  status: ExamStatus;
  priority: ExamPriority;

  // Clinical Info
  clinicalIndication?: string;
  clinicalNotes?: string;
  fastingRequired: boolean;
  preparationInstructions?: string;

  // Scheduling
  requestedAt: string;
  scheduledDate?: string;
  scheduledTime?: string;
  collectedAt?: string;
  completedAt?: string;

  // Results
  results?: ExamResult[];
  resultFileUrl?: string;
  interpretation?: string;
  responsibleTechnician?: string;
  validatedBy?: string;
  validatedAt?: string;

  // Alerts
  hasCriticalValues: boolean;
  criticalValueNotified: boolean;
  criticalValueNotifiedAt?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Relations
  patient?: ExamPatient;
  requestingDoctor?: ExamDoctor;
  lab?: ExamLab;
}

export interface ExamListResponse {
  data: ExamRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ExamQuery {
  page?: number;
  limit?: number;
  patientId?: string;
  doctorId?: string;
  labId?: string;
  clinicId?: string;
  status?: ExamStatus | ExamStatus[];
  category?: ExamCategory | ExamCategory[];
  priority?: ExamPriority;
  hasCriticalValues?: boolean;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: 'requestedAt' | 'completedAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateExamRequestData {
  patientId: string;
  consultationId?: string;
  clinicId?: string;
  labId?: string;
  examCode: string;
  examName: string;
  category: ExamCategory;
  description?: string;
  priority?: ExamPriority;
  clinicalIndication?: string;
  clinicalNotes?: string;
  fastingRequired?: boolean;
  preparationInstructions?: string;
  scheduledDate?: string;
  scheduledTime?: string;
}

export interface UpdateExamRequestData {
  status?: ExamStatus;
  labId?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  clinicalNotes?: string;
}

export interface CreateExamResultData {
  parameter: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  isAbnormal?: boolean;
  isCritical?: boolean;
  notes?: string;
  methodology?: string;
}

// Helper functions
export function getExamStatusLabel(status: ExamStatus): string {
  const labels: Record<ExamStatus, string> = {
    [ExamStatus.REQUESTED]: 'Solicitado',
    [ExamStatus.SCHEDULED]: 'Agendado',
    [ExamStatus.COLLECTED]: 'Coletado',
    [ExamStatus.IN_ANALYSIS]: 'Em Analise',
    [ExamStatus.COMPLETED]: 'Concluido',
    [ExamStatus.CANCELLED]: 'Cancelado',
    [ExamStatus.REJECTED]: 'Rejeitado',
  };
  return labels[status];
}

export function getExamStatusColor(status: ExamStatus): string {
  const colors: Record<ExamStatus, string> = {
    [ExamStatus.REQUESTED]: 'bg-blue-100 text-blue-800',
    [ExamStatus.SCHEDULED]: 'bg-purple-100 text-purple-800',
    [ExamStatus.COLLECTED]: 'bg-yellow-100 text-yellow-800',
    [ExamStatus.IN_ANALYSIS]: 'bg-orange-100 text-orange-800',
    [ExamStatus.COMPLETED]: 'bg-green-100 text-green-800',
    [ExamStatus.CANCELLED]: 'bg-gray-100 text-gray-800',
    [ExamStatus.REJECTED]: 'bg-red-100 text-red-800',
  };
  return colors[status];
}

export function getExamPriorityLabel(priority: ExamPriority): string {
  const labels: Record<ExamPriority, string> = {
    [ExamPriority.ROUTINE]: 'Rotina',
    [ExamPriority.URGENT]: 'Urgente',
    [ExamPriority.EMERGENCY]: 'Emergencia',
  };
  return labels[priority];
}

export function getExamPriorityColor(priority: ExamPriority): string {
  const colors: Record<ExamPriority, string> = {
    [ExamPriority.ROUTINE]: 'bg-gray-100 text-gray-800',
    [ExamPriority.URGENT]: 'bg-orange-100 text-orange-800',
    [ExamPriority.EMERGENCY]: 'bg-red-100 text-red-800',
  };
  return colors[priority];
}

export function getExamCategoryLabel(category: ExamCategory): string {
  const labels: Record<ExamCategory, string> = {
    [ExamCategory.HEMATOLOGY]: 'Hematologia',
    [ExamCategory.BIOCHEMISTRY]: 'Bioquimica',
    [ExamCategory.IMMUNOLOGY]: 'Imunologia',
    [ExamCategory.MICROBIOLOGY]: 'Microbiologia',
    [ExamCategory.URINALYSIS]: 'Urinanalise',
    [ExamCategory.PARASITOLOGY]: 'Parasitologia',
    [ExamCategory.HORMONES]: 'Hormonios',
    [ExamCategory.TUMOR_MARKERS]: 'Marcadores Tumorais',
    [ExamCategory.IMAGING]: 'Imagem',
    [ExamCategory.PATHOLOGY]: 'Patologia',
    [ExamCategory.GENETICS]: 'Genetica',
    [ExamCategory.TOXICOLOGY]: 'Toxicologia',
    [ExamCategory.OTHER]: 'Outros',
  };
  return labels[category];
}

export function isExamEditable(status: ExamStatus): boolean {
  return [ExamStatus.REQUESTED, ExamStatus.SCHEDULED].includes(status);
}

export function canAddResults(status: ExamStatus): boolean {
  return [ExamStatus.COLLECTED, ExamStatus.IN_ANALYSIS].includes(status);
}
