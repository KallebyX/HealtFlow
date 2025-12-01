import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  IsNumber,
  IsDateString,
  ValidateNested,
  Min,
  Max,
  MaxLength,
  MinLength,
  Matches,
  IsMobilePhone,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, BloodType, MaritalStatus } from '@prisma/client';

// ═══════════════════════════════════════════════════════════════════════════════
// NESTED DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class AddressDto {
  @ApiProperty({ example: 'Rua das Flores', description: 'Nome da rua' })
  @IsString()
  @MaxLength(255)
  street: string;

  @ApiProperty({ example: '123' })
  @IsString()
  @MaxLength(20)
  number: string;

  @ApiPropertyOptional({ example: 'Apto 101' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  complement?: string;

  @ApiProperty({ example: 'Centro' })
  @IsString()
  @MaxLength(100)
  neighborhood: string;

  @ApiProperty({ example: 'São Paulo' })
  @IsString()
  @MaxLength(100)
  city: string;

  @ApiProperty({ example: 'SP' })
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  state: string;

  @ApiProperty({ example: '01234-567' })
  @IsString()
  @Matches(/^\d{5}-?\d{3}$/, { message: 'CEP inválido' })
  zipCode: string;

  @ApiProperty({ example: 'BR', default: 'BR' })
  @IsString()
  @MaxLength(2)
  country: string = 'BR';

  @ApiPropertyOptional({ example: -23.5505, description: 'Latitude' })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ example: -46.6333, description: 'Longitude' })
  @IsOptional()
  @IsNumber()
  lng?: number;
}

export class EmergencyContactDto {
  @ApiProperty({ example: 'Maria da Silva' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: '+5511999999999' })
  @IsString()
  @MaxLength(20)
  phone: string;

  @ApiProperty({ example: 'Mãe' })
  @IsString()
  @MaxLength(50)
  relationship: string;

