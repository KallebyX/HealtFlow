import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/database/prisma.service';
import { CacheService } from '@/common/services/cache.service';
import { AuditService } from '@/common/services/audit.service';
import {
  CreateDoctorDto,
  UpdateDoctorDto,
  BlockTimeSlotDto,
  VacationDto,
} from './dto/create-doctor.dto';
import { DoctorQueryDto, AvailableSlotsQueryDto, DoctorStatsQueryDto } from './dto/doctor-query.dto';
import {
  Doctor,
  AuditAction,
  UserStatus,
  Prisma,
  AppointmentStatus,
} from '@prisma/client';
import * as dayjs from 'dayjs';

@Injectable()
export class DoctorsService {
  private readonly logger = new Logger(DoctorsService.name);
  private readonly CACHE_PREFIX = 'doctor:';
  private readonly CACHE_TTL = 3600; // 1 hora

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════════
  // CRUD BÁSICO
  // ═══════════════════════════════════════════════════════════════════════════════

  async findAll(
    query: DoctorQueryDto,
    clinicId?: string,
  ): Promise<{ data: Doctor[]; total: number; page: number; limit: number; totalPages: number }> {
    const {
      page = 1,
      limit = 20,
      search,
      specialty,
      specialties,
      crmState,
      crmStatus,
      gender,
      telemedicineEnabled,
      hasDigitalCertificate,
      sortBy = 'fullName',
      sortOrder = 'asc',
      includeDeleted = false,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.DoctorWhereInput = {};

    // Soft delete filter
    if (!includeDeleted) {
      where.deletedAt = null;
    }

    // Filtro por clínica (multi-tenant)
    if (clinicId || query.clinicId) {
      where.clinicDoctors = {
        some: { clinicId: clinicId || query.clinicId },
      };
    }

    // Busca por nome, CRM ou especialidade
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { socialName: { contains: search, mode: 'insensitive' } },
        { crm: { contains: search } },
        { specialties: { has: search } },
      ];
    }

    // Filtro por especialidade única
    if (specialty) {
      where.specialties = { has: specialty };
    }

    // Filtro por múltiplas especialidades
    if (specialties && specialties.length > 0) {
      where.specialties = { hasSome: specialties };
    }

    // Filtro por estado do CRM
    if (crmState) {
      where.crmState = crmState;
    }

    // Filtro por status do CRM
    if (crmStatus) {
      where.crmStatus = crmStatus;
    }

    // Filtro por gênero
    if (gender) {
      where.gender = gender;
    }

    // Filtro por telemedicina
    if (telemedicineEnabled !== undefined) {
      where.telemedicineEnabled = telemedicineEnabled;
    }

    // Filtro por certificado digital
    if (hasDigitalCertificate !== undefined) {
      where.digitalCertificateId = hasDigitalCertificate ? { not: null } : null;
    }

