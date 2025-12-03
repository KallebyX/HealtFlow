import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CacheService } from '../../../common/services/cache.service';
import { AuditService } from '../../../common/services/audit.service';
import {
  FHIRResourceType,
  FHIRBundleType,
  FHIRHTTPVerb,
  FHIRPatientDto,
  FHIRPractitionerDto,
  FHIROrganizationDto,
  FHIRAppointmentDto,
  FHIRObservationDto,
  FHIRConditionDto,
  FHIRMedicationRequestDto,
  FHIRBundleDto,
  FHIRBundleEntryDto,
  FHIRIdentifierDto,
  FHIRHumanNameDto,
  FHIRAddressDto,
  FHIRContactPointDto,
  FHIRCodeableConceptDto,
  FHIRReferenceDto,
  AdministrativeGender,
  AppointmentStatus,
  ObservationStatus,
  MedicationRequestStatus,
  MedicationRequestIntent,
  ContactPointSystem,
  ContactPointUse,
  AddressUse,
  NameUse,
} from './dto/fhir-resources.dto';
import {
  FHIRPatientSearchDto,
  FHIRPractitionerSearchDto,
  FHIROrganizationSearchDto,
  FHIRAppointmentSearchDto,
  FHIRObservationSearchDto,
  FHIRConditionSearchDto,
  FHIRMedicationRequestSearchDto,
  FHIRHistoryQueryDto,
  FHIREverythingDto,
} from './dto/fhir-query.dto';

