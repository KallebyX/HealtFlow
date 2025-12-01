# HEALTHFLOW - ULTRA AGENT SYSTEM - PARTE 3
## Módulos de Pacientes, Clínicas e Agendamento Completos

---

## FASE 2: MÓDULO DE PACIENTES [Dias 29-42]

### 2.1 PATIENTS DTOs

#### PROMPT 2.1.1: DTOs Completos de Pacientes
```typescript
CRIAR ARQUIVO: /healthflow/apps/api/src/modules/patients/dto/create-patient.dto.ts

import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  IsNumber,
  IsDateString,
  ValidateNested,
  Min,
  Max,
  MaxLength,
  MinLength,
  Matches,
  IsMobilePhone,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, BloodType } from '@prisma/client';

export class AddressDto {
  @ApiProperty({ example: 'Rua das Flores', description: 'Nome da rua' })
  @IsString()
  @MaxLength(255)
  street: string;

  @ApiProperty({ example: '123' })
  @IsString()
  @MaxLength(20)
  number: string;

  @ApiPropertyOptional({ example: 'Apto 101' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  complement?: string;

  @ApiProperty({ example: 'Centro' })
  @IsString()
  @MaxLength(100)
  neighborhood: string;

  @ApiProperty({ example: 'São Paulo' })
  @IsString()
  @MaxLength(100)
  city: string;

  @ApiProperty({ example: 'SP' })
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  state: string;

  @ApiProperty({ example: '01234-567' })
  @IsString()
  @Matches(/^\d{5}-?\d{3}$/, { message: 'CEP inválido' })
  zipCode: string;

  @ApiProperty({ example: 'BR', default: 'BR' })
  @IsString()
  @MaxLength(2)
  country: string = 'BR';

  @ApiPropertyOptional({ example: -23.5505, description: 'Latitude' })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ example: -46.6333, description: 'Longitude' })
  @IsOptional()
  @IsNumber()
  lng?: number;
}

export class EmergencyContactDto {
  @ApiProperty({ example: 'Maria da Silva' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: '+5511999999999' })
  @IsMobilePhone('pt-BR')
  phone: string;

  @ApiProperty({ example: 'Mãe' })
  @IsString()
  @MaxLength(50)
  relationship: string;
}

export class HealthInsuranceDto {
  @ApiProperty({ example: 'Unimed' })
  @IsString()
  @MaxLength(100)
  provider: string;

  @ApiProperty({ example: 'Plano Ouro' })
  @IsString()
  @MaxLength(100)
  planName: string;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  @MaxLength(50)
  cardNumber: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  validity?: string;
}

export class CurrentMedicationDto {
  @ApiProperty({ example: 'Losartana' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: '50mg' })
  @IsString()
  @MaxLength(50)
  dosage: string;

  @ApiProperty({ example: '1x ao dia' })
  @IsString()
  @MaxLength(100)
  frequency: string;

  @ApiPropertyOptional({ example: 'Hipertensão' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;

  @ApiPropertyOptional({ example: '2023-01-15' })
  @IsOptional()
  @IsDateString()
  startDate?: string;
}

export class FamilyHistoryItemDto {
  @ApiProperty({ example: 'Diabetes Tipo 2' })
  @IsString()
  @MaxLength(255)
  condition: string;

  @ApiProperty({ example: 'Pai' })
  @IsString()
  @MaxLength(50)
  relationship: string;

  @ApiPropertyOptional({ example: 'Diagnosticado aos 50 anos' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class SurgicalHistoryItemDto {
  @ApiProperty({ example: 'Apendicectomia' })
  @IsString()
  @MaxLength(255)
  procedure: string;

  @ApiProperty({ example: '2015' })
  @IsString()
  @MaxLength(10)
  year: string;

  @ApiPropertyOptional({ example: 'Hospital São Paulo' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  hospital?: string;

  @ApiPropertyOptional({ example: 'Sem complicações' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class CreatePatientDto {
  // ═══════════════════════════════════════════════════════════════════════════
  // DADOS OBRIGATÓRIOS
  // ═══════════════════════════════════════════════════════════════════════════

  @ApiProperty({ example: '123.456.789-00', description: 'CPF do paciente' })
  @IsString()
  @Matches(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, { message: 'CPF inválido' })
  cpf: string;

  @ApiProperty({ example: 'João da Silva Santos', description: 'Nome completo' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  fullName: string;

  @ApiProperty({ example: '1990-05-15', description: 'Data de nascimento' })
  @IsDateString()
  birthDate: string;

  @ApiProperty({ enum: Gender, example: Gender.MALE })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ example: '+5511999999999', description: 'Telefone principal' })
  @IsMobilePhone('pt-BR')
  phone: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // DADOS OPCIONAIS
  // ═══════════════════════════════════════════════════════════════════════════

  @ApiPropertyOptional({ example: 'João', description: 'Nome social' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  socialName?: string;

  @ApiPropertyOptional({ example: '+5511988888888', description: 'Telefone secundário' })
  @IsOptional()
  @IsMobilePhone('pt-BR')
  phoneSecondary?: string;

  // Biometria
  @ApiPropertyOptional({ example: 175, description: 'Altura em centímetros' })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(300)
  height?: number;

  @ApiPropertyOptional({ example: 70, description: 'Peso em kg' })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(500)
  weight?: number;

  @ApiPropertyOptional({ enum: BloodType, example: BloodType.O_POSITIVE })
  @IsOptional()
  @IsEnum(BloodType)
  bloodType?: BloodType;

  // Foto
  @ApiPropertyOptional({ description: 'URL da foto de perfil' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  profilePhotoUrl?: string;

  // Endereço
  @ApiPropertyOptional({ type: AddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  // Contato de emergência
  @ApiPropertyOptional({ type: EmergencyContactDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact?: EmergencyContactDto;

  // Convênio
  @ApiPropertyOptional({ type: HealthInsuranceDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => HealthInsuranceDto)
  healthInsurance?: HealthInsuranceDto;

  // CNS
  @ApiPropertyOptional({ example: '123456789012345', description: 'Cartão Nacional de Saúde' })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  cns?: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // DADOS MÉDICOS
  // ═══════════════════════════════════════════════════════════════════════════

  @ApiPropertyOptional({ example: ['Penicilina', 'Dipirona'], description: 'Alergias conhecidas' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @ApiPropertyOptional({ example: ['Hipertensão', 'Diabetes'], description: 'Condições crônicas' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  chronicConditions?: string[];

  @ApiPropertyOptional({ type: [CurrentMedicationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CurrentMedicationDto)
  currentMedications?: CurrentMedicationDto[];

  @ApiPropertyOptional({ type: [FamilyHistoryItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FamilyHistoryItemDto)
  familyHistory?: FamilyHistoryItemDto[];

  @ApiPropertyOptional({ type: [SurgicalHistoryItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SurgicalHistoryItemDto)
  surgicalHistory?: SurgicalHistoryItemDto[];

  // ═══════════════════════════════════════════════════════════════════════════
  // ESTILO DE VIDA
  // ═══════════════════════════════════════════════════════════════════════════

  @ApiPropertyOptional({ 
    example: 'never', 
    description: 'Status de tabagismo',
    enum: ['never', 'former', 'current', 'occasional'] 
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  smokingStatus?: string;

  @ApiPropertyOptional({ 
    example: 'social',
    description: 'Consumo de álcool',
    enum: ['never', 'occasional', 'social', 'regular', 'heavy']
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  alcoholConsumption?: string;

  @ApiPropertyOptional({ 
    example: 'regular',
    description: 'Nível de atividade física',
    enum: ['sedentary', 'light', 'moderate', 'regular', 'intense']
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  physicalActivity?: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // PREFERÊNCIAS
  // ═══════════════════════════════════════════════════════════════════════════

  @ApiPropertyOptional({ example: 'pt-BR', default: 'pt-BR' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  preferredLanguage?: string;

  @ApiPropertyOptional({ example: 'America/Sao_Paulo', default: 'America/Sao_Paulo' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;
}

export class UpdatePatientDto {
  // Todos os campos são opcionais para update
  @ApiPropertyOptional({ example: 'João da Silva Santos' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  fullName?: string;

  @ApiPropertyOptional({ example: 'João' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  socialName?: string;

  @ApiPropertyOptional({ example: '+5511999999999' })
  @IsOptional()
  @IsMobilePhone('pt-BR')
  phone?: string;

  @ApiPropertyOptional({ example: '+5511988888888' })
  @IsOptional()
  @IsMobilePhone('pt-BR')
  phoneSecondary?: string;

  @ApiPropertyOptional({ example: 175 })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(300)
  height?: number;

  @ApiPropertyOptional({ example: 70 })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(500)
  weight?: number;

  @ApiPropertyOptional({ enum: BloodType })
  @IsOptional()
  @IsEnum(BloodType)
  bloodType?: BloodType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  profilePhotoUrl?: string;

  @ApiPropertyOptional({ type: AddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({ type: EmergencyContactDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact?: EmergencyContactDto;

  @ApiPropertyOptional({ type: HealthInsuranceDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => HealthInsuranceDto)
  healthInsurance?: HealthInsuranceDto;

  @ApiPropertyOptional({ example: ['Penicilina', 'Dipirona'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @ApiPropertyOptional({ example: ['Hipertensão', 'Diabetes'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  chronicConditions?: string[];

  @ApiPropertyOptional({ type: [CurrentMedicationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CurrentMedicationDto)
  currentMedications?: CurrentMedicationDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  smokingStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  alcoholConsumption?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  physicalActivity?: string;
}
```

