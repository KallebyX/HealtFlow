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

export enum PrescriptionStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  SIGNED = 'SIGNED',
  DISPENSED = 'DISPENSED',
  PARTIALLY_DISPENSED = 'PARTIALLY_DISPENSED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum PrescriptionType {
  SIMPLE = 'SIMPLE', // Receita simples
  SPECIAL_WHITE = 'SPECIAL_WHITE', // Receita especial branca (C1, C2, C5)
  SPECIAL_BLUE = 'SPECIAL_BLUE', // Receita azul (B1, B2)
  SPECIAL_YELLOW = 'SPECIAL_YELLOW', // Receita amarela (A1, A2, A3)
  ANTIMICROBIAL = 'ANTIMICROBIAL', // Receita de antimicrobianos
  SPECIAL_CONTROL = 'SPECIAL_CONTROL', // Receita de controle especial
}

export enum MedicationRoute {
  ORAL = 'ORAL',
  SUBLINGUAL = 'SUBLINGUAL',
  TOPICAL = 'TOPICAL',
  INHALATION = 'INHALATION',
  NASAL = 'NASAL',
  OPHTHALMIC = 'OPHTHALMIC',
  OTIC = 'OTIC',
  RECTAL = 'RECTAL',
  VAGINAL = 'VAGINAL',
  INTRAVENOUS = 'INTRAVENOUS',
  INTRAMUSCULAR = 'INTRAMUSCULAR',
  SUBCUTANEOUS = 'SUBCUTANEOUS',
  INTRADERMAL = 'INTRADERMAL',
  TRANSDERMAL = 'TRANSDERMAL',
}

export enum MedicationUnit {
  MG = 'MG',
  G = 'G',
  MCG = 'MCG',
  ML = 'ML',
  L = 'L',
  UI = 'UI',
  MEQ = 'MEQ',
  DROPS = 'DROPS',
  TABLETS = 'TABLETS',
  CAPSULES = 'CAPSULES',
  AMPULES = 'AMPULES',
  PUFFS = 'PUFFS',
  APPLICATIONS = 'APPLICATIONS',
}

export enum FrequencyUnit {
  HOURS = 'HOURS',
  TIMES_PER_DAY = 'TIMES_PER_DAY',
  DAYS = 'DAYS',
  WEEKS = 'WEEKS',
  MONTHS = 'MONTHS',
  AS_NEEDED = 'AS_NEEDED',
  SINGLE_DOSE = 'SINGLE_DOSE',
  CONTINUOUS = 'CONTINUOUS',
}

export enum InteractionSeverity {
  MINOR = 'MINOR',
  MODERATE = 'MODERATE',
  MAJOR = 'MAJOR',
  CONTRAINDICATED = 'CONTRAINDICATED',
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEDICATION ITEM DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class MedicationDosageDto {
  @ApiProperty({ description: 'Quantidade por dose' })
  @IsNumber()
  @Min(0.01)
  @Max(10000)
  quantity: number;

  @ApiProperty({ enum: MedicationUnit, description: 'Unidade de medida' })
  @IsEnum(MedicationUnit)
  unit: MedicationUnit;
}

export class MedicationFrequencyDto {
  @ApiProperty({ description: 'Valor da frequência' })
  @IsInt()
  @Min(1)
  @Max(24)
  value: number;

  @ApiProperty({ enum: FrequencyUnit, description: 'Unidade de frequência' })
  @IsEnum(FrequencyUnit)
  unit: FrequencyUnit;

