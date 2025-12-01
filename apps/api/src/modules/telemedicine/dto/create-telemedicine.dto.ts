import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  Max,
  IsDateString,
  MaxLength,
  IsNotEmpty,
  IsUrl,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TelemedicineSessionType {
  VIDEO_CALL = 'VIDEO_CALL',
  AUDIO_CALL = 'AUDIO_CALL',
  CHAT = 'CHAT',
  HYBRID = 'HYBRID', // Pode alternar entre modalidades
}

export enum TelemedicineSessionStatus {
  SCHEDULED = 'SCHEDULED',
  WAITING_ROOM = 'WAITING_ROOM',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW_PATIENT = 'NO_SHOW_PATIENT',
  NO_SHOW_DOCTOR = 'NO_SHOW_DOCTOR',
  TECHNICAL_ISSUE = 'TECHNICAL_ISSUE',
  RESCHEDULED = 'RESCHEDULED',
}

export enum ConnectionQuality {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  POOR = 'POOR',
  DISCONNECTED = 'DISCONNECTED',
}

export enum ParticipantRole {
  DOCTOR = 'DOCTOR',
  PATIENT = 'PATIENT',
  GUEST = 'GUEST', // Familiar, cuidador, etc.
  INTERPRETER = 'INTERPRETER',
  SPECIALIST = 'SPECIALIST', // Para interconsultas
}

export enum DeviceType {
  DESKTOP = 'DESKTOP',
  MOBILE = 'MOBILE',
  TABLET = 'TABLET',
  SMART_TV = 'SMART_TV',
}

export class CreateTelemedicineSessionDto {
  @ApiProperty({ description: 'ID do agendamento relacionado' })
  @IsUUID()
  appointmentId: string;

  @ApiProperty({ description: 'ID do paciente' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ description: 'ID do médico' })
  @IsUUID()
  doctorId: string;