  @ApiPropertyOptional({ example: 'joao@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class HealthInsuranceInfoDto {
  @ApiProperty({ example: 'Unimed' })
  @IsString()
  @MaxLength(100)
  provider: string;

  @ApiProperty({ example: 'Plano Ouro' })
  @IsString()
  @MaxLength(100)
  planName: string;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  @MaxLength(50)
  cardNumber: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  validity?: string;

  @ApiPropertyOptional({ example: 'Acomodação apartamento' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  accommodationType?: string;
}

export class CurrentMedicationDto {
  @ApiProperty({ example: 'Losartana' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: '50mg' })
  @IsString()
  @MaxLength(50)
  dosage: string;

  @ApiProperty({ example: '1x ao dia' })
  @IsString()
  @MaxLength(100)
  frequency: string;

  @ApiPropertyOptional({ example: 'Hipertensão' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;

  @ApiPropertyOptional({ example: '2023-01-15' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: 'Dr. João' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  prescribedBy?: string;
}

export class FamilyHistoryItemDto {
  @ApiProperty({ example: 'Diabetes Tipo 2' })
  @IsString()
  @MaxLength(255)
  condition: string;

  @ApiProperty({ example: 'Pai' })
  @IsString()
  @MaxLength(50)
  relationship: string;

  @ApiPropertyOptional({ example: 'Diagnosticado aos 50 anos' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isDeceased?: boolean;

  @ApiPropertyOptional({ example: 75 })
  @IsOptional()
  @IsNumber()
  ageAtDiagnosis?: number;
}

export class SurgicalHistoryItemDto {
  @ApiProperty({ example: 'Apendicectomia' })
  @IsString()
  @MaxLength(255)
  procedure: string;

  @ApiProperty({ example: '2015' })
  @IsString()
  @MaxLength(10)
  year: string;

  @ApiPropertyOptional({ example: 'Hospital São Paulo' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  hospital?: string;

  @ApiPropertyOptional({ example: 'Sem complicações' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ example: 'Dr. Carlos' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  surgeon?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE PATIENT DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class CreatePatientDto {
  // ═══════════════════════════════════════════════════════════════════════════
  // DADOS OBRIGATÓRIOS
  // ═══════════════════════════════════════════════════════════════════════════

  @ApiProperty({ example: '123.456.789-00', description: 'CPF do paciente' })
  @IsString()
  @Matches(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, { message: 'CPF inválido' })
  cpf: string;

  @ApiProperty({ example: 'João da Silva Santos', description: 'Nome completo' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  fullName: string;

  @ApiProperty({ example: '1990-05-15', description: 'Data de nascimento' })
  @IsDateString()
  birthDate: string;

  @ApiProperty({ enum: Gender, example: Gender.MALE })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ example: '+5511999999999', description: 'Telefone principal' })
  @IsString()
  @MaxLength(20)
  phone: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // DOCUMENTOS
  // ═══════════════════════════════════════════════════════════════════════════

  @ApiPropertyOptional({ example: '12.345.678-9', description: 'RG' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  rg?: string;

  @ApiPropertyOptional({ example: 'SSP-SP', description: 'Órgão emissor do RG' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  rgIssuer?: string;

  @ApiPropertyOptional({ example: '123456789012345', description: 'CNS - Cartão Nacional de Saúde' })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  @Matches(/^\d{15}$/, { message: 'CNS deve ter 15 dígitos' })
  cns?: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // DADOS PESSOAIS OPCIONAIS
  // ═══════════════════════════════════════════════════════════════════════════

  @ApiPropertyOptional({ example: 'João', description: 'Nome social' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  socialName?: string;

  @ApiPropertyOptional({ enum: MaritalStatus, example: MaritalStatus.SINGLE })
  @IsOptional()
  @IsEnum(MaritalStatus)
  maritalStatus?: MaritalStatus;

  @ApiPropertyOptional({ example: 'Brasileiro' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nationality?: string;

  @ApiPropertyOptional({ example: 'São Paulo - SP' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  birthPlace?: string;

  @ApiPropertyOptional({ example: 'Maria das Graças' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  motherName?: string;

  @ApiPropertyOptional({ example: 'José da Silva' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fatherName?: string;

  @ApiPropertyOptional({ example: 'Engenheiro de Software' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  occupation?: string;

  @ApiPropertyOptional({ example: '+5511988888888', description: 'Telefone secundário' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  secondaryPhone?: string;

  @ApiPropertyOptional({ example: 'joao@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // BIOMETRIA
  // ═══════════════════════════════════════════════════════════════════════════

  @ApiPropertyOptional({ example: 175, description: 'Altura em centímetros' })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(300)
  height?: number;

  @ApiPropertyOptional({ example: 70, description: 'Peso em kg' })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(500)
  weight?: number;

  @ApiPropertyOptional({ enum: BloodType, example: BloodType.O_POSITIVE })
  @IsOptional()
  @IsEnum(BloodType)
  bloodType?: BloodType;

  // ═══════════════════════════════════════════════════════════════════════════
  // ENDEREÇO
  // ═══════════════════════════════════════════════════════════════════════════

  @ApiPropertyOptional({ type: AddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTATO DE EMERGÊNCIA
  // ═══════════════════════════════════════════════════════════════════════════

  @ApiPropertyOptional({ type: EmergencyContactDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact?: EmergencyContactDto;

  // ═══════════════════════════════════════════════════════════════════════════
  // CONVÊNIO
  // ═══════════════════════════════════════════════════════════════════════════

  @ApiPropertyOptional({ description: 'ID do convênio cadastrado' })
  @IsOptional()
  @IsString()
  healthInsuranceId?: string;

  @ApiPropertyOptional({ example: '1234567890', description: 'Número da carteirinha' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  insuranceNumber?: string;

  @ApiPropertyOptional({ example: '2025-12-31', description: 'Validade do convênio' })
  @IsOptional()
  @IsDateString()
  insuranceValidUntil?: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // DADOS MÉDICOS
  // ═══════════════════════════════════════════════════════════════════════════

  @ApiPropertyOptional({ example: ['Penicilina', 'Dipirona'], description: 'Alergias conhecidas' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @ApiPropertyOptional({ example: ['Hipertensão', 'Diabetes'], description: 'Condições crônicas' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  chronicConditions?: string[];

  @ApiPropertyOptional({ type: [CurrentMedicationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CurrentMedicationDto)
  currentMedications?: CurrentMedicationDto[];

  @ApiPropertyOptional({ type: [FamilyHistoryItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FamilyHistoryItemDto)
  familyHistory?: FamilyHistoryItemDto[];

  @ApiPropertyOptional({ type: [SurgicalHistoryItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SurgicalHistoryItemDto)
  surgicalHistory?: SurgicalHistoryItemDto[];

  // ═══════════════════════════════════════════════════════════════════════════
  // ESTILO DE VIDA
  // ═══════════════════════════════════════════════════════════════════════════

  @ApiPropertyOptional({
    example: 'never',
    description: 'Status de tabagismo',
    enum: ['never', 'former', 'current', 'occasional'],
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  smokingStatus?: string;

  @ApiPropertyOptional({
    example: 'social',
    description: 'Consumo de álcool',
    enum: ['never', 'occasional', 'social', 'regular', 'heavy'],
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  alcoholConsumption?: string;

  @ApiPropertyOptional({
    example: 'regular',
    description: 'Nível de atividade física',
    enum: ['sedentary', 'light', 'moderate', 'regular', 'intense'],
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  physicalActivity?: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // PREFERÊNCIAS
  // ═══════════════════════════════════════════════════════════════════════════

  @ApiPropertyOptional({ example: 'pt-BR', default: 'pt-BR' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  preferredLanguage?: string;

  @ApiPropertyOptional({ example: 'America/Sao_Paulo', default: 'America/Sao_Paulo' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  preferredTimezone?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE PATIENT DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class UpdatePatientDto {
  @ApiPropertyOptional({ example: 'João da Silva Santos' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  fullName?: string;

  @ApiPropertyOptional({ example: 'João' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  socialName?: string;

  @ApiPropertyOptional({ example: '+5511999999999' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: '+5511988888888' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  secondaryPhone?: string;

  @ApiPropertyOptional({ example: 'joao@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '12.345.678-9' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  rg?: string;

  @ApiPropertyOptional({ example: 'SSP-SP' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  rgIssuer?: string;

  @ApiPropertyOptional({ example: '123456789012345' })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  cns?: string;

  @ApiPropertyOptional({ enum: MaritalStatus })
  @IsOptional()
  @IsEnum(MaritalStatus)
  maritalStatus?: MaritalStatus;

  @ApiPropertyOptional({ example: 'Engenheiro de Software' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  occupation?: string;

  @ApiPropertyOptional({ example: 175 })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(300)
  height?: number;

  @ApiPropertyOptional({ example: 70 })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(500)
  weight?: number;

  @ApiPropertyOptional({ enum: BloodType })
  @IsOptional()
  @IsEnum(BloodType)
  bloodType?: BloodType;

  @ApiPropertyOptional({ type: AddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({ type: EmergencyContactDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact?: EmergencyContactDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  healthInsuranceId?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  insuranceNumber?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  insuranceValidUntil?: string;

  @ApiPropertyOptional({ example: ['Penicilina', 'Dipirona'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @ApiPropertyOptional({ example: ['Hipertensão', 'Diabetes'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  chronicConditions?: string[];

  @ApiPropertyOptional({ type: [CurrentMedicationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CurrentMedicationDto)
  currentMedications?: CurrentMedicationDto[];

  @ApiPropertyOptional({ type: [FamilyHistoryItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FamilyHistoryItemDto)
  familyHistory?: FamilyHistoryItemDto[];

  @ApiPropertyOptional({ type: [SurgicalHistoryItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SurgicalHistoryItemDto)
  surgicalHistory?: SurgicalHistoryItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  smokingStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  alcoholConsumption?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  physicalActivity?: string;

  @ApiPropertyOptional({ example: 'pt-BR' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  preferredLanguage?: string;

  @ApiPropertyOptional({ example: 'America/Sao_Paulo' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  preferredTimezone?: string;

  @ApiPropertyOptional({ description: 'Configuração do Avatar 3D' })
  @IsOptional()
  avatarConfig?: any;
}
