import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/database/prisma.service';
import { CacheService } from '@/common/services/cache.service';
import { AuditService } from '@/common/services/audit.service';
import { UserRole } from '@/common/enums/user-role.enum';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';

import {
  CreateLabOrderDto,
  UpdateLabOrderDto,
  ScheduleCollectionDto,
  RegisterSampleCollectionDto,
  RegisterLabResultDto,
  ValidateResultDto,
  RejectSampleDto,
  ExternalLabOrderDto,
  AddTestToOrderDto,
  CancelTestDto,
  LabOrderStatus,
  LabOrderPriority,
} from './dto/create-lab-order.dto';
import {
  LabOrderQueryDto,
  LabResultQueryDto,
  LabTestCatalogQueryDto,
  PatientLabHistoryQueryDto,
  CollectionScheduleQueryDto,
  WorklistQueryDto,
  CriticalValuesQueryDto,
  LabStatisticsQueryDto,
} from './dto/lab-query.dto';

@Injectable()
export class LaboratoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ==================== CRUD de Pedidos de Exame ====================

  async createLabOrder(dto: CreateLabOrderDto, requesterId: string, requesterRole: UserRole) {
    // Verificar paciente
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId, deletedAt: null },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado');
    }

    // Verificar médico solicitante
    let requestingDoctor = null;
    if (dto.requestingDoctorId) {
      requestingDoctor = await this.prisma.doctor.findUnique({
        where: { id: dto.requestingDoctorId, deletedAt: null },
      });

      if (!requestingDoctor) {
        throw new NotFoundException('Médico solicitante não encontrado');
      }
    }

    // Verificar consulta relacionada
    if (dto.consultationId) {
      const consultation = await this.prisma.consultation.findUnique({
        where: { id: dto.consultationId },
      });

      if (!consultation) {
        throw new NotFoundException('Consulta não encontrada');
      }

      if (consultation.patientId !== dto.patientId) {
        throw new BadRequestException('Consulta não pertence ao paciente informado');
      }
    }

    // Verificar clínica
    if (dto.clinicId) {
      const clinic = await this.prisma.clinic.findUnique({
        where: { id: dto.clinicId, deletedAt: null },
      });

      if (!clinic) {
        throw new NotFoundException('Clínica/Laboratório não encontrado');
      }
    }

    // Gerar número do pedido
    const orderNumber = await this.generateOrderNumber();

    // Validar exames solicitados
    await this.validateTests(dto.tests);

    // Calcular requisitos de preparo consolidados
    const preparationRequirements = this.consolidatePreparationRequirements(dto.tests);

    // Criar pedido de exame
    const labOrder = await this.prisma.labOrder.create({
      data: {
        orderNumber,
        patientId: dto.patientId,
        consultationId: dto.consultationId,
        requestingDoctorId: dto.requestingDoctorId,
        clinicId: dto.clinicId,
        externalLabId: dto.externalLabId,
        priority: dto.priority,
        status: LabOrderStatus.PENDING,
        diagnosticHypothesis: dto.diagnosticHypothesis,
        clinicalIndication: dto.clinicalIndication,
        labNotes: dto.labNotes,
        preferredCollectionDate: dto.preferredCollectionDate
          ? new Date(dto.preferredCollectionDate)
          : null,
        homeCollection: dto.homeCollection || false,
        homeCollectionAddress: dto.homeCollectionAddress,
        currentMedications: dto.currentMedications,
        relevantClinicalInfo: dto.relevantClinicalInfo,
        isUrgent: dto.isUrgent || dto.priority === LabOrderPriority.STAT,
        insuranceAuthCode: dto.insuranceAuthCode,
        insuranceGuideNumber: dto.insuranceGuideNumber,
        preparationRequirements,
        tests: {
          create: dto.tests.map((test, index) => ({
            testCode: test.testCode,
            testName: test.testName,
            popularName: test.popularName,
            sampleType: test.sampleType,
            requiredVolume: test.requiredVolume,
            collectionMaterial: test.collectionMaterial,
            fastingRequirement: test.fastingRequirement,
            specialInstructions: test.specialInstructions,
            estimatedTurnaround: test.estimatedTurnaround,
            clinicalIndication: test.clinicalIndication,
            analysisMethod: test.analysisMethod,
            quantity: test.quantity || 1,
            sequenceNumber: index + 1,
            status: 'PENDING',
          })),
        },
        createdById: requesterId,
      },
      include: this.getLabOrderIncludes(),
    });

    // Registrar auditoria
    await this.auditService.log({
      action: 'LAB_ORDER_CREATED',
      entityType: 'LabOrder',
      entityId: labOrder.id,
      userId: requesterId,
      details: {
        orderNumber,
        patientId: dto.patientId,
        testsCount: dto.tests.length,
        priority: dto.priority,
        isUrgent: dto.isUrgent,
      },
    });

    // Emitir eventos
    this.eventEmitter.emit('labOrder.created', {
      labOrder,
      isUrgent: dto.isUrgent || dto.priority === LabOrderPriority.STAT,
    });

    // Se urgente, emitir evento específico
    if (dto.isUrgent || dto.priority === LabOrderPriority.STAT) {
      this.eventEmitter.emit('labOrder.urgent', {
        labOrder,
        patient,
        requestingDoctor,
      });
    }

    // Notificar paciente sobre instruções de preparo
    this.eventEmitter.emit('notification.send', {
      type: 'LAB_ORDER_CREATED',
      recipientId: patient.userId,
      data: {
        orderNumber,
        testsCount: dto.tests.length,
        preparationRequirements,
      },
    });

    // Invalidar cache
    await this.invalidatePatientLabCache(dto.patientId);

    return this.formatLabOrderResponse(labOrder);
  }

  async findAllLabOrders(query: LabOrderQueryDto, requesterId: string, requesterRole: UserRole) {
    const {
      page = 1,
      limit = 20,
      patientId,
      requestingDoctorId,
      clinicId,
      consultationId,
      status,
      statuses,
      priority,
      startDate,
      endDate,
      collectionStartDate,
      collectionEndDate,
      isUrgent,
      hasCriticalValues,
      pendingCollection,
      pendingResults,
      homeCollection,
      testSearch,
      tubeBarcode,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeCancelled = false,
    } = query;

    const where: Prisma.LabOrderWhereInput = {
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
        where.requestingDoctorId = doctor.id;
      }
    }

    // Aplicar filtros
    if (patientId) where.patientId = patientId;
    if (requestingDoctorId) where.requestingDoctorId = requestingDoctorId;
    if (clinicId) where.clinicId = clinicId;
    if (consultationId) where.consultationId = consultationId;
    if (status) where.status = status;
    if (statuses && statuses.length > 0) {
      where.status = { in: statuses };
    }
    if (priority) where.priority = priority;
    if (isUrgent !== undefined) where.isUrgent = isUrgent;
    if (hasCriticalValues !== undefined) where.hasCriticalValues = hasCriticalValues;
    if (homeCollection !== undefined) where.homeCollection = homeCollection;

    if (!includeCancelled) {
      where.status = where.status || { not: LabOrderStatus.CANCELLED };
    }

    // Filtros de data
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (collectionStartDate || collectionEndDate) {
      where.scheduledCollectionDate = {};
      if (collectionStartDate) where.scheduledCollectionDate.gte = new Date(collectionStartDate);
      if (collectionEndDate) where.scheduledCollectionDate.lte = new Date(collectionEndDate);
    }

    // Filtros especiais
    if (pendingCollection) {
      where.status = { in: [LabOrderStatus.PENDING, LabOrderStatus.SCHEDULED] };
    }

    if (pendingResults) {
      where.status = { in: [LabOrderStatus.SAMPLE_COLLECTED, LabOrderStatus.IN_ANALYSIS, LabOrderStatus.PARTIAL_RESULTS] };
    }

    // Busca por exame
    if (testSearch) {
      where.tests = {
        some: {
          OR: [
            { testCode: { contains: testSearch, mode: 'insensitive' } },
            { testName: { contains: testSearch, mode: 'insensitive' } },
            { popularName: { contains: testSearch, mode: 'insensitive' } },
          ],
        },
      };
    }

    // Busca por código de barras
    if (tubeBarcode) {
      where.samples = {
        some: {
          tubeBarcode: { contains: tubeBarcode, mode: 'insensitive' },
        },
      };
    }

    // Ordenação
    const orderBy: Prisma.LabOrderOrderByWithRelationInput = {};
    if (sortBy === 'priority') {
      orderBy.priority = sortOrder;
    } else if (sortBy === 'status') {
      orderBy.status = sortOrder;
    } else if (sortBy === 'patientName') {
      orderBy.patient = { fullName: sortOrder };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    const [data, total] = await Promise.all([
      this.prisma.labOrder.findMany({
        where,
        include: this.getLabOrderIncludes(),
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.labOrder.count({ where }),
    ]);

    // Calcular resumo
    const summary = await this.calculateOrdersSummary(where);

    return {
      data: data.map(order => this.formatLabOrderResponse(order)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary,
    };
  }

  async findLabOrderById(id: string, requesterId: string, requesterRole: UserRole) {
    const labOrder = await this.prisma.labOrder.findUnique({
      where: { id, deletedAt: null },
      include: this.getLabOrderIncludes(),
    });

    if (!labOrder) {
      throw new NotFoundException('Pedido de exame não encontrado');
    }

    // Verificar acesso
    await this.verifyLabOrderAccess(labOrder, requesterId, requesterRole);

    return this.formatLabOrderResponse(labOrder);
  }

  async updateLabOrder(id: string, dto: UpdateLabOrderDto, requesterId: string, requesterRole: UserRole) {
    const labOrder = await this.prisma.labOrder.findUnique({
      where: { id, deletedAt: null },
    });

    if (!labOrder) {
      throw new NotFoundException('Pedido de exame não encontrado');
    }

    // Verificar permissão de edição
    await this.verifyLabOrderAccess(labOrder, requesterId, requesterRole, true);

    // Verificar status permite edição
    const editableStatuses = [LabOrderStatus.PENDING, LabOrderStatus.SCHEDULED];
    if (!editableStatuses.includes(labOrder.status as LabOrderStatus)) {
      throw new BadRequestException(
        'Pedido não pode ser editado no status atual. Apenas pedidos pendentes ou agendados podem ser editados.',
      );
    }

    const updated = await this.prisma.labOrder.update({
      where: { id },
      data: {
        priority: dto.priority,
        labNotes: dto.labNotes,
        preferredCollectionDate: dto.preferredCollectionDate
          ? new Date(dto.preferredCollectionDate)
          : undefined,
        insuranceAuthCode: dto.insuranceAuthCode,
        insuranceGuideNumber: dto.insuranceGuideNumber,
        isUrgent: dto.priority === LabOrderPriority.STAT ? true : undefined,
      },
      include: this.getLabOrderIncludes(),
    });

    // Auditoria
    await this.auditService.log({
      action: 'LAB_ORDER_UPDATED',
      entityType: 'LabOrder',
      entityId: id,
      userId: requesterId,
      details: dto,
    });

    await this.invalidatePatientLabCache(labOrder.patientId);

    return this.formatLabOrderResponse(updated);
  }

  async cancelLabOrder(id: string, reason: string, requesterId: string, requesterRole: UserRole) {
    const labOrder = await this.prisma.labOrder.findUnique({
      where: { id, deletedAt: null },
      include: { patient: true },
    });

    if (!labOrder) {
      throw new NotFoundException('Pedido de exame não encontrado');
    }

    await this.verifyLabOrderAccess(labOrder, requesterId, requesterRole, true);

    // Verificar se pode ser cancelado
    const cancellableStatuses = [
      LabOrderStatus.PENDING,
      LabOrderStatus.SCHEDULED,
    ];

    if (!cancellableStatuses.includes(labOrder.status as LabOrderStatus)) {
      throw new BadRequestException(
        'Pedido não pode ser cancelado. Apenas pedidos pendentes ou agendados podem ser cancelados.',
      );
    }

    const updated = await this.prisma.labOrder.update({
      where: { id },
      data: {
        status: LabOrderStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: reason,
        cancelledById: requesterId,
      },
      include: this.getLabOrderIncludes(),
    });

    // Auditoria
    await this.auditService.log({
      action: 'LAB_ORDER_CANCELLED',
      entityType: 'LabOrder',
      entityId: id,
      userId: requesterId,
      details: { reason },
    });

    // Eventos
    this.eventEmitter.emit('labOrder.cancelled', { labOrder: updated, reason });

    // Notificar paciente
    this.eventEmitter.emit('notification.send', {
      type: 'LAB_ORDER_CANCELLED',
      recipientId: labOrder.patient.userId,
      data: {
        orderNumber: labOrder.orderNumber,
        reason,
      },
    });

    await this.invalidatePatientLabCache(labOrder.patientId);

    return this.formatLabOrderResponse(updated);
  }

  // ==================== Agendamento de Coleta ====================

  async scheduleCollection(dto: ScheduleCollectionDto, requesterId: string, requesterRole: UserRole) {
    const labOrder = await this.prisma.labOrder.findUnique({
      where: { id: dto.labOrderId, deletedAt: null },
      include: { patient: true, tests: true },
    });

    if (!labOrder) {
      throw new NotFoundException('Pedido de exame não encontrado');
    }

    // Verificar status
    if (labOrder.status !== LabOrderStatus.PENDING) {
      throw new BadRequestException('Apenas pedidos pendentes podem ser agendados para coleta');
    }

    const scheduledDateTime = new Date(dto.scheduledDateTime);

    // Verificar se data é futura
    if (scheduledDateTime <= new Date()) {
      throw new BadRequestException('Data de agendamento deve ser futura');
    }

    // Verificar disponibilidade do coletor se informado
    if (dto.collectorId) {
      const hasConflict = await this.checkCollectorAvailability(
        dto.collectorId,
        scheduledDateTime,
      );

      if (hasConflict) {
        throw new ConflictException('Coletor não disponível no horário informado');
      }
    }

    const updated = await this.prisma.labOrder.update({
      where: { id: dto.labOrderId },
      data: {
        status: LabOrderStatus.SCHEDULED,
        scheduledCollectionDate: scheduledDateTime,
        collectorId: dto.collectorId,
        collectionLocation: dto.collectionLocation,
        homeCollection: dto.isHomeCollection,
        homeCollectionAddress: dto.isHomeCollection ? dto.homeAddress : undefined,
        collectionNotes: dto.notes,
      },
      include: this.getLabOrderIncludes(),
    });

    // Criar registro de agendamento
    await this.prisma.labCollectionSchedule.create({
      data: {
        labOrderId: dto.labOrderId,
        scheduledDateTime,
        collectorId: dto.collectorId,
        location: dto.isHomeCollection ? dto.homeAddress : dto.collectionLocation,
        isHomeCollection: dto.isHomeCollection || false,
        preparationInstructionsSent: dto.preparationInstructionsSent || false,
        notes: dto.notes,
        createdById: requesterId,
      },
    });

    // Auditoria
    await this.auditService.log({
      action: 'LAB_COLLECTION_SCHEDULED',
      entityType: 'LabOrder',
      entityId: dto.labOrderId,
      userId: requesterId,
      details: {
        scheduledDateTime,
        isHomeCollection: dto.isHomeCollection,
      },
    });

    // Notificar paciente
    this.eventEmitter.emit('notification.send', {
      type: 'LAB_COLLECTION_SCHEDULED',
      recipientId: labOrder.patient.userId,
      data: {
        orderNumber: labOrder.orderNumber,
        scheduledDateTime,
        location: dto.isHomeCollection ? 'Coleta domiciliar' : dto.collectionLocation,
        preparationInstructions: labOrder.preparationRequirements,
      },
    });

    // Agendar lembrete para o paciente (24h antes)
    this.eventEmitter.emit('notification.schedule', {
      type: 'LAB_COLLECTION_REMINDER',
      recipientId: labOrder.patient.userId,
      scheduledFor: new Date(scheduledDateTime.getTime() - 24 * 60 * 60 * 1000),
      data: {
        orderNumber: labOrder.orderNumber,
        scheduledDateTime,
        preparationInstructions: labOrder.preparationRequirements,
      },
    });

    await this.invalidatePatientLabCache(labOrder.patientId);

    return this.formatLabOrderResponse(updated);
  }

  async rescheduleCollection(labOrderId: string, newDateTime: string, reason: string, requesterId: string) {
    const labOrder = await this.prisma.labOrder.findUnique({
      where: { id: labOrderId, deletedAt: null },
      include: { patient: true },
    });

    if (!labOrder) {
      throw new NotFoundException('Pedido de exame não encontrado');
    }

    if (labOrder.status !== LabOrderStatus.SCHEDULED) {
      throw new BadRequestException('Apenas pedidos agendados podem ser reagendados');
    }

    const updated = await this.prisma.labOrder.update({
      where: { id: labOrderId },
      data: {
        scheduledCollectionDate: new Date(newDateTime),
      },
      include: this.getLabOrderIncludes(),
    });

    // Registrar histórico de reagendamento
    await this.prisma.labCollectionSchedule.create({
      data: {
        labOrderId,
        scheduledDateTime: new Date(newDateTime),
        collectorId: labOrder.collectorId,
        notes: `Reagendado. Motivo: ${reason}`,
        createdById: requesterId,
      },
    });

    // Notificar paciente
    this.eventEmitter.emit('notification.send', {
      type: 'LAB_COLLECTION_RESCHEDULED',
      recipientId: labOrder.patient.userId,
      data: {
        orderNumber: labOrder.orderNumber,
        newDateTime: new Date(newDateTime),
        reason,
      },
    });

    await this.auditService.log({
      action: 'LAB_COLLECTION_RESCHEDULED',
      entityType: 'LabOrder',
      entityId: labOrderId,
      userId: requesterId,
      details: { newDateTime, reason },
    });

    return this.formatLabOrderResponse(updated);
  }

  // ==================== Registro de Coleta ====================

  async registerSampleCollection(dto: RegisterSampleCollectionDto, requesterId: string) {
    const labOrder = await this.prisma.labOrder.findUnique({
      where: { id: dto.labOrderId, deletedAt: null },
      include: { tests: true, patient: true },
    });

    if (!labOrder) {
      throw new NotFoundException('Pedido de exame não encontrado');
    }

    // Verificar status
    const validStatuses = [LabOrderStatus.PENDING, LabOrderStatus.SCHEDULED];
    if (!validStatuses.includes(labOrder.status as LabOrderStatus)) {
      throw new BadRequestException('Pedido não está em status válido para registro de coleta');
    }

    // Verificar se todos os exames têm amostra correspondente
    const testCodes = labOrder.tests.map(t => t.testCode);
    const sampleCodes = dto.samples.map(s => s.testCode);

    const missingTests = testCodes.filter(code => !sampleCodes.includes(code));
    if (missingTests.length > 0) {
      // Permitir coleta parcial, mas registrar
      console.warn(`Coleta parcial: exames sem amostra: ${missingTests.join(', ')}`);
    }

    // Criar registros de amostras coletadas
    await this.prisma.$transaction(async (tx) => {
      // Registrar cada amostra
      for (const sample of dto.samples) {
        // Verificar código de barras único
        const existingBarcode = await tx.labSample.findFirst({
          where: { tubeBarcode: sample.tubeBarcode },
        });

        if (existingBarcode) {
          throw new ConflictException(`Código de barras já utilizado: ${sample.tubeBarcode}`);
        }

        await tx.labSample.create({
          data: {
            labOrderId: dto.labOrderId,
            testCode: sample.testCode,
            sampleType: sample.sampleType,
            tubeBarcode: sample.tubeBarcode,
            volumeCollected: sample.volumeCollected,
            sampleQuality: sample.sampleQuality || 'ADEQUATE',
            collectedAt: new Date(dto.collectionDateTime),
            collectorId: dto.collectorId,
            notes: sample.notes,
            patientFasting: dto.patientFasting,
            fastingHours: dto.fastingHours,
          },
        });

        // Atualizar status do teste
        await tx.labOrderTest.updateMany({
          where: {
            labOrderId: dto.labOrderId,
            testCode: sample.testCode,
          },
          data: {
            status: 'SAMPLE_COLLECTED',
            collectedAt: new Date(dto.collectionDateTime),
            tubeBarcode: sample.tubeBarcode,
          },
        });
      }

      // Atualizar status do pedido
      await tx.labOrder.update({
        where: { id: dto.labOrderId },
        data: {
          status: LabOrderStatus.SAMPLE_COLLECTED,
          actualCollectionDate: new Date(dto.collectionDateTime),
          collectorId: dto.collectorId,
          collectionNotes: dto.collectionNotes,
          collectionComplications: dto.complications,
        },
      });
    });

    // Buscar pedido atualizado
    const updated = await this.prisma.labOrder.findUnique({
      where: { id: dto.labOrderId },
      include: this.getLabOrderIncludes(),
    });

    // Auditoria
    await this.auditService.log({
      action: 'LAB_SAMPLE_COLLECTED',
      entityType: 'LabOrder',
      entityId: dto.labOrderId,
      userId: requesterId,
      details: {
        collectorId: dto.collectorId,
        samplesCount: dto.samples.length,
        patientFasting: dto.patientFasting,
        fastingHours: dto.fastingHours,
      },
    });

    // Evento
    this.eventEmitter.emit('labOrder.sampleCollected', {
      labOrder: updated,
      samples: dto.samples,
    });

    await this.invalidatePatientLabCache(labOrder.patientId);

    return this.formatLabOrderResponse(updated);
  }

  // ==================== Registro de Resultados ====================

  async registerLabResult(dto: RegisterLabResultDto, requesterId: string) {
    const labOrder = await this.prisma.labOrder.findUnique({
      where: { id: dto.labOrderId, deletedAt: null },
      include: {
        tests: true,
        patient: true,
        requestingDoctor: true,
      },
    });

    if (!labOrder) {
      throw new NotFoundException('Pedido de exame não encontrado');
    }

    // Verificar se teste existe no pedido
    const test = labOrder.tests.find(t => t.testCode === dto.testCode);
    if (!test) {
      throw new BadRequestException(`Exame ${dto.testCode} não encontrado no pedido`);
    }

    // Verificar status do pedido
    const validStatuses = [
      LabOrderStatus.SAMPLE_COLLECTED,
      LabOrderStatus.IN_ANALYSIS,
      LabOrderStatus.PARTIAL_RESULTS,
    ];

    if (!validStatuses.includes(labOrder.status as LabOrderStatus)) {
      throw new BadRequestException('Status do pedido não permite registro de resultados');
    }

    // Verificar se já existe resultado para este exame
    const existingResult = await this.prisma.labResult.findFirst({
      where: {
        labOrderId: dto.labOrderId,
        testCode: dto.testCode,
        deletedAt: null,
      },
    });

    if (existingResult) {
      throw new ConflictException(`Resultado já registrado para o exame ${dto.testCode}`);
    }

    // Verificar valores críticos
    const criticalValues = dto.results.filter(r => r.isCritical);
    const hasCriticalValue = criticalValues.length > 0;

    // Criar resultado
    const result = await this.prisma.$transaction(async (tx) => {
      const labResult = await tx.labResult.create({
        data: {
          labOrderId: dto.labOrderId,
          testCode: dto.testCode,
          testName: test.testName,
          analysisDateTime: new Date(dto.analysisDateTime),
          analystId: dto.analystId,
          interpretation: dto.interpretation,
          technicalNotes: dto.technicalNotes,
          equipment: dto.equipment,
          reagentBatch: dto.reagentBatch,
          hasCriticalValue,
          isPartial: dto.isPartial || false,
          reportPdfUrl: dto.reportPdfUrl,
          imageUrls: dto.imageUrls,
          values: {
            create: dto.results.map(value => ({
              parameterName: value.parameterName,
              value: value.value,
              unit: value.unit,
              referenceMin: value.referenceMin,
              referenceMax: value.referenceMax,
              referenceRange: value.referenceRange,
              flag: value.flag,
              isCritical: value.isCritical || false,
              method: value.method,
              notes: value.notes,
              trend: value.trend,
              previousValue: value.previousValue,
              previousDate: value.previousDate ? new Date(value.previousDate) : null,
            })),
          },
        },
        include: {
          values: true,
        },
      });

      // Atualizar status do teste
      await tx.labOrderTest.updateMany({
        where: {
          labOrderId: dto.labOrderId,
          testCode: dto.testCode,
        },
        data: {
          status: 'RESULT_AVAILABLE',
          resultReleasedAt: new Date(),
        },
      });

      // Verificar se todos os testes têm resultado
      const pendingTests = await tx.labOrderTest.count({
        where: {
          labOrderId: dto.labOrderId,
          status: { not: 'RESULT_AVAILABLE' },
        },
      });

      // Atualizar status do pedido
      let newStatus: LabOrderStatus;
      if (pendingTests === 0) {
        newStatus = LabOrderStatus.COMPLETED;
      } else {
        newStatus = LabOrderStatus.PARTIAL_RESULTS;
      }

      await tx.labOrder.update({
        where: { id: dto.labOrderId },
        data: {
          status: newStatus,
          hasCriticalValues: hasCriticalValue || labOrder.hasCriticalValues,
          allResultsReleased: pendingTests === 0,
        },
      });

      return labResult;
    });

    // Auditoria
    await this.auditService.log({
      action: 'LAB_RESULT_REGISTERED',
      entityType: 'LabResult',
      entityId: result.id,
      userId: requesterId,
      details: {
        labOrderId: dto.labOrderId,
        testCode: dto.testCode,
        hasCriticalValue,
        valuesCount: dto.results.length,
      },
    });

    // Se valor crítico, tratar urgentemente
    if (hasCriticalValue) {
      await this.handleCriticalValue(labOrder, result, criticalValues, requesterId);
    }

    // Evento
    this.eventEmitter.emit('labResult.registered', {
      labOrder,
      result,
      hasCriticalValue,
    });

    await this.invalidatePatientLabCache(labOrder.patientId);

    return result;
  }

  async validateLabResult(dto: ValidateResultDto, requesterId: string) {
    const result = await this.prisma.labResult.findUnique({
      where: { id: dto.resultId },
      include: {
        labOrder: {
          include: { patient: true, requestingDoctor: true },
        },
      },
    });

    if (!result) {
      throw new NotFoundException('Resultado não encontrado');
    }

    if (result.validatedAt) {
      throw new BadRequestException('Resultado já foi validado');
    }

    // Se requer repetição
    if (dto.requiresRepeat) {
      await this.prisma.labResult.update({
        where: { id: dto.resultId },
        data: {
          requiresRepeat: true,
          repeatReason: dto.repeatReason,
          validationNotes: dto.validationNotes,
        },
      });

      // Criar novo pedido para o teste
      // ... lógica de repetição

      return { requiresRepeat: true, reason: dto.repeatReason };
    }

    // Validar resultado
    const updated = await this.prisma.labResult.update({
      where: { id: dto.resultId },
      data: {
        validatorId: dto.validatorId,
        validatedAt: new Date(),
        validationNotes: dto.validationNotes,
      },
      include: {
        values: true,
        labOrder: {
          include: { patient: true },
        },
      },
    });

    // Auditoria
    await this.auditService.log({
      action: 'LAB_RESULT_VALIDATED',
      entityType: 'LabResult',
      entityId: dto.resultId,
      userId: requesterId,
      details: {
        validatorId: dto.validatorId,
      },
    });

    // Notificar paciente sobre resultado disponível
    this.eventEmitter.emit('notification.send', {
      type: 'LAB_RESULT_AVAILABLE',
      recipientId: result.labOrder.patient.userId,
      data: {
        orderNumber: result.labOrder.orderNumber,
        testName: result.testName,
      },
    });

    // Notificar médico solicitante
    if (result.labOrder.requestingDoctor?.userId) {
      this.eventEmitter.emit('notification.send', {
        type: 'LAB_RESULT_AVAILABLE_DOCTOR',
        recipientId: result.labOrder.requestingDoctor.userId,
        data: {
          patientName: result.labOrder.patient.fullName,
          testName: result.testName,
          labOrderId: result.labOrderId,
        },
      });
    }

    return updated;
  }

  // ==================== Rejeição de Amostra ====================

  async rejectSample(dto: RejectSampleDto, requesterId: string) {
    const labOrder = await this.prisma.labOrder.findUnique({
      where: { id: dto.labOrderId, deletedAt: null },
      include: { tests: true, patient: true },
    });

    if (!labOrder) {
      throw new NotFoundException('Pedido de exame não encontrado');
    }

    const test = labOrder.tests.find(t => t.testCode === dto.testCode);
    if (!test) {
      throw new BadRequestException(`Exame ${dto.testCode} não encontrado no pedido`);
    }

    // Registrar rejeição
    const rejection = await this.prisma.labSampleRejection.create({
      data: {
        labOrderId: dto.labOrderId,
        testCode: dto.testCode,
        testName: test.testName,
        rejectionReason: dto.rejectionReason,
        rejectionDetails: dto.rejectionDetails,
        requiresNewCollection: dto.requiresNewCollection,
        rejectedById: dto.rejectedBy || requesterId,
      },
    });

    // Atualizar status do teste
    await this.prisma.labOrderTest.updateMany({
      where: {
        labOrderId: dto.labOrderId,
        testCode: dto.testCode,
      },
      data: {
        status: 'REJECTED',
      },
    });

    // Se requer nova coleta, criar agendamento pendente
    if (dto.requiresNewCollection) {
      // Notificar paciente sobre necessidade de nova coleta
      this.eventEmitter.emit('notification.send', {
        type: 'LAB_SAMPLE_REJECTED_NEW_COLLECTION',
        recipientId: labOrder.patient.userId,
        data: {
          orderNumber: labOrder.orderNumber,
          testName: test.testName,
          reason: dto.rejectionReason,
        },
      });
    }

    // Auditoria
    await this.auditService.log({
      action: 'LAB_SAMPLE_REJECTED',
      entityType: 'LabOrder',
      entityId: dto.labOrderId,
      userId: requesterId,
      details: {
        testCode: dto.testCode,
        reason: dto.rejectionReason,
        requiresNewCollection: dto.requiresNewCollection,
      },
    });

    return rejection;
  }

  // ==================== Histórico do Paciente ====================

  async getPatientLabHistory(
    patientId: string,
    query: PatientLabHistoryQueryDto,
    requesterId: string,
    requesterRole: UserRole,
  ) {
    // Verificar acesso ao paciente
    await this.verifyPatientAccess(patientId, requesterId, requesterRole);

    const { page = 1, limit = 20, testCode, startDate, endDate, includeChart, category } = query;

    const where: Prisma.LabResultWhereInput = {
      labOrder: {
        patientId,
        deletedAt: null,
      },
      validatedAt: { not: null },
      deletedAt: null,
    };

    if (testCode) {
      where.testCode = testCode;
    }

    if (startDate || endDate) {
      where.analysisDateTime = {};
      if (startDate) where.analysisDateTime.gte = new Date(startDate);
      if (endDate) where.analysisDateTime.lte = new Date(endDate);
    }

    const [results, total] = await Promise.all([
      this.prisma.labResult.findMany({
        where,
        include: {
          values: true,
          labOrder: {
            include: {
              requestingDoctor: { select: { fullName: true } },
              clinic: { select: { name: true } },
            },
          },
        },
        orderBy: { analysisDateTime: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.labResult.count({ where }),
    ]);

    // Formatar resposta
    const data = results.map(result => ({
      testCode: result.testCode,
      testName: result.testName,
      labOrderId: result.labOrderId,
      orderNumber: result.labOrder.orderNumber,
      resultDate: result.analysisDateTime,
      values: result.values,
      interpretation: result.interpretation,
      requestingDoctorName: result.labOrder.requestingDoctor?.fullName,
      clinicName: result.labOrder.clinic?.name,
      reportPdfUrl: result.reportPdfUrl,
    }));

    // Gerar dados de gráfico de evolução se solicitado
    let chartData = null;
    if (includeChart && testCode) {
      chartData = await this.generateTestEvolutionChart(patientId, testCode);
    }

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      chartData,
    };
  }

  async getTestEvolution(patientId: string, testCode: string, parameterName?: string) {
    return this.generateTestEvolutionChart(patientId, testCode, parameterName);
  }

  // ==================== Worklist e Agenda ====================

  async getCollectionSchedule(query: CollectionScheduleQueryDto, requesterId: string) {
    const {
      date,
      startDate,
      endDate,
      collectorId,
      homeCollectionOnly,
      clinicId,
      includeCompleted,
    } = query;

    const where: Prisma.LabOrderWhereInput = {
      deletedAt: null,
      scheduledCollectionDate: { not: null },
    };

    if (!includeCompleted) {
      where.status = LabOrderStatus.SCHEDULED;
    }

    if (date) {
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);

      where.scheduledCollectionDate = {
        gte: dateStart,
        lte: dateEnd,
      };
    } else if (startDate || endDate) {
      where.scheduledCollectionDate = {};
      if (startDate) where.scheduledCollectionDate.gte = new Date(startDate);
      if (endDate) where.scheduledCollectionDate.lte = new Date(endDate);
    }

    if (collectorId) where.collectorId = collectorId;
    if (homeCollectionOnly) where.homeCollection = true;
    if (clinicId) where.clinicId = clinicId;

    const orders = await this.prisma.labOrder.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            cpf: true,
            birthDate: true,
            phone: true,
          },
        },
        tests: true,
        collector: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { scheduledCollectionDate: 'asc' },
      ],
    });

    const homeCollections = orders.filter(o => o.homeCollection).length;
    const inLabCollections = orders.filter(o => !o.homeCollection).length;

    return {
      data: orders.map(order => ({
        labOrderId: order.id,
        orderNumber: order.orderNumber,
        scheduledDateTime: order.scheduledCollectionDate,
        patient: order.patient,
        tests: order.tests.map(t => ({
          testCode: t.testCode,
          testName: t.testName,
          sampleType: t.sampleType,
          fastingRequirement: t.fastingRequirement,
        })),
        priority: order.priority,
        isHomeCollection: order.homeCollection,
        homeAddress: order.homeCollectionAddress,
        collectorId: order.collectorId,
        collectorName: order.collector?.fullName,
        fastingRequired: order.preparationRequirements?.fastingRequired,
        fastingHours: order.preparationRequirements?.fastingHours,
        specialInstructions: order.preparationRequirements?.specialInstructions,
        notes: order.collectionNotes,
        status: order.status,
      })),
      total: orders.length,
      date: date || undefined,
      homeCollections,
      inLabCollections,
    };
  }

  async getWorklist(query: WorklistQueryDto, requesterId: string) {
    const {
      clinicId,
      sector,
      equipment,
      sampleType,
      urgentOnly,
      pendingAnalysis,
      orderByPriority,
      limit,
    } = query;

    const where: Prisma.LabSampleWhereInput = {
      labOrder: {
        deletedAt: null,
        clinicId: clinicId || undefined,
      },
    };

    if (sampleType) where.sampleType = sampleType;
    if (urgentOnly) {
      where.labOrder = {
        ...where.labOrder as object,
        isUrgent: true,
      };
    }

    // Para análise pendente, buscar amostras coletadas sem resultado
    if (pendingAnalysis) {
      where.labOrder = {
        ...where.labOrder as object,
        status: { in: [LabOrderStatus.SAMPLE_COLLECTED, LabOrderStatus.IN_ANALYSIS] },
      };
    }

    const samples = await this.prisma.labSample.findMany({
      where,
      include: {
        labOrder: {
          include: {
            patient: {
              select: {
                id: true,
                fullName: true,
                cpf: true,
                birthDate: true,
              },
            },
            tests: {
              select: {
                testCode: true,
                testName: true,
              },
            },
          },
        },
      },
      orderBy: orderByPriority
        ? [
            { labOrder: { priority: 'desc' } },
            { collectedAt: 'asc' },
          ]
        : { collectedAt: 'asc' },
      take: limit,
    });

    const urgent = samples.filter(s => s.labOrder.isUrgent).length;
    const routine = samples.filter(s => !s.labOrder.isUrgent).length;

    return {
      data: samples.map((sample, index) => {
        const test = sample.labOrder.tests.find(t => t.testCode === sample.testCode);
        return {
          labOrderId: sample.labOrderId,
          orderNumber: sample.labOrder.orderNumber,
          testCode: sample.testCode,
          testName: test?.testName || sample.testCode,
          tubeBarcode: sample.tubeBarcode,
          sampleType: sample.sampleType,
          patient: sample.labOrder.patient,
          priority: sample.labOrder.priority,
          isUrgent: sample.labOrder.isUrgent,
          collectedAt: sample.collectedAt,
          receivedAt: sample.receivedAt,
          sector,
          equipment,
          position: index + 1,
        };
      }),
      total: samples.length,
      urgent,
      routine,
      sector,
    };
  }

  // ==================== Valores Críticos ====================

  async getCriticalValues(query: CriticalValuesQueryDto, requesterId: string) {
    const { clinicId, unnotifiedOnly, startDate, endDate, limit } = query;

    const where: Prisma.LabResultWhereInput = {
      hasCriticalValue: true,
      deletedAt: null,
    };

    if (clinicId) {
      where.labOrder = { clinicId };
    }

    if (unnotifiedOnly) {
      where.doctorNotified = false;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const results = await this.prisma.labResult.findMany({
      where,
      include: {
        values: {
          where: { isCritical: true },
        },
        labOrder: {
          include: {
            patient: {
              select: {
                id: true,
                fullName: true,
                cpf: true,
                phone: true,
              },
            },
            requestingDoctor: {
              select: {
                id: true,
                fullName: true,
                crm: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const alerts = [];
    for (const result of results) {
      for (const value of result.values) {
        if (value.isCritical) {
          alerts.push({
            id: `${result.id}-${value.id}`,
            labOrderId: result.labOrderId,
            orderNumber: result.labOrder.orderNumber,
            patient: result.labOrder.patient,
            requestingDoctor: result.labOrder.requestingDoctor,
            testCode: result.testCode,
            testName: result.testName,
            parameterName: value.parameterName,
            value: value.value,
            unit: value.unit,
            referenceRange: value.referenceRange,
            flag: value.flag,
            detectedAt: result.createdAt,
            notifiedAt: result.doctorNotifiedAt,
            notifiedTo: result.doctorNotifiedTo,
            acknowledged: result.criticalValueAcknowledged,
            acknowledgedBy: result.criticalValueAcknowledgedBy,
            acknowledgedAt: result.criticalValueAcknowledgedAt,
          });
        }
      }
    }

    const unnotified = alerts.filter(a => !a.notifiedAt).length;
    const unacknowledged = alerts.filter(a => !a.acknowledged).length;

    return {
      data: alerts,
      total: alerts.length,
      unnotified,
      unacknowledged,
    };
  }

  async acknowledgeCriticalValue(resultId: string, notes: string, requesterId: string) {
    const result = await this.prisma.labResult.findUnique({
      where: { id: resultId },
    });

    if (!result) {
      throw new NotFoundException('Resultado não encontrado');
    }

    if (!result.hasCriticalValue) {
      throw new BadRequestException('Este resultado não possui valor crítico');
    }

    const updated = await this.prisma.labResult.update({
      where: { id: resultId },
      data: {
        criticalValueAcknowledged: true,
        criticalValueAcknowledgedBy: requesterId,
        criticalValueAcknowledgedAt: new Date(),
        criticalValueNotes: notes,
      },
    });

    await this.auditService.log({
      action: 'CRITICAL_VALUE_ACKNOWLEDGED',
      entityType: 'LabResult',
      entityId: resultId,
      userId: requesterId,
      details: { notes },
    });

    return updated;
  }

  async notifyDoctorCriticalValue(resultId: string, requesterId: string) {
    const result = await this.prisma.labResult.findUnique({
      where: { id: resultId },
      include: {
        labOrder: {
          include: {
            patient: true,
            requestingDoctor: true,
          },
        },
        values: {
          where: { isCritical: true },
        },
      },
    });

    if (!result) {
      throw new NotFoundException('Resultado não encontrado');
    }

    if (!result.labOrder.requestingDoctor) {
      throw new BadRequestException('Pedido não possui médico solicitante');
    }

    // Enviar notificação urgente
    this.eventEmitter.emit('notification.urgent', {
      type: 'CRITICAL_VALUE_ALERT',
      recipientId: result.labOrder.requestingDoctor.userId,
      data: {
        patientName: result.labOrder.patient.fullName,
        testName: result.testName,
        criticalValues: result.values,
        labOrderId: result.labOrderId,
      },
    });

    // Atualizar registro
    await this.prisma.labResult.update({
      where: { id: resultId },
      data: {
        doctorNotified: true,
        doctorNotifiedAt: new Date(),
        doctorNotifiedTo: result.labOrder.requestingDoctor.fullName,
        notificationMethod: 'SYSTEM',
      },
    });

    await this.auditService.log({
      action: 'CRITICAL_VALUE_DOCTOR_NOTIFIED',
      entityType: 'LabResult',
      entityId: resultId,
      userId: requesterId,
      details: {
        doctorId: result.labOrder.requestingDoctor.id,
        doctorName: result.labOrder.requestingDoctor.fullName,
      },
    });

    return { notified: true };
  }

  // ==================== Catálogo de Exames ====================

  async getTestCatalog(query: LabTestCatalogQueryDto) {
    const {
      page = 1,
      limit = 50,
      search,
      sampleType,
      category,
      subcategory,
      activeOnly,
      clinicId,
      insuranceCode,
      sortBy,
      sortOrder,
    } = query;

    const where: Prisma.LabTestCatalogWhereInput = {};

    if (activeOnly) where.isActive = true;

    if (search) {
      where.OR = [
        { testCode: { contains: search, mode: 'insensitive' } },
        { testName: { contains: search, mode: 'insensitive' } },
        { popularName: { contains: search, mode: 'insensitive' } },
        { synonyms: { has: search } },
      ];
    }

    if (sampleType) where.sampleType = sampleType;
    if (category) where.category = category;
    if (subcategory) where.subcategory = subcategory;

    if (clinicId) {
      where.clinicTests = {
        some: {
          clinicId,
          isAvailable: true,
        },
      };
    }

    const [data, total, categories] = await Promise.all([
      this.prisma.labTestCatalog.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.labTestCatalog.count({ where }),
      this.prisma.labTestCatalog.findMany({
        where: { isActive: true },
        distinct: ['category'],
        select: { category: true },
      }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      categories: categories.map(c => c.category).filter(Boolean),
    };
  }

  async getTestDetails(testCode: string) {
    const test = await this.prisma.labTestCatalog.findFirst({
      where: { testCode },
    });

    if (!test) {
      throw new NotFoundException('Exame não encontrado no catálogo');
    }

    return test;
  }

  async getPreparationInstructions(testCodes: string[]) {
    const tests = await this.prisma.labTestCatalog.findMany({
      where: { testCode: { in: testCodes } },
      select: {
        testCode: true,
        testName: true,
        fastingRequirement: true,
        specialInstructions: true,
        dietaryRestrictions: true,
        medicationRestrictions: true,
        activityRestrictions: true,
        sampleType: true,
        collectionMaterial: true,
      },
    });

    return tests.map(test => ({
      testCode: test.testCode,
      testName: test.testName,
      fastingRequirement: test.fastingRequirement,
      fastingHours: this.getFastingHours(test.fastingRequirement),
      generalInstructions: test.specialInstructions,
      dietaryRestrictions: test.dietaryRestrictions,
      medicationRestrictions: test.medicationRestrictions,
      activityRestrictions: test.activityRestrictions,
      sampleType: test.sampleType,
      collectionMaterial: test.collectionMaterial,
    }));
  }

  // ==================== Estatísticas ====================

  async getStatistics(query: LabStatisticsQueryDto, requesterId: string) {
    const { clinicId, startDate, endDate, groupBy, includeTAT, includeRejectionRate } = query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const where: Prisma.LabOrderWhereInput = {
      createdAt: { gte: start, lte: end },
      deletedAt: null,
    };

    if (clinicId) where.clinicId = clinicId;

    // Totais básicos
    const [totalOrders, totalTests, completedOrders, cancelledOrders, urgentOrders] = await Promise.all([
      this.prisma.labOrder.count({ where }),
      this.prisma.labOrderTest.count({
        where: { labOrder: where },
      }),
      this.prisma.labOrder.count({
        where: { ...where, status: LabOrderStatus.COMPLETED },
      }),
      this.prisma.labOrder.count({
        where: { ...where, status: LabOrderStatus.CANCELLED },
      }),
      this.prisma.labOrder.count({
        where: { ...where, isUrgent: true },
      }),
    ]);

    // Por status
    const ordersByStatus = await this.prisma.labOrder.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    // Por prioridade
    const ordersByPriority = await this.prisma.labOrder.groupBy({
      by: ['priority'],
      where,
      _count: true,
    });

    // Exames mais solicitados
    const topTests = await this.prisma.labOrderTest.groupBy({
      by: ['testCode', 'testName'],
      where: { labOrder: where },
      _count: true,
      orderBy: { _count: { testCode: 'desc' } },
      take: 10,
    });

    // Valores críticos
    const criticalValuesCount = await this.prisma.labResult.count({
      where: {
        hasCriticalValue: true,
        labOrder: where,
      },
    });

    // Coletas domiciliares
    const homeCollectionsCount = await this.prisma.labOrder.count({
      where: { ...where, homeCollection: true },
    });

    const stats: any = {
      period: { start, end },
      totalOrders,
      totalTests,
      completedOrders,
      cancelledOrders,
      urgentOrders,
      ordersByStatus: Object.fromEntries(
        ordersByStatus.map(s => [s.status, s._count]),
      ),
      ordersByPriority: Object.fromEntries(
        ordersByPriority.map(p => [p.priority, p._count]),
      ),
      topTests: topTests.map(t => ({
        testCode: t.testCode,
        testName: t.testName,
        count: t._count,
      })),
      criticalValuesCount,
      homeCollectionsCount,
    };

    // TAT (Turnaround Time)
    if (includeTAT) {
      stats.turnaroundTime = await this.calculateTurnaroundTime(where);
    }

    // Taxa de rejeição
    if (includeRejectionRate) {
      stats.rejectionRate = await this.calculateRejectionRate(where);
    }

    return stats;
  }

  // ==================== Laboratório Externo ====================

  async sendToExternalLab(dto: ExternalLabOrderDto, requesterId: string) {
    const labOrder = await this.prisma.labOrder.findUnique({
      where: { id: dto.labOrderId, deletedAt: null },
      include: { tests: true },
    });

    if (!labOrder) {
      throw new NotFoundException('Pedido de exame não encontrado');
    }

    const externalLab = await this.prisma.externalLab.findUnique({
      where: { id: dto.externalLabId },
    });

    if (!externalLab) {
      throw new NotFoundException('Laboratório externo não encontrado');
    }

    const updated = await this.prisma.labOrder.update({
      where: { id: dto.labOrderId },
      data: {
        externalLabId: dto.externalLabId,
        externalOrderCode: dto.externalOrderCode,
        sentToExternalLabAt: dto.sentDate ? new Date(dto.sentDate) : new Date(),
        expectedResultDate: dto.expectedResultDate ? new Date(dto.expectedResultDate) : null,
        externalLabNotes: dto.notes,
      },
      include: this.getLabOrderIncludes(),
    });

    await this.auditService.log({
      action: 'LAB_ORDER_SENT_EXTERNAL',
      entityType: 'LabOrder',
      entityId: dto.labOrderId,
      userId: requesterId,
      details: {
        externalLabId: dto.externalLabId,
        externalLabName: externalLab.name,
        externalOrderCode: dto.externalOrderCode,
      },
    });

    return this.formatLabOrderResponse(updated);
  }

  async getExternalLabs(activeOnly: boolean = true) {
    const where: Prisma.ExternalLabWhereInput = {};
    if (activeOnly) where.isActive = true;

    const labs = await this.prisma.externalLab.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return {
      data: labs,
      total: labs.length,
    };
  }

  // ==================== Métodos Auxiliares ====================

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const prefix = `LAB${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;

    const lastOrder = await this.prisma.labOrder.findFirst({
      where: { orderNumber: { startsWith: prefix } },
      orderBy: { orderNumber: 'desc' },
    });

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.slice(-6));
      sequence = lastSequence + 1;
    }

    return `${prefix}${String(sequence).padStart(6, '0')}`;
  }

  private async validateTests(tests: any[]) {
    // Validar se exames existem no catálogo
    const testCodes = tests.map(t => t.testCode);
    const catalogTests = await this.prisma.labTestCatalog.findMany({
      where: { testCode: { in: testCodes }, isActive: true },
    });

    const foundCodes = catalogTests.map(t => t.testCode);
    const notFound = testCodes.filter(code => !foundCodes.includes(code));

    if (notFound.length > 0) {
      // Permitir exames não cadastrados (flexibilidade)
      console.warn(`Exames não encontrados no catálogo: ${notFound.join(', ')}`);
    }
  }

  private consolidatePreparationRequirements(tests: any[]): any {
    let maxFasting = 'NONE';
    const fastingOrder = ['NONE', 'FOUR_HOURS', 'EIGHT_HOURS', 'TWELVE_HOURS', 'SPECIAL'];
    const specialInstructions: string[] = [];

    for (const test of tests) {
      if (fastingOrder.indexOf(test.fastingRequirement) > fastingOrder.indexOf(maxFasting)) {
        maxFasting = test.fastingRequirement;
      }
      if (test.specialInstructions) {
        specialInstructions.push(`${test.testName}: ${test.specialInstructions}`);
      }
    }

    return {
      fastingRequired: maxFasting !== 'NONE',
      fastingHours: this.getFastingHours(maxFasting),
      specialInstructions: specialInstructions.length > 0 ? specialInstructions.join('\n') : null,
    };
  }

  private getFastingHours(fastingRequirement: string): number | null {
    const mapping: Record<string, number | null> = {
      NONE: null,
      FOUR_HOURS: 4,
      EIGHT_HOURS: 8,
      TWELVE_HOURS: 12,
      SPECIAL: null,
    };
    return mapping[fastingRequirement] || null;
  }

  private async checkCollectorAvailability(collectorId: string, dateTime: Date): Promise<boolean> {
    const startTime = new Date(dateTime);
    startTime.setMinutes(startTime.getMinutes() - 30);
    const endTime = new Date(dateTime);
    endTime.setMinutes(endTime.getMinutes() + 30);

    const conflicting = await this.prisma.labOrder.count({
      where: {
        collectorId,
        scheduledCollectionDate: {
          gte: startTime,
          lte: endTime,
        },
        status: LabOrderStatus.SCHEDULED,
      },
    });

    return conflicting > 0;
  }

  private async handleCriticalValue(labOrder: any, result: any, criticalValues: any[], requesterId: string) {
    // Criar alerta de valor crítico
    await this.prisma.criticalValueAlert.create({
      data: {
        labResultId: result.id,
        labOrderId: labOrder.id,
        patientId: labOrder.patientId,
        doctorId: labOrder.requestingDoctorId,
        testCode: result.testCode,
        testName: result.testName,
        criticalValues: criticalValues,
        detectedAt: new Date(),
        detectedById: requesterId,
      },
    });

    // Notificação urgente ao médico
    if (labOrder.requestingDoctor?.userId) {
      this.eventEmitter.emit('notification.urgent', {
        type: 'CRITICAL_VALUE_ALERT',
        recipientId: labOrder.requestingDoctor.userId,
        priority: 'URGENT',
        data: {
          patientName: labOrder.patient.fullName,
          testName: result.testName,
          criticalValues,
          labOrderId: labOrder.id,
        },
      });
    }

    // Log de auditoria
    await this.auditService.log({
      action: 'CRITICAL_VALUE_DETECTED',
      entityType: 'LabResult',
      entityId: result.id,
      userId: requesterId,
      details: {
        testCode: result.testCode,
        criticalValues,
        patientId: labOrder.patientId,
        doctorNotified: !!labOrder.requestingDoctorId,
      },
    });
  }

  private async generateTestEvolutionChart(patientId: string, testCode: string, parameterName?: string) {
    const results = await this.prisma.labResult.findMany({
      where: {
        testCode,
        labOrder: {
          patientId,
          deletedAt: null,
        },
        validatedAt: { not: null },
      },
      include: {
        values: parameterName
          ? { where: { parameterName } }
          : true,
      },
      orderBy: { analysisDateTime: 'asc' },
      take: 20, // Últimos 20 resultados
    });

    if (results.length === 0) {
      return null;
    }

    // Pegar primeiro parâmetro numérico se não especificado
    let targetParameter = parameterName;
    if (!targetParameter && results[0].values.length > 0) {
      targetParameter = results[0].values[0].parameterName;
    }

    const dataPoints = [];
    let unit = null;
    let referenceMin = null;
    let referenceMax = null;

    for (const result of results) {
      const value = result.values.find(v => v.parameterName === targetParameter);
      if (value) {
        const numericValue = parseFloat(value.value);
        if (!isNaN(numericValue)) {
          dataPoints.push({
            date: result.analysisDateTime,
            value: numericValue,
            flag: value.flag,
            labOrderId: result.labOrderId,
          });
          unit = unit || value.unit;
          if (value.referenceMin) {
            referenceMin = parseFloat(value.referenceMin);
          }
          if (value.referenceMax) {
            referenceMax = parseFloat(value.referenceMax);
          }
        }
      }
    }

    return {
      testCode,
      testName: results[0].testName,
      parameterName: targetParameter,
      unit,
      referenceMin,
      referenceMax,
      dataPoints,
    };
  }

  private async calculateOrdersSummary(where: Prisma.LabOrderWhereInput) {
    const [
      totalOrders,
      pendingCollection,
      inAnalysis,
      pendingResults,
      completed,
      urgent,
      criticalValues,
    ] = await Promise.all([
      this.prisma.labOrder.count({ where }),
      this.prisma.labOrder.count({
        where: { ...where, status: { in: [LabOrderStatus.PENDING, LabOrderStatus.SCHEDULED] } },
      }),
      this.prisma.labOrder.count({
        where: { ...where, status: LabOrderStatus.IN_ANALYSIS },
      }),
      this.prisma.labOrder.count({
        where: { ...where, status: LabOrderStatus.PARTIAL_RESULTS },
      }),
      this.prisma.labOrder.count({
        where: { ...where, status: LabOrderStatus.COMPLETED },
      }),
      this.prisma.labOrder.count({
        where: { ...where, isUrgent: true },
      }),
      this.prisma.labOrder.count({
        where: { ...where, hasCriticalValues: true },
      }),
    ]);

    return {
      totalOrders,
      pendingCollection,
      inAnalysis,
      pendingResults,
      completed,
      urgent,
      criticalValues,
    };
  }

  private async calculateTurnaroundTime(where: Prisma.LabOrderWhereInput) {
    const completedOrders = await this.prisma.labOrder.findMany({
      where: {
        ...where,
        status: LabOrderStatus.COMPLETED,
        actualCollectionDate: { not: null },
      },
      include: {
        results: {
          where: { validatedAt: { not: null } },
          orderBy: { validatedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (completedOrders.length === 0) {
      return null;
    }

    const tatValues: number[] = [];
    for (const order of completedOrders) {
      if (order.actualCollectionDate && order.results[0]?.validatedAt) {
        const tat =
          (order.results[0].validatedAt.getTime() - order.actualCollectionDate.getTime()) /
          (1000 * 60 * 60); // Em horas
        tatValues.push(tat);
      }
    }

    if (tatValues.length === 0) {
      return null;
    }

    tatValues.sort((a, b) => a - b);
    const average = tatValues.reduce((a, b) => a + b, 0) / tatValues.length;
    const median = tatValues[Math.floor(tatValues.length / 2)];
    const p90 = tatValues[Math.floor(tatValues.length * 0.9)];

    return {
      average: Math.round(average * 10) / 10,
      median: Math.round(median * 10) / 10,
      p90: Math.round(p90 * 10) / 10,
      unit: 'hours',
    };
  }

  private async calculateRejectionRate(where: Prisma.LabOrderWhereInput) {
    const [totalSamples, rejectedSamples, rejectionsByReason] = await Promise.all([
      this.prisma.labSample.count({
        where: { labOrder: where },
      }),
      this.prisma.labSampleRejection.count({
        where: { labOrder: where },
      }),
      this.prisma.labSampleRejection.groupBy({
        by: ['rejectionReason'],
        where: { labOrder: where },
        _count: true,
      }),
    ]);

    return {
      total: rejectedSamples,
      rate: totalSamples > 0 ? Math.round((rejectedSamples / totalSamples) * 10000) / 100 : 0,
      byReason: Object.fromEntries(
        rejectionsByReason.map(r => [r.rejectionReason, r._count]),
      ),
    };
  }

  private async verifyLabOrderAccess(
    labOrder: any,
    requesterId: string,
    requesterRole: UserRole,
    requireWrite: boolean = false,
  ) {
    if (requesterRole === UserRole.ADMIN || requesterRole === UserRole.SUPER_ADMIN) {
      return true;
    }

    if (requesterRole === UserRole.PATIENT) {
      const patient = await this.prisma.patient.findFirst({
        where: { userId: requesterId },
      });
      if (!patient || patient.id !== labOrder.patientId) {
        throw new ForbiddenException('Acesso negado ao pedido de exame');
      }
      if (requireWrite) {
        throw new ForbiddenException('Paciente não pode modificar pedidos de exame');
      }
    }

    if (requesterRole === UserRole.DOCTOR) {
      const doctor = await this.prisma.doctor.findFirst({
        where: { userId: requesterId },
      });
      if (!doctor) {
        throw new ForbiddenException('Médico não encontrado');
      }
      // Médico pode ver se é solicitante ou se tem vínculo com paciente
      if (labOrder.requestingDoctorId !== doctor.id) {
        // Verificar se tem vínculo com paciente através de consultas
        const hasRelation = await this.prisma.consultation.count({
          where: {
            patientId: labOrder.patientId,
            doctorId: doctor.id,
          },
        });
        if (hasRelation === 0) {
          throw new ForbiddenException('Médico não tem acesso a este pedido de exame');
        }
      }
    }

    return true;
  }

  private async verifyPatientAccess(patientId: string, requesterId: string, requesterRole: UserRole) {
    if (requesterRole === UserRole.ADMIN || requesterRole === UserRole.SUPER_ADMIN) {
      return true;
    }

    if (requesterRole === UserRole.PATIENT) {
      const patient = await this.prisma.patient.findFirst({
        where: { userId: requesterId },
      });
      if (!patient || patient.id !== patientId) {
        throw new ForbiddenException('Acesso negado aos dados do paciente');
      }
    }

    if (requesterRole === UserRole.DOCTOR) {
      const doctor = await this.prisma.doctor.findFirst({
        where: { userId: requesterId },
      });
      if (!doctor) {
        throw new ForbiddenException('Médico não encontrado');
      }
      // Verificar vínculo através de consultas ou exames
      const hasRelation = await this.prisma.consultation.count({
        where: {
          patientId,
          doctorId: doctor.id,
        },
      });
      if (hasRelation === 0) {
        throw new ForbiddenException('Médico não tem acesso aos dados deste paciente');
      }
    }

    return true;
  }

  private getLabOrderIncludes() {
    return {
      patient: {
        select: {
          id: true,
          fullName: true,
          cpf: true,
          birthDate: true,
          gender: true,
          phone: true,
          email: true,
        },
      },
      requestingDoctor: {
        select: {
          id: true,
          fullName: true,
          crm: true,
          specialty: true,
          phone: true,
        },
      },
      clinic: {
        select: {
          id: true,
          name: true,
          cnpj: true,
          phone: true,
        },
      },
      externalLab: {
        select: {
          id: true,
          name: true,
          cnpj: true,
        },
      },
      tests: true,
      samples: {
        include: {
          collector: {
            select: { fullName: true },
          },
        },
      },
      results: {
        include: {
          values: true,
        },
      },
      collector: {
        select: {
          id: true,
          fullName: true,
        },
      },
    };
  }

  private formatLabOrderResponse(labOrder: any) {
    return {
      id: labOrder.id,
      orderNumber: labOrder.orderNumber,
      patient: labOrder.patient,
      consultationId: labOrder.consultationId,
      requestingDoctor: labOrder.requestingDoctor,
      clinic: labOrder.clinic,
      externalLab: labOrder.externalLab,
      priority: labOrder.priority,
      status: labOrder.status,
      tests: labOrder.tests?.map((test: any) => ({
        id: test.id,
        testCode: test.testCode,
        testName: test.testName,
        popularName: test.popularName,
        sampleType: test.sampleType,
        requiredVolume: test.requiredVolume,
        collectionMaterial: test.collectionMaterial,
        fastingRequirement: test.fastingRequirement,
        specialInstructions: test.specialInstructions,
        estimatedTurnaround: test.estimatedTurnaround,
        clinicalIndication: test.clinicalIndication,
        analysisMethod: test.analysisMethod,
        quantity: test.quantity,
        status: test.status,
        collectedAt: test.collectedAt,
        resultReleasedAt: test.resultReleasedAt,
        tubeBarcode: test.tubeBarcode,
      })),
      diagnosticHypothesis: labOrder.diagnosticHypothesis,
      clinicalIndication: labOrder.clinicalIndication,
      labNotes: labOrder.labNotes,
      preferredCollectionDate: labOrder.preferredCollectionDate,
      scheduledCollectionDate: labOrder.scheduledCollectionDate,
      actualCollectionDate: labOrder.actualCollectionDate,
      homeCollection: labOrder.homeCollection,
      homeCollectionAddress: labOrder.homeCollectionAddress,
      currentMedications: labOrder.currentMedications,
      relevantClinicalInfo: labOrder.relevantClinicalInfo,
      isUrgent: labOrder.isUrgent,
      insuranceAuthCode: labOrder.insuranceAuthCode,
      insuranceGuideNumber: labOrder.insuranceGuideNumber,
      samplesCollected: labOrder.samples?.map((sample: any) => ({
        id: sample.id,
        testCode: sample.testCode,
        sampleType: sample.sampleType,
        tubeBarcode: sample.tubeBarcode,
        volumeCollected: sample.volumeCollected,
        sampleQuality: sample.sampleQuality,
        collectedAt: sample.collectedAt,
        collectorName: sample.collector?.fullName,
        notes: sample.notes,
      })),
      results: labOrder.results?.map((result: any) => ({
        id: result.id,
        labOrderId: result.labOrderId,
        testCode: result.testCode,
        testName: result.testName,
        values: result.values,
        analysisDateTime: result.analysisDateTime,
        analystId: result.analystId,
        validatorId: result.validatorId,
        validatedAt: result.validatedAt,
        interpretation: result.interpretation,
        technicalNotes: result.technicalNotes,
        equipment: result.equipment,
        hasCriticalValue: result.hasCriticalValue,
        doctorNotified: result.doctorNotified,
        isPartial: result.isPartial,
        reportPdfUrl: result.reportPdfUrl,
        imageUrls: result.imageUrls,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      })),
      hasCriticalValues: labOrder.hasCriticalValues,
      allResultsReleased: labOrder.allResultsReleased,
      collectorId: labOrder.collectorId,
      collectorName: labOrder.collector?.fullName,
      externalOrderCode: labOrder.externalOrderCode,
      reportPdfUrl: labOrder.reportPdfUrl,
      createdAt: labOrder.createdAt,
      updatedAt: labOrder.updatedAt,
      cancelledAt: labOrder.cancelledAt,
      cancellationReason: labOrder.cancellationReason,
    };
  }

  private async invalidatePatientLabCache(patientId: string) {
    await this.cacheService.deletePattern(`lab:patient:${patientId}:*`);
    await this.cacheService.deletePattern(`lab:orders:*`);
  }
}
