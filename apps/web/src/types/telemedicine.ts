// ============================================================
// TELEMEDICINE TYPES
// Tipos para teleconsulta/telemedicina
// ============================================================

export enum VideoCallStatus {
  SCHEDULED = 'SCHEDULED',
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  TECHNICAL_ISSUE = 'TECHNICAL_ISSUE',
}

export enum ParticipantRole {
  DOCTOR = 'DOCTOR',
  PATIENT = 'PATIENT',
  GUEST = 'GUEST',
}

export enum ParticipantStatus {
  INVITED = 'INVITED',
  WAITING = 'WAITING',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
}

export interface VideoCallParticipant {
  id: string;
  userId: string;
  name: string;
  role: ParticipantRole;
  status: ParticipantStatus;
  joinedAt?: string;
  leftAt?: string;
  avatarUrl?: string;
  isMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
}

export interface VideoCallSettings {
  allowRecording: boolean;
  allowScreenSharing: boolean;
  allowChat: boolean;
  allowFileSharing: boolean;
  maxDuration: number; // in minutes
  waitingRoomEnabled: boolean;
  autoRecordEnabled: boolean;
}

export interface ChatMessage {
  id: string;
  videoCallId: string;
  senderId: string;
  senderName: string;
  senderRole: ParticipantRole;
  message: string;
  timestamp: string;
  isSystemMessage: boolean;
}

export interface SharedFile {
  id: string;
  videoCallId: string;
  uploaderId: string;
  uploaderName: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface VideoCall {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  clinicId?: string;

  // Status
  status: VideoCallStatus;

  // Schedule
  scheduledAt: string;
  scheduledDuration: number; // in minutes

  // Actual times
  startedAt?: string;
  endedAt?: string;
  actualDuration?: number;

  // Room
  roomId: string;
  roomUrl: string;
  accessToken?: string;

  // Settings
  settings: VideoCallSettings;

  // Participants
  participants: VideoCallParticipant[];

  // Chat
  chatMessages?: ChatMessage[];

  // Files
  sharedFiles?: SharedFile[];

  // Recording
  isRecorded: boolean;
  recordingUrl?: string;
  recordingDuration?: number;

  // Notes
  doctorNotes?: string;
  consultationSummary?: string;

  // Technical info
  connectionQuality?: 'poor' | 'fair' | 'good' | 'excellent';
  lastPingMs?: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Relations
  patient?: {
    id: string;
    fullName: string;
    socialName?: string;
    avatarUrl?: string;
  };
  doctor?: {
    id: string;
    fullName: string;
    socialName?: string;
    crm: string;
    crmState: string;
    specialty?: string;
    avatarUrl?: string;
  };
}

export interface VideoCallListResponse {
  data: VideoCall[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface VideoCallQuery {
  page?: number;
  limit?: number;
  patientId?: string;
  doctorId?: string;
  clinicId?: string;
  status?: VideoCallStatus | VideoCallStatus[];
  dateFrom?: string;
  dateTo?: string;
}

export interface JoinVideoCallResponse {
  roomUrl: string;
  accessToken: string;
  iceServers: RTCIceServer[];
  participant: VideoCallParticipant;
}

export interface DeviceInfo {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput' | 'videoinput';
}

export interface MediaDevicesState {
  audioInputs: DeviceInfo[];
  audioOutputs: DeviceInfo[];
  videoInputs: DeviceInfo[];
  selectedAudioInput?: string;
  selectedAudioOutput?: string;
  selectedVideoInput?: string;
  hasPermission: boolean;
  error?: string;
}

// Helper functions
export function getVideoCallStatusLabel(status: VideoCallStatus): string {
  const labels: Record<VideoCallStatus, string> = {
    [VideoCallStatus.SCHEDULED]: 'Agendada',
    [VideoCallStatus.WAITING]: 'Aguardando',
    [VideoCallStatus.IN_PROGRESS]: 'Em Andamento',
    [VideoCallStatus.COMPLETED]: 'Finalizada',
    [VideoCallStatus.CANCELLED]: 'Cancelada',
    [VideoCallStatus.NO_SHOW]: 'Nao Compareceu',
    [VideoCallStatus.TECHNICAL_ISSUE]: 'Problema Tecnico',
  };
  return labels[status];
}

export function getVideoCallStatusColor(status: VideoCallStatus): string {
  const colors: Record<VideoCallStatus, string> = {
    [VideoCallStatus.SCHEDULED]: 'bg-blue-100 text-blue-800',
    [VideoCallStatus.WAITING]: 'bg-yellow-100 text-yellow-800',
    [VideoCallStatus.IN_PROGRESS]: 'bg-green-100 text-green-800',
    [VideoCallStatus.COMPLETED]: 'bg-gray-100 text-gray-800',
    [VideoCallStatus.CANCELLED]: 'bg-red-100 text-red-800',
    [VideoCallStatus.NO_SHOW]: 'bg-orange-100 text-orange-800',
    [VideoCallStatus.TECHNICAL_ISSUE]: 'bg-purple-100 text-purple-800',
  };
  return colors[status];
}

export function getParticipantStatusLabel(status: ParticipantStatus): string {
  const labels: Record<ParticipantStatus, string> = {
    [ParticipantStatus.INVITED]: 'Convidado',
    [ParticipantStatus.WAITING]: 'Na sala de espera',
    [ParticipantStatus.CONNECTED]: 'Conectado',
    [ParticipantStatus.DISCONNECTED]: 'Desconectado',
  };
  return labels[status];
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

export function formatConnectionQuality(quality: string): string {
  const labels: Record<string, string> = {
    poor: 'Ruim',
    fair: 'Regular',
    good: 'Boa',
    excellent: 'Excelente',
  };
  return labels[quality] || quality;
}
