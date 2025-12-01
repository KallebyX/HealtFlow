import {
  IsString,
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
  IsUrl,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@prisma/client';

// ═══════════════════════════════════════════════════════════════════════════════
// NESTED DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class WorkingHoursDto {
  @ApiProperty({ example: 0, description: 'Dia da semana (0=Domingo, 6=Sábado)' })
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ example: '08:00', description: 'Horário de início' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Formato de hora inválido (HH:mm)' })
  startTime: string;

  @ApiProperty({ example: '18:00', description: 'Horário de término' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Formato de hora inválido (HH:mm)' })
  endTime: string;

  @ApiPropertyOptional({ example: '12:00', description: 'Início do intervalo' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Formato de hora inválido (HH:mm)' })
  breakStart?: string;

  @ApiPropertyOptional({ example: '13:00', description: 'Fim do intervalo' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Formato de hora inválido (HH:mm)' })
  breakEnd?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class SpecialtyDto {
  @ApiProperty({ example: 'Cardiologia' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Arritmia' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  subspecialty?: string;

  @ApiPropertyOptional({ example: '12345' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  rqe?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE DOCTOR DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class CreateDoctorDto {
  // ═══════════════════════════════════════════════════════════════════════════
  // DADOS OBRIGATÓRIOS
  // ═══════════════════════════════════════════════════════════════════════════

  @ApiProperty({ example: '123.456.789-00', description: 'CPF do médico' })
  @IsString()
  @Matches(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, { message: 'CPF inválido' })
  cpf: string;

  @ApiProperty({ example: 'Dr. João da Silva', description: 'Nome completo' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  fullName: string;

  @ApiProperty({ example: '1980-05-15', description: 'Data de nascimento' })
  @IsDateString()
  birthDate: string;

  @ApiProperty({ enum: Gender, example: Gender.MALE })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ example: '+5511999999999', description: 'Telefone' })
  @IsString()
  @MaxLength(20)
  phone: string;

  @ApiProperty({ example: '123456', description: 'Número do CRM' })
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  crm: string;

  @ApiProperty({ example: 'SP', description: 'Estado do CRM' })
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  crmState: string;

  @ApiProperty({ example: ['Cardiologia', 'Clínica Médica'], description: 'Especialidades' })
  @IsArray()
  @IsString({ each: true })
  specialties: string[];

  // ═══════════════════════════════════════════════════════════════════════════
  // DADOS OPCIONAIS
  // ═══════════════════════════════════════════════════════════════════════════

  @ApiPropertyOptional({ example: 'João', description: 'Nome social' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  socialName?: string;

  @ApiPropertyOptional({ example: ['Arritmia', 'Insuficiência Cardíaca'], description: 'Subespecialidades' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subspecialties?: string[];

  @ApiPropertyOptional({ example: ['12345', '67890'], description: 'RQEs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rqe?: string[];

  @ApiPropertyOptional({ example: '123456789012345', description: 'CNS' })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  cns?: string;

  @ApiPropertyOptional({ description: 'Biografia profissional' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiPropertyOptional({ description: 'URL da foto de perfil' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  profilePhotoUrl?: string;

  @ApiPropertyOptional({ description: 'URL da assinatura digital' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  signatureUrl?: string;

  @ApiPropertyOptional({ type: [WorkingHoursDto], description: 'Horários de trabalho' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHoursDto)
  workingHours?: WorkingHoursDto[];

  @ApiPropertyOptional({ example: 30, description: 'Duração padrão da consulta em minutos' })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(120)
  appointmentDuration?: number;

  @ApiPropertyOptional({ example: true, description: 'Realiza telemedicina' })
  @IsOptional()
  @IsBoolean()
  telemedicineEnabled?: boolean;

  @ApiPropertyOptional({ description: 'ID do certificado digital' })
  @IsOptional()
  @IsUUID()
  digitalCertificateId?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE DOCTOR DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class UpdateDoctorDto {
  @ApiPropertyOptional({ example: 'Dr. João da Silva' })
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

  @ApiPropertyOptional({ example: ['Cardiologia', 'Clínica Médica'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @ApiPropertyOptional({ example: ['Arritmia', 'Insuficiência Cardíaca'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subspecialties?: string[];

  @ApiPropertyOptional({ example: ['12345', '67890'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rqe?: string[];

  @ApiPropertyOptional({ example: '123456789012345' })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  cns?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  profilePhotoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  signatureUrl?: string;

  @ApiPropertyOptional({ type: [WorkingHoursDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHoursDto)
  workingHours?: WorkingHoursDto[];

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(120)
  appointmentDuration?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  telemedicineEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  digitalCertificateId?: string;

  @ApiPropertyOptional({ example: 'ACTIVE', enum: ['ACTIVE', 'SUSPENDED', 'INACTIVE'] })
  @IsOptional()
  @IsString()
  crmStatus?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENDA DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class BlockTimeSlotDto {
  @ApiProperty({ example: '2024-01-15', description: 'Data do bloqueio' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: '08:00', description: 'Hora de início' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  startTime: string;

  @ApiProperty({ example: '12:00', description: 'Hora de término' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  endTime: string;

  @ApiPropertyOptional({ example: 'Congresso médico' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;

  @ApiPropertyOptional({ example: false, description: 'Se é um bloqueio recorrente' })
  @IsOptional()
  @IsBoolean()
  recurring?: boolean;

  @ApiPropertyOptional({ example: 'weekly', enum: ['daily', 'weekly', 'monthly'] })
  @IsOptional()
  @IsString()
  recurrencePattern?: string;

  @ApiPropertyOptional({ example: '2024-02-15', description: 'Data de fim da recorrência' })
  @IsOptional()
  @IsDateString()
  recurrenceEndDate?: string;
}

export class VacationDto {
  @ApiProperty({ example: '2024-01-15', description: 'Data de início das férias' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-01-30', description: 'Data de fim das férias' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ example: 'Férias anuais' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