#### CHECKPOINT 2.1.1:
```
VALIDAÇÃO OBRIGATÓRIA:
[ ] DTOs criados sem erros de TypeScript?
[ ] Todas as validações implementadas?
[ ] Documentação Swagger completa?
[ ] Transformers configurados?

SE TUDO "SIM" → PROSSEGUIR
SE ALGUM "NÃO" → CORRIGIR E REVALIDAR
```

---

### 2.2 PATIENTS SERVICE

#### PROMPT 2.2.1: Service Completo de Pacientes
```typescript
CRIAR ARQUIVO: /healthflow/apps/api/src/modules/patients/patients.service.ts

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
import { FhirService } from '@/modules/integrations/fhir/fhir.service';
import { CreatePatientDto, UpdatePatientDto } from './dto/create-patient.dto';
import { PatientQueryDto } from './dto/patient-query.dto';
import { CreateVitalSignDto } from './dto/vital-sign.dto';
import { Patient, VitalSign, AuditAction, TriageLevel } from '@prisma/client';

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
    private readonly fhirService: FhirService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // CRUD BÁSICO
  // ═══════════════════════════════════════════════════════════════════════════

  async findAll(
    query: PatientQueryDto,
    clinicId?: string,
  ): Promise<{ data: Patient[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, search, status, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    // Filtro por clínica (multi-tenant)
    if (clinicId) {
      where.clinicPatients = {
        some: { clinicId },
      };
    }

    // Busca por nome ou CPF
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { socialName: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: search.replace(/\D/g, '') } },
        { phone: { contains: search.replace(/\D/g, '') } },
      ];
    }

    // Filtro por status (user status)
    if (status) {
      where.user = { status };
    }

    const [data, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder || 'asc' } : { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              status: true,
              lastLoginAt: true,
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
            lastLoginAt: true,
            createdAt: true,
          },
        },
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

    // Verificar permissão (paciente só pode ver seus próprios dados)
    if (userId && patient.userId !== userId) {
      // Se não for o próprio paciente, verificar se é médico/admin
      // Isso deve ser tratado no guard, mas dupla verificação
      this.logger.warn(`Unauthorized access attempt to patient ${id} by user ${userId}`);
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
            phoneVerified: true,
            lastLoginAt: true,
          },
        },
        vitalSigns: {
          orderBy: { measuredAt: 'desc' },
          take: 5,
        },
        badges: {
          include: { badge: true },
          orderBy: { earnedAt: 'desc' },
          take: 10,
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

  async update(
    id: string,
    dto: UpdatePatientDto,
    updatedBy: string,
  ): Promise<Patient> {
    const patient = await this.findById(id);

    // Preparar dados para atualização
    const updateData: any = { ...dto };

    // Converter objetos nested para JSON
    if (dto.address) updateData.address = dto.address;
    if (dto.emergencyContact) updateData.emergencyContact = dto.emergencyContact;
    if (dto.healthInsurance) updateData.healthInsurance = dto.healthInsurance;
    if (dto.currentMedications) updateData.currentMedications = dto.currentMedications;

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

    // Atualizar recurso FHIR
    await this.fhirService.updatePatientResource(updatedPatient);

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
    await this.prisma.patient.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Desativar usuário também
    await this.prisma.user.update({
      where: { id: patient.userId },
      data: { status: 'INACTIVE', deletedAt: new Date() },
    });

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

    this.logger.log(`Patient soft deleted: ${id} by ${deletedBy}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SINAIS VITAIS
  // ═══════════════════════════════════════════════════════════════════════════

  async addVitalSign(
    patientId: string,
    dto: CreateVitalSignDto,
    recordedBy: string,
  ): Promise<VitalSign> {
    // Verificar se paciente existe
    await this.findById(patientId);

    // Calcular nível de triagem automaticamente
    const triageLevel = this.calculateTriageLevel(dto);
    const isAbnormal = this.checkAbnormalValues(dto);

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
        measuredAt: dto.measuredAt ? new Date(dto.measuredAt) : new Date(),
        source: dto.source || 'manual',
        deviceId: dto.deviceId,
        notes: dto.notes,
        triageLevel,
        isAbnormal,
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
    }

    // Se valores anormais, emitir alerta
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

    return vitalSign;
  }

  async getVitalSignHistory(
    patientId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      type?: string;
    } = {},
  ): Promise<VitalSign[]> {
    const { startDate, endDate, limit = 100 } = options;

    const where: any = { patientId };

    if (startDate || endDate) {
      where.measuredAt = {};
      if (startDate) where.measuredAt.gte = startDate;
      if (endDate) where.measuredAt.lte = endDate;
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

  // ═══════════════════════════════════════════════════════════════════════════
  // AVATAR 3D
  // ═══════════════════════════════════════════════════════════════════════════

  async getAvatarConfig(patientId: string): Promise<any> {
    const patient = await this.findById(patientId);

    // Configuração base do avatar
    const baseConfig = {
      // Morfologia baseada em IMC
      bodyType: this.calculateBodyType(patient.height, patient.weight),
      height: patient.height || 170,
      weight: patient.weight || 70,
      gender: patient.gender,
      
      // Customizações salvas
      ...(patient.avatarConfig as any || {}),
    };

    // Buscar sinais vitais recentes para indicadores visuais
    const latestVitals = await this.getLatestVitalSigns(patientId);

    return {
      ...baseConfig,
      indicators: {
        hasAbnormalVitals: latestVitals?.isAbnormal || false,
        triageLevel: latestVitals?.triageLevel,
      },
      // Evolução temporal
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

  // ═══════════════════════════════════════════════════════════════════════════
  // DOCUMENTOS
  // ═══════════════════════════════════════════════════════════════════════════

  async uploadDocument(
    patientId: string,
    file: Express.Multer.File,
    metadata: {
      type: string;
      category: string;
      description?: string;
      date: string;
    },
    uploadedBy: string,
  ): Promise<any> {
    await this.findById(patientId);

    // TODO: Upload para S3 e salvar URL
    const fileUrl = `https://s3.amazonaws.com/healthflow/${patientId}/${file.filename}`;

    const document = await this.prisma.patientDocument.create({
      data: {
        patientId,
        type: metadata.type,
        category: metadata.category,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        fileUrl,
        description: metadata.description,
        date: new Date(metadata.date),
        uploadedBy,
        source: 'upload',
      },
    });

    await this.auditService.log({
      action: AuditAction.CREATE,
      resource: 'patient_document',
      resourceId: document.id,
      userId: uploadedBy,
      description: `Documento enviado: ${metadata.type}`,
    });

    return document;
  }

  async getDocuments(
    patientId: string,
    filters: { type?: string; category?: string } = {},
  ): Promise<any[]> {
    return this.prisma.patientDocument.findMany({
      where: {
        patientId,
        ...(filters.type && { type: filters.type }),
        ...(filters.category && { category: filters.category }),
      },
      orderBy: { date: 'desc' },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WEARABLES INTEGRATION
  // ═══════════════════════════════════════════════════════════════════════════

  async connectHealthKit(patientId: string, authToken: string): Promise<void> {
    await this.prisma.patient.update({
      where: { id: patientId },
      data: { healthKitConnected: true },
    });

    // Armazenar token de forma segura
    await this.cacheService.set(
      `healthkit:${patientId}`,
      authToken,
      30 * 24 * 3600, // 30 dias
    );

    await this.cacheService.del(`${this.CACHE_PREFIX}${patientId}`);
  }

  async connectGoogleFit(patientId: string, authToken: string): Promise<void> {
    await this.prisma.patient.update({
      where: { id: patientId },
      data: { googleFitConnected: true },
    });

    await this.cacheService.set(
      `googlefit:${patientId}`,
      authToken,
      30 * 24 * 3600,
    );

    await this.cacheService.del(`${this.CACHE_PREFIX}${patientId}`);
  }

  async syncWearableData(patientId: string): Promise<{ synced: number }> {
    const patient = await this.findById(patientId);
    let syncedCount = 0;

    // Sincronizar HealthKit
    if (patient.healthKitConnected) {
      const healthKitToken = await this.cacheService.get(`healthkit:${patientId}`);
      if (healthKitToken) {
        // TODO: Chamar serviço de sincronização HealthKit
        // const data = await this.healthKitService.fetchLatestData(healthKitToken);
        // syncedCount += data.length;
      }
    }

    // Sincronizar Google Fit
    if (patient.googleFitConnected) {
      const googleFitToken = await this.cacheService.get(`googlefit:${patientId}`);
      if (googleFitToken) {
        // TODO: Chamar serviço de sincronização Google Fit
      }
    }

    return { synced: syncedCount };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS PRIVADOS
  // ═══════════════════════════════════════════════════════════════════════════

  private calculateTriageLevel(vitals: CreateVitalSignDto): TriageLevel | null {
    // Critérios de emergência (RED)
    if (
      (vitals.systolicBp && vitals.systolicBp > 180) ||
      (vitals.systolicBp && vitals.systolicBp < 90) ||
      (vitals.oxygenSaturation && vitals.oxygenSaturation < 90) ||
      (vitals.bloodGlucose && vitals.bloodGlucose < 70)
    ) {
      return TriageLevel.RED;
    }

    // Critérios de urgência (YELLOW)
    if (
      (vitals.systolicBp && (vitals.systolicBp > 160 || vitals.systolicBp < 100)) ||
      (vitals.heartRate && (vitals.heartRate > 120 || vitals.heartRate < 50)) ||
      (vitals.oxygenSaturation && vitals.oxygenSaturation < 94) ||
      (vitals.temperature && (vitals.temperature > 38.5 || vitals.temperature < 35)) ||
      (vitals.bloodGlucose && (vitals.bloodGlucose > 250 || vitals.bloodGlucose < 80))
    ) {
      return TriageLevel.YELLOW;
    }

    // Normal (GREEN)
    return TriageLevel.GREEN;
  }

  private checkAbnormalValues(vitals: CreateVitalSignDto): boolean {
    const triageLevel = this.calculateTriageLevel(vitals);
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
      _count,
      ...rest 
    } = data;
    
    return rest;
  }
}
```

#### CHECKPOINT 2.2.1:
```
VALIDAÇÃO OBRIGATÓRIA:
[ ] Service criado sem erros?
[ ] Todos os métodos CRUD implementados?
[ ] Cache implementado corretamente?
[ ] Auditoria em todas as operações?
[ ] Integração FHIR preparada?
[ ] Algoritmo de triagem implementado?
[ ] Avatar 3D integrado?

EXECUTAR:
cd apps/api
npm run lint
npm run build

SE TUDO PASSAR → PROSSEGUIR
SE ERRO → CORRIGIR E REVALIDAR
```

---

### 2.3 PATIENTS CONTROLLER

#### PROMPT 2.3.1: Controller Completo de Pacientes
```typescript
CRIAR ARQUIVO: /healthflow/apps/api/src/modules/patients/patients.controller.ts

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { PatientsService } from './patients.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { CreatePatientDto, UpdatePatientDto } from './dto/create-patient.dto';
import { PatientQueryDto } from './dto/patient-query.dto';
import { CreateVitalSignDto } from './dto/vital-sign.dto';
import { UserRole } from '@prisma/client';

@ApiTags('Patients')
@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class PatientsController {
  private readonly logger = new Logger(PatientsController.name);

  constructor(private readonly patientsService: PatientsService) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // LISTAGEM E BUSCA
  // ═══════════════════════════════════════════════════════════════════════════

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({
    summary: 'Listar pacientes',
    description: `
      Lista todos os pacientes com paginação e filtros.
      
      **Permissões:**
      - Admin/Médico/Recepcionista: Acesso total
      - Paciente: Não tem acesso a este endpoint
      
      **Filtros disponíveis:**
      - search: Busca por nome, CPF ou telefone
      - status: Filtra por status do usuário
      - sortBy/sortOrder: Ordenação
    `,
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] })
  @ApiResponse({ status: 200, description: 'Lista de pacientes' })
  async findAll(
    @Query() query: PatientQueryDto,
    @CurrentUser('clinicId') clinicId?: string,
  ) {
    return this.patientsService.findAll(query, clinicId);
  }

  @Get('me')
  @Roles(UserRole.PATIENT)
  @ApiOperation({
    summary: 'Obter dados do paciente logado',
    description: 'Retorna os dados completos do paciente autenticado.',
  })
  @ApiResponse({ status: 200, description: 'Dados do paciente' })
  async getMyProfile(@CurrentUser('id') userId: string) {
    return this.patientsService.findByUserId(userId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  @ApiOperation({
    summary: 'Obter paciente por ID',
    description: 'Retorna os dados completos de um paciente específico.',
  })
  @ApiParam({ name: 'id', description: 'ID do paciente (UUID)' })
  @ApiResponse({ status: 200, description: 'Dados do paciente' })
  @ApiResponse({ status: 404, description: 'Paciente não encontrado' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.patientsService.findById(id, userId);
  }

  @Get('cpf/:cpf')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({
    summary: 'Buscar paciente por CPF',
    description: 'Busca um paciente pelo número do CPF.',
  })
  @ApiParam({ name: 'cpf', description: 'CPF do paciente' })
  @ApiResponse({ status: 200, description: 'Paciente encontrado' })
  @ApiResponse({ status: 404, description: 'Paciente não encontrado' })
  async findByCpf(@Param('cpf') cpf: string) {
    const patient = await this.patientsService.findByCpf(cpf);
    if (!patient) {
      return { found: false };
    }
    return { found: true, patient };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ATUALIZAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Atualizar paciente',
    description: 'Atualiza os dados de um paciente.',
  })
  @ApiParam({ name: 'id', description: 'ID do paciente' })
  @ApiBody({ type: UpdatePatientDto })
  @ApiResponse({ status: 200, description: 'Paciente atualizado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePatientDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.patientsService.update(id, dto, userId);
  }

  @Patch('me')
  @Roles(UserRole.PATIENT)
  @ApiOperation({
    summary: 'Atualizar meu perfil',
    description: 'Permite que o paciente atualize seus próprios dados.',
  })
  @ApiBody({ type: UpdatePatientDto })
  @ApiResponse({ status: 200, description: 'Perfil atualizado' })
  async updateMyProfile(
    @Body() dto: UpdatePatientDto,
    @CurrentUser('id') userId: string,
  ) {
    const patient = await this.patientsService.findByUserId(userId);
    return this.patientsService.update(patient.id, dto, userId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover paciente',
    description: 'Remove um paciente (soft delete).',
  })
  @ApiParam({ name: 'id', description: 'ID do paciente' })
  @ApiResponse({ status: 204, description: 'Paciente removido' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.patientsService.delete(id, userId);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SINAIS VITAIS
  // ═══════════════════════════════════════════════════════════════════════════

  @Post(':id/vital-signs')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Registrar sinais vitais',
    description: `
      Registra novos sinais vitais para o paciente.
      
      **Triagem automática:**
      - RED: PA sistólica >180 ou <90, SpO2 <90, Glicose <70
      - YELLOW: Valores moderadamente alterados
      - GREEN: Valores normais
      
      **Fontes aceitas:**
      - manual: Registro manual
      - healthkit: Apple HealthKit
      - googlefit: Google Fit
      - totem: Totem de autoatendimento
    `,
  })
  @ApiParam({ name: 'id', description: 'ID do paciente' })
  @ApiBody({ type: CreateVitalSignDto })
  @ApiResponse({ status: 201, description: 'Sinais vitais registrados' })
  async addVitalSign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateVitalSignDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.patientsService.addVitalSign(id, dto, userId);
  }

  @Get(':id/vital-signs')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Histórico de sinais vitais',
    description: 'Retorna o histórico de sinais vitais do paciente.',
  })
  @ApiParam({ name: 'id', description: 'ID do paciente' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Histórico de sinais vitais' })
  async getVitalSignHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
  ) {
    return this.patientsService.getVitalSignHistory(id, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
    });
  }

  @Get(':id/vital-signs/latest')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Últimos sinais vitais',
    description: 'Retorna os sinais vitais mais recentes do paciente.',
  })
  @ApiParam({ name: 'id', description: 'ID do paciente' })
  @ApiResponse({ status: 200, description: 'Últimos sinais vitais' })
  async getLatestVitalSigns(@Param('id', ParseUUIDPipe) id: string) {
    return this.patientsService.getLatestVitalSigns(id);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AVATAR 3D
  // ═══════════════════════════════════════════════════════════════════════════

  @Get(':id/avatar')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Obter configuração do Avatar 3D',
    description: `
      Retorna a configuração do Avatar 3D do paciente.
      
      **Inclui:**
      - Tipo corporal baseado no IMC
      - Indicadores visuais de saúde
      - Evolução temporal do peso
    `,
  })
  @ApiParam({ name: 'id', description: 'ID do paciente' })
  @ApiResponse({ status: 200, description: 'Configuração do Avatar' })
  async getAvatarConfig(@Param('id', ParseUUIDPipe) id: string) {
    return this.patientsService.getAvatarConfig(id);
  }

  @Put(':id/avatar')
  @Roles(UserRole.PATIENT)
  @ApiOperation({
    summary: 'Atualizar configuração do Avatar 3D',
    description: 'Permite ao paciente customizar seu Avatar 3D.',
  })
  @ApiParam({ name: 'id', description: 'ID do paciente' })
  @ApiResponse({ status: 200, description: 'Avatar atualizado' })
  async updateAvatarConfig(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() config: any,
    @CurrentUser('id') userId: string,
  ) {
    await this.patientsService.updateAvatarConfig(id, config, userId);
    return { message: 'Avatar atualizado com sucesso' };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DOCUMENTOS
  // ═══════════════════════════════════════════════════════════════════════════

  @Post(':id/documents')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.PATIENT)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload de documento',
    description: 'Faz upload de um documento para o prontuário do paciente.',
  })
  @ApiParam({ name: 'id', description: 'ID do paciente' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        type: { type: 'string', example: 'exam' },
        category: { type: 'string', example: 'blood_test' },
        description: { type: 'string' },
        date: { type: 'string', format: 'date' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Documento enviado' })
  async uploadDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() metadata: any,
    @CurrentUser('id') userId: string,
  ) {
    return this.patientsService.uploadDocument(id, file, metadata, userId);
  }

  @Get(':id/documents')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Listar documentos',
    description: 'Lista todos os documentos do paciente.',
  })
  @ApiParam({ name: 'id', description: 'ID do paciente' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiResponse({ status: 200, description: 'Lista de documentos' })
  async getDocuments(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('type') type?: string,
    @Query('category') category?: string,
  ) {
    return this.patientsService.getDocuments(id, { type, category });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WEARABLES
  // ═══════════════════════════════════════════════════════════════════════════

  @Post(':id/wearables/healthkit/connect')
  @Roles(UserRole.PATIENT)
  @ApiOperation({
    summary: 'Conectar Apple HealthKit',
    description: 'Conecta a conta do paciente ao Apple HealthKit.',
  })
  @ApiParam({ name: 'id', description: 'ID do paciente' })
  @ApiResponse({ status: 200, description: 'HealthKit conectado' })
  async connectHealthKit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('authToken') authToken: string,
  ) {
    await this.patientsService.connectHealthKit(id, authToken);
    return { message: 'HealthKit conectado com sucesso' };
  }

  @Post(':id/wearables/googlefit/connect')
  @Roles(UserRole.PATIENT)
  @ApiOperation({
    summary: 'Conectar Google Fit',
    description: 'Conecta a conta do paciente ao Google Fit.',
  })
  @ApiParam({ name: 'id', description: 'ID do paciente' })
  @ApiResponse({ status: 200, description: 'Google Fit conectado' })
  async connectGoogleFit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('authToken') authToken: string,
  ) {
    await this.patientsService.connectGoogleFit(id, authToken);
    return { message: 'Google Fit conectado com sucesso' };
  }

  @Post(':id/wearables/sync')
  @Roles(UserRole.PATIENT)
  @ApiOperation({
    summary: 'Sincronizar dados de wearables',
    description: 'Sincroniza os dados dos wearables conectados.',
  })
  @ApiParam({ name: 'id', description: 'ID do paciente' })
  @ApiResponse({ status: 200, description: 'Dados sincronizados' })
  async syncWearables(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.patientsService.syncWearableData(id);
    return { 
      message: `${result.synced} registros sincronizados`,
      synced: result.synced,
    };
  }
}
```

#### CHECKPOINT 2.3.1:
```
VALIDAÇÃO OBRIGATÓRIA:
[ ] Controller criado sem erros?
[ ] Todos os endpoints documentados?
[ ] Guards e Roles aplicados corretamente?
[ ] Upload de arquivos configurado?
[ ] Validação de UUID em todos os params?

EXECUTAR:
cd apps/api
npm run lint
npm run build

SE TUDO PASSAR → PROSSEGUIR PARA TESTES
SE ERRO → CORRIGIR E REVALIDAR
```

---

## FASE 3: MÓDULO DE AGENDAMENTO [Dias 43-56]

### 3.1 APPOINTMENTS SERVICE

#### PROMPT 3.1.1: Service Completo de Agendamento
```typescript
CRIAR ARQUIVO: /healthflow/apps/api/src/modules/appointments/appointments.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as dayjs from 'dayjs';
import { PrismaService } from '@/database/prisma.service';
import { CacheService } from '@/common/services/cache.service';
import { AuditService } from '@/common/services/audit.service';
import { GoogleCalendarService } from '@/modules/integrations/google/google-calendar.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  RescheduleAppointmentDto,
  CheckInDto,
} from './dto/appointment.dto';
import { AppointmentQueryDto } from './dto/appointment-query.dto';
import {
  Appointment,
  AppointmentStatus,
  AppointmentType,
  AuditAction,
  TriageLevel,
} from '@prisma/client';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);
  private readonly CACHE_PREFIX = 'appointment:';
  private readonly SLOT_DURATION = 30; // minutos

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
    private readonly googleCalendarService: GoogleCalendarService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // CRUD
  // ═══════════════════════════════════════════════════════════════════════════

  async create(
    dto: CreateAppointmentDto,
    createdBy: string,
  ): Promise<Appointment> {
    this.logger.log(`Creating appointment for patient ${dto.patientId}`);

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

    // Validar disponibilidade do horário
    const scheduledDateTime = this.combineDateAndTime(
      dto.scheduledDate,
      dto.scheduledTime,
    );

    const isAvailable = await this.checkSlotAvailability(
      dto.doctorId,
      dto.clinicId,
      scheduledDateTime,
      dto.duration || this.SLOT_DURATION,
    );

    if (!isAvailable) {
      throw new ConflictException('Horário não disponível');
    }

    // Validar se não é no passado
    if (scheduledDateTime < new Date()) {
      throw new BadRequestException('Não é possível agendar no passado');
    }

    // Validar sala se informada
    if (dto.roomId) {
      const room = await this.prisma.room.findUnique({
        where: { id: dto.roomId },
      });
      if (!room || room.clinicId !== dto.clinicId) {
        throw new BadRequestException('Sala inválida');
      }
    }

    // Criar agendamento
    const appointment = await this.prisma.appointment.create({
      data: {
        clinicId: dto.clinicId,
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        roomId: dto.roomId,
        scheduledDate: new Date(dto.scheduledDate),
        scheduledTime: scheduledDateTime,
        duration: dto.duration || this.SLOT_DURATION,
        type: dto.type || AppointmentType.FIRST_VISIT,
        status: AppointmentStatus.SCHEDULED,
        isTelemedicine: dto.isTelemedicine || false,
        healthInsuranceUsed: dto.healthInsurance as any,
        internalNotes: dto.internalNotes,
        reminders: this.generateReminderSchedule(scheduledDateTime),
      },
      include: {
        patient: {
          select: { id: true, fullName: true, phone: true },
        },
        doctor: {
          select: { id: true, fullName: true, crm: true, crmState: true },
        },
        clinic: {
          select: { id: true, tradeName: true },
        },
        room: true,
      },
    });

    // Criar evento no Google Calendar do paciente (se integrado)
    if (patient.user.email) {
      await this.createGoogleCalendarEvent(appointment, patient.user.email);
    }

    // Agendar notificações de lembrete
    this.eventEmitter.emit('appointment.created', {
      appointmentId: appointment.id,
      patientId: patient.id,
      patientName: patient.fullName,
      patientPhone: patient.phone,
      patientEmail: patient.user.email,
      doctorName: doctor.fullName,
      clinicName: clinic.tradeName,
      scheduledDateTime,
      isTelemedicine: appointment.isTelemedicine,
    });

    // Auditoria
    await this.auditService.log({
      action: AuditAction.CREATE,
      resource: 'appointment',
      resourceId: appointment.id,
      userId: createdBy,
      description: `Consulta agendada para ${dayjs(scheduledDateTime).format('DD/MM/YYYY HH:mm')}`,
    });

    this.logger.log(`Appointment created: ${appointment.id}`);

    return appointment;
  }

  async findAll(
    query: AppointmentQueryDto,
    clinicId?: string,
  ): Promise<{ data: Appointment[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      patientId,
      doctorId,
      status,
      type,
      startDate,
      endDate,
      isTelemedicine,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (clinicId) where.clinicId = clinicId;
    if (patientId) where.patientId = patientId;
    if (doctorId) where.doctorId = doctorId;
    if (status) where.status = status;
    if (type) where.type = type;
    if (isTelemedicine !== undefined) where.isTelemedicine = isTelemedicine;

    if (startDate || endDate) {
      where.scheduledDate = {};
      if (startDate) where.scheduledDate.gte = new Date(startDate);
      if (endDate) where.scheduledDate.lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { scheduledDate: 'asc' },
          { scheduledTime: 'asc' },
        ],
        include: {
          patient: {
            select: { id: true, fullName: true, socialName: true, phone: true, profilePhotoUrl: true },
          },
          doctor: {
            select: { id: true, fullName: true, crm: true, crmState: true, specialties: true },
          },
          clinic: {
            select: { id: true, tradeName: true },
          },
          room: {
            select: { id: true, name: true, code: true },
          },
        },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string): Promise<Appointment> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: { select: { email: true } },
          },
        },
        doctor: true,
        clinic: true,
        room: true,
        consultation: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    return appointment;
  }

  async update(
    id: string,
    dto: UpdateAppointmentDto,
    updatedBy: string,
  ): Promise<Appointment> {
    const appointment = await this.findById(id);

    // Não permitir edição de consultas já finalizadas
    if ([AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED].includes(appointment.status)) {
      throw new BadRequestException('Não é possível editar esta consulta');
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: dto as any,
      include: {
        patient: { select: { id: true, fullName: true } },
        doctor: { select: { id: true, fullName: true } },
        clinic: { select: { id: true, tradeName: true } },
      },
    });

    await this.auditService.log({
      action: AuditAction.UPDATE,
      resource: 'appointment',
      resourceId: id,
      userId: updatedBy,
      description: 'Agendamento atualizado',
    });

    return updated;
  }

  async reschedule(
    id: string,
    dto: RescheduleAppointmentDto,
    rescheduledBy: string,
  ): Promise<Appointment> {
    const appointment = await this.findById(id);

    // Não permitir remarcação de consultas finalizadas ou canceladas
    if ([AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED].includes(appointment.status)) {
      throw new BadRequestException('Não é possível remarcar esta consulta');
    }

    const newDateTime = this.combineDateAndTime(dto.newDate, dto.newTime);

    // Validar disponibilidade do novo horário
    const isAvailable = await this.checkSlotAvailability(
      appointment.doctorId,
      appointment.clinicId,
      newDateTime,
      appointment.duration,
      id, // Excluir o próprio agendamento da verificação
    );

    if (!isAvailable) {
      throw new ConflictException('Novo horário não disponível');
    }

    // Criar novo agendamento e marcar antigo como remarcado
    const [oldAppointment, newAppointment] = await this.prisma.$transaction([
      this.prisma.appointment.update({
        where: { id },
        data: {
          status: AppointmentStatus.RESCHEDULED,
          internalNotes: `${appointment.internalNotes || ''}\n[Remarcado em ${dayjs().format('DD/MM/YYYY HH:mm')}] Motivo: ${dto.reason}`.trim(),
        },
      }),
      this.prisma.appointment.create({
        data: {
          clinicId: appointment.clinicId,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          roomId: appointment.roomId,
          scheduledDate: new Date(dto.newDate),
          scheduledTime: newDateTime,
          duration: appointment.duration,
          type: appointment.type,
          status: AppointmentStatus.SCHEDULED,
          isTelemedicine: appointment.isTelemedicine,
          healthInsuranceUsed: appointment.healthInsuranceUsed,
          rescheduledFrom: id,
          reminders: this.generateReminderSchedule(newDateTime),
        },
        include: {
          patient: { select: { id: true, fullName: true, phone: true } },
          doctor: { select: { id: true, fullName: true } },
          clinic: { select: { id: true, tradeName: true } },
        },
      }),
    ]);

    // Notificar paciente sobre remarcação
    this.eventEmitter.emit('appointment.rescheduled', {
      appointmentId: newAppointment.id,
      oldDateTime: appointment.scheduledTime,
      newDateTime,
      reason: dto.reason,
    });

    await this.auditService.log({
      action: AuditAction.UPDATE,
      resource: 'appointment',
      resourceId: id,
      userId: rescheduledBy,
      description: `Consulta remarcada de ${dayjs(appointment.scheduledTime).format('DD/MM/YYYY HH:mm')} para ${dayjs(newDateTime).format('DD/MM/YYYY HH:mm')}`,
    });

    return newAppointment;
  }

  async cancel(
    id: string,
    reason: string,
    cancelledBy: string,
  ): Promise<Appointment> {
    const appointment = await this.findById(id);

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Agendamento já cancelado');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Não é possível cancelar consulta já realizada');
    }

    const cancelled = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
      include: {
        patient: { include: { user: { select: { email: true } } } },
        doctor: true,
        clinic: true,
      },
    });

    // Notificar sobre cancelamento
    this.eventEmitter.emit('appointment.cancelled', {
      appointmentId: id,
      patientName: cancelled.patient.fullName,
      patientEmail: cancelled.patient.user.email,
      scheduledDateTime: cancelled.scheduledTime,
      reason,
    });

    await this.auditService.log({
      action: AuditAction.UPDATE,
      resource: 'appointment',
      resourceId: id,
      userId: cancelledBy,
      description: `Consulta cancelada. Motivo: ${reason}`,
    });

    return cancelled;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CHECK-IN E TRIAGEM
  // ═══════════════════════════════════════════════════════════════════════════

  async checkIn(
    id: string,
    dto: CheckInDto,
    checkedInBy: string,
  ): Promise<Appointment> {
    const appointment = await this.findById(id);

    if (appointment.status !== AppointmentStatus.CONFIRMED && 
        appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException('Agendamento não pode receber check-in');
    }

    // Gerar número na fila
    const queueNumber = await this.generateQueueNumber(appointment.clinicId);

    // Registrar sinais vitais de triagem se informados
    let triageVitalSignId: string | null = null;
    if (dto.vitalSigns) {
      const vitalSign = await this.prisma.vitalSign.create({
        data: {
          patientId: appointment.patientId,
          ...dto.vitalSigns,
          measuredAt: new Date(),
          source: 'triage',
          triageLevel: this.calculateTriageLevel(dto.vitalSigns),
          isAbnormal: this.isAbnormalVitals(dto.vitalSigns),
        },
      });
      triageVitalSignId = vitalSign.id;
    }

    const checkedIn = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CHECKED_IN,
        checkedInAt: new Date(),
        queueNumber,
        triageLevel: dto.triageLevel,
        chiefComplaint: dto.chiefComplaint,
        triageNotes: dto.triageNotes,
        triageVitalSignId,
      },
      include: {
        patient: { select: { id: true, fullName: true } },
        doctor: { select: { id: true, fullName: true } },
        room: true,
      },
    });

    // Emitir evento para atualizar painel de chamada
    this.eventEmitter.emit('appointment.checked-in', {
      appointmentId: id,
      clinicId: appointment.clinicId,
      queueNumber,
      patientName: checkedIn.patient.fullName,
      triageLevel: checkedIn.triageLevel,
    });

    await this.auditService.log({
      action: AuditAction.UPDATE,
      resource: 'appointment',
      resourceId: id,
      userId: checkedInBy,
      description: `Check-in realizado. Senha: ${queueNumber}`,
    });

    return checkedIn;
  }

  async callPatient(
    id: string,
    calledBy: string,
  ): Promise<Appointment> {
    const appointment = await this.findById(id);

    if (appointment.status !== AppointmentStatus.CHECKED_IN) {
      throw new BadRequestException('Paciente não fez check-in');
    }

    const called = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.IN_PROGRESS,
        queueCalledAt: new Date(),
        startedAt: new Date(),
      },
      include: {
        patient: { select: { id: true, fullName: true } },
        doctor: { select: { id: true, fullName: true } },
        room: { select: { id: true, name: true, code: true } },
      },
    });

    // Emitir evento para TV/Painel
    this.eventEmitter.emit('appointment.patient-called', {
      appointmentId: id,
      clinicId: appointment.clinicId,
      queueNumber: appointment.queueNumber,
      patientName: called.patient.fullName,
      roomName: called.room?.name,
      roomCode: called.room?.code,
    });

    await this.auditService.log({
      action: AuditAction.UPDATE,
      resource: 'appointment',
      resourceId: id,
      userId: calledBy,
      description: `Paciente chamado para ${called.room?.name || 'consultório'}`,
    });

    return called;
  }

  async markNoShow(id: string, markedBy: string): Promise<Appointment> {
    const appointment = await this.findById(id);

    if (![AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED].includes(appointment.status)) {
      throw new BadRequestException('Não é possível marcar como no-show');
    }

    const noShow = await this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.NO_SHOW },
    });

    await this.auditService.log({
      action: AuditAction.UPDATE,
      resource: 'appointment',
      resourceId: id,
      userId: markedBy,
      description: 'Marcado como não compareceu',
    });

    return noShow;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DISPONIBILIDADE DE HORÁRIOS
  // ═══════════════════════════════════════════════════════════════════════════

  async getAvailableSlots(
    doctorId: string,
    clinicId: string,
    date: string,
  ): Promise<{ time: string; available: boolean }[]> {
    const targetDate = dayjs(date);

    // Buscar configuração de horários do médico na clínica
    const clinicDoctor = await this.prisma.clinicDoctor.findUnique({
      where: {
        clinicId_doctorId: { clinicId, doctorId },
      },
      include: { doctor: true },
    });

    if (!clinicDoctor) {
      throw new NotFoundException('Médico não encontrado nesta clínica');
    }

    const dayOfWeek = targetDate.format('dddd').toLowerCase();
    const workingHours = (clinicDoctor.workingHours || clinicDoctor.doctor.workingHours) as any;
    
    if (!workingHours?.[dayOfWeek]) {
      return []; // Médico não atende neste dia
    }

    // Buscar agendamentos existentes no dia
    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        clinicId,
        scheduledDate: targetDate.toDate(),
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.RESCHEDULED],
        },
      },
      select: {
        scheduledTime: true,
        duration: true,
      },
    });

    // Gerar slots disponíveis
    const slots: { time: string; available: boolean }[] = [];
    const daySchedule = workingHours[dayOfWeek];

    for (const period of daySchedule) {
      let currentTime = dayjs(`${date} ${period.start}`);
      const endTime = dayjs(`${date} ${period.end}`);

      while (currentTime.isBefore(endTime)) {
        const timeStr = currentTime.format('HH:mm');
        const slotStart = currentTime.toDate();
        const slotEnd = currentTime.add(this.SLOT_DURATION, 'minute').toDate();

        // Verificar se slot está ocupado
        const isOccupied = existingAppointments.some((apt) => {
          const aptStart = apt.scheduledTime;
          const aptEnd = dayjs(aptStart).add(apt.duration, 'minute').toDate();
          return slotStart < aptEnd && slotEnd > aptStart;
        });

        // Verificar se não é no passado
        const isPast = currentTime.isBefore(dayjs());

        slots.push({
          time: timeStr,
          available: !isOccupied && !isPast,
        });

        currentTime = currentTime.add(this.SLOT_DURATION, 'minute');
      }
    }

    return slots;
  }

  private async checkSlotAvailability(
    doctorId: string,
    clinicId: string,
    dateTime: Date,
    duration: number,
    excludeAppointmentId?: string,
  ): Promise<boolean> {
    const slotEnd = dayjs(dateTime).add(duration, 'minute').toDate();

    const conflicting = await this.prisma.appointment.findFirst({
      where: {
        doctorId,
        clinicId,
        id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.RESCHEDULED],
        },
        OR: [
          {
            AND: [
              { scheduledTime: { lte: dateTime } },
              { scheduledTime: { gt: dayjs(dateTime).subtract(duration, 'minute').toDate() } },
            ],
          },
          {
            AND: [
              { scheduledTime: { gte: dateTime } },
              { scheduledTime: { lt: slotEnd } },
            ],
          },
        ],
      },
    });

    return !conflicting;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // JOBS AGENDADOS
  // ═══════════════════════════════════════════════════════════════════════════

  @Cron(CronExpression.EVERY_HOUR)
  async sendReminders(): Promise<void> {
    this.logger.log('Running reminder job...');

    const now = new Date();
    const in24Hours = dayjs().add(24, 'hour').toDate();
    const in2Hours = dayjs().add(2, 'hour').toDate();

    // Lembrete de 24h
    const appointments24h = await this.prisma.appointment.findMany({
      where: {
        status: AppointmentStatus.SCHEDULED,
        scheduledTime: {
          gte: now,
          lte: in24Hours,
        },
        reminders: {
          path: ['24h', 'sent'],
          equals: false,
        },
      },
      include: {
        patient: { include: { user: { select: { email: true } } } },
        doctor: { select: { fullName: true } },
        clinic: { select: { tradeName: true } },
      },
    });

    for (const apt of appointments24h) {
      this.eventEmitter.emit('notification.send', {
        userId: apt.patient.userId,
        type: 'EMAIL',
        title: 'Lembrete de Consulta',
        body: `Sua consulta com ${apt.doctor.fullName} está agendada para amanhã às ${dayjs(apt.scheduledTime).format('HH:mm')}.`,
        data: { appointmentId: apt.id },
      });

      await this.prisma.appointment.update({
        where: { id: apt.id },
        data: {
          reminders: {
            ...(apt.reminders as any),
            '24h': { sent: true, sentAt: new Date() },
          },
        },
      });
    }

    // Lembrete de 2h
    const appointments2h = await this.prisma.appointment.findMany({
      where: {
        status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] },
        scheduledTime: {
          gte: now,
          lte: in2Hours,
        },
        reminders: {
          path: ['2h', 'sent'],
          equals: false,
        },
      },
      include: {
        patient: true,
        doctor: { select: { fullName: true } },
      },
    });

    for (const apt of appointments2h) {
      this.eventEmitter.emit('notification.send', {
        userId: apt.patient.userId,
        type: 'PUSH',
        title: 'Sua consulta é em breve!',
        body: `Sua consulta com ${apt.doctor.fullName} começa em 2 horas.`,
        data: { appointmentId: apt.id },
      });

      await this.prisma.appointment.update({
        where: { id: apt.id },
        data: {
          reminders: {
            ...(apt.reminders as any),
            '2h': { sent: true, sentAt: new Date() },
          },
        },
      });
    }

    this.logger.log(`Sent ${appointments24h.length + appointments2h.length} reminders`);
  }

  @Cron('0 22 * * *') // Todo dia às 22h
  async markNoShowsAutomatically(): Promise<void> {
    this.logger.log('Marking no-shows...');

    const today = dayjs().startOf('day').toDate();
    const endOfDay = dayjs().endOf('day').toDate();

    const result = await this.prisma.appointment.updateMany({
      where: {
        scheduledDate: { gte: today, lte: endOfDay },
        status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] },
        scheduledTime: { lt: new Date() },
      },
      data: { status: AppointmentStatus.NO_SHOW },
    });

    this.logger.log(`Marked ${result.count} appointments as no-show`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  private combineDateAndTime(date: string, time: string): Date {
    return dayjs(`${date} ${time}`).toDate();
  }

  private generateReminderSchedule(scheduledDateTime: Date): any {
    return {
      '7d': { scheduledFor: dayjs(scheduledDateTime).subtract(7, 'day').toDate(), sent: false },
      '24h': { scheduledFor: dayjs(scheduledDateTime).subtract(24, 'hour').toDate(), sent: false },
      '2h': { scheduledFor: dayjs(scheduledDateTime).subtract(2, 'hour').toDate(), sent: false },
    };
  }

  private async generateQueueNumber(clinicId: string): Promise<number> {
    const today = dayjs().format('YYYY-MM-DD');
    const cacheKey = `queue:${clinicId}:${today}`;
    
    let currentNumber = await this.cacheService.get<number>(cacheKey);
    if (!currentNumber) {
      currentNumber = 0;
    }
    
    const newNumber = currentNumber + 1;
    await this.cacheService.set(cacheKey, newNumber, 86400); // 24h
    
    return newNumber;
  }

  private async createGoogleCalendarEvent(
    appointment: any,
    patientEmail: string,
  ): Promise<void> {
    try {
      await this.googleCalendarService.createEvent({
        summary: `Consulta - ${appointment.doctor.fullName}`,
        description: `Consulta médica em ${appointment.clinic.tradeName}`,
        startDateTime: appointment.scheduledTime,
        endDateTime: dayjs(appointment.scheduledTime)
          .add(appointment.duration, 'minute')
          .toDate(),
        attendees: [patientEmail],
        location: appointment.isTelemedicine
          ? 'Telemedicina - Link será enviado'
          : appointment.clinic.tradeName,
      });
    } catch (error) {
      this.logger.warn(`Failed to create Google Calendar event: ${error.message}`);
    }
  }

  private calculateTriageLevel(vitals: any): TriageLevel {
    if (
      vitals.systolicBp > 180 ||
      vitals.systolicBp < 90 ||
      vitals.oxygenSaturation < 90 ||
      vitals.bloodGlucose < 70
    ) {
      return TriageLevel.RED;
    }

    if (
      vitals.systolicBp > 160 ||
      vitals.heartRate > 120 ||
      vitals.oxygenSaturation < 94 ||
      vitals.temperature > 38.5
    ) {
      return TriageLevel.YELLOW;
    }

    return TriageLevel.GREEN;
  }

  private isAbnormalVitals(vitals: any): boolean {
    const level = this.calculateTriageLevel(vitals);
    return level === TriageLevel.RED || level === TriageLevel.YELLOW;
  }
}
```

#### CHECKPOINT 3.1.1:
```
VALIDAÇÃO OBRIGATÓRIA:
[ ] Service criado sem erros?
[ ] CRUD completo implementado?
[ ] Check-in e triagem funcionando?
[ ] Verificação de disponibilidade implementada?
[ ] Jobs de lembrete configurados?
[ ] Integração Google Calendar preparada?
[ ] Cálculo de triagem automático?

