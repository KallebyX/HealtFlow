import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsDateString,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum LabOrderPriority {
  ROUTINE = 'ROUTINE',
  URGENT = 'URGENT',
  STAT = 'STAT', // Imediato/Emergência
}

export enum LabOrderStatus {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  SAMPLE_COLLECTED = 'SAMPLE_COLLECTED',
  IN_ANALYSIS = 'IN_ANALYSIS',
  PARTIAL_RESULTS = 'PARTIAL_RESULTS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
}

export enum SampleType {
  BLOOD = 'BLOOD',
  URINE = 'URINE',
  FECES = 'FECES',
  SALIVA = 'SALIVA',
  SPUTUM = 'SPUTUM',
  CSF = 'CSF', // Líquido cefalorraquidiano
  SYNOVIAL_FLUID = 'SYNOVIAL_FLUID',
  PLEURAL_FLUID = 'PLEURAL_FLUID',
  ASCITIC_FLUID = 'ASCITIC_FLUID',
  SWAB = 'SWAB',
  TISSUE = 'TISSUE',
  HAIR = 'HAIR',
  NAIL = 'NAIL',
  OTHER = 'OTHER',
}

export enum FastingRequirement {
  NONE = 'NONE',
  FOUR_HOURS = 'FOUR_HOURS',
  EIGHT_HOURS = 'EIGHT_HOURS',
  TWELVE_HOURS = 'TWELVE_HOURS',
  SPECIAL = 'SPECIAL',
}

export class LabTestItemDto {
  @ApiProperty({ description: 'Código do exame (TUSS, CBHPM, interno)' })
  @IsString()
  @IsNotEmpty()
  testCode: string;

