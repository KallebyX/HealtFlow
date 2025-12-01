import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PrescriptionType,
  PrescriptionStatus,
  MedicationRoute,
  InteractionSeverity,
} from './create-prescription.dto';

// ═══════════════════════════════════════════════════════════════════════════════
// NESTED RESPONSE DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class PrescriptionPatientResponseDto {
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
  allergies?: string[];
}

export class PrescriptionDoctorResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiPropertyOptional()
  crm?: string;

  @ApiPropertyOptional()
  crmState?: string;

  @ApiPropertyOptional()
  specialty?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  avatarUrl?: string;
}

export class PrescriptionClinicResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  cnpj?: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  phone?: string;
}

export class MedicationDosageResponseDto {
  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unit: string;

  @ApiPropertyOptional()
  formatted?: string;
}

export class MedicationFrequencyResponseDto {
  @ApiProperty()
  value: number;

  @ApiProperty()
  unit: string;

  @ApiPropertyOptional({ type: [String] })
  specificTimes?: string[];

  @ApiPropertyOptional()
  instructions?: string;

  @ApiPropertyOptional()
  formatted?: string;
}

export class MedicationDurationResponseDto {
  @ApiProperty()
  value: number;

  @ApiProperty()
  unit: string;

  @ApiPropertyOptional()
  startDate?: Date;

  @ApiPropertyOptional()
  endDate?: Date;

  @ApiPropertyOptional()
  formatted?: string;
}

export class PrescriptionItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  medicationId?: string;

  @ApiProperty()
  medicationName: string;

  @ApiPropertyOptional()
  genericName?: string;

  @ApiPropertyOptional()
  activeIngredient?: string;

  @ApiPropertyOptional()
  concentration?: string;

  @ApiPropertyOptional()
  pharmaceuticalForm?: string;

  @ApiPropertyOptional()
  manufacturer?: string;

  @ApiProperty({ type: MedicationDosageResponseDto })
  dosage: MedicationDosageResponseDto;

  @ApiProperty({ enum: MedicationRoute })
  route: MedicationRoute;

  @ApiProperty({ type: MedicationFrequencyResponseDto })
  frequency: MedicationFrequencyResponseDto;

  @ApiProperty({ type: MedicationDurationResponseDto })
  duration: MedicationDurationResponseDto;

  @ApiPropertyOptional()
  quantityToDispense?: number;

  @ApiPropertyOptional()
  quantityDispensed?: number;

  @ApiPropertyOptional()
  dispenseUnit?: string;

  @ApiPropertyOptional()
  instructions?: string;

  @ApiProperty()
  withFood: boolean;

  @ApiProperty()
  isContinuous: boolean;

  @ApiProperty()
  asNeeded: boolean;

  @ApiPropertyOptional()
  asNeededCondition?: string;

  @ApiProperty()
  allowGeneric: boolean;

  @ApiPropertyOptional()
  order?: number;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  isDispensed?: boolean;

  @ApiPropertyOptional()
  dispensedAt?: Date;
}

export class DrugInteractionResponseDto {
  @ApiProperty()
  drug1: string;

  @ApiProperty()
  drug2: string;

  @ApiProperty({ enum: InteractionSeverity })
  severity: InteractionSeverity;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional()
  recommendation?: string;

  @ApiProperty()
  acknowledged: boolean;
}

export class DispenseRecordResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  dispensedAt: Date;

  @ApiPropertyOptional()
  pharmacyId?: string;

  @ApiPropertyOptional()
  pharmacyName?: string;

  @ApiPropertyOptional()
  pharmacistName?: string;

  @ApiPropertyOptional()
  pharmacistCrf?: string;

  @ApiProperty({ type: [Object] })
  items: Array<{
    itemId: string;
    medicationName: string;
    quantityDispensed: number;
    batchNumber?: string;
    expirationDate?: Date;
    notes?: string;
  }>;

  @ApiPropertyOptional()
  notes?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PRESCRIPTION RESPONSE DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class PrescriptionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: PrescriptionPatientResponseDto })
  patient: PrescriptionPatientResponseDto;

  @ApiProperty({ type: PrescriptionDoctorResponseDto })
  doctor: PrescriptionDoctorResponseDto;

  @ApiProperty({ type: PrescriptionClinicResponseDto })
  clinic: PrescriptionClinicResponseDto;

  @ApiPropertyOptional()
  consultationId?: string;

  @ApiPropertyOptional()
  appointmentId?: string;

  @ApiProperty({ enum: PrescriptionType })
  type: PrescriptionType;

  @ApiProperty({ enum: PrescriptionStatus })
  status: PrescriptionStatus;

  @ApiProperty({ type: [PrescriptionItemResponseDto] })
  items: PrescriptionItemResponseDto[];

  @ApiPropertyOptional()
  diagnosis?: string;

  @ApiPropertyOptional()
  diagnosisCode?: string;

  @ApiPropertyOptional()
  generalInstructions?: string;

  @ApiPropertyOptional()
  internalNotes?: string;

  @ApiProperty()
  validityDays: number;

  @ApiPropertyOptional()
  expiresAt?: Date;

  @ApiProperty()
  isExpired: boolean;

  @ApiProperty()
  copies: number;

  @ApiProperty()
  isRenewal: boolean;

  @ApiPropertyOptional()
  originalPrescriptionId?: string;

  @ApiPropertyOptional({ type: [DrugInteractionResponseDto] })
  interactions?: DrugInteractionResponseDto[];

  @ApiProperty()
  interactionsAcknowledged: boolean;

  @ApiPropertyOptional()
  interactionAcknowledgementReason?: string;

  @ApiPropertyOptional({ type: [DispenseRecordResponseDto] })
  dispenseRecords?: DispenseRecordResponseDto[];

  @ApiPropertyOptional()
  signedAt?: Date;

  @ApiPropertyOptional()
  signatureHash?: string;

  @ApiPropertyOptional()
  cancelledAt?: Date;

  @ApiPropertyOptional()
  cancellationReason?: string;

  @ApiPropertyOptional()
  documentUrl?: string;

  @ApiPropertyOptional()
  qrCodeUrl?: string;

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

