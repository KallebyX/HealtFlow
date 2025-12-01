import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  TelemedicineSessionType,
  TelemedicineSessionStatus,
  ConnectionQuality,
  ParticipantRole,
  DeviceType,
} from './create-telemedicine.dto';

export class PatientBasicDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiPropertyOptional()
  cpf?: string;

  @ApiPropertyOptional()
  birthDate?: Date;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  avatarUrl?: string;
}

export class DoctorBasicDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiPropertyOptional()
  crm?: string;

  @ApiPropertyOptional()
  specialty?: string;

  @ApiPropertyOptional()
  avatarUrl?: string;
}

export class ClinicBasicDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  logoUrl?: string;
}

export class ParticipantDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sessionId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: ParticipantRole })
  role: ParticipantRole;

  @ApiPropertyOptional({ enum: DeviceType })
  deviceType?: DeviceType;

  @ApiPropertyOptional()
  joinedAt?: Date;

  @ApiPropertyOptional()
  leftAt?: Date;

  @ApiPropertyOptional()
  isConnected?: boolean;

  @ApiPropertyOptional()
  cameraEnabled?: boolean;

  @ApiPropertyOptional()
  microphoneEnabled?: boolean;

  @ApiPropertyOptional({ enum: ConnectionQuality })
  connectionQuality?: ConnectionQuality;

  @ApiPropertyOptional()
  avatarUrl?: string;

  @ApiPropertyOptional()
  relationship?: string;
}

export class SessionTokenDto {
  @ApiProperty()
  token: string;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  roomId: string;

  @ApiPropertyOptional()
  webrtcConfig?: any;
}

export class TelemedicineSessionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sessionCode: string;

  @ApiPropertyOptional()
  appointmentId?: string;

  @ApiProperty({ type: PatientBasicDto })
  patient: PatientBasicDto;

  @ApiProperty({ type: DoctorBasicDto })
  doctor: DoctorBasicDto;

  @ApiPropertyOptional({ type: ClinicBasicDto })
  clinic?: ClinicBasicDto;

  @ApiProperty({ enum: TelemedicineSessionType })
  sessionType: TelemedicineSessionType;

  @ApiProperty({ enum: TelemedicineSessionStatus })
  status: TelemedicineSessionStatus;

  @ApiProperty()
  scheduledStartTime: Date;

  @ApiPropertyOptional()
  estimatedDuration?: number;

  @ApiPropertyOptional()
  actualStartTime?: Date;

  @ApiPropertyOptional()
  actualEndTime?: Date;

  @ApiPropertyOptional()
  actualDuration?: number;

  @ApiPropertyOptional()
  allowRecording?: boolean;

  @ApiPropertyOptional()
  allowScreenSharing?: boolean;

  @ApiPropertyOptional()
  allowGuests?: boolean;

  @ApiPropertyOptional()
  maxGuests?: number;

  @ApiPropertyOptional()
  enableWaitingRoom?: boolean;

  @ApiPropertyOptional()
  enableChat?: boolean;

  @ApiPropertyOptional()
  enableFileSharing?: boolean;

  @ApiPropertyOptional()
  patientInstructions?: string;

  @ApiPropertyOptional()
  internalNotes?: string;

  @ApiPropertyOptional()
  specialty?: string;

  @ApiPropertyOptional()
  isFollowUp?: boolean;

  @ApiPropertyOptional()
  previousSessionId?: string;

  @ApiPropertyOptional()
  tags?: string[];

  @ApiPropertyOptional({ type: [ParticipantDto] })
  participants?: ParticipantDto[];

  @ApiPropertyOptional()
  isRecording?: boolean;

  @ApiPropertyOptional()
  hasRecording?: boolean;

  @ApiPropertyOptional()
  recordingUrl?: string;

  @ApiPropertyOptional()
  consultationId?: string;

  @ApiPropertyOptional()
  roomUrl?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  cancelledAt?: Date;

  @ApiPropertyOptional()
  cancellationReason?: string;
}

export class TelemedicineSessionListResponseDto {
  @ApiProperty({ type: [TelemedicineSessionResponseDto] })
  data: TelemedicineSessionResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class JoinSessionResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  sessionId: string;

  @ApiProperty()
  participantId: string;

  @ApiProperty({ type: SessionTokenDto })
  sessionToken: SessionTokenDto;

