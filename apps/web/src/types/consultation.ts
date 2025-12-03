// ============================================================
// CONSULTATION TYPES
// Tipos para consultas/prontuario eletronico
// ============================================================

export enum ConsultationStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ConsultationType {
  FIRST_VISIT = 'FIRST_VISIT',
  FOLLOW_UP = 'FOLLOW_UP',
  EMERGENCY = 'EMERGENCY',
  TELEMEDICINE = 'TELEMEDICINE',
  PROCEDURE = 'PROCEDURE',
}

// SOAP Note structure
export interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface VitalSigns {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  respiratoryRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  painLevel?: number;
  bloodGlucose?: number;
  notes?: string;
}

export interface Diagnosis {
  id: string;
  code: string; // CID-10
  description: string;
  type: 'primary' | 'secondary';
  notes?: string;
}

export interface ConsultationPatient {
  id: string;
  fullName: string;
  socialName?: string;
  cpf: string;
  birthDate: string;
  gender: string;
  bloodType?: string;
  allergies?: string[];
}

export interface ConsultationDoctor {
  id: string;
  fullName: string;
  socialName?: string;
  crm: string;
  crmState: string;
  specialties: string[];
}

export interface Consultation {
  id: string;
  appointmentId?: string;
  patientId: string;
  doctorId: string;
  clinicId?: string;

  // Type and Status
  type: ConsultationType;
  status: ConsultationStatus;

  // Clinical Data
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  pastMedicalHistory?: string;
  familyHistory?: string;
  socialHistory?: string;
  reviewOfSystems?: string;

  // SOAP Notes
  soapNote?: SOAPNote;

  // Vital Signs
  vitalSigns?: VitalSigns;

  // Physical Exam
  physicalExam?: string;

  // Diagnoses
  diagnoses?: Diagnosis[];
  differentialDiagnoses?: string[];

  // Plan
  treatmentPlan?: string;
  recommendations?: string;
  followUpInstructions?: string;
  followUpDate?: string;

  // Attachments
  attachments?: {
    id: string;
    name: string;
    type: string;
    url: string;
  }[];

  // Timestamps
  startedAt: string;
  completedAt?: string;
  duration?: number;
  createdAt: string;
  updatedAt: string;

  // Digital signature
  signedAt?: string;
  digitalSignature?: string;

  // Relations
  patient?: ConsultationPatient;
  doctor?: ConsultationDoctor;
}

export interface ConsultationListResponse {
  data: Consultation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ConsultationQuery {
  page?: number;
  limit?: number;
  patientId?: string;
  doctorId?: string;
  clinicId?: string;
  status?: ConsultationStatus | ConsultationStatus[];
  type?: ConsultationType | ConsultationType[];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface CreateConsultationData {
  appointmentId?: string;
  patientId: string;
  clinicId?: string;
  type: ConsultationType;
  chiefComplaint?: string;
}

export interface UpdateConsultationData {
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  pastMedicalHistory?: string;
  familyHistory?: string;
  socialHistory?: string;
  reviewOfSystems?: string;
  soapNote?: SOAPNote;
  vitalSigns?: VitalSigns;
  physicalExam?: string;
  diagnoses?: Omit<Diagnosis, 'id'>[];
  differentialDiagnoses?: string[];
  treatmentPlan?: string;
  recommendations?: string;
  followUpInstructions?: string;
  followUpDate?: string;
}

// Helper functions
export function getConsultationStatusLabel(status: ConsultationStatus): string {
  const labels: Record<ConsultationStatus, string> = {
    [ConsultationStatus.IN_PROGRESS]: 'Em Andamento',
    [ConsultationStatus.COMPLETED]: 'Finalizada',
    [ConsultationStatus.CANCELLED]: 'Cancelada',
  };
  return labels[status];
}

export function getConsultationStatusColor(status: ConsultationStatus): string {
  const colors: Record<ConsultationStatus, string> = {
    [ConsultationStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
    [ConsultationStatus.COMPLETED]: 'bg-green-100 text-green-800',
    [ConsultationStatus.CANCELLED]: 'bg-red-100 text-red-800',
  };
  return colors[status];
}

export function getConsultationTypeLabel(type: ConsultationType): string {
  const labels: Record<ConsultationType, string> = {
    [ConsultationType.FIRST_VISIT]: 'Primeira Consulta',
    [ConsultationType.FOLLOW_UP]: 'Retorno',
    [ConsultationType.EMERGENCY]: 'Emergencia',
    [ConsultationType.TELEMEDICINE]: 'Telemedicina',
    [ConsultationType.PROCEDURE]: 'Procedimento',
  };
  return labels[type];
}

export function calculateBMI(weight?: number, height?: number): number | null {
  if (!weight || !height) return null;
  const heightInMeters = height / 100;
  return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
}

export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Abaixo do peso';
  if (bmi < 25) return 'Peso normal';
  if (bmi < 30) return 'Sobrepeso';
  if (bmi < 35) return 'Obesidade grau I';
  if (bmi < 40) return 'Obesidade grau II';
  return 'Obesidade grau III';
}

export function formatVitalSign(value: number | undefined, unit: string): string {
  if (value === undefined) return '-';
  return `${value} ${unit}`;
}
