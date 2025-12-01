import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/database/prisma.service';
import { CacheService } from '@/common/services/cache.service';
import { AuditService } from '@/common/services/audit.service';
import {
  CreateConsultationDto,
  UpdateConsultationDto,
  SignConsultationDto,
  AmendConsultationDto,
  ConsultationStatus,
  ConsultationType,
  DiagnosisDto,
  ConductDto,
  MedicalCertificateDto,
  MedicalReferralDto,
} from './dto/create-consultation.dto';
import {
  ConsultationQueryDto,
  PatientHistoryQueryDto,
  DiagnosisSearchQueryDto,
  ConsultationStatsQueryDto,
  MedicalRecordExportQueryDto,
} from './dto/consultation-query.dto';
import {
  ConsultationResponseDto,
  ConsultationListResponseDto,
  PatientHistoryResponseDto,
  DiagnosisSearchResponseDto,
  ConsultationStatsResponseDto,
  MedicalRecordExportResponseDto,
  PatientTimelineResponseDto,
  TimelineEventResponseDto,
} from './dto/consultation-response.dto';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class ConsultationsService {
  private readonly logger = new Logger(ConsultationsService.name);
  private readonly CACHE_TTL = 300;
  private readonly CACHE_PREFIX = 'consultations';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════════
  // CRUD BÁSICO
  // ═══════════════════════════════════════════════════════════════════════════════

  async create(dto: CreateConsultationDto, userId: string): Promise<ConsultationResponseDto> {
    this.logger.log(`Creating consultation for patient ${dto.patientId}`);

    // Verificar se agendamento existe e está em progresso
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    // Verificar se já existe consulta para este agendamento
    const existingConsultation = await this.prisma.consultation.findFirst({
      where: { appointmentId: dto.appointmentId },
    });

    if (existingConsultation) {
      throw new BadRequestException('Já existe uma consulta para este agendamento');
    }

    // Calcular BMI se peso e altura fornecidos
    if (dto.physicalExamination?.vitalSigns) {
      const vs = dto.physicalExamination.vitalSigns;
      if (vs.weight && vs.height && !vs.bmi) {
        vs.bmi = parseFloat((vs.weight / Math.pow(vs.height / 100, 2)).toFixed(2));
      }
    }

    const consultation = await this.prisma.consultation.create({
      data: {
        appointment: { connect: { id: dto.appointmentId } },
        patient: { connect: { id: dto.patientId } },
        doctor: { connect: { id: dto.doctorId } },
        clinic: { connect: { id: dto.clinicId } },
        type: (dto.type || ConsultationType.FOLLOW_UP) as any,
        status: (dto.status || ConsultationStatus.IN_PROGRESS) as any,
        anamnesis: dto.anamnesis as any,
        physicalExamination: dto.physicalExamination as any,
        diagnoses: dto.diagnoses as any,
        conducts: dto.conducts as any,
        soapNote: dto.soapNote as any,
        clinicalEvolution: dto.clinicalEvolution,
        summary: dto.summary,
        patientInstructions: dto.patientInstructions,
        internalNotes: dto.internalNotes,
        certificates: dto.certificates as any,
        referrals: dto.referrals as any,
        attachments: dto.attachments as any,
        needsFollowUp: dto.needsFollowUp || false,
        followUpDays: dto.followUpDays,
        metadata: dto.metadata as any,
        createdById: userId,
      },
      include: this.getConsultationInclude(),
    });

    // Salvar sinais vitais no histórico do paciente
    if (dto.physicalExamination?.vitalSigns) {
      await this.saveVitalSigns(dto.patientId, dto.physicalExamination.vitalSigns, consultation.id);
    }

    // Criar diagnósticos no banco
    if (dto.diagnoses && dto.diagnoses.length > 0) {
      await this.saveDiagnoses(consultation.id, dto.patientId, dto.diagnoses);
    }

    // Criar atestados
    if (dto.certificates && dto.certificates.length > 0) {
      await this.createCertificates(consultation.id, dto.patientId, dto.certificates, userId);
    }

    // Criar encaminhamentos
    if (dto.referrals && dto.referrals.length > 0) {
      await this.createReferrals(consultation.id, dto.patientId, dto.referrals, userId);
    }

    // Invalidar cache
    await this.invalidateCache(dto.patientId, dto.doctorId, dto.clinicId);

    // Auditoria
    await this.auditService.log({
      action: 'CONSULTATION_CREATED',
      entityType: 'Consultation',
      entityId: consultation.id,
      userId,
      details: {
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        appointmentId: dto.appointmentId,
      },
    });

    // Emitir evento
    this.eventEmitter.emit('consultation.created', {
      consultationId: consultation.id,
      patientId: dto.patientId,
      doctorId: dto.doctorId,
    });

    return this.mapToResponseDto(consultation);
  }

  async findAll(query: ConsultationQueryDto): Promise<ConsultationListResponseDto> {
    const {
      clinicId,
      doctorId,
      patientId,
      appointmentId,
      type,
      status,
      statuses,
      startDate,
      endDate,
      diagnosisCode,
      search,
      signedOnly,
      withPrescription,
      withCertificate,
      withReferral,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = query;

    const where: Prisma.ConsultationWhereInput = {
      deletedAt: null,
    };

    if (clinicId) where.clinicId = clinicId;
    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;
    if (appointmentId) where.appointmentId = appointmentId;
    if (type) where.type = type as any;

    if (statuses && statuses.length > 0) {
      where.status = { in: statuses as any[] };
    } else if (status) {
      where.status = status as any;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (diagnosisCode) {
      where.diagnoses = {
        path: '$[*].code',
        array_contains: diagnosisCode,
      };
    }

    if (search) {
      where.OR = [
        { summary: { contains: search, mode: 'insensitive' } },
        { clinicalEvolution: { contains: search, mode: 'insensitive' } },
        { patientInstructions: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (signedOnly) {
      where.signedAt = { not: null };
    }

    if (withPrescription) {
      where.prescriptions = { some: {} };
    }

    if (withCertificate) {
      where.certificates = { not: Prisma.JsonNull };
    }

    if (withReferral) {
      where.referrals = { not: Prisma.JsonNull };
    }

    const orderBy: Prisma.ConsultationOrderByWithRelationInput = {};
    if (sortBy === 'signedAt') orderBy.signedAt = sortOrder;
    else if (sortBy === 'updatedAt') orderBy.updatedAt = sortOrder;
    else orderBy.createdAt = sortOrder;

    const skip = (page - 1) * limit;

    const [consultations, total] = await Promise.all([
      this.prisma.consultation.findMany({
        where,
        include: this.getConsultationInclude(),
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.consultation.count({ where }),
    ]);

    return {
      data: consultations.map((c) => this.mapToResponseDto(c)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<ConsultationResponseDto> {
    const cacheKey = `${this.CACHE_PREFIX}:${id}`;
    const cached = await this.cacheService.get<ConsultationResponseDto>(cacheKey);

    if (cached) {
      return cached;
    }

    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
      include: this.getConsultationInclude(),
    });

    if (!consultation) {
      throw new NotFoundException('Consulta não encontrada');
    }

    const response = this.mapToResponseDto(consultation);
    await this.cacheService.set(cacheKey, response, this.CACHE_TTL);

    return response;
  }

  async update(
    id: string,
    dto: UpdateConsultationDto,
    userId: string,
  ): Promise<ConsultationResponseDto> {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
    });

    if (!consultation) {
      throw new NotFoundException('Consulta não encontrada');
    }

    // Não pode editar consulta assinada (precisa retificar)
    if (consultation.signedAt) {
      throw new BadRequestException(
        'Consulta já assinada. Use a retificação para alterações.',
      );
    }

    // Calcular BMI se peso e altura fornecidos
    if (dto.physicalExamination?.vitalSigns) {
      const vs = dto.physicalExamination.vitalSigns;
      if (vs.weight && vs.height && !vs.bmi) {
        vs.bmi = parseFloat((vs.weight / Math.pow(vs.height / 100, 2)).toFixed(2));
      }
    }

    const updateData: Prisma.ConsultationUpdateInput = {};

    if (dto.type) updateData.type = dto.type as any;
    if (dto.status) updateData.status = dto.status as any;
    if (dto.anamnesis) updateData.anamnesis = dto.anamnesis as any;
    if (dto.physicalExamination) updateData.physicalExamination = dto.physicalExamination as any;
    if (dto.diagnoses) updateData.diagnoses = dto.diagnoses as any;
    if (dto.conducts) updateData.conducts = dto.conducts as any;
    if (dto.soapNote) updateData.soapNote = dto.soapNote as any;
    if (dto.clinicalEvolution !== undefined) updateData.clinicalEvolution = dto.clinicalEvolution;
    if (dto.summary !== undefined) updateData.summary = dto.summary;
    if (dto.patientInstructions !== undefined) updateData.patientInstructions = dto.patientInstructions;
    if (dto.internalNotes !== undefined) updateData.internalNotes = dto.internalNotes;
    if (dto.certificates) updateData.certificates = dto.certificates as any;
    if (dto.referrals) updateData.referrals = dto.referrals as any;
    if (dto.attachments) updateData.attachments = dto.attachments as any;
    if (dto.needsFollowUp !== undefined) updateData.needsFollowUp = dto.needsFollowUp;
    if (dto.followUpDays !== undefined) updateData.followUpDays = dto.followUpDays;

    const updated = await this.prisma.consultation.update({
      where: { id },
      data: updateData,
      include: this.getConsultationInclude(),
    });

    // Atualizar sinais vitais
    if (dto.physicalExamination?.vitalSigns) {
      await this.saveVitalSigns(updated.patientId, dto.physicalExamination.vitalSigns, id);
    }

    // Invalidar cache
    await this.cacheService.del(`${this.CACHE_PREFIX}:${id}`);
    await this.invalidateCache(updated.patientId, updated.doctorId, updated.clinicId);

    // Auditoria
    await this.auditService.log({
      action: 'CONSULTATION_UPDATED',
      entityType: 'Consultation',
      entityId: id,
      userId,
      details: { changes: Object.keys(dto) },
    });

    return this.mapToResponseDto(updated);
  }

  async delete(id: string, userId: string): Promise<void> {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
    });

    if (!consultation) {
      throw new NotFoundException('Consulta não encontrada');
    }

    if (consultation.signedAt) {
      throw new BadRequestException('Não é possível excluir consulta assinada');
    }

    await this.prisma.consultation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.cacheService.del(`${this.CACHE_PREFIX}:${id}`);
    await this.invalidateCache(consultation.patientId, consultation.doctorId, consultation.clinicId);

    await this.auditService.log({
      action: 'CONSULTATION_DELETED',
      entityType: 'Consultation',
      entityId: id,
      userId,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ASSINATURA E RETIFICAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════════

  async sign(
    id: string,
    dto: SignConsultationDto,
    userId: string,
  ): Promise<ConsultationResponseDto> {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
      include: { doctor: { include: { user: true } } },
    });

    if (!consultation) {
      throw new NotFoundException('Consulta não encontrada');
    }

    if (consultation.signedAt) {
      throw new BadRequestException('Consulta já está assinada');
    }

    // Verificar se é o médico da consulta
    if (consultation.doctor.userId !== userId) {
      throw new ForbiddenException('Apenas o médico da consulta pode assinar');
    }

    // Validar dados obrigatórios
    if (!consultation.diagnoses || (consultation.diagnoses as any[]).length === 0) {
      throw new BadRequestException('É necessário ao menos um diagnóstico para assinar');
    }

    // Gerar hash de assinatura
    const dataToSign = JSON.stringify({
      consultationId: id,
      patientId: consultation.patientId,
      doctorId: consultation.doctorId,
      anamnesis: consultation.anamnesis,
      physicalExamination: consultation.physicalExamination,
      diagnoses: consultation.diagnoses,
      conducts: consultation.conducts,
      timestamp: new Date().toISOString(),
    });

    const signatureHash = crypto
      .createHash('sha256')
      .update(dataToSign)
      .digest('hex');

    const updated = await this.prisma.consultation.update({
      where: { id },
      data: {
        status: 'SIGNED' as any,
        signedAt: new Date(),
        signedById: userId,
        signatureHash,
      },
      include: this.getConsultationInclude(),
    });

    // Completar agendamento se ainda não estiver
    await this.prisma.appointment.update({
      where: { id: consultation.appointmentId },
      data: {
        status: 'COMPLETED' as any,
        actualEndTime: new Date(),
      },
    });

    await this.cacheService.del(`${this.CACHE_PREFIX}:${id}`);

    // Auditoria
    await this.auditService.log({
      action: 'CONSULTATION_SIGNED',
      entityType: 'Consultation',
      entityId: id,
      userId,
      details: { signatureHash },
    });

    // Emitir evento
    this.eventEmitter.emit('consultation.signed', {
      consultationId: id,
      patientId: consultation.patientId,
      doctorId: consultation.doctorId,
    });

    return this.mapToResponseDto(updated);
  }

  async amend(
    id: string,
    dto: AmendConsultationDto,
    userId: string,
  ): Promise<ConsultationResponseDto> {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
      include: { doctor: true },
    });

    if (!consultation) {
      throw new NotFoundException('Consulta não encontrada');
    }

    if (!consultation.signedAt) {
      throw new BadRequestException('Apenas consultas assinadas podem ser retificadas');
    }

    // Verificar se é o médico da consulta
    if (consultation.doctor.userId !== userId) {
      throw new ForbiddenException('Apenas o médico da consulta pode retificar');
    }

    // Registrar retificação
    const amendments = (consultation.amendments as any[]) || [];
    amendments.push({
      id: crypto.randomUUID(),
      reason: dto.reason,
      changes: dto.changes,
      amendedAt: new Date().toISOString(),
      amendedBy: userId,
    });

    // Aplicar alterações
    const updateData: Prisma.ConsultationUpdateInput = {
      status: 'AMENDED' as any,
      amendments: amendments as any,
    };

    // Aplicar as mudanças do dto.changes
    if (dto.changes.anamnesis) updateData.anamnesis = dto.changes.anamnesis as any;
    if (dto.changes.physicalExamination) updateData.physicalExamination = dto.changes.physicalExamination as any;
    if (dto.changes.diagnoses) updateData.diagnoses = dto.changes.diagnoses as any;
    if (dto.changes.conducts) updateData.conducts = dto.changes.conducts as any;
    if (dto.changes.soapNote) updateData.soapNote = dto.changes.soapNote as any;
    if (dto.changes.clinicalEvolution) updateData.clinicalEvolution = dto.changes.clinicalEvolution;
    if (dto.changes.summary) updateData.summary = dto.changes.summary;
    if (dto.changes.patientInstructions) updateData.patientInstructions = dto.changes.patientInstructions;

    const updated = await this.prisma.consultation.update({
      where: { id },
      data: updateData,
      include: this.getConsultationInclude(),
    });

    await this.cacheService.del(`${this.CACHE_PREFIX}:${id}`);

    // Auditoria
    await this.auditService.log({
      action: 'CONSULTATION_AMENDED',
      entityType: 'Consultation',
      entityId: id,
      userId,
      details: {
        reason: dto.reason,
        changedFields: Object.keys(dto.changes),
      },
    });

    return this.mapToResponseDto(updated);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // HISTÓRICO DO PACIENTE
  // ═══════════════════════════════════════════════════════════════════════════════

  async getPatientHistory(query: PatientHistoryQueryDto): Promise<PatientHistoryResponseDto> {
    const {
      patientId,
      clinicId,
      doctorId,
      startDate,
      endDate,
      includeDiagnoses = true,
      includePrescriptions = true,
      includeExams = true,
      includeVitalSigns = true,
      page = 1,
      limit = 20,
    } = query;

    // Buscar paciente
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado');
    }

    // Buscar consultas
    const where: Prisma.ConsultationWhereInput = {
      patientId,
      deletedAt: null,
    };

    if (clinicId) where.clinicId = clinicId;
    if (doctorId) where.doctorId = doctorId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [consultations, total] = await Promise.all([
      this.prisma.consultation.findMany({
        where,
        include: this.getConsultationInclude(),
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.consultation.count({ where }),
    ]);

    // Coletar informações agregadas
    let allergies: string[] = [];
    let chronicConditions: string[] = [];
    const currentMedications: any[] = [];
    let vitalSignsHistory: any[] = [];
    let diagnosisHistory: any[] = [];

    // Extrair alergias e condições crônicas das consultas
    for (const c of consultations) {
      const anamnesis = c.anamnesis as any;
      if (anamnesis?.allergies) {
        allergies = [...new Set([...allergies, ...anamnesis.allergies])];
      }
      if (anamnesis?.pastMedicalHistory?.diseases) {
        chronicConditions = [...new Set([...chronicConditions, ...anamnesis.pastMedicalHistory.diseases])];
      }
    }

    // Buscar sinais vitais
    if (includeVitalSigns) {
      const vitalSigns = await this.prisma.vitalSign.findMany({
        where: { patientId },
        orderBy: { measuredAt: 'desc' },
        take: 20,
      });

      vitalSignsHistory = vitalSigns.map((vs) => ({
        date: vs.measuredAt,
        vitalSigns: {
          systolicBP: vs.systolicBP,
          diastolicBP: vs.diastolicBP,
          heartRate: vs.heartRate,
          respiratoryRate: vs.respiratoryRate,
          temperature: vs.temperature ? Number(vs.temperature) : undefined,
          oxygenSaturation: vs.oxygenSaturation,
          weight: vs.weight ? Number(vs.weight) : undefined,
          height: vs.height ? Number(vs.height) : undefined,
          bmi: vs.bmi ? Number(vs.bmi) : undefined,
        },
      }));
    }

    // Buscar histórico de diagnósticos
    if (includeDiagnoses) {
      const diagnoses = await this.prisma.patientDiagnosis.findMany({
        where: { patientId },
        include: { doctor: { include: { user: true } } },
        orderBy: { diagnosisDate: 'desc' },
        take: 50,
      });

      diagnosisHistory = diagnoses.map((d) => ({
        code: d.code,
        description: d.description,
        date: d.diagnosisDate,
        doctor: `Dr(a). ${d.doctor.user.firstName} ${d.doctor.user.lastName}`,
      }));
    }

    return {
      patient: {
        id: patient.id,
        fullName: `${patient.user.firstName} ${patient.user.lastName}`,
        cpf: patient.cpf || undefined,
        email: patient.user.email || undefined,
        phone: patient.user.phone || undefined,
        avatarUrl: patient.user.avatarUrl || undefined,
        birthDate: patient.birthDate || undefined,
        age: patient.birthDate
          ? Math.floor((Date.now() - patient.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : undefined,
        gender: patient.gender || undefined,
        bloodType: patient.bloodType || undefined,
      },
      consultations: consultations.map((c) => this.mapToResponseDto(c)),
      allergies,
      chronicConditions,
      currentMedications,
      vitalSignsHistory,
      diagnosisHistory,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPatientTimeline(
    patientId: string,
    startDate?: string,
    endDate?: string,
    limit: number = 50,
  ): Promise<PatientTimelineResponseDto> {
    const events: TimelineEventResponseDto[] = [];

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    // Buscar consultas
    const consultations = await this.prisma.consultation.findMany({
      where: {
        patientId,
        deletedAt: null,
        ...(startDate || endDate ? { createdAt: dateFilter } : {}),
      },
      include: {
        doctor: { include: { user: true } },
        clinic: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    for (const c of consultations) {
      events.push({
        id: c.id,
        type: 'CONSULTATION',
        date: c.createdAt,
        title: 'Consulta médica',
        description: c.summary || undefined,
        doctor: {
          id: c.doctorId,
          name: `Dr(a). ${c.doctor.user.firstName} ${c.doctor.user.lastName}`,
        },
        clinic: {
          id: c.clinicId,
          name: c.clinic.name,
        },
        details: {
          type: c.type,
          status: c.status,
          diagnosesCount: (c.diagnoses as any[])?.length || 0,
        },
      });
    }

    // Buscar prescrições
    const prescriptions = await this.prisma.prescription.findMany({
      where: {
        patientId,
        deletedAt: null,
        ...(startDate || endDate ? { createdAt: dateFilter } : {}),
      },
      include: {
        doctor: { include: { user: true } },
        clinic: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    for (const p of prescriptions) {
      events.push({
        id: p.id,
        type: 'PRESCRIPTION',
        date: p.createdAt,
        title: 'Prescrição médica',
        description: `${(p.items as any[])?.length || 0} medicamento(s)`,
        doctor: {
          id: p.doctorId,
          name: `Dr(a). ${p.doctor.user.firstName} ${p.doctor.user.lastName}`,
        },
        clinic: {
          id: p.clinicId,
          name: p.clinic.name,
        },
      });
    }

    // Buscar exames
    const labOrders = await this.prisma.labOrder.findMany({
      where: {
        patientId,
        ...(startDate || endDate ? { createdAt: dateFilter } : {}),
      },
      include: {
        doctor: { include: { user: true } },
        clinic: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    for (const o of labOrders) {
      events.push({
        id: o.id,
        type: 'EXAM',
        date: o.createdAt,
        title: 'Solicitação de exames',
        description: o.status as string,
        doctor: {
          id: o.doctorId,
          name: `Dr(a). ${o.doctor.user.firstName} ${o.doctor.user.lastName}`,
        },
        clinic: {
          id: o.clinicId,
          name: o.clinic.name,
        },
      });
    }

    // Buscar sinais vitais
    const vitalSigns = await this.prisma.vitalSign.findMany({
      where: {
        patientId,
        ...(startDate || endDate ? { measuredAt: dateFilter } : {}),
      },
      orderBy: { measuredAt: 'desc' },
      take: limit,
    });

    for (const vs of vitalSigns) {
      events.push({
        id: vs.id,
        type: 'VITAL_SIGNS',
        date: vs.measuredAt,
        title: 'Sinais vitais registrados',
        details: {
          systolicBP: vs.systolicBP,
          diastolicBP: vs.diastolicBP,
          heartRate: vs.heartRate,
          temperature: vs.temperature ? Number(vs.temperature) : undefined,
          oxygenSaturation: vs.oxygenSaturation,
        },
      });
    }

    // Ordenar eventos por data
    events.sort((a, b) => b.date.getTime() - a.date.getTime());

    return {
      events: events.slice(0, limit),
      total: events.length,
      hasMore: events.length > limit,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // BUSCA DE DIAGNÓSTICOS CID-10
  // ═══════════════════════════════════════════════════════════════════════════════

  async searchDiagnoses(query: DiagnosisSearchQueryDto): Promise<DiagnosisSearchResponseDto> {
    const { search, chapter, category, limit = 20 } = query;

    const where: Prisma.Cid10WhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (chapter) {
      where.chapter = chapter;
    }

    if (category) {
      where.category = category;
    }

    const results = await this.prisma.cid10.findMany({
      where,
      take: limit,
      orderBy: { code: 'asc' },
    });

    return {
      results: results.map((r) => ({
        code: r.code,
        description: r.description,
        chapter: r.chapter || undefined,
        category: r.category || undefined,
        subcategory: r.subcategory || undefined,
      })),
      total: results.length,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ESTATÍSTICAS
  // ═══════════════════════════════════════════════════════════════════════════════

  async getStats(query: ConsultationStatsQueryDto): Promise<ConsultationStatsResponseDto> {
    const {
      clinicId,
      doctorId,
      startDate,
      endDate,
      groupBy = 'day',
      includeTopDiagnoses = true,
      topDiagnosesLimit = 10,
    } = query;

    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate ? new Date(endDate) : now;

    const where: Prisma.ConsultationWhereInput = {
      createdAt: { gte: start, lte: end },
      deletedAt: null,
    };

    if (clinicId) where.clinicId = clinicId;
    if (doctorId) where.doctorId = doctorId;

    const consultations = await this.prisma.consultation.findMany({
      where,
      include: {
        doctor: { include: { user: true } },
      },
    });

    const total = consultations.length;
    const completed = consultations.filter((c) => c.status === 'COMPLETED' || c.status === 'SIGNED').length;
    const signed = consultations.filter((c) => c.signedAt).length;
    const draft = consultations.filter((c) => c.status === 'DRAFT').length;

    // Por tipo
    const byType: Record<string, number> = {};
    for (const c of consultations) {
      byType[c.type] = (byType[c.type] || 0) + 1;
    }

    // Por status
    const byStatus: Record<string, number> = {};
    for (const c of consultations) {
      byStatus[c.status] = (byStatus[c.status] || 0) + 1;
    }

    // Por médico
    const byDoctorMap = new Map<string, { doctorName: string; total: number; durations: number[] }>();
    for (const c of consultations) {
      const existing = byDoctorMap.get(c.doctorId) || {
        doctorName: `${c.doctor.user.firstName} ${c.doctor.user.lastName}`,
        total: 0,
        durations: [],
      };
      existing.total++;
      byDoctorMap.set(c.doctorId, existing);
    }

    const byDoctor = Array.from(byDoctorMap.entries()).map(([doctorId, stats]) => ({
      doctorId,
      doctorName: stats.doctorName,
      total: stats.total,
      averageDuration: 0, // TODO: Calcular duração média
    }));

    // Top diagnósticos
    let topDiagnoses;
    if (includeTopDiagnoses) {
      const diagnosisCounts = new Map<string, { description: string; count: number }>();

      for (const c of consultations) {
        const diagnoses = c.diagnoses as any[];
        if (diagnoses) {
          for (const d of diagnoses) {
            const existing = diagnosisCounts.get(d.code) || { description: d.description, count: 0 };
            existing.count++;
            diagnosisCounts.set(d.code, existing);
          }
        }
      }

      topDiagnoses = Array.from(diagnosisCounts.entries())
        .map(([code, data]) => ({
          code,
          description: data.description,
          count: data.count,
          percentage: total > 0 ? (data.count / total) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, topDiagnosesLimit);
    }

    return {
      totalConsultations: total,
      completedConsultations: completed,
      signedConsultations: signed,
      draftConsultations: draft,
      averageDuration: 0, // TODO: Implementar cálculo de duração média
      byType,
      byStatus,
      byDoctor,
      topDiagnoses,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // EXPORTAÇÃO DE PRONTUÁRIO
  // ═══════════════════════════════════════════════════════════════════════════════

  async exportMedicalRecord(
    query: MedicalRecordExportQueryDto,
    userId: string,
  ): Promise<MedicalRecordExportResponseDto> {
    const {
      patientId,
      startDate,
      endDate,
      format = 'PDF',
      includeConsultations = true,
      includePrescriptions = true,
      includeExams = true,
      includeCertificates = true,
      exportReason,
    } = query;

    // Verificar paciente
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado');
    }

    // Registrar auditoria de acesso ao prontuário
    await this.auditService.log({
      action: 'MEDICAL_RECORD_EXPORT',
      entityType: 'Patient',
      entityId: patientId,
      userId,
      details: {
        format,
        reason: exportReason,
        startDate,
        endDate,
      },
    });

    // TODO: Implementar geração real do documento
    // Por enquanto, retorna resposta de exemplo

    this.eventEmitter.emit('medicalRecord.export', {
      patientId,
      userId,
      format,
      query,
    });

    return {
      success: true,
      fileName: `prontuario_${patient.user.firstName}_${patient.user.lastName}_${Date.now()}.${format.toLowerCase()}`,
      format,
      exportedAt: new Date(),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // MÉTODOS AUXILIARES PRIVADOS
  // ═══════════════════════════════════════════════════════════════════════════════

  private async saveVitalSigns(
    patientId: string,
    vitalSigns: any,
    consultationId: string,
  ): Promise<void> {
    await this.prisma.vitalSign.create({
      data: {
        patient: { connect: { id: patientId } },
        consultation: { connect: { id: consultationId } },
        systolicBP: vitalSigns.systolicBP,
        diastolicBP: vitalSigns.diastolicBP,
        heartRate: vitalSigns.heartRate,
        respiratoryRate: vitalSigns.respiratoryRate,
        temperature: vitalSigns.temperature,
        oxygenSaturation: vitalSigns.oxygenSaturation,
        weight: vitalSigns.weight,
        height: vitalSigns.height,
        bmi: vitalSigns.bmi,
        waistCircumference: vitalSigns.waistCircumference,
        bloodGlucose: vitalSigns.bloodGlucose,
        painScale: vitalSigns.painScale,
        measuredAt: new Date(),
      },
    });
  }

  private async saveDiagnoses(
    consultationId: string,
    patientId: string,
    diagnoses: DiagnosisDto[],
  ): Promise<void> {
    for (const diagnosis of diagnoses) {
      // Buscar consulta para obter doctorId
      const consultation = await this.prisma.consultation.findUnique({
        where: { id: consultationId },
      });

      if (consultation) {
        await this.prisma.patientDiagnosis.create({
          data: {
            patient: { connect: { id: patientId } },
            consultation: { connect: { id: consultationId } },
            doctor: { connect: { id: consultation.doctorId } },
            code: diagnosis.code,
            description: diagnosis.description,
            type: diagnosis.type,
            notes: diagnosis.notes,
            diagnosisDate: diagnosis.diagnosisDate ? new Date(diagnosis.diagnosisDate) : new Date(),
            isConfirmed: diagnosis.isConfirmed || false,
          },
        });
      }
    }
  }

  private async createCertificates(
    consultationId: string,
    patientId: string,
    certificates: MedicalCertificateDto[],
    userId: string,
  ): Promise<void> {
    for (const cert of certificates) {
      await this.prisma.medicalCertificate.create({
        data: {
          consultation: { connect: { id: consultationId } },
          patient: { connect: { id: patientId } },
          type: cert.type,
          days: cert.days,
          startDate: cert.startDate ? new Date(cert.startDate) : new Date(),
          endDate: cert.endDate ? new Date(cert.endDate) : undefined,
          cidCode: cert.cidCode,
          text: cert.text,
          notes: cert.notes,
          createdById: userId,
        },
      });
    }
  }

  private async createReferrals(
    consultationId: string,
    patientId: string,
    referrals: MedicalReferralDto[],
    userId: string,
  ): Promise<void> {
    for (const ref of referrals) {
      await this.prisma.medicalReferral.create({
        data: {
          consultation: { connect: { id: consultationId } },
          patient: { connect: { id: patientId } },
          specialty: ref.specialty,
          toDoctorId: ref.toDoctorId,
          reason: ref.reason,
          urgency: ref.urgency || 'MEDIUM',
          clinicalInformation: ref.clinicalInformation,
          diagnosticHypothesis: ref.diagnosticHypothesis,
          attachedExams: ref.attachedExams || [],
          status: 'PENDING',
          createdById: userId,
        },
      });
    }
  }

  private getConsultationInclude() {
    return {
      patient: {
        include: {
          user: true,
        },
      },
      doctor: {
        include: {
          user: true,
          specialties: {
            include: { specialty: true },
            take: 1,
          },
        },
      },
      clinic: true,
      prescriptions: true,
    };
  }

  private mapToResponseDto(consultation: any): ConsultationResponseDto {
    return {
      id: consultation.id,
      appointmentId: consultation.appointmentId,
      patient: {
        id: consultation.patient.id,
        fullName: `${consultation.patient.user.firstName} ${consultation.patient.user.lastName}`,
        cpf: consultation.patient.cpf,
        email: consultation.patient.user.email,
        phone: consultation.patient.user.phone,
        avatarUrl: consultation.patient.user.avatarUrl,
        birthDate: consultation.patient.birthDate,
        age: consultation.patient.birthDate
          ? Math.floor(
              (Date.now() - consultation.patient.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
            )
          : undefined,
        gender: consultation.patient.gender,
        bloodType: consultation.patient.bloodType,
      },
      doctor: {
        id: consultation.doctor.id,
        fullName: `Dr(a). ${consultation.doctor.user.firstName} ${consultation.doctor.user.lastName}`,
        crm: consultation.doctor.crm,
        specialty: consultation.doctor.specialties?.[0]?.specialty?.name,
        email: consultation.doctor.user.email,
        avatarUrl: consultation.doctor.user.avatarUrl,
      },
      clinic: {
        id: consultation.clinic.id,
        name: consultation.clinic.name,
        cnpj: consultation.clinic.cnpj,
        address: consultation.clinic.address
          ? `${(consultation.clinic.address as any).street}, ${(consultation.clinic.address as any).number}`
          : undefined,
      },
      type: consultation.type as ConsultationType,
      status: consultation.status as ConsultationStatus,
      anamnesis: consultation.anamnesis,
      physicalExamination: consultation.physicalExamination,
      diagnoses: consultation.diagnoses,
      conducts: consultation.conducts,
      soapNote: consultation.soapNote,
      clinicalEvolution: consultation.clinicalEvolution,
      summary: consultation.summary,
      patientInstructions: consultation.patientInstructions,
      internalNotes: consultation.internalNotes,
      certificates: consultation.certificates,
      referrals: consultation.referrals,
      attachments: consultation.attachments,
      needsFollowUp: consultation.needsFollowUp,
      followUpDays: consultation.followUpDays,
      amendments: consultation.amendments,
      signedAt: consultation.signedAt,
      signatureHash: consultation.signatureHash,
      createdAt: consultation.createdAt,
      updatedAt: consultation.updatedAt,
      createdBy: consultation.createdById,
    };
  }

  private async invalidateCache(
    patientId: string,
    doctorId: string,
    clinicId: string,
  ): Promise<void> {
    await Promise.all([
      this.cacheService.delByPattern(`${this.CACHE_PREFIX}:patient:${patientId}:*`),
      this.cacheService.delByPattern(`${this.CACHE_PREFIX}:doctor:${doctorId}:*`),
      this.cacheService.delByPattern(`${this.CACHE_PREFIX}:clinic:${clinicId}:*`),
    ]);
  }
}