  @ApiPropertyOptional()
  waitingRoom?: boolean;

  @ApiPropertyOptional()
  waitingRoomMessage?: string;

  @ApiPropertyOptional({ type: TelemedicineSessionResponseDto })
  session?: TelemedicineSessionResponseDto;
}

export class ChatMessageDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sessionId: string;

  @ApiProperty()
  senderId: string;

  @ApiProperty()
  senderName: string;

  @ApiProperty({ enum: ParticipantRole })
  senderRole: ParticipantRole;

  @ApiProperty()
  content: string;

  @ApiPropertyOptional()
  messageType?: string;

  @ApiPropertyOptional()
  fileUrl?: string;

  @ApiPropertyOptional()
  fileName?: string;

  @ApiPropertyOptional()
  privateToDoctor?: boolean;

  @ApiProperty()
  sentAt: Date;

  @ApiPropertyOptional()
  readAt?: Date;
}

export class ChatMessagesResponseDto {
  @ApiProperty({ type: [ChatMessageDto] })
  data: ChatMessageDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class SharedFileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sessionId: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  fileUrl: string;

  @ApiPropertyOptional()
  mimeType?: string;

  @ApiPropertyOptional()
  fileSize?: number;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  category?: string;

  @ApiProperty()
  uploadedById: string;

  @ApiProperty()
  uploadedByName: string;

  @ApiProperty()
  uploadedAt: Date;
}

export class SharedFilesResponseDto {
  @ApiProperty({ type: [SharedFileDto] })
  data: SharedFileDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class RecordingDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sessionId: string;

  @ApiProperty()
  recordingType: string;

  @ApiProperty()
  quality: string;

  @ApiProperty()
  startedAt: Date;

  @ApiPropertyOptional()
  endedAt?: Date;

  @ApiPropertyOptional()
  duration?: number;

  @ApiPropertyOptional()
  fileUrl?: string;

  @ApiPropertyOptional()
  fileSize?: number;

  @ApiProperty()
  status: string;
}

export class RecordingsResponseDto {
  @ApiProperty({ type: [RecordingDto] })
  data: RecordingDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class TechnicalIssueDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sessionId: string;

  @ApiProperty()
  reportedById: string;

  @ApiProperty()
  reportedByName: string;

  @ApiProperty()
  issueType: string;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional()
  severity?: string;

  @ApiPropertyOptional()
  deviceInfo?: string;

  @ApiPropertyOptional()
  networkInfo?: string;

  @ApiProperty()
  reportedAt: Date;

  @ApiPropertyOptional()
  resolvedAt?: Date;

  @ApiPropertyOptional()
  resolution?: string;
}

export class TechnicalIssuesResponseDto {
  @ApiProperty({ type: [TechnicalIssueDto] })
  data: TechnicalIssueDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class SessionRatingDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sessionId: string;

  @ApiProperty()
  ratedById: string;

  @ApiProperty()
  overallRating: number;

  @ApiPropertyOptional()
  videoQualityRating?: number;

  @ApiPropertyOptional()
  audioQualityRating?: number;

  @ApiPropertyOptional()
  easeOfUseRating?: number;

  @ApiPropertyOptional()
  doctorRating?: number;

  @ApiPropertyOptional()
  wouldRecommend?: boolean;

  @ApiPropertyOptional()
  comments?: string;

  @ApiProperty()
  createdAt: Date;
}

export class WaitingRoomParticipantDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sessionId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: ParticipantRole })
  role: ParticipantRole;

  @ApiProperty()
  enteredAt: Date;

  @ApiPropertyOptional()
  deviceType?: DeviceType;

  @ApiPropertyOptional()
  status?: string;
}

export class WaitingRoomResponseDto {
  @ApiProperty({ type: [WaitingRoomParticipantDto] })
  participants: WaitingRoomParticipantDto[];

  @ApiProperty()
  total: number;

  @ApiPropertyOptional()
  sessionId?: string;

  @ApiPropertyOptional()
  averageWaitTime?: number;
}

export class ConnectionQualityMetricsDto {
  @ApiProperty()
  participantId: string;

  @ApiProperty({ enum: ConnectionQuality })
  quality: ConnectionQuality;

  @ApiPropertyOptional()
  videoBitrate?: number;

