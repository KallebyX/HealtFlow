import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  LabOrderPriority,
  LabOrderStatus,
  SampleType,
  FastingRequirement,
} from './create-lab-order.dto';

export class LabTestItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  testCode: string;

  @ApiProperty()
  testName: string;

  @ApiPropertyOptional()
  popularName?: string;

  @ApiProperty({ enum: SampleType })
  sampleType: SampleType;

  @ApiPropertyOptional()
  requiredVolume?: number;

  @ApiPropertyOptional()
  collectionMaterial?: string;

  @ApiProperty({ enum: FastingRequirement })
  fastingRequirement: FastingRequirement;

  @ApiPropertyOptional()
  specialInstructions?: string;

  @ApiPropertyOptional()
  estimatedTurnaround?: number;

  @ApiPropertyOptional()
  clinicalIndication?: string;

  @ApiPropertyOptional()
  analysisMethod?: string;

  @ApiPropertyOptional()
  quantity?: number;

  @ApiPropertyOptional()
  status?: string;

  @ApiPropertyOptional()
  collectedAt?: Date;

  @ApiPropertyOptional()
  resultReleasedAt?: Date;

  @ApiPropertyOptional()
  tubeBarcode?: string;
}

export class PatientBasicResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  cpf: string;

  @ApiPropertyOptional()
  birthDate?: Date;

  @ApiPropertyOptional()
  gender?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  email?: string;
}

export class DoctorBasicResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  crm: string;

  @ApiPropertyOptional()
  specialty?: string;

  @ApiPropertyOptional()
  phone?: string;
}

export class ClinicBasicResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  cnpj?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  address?: string;
}

export class SampleCollectedResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  testCode: string;

  @ApiProperty({ enum: SampleType })
  sampleType: SampleType;

  @ApiProperty()
  tubeBarcode: string;

  @ApiPropertyOptional()
  volumeCollected?: number;

  @ApiPropertyOptional()
  sampleQuality?: string;

  @ApiPropertyOptional()
  collectedAt?: Date;

  @ApiPropertyOptional()
  collectorName?: string;

  @ApiPropertyOptional()
  notes?: string;
}

export class LabResultValueResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  testCode: string;

  @ApiProperty()
  parameterName: string;

  @ApiProperty()
  value: string;

  @ApiPropertyOptional()
  unit?: string;

  @ApiPropertyOptional()
  referenceMin?: string;

  @ApiPropertyOptional()
  referenceMax?: string;

  @ApiPropertyOptional()
  referenceRange?: string;

  @ApiPropertyOptional()
  flag?: string;

  @ApiPropertyOptional()
  isCritical?: boolean;

  @ApiPropertyOptional()
  method?: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  trend?: string;

  @ApiPropertyOptional()
  previousValue?: string;

  @ApiPropertyOptional()
  previousDate?: Date;
}