  @ApiProperty({ description: 'Nome do exame' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  testName: string;

  @ApiPropertyOptional({ description: 'Nome popular/sinônimo do exame' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  popularName?: string;

  @ApiProperty({ enum: SampleType, description: 'Tipo de amostra necessária' })
  @IsEnum(SampleType)
  sampleType: SampleType;

  @ApiPropertyOptional({ description: 'Volume necessário em mL' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  requiredVolume?: number;

  @ApiPropertyOptional({ description: 'Material/tubo específico' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  collectionMaterial?: string;

  @ApiProperty({ enum: FastingRequirement, description: 'Requisito de jejum' })
  @IsEnum(FastingRequirement)
  fastingRequirement: FastingRequirement;

  @ApiPropertyOptional({ description: 'Instruções especiais de preparo' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  specialInstructions?: string;

  @ApiPropertyOptional({ description: 'Tempo estimado para resultado (em horas)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  estimatedTurnaround?: number;

  @ApiPropertyOptional({ description: 'Indicação clínica específica' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  clinicalIndication?: string;

  @ApiPropertyOptional({ description: 'Método de análise' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  analysisMethod?: string;

  @ApiPropertyOptional({ description: 'Quantidade de repetições' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;
}

export class CreateLabOrderDto {
  @ApiProperty({ description: 'ID do paciente' })
  @IsUUID()
  patientId: string;

  @ApiPropertyOptional({ description: 'ID da consulta relacionada' })
  @IsOptional()
  @IsUUID()
  consultationId?: string;

  @ApiPropertyOptional({ description: 'ID do médico solicitante' })
  @IsOptional()
  @IsUUID()
  requestingDoctorId?: string;

  @ApiPropertyOptional({ description: 'ID da clínica/laboratório' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ description: 'ID do laboratório externo' })
  @IsOptional()
  @IsUUID()
  externalLabId?: string;

  @ApiProperty({ enum: LabOrderPriority, description: 'Prioridade do pedido' })
  @IsEnum(LabOrderPriority)
  priority: LabOrderPriority;

  @ApiProperty({ type: [LabTestItemDto], description: 'Lista de exames solicitados' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LabTestItemDto)
  tests: LabTestItemDto[];

  @ApiPropertyOptional({ description: 'Hipótese diagnóstica (CID-10)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  diagnosticHypothesis?: string[];

  @ApiPropertyOptional({ description: 'Indicação clínica geral' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  clinicalIndication?: string;

  @ApiPropertyOptional({ description: 'Observações para o laboratório' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  labNotes?: string;

  @ApiPropertyOptional({ description: 'Data preferencial para coleta' })
  @IsOptional()
  @IsDateString()
  preferredCollectionDate?: string;

  @ApiPropertyOptional({ description: 'Coleta domiciliar' })
  @IsOptional()
  @IsBoolean()
  homeCollection?: boolean;

  @ApiPropertyOptional({ description: 'Endereço para coleta domiciliar' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  homeCollectionAddress?: string;

  @ApiPropertyOptional({ description: 'Medicamentos em uso (pode afetar resultados)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  currentMedications?: string[];

  @ApiPropertyOptional({ description: 'Informações clínicas relevantes' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  relevantClinicalInfo?: string;

  @ApiPropertyOptional({ description: 'Exame de urgência - pular fila' })
  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;

  @ApiPropertyOptional({ description: 'Código de autorização do convênio' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  insuranceAuthCode?: string;

  @ApiPropertyOptional({ description: 'Número da guia do convênio' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  insuranceGuideNumber?: string;
}

export class UpdateLabOrderDto {
  @ApiPropertyOptional({ enum: LabOrderPriority })
  @IsOptional()
  @IsEnum(LabOrderPriority)
  priority?: LabOrderPriority;

  @ApiPropertyOptional({ enum: LabOrderStatus })
  @IsOptional()
  @IsEnum(LabOrderStatus)
  status?: LabOrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  labNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  preferredCollectionDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  insuranceAuthCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  insuranceGuideNumber?: string;
}

export class ScheduleCollectionDto {
  @ApiProperty({ description: 'ID do pedido de exame' })
  @IsUUID()
  labOrderId: string;

  @ApiProperty({ description: 'Data e hora agendada para coleta' })
  @IsDateString()
  scheduledDateTime: string;

  @ApiPropertyOptional({ description: 'ID do profissional responsável pela coleta' })
  @IsOptional()
  @IsUUID()
  collectorId?: string;

  @ApiPropertyOptional({ description: 'Local da coleta' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  collectionLocation?: string;

  @ApiPropertyOptional({ description: 'É coleta domiciliar' })
  @IsOptional()
  @IsBoolean()
  isHomeCollection?: boolean;

  @ApiPropertyOptional({ description: 'Endereço para coleta domiciliar' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  homeAddress?: string;

  @ApiPropertyOptional({ description: 'Instruções de preparo enviadas ao paciente' })
  @IsOptional()
  @IsBoolean()
  preparationInstructionsSent?: boolean;

  @ApiPropertyOptional({ description: 'Observações do agendamento' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class RegisterSampleCollectionDto {
  @ApiProperty({ description: 'ID do pedido de exame' })
  @IsUUID()
  labOrderId: string;

  @ApiProperty({ description: 'Data e hora da coleta' })
  @IsDateString()
  collectionDateTime: string;

  @ApiProperty({ description: 'ID do profissional que realizou a coleta' })
  @IsUUID()
  collectorId: string;

  @ApiProperty({ type: [SampleCollectedDto], description: 'Amostras coletadas' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SampleCollectedDto)
  samples: SampleCollectedDto[];

  @ApiPropertyOptional({ description: 'Observações da coleta' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  collectionNotes?: string;

  @ApiPropertyOptional({ description: 'Intercorrências durante coleta' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  complications?: string;

  @ApiPropertyOptional({ description: 'Paciente estava em jejum' })
  @IsOptional()
  @IsBoolean()
  patientFasting?: boolean;

  @ApiPropertyOptional({ description: 'Horas de jejum do paciente' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fastingHours?: number;
}

export class SampleCollectedDto {
  @ApiProperty({ description: 'Código do exame' })
  @IsString()
  testCode: string;

  @ApiProperty({ enum: SampleType })
  @IsEnum(SampleType)
  sampleType: SampleType;

  @ApiProperty({ description: 'Código de barras/identificador do tubo' })
  @IsString()
  @MaxLength(100)
  tubeBarcode: string;

  @ApiPropertyOptional({ description: 'Volume coletado em mL' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  volumeCollected?: number;

  @ApiPropertyOptional({ description: 'Qualidade da amostra' })
  @IsOptional()
  @IsEnum(['ADEQUATE', 'LIPEMIC', 'HEMOLYZED', 'INSUFFICIENT', 'CLOTTED', 'CONTAMINATED'])
  sampleQuality?: string;

  @ApiPropertyOptional({ description: 'Observações da amostra' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class LabResultValueDto {
  @ApiProperty({ description: 'Código do exame' })
  @IsString()
  testCode: string;

  @ApiProperty({ description: 'Nome do parâmetro/analito' })
  @IsString()
  @MaxLength(200)
  parameterName: string;

  @ApiProperty({ description: 'Valor do resultado' })
  @IsString()
  @MaxLength(200)
  value: string;

  @ApiPropertyOptional({ description: 'Unidade de medida' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit?: string;

  @ApiPropertyOptional({ description: 'Valor de referência mínimo' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  referenceMin?: string;

  @ApiPropertyOptional({ description: 'Valor de referência máximo' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  referenceMax?: string;

  @ApiPropertyOptional({ description: 'Faixa de referência textual' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  referenceRange?: string;

  @ApiPropertyOptional({ description: 'Flag de valor alterado' })
  @IsOptional()
  @IsEnum(['NORMAL', 'LOW', 'HIGH', 'CRITICAL_LOW', 'CRITICAL_HIGH', 'ABNORMAL'])
  flag?: string;

  @ApiPropertyOptional({ description: 'Valor crítico - requer atenção imediata' })
  @IsOptional()
  @IsBoolean()
  isCritical?: boolean;

  @ApiPropertyOptional({ description: 'Método de análise utilizado' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  method?: string;

  @ApiPropertyOptional({ description: 'Observações do analito' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Comparação com exame anterior' })
  @IsOptional()
  @IsEnum(['INCREASED', 'DECREASED', 'STABLE', 'NEW'])
  trend?: string;

  @ApiPropertyOptional({ description: 'Valor do exame anterior' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  previousValue?: string;

  @ApiPropertyOptional({ description: 'Data do exame anterior' })
  @IsOptional()
  @IsDateString()
  previousDate?: string;
}

export class RegisterLabResultDto {
  @ApiProperty({ description: 'ID do pedido de exame' })
  @IsUUID()
  labOrderId: string;

  @ApiProperty({ description: 'Código do exame' })
  @IsString()
  testCode: string;

  @ApiProperty({ type: [LabResultValueDto], description: 'Valores dos resultados' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LabResultValueDto)
  results: LabResultValueDto[];

  @ApiProperty({ description: 'Data/hora da análise' })
  @IsDateString()
  analysisDateTime: string;

  @ApiPropertyOptional({ description: 'ID do profissional que realizou a análise' })
  @IsOptional()
  @IsUUID()
  analystId?: string;

  @ApiPropertyOptional({ description: 'ID do profissional que validou/liberou' })
  @IsOptional()
  @IsUUID()
  validatorId?: string;

  @ApiPropertyOptional({ description: 'Laudo textual/interpretação' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  interpretation?: string;

  @ApiPropertyOptional({ description: 'Observações técnicas' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  technicalNotes?: string;

  @ApiPropertyOptional({ description: 'Equipamento utilizado' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  equipment?: string;

  @ApiPropertyOptional({ description: 'Lote de reagentes' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reagentBatch?: string;

  @ApiPropertyOptional({ description: 'Contém valor crítico' })
  @IsOptional()
  @IsBoolean()
  hasCriticalValue?: boolean;

  @ApiPropertyOptional({ description: 'Médico notificado sobre valor crítico' })
  @IsOptional()
  @IsBoolean()
  doctorNotified?: boolean;

  @ApiPropertyOptional({ description: 'Data/hora da notificação ao médico' })
  @IsOptional()
  @IsDateString()
  notificationDateTime?: string;

  @ApiPropertyOptional({ description: 'É resultado parcial' })
  @IsOptional()
  @IsBoolean()
  isPartial?: boolean;

  @ApiPropertyOptional({ description: 'URL do laudo em PDF' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reportPdfUrl?: string;

  @ApiPropertyOptional({ description: 'URL de imagens do exame' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];
}

export class ValidateResultDto {
  @ApiProperty({ description: 'ID do resultado' })
  @IsUUID()
  resultId: string;

  @ApiProperty({ description: 'ID do profissional validador' })
  @IsUUID()
  validatorId: string;

  @ApiPropertyOptional({ description: 'Observações da validação' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  validationNotes?: string;

  @ApiPropertyOptional({ description: 'Requer repetição do exame' })
  @IsOptional()
  @IsBoolean()
  requiresRepeat?: boolean;

  @ApiPropertyOptional({ description: 'Motivo da repetição' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  repeatReason?: string;
}

export class RejectSampleDto {
  @ApiProperty({ description: 'ID do pedido de exame' })
  @IsUUID()
  labOrderId: string;

  @ApiProperty({ description: 'Código do exame' })
  @IsString()
  testCode: string;

  @ApiProperty({ description: 'Motivo da rejeição' })
  @IsEnum([
    'HEMOLYZED',
    'LIPEMIC',
    'INSUFFICIENT_VOLUME',
    'CLOTTED',
    'CONTAMINATED',
    'WRONG_TUBE',
    'IDENTIFICATION_ERROR',
    'TRANSPORT_ERROR',
    'EXPIRED',
    'OTHER',
  ])
  rejectionReason: string;

  @ApiPropertyOptional({ description: 'Descrição detalhada' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionDetails?: string;

  @ApiProperty({ description: 'Requer nova coleta' })
  @IsBoolean()
  requiresNewCollection: boolean;

  @ApiPropertyOptional({ description: 'ID do profissional que rejeitou' })
  @IsOptional()
  @IsUUID()
  rejectedBy?: string;
}

export class ExternalLabOrderDto {
  @ApiProperty({ description: 'ID do pedido interno' })
  @IsUUID()
  labOrderId: string;

  @ApiProperty({ description: 'ID do laboratório externo' })
  @IsUUID()
  externalLabId: string;

  @ApiPropertyOptional({ description: 'Código do pedido no laboratório externo' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  externalOrderCode?: string;

  @ApiPropertyOptional({ description: 'Data de envio ao laboratório' })
  @IsOptional()
  @IsDateString()
  sentDate?: string;

  @ApiPropertyOptional({ description: 'Previsão de resultado' })
  @IsOptional()
  @IsDateString()
  expectedResultDate?: string;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class AddTestToOrderDto {
  @ApiProperty({ description: 'ID do pedido de exame' })
  @IsUUID()
  labOrderId: string;

  @ApiProperty({ type: LabTestItemDto, description: 'Exame a ser adicionado' })
  @ValidateNested()
  @Type(() => LabTestItemDto)
  test: LabTestItemDto;

  @ApiPropertyOptional({ description: 'Motivo da adição' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class CancelTestDto {
  @ApiProperty({ description: 'ID do pedido de exame' })
  @IsUUID()
  labOrderId: string;

  @ApiProperty({ description: 'Código do exame a cancelar' })
  @IsString()
  testCode: string;

  @ApiProperty({ description: 'Motivo do cancelamento' })
  @IsString()
  @MaxLength(500)
  reason: string;

  @ApiPropertyOptional({ description: 'ID do profissional que cancelou' })
  @IsOptional()
  @IsUUID()
  cancelledBy?: string;
}
