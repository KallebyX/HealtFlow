import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsArray,
  ValidateNested,
  IsNumber,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

// ═══════════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════════

export enum ConsultationStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SIGNED = 'SIGNED',
  AMENDED = 'AMENDED',
}

export enum ConsultationType {
  INITIAL = 'INITIAL',
  FOLLOW_UP = 'FOLLOW_UP',
  RETURN = 'RETURN',
  EMERGENCY = 'EMERGENCY',
  TELEMEDICINE = 'TELEMEDICINE',
  PRE_OPERATIVE = 'PRE_OPERATIVE',
  POST_OPERATIVE = 'POST_OPERATIVE',
}

export enum DiagnosisType {
  PRINCIPAL = 'PRINCIPAL',
  SECONDARY = 'SECONDARY',
  DIFFERENTIAL = 'DIFFERENTIAL',
  WORKING = 'WORKING',
  RULED_OUT = 'RULED_OUT',
}

export enum ConductType {
  MEDICATION = 'MEDICATION',
  PROCEDURE = 'PROCEDURE',
  EXAM = 'EXAM',
  REFERRAL = 'REFERRAL',
  HOSPITALIZATION = 'HOSPITALIZATION',
  OBSERVATION = 'OBSERVATION',
  LIFESTYLE = 'LIFESTYLE',
  RETURN = 'RETURN',
  DISCHARGE = 'DISCHARGE',
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANAMNESE (HISTÓRIA CLÍNICA)
// ═══════════════════════════════════════════════════════════════════════════════

export class ChiefComplaintDto {
  @ApiProperty({ description: 'Queixa principal' })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  description: string;

