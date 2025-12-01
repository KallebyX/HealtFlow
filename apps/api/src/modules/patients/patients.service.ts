import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/database/prisma.service';
import { CacheService } from '@/common/services/cache.service';
import { AuditService } from '@/common/services/audit.service';
import {
  CreatePatientDto,
  UpdatePatientDto,
} from './dto/create-patient.dto';
import { PatientQueryDto, PatientStatsQueryDto } from './dto/patient-query.dto';
import { CreateVitalSignDto, VitalSignQueryDto } from './dto/vital-sign.dto';
import {
  Patient,
  VitalSign,
  AuditAction,
  TriageLevel,
  PatientDocument,
  UserStatus,
  Prisma,
} from '@prisma/client';

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);
  private readonly CACHE_PREFIX = 'patient:';
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
    query: PatientQueryDto,
    clinicId?: string,
  ): Promise<{ data: Patient[]; total: number; page: number; limit: number; totalPages: number }> {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      gender,
      bloodType,
      healthInsuranceId,
      hasAllergies,
      hasChronicConditions,
      birthDateFrom,
      birthDateTo,
      ageMin,
      ageMax,
      createdFrom,
      createdTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeDeleted = false,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.PatientWhereInput = {};

    // Soft delete filter
    if (!includeDeleted) {
      where.deletedAt = null;
    }

    // Filtro por clínica (multi-tenant)
    if (clinicId || query.clinicId) {
      where.clinicPatients = {
        some: { clinicId: clinicId || query.clinicId },
      };
    }

    // Busca por nome, CPF, telefone ou email
    if (search) {
      const searchNormalized = search.replace(/\D/g, '');
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { socialName: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: searchNormalized } },
        { phone: { contains: searchNormalized } },
        { email: { contains: search, mode: 'insensitive' } },
        { cns: { contains: searchNormalized } },
      ];
    }

    // Filtro por status do usuário
    if (status) {
      where.user = { status };
    }

    // Filtro por gênero
    if (gender) {
      where.gender = gender;
    }

    // Filtro por tipo sanguíneo
    if (bloodType) {
      where.bloodType = bloodType;
    }

    // Filtro por convênio
    if (healthInsuranceId) {
      where.healthInsuranceId = healthInsuranceId;
    }

    // Filtro por alergias
    if (hasAllergies === true) {
      where.allergies = { isEmpty: false };
    } else if (hasAllergies === false) {
      where.allergies = { isEmpty: true };
    }

    // Filtro por condições crônicas
    if (hasChronicConditions === true) {
      where.chronicConditions = { isEmpty: false };
    } else if (hasChronicConditions === false) {
      where.chronicConditions = { isEmpty: true };
    }

    // Filtro por data de nascimento
    if (birthDateFrom || birthDateTo) {
      where.birthDate = {};
      if (birthDateFrom) where.birthDate.gte = new Date(birthDateFrom);
      if (birthDateTo) where.birthDate.lte = new Date(birthDateTo);
    }

    // Filtro por idade
    if (ageMin !== undefined || ageMax !== undefined) {
      const today = new Date();
      where.birthDate = where.birthDate || {};

      if (ageMax !== undefined) {
        const maxBirthDate = new Date(today.getFullYear() - ageMax, today.getMonth(), today.getDate());
        where.birthDate.gte = maxBirthDate;
      }
      if (ageMin !== undefined) {
        const minBirthDate = new Date(today.getFullYear() - ageMin, today.getMonth(), today.getDate());
        where.birthDate.lte = minBirthDate;
      }
    }

    // Filtro por data de cadastro
    if (createdFrom || createdTo) {
      where.createdAt = {};
      if (createdFrom) where.createdAt.gte = new Date(createdFrom);
      if (createdTo) where.createdAt.lte = new Date(createdTo);
    }

    const [data, total] = await Promise.all([
      this.prisma.patient.findMany({
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
          healthInsurance: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
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
      }),
      this.prisma.patient.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, userId?: string): Promise<Patient> {
    // Tentar buscar do cache primeiro
    const cacheKey = `${this.CACHE_PREFIX}${id}`;
    const cached = await this.cacheService.get<Patient>(cacheKey);

    if (cached) {
      this.logger.debug(`Cache hit for patient: ${id}`);
      return cached;
    }

    const patient = await this.prisma.patient.findUnique({
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
        healthInsurance: true,
        vitalSigns: {
          orderBy: { measuredAt: 'desc' },
          take: 10,
        },
        badges: {
          include: {
            badge: true,
          },
          orderBy: { earnedAt: 'desc' },
        },
        clinicPatients: {
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
            tasks: true,
            documents: true,
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado');
    }

    // Cachear resultado
    await this.cacheService.set(cacheKey, patient, this.CACHE_TTL);

    return patient;
  }

  async findByUserId(userId: string): Promise<Patient> {
    const patient = await this.prisma.patient.findUnique({
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
        healthInsurance: true,
        vitalSigns: {
          orderBy: { measuredAt: 'desc' },
          take: 5,
        },
        badges: {
          include: { badge: true },
          orderBy: { earnedAt: 'desc' },
          take: 10,
        },
        wearableConnections: {
          where: { active: true },
        },
        _count: {
          select: {
            appointments: true,
            consultations: true,
            prescriptions: true,
            tasks: true,
            documents: true,
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado');
    }

    return patient;
  }

  async findByCpf(cpf: string): Promise<Patient | null> {
    const normalizedCpf = cpf.replace(/\D/g, '');

    return this.prisma.patient.findUnique({
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

  async findByCns(cns: string): Promise<Patient | null> {
    return this.prisma.patient.findUnique({
      where: { cns },
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

  async create(dto: CreatePatientDto, userId: string): Promise<Patient> {
    // Normalizar CPF
    const normalizedCpf = dto.cpf.replace(/\D/g, '');

    // Verificar se CPF já existe
    const existingByCpf = await this.prisma.patient.findUnique({
      where: { cpf: normalizedCpf },
    });

    if (existingByCpf) {
      throw new ConflictException('CPF já cadastrado');
    }

    // Verificar se CNS já existe (se fornecido)
    if (dto.cns) {
      const existingByCns = await this.prisma.patient.findUnique({
        where: { cns: dto.cns },
      });

      if (existingByCns) {
        throw new ConflictException('CNS já cadastrado');
      }
    }

    // Validar CPF
    if (!this.isValidCpf(normalizedCpf)) {
      throw new BadRequestException('CPF inválido');
    }

    // Validar CNS se fornecido
    if (dto.cns && !this.isValidCns(dto.cns)) {
      throw new BadRequestException('CNS inválido');
    }

    const patient = await this.prisma.patient.create({
      data: {
        userId,
        fullName: dto.fullName,
        socialName: dto.socialName,
        cpf: normalizedCpf,
        rg: dto.rg,
        rgIssuer: dto.rgIssuer,
        birthDate: new Date(dto.birthDate),
        gender: dto.gender,
        maritalStatus: dto.maritalStatus,
        nationality: dto.nationality || 'Brasileiro',
        birthPlace: dto.birthPlace,
        motherName: dto.motherName,
        fatherName: dto.fatherName,
        occupation: dto.occupation,
        phone: dto.phone,
        secondaryPhone: dto.secondaryPhone,
        email: dto.email,
        cns: dto.cns,
        bloodType: dto.bloodType,
        height: dto.height,
        weight: dto.weight,
        address: dto.address as any,
        emergencyContact: dto.emergencyContact as any,
        allergies: dto.allergies || [],
        chronicConditions: dto.chronicConditions || [],
        currentMedications: (dto.currentMedications as any) || [],
        familyHistory: (dto.familyHistory as any) || [],
        surgicalHistory: (dto.surgicalHistory as any) || [],
        smokingStatus: dto.smokingStatus,
        alcoholConsumption: dto.alcoholConsumption,
        physicalActivity: dto.physicalActivity,
        healthInsuranceId: dto.healthInsuranceId,
        insuranceNumber: dto.insuranceNumber,
        insuranceValidUntil: dto.insuranceValidUntil
          ? new Date(dto.insuranceValidUntil)
          : undefined,
        preferredLanguage: dto.preferredLanguage || 'pt-BR',
        preferredTimezone: dto.preferredTimezone || 'America/Sao_Paulo',
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
      resource: 'patient',
      resourceId: patient.id,
      userId,
      description: 'Paciente cadastrado',
    });

    // Emitir evento
    this.eventEmitter.emit('patient.created', {
      patientId: patient.id,
      userId,
    });

    this.logger.log(`Patient created: ${patient.id}`);

    return patient;
  }

  async update(
    id: string,
    dto: UpdatePatientDto,
    updatedBy: string,
  ): Promise<Patient> {
    const patient = await this.findById(id);

    // Preparar dados para atualização
    const updateData: Prisma.PatientUpdateInput = {};

    // Campos de texto simples
    if (dto.fullName !== undefined) updateData.fullName = dto.fullName;
    if (dto.socialName !== undefined) updateData.socialName = dto.socialName;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.secondaryPhone !== undefined) updateData.secondaryPhone = dto.secondaryPhone;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.rg !== undefined) updateData.rg = dto.rg;
    if (dto.rgIssuer !== undefined) updateData.rgIssuer = dto.rgIssuer;
    if (dto.cns !== undefined) updateData.cns = dto.cns;
    if (dto.maritalStatus !== undefined) updateData.maritalStatus = dto.maritalStatus;
    if (dto.occupation !== undefined) updateData.occupation = dto.occupation;
    if (dto.bloodType !== undefined) updateData.bloodType = dto.bloodType;
    if (dto.height !== undefined) updateData.height = dto.height;
    if (dto.weight !== undefined) updateData.weight = dto.weight;
    if (dto.smokingStatus !== undefined) updateData.smokingStatus = dto.smokingStatus;
    if (dto.alcoholConsumption !== undefined) updateData.alcoholConsumption = dto.alcoholConsumption;
    if (dto.physicalActivity !== undefined) updateData.physicalActivity = dto.physicalActivity;
    if (dto.preferredLanguage !== undefined) updateData.preferredLanguage = dto.preferredLanguage;
    if (dto.preferredTimezone !== undefined) updateData.preferredTimezone = dto.preferredTimezone;

    // Arrays
    if (dto.allergies !== undefined) updateData.allergies = dto.allergies;
    if (dto.chronicConditions !== undefined) updateData.chronicConditions = dto.chronicConditions;
    if (dto.currentMedications !== undefined) updateData.currentMedications = dto.currentMedications as any;
    if (dto.familyHistory !== undefined) updateData.familyHistory = dto.familyHistory as any;
    if (dto.surgicalHistory !== undefined) updateData.surgicalHistory = dto.surgicalHistory as any;

    // JSON
    if (dto.address !== undefined) updateData.address = dto.address as any;
    if (dto.emergencyContact !== undefined) updateData.emergencyContact = dto.emergencyContact as any;
    if (dto.avatarConfig !== undefined) updateData.avatarConfig = dto.avatarConfig;

    // Convênio
    if (dto.healthInsuranceId !== undefined) {
      updateData.healthInsurance = dto.healthInsuranceId
        ? { connect: { id: dto.healthInsuranceId } }
        : { disconnect: true };
    }
    if (dto.insuranceNumber !== undefined) updateData.insuranceNumber = dto.insuranceNumber;
    if (dto.insuranceValidUntil !== undefined) {
      updateData.insuranceValidUntil = new Date(dto.insuranceValidUntil);
    }

    const updatedPatient = await this.prisma.patient.update({
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
        healthInsurance: true,
      },
    });

    // Invalidar cache
    await this.cacheService.del(`${this.CACHE_PREFIX}${id}`);

    // Auditoria
    await this.auditService.log({
      action: AuditAction.UPDATE,
      resource: 'patient',
      resourceId: id,
      userId: updatedBy,
      description: 'Dados do paciente atualizados',
      oldValues: this.sanitizeForAudit(patient),
      newValues: this.sanitizeForAudit(updatedPatient),
    });

    // Emitir evento
    this.eventEmitter.emit('patient.updated', {
      patientId: id,
      updatedBy,
      changes: Object.keys(dto),
    });

    return updatedPatient;
  }

  async delete(id: string, deletedBy: string): Promise<void> {
    const patient = await this.findById(id);

    // Soft delete
    await this.prisma.$transaction([
      this.prisma.patient.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: patient.userId },
        data: { status: UserStatus.INACTIVE, deletedAt: new Date() },
      }),
    ]);

    // Invalidar cache
    await this.cacheService.del(`${this.CACHE_PREFIX}${id}`);

    // Auditoria
    await this.auditService.log({
      action: AuditAction.DELETE,
      resource: 'patient',
      resourceId: id,
      userId: deletedBy,
      description: 'Paciente removido (soft delete)',
    });

    // Emitir evento
    this.eventEmitter.emit('patient.deleted', {
      patientId: id,
      deletedBy,
    });

    this.logger.log(`Patient soft deleted: ${id} by ${deletedBy}`);
  }

  async restore(id: string, restoredBy: string): Promise<Patient> {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado');
    }

    if (!patient.deletedAt) {
      throw new BadRequestException('Paciente não está deletado');
    }

    const restoredPatient = await this.prisma.$transaction(async (tx) => {
      const restored = await tx.patient.update({
        where: { id },
        data: { deletedAt: null },
      });

      await tx.user.update({
        where: { id: patient.userId },
        data: { status: UserStatus.ACTIVE, deletedAt: null },
      });

      return restored;
    });

    // Auditoria
    await this.auditService.log({
      action: AuditAction.UPDATE,
      resource: 'patient',
      resourceId: id,
      userId: restoredBy,
      description: 'Paciente restaurado',
    });

    return restoredPatient;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // SINAIS VITAIS
  // ═══════════════════════════════════════════════════════════════════════════════

  async addVitalSign(
    patientId: string,
    dto: CreateVitalSignDto,
    recordedBy: string,
  ): Promise<VitalSign> {
    // Verificar se paciente existe
    await this.findById(patientId);

    // Calcular nível de triagem automaticamente se não fornecido
    const triageLevel = dto.triageLevel || this.calculateTriageLevel(dto);

    const vitalSign = await this.prisma.vitalSign.create({
      data: {
        patientId,
        systolicBp: dto.systolicBp,
        diastolicBp: dto.diastolicBp,
        heartRate: dto.heartRate,
        respiratoryRate: dto.respiratoryRate,
        temperature: dto.temperature,
        oxygenSaturation: dto.oxygenSaturation,
        weight: dto.weight,
        height: dto.height,
        bloodGlucose: dto.bloodGlucose,
        painScale: dto.painScale,
        triageLevel,
        triageNotes: dto.triageNotes,
        measuredAt: dto.measuredAt ? new Date(dto.measuredAt) : new Date(),
        measuredBy: recordedBy,
        source: dto.source || 'manual',
        deviceId: dto.deviceId,
        consultationId: dto.consultationId,
        appointmentId: dto.appointmentId,
      },
    });

    // Atualizar peso/altura no perfil do paciente se informados
    if (dto.weight || dto.height) {
      await this.prisma.patient.update({
        where: { id: patientId },
        data: {
          ...(dto.weight && { weight: dto.weight }),
          ...(dto.height && { height: dto.height }),
        },
      });
      // Invalidar cache do paciente
      await this.cacheService.del(`${this.CACHE_PREFIX}${patientId}`);
    }

    // Se valores anormais, emitir alerta
    const isAbnormal = this.checkAbnormalValues(dto);
    if (isAbnormal) {
      this.eventEmitter.emit('patient.vital-sign.abnormal', {
        patientId,
        vitalSignId: vitalSign.id,
        triageLevel,
        values: dto,
      });
    }

    // Gamificação: pontuar por registrar sinais vitais
    this.eventEmitter.emit('gamification.action', {
      patientId,
      action: 'VITAL_SIGN_RECORDED',
      points: 5,
    });

    // Auditoria
    await this.auditService.log({
      action: AuditAction.CREATE,
      resource: 'vital_sign',
      resourceId: vitalSign.id,
      userId: recordedBy,
      description: `Sinais vitais registrados (${dto.source || 'manual'})`,
      metadata: { triageLevel, isAbnormal },
    });

    this.logger.log(`Vital signs recorded for patient ${patientId}: ${vitalSign.id}`);

    return vitalSign;
  }

  async getVitalSignHistory(
    patientId: string,
    query: VitalSignQueryDto = {},
  ): Promise<VitalSign[]> {
    const { startDate, endDate, limit = 100, source, triageLevel, isAbnormal } = query;

    const where: Prisma.VitalSignWhereInput = { patientId };

    if (startDate || endDate) {
      where.measuredAt = {};
      if (startDate) where.measuredAt.gte = new Date(startDate);
      if (endDate) where.measuredAt.lte = new Date(endDate);
    }

    if (source) {
      where.source = source;
    }

    if (triageLevel) {
      where.triageLevel = triageLevel;
    }

    return this.prisma.vitalSign.findMany({
      where,
      orderBy: { measuredAt: 'desc' },
      take: limit,
    });
  }

  async getLatestVitalSigns(patientId: string): Promise<VitalSign | null> {
    return this.prisma.vitalSign.findFirst({
      where: { patientId },
      orderBy: { measuredAt: 'desc' },
    });
  }

  async getVitalSignStats(
    patientId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any> {
    const where: Prisma.VitalSignWhereInput = { patientId };

    if (startDate || endDate) {
      where.measuredAt = {};
      if (startDate) where.measuredAt.gte = startDate;
      if (endDate) where.measuredAt.lte = endDate;
    }

    const stats = await this.prisma.vitalSign.aggregate({
      where,
      _avg: {
        systolicBp: true,
        diastolicBp: true,
        heartRate: true,
        temperature: true,
        oxygenSaturation: true,
      },
      _min: {
        weight: true,
      },
      _max: {
        weight: true,
      },
      _count: true,
    });

    const abnormalCount = await this.prisma.vitalSign.count({
      where: {
        ...where,
        triageLevel: { in: [TriageLevel.RED, TriageLevel.YELLOW] },
      },
    });

    return {
      avgSystolicBp: stats._avg.systolicBp,
      avgDiastolicBp: stats._avg.diastolicBp,
      avgHeartRate: stats._avg.heartRate,
      avgTemperature: stats._avg.temperature,
      avgOxygenSaturation: stats._avg.oxygenSaturation,
      minWeight: stats._min.weight,
      maxWeight: stats._max.weight,
      totalRecords: stats._count,
      abnormalRecords: abnormalCount,
      startDate,
      endDate,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // AVATAR 3D
  // ═══════════════════════════════════════════════════════════════════════════════

  async getAvatarConfig(patientId: string): Promise<any> {
    const patient = await this.findById(patientId);

    // Configuração base do avatar
    const baseConfig = {
      bodyType: this.calculateBodyType(patient.height, patient.weight),
      height: patient.height || 170,
      weight: patient.weight || 70,
      gender: patient.gender,
      ...(patient.avatarConfig as any || {}),
    };

    // Buscar sinais vitais recentes para indicadores visuais
    const latestVitals = await this.getLatestVitalSigns(patientId);

    return {
      ...baseConfig,
      indicators: {
        hasAbnormalVitals: latestVitals
          ? this.checkAbnormalValues({
              systolicBp: latestVitals.systolicBp || undefined,
              diastolicBp: latestVitals.diastolicBp || undefined,
              heartRate: latestVitals.heartRate || undefined,
              temperature: latestVitals.temperature || undefined,
              oxygenSaturation: latestVitals.oxygenSaturation || undefined,
              bloodGlucose: latestVitals.bloodGlucose || undefined,
            })
          : false,
        triageLevel: latestVitals?.triageLevel,
      },
      evolution: await this.getWeightEvolution(patientId),
    };
  }

  async updateAvatarConfig(
    patientId: string,
    config: any,
    updatedBy: string,
  ): Promise<void> {
    await this.prisma.patient.update({
      where: { id: patientId },
      data: { avatarConfig: config },
    });

    await this.cacheService.del(`${this.CACHE_PREFIX}${patientId}`);

    await this.auditService.log({
      action: AuditAction.UPDATE,
      resource: 'patient',
      resourceId: patientId,
      userId: updatedBy,
      description: 'Configuração do Avatar 3D atualizada',
    });
  }

  private async getWeightEvolution(patientId: string): Promise<any[]> {
    const vitals = await this.prisma.vitalSign.findMany({
      where: {
        patientId,
        weight: { not: null },
      },
      orderBy: { measuredAt: 'asc' },
      take: 30,
      select: {
        weight: true,
        measuredAt: true,
      },
    });

    return vitals.map((v) => ({
      date: v.measuredAt,
      weight: v.weight,
    }));
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // DOCUMENTOS
  // ═══════════════════════════════════════════════════════════════════════════════

  async uploadDocument(
    patientId: string,
    file: Express.Multer.File,
    metadata: {
      type: string;
      category?: string;
      description?: string;
      validUntil?: string;
    },
    uploadedBy: string,
  ): Promise<PatientDocument> {
    await this.findById(patientId);

    // TODO: Upload para S3 ou outro storage
    const fileUrl = `https://storage.healthflow.com/patients/${patientId}/${Date.now()}-${file.originalname}`;

    const document = await this.prisma.patientDocument.create({
      data: {
        patientId,
        type: metadata.type,
        category: metadata.category,
        name: file.originalname,
        description: metadata.description,
        fileUrl,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedBy,
        validUntil: metadata.validUntil ? new Date(metadata.validUntil) : undefined,
      },
    });

    await this.auditService.log({
      action: AuditAction.CREATE,
      resource: 'patient_document',
      resourceId: document.id,
      userId: uploadedBy,
      description: `Documento enviado: ${metadata.type}`,
    });

    // Gamificação
    this.eventEmitter.emit('gamification.action', {
      patientId,
      action: 'DOCUMENT_UPLOADED',
      points: 3,
    });

    return document;
  }

  async getDocuments(
    patientId: string,
    filters: { type?: string; category?: string } = {},
  ): Promise<PatientDocument[]> {
    return this.prisma.patientDocument.findMany({
      where: {
        patientId,
        ...(filters.type && { type: filters.type }),
        ...(filters.category && { category: filters.category }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteDocument(
    patientId: string,
    documentId: string,
    deletedBy: string,
  ): Promise<void> {
    const document = await this.prisma.patientDocument.findFirst({
      where: { id: documentId, patientId },
    });

    if (!document) {
      throw new NotFoundException('Documento não encontrado');
    }

    await this.prisma.patientDocument.delete({
      where: { id: documentId },
    });

    // TODO: Deletar arquivo do storage

    await this.auditService.log({
      action: AuditAction.DELETE,
      resource: 'patient_document',
      resourceId: documentId,
      userId: deletedBy,
      description: `Documento removido: ${document.type}`,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // WEARABLES INTEGRATION
  // ═══════════════════════════════════════════════════════════════════════════════

  async connectWearable(
    patientId: string,
    provider: string,
    accessToken: string,
    refreshToken?: string,
  ): Promise<void> {
    await this.findById(patientId);

    await this.prisma.wearableConnection.upsert({
      where: {
        patientId_provider: { patientId, provider },
      },
      update: {
        accessToken,
        refreshToken,
        tokenExpires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        active: true,
        lastSyncAt: new Date(),
      },
      create: {
        patientId,
        provider,
        accessToken,
        refreshToken,
        tokenExpires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        active: true,
      },
    });

    await this.cacheService.del(`${this.CACHE_PREFIX}${patientId}`);

    this.logger.log(`Wearable ${provider} connected for patient ${patientId}`);
  }

  async disconnectWearable(patientId: string, provider: string): Promise<void> {
    await this.prisma.wearableConnection.updateMany({
      where: { patientId, provider },
      data: { active: false },
    });

    await this.cacheService.del(`${this.CACHE_PREFIX}${patientId}`);
  }

  async getWearableConnections(patientId: string): Promise<any[]> {
    return this.prisma.wearableConnection.findMany({
      where: { patientId },
      select: {
        id: true,
        provider: true,
        active: true,
        lastSyncAt: true,
        createdAt: true,
      },
    });
  }

  async syncWearableData(patientId: string): Promise<{ synced: number }> {
    const connections = await this.prisma.wearableConnection.findMany({
      where: { patientId, active: true },
    });

    let syncedCount = 0;

    for (const connection of connections) {
      // TODO: Implementar integração real com cada provider
      // HealthKit, Google Fit, Fitbit, etc.
      this.logger.debug(`Syncing ${connection.provider} for patient ${patientId}`);
    }

    return { synced: syncedCount };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ESTATÍSTICAS
  // ═══════════════════════════════════════════════════════════════════════════════

  async getStats(query: PatientStatsQueryDto): Promise<any> {
    const { startDate, endDate, clinicId, groupBy = 'month' } = query;

    const where: Prisma.PatientWhereInput = {
      deletedAt: null,
    };

    if (clinicId) {
      where.clinicPatients = { some: { clinicId } };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [totalPatients, genderDistribution, ageGroups, bloodTypeDistribution] = await Promise.all([
      this.prisma.patient.count({ where }),
      this.prisma.patient.groupBy({
        by: ['gender'],
        where,
        _count: true,
      }),
      this.getAgeGroupDistribution(where),
      this.prisma.patient.groupBy({
        by: ['bloodType'],
        where: { ...where, bloodType: { not: null } },
        _count: true,
      }),
    ]);

    return {
      totalPatients,
      genderDistribution: genderDistribution.map((g) => ({
        gender: g.gender,
        count: g._count,
      })),
      ageGroups,
      bloodTypeDistribution: bloodTypeDistribution.map((b) => ({
        bloodType: b.bloodType,
        count: b._count,
      })),
    };
  }

  private async getAgeGroupDistribution(where: Prisma.PatientWhereInput): Promise<any[]> {
    const patients = await this.prisma.patient.findMany({
      where,
      select: { birthDate: true },
    });

    const groups = {
      '0-17': 0,
      '18-30': 0,
      '31-45': 0,
      '46-60': 0,
      '61+': 0,
    };

    const today = new Date();

    for (const patient of patients) {
      const age = Math.floor(
        (today.getTime() - patient.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
      );

      if (age < 18) groups['0-17']++;
      else if (age <= 30) groups['18-30']++;
      else if (age <= 45) groups['31-45']++;
      else if (age <= 60) groups['46-60']++;
      else groups['61+']++;
    }

    return Object.entries(groups).map(([range, count]) => ({ range, count }));
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // HELPERS PRIVADOS
  // ═══════════════════════════════════════════════════════════════════════════════

  private calculateTriageLevel(vitals: CreateVitalSignDto): TriageLevel {
    // Critérios de emergência (RED)
    if (
      (vitals.systolicBp && vitals.systolicBp > 180) ||
      (vitals.systolicBp && vitals.systolicBp < 90) ||
      (vitals.oxygenSaturation && vitals.oxygenSaturation < 90) ||
      (vitals.bloodGlucose && vitals.bloodGlucose < 70) ||
      (vitals.heartRate && vitals.heartRate > 150) ||
      (vitals.heartRate && vitals.heartRate < 40) ||
      (vitals.temperature && vitals.temperature > 40) ||
      (vitals.temperature && vitals.temperature < 34)
    ) {
      return TriageLevel.RED;
    }

    // Critérios de urgência (YELLOW)
    if (
      (vitals.systolicBp && (vitals.systolicBp > 160 || vitals.systolicBp < 100)) ||
      (vitals.heartRate && (vitals.heartRate > 120 || vitals.heartRate < 50)) ||
      (vitals.oxygenSaturation && vitals.oxygenSaturation < 94) ||
      (vitals.temperature && (vitals.temperature > 38.5 || vitals.temperature < 35)) ||
      (vitals.bloodGlucose && (vitals.bloodGlucose > 250 || vitals.bloodGlucose < 80)) ||
      (vitals.painScale && vitals.painScale >= 7)
    ) {
      return TriageLevel.YELLOW;
    }

    // Normal (GREEN)
    return TriageLevel.GREEN;
  }

  private checkAbnormalValues(vitals: Partial<CreateVitalSignDto>): boolean {
    const triageLevel = this.calculateTriageLevel(vitals as CreateVitalSignDto);
    return triageLevel === TriageLevel.RED || triageLevel === TriageLevel.YELLOW;
  }

  private calculateBodyType(
    height?: number | null,
    weight?: number | null,
  ): string {
    if (!height || !weight) return 'average';

    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);

    if (bmi < 18.5) return 'underweight';
    if (bmi < 25) return 'average';
    if (bmi < 30) return 'overweight';
    return 'obese';
  }

  private sanitizeForAudit(data: any): any {
    if (!data) return null;

    const {
      user,
      vitalSigns,
      badges,
      clinicPatients,
      healthInsurance,
      wearableConnections,
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

  private isValidCns(cns: string): boolean {
    if (cns.length !== 15) return false;

    // CNS deve começar com 1, 2, 7, 8 ou 9
    const firstDigit = cns.charAt(0);
    if (!['1', '2', '7', '8', '9'].includes(firstDigit)) return false;

    // Algoritmo de validação do CNS
    if (['1', '2'].includes(firstDigit)) {
      // CNS definitivo
      let sum = 0;
      for (let i = 0; i < 15; i++) {
        sum += parseInt(cns.charAt(i)) * (15 - i);
      }
      return sum % 11 === 0;
    } else {
      // CNS provisório
      let sum = 0;
      for (let i = 0; i < 15; i++) {
        sum += parseInt(cns.charAt(i)) * (15 - i);
      }
      return sum % 11 === 0;
    }
  }
}