export class LabResultResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  labOrderId: string;

  @ApiProperty()
  testCode: string;

  @ApiProperty()
  testName: string;

  @ApiProperty({ type: [LabResultValueResponseDto] })
  values: LabResultValueResponseDto[];

  @ApiProperty()
  analysisDateTime: Date;

  @ApiPropertyOptional()
  analystId?: string;

  @ApiPropertyOptional()
  analystName?: string;

  @ApiPropertyOptional()
  validatorId?: string;

  @ApiPropertyOptional()
  validatorName?: string;

  @ApiPropertyOptional()
  validatedAt?: Date;

  @ApiPropertyOptional()
  interpretation?: string;

  @ApiPropertyOptional()
  technicalNotes?: string;

  @ApiPropertyOptional()
  equipment?: string;

  @ApiPropertyOptional()
  reagentBatch?: string;

  @ApiPropertyOptional()
  hasCriticalValue?: boolean;

  @ApiPropertyOptional()
  doctorNotified?: boolean;

  @ApiPropertyOptional()
  notificationDateTime?: Date;

  @ApiPropertyOptional()
  isPartial?: boolean;

  @ApiPropertyOptional()
  reportPdfUrl?: string;

  @ApiPropertyOptional()
  imageUrls?: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class LabOrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty({ type: PatientBasicResponseDto })
  patient: PatientBasicResponseDto;

  @ApiPropertyOptional()
  consultationId?: string;

  @ApiPropertyOptional({ type: DoctorBasicResponseDto })
  requestingDoctor?: DoctorBasicResponseDto;

  @ApiPropertyOptional({ type: ClinicBasicResponseDto })
  clinic?: ClinicBasicResponseDto;

  @ApiPropertyOptional({ type: ClinicBasicResponseDto })
  externalLab?: ClinicBasicResponseDto;

  @ApiProperty({ enum: LabOrderPriority })
  priority: LabOrderPriority;

  @ApiProperty({ enum: LabOrderStatus })
  status: LabOrderStatus;

  @ApiProperty({ type: [LabTestItemResponseDto] })
  tests: LabTestItemResponseDto[];

  @ApiPropertyOptional()
  diagnosticHypothesis?: string[];

  @ApiPropertyOptional()
  clinicalIndication?: string;

  @ApiPropertyOptional()
  labNotes?: string;

  @ApiPropertyOptional()
  preferredCollectionDate?: Date;

  @ApiPropertyOptional()
  scheduledCollectionDate?: Date;

  @ApiPropertyOptional()
  actualCollectionDate?: Date;

  @ApiPropertyOptional()
  homeCollection?: boolean;

  @ApiPropertyOptional()
  homeCollectionAddress?: string;

  @ApiPropertyOptional()
  currentMedications?: string[];

  @ApiPropertyOptional()
  relevantClinicalInfo?: string;

  @ApiPropertyOptional()
  isUrgent?: boolean;

  @ApiPropertyOptional()
  insuranceAuthCode?: string;

  @ApiPropertyOptional()
  insuranceGuideNumber?: string;

  @ApiPropertyOptional({ type: [SampleCollectedResponseDto] })
  samplesCollected?: SampleCollectedResponseDto[];

  @ApiPropertyOptional({ type: [LabResultResponseDto] })
  results?: LabResultResponseDto[];

  @ApiPropertyOptional()
  hasCriticalValues?: boolean;

  @ApiPropertyOptional()
  allResultsReleased?: boolean;

  @ApiPropertyOptional()
  collectorId?: string;

  @ApiPropertyOptional()
  collectorName?: string;

  @ApiPropertyOptional()
  externalOrderCode?: string;

  @ApiPropertyOptional()
  reportPdfUrl?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  cancelledAt?: Date;

  @ApiPropertyOptional()
  cancellationReason?: string;
}

export class LabOrderListResponseDto {
  @ApiProperty({ type: [LabOrderResponseDto] })
  data: LabOrderResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiPropertyOptional()
  summary?: LabOrderSummaryDto;
}

export class LabOrderSummaryDto {
  @ApiProperty()
  totalOrders: number;

  @ApiProperty()
  pendingCollection: number;

  @ApiProperty()
  inAnalysis: number;

  @ApiProperty()
  pendingResults: number;

  @ApiProperty()
  completed: number;

  @ApiProperty()
  urgent: number;

  @ApiProperty()
  criticalValues: number;
}

export class LabResultListResponseDto {
  @ApiProperty({ type: [LabResultResponseDto] })
  data: LabResultResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class LabTestCatalogItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  testCode: string;

  @ApiProperty()
  testName: string;

  @ApiPropertyOptional()
  popularName?: string;

  @ApiPropertyOptional()
  synonyms?: string[];

  @ApiProperty({ enum: SampleType })
  sampleType: SampleType;

  @ApiPropertyOptional()
  requiredVolume?: number;

  @ApiPropertyOptional()
  collectionMaterial?: string;

  @ApiProperty({ enum: FastingRequirement })
  fastingRequirement: FastingRequirement;

  @ApiPropertyOptional()
  specialInstructions?: string;

  @ApiPropertyOptional()
  estimatedTurnaround?: number;

  @ApiPropertyOptional()
  analysisMethod?: string;

  @ApiPropertyOptional()
  category?: string;

  @ApiPropertyOptional()
  subcategory?: string;

  @ApiPropertyOptional()
  tussCode?: string;

  @ApiPropertyOptional()
  cbhpmCode?: string;

  @ApiPropertyOptional()
  price?: number;

  @ApiPropertyOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  availableAtClinic?: boolean;

  @ApiPropertyOptional()
  requiresAppointment?: boolean;
}

export class LabTestCatalogListDto {
  @ApiProperty({ type: [LabTestCatalogItemDto] })
  data: LabTestCatalogItemDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiPropertyOptional()
  categories?: string[];
}

