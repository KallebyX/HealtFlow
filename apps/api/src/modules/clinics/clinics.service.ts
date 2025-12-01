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
  CreateClinicDto,
  UpdateClinicDto,
  AddDoctorToClinicDto,
  AddPatientToClinicDto,
  AddEmployeeToClinicDto,
  RoomDto,
} from './dto/create-clinic.dto';
import { ClinicQueryDto, ClinicStatsQueryDto, ClinicDoctorsQueryDto, ClinicPatientsQueryDto } from './dto/clinic-query.dto';
import {
  Clinic,
  AuditAction,
  Prisma,
  AppointmentStatus,
} from '@prisma/client';

@Injectable()
export class ClinicsService {
  private readonly logger = new Logger(ClinicsService.name);
  private readonly CACHE_PREFIX = 'clinic:';
  private readonly CACHE_TTL = 3600;

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
    query: ClinicQueryDto,
  ): Promise<{ data: Clinic[]; total: number; page: number; limit: number; totalPages: number }> {
    const {
      page = 1,
      limit = 20,
      search,
      city,
      state,
      active,
      hasTelemedicine,
      hasOnlineBooking,
      sortBy = 'tradeName',
      sortOrder = 'asc',
      includeDeleted = false,
      lat,
      lng,
      radius,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.ClinicWhereInput = {};

    if (!includeDeleted) {
      where.deletedAt = null;
    }

    if (search) {
      const searchNormalized = search.replace(/\D/g, '');
      where.OR = [
        { tradeName: { contains: search, mode: 'insensitive' } },
        { legalName: { contains: search, mode: 'insensitive' } },
        { cnpj: { contains: searchNormalized } },
        { cnes: { contains: search } },
      ];
    }

    if (active !== undefined) {
      where.active = active;
    }

    // Filtro por cidade/estado no JSON de endereço
    if (city || state) {
      where.AND = where.AND || [];
      if (city) {
        (where.AND as any[]).push({
          address: {
            path: ['city'],
            string_contains: city,
          },
        });
      }
      if (state) {
        (where.AND as any[]).push({
          address: {
            path: ['state'],
            equals: state.toUpperCase(),
          },
        });
      }
    }

    // Filtro por telemedicina/agendamento online no JSON de settings
    if (hasTelemedicine !== undefined) {
      where.settings = {
        path: ['allowTelemedicine'],
        equals: hasTelemedicine,
      };
    }

    if (hasOnlineBooking !== undefined) {
      where.settings = {
        path: ['allowOnlineBooking'],
        equals: hasOnlineBooking,
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.clinic.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          rooms: {
            where: { active: true },
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          _count: {
            select: {
              clinicDoctors: true,
              clinicPatients: true,
              clinicEmployees: true,
              appointments: true,
              rooms: true,
            },
          },
        },
      }),
      this.prisma.clinic.count({ where }),
    ]);

    // Transformar _count para formato mais amigável
    const transformedData = data.map((clinic) => ({
      ...clinic,
      _count: {
        doctors: clinic._count.clinicDoctors,
        patients: clinic._count.clinicPatients,
        employees: clinic._count.clinicEmployees,
        appointments: clinic._count.appointments,
        rooms: clinic._count.rooms,
      },
    }));

    // TODO: Implementar busca por proximidade geográfica se lat/lng/radius fornecidos

    return {
      data: transformedData as any,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<Clinic> {
    const cacheKey = `${this.CACHE_PREFIX}${id}`;
    const cached = await this.cacheService.get<Clinic>(cacheKey);

    if (cached) {
      return cached;
    }

    const clinic = await this.prisma.clinic.findUnique({
      where: { id },
      include: {
        clinicDoctors: {
          include: {
            doctor: {
              select: {
                id: true,
                fullName: true,
                crm: true,
                crmState: true,
                specialties: true,
                profilePhotoUrl: true,
                telemedicineEnabled: true,
              },
            },
          },
        },
        rooms: true,
        _count: {
          select: {
            clinicDoctors: true,
            clinicPatients: true,
            clinicEmployees: true,
            appointments: true,
          },
        },
      },
    });

    if (!clinic) {
      throw new NotFoundException('Clínica não encontrada');
    }

    await this.cacheService.set(cacheKey, clinic, this.CACHE_TTL);

    return clinic;
  }

  async findByCnpj(cnpj: string): Promise<Clinic | null> {
    const normalizedCnpj = cnpj.replace(/\D/g, '');

    return this.prisma.clinic.findUnique({
      where: { cnpj: normalizedCnpj },
    });
  }

  async findByCnes(cnes: string): Promise<Clinic | null> {
    return this.prisma.clinic.findFirst({
      where: { cnes },
    });
  }

  async create(dto: CreateClinicDto, createdBy: string): Promise<Clinic> {
    const normalizedCnpj = dto.cnpj.replace(/\D/g, '');

    // Verificar CNPJ único
    const existingByCnpj = await this.findByCnpj(normalizedCnpj);
    if (existingByCnpj) {
      throw new ConflictException('CNPJ já cadastrado');
    }

    // Verificar CNES único se fornecido
    if (dto.cnes) {
      const existingByCnes = await this.findByCnes(dto.cnes);
      if (existingByCnes) {
        throw new ConflictException('CNES já cadastrado');
      }
    }

    // Validar CNPJ
    if (!this.isValidCnpj(normalizedCnpj)) {
      throw new BadRequestException('CNPJ inválido');
    }

    const clinic = await this.prisma.clinic.create({
      data: {
        legalName: dto.legalName,
        tradeName: dto.tradeName,
        cnpj: normalizedCnpj,
        cnes: dto.cnes,
        phone: dto.phone,
        email: dto.email,
        website: dto.website,
        address: dto.address as any,
        settings: (dto.settings as any) || {},
        workingHours: (dto.workingHours as any) || null,
        timezone: dto.timezone || 'America/Sao_Paulo',
        logoUrl: dto.logoUrl,
        primaryColor: dto.primaryColor,
        active: true,
      },
    });

    // Criar salas se fornecidas
    if (dto.rooms && dto.rooms.length > 0) {
      await this.prisma.room.createMany({
        data: dto.rooms.map((room) => ({
          clinicId: clinic.id,
          name: room.name,
          code: room.code,
          floor: room.floor,
          description: room.description,
          equipment: room.equipment || [],
          active: room.active ?? true,
        })),
      });
    }

    await this.auditService.log({
      action: AuditAction.CREATE,
      resource: 'clinic',
      resourceId: clinic.id,
      userId: createdBy,
      description: 'Clínica cadastrada',
    });

    this.eventEmitter.emit('clinic.created', {
      clinicId: clinic.id,
      tradeName: clinic.tradeName,
    });

    this.logger.log(`Clinic created: ${clinic.id}`);

    return clinic;
  }

  async update(id: string, dto: UpdateClinicDto, updatedBy: string): Promise<Clinic> {
    const clinic = await this.findById(id);

    const updateData: Prisma.ClinicUpdateInput = {};

    if (dto.legalName !== undefined) updateData.legalName = dto.legalName;
    if (dto.tradeName !== undefined) updateData.tradeName = dto.tradeName;
    if (dto.cnes !== undefined) updateData.cnes = dto.cnes;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.website !== undefined) updateData.website = dto.website;
    if (dto.address !== undefined) updateData.address = dto.address as any;
    if (dto.settings !== undefined) updateData.settings = dto.settings as any;
    if (dto.workingHours !== undefined) updateData.workingHours = dto.workingHours as any;
    if (dto.timezone !== undefined) updateData.timezone = dto.timezone;
    if (dto.logoUrl !== undefined) updateData.logoUrl = dto.logoUrl;
    if (dto.primaryColor !== undefined) updateData.primaryColor = dto.primaryColor;
    if (dto.active !== undefined) updateData.active = dto.active;

    const updatedClinic = await this.prisma.clinic.update({
      where: { id },
      data: updateData,
    });

    await this.cacheService.del(`${this.CACHE_PREFIX}${id}`);

    await this.auditService.log({
      action: AuditAction.UPDATE,
      resource: 'clinic',
      resourceId: id,
      userId: updatedBy,
      description: 'Clínica atualizada',
      oldValues: this.sanitizeForAudit(clinic),
      newValues: this.sanitizeForAudit(updatedClinic),
    });

    return updatedClinic;
  }

  async delete(id: string, deletedBy: string): Promise<void> {
    await this.findById(id);

    // Verificar se não há consultas futuras
    const futureAppointments = await this.prisma.appointment.count({
      where: {
        clinicId: id,
        scheduledDate: { gte: new Date() },
        status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] },
      },
    });

    if (futureAppointments > 0) {
      throw new BadRequestException(
        `Não é possível remover a clínica. Existem ${futureAppointments} consultas agendadas.`,
      );
    }

    await this.prisma.clinic.update({
      where: { id },
      data: { deletedAt: new Date(), active: false },
    });

    await this.cacheService.del(`${this.CACHE_PREFIX}${id}`);

    await this.auditService.log({
      action: AuditAction.DELETE,
      resource: 'clinic',
      resourceId: id,
      userId: deletedBy,
      description: 'Clínica removida (soft delete)',
    });

    this.logger.log(`Clinic soft deleted: ${id} by ${deletedBy}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // GERENCIAMENTO DE MÉDICOS
  // ═══════════════════════════════════════════════════════════════════════════════

  async addDoctor(clinicId: string, dto: AddDoctorToClinicDto, addedBy: string): Promise<any> {
    await this.findById(clinicId);

    // Verificar se médico existe
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: dto.doctorId },
    });

    if (!doctor) {
      throw new NotFoundException('Médico não encontrado');
    }

    // Verificar se já está vinculado
    const existing = await this.prisma.clinicDoctor.findUnique({
      where: {
        clinicId_doctorId: {
          clinicId,
          doctorId: dto.doctorId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Médico já vinculado a esta clínica');
    }

    const clinicDoctor = await this.prisma.clinicDoctor.create({
      data: {
        clinicId,
        doctorId: dto.doctorId,
        isPrimary: dto.isPrimary || false,
        specialtiesAtClinic: dto.specialtiesAtClinic || doctor.specialties,
        workingHours: (dto.workingHoursAtClinic as any) || null,
      },
      include: {
        doctor: {
          select: {
            id: true,
            fullName: true,
            crm: true,
            crmState: true,
            specialties: true,
          },
        },
      },
    });

    await this.cacheService.del(`${this.CACHE_PREFIX}${clinicId}`);

    await this.auditService.log({
      action: AuditAction.CREATE,
      resource: 'clinic_doctor',
      resourceId: clinicDoctor.id,
      userId: addedBy,
      description: `Médico ${doctor.fullName} vinculado à clínica`,
    });

    return clinicDoctor;
  }

  async removeDoctor(clinicId: string, doctorId: string, removedBy: string): Promise<void> {
    const clinicDoctor = await this.prisma.clinicDoctor.findUnique({
      where: {
        clinicId_doctorId: {
          clinicId,
          doctorId,
        },
      },
      include: {
        doctor: { select: { fullName: true } },
      },
    });

    if (!clinicDoctor) {
      throw new NotFoundException('Vínculo não encontrado');
    }

    // Verificar consultas futuras
    const futureAppointments = await this.prisma.appointment.count({
      where: {
        clinicId,
        doctorId,
        scheduledDate: { gte: new Date() },
        status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] },
      },
    });

    if (futureAppointments > 0) {
      throw new BadRequestException(
        `Não é possível desvincular o médico. Existem ${futureAppointments} consultas agendadas.`,
      );
    }

    await this.prisma.clinicDoctor.delete({
      where: {
        clinicId_doctorId: {
          clinicId,
          doctorId,
        },
      },
    });

    await this.cacheService.del(`${this.CACHE_PREFIX}${clinicId}`);

    await this.auditService.log({
      action: AuditAction.DELETE,
      resource: 'clinic_doctor',
      resourceId: clinicDoctor.id,
      userId: removedBy,
      description: `Médico ${clinicDoctor.doctor.fullName} desvinculado da clínica`,
    });
  }

  async getDoctors(clinicId: string, query: ClinicDoctorsQueryDto): Promise<any> {
    const { page = 1, limit = 20, specialty, telemedicineEnabled, availableToday } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ClinicDoctorWhereInput = { clinicId };

    if (specialty) {
      where.specialtiesAtClinic = { has: specialty };
    }

    if (telemedicineEnabled !== undefined) {
      where.doctor = { telemedicineEnabled };
    }

    const [data, total] = await Promise.all([
      this.prisma.clinicDoctor.findMany({
        where,
        skip,
        take: limit,
        include: {
          doctor: {
            select: {
              id: true,
              fullName: true,
              crm: true,
              crmState: true,
              specialties: true,
              profilePhotoUrl: true,
              telemedicineEnabled: true,
              appointmentDuration: true,
            },
          },
        },
      }),
      this.prisma.clinicDoctor.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // GERENCIAMENTO DE PACIENTES
  // ═══════════════════════════════════════════════════════════════════════════════

  async addPatient(clinicId: string, dto: AddPatientToClinicDto, addedBy: string): Promise<any> {
    await this.findById(clinicId);

    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado');
    }

    const existing = await this.prisma.clinicPatient.findUnique({
      where: {
        clinicId_patientId: {
          clinicId,
          patientId: dto.patientId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Paciente já vinculado a esta clínica');
    }

    const clinicPatient = await this.prisma.clinicPatient.create({
      data: {
        clinicId,
        patientId: dto.patientId,
        medicalRecordNumber: dto.medicalRecordNumber,
      },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            cpf: true,
            phone: true,
          },
        },
      },
    });

    await this.auditService.log({
      action: AuditAction.CREATE,
      resource: 'clinic_patient',
      resourceId: clinicPatient.id,
      userId: addedBy,
      description: `Paciente ${patient.fullName} vinculado à clínica`,
    });

    return clinicPatient;
  }

  async getPatients(clinicId: string, query: ClinicPatientsQueryDto): Promise<any> {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ClinicPatientWhereInput = { clinicId };

    if (search) {
      where.patient = {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { cpf: { contains: search.replace(/\D/g, '') } },
        ],
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.clinicPatient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          patient: {
            select: {
              id: true,
              fullName: true,
              socialName: true,
              cpf: true,
              phone: true,
            },
          },
        },
      }),
      this.prisma.clinicPatient.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // GERENCIAMENTO DE SALAS
  // ═══════════════════════════════════════════════════════════════════════════════

  async addRoom(clinicId: string, dto: RoomDto, addedBy: string): Promise<any> {
    await this.findById(clinicId);

    const room = await this.prisma.room.create({
      data: {
        clinicId,
        name: dto.name,
        code: dto.code,
        floor: dto.floor,
        description: dto.description,
        equipment: dto.equipment || [],
        active: dto.active ?? true,
      },
    });

    await this.cacheService.del(`${this.CACHE_PREFIX}${clinicId}`);

    await this.auditService.log({
      action: AuditAction.CREATE,
      resource: 'room',
      resourceId: room.id,
      userId: addedBy,
      description: `Sala ${room.name} criada`,
    });

    return room;
  }

  async updateRoom(clinicId: string, roomId: string, dto: Partial<RoomDto>, updatedBy: string): Promise<any> {
    const room = await this.prisma.room.findFirst({
      where: { id: roomId, clinicId },
    });

    if (!room) {
      throw new NotFoundException('Sala não encontrada');
    }

    const updatedRoom = await this.prisma.room.update({
      where: { id: roomId },
      data: dto,
    });

    await this.cacheService.del(`${this.CACHE_PREFIX}${clinicId}`);

    await this.auditService.log({
      action: AuditAction.UPDATE,
      resource: 'room',
      resourceId: roomId,
      userId: updatedBy,
      description: `Sala ${room.name} atualizada`,
    });

    return updatedRoom;
  }

  async deleteRoom(clinicId: string, roomId: string, deletedBy: string): Promise<void> {
    const room = await this.prisma.room.findFirst({
      where: { id: roomId, clinicId },
    });

    if (!room) {
      throw new NotFoundException('Sala não encontrada');
    }

    // Verificar consultas futuras na sala
    const futureAppointments = await this.prisma.appointment.count({
      where: {
        roomId,
        scheduledDate: { gte: new Date() },
        status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] },
      },
    });

    if (futureAppointments > 0) {
      throw new BadRequestException(
        `Não é possível remover a sala. Existem ${futureAppointments} consultas agendadas.`,
      );
    }

    await this.prisma.room.update({
      where: { id: roomId },
      data: { active: false },
    });

    await this.cacheService.del(`${this.CACHE_PREFIX}${clinicId}`);

    await this.auditService.log({
      action: AuditAction.DELETE,
      resource: 'room',
      resourceId: roomId,
      userId: deletedBy,
      description: `Sala ${room.name} desativada`,
    });
  }

  async getRooms(clinicId: string): Promise<any[]> {
    return this.prisma.room.findMany({
      where: { clinicId },
      orderBy: { name: 'asc' },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ESTATÍSTICAS
  // ═══════════════════════════════════════════════════════════════════════════════

  async getStats(clinicId: string, query: ClinicStatsQueryDto): Promise<any> {
    const { startDate, endDate } = query;

    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.scheduledDate = {};
      if (startDate) dateFilter.scheduledDate.gte = new Date(startDate);
      if (endDate) dateFilter.scheduledDate.lte = new Date(endDate);
    }

    const [
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      noShowAppointments,
      telemedicineAppointments,
      totalPatients,
      activeDoctors,
    ] = await Promise.all([
      this.prisma.appointment.count({
        where: { clinicId, ...dateFilter },
      }),
      this.prisma.appointment.count({
        where: { clinicId, ...dateFilter, status: AppointmentStatus.COMPLETED },
      }),
      this.prisma.appointment.count({
        where: { clinicId, ...dateFilter, status: AppointmentStatus.CANCELLED },
      }),
      this.prisma.appointment.count({
        where: { clinicId, ...dateFilter, status: AppointmentStatus.NO_SHOW },
      }),
      this.prisma.appointment.count({
        where: { clinicId, ...dateFilter, isTelemedicine: true },
      }),
      this.prisma.clinicPatient.count({ where: { clinicId } }),
      this.prisma.clinicDoctor.count({ where: { clinicId } }),
    ]);

    const newPatientsCount = await this.prisma.clinicPatient.count({
      where: {
        clinicId,
        createdAt: dateFilter.scheduledDate,
      },
    });

    return {
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      noShowAppointments,
      telemedicineAppointments,
      totalPatients,
      newPatients: newPatientsCount,
      activeDoctors,
      averageWaitTime: 15, // TODO: Calcular real
      averageConsultationDuration: 30, // TODO: Calcular real
      occupancyRate: totalAppointments > 0
        ? Math.round((completedAppointments / totalAppointments) * 100)
        : 0,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════════

  private sanitizeForAudit(data: any): any {
    if (!data) return null;

    const {
      clinicDoctors,
      clinicPatients,
      clinicEmployees,
      rooms,
      _count,
      ...rest
    } = data;

    return rest;
  }

  private isValidCnpj(cnpj: string): boolean {
    if (cnpj.length !== 14) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cnpj)) return false;

    // Validação dos dígitos verificadores
    let size = cnpj.length - 2;
    let numbers = cnpj.substring(0, size);
    const digits = cnpj.substring(size);
    let sum = 0;
    let pos = size - 7;

    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    size = size + 1;
    numbers = cnpj.substring(0, size);
    sum = 0;
    pos = size - 7;

    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
  }
}