  @ApiPropertyOptional({ description: 'Duração dos sintomas' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  duration?: string;

  @ApiPropertyOptional({ description: 'Intensidade (1-10)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  intensity?: number;

  @ApiPropertyOptional({ description: 'Fatores de piora' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  worseningFactors?: string;

  @ApiPropertyOptional({ description: 'Fatores de melhora' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  improvingFactors?: string;
}

export class HistoryOfPresentIllnessDto {
  @ApiProperty({ description: 'História da doença atual' })
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description: string;

  @ApiPropertyOptional({ description: 'Início dos sintomas' })
  @IsOptional()
  @IsDateString()
  onset?: string;

  @ApiPropertyOptional({ description: 'Evolução' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  evolution?: string;

  @ApiPropertyOptional({ description: 'Tratamentos anteriores' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  previousTreatments?: string;
}

export class PastMedicalHistoryDto {
  @ApiPropertyOptional({ description: 'Doenças prévias', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  diseases?: string[];

  @ApiPropertyOptional({ description: 'Cirurgias anteriores', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  surgeries?: string[];

  @ApiPropertyOptional({ description: 'Internações anteriores', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hospitalizations?: string[];

  @ApiPropertyOptional({ description: 'Traumatismos', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  traumas?: string[];

  @ApiPropertyOptional({ description: 'Transfusões sanguíneas' })
  @IsOptional()
  @IsBoolean()
  bloodTransfusions?: boolean;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class FamilyHistoryDto {
  @ApiPropertyOptional({ description: 'Pai' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  father?: string;

  @ApiPropertyOptional({ description: 'Mãe' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  mother?: string;

  @ApiPropertyOptional({ description: 'Irmãos' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  siblings?: string;

  @ApiPropertyOptional({ description: 'Avós' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  grandparents?: string;

  @ApiPropertyOptional({ description: 'Doenças familiares', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  familyDiseases?: string[];

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class SocialHistoryDto {
  @ApiPropertyOptional({ description: 'Tabagismo' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  smoking?: string;

  @ApiPropertyOptional({ description: 'Etilismo' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  alcohol?: string;

  @ApiPropertyOptional({ description: 'Drogas ilícitas' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  drugs?: string;

  @ApiPropertyOptional({ description: 'Atividade física' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  physicalActivity?: string;

  @ApiPropertyOptional({ description: 'Alimentação' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  diet?: string;

  @ApiPropertyOptional({ description: 'Ocupação' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  occupation?: string;

  @ApiPropertyOptional({ description: 'Estado civil' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  maritalStatus?: string;

  @ApiPropertyOptional({ description: 'Moradia' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  housing?: string;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class ReviewOfSystemsDto {
  @ApiPropertyOptional({ description: 'Geral' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  general?: string;

  @ApiPropertyOptional({ description: 'Pele' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  skin?: string;

  @ApiPropertyOptional({ description: 'Cabeça' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  head?: string;

  @ApiPropertyOptional({ description: 'Olhos' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  eyes?: string;

  @ApiPropertyOptional({ description: 'Ouvidos' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  ears?: string;

  @ApiPropertyOptional({ description: 'Nariz' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  nose?: string;

  @ApiPropertyOptional({ description: 'Garganta' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  throat?: string;

  @ApiPropertyOptional({ description: 'Cardiovascular' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cardiovascular?: string;

  @ApiPropertyOptional({ description: 'Respiratório' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  respiratory?: string;

  @ApiPropertyOptional({ description: 'Gastrointestinal' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  gastrointestinal?: string;

  @ApiPropertyOptional({ description: 'Genitourinário' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  genitourinary?: string;

  @ApiPropertyOptional({ description: 'Musculoesquelético' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  musculoskeletal?: string;

  @ApiPropertyOptional({ description: 'Neurológico' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  neurological?: string;

  @ApiPropertyOptional({ description: 'Psiquiátrico' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  psychiatric?: string;

  @ApiPropertyOptional({ description: 'Endócrino' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  endocrine?: string;

  @ApiPropertyOptional({ description: 'Hematológico' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  hematologic?: string;

  @ApiPropertyOptional({ description: 'Alérgico/Imunológico' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  allergicImmunologic?: string;
}

export class AnamnesisDto {
  @ApiProperty({ description: 'Queixa principal', type: ChiefComplaintDto })
  @ValidateNested()
  @Type(() => ChiefComplaintDto)
  chiefComplaint: ChiefComplaintDto;

  @ApiPropertyOptional({ description: 'História da doença atual', type: HistoryOfPresentIllnessDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => HistoryOfPresentIllnessDto)
  historyOfPresentIllness?: HistoryOfPresentIllnessDto;

  @ApiPropertyOptional({ description: 'Antecedentes pessoais', type: PastMedicalHistoryDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PastMedicalHistoryDto)
  pastMedicalHistory?: PastMedicalHistoryDto;

  @ApiPropertyOptional({ description: 'Antecedentes familiares', type: FamilyHistoryDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FamilyHistoryDto)
  familyHistory?: FamilyHistoryDto;

  @ApiPropertyOptional({ description: 'História social', type: SocialHistoryDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SocialHistoryDto)
  socialHistory?: SocialHistoryDto;

  @ApiPropertyOptional({ description: 'Revisão por sistemas', type: ReviewOfSystemsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReviewOfSystemsDto)
  reviewOfSystems?: ReviewOfSystemsDto;

  @ApiPropertyOptional({ description: 'Alergias conhecidas', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @ApiPropertyOptional({ description: 'Medicamentos em uso', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  currentMedications?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAME FÍSICO
// ═══════════════════════════════════════════════════════════════════════════════

export class VitalSignsDto {
  @ApiPropertyOptional({ description: 'Pressão arterial sistólica (mmHg)' })
  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(300)
  systolicBP?: number;

  @ApiPropertyOptional({ description: 'Pressão arterial diastólica (mmHg)' })
  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(200)
  diastolicBP?: number;

  @ApiPropertyOptional({ description: 'Frequência cardíaca (bpm)' })
  @IsOptional()
  @IsInt()
  @Min(20)
  @Max(300)
  heartRate?: number;

  @ApiPropertyOptional({ description: 'Frequência respiratória (ipm)' })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(60)
  respiratoryRate?: number;

  @ApiPropertyOptional({ description: 'Temperatura (°C)' })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(45)
  temperature?: number;

  @ApiPropertyOptional({ description: 'Saturação de O2 (%)' })
  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(100)
  oxygenSaturation?: number;

  @ApiPropertyOptional({ description: 'Peso (kg)' })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(500)
  weight?: number;

  @ApiPropertyOptional({ description: 'Altura (cm)' })
  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(300)
  height?: number;

  @ApiPropertyOptional({ description: 'IMC calculado' })
  @IsOptional()
  @IsNumber()
  bmi?: number;

  @ApiPropertyOptional({ description: 'Circunferência abdominal (cm)' })
  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(300)
  waistCircumference?: number;

  @ApiPropertyOptional({ description: 'Glicemia capilar (mg/dL)' })
  @IsOptional()
  @IsInt()
  @Min(20)
  @Max(600)
  bloodGlucose?: number;

  @ApiPropertyOptional({ description: 'Escala de dor (0-10)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  painScale?: number;
}

export class PhysicalExamSystemDto {
  @ApiProperty({ description: 'Sistema examinado' })
  @IsString()
  system: string;

  @ApiProperty({ description: 'Achados' })
  @IsString()
  @MaxLength(2000)
  findings: string;

  @ApiPropertyOptional({ description: 'Normal?', default: true })
  @IsOptional()
  @IsBoolean()
  isNormal?: boolean;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class PhysicalExaminationDto {
  @ApiPropertyOptional({ description: 'Sinais vitais', type: VitalSignsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VitalSignsDto)
  vitalSigns?: VitalSignsDto;

  @ApiPropertyOptional({ description: 'Aspecto geral' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  generalAppearance?: string;

  @ApiPropertyOptional({ description: 'Estado geral' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  generalCondition?: string;

  @ApiPropertyOptional({ description: 'Nível de consciência' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  consciousness?: string;

  @ApiPropertyOptional({ description: 'Exame por sistemas', type: [PhysicalExamSystemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhysicalExamSystemDto)
  systemExams?: PhysicalExamSystemDto[];

  @ApiPropertyOptional({ description: 'Exame da pele' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  skin?: string;

  @ApiPropertyOptional({ description: 'Exame da cabeça e pescoço' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  headNeck?: string;

  @ApiPropertyOptional({ description: 'Exame do tórax' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  thorax?: string;

  @ApiPropertyOptional({ description: 'Exame cardiovascular' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  cardiovascular?: string;

  @ApiPropertyOptional({ description: 'Exame respiratório' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  respiratory?: string;

  @ApiPropertyOptional({ description: 'Exame abdominal' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  abdomen?: string;

  @ApiPropertyOptional({ description: 'Exame neurológico' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  neurological?: string;

  @ApiPropertyOptional({ description: 'Exame osteoarticular' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  musculoskeletal?: string;

  @ApiPropertyOptional({ description: 'Exame dos membros' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  extremities?: string;

  @ApiPropertyOptional({ description: 'Exame do aparelho locomotor' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  locomotor?: string;

  @ApiPropertyOptional({ description: 'Observações adicionais' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  additionalNotes?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DIAGNÓSTICO
// ═══════════════════════════════════════════════════════════════════════════════

export class DiagnosisDto {
  @ApiProperty({ description: 'Código CID-10' })
  @IsString()
  @MaxLength(10)
  code: string;

  @ApiProperty({ description: 'Descrição do diagnóstico' })
  @IsString()
  @MaxLength(500)
  description: string;

  @ApiProperty({ enum: DiagnosisType, description: 'Tipo de diagnóstico' })
  @IsEnum(DiagnosisType)
  type: DiagnosisType;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Data do diagnóstico' })
  @IsOptional()
  @IsDateString()
  diagnosisDate?: string;

  @ApiPropertyOptional({ description: 'Confirmado?', default: false })
  @IsOptional()
  @IsBoolean()
  isConfirmed?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONDUTA
// ═══════════════════════════════════════════════════════════════════════════════

export class ConductDto {
  @ApiProperty({ enum: ConductType, description: 'Tipo de conduta' })
  @IsEnum(ConductType)
  type: ConductType;

  @ApiProperty({ description: 'Descrição da conduta' })
  @IsString()
  @MaxLength(2000)
  description: string;

  @ApiPropertyOptional({ description: 'Justificativa' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  justification?: string;

  @ApiPropertyOptional({ description: 'Prioridade (1=baixa, 5=urgente)', default: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  priority?: number;

  @ApiPropertyOptional({ description: 'ID do encaminhamento (se referral)' })
  @IsOptional()
  @IsUUID()
  referralId?: string;

  @ApiPropertyOptional({ description: 'Especialidade de encaminhamento' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  referralSpecialty?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SOAP NOTES
// ═══════════════════════════════════════════════════════════════════════════════

export class SOAPNoteDto {
  @ApiPropertyOptional({ description: 'Subjetivo (S)' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  subjective?: string;

  @ApiPropertyOptional({ description: 'Objetivo (O)' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  objective?: string;

  @ApiPropertyOptional({ description: 'Avaliação (A)' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  assessment?: string;

  @ApiPropertyOptional({ description: 'Plano (P)' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  plan?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ATESTADOS E DOCUMENTOS
// ═══════════════════════════════════════════════════════════════════════════════

export class MedicalCertificateDto {
  @ApiProperty({ description: 'Tipo de atestado', enum: ['SICK_LEAVE', 'FITNESS', 'COMPANION', 'CUSTOM'] })
  @IsString()
  type: 'SICK_LEAVE' | 'FITNESS' | 'COMPANION' | 'CUSTOM';

  @ApiPropertyOptional({ description: 'Dias de afastamento' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number;

  @ApiPropertyOptional({ description: 'Data de início' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data de término' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'CID-10 (opcional)' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  cidCode?: string;

  @ApiPropertyOptional({ description: 'Texto do atestado' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  text?: string;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class MedicalReferralDto {
  @ApiProperty({ description: 'Especialidade de destino' })
  @IsString()
  @MaxLength(100)
  specialty: string;

  @ApiPropertyOptional({ description: 'Médico específico' })
  @IsOptional()
  @IsUUID()
  toDoctorId?: string;

  @ApiProperty({ description: 'Motivo do encaminhamento' })
  @IsString()
  @MaxLength(2000)
  reason: string;

  @ApiPropertyOptional({ description: 'Urgência', enum: ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'] })
  @IsOptional()
  @IsString()
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';

  @ApiPropertyOptional({ description: 'Informações clínicas relevantes' })
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  clinicalInformation?: string;

  @ApiPropertyOptional({ description: 'Hipótese diagnóstica' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  diagnosticHypothesis?: string;

  @ApiPropertyOptional({ description: 'Exames anexados', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachedExams?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// ARQUIVO/ANEXO
// ═══════════════════════════════════════════════════════════════════════════════

export class AttachmentDto {
  @ApiProperty({ description: 'Nome do arquivo' })
  @IsString()
  @MaxLength(200)
  fileName: string;

  @ApiProperty({ description: 'Tipo do arquivo' })
  @IsString()
  @MaxLength(100)
  fileType: string;

  @ApiProperty({ description: 'URL do arquivo' })
  @IsString()
  fileUrl: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Categoria', enum: ['EXAM', 'IMAGE', 'DOCUMENT', 'OTHER'] })
  @IsOptional()
  @IsString()
  category?: 'EXAM' | 'IMAGE' | 'DOCUMENT' | 'OTHER';
}

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE CONSULTATION DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class CreateConsultationDto {
  @ApiProperty({ description: 'ID do agendamento' })
  @IsUUID()
  appointmentId: string;

  @ApiProperty({ description: 'ID do paciente' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ description: 'ID do médico' })
  @IsUUID()
  doctorId: string;

  @ApiProperty({ description: 'ID da clínica' })
  @IsUUID()
  clinicId: string;

  @ApiPropertyOptional({ enum: ConsultationType, description: 'Tipo de consulta' })
  @IsOptional()
  @IsEnum(ConsultationType)
  type?: ConsultationType;

  @ApiPropertyOptional({ enum: ConsultationStatus, description: 'Status', default: 'IN_PROGRESS' })
  @IsOptional()
  @IsEnum(ConsultationStatus)
  status?: ConsultationStatus;

  @ApiPropertyOptional({ description: 'Anamnese', type: AnamnesisDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AnamnesisDto)
  anamnesis?: AnamnesisDto;

  @ApiPropertyOptional({ description: 'Exame físico', type: PhysicalExaminationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PhysicalExaminationDto)
  physicalExamination?: PhysicalExaminationDto;

  @ApiPropertyOptional({ description: 'Diagnósticos', type: [DiagnosisDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiagnosisDto)
  diagnoses?: DiagnosisDto[];

  @ApiPropertyOptional({ description: 'Condutas', type: [ConductDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConductDto)
  conducts?: ConductDto[];

  @ApiPropertyOptional({ description: 'SOAP Note', type: SOAPNoteDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SOAPNoteDto)
  soapNote?: SOAPNoteDto;

  @ApiPropertyOptional({ description: 'Evolução clínica' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  clinicalEvolution?: string;

  @ApiPropertyOptional({ description: 'Resumo da consulta' })
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  summary?: string;

  @ApiPropertyOptional({ description: 'Orientações ao paciente' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  patientInstructions?: string;

  @ApiPropertyOptional({ description: 'Observações internas' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  internalNotes?: string;

  @ApiPropertyOptional({ description: 'Atestados', type: [MedicalCertificateDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicalCertificateDto)
  certificates?: MedicalCertificateDto[];

  @ApiPropertyOptional({ description: 'Encaminhamentos', type: [MedicalReferralDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicalReferralDto)
  referrals?: MedicalReferralDto[];

  @ApiPropertyOptional({ description: 'Anexos', type: [AttachmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];

  @ApiPropertyOptional({ description: 'Necessita retorno?', default: false })
  @IsOptional()
  @IsBoolean()
  needsFollowUp?: boolean;

  @ApiPropertyOptional({ description: 'Dias para retorno' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  followUpDays?: number;

  @ApiPropertyOptional({ description: 'Metadados adicionais' })
  @IsOptional()
  metadata?: Record<string, any>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE CONSULTATION DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class UpdateConsultationDto extends PartialType(CreateConsultationDto) {}

// ═══════════════════════════════════════════════════════════════════════════════
// SIGN CONSULTATION DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class SignConsultationDto {
  @ApiPropertyOptional({ description: 'PIN/Senha de assinatura' })
  @IsOptional()
  @IsString()
  pin?: string;

  @ApiPropertyOptional({ description: 'Token de certificado digital' })
  @IsOptional()
  @IsString()
  certificateToken?: string;

  @ApiPropertyOptional({ description: 'Confirmar dados?', default: true })
  @IsOptional()
  @IsBoolean()
  confirmData?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AMEND CONSULTATION DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class AmendConsultationDto {
  @ApiProperty({ description: 'Motivo da retificação' })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reason: string;

  @ApiProperty({ description: 'Alterações realizadas' })
  @ValidateNested()
  @Type(() => UpdateConsultationDto)
  changes: UpdateConsultationDto;
}