export class PatientLabHistoryItemDto {
  @ApiProperty()
  testCode: string;

  @ApiProperty()
  testName: string;

  @ApiProperty()
  labOrderId: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty()
  resultDate: Date;

  @ApiProperty({ type: [LabResultValueResponseDto] })
  values: LabResultValueResponseDto[];

  @ApiPropertyOptional()
  interpretation?: string;

  @ApiPropertyOptional()
  requestingDoctorName?: string;

  @ApiPropertyOptional()
  clinicName?: string;

  @ApiPropertyOptional()
  reportPdfUrl?: string;
}

export class PatientLabHistoryResponseDto {
  @ApiProperty({ type: [PatientLabHistoryItemDto] })
  data: PatientLabHistoryItemDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiPropertyOptional()
  chartData?: TestEvolutionChartDto;
}

export class TestEvolutionChartDto {
  @ApiProperty()
  testCode: string;

  @ApiProperty()
  testName: string;

  @ApiProperty()
  parameterName: string;

  @ApiPropertyOptional()
  unit?: string;

  @ApiPropertyOptional()
  referenceMin?: number;

  @ApiPropertyOptional()
  referenceMax?: number;

  @ApiProperty({ type: [TestEvolutionDataPointDto] })
  dataPoints: TestEvolutionDataPointDto[];
}

export class TestEvolutionDataPointDto {
  @ApiProperty()
  date: Date;

  @ApiProperty()
  value: number;

  @ApiPropertyOptional()
  flag?: string;

  @ApiPropertyOptional()
  labOrderId?: string;
}

export class CollectionScheduleItemDto {
  @ApiProperty()
  labOrderId: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty()
  scheduledDateTime: Date;

  @ApiProperty({ type: PatientBasicResponseDto })
  patient: PatientBasicResponseDto;

  @ApiProperty({ type: [LabTestItemResponseDto] })
  tests: LabTestItemResponseDto[];

  @ApiProperty({ enum: LabOrderPriority })
  priority: LabOrderPriority;

  @ApiPropertyOptional()
  isHomeCollection?: boolean;

  @ApiPropertyOptional()
  homeAddress?: string;

  @ApiPropertyOptional()
  collectorId?: string;

  @ApiPropertyOptional()
  collectorName?: string;

  @ApiPropertyOptional()
  fastingRequired?: boolean;

  @ApiPropertyOptional()
  fastingHours?: number;

  @ApiPropertyOptional()
  specialInstructions?: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  status?: string;
}

export class CollectionScheduleResponseDto {
  @ApiProperty({ type: [CollectionScheduleItemDto] })
  data: CollectionScheduleItemDto[];

  @ApiProperty()
  total: number;

  @ApiPropertyOptional()
  date?: string;

  @ApiPropertyOptional()
  homeCollections?: number;

  @ApiPropertyOptional()
  inLabCollections?: number;
}

export class WorklistItemDto {
  @ApiProperty()
  labOrderId: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty()
  testCode: string;

  @ApiProperty()
  testName: string;

  @ApiProperty()
  tubeBarcode: string;

  @ApiProperty({ enum: SampleType })
  sampleType: SampleType;

  @ApiProperty({ type: PatientBasicResponseDto })
  patient: PatientBasicResponseDto;

  @ApiProperty({ enum: LabOrderPriority })
  priority: LabOrderPriority;

  @ApiPropertyOptional()
  isUrgent?: boolean;

  @ApiPropertyOptional()
  collectedAt?: Date;

  @ApiPropertyOptional()
  receivedAt?: Date;

  @ApiPropertyOptional()
  sector?: string;

  @ApiPropertyOptional()
  equipment?: string;

  @ApiPropertyOptional()
  position?: number;

  @ApiPropertyOptional()
  estimatedCompletionTime?: Date;
}

export class WorklistResponseDto {
  @ApiProperty({ type: [WorklistItemDto] })
  data: WorklistItemDto[];

  @ApiProperty()
  total: number;

  @ApiPropertyOptional()
  urgent?: number;

  @ApiPropertyOptional()
  routine?: number;

  @ApiPropertyOptional()
  sector?: string;
}

