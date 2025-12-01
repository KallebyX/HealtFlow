import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEmail,
  IsUrl,
  IsArray,
  IsNumber,
  ValidateNested,
  MaxLength,
  MinLength,
  Matches,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ═══════════════════════════════════════════════════════════════════════════════
// NESTED DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class ClinicAddressDto {
  @ApiProperty({ example: 'Av. Paulista', description: 'Nome da rua' })
  @IsString()
  @MaxLength(255)
  street: string;

  @ApiProperty({ example: '1000' })
  @IsString()
  @MaxLength(20)
  number: string;

  @ApiPropertyOptional({ example: 'Sala 101' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  complement?: string;

  @ApiProperty({ example: 'Bela Vista' })
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

  @ApiProperty({ example: '01310-100' })
  @IsString()
  @Matches(/^\d{5}-?\d{3}$/, { message: 'CEP inválido' })
  zipCode: string;

  @ApiProperty({ example: 'BR', default: 'BR' })
  @IsString()
  @MaxLength(2)
  country: string = 'BR';

  @ApiPropertyOptional({ example: -23.5505 })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ example: -46.6333 })
  @IsOptional()
  @IsNumber()
  lng?: number;
}

export class ClinicWorkingHoursDto {
  @ApiProperty({ example: 0, description: 'Dia da semana (0=Domingo, 6=Sábado)' })
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ example: '08:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  openTime: string;

  @ApiProperty({ example: '18:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  closeTime: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class ClinicSettingsDto {
  @ApiPropertyOptional({ example: 30, description: 'Duração padrão da consulta em minutos' })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(120)
  defaultAppointmentDuration?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  allowOnlineBooking?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  sendAppointmentReminders?: boolean;

  @ApiPropertyOptional({ example: 24, description: 'Horas de antecedência para lembrete' })
  @IsOptional()
  @IsNumber()
  reminderHoursBefore?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  allowTelemedicine?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  requirePaymentUpfront?: boolean;

  @ApiPropertyOptional({ example: 2, description: 'Horas mínimas de antecedência para cancelamento' })
  @IsOptional()
  @IsNumber()
  cancellationMinHours?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  autoConfirmAppointments?: boolean;

  @ApiPropertyOptional({ example: 15, description: 'Minutos de tolerância para atraso' })
  @IsOptional()
  @IsNumber()
  lateToleranceMinutes?: number;

  @ApiPropertyOptional({ description: 'Mensagem de boas-vindas' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  welcomeMessage?: string;

  @ApiPropertyOptional({ description: 'Termos de uso específicos' })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  termsAndConditions?: string;
}

export class RoomDto {
  @ApiProperty({ example: 'Consultório 1' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'C1' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  code?: string;

  @ApiPropertyOptional({ example: 'Térreo' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  floor?: string;

  @ApiPropertyOptional({ example: 'Consultório equipado para cardiologia' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: ['ECG', 'Ecocardiograma'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipment?: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE CLINIC DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class CreateClinicDto {
  @ApiProperty({ example: 'Clínica Saúde Total LTDA', description: 'Razão social' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  legalName: string;

  @ApiProperty({ example: 'Clínica Saúde Total', description: 'Nome fantasia' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  tradeName: string;

  @ApiProperty({ example: '12.345.678/0001-90', description: 'CNPJ' })
  @IsString()
  @Matches(/^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/, { message: 'CNPJ inválido' })
  cnpj: string;

  @ApiPropertyOptional({ example: '1234567', description: 'CNES - Cadastro Nacional de Estabelecimentos de Saúde' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  cnes?: string;

  @ApiProperty({ example: '+5511999999999', description: 'Telefone principal' })
  @IsString()
  @MaxLength(20)
  phone: string;

  @ApiProperty({ example: 'contato@clinica.com.br' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'https://clinica.com.br' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiProperty({ type: ClinicAddressDto })
  @ValidateNested()
  @Type(() => ClinicAddressDto)
  address: ClinicAddressDto;

  @ApiPropertyOptional({ type: ClinicSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ClinicSettingsDto)
  settings?: ClinicSettingsDto;

  @ApiPropertyOptional({ type: [ClinicWorkingHoursDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClinicWorkingHoursDto)
  workingHours?: ClinicWorkingHoursDto[];

  @ApiPropertyOptional({ example: 'America/Sao_Paulo' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;

  @ApiPropertyOptional({ description: 'URL do logo' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;

  @ApiPropertyOptional({ example: '#00AA55', description: 'Cor primária (hex)' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Cor deve estar no formato hexadecimal (#RRGGBB)' })
  primaryColor?: string;

  @ApiPropertyOptional({ type: [RoomDto], description: 'Salas/Consultórios' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomDto)
  rooms?: RoomDto[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE CLINIC DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class UpdateClinicDto {
  @ApiPropertyOptional({ example: 'Clínica Saúde Total LTDA' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  legalName?: string;

  @ApiPropertyOptional({ example: 'Clínica Saúde Total' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  tradeName?: string;

  @ApiPropertyOptional({ example: '1234567' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  cnes?: string;

  @ApiPropertyOptional({ example: '+5511999999999' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: 'contato@clinica.com.br' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'https://clinica.com.br' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ type: ClinicAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ClinicAddressDto)
  address?: ClinicAddressDto;

  @ApiPropertyOptional({ type: ClinicSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ClinicSettingsDto)
  settings?: ClinicSettingsDto;

  @ApiPropertyOptional({ type: [ClinicWorkingHoursDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClinicWorkingHoursDto)
  workingHours?: ClinicWorkingHoursDto[];

  @ApiPropertyOptional({ example: 'America/Sao_Paulo' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;

  @ApiPropertyOptional({ example: '#00AA55' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  primaryColor?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEMBER DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class AddDoctorToClinicDto {
  @ApiProperty({ description: 'ID do médico' })
  @IsString()
  doctorId: string;

  @ApiPropertyOptional({ example: true, description: 'Se é o médico principal/coordenador' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ example: ['Cardiologia'], description: 'Especialidades atendidas nesta clínica' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialtiesAtClinic?: string[];

  @ApiPropertyOptional({ type: [ClinicWorkingHoursDto], description: 'Horários específicos nesta clínica' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClinicWorkingHoursDto)
  workingHoursAtClinic?: ClinicWorkingHoursDto[];
}

export class AddPatientToClinicDto {
  @ApiProperty({ description: 'ID do paciente' })
  @IsString()
  patientId: string;

  @ApiPropertyOptional({ description: 'Número do prontuário interno' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  medicalRecordNumber?: string;
}

export class AddEmployeeToClinicDto {
  @ApiProperty({ description: 'ID do funcionário' })
  @IsString()
  employeeId: string;

  @ApiPropertyOptional({ example: 'Recepcionista', description: 'Cargo na clínica' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  roleAtClinic?: string;
}