  @ApiPropertyOptional({ description: 'Horários específicos', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specificTimes?: string[];

  @ApiPropertyOptional({ description: 'Instruções de horário' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  instructions?: string;
}

export class MedicationDurationDto {
  @ApiProperty({ description: 'Duração do tratamento' })
  @IsInt()
  @Min(1)
  @Max(365)
  value: number;

  @ApiProperty({ enum: ['DAYS', 'WEEKS', 'MONTHS', 'CONTINUOUS'], description: 'Unidade de duração' })
  @IsString()
  unit: 'DAYS' | 'WEEKS' | 'MONTHS' | 'CONTINUOUS';

  @ApiPropertyOptional({ description: 'Data de início específica' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data de término calculada' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class PrescriptionItemDto {
  @ApiPropertyOptional({ description: 'ID do medicamento no banco de dados' })
  @IsOptional()
  @IsUUID()
  medicationId?: string;

  @ApiProperty({ description: 'Nome do medicamento' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  medicationName: string;

  @ApiPropertyOptional({ description: 'Nome genérico' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  genericName?: string;

  @ApiPropertyOptional({ description: 'Princípio ativo' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  activeIngredient?: string;

  @ApiPropertyOptional({ description: 'Concentração (ex: 500mg)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  concentration?: string;

  @ApiPropertyOptional({ description: 'Forma farmacêutica (ex: comprimido, cápsula)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  pharmaceuticalForm?: string;

  @ApiPropertyOptional({ description: 'Fabricante' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  manufacturer?: string;

  @ApiProperty({ description: 'Dosagem', type: MedicationDosageDto })
  @ValidateNested()
  @Type(() => MedicationDosageDto)
  dosage: MedicationDosageDto;

  @ApiProperty({ enum: MedicationRoute, description: 'Via de administração' })
  @IsEnum(MedicationRoute)
  route: MedicationRoute;

  @ApiProperty({ description: 'Frequência', type: MedicationFrequencyDto })
  @ValidateNested()
  @Type(() => MedicationFrequencyDto)
  frequency: MedicationFrequencyDto;

  @ApiProperty({ description: 'Duração', type: MedicationDurationDto })
  @ValidateNested()
  @Type(() => MedicationDurationDto)
  duration: MedicationDurationDto;

  @ApiPropertyOptional({ description: 'Quantidade total a dispensar' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantityToDispense?: number;

  @ApiPropertyOptional({ description: 'Unidade de dispensação' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  dispenseUnit?: string;

  @ApiPropertyOptional({ description: 'Instruções especiais' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  instructions?: string;

  @ApiPropertyOptional({ description: 'Tomar com alimentação?', default: false })
  @IsOptional()
  @IsBoolean()
  withFood?: boolean;

  @ApiPropertyOptional({ description: 'Uso contínuo?', default: false })
  @IsOptional()
  @IsBoolean()
  isContinuous?: boolean;

  @ApiPropertyOptional({ description: 'Se necessário (SOS)?', default: false })
  @IsOptional()
  @IsBoolean()
  asNeeded?: boolean;

  @ApiPropertyOptional({ description: 'Condição para uso SOS' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  asNeededCondition?: string;

  @ApiPropertyOptional({ description: 'Permitir genérico?', default: true })
  @IsOptional()
  @IsBoolean()
  allowGeneric?: boolean;

  @ApiPropertyOptional({ description: 'Ordem de exibição' })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({ description: 'Observações do médico' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DRUG INTERACTION DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class DrugInteractionDto {
  @ApiProperty({ description: 'Medicamento 1' })
  @IsString()
  drug1: string;

  @ApiProperty({ description: 'Medicamento 2' })
  @IsString()
  drug2: string;

  @ApiProperty({ enum: InteractionSeverity, description: 'Severidade' })
  @IsEnum(InteractionSeverity)
  severity: InteractionSeverity;

  @ApiProperty({ description: 'Descrição da interação' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Recomendação' })
  @IsOptional()
  @IsString()
  recommendation?: string;

  @ApiPropertyOptional({ description: 'Médico foi alertado?', default: false })
  @IsOptional()
  @IsBoolean()
  acknowledged?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE PRESCRIPTION DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class CreatePrescriptionDto {
  @ApiProperty({ description: 'ID do paciente' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ description: 'ID do médico' })
  @IsUUID()
  doctorId: string;

  @ApiProperty({ description: 'ID da clínica' })
  @IsUUID()
  clinicId: string;

  @ApiPropertyOptional({ description: 'ID da consulta associada' })
  @IsOptional()
  @IsUUID()
  consultationId?: string;

  @ApiPropertyOptional({ description: 'ID do agendamento associado' })
  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @ApiProperty({ enum: PrescriptionType, description: 'Tipo de receita', default: 'SIMPLE' })
  @IsEnum(PrescriptionType)
  type: PrescriptionType;

  @ApiPropertyOptional({ enum: PrescriptionStatus, description: 'Status', default: 'DRAFT' })
  @IsOptional()
  @IsEnum(PrescriptionStatus)
  status?: PrescriptionStatus;

  @ApiProperty({ description: 'Itens da prescrição', type: [PrescriptionItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  items: PrescriptionItemDto[];

  @ApiPropertyOptional({ description: 'Diagnóstico (CID-10)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  diagnosis?: string;

  @ApiPropertyOptional({ description: 'Código CID-10' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  diagnosisCode?: string;

  @ApiPropertyOptional({ description: 'Orientações gerais' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  generalInstructions?: string;

  @ApiPropertyOptional({ description: 'Observações internas' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  internalNotes?: string;

  @ApiPropertyOptional({ description: 'Válida por (dias)', default: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  validityDays?: number;

  @ApiPropertyOptional({ description: 'Data de validade' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Número de vias/cópias' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  copies?: number;

  @ApiPropertyOptional({ description: 'É renovação?', default: false })
  @IsOptional()
  @IsBoolean()
  isRenewal?: boolean;

  @ApiPropertyOptional({ description: 'ID da prescrição original (se renovação)' })
  @IsOptional()
  @IsUUID()
  originalPrescriptionId?: string;

  @ApiPropertyOptional({ description: 'Interações detectadas', type: [DrugInteractionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DrugInteractionDto)
  interactions?: DrugInteractionDto[];

  @ApiPropertyOptional({ description: 'Ignorar alertas de interação?', default: false })
  @IsOptional()
  @IsBoolean()
  acknowledgeInteractions?: boolean;

  @ApiPropertyOptional({ description: 'Motivo para ignorar alertas' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  interactionAcknowledgementReason?: string;

  @ApiPropertyOptional({ description: 'Metadados adicionais' })
  @IsOptional()
  metadata?: Record<string, any>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE PRESCRIPTION DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class UpdatePrescriptionDto extends PartialType(CreatePrescriptionDto) {}

// ═══════════════════════════════════════════════════════════════════════════════
// SIGN PRESCRIPTION DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class SignPrescriptionDto {
  @ApiPropertyOptional({ description: 'PIN/Senha de assinatura' })
  @IsOptional()
  @IsString()
  pin?: string;

  @ApiPropertyOptional({ description: 'Token de certificado digital' })
  @IsOptional()
  @IsString()
  certificateToken?: string;

  @ApiPropertyOptional({ description: 'Confirmar interações reconhecidas?', default: true })
  @IsOptional()
  @IsBoolean()
  confirmInteractions?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DISPENSE DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class DispenseItemDto {
  @ApiProperty({ description: 'ID do item da prescrição' })
  @IsUUID()
  itemId: string;

  @ApiProperty({ description: 'Quantidade dispensada' })
  @IsNumber()
  @Min(1)
  quantityDispensed: number;

  @ApiPropertyOptional({ description: 'Lote do medicamento' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  batchNumber?: string;

  @ApiPropertyOptional({ description: 'Data de validade do medicamento' })
  @IsOptional()
  @IsDateString()
  expirationDate?: string;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}

export class DispensePrescriptionDto {
  @ApiProperty({ description: 'Itens dispensados', type: [DispenseItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DispenseItemDto)
  items: DispenseItemDto[];

  @ApiPropertyOptional({ description: 'ID da farmácia' })
  @IsOptional()
  @IsUUID()
  pharmacyId?: string;

  @ApiPropertyOptional({ description: 'Nome da farmácia' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  pharmacyName?: string;

  @ApiPropertyOptional({ description: 'Farmacêutico responsável' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  pharmacistName?: string;

  @ApiPropertyOptional({ description: 'CRF do farmacêutico' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  pharmacistCrf?: string;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CANCEL PRESCRIPTION DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class CancelPrescriptionDto {
  @ApiProperty({ description: 'Motivo do cancelamento' })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reason: string;

  @ApiPropertyOptional({ description: 'Notificar paciente?', default: true })
  @IsOptional()
  @IsBoolean()
  notifyPatient?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RENEW PRESCRIPTION DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class RenewPrescriptionDto {
  @ApiPropertyOptional({ description: 'Itens a incluir (todos se não especificado)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  itemIds?: string[];

  @ApiPropertyOptional({ description: 'Alterações nos itens', type: [PrescriptionItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  itemChanges?: PrescriptionItemDto[];

  @ApiPropertyOptional({ description: 'Nova validade (dias)', default: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  validityDays?: number;

  @ApiPropertyOptional({ description: 'Observações sobre a renovação' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEDICATION SEARCH DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class MedicationSearchDto {
  @ApiProperty({ description: 'Termo de busca' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  search: string;

  @ApiPropertyOptional({ description: 'Buscar por nome comercial', default: true })
  @IsOptional()
  @IsBoolean()
  searchCommercialName?: boolean;

  @ApiPropertyOptional({ description: 'Buscar por princípio ativo', default: true })
  @IsOptional()
  @IsBoolean()
  searchActiveIngredient?: boolean;

  @ApiPropertyOptional({ description: 'Incluir apenas genéricos', default: false })
  @IsOptional()
  @IsBoolean()
  genericOnly?: boolean;

  @ApiPropertyOptional({ description: 'Classe terapêutica' })
  @IsOptional()
  @IsString()
  therapeuticClass?: string;

  @ApiPropertyOptional({ description: 'Limite de resultados', default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHECK INTERACTIONS DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class CheckInteractionsDto {
  @ApiProperty({ description: 'Lista de medicamentos para verificar', type: [String] })
  @IsArray()
  @IsString({ each: true })
  medications: string[];

  @ApiPropertyOptional({ description: 'ID do paciente (para verificar com medicamentos atuais)' })
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiPropertyOptional({ description: 'Incluir medicamentos atuais do paciente', default: true })
  @IsOptional()
  @IsBoolean()
  includeCurrentMedications?: boolean;
}
