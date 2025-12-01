import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/database/prisma.service';
import { CacheService } from '@/common/services/cache.service';
import { AuditService } from '@/common/services/audit.service';
import { UserRole } from '@/common/enums/user-role.enum';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';

import {
  CreateTelemedicineSessionDto,
  UpdateTelemedicineSessionDto,
  JoinSessionDto,
  LeaveSessionDto,
  InviteGuestDto,
  UpdateConnectionQualityDto,
  SendChatMessageDto,
  ShareFileDto,
  EndSessionDto,
  RescheduleSessionDto,
  CancelSessionDto,
  ReportTechnicalIssueDto,
  RateSessionDto,
  StartRecordingDto,
  StopRecordingDto,
  WaitingRoomActionDto,
  DeviceTestDto,
  ScreenShareDto,
  TelemedicineSessionStatus,
  TelemedicineSessionType,
  ParticipantRole,
  ConnectionQuality,
} from './dto/create-telemedicine.dto';
import {
  TelemedicineSessionQueryDto,
  UpcomingSessionsQueryDto,
  SessionHistoryQueryDto,
  ChatMessagesQueryDto,
  SharedFilesQueryDto,
  TelemedicineStatisticsQueryDto,
  WaitingRoomQueryDto,
  RecordingsQueryDto,
  TechnicalIssuesQueryDto,
} from './dto/telemedicine-query.dto';