export class PrescriptionListResponseDto {
  @ApiProperty({ type: [PrescriptionResponseDto] })
  data: PrescriptionResponseDto[];

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
// MEDICATION SEARCH RESPONSE DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class MedicationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  genericName?: string;

  @ApiPropertyOptional()
  activeIngredient?: string;

  @ApiPropertyOptional()
  concentration?: string;

  @ApiPropertyOptional()
  pharmaceuticalForm?: string;

  @ApiPropertyOptional()
  manufacturer?: string;

  @ApiPropertyOptional()
  therapeuticClass?: string;

  @ApiProperty()
  isGeneric: boolean;

  @ApiProperty()
  requiresPrescription: boolean;

  @ApiPropertyOptional()
  controlledSubstanceClass?: string;

  @ApiPropertyOptional()
  presentationDescription?: string;
}

export class MedicationSearchResponseDto {
  @ApiProperty({ type: [MedicationResponseDto] })
  results: MedicationResponseDto[];

  @ApiProperty()
  total: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERACTIONS CHECK RESPONSE DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class InteractionsCheckResponseDto {
  @ApiProperty()
  hasInteractions: boolean;

  @ApiProperty()
  totalInteractions: number;

  @ApiProperty()
  criticalCount: number;

  @ApiProperty()
  majorCount: number;

  @ApiProperty()
  moderateCount: number;

  @ApiProperty()
  minorCount: number;

  @ApiProperty({ type: [DrugInteractionResponseDto] })
  interactions: DrugInteractionResponseDto[];

  @ApiPropertyOptional({ type: [String] })
  recommendations?: string[];

  @ApiProperty()
  requiresAcknowledgement: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PATIENT CURRENT MEDICATIONS RESPONSE DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class CurrentMedicationResponseDto {
  @ApiProperty()
  medicationName: string;

  @ApiPropertyOptional()
  genericName?: string;

  @ApiPropertyOptional()
  concentration?: string;

  @ApiProperty()
  dosage: string;

  @ApiProperty()
  frequency: string;

  @ApiProperty()
  route: string;

  @ApiProperty()
  isContinuous: boolean;

  @ApiPropertyOptional()
  startDate?: Date;

  @ApiPropertyOptional()
  endDate?: Date;

  @ApiPropertyOptional()
  prescribedBy?: string;

  @ApiPropertyOptional()
  prescriptionId?: string;

  @ApiPropertyOptional()
  lastDispensedAt?: Date;
}

export class PatientMedicationsResponseDto {
  @ApiProperty({ type: [CurrentMedicationResponseDto] })
  currentMedications: CurrentMedicationResponseDto[];

  @ApiProperty({ type: [PrescriptionResponseDto] })
  recentPrescriptions: PrescriptionResponseDto[];

  @ApiPropertyOptional({ type: [String] })
  allergies?: string[];

  @ApiProperty()
  total: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATISTICS RESPONSE DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class PrescriptionStatsResponseDto {
  @ApiProperty()
  totalPrescriptions: number;

  @ApiProperty()
  signedPrescriptions: number;

  @ApiProperty()
  dispensedPrescriptions: number;

  @ApiProperty()
  cancelledPrescriptions: number;

  @ApiProperty()
  expiredPrescriptions: number;

  @ApiProperty()
  renewalPrescriptions: number;

  @ApiPropertyOptional()
  byType?: Record<string, number>;

  @ApiPropertyOptional()
  byStatus?: Record<string, number>;

  @ApiPropertyOptional()
  byDoctor?: Array<{
    doctorId: string;
    doctorName: string;
    total: number;
    signed: number;
  }>;

  @ApiPropertyOptional()
  byPeriod?: Array<{
    period: string;
    total: number;
    signed: number;
    dispensed: number;
  }>;

  @ApiPropertyOptional()
  topMedications?: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;

  @ApiPropertyOptional()
  averageItemsPerPrescription?: number;

  @ApiPropertyOptional()
  interactionAlertRate?: number;

  @ApiPropertyOptional()
  controlledSubstancePercentage?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRINT/DOCUMENT RESPONSE DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class PrescriptionDocumentResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiPropertyOptional()
  documentUrl?: string;

  @ApiPropertyOptional()
  fileName?: string;

  @ApiPropertyOptional()
  fileSize?: number;

  @ApiPropertyOptional()
  format?: string;

  @ApiPropertyOptional()
  qrCodeUrl?: string;

  @ApiPropertyOptional()
  expiresAt?: Date;
}
