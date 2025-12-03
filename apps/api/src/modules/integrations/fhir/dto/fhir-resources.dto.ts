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
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// ==================== FHIR Enums ====================

export enum FHIRResourceType {
  PATIENT = 'Patient',
  PRACTITIONER = 'Practitioner',
  PRACTITIONER_ROLE = 'PractitionerRole',
  ORGANIZATION = 'Organization',
  LOCATION = 'Location',
  APPOINTMENT = 'Appointment',
  ENCOUNTER = 'Encounter',
  OBSERVATION = 'Observation',
  DIAGNOSTIC_REPORT = 'DiagnosticReport',
  CONDITION = 'Condition',
  PROCEDURE = 'Procedure',
  MEDICATION_REQUEST = 'MedicationRequest',
  MEDICATION = 'Medication',
  ALLERGY_INTOLERANCE = 'AllergyIntolerance',
  IMMUNIZATION = 'Immunization',
  DOCUMENT_REFERENCE = 'DocumentReference',
  BUNDLE = 'Bundle',
  COMPOSITION = 'Composition',
}

export enum FHIRBundleType {
  DOCUMENT = 'document',
  MESSAGE = 'message',
  TRANSACTION = 'transaction',
  TRANSACTION_RESPONSE = 'transaction-response',
  BATCH = 'batch',
  BATCH_RESPONSE = 'batch-response',
  HISTORY = 'history',
  SEARCHSET = 'searchset',
  COLLECTION = 'collection',
}

export enum FHIRHTTPVerb {
  GET = 'GET',
  HEAD = 'HEAD',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}

export enum AdministrativeGender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  UNKNOWN = 'unknown',
}

export enum NameUse {
  USUAL = 'usual',
  OFFICIAL = 'official',
  TEMP = 'temp',
  NICKNAME = 'nickname',
  ANONYMOUS = 'anonymous',
  OLD = 'old',
  MAIDEN = 'maiden',
}

export enum ContactPointSystem {
  PHONE = 'phone',
  FAX = 'fax',
  EMAIL = 'email',
  PAGER = 'pager',
  URL = 'url',
  SMS = 'sms',
  OTHER = 'other',
}

export enum ContactPointUse {
  HOME = 'home',
  WORK = 'work',
  TEMP = 'temp',
  OLD = 'old',
  MOBILE = 'mobile',
}

export enum AddressUse {
  HOME = 'home',
  WORK = 'work',
  TEMP = 'temp',
  OLD = 'old',
  BILLING = 'billing',
}

export enum AddressType {
  POSTAL = 'postal',
  PHYSICAL = 'physical',
  BOTH = 'both',
}

export enum IdentifierUse {
  USUAL = 'usual',
  OFFICIAL = 'official',
  TEMP = 'temp',
  SECONDARY = 'secondary',
  OLD = 'old',
}

export enum AppointmentStatus {
  PROPOSED = 'proposed',
  PENDING = 'pending',
  BOOKED = 'booked',
  ARRIVED = 'arrived',
  FULFILLED = 'fulfilled',
  CANCELLED = 'cancelled',
  NOSHOW = 'noshow',
  ENTERED_IN_ERROR = 'entered-in-error',
  CHECKED_IN = 'checked-in',
  WAITLIST = 'waitlist',
}

export enum EncounterStatus {
  PLANNED = 'planned',
  ARRIVED = 'arrived',
  TRIAGED = 'triaged',
  IN_PROGRESS = 'in-progress',
  ONLEAVE = 'onleave',
  FINISHED = 'finished',
  CANCELLED = 'cancelled',
  ENTERED_IN_ERROR = 'entered-in-error',
  UNKNOWN = 'unknown',
}

export enum ObservationStatus {
  REGISTERED = 'registered',
  PRELIMINARY = 'preliminary',
  FINAL = 'final',
  AMENDED = 'amended',
  CORRECTED = 'corrected',
  CANCELLED = 'cancelled',
  ENTERED_IN_ERROR = 'entered-in-error',
  UNKNOWN = 'unknown',
}

export enum DiagnosticReportStatus {
  REGISTERED = 'registered',
  PARTIAL = 'partial',
  PRELIMINARY = 'preliminary',
  FINAL = 'final',
  AMENDED = 'amended',
  CORRECTED = 'corrected',
  APPENDED = 'appended',
  CANCELLED = 'cancelled',
  ENTERED_IN_ERROR = 'entered-in-error',
  UNKNOWN = 'unknown',
}

export enum MedicationRequestStatus {
  ACTIVE = 'active',
  ON_HOLD = 'on-hold',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  ENTERED_IN_ERROR = 'entered-in-error',
  STOPPED = 'stopped',
  DRAFT = 'draft',
  UNKNOWN = 'unknown',
}

export enum MedicationRequestIntent {
  PROPOSAL = 'proposal',
  PLAN = 'plan',
  ORDER = 'order',
  ORIGINAL_ORDER = 'original-order',
  REFLEX_ORDER = 'reflex-order',
  FILLER_ORDER = 'filler-order',
  INSTANCE_ORDER = 'instance-order',
  OPTION = 'option',
}

// ==================== FHIR Base Types ====================