  @ApiPropertyOptional()
  audioBitrate?: number;

  @ApiPropertyOptional()
  latency?: number;

  @ApiPropertyOptional()
  packetLoss?: number;

  @ApiPropertyOptional()
  jitter?: number;

  @ApiProperty()
  timestamp: Date;
}

export class TelemedicineStatisticsResponseDto {
  @ApiProperty()
  period: {
    start: Date;
    end: Date;
  };

  @ApiProperty()
  totalSessions: number;

  @ApiProperty()
  completedSessions: number;

  @ApiProperty()
  cancelledSessions: number;

  @ApiProperty()
  noShowSessions: number;

  @ApiProperty()
  technicalIssueSessions: number;

  @ApiPropertyOptional()
  averageDuration?: number;

  @ApiPropertyOptional()
  totalDuration?: number;

  @ApiPropertyOptional()
  sessionsByType?: Record<string, number>;

  @ApiPropertyOptional()
  sessionsByStatus?: Record<string, number>;

  @ApiPropertyOptional()
  sessionsBySpecialty?: Record<string, number>;

  @ApiPropertyOptional()
  qualityMetrics?: {
    averageVideoQualityRating?: number;
    averageAudioQualityRating?: number;
    averageConnectionQuality?: string;
    technicalIssuesCount?: number;
  };

  @ApiPropertyOptional()
  ratings?: {
    averageOverall?: number;
    averageDoctor?: number;
    averageEaseOfUse?: number;
    wouldRecommendPercentage?: number;
    totalRatings?: number;
  };

  @ApiPropertyOptional()
  dailyBreakdown?: Array<{
    date: string;
    sessions: number;
    completed: number;
    cancelled: number;
    averageDuration?: number;
  }>;

  @ApiPropertyOptional()
  peakHours?: Array<{
    hour: number;
    sessions: number;
  }>;
}

export class DeviceTestResultDto {
  @ApiProperty()
  success: boolean;

  @ApiPropertyOptional()
  camera?: {
    available: boolean;
    name?: string;
    resolution?: string;
    error?: string;
  };

  @ApiPropertyOptional()
  microphone?: {
    available: boolean;
    name?: string;
    volume?: number;
    error?: string;
  };

  @ApiPropertyOptional()
  speaker?: {
    available: boolean;
    name?: string;
    error?: string;
  };

  @ApiPropertyOptional()
  network?: {
    available: boolean;
    speed?: number;
    latency?: number;
    recommendation?: string;
    error?: string;
  };

  @ApiPropertyOptional()
  browser?: {
    supported: boolean;
    name?: string;
    version?: string;
    webrtcSupported?: boolean;
  };

  @ApiPropertyOptional()
  recommendations?: string[];
}

export class UpcomingSessionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sessionCode: string;

  @ApiProperty({ type: PatientBasicDto })
  patient: PatientBasicDto;

  @ApiProperty({ type: DoctorBasicDto })
  doctor: DoctorBasicDto;

  @ApiProperty({ enum: TelemedicineSessionType })
  sessionType: TelemedicineSessionType;

  @ApiProperty()
  scheduledStartTime: Date;

  @ApiPropertyOptional()
  estimatedDuration?: number;

  @ApiPropertyOptional()
  specialty?: string;

  @ApiPropertyOptional()
  isFollowUp?: boolean;

  @ApiPropertyOptional()
  minutesUntilStart?: number;
}

export class UpcomingSessionsResponseDto {
  @ApiProperty({ type: [UpcomingSessionDto] })
  sessions: UpcomingSessionDto[];

  @ApiProperty()
  total: number;

  @ApiPropertyOptional()
  nextSession?: UpcomingSessionDto;
}

export class SessionHistoryResponseDto {
  @ApiProperty({ type: [TelemedicineSessionResponseDto] })
  data: TelemedicineSessionResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiPropertyOptional()
  stats?: {
    totalSessions: number;
    completedSessions: number;
    cancelledSessions: number;
    totalDuration: number;
    averageDuration: number;
    averageRating: number;
  };
}

export class InviteGuestResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  inviteId: string;

  @ApiProperty()
  inviteLink: string;

  @ApiProperty()
  expiresAt: Date;

  @ApiPropertyOptional()
  emailSent?: boolean;

  @ApiPropertyOptional()
  smsSent?: boolean;
}
