import { apiClient } from './client';
import type {
  VideoCall,
  VideoCallListResponse,
  VideoCallQuery,
  JoinVideoCallResponse,
  ChatMessage,
  SharedFile,
  VideoCallStatus,
} from '@/types/telemedicine';

export const telemedicineApi = {
  // List video calls
  async list(query?: VideoCallQuery): Promise<VideoCallListResponse> {
    const params = new URLSearchParams();

    if (query?.page) params.set('page', query.page.toString());
    if (query?.limit) params.set('limit', query.limit.toString());
    if (query?.patientId) params.set('patientId', query.patientId);
    if (query?.doctorId) params.set('doctorId', query.doctorId);
    if (query?.clinicId) params.set('clinicId', query.clinicId);
    if (query?.dateFrom) params.set('dateFrom', query.dateFrom);
    if (query?.dateTo) params.set('dateTo', query.dateTo);

    if (query?.status) {
      const statuses = Array.isArray(query.status) ? query.status : [query.status];
      statuses.forEach((s) => params.append('status', s));
    }

    const url = `/telemedicine${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.get<VideoCallListResponse>(url);
  },

  // Get video call by ID
  async getById(id: string): Promise<VideoCall> {
    return apiClient.get<VideoCall>(`/telemedicine/${id}`);
  },

  // Get today's video calls
  async getTodayCalls(): Promise<VideoCall[]> {
    const today = new Date().toISOString().split('T')[0];
    const response = await this.list({
      dateFrom: today,
      dateTo: today,
      status: [VideoCallStatus.SCHEDULED, VideoCallStatus.WAITING, VideoCallStatus.IN_PROGRESS],
    });
    return response.data;
  },

  // Get upcoming video calls
  async getUpcoming(limit = 5): Promise<VideoCall[]> {
    const response = await this.list({
      dateFrom: new Date().toISOString(),
      status: [VideoCallStatus.SCHEDULED],
      limit,
    });
    return response.data;
  },

  // Join video call
  async join(id: string): Promise<JoinVideoCallResponse> {
    return apiClient.post<JoinVideoCallResponse>(`/telemedicine/${id}/join`, {});
  },

  // Leave video call
  async leave(id: string): Promise<void> {
    return apiClient.post(`/telemedicine/${id}/leave`, {});
  },

  // Start video call (doctor only)
  async start(id: string): Promise<VideoCall> {
    return apiClient.post<VideoCall>(`/telemedicine/${id}/start`, {});
  },

  // End video call
  async end(id: string): Promise<VideoCall> {
    return apiClient.post<VideoCall>(`/telemedicine/${id}/end`, {});
  },

  // Admit participant from waiting room (doctor only)
  async admitParticipant(callId: string, participantId: string): Promise<void> {
    return apiClient.post(`/telemedicine/${callId}/admit/${participantId}`, {});
  },

  // Remove participant from call (doctor only)
  async removeParticipant(callId: string, participantId: string): Promise<void> {
    return apiClient.delete(`/telemedicine/${callId}/participant/${participantId}`);
  },

  // Send chat message
  async sendMessage(callId: string, message: string): Promise<ChatMessage> {
    return apiClient.post<ChatMessage>(`/telemedicine/${callId}/chat`, { message });
  },

  // Get chat messages
  async getMessages(callId: string): Promise<ChatMessage[]> {
    return apiClient.get<ChatMessage[]>(`/telemedicine/${callId}/chat`);
  },

  // Upload file
  async uploadFile(callId: string, file: File): Promise<SharedFile> {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.upload<SharedFile>(`/telemedicine/${callId}/files`, formData);
  },

  // Get shared files
  async getFiles(callId: string): Promise<SharedFile[]> {
    return apiClient.get<SharedFile[]>(`/telemedicine/${callId}/files`);
  },

  // Update call notes (doctor only)
  async updateNotes(callId: string, notes: string): Promise<VideoCall> {
    return apiClient.patch<VideoCall>(`/telemedicine/${callId}/notes`, { notes });
  },

  // Update call summary (doctor only)
  async updateSummary(callId: string, summary: string): Promise<VideoCall> {
    return apiClient.patch<VideoCall>(`/telemedicine/${callId}/summary`, { summary });
  },

  // Report technical issue
  async reportIssue(callId: string, issue: string): Promise<void> {
    return apiClient.post(`/telemedicine/${callId}/issue`, { issue });
  },

  // Check device permissions
  async checkDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      stream.getTracks().forEach((track) => track.stop());
      return navigator.mediaDevices.enumerateDevices();
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  },

  // Get connection quality
  async getConnectionQuality(callId: string): Promise<{ quality: string; pingMs: number }> {
    return apiClient.get(`/telemedicine/${callId}/quality`);
  },

  // Start recording (doctor only)
  async startRecording(callId: string): Promise<void> {
    return apiClient.post(`/telemedicine/${callId}/recording/start`, {});
  },

  // Stop recording (doctor only)
  async stopRecording(callId: string): Promise<void> {
    return apiClient.post(`/telemedicine/${callId}/recording/stop`, {});
  },

  // Toggle mute
  toggleMute(stream: MediaStream, muted: boolean): void {
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !muted;
    });
  },

  // Toggle video
  toggleVideo(stream: MediaStream, videoOff: boolean): void {
    stream.getVideoTracks().forEach((track) => {
      track.enabled = !videoOff;
    });
  },
};

// WebSocket for real-time communication
export class TelemedicineWebSocket {
  private ws: WebSocket | null = null;
  private callId: string;
  private onMessage: (data: unknown) => void;
  private onError: (error: Event) => void;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(
    callId: string,
    onMessage: (data: unknown) => void,
    onError: (error: Event) => void
  ) {
    this.callId = callId;
    this.onMessage = onMessage;
    this.onError = onError;
  }

  connect(token: string): void {
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/telemedicine/${this.callId}?token=${token}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.onMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.onError(error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed');
      this.attemptReconnect(token);
    };
  }

  private attemptReconnect(token: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      setTimeout(() => this.connect(token), delay);
    }
  }

  send(type: string, data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
