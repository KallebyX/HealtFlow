import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentTypeEnum, AppointmentStatusEnum, CancellationReason } from './create-appointment.dto';

// ═══════════════════════════════════════════════════════════════════════════════
// NESTED RESPONSE DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class AppointmentPatientResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiPropertyOptional()
  cpf?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  avatarUrl?: string;

  @ApiPropertyOptional()
  birthDate?: Date;

  @ApiPropertyOptional()
  age?: number;
}

export class AppointmentDoctorResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiPropertyOptional()
  crm?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  avatarUrl?: string;

  @ApiPropertyOptional()
  specialty?: string;
}

export class AppointmentClinicResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  address?: string;
}

export class AppointmentRoomResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  number?: string;

  @ApiPropertyOptional()
  floor?: string;
}

export class AppointmentInsuranceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  plan?: string;

  @ApiPropertyOptional()
  authorizationNumber?: string;

  @ApiPropertyOptional()
  procedureCode?: string;

  @ApiPropertyOptional()
  authorizedAmount?: number;
}

export class AppointmentTelemedicineResponseDto {
  @ApiPropertyOptional()
  roomUrl?: string;

  @ApiPropertyOptional()
  provider?: string;

  @ApiPropertyOptional()
  password?: string;

  @ApiPropertyOptional()
  instructions?: string;

  @ApiPropertyOptional()
  status?: string;
}

export class AppointmentReminderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  scheduledFor: Date;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  sentAt?: Date;

  @ApiPropertyOptional()
  error?: string;
}

export class AppointmentHistoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  action: string;

  @ApiProperty()
  timestamp: Date;

  @ApiPropertyOptional()
  userId?: string;

  @ApiPropertyOptional()
  userName?: string;

  @ApiPropertyOptional()
  details?: Record<string, any>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APPOINTMENT RESPONSE DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class AppointmentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: AppointmentPatientResponseDto })
  patient: AppointmentPatientResponseDto;

  @ApiProperty({ type: AppointmentDoctorResponseDto })
  doctor: AppointmentDoctorResponseDto;

  @ApiProperty({ type: AppointmentClinicResponseDto })
  clinic: AppointmentClinicResponseDto;

  @ApiPropertyOptional({ type: AppointmentRoomResponseDto })
  room?: AppointmentRoomResponseDto;

  @ApiProperty()
  startTime: Date;

  @ApiProperty()
  endTime: Date;

  @ApiProperty()
  durationMinutes: number;

  @ApiProperty({ enum: AppointmentTypeEnum })
  type: AppointmentTypeEnum;

  @ApiProperty({ enum: AppointmentStatusEnum })
  status: AppointmentStatusEnum;

  @ApiPropertyOptional()
  specialtyId?: string;

  @ApiPropertyOptional()
  specialtyName?: string;

  @ApiPropertyOptional()
  procedureId?: string;

  @ApiPropertyOptional()
  procedureName?: string;

  @ApiPropertyOptional()
  reason?: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  patientInstructions?: string;

  @ApiProperty()
  isFirstVisit: boolean;

  @ApiProperty()
  isReturn: boolean;

  @ApiPropertyOptional()
  originalAppointmentId?: string;

  @ApiPropertyOptional()
  price?: number;

  @ApiProperty()
  isPrivate: boolean;

  @ApiPropertyOptional({ type: AppointmentInsuranceResponseDto })
  insurance?: AppointmentInsuranceResponseDto;

  @ApiPropertyOptional({ type: AppointmentTelemedicineResponseDto })
  telemedicine?: AppointmentTelemedicineResponseDto;

  @ApiProperty()
  priority: number;

  @ApiPropertyOptional({ type: [String] })
  tags?: string[];

  @ApiPropertyOptional()
  color?: string;

  @ApiPropertyOptional()
  checkInTime?: Date;

  @ApiPropertyOptional()
  actualStartTime?: Date;

  @ApiPropertyOptional()
  actualEndTime?: Date;

  @ApiPropertyOptional()
  waitingTime?: number;

  @ApiPropertyOptional()
  consultationDuration?: number;

  @ApiPropertyOptional({ enum: CancellationReason })
  cancellationReason?: CancellationReason;

  @ApiPropertyOptional()
  cancellationNotes?: string;

  @ApiPropertyOptional()
  cancelledAt?: Date;

  @ApiPropertyOptional()
  cancelledBy?: string;

  @ApiPropertyOptional()
  confirmedAt?: Date;

  @ApiPropertyOptional()
  confirmationMethod?: string;

  @ApiPropertyOptional({ type: [AppointmentReminderResponseDto] })
  reminders?: AppointmentReminderResponseDto[];

  @ApiPropertyOptional({ type: [AppointmentHistoryResponseDto] })
  history?: AppointmentHistoryResponseDto[];

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  createdBy?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIST RESPONSE DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class AppointmentListResponseDto {
  @ApiProperty({ type: [AppointmentResponseDto] })
  data: AppointmentResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiPropertyOptional()
  hasMore?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALENDAR RESPONSE DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class CalendarEventResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  start: Date;

  @ApiProperty()
  end: Date;

  @ApiProperty()
  type: 'APPOINTMENT' | 'BLOCK' | 'VACATION' | 'HOLIDAY';

  @ApiPropertyOptional()
  status?: string;

  @ApiPropertyOptional()
  color?: string;

  @ApiPropertyOptional()
  backgroundColor?: string;

  @ApiPropertyOptional()
  borderColor?: string;

  @ApiPropertyOptional()
  textColor?: string;

  @ApiProperty()
  allDay: boolean;

  @ApiPropertyOptional()
  resourceId?: string;

  @ApiPropertyOptional()
  resourceType?: 'DOCTOR' | 'ROOM';

  @ApiPropertyOptional()
  extendedProps?: {
    appointmentId?: string;
    patientId?: string;
    patientName?: string;
    doctorId?: string;
    doctorName?: string;
    clinicId?: string;
    roomId?: string;
    roomName?: string;
    appointmentType?: string;
    isTelemedicine?: boolean;
    priority?: number;
    notes?: string;
  };
}