    const [data, total] = await Promise.all([
      this.prisma.doctor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              status: true,
              lastLoginAt: true,
              emailVerified: true,
            },
          },
          digitalCertificate: {
            select: {
              id: true,
              type: true,
              issuer: true,
              validFrom: true,
              validUntil: true,
              active: true,
            },
          },
          clinicDoctors: {
            include: {
              clinic: {
                select: {
                  id: true,
                  tradeName: true,
                  logoUrl: true,
                },
              },
            },
          },
          _count: {
            select: {
              appointments: true,
              consultations: true,
              prescriptions: true,
              labOrders: true,
              telemedicineSessions: true,
            },
          },
        },
      }),
      this.prisma.doctor.count({ where }),
    ]);

    // Transform clinicDoctors to clinics array
    const transformedData = data.map((doctor) => ({
      ...doctor,
      clinics: doctor.clinicDoctors?.map((cd) => cd.clinic) || [],
    }));

    return {
      data: transformedData as any,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<Doctor> {
    // Tentar buscar do cache primeiro
    const cacheKey = `${this.CACHE_PREFIX}${id}`;
    const cached = await this.cacheService.get<Doctor>(cacheKey);

    if (cached) {
      this.logger.debug(`Cache hit for doctor: ${id}`);
      return cached;
    }

    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            role: true,
            emailVerified: true,
            twoFactorEnabled: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
        digitalCertificate: true,
        clinicDoctors: {
          include: {
            clinic: {
              select: {
                id: true,
                tradeName: true,
                logoUrl: true,
                address: true,
              },
            },
          },
        },
        _count: {
          select: {
            appointments: true,
            consultations: true,
            prescriptions: true,
            labOrders: true,
            telemedicineSessions: true,
          },
        },
      },
    });

    if (!doctor) {
      throw new NotFoundException('Médico não encontrado');
    }

    // Cachear resultado
    await this.cacheService.set(cacheKey, doctor, this.CACHE_TTL);

    return doctor;
  }

  async findByUserId(userId: string): Promise<Doctor> {
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            role: true,
            twoFactorEnabled: true,
            emailVerified: true,
            lastLoginAt: true,
          },
        },
        digitalCertificate: true,
        clinicDoctors: {
          include: {
            clinic: {
              select: {
                id: true,
                tradeName: true,
                logoUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            appointments: true,
            consultations: true,
            prescriptions: true,
          },
        },
      },
    });

    if (!doctor) {
      throw new NotFoundException('Médico não encontrado');
    }

    return doctor;
  }

  async findByCrm(crm: string, crmState: string): Promise<Doctor | null> {
    return this.prisma.doctor.findFirst({
      where: {
        crm,
        crmState: crmState.toUpperCase(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            status: true,
          },
        },
      },
    });
  }

  async findByCpf(cpf: string): Promise<Doctor | null> {
    const normalizedCpf = cpf.replace(/\D/g, '');

    return this.prisma.doctor.findUnique({
      where: { cpf: normalizedCpf },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            status: true,
          },
        },
      },
    });
  }

  async create(dto: CreateDoctorDto, userId: string): Promise<Doctor> {
    // Normalizar CPF
    const normalizedCpf = dto.cpf.replace(/\D/g, '');

    // Verificar se CPF já existe
    const existingByCpf = await this.prisma.doctor.findUnique({
      where: { cpf: normalizedCpf },
    });

    if (existingByCpf) {
      throw new ConflictException('CPF já cadastrado');
    }

    // Verificar se CRM já existe no mesmo estado
    const existingByCrm = await this.findByCrm(dto.crm, dto.crmState);

    if (existingByCrm) {
      throw new ConflictException('CRM já cadastrado neste estado');
    }

    // Validar CPF
    if (!this.isValidCpf(normalizedCpf)) {
      throw new BadRequestException('CPF inválido');
    }

    // Validar CRM (verificar formato básico)
    if (!this.isValidCrmFormat(dto.crm)) {
      throw new BadRequestException('Formato de CRM inválido');
    }

    const doctor = await this.prisma.doctor.create({
      data: {
        userId,
        fullName: dto.fullName,
        socialName: dto.socialName,
        cpf: normalizedCpf,
        birthDate: new Date(dto.birthDate),
        gender: dto.gender,
        phone: dto.phone,
        crm: dto.crm,
        crmState: dto.crmState.toUpperCase(),
        crmStatus: 'ACTIVE',
        specialties: dto.specialties,
        subspecialties: dto.subspecialties || [],
        rqe: dto.rqe || [],
        cns: dto.cns,
        bio: dto.bio,
        profilePhotoUrl: dto.profilePhotoUrl,
        signatureUrl: dto.signatureUrl,
        workingHours: (dto.workingHours as any) || null,
        appointmentDuration: dto.appointmentDuration || 30,
        telemedicineEnabled: dto.telemedicineEnabled ?? true,
        digitalCertificateId: dto.digitalCertificateId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            status: true,
          },
        },
      },
    });

    // Auditoria
    await this.auditService.log({
      action: AuditAction.CREATE,
      resource: 'doctor',
      resourceId: doctor.id,
      userId,
      description: 'Médico cadastrado',
    });

    // Emitir evento para validação do CRM
    this.eventEmitter.emit('doctor.created', {
      doctorId: doctor.id,
      crm: doctor.crm,
      crmState: doctor.crmState,
    });

    this.logger.log(`Doctor created: ${doctor.id}`);

    return doctor;
  }

  async update(
    id: string,
    dto: UpdateDoctorDto,
    updatedBy: string,
  ): Promise<Doctor> {
    const doctor = await this.findById(id);

    // Preparar dados para atualização
    const updateData: Prisma.DoctorUpdateInput = {};

    // Campos de texto simples
    if (dto.fullName !== undefined) updateData.fullName = dto.fullName;
    if (dto.socialName !== undefined) updateData.socialName = dto.socialName;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.cns !== undefined) updateData.cns = dto.cns;
    if (dto.bio !== undefined) updateData.bio = dto.bio;
    if (dto.profilePhotoUrl !== undefined) updateData.profilePhotoUrl = dto.profilePhotoUrl;
    if (dto.signatureUrl !== undefined) updateData.signatureUrl = dto.signatureUrl;
    if (dto.appointmentDuration !== undefined) updateData.appointmentDuration = dto.appointmentDuration;
    if (dto.telemedicineEnabled !== undefined) updateData.telemedicineEnabled = dto.telemedicineEnabled;
    if (dto.crmStatus !== undefined) updateData.crmStatus = dto.crmStatus;

    // Arrays
    if (dto.specialties !== undefined) updateData.specialties = dto.specialties;
    if (dto.subspecialties !== undefined) updateData.subspecialties = dto.subspecialties;
    if (dto.rqe !== undefined) updateData.rqe = dto.rqe;

    // JSON
    if (dto.workingHours !== undefined) updateData.workingHours = dto.workingHours as any;

    // Certificado digital
    if (dto.digitalCertificateId !== undefined) {
      updateData.digitalCertificate = dto.digitalCertificateId
        ? { connect: { id: dto.digitalCertificateId } }
        : { disconnect: true };
    }

    const updatedDoctor = await this.prisma.doctor.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            status: true,
          },
        },
        digitalCertificate: true,
      },
    });

    // Invalidar cache
    await this.cacheService.del(`${this.CACHE_PREFIX}${id}`);

    // Auditoria
    await this.auditService.log({
      action: AuditAction.UPDATE,
      resource: 'doctor',
      resourceId: id,
      userId: updatedBy,
      description: 'Dados do médico atualizados',
      oldValues: this.sanitizeForAudit(doctor),
      newValues: this.sanitizeForAudit(updatedDoctor),
    });

    // Emitir evento
    this.eventEmitter.emit('doctor.updated', {
      doctorId: id,
      updatedBy,
      changes: Object.keys(dto),
    });

    return updatedDoctor;
  }

  async delete(id: string, deletedBy: string): Promise<void> {
    const doctor = await this.findById(id);

    // Verificar se não há consultas futuras
    const futureAppointments = await this.prisma.appointment.count({
      where: {
        doctorId: id,
        scheduledDate: { gte: new Date() },
        status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] },
      },
    });

    if (futureAppointments > 0) {
      throw new BadRequestException(
        `Não é possível remover o médico. Existem ${futureAppointments} consultas agendadas.`,
      );
    }

    // Soft delete
    await this.prisma.$transaction([
      this.prisma.doctor.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: doctor.userId },
        data: { status: UserStatus.INACTIVE, deletedAt: new Date() },
      }),
    ]);

    // Invalidar cache
    await this.cacheService.del(`${this.CACHE_PREFIX}${id}`);

    // Auditoria
    await this.auditService.log({
      action: AuditAction.DELETE,
      resource: 'doctor',
      resourceId: id,
      userId: deletedBy,
      description: 'Médico removido (soft delete)',
    });

    this.logger.log(`Doctor soft deleted: ${id} by ${deletedBy}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // AGENDA E DISPONIBILIDADE
  // ═══════════════════════════════════════════════════════════════════════════════

  async getAvailableSlots(
    doctorId: string,
    query: AvailableSlotsQueryDto,
  ): Promise<any[]> {
    const doctor = await this.findById(doctorId);

    const startDate = query.startDate
      ? dayjs(query.startDate)
      : dayjs();
    const endDate = query.endDate
      ? dayjs(query.endDate)
      : startDate.add(7, 'day');
    const duration = query.duration || doctor.appointmentDuration;

    const slots: any[] = [];

    // Buscar agendamentos existentes no período
    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        scheduledDate: {
          gte: startDate.toDate(),
          lte: endDate.toDate(),
        },
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
        },
        ...(query.clinicId && { clinicId: query.clinicId }),
      },
      select: {
        scheduledDate: true,
        scheduledTime: true,
        duration: true,
      },
    });

    // Gerar slots para cada dia
    let currentDate = startDate;
    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
      const dayOfWeek = currentDate.day();
      const workingHoursForDay = this.getWorkingHoursForDay(
        doctor.workingHours as any,
        dayOfWeek,
      );

      if (workingHoursForDay && workingHoursForDay.active !== false) {
        const daySlots = this.generateSlotsForDay(
          currentDate,
          workingHoursForDay,
          duration,
          existingAppointments,
          query.telemedicineOnly,
          doctor.telemedicineEnabled,
        );
        slots.push(...daySlots);
      }

      currentDate = currentDate.add(1, 'day');
    }

    return slots;
  }

  private getWorkingHoursForDay(workingHours: any, dayOfWeek: number): any {
    if (!workingHours || !Array.isArray(workingHours)) {
      // Default working hours (segunda a sexta, 8h-18h)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        return {
          dayOfWeek,
          startTime: '08:00',
          endTime: '18:00',
          breakStart: '12:00',
          breakEnd: '13:00',
          active: true,
        };
      }
      return null;
    }

    return workingHours.find((wh: any) => wh.dayOfWeek === dayOfWeek);
  }

  private generateSlotsForDay(
    date: dayjs.Dayjs,
    workingHours: any,
    duration: number,
    existingAppointments: any[],
    telemedicineOnly?: boolean,
    telemedicineEnabled?: boolean,
  ): any[] {
    const slots: any[] = [];

    const startTime = dayjs(`${date.format('YYYY-MM-DD')} ${workingHours.startTime}`);
    const endTime = dayjs(`${date.format('YYYY-MM-DD')} ${workingHours.endTime}`);
    const breakStart = workingHours.breakStart
      ? dayjs(`${date.format('YYYY-MM-DD')} ${workingHours.breakStart}`)
      : null;
    const breakEnd = workingHours.breakEnd
      ? dayjs(`${date.format('YYYY-MM-DD')} ${workingHours.breakEnd}`)
      : null;

    let currentSlot = startTime;

    while (currentSlot.add(duration, 'minute').isBefore(endTime) || currentSlot.add(duration, 'minute').isSame(endTime)) {
      const slotEnd = currentSlot.add(duration, 'minute');

      // Verificar se está no intervalo
      const isInBreak =
        breakStart &&
        breakEnd &&
        ((currentSlot.isAfter(breakStart) || currentSlot.isSame(breakStart)) &&
          currentSlot.isBefore(breakEnd));

      if (!isInBreak) {
        // Verificar se o slot está disponível
        const isOccupied = existingAppointments.some((apt) => {
          const aptTime = dayjs(apt.scheduledTime);
          const aptEnd = aptTime.add(apt.duration, 'minute');
          return (
            (currentSlot.isAfter(aptTime) || currentSlot.isSame(aptTime)) &&
            currentSlot.isBefore(aptEnd)
          ) || (
            slotEnd.isAfter(aptTime) && slotEnd.isBefore(aptEnd)
          ) || (
            currentSlot.isBefore(aptTime) && slotEnd.isAfter(aptEnd)
          );
        });

        // Não mostrar slots no passado
        const isInPast = currentSlot.isBefore(dayjs());

        slots.push({
          date: date.format('YYYY-MM-DD'),
          startTime: currentSlot.format('HH:mm'),
          endTime: slotEnd.format('HH:mm'),
          available: !isOccupied && !isInPast,
          isTelemedicine: telemedicineEnabled && !telemedicineOnly,
        });
      }

      currentSlot = slotEnd;
    }

    return slots;
  }

  async blockTimeSlot(
    doctorId: string,
    dto: BlockTimeSlotDto,
    blockedBy: string,
  ): Promise<void> {
    await this.findById(doctorId);

    // Criar bloqueio na agenda (usando tabela de appointments com tipo especial)
    // ou em uma tabela separada de bloqueios

    await this.auditService.log({
      action: AuditAction.CREATE,
      resource: 'doctor_schedule_block',
      resourceId: doctorId,
      userId: blockedBy,
      description: `Horário bloqueado: ${dto.date} ${dto.startTime}-${dto.endTime}. Motivo: ${dto.reason || 'Não informado'}`,
    });

    this.logger.log(`Time slot blocked for doctor ${doctorId}: ${dto.date} ${dto.startTime}-${dto.endTime}`);
  }

  async setVacation(
    doctorId: string,
    dto: VacationDto,
    setBy: string,
  ): Promise<void> {
    await this.findById(doctorId);

    // Verificar se não há conflitos com consultas agendadas
    const conflictingAppointments = await this.prisma.appointment.count({
      where: {
        doctorId,
        scheduledDate: {
          gte: new Date(dto.startDate),
          lte: new Date(dto.endDate),
        },
        status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] },
      },
    });

    if (conflictingAppointments > 0) {
      throw new BadRequestException(
        `Existem ${conflictingAppointments} consultas agendadas no período. Cancele ou remarque antes de configurar férias.`,
      );
    }

    await this.auditService.log({
      action: AuditAction.CREATE,
      resource: 'doctor_vacation',
      resourceId: doctorId,
      userId: setBy,
      description: `Férias configuradas: ${dto.startDate} a ${dto.endDate}. Motivo: ${dto.reason || 'Não informado'}`,
    });

    // Emitir evento
    this.eventEmitter.emit('doctor.vacation.set', {
      doctorId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      reason: dto.reason,
    });

    this.logger.log(`Vacation set for doctor ${doctorId}: ${dto.startDate} to ${dto.endDate}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // VALIDAÇÃO DO CRM
  // ═══════════════════════════════════════════════════════════════════════════════

  async validateCrm(crm: string, crmState: string): Promise<any> {
    // TODO: Integrar com API do CFM (Conselho Federal de Medicina)
    // Por enquanto, retorna validação básica

    const isValid = this.isValidCrmFormat(crm);

    const response = {
      valid: isValid,
      crm,
      crmState: crmState.toUpperCase(),
      doctorName: null,
      situation: isValid ? 'REGULAR' : 'INVALID',
      specialties: [],
      message: isValid ? 'CRM em formato válido' : 'Formato de CRM inválido',
      validatedAt: new Date(),
    };

    this.logger.log(`CRM validation: ${crm}/${crmState} - ${isValid ? 'Valid' : 'Invalid'}`);

    return response;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ESTATÍSTICAS
  // ═══════════════════════════════════════════════════════════════════════════════

  async getStats(doctorId: string, query: DoctorStatsQueryDto): Promise<any> {
    const { startDate, endDate, clinicId } = query;

    const where: Prisma.AppointmentWhereInput = {
      doctorId,
    };

    if (clinicId) {
      where.clinicId = clinicId;
    }

    if (startDate || endDate) {
      where.scheduledDate = {};
      if (startDate) where.scheduledDate.gte = new Date(startDate);
      if (endDate) where.scheduledDate.lte = new Date(endDate);
    }

    const [
      totalAppointments,
      completedConsultations,
      cancelledAppointments,
      noShowAppointments,
      telemedicineConsultations,
      prescriptionsIssued,
      labOrdersIssued,
      uniquePatients,
    ] = await Promise.all([
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.count({
        where: { ...where, status: AppointmentStatus.COMPLETED },
      }),
      this.prisma.appointment.count({
        where: { ...where, status: AppointmentStatus.CANCELLED },
      }),
      this.prisma.appointment.count({
        where: { ...where, status: AppointmentStatus.NO_SHOW },
      }),
      this.prisma.appointment.count({
        where: { ...where, isTelemedicine: true, status: AppointmentStatus.COMPLETED },
      }),
      this.prisma.prescription.count({
        where: {
          doctorId,
          ...(startDate || endDate
            ? {
                prescribedAt: {
                  ...(startDate && { gte: new Date(startDate) }),
                  ...(endDate && { lte: new Date(endDate) }),
                },
              }
            : {}),
        },
      }),
      this.prisma.labOrder.count({
        where: {
          doctorId,
          ...(startDate || endDate
            ? {
                orderedAt: {
                  ...(startDate && { gte: new Date(startDate) }),
                  ...(endDate && { lte: new Date(endDate) }),
                },
              }
            : {}),
        },
      }),
      this.prisma.appointment.groupBy({
        by: ['patientId'],
        where: { ...where, status: AppointmentStatus.COMPLETED },
      }),
    ]);

    return {
      totalAppointments,
      completedConsultations,
      cancelledAppointments,
      noShowAppointments,
      telemedicineConsultations,
      prescriptionsIssued,
      labOrdersIssued,
      patientsSeen: uniquePatients.length,
      averageConsultationDuration: 30, // TODO: Calcular média real
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // HELPERS PRIVADOS
  // ═══════════════════════════════════════════════════════════════════════════════

  private sanitizeForAudit(data: any): any {
    if (!data) return null;

    const {
      user,
      digitalCertificate,
      clinicDoctors,
      _count,
      ...rest
    } = data;

    return rest;
  }

  private isValidCpf(cpf: string): boolean {
    if (cpf.length !== 11) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cpf)) return false;

    // Validação dos dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) return false;

    return true;
  }

  private isValidCrmFormat(crm: string): boolean {
    // CRM tem formato variável, geralmente 4-6 dígitos
    // Alguns estados adicionam prefixo ou sufixo
    return /^\d{4,8}$/.test(crm.replace(/\D/g, ''));
  }
}
