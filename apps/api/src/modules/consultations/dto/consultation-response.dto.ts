import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ConsultationType,
  ConsultationStatus,
  DiagnosisType,
  ConductType,
} from './create-consultation.dto';

// ═══════════════════════════════════════════════════════════════════════════════
// NESTED RESPONSE DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class ConsultationPatientResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiPropertyOptional()
  cpf?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  avatarUrl?: string;

  @ApiPropertyOptional()
  birthDate?: Date;

  @ApiPropertyOptional()
  age?: number;

  @ApiPropertyOptional()
  gender?: string;

  @ApiPropertyOptional()
  bloodType?: string;
}

export class ConsultationDoctorResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiPropertyOptional()
  crm?: string;

  @ApiPropertyOptional()
  specialty?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  avatarUrl?: string;
}

export class ConsultationClinicResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  cnpj?: string;

  @ApiPropertyOptional()
  address?: string;
}

export class VitalSignsResponseDto {
  @ApiPropertyOptional()
  systolicBP?: number;

  @ApiPropertyOptional()
  diastolicBP?: number;

  @ApiPropertyOptional()
  heartRate?: number;

  @ApiPropertyOptional()
  respiratoryRate?: number;

  @ApiPropertyOptional()
  temperature?: number;

  @ApiPropertyOptional()
  oxygenSaturation?: number;

  @ApiPropertyOptional()
  weight?: number;

  @ApiPropertyOptional()
  height?: number;

  @ApiPropertyOptional()
  bmi?: number;

  @ApiPropertyOptional()
  waistCircumference?: number;

  @ApiPropertyOptional()
  bloodGlucose?: number;

  @ApiPropertyOptional()
  painScale?: number;
}

export class DiagnosisResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: DiagnosisType })
  type: DiagnosisType;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  diagnosisDate?: Date;

  @ApiProperty()
  isConfirmed: boolean;
}

export class ConductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ConductType })
  type: ConductType;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional()
  justification?: string;

  @ApiProperty()
  priority: number;

  @ApiPropertyOptional()
  referralId?: string;

  @ApiPropertyOptional()
  referralSpecialty?: string;
}

export class MedicalCertificateResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string;

  @ApiPropertyOptional()
  days?: number;

  @ApiPropertyOptional()
  startDate?: Date;

  @ApiPropertyOptional()
  endDate?: Date;

  @ApiPropertyOptional()
  cidCode?: string;

  @ApiPropertyOptional()
  text?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  signedAt?: Date;

  @ApiPropertyOptional()
  documentUrl?: string;
}

export class MedicalReferralResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  specialty: string;

  @ApiPropertyOptional()
  toDoctorId?: string;

  @ApiPropertyOptional()
  toDoctorName?: string;

  @ApiProperty()
  reason: string;

  @ApiPropertyOptional()
  urgency?: string;

  @ApiPropertyOptional()
  clinicalInformation?: string;

  @ApiPropertyOptional()
  diagnosticHypothesis?: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  documentUrl?: string;
}

export class AttachmentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  fileType: string;

  @ApiProperty()
  fileUrl: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  category?: string;

  @ApiProperty()
  uploadedAt: Date;
}

export class SOAPNoteResponseDto {
  @ApiPropertyOptional()
  subjective?: string;

  @ApiPropertyOptional()
  objective?: string;

  @ApiPropertyOptional()
  assessment?: string;

  @ApiPropertyOptional()
  plan?: string;
}

export class AnamnesisResponseDto {
  @ApiPropertyOptional()
  chiefComplaint?: {
    description: string;
    duration?: string;
    intensity?: number;
    worseningFactors?: string;
    improvingFactors?: string;
  };

  @ApiPropertyOptional()
  historyOfPresentIllness?: {
    description: string;
    onset?: string;
    evolution?: string;
    previousTreatments?: string;
  };

  @ApiPropertyOptional()
  pastMedicalHistory?: {
    diseases?: string[];
    surgeries?: string[];
    hospitalizations?: string[];
    traumas?: string[];
    bloodTransfusions?: boolean;
    notes?: string;
  };

  @ApiPropertyOptional()
  familyHistory?: {
    father?: string;
    mother?: string;
    siblings?: string;
    grandparents?: string;
    familyDiseases?: string[];
    notes?: string;
  };