export class CalendarResourceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  type: 'DOCTOR' | 'ROOM';

  @ApiPropertyOptional()
  avatarUrl?: string;

  @ApiPropertyOptional()
  specialty?: string;

  @ApiPropertyOptional()
  color?: string;
}

export class CalendarResponseDto {
  @ApiProperty({ type: [CalendarEventResponseDto] })
  events: CalendarEventResponseDto[];

  @ApiPropertyOptional({ type: [CalendarResourceResponseDto] })
  resources?: CalendarResourceResponseDto[];

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiPropertyOptional()
  view?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AVAILABLE SLOT RESPONSE DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class AvailableSlotResponseDto {
  @ApiProperty()
  startTime: Date;

  @ApiProperty()
  endTime: Date;

  @ApiProperty()
  durationMinutes: number;

  @ApiProperty()
  doctorId: string;

  @ApiProperty()
  doctorName: string;

  @ApiPropertyOptional()
  doctorAvatarUrl?: string;

  @ApiPropertyOptional()
  clinicId?: string;

  @ApiPropertyOptional()
  clinicName?: string;

  @ApiPropertyOptional()
  roomId?: string;

  @ApiPropertyOptional()
  roomName?: string;

  @ApiProperty()
  isTelemedicineAvailable: boolean;

  @ApiProperty()
  isInPersonAvailable: boolean;

  @ApiPropertyOptional()
  price?: number;

  @ApiPropertyOptional()
  acceptsInsurance?: boolean;
}

export class AvailableSlotsResponseDto {
  @ApiProperty({ type: [AvailableSlotResponseDto] })
  slots: AvailableSlotResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// WAITING LIST RESPONSE DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class WaitingListEntryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: AppointmentPatientResponseDto })
  patient: AppointmentPatientResponseDto;

  @ApiProperty({ type: AppointmentDoctorResponseDto })
  doctor: AppointmentDoctorResponseDto;

  @ApiProperty({ type: AppointmentClinicResponseDto })
  clinic: AppointmentClinicResponseDto;

  @ApiPropertyOptional()
  specialtyId?: string;

  @ApiPropertyOptional()
  specialtyName?: string;

  @ApiPropertyOptional()
  preferredDate?: Date;

  @ApiPropertyOptional()
  preferredPeriod?: string;

  @ApiPropertyOptional({ type: [Number] })
  availableDays?: number[];

  @ApiProperty()
  priority: number;

  @ApiPropertyOptional()
  urgencyReason?: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional({ type: [String] })
  notifyBy?: string[];

  @ApiPropertyOptional()
  contactedAt?: Date;

  @ApiPropertyOptional()
  scheduledAppointmentId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class WaitingListResponseDto {
  @ApiProperty({ type: [WaitingListEntryResponseDto] })
  data: WaitingListEntryResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATISTICS RESPONSE DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class AppointmentStatsResponseDto {
  @ApiProperty()
  totalAppointments: number;

  @ApiProperty()
  completedAppointments: number;

  @ApiProperty()
  cancelledAppointments: number;

  @ApiProperty()
  noShowAppointments: number;

  @ApiProperty()
  pendingAppointments: number;

  @ApiProperty()
  completionRate: number;

  @ApiProperty()
  cancellationRate: number;

  @ApiProperty()
  noShowRate: number;

  @ApiProperty()
  averageWaitingTime: number;

  @ApiProperty()
  averageConsultationDuration: number;

  @ApiPropertyOptional()
  byType?: Record<string, number>;

  @ApiPropertyOptional()
  byStatus?: Record<string, number>;

  @ApiPropertyOptional()
  byDoctor?: Array<{
    doctorId: string;
    doctorName: string;
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
  }>;

  @ApiPropertyOptional()
  byPeriod?: Array<{
    period: string;
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
  }>;

  @ApiPropertyOptional()
  previousPeriod?: {
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    noShowAppointments: number;
  };

  @ApiPropertyOptional()
  growth?: {
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
}

export class DailyScheduleResponseDto {
  @ApiProperty()
  date: Date;

  @ApiProperty({ type: [AppointmentResponseDto] })
  appointments: AppointmentResponseDto[];

  @ApiProperty()
  totalScheduled: number;

  @ApiProperty()
  totalCompleted: number;

  @ApiProperty()
  totalCancelled: number;

  @ApiProperty()
  totalNoShow: number;

  @ApiProperty()
  totalPending: number;

  @ApiPropertyOptional()
  nextAvailableSlot?: Date;

  @ApiPropertyOptional()
  occupancyRate?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BATCH OPERATION RESPONSE DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class BatchOperationResultDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  total: number;

  @ApiProperty()
  processed: number;

  @ApiProperty()
  failed: number;

  @ApiPropertyOptional({ type: [String] })
  successIds?: string[];

  @ApiPropertyOptional()
  errors?: Array<{
    id: string;
    error: string;
  }>;
}