EXECUTAR:
cd apps/api
npm run lint
npm run build

SE TUDO PASSAR → PROSSEGUIR PARA CONTROLLER
SE ERRO → CORRIGIR E REVALIDAR
```

---

## CICLO DE VALIDAÇÃO DA FASE

```
╔══════════════════════════════════════════════════════════════════════════════╗
║              VALIDAÇÃO COMPLETA - FASES 2 E 3                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  FASE 2 - PACIENTES                                                         ║
║  □ DTOs completos com validação                                              ║
║  □ Service com CRUD + sinais vitais + avatar                                 ║
║  □ Controller com todos os endpoints                                         ║
║  □ Testes unitários (>80% coverage)                                          ║
║  □ Integração com wearables preparada                                        ║
║                                                                              ║
║  FASE 3 - AGENDAMENTO                                                        ║
║  □ DTOs completos                                                            ║
║  □ Service com CRUD + check-in + triagem                                     ║
║  □ Controller com todos os endpoints                                         ║
║  □ Jobs de lembrete configurados                                             ║
║  □ Integração Google Calendar                                                ║
║  □ Algoritmo de disponibilidade de slots                                     ║
║                                                                              ║
║  SEQUÊNCIA DE VALIDAÇÃO:                                                     ║
║  1. npm run lint                                                             ║
║  2. npm run build                                                            ║
║  3. npm run test -- --coverage                                               ║
║  4. npm run db:migrate                                                       ║
║  5. npm run start:dev (testar endpoints no Swagger)                          ║
║                                                                              ║
║  SE TUDO OK → COMMIT E AVANÇAR PARA FASE 4                                  ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

**CONTINUA NA PARTE 4:**
- Fase 4: Consultas e Prontuário Eletrônico
- Fase 5: Prescrição Digital
- Fase 6: Gamificação
- Fase 7: Telemedicina
