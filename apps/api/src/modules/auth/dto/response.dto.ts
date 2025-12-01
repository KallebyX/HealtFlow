import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus, Gender } from '@prisma/client';

export class PatientInfoDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'João da Silva' })
  fullName: string;

  @ApiPropertyOptional({ example: 'João' })
  socialName?: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/avatar.jpg' })
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 3 })
  level?: number;

  @ApiPropertyOptional({ example: 'Praticante' })
  levelName?: string;

  @ApiPropertyOptional({ example: 450 })
  totalPoints?: number;
}

export class DoctorInfoDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  id: string;

  @ApiProperty({ example: 'Dr. Carlos Santos' })
  fullName: string;

  @ApiProperty({ example: '123456' })
  crm: string;

  @ApiProperty({ example: 'SP' })
  crmState: string;

  @ApiProperty({ type: [String], example: ['Cardiologia'] })
  specialties: string[];

  @ApiPropertyOptional({ example: 'https://storage.example.com/photo.jpg' })
  profilePhotoUrl?: string;

  @ApiPropertyOptional({ example: true })
  telemedicineEnabled?: boolean;
}

export class EmployeeInfoDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002' })
  id: string;

  @ApiProperty({ example: 'Ana Souza' })
  fullName: string;

  @ApiProperty({ example: 'Recepcionista' })
  position: string;

  @ApiPropertyOptional({ example: 'Atendimento' })
  department?: string;
}

export class UserResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174003' })
  id: string;

  @ApiProperty({ example: 'usuario@email.com' })
  email: string;

  @ApiProperty({ enum: UserRole, example: 'PATIENT' })
  role: UserRole;

  @ApiProperty({ enum: UserStatus, example: 'ACTIVE' })
  status: UserStatus;

  @ApiProperty({ example: false })
  twoFactorEnabled: boolean;

  @ApiProperty({ example: true })
  emailVerified: boolean;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00Z' })
  lastLoginAt?: Date;

  @ApiPropertyOptional({ type: PatientInfoDto })
  patient?: PatientInfoDto;

  @ApiPropertyOptional({ type: DoctorInfoDto })
  doctor?: DoctorInfoDto;

  @ApiPropertyOptional({ type: EmployeeInfoDto })
  employee?: EmployeeInfoDto;
}

export class AuthResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Access token JWT (expira em 15 min)',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh token JWT (expira em 7 dias)',
  })
  refreshToken: string;

  @ApiProperty({
    example: 900,
    description: 'Tempo de expiração do access token em segundos',
  })
  expiresIn: number;

  @ApiProperty({
    example: 'Bearer',
    description: 'Tipo do token',
  })
  tokenType: string;

  @ApiPropertyOptional({
    example: 'Login realizado com sucesso',
  })
  message?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Indica se 2FA é necessário',
  })
  requires2FA?: boolean;
}

export class MessageResponseDto {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;
}

export class TwoFactorSetupResponseDto {
  @ApiProperty({
    example: 'JBSWY3DPEHPK3PXP',
    description: 'Secret para configuração manual',
  })
  secret: string;

  @ApiProperty({
    example: 'data:image/png;base64,iVBORw0KGgo...',
    description: 'QR Code em base64 para escanear no app',
  })
  qrCode: string;

  @ApiProperty({
    example: 'Escaneie o QR code no seu app autenticador',
  })
  message: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['ABC123', 'DEF456', 'GHI789'],
    description: 'Códigos de backup (gerados após ativar)',
  })
  backupCodes?: string[];
}

export class SessionInfoDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174004' })
  id: string;

  @ApiProperty({ example: '192.168.1.1' })
  ipAddress: string;

  @ApiProperty({ example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...' })
  userAgent: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T12:45:00Z' })
  lastActivity: Date;

  @ApiProperty({ example: true })
  isCurrentSession: boolean;

  @ApiPropertyOptional()
  deviceInfo?: {
    browser: string;
    os: string;
    device: string;
  };
}

export class SessionsResponseDto {
  @ApiProperty({ type: [SessionInfoDto] })
  sessions: SessionInfoDto[];

  @ApiProperty({ example: 3 })
  totalSessions: number;
}

export class ProfileResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  @ApiPropertyOptional()
  completionPercentage?: number;

  @ApiPropertyOptional({ type: [String] })
  missingFields?: string[];

  @ApiPropertyOptional()
  preferences?: {
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
      whatsapp: boolean;
    };
  };
}

export class TokenValidationResponseDto {
  @ApiProperty({ example: true })
  valid: boolean;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174003' })
  userId?: string;

  @ApiPropertyOptional({ enum: UserRole })
  role?: UserRole;

  @ApiPropertyOptional({ example: 1705321800 })
  exp?: number;
}
