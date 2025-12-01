import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsObject,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

// ==================== RNDS Enums ====================

export enum RNDSEnvironment {
  HOMOLOGATION = 'HOMOLOGATION',
  PRODUCTION = 'PRODUCTION',
}

export enum RNDSDocumentType {
  RESULTADO_EXAME_LABORATORIAL = 'REL', // Resultado de Exame Laboratorial
  SUMARIO_ALTA = 'SA', // Sumário de Alta
  ATESTADO_DIGITAL = 'AD', // Atestado Digital COVID-19
  REGISTRO_IMUNOBIOLOGICO = 'RIA', // Registro de Imunobiológico Administrado
  REGISTRO_ATENDIMENTO = 'RAC', // Registro de Atendimento Clínico
  DISPENSACAO_MEDICAMENTO = 'RDM', // Registro de Dispensação de Medicamento
}

export enum RNDSBundleType {
  RESULTADO_EXAME = 'Bundle-RN-SADT-RESULTADO-EXAME',
  SUMARIO_ALTA = 'Bundle-RN-SA',
  ATESTADO_COVID = 'Bundle-RN-AD',
  IMUNIZACAO = 'Bundle-RN-IA',
  ATENDIMENTO = 'Bundle-RN-RAC',
}

export enum ImmunizationStatus {
  COMPLETED = 'completed',
  ENTERED_IN_ERROR = 'entered-in-error',
  NOT_DONE = 'not-done',
}

export enum ImmunizationReason {
  ROTINA = '201',
  ESPECIAL = '202',
  BLOQUEIO = '203',
  INTENSIFICACAO = '204',
  CAMPANHA = '205',
  COMUNICANTE = '206',
  GESTANTE = '207',
  VIAJANTE = '208',
  ACIDENTE_TRABALHO = '209',
  EXPOSICAO_OCUPACIONAL = '210',
}

export enum VaccineManufacturer {
  SINOVAC = 'SINOVAC',
  ASTRAZENECA = 'ASTRAZENECA',
  PFIZER = 'PFIZER',
  JANSSEN = 'JANSSEN',
  BUTANTAN = 'BUTANTAN',
  FIOCRUZ = 'FIOCRUZ',
}

// ==================== CNS/CPF Validation DTOs ====================

export class ValidateCNSDto {
  @ApiProperty({ description: 'Número do CNS (15 dígitos)', example: '123456789012345' })
  @IsString()
  @IsNotEmpty()
  @Length(15, 15)
  @Matches(/^\d{15}$/, { message: 'CNS deve conter exatamente 15 dígitos' })
  cns: string;
}

export class ValidateCPFDto {
  @ApiProperty({ description: 'CPF (11 dígitos)', example: '12345678901' })
  @IsString()
  @IsNotEmpty()
  @Length(11, 11)
  @Matches(/^\d{11}$/, { message: 'CPF deve conter exatamente 11 dígitos' })
  cpf: string;
}

export class SearchPatientDto {
  @ApiProperty({ description: 'ID da clínica autenticada' })
  @IsString()
  @IsNotEmpty()
  clinicId: string;

  @ApiPropertyOptional({ description: 'CPF do paciente' })
  @IsOptional()
  @IsString()
  @Length(11, 11)
  cpf?: string;

  @ApiPropertyOptional({ description: 'CNS do paciente' })
  @IsOptional()
  @IsString()
  @Length(15, 15)
  cns?: string;

  @ApiPropertyOptional({ description: 'Nome do paciente' })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({ description: 'Data de nascimento' })
  @IsOptional()
  @IsDateString()
  dataNascimento?: string;

  @ApiPropertyOptional({ description: 'Nome da mãe' })
  @IsOptional()
  @IsString()
  nomeMae?: string;
}

// ==================== Authentication DTOs ====================

export class RNDSCredentialsDto {
  @ApiProperty({ description: 'CNES do estabelecimento' })
  @IsString()
  @IsNotEmpty()
  @Length(7, 7)
  cnes: string;

  @ApiProperty({ description: 'CNS do profissional' })
  @IsString()
  @IsNotEmpty()
  @Length(15, 15)
  cnsProfissional: string;