  @ApiPropertyOptional({ description: 'ID da clínica' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiProperty({ enum: TelemedicineSessionType, description: 'Tipo de sessão' })
  @IsEnum(TelemedicineSessionType)
  sessionType: TelemedicineSessionType;

  @ApiProperty({ description: 'Data e hora de início agendada' })
  @IsDateString()
  scheduledStartTime: string;

  @ApiPropertyOptional({ description: 'Duração estimada em minutos' })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(180)
  estimatedDuration?: number;

  @ApiPropertyOptional({ description: 'Permitir gravação da sessão' })
  @IsOptional()
  @IsBoolean()
  allowRecording?: boolean;

  @ApiPropertyOptional({ description: 'Permitir compartilhamento de tela' })
  @IsOptional()
  @IsBoolean()
  allowScreenSharing?: boolean;

  @ApiPropertyOptional({ description: 'Permitir convidados (familiares, etc.)' })
  @IsOptional()
  @IsBoolean()
  allowGuests?: boolean;

  @ApiPropertyOptional({ description: 'Número máximo de convidados' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  maxGuests?: number;

  @ApiPropertyOptional({ description: 'Habilitar sala de espera virtual' })
  @IsOptional()
  @IsBoolean()
  enableWaitingRoom?: boolean;

  @ApiPropertyOptional({ description: 'Habilitar chat durante chamada' })
  @IsOptional()
  @IsBoolean()
  enableChat?: boolean;

  @ApiPropertyOptional({ description: 'Habilitar compartilhamento de arquivos' })
  @IsOptional()
  @IsBoolean()
  enableFileSharing?: boolean;

  @ApiPropertyOptional({ description: 'Instruções prévias para o paciente' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  patientInstructions?: string;

  @ApiPropertyOptional({ description: 'Notas internas da sessão' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  internalNotes?: string;

  @ApiPropertyOptional({ description: 'Especialidade da consulta' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  specialty?: string;

  @ApiPropertyOptional({ description: 'É retorno' })
  @IsOptional()
  @IsBoolean()
  isFollowUp?: boolean;

  @ApiPropertyOptional({ description: 'ID da consulta anterior (se retorno)' })
  @IsOptional()
  @IsUUID()
  previousSessionId?: string;

  @ApiPropertyOptional({ description: 'Tags/categorias da sessão' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateTelemedicineSessionDto {
  @ApiPropertyOptional({ enum: TelemedicineSessionType })
  @IsOptional()
  @IsEnum(TelemedicineSessionType)
  sessionType?: TelemedicineSessionType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledStartTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(180)
  estimatedDuration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowRecording?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowScreenSharing?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowGuests?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  patientInstructions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  internalNotes?: string;
}

export class JoinSessionDto {
  @ApiProperty({ description: 'ID da sessão' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ enum: ParticipantRole, description: 'Papel do participante' })
  @IsEnum(ParticipantRole)
  role: ParticipantRole;

  @ApiPropertyOptional({ enum: DeviceType, description: 'Tipo de dispositivo' })
  @IsOptional()
  @IsEnum(DeviceType)
  deviceType?: DeviceType;

  @ApiPropertyOptional({ description: 'User Agent do navegador' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  userAgent?: string;

  @ApiPropertyOptional({ description: 'Câmera habilitada' })
  @IsOptional()
  @IsBoolean()
  cameraEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Microfone habilitado' })
  @IsOptional()
  @IsBoolean()
  microphoneEnabled?: boolean;
}

export class LeaveSessionDto {
  @ApiProperty({ description: 'ID da sessão' })
  @IsUUID()
  sessionId: string;

  @ApiPropertyOptional({ description: 'Motivo da saída' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class InviteGuestDto {
  @ApiProperty({ description: 'ID da sessão' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Nome do convidado' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  guestName: string;

  @ApiProperty({ description: 'Email do convidado' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  guestEmail: string;

  @ApiPropertyOptional({ description: 'Telefone do convidado' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  guestPhone?: string;

  @ApiProperty({ enum: ParticipantRole, description: 'Papel do convidado' })
  @IsEnum(ParticipantRole)
  role: ParticipantRole;

  @ApiPropertyOptional({ description: 'Relacionamento com o paciente' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  relationship?: string;
}

export class UpdateConnectionQualityDto {
  @ApiProperty({ description: 'ID da sessão' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ enum: ConnectionQuality, description: 'Qualidade da conexão' })
  @IsEnum(ConnectionQuality)
  quality: ConnectionQuality;

  @ApiPropertyOptional({ description: 'Bitrate do vídeo' })
  @IsOptional()
  @IsNumber()
  videoBitrate?: number;

  @ApiPropertyOptional({ description: 'Bitrate do áudio' })
  @IsOptional()
  @IsNumber()
  audioBitrate?: number;

  @ApiPropertyOptional({ description: 'Latência em ms' })
  @IsOptional()
  @IsNumber()
  latency?: number;

  @ApiPropertyOptional({ description: 'Pacotes perdidos' })
  @IsOptional()
  @IsNumber()
  packetLoss?: number;

  @ApiPropertyOptional({ description: 'Jitter em ms' })
  @IsOptional()
  @IsNumber()
  jitter?: number;
}

export class SendChatMessageDto {
  @ApiProperty({ description: 'ID da sessão' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Conteúdo da mensagem' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({ description: 'Tipo da mensagem' })
  @IsOptional()
  @IsEnum(['TEXT', 'FILE', 'IMAGE', 'LINK'])
  messageType?: string;

  @ApiPropertyOptional({ description: 'URL do arquivo (se aplicável)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  fileUrl?: string;

  @ApiPropertyOptional({ description: 'Nome do arquivo' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  fileName?: string;

  @ApiPropertyOptional({ description: 'Mensagem privada apenas para médico' })
  @IsOptional()
  @IsBoolean()
  privateToDoctor?: boolean;
}

export class ShareFileDto {
  @ApiProperty({ description: 'ID da sessão' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Nome do arquivo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  fileName: string;

  @ApiProperty({ description: 'URL do arquivo' })
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @ApiPropertyOptional({ description: 'Tipo MIME do arquivo' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  mimeType?: string;

  @ApiPropertyOptional({ description: 'Tamanho do arquivo em bytes' })
  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @ApiPropertyOptional({ description: 'Descrição do arquivo' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Categoria do arquivo' })
  @IsOptional()
  @IsEnum(['EXAM_RESULT', 'PRESCRIPTION', 'MEDICAL_REPORT', 'IMAGE', 'OTHER'])
  category?: string;
}

export class EndSessionDto {
  @ApiProperty({ description: 'ID da sessão' })
  @IsUUID()
  sessionId: string;

  @ApiPropertyOptional({ description: 'Status final' })
  @IsOptional()
  @IsEnum([
    TelemedicineSessionStatus.COMPLETED,
    TelemedicineSessionStatus.NO_SHOW_PATIENT,
    TelemedicineSessionStatus.NO_SHOW_DOCTOR,
    TelemedicineSessionStatus.TECHNICAL_ISSUE,
  ])
  finalStatus?: TelemedicineSessionStatus;

  @ApiPropertyOptional({ description: 'Notas de encerramento' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  endNotes?: string;

  @ApiPropertyOptional({ description: 'Gerar consulta automaticamente' })
  @IsOptional()
  @IsBoolean()
  createConsultation?: boolean;

  @ApiPropertyOptional({ description: 'Criar solicitação de exames' })
  @IsOptional()
  @IsBoolean()
  createLabOrder?: boolean;

  @ApiPropertyOptional({ description: 'Criar prescrição' })
  @IsOptional()
  @IsBoolean()
  createPrescription?: boolean;

  @ApiPropertyOptional({ description: 'Agendar retorno' })
  @IsOptional()
  @IsBoolean()
  scheduleFollowUp?: boolean;

  @ApiPropertyOptional({ description: 'Data sugerida para retorno' })
  @IsOptional()
  @IsDateString()
  suggestedFollowUpDate?: string;
}

export class RescheduleSessionDto {
  @ApiProperty({ description: 'ID da sessão' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Nova data e hora' })
  @IsDateString()
  newScheduledTime: string;

  @ApiProperty({ description: 'Motivo do reagendamento' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;

  @ApiPropertyOptional({ description: 'Notificar participantes' })
  @IsOptional()
  @IsBoolean()
  notifyParticipants?: boolean;
}

export class CancelSessionDto {
  @ApiProperty({ description: 'ID da sessão' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Motivo do cancelamento' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;

  @ApiPropertyOptional({ description: 'Cancelado por' })
  @IsOptional()
  @IsEnum(['PATIENT', 'DOCTOR', 'CLINIC', 'SYSTEM'])
  cancelledBy?: string;

  @ApiPropertyOptional({ description: 'Notificar participantes' })
  @IsOptional()
  @IsBoolean()
  notifyParticipants?: boolean;

  @ApiPropertyOptional({ description: 'Reagendar automaticamente' })
  @IsOptional()
  @IsBoolean()
  autoReschedule?: boolean;
}

export class ReportTechnicalIssueDto {
  @ApiProperty({ description: 'ID da sessão' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Tipo do problema' })
  @IsEnum([
    'VIDEO_NOT_WORKING',
    'AUDIO_NOT_WORKING',
    'CONNECTION_LOST',
    'SCREEN_SHARE_FAILED',
    'CHAT_NOT_WORKING',
    'HIGH_LATENCY',
    'ECHO',
    'BACKGROUND_NOISE',
    'OTHER',
  ])
  issueType: string;

  @ApiProperty({ description: 'Descrição do problema' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description: string;

  @ApiPropertyOptional({ description: 'Severidade do problema' })
  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  severity?: string;

  @ApiPropertyOptional({ description: 'Informações do dispositivo' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  deviceInfo?: string;

  @ApiPropertyOptional({ description: 'Informações da rede' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  networkInfo?: string;
}

export class RateSessionDto {
  @ApiProperty({ description: 'ID da sessão' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Avaliação geral (1-5)' })
  @IsNumber()
  @Min(1)
  @Max(5)
  overallRating: number;

  @ApiPropertyOptional({ description: 'Avaliação da qualidade de vídeo (1-5)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  videoQualityRating?: number;

  @ApiPropertyOptional({ description: 'Avaliação da qualidade de áudio (1-5)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  audioQualityRating?: number;

  @ApiPropertyOptional({ description: 'Avaliação da facilidade de uso (1-5)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  easeOfUseRating?: number;

  @ApiPropertyOptional({ description: 'Avaliação do atendimento médico (1-5)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  doctorRating?: number;

  @ApiPropertyOptional({ description: 'Recomendaria a outros' })
  @IsOptional()
  @IsBoolean()
  wouldRecommend?: boolean;

  @ApiPropertyOptional({ description: 'Comentários adicionais' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comments?: string;
}

export class StartRecordingDto {
  @ApiProperty({ description: 'ID da sessão' })
  @IsUUID()
  sessionId: string;

  @ApiPropertyOptional({ description: 'Tipo de gravação' })
  @IsOptional()
  @IsEnum(['VIDEO_AUDIO', 'AUDIO_ONLY', 'SCREEN_ONLY'])
  recordingType?: string;

  @ApiPropertyOptional({ description: 'Qualidade da gravação' })
  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'HD'])
  quality?: string;
}

export class StopRecordingDto {
  @ApiProperty({ description: 'ID da sessão' })
  @IsUUID()
  sessionId: string;

  @ApiPropertyOptional({ description: 'ID da gravação' })
  @IsOptional()
  @IsString()
  recordingId?: string;
}

export class WaitingRoomActionDto {
  @ApiProperty({ description: 'ID da sessão' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'ID do participante' })
  @IsUUID()
  participantId: string;

  @ApiProperty({ description: 'Ação' })
  @IsEnum(['ADMIT', 'DENY', 'PUT_ON_HOLD'])
  action: string;

  @ApiPropertyOptional({ description: 'Mensagem para o participante' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}

export class DeviceTestDto {
  @ApiPropertyOptional({ description: 'Testar câmera' })
  @IsOptional()
  @IsBoolean()
  testCamera?: boolean;

  @ApiPropertyOptional({ description: 'Testar microfone' })
  @IsOptional()
  @IsBoolean()
  testMicrophone?: boolean;

  @ApiPropertyOptional({ description: 'Testar alto-falante' })
  @IsOptional()
  @IsBoolean()
  testSpeaker?: boolean;

  @ApiPropertyOptional({ description: 'Testar rede' })
  @IsOptional()
  @IsBoolean()
  testNetwork?: boolean;
}

export class ScreenShareDto {
  @ApiProperty({ description: 'ID da sessão' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Ação' })
  @IsEnum(['START', 'STOP'])
  action: string;

  @ApiPropertyOptional({ description: 'Tipo de compartilhamento' })
  @IsOptional()
  @IsEnum(['ENTIRE_SCREEN', 'APPLICATION_WINDOW', 'BROWSER_TAB'])
  shareType?: string;
}
