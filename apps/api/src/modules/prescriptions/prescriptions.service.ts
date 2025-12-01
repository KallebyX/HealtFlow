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
  CreatePrescriptionDto,
  UpdatePrescriptionDto,
  SignPrescriptionDto,
  DispensePrescriptionDto,
  CancelPrescriptionDto,
  RenewPrescriptionDto,
  MedicationSearchDto,
  CheckInteractionsDto,
  PrescriptionStatus,
  PrescriptionType,
  InteractionSeverity,
} from './dto/create-prescription.dto';
import {
  PrescriptionQueryDto,
  PatientPrescriptionsQueryDto,
  PrescriptionStatsQueryDto,
} from './dto/prescription-query.dto';
import {
  PrescriptionResponseDto,
  PrescriptionListResponseDto,
  MedicationSearchResponseDto,
  InteractionsCheckResponseDto,
  PatientMedicationsResponseDto,
  PrescriptionStatsResponseDto,
  PrescriptionDocumentResponseDto,
} from './dto/prescription-response.dto';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class PrescriptionsService {
  private readonly logger = new Logger(PrescriptionsService.name);
  private readonly CACHE_TTL = 300;
  private readonly CACHE_PREFIX = 'prescriptions';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════════
  // CRUD BÁSICO
  // ═══════════════════════════════════════════════════════════════════════════════

  async create(dto: CreatePrescriptionDto, userId: string): Promise<PrescriptionResponseDto> {
    this.logger.log(`Creating prescription for patient ${dto.patientId}`);

    // Verificar paciente
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
      include: { user: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado');
    }

    // Verificar médico
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: dto.doctorId },
      include: { user: true },
    });

    if (!doctor) {
      throw new NotFoundException('Médico não encontrado');
    }

    // Verificar interações medicamentosas
    const medications = dto.items.map((item) => item.medicationName);
    const interactions = await this.checkInteractionsInternal(medications, dto.patientId);

    if (interactions.length > 0 && !dto.acknowledgeInteractions) {
      const hasCritical = interactions.some((i) => i.severity === InteractionSeverity.CONTRAINDICATED);
      if (hasCritical) {
        throw new BadRequestException({
          message: 'Existem interações medicamentosas contraindicadas',
          interactions,
        });
      }
    }

    // Calcular data de expiração
    const validityDays = dto.validityDays || this.getDefaultValidityDays(dto.type);
    const expiresAt = dto.expiresAt
      ? new Date(dto.expiresAt)
      : new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);

    // Processar itens
    const processedItems = dto.items.map((item, index) => ({
      id: crypto.randomUUID(),
      ...item,
      order: item.order ?? index,
    }));

    const prescription = await this.prisma.prescription.create({
      data: {
        patient: { connect: { id: dto.patientId } },
        doctor: { connect: { id: dto.doctorId } },
        clinic: { connect: { id: dto.clinicId } },
        ...(dto.consultationId ? { consultation: { connect: { id: dto.consultationId } } } : {}),
        type: dto.type as any,
        status: (dto.status || PrescriptionStatus.DRAFT) as any,
        items: processedItems as any,
        diagnosis: dto.diagnosis,
        diagnosisCode: dto.diagnosisCode,
        generalInstructions: dto.generalInstructions,
        internalNotes: dto.internalNotes,
        validityDays,
        expiresAt,
        copies: dto.copies || 1,
        isRenewal: dto.isRenewal || false,
        originalPrescriptionId: dto.originalPrescriptionId,
        interactions: interactions as any,
        interactionsAcknowledged: dto.acknowledgeInteractions || false,
        interactionAcknowledgementReason: dto.interactionAcknowledgementReason,
        metadata: dto.metadata as any,
        createdById: userId,
      },
      include: this.getPrescriptionInclude(),
    });

    // Invalidar cache
    await this.invalidateCache(dto.patientId, dto.doctorId, dto.clinicId);

    // Auditoria
    await this.auditService.log({
      action: 'PRESCRIPTION_CREATED',
      entityType: 'Prescription',
      entityId: prescription.id,
      userId,
      details: {
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        itemsCount: dto.items.length,
        type: dto.type,
      },
    });

    // Emitir evento
    this.eventEmitter.emit('prescription.created', {
      prescriptionId: prescription.id,
      patientId: dto.patientId,
      doctorId: dto.doctorId,
    });

    return this.mapToResponseDto(prescription);
  }

  async findAll(query: PrescriptionQueryDto): Promise<PrescriptionListResponseDto> {
    const {
      clinicId,
      doctorId,
      patientId,
      consultationId,
      type,
      status,
      statuses,
      startDate,
      endDate,
      signedOnly,
      validOnly,
      dispensedOnly,
      renewalsOnly,
      medicationSearch,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = query;

    const where: Prisma.PrescriptionWhereInput = {
      deletedAt: null,
    };

    if (clinicId) where.clinicId = clinicId;
    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;
    if (consultationId) where.consultationId = consultationId;
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

    if (signedOnly) {
      where.signedAt = { not: null };
    }

    if (validOnly) {
      where.expiresAt = { gt: new Date() };
      where.status = { notIn: ['CANCELLED', 'EXPIRED'] as any[] };
    }

    if (dispensedOnly) {
      where.status = { in: ['DISPENSED', 'PARTIALLY_DISPENSED'] as any[] };
    }

    if (renewalsOnly) {
      where.isRenewal = true;
    }

    if (medicationSearch) {
      where.items = {
        path: '$[*].medicationName',
        string_contains: medicationSearch,
      };
    }

    const orderBy: Prisma.PrescriptionOrderByWithRelationInput = {};
    if (sortBy === 'signedAt') orderBy.signedAt = sortOrder;
    else if (sortBy === 'expiresAt') orderBy.expiresAt = sortOrder;
    else orderBy.createdAt = sortOrder;

    const skip = (page - 1) * limit;

    const [prescriptions, total] = await Promise.all([
      this.prisma.prescription.findMany({
        where,
        include: this.getPrescriptionInclude(),
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.prescription.count({ where }),
    ]);

    return {
      data: prescriptions.map((p) => this.mapToResponseDto(p)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<PrescriptionResponseDto> {
    const cacheKey = `${this.CACHE_PREFIX}:${id}`;
    const cached = await this.cacheService.get<PrescriptionResponseDto>(cacheKey);

    if (cached) {
      return cached;
    }

    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: this.getPrescriptionInclude(),
    });

    if (!prescription) {
      throw new NotFoundException('Prescrição não encontrada');
    }

    const response = this.mapToResponseDto(prescription);
    await this.cacheService.set(cacheKey, response, this.CACHE_TTL);

    return response;
  }

  async update(
    id: string,
    dto: UpdatePrescriptionDto,
    userId: string,
  ): Promise<PrescriptionResponseDto> {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
    });

    if (!prescription) {
      throw new NotFoundException('Prescrição não encontrada');
    }

    if (prescription.signedAt) {
      throw new BadRequestException('Não é possível editar prescrição assinada');
    }

    const updateData: Prisma.PrescriptionUpdateInput = {};

    if (dto.type) updateData.type = dto.type as any;
    if (dto.items) {
      // Verificar interações se itens mudaram
      const medications = dto.items.map((item) => item.medicationName);
      const interactions = await this.checkInteractionsInternal(
        medications,
        prescription.patientId,
      );

      updateData.items = dto.items.map((item, index) => ({
        id: crypto.randomUUID(),
        ...item,
        order: item.order ?? index,
      })) as any;
      updateData.interactions = interactions as any;
    }
    if (dto.diagnosis !== undefined) updateData.diagnosis = dto.diagnosis;
    if (dto.diagnosisCode !== undefined) updateData.diagnosisCode = dto.diagnosisCode;
    if (dto.generalInstructions !== undefined) updateData.generalInstructions = dto.generalInstructions;
    if (dto.internalNotes !== undefined) updateData.internalNotes = dto.internalNotes;
    if (dto.validityDays !== undefined) {
      updateData.validityDays = dto.validityDays;
      updateData.expiresAt = new Date(Date.now() + dto.validityDays * 24 * 60 * 60 * 1000);
    }

    const updated = await this.prisma.prescription.update({
      where: { id },
      data: updateData,
      include: this.getPrescriptionInclude(),
    });

    await this.cacheService.del(`${this.CACHE_PREFIX}:${id}`);

    // Auditoria
    await this.auditService.log({
      action: 'PRESCRIPTION_UPDATED',
      entityType: 'Prescription',
      entityId: id,
      userId,
      details: { changes: Object.keys(dto) },
    });

    return this.mapToResponseDto(updated);
  }

  async delete(id: string, userId: string): Promise<void> {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
    });

    if (!prescription) {
      throw new NotFoundException('Prescrição não encontrada');
    }

    if (prescription.signedAt) {
      throw new BadRequestException('Não é possível excluir prescrição assinada. Use cancelar.');
    }

    await this.prisma.prescription.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.cacheService.del(`${this.CACHE_PREFIX}:${id}`);
    await this.invalidateCache(prescription.patientId, prescription.doctorId, prescription.clinicId);

    await this.auditService.log({
      action: 'PRESCRIPTION_DELETED',
      entityType: 'Prescription',
      entityId: id,
      userId,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ASSINATURA, DISPENSAÇÃO E CANCELAMENTO
  // ═══════════════════════════════════════════════════════════════════════════════

  async sign(
    id: string,
    dto: SignPrescriptionDto,
    userId: string,
  ): Promise<PrescriptionResponseDto> {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: { doctor: { include: { user: true } } },
    });

    if (!prescription) {
      throw new NotFoundException('Prescrição não encontrada');
    }

    if (prescription.signedAt) {
      throw new BadRequestException('Prescrição já está assinada');
    }

    if (prescription.doctor.userId !== userId) {
      throw new ForbiddenException('Apenas o médico pode assinar a prescrição');
    }

    // Verificar interações não reconhecidas
    const interactions = prescription.interactions as any[];
    if (interactions && interactions.length > 0 && !prescription.interactionsAcknowledged) {
      if (!dto.confirmInteractions) {
        throw new BadRequestException('É necessário confirmar as interações medicamentosas');
      }
    }

    // Gerar hash de assinatura
    const dataToSign = JSON.stringify({
      prescriptionId: id,
      patientId: prescription.patientId,
      doctorId: prescription.doctorId,
      items: prescription.items,
      timestamp: new Date().toISOString(),
    });

    const signatureHash = crypto
      .createHash('sha256')
      .update(dataToSign)
      .digest('hex');

    const updated = await this.prisma.prescription.update({
      where: { id },
      data: {
        status: 'SIGNED' as any,
        signedAt: new Date(),
        signedById: userId,
        signatureHash,
        interactionsAcknowledged: true,
      },
      include: this.getPrescriptionInclude(),
    });

    await this.cacheService.del(`${this.CACHE_PREFIX}:${id}`);

    // Gerar documento PDF
    this.eventEmitter.emit('prescription.generateDocument', {
      prescriptionId: id,
    });

    // Auditoria
    await this.auditService.log({
      action: 'PRESCRIPTION_SIGNED',
      entityType: 'Prescription',
      entityId: id,
      userId,
      details: { signatureHash },
    });

    // Emitir evento
    this.eventEmitter.emit('prescription.signed', {
      prescriptionId: id,
      patientId: prescription.patientId,
      doctorId: prescription.doctorId,
    });

    return this.mapToResponseDto(updated);
  }

  async dispense(
    id: string,
    dto: DispensePrescriptionDto,
    userId: string,
  ): Promise<PrescriptionResponseDto> {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
    });

    if (!prescription) {
      throw new NotFoundException('Prescrição não encontrada');
    }

    if (!prescription.signedAt) {
      throw new BadRequestException('Prescrição não está assinada');
    }

    if (prescription.expiresAt && prescription.expiresAt < new Date()) {
      throw new BadRequestException('Prescrição expirada');
    }

    if (prescription.status === ('CANCELLED' as any)) {
      throw new BadRequestException('Prescrição cancelada');
    }

    // Verificar se já foi totalmente dispensada
    const items = prescription.items as any[];
    const existingDispenses = (prescription.dispenseRecords as any[]) || [];

    // Criar registro de dispensação
    const dispenseRecord = {
      id: crypto.randomUUID(),
      dispensedAt: new Date().toISOString(),
      pharmacyId: dto.pharmacyId,
      pharmacyName: dto.pharmacyName,
      pharmacistName: dto.pharmacistName,
      pharmacistCrf: dto.pharmacistCrf,
      items: dto.items.map((item) => {
        const prescriptionItem = items.find((i: any) => i.id === item.itemId);
        return {
          itemId: item.itemId,
          medicationName: prescriptionItem?.medicationName,
          quantityDispensed: item.quantityDispensed,
          batchNumber: item.batchNumber,
          expirationDate: item.expirationDate,
          notes: item.notes,
        };
      }),
      notes: dto.notes,
      dispensedById: userId,
    };

    // Verificar se todos os itens foram dispensados
    const allDispenses = [...existingDispenses, dispenseRecord];
    let isFullyDispensed = true;

    for (const item of items) {
      const totalDispensed = allDispenses.reduce((sum, d: any) => {
        const dispenseItem = d.items?.find((i: any) => i.itemId === item.id);
        return sum + (dispenseItem?.quantityDispensed || 0);
      }, 0);

      if (totalDispensed < (item.quantityToDispense || 0)) {
        isFullyDispensed = false;
        break;
      }
    }

    const updated = await this.prisma.prescription.update({
      where: { id },
      data: {
        status: isFullyDispensed ? ('DISPENSED' as any) : ('PARTIALLY_DISPENSED' as any),
        dispenseRecords: [...existingDispenses, dispenseRecord] as any,
      },
      include: this.getPrescriptionInclude(),
    });

    await this.cacheService.del(`${this.CACHE_PREFIX}:${id}`);

    // Auditoria
    await this.auditService.log({
      action: 'PRESCRIPTION_DISPENSED',
      entityType: 'Prescription',
      entityId: id,
      userId,
      details: {
        dispenseRecordId: dispenseRecord.id,
        itemsDispensed: dto.items.length,
        isFullyDispensed,
      },
    });

    // Emitir evento
    this.eventEmitter.emit('prescription.dispensed', {
      prescriptionId: id,
      patientId: prescription.patientId,
      dispenseRecord,
    });

    return this.mapToResponseDto(updated);
  }

  async cancel(
    id: string,
    dto: CancelPrescriptionDto,
    userId: string,
  ): Promise<void> {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: { patient: { include: { user: true } } },
    });

    if (!prescription) {
      throw new NotFoundException('Prescrição não encontrada');
    }

    if (prescription.status === ('DISPENSED' as any)) {
      throw new BadRequestException('Não é possível cancelar prescrição já dispensada');
    }

    await this.prisma.prescription.update({
      where: { id },
      data: {
        status: 'CANCELLED' as any,
        cancelledAt: new Date(),
        cancelledById: userId,
        cancellationReason: dto.reason,
      },
    });

    await this.cacheService.del(`${this.CACHE_PREFIX}:${id}`);

    // Notificar paciente
    if (dto.notifyPatient !== false) {
      this.eventEmitter.emit('notification.send', {
        type: 'PRESCRIPTION_CANCELLED',
        userId: prescription.patient.userId,
        data: {
          prescriptionId: id,
          reason: dto.reason,
        },
      });
    }

    // Auditoria
    await this.auditService.log({
      action: 'PRESCRIPTION_CANCELLED',
      entityType: 'Prescription',
      entityId: id,
      userId,
      details: { reason: dto.reason },
    });

    // Emitir evento
    this.eventEmitter.emit('prescription.cancelled', {
      prescriptionId: id,
      patientId: prescription.patientId,
      reason: dto.reason,
    });
  }

  async renew(
    id: string,
    dto: RenewPrescriptionDto,
    userId: string,
  ): Promise<PrescriptionResponseDto> {
    const original = await this.prisma.prescription.findUnique({
      where: { id },
      include: this.getPrescriptionInclude(),
    });

    if (!original) {
      throw new NotFoundException('Prescrição original não encontrada');
    }

    if (!original.signedAt) {
      throw new BadRequestException('Apenas prescrições assinadas podem ser renovadas');
    }

    // Filtrar itens se especificado
    let items = original.items as any[];
    if (dto.itemIds && dto.itemIds.length > 0) {
      items = items.filter((item: any) => dto.itemIds!.includes(item.id));
    }

    // Aplicar alterações se especificado
    if (dto.itemChanges && dto.itemChanges.length > 0) {
      items = dto.itemChanges.map((change, index) => ({
        id: crypto.randomUUID(),
        ...change,
        order: change.order ?? index,
      }));
    }

    const validityDays = dto.validityDays || original.validityDays;

    const newPrescription = await this.create(
      {
        patientId: original.patientId,
        doctorId: original.doctorId,
        clinicId: original.clinicId,
        type: original.type as PrescriptionType,
        items,
        diagnosis: original.diagnosis || undefined,
        diagnosisCode: original.diagnosisCode || undefined,
        generalInstructions: original.generalInstructions || undefined,
        validityDays,
        isRenewal: true,
        originalPrescriptionId: id,
        metadata: {
          ...(original.metadata as object || {}),
          renewedFrom: id,
          renewalNotes: dto.notes,
        },
      },
      userId,
    );

    // Auditoria
    await this.auditService.log({
      action: 'PRESCRIPTION_RENEWED',
      entityType: 'Prescription',
      entityId: newPrescription.id,
      userId,
      details: {
        originalPrescriptionId: id,
        notes: dto.notes,
      },
    });

    return newPrescription;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // BUSCA DE MEDICAMENTOS E INTERAÇÕES
  // ═══════════════════════════════════════════════════════════════════════════════

  async searchMedications(dto: MedicationSearchDto): Promise<MedicationSearchResponseDto> {
    const {
      search,
      searchCommercialName = true,
      searchActiveIngredient = true,
      genericOnly,
      therapeuticClass,
      limit = 20,
    } = dto;

    const where: Prisma.MedicationWhereInput = {
      OR: [],
    };

    if (searchCommercialName) {
      (where.OR as any[]).push({ name: { contains: search, mode: 'insensitive' } });
    }

    if (searchActiveIngredient) {
      (where.OR as any[]).push({ activeIngredient: { contains: search, mode: 'insensitive' } });
      (where.OR as any[]).push({ genericName: { contains: search, mode: 'insensitive' } });
    }

    if (genericOnly) {
      where.isGeneric = true;
    }

    if (therapeuticClass) {
      where.therapeuticClass = therapeuticClass;
    }

    const medications = await this.prisma.medication.findMany({
      where,
      take: limit,
      orderBy: { name: 'asc' },
    });

    return {
      results: medications.map((m) => ({
        id: m.id,
        name: m.name,
        genericName: m.genericName || undefined,
        activeIngredient: m.activeIngredient || undefined,
        concentration: m.concentration || undefined,
        pharmaceuticalForm: m.pharmaceuticalForm || undefined,
        manufacturer: m.manufacturer || undefined,
        therapeuticClass: m.therapeuticClass || undefined,
        isGeneric: m.isGeneric,
        requiresPrescription: m.requiresPrescription,
        controlledSubstanceClass: m.controlledSubstanceClass || undefined,
        presentationDescription: m.presentationDescription || undefined,
      })),
      total: medications.length,
    };
  }

  async checkInteractions(dto: CheckInteractionsDto): Promise<InteractionsCheckResponseDto> {
    const { medications, patientId, includeCurrentMedications = true } = dto;

    let allMedications = [...medications];

    // Incluir medicamentos atuais do paciente
    if (patientId && includeCurrentMedications) {
      const currentMeds = await this.getCurrentMedications(patientId);
      allMedications = [...allMedications, ...currentMeds.map((m) => m.medicationName)];
    }

    const interactions = await this.checkInteractionsInternal(allMedications);

    const criticalCount = interactions.filter(
      (i) => i.severity === InteractionSeverity.CONTRAINDICATED,
    ).length;
    const majorCount = interactions.filter(
      (i) => i.severity === InteractionSeverity.MAJOR,
    ).length;
    const moderateCount = interactions.filter(
      (i) => i.severity === InteractionSeverity.MODERATE,
    ).length;
    const minorCount = interactions.filter(
      (i) => i.severity === InteractionSeverity.MINOR,
    ).length;

    return {
      hasInteractions: interactions.length > 0,
      totalInteractions: interactions.length,
      criticalCount,
      majorCount,
      moderateCount,
      minorCount,
      interactions: interactions.map((i) => ({
        drug1: i.drug1,
        drug2: i.drug2,
        severity: i.severity,
        description: i.description,
        recommendation: i.recommendation,
        acknowledged: false,
      })),
      recommendations: interactions
        .filter((i) => i.recommendation)
        .map((i) => i.recommendation!),
      requiresAcknowledgement: criticalCount > 0 || majorCount > 0,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // MEDICAMENTOS DO PACIENTE
  // ═══════════════════════════════════════════════════════════════════════════════

  async getPatientMedications(
    patientId: string,
    query: PatientPrescriptionsQueryDto,
  ): Promise<PatientMedicationsResponseDto> {
    const {
      activeOnly = true,
      includeCurrentMedications = true,
      periodDays = 365,
      page = 1,
      limit = 20,
    } = query;

    // Verificar paciente
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado');
    }

    // Buscar prescrições recentes
    const where: Prisma.PrescriptionWhereInput = {
      patientId,
      deletedAt: null,
      createdAt: { gte: new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000) },
    };

    if (activeOnly) {
      where.status = { notIn: ['CANCELLED', 'EXPIRED'] as any[] };
      where.expiresAt = { gt: new Date() };
    }

    const skip = (page - 1) * limit;

    const [prescriptions, total] = await Promise.all([
      this.prisma.prescription.findMany({
        where,
        include: this.getPrescriptionInclude(),
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.prescription.count({ where }),
    ]);

    // Coletar medicamentos atuais
    const currentMedications = includeCurrentMedications
      ? await this.getCurrentMedications(patientId)
      : [];

    // Buscar alergias do paciente
    const latestConsultation = await this.prisma.consultation.findFirst({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });

    const allergies = (latestConsultation?.anamnesis as any)?.allergies || [];

    return {
      currentMedications,
      recentPrescriptions: prescriptions.map((p) => this.mapToResponseDto(p)),
      allergies,
      total,
    };
  }

  private async getCurrentMedications(patientId: string): Promise<any[]> {
    // Buscar prescrições ativas e não expiradas
    const activePrescriptions = await this.prisma.prescription.findMany({
      where: {
        patientId,
        status: { in: ['SIGNED', 'DISPENSED', 'PARTIALLY_DISPENSED'] as any[] },
        expiresAt: { gt: new Date() },
        deletedAt: null,
      },
      include: {
        doctor: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const medicationsMap = new Map<string, any>();

    for (const prescription of activePrescriptions) {
      const items = prescription.items as any[];
      for (const item of items) {
        // Verificar se o medicamento ainda está em uso
        const endDate = item.duration?.endDate
          ? new Date(item.duration.endDate)
          : null;

        if (item.isContinuous || !endDate || endDate > new Date()) {
          if (!medicationsMap.has(item.medicationName)) {
            medicationsMap.set(item.medicationName, {
              medicationName: item.medicationName,
              genericName: item.genericName,
              concentration: item.concentration,
              dosage: `${item.dosage.quantity} ${item.dosage.unit}`,
              frequency: `${item.frequency.value}x ${item.frequency.unit}`,
              route: item.route,
              isContinuous: item.isContinuous,
              startDate: item.duration?.startDate
                ? new Date(item.duration.startDate)
                : prescription.createdAt,
              endDate,
              prescribedBy: `Dr(a). ${prescription.doctor.user.firstName} ${prescription.doctor.user.lastName}`,
              prescriptionId: prescription.id,
            });
          }
        }
      }
    }

    return Array.from(medicationsMap.values());
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ESTATÍSTICAS
  // ═══════════════════════════════════════════════════════════════════════════════

  async getStats(query: PrescriptionStatsQueryDto): Promise<PrescriptionStatsResponseDto> {
    const {
      clinicId,
      doctorId,
      startDate,
      endDate,
      groupBy = 'day',
      includeTopMedications = true,
      topMedicationsLimit = 10,
    } = query;

    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate ? new Date(endDate) : now;

    const where: Prisma.PrescriptionWhereInput = {
      createdAt: { gte: start, lte: end },
      deletedAt: null,
    };

    if (clinicId) where.clinicId = clinicId;
    if (doctorId) where.doctorId = doctorId;

    const prescriptions = await this.prisma.prescription.findMany({
      where,
      include: {
        doctor: { include: { user: true } },
      },
    });

    const total = prescriptions.length;
    const signed = prescriptions.filter((p) => p.signedAt).length;
    const dispensed = prescriptions.filter(
      (p) => p.status === 'DISPENSED' || p.status === 'PARTIALLY_DISPENSED',
    ).length;
    const cancelled = prescriptions.filter((p) => p.status === 'CANCELLED').length;
    const expired = prescriptions.filter(
      (p) => p.status === 'EXPIRED' || (p.expiresAt && p.expiresAt < now),
    ).length;
    const renewals = prescriptions.filter((p) => p.isRenewal).length;

    // Por tipo
    const byType: Record<string, number> = {};
    for (const p of prescriptions) {
      byType[p.type] = (byType[p.type] || 0) + 1;
    }

    // Por status
    const byStatus: Record<string, number> = {};
    for (const p of prescriptions) {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    }

    // Por médico
    const byDoctorMap = new Map<string, { doctorName: string; total: number; signed: number }>();
    for (const p of prescriptions) {
      const existing = byDoctorMap.get(p.doctorId) || {
        doctorName: `${p.doctor.user.firstName} ${p.doctor.user.lastName}`,
        total: 0,
        signed: 0,
      };
      existing.total++;
      if (p.signedAt) existing.signed++;
      byDoctorMap.set(p.doctorId, existing);
    }

    const byDoctor = Array.from(byDoctorMap.entries()).map(([doctorId, stats]) => ({
      doctorId,
      ...stats,
    }));

    // Top medicamentos
    let topMedications;
    if (includeTopMedications) {
      const medicationCounts = new Map<string, number>();

      for (const p of prescriptions) {
        const items = p.items as any[];
        for (const item of items) {
          const count = medicationCounts.get(item.medicationName) || 0;
          medicationCounts.set(item.medicationName, count + 1);
        }
      }

      topMedications = Array.from(medicationCounts.entries())
        .map(([name, count]) => ({
          name,
          count,
          percentage: total > 0 ? (count / total) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, topMedicationsLimit);
    }

    // Média de itens por prescrição
    const totalItems = prescriptions.reduce((sum, p) => sum + (p.items as any[]).length, 0);
    const averageItemsPerPrescription = total > 0 ? totalItems / total : 0;

    // Taxa de alertas de interação
    const withInteractions = prescriptions.filter(
      (p) => (p.interactions as any[])?.length > 0,
    ).length;
    const interactionAlertRate = total > 0 ? (withInteractions / total) * 100 : 0;

    // Percentual de controlados
    const controlledCount = prescriptions.filter(
      (p) => p.type !== 'SIMPLE',
    ).length;
    const controlledSubstancePercentage = total > 0 ? (controlledCount / total) * 100 : 0;

    return {
      totalPrescriptions: total,
      signedPrescriptions: signed,
      dispensedPrescriptions: dispensed,
      cancelledPrescriptions: cancelled,
      expiredPrescriptions: expired,
      renewalPrescriptions: renewals,
      byType,
      byStatus,
      byDoctor,
      topMedications,
      averageItemsPerPrescription,
      interactionAlertRate,
      controlledSubstancePercentage,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // GERAÇÃO DE DOCUMENTO
  // ═══════════════════════════════════════════════════════════════════════════════

  async generateDocument(id: string, userId: string): Promise<PrescriptionDocumentResponseDto> {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: this.getPrescriptionInclude(),
    });

    if (!prescription) {
      throw new NotFoundException('Prescrição não encontrada');
    }

    if (!prescription.signedAt) {
      throw new BadRequestException('Prescrição não está assinada');
    }

    // Emitir evento para geração do PDF
    this.eventEmitter.emit('prescription.generateDocument', {
      prescriptionId: id,
      format: 'PDF',
    });

    // Auditoria
    await this.auditService.log({
      action: 'PRESCRIPTION_DOCUMENT_GENERATED',
      entityType: 'Prescription',
      entityId: id,
      userId,
    });

    return {
      success: true,
      format: 'PDF',
      // TODO: Implementar geração real e retornar URL
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // MÉTODOS AUXILIARES PRIVADOS
  // ═══════════════════════════════════════════════════════════════════════════════

  private async checkInteractionsInternal(
    medications: string[],
    patientId?: string,
  ): Promise<any[]> {
    // TODO: Implementar verificação real de interações com base de dados
    // Por enquanto, retorna array vazio
    // Em produção, deveria consultar uma base de dados de interações medicamentosas

    const interactions: any[] = [];

    // Buscar interações no banco de dados
    for (let i = 0; i < medications.length; i++) {
      for (let j = i + 1; j < medications.length; j++) {
        const interaction = await this.prisma.drugInteraction.findFirst({
          where: {
            OR: [
              { drug1: { contains: medications[i], mode: 'insensitive' }, drug2: { contains: medications[j], mode: 'insensitive' } },
              { drug1: { contains: medications[j], mode: 'insensitive' }, drug2: { contains: medications[i], mode: 'insensitive' } },
            ],
          },
        });

        if (interaction) {
          interactions.push({
            drug1: medications[i],
            drug2: medications[j],
            severity: interaction.severity,
            description: interaction.description,
            recommendation: interaction.recommendation,
          });
        }
      }
    }

    return interactions;
  }

  private getDefaultValidityDays(type: PrescriptionType): number {
    switch (type) {
      case PrescriptionType.SPECIAL_YELLOW:
      case PrescriptionType.SPECIAL_BLUE:
        return 30;
      case PrescriptionType.ANTIMICROBIAL:
        return 10;
      case PrescriptionType.SPECIAL_CONTROL:
      case PrescriptionType.SPECIAL_WHITE:
        return 30;
      default:
        return 60;
    }
  }

  private getPrescriptionInclude() {
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
    };
  }

  private mapToResponseDto(prescription: any): PrescriptionResponseDto {
    const items = prescription.items as any[];

    return {
      id: prescription.id,
      patient: {
        id: prescription.patient.id,
        fullName: `${prescription.patient.user.firstName} ${prescription.patient.user.lastName}`,
        cpf: prescription.patient.cpf,
        email: prescription.patient.user.email,
        phone: prescription.patient.user.phone,
        avatarUrl: prescription.patient.user.avatarUrl,
        birthDate: prescription.patient.birthDate,
        age: prescription.patient.birthDate
          ? Math.floor(
              (Date.now() - prescription.patient.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
            )
          : undefined,
      },
      doctor: {
        id: prescription.doctor.id,
        fullName: `Dr(a). ${prescription.doctor.user.firstName} ${prescription.doctor.user.lastName}`,
        crm: prescription.doctor.crm,
        crmState: prescription.doctor.crmState,
        specialty: prescription.doctor.specialties?.[0]?.specialty?.name,
        email: prescription.doctor.user.email,
        avatarUrl: prescription.doctor.user.avatarUrl,
      },
      clinic: {
        id: prescription.clinic.id,
        name: prescription.clinic.name,
        cnpj: prescription.clinic.cnpj,
        address: prescription.clinic.address
          ? `${(prescription.clinic.address as any).street}, ${(prescription.clinic.address as any).number}`
          : undefined,
        phone: prescription.clinic.phone,
      },
      consultationId: prescription.consultationId,
      appointmentId: prescription.appointmentId,
      type: prescription.type as PrescriptionType,
      status: prescription.status as PrescriptionStatus,
      items: items.map((item: any) => ({
        id: item.id,
        medicationId: item.medicationId,
        medicationName: item.medicationName,
        genericName: item.genericName,
        activeIngredient: item.activeIngredient,
        concentration: item.concentration,
        pharmaceuticalForm: item.pharmaceuticalForm,
        manufacturer: item.manufacturer,
        dosage: {
          quantity: item.dosage.quantity,
          unit: item.dosage.unit,
          formatted: `${item.dosage.quantity} ${item.dosage.unit}`,
        },
        route: item.route,
        frequency: {
          value: item.frequency.value,
          unit: item.frequency.unit,
          specificTimes: item.frequency.specificTimes,
          instructions: item.frequency.instructions,
          formatted: `${item.frequency.value}x ${item.frequency.unit}`,
        },
        duration: {
          value: item.duration.value,
          unit: item.duration.unit,
          startDate: item.duration.startDate ? new Date(item.duration.startDate) : undefined,
          endDate: item.duration.endDate ? new Date(item.duration.endDate) : undefined,
          formatted: `${item.duration.value} ${item.duration.unit}`,
        },
        quantityToDispense: item.quantityToDispense,
        dispenseUnit: item.dispenseUnit,
        instructions: item.instructions,
        withFood: item.withFood || false,
        isContinuous: item.isContinuous || false,
        asNeeded: item.asNeeded || false,
        asNeededCondition: item.asNeededCondition,
        allowGeneric: item.allowGeneric !== false,
        order: item.order,
        notes: item.notes,
      })),
      diagnosis: prescription.diagnosis,
      diagnosisCode: prescription.diagnosisCode,
      generalInstructions: prescription.generalInstructions,
      internalNotes: prescription.internalNotes,
      validityDays: prescription.validityDays,
      expiresAt: prescription.expiresAt,
      isExpired: prescription.expiresAt ? prescription.expiresAt < new Date() : false,
      copies: prescription.copies,
      isRenewal: prescription.isRenewal,
      originalPrescriptionId: prescription.originalPrescriptionId,
      interactions: prescription.interactions,
      interactionsAcknowledged: prescription.interactionsAcknowledged,
      interactionAcknowledgementReason: prescription.interactionAcknowledgementReason,
      dispenseRecords: prescription.dispenseRecords,
      signedAt: prescription.signedAt,
      signatureHash: prescription.signatureHash,
      cancelledAt: prescription.cancelledAt,
      cancellationReason: prescription.cancellationReason,
      documentUrl: prescription.documentUrl,
      qrCodeUrl: prescription.qrCodeUrl,
      createdAt: prescription.createdAt,
      updatedAt: prescription.updatedAt,
      createdBy: prescription.createdById,
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