@Injectable()
export class FhirService {
  private readonly logger = new Logger(FhirService.name);
  private readonly fhirVersion = '4.0.1';
  private readonly baseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly auditService: AuditService,
  ) {
    this.baseUrl = process.env.FHIR_BASE_URL || 'http://localhost:3000/fhir';
  }

  // ==================== Capability Statement ====================

  async getCapabilityStatement() {
    return {
      resourceType: 'CapabilityStatement',
      id: 'healthflow-fhir-server',
      url: `${this.baseUrl}/metadata`,
      version: '1.0.0',
      name: 'HealthFlowFHIRServer',
      title: 'HealthFlow FHIR Server',
      status: 'active',
      experimental: false,
      date: new Date().toISOString(),
      publisher: 'HealthFlow',
      description: 'FHIR R4 conformant server implementation for HealthFlow healthcare platform',
      kind: 'instance',
      software: {
        name: 'HealthFlow FHIR Server',
        version: '1.0.0',
      },
      implementation: {
        description: 'HealthFlow FHIR API',
        url: this.baseUrl,
      },
      fhirVersion: this.fhirVersion,
      format: ['json', 'xml'],
      rest: [
        {
          mode: 'server',
          documentation: 'RESTful FHIR Server',
          security: {
            cors: true,
            service: [
              {
                coding: [
                  {
                    system: 'http://terminology.hl7.org/CodeSystem/restful-security-service',
                    code: 'OAuth',
                    display: 'OAuth2 Token',
                  },
                ],
              },
            ],
            description: 'OAuth2 authentication required',
          },
          resource: this.getCapabilityResources(),
          interaction: [
            { code: 'transaction' },
            { code: 'batch' },
            { code: 'search-system' },
            { code: 'history-system' },
          ],
          searchParam: this.getGlobalSearchParams(),
          operation: this.getSystemOperations(),
        },
      ],
    };
  }

  private getCapabilityResources() {
    const commonInteractions = [
      { code: 'read' },
      { code: 'vread' },
      { code: 'update' },
      { code: 'patch' },
      { code: 'delete' },
      { code: 'history-instance' },
      { code: 'history-type' },
      { code: 'create' },
      { code: 'search-type' },
    ];

    return [
      {
        type: 'Patient',
        profile: 'http://hl7.org/fhir/StructureDefinition/Patient',
        interaction: commonInteractions,
        versioning: 'versioned',
        readHistory: true,
        updateCreate: true,
        conditionalCreate: true,
        conditionalRead: 'full-support',
        conditionalUpdate: true,
        conditionalDelete: 'multiple',
        searchInclude: ['Patient:general-practitioner', 'Patient:organization'],
        searchParam: this.getPatientSearchParams(),
        operation: [
          { name: 'everything', definition: `${this.baseUrl}/OperationDefinition/Patient-everything` },
          { name: 'match', definition: `${this.baseUrl}/OperationDefinition/Patient-match` },
        ],
      },
      {
        type: 'Practitioner',
        profile: 'http://hl7.org/fhir/StructureDefinition/Practitioner',
        interaction: commonInteractions,
        versioning: 'versioned',
        readHistory: true,
        updateCreate: true,
        searchParam: this.getPractitionerSearchParams(),
      },
      {
        type: 'Organization',
        profile: 'http://hl7.org/fhir/StructureDefinition/Organization',
        interaction: commonInteractions,
        versioning: 'versioned',
        readHistory: true,
        updateCreate: true,
        searchParam: this.getOrganizationSearchParams(),
      },
      {
        type: 'Appointment',
        profile: 'http://hl7.org/fhir/StructureDefinition/Appointment',
        interaction: commonInteractions,
        versioning: 'versioned',
        readHistory: true,
        updateCreate: true,
        searchParam: this.getAppointmentSearchParams(),
      },
      {
        type: 'Observation',
        profile: 'http://hl7.org/fhir/StructureDefinition/Observation',
        interaction: commonInteractions,
        versioning: 'versioned',
        readHistory: true,
        updateCreate: true,
        searchParam: this.getObservationSearchParams(),
      },
      {
        type: 'Condition',
        profile: 'http://hl7.org/fhir/StructureDefinition/Condition',
        interaction: commonInteractions,
        versioning: 'versioned',
        readHistory: true,
        updateCreate: true,
        searchParam: this.getConditionSearchParams(),
      },
      {
        type: 'MedicationRequest',
        profile: 'http://hl7.org/fhir/StructureDefinition/MedicationRequest',
        interaction: commonInteractions,
        versioning: 'versioned',
        readHistory: true,
        updateCreate: true,
        searchParam: this.getMedicationRequestSearchParams(),
      },
    ];
  }

  // ==================== Patient Resource ====================

  async createPatient(dto: FHIRPatientDto, userId: string): Promise<FHIRPatientDto> {
    // Validar e converter para modelo interno
    const patientData = this.convertFHIRPatientToInternal(dto);

    const patient = await this.prisma.patient.create({
      data: {
        ...patientData,
        createdById: userId,
      },
      include: this.getPatientIncludes(),
    });

    await this.auditService.log({
      action: 'FHIR_CREATE_PATIENT',
      entityType: 'Patient',
      entityId: patient.id,
      userId,
      newValues: dto,
    });

    return this.convertInternalToFHIRPatient(patient);
  }

  async readPatient(id: string): Promise<FHIRPatientDto> {
    const patient = await this.prisma.patient.findUnique({
      where: { id, deletedAt: null },
      include: this.getPatientIncludes(),
    });

    if (!patient) {
      throw new NotFoundException({
        resourceType: 'OperationOutcome',
        issue: [
          {
            severity: 'error',
            code: 'not-found',
            diagnostics: `Patient/${id} not found`,
          },
        ],
      });
    }

    return this.convertInternalToFHIRPatient(patient);
  }

  async updatePatient(id: string, dto: FHIRPatientDto, userId: string): Promise<FHIRPatientDto> {
    const existing = await this.prisma.patient.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException({
        resourceType: 'OperationOutcome',
        issue: [
          {
            severity: 'error',
            code: 'not-found',
            diagnostics: `Patient/${id} not found`,
          },
        ],
      });
    }

    const patientData = this.convertFHIRPatientToInternal(dto);

    const patient = await this.prisma.patient.update({
      where: { id },
      data: {
        ...patientData,
        version: { increment: 1 },
      },
      include: this.getPatientIncludes(),
    });

    await this.auditService.log({
      action: 'FHIR_UPDATE_PATIENT',
      entityType: 'Patient',
      entityId: id,
      userId,
      oldValues: existing,
      newValues: dto,
    });

    return this.convertInternalToFHIRPatient(patient);
  }

  async deletePatient(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.patient.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException({
        resourceType: 'OperationOutcome',
        issue: [
          {
            severity: 'error',
            code: 'not-found',
            diagnostics: `Patient/${id} not found`,
          },
        ],
      });
    }

    await this.prisma.patient.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.log({
      action: 'FHIR_DELETE_PATIENT',
      entityType: 'Patient',
      entityId: id,
      userId,
    });
  }

  async searchPatients(query: FHIRPatientSearchDto): Promise<FHIRBundleDto> {
    const where: any = { deletedAt: null };

    // Aplicar filtros de busca FHIR
    if (query._id) {
      where.id = query._id;
    }

    if (query.identifier) {
      where.cpf = query.identifier.replace(/[^0-9]/g, '');
    }

    if (query.active !== undefined) {
      where.isActive = query.active;
    }

    if (query.name) {
      where.name = { contains: query.name, mode: 'insensitive' };
    }

    if (query.family) {
      where.name = { contains: query.family, mode: 'insensitive' };
    }

    if (query.given) {
      where.name = { contains: query.given, mode: 'insensitive' };
    }

    if (query.gender) {
      where.gender = this.mapFHIRGenderToInternal(query.gender);
    }

    if (query.birthdate) {
      where.birthDate = this.parseFHIRDateSearch(query.birthdate);
    }

    if (query.email) {
      where.email = { contains: query.email, mode: 'insensitive' };
    }

    if (query.phone) {
      where.phone = { contains: query.phone.replace(/[^0-9]/g, '') };
    }

    if (query['address-city']) {
      where.city = { contains: query['address-city'], mode: 'insensitive' };
    }

    if (query['address-state']) {
      where.state = { contains: query['address-state'], mode: 'insensitive' };
    }

    if (query['address-postalcode']) {
      where.zipCode = query['address-postalcode'].replace(/[^0-9]/g, '');
    }

    const count = query._count || 20;
    const offset = query._offset || 0;

    const [patients, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        include: this.getPatientIncludes(),
        take: count,
        skip: offset,
        orderBy: query._sort ? this.parseFHIRSort(query._sort) : { createdAt: 'desc' },
      }),
      this.prisma.patient.count({ where }),
    ]);

    return this.createSearchBundle(
      patients.map((p) => this.convertInternalToFHIRPatient(p)),
      total,
      FHIRResourceType.PATIENT,
      query,
    );
  }

  async getPatientEverything(id: string, query: FHIREverythingDto): Promise<FHIRBundleDto> {
    const patient = await this.readPatient(id);

    const entries: FHIRBundleEntryDto[] = [
      {
        fullUrl: `${this.baseUrl}/Patient/${id}`,
        resource: patient,
        search: { mode: 'match' },
      },
    ];

    // Buscar consultas/agendamentos
    const appointments = await this.prisma.appointment.findMany({
      where: {
        patientId: id,
        deletedAt: null,
        ...(query.start && query.end
          ? {
              scheduledAt: {
                gte: new Date(query.start),
                lte: new Date(query.end),
              },
            }
          : {}),
      },
      include: {
        doctor: { include: { user: true } },
        clinic: true,
      },
    });

    for (const appt of appointments) {
      entries.push({
        fullUrl: `${this.baseUrl}/Appointment/${appt.id}`,
        resource: this.convertInternalToFHIRAppointment(appt),
        search: { mode: 'include' },
      });
    }

    // Buscar condições/diagnósticos
    const conditions = await this.prisma.diagnosis.findMany({
      where: {
        consultation: {
          patientId: id,
          deletedAt: null,
        },
      },
      include: {
        consultation: true,
      },
    });

    for (const condition of conditions) {
      entries.push({
        fullUrl: `${this.baseUrl}/Condition/${condition.id}`,
        resource: this.convertInternalToFHIRCondition(condition, id),
        search: { mode: 'include' },
      });
    }

    // Buscar prescrições
    const prescriptions = await this.prisma.prescription.findMany({
      where: {
        patientId: id,
        deletedAt: null,
      },
      include: {
        items: true,
        doctor: { include: { user: true } },
      },
    });

    for (const prescription of prescriptions) {
      entries.push({
        fullUrl: `${this.baseUrl}/MedicationRequest/${prescription.id}`,
        resource: this.convertInternalToFHIRMedicationRequest(prescription),
        search: { mode: 'include' },
      });
    }

    // Buscar resultados de laboratório
    const labResults = await this.prisma.labResult.findMany({
      where: {
        labOrder: {
          patientId: id,
          deletedAt: null,
        },
      },
      include: {
        labOrder: true,
      },
    });

    for (const result of labResults) {
      entries.push({
        fullUrl: `${this.baseUrl}/Observation/${result.id}`,
        resource: this.convertInternalToFHIRObservation(result, id),
        search: { mode: 'include' },
      });
    }

    return {
      resourceType: FHIRResourceType.BUNDLE,
      type: FHIRBundleType.SEARCHSET,
      timestamp: new Date().toISOString(),
      total: entries.length,
      link: [
        {
          relation: 'self',
          url: `${this.baseUrl}/Patient/${id}/$everything`,
        },
      ],
      entry: entries,
    };
  }

  // ==================== Practitioner Resource ====================

  async createPractitioner(dto: FHIRPractitionerDto, userId: string): Promise<FHIRPractitionerDto> {
    const practitionerData = this.convertFHIRPractitionerToInternal(dto);

    // Criar usuário e médico
    const user = await this.prisma.user.create({
      data: {
        email: practitionerData.email,
        name: practitionerData.name,
        role: 'DOCTOR',
      },
    });

    const doctor = await this.prisma.doctor.create({
      data: {
        userId: user.id,
        crm: practitionerData.crm,
        crmState: practitionerData.crmState,
        specialty: practitionerData.specialty,
        phone: practitionerData.phone,
        isActive: true,
      },
      include: {
        user: true,
      },
    });

    await this.auditService.log({
      action: 'FHIR_CREATE_PRACTITIONER',
      entityType: 'Practitioner',
      entityId: doctor.id,
      userId,
      newValues: dto,
    });

    return this.convertInternalToFHIRPractitioner(doctor);
  }

  async readPractitioner(id: string): Promise<FHIRPractitionerDto> {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id, deletedAt: null },
      include: {
        user: true,
      },
    });

    if (!doctor) {
      throw new NotFoundException({
        resourceType: 'OperationOutcome',
        issue: [
          {
            severity: 'error',
            code: 'not-found',
            diagnostics: `Practitioner/${id} not found`,
          },
        ],
      });
    }

    return this.convertInternalToFHIRPractitioner(doctor);
  }

  async searchPractitioners(query: FHIRPractitionerSearchDto): Promise<FHIRBundleDto> {
    const where: any = { deletedAt: null };

    if (query._id) {
      where.id = query._id;
    }

    if (query.identifier) {
      where.crm = { contains: query.identifier };
    }

    if (query.active !== undefined) {
      where.isActive = query.active;
    }

    if (query.name) {
      where.user = { name: { contains: query.name, mode: 'insensitive' } };
    }

    const count = query._count || 20;
    const offset = query._offset || 0;

    const [doctors, total] = await Promise.all([
      this.prisma.doctor.findMany({
        where,
        include: { user: true },
        take: count,
        skip: offset,
      }),
      this.prisma.doctor.count({ where }),
    ]);

    return this.createSearchBundle(
      doctors.map((d) => this.convertInternalToFHIRPractitioner(d)),
      total,
      FHIRResourceType.PRACTITIONER,
      query,
    );
  }

  // ==================== Organization Resource ====================

  async createOrganization(dto: FHIROrganizationDto, userId: string): Promise<FHIROrganizationDto> {
    const organizationData = this.convertFHIROrganizationToInternal(dto);

    const clinic = await this.prisma.clinic.create({
      data: organizationData,
    });

    await this.auditService.log({
      action: 'FHIR_CREATE_ORGANIZATION',
      entityType: 'Organization',
      entityId: clinic.id,
      userId,
      newValues: dto,
    });

    return this.convertInternalToFHIROrganization(clinic);
  }

  async readOrganization(id: string): Promise<FHIROrganizationDto> {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id, deletedAt: null },
    });

    if (!clinic) {
      throw new NotFoundException({
        resourceType: 'OperationOutcome',
        issue: [
          {
            severity: 'error',
            code: 'not-found',
            diagnostics: `Organization/${id} not found`,
          },
        ],
      });
    }

    return this.convertInternalToFHIROrganization(clinic);
  }

  async searchOrganizations(query: FHIROrganizationSearchDto): Promise<FHIRBundleDto> {
    const where: any = { deletedAt: null };

    if (query._id) {
      where.id = query._id;
    }

    if (query.identifier) {
      where.cnpj = query.identifier.replace(/[^0-9]/g, '');
    }

    if (query.active !== undefined) {
      where.isActive = query.active;
    }

    if (query.name) {
      where.name = { contains: query.name, mode: 'insensitive' };
    }

    if (query['address-city']) {
      where.city = { contains: query['address-city'], mode: 'insensitive' };
    }

    if (query['address-state']) {
      where.state = { contains: query['address-state'], mode: 'insensitive' };
    }

    const count = query._count || 20;
    const offset = query._offset || 0;

    const [clinics, total] = await Promise.all([
      this.prisma.clinic.findMany({
        where,
        take: count,
        skip: offset,
      }),
      this.prisma.clinic.count({ where }),
    ]);

    return this.createSearchBundle(
      clinics.map((c) => this.convertInternalToFHIROrganization(c)),
      total,
      FHIRResourceType.ORGANIZATION,
      query,
    );
  }

  // ==================== Appointment Resource ====================

  async createAppointment(dto: FHIRAppointmentDto, userId: string): Promise<FHIRAppointmentDto> {
    const appointmentData = this.convertFHIRAppointmentToInternal(dto);

    const appointment = await this.prisma.appointment.create({
      data: {
        ...appointmentData,
        createdById: userId,
      },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        clinic: true,
      },
    });

    await this.auditService.log({
      action: 'FHIR_CREATE_APPOINTMENT',
      entityType: 'Appointment',
      entityId: appointment.id,
      userId,
      newValues: dto,
    });

    return this.convertInternalToFHIRAppointment(appointment);
  }

  async readAppointment(id: string): Promise<FHIRAppointmentDto> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id, deletedAt: null },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        clinic: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException({
        resourceType: 'OperationOutcome',
        issue: [
          {
            severity: 'error',
            code: 'not-found',
            diagnostics: `Appointment/${id} not found`,
          },
        ],
      });
    }

    return this.convertInternalToFHIRAppointment(appointment);
  }

  async searchAppointments(query: FHIRAppointmentSearchDto): Promise<FHIRBundleDto> {
    const where: any = { deletedAt: null };

    if (query._id) {
      where.id = query._id;
    }

    if (query.patient) {
      where.patientId = this.extractIdFromReference(query.patient);
    }

    if (query.practitioner) {
      where.doctorId = this.extractIdFromReference(query.practitioner);
    }

    if (query.status) {
      where.status = this.mapFHIRAppointmentStatusToInternal(query.status);
    }

    if (query.date) {
      where.scheduledAt = this.parseFHIRDateSearch(query.date);
    }

    const count = query._count || 20;
    const offset = query._offset || 0;

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        include: {
          patient: true,
          doctor: { include: { user: true } },
          clinic: true,
        },
        take: count,
        skip: offset,
        orderBy: { scheduledAt: 'desc' },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return this.createSearchBundle(
      appointments.map((a) => this.convertInternalToFHIRAppointment(a)),
      total,
      FHIRResourceType.APPOINTMENT,
      query,
    );
  }

  // ==================== Observation Resource ====================

  async createObservation(dto: FHIRObservationDto, userId: string): Promise<FHIRObservationDto> {
    // Observações são mapeadas para resultados de laboratório ou sinais vitais
    const observationData = this.convertFHIRObservationToInternal(dto);

    const labResult = await this.prisma.labResult.create({
      data: observationData,
      include: {
        labOrder: true,
      },
    });

    await this.auditService.log({
      action: 'FHIR_CREATE_OBSERVATION',
      entityType: 'Observation',
      entityId: labResult.id,
      userId,
      newValues: dto,
    });

    return this.convertInternalToFHIRObservation(labResult, dto.subject?.reference?.split('/')[1] || '');
  }

  async readObservation(id: string): Promise<FHIRObservationDto> {
    const labResult = await this.prisma.labResult.findUnique({
      where: { id },
      include: {
        labOrder: {
          include: {
            patient: true,
          },
        },
      },
    });

    if (!labResult) {
      throw new NotFoundException({
        resourceType: 'OperationOutcome',
        issue: [
          {
            severity: 'error',
            code: 'not-found',
            diagnostics: `Observation/${id} not found`,
          },
        ],
      });
    }

    return this.convertInternalToFHIRObservation(labResult, labResult.labOrder.patientId);
  }

  async searchObservations(query: FHIRObservationSearchDto): Promise<FHIRBundleDto> {
    const where: any = {};

    if (query._id) {
      where.id = query._id;
    }

    if (query.patient || query.subject) {
      const patientId = this.extractIdFromReference(query.patient || query.subject || '');
      where.labOrder = { patientId };
    }

    if (query.code) {
      where.testCode = query.code;
    }

    if (query.status) {
      where.status = this.mapFHIRObservationStatusToInternal(query.status);
    }

    const count = query._count || 20;
    const offset = query._offset || 0;

    const [results, total] = await Promise.all([
      this.prisma.labResult.findMany({
        where,
        include: {
          labOrder: { include: { patient: true } },
        },
        take: count,
        skip: offset,
      }),
      this.prisma.labResult.count({ where }),
    ]);

    return this.createSearchBundle(
      results.map((r) => this.convertInternalToFHIRObservation(r, r.labOrder.patientId)),
      total,
      FHIRResourceType.OBSERVATION,
      query,
    );
  }

  // ==================== Condition Resource ====================

  async searchConditions(query: FHIRConditionSearchDto): Promise<FHIRBundleDto> {
    const where: any = {};

    if (query._id) {
      where.id = query._id;
    }

    if (query.patient || query.subject) {
      const patientId = this.extractIdFromReference(query.patient || query.subject || '');
      where.consultation = { patientId };
    }

    if (query.code) {
      where.icdCode = query.code;
    }

    const count = query._count || 20;
    const offset = query._offset || 0;

    const [diagnoses, total] = await Promise.all([
      this.prisma.diagnosis.findMany({
        where,
        include: {
          consultation: { include: { patient: true } },
        },
        take: count,
        skip: offset,
      }),
      this.prisma.diagnosis.count({ where }),
    ]);

    return this.createSearchBundle(
      diagnoses.map((d) => this.convertInternalToFHIRCondition(d, d.consultation.patientId)),
      total,
      FHIRResourceType.CONDITION,
      query,
    );
  }

  // ==================== MedicationRequest Resource ====================

  async searchMedicationRequests(query: FHIRMedicationRequestSearchDto): Promise<FHIRBundleDto> {
    const where: any = { deletedAt: null };

    if (query._id) {
      where.id = query._id;
    }

    if (query.patient || query.subject) {
      where.patientId = this.extractIdFromReference(query.patient || query.subject || '');
    }

    if (query.status) {
      where.status = this.mapFHIRMedicationStatusToInternal(query.status);
    }

    if (query.authoredon) {
      where.createdAt = this.parseFHIRDateSearch(query.authoredon);
    }

    const count = query._count || 20;
    const offset = query._offset || 0;

    const [prescriptions, total] = await Promise.all([
      this.prisma.prescription.findMany({
        where,
        include: {
          patient: true,
          doctor: { include: { user: true } },
          items: true,
        },
        take: count,
        skip: offset,
      }),
      this.prisma.prescription.count({ where }),
    ]);

    return this.createSearchBundle(
      prescriptions.map((p) => this.convertInternalToFHIRMedicationRequest(p)),
      total,
      FHIRResourceType.MEDICATION_REQUEST,
      query,
    );
  }

  // ==================== Bundle Operations ====================

  async processBundle(bundle: FHIRBundleDto, userId: string): Promise<FHIRBundleDto> {
    if (bundle.type !== FHIRBundleType.TRANSACTION && bundle.type !== FHIRBundleType.BATCH) {
      throw new BadRequestException({
        resourceType: 'OperationOutcome',
        issue: [
          {
            severity: 'error',
            code: 'invalid',
            diagnostics: 'Only transaction and batch bundles are supported',
          },
        ],
      });
    }

    const responseEntries: FHIRBundleEntryDto[] = [];
    const isTransaction = bundle.type === FHIRBundleType.TRANSACTION;

    // Para transaction, usar prisma transaction
    if (isTransaction) {
      await this.prisma.$transaction(async (tx) => {
        for (const entry of bundle.entry || []) {
          const response = await this.processEntry(entry, userId);
          responseEntries.push(response);
        }
      });
    } else {
      // Para batch, processar independentemente
      for (const entry of bundle.entry || []) {
        try {
          const response = await this.processEntry(entry, userId);
          responseEntries.push(response);
        } catch (error) {
          responseEntries.push({
            response: {
              status: '400 Bad Request',
              outcome: {
                resourceType: 'OperationOutcome',
                issue: [
                  {
                    severity: 'error',
                    code: 'exception',
                    diagnostics: error instanceof Error ? error.message : 'Unknown error',
                  },
                ],
              },
            },
          });
        }
      }
    }

    return {
      resourceType: FHIRResourceType.BUNDLE,
      type: isTransaction ? FHIRBundleType.TRANSACTION_RESPONSE : FHIRBundleType.BATCH_RESPONSE,
      timestamp: new Date().toISOString(),
      entry: responseEntries,
    };
  }

  private async processEntry(entry: FHIRBundleEntryDto, userId: string): Promise<FHIRBundleEntryDto> {
    const request = entry.request;
    if (!request) {
      throw new BadRequestException('Entry must have a request');
    }

    const [resourceType, id] = this.parseRequestUrl(request.url);

    let resource: any;
    let status: string;
    let location: string | undefined;

    switch (request.method) {
      case FHIRHTTPVerb.POST:
        resource = await this.createResource(resourceType, entry.resource, userId);
        status = '201 Created';
        location = `${resourceType}/${resource.id}`;
        break;

      case FHIRHTTPVerb.PUT:
        resource = await this.updateResource(resourceType, id!, entry.resource, userId);
        status = '200 OK';
        break;

      case FHIRHTTPVerb.DELETE:
        await this.deleteResource(resourceType, id!, userId);
        status = '204 No Content';
        break;

      case FHIRHTTPVerb.GET:
        resource = await this.readResource(resourceType, id!);
        status = '200 OK';
        break;

      default:
        throw new BadRequestException(`Unsupported method: ${request.method}`);
    }

    return {
      fullUrl: location ? `${this.baseUrl}/${location}` : undefined,
      resource,
      response: {
        status,
        location,
        lastModified: new Date().toISOString(),
      },
    };
  }

  // ==================== Conversion Methods ====================

  private convertFHIRPatientToInternal(dto: FHIRPatientDto): any {
    const name = dto.name?.[0];
    const phone = dto.telecom?.find((t) => t.system === ContactPointSystem.PHONE);
    const email = dto.telecom?.find((t) => t.system === ContactPointSystem.EMAIL);
    const address = dto.address?.[0];
    const cpf = dto.identifier?.find((i) => i.system === 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf');

    return {
      name: name?.text || [name?.family, ...(name?.given || [])].filter(Boolean).join(' '),
      email: email?.value,
      phone: phone?.value,
      cpf: cpf?.value?.replace(/[^0-9]/g, ''),
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      gender: this.mapFHIRGenderToInternal(dto.gender),
      address: address?.line?.join(', '),
      city: address?.city,
      state: address?.state,
      zipCode: address?.postalCode?.replace(/[^0-9]/g, ''),
      isActive: dto.active !== false,
    };
  }

  private convertInternalToFHIRPatient(patient: any): FHIRPatientDto {
    const nameParts = patient.name?.split(' ') || [];
    const family = nameParts.pop() || '';
    const given = nameParts;

    return {
      resourceType: FHIRResourceType.PATIENT,
      id: patient.id,
      meta: {
        versionId: String(patient.version || 1),
        lastUpdated: patient.updatedAt?.toISOString(),
        profile: ['http://hl7.org/fhir/StructureDefinition/Patient'],
      },
      identifier: [
        ...(patient.cpf
          ? [
              {
                use: 'official' as any,
                system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf',
                value: patient.cpf,
              },
            ]
          : []),
        {
          use: 'usual' as any,
          system: `${this.baseUrl}/NamingSystem/patient-id`,
          value: patient.id,
        },
      ],
      active: patient.isActive,
      name: [
        {
          use: NameUse.OFFICIAL,
          text: patient.name,
          family,
          given,
        },
      ],
      telecom: [
        ...(patient.phone
          ? [
              {
                system: ContactPointSystem.PHONE,
                value: patient.phone,
                use: ContactPointUse.MOBILE,
              },
            ]
          : []),
        ...(patient.email
          ? [
              {
                system: ContactPointSystem.EMAIL,
                value: patient.email,
                use: ContactPointUse.HOME,
              },
            ]
          : []),
      ],
      gender: this.mapInternalGenderToFHIR(patient.gender),
      birthDate: patient.birthDate?.toISOString().split('T')[0],
      address: patient.address || patient.city || patient.state
        ? [
            {
              use: AddressUse.HOME,
              type: 'both' as any,
              line: patient.address ? [patient.address] : undefined,
              city: patient.city,
              state: patient.state,
              postalCode: patient.zipCode,
              country: 'BR',
            },
          ]
        : undefined,
      managingOrganization: patient.clinicId
        ? {
            reference: `Organization/${patient.clinicId}`,
          }
        : undefined,
    };
  }

  private convertFHIRPractitionerToInternal(dto: FHIRPractitionerDto): any {
    const name = dto.name?.[0];
    const phone = dto.telecom?.find((t) => t.system === ContactPointSystem.PHONE);
    const email = dto.telecom?.find((t) => t.system === ContactPointSystem.EMAIL);
    const crm = dto.identifier?.find((i) => i.system?.includes('crm'));
    const qualification = dto.qualification?.[0];

    return {
      name: name?.text || [name?.family, ...(name?.given || [])].filter(Boolean).join(' '),
      email: email?.value,
      phone: phone?.value,
      crm: crm?.value,
      crmState: crm?.assigner?.display || 'SP',
      specialty: qualification?.code?.text || qualification?.code?.coding?.[0]?.display,
    };
  }

  private convertInternalToFHIRPractitioner(doctor: any): FHIRPractitionerDto {
    const nameParts = doctor.user?.name?.split(' ') || [];
    const family = nameParts.pop() || '';
    const given = nameParts;

    return {
      resourceType: FHIRResourceType.PRACTITIONER,
      id: doctor.id,
      meta: {
        versionId: '1',
        lastUpdated: doctor.updatedAt?.toISOString(),
      },
      identifier: [
        ...(doctor.crm
          ? [
              {
                use: 'official' as any,
                system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/crm',
                value: `${doctor.crm}/${doctor.crmState}`,
              },
            ]
          : []),
      ],
      active: doctor.isActive,
      name: [
        {
          use: NameUse.OFFICIAL,
          text: doctor.user?.name,
          family,
          given,
        },
      ],
      telecom: [
        ...(doctor.phone
          ? [
              {
                system: ContactPointSystem.PHONE,
                value: doctor.phone,
                use: ContactPointUse.WORK,
              },
            ]
          : []),
        ...(doctor.user?.email
          ? [
              {
                system: ContactPointSystem.EMAIL,
                value: doctor.user.email,
                use: ContactPointUse.WORK,
              },
            ]
          : []),
      ],
      qualification: doctor.specialty
        ? [
            {
              code: {
                coding: [
                  {
                    system: 'http://terminology.hl7.org/CodeSystem/v2-0360',
                    code: 'MD',
                    display: doctor.specialty,
                  },
                ],
                text: doctor.specialty,
              },
            },
          ]
        : undefined,
    };
  }

  private convertFHIROrganizationToInternal(dto: FHIROrganizationDto): any {
    const phone = dto.telecom?.find((t) => t.system === ContactPointSystem.PHONE);
    const email = dto.telecom?.find((t) => t.system === ContactPointSystem.EMAIL);
    const address = dto.address?.[0];
    const cnpj = dto.identifier?.find((i) => i.system?.includes('cnpj'));

    return {
      name: dto.name,
      email: email?.value,
      phone: phone?.value,
      cnpj: cnpj?.value?.replace(/[^0-9]/g, ''),
      address: address?.line?.join(', '),
      city: address?.city,
      state: address?.state,
      zipCode: address?.postalCode?.replace(/[^0-9]/g, ''),
      isActive: dto.active !== false,
    };
  }

  private convertInternalToFHIROrganization(clinic: any): FHIROrganizationDto {
    return {
      resourceType: FHIRResourceType.ORGANIZATION,
      id: clinic.id,
      meta: {
        versionId: '1',
        lastUpdated: clinic.updatedAt?.toISOString(),
      },
      identifier: [
        ...(clinic.cnpj
          ? [
              {
                use: 'official' as any,
                system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cnpj',
                value: clinic.cnpj,
              },
            ]
          : []),
      ],
      active: clinic.isActive,
      type: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/organization-type',
              code: 'prov',
              display: 'Healthcare Provider',
            },
          ],
        },
      ],
      name: clinic.name,
      telecom: [
        ...(clinic.phone
          ? [
              {
                system: ContactPointSystem.PHONE,
                value: clinic.phone,
                use: ContactPointUse.WORK,
              },
            ]
          : []),
        ...(clinic.email
          ? [
              {
                system: ContactPointSystem.EMAIL,
                value: clinic.email,
                use: ContactPointUse.WORK,
              },
            ]
          : []),
      ],
      address: clinic.address || clinic.city
        ? [
            {
              use: AddressUse.WORK,
              type: 'both' as any,
              line: clinic.address ? [clinic.address] : undefined,
              city: clinic.city,
              state: clinic.state,
              postalCode: clinic.zipCode,
              country: 'BR',
            },
          ]
        : undefined,
    };
  }

  private convertFHIRAppointmentToInternal(dto: FHIRAppointmentDto): any {
    const patientParticipant = dto.participant.find((p) =>
      p.actor?.reference?.startsWith('Patient/'),
    );
    const practitionerParticipant = dto.participant.find((p) =>
      p.actor?.reference?.startsWith('Practitioner/'),
    );

    return {
      patientId: patientParticipant?.actor?.reference?.split('/')[1],
      doctorId: practitionerParticipant?.actor?.reference?.split('/')[1],
      scheduledAt: dto.start ? new Date(dto.start) : undefined,
      endTime: dto.end ? new Date(dto.end) : undefined,
      status: this.mapFHIRAppointmentStatusToInternal(dto.status),
      type: dto.appointmentType?.text || dto.serviceType?.[0]?.text || 'CONSULTATION',
      notes: dto.comment,
    };
  }

  private convertInternalToFHIRAppointment(appointment: any): FHIRAppointmentDto {
    return {
      resourceType: FHIRResourceType.APPOINTMENT,
      id: appointment.id,
      meta: {
        versionId: '1',
        lastUpdated: appointment.updatedAt?.toISOString(),
      },
      status: this.mapInternalAppointmentStatusToFHIR(appointment.status),
      serviceType: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/service-type',
              code: appointment.type,
              display: appointment.type,
            },
          ],
          text: appointment.type,
        },
      ],
      start: appointment.scheduledAt?.toISOString(),
      end: appointment.endTime?.toISOString(),
      minutesDuration: appointment.duration,
      created: appointment.createdAt?.toISOString(),
      comment: appointment.notes,
      participant: [
        {
          actor: {
            reference: `Patient/${appointment.patientId}`,
            display: appointment.patient?.name,
          },
          status: 'accepted',
        },
        {
          actor: {
            reference: `Practitioner/${appointment.doctorId}`,
            display: appointment.doctor?.user?.name,
          },
          status: 'accepted',
        },
        ...(appointment.clinicId
          ? [
              {
                actor: {
                  reference: `Location/${appointment.clinicId}`,
                  display: appointment.clinic?.name,
                },
                status: 'accepted' as const,
              },
            ]
          : []),
      ],
    };
  }

  private convertFHIRObservationToInternal(dto: FHIRObservationDto): any {
    return {
      testCode: dto.code?.coding?.[0]?.code,
      testName: dto.code?.text || dto.code?.coding?.[0]?.display,
      value: dto.valueQuantity?.value?.toString() || dto.valueString,
      unit: dto.valueQuantity?.unit,
      referenceRange: dto.referenceRange?.[0]
        ? `${dto.referenceRange[0].low?.value || ''} - ${dto.referenceRange[0].high?.value || ''}`
        : undefined,
      status: this.mapFHIRObservationStatusToInternal(dto.status),
      isCritical: dto.interpretation?.some((i) =>
        i.coding?.some((c) => ['H', 'HH', 'L', 'LL', 'A'].includes(c.code || '')),
      ),
    };
  }

  private convertInternalToFHIRObservation(result: any, patientId: string): FHIRObservationDto {
    return {
      resourceType: FHIRResourceType.OBSERVATION,
      id: result.id,
      meta: {
        versionId: '1',
        lastUpdated: result.updatedAt?.toISOString(),
      },
      status: this.mapInternalObservationStatusToFHIR(result.status),
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'laboratory',
              display: 'Laboratory',
            },
          ],
        },
      ],
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: result.testCode,
            display: result.testName,
          },
        ],
        text: result.testName,
      },
      subject: {
        reference: `Patient/${patientId}`,
      },
      effectiveDateTime: result.performedAt?.toISOString(),
      issued: result.createdAt?.toISOString(),
      valueQuantity: result.value && !isNaN(parseFloat(result.value))
        ? {
            value: parseFloat(result.value),
            unit: result.unit,
            system: 'http://unitsofmeasure.org',
            code: result.unit,
          }
        : undefined,
      valueString: result.value && isNaN(parseFloat(result.value)) ? result.value : undefined,
      interpretation: result.isCritical
        ? [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                  code: 'A',
                  display: 'Abnormal',
                },
              ],
            },
          ]
        : undefined,
      note: result.notes ? [{ text: result.notes }] : undefined,
    };
  }

  private convertInternalToFHIRCondition(diagnosis: any, patientId: string): FHIRConditionDto {
    return {
      resourceType: FHIRResourceType.CONDITION,
      id: diagnosis.id,
      meta: {
        versionId: '1',
        lastUpdated: diagnosis.updatedAt?.toISOString(),
      },
      clinicalStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
            code: 'active',
            display: 'Active',
          },
        ],
      },
      verificationStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
            code: 'confirmed',
            display: 'Confirmed',
          },
        ],
      },
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/condition-category',
              code: 'encounter-diagnosis',
              display: 'Encounter Diagnosis',
            },
          ],
        },
      ],
      code: {
        coding: [
          {
            system: 'http://hl7.org/fhir/sid/icd-10',
            code: diagnosis.icdCode,
            display: diagnosis.description,
          },
        ],
        text: diagnosis.description,
      },
      subject: {
        reference: `Patient/${patientId}`,
      },
      encounter: diagnosis.consultationId
        ? {
            reference: `Encounter/${diagnosis.consultationId}`,
          }
        : undefined,
      recordedDate: diagnosis.createdAt?.toISOString(),
      note: diagnosis.notes ? [{ text: diagnosis.notes }] : undefined,
    };
  }

  private convertInternalToFHIRMedicationRequest(prescription: any): FHIRMedicationRequestDto {
    // Para cada item da prescrição, seria ideal criar um MedicationRequest separado
    // Aqui simplificamos para o primeiro item
    const item = prescription.items?.[0];

    return {
      resourceType: FHIRResourceType.MEDICATION_REQUEST,
      id: prescription.id,
      meta: {
        versionId: '1',
        lastUpdated: prescription.updatedAt?.toISOString(),
      },
      status: this.mapInternalPrescriptionStatusToFHIR(prescription.status),
      intent: MedicationRequestIntent.ORDER,
      medicationCodeableConcept: item
        ? {
            coding: [
              {
                system: 'http://www.anvisa.gov.br/medicamentos',
                code: item.medicationCode,
                display: item.medicationName,
              },
            ],
            text: item.medicationName,
          }
        : undefined,
      subject: {
        reference: `Patient/${prescription.patientId}`,
        display: prescription.patient?.name,
      },
      authoredOn: prescription.createdAt?.toISOString(),
      requester: {
        reference: `Practitioner/${prescription.doctorId}`,
        display: prescription.doctor?.user?.name,
      },
      dosageInstruction: item
        ? [
            {
              text: item.instructions,
              timing: {
                code: {
                  text: item.frequency,
                },
              },
              doseAndRate: [
                {
                  doseQuantity: {
                    value: parseFloat(item.dosage) || undefined,
                    unit: item.unit,
                  },
                },
              ],
            },
          ]
        : undefined,
      dispenseRequest: item
        ? {
            quantity: {
              value: item.quantity,
              unit: item.unit,
            },
            expectedSupplyDuration: item.duration
              ? {
                  value: parseInt(item.duration),
                  unit: 'd',
                  system: 'http://unitsofmeasure.org',
                  code: 'd',
                }
              : undefined,
          }
        : undefined,
      note: prescription.notes ? [{ text: prescription.notes }] : undefined,
    };
  }

  // ==================== Helper Methods ====================

  private createSearchBundle(
    resources: any[],
    total: number,
    resourceType: FHIRResourceType,
    query: any,
  ): FHIRBundleDto {
    const entries: FHIRBundleEntryDto[] = resources.map((resource) => ({
      fullUrl: `${this.baseUrl}/${resourceType}/${resource.id}`,
      resource,
      search: {
        mode: 'match' as const,
      },
    }));

    const count = query._count || 20;
    const offset = query._offset || 0;

    const links = [
      {
        relation: 'self',
        url: this.buildSearchUrl(resourceType, query),
      },
    ];

    if (offset + count < total) {
      links.push({
        relation: 'next',
        url: this.buildSearchUrl(resourceType, { ...query, _offset: offset + count }),
      });
    }

    if (offset > 0) {
      links.push({
        relation: 'previous',
        url: this.buildSearchUrl(resourceType, { ...query, _offset: Math.max(0, offset - count) }),
      });
    }

    return {
      resourceType: FHIRResourceType.BUNDLE,
      type: FHIRBundleType.SEARCHSET,
      timestamp: new Date().toISOString(),
      total,
      link: links,
      entry: entries,
    };
  }

  private buildSearchUrl(resourceType: FHIRResourceType, query: any): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    }
    return `${this.baseUrl}/${resourceType}?${params.toString()}`;
  }

  private extractIdFromReference(reference: string): string {
    const parts = reference.split('/');
    return parts[parts.length - 1];
  }

  private parseRequestUrl(url: string): [FHIRResourceType, string | undefined] {
    const parts = url.split('/').filter(Boolean);
    const resourceType = parts[0] as FHIRResourceType;
    const id = parts[1];
    return [resourceType, id];
  }

  private parseFHIRDateSearch(dateParam: string): any {
    // Suporta prefixos FHIR: eq, ne, lt, gt, le, ge, sa, eb, ap
    const match = dateParam.match(/^(eq|ne|lt|gt|le|ge|sa|eb|ap)?(.+)$/);
    if (!match) return undefined;

    const [, prefix = 'eq', dateStr] = match;
    const date = new Date(dateStr);

    switch (prefix) {
      case 'eq':
        return { equals: date };
      case 'ne':
        return { not: date };
      case 'lt':
        return { lt: date };
      case 'gt':
        return { gt: date };
      case 'le':
        return { lte: date };
      case 'ge':
        return { gte: date };
      default:
        return { equals: date };
    }
  }

  private parseFHIRSort(sortParam: string): any {
    const fields = sortParam.split(',');
    const orderBy: any[] = [];

    for (const field of fields) {
      const desc = field.startsWith('-');
      const fieldName = desc ? field.substring(1) : field;
      orderBy.push({ [fieldName]: desc ? 'desc' : 'asc' });
    }

    return orderBy.length === 1 ? orderBy[0] : orderBy;
  }

  private mapFHIRGenderToInternal(gender?: string): string {
    switch (gender) {
      case 'male':
        return 'MALE';
      case 'female':
        return 'FEMALE';
      case 'other':
        return 'OTHER';
      default:
        return 'NOT_SPECIFIED';
    }
  }

  private mapInternalGenderToFHIR(gender?: string): AdministrativeGender {
    switch (gender) {
      case 'MALE':
        return AdministrativeGender.MALE;
      case 'FEMALE':
        return AdministrativeGender.FEMALE;
      case 'OTHER':
        return AdministrativeGender.OTHER;
      default:
        return AdministrativeGender.UNKNOWN;
    }
  }

  private mapFHIRAppointmentStatusToInternal(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.PROPOSED:
      case AppointmentStatus.PENDING:
        return 'PENDING';
      case AppointmentStatus.BOOKED:
        return 'SCHEDULED';
      case AppointmentStatus.ARRIVED:
      case AppointmentStatus.CHECKED_IN:
        return 'CONFIRMED';
      case AppointmentStatus.FULFILLED:
        return 'COMPLETED';
      case AppointmentStatus.CANCELLED:
        return 'CANCELLED';
      case AppointmentStatus.NOSHOW:
        return 'NO_SHOW';
      default:
        return 'PENDING';
    }
  }

  private mapInternalAppointmentStatusToFHIR(status: string): AppointmentStatus {
    switch (status) {
      case 'PENDING':
        return AppointmentStatus.PENDING;
      case 'SCHEDULED':
        return AppointmentStatus.BOOKED;
      case 'CONFIRMED':
        return AppointmentStatus.BOOKED;
      case 'IN_PROGRESS':
        return AppointmentStatus.ARRIVED;
      case 'COMPLETED':
        return AppointmentStatus.FULFILLED;
      case 'CANCELLED':
        return AppointmentStatus.CANCELLED;
      case 'NO_SHOW':
        return AppointmentStatus.NOSHOW;
      default:
        return AppointmentStatus.PENDING;
    }
  }

  private mapFHIRObservationStatusToInternal(status: ObservationStatus): string {
    switch (status) {
      case ObservationStatus.REGISTERED:
        return 'PENDING';
      case ObservationStatus.PRELIMINARY:
        return 'IN_PROGRESS';
      case ObservationStatus.FINAL:
        return 'COMPLETED';
      case ObservationStatus.AMENDED:
      case ObservationStatus.CORRECTED:
        return 'COMPLETED';
      case ObservationStatus.CANCELLED:
        return 'CANCELLED';
      default:
        return 'PENDING';
    }
  }

  private mapInternalObservationStatusToFHIR(status: string): ObservationStatus {
    switch (status) {
      case 'PENDING':
        return ObservationStatus.REGISTERED;
      case 'IN_PROGRESS':
        return ObservationStatus.PRELIMINARY;
      case 'COMPLETED':
        return ObservationStatus.FINAL;
      case 'CANCELLED':
        return ObservationStatus.CANCELLED;
      default:
        return ObservationStatus.UNKNOWN;
    }
  }

  private mapFHIRMedicationStatusToInternal(status: string): string {
    switch (status) {
      case 'active':
        return 'ACTIVE';
      case 'completed':
        return 'COMPLETED';
      case 'cancelled':
        return 'CANCELLED';
      case 'stopped':
        return 'CANCELLED';
      default:
        return 'ACTIVE';
    }
  }

  private mapInternalPrescriptionStatusToFHIR(status: string): MedicationRequestStatus {
    switch (status) {
      case 'ACTIVE':
        return MedicationRequestStatus.ACTIVE;
      case 'COMPLETED':
        return MedicationRequestStatus.COMPLETED;
      case 'CANCELLED':
        return MedicationRequestStatus.CANCELLED;
      default:
        return MedicationRequestStatus.ACTIVE;
    }
  }

  private async createResource(resourceType: FHIRResourceType, resource: any, userId: string): Promise<any> {
    switch (resourceType) {
      case FHIRResourceType.PATIENT:
        return this.createPatient(resource, userId);
      case FHIRResourceType.PRACTITIONER:
        return this.createPractitioner(resource, userId);
      case FHIRResourceType.ORGANIZATION:
        return this.createOrganization(resource, userId);
      case FHIRResourceType.APPOINTMENT:
        return this.createAppointment(resource, userId);
      case FHIRResourceType.OBSERVATION:
        return this.createObservation(resource, userId);
      default:
        throw new BadRequestException(`Unsupported resource type: ${resourceType}`);
    }
  }

  private async readResource(resourceType: FHIRResourceType, id: string): Promise<any> {
    switch (resourceType) {
      case FHIRResourceType.PATIENT:
        return this.readPatient(id);
      case FHIRResourceType.PRACTITIONER:
        return this.readPractitioner(id);
      case FHIRResourceType.ORGANIZATION:
        return this.readOrganization(id);
      case FHIRResourceType.APPOINTMENT:
        return this.readAppointment(id);
      case FHIRResourceType.OBSERVATION:
        return this.readObservation(id);
      default:
        throw new BadRequestException(`Unsupported resource type: ${resourceType}`);
    }
  }

  private async updateResource(
    resourceType: FHIRResourceType,
    id: string,
    resource: any,
    userId: string,
  ): Promise<any> {
    switch (resourceType) {
      case FHIRResourceType.PATIENT:
        return this.updatePatient(id, resource, userId);
      default:
        throw new BadRequestException(`Update not supported for: ${resourceType}`);
    }
  }

  private async deleteResource(resourceType: FHIRResourceType, id: string, userId: string): Promise<void> {
    switch (resourceType) {
      case FHIRResourceType.PATIENT:
        return this.deletePatient(id, userId);
      default:
        throw new BadRequestException(`Delete not supported for: ${resourceType}`);
    }
  }

  private getPatientIncludes() {
    return {
      clinic: true,
    };
  }

  private getPatientSearchParams() {
    return [
      { name: '_id', type: 'token' },
      { name: 'identifier', type: 'token' },
      { name: 'active', type: 'token' },
      { name: 'family', type: 'string' },
      { name: 'given', type: 'string' },
      { name: 'name', type: 'string' },
      { name: 'gender', type: 'token' },
      { name: 'birthdate', type: 'date' },
      { name: 'address', type: 'string' },
      { name: 'address-city', type: 'string' },
      { name: 'address-state', type: 'string' },
      { name: 'address-postalcode', type: 'string' },
      { name: 'phone', type: 'token' },
      { name: 'email', type: 'token' },
      { name: 'organization', type: 'reference' },
    ];
  }

  private getPractitionerSearchParams() {
    return [
      { name: '_id', type: 'token' },
      { name: 'identifier', type: 'token' },
      { name: 'active', type: 'token' },
      { name: 'name', type: 'string' },
      { name: 'family', type: 'string' },
      { name: 'given', type: 'string' },
      { name: 'phone', type: 'token' },
      { name: 'email', type: 'token' },
    ];
  }

  private getOrganizationSearchParams() {
    return [
      { name: '_id', type: 'token' },
      { name: 'identifier', type: 'token' },
      { name: 'active', type: 'token' },
      { name: 'name', type: 'string' },
      { name: 'type', type: 'token' },
      { name: 'address', type: 'string' },
      { name: 'address-city', type: 'string' },
      { name: 'address-state', type: 'string' },
    ];
  }

  private getAppointmentSearchParams() {
    return [
      { name: '_id', type: 'token' },
      { name: 'identifier', type: 'token' },
      { name: 'status', type: 'token' },
      { name: 'date', type: 'date' },
      { name: 'patient', type: 'reference' },
      { name: 'practitioner', type: 'reference' },
      { name: 'location', type: 'reference' },
      { name: 'service-type', type: 'token' },
    ];
  }

  private getObservationSearchParams() {
    return [
      { name: '_id', type: 'token' },
      { name: 'identifier', type: 'token' },
      { name: 'status', type: 'token' },
      { name: 'code', type: 'token' },
      { name: 'subject', type: 'reference' },
      { name: 'patient', type: 'reference' },
      { name: 'date', type: 'date' },
      { name: 'category', type: 'token' },
    ];
  }

  private getConditionSearchParams() {
    return [
      { name: '_id', type: 'token' },
      { name: 'identifier', type: 'token' },
      { name: 'clinical-status', type: 'token' },
      { name: 'verification-status', type: 'token' },
      { name: 'code', type: 'token' },
      { name: 'subject', type: 'reference' },
      { name: 'patient', type: 'reference' },
      { name: 'recorded-date', type: 'date' },
    ];
  }

  private getMedicationRequestSearchParams() {
    return [
      { name: '_id', type: 'token' },
      { name: 'identifier', type: 'token' },
      { name: 'status', type: 'token' },
      { name: 'intent', type: 'token' },
      { name: 'subject', type: 'reference' },
      { name: 'patient', type: 'reference' },
      { name: 'code', type: 'token' },
      { name: 'authoredon', type: 'date' },
      { name: 'requester', type: 'reference' },
    ];
  }

  private getGlobalSearchParams() {
    return [
      { name: '_id', type: 'token' },
      { name: '_lastUpdated', type: 'date' },
      { name: '_tag', type: 'token' },
      { name: '_profile', type: 'reference' },
      { name: '_security', type: 'token' },
      { name: '_text', type: 'string' },
      { name: '_content', type: 'string' },
      { name: '_count', type: 'number' },
      { name: '_offset', type: 'number' },
      { name: '_sort', type: 'string' },
      { name: '_elements', type: 'string' },
      { name: '_include', type: 'string' },
      { name: '_revinclude', type: 'string' },
    ];
  }

  private getSystemOperations() {
    return [
      {
        name: 'validate',
        definition: `${this.baseUrl}/OperationDefinition/-validate`,
      },
    ];
  }
}
