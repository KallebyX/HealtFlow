import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { FHIRResourceType } from './fhir-resources.dto';

// ==================== Base Search Parameters ====================

export class FHIRBaseSearchDto {
  @ApiPropertyOptional({ description: 'ID do recurso' })
  @IsOptional()
  @IsString()
  _id?: string;

  @ApiPropertyOptional({ description: 'Última atualização desde' })
  @IsOptional()
  @IsDateString()
  _lastUpdated?: string;

  @ApiPropertyOptional({ description: 'Tags' })
  @IsOptional()
  @IsString()
  _tag?: string;

  @ApiPropertyOptional({ description: 'Perfil' })
  @IsOptional()
  @IsString()
  _profile?: string;

  @ApiPropertyOptional({ description: 'Etiqueta de segurança' })
  @IsOptional()
  @IsString()
  _security?: string;

  @ApiPropertyOptional({ description: 'Busca por texto' })
  @IsOptional()
  @IsString()
  _text?: string;

  @ApiPropertyOptional({ description: 'Busca por conteúdo' })
  @IsOptional()
  @IsString()
  _content?: string;

  @ApiPropertyOptional({ description: 'Filtro' })
  @IsOptional()
  @IsString()
  _filter?: string;

  @ApiPropertyOptional({ description: 'Número de resultados', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  _count?: number;

  @ApiPropertyOptional({ description: 'Offset para paginação' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  _offset?: number;

  @ApiPropertyOptional({ description: 'Campo para ordenação' })
  @IsOptional()
  @IsString()
  _sort?: string;

  @ApiPropertyOptional({ description: 'Elementos a incluir' })
  @IsOptional()
  @IsString()
  _elements?: string;

  @ApiPropertyOptional({ description: 'Incluir recursos relacionados' })
  @IsOptional()
  @IsString()
  _include?: string;

  @ApiPropertyOptional({ description: 'Incluir recursos que referenciam' })
  @IsOptional()
  @IsString()
  _revinclude?: string;

  @ApiPropertyOptional({ description: 'Resumo' })
  @IsOptional()
  @IsString()
  _summary?: 'true' | 'false' | 'text' | 'data' | 'count';

  @ApiPropertyOptional({ description: 'Incluir total' })
  @IsOptional()
  @IsString()
  _total?: 'none' | 'estimate' | 'accurate';
}

// ==================== Patient Search ====================

export class FHIRPatientSearchDto extends FHIRBaseSearchDto {
  @ApiPropertyOptional({ description: 'Identificador' })
  @IsOptional()
  @IsString()
  identifier?: string;

  @ApiPropertyOptional({ description: 'Se está ativo' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Nome da família' })
  @IsOptional()
  @IsString()
  family?: string;

  @ApiPropertyOptional({ description: 'Nome próprio' })
  @IsOptional()
  @IsString()
  given?: string;

  @ApiPropertyOptional({ description: 'Nome (qualquer parte)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Fonética do nome' })
  @IsOptional()
  @IsString()
  phonetic?: string;

  @ApiPropertyOptional({ description: 'Gênero' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ description: 'Data de nascimento' })
  @IsOptional()
  @IsString()
  birthdate?: string;

  @ApiPropertyOptional({ description: 'Endereço' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Cidade' })
  @IsOptional()
  @IsString()
  'address-city'?: string;

  @ApiPropertyOptional({ description: 'Estado' })
  @IsOptional()
  @IsString()
  'address-state'?: string;

  @ApiPropertyOptional({ description: 'CEP' })
  @IsOptional()
  @IsString()
  'address-postalcode'?: string;

  @ApiPropertyOptional({ description: 'País' })
  @IsOptional()
  @IsString()
  'address-country'?: string;

  @ApiPropertyOptional({ description: 'Telefone' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Email' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Telecomunicação' })
  @IsOptional()
  @IsString()
  telecom?: string;

  @ApiPropertyOptional({ description: 'Organização' })
  @IsOptional()
  @IsString()
  organization?: string;

  @ApiPropertyOptional({ description: 'Médico responsável' })
  @IsOptional()
  @IsString()
  'general-practitioner'?: string;

  @ApiPropertyOptional({ description: 'Se está falecido' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  deceased?: boolean;

  @ApiPropertyOptional({ description: 'Idioma' })
  @IsOptional()
  @IsString()
  language?: string;
}

// ==================== Practitioner Search ====================

export class FHIRPractitionerSearchDto extends FHIRBaseSearchDto {
  @ApiPropertyOptional({ description: 'Identificador' })
  @IsOptional()
  @IsString()
  identifier?: string;

  @ApiPropertyOptional({ description: 'Se está ativo' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Nome' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Nome da família' })
  @IsOptional()
  @IsString()
  family?: string;

  @ApiPropertyOptional({ description: 'Nome próprio' })
  @IsOptional()
  @IsString()
  given?: string;

  @ApiPropertyOptional({ description: 'Gênero' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ description: 'Telefone' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Email' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Endereço' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Cidade' })
  @IsOptional()
  @IsString()
  'address-city'?: string;

  @ApiPropertyOptional({ description: 'Estado' })
  @IsOptional()
  @IsString()
  'address-state'?: string;

  @ApiPropertyOptional({ description: 'Idioma de comunicação' })
  @IsOptional()
  @IsString()
  communication?: string;
}

// ==================== Organization Search ====================

export class FHIROrganizationSearchDto extends FHIRBaseSearchDto {
  @ApiPropertyOptional({ description: 'Identificador' })
  @IsOptional()
  @IsString()
  identifier?: string;

  @ApiPropertyOptional({ description: 'Se está ativa' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Nome' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Tipo' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Endereço' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Cidade' })
  @IsOptional()
  @IsString()
  'address-city'?: string;

  @ApiPropertyOptional({ description: 'Estado' })
  @IsOptional()
  @IsString()
  'address-state'?: string;

  @ApiPropertyOptional({ description: 'Organização pai' })
  @IsOptional()
  @IsString()
  partof?: string;

  @ApiPropertyOptional({ description: 'Telefone' })
  @IsOptional()
  @IsString()
  phone?: string;
}

// ==================== Appointment Search ====================

export class FHIRAppointmentSearchDto extends FHIRBaseSearchDto {
  @ApiPropertyOptional({ description: 'Identificador' })
  @IsOptional()
  @IsString()
  identifier?: string;

  @ApiPropertyOptional({ description: 'Status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Paciente' })
  @IsOptional()
  @IsString()
  patient?: string;

  @ApiPropertyOptional({ description: 'Ator participante' })
  @IsOptional()
  @IsString()
  actor?: string;

  @ApiPropertyOptional({ description: 'Practitioner' })
  @IsOptional()
  @IsString()
  practitioner?: string;

  @ApiPropertyOptional({ description: 'Localização' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Data' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ description: 'Tipo de serviço' })
  @IsOptional()
  @IsString()
  'service-type'?: string;

  @ApiPropertyOptional({ description: 'Especialidade' })
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiPropertyOptional({ description: 'Tipo de consulta' })
  @IsOptional()
  @IsString()
  'appointment-type'?: string;

  @ApiPropertyOptional({ description: 'Motivo' })
  @IsOptional()
  @IsString()
  'reason-code'?: string;

  @ApiPropertyOptional({ description: 'Baseado em' })
  @IsOptional()
  @IsString()
  'based-on'?: string;

  @ApiPropertyOptional({ description: 'Slot' })
  @IsOptional()
  @IsString()
  slot?: string;

  @ApiPropertyOptional({ description: 'Status do participante' })
  @IsOptional()
  @IsString()
  'part-status'?: string;
}

// ==================== Observation Search ====================

export class FHIRObservationSearchDto extends FHIRBaseSearchDto {
  @ApiPropertyOptional({ description: 'Identificador' })
  @IsOptional()
  @IsString()
  identifier?: string;

  @ApiPropertyOptional({ description: 'Status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Sujeito' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ description: 'Paciente' })
  @IsOptional()
  @IsString()
  patient?: string;

  @ApiPropertyOptional({ description: 'Encontro' })
  @IsOptional()
  @IsString()
  encounter?: string;

  @ApiPropertyOptional({ description: 'Categoria' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Código' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Data' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ description: 'Performer' })
  @IsOptional()
  @IsString()
  performer?: string;

  @ApiPropertyOptional({ description: 'Valor (quantidade)' })
  @IsOptional()
  @IsString()
  'value-quantity'?: string;

  @ApiPropertyOptional({ description: 'Valor (conceito)' })
  @IsOptional()
  @IsString()
  'value-concept'?: string;

  @ApiPropertyOptional({ description: 'Valor (string)' })
  @IsOptional()
  @IsString()
  'value-string'?: string;

  @ApiPropertyOptional({ description: 'Código do componente' })
  @IsOptional()
  @IsString()
  'component-code'?: string;

  @ApiPropertyOptional({ description: 'Valor do componente' })
  @IsOptional()
  @IsString()
  'component-value-quantity'?: string;

  @ApiPropertyOptional({ description: 'Amostra' })
  @IsOptional()
  @IsString()
  specimen?: string;

  @ApiPropertyOptional({ description: 'Dispositivo' })
  @IsOptional()
  @IsString()
  device?: string;

  @ApiPropertyOptional({ description: 'Baseado em' })
  @IsOptional()
  @IsString()
  'based-on'?: string;

  @ApiPropertyOptional({ description: 'Derivado de' })
  @IsOptional()
  @IsString()
  'derived-from'?: string;

  @ApiPropertyOptional({ description: 'Tem membro' })
  @IsOptional()
  @IsString()
  'has-member'?: string;
}

// ==================== Condition Search ====================

export class FHIRConditionSearchDto extends FHIRBaseSearchDto {
  @ApiPropertyOptional({ description: 'Identificador' })
  @IsOptional()
  @IsString()
  identifier?: string;

  @ApiPropertyOptional({ description: 'Status clínico' })
  @IsOptional()
  @IsString()
  'clinical-status'?: string;

  @ApiPropertyOptional({ description: 'Status de verificação' })
  @IsOptional()
  @IsString()
  'verification-status'?: string;

  @ApiPropertyOptional({ description: 'Categoria' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Severidade' })
  @IsOptional()
  @IsString()
  severity?: string;

  @ApiPropertyOptional({ description: 'Código' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Local do corpo' })
  @IsOptional()
  @IsString()
  'body-site'?: string;

  @ApiPropertyOptional({ description: 'Sujeito' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ description: 'Paciente' })
  @IsOptional()
  @IsString()
  patient?: string;

  @ApiPropertyOptional({ description: 'Encontro' })
  @IsOptional()
  @IsString()
  encounter?: string;

  @ApiPropertyOptional({ description: 'Data de início' })
  @IsOptional()
  @IsString()
  'onset-date'?: string;

  @ApiPropertyOptional({ description: 'Data de resolução' })
  @IsOptional()
  @IsString()
  'abatement-date'?: string;

  @ApiPropertyOptional({ description: 'Data de registro' })
  @IsOptional()
  @IsString()
  'recorded-date'?: string;

  @ApiPropertyOptional({ description: 'Registrador' })
  @IsOptional()
  @IsString()
  recorder?: string;

  @ApiPropertyOptional({ description: 'Assertor' })
  @IsOptional()
  @IsString()
  asserter?: string;

  @ApiPropertyOptional({ description: 'Estágio' })
  @IsOptional()
  @IsString()
  stage?: string;

  @ApiPropertyOptional({ description: 'Evidência' })
  @IsOptional()
  @IsString()
  evidence?: string;
}

// ==================== MedicationRequest Search ====================

export class FHIRMedicationRequestSearchDto extends FHIRBaseSearchDto {
  @ApiPropertyOptional({ description: 'Identificador' })
  @IsOptional()
  @IsString()
  identifier?: string;

  @ApiPropertyOptional({ description: 'Status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Intenção' })
  @IsOptional()
  @IsString()
  intent?: string;

  @ApiPropertyOptional({ description: 'Prioridade' })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ description: 'Sujeito' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ description: 'Paciente' })
  @IsOptional()
  @IsString()
  patient?: string;

  @ApiPropertyOptional({ description: 'Encontro' })
  @IsOptional()
  @IsString()
  encounter?: string;

  @ApiPropertyOptional({ description: 'Medicamento (código)' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Medicamento (referência)' })
  @IsOptional()
  @IsString()
  medication?: string;

  @ApiPropertyOptional({ description: 'Data de prescrição' })
  @IsOptional()
  @IsString()
  authoredon?: string;

  @ApiPropertyOptional({ description: 'Solicitante' })
  @IsOptional()
  @IsString()
  requester?: string;

  @ApiPropertyOptional({ description: 'Performer' })
  @IsOptional()
  @IsString()
  'intended-performer'?: string;

  @ApiPropertyOptional({ description: 'Tipo do performer' })
  @IsOptional()
  @IsString()
  'intended-performertype'?: string;

  @ApiPropertyOptional({ description: 'Categoria' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Prescrição anterior' })
  @IsOptional()
  @IsString()
  'prior-prescription'?: string;
}

// ==================== Generic Resource Search ====================

export class FHIRGenericSearchDto extends FHIRBaseSearchDto {
  @ApiPropertyOptional({ enum: FHIRResourceType, description: 'Tipo do recurso' })
  @IsOptional()
  @IsEnum(FHIRResourceType)
  resourceType?: FHIRResourceType;

  @ApiPropertyOptional({ description: 'Parâmetros adicionais de busca' })
  @IsOptional()
  [key: string]: any;
}

// ==================== Capability Statement Query ====================

export class FHIRCapabilityStatementQueryDto {
  @ApiPropertyOptional({ description: 'Formato de saída' })
  @IsOptional()
  @IsString()
  _format?: 'json' | 'xml';

  @ApiPropertyOptional({ description: 'Modo' })
  @IsOptional()
  @IsString()
  mode?: 'full' | 'normative' | 'terminology';
}

// ==================== History Query ====================

export class FHIRHistoryQueryDto {
  @ApiPropertyOptional({ description: 'Desde quando' })
  @IsOptional()
  @IsDateString()
  _since?: string;

  @ApiPropertyOptional({ description: 'Até quando' })
  @IsOptional()
  @IsDateString()
  _at?: string;

  @ApiPropertyOptional({ description: 'Número de resultados' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  _count?: number;

  @ApiPropertyOptional({ description: 'Offset' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  _offset?: number;
}

// ==================== Operation Parameters ====================

export class FHIRValidateDto {
  @ApiPropertyOptional({ description: 'Modo de validação' })
  @IsOptional()
  @IsString()
  mode?: 'create' | 'update' | 'delete';

  @ApiPropertyOptional({ description: 'Perfil para validação' })
  @IsOptional()
  @IsString()
  profile?: string;

  @ApiPropertyOptional({ description: 'Recurso a validar' })
  @IsOptional()
  resource?: any;
}

export class FHIRMatchDto {
  @ApiPropertyOptional({ description: 'Recurso para matching' })
  @IsOptional()
  resource?: any;

  @ApiPropertyOptional({ description: 'Somente certezas' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  onlyCertainMatches?: boolean;

  @ApiPropertyOptional({ description: 'Número máximo de matches' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  count?: number;
}

export class FHIREverythingDto {
  @ApiPropertyOptional({ description: 'Início do período' })
  @IsOptional()
  @IsDateString()
  start?: string;

  @ApiPropertyOptional({ description: 'Fim do período' })
  @IsOptional()
  @IsDateString()
  end?: string;

  @ApiPropertyOptional({ description: 'Desde quando' })
  @IsOptional()
  @IsDateString()
  _since?: string;

  @ApiPropertyOptional({ description: 'Tipos a incluir' })
  @IsOptional()
  @IsString()
  _type?: string;

  @ApiPropertyOptional({ description: 'Número de resultados' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  _count?: number;
}