export class FHIRCodingDto {
  @ApiPropertyOptional({ description: 'Sistema de codificação' })
  @IsOptional()
  @IsString()
  system?: string;

  @ApiPropertyOptional({ description: 'Versão do sistema' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ description: 'Código' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  display?: string;

  @ApiPropertyOptional({ description: 'Se é seleção do usuário' })
  @IsOptional()
  @IsBoolean()
  userSelected?: boolean;
}

export class FHIRCodeableConceptDto {
  @ApiPropertyOptional({ type: [FHIRCodingDto], description: 'Codificações' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRCodingDto)
  coding?: FHIRCodingDto[];

  @ApiPropertyOptional({ description: 'Texto descritivo' })
  @IsOptional()
  @IsString()
  text?: string;
}

export class FHIRIdentifierDto {
  @ApiPropertyOptional({ enum: IdentifierUse, description: 'Uso do identificador' })
  @IsOptional()
  @IsEnum(IdentifierUse)
  use?: IdentifierUse;

  @ApiPropertyOptional({ type: FHIRCodeableConceptDto, description: 'Tipo do identificador' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRCodeableConceptDto)
  type?: FHIRCodeableConceptDto;

  @ApiPropertyOptional({ description: 'Sistema do identificador' })
  @IsOptional()
  @IsString()
  system?: string;

  @ApiPropertyOptional({ description: 'Valor do identificador' })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional({ description: 'Período de validade' })
  @IsOptional()
  @IsObject()
  period?: {
    start?: string;
    end?: string;
  };

  @ApiPropertyOptional({ description: 'Organização responsável' })
  @IsOptional()
  @IsObject()
  assigner?: {
    reference?: string;
    display?: string;
  };
}

export class FHIRHumanNameDto {
  @ApiPropertyOptional({ enum: NameUse, description: 'Uso do nome' })
  @IsOptional()
  @IsEnum(NameUse)
  use?: NameUse;

  @ApiPropertyOptional({ description: 'Nome completo' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ description: 'Sobrenome' })
  @IsOptional()
  @IsString()
  family?: string;

  @ApiPropertyOptional({ description: 'Nomes próprios' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  given?: string[];

  @ApiPropertyOptional({ description: 'Prefixos' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prefix?: string[];

  @ApiPropertyOptional({ description: 'Sufixos' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  suffix?: string[];

  @ApiPropertyOptional({ description: 'Período de uso' })
  @IsOptional()
  @IsObject()
  period?: {
    start?: string;
    end?: string;
  };
}

export class FHIRContactPointDto {
  @ApiPropertyOptional({ enum: ContactPointSystem, description: 'Sistema de contato' })
  @IsOptional()
  @IsEnum(ContactPointSystem)
  system?: ContactPointSystem;

  @ApiPropertyOptional({ description: 'Valor do contato' })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional({ enum: ContactPointUse, description: 'Uso do contato' })
  @IsOptional()
  @IsEnum(ContactPointUse)
  use?: ContactPointUse;

  @ApiPropertyOptional({ description: 'Ordem de preferência' })
  @IsOptional()
  @IsNumber()
  rank?: number;

  @ApiPropertyOptional({ description: 'Período de validade' })
  @IsOptional()
  @IsObject()
  period?: {
    start?: string;
    end?: string;
  };
}

export class FHIRAddressDto {
  @ApiPropertyOptional({ enum: AddressUse, description: 'Uso do endereço' })
  @IsOptional()
  @IsEnum(AddressUse)
  use?: AddressUse;

  @ApiPropertyOptional({ enum: AddressType, description: 'Tipo de endereço' })
  @IsOptional()
  @IsEnum(AddressType)
  type?: AddressType;

  @ApiPropertyOptional({ description: 'Endereço completo' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ description: 'Linhas do endereço' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  line?: string[];

  @ApiPropertyOptional({ description: 'Cidade' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Distrito' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ description: 'Estado' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'CEP' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ description: 'País' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Período de validade' })
  @IsOptional()
  @IsObject()
  period?: {
    start?: string;
    end?: string;
  };
}

export class FHIRReferenceDto {
  @ApiPropertyOptional({ description: 'Referência para o recurso' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ description: 'Tipo do recurso' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Identificador' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRIdentifierDto)
  identifier?: FHIRIdentifierDto;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  display?: string;
}

export class FHIRPeriodDto {
  @ApiPropertyOptional({ description: 'Data de início' })
  @IsOptional()
  @IsDateString()
  start?: string;

  @ApiPropertyOptional({ description: 'Data de fim' })
  @IsOptional()
  @IsDateString()
  end?: string;
}

export class FHIRQuantityDto {
  @ApiPropertyOptional({ description: 'Valor numérico' })
  @IsOptional()
  @IsNumber()
  value?: number;

  @ApiPropertyOptional({ description: 'Comparador' })
  @IsOptional()
  @IsString()
  comparator?: string;

  @ApiPropertyOptional({ description: 'Unidade' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: 'Sistema da unidade' })
  @IsOptional()
  @IsString()
  system?: string;

  @ApiPropertyOptional({ description: 'Código da unidade' })
  @IsOptional()
  @IsString()
  code?: string;
}

export class FHIRAnnotationDto {
  @ApiPropertyOptional({ description: 'Autor' })
  @IsOptional()
  @IsObject()
  author?: FHIRReferenceDto | string;

  @ApiPropertyOptional({ description: 'Data/hora' })
  @IsOptional()
  @IsDateString()
  time?: string;

  @ApiPropertyOptional({ description: 'Texto' })
  @IsOptional()
  @IsString()
  text?: string;
}

export class FHIRAttachmentDto {
  @ApiPropertyOptional({ description: 'Content type' })
  @IsOptional()
  @IsString()
  contentType?: string;

  @ApiPropertyOptional({ description: 'Idioma' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: 'Dados em base64' })
  @IsOptional()
  @IsString()
  data?: string;

  @ApiPropertyOptional({ description: 'URL' })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({ description: 'Tamanho em bytes' })
  @IsOptional()
  @IsNumber()
  size?: number;

  @ApiPropertyOptional({ description: 'Hash SHA-1' })
  @IsOptional()
  @IsString()
  hash?: string;

  @ApiPropertyOptional({ description: 'Título' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Data de criação' })
  @IsOptional()
  @IsDateString()
  creation?: string;
}

// ==================== FHIR Resources ====================

export class FHIRMetaDto {
  @ApiPropertyOptional({ description: 'ID da versão' })
  @IsOptional()
  @IsString()
  versionId?: string;

  @ApiPropertyOptional({ description: 'Última atualização' })
  @IsOptional()
  @IsDateString()
  lastUpdated?: string;

  @ApiPropertyOptional({ description: 'URL da fonte' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ description: 'Perfis' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  profile?: string[];

  @ApiPropertyOptional({ description: 'Etiquetas de segurança' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRCodingDto)
  security?: FHIRCodingDto[];

  @ApiPropertyOptional({ description: 'Tags' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRCodingDto)
  tag?: FHIRCodingDto[];
}

export class FHIRNarrativeDto {
  @ApiProperty({ description: 'Status da narrativa' })
  @IsString()
  status: 'generated' | 'extensions' | 'additional' | 'empty';

  @ApiProperty({ description: 'Conteúdo XHTML' })
  @IsString()
  div: string;
}

// Base Resource DTO
export class FHIRResourceBaseDto {
  @ApiProperty({ enum: FHIRResourceType, description: 'Tipo do recurso' })
  @IsEnum(FHIRResourceType)
  resourceType: FHIRResourceType;

  @ApiPropertyOptional({ description: 'ID lógico' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ type: FHIRMetaDto, description: 'Metadados' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRMetaDto)
  meta?: FHIRMetaDto;

  @ApiPropertyOptional({ description: 'URI implícito das regras' })
  @IsOptional()
  @IsString()
  implicitRules?: string;

  @ApiPropertyOptional({ description: 'Idioma do recurso' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ type: FHIRNarrativeDto, description: 'Texto narrativo' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRNarrativeDto)
  text?: FHIRNarrativeDto;
}

// Patient Resource
export class FHIRPatientDto extends FHIRResourceBaseDto {
  @ApiPropertyOptional({ type: [FHIRIdentifierDto], description: 'Identificadores' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRIdentifierDto)
  identifier?: FHIRIdentifierDto[];

  @ApiPropertyOptional({ description: 'Se registro está ativo' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ type: [FHIRHumanNameDto], description: 'Nomes' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRHumanNameDto)
  name?: FHIRHumanNameDto[];

  @ApiPropertyOptional({ type: [FHIRContactPointDto], description: 'Contatos' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRContactPointDto)
  telecom?: FHIRContactPointDto[];

  @ApiPropertyOptional({ enum: AdministrativeGender, description: 'Gênero' })
  @IsOptional()
  @IsEnum(AdministrativeGender)
  gender?: AdministrativeGender;

  @ApiPropertyOptional({ description: 'Data de nascimento' })
  @IsOptional()
  @IsString()
  birthDate?: string;

  @ApiPropertyOptional({ description: 'Se falecido' })
  @IsOptional()
  deceasedBoolean?: boolean;

  @ApiPropertyOptional({ description: 'Data do falecimento' })
  @IsOptional()
  @IsDateString()
  deceasedDateTime?: string;

  @ApiPropertyOptional({ type: [FHIRAddressDto], description: 'Endereços' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRAddressDto)
  address?: FHIRAddressDto[];

  @ApiPropertyOptional({ type: FHIRCodeableConceptDto, description: 'Estado civil' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRCodeableConceptDto)
  maritalStatus?: FHIRCodeableConceptDto;

  @ApiPropertyOptional({ description: 'Se é parte de múltiplo nascimento' })
  @IsOptional()
  multipleBirthBoolean?: boolean;

  @ApiPropertyOptional({ description: 'Ordem no nascimento múltiplo' })
  @IsOptional()
  @IsNumber()
  multipleBirthInteger?: number;

  @ApiPropertyOptional({ type: [FHIRAttachmentDto], description: 'Fotos' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRAttachmentDto)
  photo?: FHIRAttachmentDto[];

  @ApiPropertyOptional({ description: 'Contatos de emergência' })
  @IsOptional()
  @IsArray()
  contact?: Array<{
    relationship?: FHIRCodeableConceptDto[];
    name?: FHIRHumanNameDto;
    telecom?: FHIRContactPointDto[];
    address?: FHIRAddressDto;
    gender?: AdministrativeGender;
    organization?: FHIRReferenceDto;
    period?: FHIRPeriodDto;
  }>;

  @ApiPropertyOptional({ description: 'Comunicação' })
  @IsOptional()
  @IsArray()
  communication?: Array<{
    language: FHIRCodeableConceptDto;
    preferred?: boolean;
  }>;

  @ApiPropertyOptional({ description: 'Provedores de cuidado' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRReferenceDto)
  generalPractitioner?: FHIRReferenceDto[];

  @ApiPropertyOptional({ type: FHIRReferenceDto, description: 'Organização gerenciadora' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRReferenceDto)
  managingOrganization?: FHIRReferenceDto;

  @ApiPropertyOptional({ description: 'Links para outros registros' })
  @IsOptional()
  @IsArray()
  link?: Array<{
    other: FHIRReferenceDto;
    type: 'replaced-by' | 'replaces' | 'refer' | 'seealso';
  }>;
}

// Practitioner Resource
export class FHIRPractitionerDto extends FHIRResourceBaseDto {
  @ApiPropertyOptional({ type: [FHIRIdentifierDto], description: 'Identificadores' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRIdentifierDto)
  identifier?: FHIRIdentifierDto[];

  @ApiPropertyOptional({ description: 'Se registro está ativo' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ type: [FHIRHumanNameDto], description: 'Nomes' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRHumanNameDto)
  name?: FHIRHumanNameDto[];

  @ApiPropertyOptional({ type: [FHIRContactPointDto], description: 'Contatos' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRContactPointDto)
  telecom?: FHIRContactPointDto[];

  @ApiPropertyOptional({ type: [FHIRAddressDto], description: 'Endereços' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRAddressDto)
  address?: FHIRAddressDto[];

  @ApiPropertyOptional({ enum: AdministrativeGender, description: 'Gênero' })
  @IsOptional()
  @IsEnum(AdministrativeGender)
  gender?: AdministrativeGender;

  @ApiPropertyOptional({ description: 'Data de nascimento' })
  @IsOptional()
  @IsString()
  birthDate?: string;

  @ApiPropertyOptional({ type: [FHIRAttachmentDto], description: 'Fotos' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRAttachmentDto)
  photo?: FHIRAttachmentDto[];

  @ApiPropertyOptional({ description: 'Qualificações' })
  @IsOptional()
  @IsArray()
  qualification?: Array<{
    identifier?: FHIRIdentifierDto[];
    code: FHIRCodeableConceptDto;
    period?: FHIRPeriodDto;
    issuer?: FHIRReferenceDto;
  }>;

  @ApiPropertyOptional({ description: 'Comunicação' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRCodeableConceptDto)
  communication?: FHIRCodeableConceptDto[];
}

// Organization Resource
export class FHIROrganizationDto extends FHIRResourceBaseDto {
  @ApiPropertyOptional({ type: [FHIRIdentifierDto], description: 'Identificadores' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRIdentifierDto)
  identifier?: FHIRIdentifierDto[];

  @ApiPropertyOptional({ description: 'Se está ativa' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ type: [FHIRCodeableConceptDto], description: 'Tipos' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRCodeableConceptDto)
  type?: FHIRCodeableConceptDto[];

  @ApiPropertyOptional({ description: 'Nome da organização' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Outros nomes' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  alias?: string[];

  @ApiPropertyOptional({ type: [FHIRContactPointDto], description: 'Contatos' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRContactPointDto)
  telecom?: FHIRContactPointDto[];

  @ApiPropertyOptional({ type: [FHIRAddressDto], description: 'Endereços' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRAddressDto)
  address?: FHIRAddressDto[];

  @ApiPropertyOptional({ type: FHIRReferenceDto, description: 'Organização pai' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRReferenceDto)
  partOf?: FHIRReferenceDto;

  @ApiPropertyOptional({ description: 'Contatos da organização' })
  @IsOptional()
  @IsArray()
  contact?: Array<{
    purpose?: FHIRCodeableConceptDto;
    name?: FHIRHumanNameDto;
    telecom?: FHIRContactPointDto[];
    address?: FHIRAddressDto;
  }>;

  @ApiPropertyOptional({ description: 'Endpoints' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRReferenceDto)
  endpoint?: FHIRReferenceDto[];
}

// Appointment Resource
export class FHIRAppointmentDto extends FHIRResourceBaseDto {
  @ApiPropertyOptional({ type: [FHIRIdentifierDto], description: 'Identificadores' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRIdentifierDto)
  identifier?: FHIRIdentifierDto[];

  @ApiProperty({ enum: AppointmentStatus, description: 'Status' })
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;

  @ApiPropertyOptional({ type: FHIRCodeableConceptDto, description: 'Motivo do cancelamento' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRCodeableConceptDto)
  cancelationReason?: FHIRCodeableConceptDto;

  @ApiPropertyOptional({ type: [FHIRCodeableConceptDto], description: 'Categorias de serviço' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRCodeableConceptDto)
  serviceCategory?: FHIRCodeableConceptDto[];

  @ApiPropertyOptional({ type: [FHIRCodeableConceptDto], description: 'Tipos de serviço' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRCodeableConceptDto)
  serviceType?: FHIRCodeableConceptDto[];

  @ApiPropertyOptional({ type: [FHIRCodeableConceptDto], description: 'Especialidades' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRCodeableConceptDto)
  specialty?: FHIRCodeableConceptDto[];

  @ApiPropertyOptional({ type: FHIRCodeableConceptDto, description: 'Tipo de consulta' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRCodeableConceptDto)
  appointmentType?: FHIRCodeableConceptDto;

  @ApiPropertyOptional({ type: [FHIRCodeableConceptDto], description: 'Motivos' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRCodeableConceptDto)
  reasonCode?: FHIRCodeableConceptDto[];

  @ApiPropertyOptional({ type: [FHIRReferenceDto], description: 'Referências dos motivos' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRReferenceDto)
  reasonReference?: FHIRReferenceDto[];

  @ApiPropertyOptional({ description: 'Prioridade (0 = urgente)' })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [FHIRReferenceDto], description: 'Informações de suporte' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRReferenceDto)
  supportingInformation?: FHIRReferenceDto[];

  @ApiPropertyOptional({ description: 'Data/hora de início' })
  @IsOptional()
  @IsDateString()
  start?: string;

  @ApiPropertyOptional({ description: 'Data/hora de fim' })
  @IsOptional()
  @IsDateString()
  end?: string;

  @ApiPropertyOptional({ description: 'Duração em minutos' })
  @IsOptional()
  @IsNumber()
  minutesDuration?: number;

  @ApiPropertyOptional({ type: [FHIRReferenceDto], description: 'Slots' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRReferenceDto)
  slot?: FHIRReferenceDto[];

  @ApiPropertyOptional({ description: 'Data de criação' })
  @IsOptional()
  @IsDateString()
  created?: string;

  @ApiPropertyOptional({ description: 'Comentário' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ description: 'Instruções para o paciente' })
  @IsOptional()
  @IsString()
  patientInstruction?: string;

  @ApiPropertyOptional({ type: [FHIRReferenceDto], description: 'Baseado em' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRReferenceDto)
  basedOn?: FHIRReferenceDto[];

  @ApiProperty({ description: 'Participantes' })
  @IsArray()
  participant: Array<{
    type?: FHIRCodeableConceptDto[];
    actor?: FHIRReferenceDto;
    required?: 'required' | 'optional' | 'information-only';
    status: 'accepted' | 'declined' | 'tentative' | 'needs-action';
    period?: FHIRPeriodDto;
  }>;

  @ApiPropertyOptional({ description: 'Períodos solicitados' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRPeriodDto)
  requestedPeriod?: FHIRPeriodDto[];
}

// Observation Resource
export class FHIRObservationDto extends FHIRResourceBaseDto {
  @ApiPropertyOptional({ type: [FHIRIdentifierDto], description: 'Identificadores' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRIdentifierDto)
  identifier?: FHIRIdentifierDto[];

  @ApiPropertyOptional({ type: [FHIRReferenceDto], description: 'Baseado em' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRReferenceDto)
  basedOn?: FHIRReferenceDto[];

  @ApiPropertyOptional({ type: [FHIRReferenceDto], description: 'Parte de' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRReferenceDto)
  partOf?: FHIRReferenceDto[];

  @ApiProperty({ enum: ObservationStatus, description: 'Status' })
  @IsEnum(ObservationStatus)
  status: ObservationStatus;

  @ApiPropertyOptional({ type: [FHIRCodeableConceptDto], description: 'Categorias' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRCodeableConceptDto)
  category?: FHIRCodeableConceptDto[];

  @ApiProperty({ type: FHIRCodeableConceptDto, description: 'Código' })
  @ValidateNested()
  @Type(() => FHIRCodeableConceptDto)
  code: FHIRCodeableConceptDto;

  @ApiPropertyOptional({ type: FHIRReferenceDto, description: 'Sujeito' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRReferenceDto)
  subject?: FHIRReferenceDto;

  @ApiPropertyOptional({ type: [FHIRReferenceDto], description: 'Foco' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRReferenceDto)
  focus?: FHIRReferenceDto[];

  @ApiPropertyOptional({ type: FHIRReferenceDto, description: 'Encontro' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRReferenceDto)
  encounter?: FHIRReferenceDto;

  @ApiPropertyOptional({ description: 'Data/hora efetiva' })
  @IsOptional()
  effectiveDateTime?: string;

  @ApiPropertyOptional({ type: FHIRPeriodDto, description: 'Período efetivo' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRPeriodDto)
  effectivePeriod?: FHIRPeriodDto;

  @ApiPropertyOptional({ description: 'Data de emissão' })
  @IsOptional()
  @IsDateString()
  issued?: string;

  @ApiPropertyOptional({ type: [FHIRReferenceDto], description: 'Performers' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRReferenceDto)
  performer?: FHIRReferenceDto[];

  @ApiPropertyOptional({ type: FHIRQuantityDto, description: 'Valor quantitativo' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRQuantityDto)
  valueQuantity?: FHIRQuantityDto;

  @ApiPropertyOptional({ type: FHIRCodeableConceptDto, description: 'Valor codificado' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRCodeableConceptDto)
  valueCodeableConcept?: FHIRCodeableConceptDto;

  @ApiPropertyOptional({ description: 'Valor string' })
  @IsOptional()
  @IsString()
  valueString?: string;

  @ApiPropertyOptional({ description: 'Valor booleano' })
  @IsOptional()
  @IsBoolean()
  valueBoolean?: boolean;

  @ApiPropertyOptional({ description: 'Valor inteiro' })
  @IsOptional()
  @IsNumber()
  valueInteger?: number;

  @ApiPropertyOptional({ description: 'Valor data/hora' })
  @IsOptional()
  @IsDateString()
  valueDateTime?: string;

  @ApiPropertyOptional({ type: FHIRCodeableConceptDto, description: 'Interpretação' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRCodeableConceptDto)
  interpretation?: FHIRCodeableConceptDto[];

  @ApiPropertyOptional({ type: [FHIRAnnotationDto], description: 'Notas' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRAnnotationDto)
  note?: FHIRAnnotationDto[];

  @ApiPropertyOptional({ type: FHIRCodeableConceptDto, description: 'Local do corpo' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRCodeableConceptDto)
  bodySite?: FHIRCodeableConceptDto;

  @ApiPropertyOptional({ type: FHIRCodeableConceptDto, description: 'Método' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRCodeableConceptDto)
  method?: FHIRCodeableConceptDto;

  @ApiPropertyOptional({ type: FHIRReferenceDto, description: 'Amostra' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRReferenceDto)
  specimen?: FHIRReferenceDto;

  @ApiPropertyOptional({ type: FHIRReferenceDto, description: 'Dispositivo' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRReferenceDto)
  device?: FHIRReferenceDto;

  @ApiPropertyOptional({ description: 'Intervalos de referência' })
  @IsOptional()
  @IsArray()
  referenceRange?: Array<{
    low?: FHIRQuantityDto;
    high?: FHIRQuantityDto;
    type?: FHIRCodeableConceptDto;
    appliesTo?: FHIRCodeableConceptDto[];
    age?: { low?: FHIRQuantityDto; high?: FHIRQuantityDto };
    text?: string;
  }>;

  @ApiPropertyOptional({ type: [FHIRReferenceDto], description: 'Observações derivadas' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRReferenceDto)
  hasMember?: FHIRReferenceDto[];

  @ApiPropertyOptional({ type: [FHIRReferenceDto], description: 'Observações derivadas de' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRReferenceDto)
  derivedFrom?: FHIRReferenceDto[];

  @ApiPropertyOptional({ description: 'Componentes' })
  @IsOptional()
  @IsArray()
  component?: Array<{
    code: FHIRCodeableConceptDto;
    valueQuantity?: FHIRQuantityDto;
    valueCodeableConcept?: FHIRCodeableConceptDto;
    valueString?: string;
    valueBoolean?: boolean;
    valueInteger?: number;
    valueDateTime?: string;
    interpretation?: FHIRCodeableConceptDto[];
    referenceRange?: any[];
  }>;
}

// Condition Resource
export class FHIRConditionDto extends FHIRResourceBaseDto {
  @ApiPropertyOptional({ type: [FHIRIdentifierDto], description: 'Identificadores' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRIdentifierDto)
  identifier?: FHIRIdentifierDto[];

  @ApiPropertyOptional({ type: FHIRCodeableConceptDto, description: 'Status clínico' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRCodeableConceptDto)
  clinicalStatus?: FHIRCodeableConceptDto;

  @ApiPropertyOptional({ type: FHIRCodeableConceptDto, description: 'Status de verificação' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRCodeableConceptDto)
  verificationStatus?: FHIRCodeableConceptDto;

  @ApiPropertyOptional({ type: [FHIRCodeableConceptDto], description: 'Categorias' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRCodeableConceptDto)
  category?: FHIRCodeableConceptDto[];

  @ApiPropertyOptional({ type: FHIRCodeableConceptDto, description: 'Severidade' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRCodeableConceptDto)
  severity?: FHIRCodeableConceptDto;

  @ApiPropertyOptional({ type: FHIRCodeableConceptDto, description: 'Código da condição' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRCodeableConceptDto)
  code?: FHIRCodeableConceptDto;

  @ApiPropertyOptional({ type: [FHIRCodeableConceptDto], description: 'Locais do corpo' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRCodeableConceptDto)
  bodySite?: FHIRCodeableConceptDto[];

  @ApiProperty({ type: FHIRReferenceDto, description: 'Sujeito' })
  @ValidateNested()
  @Type(() => FHIRReferenceDto)
  subject: FHIRReferenceDto;

  @ApiPropertyOptional({ type: FHIRReferenceDto, description: 'Encontro' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRReferenceDto)
  encounter?: FHIRReferenceDto;

  @ApiPropertyOptional({ description: 'Data de início' })
  @IsOptional()
  onsetDateTime?: string;

  @ApiPropertyOptional({ type: FHIRPeriodDto, description: 'Período de início' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRPeriodDto)
  onsetPeriod?: FHIRPeriodDto;

  @ApiPropertyOptional({ description: 'Data de resolução' })
  @IsOptional()
  abatementDateTime?: string;

  @ApiPropertyOptional({ type: FHIRPeriodDto, description: 'Período de resolução' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRPeriodDto)
  abatementPeriod?: FHIRPeriodDto;

  @ApiPropertyOptional({ description: 'Data de registro' })
  @IsOptional()
  @IsDateString()
  recordedDate?: string;

  @ApiPropertyOptional({ type: FHIRReferenceDto, description: 'Registrador' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRReferenceDto)
  recorder?: FHIRReferenceDto;

  @ApiPropertyOptional({ type: FHIRReferenceDto, description: 'Assertor' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRReferenceDto)
  asserter?: FHIRReferenceDto;

  @ApiPropertyOptional({ description: 'Estágios' })
  @IsOptional()
  @IsArray()
  stage?: Array<{
    summary?: FHIRCodeableConceptDto;
    assessment?: FHIRReferenceDto[];
    type?: FHIRCodeableConceptDto;
  }>;

  @ApiPropertyOptional({ description: 'Evidências' })
  @IsOptional()
  @IsArray()
  evidence?: Array<{
    code?: FHIRCodeableConceptDto[];
    detail?: FHIRReferenceDto[];
  }>;

  @ApiPropertyOptional({ type: [FHIRAnnotationDto], description: 'Notas' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRAnnotationDto)
  note?: FHIRAnnotationDto[];
}

// MedicationRequest Resource
export class FHIRMedicationRequestDto extends FHIRResourceBaseDto {
  @ApiPropertyOptional({ type: [FHIRIdentifierDto], description: 'Identificadores' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRIdentifierDto)
  identifier?: FHIRIdentifierDto[];

  @ApiProperty({ enum: MedicationRequestStatus, description: 'Status' })
  @IsEnum(MedicationRequestStatus)
  status: MedicationRequestStatus;

  @ApiPropertyOptional({ type: FHIRCodeableConceptDto, description: 'Motivo do status' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRCodeableConceptDto)
  statusReason?: FHIRCodeableConceptDto;

  @ApiProperty({ enum: MedicationRequestIntent, description: 'Intenção' })
  @IsEnum(MedicationRequestIntent)
  intent: MedicationRequestIntent;

  @ApiPropertyOptional({ type: [FHIRCodeableConceptDto], description: 'Categorias' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRCodeableConceptDto)
  category?: FHIRCodeableConceptDto[];

  @ApiPropertyOptional({ description: 'Prioridade' })
  @IsOptional()
  @IsString()
  priority?: 'routine' | 'urgent' | 'asap' | 'stat';

  @ApiPropertyOptional({ description: 'Se não deve ser dispensado' })
  @IsOptional()
  @IsBoolean()
  doNotPerform?: boolean;

  @ApiPropertyOptional({ description: 'Se informado pelo paciente' })
  @IsOptional()
  @IsBoolean()
  reportedBoolean?: boolean;

  @ApiPropertyOptional({ type: FHIRReferenceDto, description: 'Informado por' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRReferenceDto)
  reportedReference?: FHIRReferenceDto;

  @ApiPropertyOptional({ type: FHIRCodeableConceptDto, description: 'Medicamento (código)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRCodeableConceptDto)
  medicationCodeableConcept?: FHIRCodeableConceptDto;

  @ApiPropertyOptional({ type: FHIRReferenceDto, description: 'Medicamento (referência)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRReferenceDto)
  medicationReference?: FHIRReferenceDto;

  @ApiProperty({ type: FHIRReferenceDto, description: 'Sujeito' })
  @ValidateNested()
  @Type(() => FHIRReferenceDto)
  subject: FHIRReferenceDto;

  @ApiPropertyOptional({ type: FHIRReferenceDto, description: 'Encontro' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRReferenceDto)
  encounter?: FHIRReferenceDto;

  @ApiPropertyOptional({ type: [FHIRReferenceDto], description: 'Informações de suporte' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRReferenceDto)
  supportingInformation?: FHIRReferenceDto[];

  @ApiPropertyOptional({ description: 'Data de prescrição' })
  @IsOptional()
  @IsDateString()
  authoredOn?: string;

  @ApiPropertyOptional({ type: FHIRReferenceDto, description: 'Solicitante' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRReferenceDto)
  requester?: FHIRReferenceDto;

  @ApiPropertyOptional({ type: FHIRReferenceDto, description: 'Performer' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRReferenceDto)
  performer?: FHIRReferenceDto;

  @ApiPropertyOptional({ type: FHIRCodeableConceptDto, description: 'Tipo do performer' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRCodeableConceptDto)
  performerType?: FHIRCodeableConceptDto;

  @ApiPropertyOptional({ type: FHIRReferenceDto, description: 'Gravador' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRReferenceDto)
  recorder?: FHIRReferenceDto;

  @ApiPropertyOptional({ type: [FHIRCodeableConceptDto], description: 'Códigos dos motivos' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRCodeableConceptDto)
  reasonCode?: FHIRCodeableConceptDto[];

  @ApiPropertyOptional({ type: [FHIRReferenceDto], description: 'Referências dos motivos' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRReferenceDto)
  reasonReference?: FHIRReferenceDto[];

  @ApiPropertyOptional({ type: [FHIRAnnotationDto], description: 'Notas' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRAnnotationDto)
  note?: FHIRAnnotationDto[];

  @ApiPropertyOptional({ description: 'Instruções de dosagem' })
  @IsOptional()
  @IsArray()
  dosageInstruction?: Array<{
    sequence?: number;
    text?: string;
    additionalInstruction?: FHIRCodeableConceptDto[];
    patientInstruction?: string;
    timing?: any;
    asNeededBoolean?: boolean;
    asNeededCodeableConcept?: FHIRCodeableConceptDto;
    site?: FHIRCodeableConceptDto;
    route?: FHIRCodeableConceptDto;
    method?: FHIRCodeableConceptDto;
    doseAndRate?: Array<{
      type?: FHIRCodeableConceptDto;
      doseQuantity?: FHIRQuantityDto;
      rateQuantity?: FHIRQuantityDto;
    }>;
    maxDosePerPeriod?: any;
    maxDosePerAdministration?: FHIRQuantityDto;
    maxDosePerLifetime?: FHIRQuantityDto;
  }>;

  @ApiPropertyOptional({ description: 'Detalhes de dispensação' })
  @IsOptional()
  dispenseRequest?: {
    initialFill?: {
      quantity?: FHIRQuantityDto;
      duration?: any;
    };
    dispenseInterval?: any;
    validityPeriod?: FHIRPeriodDto;
    numberOfRepeatsAllowed?: number;
    quantity?: FHIRQuantityDto;
    expectedSupplyDuration?: any;
    performer?: FHIRReferenceDto;
  };

  @ApiPropertyOptional({ description: 'Substituição' })
  @IsOptional()
  substitution?: {
    allowedBoolean?: boolean;
    allowedCodeableConcept?: FHIRCodeableConceptDto;
    reason?: FHIRCodeableConceptDto;
  };

  @ApiPropertyOptional({ type: FHIRReferenceDto, description: 'Prescrição anterior' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRReferenceDto)
  priorPrescription?: FHIRReferenceDto;

  @ApiPropertyOptional({ type: [FHIRReferenceDto], description: 'Problemas detectados' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRReferenceDto)
  detectedIssue?: FHIRReferenceDto[];

  @ApiPropertyOptional({ type: [FHIRReferenceDto], description: 'Histórico de eventos' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRReferenceDto)
  eventHistory?: FHIRReferenceDto[];
}

// Bundle Resource
export class FHIRBundleEntryDto {
  @ApiPropertyOptional({ description: 'Links' })
  @IsOptional()
  @IsArray()
  link?: Array<{
    relation: string;
    url: string;
  }>;

  @ApiPropertyOptional({ description: 'URL completa' })
  @IsOptional()
  @IsString()
  fullUrl?: string;

  @ApiPropertyOptional({ description: 'Recurso' })
  @IsOptional()
  @IsObject()
  resource?: any;

  @ApiPropertyOptional({ description: 'Informações de busca' })
  @IsOptional()
  search?: {
    mode?: 'match' | 'include' | 'outcome';
    score?: number;
  };

  @ApiPropertyOptional({ description: 'Requisição' })
  @IsOptional()
  request?: {
    method: FHIRHTTPVerb;
    url: string;
    ifNoneMatch?: string;
    ifModifiedSince?: string;
    ifMatch?: string;
    ifNoneExist?: string;
  };

  @ApiPropertyOptional({ description: 'Resposta' })
  @IsOptional()
  response?: {
    status: string;
    location?: string;
    etag?: string;
    lastModified?: string;
    outcome?: any;
  };
}

export class FHIRBundleDto extends FHIRResourceBaseDto {
  @ApiPropertyOptional({ type: [FHIRIdentifierDto], description: 'Identificadores' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FHIRIdentifierDto)
  identifier?: FHIRIdentifierDto;

  @ApiProperty({ enum: FHIRBundleType, description: 'Tipo do bundle' })
  @IsEnum(FHIRBundleType)
  type: FHIRBundleType;

  @ApiPropertyOptional({ description: 'Timestamp' })
  @IsOptional()
  @IsDateString()
  timestamp?: string;

  @ApiPropertyOptional({ description: 'Número total de resultados' })
  @IsOptional()
  @IsNumber()
  total?: number;

  @ApiPropertyOptional({ description: 'Links' })
  @IsOptional()
  @IsArray()
  link?: Array<{
    relation: string;
    url: string;
  }>;

  @ApiPropertyOptional({ type: [FHIRBundleEntryDto], description: 'Entradas' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRBundleEntryDto)
  entry?: FHIRBundleEntryDto[];

  @ApiPropertyOptional({ description: 'Assinatura' })
  @IsOptional()
  @IsObject()
  signature?: {
    type: FHIRCodingDto[];
    when: string;
    who: FHIRReferenceDto;
    onBehalfOf?: FHIRReferenceDto;
    targetFormat?: string;
    sigFormat?: string;
    data?: string;
  };
}