  @ApiPropertyOptional({ description: 'Caminho do certificado digital' })
  @IsOptional()
  @IsString()
  certificatePath?: string;

  @ApiPropertyOptional({ description: 'Senha do certificado' })
  @IsOptional()
  @IsString()
  certificatePassword?: string;
}

export class RNDSTokenResponseDto {
  @ApiProperty({ description: 'Token de acesso' })
  accessToken: string;

  @ApiProperty({ description: 'Tipo do token' })
  tokenType: string;

  @ApiProperty({ description: 'Tempo de expiração em segundos' })
  expiresIn: number;

  @ApiProperty({ description: 'Escopo' })
  scope: string;
}

// ==================== Laboratory Result DTOs ====================

export class LabResultRNDSDto {
  @ApiProperty({ description: 'ID do pedido de exame no sistema' })
  @IsString()
  @IsNotEmpty()
  labOrderId: string;

  @ApiProperty({ description: 'ID interno do resultado' })
  @IsString()
  @IsNotEmpty()
  resultId: string;

  @ApiProperty({ description: 'CPF do paciente' })
  @IsString()
  @IsNotEmpty()
  @Length(11, 11)
  patientCpf: string;

  @ApiPropertyOptional({ description: 'CNS do paciente' })
  @IsOptional()
  @IsString()
  @Length(15, 15)
  patientCns?: string;

  @ApiProperty({ description: 'Nome do paciente' })
  @IsString()
  @IsNotEmpty()
  patientName: string;

  @ApiProperty({ description: 'Data de nascimento do paciente' })
  @IsDateString()
  patientBirthDate: string;

  @ApiProperty({ description: 'Sexo do paciente (M/F)' })
  @IsString()
  @Length(1, 1)
  patientGender: string;

  @ApiProperty({ description: 'CNES do estabelecimento solicitante' })
  @IsString()
  @Length(7, 7)
  requesterCnes: string;

  @ApiProperty({ description: 'Nome do estabelecimento solicitante' })
  @IsString()
  requesterName: string;

  @ApiProperty({ description: 'CNS do profissional solicitante' })
  @IsString()
  @Length(15, 15)
  requesterProfessionalCns: string;

  @ApiProperty({ description: 'CBO do profissional solicitante' })
  @IsString()
  requesterProfessionalCbo: string;

  @ApiProperty({ description: 'CNES do estabelecimento executor' })
  @IsString()
  @Length(7, 7)
  performerCnes: string;

  @ApiProperty({ description: 'Nome do estabelecimento executor' })
  @IsString()
  performerName: string;

  @ApiProperty({ description: 'CNS do profissional executor' })
  @IsString()
  @Length(15, 15)
  performerProfessionalCns: string;

  @ApiProperty({ description: 'Data/hora da coleta' })
  @IsDateString()
  collectionDate: string;

  @ApiProperty({ description: 'Data/hora do resultado' })
  @IsDateString()
  resultDate: string;

  @ApiProperty({ description: 'Exames realizados' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LabTestRNDSDto)
  tests: LabTestRNDSDto[];
}

export class LabTestRNDSDto {
  @ApiProperty({ description: 'Código LOINC do exame' })
  @IsString()
  @IsNotEmpty()
  loincCode: string;

  @ApiProperty({ description: 'Nome do exame' })
  @IsString()
  @IsNotEmpty()
  testName: string;