@Injectable()
export class TelemedicineService {
  private readonly jwtSecret: string;
  private readonly webrtcConfig: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.jwtSecret = this.configService.get('JWT_SECRET');
    this.webrtcConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        {
          urls: this.configService.get('TURN_SERVER_URL'),
          username: this.configService.get('TURN_USERNAME'),
          credential: this.configService.get('TURN_CREDENTIAL'),
        },
      ].filter(s => s.urls),
    };
  }

  // ==================== CRUD de Sessões ====================

  async createSession(dto: CreateTelemedicineSessionDto, requesterId: string, requesterRole: UserRole) {
    // Verificar paciente
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId, deletedAt: null },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado');
    }

    // Verificar médico
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: dto.doctorId, deletedAt: null },
    });

    if (!doctor) {
      throw new NotFoundException('Médico não encontrado');
    }

    // Verificar agendamento se informado
    if (dto.appointmentId) {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: dto.appointmentId },
      });

      if (!appointment) {
        throw new NotFoundException('Agendamento não encontrado');
      }

      if (appointment.patientId !== dto.patientId || appointment.doctorId !== dto.doctorId) {
        throw new BadRequestException('Agendamento não corresponde ao paciente/médico informado');
      }

      // Verificar se já existe sessão para este agendamento
      const existingSession = await this.prisma.telemedicineSession.findFirst({
        where: {
          appointmentId: dto.appointmentId,
          status: { notIn: [TelemedicineSessionStatus.CANCELLED, TelemedicineSessionStatus.RESCHEDULED] },
        },
      });

      if (existingSession) {
        throw new ConflictException('Já existe uma sessão de telemedicina para este agendamento');
      }
    }

    // Verificar sessão anterior se retorno
    if (dto.isFollowUp && dto.previousSessionId) {
      const previousSession = await this.prisma.telemedicineSession.findUnique({
        where: { id: dto.previousSessionId },
      });

      if (!previousSession || previousSession.patientId !== dto.patientId) {
        throw new BadRequestException('Sessão anterior inválida');
      }
    }

    // Gerar código da sessão
    const sessionCode = await this.generateSessionCode();

    // Gerar ID da sala
    const roomId = this.generateRoomId();

    // Criar sessão
    const session = await this.prisma.telemedicineSession.create({
      data: {
        sessionCode,
        roomId,
        appointmentId: dto.appointmentId,
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        clinicId: dto.clinicId,
        sessionType: dto.sessionType,
        status: TelemedicineSessionStatus.SCHEDULED,
        scheduledStartTime: new Date(dto.scheduledStartTime),
        estimatedDuration: dto.estimatedDuration || 30,
        allowRecording: dto.allowRecording || false,
        allowScreenSharing: dto.allowScreenSharing !== false,
        allowGuests: dto.allowGuests || false,
        maxGuests: dto.maxGuests || 2,
        enableWaitingRoom: dto.enableWaitingRoom !== false,
        enableChat: dto.enableChat !== false,
        enableFileSharing: dto.enableFileSharing !== false,
        patientInstructions: dto.patientInstructions,
        internalNotes: dto.internalNotes,
        specialty: dto.specialty || doctor.specialty,
        isFollowUp: dto.isFollowUp || false,
        previousSessionId: dto.previousSessionId,
        tags: dto.tags,
        createdById: requesterId,
      },
      include: this.getSessionIncludes(),
    });

    // Auditoria
    await this.auditService.log({
      action: 'TELEMEDICINE_SESSION_CREATED',
      entityType: 'TelemedicineSession',
      entityId: session.id,
      userId: requesterId,
      details: {
        sessionCode,
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        sessionType: dto.sessionType,
        scheduledStartTime: dto.scheduledStartTime,
      },
    });

    // Notificar paciente
    this.eventEmitter.emit('notification.send', {
      type: 'TELEMEDICINE_SESSION_SCHEDULED',
      recipientId: patient.userId,
      data: {
        sessionCode,
        scheduledStartTime: dto.scheduledStartTime,
        doctorName: doctor.fullName,
        specialty: dto.specialty || doctor.specialty,
        instructions: dto.patientInstructions,
      },
    });

    // Notificar médico
    this.eventEmitter.emit('notification.send', {
      type: 'TELEMEDICINE_SESSION_SCHEDULED',
      recipientId: doctor.userId,
      data: {
        sessionCode,
        scheduledStartTime: dto.scheduledStartTime,
        patientName: patient.fullName,
      },
    });

    // Agendar lembrete
    const reminderTime = new Date(new Date(dto.scheduledStartTime).getTime() - 15 * 60 * 1000);
    this.eventEmitter.emit('notification.schedule', {
      type: 'TELEMEDICINE_SESSION_REMINDER',
      recipientIds: [patient.userId, doctor.userId],
      scheduledFor: reminderTime,
      data: {
        sessionCode,
        scheduledStartTime: dto.scheduledStartTime,
      },
    });

    return this.formatSessionResponse(session);
  }

  async findAllSessions(query: TelemedicineSessionQueryDto, requesterId: string, requesterRole: UserRole) {
    const {
      page = 1,
      limit = 20,
      patientId,
      doctorId,
      clinicId,
      appointmentId,
      status,
      statuses,
      sessionType,
      startDate,
      endDate,
      todayOnly,
      activeOnly,
      specialty,
      isFollowUp,
      hasRecording,
      sortBy = 'scheduledStartTime',
      sortOrder = 'desc',
      includeCancelled = false,
    } = query;

    const where: Prisma.TelemedicineSessionWhereInput = {
      deletedAt: null,
    };

    // Filtros de acesso baseados em role
    if (requesterRole === UserRole.PATIENT) {
      const patient = await this.prisma.patient.findFirst({
        where: { userId: requesterId },
      });
      if (patient) {
        where.patientId = patient.id;
      }
    } else if (requesterRole === UserRole.DOCTOR) {
      const doctor = await this.prisma.doctor.findFirst({
        where: { userId: requesterId },
      });
      if (doctor && !patientId) {
        where.doctorId = doctor.id;
      }
    }

    // Aplicar filtros
    if (patientId) where.patientId = patientId;
    if (doctorId) where.doctorId = doctorId;
    if (clinicId) where.clinicId = clinicId;
    if (appointmentId) where.appointmentId = appointmentId;
    if (status) where.status = status;
    if (statuses && statuses.length > 0) {
      where.status = { in: statuses };
    }
    if (sessionType) where.sessionType = sessionType;
    if (specialty) where.specialty = specialty;
    if (isFollowUp !== undefined) where.isFollowUp = isFollowUp;
    if (hasRecording !== undefined) where.hasRecording = hasRecording;

    if (!includeCancelled) {
      where.status = where.status || { not: TelemedicineSessionStatus.CANCELLED };
    }

    // Filtros de data
    if (todayOnly) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      where.scheduledStartTime = {
        gte: today,
        lt: tomorrow,
      };
    } else if (startDate || endDate) {
      where.scheduledStartTime = {};
      if (startDate) where.scheduledStartTime.gte = new Date(startDate);
      if (endDate) where.scheduledStartTime.lte = new Date(endDate);
    }

    if (activeOnly) {
      where.status = { in: [TelemedicineSessionStatus.WAITING_ROOM, TelemedicineSessionStatus.IN_PROGRESS] };
    }

    const [data, total] = await Promise.all([
      this.prisma.telemedicineSession.findMany({
        where,
        include: this.getSessionIncludes(),
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.telemedicineSession.count({ where }),
    ]);

    return {
      data: data.map(session => this.formatSessionResponse(session)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findSessionById(id: string, requesterId: string, requesterRole: UserRole) {
    const session = await this.prisma.telemedicineSession.findUnique({
      where: { id, deletedAt: null },
      include: this.getSessionIncludes(),
    });

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    await this.verifySessionAccess(session, requesterId, requesterRole);

    return this.formatSessionResponse(session);
  }

  async findSessionByCode(sessionCode: string, requesterId: string, requesterRole: UserRole) {
    const session = await this.prisma.telemedicineSession.findFirst({
      where: { sessionCode, deletedAt: null },
      include: this.getSessionIncludes(),
    });

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    await this.verifySessionAccess(session, requesterId, requesterRole);

    return this.formatSessionResponse(session);
  }

  async updateSession(id: string, dto: UpdateTelemedicineSessionDto, requesterId: string, requesterRole: UserRole) {
    const session = await this.prisma.telemedicineSession.findUnique({
      where: { id, deletedAt: null },
    });

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    await this.verifySessionAccess(session, requesterId, requesterRole, true);

    // Verificar se pode ser editada
    if (session.status !== TelemedicineSessionStatus.SCHEDULED) {
      throw new BadRequestException('Apenas sessões agendadas podem ser editadas');
    }

    const updated = await this.prisma.telemedicineSession.update({
      where: { id },
      data: {
        sessionType: dto.sessionType,
        scheduledStartTime: dto.scheduledStartTime ? new Date(dto.scheduledStartTime) : undefined,
        estimatedDuration: dto.estimatedDuration,
        allowRecording: dto.allowRecording,
        allowScreenSharing: dto.allowScreenSharing,
        allowGuests: dto.allowGuests,
        patientInstructions: dto.patientInstructions,
        internalNotes: dto.internalNotes,
      },
      include: this.getSessionIncludes(),
    });

    await this.auditService.log({
      action: 'TELEMEDICINE_SESSION_UPDATED',
      entityType: 'TelemedicineSession',
      entityId: id,
      userId: requesterId,
      details: dto,
    });

    return this.formatSessionResponse(updated);
  }

  // ==================== Fluxo da Sessão ====================

  async joinSession(dto: JoinSessionDto, requesterId: string, requesterRole: UserRole) {
    const session = await this.prisma.telemedicineSession.findUnique({
      where: { id: dto.sessionId, deletedAt: null },
      include: {
        patient: true,
        doctor: true,
        participants: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    // Verificar status
    const validStatuses = [
      TelemedicineSessionStatus.SCHEDULED,
      TelemedicineSessionStatus.WAITING_ROOM,
      TelemedicineSessionStatus.IN_PROGRESS,
      TelemedicineSessionStatus.ON_HOLD,
    ];

    if (!validStatuses.includes(session.status as TelemedicineSessionStatus)) {
      throw new BadRequestException('Sessão não está disponível para entrada');
    }

    // Verificar permissão de acesso
    await this.verifySessionAccess(session, requesterId, requesterRole);

    // Determinar dados do participante
    let participantUserId: string;
    let participantName: string;

    if (dto.role === ParticipantRole.DOCTOR) {
      if (requesterRole !== UserRole.DOCTOR) {
        throw new ForbiddenException('Apenas médicos podem entrar como médico');
      }
      participantUserId = session.doctor.userId;
      participantName = session.doctor.fullName;
    } else if (dto.role === ParticipantRole.PATIENT) {
      participantUserId = session.patient.userId;
      participantName = session.patient.fullName;
    } else {
      // Convidado
      participantUserId = requesterId;
      participantName = 'Convidado';
    }

    // Verificar se já está na sessão
    let participant = await this.prisma.telemedicineParticipant.findFirst({
      where: {
        sessionId: dto.sessionId,
        userId: participantUserId,
      },
    });

    if (participant) {
      // Atualizar participante existente
      participant = await this.prisma.telemedicineParticipant.update({
        where: { id: participant.id },
        data: {
          isConnected: true,
          joinedAt: new Date(),
          leftAt: null,
          deviceType: dto.deviceType,
          userAgent: dto.userAgent,
          cameraEnabled: dto.cameraEnabled ?? true,
          microphoneEnabled: dto.microphoneEnabled ?? true,
        },
      });
    } else {
      // Criar novo participante
      participant = await this.prisma.telemedicineParticipant.create({
        data: {
          sessionId: dto.sessionId,
          userId: participantUserId,
          name: participantName,
          role: dto.role,
          deviceType: dto.deviceType,
          userAgent: dto.userAgent,
          isConnected: true,
          joinedAt: new Date(),
          cameraEnabled: dto.cameraEnabled ?? true,
          microphoneEnabled: dto.microphoneEnabled ?? true,
        },
      });
    }

    // Se tem sala de espera e é paciente/convidado, coloca na espera
    let needsWaitingRoom = false;
    if (session.enableWaitingRoom && dto.role !== ParticipantRole.DOCTOR) {
      // Verificar se médico já está na sessão
      const doctorConnected = session.participants.some(
        p => p.role === ParticipantRole.DOCTOR && p.isConnected,
      );

      if (!doctorConnected) {
        needsWaitingRoom = true;

        await this.prisma.telemedicineParticipant.update({
          where: { id: participant.id },
          data: { waitingRoomStatus: 'WAITING' },
        });
      }
    }

    // Atualizar status da sessão se necessário
    let newStatus = session.status;
    if (session.status === TelemedicineSessionStatus.SCHEDULED) {
      newStatus = session.enableWaitingRoom
        ? TelemedicineSessionStatus.WAITING_ROOM
        : TelemedicineSessionStatus.IN_PROGRESS;
    }

    // Se médico entrou e há pacientes esperando, iniciar sessão
    if (dto.role === ParticipantRole.DOCTOR && session.status === TelemedicineSessionStatus.WAITING_ROOM) {
      newStatus = TelemedicineSessionStatus.IN_PROGRESS;
    }

    if (newStatus !== session.status) {
      await this.prisma.telemedicineSession.update({
        where: { id: dto.sessionId },
        data: {
          status: newStatus,
          actualStartTime: newStatus === TelemedicineSessionStatus.IN_PROGRESS ? new Date() : undefined,
        },
      });
    }

    // Gerar token de sessão
    const sessionToken = this.generateSessionToken(dto.sessionId, participantUserId, dto.role);

    // Auditoria
    await this.auditService.log({
      action: 'TELEMEDICINE_SESSION_JOINED',
      entityType: 'TelemedicineSession',
      entityId: dto.sessionId,
      userId: requesterId,
      details: {
        role: dto.role,
        deviceType: dto.deviceType,
      },
    });

    // Evento
    this.eventEmitter.emit('telemedicine.participantJoined', {
      sessionId: dto.sessionId,
      participant,
    });

    return {
      success: true,
      sessionId: dto.sessionId,
      participantId: participant.id,
      sessionToken: {
        token: sessionToken,
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 horas
        roomId: session.roomId,
        webrtcConfig: this.webrtcConfig,
      },
      waitingRoom: needsWaitingRoom,
      waitingRoomMessage: needsWaitingRoom ? 'Aguarde o médico iniciar a consulta' : undefined,
    };
  }

  async leaveSession(dto: LeaveSessionDto, requesterId: string) {
    const participant = await this.prisma.telemedicineParticipant.findFirst({
      where: {
        sessionId: dto.sessionId,
        userId: requesterId,
        isConnected: true,
      },
    });

    if (!participant) {
      throw new NotFoundException('Participante não encontrado na sessão');
    }

    await this.prisma.telemedicineParticipant.update({
      where: { id: participant.id },
      data: {
        isConnected: false,
        leftAt: new Date(),
        leaveReason: dto.reason,
      },
    });

    // Verificar se ainda há participantes conectados
    const connectedCount = await this.prisma.telemedicineParticipant.count({
      where: {
        sessionId: dto.sessionId,
        isConnected: true,
      },
    });

    // Se não há mais participantes, colocar em espera
    if (connectedCount === 0) {
      const session = await this.prisma.telemedicineSession.findUnique({
        where: { id: dto.sessionId },
      });

      if (session?.status === TelemedicineSessionStatus.IN_PROGRESS) {
        await this.prisma.telemedicineSession.update({
          where: { id: dto.sessionId },
          data: { status: TelemedicineSessionStatus.ON_HOLD },
        });
      }
    }

    // Evento
    this.eventEmitter.emit('telemedicine.participantLeft', {
      sessionId: dto.sessionId,
      participantId: participant.id,
      reason: dto.reason,
    });

    await this.auditService.log({
      action: 'TELEMEDICINE_SESSION_LEFT',
      entityType: 'TelemedicineSession',
      entityId: dto.sessionId,
      userId: requesterId,
      details: { reason: dto.reason },
    });

    return { success: true };
  }

  async endSession(dto: EndSessionDto, requesterId: string, requesterRole: UserRole) {
    const session = await this.prisma.telemedicineSession.findUnique({
      where: { id: dto.sessionId, deletedAt: null },
      include: { patient: true, doctor: true },
    });

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    await this.verifySessionAccess(session, requesterId, requesterRole, true);

    // Calcular duração
    let actualDuration = null;
    if (session.actualStartTime) {
      actualDuration = Math.round((Date.now() - session.actualStartTime.getTime()) / (1000 * 60));
    }

    const finalStatus = dto.finalStatus || TelemedicineSessionStatus.COMPLETED;

    // Atualizar sessão
    const updated = await this.prisma.telemedicineSession.update({
      where: { id: dto.sessionId },
      data: {
        status: finalStatus,
        actualEndTime: new Date(),
        actualDuration,
        endNotes: dto.endNotes,
      },
      include: this.getSessionIncludes(),
    });

    // Desconectar todos os participantes
    await this.prisma.telemedicineParticipant.updateMany({
      where: {
        sessionId: dto.sessionId,
        isConnected: true,
      },
      data: {
        isConnected: false,
        leftAt: new Date(),
      },
    });

    // Se deve criar consulta
    if (dto.createConsultation && finalStatus === TelemedicineSessionStatus.COMPLETED) {
      // Emitir evento para criar consulta
      this.eventEmitter.emit('consultation.createFromTelemedicine', {
        sessionId: dto.sessionId,
        patientId: session.patientId,
        doctorId: session.doctorId,
        clinicId: session.clinicId,
      });
    }

    // Gamificação
    this.eventEmitter.emit('gamification.action', {
      userId: session.doctor.userId,
      action: 'TELEMEDICINE_SESSION_COMPLETED',
      metadata: { sessionId: dto.sessionId, duration: actualDuration },
    });

    // Auditoria
    await this.auditService.log({
      action: 'TELEMEDICINE_SESSION_ENDED',
      entityType: 'TelemedicineSession',
      entityId: dto.sessionId,
      userId: requesterId,
      details: {
        finalStatus,
        duration: actualDuration,
      },
    });

    // Eventos
    this.eventEmitter.emit('telemedicine.sessionEnded', { session: updated });

    // Notificar para avaliação
    if (finalStatus === TelemedicineSessionStatus.COMPLETED) {
      this.eventEmitter.emit('notification.send', {
        type: 'TELEMEDICINE_SESSION_COMPLETED_RATE',
        recipientId: session.patient.userId,
        data: {
          sessionId: dto.sessionId,
          doctorName: session.doctor.fullName,
        },
      });
    }

    return this.formatSessionResponse(updated);
  }

  async rescheduleSession(dto: RescheduleSessionDto, requesterId: string, requesterRole: UserRole) {
    const session = await this.prisma.telemedicineSession.findUnique({
      where: { id: dto.sessionId, deletedAt: null },
      include: { patient: true, doctor: true },
    });

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    await this.verifySessionAccess(session, requesterId, requesterRole, true);

    if (session.status !== TelemedicineSessionStatus.SCHEDULED) {
      throw new BadRequestException('Apenas sessões agendadas podem ser reagendadas');
    }

    const updated = await this.prisma.telemedicineSession.update({
      where: { id: dto.sessionId },
      data: {
        scheduledStartTime: new Date(dto.newScheduledTime),
        rescheduleReason: dto.reason,
        rescheduledAt: new Date(),
        rescheduledById: requesterId,
      },
      include: this.getSessionIncludes(),
    });

    // Notificar participantes
    if (dto.notifyParticipants !== false) {
      this.eventEmitter.emit('notification.send', {
        type: 'TELEMEDICINE_SESSION_RESCHEDULED',
        recipientId: session.patient.userId,
        data: {
          sessionCode: session.sessionCode,
          oldTime: session.scheduledStartTime,
          newTime: dto.newScheduledTime,
          reason: dto.reason,
        },
      });

      this.eventEmitter.emit('notification.send', {
        type: 'TELEMEDICINE_SESSION_RESCHEDULED',
        recipientId: session.doctor.userId,
        data: {
          sessionCode: session.sessionCode,
          patientName: session.patient.fullName,
          oldTime: session.scheduledStartTime,
          newTime: dto.newScheduledTime,
          reason: dto.reason,
        },
      });
    }

    await this.auditService.log({
      action: 'TELEMEDICINE_SESSION_RESCHEDULED',
      entityType: 'TelemedicineSession',
      entityId: dto.sessionId,
      userId: requesterId,
      details: { newTime: dto.newScheduledTime, reason: dto.reason },
    });

    return this.formatSessionResponse(updated);
  }

  async cancelSession(dto: CancelSessionDto, requesterId: string, requesterRole: UserRole) {
    const session = await this.prisma.telemedicineSession.findUnique({
      where: { id: dto.sessionId, deletedAt: null },
      include: { patient: true, doctor: true },
    });

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    await this.verifySessionAccess(session, requesterId, requesterRole, true);

    const cancellableStatuses = [
      TelemedicineSessionStatus.SCHEDULED,
      TelemedicineSessionStatus.WAITING_ROOM,
    ];

    if (!cancellableStatuses.includes(session.status as TelemedicineSessionStatus)) {
      throw new BadRequestException('Sessão não pode ser cancelada no status atual');
    }

    const updated = await this.prisma.telemedicineSession.update({
      where: { id: dto.sessionId },
      data: {
        status: TelemedicineSessionStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: dto.reason,
        cancelledBy: dto.cancelledBy,
        cancelledById: requesterId,
      },
      include: this.getSessionIncludes(),
    });

    // Notificar participantes
    if (dto.notifyParticipants !== false) {
      this.eventEmitter.emit('notification.send', {
        type: 'TELEMEDICINE_SESSION_CANCELLED',
        recipientId: session.patient.userId,
        data: {
          sessionCode: session.sessionCode,
          reason: dto.reason,
        },
      });

      this.eventEmitter.emit('notification.send', {
        type: 'TELEMEDICINE_SESSION_CANCELLED',
        recipientId: session.doctor.userId,
        data: {
          sessionCode: session.sessionCode,
          patientName: session.patient.fullName,
          reason: dto.reason,
        },
      });
    }

    await this.auditService.log({
      action: 'TELEMEDICINE_SESSION_CANCELLED',
      entityType: 'TelemedicineSession',
      entityId: dto.sessionId,
      userId: requesterId,
      details: { reason: dto.reason },
    });

    return this.formatSessionResponse(updated);
  }

  // ==================== Sala de Espera ====================

  async getWaitingRoom(query: WaitingRoomQueryDto, requesterId: string) {
    const where: Prisma.TelemedicineParticipantWhereInput = {
      waitingRoomStatus: 'WAITING',
    };

    if (query.sessionId) {
      where.sessionId = query.sessionId;
    }

    if (query.doctorId) {
      where.session = { doctorId: query.doctorId };
    }

    const participants = await this.prisma.telemedicineParticipant.findMany({
      where,
      include: {
        session: {
          select: {
            id: true,
            sessionCode: true,
            scheduledStartTime: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return {
      participants: participants.map(p => ({
        id: p.id,
        sessionId: p.sessionId,
        userId: p.userId,
        name: p.name,
        role: p.role,
        enteredAt: p.joinedAt,
        deviceType: p.deviceType,
        status: p.waitingRoomStatus,
      })),
      total: participants.length,
      sessionId: query.sessionId,
    };
  }

  async waitingRoomAction(dto: WaitingRoomActionDto, requesterId: string) {
    const participant = await this.prisma.telemedicineParticipant.findUnique({
      where: { id: dto.participantId },
      include: { session: true },
    });

    if (!participant) {
      throw new NotFoundException('Participante não encontrado');
    }

    // Verificar se é médico da sessão
    const doctor = await this.prisma.doctor.findFirst({
      where: { userId: requesterId },
    });

    if (!doctor || participant.session.doctorId !== doctor.id) {
      throw new ForbiddenException('Apenas o médico da sessão pode gerenciar a sala de espera');
    }

    let newStatus: string;
    switch (dto.action) {
      case 'ADMIT':
        newStatus = 'ADMITTED';
        break;
      case 'DENY':
        newStatus = 'DENIED';
        break;
      case 'PUT_ON_HOLD':
        newStatus = 'ON_HOLD';
        break;
      default:
        throw new BadRequestException('Ação inválida');
    }

    await this.prisma.telemedicineParticipant.update({
      where: { id: dto.participantId },
      data: { waitingRoomStatus: newStatus },
    });

    // Emitir evento para o participante
    this.eventEmitter.emit('telemedicine.waitingRoomAction', {
      sessionId: participant.sessionId,
      participantId: dto.participantId,
      action: dto.action,
      message: dto.message,
    });

    return { success: true, action: dto.action };
  }

  // ==================== Chat ====================

  async sendChatMessage(dto: SendChatMessageDto, requesterId: string) {
    const session = await this.prisma.telemedicineSession.findUnique({
      where: { id: dto.sessionId, deletedAt: null },
    });

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    if (!session.enableChat) {
      throw new BadRequestException('Chat não está habilitado nesta sessão');
    }

    // Verificar se é participante da sessão
    const participant = await this.prisma.telemedicineParticipant.findFirst({
      where: {
        sessionId: dto.sessionId,
        userId: requesterId,
      },
    });

    if (!participant) {
      throw new ForbiddenException('Você não é participante desta sessão');
    }

    const message = await this.prisma.telemedicineChatMessage.create({
      data: {
        sessionId: dto.sessionId,
        senderId: requesterId,
        senderName: participant.name,
        senderRole: participant.role,
        content: dto.content,
        messageType: dto.messageType || 'TEXT',
        fileUrl: dto.fileUrl,
        fileName: dto.fileName,
        privateToDoctor: dto.privateToDoctor || false,
      },
    });

    // Emitir evento de nova mensagem
    this.eventEmitter.emit('telemedicine.newChatMessage', {
      sessionId: dto.sessionId,
      message,
    });

    return message;
  }

  async getChatMessages(sessionId: string, query: ChatMessagesQueryDto, requesterId: string) {
    const session = await this.prisma.telemedicineSession.findUnique({
      where: { id: sessionId, deletedAt: null },
    });

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    // Verificar se é participante
    const participant = await this.prisma.telemedicineParticipant.findFirst({
      where: { sessionId, userId: requesterId },
    });

    if (!participant) {
      throw new ForbiddenException('Você não é participante desta sessão');
    }

    const where: Prisma.TelemedicineChatMessageWhereInput = {
      sessionId,
    };

    // Se não for médico, não mostrar mensagens privadas para médico
    if (participant.role !== ParticipantRole.DOCTOR) {
      where.OR = [
        { privateToDoctor: false },
        { senderId: requesterId },
      ];
    }

    if (query.search) {
      where.content = { contains: query.search, mode: 'insensitive' };
    }

    if (query.messageType) {
      where.messageType = query.messageType;
    }

    if (query.after) {
      where.sentAt = { ...where.sentAt as object, gt: new Date(query.after) };
    }

    if (query.before) {
      where.sentAt = { ...where.sentAt as object, lt: new Date(query.before) };
    }

    const [data, total] = await Promise.all([
      this.prisma.telemedicineChatMessage.findMany({
        where,
        orderBy: { sentAt: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.telemedicineChatMessage.count({ where }),
    ]);

    return {
      data,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  // ==================== Arquivos Compartilhados ====================

  async shareFile(dto: ShareFileDto, requesterId: string) {
    const session = await this.prisma.telemedicineSession.findUnique({
      where: { id: dto.sessionId, deletedAt: null },
    });

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    if (!session.enableFileSharing) {
      throw new BadRequestException('Compartilhamento de arquivos não está habilitado');
    }

    const participant = await this.prisma.telemedicineParticipant.findFirst({
      where: { sessionId: dto.sessionId, userId: requesterId },
    });

    if (!participant) {
      throw new ForbiddenException('Você não é participante desta sessão');
    }

    const sharedFile = await this.prisma.telemedicineSharedFile.create({
      data: {
        sessionId: dto.sessionId,
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        mimeType: dto.mimeType,
        fileSize: dto.fileSize,
        description: dto.description,
        category: dto.category,
        uploadedById: requesterId,
        uploadedByName: participant.name,
      },
    });

    this.eventEmitter.emit('telemedicine.fileShared', {
      sessionId: dto.sessionId,
      file: sharedFile,
    });

    return sharedFile;
  }

  async getSharedFiles(sessionId: string, query: SharedFilesQueryDto, requesterId: string) {
    const participant = await this.prisma.telemedicineParticipant.findFirst({
      where: { sessionId, userId: requesterId },
    });

    if (!participant) {
      throw new ForbiddenException('Você não é participante desta sessão');
    }

    const where: Prisma.TelemedicineSharedFileWhereInput = { sessionId };

    if (query.category) where.category = query.category;
    if (query.mimeType) where.mimeType = { contains: query.mimeType };

    const [data, total] = await Promise.all([
      this.prisma.telemedicineSharedFile.findMany({
        where,
        orderBy: { uploadedAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.telemedicineSharedFile.count({ where }),
    ]);

    return {
      data,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  // ==================== Convidados ====================

  async inviteGuest(dto: InviteGuestDto, requesterId: string, requesterRole: UserRole) {
    const session = await this.prisma.telemedicineSession.findUnique({
      where: { id: dto.sessionId, deletedAt: null },
      include: { participants: true },
    });

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    await this.verifySessionAccess(session, requesterId, requesterRole, true);

    if (!session.allowGuests) {
      throw new BadRequestException('Esta sessão não permite convidados');
    }

    // Verificar limite de convidados
    const currentGuests = session.participants.filter(
      p => p.role === ParticipantRole.GUEST || p.role === ParticipantRole.INTERPRETER,
    ).length;

    if (currentGuests >= (session.maxGuests || 2)) {
      throw new BadRequestException('Limite de convidados atingido');
    }

    // Gerar código de convite
    const inviteCode = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    const invite = await this.prisma.telemedicineInvite.create({
      data: {
        sessionId: dto.sessionId,
        inviteCode,
        guestName: dto.guestName,
        guestEmail: dto.guestEmail,
        guestPhone: dto.guestPhone,
        role: dto.role,
        relationship: dto.relationship,
        expiresAt,
        createdById: requesterId,
      },
    });

    // Gerar link de convite
    const baseUrl = this.configService.get('APP_URL');
    const inviteLink = `${baseUrl}/telemedicine/join/${dto.sessionId}?invite=${inviteCode}`;

    // Enviar email de convite
    this.eventEmitter.emit('email.send', {
      to: dto.guestEmail,
      template: 'telemedicine-invite',
      data: {
        guestName: dto.guestName,
        sessionCode: session.sessionCode,
        inviteLink,
        expiresAt,
      },
    });

    // Enviar SMS se tiver telefone
    if (dto.guestPhone) {
      this.eventEmitter.emit('sms.send', {
        to: dto.guestPhone,
        message: `Você foi convidado para uma consulta de telemedicina. Acesse: ${inviteLink}`,
      });
    }

    await this.auditService.log({
      action: 'TELEMEDICINE_GUEST_INVITED',
      entityType: 'TelemedicineSession',
      entityId: dto.sessionId,
      userId: requesterId,
      details: {
        guestEmail: dto.guestEmail,
        role: dto.role,
      },
    });

    return {
      success: true,
      inviteId: invite.id,
      inviteLink,
      expiresAt,
      emailSent: true,
      smsSent: !!dto.guestPhone,
    };
  }

  // ==================== Qualidade e Métricas ====================

  async updateConnectionQuality(dto: UpdateConnectionQualityDto, requesterId: string) {
    const participant = await this.prisma.telemedicineParticipant.findFirst({
      where: { sessionId: dto.sessionId, userId: requesterId },
    });

    if (!participant) {
      throw new ForbiddenException('Você não é participante desta sessão');
    }

    await this.prisma.telemedicineParticipant.update({
      where: { id: participant.id },
      data: {
        connectionQuality: dto.quality,
        lastQualityUpdate: new Date(),
      },
    });

    // Salvar métricas
    await this.prisma.telemedicineQualityMetric.create({
      data: {
        sessionId: dto.sessionId,
        participantId: participant.id,
        quality: dto.quality,
        videoBitrate: dto.videoBitrate,
        audioBitrate: dto.audioBitrate,
        latency: dto.latency,
        packetLoss: dto.packetLoss,
        jitter: dto.jitter,
      },
    });

    return { success: true };
  }

  async reportTechnicalIssue(dto: ReportTechnicalIssueDto, requesterId: string) {
    const participant = await this.prisma.telemedicineParticipant.findFirst({
      where: { sessionId: dto.sessionId, userId: requesterId },
    });

    if (!participant) {
      throw new ForbiddenException('Você não é participante desta sessão');
    }

    const issue = await this.prisma.telemedicineTechnicalIssue.create({
      data: {
        sessionId: dto.sessionId,
        reportedById: requesterId,
        reportedByName: participant.name,
        issueType: dto.issueType,
        description: dto.description,
        severity: dto.severity || 'MEDIUM',
        deviceInfo: dto.deviceInfo,
        networkInfo: dto.networkInfo,
      },
    });

    // Notificar suporte se crítico
    if (dto.severity === 'CRITICAL') {
      this.eventEmitter.emit('support.criticalIssue', {
        sessionId: dto.sessionId,
        issue,
      });
    }

    return issue;
  }

  // ==================== Avaliação ====================

  async rateSession(dto: RateSessionDto, requesterId: string) {
    const session = await this.prisma.telemedicineSession.findUnique({
      where: { id: dto.sessionId, deletedAt: null },
    });

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    if (session.status !== TelemedicineSessionStatus.COMPLETED) {
      throw new BadRequestException('Apenas sessões finalizadas podem ser avaliadas');
    }

    // Verificar se já avaliou
    const existingRating = await this.prisma.telemedicineRating.findFirst({
      where: { sessionId: dto.sessionId, ratedById: requesterId },
    });

    if (existingRating) {
      throw new ConflictException('Você já avaliou esta sessão');
    }

    const rating = await this.prisma.telemedicineRating.create({
      data: {
        sessionId: dto.sessionId,
        ratedById: requesterId,
        overallRating: dto.overallRating,
        videoQualityRating: dto.videoQualityRating,
        audioQualityRating: dto.audioQualityRating,
        easeOfUseRating: dto.easeOfUseRating,
        doctorRating: dto.doctorRating,
        wouldRecommend: dto.wouldRecommend,
        comments: dto.comments,
      },
    });

    // Gamificação
    this.eventEmitter.emit('gamification.action', {
      userId: requesterId,
      action: 'TELEMEDICINE_RATED',
      metadata: { sessionId: dto.sessionId },
    });

    return rating;
  }

  // ==================== Gravação ====================

  async startRecording(dto: StartRecordingDto, requesterId: string, requesterRole: UserRole) {
    const session = await this.prisma.telemedicineSession.findUnique({
      where: { id: dto.sessionId, deletedAt: null },
    });

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    await this.verifySessionAccess(session, requesterId, requesterRole, true);

    if (!session.allowRecording) {
      throw new BadRequestException('Gravação não está habilitada nesta sessão');
    }

    // Verificar se já está gravando
    const existingRecording = await this.prisma.telemedicineRecording.findFirst({
      where: { sessionId: dto.sessionId, status: 'RECORDING' },
    });

    if (existingRecording) {
      throw new ConflictException('Já existe uma gravação em andamento');
    }

    const recording = await this.prisma.telemedicineRecording.create({
      data: {
        sessionId: dto.sessionId,
        recordingType: dto.recordingType || 'VIDEO_AUDIO',
        quality: dto.quality || 'MEDIUM',
        status: 'RECORDING',
        startedAt: new Date(),
        startedById: requesterId,
      },
    });

    await this.prisma.telemedicineSession.update({
      where: { id: dto.sessionId },
      data: { isRecording: true },
    });

    // Evento para iniciar gravação no servidor de mídia
    this.eventEmitter.emit('telemedicine.startRecording', {
      sessionId: dto.sessionId,
      recordingId: recording.id,
      roomId: session.roomId,
      recordingType: dto.recordingType,
      quality: dto.quality,
    });

    return recording;
  }

  async stopRecording(dto: StopRecordingDto, requesterId: string) {
    const recording = await this.prisma.telemedicineRecording.findFirst({
      where: {
        sessionId: dto.sessionId,
        status: 'RECORDING',
      },
    });

    if (!recording) {
      throw new NotFoundException('Nenhuma gravação em andamento');
    }

    const updated = await this.prisma.telemedicineRecording.update({
      where: { id: recording.id },
      data: {
        status: 'PROCESSING',
        endedAt: new Date(),
        duration: Math.round((Date.now() - recording.startedAt.getTime()) / 1000),
      },
    });

    await this.prisma.telemedicineSession.update({
      where: { id: dto.sessionId },
      data: { isRecording: false, hasRecording: true },
    });

    // Evento para parar gravação
    this.eventEmitter.emit('telemedicine.stopRecording', {
      sessionId: dto.sessionId,
      recordingId: recording.id,
    });

    return updated;
  }

  async getRecordings(query: RecordingsQueryDto) {
    const where: Prisma.TelemedicineRecordingWhereInput = {};

    if (query.sessionId) where.sessionId = query.sessionId;
    if (query.patientId) where.session = { patientId: query.patientId };
    if (query.doctorId) where.session = { ...where.session as object, doctorId: query.doctorId };

    if (query.startDate || query.endDate) {
      where.startedAt = {};
      if (query.startDate) where.startedAt.gte = new Date(query.startDate);
      if (query.endDate) where.startedAt.lte = new Date(query.endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.telemedicineRecording.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.telemedicineRecording.count({ where }),
    ]);

    return {
      data,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  // ==================== Estatísticas ====================

  async getStatistics(query: TelemedicineStatisticsQueryDto, requesterId: string) {
    const { clinicId, doctorId, startDate, endDate, groupBy, includeQualityMetrics, includeRatings } = query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const where: Prisma.TelemedicineSessionWhereInput = {
      scheduledStartTime: { gte: start, lte: end },
      deletedAt: null,
    };

    if (clinicId) where.clinicId = clinicId;
    if (doctorId) where.doctorId = doctorId;

    const [
      totalSessions,
      completedSessions,
      cancelledSessions,
      noShowSessions,
      technicalIssueSessions,
    ] = await Promise.all([
      this.prisma.telemedicineSession.count({ where }),
      this.prisma.telemedicineSession.count({ where: { ...where, status: TelemedicineSessionStatus.COMPLETED } }),
      this.prisma.telemedicineSession.count({ where: { ...where, status: TelemedicineSessionStatus.CANCELLED } }),
      this.prisma.telemedicineSession.count({
        where: {
          ...where,
          status: { in: [TelemedicineSessionStatus.NO_SHOW_PATIENT, TelemedicineSessionStatus.NO_SHOW_DOCTOR] },
        },
      }),
      this.prisma.telemedicineSession.count({
        where: { ...where, status: TelemedicineSessionStatus.TECHNICAL_ISSUE },
      }),
    ]);

    // Duração média
    const sessions = await this.prisma.telemedicineSession.findMany({
      where: { ...where, status: TelemedicineSessionStatus.COMPLETED, actualDuration: { not: null } },
      select: { actualDuration: true },
    });

    const totalDuration = sessions.reduce((acc, s) => acc + (s.actualDuration || 0), 0);
    const averageDuration = sessions.length > 0 ? totalDuration / sessions.length : 0;

    // Por tipo
    const sessionsByType = await this.prisma.telemedicineSession.groupBy({
      by: ['sessionType'],
      where,
      _count: true,
    });

    // Por status
    const sessionsByStatus = await this.prisma.telemedicineSession.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    const stats: any = {
      period: { start, end },
      totalSessions,
      completedSessions,
      cancelledSessions,
      noShowSessions,
      technicalIssueSessions,
      averageDuration: Math.round(averageDuration),
      totalDuration,
      sessionsByType: Object.fromEntries(sessionsByType.map(s => [s.sessionType, s._count])),
      sessionsByStatus: Object.fromEntries(sessionsByStatus.map(s => [s.status, s._count])),
    };

    // Métricas de qualidade
    if (includeQualityMetrics) {
      const technicalIssuesCount = await this.prisma.telemedicineTechnicalIssue.count({
        where: { session: where },
      });

      stats.qualityMetrics = {
        technicalIssuesCount,
      };
    }

    // Avaliações
    if (includeRatings) {
      const ratings = await this.prisma.telemedicineRating.findMany({
        where: { session: where },
      });

      if (ratings.length > 0) {
        const avgOverall = ratings.reduce((acc, r) => acc + r.overallRating, 0) / ratings.length;
        const avgDoctor = ratings.filter(r => r.doctorRating).reduce((acc, r) => acc + (r.doctorRating || 0), 0) /
          ratings.filter(r => r.doctorRating).length || 0;
        const avgEaseOfUse = ratings.filter(r => r.easeOfUseRating).reduce((acc, r) => acc + (r.easeOfUseRating || 0), 0) /
          ratings.filter(r => r.easeOfUseRating).length || 0;
        const wouldRecommendCount = ratings.filter(r => r.wouldRecommend).length;

        stats.ratings = {
          averageOverall: Math.round(avgOverall * 10) / 10,
          averageDoctor: Math.round(avgDoctor * 10) / 10,
          averageEaseOfUse: Math.round(avgEaseOfUse * 10) / 10,
          wouldRecommendPercentage: Math.round((wouldRecommendCount / ratings.length) * 100),
          totalRatings: ratings.length,
        };
      }
    }

    return stats;
  }

  // ==================== Próximas Sessões ====================

  async getUpcomingSessions(query: UpcomingSessionsQueryDto, requesterId: string, requesterRole: UserRole) {
    const { hoursAhead = 24, limit = 10, doctorId, patientId } = query;

    const now = new Date();
    const endTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    const where: Prisma.TelemedicineSessionWhereInput = {
      scheduledStartTime: { gte: now, lte: endTime },
      status: TelemedicineSessionStatus.SCHEDULED,
      deletedAt: null,
    };

    // Filtros de acesso
    if (requesterRole === UserRole.PATIENT) {
      const patient = await this.prisma.patient.findFirst({ where: { userId: requesterId } });
      if (patient) where.patientId = patient.id;
    } else if (requesterRole === UserRole.DOCTOR) {
      const doctor = await this.prisma.doctor.findFirst({ where: { userId: requesterId } });
      if (doctor) where.doctorId = doctor.id;
    }

    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;

    const sessions = await this.prisma.telemedicineSession.findMany({
      where,
      include: {
        patient: { select: { id: true, fullName: true, avatarUrl: true } },
        doctor: { select: { id: true, fullName: true, specialty: true, avatarUrl: true } },
      },
      orderBy: { scheduledStartTime: 'asc' },
      take: limit,
    });

    return {
      sessions: sessions.map(s => ({
        id: s.id,
        sessionCode: s.sessionCode,
        patient: s.patient,
        doctor: s.doctor,
        sessionType: s.sessionType,
        scheduledStartTime: s.scheduledStartTime,
        estimatedDuration: s.estimatedDuration,
        specialty: s.specialty,
        isFollowUp: s.isFollowUp,
        minutesUntilStart: Math.round((s.scheduledStartTime.getTime() - now.getTime()) / (1000 * 60)),
      })),
      total: sessions.length,
      nextSession: sessions[0] ? {
        id: sessions[0].id,
        sessionCode: sessions[0].sessionCode,
        patient: sessions[0].patient,
        doctor: sessions[0].doctor,
        sessionType: sessions[0].sessionType,
        scheduledStartTime: sessions[0].scheduledStartTime,
        minutesUntilStart: Math.round((sessions[0].scheduledStartTime.getTime() - now.getTime()) / (1000 * 60)),
      } : undefined,
    };
  }

  // ==================== Métodos Auxiliares ====================

  private async generateSessionCode(): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code: string;
    let exists = true;

    while (exists) {
      code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      code = code.slice(0, 4) + '-' + code.slice(4);

      exists = !!(await this.prisma.telemedicineSession.findFirst({
        where: { sessionCode: code },
      }));
    }

    return code;
  }

  private generateRoomId(): string {
    return crypto.randomUUID();
  }

  private generateSessionToken(sessionId: string, userId: string, role: ParticipantRole): string {
    const payload = {
      sessionId,
      userId,
      role,
      iat: Date.now(),
      exp: Date.now() + 4 * 60 * 60 * 1000, // 4 horas
    };

    // Em produção, usar JWT real
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  private async verifySessionAccess(
    session: any,
    requesterId: string,
    requesterRole: UserRole,
    requireWrite: boolean = false,
  ) {
    if (requesterRole === UserRole.ADMIN || requesterRole === UserRole.SUPER_ADMIN) {
      return true;
    }

    if (requesterRole === UserRole.PATIENT) {
      const patient = await this.prisma.patient.findFirst({ where: { userId: requesterId } });
      if (!patient || patient.id !== session.patientId) {
        throw new ForbiddenException('Acesso negado à sessão');
      }
    }

    if (requesterRole === UserRole.DOCTOR) {
      const doctor = await this.prisma.doctor.findFirst({ where: { userId: requesterId } });
      if (!doctor || doctor.id !== session.doctorId) {
        throw new ForbiddenException('Acesso negado à sessão');
      }
    }

    return true;
  }

  private getSessionIncludes() {
    return {
      patient: {
        select: {
          id: true,
          fullName: true,
          cpf: true,
          birthDate: true,
          phone: true,
          email: true,
          avatarUrl: true,
        },
      },
      doctor: {
        select: {
          id: true,
          fullName: true,
          crm: true,
          specialty: true,
          avatarUrl: true,
        },
      },
      clinic: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
        },
      },
      participants: true,
    };
  }

  private formatSessionResponse(session: any) {
    return {
      id: session.id,
      sessionCode: session.sessionCode,
      appointmentId: session.appointmentId,
      patient: session.patient,
      doctor: session.doctor,
      clinic: session.clinic,
      sessionType: session.sessionType,
      status: session.status,
      scheduledStartTime: session.scheduledStartTime,
      estimatedDuration: session.estimatedDuration,
      actualStartTime: session.actualStartTime,
      actualEndTime: session.actualEndTime,
      actualDuration: session.actualDuration,
      allowRecording: session.allowRecording,
      allowScreenSharing: session.allowScreenSharing,
      allowGuests: session.allowGuests,
      maxGuests: session.maxGuests,
      enableWaitingRoom: session.enableWaitingRoom,
      enableChat: session.enableChat,
      enableFileSharing: session.enableFileSharing,
      patientInstructions: session.patientInstructions,
      internalNotes: session.internalNotes,
      specialty: session.specialty,
      isFollowUp: session.isFollowUp,
      previousSessionId: session.previousSessionId,
      tags: session.tags,
      participants: session.participants?.map((p: any) => ({
        id: p.id,
        sessionId: p.sessionId,
        userId: p.userId,
        name: p.name,
        role: p.role,
        deviceType: p.deviceType,
        joinedAt: p.joinedAt,
        leftAt: p.leftAt,
        isConnected: p.isConnected,
        cameraEnabled: p.cameraEnabled,
        microphoneEnabled: p.microphoneEnabled,
        connectionQuality: p.connectionQuality,
      })),
      isRecording: session.isRecording,
      hasRecording: session.hasRecording,
      consultationId: session.consultationId,
      roomUrl: session.roomId ? `/telemedicine/room/${session.roomId}` : undefined,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      cancelledAt: session.cancelledAt,
      cancellationReason: session.cancellationReason,
    };
  }
}