  @ApiPropertyOptional()
  socialHistory?: {
    smoking?: string;
    alcohol?: string;
    drugs?: string;
    physicalActivity?: string;
    diet?: string;
    occupation?: string;
    maritalStatus?: string;
    housing?: string;
    notes?: string;
  };

  @ApiPropertyOptional()
  reviewOfSystems?: Record<string, string>;

  @ApiPropertyOptional({ type: [String] })
  allergies?: string[];

  @ApiPropertyOptional({ type: [String] })
  currentMedications?: string[];
}

export class PhysicalExaminationResponseDto {
  @ApiPropertyOptional({ type: VitalSignsResponseDto })
  vitalSigns?: VitalSignsResponseDto;

  @ApiPropertyOptional()
  generalAppearance?: string;

  @ApiPropertyOptional()
  generalCondition?: string;

  @ApiPropertyOptional()
  consciousness?: string;

  @ApiPropertyOptional()
  systemExams?: Array<{
    system: string;
    findings: string;
    isNormal: boolean;
    notes?: string;
  }>;

  @ApiPropertyOptional()
  skin?: string;

  @ApiPropertyOptional()
  headNeck?: string;

  @ApiPropertyOptional()
  thorax?: string;

  @ApiPropertyOptional()
  cardiovascular?: string;

  @ApiPropertyOptional()
  respiratory?: string;

  @ApiPropertyOptional()
  abdomen?: string;

  @ApiPropertyOptional()
  neurological?: string;

  @ApiPropertyOptional()
  musculoskeletal?: string;

  @ApiPropertyOptional()
  extremities?: string;

  @ApiPropertyOptional()
  additionalNotes?: string;
}

