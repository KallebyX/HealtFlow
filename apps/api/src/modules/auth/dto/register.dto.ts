import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsDateString,
  IsArray,
  IsNumber,
  ValidateNested,
  IsPhoneNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@prisma/client';

// Regex para validação de senha forte
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export class AddressDto {
  @ApiProperty({ example: 'Rua das Flores' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ example: '123' })
  @IsString()
  @IsNotEmpty()
  number: string;

  @ApiPropertyOptional({ example: 'Apto 101' })
  @IsOptional()
  @IsString()
  complement?: string;

  @ApiProperty({ example: 'Centro' })
  @IsString()
  @IsNotEmpty()
  neighborhood: string;

  @ApiProperty({ example: 'São Paulo' })
  @IsString()
  @IsNotEmpty()
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

  @ApiPropertyOptional({ example: 'Brasil' })
  @IsOptional()
  @IsString()
  country?: string;
}

export class EmergencyContactDto {
  @ApiProperty({ example: 'Maria Silva' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Mãe' })
  @IsString()
  @IsNotEmpty()
  relationship: string;

  @ApiProperty({ example: '+5511999999999' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}

export class RegisterPatientDto {
  @ApiProperty({
    example: 'paciente@email.com',
    description: 'Email único do paciente',
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @ApiProperty({
    example: 'Senha@123',
    description: 'Senha com mínimo 8 caracteres, maiúscula, minúscula, número e caractere especial',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @Matches(PASSWORD_REGEX, {
    message: 'Senha deve conter maiúscula, minúscula, número e caractere especial',
  })
  password: string;

  @ApiProperty({
    example: '529.982.247-25',
    description: 'CPF do paciente (com ou sem formatação)',
  })
  @IsString()
  @IsNotEmpty({ message: 'CPF é obrigatório' })
  cpf: string;

  @ApiProperty({ example: 'João da Silva' })
  @IsString()
  @IsNotEmpty({ message: 'Nome completo é obrigatório' })
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  @MaxLength(255, { message: 'Nome deve ter no máximo 255 caracteres' })
  fullName: string;

  @ApiPropertyOptional({
    example: 'João',
    description: 'Nome social (opcional)',
  })
  @IsOptional()
  @IsString()
  socialName?: string;

  @ApiProperty({
    example: '1990-05-15',
    description: 'Data de nascimento (ISO 8601)',
  })
  @IsDateString({}, { message: 'Data de nascimento inválida' })
  birthDate: string;

  @ApiProperty({
    enum: Gender,
    example: 'MALE',
    description: 'Gênero do paciente',
  })
  @IsEnum(Gender, { message: 'Gênero inválido' })
  gender: Gender;

  @ApiProperty({ example: '+5511999999999' })
  @IsString()
  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  phone: string;

  @ApiPropertyOptional({ example: '+5511988888888' })
  @IsOptional()
  @IsString()
  phoneSecondary?: string;

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

  @ApiPropertyOptional({
    type: [String],
    example: ['Penicilina', 'Dipirona'],
    description: 'Lista de alergias conhecidas',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @ApiPropertyOptional({
    example: 175,
    description: 'Altura em centímetros',
  })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional({
    example: 70.5,
    description: 'Peso em quilogramas',
  })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiProperty({
    example: true,
    description: 'Aceite dos Termos de Uso (obrigatório)',
  })
  @IsBoolean()
  termsAccepted: boolean;

  @ApiProperty({
    example: true,
    description: 'Aceite da Política de Privacidade (obrigatório)',
  })
  @IsBoolean()
  privacyAccepted: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Consentimento para uso em pesquisas (opcional)',
  })
  @IsOptional()
  @IsBoolean()
  researchConsent?: boolean;
}

export class RegisterDoctorDto {
  @ApiProperty({ example: 'medico@email.com' })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @ApiProperty({
    example: 'Senha@123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @Matches(PASSWORD_REGEX, {
    message: 'Senha deve conter maiúscula, minúscula, número e caractere especial',
  })
  password: string;

  @ApiProperty({ example: '529.982.247-25' })
  @IsString()
  @IsNotEmpty({ message: 'CPF é obrigatório' })
  cpf: string;

  @ApiProperty({ example: 'Dr. Carlos Santos' })
  @IsString()
  @IsNotEmpty({ message: 'Nome completo é obrigatório' })
  @MinLength(3)
  @MaxLength(255)
  fullName: string;

  @ApiProperty({ example: '1985-03-20' })
  @IsDateString()
  birthDate: string;

  @ApiProperty({ enum: Gender, example: 'MALE' })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ example: '+5511999999999' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    example: '123456',
    description: 'Número do CRM',
  })
  @IsString()
  @IsNotEmpty({ message: 'CRM é obrigatório' })
  @Matches(/^\d{4,6}$/, { message: 'CRM deve ter entre 4 e 6 dígitos' })
  crm: string;

  @ApiProperty({
    example: 'SP',
    description: 'Estado do CRM',
  })
  @IsString()
  @IsNotEmpty({ message: 'Estado do CRM é obrigatório' })
  @MinLength(2)
  @MaxLength(2)
  crmState: string;

  @ApiProperty({
    type: [String],
    example: ['Cardiologia', 'Clínica Médica'],
    description: 'Especialidades médicas',
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ message: 'Pelo menos uma especialidade é obrigatória' })
  specialties: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['RQE 12345'],
    description: 'Números RQE para especialidades',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rqe?: string[];

  @ApiProperty({ example: true })
  @IsBoolean()
  termsAccepted: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  privacyAccepted: boolean;
}

export class RegisterEmployeeDto {
  @ApiProperty({ example: 'funcionario@email.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Senha@123', minLength: 8 })
  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_REGEX)
  password: string;

  @ApiProperty({ example: '529.982.247-25' })
  @IsString()
  @IsNotEmpty()
  cpf: string;

  @ApiProperty({ example: 'Ana Souza' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  fullName: string;

  @ApiProperty({ example: '1992-08-10' })
  @IsDateString()
  birthDate: string;

  @ApiProperty({ enum: Gender, example: 'FEMALE' })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ example: '+5511999999999' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    example: 'RECEPTIONIST',
    description: 'Cargo do funcionário',
  })
  @IsString()
  @IsNotEmpty()
  position: string;

  @ApiPropertyOptional({ example: 'Atendimento' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  hireDate: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  termsAccepted: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  privacyAccepted: boolean;
}