export class CriticalValueAlertDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  labOrderId: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty({ type: PatientBasicResponseDto })
  patient: PatientBasicResponseDto;

  @ApiPropertyOptional({ type: DoctorBasicResponseDto })
  requestingDoctor?: DoctorBasicResponseDto;

  @ApiProperty()
  testCode: string;

  @ApiProperty()
  testName: string;

  @ApiProperty()
  parameterName: string;

  @ApiProperty()
  value: string;

  @ApiPropertyOptional()
  unit?: string;

  @ApiPropertyOptional()
  referenceRange?: string;

  @ApiProperty()
  flag: string;

  @ApiProperty()
  detectedAt: Date;

  @ApiPropertyOptional()
  notifiedAt?: Date;

  @ApiPropertyOptional()
  notifiedTo?: string;

  @ApiPropertyOptional()
  notificationMethod?: string;

  @ApiPropertyOptional()
  acknowledged?: boolean;

  @ApiPropertyOptional()
  acknowledgedBy?: string;

  @ApiPropertyOptional()
  acknowledgedAt?: Date;

  @ApiPropertyOptional()
  notes?: string;
}

export class CriticalValuesResponseDto {
  @ApiProperty({ type: [CriticalValueAlertDto] })
  data: CriticalValueAlertDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  unnotified: number;

  @ApiProperty()
  unacknowledged: number;
}

export class LabStatisticsResponseDto {
  @ApiProperty()
  period: {
    start: Date;
    end: Date;
  };

  @ApiProperty()
  totalOrders: number;

  @ApiProperty()
  totalTests: number;

  @ApiProperty()
  completedOrders: number;

  @ApiProperty()
  cancelledOrders: number;

  @ApiProperty()
  urgentOrders: number;

  @ApiPropertyOptional()
  ordersByStatus?: Record<string, number>;

  @ApiPropertyOptional()
  ordersByPriority?: Record<string, number>;

  @ApiPropertyOptional()
  topTests?: Array<{
    testCode: string;
    testName: string;
    count: number;
  }>;

  @ApiPropertyOptional()
  turnaroundTime?: {
    average: number;
    median: number;
    p90: number;
    unit: string;
  };

  @ApiPropertyOptional()
  rejectionRate?: {
    total: number;
    rate: number;
    byReason?: Record<string, number>;
  };

  @ApiPropertyOptional()
  criticalValuesCount?: number;

  @ApiPropertyOptional()
  homeCollectionsCount?: number;

  @ApiPropertyOptional()
  dailyBreakdown?: Array<{
    date: string;
    orders: number;
    tests: number;
    completed: number;
  }>;
}

export class SampleRejectionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  labOrderId: string;

  @ApiProperty()
  testCode: string;

  @ApiProperty()
  testName: string;

  @ApiProperty()
  rejectionReason: string;

  @ApiPropertyOptional()
  rejectionDetails?: string;

  @ApiProperty()
  requiresNewCollection: boolean;

  @ApiPropertyOptional()
  rejectedBy?: string;

  @ApiProperty()
  rejectedAt: Date;

  @ApiPropertyOptional()
  newCollectionScheduled?: boolean;

  @ApiPropertyOptional()
  newCollectionDate?: Date;
}

export class ExternalLabResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  cnpj: string;

  @ApiPropertyOptional()
  cnes?: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  contactPerson?: string;

  @ApiPropertyOptional()
  supportedTests?: string[];

  @ApiPropertyOptional()
  integrationMethod?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;
}

export class ExternalLabListResponseDto {
  @ApiProperty({ type: [ExternalLabResponseDto] })
  data: ExternalLabResponseDto[];

  @ApiProperty()
  total: number;
}

export class PreparationInstructionsResponseDto {
  @ApiProperty()
  testCode: string;

  @ApiProperty()
  testName: string;

  @ApiProperty({ enum: FastingRequirement })
  fastingRequirement: FastingRequirement;

  @ApiPropertyOptional()
  fastingHours?: number;

  @ApiPropertyOptional()
  generalInstructions?: string;

  @ApiPropertyOptional()
  dietaryRestrictions?: string[];

  @ApiPropertyOptional()
  medicationRestrictions?: string[];

  @ApiPropertyOptional()
  activityRestrictions?: string[];

  @ApiPropertyOptional()
  specialInstructions?: string;

  @ApiPropertyOptional()
  collectionTime?: string;

  @ApiPropertyOptional()
  sampleType?: SampleType;

  @ApiPropertyOptional()
  collectionMaterial?: string;
}
