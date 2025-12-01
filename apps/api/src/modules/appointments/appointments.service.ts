import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/database/prisma.service';
import { CacheService } from '@/common/services/cache.service';
import { AuditService } from '@/common/services/audit.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  RescheduleAppointmentDto,
  CancelAppointmentDto,
  ConfirmAppointmentDto,
  CheckInDto,
  StartAppointmentDto,
  CompleteAppointmentDto,
  NoShowDto,
  AddToWaitingListDto,
  BatchCancelDto,
  BatchConfirmDto,
  AppointmentStatusEnum,
  CancellationReason,
} from './dto/create-appointment.dto';
import {
  AppointmentQueryDto,
  CalendarQueryDto,
  AvailableSlotsQueryDto,
  WaitingListQueryDto,
  AppointmentStatsQueryDto,
  RemindersQueryDto,
} from './dto/appointment-query.dto';
import {
  AppointmentResponseDto,
  AppointmentListResponseDto,
  CalendarResponseDto,
  CalendarEventResponseDto,
  AvailableSlotsResponseDto,
  AvailableSlotResponseDto,
  WaitingListResponseDto,
  AppointmentStatsResponseDto,
  DailyScheduleResponseDto,
  BatchOperationResultDto,
} from './dto/appointment-response.dto';
import { Prisma, AppointmentStatus, AppointmentType } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);
  private readonly CACHE_TTL = 300; // 5 minutos
  private readonly CACHE_PREFIX = 'appointments';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════════
  // CRUD BÁSICO
  // ═══════════════════════════════════════════════════════════════════════════════

  async create(dto: CreateAppointmentDto, userId: string): Promise<AppointmentResponseDto> {
    this.logger.log(`Creating appointment for patient ${dto.patientId} with doctor ${dto.doctorId}`);

    // Validar se paciente existe
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
      include: { user: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado');
    }

    // Validar se médico existe
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: dto.doctorId },
      include: { user: true },
    });

    if (!doctor) {
      throw new NotFoundException('Médico não encontrado');
    }

    // Validar se clínica existe
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: dto.clinicId },
    });

    if (!clinic) {
      throw new NotFoundException('Clínica não encontrada');
    }

    // Calcular horário de término
    const startTime = new Date(dto.startTime);
    const durationMinutes = dto.durationMinutes || 30;
    const endTime = dto.endTime
      ? new Date(dto.endTime)
      : new Date(startTime.getTime() + durationMinutes * 60000);

    // Verificar conflitos de horário do médico
    await this.checkDoctorConflicts(dto.doctorId, startTime, endTime);

    // Verificar conflitos de horário do paciente
    await this.checkPatientConflicts(dto.patientId, startTime, endTime);

    // Verificar se horário está dentro do expediente do médico
    await this.validateWorkingHours(dto.doctorId, dto.clinicId, startTime, endTime);

    // Verificar sala se especificada
    if (dto.roomId) {
      await this.checkRoomConflicts(dto.roomId, startTime, endTime);
    }

    // Preparar dados do agendamento
    const appointmentData: Prisma.AppointmentCreateInput = {
      patient: { connect: { id: dto.patientId } },
      doctor: { connect: { id: dto.doctorId } },
      clinic: { connect: { id: dto.clinicId } },
      startTime,
      endTime,
      durationMinutes,
      type: dto.type as unknown as AppointmentType,
      status: (dto.status || AppointmentStatusEnum.SCHEDULED) as unknown as AppointmentStatus,
      reason: dto.reason,
      notes: dto.notes,
      patientInstructions: dto.patientInstructions,
      isFirstVisit: dto.isFirstVisit || false,
      isReturn: dto.isReturn || false,
      price: dto.price,
      isPrivate: dto.isPrivate || false,
      priority: dto.priority || 1,
      tags: dto.tags || [],
      color: dto.color,
      metadata: {
        ...(dto.metadata || {}),
        insurance: dto.insurance,
        telemedicine: dto.telemedicine,
        preAppointmentForm: dto.preAppointmentForm,
        recurrence: dto.recurrence,
        reminders: dto.reminders,
      },
      createdBy: { connect: { id: userId } },
    };

    // Conectar sala se especificada
    if (dto.roomId) {
      appointmentData.room = { connect: { id: dto.roomId } };
    }

    // Conectar especialidade se especificada
    if (dto.specialtyId) {
      appointmentData.specialty = { connect: { id: dto.specialtyId } };
    }

    // Conectar agendamento original se for retorno
    if (dto.originalAppointmentId) {
      appointmentData.originalAppointment = { connect: { id: dto.originalAppointmentId } };
    }

    const appointment = await this.prisma.appointment.create({
      data: appointmentData,
      include: this.getAppointmentInclude(),
    });

    // Criar agendamentos recorrentes se configurado
    if (dto.recurrence && dto.recurrence.type !== 'NONE') {
      await this.createRecurringAppointments(appointment.id, dto, userId);
    }

    // Criar lembretes
    if (dto.reminders && dto.reminders.length > 0) {
      await this.createReminders(appointment.id, dto.reminders);
    }

    // Criar sala de telemedicina se necessário
    if (dto.type === 'TELEMEDICINE' && dto.telemedicine) {
      await this.setupTelemedicineRoom(appointment.id, dto.telemedicine);
    }

    // Limpar cache
    await this.invalidateCache(dto.clinicId, dto.doctorId, dto.patientId);

    // Registrar auditoria
    await this.auditService.log({
      action: 'APPOINTMENT_CREATED',
      entityType: 'Appointment',
      entityId: appointment.id,
      userId,
      details: {
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        clinicId: dto.clinicId,
        startTime: startTime.toISOString(),
        type: dto.type,
      },
    });

    // Emitir evento
    this.eventEmitter.emit('appointment.created', {
      appointmentId: appointment.id,
      patientId: dto.patientId,
      doctorId: dto.doctorId,
      clinicId: dto.clinicId,
      startTime,
      type: dto.type,
    });

    return this.mapToResponseDto(appointment);
  }

  async findAll(query: AppointmentQueryDto): Promise<AppointmentListResponseDto> {
    const {
      clinicId,
      doctorId,
      patientId,
      roomId,
      specialtyId,
      type,
      status,
      statuses,
      startDate,
      endDate,
      date,
      today,
      thisWeek,
      thisMonth,
      telemedicineOnly,
      inPersonOnly,
      firstVisitOnly,
      returnsOnly,
      paymentType,
      insuranceId,
      minPriority,
      patientSearch,
      doctorSearch,
      tags,
      includeCancelled,
      includeNoShows,
      sortBy = 'startTime',
      sortOrder = 'asc',
      page = 1,
      limit = 20,
    } = query;

    const where: Prisma.AppointmentWhereInput = {
      deletedAt: null,
    };

    // Filtros básicos
    if (clinicId) where.clinicId = clinicId;
    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;
    if (roomId) where.roomId = roomId;
    if (specialtyId) where.specialtyId = specialtyId;
    if (type) where.type = type as unknown as AppointmentType;

    // Filtro de status
    if (statuses && statuses.length > 0) {
      where.status = { in: statuses as unknown as AppointmentStatus[] };
    } else if (status) {
      where.status = status as unknown as AppointmentStatus;
    }

    // Filtros de data
    if (date) {
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);
      where.startTime = { gte: dateStart, lte: dateEnd };
    } else if (today) {
      const now = new Date();
      const dayStart = new Date(now.setHours(0, 0, 0, 0));
      const dayEnd = new Date(now.setHours(23, 59, 59, 999));
      where.startTime = { gte: dayStart, lte: dayEnd };
    } else if (thisWeek) {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      where.startTime = { gte: weekStart, lte: weekEnd };
    } else if (thisMonth) {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      where.startTime = { gte: monthStart, lte: monthEnd };
    } else {
      if (startDate) {
        where.startTime = { ...((where.startTime as object) || {}), gte: new Date(startDate) };
      }
      if (endDate) {
        where.startTime = { ...((where.startTime as object) || {}), lte: new Date(endDate) };
      }
    }

    // Filtros especiais
    if (telemedicineOnly) {
      where.type = 'TELEMEDICINE' as unknown as AppointmentType;
    }
    if (inPersonOnly) {
      where.type = { not: 'TELEMEDICINE' as unknown as AppointmentType };
    }
    if (firstVisitOnly) {
      where.isFirstVisit = true;
    }
    if (returnsOnly) {
      where.isReturn = true;
    }

    // Filtro de pagamento
    if (paymentType === 'PRIVATE') {
      where.isPrivate = true;
    } else if (paymentType === 'INSURANCE') {
      where.isPrivate = false;
    }

    if (insuranceId) {
      where.metadata = {
        path: ['insurance', 'insuranceId'],
        equals: insuranceId,
      };
    }

    // Filtro de prioridade
    if (minPriority) {
      where.priority = { gte: minPriority };
    }

    // Filtros de busca
    if (patientSearch) {
      where.patient = {
        user: {
          OR: [
            { firstName: { contains: patientSearch, mode: 'insensitive' } },
            { lastName: { contains: patientSearch, mode: 'insensitive' } },
            { email: { contains: patientSearch, mode: 'insensitive' } },
          ],
        },
      };
    }

    if (doctorSearch) {
      where.doctor = {
        user: {
          OR: [
            { firstName: { contains: doctorSearch, mode: 'insensitive' } },
            { lastName: { contains: doctorSearch, mode: 'insensitive' } },
          ],
        },
      };
    }

    // Filtro de tags
    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    // Excluir cancelados e no-shows por padrão
    if (!includeCancelled) {
      where.status = {
        ...(typeof where.status === 'object' ? where.status : {}),
        not: 'CANCELLED' as unknown as AppointmentStatus,
      };
    }
    if (!includeNoShows) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        { status: { not: 'NO_SHOW' as unknown as AppointmentStatus } },
      ];
    }

    // Ordenação
    const orderBy: Prisma.AppointmentOrderByWithRelationInput = {};
    switch (sortBy) {
      case 'patientName':
        orderBy.patient = { user: { firstName: sortOrder } };
        break;
      case 'doctorName':
        orderBy.doctor = { user: { firstName: sortOrder } };
        break;
      case 'status':
        orderBy.status = sortOrder;
        break;
      case 'priority':
        orderBy.priority = sortOrder;
        break;
      case 'createdAt':
        orderBy.createdAt = sortOrder;
        break;
      default:
        orderBy.startTime = sortOrder;
    }

    const skip = (page - 1) * limit;

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        include: this.getAppointmentInclude(),
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      data: appointments.map((a) => this.mapToResponseDto(a)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + appointments.length < total,
    };
  }

  async findById(id: string): Promise<AppointmentResponseDto> {
    const cacheKey = `${this.CACHE_PREFIX}:${id}`;
    const cached = await this.cacheService.get<AppointmentResponseDto>(cacheKey);

    if (cached) {
      return cached;
    }

    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: this.getAppointmentInclude(),
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    const response = this.mapToResponseDto(appointment);
    await this.cacheService.set(cacheKey, response, this.CACHE_TTL);

    return response;
  }

  async update(
    id: string,
    dto: UpdateAppointmentDto,
    userId: string,
  ): Promise<AppointmentResponseDto> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    // Verificar se pode editar (status permitidos)
    const editableStatuses: AppointmentStatus[] = ['SCHEDULED', 'CONFIRMED'];
    if (!editableStatuses.includes(appointment.status)) {
      throw new BadRequestException(
        'Não é possível editar agendamento com status atual',
      );
    }

    // Se mudou horário, verificar conflitos
    if (dto.startTime || dto.endTime || dto.durationMinutes) {
      const startTime = dto.startTime ? new Date(dto.startTime) : appointment.startTime;
      const durationMinutes = dto.durationMinutes || appointment.durationMinutes;
      const endTime = dto.endTime
        ? new Date(dto.endTime)
        : new Date(startTime.getTime() + durationMinutes * 60000);

      await this.checkDoctorConflicts(
        dto.doctorId || appointment.doctorId,
        startTime,
        endTime,
        id,
      );
      await this.checkPatientConflicts(
        dto.patientId || appointment.patientId,
        startTime,
        endTime,
        id,
      );

      if (dto.roomId) {
        await this.checkRoomConflicts(dto.roomId, startTime, endTime, id);
      }
    }

    const updateData: Prisma.AppointmentUpdateInput = {};

    if (dto.startTime) updateData.startTime = new Date(dto.startTime);
    if (dto.endTime) updateData.endTime = new Date(dto.endTime);
    if (dto.durationMinutes) updateData.durationMinutes = dto.durationMinutes;
    if (dto.type) updateData.type = dto.type as unknown as AppointmentType;
    if (dto.reason) updateData.reason = dto.reason;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.patientInstructions !== undefined) updateData.patientInstructions = dto.patientInstructions;
    if (dto.price !== undefined) updateData.price = dto.price;
    if (dto.isPrivate !== undefined) updateData.isPrivate = dto.isPrivate;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.tags !== undefined) updateData.tags = dto.tags;
    if (dto.color !== undefined) updateData.color = dto.color;

    if (dto.roomId) {
      updateData.room = { connect: { id: dto.roomId } };
    }

    if (dto.metadata) {
      updateData.metadata = {
        ...((appointment.metadata as object) || {}),
        ...dto.metadata,
      };
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: updateData,
      include: this.getAppointmentInclude(),
    });

    // Limpar cache
    await this.invalidateCache(
      updated.clinicId,
      updated.doctorId,
      updated.patientId,
    );
    await this.cacheService.del(`${this.CACHE_PREFIX}:${id}`);

    // Auditoria
    await this.auditService.log({
      action: 'APPOINTMENT_UPDATED',
      entityType: 'Appointment',
      entityId: id,
      userId,
      details: { changes: dto },
    });

    // Emitir evento
    this.eventEmitter.emit('appointment.updated', {
      appointmentId: id,
      changes: dto,
    });

    return this.mapToResponseDto(updated);
  }

  async delete(id: string, userId: string): Promise<void> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    // Soft delete
    await this.prisma.appointment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Limpar cache
    await this.invalidateCache(
      appointment.clinicId,
      appointment.doctorId,
      appointment.patientId,
    );
    await this.cacheService.del(`${this.CACHE_PREFIX}:${id}`);

    // Auditoria
    await this.auditService.log({
      action: 'APPOINTMENT_DELETED',
      entityType: 'Appointment',
      entityId: id,
      userId,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // AÇÕES DO FLUXO DE ATENDIMENTO
  // ═══════════════════════════════════════════════════════════════════════════════

  async reschedule(
    id: string,
    dto: RescheduleAppointmentDto,
    userId: string,
  ): Promise<AppointmentResponseDto> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: { patient: { include: { user: true } }, doctor: { include: { user: true } } },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    // Verificar se pode reagendar
    const reschedulableStatuses: AppointmentStatus[] = ['SCHEDULED', 'CONFIRMED'];
    if (!reschedulableStatuses.includes(appointment.status)) {
      throw new BadRequestException(
        'Não é possível reagendar agendamento com status atual',
      );
    }

    const newStartTime = new Date(dto.newStartTime);
    const durationMinutes = dto.newDurationMinutes || appointment.durationMinutes;
    const newEndTime = dto.newEndTime
      ? new Date(dto.newEndTime)
      : new Date(newStartTime.getTime() + durationMinutes * 60000);

    const newDoctorId = dto.newDoctorId || appointment.doctorId;

    // Verificar conflitos
    await this.checkDoctorConflicts(newDoctorId, newStartTime, newEndTime, id);
    await this.checkPatientConflicts(appointment.patientId, newStartTime, newEndTime, id);

    if (dto.newRoomId) {
      await this.checkRoomConflicts(dto.newRoomId, newStartTime, newEndTime, id);
    }

    const updateData: Prisma.AppointmentUpdateInput = {
      startTime: newStartTime,
      endTime: newEndTime,
      durationMinutes,
      status: 'RESCHEDULED' as unknown as AppointmentStatus,
      metadata: {
        ...((appointment.metadata as object) || {}),
        rescheduledAt: new Date().toISOString(),
        rescheduledBy: userId,
        rescheduledReason: dto.reason,
        previousStartTime: appointment.startTime.toISOString(),
        previousEndTime: appointment.endTime.toISOString(),
      },
    };

    if (dto.newDoctorId) {
      updateData.doctor = { connect: { id: dto.newDoctorId } };
    }

    if (dto.newRoomId) {
      updateData.room = { connect: { id: dto.newRoomId } };
    }

    // Criar novo agendamento com as informações do anterior
    const newAppointment = await this.prisma.appointment.create({
      data: {
        patient: { connect: { id: appointment.patientId } },
        doctor: { connect: { id: newDoctorId } },
        clinic: { connect: { id: appointment.clinicId } },
        startTime: newStartTime,
        endTime: newEndTime,
        durationMinutes,
        type: appointment.type,
        status: 'SCHEDULED' as unknown as AppointmentStatus,
        reason: appointment.reason,
        notes: appointment.notes,
        patientInstructions: appointment.patientInstructions,
        isFirstVisit: appointment.isFirstVisit,
        isReturn: appointment.isReturn,
        price: appointment.price,
        isPrivate: appointment.isPrivate,
        priority: appointment.priority,
        tags: appointment.tags,
        color: appointment.color,
        metadata: {
          ...((appointment.metadata as object) || {}),
          originalAppointmentId: id,
          rescheduledFrom: appointment.startTime.toISOString(),
        },
        originalAppointment: { connect: { id } },
        createdBy: { connect: { id: userId } },
        ...(dto.newRoomId ? { room: { connect: { id: dto.newRoomId } } } : {}),
        ...(appointment.specialtyId ? { specialty: { connect: { id: appointment.specialtyId } } } : {}),
      },
      include: this.getAppointmentInclude(),
    });

    // Atualizar agendamento original
    await this.prisma.appointment.update({
      where: { id },
      data: updateData,
    });

    // Limpar cache
    await this.invalidateCache(
      appointment.clinicId,
      appointment.doctorId,
      appointment.patientId,
    );
    await this.cacheService.del(`${this.CACHE_PREFIX}:${id}`);

    // Notificar se configurado
    if (dto.notifyPatient !== false) {
      this.eventEmitter.emit('notification.send', {
        type: 'APPOINTMENT_RESCHEDULED',
        userId: appointment.patient.userId,
        data: {
          appointmentId: newAppointment.id,
          oldStartTime: appointment.startTime,
          newStartTime,
          doctorName: `${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`,
          reason: dto.reason,
        },
      });
    }

    if (dto.notifyDoctor !== false) {
      this.eventEmitter.emit('notification.send', {
        type: 'APPOINTMENT_RESCHEDULED',
        userId: appointment.doctor.userId,
        data: {
          appointmentId: newAppointment.id,
          oldStartTime: appointment.startTime,
          newStartTime,
          patientName: `${appointment.patient.user.firstName} ${appointment.patient.user.lastName}`,
          reason: dto.reason,
        },
      });
    }

    // Auditoria
    await this.auditService.log({
      action: 'APPOINTMENT_RESCHEDULED',
      entityType: 'Appointment',
      entityId: id,
      userId,
      details: {
        oldStartTime: appointment.startTime,
        newStartTime,
        newAppointmentId: newAppointment.id,
        reason: dto.reason,
      },
    });

    return this.mapToResponseDto(newAppointment);
  }

  async cancel(
    id: string,
    dto: CancelAppointmentDto,
    userId: string,
  ): Promise<void> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: { patient: { include: { user: true } }, doctor: { include: { user: true } } },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    // Verificar se pode cancelar
    const cancelableStatuses: AppointmentStatus[] = ['SCHEDULED', 'CONFIRMED', 'WAITING'];
    if (!cancelableStatuses.includes(appointment.status)) {
      throw new BadRequestException(
        'Não é possível cancelar agendamento com status atual',
      );
    }

    await this.prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED' as unknown as AppointmentStatus,
        cancelledAt: new Date(),
        cancelledById: userId,
        metadata: {
          ...((appointment.metadata as object) || {}),
          cancellationReason: dto.reason,
          cancellationNotes: dto.notes,
          cancelledByPatient: dto.cancelledByPatient || false,
        },
      },
    });

    // Limpar cache
    await this.invalidateCache(
      appointment.clinicId,
      appointment.doctorId,
      appointment.patientId,
    );
    await this.cacheService.del(`${this.CACHE_PREFIX}:${id}`);

    // Notificar
    if (dto.notifyPatient !== false) {
      this.eventEmitter.emit('notification.send', {
        type: 'APPOINTMENT_CANCELLED',
        userId: appointment.patient.userId,
        data: {
          appointmentId: id,
          startTime: appointment.startTime,
          doctorName: `${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`,
          reason: dto.reason,
        },
      });
    }

    if (dto.notifyDoctor !== false) {
      this.eventEmitter.emit('notification.send', {
        type: 'APPOINTMENT_CANCELLED',
        userId: appointment.doctor.userId,
        data: {
          appointmentId: id,
          startTime: appointment.startTime,
          patientName: `${appointment.patient.user.firstName} ${appointment.patient.user.lastName}`,
          reason: dto.reason,
        },
      });
    }

    // Verificar lista de espera
    this.eventEmitter.emit('waitingList.checkAvailability', {
      doctorId: appointment.doctorId,
      clinicId: appointment.clinicId,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
    });

    // Processar reembolso se necessário
    if (dto.refund) {
      this.eventEmitter.emit('billing.refund', {
        appointmentId: id,
        reason: dto.reason,
      });
    }

    // Auditoria
    await this.auditService.log({
      action: 'APPOINTMENT_CANCELLED',
      entityType: 'Appointment',
      entityId: id,
      userId,
      details: {
        reason: dto.reason,
        notes: dto.notes,
        cancelledByPatient: dto.cancelledByPatient,
      },
    });

    // Emitir evento
    this.eventEmitter.emit('appointment.cancelled', {
      appointmentId: id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      clinicId: appointment.clinicId,
      startTime: appointment.startTime,
      reason: dto.reason,
    });
  }

  async confirm(
    id: string,
    dto: ConfirmAppointmentDto,
    userId: string,
  ): Promise<AppointmentResponseDto> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    if (appointment.status !== ('SCHEDULED' as unknown as AppointmentStatus)) {
      throw new BadRequestException('Agendamento não está em status agendado');
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: 'CONFIRMED' as unknown as AppointmentStatus,
        confirmedAt: new Date(),
        metadata: {
          ...((appointment.metadata as object) || {}),
          confirmedByPatient: dto.confirmedByPatient !== false,
          confirmationMethod: dto.confirmationMethod || 'APP',
          confirmationNotes: dto.notes,
        },
      },
      include: this.getAppointmentInclude(),
    });

    await this.cacheService.del(`${this.CACHE_PREFIX}:${id}`);

    // Auditoria
    await this.auditService.log({
      action: 'APPOINTMENT_CONFIRMED',
      entityType: 'Appointment',
      entityId: id,
      userId,
      details: { method: dto.confirmationMethod },
    });

    // Emitir evento
    this.eventEmitter.emit('appointment.confirmed', {
      appointmentId: id,
    });

    return this.mapToResponseDto(updated);
  }

  async checkIn(
    id: string,
    dto: CheckInDto,
    userId: string,
  ): Promise<AppointmentResponseDto> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    const checkInStatuses: AppointmentStatus[] = ['SCHEDULED', 'CONFIRMED'];
    if (!checkInStatuses.includes(appointment.status)) {
      throw new BadRequestException('Agendamento não pode fazer check-in');
    }

    const checkInTime = dto.checkInTime ? new Date(dto.checkInTime) : new Date();

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: 'WAITING' as unknown as AppointmentStatus,
        checkInTime,
        metadata: {
          ...((appointment.metadata as object) || {}),
          checkIn: {
            time: checkInTime.toISOString(),
            hasCompanion: dto.hasCompanion,
            companionName: dto.companionName,
            documentsVerified: dto.documentsVerified,
            paymentCompleted: dto.paymentCompleted,
            receptionNotes: dto.receptionNotes,
            checkedInBy: userId,
          },
        },
      },
      include: this.getAppointmentInclude(),
    });

    await this.cacheService.del(`${this.CACHE_PREFIX}:${id}`);

    // Auditoria
    await this.auditService.log({
      action: 'APPOINTMENT_CHECKIN',
      entityType: 'Appointment',
      entityId: id,
      userId,
      details: { checkInTime },
    });

    // Emitir evento
    this.eventEmitter.emit('appointment.checkedIn', {
      appointmentId: id,
      checkInTime,
    });

    return this.mapToResponseDto(updated);
  }

  async start(
    id: string,
    dto: StartAppointmentDto,
    userId: string,
  ): Promise<AppointmentResponseDto> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    const startStatuses: AppointmentStatus[] = ['WAITING', 'CONFIRMED', 'SCHEDULED'];
    if (!startStatuses.includes(appointment.status)) {
      throw new BadRequestException('Agendamento não pode ser iniciado');
    }

    const actualStartTime = dto.actualStartTime ? new Date(dto.actualStartTime) : new Date();

    const updateData: Prisma.AppointmentUpdateInput = {
      status: 'IN_PROGRESS' as unknown as AppointmentStatus,
      actualStartTime,
      metadata: {
        ...((appointment.metadata as object) || {}),
        startedBy: userId,
        initialNotes: dto.initialNotes,
      },
    };

    if (dto.roomId) {
      updateData.room = { connect: { id: dto.roomId } };
    }

    // Calcular tempo de espera se fez check-in
    if (appointment.checkInTime) {
      const waitingTime = Math.round(
        (actualStartTime.getTime() - appointment.checkInTime.getTime()) / 60000,
      );
      updateData.waitingTime = waitingTime;
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: updateData,
      include: this.getAppointmentInclude(),
    });

    await this.cacheService.del(`${this.CACHE_PREFIX}:${id}`);

    // Auditoria
    await this.auditService.log({
      action: 'APPOINTMENT_STARTED',
      entityType: 'Appointment',
      entityId: id,
      userId,
      details: { actualStartTime },
    });

    // Emitir evento
    this.eventEmitter.emit('appointment.started', {
      appointmentId: id,
      actualStartTime,
    });

    return this.mapToResponseDto(updated);
  }

  async complete(
    id: string,
    dto: CompleteAppointmentDto,
    userId: string,
  ): Promise<AppointmentResponseDto> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    if (appointment.status !== ('IN_PROGRESS' as unknown as AppointmentStatus)) {
      throw new BadRequestException('Agendamento não está em andamento');
    }

    const actualEndTime = dto.actualEndTime ? new Date(dto.actualEndTime) : new Date();

    // Calcular duração real
    const startTime = appointment.actualStartTime || appointment.startTime;
    const consultationDuration = Math.round(
      (actualEndTime.getTime() - startTime.getTime()) / 60000,
    );

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: 'COMPLETED' as unknown as AppointmentStatus,
        actualEndTime,
        consultationDuration,
        metadata: {
          ...((appointment.metadata as object) || {}),
          completedBy: userId,
          summary: dto.summary,
          nextSteps: dto.nextSteps,
          needsFollowUp: dto.needsFollowUp,
          followUpDays: dto.followUpDays,
        },
      },
      include: this.getAppointmentInclude(),
    });

    await this.cacheService.del(`${this.CACHE_PREFIX}:${id}`);

    // Agendar retorno automaticamente se configurado
    if (dto.scheduleFollowUp && dto.followUpDays) {
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + dto.followUpDays);
      followUpDate.setHours(appointment.startTime.getHours());
      followUpDate.setMinutes(appointment.startTime.getMinutes());

      this.eventEmitter.emit('appointment.scheduleFollowUp', {
        originalAppointmentId: id,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        clinicId: appointment.clinicId,
        suggestedDate: followUpDate,
        createdBy: userId,
      });
    }

    // Auditoria
    await this.auditService.log({
      action: 'APPOINTMENT_COMPLETED',
      entityType: 'Appointment',
      entityId: id,
      userId,
      details: {
        actualEndTime,
        consultationDuration,
        summary: dto.summary,
      },
    });

    // Emitir evento
    this.eventEmitter.emit('appointment.completed', {
      appointmentId: id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      consultationDuration,
    });

    // Atualizar gamificação
    this.eventEmitter.emit('gamification.appointmentCompleted', {
      patientId: appointment.patientId,
      appointmentId: id,
    });

    return this.mapToResponseDto(updated);
  }

  async markNoShow(
    id: string,
    dto: NoShowDto,
    userId: string,
  ): Promise<AppointmentResponseDto> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: { patient: true },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    const noShowStatuses: AppointmentStatus[] = ['SCHEDULED', 'CONFIRMED'];
    if (!noShowStatuses.includes(appointment.status)) {
      throw new BadRequestException('Status inválido para marcar como falta');
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: 'NO_SHOW' as unknown as AppointmentStatus,
        metadata: {
          ...((appointment.metadata as object) || {}),
          noShow: {
            markedAt: new Date().toISOString(),
            markedBy: userId,
            contactAttempted: dto.contactAttempted,
            contactMethod: dto.contactMethod,
            notes: dto.notes,
            chargeNoShowFee: dto.chargeNoShowFee,
          },
        },
      },
      include: this.getAppointmentInclude(),
    });

    await this.cacheService.del(`${this.CACHE_PREFIX}:${id}`);

    // Cobrar taxa de no-show se configurado
    if (dto.chargeNoShowFee) {
      this.eventEmitter.emit('billing.chargeNoShowFee', {
        appointmentId: id,
        patientId: appointment.patientId,
      });
    }

    // Auditoria
    await this.auditService.log({
      action: 'APPOINTMENT_NO_SHOW',
      entityType: 'Appointment',
      entityId: id,
      userId,
      details: dto,
    });

    // Emitir evento
    this.eventEmitter.emit('appointment.noShow', {
      appointmentId: id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
    });

    return this.mapToResponseDto(updated);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // CALENDÁRIO E SLOTS
  // ═══════════════════════════════════════════════════════════════════════════════

  async getCalendar(query: CalendarQueryDto): Promise<CalendarResponseDto> {
    const {
      clinicId,
      doctorIds,
      roomIds,
      startDate,
      endDate,
      view = 'week',
      includeBlocks = true,
      includeVacations = true,
      groupBy = 'none',
    } = query;

    // Calcular período baseado na view
    let periodStart: Date;
    let periodEnd: Date;

    if (startDate && endDate) {
      periodStart = new Date(startDate);
      periodEnd = new Date(endDate);
    } else {
      const now = new Date();
      switch (view) {
        case 'day':
          periodStart = new Date(now.setHours(0, 0, 0, 0));
          periodEnd = new Date(now.setHours(23, 59, 59, 999));
          break;
        case 'week':
          periodStart = new Date(now);
          periodStart.setDate(now.getDate() - now.getDay());
          periodStart.setHours(0, 0, 0, 0);
          periodEnd = new Date(periodStart);
          periodEnd.setDate(periodStart.getDate() + 6);
          periodEnd.setHours(23, 59, 59, 999);
          break;
        case 'month':
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
          periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
        default:
          periodStart = new Date(now.setHours(0, 0, 0, 0));
          periodEnd = new Date(periodStart);
          periodEnd.setDate(periodStart.getDate() + 30);
      }
    }

    const events: CalendarEventResponseDto[] = [];

    // Buscar agendamentos
    const appointmentWhere: Prisma.AppointmentWhereInput = {
      startTime: { gte: periodStart, lte: periodEnd },
      deletedAt: null,
      status: { notIn: ['CANCELLED'] as unknown as AppointmentStatus[] },
    };

    if (clinicId) appointmentWhere.clinicId = clinicId;
    if (doctorIds && doctorIds.length > 0) {
      appointmentWhere.doctorId = { in: doctorIds };
    }
    if (roomIds && roomIds.length > 0) {
      appointmentWhere.roomId = { in: roomIds };
    }

    const appointments = await this.prisma.appointment.findMany({
      where: appointmentWhere,
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        room: true,
      },
    });

    // Mapear agendamentos para eventos
    for (const apt of appointments) {
      const patientName = `${apt.patient.user.firstName} ${apt.patient.user.lastName}`;
      const doctorName = `${apt.doctor.user.firstName} ${apt.doctor.user.lastName}`;

      events.push({
        id: apt.id,
        title: patientName,
        start: apt.startTime,
        end: apt.endTime,
        type: 'APPOINTMENT',
        status: apt.status as string,
        color: apt.color || this.getStatusColor(apt.status as string),
        backgroundColor: apt.color || this.getStatusColor(apt.status as string),
        borderColor: apt.color || this.getStatusColor(apt.status as string),
        textColor: '#ffffff',
        allDay: false,
        resourceId: groupBy === 'doctor' ? apt.doctorId : groupBy === 'room' ? apt.roomId || undefined : undefined,
        resourceType: groupBy === 'doctor' ? 'DOCTOR' : groupBy === 'room' ? 'ROOM' : undefined,
        extendedProps: {
          appointmentId: apt.id,
          patientId: apt.patientId,
          patientName,
          doctorId: apt.doctorId,
          doctorName,
          clinicId: apt.clinicId,
          roomId: apt.roomId || undefined,
          roomName: apt.room?.name,
          appointmentType: apt.type as string,
          isTelemedicine: apt.type === ('TELEMEDICINE' as unknown as AppointmentType),
          priority: apt.priority,
          notes: apt.notes || undefined,
        },
      });
    }

    // Buscar bloqueios de agenda se configurado
    if (includeBlocks) {
      const blockWhere: Prisma.ScheduleBlockWhereInput = {
        startTime: { gte: periodStart },
        endTime: { lte: periodEnd },
      };

      if (doctorIds && doctorIds.length > 0) {
        blockWhere.doctorId = { in: doctorIds };
      }

      const blocks = await this.prisma.scheduleBlock.findMany({
        where: blockWhere,
        include: { doctor: { include: { user: true } } },
      });

      for (const block of blocks) {
        events.push({
          id: `block-${block.id}`,
          title: block.reason || 'Bloqueado',
          start: block.startTime,
          end: block.endTime,
          type: 'BLOCK',
          color: '#6b7280',
          backgroundColor: '#6b7280',
          borderColor: '#6b7280',
          textColor: '#ffffff',
          allDay: block.allDay,
          resourceId: groupBy === 'doctor' ? block.doctorId : undefined,
          resourceType: groupBy === 'doctor' ? 'DOCTOR' : undefined,
        });
      }
    }

    // Buscar férias se configurado
    if (includeVacations) {
      const vacationWhere: Prisma.DoctorVacationWhereInput = {
        startDate: { lte: periodEnd },
        endDate: { gte: periodStart },
      };

      if (doctorIds && doctorIds.length > 0) {
        vacationWhere.doctorId = { in: doctorIds };
      }

      const vacations = await this.prisma.doctorVacation.findMany({
        where: vacationWhere,
        include: { doctor: { include: { user: true } } },
      });

      for (const vacation of vacations) {
        events.push({
          id: `vacation-${vacation.id}`,
          title: `Férias - ${vacation.doctor.user.firstName}`,
          start: vacation.startDate,
          end: vacation.endDate,
          type: 'VACATION',
          color: '#f59e0b',
          backgroundColor: '#f59e0b',
          borderColor: '#f59e0b',
          textColor: '#ffffff',
          allDay: true,
          resourceId: groupBy === 'doctor' ? vacation.doctorId : undefined,
          resourceType: groupBy === 'doctor' ? 'DOCTOR' : undefined,
        });
      }
    }

    // Buscar recursos se agrupando
    let resources;
    if (groupBy === 'doctor' && doctorIds && doctorIds.length > 0) {
      const doctors = await this.prisma.doctor.findMany({
        where: { id: { in: doctorIds } },
        include: { user: true, specialties: { include: { specialty: true } } },
      });

      resources = doctors.map((d) => ({
        id: d.id,
        title: `Dr(a). ${d.user.firstName} ${d.user.lastName}`,
        type: 'DOCTOR' as const,
        avatarUrl: d.user.avatarUrl || undefined,
        specialty: d.specialties[0]?.specialty.name,
      }));
    } else if (groupBy === 'room' && roomIds && roomIds.length > 0) {
      const rooms = await this.prisma.room.findMany({
        where: { id: { in: roomIds } },
      });

      resources = rooms.map((r) => ({
        id: r.id,
        title: r.name,
        type: 'ROOM' as const,
      }));
    }

    return {
      events,
      resources,
      startDate: periodStart,
      endDate: periodEnd,
      view,
    };
  }

  async getAvailableSlots(query: AvailableSlotsQueryDto): Promise<AvailableSlotsResponseDto> {
    const {
      doctorId,
      clinicId,
      specialtyId,
      roomId,
      startDate,
      endDate,
      durationMinutes = 30,
      appointmentType,
      telemedicineOnly,
      earliestTime,
      latestTime,
      daysOfWeek,
      limit = 20,
    } = query;

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Buscar médicos
    const doctorWhere: Prisma.DoctorWhereInput = {
      isActive: true,
    };

    if (doctorId) doctorWhere.id = doctorId;
    if (clinicId) {
      doctorWhere.clinicDoctors = {
        some: { clinicId, isActive: true },
      };
    }
    if (specialtyId) {
      doctorWhere.specialties = {
        some: { specialtyId },
      };
    }

    const doctors = await this.prisma.doctor.findMany({
      where: doctorWhere,
      include: {
        user: true,
        workingHours: true,
        clinicDoctors: {
          where: clinicId ? { clinicId } : undefined,
          include: { clinic: true },
        },
      },
    });

    const slots: AvailableSlotResponseDto[] = [];

    // Para cada médico, gerar slots disponíveis
    for (const doctor of doctors) {
      const workingHours = doctor.workingHours;
      if (!workingHours || workingHours.length === 0) continue;

      // Buscar agendamentos existentes
      const existingAppointments = await this.prisma.appointment.findMany({
        where: {
          doctorId: doctor.id,
          startTime: { gte: start, lte: end },
          status: { notIn: ['CANCELLED', 'NO_SHOW'] as unknown as AppointmentStatus[] },
          deletedAt: null,
        },
      });

      // Buscar bloqueios
      const blocks = await this.prisma.scheduleBlock.findMany({
        where: {
          doctorId: doctor.id,
          startTime: { gte: start },
          endTime: { lte: end },
        },
      });

      // Buscar férias
      const vacations = await this.prisma.doctorVacation.findMany({
        where: {
          doctorId: doctor.id,
          startDate: { lte: end },
          endDate: { gte: start },
        },
      });

      // Iterar por cada dia no período
      const currentDate = new Date(start);
      while (currentDate <= end && slots.length < limit) {
        const dayOfWeek = currentDate.getDay();

        // Verificar se é dia desejado
        if (daysOfWeek && daysOfWeek.length > 0 && !daysOfWeek.includes(dayOfWeek)) {
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }

        // Verificar férias
        const isOnVacation = vacations.some(
          (v) => currentDate >= v.startDate && currentDate <= v.endDate,
        );
        if (isOnVacation) {
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }

        // Obter horário de trabalho do dia
        const dayWorkingHours = workingHours.find(
          (wh) => wh.dayOfWeek === dayOfWeek && wh.isAvailable,
        );
        if (!dayWorkingHours) {
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }

        // Gerar slots do dia
        const [startHour, startMinute] = dayWorkingHours.startTime.split(':').map(Number);
        const [endHour, endMinute] = dayWorkingHours.endTime.split(':').map(Number);

        let slotStart = new Date(currentDate);
        slotStart.setHours(startHour, startMinute, 0, 0);

        const dayEnd = new Date(currentDate);
        dayEnd.setHours(endHour, endMinute, 0, 0);

        // Ajustar horário mais cedo/tarde se configurado
        if (earliestTime) {
          const [eh, em] = earliestTime.split(':').map(Number);
          const earliest = new Date(currentDate);
          earliest.setHours(eh, em, 0, 0);
          if (slotStart < earliest) slotStart = earliest;
        }

        if (latestTime) {
          const [lh, lm] = latestTime.split(':').map(Number);
          const latest = new Date(currentDate);
          latest.setHours(lh, lm, 0, 0);
          if (dayEnd > latest) dayEnd.setHours(lh, lm, 0, 0);
        }

        // Intervalo de almoço se definido
        let lunchStart: Date | null = null;
        let lunchEnd: Date | null = null;
        if (dayWorkingHours.breakStart && dayWorkingHours.breakEnd) {
          const [lsH, lsM] = dayWorkingHours.breakStart.split(':').map(Number);
          const [leH, leM] = dayWorkingHours.breakEnd.split(':').map(Number);
          lunchStart = new Date(currentDate);
          lunchStart.setHours(lsH, lsM, 0, 0);
          lunchEnd = new Date(currentDate);
          lunchEnd.setHours(leH, leM, 0, 0);
        }

        while (slotStart < dayEnd && slots.length < limit) {
          const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);

          // Verificar se não está no horário de almoço
          if (
            lunchStart &&
            lunchEnd &&
            ((slotStart >= lunchStart && slotStart < lunchEnd) ||
              (slotEnd > lunchStart && slotEnd <= lunchEnd))
          ) {
            slotStart = new Date(lunchEnd);
            continue;
          }

          // Verificar conflitos com agendamentos existentes
          const hasConflict = existingAppointments.some(
            (apt) =>
              (slotStart >= apt.startTime && slotStart < apt.endTime) ||
              (slotEnd > apt.startTime && slotEnd <= apt.endTime) ||
              (slotStart <= apt.startTime && slotEnd >= apt.endTime),
          );

          // Verificar bloqueios
          const isBlocked = blocks.some(
            (block) =>
              (slotStart >= block.startTime && slotStart < block.endTime) ||
              (slotEnd > block.startTime && slotEnd <= block.endTime),
          );

          // Verificar se slot não está no passado
          const now = new Date();
          const isInPast = slotStart < now;

          if (!hasConflict && !isBlocked && !isInPast) {
            const clinicDoctor = doctor.clinicDoctors[0];

            slots.push({
              startTime: new Date(slotStart),
              endTime: slotEnd,
              durationMinutes,
              doctorId: doctor.id,
              doctorName: `Dr(a). ${doctor.user.firstName} ${doctor.user.lastName}`,
              doctorAvatarUrl: doctor.user.avatarUrl || undefined,
              clinicId: clinicDoctor?.clinicId,
              clinicName: clinicDoctor?.clinic.name,
              isTelemedicineAvailable: doctor.telemedicineEnabled || false,
              isInPersonAvailable: true,
              price: doctor.consultationPrice ? Number(doctor.consultationPrice) : undefined,
              acceptsInsurance: true, // TODO: Verificar convênios aceitos
            });
          }

          slotStart = new Date(slotStart.getTime() + durationMinutes * 60000);
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Ordenar por data/hora
    slots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    return {
      slots: slots.slice(0, limit),
      total: slots.length,
      startDate: start,
      endDate: end,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // LISTA DE ESPERA
  // ═══════════════════════════════════════════════════════════════════════════════

  async addToWaitingList(
    dto: AddToWaitingListDto,
    userId: string,
  ): Promise<any> {
    // Verificar se paciente já está na lista para este médico
    const existing = await this.prisma.waitingListEntry.findFirst({
      where: {
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        status: 'WAITING',
      },
    });

    if (existing) {
      throw new ConflictException('Paciente já está na lista de espera para este médico');
    }

    const entry = await this.prisma.waitingListEntry.create({
      data: {
        patient: { connect: { id: dto.patientId } },
        doctor: { connect: { id: dto.doctorId } },
        clinic: { connect: { id: dto.clinicId } },
        ...(dto.specialtyId ? { specialty: { connect: { id: dto.specialtyId } } } : {}),
        preferredDate: dto.preferredDate ? new Date(dto.preferredDate) : null,
        preferredPeriod: dto.preferredPeriod,
        availableDays: dto.availableDays || [],
        priority: dto.priority || 1,
        urgencyReason: dto.urgencyReason,
        notifyBy: dto.notifyBy || ['EMAIL', 'PUSH'],
        status: 'WAITING',
        createdById: userId,
      },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        clinic: true,
        specialty: true,
      },
    });

    // Auditoria
    await this.auditService.log({
      action: 'WAITING_LIST_ADDED',
      entityType: 'WaitingListEntry',
      entityId: entry.id,
      userId,
      details: dto,
    });

    return entry;
  }

  async getWaitingList(query: WaitingListQueryDto): Promise<WaitingListResponseDto> {
    const {
      clinicId,
      doctorId,
      patientId,
      specialtyId,
      minPriority,
      status,
      preferredDateFrom,
      preferredDateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = query;

    const where: Prisma.WaitingListEntryWhereInput = {};

    if (clinicId) where.clinicId = clinicId;
    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;
    if (specialtyId) where.specialtyId = specialtyId;
    if (minPriority) where.priority = { gte: minPriority };
    if (status) where.status = status;

    if (preferredDateFrom || preferredDateTo) {
      where.preferredDate = {};
      if (preferredDateFrom) where.preferredDate.gte = new Date(preferredDateFrom);
      if (preferredDateTo) where.preferredDate.lte = new Date(preferredDateTo);
    }

    const orderBy: Prisma.WaitingListEntryOrderByWithRelationInput = {};
    if (sortBy === 'priority') orderBy.priority = sortOrder;
    else if (sortBy === 'preferredDate') orderBy.preferredDate = sortOrder;
    else orderBy.createdAt = sortOrder;

    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      this.prisma.waitingListEntry.findMany({
        where,
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true } },
          clinic: true,
          specialty: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.waitingListEntry.count({ where }),
    ]);

    return {
      data: entries.map((e) => ({
        id: e.id,
        patient: {
          id: e.patient.id,
          fullName: `${e.patient.user.firstName} ${e.patient.user.lastName}`,
          email: e.patient.user.email || undefined,
          phone: e.patient.user.phone || undefined,
        },
        doctor: {
          id: e.doctor.id,
          fullName: `Dr(a). ${e.doctor.user.firstName} ${e.doctor.user.lastName}`,
          crm: e.doctor.crm || undefined,
        },
        clinic: {
          id: e.clinic.id,
          name: e.clinic.name,
        },
        specialtyId: e.specialtyId || undefined,
        specialtyName: e.specialty?.name,
        preferredDate: e.preferredDate || undefined,
        preferredPeriod: e.preferredPeriod || undefined,
        availableDays: e.availableDays,
        priority: e.priority,
        urgencyReason: e.urgencyReason || undefined,
        status: e.status,
        notifyBy: e.notifyBy,
        contactedAt: e.contactedAt || undefined,
        scheduledAppointmentId: e.scheduledAppointmentId || undefined,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async removeFromWaitingList(entryId: string, userId: string): Promise<void> {
    const entry = await this.prisma.waitingListEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      throw new NotFoundException('Entrada na lista de espera não encontrada');
    }

    await this.prisma.waitingListEntry.update({
      where: { id: entryId },
      data: { status: 'CANCELLED' },
    });

    await this.auditService.log({
      action: 'WAITING_LIST_REMOVED',
      entityType: 'WaitingListEntry',
      entityId: entryId,
      userId,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ESTATÍSTICAS
  // ═══════════════════════════════════════════════════════════════════════════════

  async getStats(query: AppointmentStatsQueryDto): Promise<AppointmentStatsResponseDto> {
    const {
      clinicId,
      doctorId,
      startDate,
      endDate,
      groupBy = 'day',
      comparePrevious = false,
    } = query;

    // Calcular período
    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate ? new Date(endDate) : now;

    const where: Prisma.AppointmentWhereInput = {
      startTime: { gte: start, lte: end },
      deletedAt: null,
    };

    if (clinicId) where.clinicId = clinicId;
    if (doctorId) where.doctorId = doctorId;

    // Buscar todos os agendamentos do período
    const appointments = await this.prisma.appointment.findMany({
      where,
      include: {
        doctor: { include: { user: true } },
      },
    });

    // Calcular estatísticas
    const total = appointments.length;
    const completed = appointments.filter((a) => a.status === ('COMPLETED' as unknown as AppointmentStatus)).length;
    const cancelled = appointments.filter((a) => a.status === ('CANCELLED' as unknown as AppointmentStatus)).length;
    const noShow = appointments.filter((a) => a.status === ('NO_SHOW' as unknown as AppointmentStatus)).length;
    const pending = appointments.filter((a) =>
      ['SCHEDULED', 'CONFIRMED', 'WAITING'].includes(a.status as string),
    ).length;

    // Calcular tempos médios
    const completedWithTimes = appointments.filter(
      (a) => a.status === ('COMPLETED' as unknown as AppointmentStatus) && a.waitingTime !== null,
    );
    const avgWaitingTime =
      completedWithTimes.length > 0
        ? completedWithTimes.reduce((sum, a) => sum + (a.waitingTime || 0), 0) /
          completedWithTimes.length
        : 0;

    const avgConsultationDuration =
      completedWithTimes.length > 0
        ? completedWithTimes.reduce((sum, a) => sum + (a.consultationDuration || 0), 0) /
          completedWithTimes.length
        : 0;

    // Agrupar por tipo
    const byType: Record<string, number> = {};
    for (const apt of appointments) {
      const type = apt.type as string;
      byType[type] = (byType[type] || 0) + 1;
    }

    // Agrupar por status
    const byStatus: Record<string, number> = {};
    for (const apt of appointments) {
      const status = apt.status as string;
      byStatus[status] = (byStatus[status] || 0) + 1;
    }

    // Agrupar por médico
    const byDoctorMap = new Map<
      string,
      { doctorName: string; total: number; completed: number; cancelled: number; noShow: number }
    >();
    for (const apt of appointments) {
      const existing = byDoctorMap.get(apt.doctorId) || {
        doctorName: `${apt.doctor.user.firstName} ${apt.doctor.user.lastName}`,
        total: 0,
        completed: 0,
        cancelled: 0,
        noShow: 0,
      };

      existing.total++;
      if (apt.status === ('COMPLETED' as unknown as AppointmentStatus)) existing.completed++;
      if (apt.status === ('CANCELLED' as unknown as AppointmentStatus)) existing.cancelled++;
      if (apt.status === ('NO_SHOW' as unknown as AppointmentStatus)) existing.noShow++;

      byDoctorMap.set(apt.doctorId, existing);
    }

    const byDoctor = Array.from(byDoctorMap.entries()).map(([doctorId, stats]) => ({
      doctorId,
      ...stats,
    }));

    // Calcular período anterior se solicitado
    let previousPeriod;
    let growth;
    if (comparePrevious) {
      const periodLength = end.getTime() - start.getTime();
      const prevStart = new Date(start.getTime() - periodLength);
      const prevEnd = new Date(end.getTime() - periodLength);

      const prevWhere = {
        ...where,
        startTime: { gte: prevStart, lte: prevEnd },
      };

      const prevAppointments = await this.prisma.appointment.findMany({
        where: prevWhere,
      });

      const prevTotal = prevAppointments.length;
      const prevCompleted = prevAppointments.filter(
        (a) => a.status === ('COMPLETED' as unknown as AppointmentStatus),
      ).length;
      const prevCancelled = prevAppointments.filter(
        (a) => a.status === ('CANCELLED' as unknown as AppointmentStatus),
      ).length;
      const prevNoShow = prevAppointments.filter((a) => a.status === ('NO_SHOW' as unknown as AppointmentStatus)).length;

      previousPeriod = {
        totalAppointments: prevTotal,
        completedAppointments: prevCompleted,
        cancelledAppointments: prevCancelled,
        noShowAppointments: prevNoShow,
      };

      growth = {
        total: prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0,
        completed: prevCompleted > 0 ? ((completed - prevCompleted) / prevCompleted) * 100 : 0,
        cancelled: prevCancelled > 0 ? ((cancelled - prevCancelled) / prevCancelled) * 100 : 0,
        noShow: prevNoShow > 0 ? ((noShow - prevNoShow) / prevNoShow) * 100 : 0,
      };
    }

    return {
      totalAppointments: total,
      completedAppointments: completed,
      cancelledAppointments: cancelled,
      noShowAppointments: noShow,
      pendingAppointments: pending,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      cancellationRate: total > 0 ? (cancelled / total) * 100 : 0,
      noShowRate: total > 0 ? (noShow / total) * 100 : 0,
      averageWaitingTime: Math.round(avgWaitingTime),
      averageConsultationDuration: Math.round(avgConsultationDuration),
      byType,
      byStatus,
      byDoctor,
      previousPeriod,
      growth,
    };
  }

  async getDailySchedule(
    doctorId: string,
    date: string,
  ): Promise<DailyScheduleResponseDto> {
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        startTime: { gte: dateStart, lte: dateEnd },
        deletedAt: null,
      },
      include: this.getAppointmentInclude(),
      orderBy: { startTime: 'asc' },
    });

    const stats = {
      totalScheduled: appointments.length,
      totalCompleted: appointments.filter((a) => a.status === ('COMPLETED' as unknown as AppointmentStatus)).length,
      totalCancelled: appointments.filter((a) => a.status === ('CANCELLED' as unknown as AppointmentStatus)).length,
      totalNoShow: appointments.filter((a) => a.status === ('NO_SHOW' as unknown as AppointmentStatus)).length,
      totalPending: appointments.filter((a) =>
        ['SCHEDULED', 'CONFIRMED', 'WAITING'].includes(a.status as string),
      ).length,
    };

    // Calcular próximo slot disponível
    const slotsResult = await this.getAvailableSlots({
      doctorId,
      startDate: date,
      endDate: date,
      limit: 1,
    });

    return {
      date: dateStart,
      appointments: appointments.map((a) => this.mapToResponseDto(a)),
      ...stats,
      nextAvailableSlot: slotsResult.slots[0]?.startTime,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // OPERAÇÕES EM LOTE
  // ═══════════════════════════════════════════════════════════════════════════════

  async batchCancel(dto: BatchCancelDto, userId: string): Promise<BatchOperationResultDto> {
    const results = {
      success: true,
      total: dto.appointmentIds.length,
      processed: 0,
      failed: 0,
      successIds: [] as string[],
      errors: [] as Array<{ id: string; error: string }>,
    };

    for (const id of dto.appointmentIds) {
      try {
        await this.cancel(
          id,
          {
            reason: dto.reason,
            notes: dto.notes,
            notifyPatient: dto.notifyPatients,
          },
          userId,
        );
        results.processed++;
        results.successIds.push(id);
      } catch (error) {
        results.failed++;
        results.errors.push({
          id,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }

    results.success = results.failed === 0;
    return results;
  }

  async batchConfirm(dto: BatchConfirmDto, userId: string): Promise<BatchOperationResultDto> {
    const results = {
      success: true,
      total: dto.appointmentIds.length,
      processed: 0,
      failed: 0,
      successIds: [] as string[],
      errors: [] as Array<{ id: string; error: string }>,
    };

    for (const id of dto.appointmentIds) {
      try {
        await this.confirm(
          id,
          {
            confirmationMethod: dto.confirmationMethod as any,
          },
          userId,
        );
        results.processed++;
        results.successIds.push(id);
      } catch (error) {
        results.failed++;
        results.errors.push({
          id,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }

    results.success = results.failed === 0;
    return results;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // MÉTODOS AUXILIARES PRIVADOS
  // ═══════════════════════════════════════════════════════════════════════════════

  private async checkDoctorConflicts(
    doctorId: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string,
  ): Promise<void> {
    const conflict = await this.prisma.appointment.findFirst({
      where: {
        doctorId,
        id: excludeId ? { not: excludeId } : undefined,
        status: { notIn: ['CANCELLED', 'NO_SHOW', 'RESCHEDULED'] as unknown as AppointmentStatus[] },
        deletedAt: null,
        OR: [
          { startTime: { gte: startTime, lt: endTime } },
          { endTime: { gt: startTime, lte: endTime } },
          { AND: [{ startTime: { lte: startTime } }, { endTime: { gte: endTime } }] },
        ],
      },
    });

    if (conflict) {
      throw new ConflictException('Médico já possui agendamento neste horário');
    }
  }

  private async checkPatientConflicts(
    patientId: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string,
  ): Promise<void> {
    const conflict = await this.prisma.appointment.findFirst({
      where: {
        patientId,
        id: excludeId ? { not: excludeId } : undefined,
        status: { notIn: ['CANCELLED', 'NO_SHOW', 'RESCHEDULED'] as unknown as AppointmentStatus[] },
        deletedAt: null,
        OR: [
          { startTime: { gte: startTime, lt: endTime } },
          { endTime: { gt: startTime, lte: endTime } },
          { AND: [{ startTime: { lte: startTime } }, { endTime: { gte: endTime } }] },
        ],
      },
    });

    if (conflict) {
      throw new ConflictException('Paciente já possui agendamento neste horário');
    }
  }

  private async checkRoomConflicts(
    roomId: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string,
  ): Promise<void> {
    const conflict = await this.prisma.appointment.findFirst({
      where: {
        roomId,
        id: excludeId ? { not: excludeId } : undefined,
        status: { notIn: ['CANCELLED', 'NO_SHOW', 'RESCHEDULED'] as unknown as AppointmentStatus[] },
        deletedAt: null,
        OR: [
          { startTime: { gte: startTime, lt: endTime } },
          { endTime: { gt: startTime, lte: endTime } },
          { AND: [{ startTime: { lte: startTime } }, { endTime: { gte: endTime } }] },
        ],
      },
    });

    if (conflict) {
      throw new ConflictException('Sala já está ocupada neste horário');
    }
  }

  private async validateWorkingHours(
    doctorId: string,
    clinicId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<void> {
    const dayOfWeek = startTime.getDay();

    const workingHours = await this.prisma.doctorWorkingHours.findFirst({
      where: {
        doctorId,
        dayOfWeek,
        isAvailable: true,
      },
    });

    if (!workingHours) {
      throw new BadRequestException('Médico não atende neste dia da semana');
    }

    const [startHour, startMinute] = workingHours.startTime.split(':').map(Number);
    const [endHour, endMinute] = workingHours.endTime.split(':').map(Number);

    const workStart = new Date(startTime);
    workStart.setHours(startHour, startMinute, 0, 0);

    const workEnd = new Date(startTime);
    workEnd.setHours(endHour, endMinute, 0, 0);

    if (startTime < workStart || endTime > workEnd) {
      throw new BadRequestException('Horário fora do expediente do médico');
    }
  }

  private async createRecurringAppointments(
    originalId: string,
    dto: CreateAppointmentDto,
    userId: string,
  ): Promise<void> {
    if (!dto.recurrence || dto.recurrence.type === 'NONE') return;

    const { type, interval = 1, endDate, maxOccurrences = 12, daysOfWeek } = dto.recurrence;
    const startTime = new Date(dto.startTime);
    const occurrences: Date[] = [];

    let currentDate = new Date(startTime);
    let count = 0;
    const maxDate = endDate ? new Date(endDate) : new Date(startTime.getTime() + 365 * 24 * 60 * 60 * 1000);

    while (count < maxOccurrences && currentDate <= maxDate) {
      switch (type) {
        case 'DAILY':
          currentDate.setDate(currentDate.getDate() + interval);
          break;
        case 'WEEKLY':
          currentDate.setDate(currentDate.getDate() + 7 * interval);
          break;
        case 'BIWEEKLY':
          currentDate.setDate(currentDate.getDate() + 14);
          break;
        case 'MONTHLY':
          currentDate.setMonth(currentDate.getMonth() + interval);
          break;
        case 'QUARTERLY':
          currentDate.setMonth(currentDate.getMonth() + 3);
          break;
      }

      // Verificar dias da semana se especificado
      if (daysOfWeek && daysOfWeek.length > 0 && !daysOfWeek.includes(currentDate.getDay())) {
        continue;
      }

      if (currentDate <= maxDate) {
        occurrences.push(new Date(currentDate));
        count++;
      }
    }

    // Criar agendamentos recorrentes
    for (const date of occurrences) {
      try {
        const newDto = { ...dto };
        newDto.startTime = date.toISOString();
        delete newDto.recurrence;

        await this.create(
          {
            ...newDto,
            metadata: {
              ...newDto.metadata,
              isRecurrence: true,
              originalAppointmentId: originalId,
            },
          },
          userId,
        );
      } catch (error) {
        this.logger.warn(`Failed to create recurring appointment: ${error}`);
      }
    }
  }

  private async createReminders(appointmentId: string, reminders: any[]): Promise<void> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) return;

    for (const reminder of reminders) {
      const scheduledFor = new Date(
        appointment.startTime.getTime() - reminder.minutesBefore * 60000,
      );

      await this.prisma.appointmentReminder.create({
        data: {
          appointment: { connect: { id: appointmentId } },
          type: reminder.type,
          scheduledFor,
          customMessage: reminder.customMessage,
          status: 'PENDING',
        },
      });
    }
  }

  private async setupTelemedicineRoom(appointmentId: string, config: any): Promise<void> {
    // Implementar integração com provedor de videochamada
    // Por enquanto, apenas salva as configurações
    this.eventEmitter.emit('telemedicine.setupRoom', {
      appointmentId,
      config,
    });
  }

  private getAppointmentInclude() {
    return {
      patient: {
        include: {
          user: true,
        },
      },
      doctor: {
        include: {
          user: true,
        },
      },
      clinic: true,
      room: true,
      specialty: true,
      createdBy: true,
    };
  }

  private mapToResponseDto(appointment: any): AppointmentResponseDto {
    const metadata = (appointment.metadata as Record<string, any>) || {};

    return {
      id: appointment.id,
      patient: {
        id: appointment.patient.id,
        fullName: `${appointment.patient.user.firstName} ${appointment.patient.user.lastName}`,
        cpf: appointment.patient.cpf,
        email: appointment.patient.user.email,
        phone: appointment.patient.user.phone,
        avatarUrl: appointment.patient.user.avatarUrl,
        birthDate: appointment.patient.birthDate,
        age: appointment.patient.birthDate
          ? Math.floor(
              (Date.now() - appointment.patient.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
            )
          : undefined,
      },
      doctor: {
        id: appointment.doctor.id,
        fullName: `Dr(a). ${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`,
        crm: appointment.doctor.crm,
        email: appointment.doctor.user.email,
        phone: appointment.doctor.user.phone,
        avatarUrl: appointment.doctor.user.avatarUrl,
        specialty: appointment.specialty?.name,
      },
      clinic: {
        id: appointment.clinic.id,
        name: appointment.clinic.name,
        phone: appointment.clinic.phone,
        address: appointment.clinic.address
          ? `${(appointment.clinic.address as any).street}, ${(appointment.clinic.address as any).number}`
          : undefined,
      },
      room: appointment.room
        ? {
            id: appointment.room.id,
            name: appointment.room.name,
            number: appointment.room.number,
            floor: appointment.room.floor,
          }
        : undefined,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      durationMinutes: appointment.durationMinutes,
      type: appointment.type as AppointmentTypeEnum,
      status: appointment.status as AppointmentStatusEnum,
      specialtyId: appointment.specialtyId,
      specialtyName: appointment.specialty?.name,
      procedureId: metadata.procedureId,
      procedureName: metadata.procedureName,
      reason: appointment.reason,
      notes: appointment.notes,
      patientInstructions: appointment.patientInstructions,
      isFirstVisit: appointment.isFirstVisit,
      isReturn: appointment.isReturn,
      originalAppointmentId: appointment.originalAppointmentId,
      price: appointment.price ? Number(appointment.price) : undefined,
      isPrivate: appointment.isPrivate,
      insurance: metadata.insurance,
      telemedicine: metadata.telemedicine,
      priority: appointment.priority,
      tags: appointment.tags,
      color: appointment.color,
      checkInTime: appointment.checkInTime,
      actualStartTime: appointment.actualStartTime,
      actualEndTime: appointment.actualEndTime,
      waitingTime: appointment.waitingTime,
      consultationDuration: appointment.consultationDuration,
      cancellationReason: metadata.cancellationReason,
      cancellationNotes: metadata.cancellationNotes,
      cancelledAt: appointment.cancelledAt,
      cancelledBy: appointment.cancelledById,
      confirmedAt: appointment.confirmedAt,
      confirmationMethod: metadata.confirmationMethod,
      metadata: appointment.metadata,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
      createdBy: appointment.createdById,
    };
  }

  private getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      SCHEDULED: '#3b82f6', // blue
      CONFIRMED: '#10b981', // green
      WAITING: '#f59e0b', // amber
      IN_PROGRESS: '#8b5cf6', // violet
      COMPLETED: '#6b7280', // gray
      CANCELLED: '#ef4444', // red
      NO_SHOW: '#f97316', // orange
      RESCHEDULED: '#06b6d4', // cyan
    };
    return colors[status] || '#6b7280';
  }

  private async invalidateCache(clinicId: string, doctorId: string, patientId: string): Promise<void> {
    await Promise.all([
      this.cacheService.delByPattern(`${this.CACHE_PREFIX}:clinic:${clinicId}:*`),
      this.cacheService.delByPattern(`${this.CACHE_PREFIX}:doctor:${doctorId}:*`),
      this.cacheService.delByPattern(`${this.CACHE_PREFIX}:patient:${patientId}:*`),
    ]);
  }
}