  @ApiProperty({ description: 'Valor do resultado' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiPropertyOptional({ description: 'Unidade de medida' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: 'Valor de referência' })
  @IsOptional()
  @IsString()
  referenceRange?: string;

  @ApiPropertyOptional({ description: 'Interpretação' })
  @IsOptional()
  @IsString()
  interpretation?: string;

  @ApiPropertyOptional({ description: 'Método utilizado' })
  @IsOptional()
  @IsString()
  method?: string;
}

// ==================== Immunization DTOs ====================

export class ImmunizationRNDSDto {
  @ApiProperty({ description: 'ID do atendimento de vacinação' })
  @IsString()
  @IsNotEmpty()
  appointmentId: string;

  @ApiProperty({ description: 'ID interno da imunização' })
  @IsString()
  @IsNotEmpty()
  immunizationId: string;

  @ApiProperty({ description: 'CPF do paciente' })
  @IsString()
  @IsNotEmpty()
  @Length(11, 11)
  patientCpf: string;

  @ApiPropertyOptional({ description: 'CNS do paciente' })
  @IsOptional()
  @IsString()
  @Length(15, 15)
  patientCns?: string;

  @ApiProperty({ description: 'Nome do paciente' })
  @IsString()
  @IsNotEmpty()
  patientName: string;

  @ApiProperty({ description: 'Data de nascimento do paciente' })
  @IsDateString()
  patientBirthDate: string;

  @ApiProperty({ description: 'Sexo do paciente' })
  @IsString()
  @Length(1, 1)
  patientGender: string;

  @ApiProperty({ enum: ImmunizationStatus, description: 'Status da imunização' })
  @IsEnum(ImmunizationStatus)
  status: ImmunizationStatus;

  @ApiProperty({ description: 'Código CVX da vacina' })
  @IsString()
  @IsNotEmpty()
  vaccineCode: string;

  @ApiProperty({ description: 'Nome da vacina' })
  @IsString()
  @IsNotEmpty()
  vaccineName: string;

  @ApiProperty({ description: 'Lote da vacina' })
  @IsString()
  @IsNotEmpty()
  lotNumber: string;

  @ApiProperty({ description: 'Data de validade da vacina' })
  @IsDateString()
  expirationDate: string;

  @ApiProperty({ enum: VaccineManufacturer, description: 'Fabricante' })
  @IsEnum(VaccineManufacturer)
  manufacturer: VaccineManufacturer;

  @ApiProperty({ description: 'Data/hora da aplicação' })
  @IsDateString()
  occurrenceDate: string;

  @ApiProperty({ description: 'CNES do estabelecimento' })
  @IsString()
  @Length(7, 7)
  performerCnes: string;

  @ApiProperty({ description: 'Nome do estabelecimento' })
  @IsString()
  performerName: string;

  @ApiProperty({ description: 'CNS do profissional aplicador' })
  @IsString()
  @Length(15, 15)
  performerProfessionalCns: string;

  @ApiProperty({ description: 'CBO do profissional' })
  @IsString()
  performerProfessionalCbo: string;

  @ApiProperty({ description: 'Local de aplicação no corpo' })
  @IsString()
  site: string;

  @ApiProperty({ description: 'Via de administração' })
  @IsString()
  route: string;

  @ApiProperty({ description: 'Dose (quantidade)' })
  @IsNumber()
  doseQuantity: number;

  @ApiProperty({ description: 'Unidade da dose' })
  @IsString()
  doseUnit: string;

  @ApiPropertyOptional({ description: 'Número da dose (1, 2, 3, reforço)' })
  @IsOptional()
  @IsNumber()
  doseNumber?: number;

  @ApiProperty({ enum: ImmunizationReason, description: 'Motivo da imunização' })
  @IsEnum(ImmunizationReason)
  reason: ImmunizationReason;

  @ApiPropertyOptional({ description: 'Grupo de atendimento' })
  @IsOptional()
  @IsString()
  targetGroup?: string;

  @ApiPropertyOptional({ description: 'Estratégia de vacinação' })
  @IsOptional()
  @IsString()
  strategy?: string;
}

// ==================== Clinical Encounter DTOs ====================

export class ClinicalEncounterRNDSDto {
  @ApiProperty({ description: 'ID da consulta no sistema' })
  @IsString()
  @IsNotEmpty()
  consultationId: string;

  @ApiProperty({ description: 'ID interno do atendimento' })
  @IsString()
  @IsNotEmpty()
  encounterId: string;

  @ApiProperty({ description: 'CPF do paciente' })
  @IsString()
  @IsNotEmpty()
  @Length(11, 11)
  patientCpf: string;

  @ApiPropertyOptional({ description: 'CNS do paciente' })
  @IsOptional()
  @IsString()
  @Length(15, 15)
  patientCns?: string;

  @ApiProperty({ description: 'Nome do paciente' })
  @IsString()
  @IsNotEmpty()
  patientName: string;

  @ApiProperty({ description: 'Data de nascimento do paciente' })
  @IsDateString()
  patientBirthDate: string;

  @ApiProperty({ description: 'Sexo do paciente' })
  @IsString()
  @Length(1, 1)
  patientGender: string;

  @ApiProperty({ description: 'Tipo de atendimento' })
  @IsString()
  @IsNotEmpty()
  encounterType: string;

  @ApiProperty({ description: 'Classificação do atendimento' })
  @IsString()
  @IsNotEmpty()
  encounterClass: string;

  @ApiProperty({ description: 'Data/hora de início' })
  @IsDateString()
  periodStart: string;

  @ApiPropertyOptional({ description: 'Data/hora de fim' })
  @IsOptional()
  @IsDateString()
  periodEnd?: string;

  @ApiProperty({ description: 'CNES do estabelecimento' })
  @IsString()
  @Length(7, 7)
  serviceCnes: string;

  @ApiProperty({ description: 'Nome do estabelecimento' })
  @IsString()
  serviceName: string;

  @ApiProperty({ description: 'CNS do profissional' })
  @IsString()
  @Length(15, 15)
  practitionerCns: string;

  @ApiProperty({ description: 'Nome do profissional' })
  @IsString()
  practitionerName: string;

  @ApiProperty({ description: 'CBO do profissional' })
  @IsString()
  practitionerCbo: string;

  @ApiPropertyOptional({ description: 'Queixa principal' })
  @IsOptional()
  @IsString()
  chiefComplaint?: string;

  @ApiPropertyOptional({ description: 'Diagnósticos (CID-10)' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiagnosisRNDSDto)
  diagnoses?: DiagnosisRNDSDto[];

  @ApiPropertyOptional({ description: 'Procedimentos realizados' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProcedureRNDSDto)
  procedures?: ProcedureRNDSDto[];

  @ApiPropertyOptional({ description: 'Prescrições' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicationRNDSDto)
  medications?: MedicationRNDSDto[];

  @ApiPropertyOptional({ description: 'Desfecho/Alta' })
  @IsOptional()
  @IsString()
  dischargeDisposition?: string;
}

export class DiagnosisRNDSDto {
  @ApiProperty({ description: 'Código CID-10' })
  @IsString()
  @IsNotEmpty()
  icdCode: string;

  @ApiProperty({ description: 'Descrição do diagnóstico' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Se é diagnóstico principal' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ description: 'Data do diagnóstico' })
  @IsOptional()
  @IsDateString()
  diagnosisDate?: string;
}

export class ProcedureRNDSDto {
  @ApiProperty({ description: 'Código SIGTAP do procedimento' })
  @IsString()
  @IsNotEmpty()
  sigtapCode: string;

  @ApiProperty({ description: 'Nome do procedimento' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Data do procedimento' })
  @IsOptional()
  @IsDateString()
  performedDate?: string;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class MedicationRNDSDto {
  @ApiProperty({ description: 'Código CATMAT do medicamento' })
  @IsString()
  @IsNotEmpty()
  catmatCode: string;

  @ApiProperty({ description: 'Nome do medicamento' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Dosagem' })
  @IsString()
  dosage: string;

  @ApiPropertyOptional({ description: 'Frequência' })
  @IsOptional()
  @IsString()
  frequency?: string;

  @ApiPropertyOptional({ description: 'Via de administração' })
  @IsOptional()
  @IsString()
  route?: string;

  @ApiPropertyOptional({ description: 'Duração do tratamento' })
  @IsOptional()
  @IsString()
  duration?: string;
}

// ==================== Discharge Summary DTOs ====================

export class DischargeSummaryRNDSDto {
  @ApiProperty({ description: 'ID interno do sumário' })
  @IsString()
  @IsNotEmpty()
  summaryId: string;

  @ApiProperty({ description: 'CPF do paciente' })
  @IsString()
  @IsNotEmpty()
  @Length(11, 11)
  patientCpf: string;

  @ApiPropertyOptional({ description: 'CNS do paciente' })
  @IsOptional()
  @IsString()
  @Length(15, 15)
  patientCns?: string;

  @ApiProperty({ description: 'Nome do paciente' })
  @IsString()
  @IsNotEmpty()
  patientName: string;

  @ApiProperty({ description: 'Data de nascimento' })
  @IsDateString()
  patientBirthDate: string;

  @ApiProperty({ description: 'Sexo' })
  @IsString()
  @Length(1, 1)
  patientGender: string;

  @ApiProperty({ description: 'Data de internação' })
  @IsDateString()
  admissionDate: string;

  @ApiProperty({ description: 'Data de alta' })
  @IsDateString()
  dischargeDate: string;

  @ApiProperty({ description: 'CNES do estabelecimento' })
  @IsString()
  @Length(7, 7)
  organizationCnes: string;

  @ApiProperty({ description: 'Nome do estabelecimento' })
  @IsString()
  organizationName: string;

  @ApiProperty({ description: 'CNS do médico responsável' })
  @IsString()
  @Length(15, 15)
  practitionerCns: string;

  @ApiProperty({ description: 'Nome do médico responsável' })
  @IsString()
  practitionerName: string;

  @ApiProperty({ description: 'CRM do médico' })
  @IsString()
  practitionerCrm: string;

  @ApiProperty({ description: 'CBO do médico' })
  @IsString()
  practitionerCbo: string;

  @ApiProperty({ description: 'Motivo da internação' })
  @IsString()
  admissionReason: string;

  @ApiProperty({ description: 'Diagnósticos' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiagnosisRNDSDto)
  diagnoses: DiagnosisRNDSDto[];

  @ApiPropertyOptional({ description: 'Procedimentos realizados' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProcedureRNDSDto)
  procedures?: ProcedureRNDSDto[];

  @ApiProperty({ description: 'Resumo da internação' })
  @IsString()
  summary: string;

  @ApiProperty({ description: 'Condição de alta' })
  @IsString()
  dischargeCondition: string;

  @ApiProperty({ description: 'Tipo de alta' })
  @IsString()
  dischargeType: string;

  @ApiPropertyOptional({ description: 'Orientações pós-alta' })
  @IsOptional()
  @IsString()
  followUpInstructions?: string;

  @ApiPropertyOptional({ description: 'Medicamentos prescritos na alta' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicationRNDSDto)
  dischargeMedications?: MedicationRNDSDto[];
}

// ==================== COVID Certificate DTOs ====================

export class CovidCertificateRNDSDto {
  @ApiProperty({ description: 'CPF do paciente' })
  @IsString()
  @IsNotEmpty()
  @Length(11, 11)
  patientCpf: string;

  @ApiPropertyOptional({ description: 'CNS do paciente' })
  @IsOptional()
  @IsString()
  @Length(15, 15)
  patientCns?: string;

  @ApiProperty({ description: 'Nome do paciente' })
  @IsString()
  @IsNotEmpty()
  patientName: string;

  @ApiProperty({ description: 'Data de nascimento' })
  @IsDateString()
  patientBirthDate: string;

  @ApiProperty({ description: 'Tipo de certificado (VACINACAO/TESTE)' })
  @IsString()
  certificateType: 'VACINACAO' | 'TESTE';

  @ApiPropertyOptional({ description: 'Dados de vacinação' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ImmunizationRNDSDto)
  vaccination?: ImmunizationRNDSDto;

  @ApiPropertyOptional({ description: 'Dados de teste' })
  @IsOptional()
  @ValidateNested()
  @Type(() => LabResultRNDSDto)
  testResult?: LabResultRNDSDto;
}

// ==================== RNDS Submission Response ====================

export class RNDSSubmissionResponseDto {
  @ApiProperty({ description: 'Status da submissão' })
  success: boolean;

  @ApiPropertyOptional({ description: 'ID do documento no RNDS' })
  rndsId?: string;

  @ApiPropertyOptional({ description: 'Protocolo' })
  protocol?: string;

  @ApiPropertyOptional({ description: 'Data/hora da submissão' })
  submittedAt?: string;

  @ApiPropertyOptional({ description: 'Mensagem de erro' })
  errorMessage?: string;

  @ApiPropertyOptional({ description: 'Detalhes do erro' })
  errorDetails?: any;
}

// ==================== Query DTOs ====================

export class RNDSQueryDto {
  @ApiPropertyOptional({ description: 'CPF do paciente' })
  @IsOptional()
  @IsString()
  @Length(11, 11)
  cpf?: string;

  @ApiPropertyOptional({ description: 'CNS do paciente' })
  @IsOptional()
  @IsString()
  @Length(15, 15)
  cns?: string;

  @ApiPropertyOptional({ description: 'CNES do estabelecimento' })
  @IsOptional()
  @IsString()
  @Length(7, 7)
  cnes?: string;

  @ApiPropertyOptional({ enum: RNDSDocumentType, description: 'Tipo de documento' })
  @IsOptional()
  @IsEnum(RNDSDocumentType)
  documentType?: RNDSDocumentType;

  @ApiPropertyOptional({ description: 'Data inicial' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data final' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Página', default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: 'Limite por página', default: 20 })
  @IsOptional()
  @IsNumber()
  limit?: number;
}

// ==================== Configuration DTOs ====================

export class RNDSConfigDto {
  @ApiProperty({ enum: RNDSEnvironment, description: 'Ambiente RNDS' })
  @IsEnum(RNDSEnvironment)
  environment: RNDSEnvironment;

  @ApiProperty({ description: 'CNES do estabelecimento' })
  @IsString()
  @Length(7, 7)
  cnes: string;

  @ApiProperty({ description: 'Razão social do estabelecimento' })
  @IsString()
  organizationName: string;

  @ApiProperty({ description: 'Caminho do certificado digital (.pfx)' })
  @IsString()
  certificatePath: string;

  @ApiProperty({ description: 'Senha do certificado' })
  @IsString()
  certificatePassword: string;

  @ApiPropertyOptional({ description: 'Client ID para OAuth' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Client Secret para OAuth' })
  @IsOptional()
  @IsString()
  clientSecret?: string;
}

// ==================== Sync Status DTOs ====================

export class RNDSSyncStatusDto {
  @ApiProperty({ description: 'ID do registro local' })
  localId: string;

  @ApiProperty({ description: 'Tipo de documento' })
  documentType: RNDSDocumentType;

  @ApiProperty({ description: 'Status de sincronização' })
  syncStatus: 'PENDING' | 'SYNCING' | 'SYNCED' | 'ERROR' | 'RETRY';

  @ApiPropertyOptional({ description: 'ID no RNDS' })
  rndsId?: string;

  @ApiPropertyOptional({ description: 'Protocolo RNDS' })
  protocol?: string;

  @ApiPropertyOptional({ description: 'Última tentativa' })
  lastAttempt?: string;

  @ApiPropertyOptional({ description: 'Número de tentativas' })
  attemptCount?: number;

  @ApiPropertyOptional({ description: 'Mensagem de erro' })
  errorMessage?: string;

  @ApiPropertyOptional({ description: 'Data de criação' })
  createdAt?: string;

  @ApiPropertyOptional({ description: 'Data de atualização' })
  updatedAt?: string;
}

// ==================== Sync Query/Retry DTOs ====================

export class SyncStatusQueryDto {
  @ApiProperty({ description: 'ID da clínica' })
  @IsString()
  @IsNotEmpty()
  clinicId: string;

  @ApiPropertyOptional({
    description: 'Status de sincronização',
    enum: ['PENDING', 'SYNCED', 'FAILED', 'RETRYING'],
  })
  @IsOptional()
  @IsString()
  status?: 'PENDING' | 'SYNCED' | 'FAILED' | 'RETRYING';

  @ApiPropertyOptional({ enum: RNDSDocumentType, description: 'Tipo de documento' })
  @IsOptional()
  @IsEnum(RNDSDocumentType)
  documentType?: RNDSDocumentType;

  @ApiPropertyOptional({ description: 'Data inicial' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data final' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Página', default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: 'Limite por página', default: 20 })
  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class RetrySyncDto {
  @ApiProperty({ description: 'ID da clínica' })
  @IsString()
  @IsNotEmpty()
  clinicId: string;

  @ApiPropertyOptional({ description: 'IDs específicos dos documentos para retentar' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentIds?: string[];

  @ApiPropertyOptional({ enum: RNDSDocumentType, description: 'Tipo de documento' })
  @IsOptional()
  @IsEnum(RNDSDocumentType)
  documentType?: RNDSDocumentType;

  @ApiPropertyOptional({ description: 'Máximo de documentos para retentar', default: 100 })
  @IsOptional()
  @IsNumber()
  maxRetries?: number;
}
