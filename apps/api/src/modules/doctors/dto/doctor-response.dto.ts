import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, UserStatus } from '@prisma/client';

export class UserInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: UserStatus })
  status: UserStatus;

  @ApiPropertyOptional()
  lastLoginAt?: Date;

  @ApiProperty()
  emailVerified: boolean;

  @ApiProperty()
  twoFactorEnabled: boolean;
}

export class ClinicInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tradeName: string;

  @ApiPropertyOptional()
  logoUrl?: string;
}

export class WorkingHoursResponseDto {
  @ApiProperty()
  dayOfWeek: number;

  @ApiProperty()
  startTime: string;

  @ApiProperty()
  endTime: string;

  @ApiPropertyOptional()
  breakStart?: string;

  @ApiPropertyOptional()
  breakEnd?: string;

  @ApiProperty()
  active: boolean;
}

export class DigitalCertificateInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  issuer: string;

  @ApiProperty()
  validFrom: Date;

  @ApiProperty()
  validUntil: Date;

  @ApiProperty()
  active: boolean;
}

export class DoctorCountsDto {
  @ApiProperty()
  appointments: number;

  @ApiProperty()
  consultations: number;

  @ApiProperty()
  prescriptions: number;

  @ApiProperty()
  labOrders: number;

  @ApiProperty()
  telemedicineSessions: number;
}

export class DoctorResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  // Personal Info
  @ApiProperty()
  fullName: string;

  @ApiPropertyOptional()
  socialName?: string;

  @ApiProperty()
  cpf: string;

  @ApiProperty()
  birthDate: Date;

  @ApiProperty({ enum: Gender })
  gender: Gender;

  @ApiProperty()
  phone: string;

  // Professional Info
  @ApiProperty()
  crm: string;

  @ApiProperty()
  crmState: string;

  @ApiProperty()
  crmStatus: string;

  @ApiProperty()
  specialties: string[];

  @ApiPropertyOptional()
  subspecialties?: string[];

  @ApiPropertyOptional()
  rqe?: string[];

  @ApiPropertyOptional()
  cns?: string;

  // Profile
  @ApiPropertyOptional()
  bio?: string;

  @ApiPropertyOptional()
  profilePhotoUrl?: string;

  @ApiPropertyOptional()
  signatureUrl?: string;

  // Working Hours
  @ApiPropertyOptional({ type: [WorkingHoursResponseDto] })
  workingHours?: WorkingHoursResponseDto[];

  @ApiProperty()
  appointmentDuration: number;

  @ApiProperty()
  telemedicineEnabled: boolean;

  // Digital Certificate
  @ApiPropertyOptional({ type: DigitalCertificateInfoDto })
  digitalCertificate?: DigitalCertificateInfoDto;

  // Timestamps
  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  deletedAt?: Date;

  // Relations
  @ApiPropertyOptional({ type: UserInfoDto })
  user?: UserInfoDto;

  @ApiPropertyOptional({ type: [ClinicInfoDto] })
  clinics?: ClinicInfoDto[];

  @ApiPropertyOptional({ type: DoctorCountsDto })
  _count?: DoctorCountsDto;
}

export class DoctorListResponseDto {
  @ApiProperty({ type: [DoctorResponseDto] })
  data: DoctorResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class TimeSlotDto {
  @ApiProperty({ example: '2024-01-15' })
  date: string;

  @ApiProperty({ example: '08:00' })
  startTime: string;

  @ApiProperty({ example: '08:30' })
  endTime: string;

  @ApiProperty()
  available: boolean;

  @ApiPropertyOptional()
  clinicId?: string;

  @ApiPropertyOptional()
  clinicName?: string;

  @ApiPropertyOptional()
  isTelemedicine?: boolean;
}

export class AvailableSlotsResponseDto {
  @ApiProperty()
  doctorId: string;

  @ApiProperty()
  doctorName: string;

  @ApiProperty({ type: [TimeSlotDto] })
  slots: TimeSlotDto[];

  @ApiProperty()
  startDate: string;

  @ApiProperty()
  endDate: string;
}

export class DoctorStatsResponseDto {
  @ApiProperty()
  totalAppointments: number;

  @ApiProperty()
  completedConsultations: number;

  @ApiProperty()
  cancelledAppointments: number;

  @ApiProperty()
  noShowAppointments: number;

  @ApiProperty()
  telemedicineConsultations: number;

  @ApiProperty()
  prescriptionsIssued: number;

  @ApiProperty()
  labOrdersIssued: number;

  @ApiProperty()
  averageConsultationDuration: number;

  @ApiProperty()
  patientsSeen: number;

  @ApiProperty()
  newPatients: number;

  @ApiProperty()
  returningPatients: number;

  @ApiPropertyOptional()
  revenue?: number;

  @ApiPropertyOptional()
  startDate?: Date;

  @ApiPropertyOptional()
  endDate?: Date;
}

export class CrmValidationResponseDto {
  @ApiProperty()
  valid: boolean;

  @ApiProperty()
  crm: string;

  @ApiProperty()
  crmState: string;

  @ApiPropertyOptional()
  doctorName?: string;

  @ApiPropertyOptional()
  situation?: string;

  @ApiPropertyOptional()
  specialties?: string[];

  @ApiPropertyOptional()
  message?: string;

  @ApiProperty()
  validatedAt: Date;
}