export class ConsultationAmendmentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  reason: string;

  @ApiProperty()
  changes: Record<string, any>;

  @ApiProperty()
  amendedAt: Date;

  @ApiProperty()
  amendedBy: string;

  @ApiPropertyOptional()
  amendedByName?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN CONSULTATION RESPONSE DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class ConsultationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  appointmentId: string;

  @ApiProperty({ type: ConsultationPatientResponseDto })
  patient: ConsultationPatientResponseDto;

  @ApiProperty({ type: ConsultationDoctorResponseDto })
  doctor: ConsultationDoctorResponseDto;

  @ApiProperty({ type: ConsultationClinicResponseDto })
  clinic: ConsultationClinicResponseDto;

  @ApiProperty({ enum: ConsultationType })
  type: ConsultationType;

  @ApiProperty({ enum: ConsultationStatus })
  status: ConsultationStatus;

  @ApiPropertyOptional({ type: AnamnesisResponseDto })
  anamnesis?: AnamnesisResponseDto;

  @ApiPropertyOptional({ type: PhysicalExaminationResponseDto })
  physicalExamination?: PhysicalExaminationResponseDto;

  @ApiPropertyOptional({ type: [DiagnosisResponseDto] })
  diagnoses?: DiagnosisResponseDto[];

  @ApiPropertyOptional({ type: [ConductResponseDto] })
  conducts?: ConductResponseDto[];

  @ApiPropertyOptional({ type: SOAPNoteResponseDto })
  soapNote?: SOAPNoteResponseDto;

  @ApiPropertyOptional()
  clinicalEvolution?: string;

  @ApiPropertyOptional()
  summary?: string;

  @ApiPropertyOptional()
  patientInstructions?: string;

  @ApiPropertyOptional()
  internalNotes?: string;

  @ApiPropertyOptional({ type: [MedicalCertificateResponseDto] })
  certificates?: MedicalCertificateResponseDto[];

  @ApiPropertyOptional({ type: [MedicalReferralResponseDto] })
  referrals?: MedicalReferralResponseDto[];

  @ApiPropertyOptional({ type: [AttachmentResponseDto] })
  attachments?: AttachmentResponseDto[];

  @ApiProperty()
  needsFollowUp: boolean;

  @ApiPropertyOptional()
  followUpDays?: number;

  @ApiPropertyOptional()
  followUpDate?: Date;

  @ApiPropertyOptional({ type: [ConsultationAmendmentResponseDto] })
  amendments?: ConsultationAmendmentResponseDto[];

  @ApiPropertyOptional()
  signedAt?: Date;

  @ApiPropertyOptional()
  signatureHash?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  createdBy?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIST RESPONSE DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class ConsultationListResponseDto {
  @ApiProperty({ type: [ConsultationResponseDto] })
  data: ConsultationResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PATIENT HISTORY RESPONSE DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class PatientHistoryResponseDto {
  @ApiProperty({ type: ConsultationPatientResponseDto })
  patient: ConsultationPatientResponseDto;

  @ApiProperty({ type: [ConsultationResponseDto] })
  consultations: ConsultationResponseDto[];

  @ApiPropertyOptional()
  allergies?: string[];

  @ApiPropertyOptional()
  chronicConditions?: string[];

  @ApiPropertyOptional()
  currentMedications?: Array<{
    name: string;
    dosage: string;
    frequency: string;
    prescribedAt: Date;
    prescribedBy: string;
  }>;

  @ApiPropertyOptional()
  vitalSignsHistory?: Array<{
    date: Date;
    vitalSigns: VitalSignsResponseDto;
  }>;

  @ApiPropertyOptional()
  diagnosisHistory?: Array<{
    code: string;
    description: string;
    date: Date;
    doctor: string;
  }>;

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DIAGNOSIS SEARCH RESPONSE DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class CID10ResponseDto {
  @ApiProperty()
  code: string;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional()
  chapter?: string;

  @ApiPropertyOptional()
  category?: string;

  @ApiPropertyOptional()
  subcategory?: string;
}

export class DiagnosisSearchResponseDto {
  @ApiProperty({ type: [CID10ResponseDto] })
  results: CID10ResponseDto[];

  @ApiProperty()
  total: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATISTICS RESPONSE DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class ConsultationStatsResponseDto {
  @ApiProperty()
  totalConsultations: number;

  @ApiProperty()
  completedConsultations: number;

  @ApiProperty()
  signedConsultations: number;

  @ApiProperty()
  draftConsultations: number;

  @ApiProperty()
  averageDuration: number;

  @ApiPropertyOptional()
  byType?: Record<string, number>;

  @ApiPropertyOptional()
  byStatus?: Record<string, number>;

  @ApiPropertyOptional()
  byDoctor?: Array<{
    doctorId: string;
    doctorName: string;
    total: number;
    averageDuration: number;
  }>;

  @ApiPropertyOptional()
  byPeriod?: Array<{
    period: string;
    total: number;
    completed: number;
    signed: number;
  }>;

  @ApiPropertyOptional()
  topDiagnoses?: Array<{
    code: string;
    description: string;
    count: number;
    percentage: number;
  }>;

  @ApiPropertyOptional()
  prescriptionStats?: {
    total: number;
    averageItemsPerPrescription: number;
    topMedications: Array<{
      name: string;
      count: number;
    }>;
  };

  @ApiPropertyOptional()
  certificateStats?: {
    total: number;
    averageDays: number;
    byType: Record<string, number>;
  };

  @ApiPropertyOptional()
  referralStats?: {
    total: number;
    bySpecialty: Record<string, number>;
    byUrgency: Record<string, number>;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEDICAL RECORD EXPORT RESPONSE DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class MedicalRecordExportResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiPropertyOptional()
  fileUrl?: string;

  @ApiPropertyOptional()
  fileName?: string;

  @ApiPropertyOptional()
  fileSize?: number;

  @ApiPropertyOptional()
  format?: string;

  @ApiPropertyOptional()
  expiresAt?: Date;

  @ApiPropertyOptional()
  recordCount?: number;

  @ApiPropertyOptional()
  exportedAt?: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIMELINE RESPONSE DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class TimelineEventResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: 'CONSULTATION' | 'PRESCRIPTION' | 'EXAM' | 'CERTIFICATE' | 'REFERRAL' | 'VITAL_SIGNS';

  @ApiProperty()
  date: Date;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  doctor?: {
    id: string;
    name: string;
  };

  @ApiPropertyOptional()
  clinic?: {
    id: string;
    name: string;
  };

  @ApiPropertyOptional()
  details?: Record<string, any>;
}

export class PatientTimelineResponseDto {
  @ApiProperty({ type: [TimelineEventResponseDto] })
  events: TimelineEventResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  hasMore: boolean;
}
