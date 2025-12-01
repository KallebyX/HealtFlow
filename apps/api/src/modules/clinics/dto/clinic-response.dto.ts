import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClinicAddressResponseDto {
  @ApiProperty()
  street: string;

  @ApiProperty()
  number: string;

  @ApiPropertyOptional()
  complement?: string;

  @ApiProperty()
  neighborhood: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  state: string;

  @ApiProperty()
  zipCode: string;

  @ApiProperty()
  country: string;

  @ApiPropertyOptional()
  lat?: number;

  @ApiPropertyOptional()
  lng?: number;
}

export class ClinicWorkingHoursResponseDto {
  @ApiProperty()
  dayOfWeek: number;

  @ApiProperty()
  openTime: string;

  @ApiProperty()
  closeTime: string;

  @ApiProperty()
  active: boolean;
}

export class ClinicSettingsResponseDto {
  @ApiPropertyOptional()
  defaultAppointmentDuration?: number;

  @ApiPropertyOptional()
  allowOnlineBooking?: boolean;

  @ApiPropertyOptional()
  sendAppointmentReminders?: boolean;

  @ApiPropertyOptional()
  reminderHoursBefore?: number;

  @ApiPropertyOptional()
  allowTelemedicine?: boolean;

  @ApiPropertyOptional()
  requirePaymentUpfront?: boolean;

  @ApiPropertyOptional()
  cancellationMinHours?: number;

  @ApiPropertyOptional()
  autoConfirmAppointments?: boolean;

  @ApiPropertyOptional()
  lateToleranceMinutes?: number;

  @ApiPropertyOptional()
  welcomeMessage?: string;
}

export class RoomResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  code?: string;

  @ApiPropertyOptional()
  floor?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  equipment?: string[];

  @ApiProperty()
  active: boolean;
}

export class ClinicDoctorInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  crm: string;

  @ApiProperty()
  crmState: string;

  @ApiProperty()
  specialties: string[];

  @ApiPropertyOptional()
  profilePhotoUrl?: string;

  @ApiProperty()
  telemedicineEnabled: boolean;
}

export class ClinicCountsDto {
  @ApiProperty()
  doctors: number;

  @ApiProperty()
  patients: number;

  @ApiProperty()
  employees: number;

  @ApiProperty()
  appointments: number;

  @ApiProperty()
  rooms: number;
}

export class ClinicResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  legalName: string;

  @ApiProperty()
  tradeName: string;

  @ApiProperty()
  cnpj: string;

  @ApiPropertyOptional()
  cnes?: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  website?: string;

  @ApiProperty({ type: ClinicAddressResponseDto })
  address: ClinicAddressResponseDto;

  @ApiPropertyOptional({ type: ClinicSettingsResponseDto })
  settings?: ClinicSettingsResponseDto;

  @ApiPropertyOptional({ type: [ClinicWorkingHoursResponseDto] })
  workingHours?: ClinicWorkingHoursResponseDto[];

  @ApiProperty()
  timezone: string;

  @ApiPropertyOptional()
  logoUrl?: string;

  @ApiPropertyOptional()
  primaryColor?: string;

  @ApiProperty()
  active: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  deletedAt?: Date;

  // Relations
  @ApiPropertyOptional({ type: [ClinicDoctorInfoDto] })
  doctors?: ClinicDoctorInfoDto[];

  @ApiPropertyOptional({ type: [RoomResponseDto] })
  rooms?: RoomResponseDto[];

  @ApiPropertyOptional({ type: ClinicCountsDto })
  _count?: ClinicCountsDto;

  @ApiPropertyOptional({ description: 'Distância em km (quando busca por proximidade)' })
  distance?: number;
}

export class ClinicListResponseDto {
  @ApiProperty({ type: [ClinicResponseDto] })
  data: ClinicResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class ClinicStatsResponseDto {
  @ApiProperty()
  totalAppointments: number;

  @ApiProperty()
  completedAppointments: number;

  @ApiProperty()
  cancelledAppointments: number;

  @ApiProperty()
  noShowAppointments: number;

  @ApiProperty()
  totalPatients: number;

  @ApiProperty()
  newPatients: number;

  @ApiProperty()
  activeDoctors: number;

  @ApiProperty()
  telemedicineAppointments: number;

  @ApiPropertyOptional()
  revenue?: number;

  @ApiProperty()
  averageWaitTime: number;

  @ApiProperty()
  averageConsultationDuration: number;

  @ApiProperty()
  occupancyRate: number;

  @ApiPropertyOptional()
  startDate?: Date;

  @ApiPropertyOptional()
  endDate?: Date;
}

export class ClinicDoctorResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  doctorId: string;

  @ApiProperty()
  clinicId: string;

  @ApiProperty({ type: ClinicDoctorInfoDto })
  doctor: ClinicDoctorInfoDto;

  @ApiPropertyOptional()
  isPrimary?: boolean;

  @ApiPropertyOptional()
  specialtiesAtClinic?: string[];

  @ApiPropertyOptional({ type: [ClinicWorkingHoursResponseDto] })
  workingHoursAtClinic?: ClinicWorkingHoursResponseDto[];

  @ApiProperty()
  createdAt: Date;
}

export class ClinicPatientResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  patientId: string;

  @ApiProperty()
  clinicId: string;

  @ApiProperty()
  patient: {
    id: string;
    fullName: string;
    socialName?: string;
    cpf: string;
    phone: string;
  };

  @ApiPropertyOptional()
  medicalRecordNumber?: string;

  @ApiPropertyOptional()
  lastVisit?: Date;

  @ApiProperty()
  createdAt: Date;
}
