# HEALTHFLOW - ULTRA AGENT SYSTEM - PARTE 4
## Consultas, Prescrição Digital, Gamificação e Telemedicina

---

## FASE 4: CONSULTAS E PRONTUÁRIO ELETRÔNICO [Dias 57-84]

### 4.1 CONSULTATION DTOs

#### PROMPT 4.1.1: DTOs Completos de Consulta
```typescript
CRIAR ARQUIVO: /healthflow/apps/api/src/modules/consultations/dto/consultation.dto.ts

import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  IsUUID,
  ValidateNested,
  MaxLength,
  MinLength,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConsultationStatus, TriageLevel } from '@prisma/client';

// ═══════════════════════════════════════════════════════════════════════════
// SOAP NOTE - Prontuário Médico Padrão Internacional
// ═══════════════════════════════════════════════════════════════════════════

export class SubjectiveDto {
  @ApiProperty({ 
    example: 'Paciente refere dor de cabeça há 3 dias',
    description: 'Queixa principal do paciente'
  })
  @IsString()
  @MaxLength(1000)
  chiefComplaint: string;

  @ApiPropertyOptional({ 
    example: 'Dor iniciou gradualmente, localizada na região frontal...',
    description: 'História da doença atual (HDA)'
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  historyOfPresentIllness?: string;

  @ApiPropertyOptional({ 
    example: 'Nega outras queixas',
    description: 'Revisão de sistemas'
  })
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  reviewOfSystems?: string;

  @ApiPropertyOptional({
    description: 'Sintomas relatados pelo paciente'
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  symptoms?: string[];

  @ApiPropertyOptional({
    example: 8,
    description: 'Escala de dor (0-10)'
  })
  @IsOptional()
  @IsNumber()
  painScale?: number;

  @ApiPropertyOptional({
    example: '3 dias',
    description: 'Duração dos sintomas'
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  symptomDuration?: string;
}

export class ObjectiveDto {
  @ApiPropertyOptional({
    description: 'Sinais vitais coletados durante consulta'
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => VitalSignsDto)
  vitalSigns?: VitalSignsDto;

  @ApiPropertyOptional({ 
    example: 'Paciente em bom estado geral, orientado...',
    description: 'Exame físico geral'
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  physicalExamination?: string;

  @ApiPropertyOptional({
    description: 'Achados específicos por sistema'
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SystemExaminationDto)
  systemExaminations?: SystemExaminationDto;

  @ApiPropertyOptional({
    description: 'Resultados de exames laboratoriais'
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LabResultDto)
  labResults?: LabResultDto[];

  @ApiPropertyOptional({
    description: 'Resultados de exames de imagem'
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImagingResultDto)
  imagingResults?: ImagingResultDto[];
}

export class VitalSignsDto {
  @ApiPropertyOptional({ example: 120, description: 'PA Sistólica (mmHg)' })
  @IsOptional()
  @IsNumber()
  systolicBp?: number;

  @ApiPropertyOptional({ example: 80, description: 'PA Diastólica (mmHg)' })
  @IsOptional()
  @IsNumber()
  diastolicBp?: number;

  @ApiPropertyOptional({ example: 72, description: 'Frequência cardíaca (bpm)' })
  @IsOptional()
  @IsNumber()
  heartRate?: number;

  @ApiPropertyOptional({ example: 16, description: 'Frequência respiratória' })
  @IsOptional()
  @IsNumber()
  respiratoryRate?: number;

  @ApiPropertyOptional({ example: 36.5, description: 'Temperatura (°C)' })
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @ApiPropertyOptional({ example: 98, description: 'Saturação O2 (%)' })
  @IsOptional()
  @IsNumber()
  oxygenSaturation?: number;

  @ApiPropertyOptional({ example: 70, description: 'Peso (kg)' })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({ example: 175, description: 'Altura (cm)' })
  @IsOptional()
  @IsNumber()
  height?: number;
}

export class SystemExaminationDto {
  @ApiPropertyOptional({ description: 'Exame cardiovascular' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  cardiovascular?: string;

  @ApiPropertyOptional({ description: 'Exame respiratório' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  respiratory?: string;

  @ApiPropertyOptional({ description: 'Exame neurológico' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  neurological?: string;

  @ApiPropertyOptional({ description: 'Exame abdominal' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  abdominal?: string;

  @ApiPropertyOptional({ description: 'Exame musculoesquelético' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  musculoskeletal?: string;

  @ApiPropertyOptional({ description: 'Exame dermatológico' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  dermatological?: string;

  @ApiPropertyOptional({ description: 'Exame otorrinolaringológico' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  ent?: string;

  @ApiPropertyOptional({ description: 'Exame oftalmológico' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  ophthalmological?: string;
}

export class LabResultDto {
  @ApiProperty({ example: 'Hemograma Completo' })
  @IsString()
  name: string;

  @ApiProperty({ example: '2024-12-01' })
  @IsString()
  date: string;

  @ApiPropertyOptional({ example: 'Laboratório XYZ' })
  @IsOptional()
  @IsString()
  laboratory?: string;

  @ApiProperty({ description: 'Resultados do exame' })
  results: Record<string, any>;

  @ApiPropertyOptional({ example: 'Valores dentro da normalidade' })
  @IsOptional()
  @IsString()
  interpretation?: string;
}

export class ImagingResultDto {
  @ApiProperty({ example: 'Raio-X Tórax' })
  @IsString()
  type: string;

  @ApiProperty({ example: '2024-12-01' })
  @IsString()
  date: string;

  @ApiPropertyOptional({ example: 'Sem alterações significativas' })
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  findings?: string;

  @ApiPropertyOptional({ example: 'https://s3.amazonaws.com/...' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class AssessmentDto {
  @ApiProperty({
    description: 'Diagnósticos (códigos CID-10)',
    example: [{ code: 'R51', description: 'Cefaleia' }]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiagnosisDto)
  diagnoses: DiagnosisDto[];

  @ApiPropertyOptional({
    example: 'Cefaleia tensional, possivelmente relacionada a estresse',
    description: 'Impressão diagnóstica'
  })
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  clinicalImpression?: string;

  @ApiPropertyOptional({
    example: 'Bom, com tratamento adequado',
    description: 'Prognóstico'
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  prognosis?: string;

  @ApiPropertyOptional({
    description: 'Diagnósticos diferenciais considerados'
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiagnosisDto)
  differentialDiagnoses?: DiagnosisDto[];
}

export class DiagnosisDto {
  @ApiProperty({ example: 'R51', description: 'Código CID-10' })
  @IsString()
  @MaxLength(10)
  code: string;

  @ApiProperty({ example: 'Cefaleia' })
  @IsString()
  @MaxLength(500)
  description: string;

  @ApiPropertyOptional({ 
    example: 'primary',
    enum: ['primary', 'secondary', 'complication']
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: 'Cefaleia tensional' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class PlanDto {
  @ApiPropertyOptional({
    description: 'Tratamento medicamentoso (será convertido em prescrição)'
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicationPlanDto)
  medications?: MedicationPlanDto[];

  @ApiPropertyOptional({
    description: 'Procedimentos realizados ou solicitados'
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProcedureDto)
  procedures?: ProcedureDto[];

  @ApiPropertyOptional({
    description: 'Exames solicitados'
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExamRequestDto)
  examRequests?: ExamRequestDto[];

  @ApiPropertyOptional({
    description: 'Encaminhamentos para especialistas'
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReferralDto)
  referrals?: ReferralDto[];

  @ApiPropertyOptional({
    example: 'Repouso relativo, evitar estresse...',
    description: 'Orientações ao paciente'
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  patientInstructions?: string;

  @ApiPropertyOptional({
    example: 'Retorno em 15 dias ou se piora dos sintomas',
    description: 'Plano de seguimento'
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  followUp?: string;

  @ApiPropertyOptional({
    example: '15 dias',
    description: 'Prazo para retorno'
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  returnPeriod?: string;

  @ApiPropertyOptional({
    description: 'Necessita de atestado médico?'
  })
  @IsOptional()
  @IsBoolean()
  needsMedicalCertificate?: boolean;

  @ApiPropertyOptional({
    example: 3,
    description: 'Dias de afastamento no atestado'
  })
  @IsOptional()
  @IsNumber()
  medicalCertificateDays?: number;
}

export class MedicationPlanDto {
  @ApiProperty({ example: 'Paracetamol' })
  @IsString()
  name: string;

  @ApiProperty({ example: '750mg' })
  @IsString()
  dosage: string;

  @ApiProperty({ example: 'comprimido' })
  @IsString()
  form: string;

  @ApiProperty({ example: 'Via oral' })
  @IsString()
  route: string;

  @ApiProperty({ example: '8/8 horas' })
  @IsString()
  frequency: string;

  @ApiProperty({ example: '7 dias' })
  @IsString()
  duration: string;

  @ApiPropertyOptional({ example: 'Tomar após refeições' })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({ example: 21, description: 'Quantidade total' })
  @IsOptional()
  @IsNumber()
  quantity?: number;
}

export class ProcedureDto {
  @ApiProperty({ example: 'Eletrocardiograma' })
  @IsString()
  name: string;

  @ApiProperty({ example: '40.90.10.38', description: 'Código TUSS' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ example: 'Realizado durante consulta' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: '2024-12-01' })
  @IsOptional()
  @IsString()
  performedAt?: string;
}

export class ExamRequestDto {
  @ApiProperty({ example: 'Hemograma Completo' })
  @IsString()
  name: string;

  @ApiProperty({ example: '40.30.40.14', description: 'Código TUSS' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ example: 'Jejum de 8 horas' })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({ 
    example: 'routine',
    enum: ['routine', 'urgent', 'emergency']
  })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ example: 'Investigar anemia' })
  @IsOptional()
  @IsString()
  clinicalIndication?: string;
}

export class ReferralDto {
  @ApiProperty({ example: 'Neurologia' })
  @IsString()
  specialty: string;

  @ApiProperty({ example: 'Investigação de cefaleia crônica' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ 
    example: 'routine',
    enum: ['routine', 'priority', 'urgent']
  })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ example: 'Histórico de enxaqueca desde infância' })
  @IsOptional()
  @IsString()
  clinicalSummary?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// DTOs PRINCIPAIS
// ═══════════════════════════════════════════════════════════════════════════

export class CreateConsultationDto {
  @ApiProperty({ description: 'ID do agendamento' })
  @IsUUID()
  appointmentId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => SubjectiveDto)
  subjective?: SubjectiveDto;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => ObjectiveDto)
  objective?: ObjectiveDto;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => AssessmentDto)
  assessment?: AssessmentDto;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => PlanDto)
  plan?: PlanDto;

  @ApiPropertyOptional({ description: 'É telemedicina?' })
  @IsOptional()
  @IsBoolean()
  isTelemedicine?: boolean;
}

export class UpdateConsultationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => SubjectiveDto)
  subjective?: SubjectiveDto;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => ObjectiveDto)
  objective?: ObjectiveDto;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => AssessmentDto)
  assessment?: AssessmentDto;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => PlanDto)
  plan?: PlanDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  additionalNotes?: string;
}

export class FinalizeConsultationDto {
  @ApiProperty()
  @ValidateNested()
  @Type(() => SubjectiveDto)
  subjective: SubjectiveDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => ObjectiveDto)
  objective: ObjectiveDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => AssessmentDto)
  assessment: AssessmentDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => PlanDto)
  plan: PlanDto;

  @ApiPropertyOptional({ description: 'Gerar prescrição automaticamente?' })
  @IsOptional()
  @IsBoolean()
  generatePrescription?: boolean;

  @ApiPropertyOptional({ description: 'Gerar atestado médico?' })
  @IsOptional()
  @IsBoolean()
  generateMedicalCertificate?: boolean;
}
```

#### CHECKPOINT 4.1.1:
```
VALIDAÇÃO OBRIGATÓRIA:
[ ] DTOs SOAP completos?
[ ] Validações em todos os campos?
[ ] Documentação Swagger completa?
[ ] Suporte a CID-10?
[ ] Suporte a TUSS?

SE TUDO "SIM" → PROSSEGUIR
SE ALGUM "NÃO" → CORRIGIR
```

---

### 4.2 CONSULTATIONS SERVICE

#### PROMPT 4.2.1: Service Completo de Consultas
```typescript
CRIAR ARQUIVO: /healthflow/apps/api/src/modules/consultations/consultations.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as dayjs from 'dayjs';
import * as crypto from 'crypto';
import { PrismaService } from '@/database/prisma.service';
import { CacheService } from '@/common/services/cache.service';
import { AuditService } from '@/common/services/audit.service';
import { FhirService } from '@/modules/integrations/fhir/fhir.service';
import { DigitalSignatureService } from '@/modules/integrations/icp-brasil/digital-signature.service';
import { AiTranscriptionService } from '@/modules/ai/transcription.service';
import {
  CreateConsultationDto,
  UpdateConsultationDto,
  FinalizeConsultationDto,
} from './dto/consultation.dto';
import {
  Consultation,
  ConsultationStatus,
  AppointmentStatus,
  AuditAction,
} from '@prisma/client';

@Injectable()
export class ConsultationsService {
  private readonly logger = new Logger(ConsultationsService.name);
  private readonly CACHE_PREFIX = 'consultation:';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
    private readonly fhirService: FhirService,
    private readonly digitalSignatureService: DigitalSignatureService,
    private readonly aiTranscriptionService: AiTranscriptionService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // INICIAR CONSULTA
  // ═══════════════════════════════════════════════════════════════════════════

  async startConsultation(
    dto: CreateConsultationDto,
    doctorId: string,
  ): Promise<Consultation> {
    this.logger.log(`Starting consultation for appointment ${dto.appointmentId}`);

    // Validar agendamento
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
      include: {
        patient: {
          include: {
            vitalSigns: {
              orderBy: { measuredAt: 'desc' },
              take: 1,
            },
          },
        },
        doctor: true,
        clinic: true,
        room: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    // Verificar se o médico é o dono do agendamento
    if (appointment.doctorId !== doctorId) {
      throw new ForbiddenException('Você não tem permissão para esta consulta');
    }

    // Verificar status do agendamento
    if (appointment.status !== AppointmentStatus.IN_PROGRESS &&
        appointment.status !== AppointmentStatus.CHECKED_IN) {
      throw new BadRequestException(
        'Agendamento deve estar em atendimento ou com check-in realizado'
      );
    }

    // Verificar se já existe consulta para este agendamento
    const existingConsultation = await this.prisma.consultation.findFirst({
      where: { appointmentId: dto.appointmentId },
    });

    if (existingConsultation) {
      // Retornar consulta existente (em andamento)
      if (existingConsultation.status === ConsultationStatus.IN_PROGRESS ||
          existingConsultation.status === ConsultationStatus.DRAFT) {
        return existingConsultation;
      }
      throw new BadRequestException('Já existe uma consulta finalizada para este agendamento');
    }

    // Criar consulta
    const consultation = await this.prisma.$transaction(async (tx) => {
      // Atualizar status do agendamento
      await tx.appointment.update({
        where: { id: dto.appointmentId },
        data: {
          status: AppointmentStatus.IN_PROGRESS,
          startedAt: new Date(),
        },
      });

      // Criar consulta
      const newConsultation = await tx.consultation.create({
        data: {
          appointmentId: dto.appointmentId,
          patientId: appointment.patientId,
          doctorId,
          clinicId: appointment.clinicId,
          status: ConsultationStatus.IN_PROGRESS,
          isTelemedicine: dto.isTelemedicine || appointment.isTelemedicine,
          startedAt: new Date(),
          // Preencher dados iniciais se fornecidos
          subjective: dto.subjective as any,
          objective: dto.objective as any,
          assessment: dto.assessment as any,
          plan: dto.plan as any,
          // Dados de triagem do agendamento
          triageLevel: appointment.triageLevel,
          chiefComplaint: appointment.chiefComplaint,
        },
        include: {
          patient: {
            select: {
              id: true,
              fullName: true,
              socialName: true,
              birthDate: true,
              gender: true,
              allergies: true,
              chronicConditions: true,
              currentMedications: true,
            },
          },
          doctor: {
            select: {
              id: true,
              fullName: true,
              crm: true,
              crmState: true,
              specialties: true,
            },
          },
          clinic: {
            select: {
              id: true,
              tradeName: true,
            },
          },
        },
      });

      return newConsultation;
    });

    // Emitir evento
    this.eventEmitter.emit('consultation.started', {
      consultationId: consultation.id,
      appointmentId: dto.appointmentId,
      patientId: appointment.patientId,
      doctorId,
    });

    // Auditoria
    await this.auditService.log({
      action: AuditAction.CREATE,
      resource: 'consultation',
      resourceId: consultation.id,
      userId: doctorId,
      description: 'Consulta iniciada',
      metadata: {
        appointmentId: dto.appointmentId,
        isTelemedicine: consultation.isTelemedicine,
      },
    });

    this.logger.log(`Consultation started: ${consultation.id}`);

    return consultation;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ATUALIZAR PRONTUÁRIO (AUTO-SAVE)
  // ═══════════════════════════════════════════════════════════════════════════

  async updateConsultation(
    id: string,
    dto: UpdateConsultationDto,
    doctorId: string,
  ): Promise<Consultation> {
    const consultation = await this.findById(id);

    // Verificar permissão
    if (consultation.doctorId !== doctorId) {
      throw new ForbiddenException('Você não tem permissão para editar esta consulta');
    }

    // Verificar se pode ser editada
    if (consultation.status === ConsultationStatus.FINALIZED ||
        consultation.status === ConsultationStatus.SIGNED) {
      throw new BadRequestException('Consulta já finalizada não pode ser editada');
    }

    // Atualizar com merge de dados existentes
    const updated = await this.prisma.consultation.update({
      where: { id },
      data: {
        subjective: dto.subjective
          ? { ...(consultation.subjective as any || {}), ...dto.subjective }
          : undefined,
        objective: dto.objective
          ? { ...(consultation.objective as any || {}), ...dto.objective }
          : undefined,
        assessment: dto.assessment
          ? { ...(consultation.assessment as any || {}), ...dto.assessment }
          : undefined,
        plan: dto.plan
          ? { ...(consultation.plan as any || {}), ...dto.plan }
          : undefined,
        additionalNotes: dto.additionalNotes,
        lastSavedAt: new Date(),
      },
    });

    // Cache para recuperação rápida
    await this.cacheService.set(
      `${this.CACHE_PREFIX}${id}:draft`,
      updated,
      3600 // 1 hora
    );

    return updated;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FINALIZAR CONSULTA
  // ═══════════════════════════════════════════════════════════════════════════

  async finalizeConsultation(
    id: string,
    dto: FinalizeConsultationDto,
    doctorId: string,
  ): Promise<Consultation> {
    this.logger.log(`Finalizing consultation ${id}`);

    const consultation = await this.findById(id);

    // Validações
    if (consultation.doctorId !== doctorId) {
      throw new ForbiddenException('Você não tem permissão');
    }

    if (consultation.status === ConsultationStatus.FINALIZED ||
        consultation.status === ConsultationStatus.SIGNED) {
      throw new BadRequestException('Consulta já finalizada');
    }

    // Validar dados obrigatórios
    if (!dto.subjective?.chiefComplaint) {
      throw new BadRequestException('Queixa principal é obrigatória');
    }

    if (!dto.assessment?.diagnoses?.length) {
      throw new BadRequestException('Pelo menos um diagnóstico é obrigatório');
    }

    // Buscar dados do médico para assinatura
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    // Gerar hash de integridade do prontuário
    const contentHash = this.generateContentHash({
      subjective: dto.subjective,
      objective: dto.objective,
      assessment: dto.assessment,
      plan: dto.plan,
    });

    // Calcular duração
    const duration = consultation.startedAt
      ? Math.round((Date.now() - consultation.startedAt.getTime()) / 60000)
      : null;

    // Finalizar em transação
    const finalized = await this.prisma.$transaction(async (tx) => {
      // Atualizar consulta
      const updatedConsultation = await tx.consultation.update({
        where: { id },
        data: {
          status: ConsultationStatus.FINALIZED,
          subjective: dto.subjective as any,
          objective: dto.objective as any,
          assessment: dto.assessment as any,
          plan: dto.plan as any,
          finalizedAt: new Date(),
          duration,
          contentHash,
          // Identificação do médico
          doctorCrm: doctor.crm,
          doctorCrmState: doctor.crmState,
          doctorSpecialty: doctor.specialties?.[0] || null,
        },
        include: {
          patient: true,
          doctor: true,
          clinic: true,
          appointment: true,
        },
      });

      // Atualizar agendamento
      await tx.appointment.update({
        where: { id: consultation.appointmentId },
        data: {
          status: AppointmentStatus.COMPLETED,
          endedAt: new Date(),
        },
      });

      // Criar prescrição automaticamente se solicitado
      if (dto.generatePrescription && dto.plan?.medications?.length) {
        // Será tratado por evento
      }

      return updatedConsultation;
    });

    // Emitir eventos
    this.eventEmitter.emit('consultation.finalized', {
      consultationId: id,
      patientId: consultation.patientId,
      doctorId,
      generatePrescription: dto.generatePrescription,
      generateMedicalCertificate: dto.generateMedicalCertificate,
      medications: dto.plan?.medications,
      certificateDays: dto.plan?.medicalCertificateDays,
    });

    // Criar recurso FHIR
    await this.fhirService.createEncounterResource(finalized);

    // Gamificação: pontuar paciente por comparecer
    this.eventEmitter.emit('gamification.action', {
      patientId: consultation.patientId,
      action: 'CONSULTATION_COMPLETED',
      points: 20,
    });

    // Auditoria
    await this.auditService.log({
      action: AuditAction.UPDATE,
      resource: 'consultation',
      resourceId: id,
      userId: doctorId,
      description: 'Consulta finalizada',
      metadata: {
        duration,
        diagnosesCount: dto.assessment.diagnoses.length,
        medicationsCount: dto.plan?.medications?.length || 0,
      },
    });

    // Limpar cache de draft
    await this.cacheService.del(`${this.CACHE_PREFIX}${id}:draft`);

    this.logger.log(`Consultation finalized: ${id}`);

    return finalized;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ASSINATURA DIGITAL (ICP-Brasil)
  // ═══════════════════════════════════════════════════════════════════════════

  async signConsultation(
    id: string,
    doctorId: string,
    certificateData: {
      certificate: string; // Certificado X.509 em base64
      signature: string;   // Assinatura do hash em base64
    },
  ): Promise<Consultation> {
    const consultation = await this.findById(id);

    if (consultation.doctorId !== doctorId) {
      throw new ForbiddenException('Você não tem permissão');
    }

    if (consultation.status !== ConsultationStatus.FINALIZED) {
      throw new BadRequestException('Consulta deve estar finalizada para assinar');
    }

    // Validar certificado ICP-Brasil
    const certificateValidation = await this.digitalSignatureService.validateCertificate(
      certificateData.certificate
    );

    if (!certificateValidation.valid) {
      throw new BadRequestException(
        `Certificado inválido: ${certificateValidation.error}`
      );
    }

    // Verificar se o certificado pertence ao médico
    if (certificateValidation.cpf !== consultation.doctor?.cpf) {
      throw new BadRequestException('Certificado não pertence ao médico');
    }

    // Verificar assinatura
    const signatureValid = await this.digitalSignatureService.verifySignature(
      consultation.contentHash,
      certificateData.signature,
      certificateData.certificate
    );

    if (!signatureValid) {
      throw new BadRequestException('Assinatura digital inválida');
    }

    // Atualizar com dados da assinatura
    const signed = await this.prisma.consultation.update({
      where: { id },
      data: {
        status: ConsultationStatus.SIGNED,
        digitalSignature: certificateData.signature,
        signedAt: new Date(),
        certificateInfo: {
          issuer: certificateValidation.issuer,
          subject: certificateValidation.subject,
          validFrom: certificateValidation.validFrom,
          validTo: certificateValidation.validTo,
          serialNumber: certificateValidation.serialNumber,
        },
      },
    });

    // Auditoria (log imutável)
    await this.auditService.log({
      action: AuditAction.SIGN,
      resource: 'consultation',
      resourceId: id,
      userId: doctorId,
      description: 'Prontuário assinado digitalmente com certificado ICP-Brasil',
      metadata: {
        certificateSerial: certificateValidation.serialNumber,
        signedAt: signed.signedAt,
      },
    });

    this.logger.log(`Consultation signed: ${id}`);

    return signed;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSCRIÇÃO COM IA
  // ═══════════════════════════════════════════════════════════════════════════

  async startAiTranscription(
    id: string,
    doctorId: string,
  ): Promise<{ sessionId: string }> {
    const consultation = await this.findById(id);

    if (consultation.doctorId !== doctorId) {
      throw new ForbiddenException('Você não tem permissão');
    }

    if (consultation.status !== ConsultationStatus.IN_PROGRESS) {
      throw new BadRequestException('Consulta deve estar em andamento');
    }

    // Iniciar sessão de transcrição
    const sessionId = await this.aiTranscriptionService.startSession({
      consultationId: id,
      patientId: consultation.patientId,
      doctorId,
      language: 'pt-BR',
    });

    // Atualizar consulta
    await this.prisma.consultation.update({
      where: { id },
      data: {
        aiTranscriptionEnabled: true,
        aiTranscriptionSessionId: sessionId,
      },
    });

    this.logger.log(`AI transcription started for consultation ${id}`);

    return { sessionId };
  }

  async getAiSuggestions(id: string, doctorId: string): Promise<any> {
    const consultation = await this.findById(id);

    if (consultation.doctorId !== doctorId) {
      throw new ForbiddenException('Você não tem permissão');
    }

    if (!consultation.aiTranscriptionSessionId) {
      throw new BadRequestException('Transcrição de IA não está ativa');
    }

    // Buscar sugestões baseadas na transcrição
    const suggestions = await this.aiTranscriptionService.getSuggestions(
      consultation.aiTranscriptionSessionId
    );

    return suggestions;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BUSCA E HISTÓRICO
  // ═══════════════════════════════════════════════════════════════════════════

  async findById(id: string): Promise<Consultation> {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            socialName: true,
            cpf: true,
            birthDate: true,
            gender: true,
            bloodType: true,
            allergies: true,
            chronicConditions: true,
          },
        },
        doctor: {
          select: {
            id: true,
            fullName: true,
            crm: true,
            crmState: true,
            specialties: true,
            cpf: true,
          },
        },
        clinic: {
          select: {
            id: true,
            tradeName: true,
            legalName: true,
            cnpj: true,
          },
        },
        appointment: {
          select: {
            id: true,
            scheduledDate: true,
            scheduledTime: true,
            type: true,
            isTelemedicine: true,
          },
        },
        prescriptions: true,
        attachments: true,
      },
    });

    if (!consultation) {
      throw new NotFoundException('Consulta não encontrada');
    }

    return consultation;
  }

  async getPatientHistory(
    patientId: string,
    options: {
      page?: number;
      limit?: number;
      startDate?: Date;
      endDate?: Date;
      doctorId?: string;
      clinicId?: string;
    } = {},
  ): Promise<{ data: Consultation[]; total: number }> {
    const { page = 1, limit = 20, startDate, endDate, doctorId, clinicId } = options;
    const skip = (page - 1) * limit;

    const where: any = {
      patientId,
      status: { in: [ConsultationStatus.FINALIZED, ConsultationStatus.SIGNED] },
    };

    if (startDate || endDate) {
      where.finalizedAt = {};
      if (startDate) where.finalizedAt.gte = startDate;
      if (endDate) where.finalizedAt.lte = endDate;
    }

    if (doctorId) where.doctorId = doctorId;
    if (clinicId) where.clinicId = clinicId;

    const [data, total] = await Promise.all([
      this.prisma.consultation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { finalizedAt: 'desc' },
        include: {
          doctor: {
            select: {
              fullName: true,
              crm: true,
              crmState: true,
              specialties: true,
            },
          },
          clinic: {
            select: {
              tradeName: true,
            },
          },
          prescriptions: {
            select: {
              id: true,
              status: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.consultation.count({ where }),
    ]);

    return { data, total };
  }

  async getConsultationSummary(id: string, requestedBy: string): Promise<any> {
    const consultation = await this.findById(id);

    // Verificar permissão (médico da consulta, paciente, ou médico com acesso)
    // Implementar lógica de compartilhamento

    const subjective = consultation.subjective as any;
    const objective = consultation.objective as any;
    const assessment = consultation.assessment as any;
    const plan = consultation.plan as any;

    return {
      id: consultation.id,
      date: consultation.finalizedAt,
      duration: consultation.duration,
      isTelemedicine: consultation.isTelemedicine,
      signed: consultation.status === ConsultationStatus.SIGNED,
      doctor: {
        name: consultation.doctor.fullName,
        crm: `${consultation.doctor.crm}/${consultation.doctor.crmState}`,
        specialty: consultation.doctor.specialties?.[0],
      },
      clinic: consultation.clinic.tradeName,
      chiefComplaint: subjective?.chiefComplaint,
      diagnoses: assessment?.diagnoses?.map((d: any) => ({
        code: d.code,
        description: d.description,
      })),
      prescriptions: consultation.prescriptions?.length || 0,
      followUp: plan?.followUp,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ANEXOS
  // ═══════════════════════════════════════════════════════════════════════════

  async addAttachment(
    consultationId: string,
    file: Express.Multer.File,
    metadata: { type: string; description?: string },
    uploadedBy: string,
  ): Promise<any> {
    const consultation = await this.findById(consultationId);

    if (consultation.status === ConsultationStatus.SIGNED) {
      throw new BadRequestException('Consulta assinada não pode receber anexos');
    }

    // TODO: Upload para S3
    const fileUrl = `https://s3.amazonaws.com/healthflow/consultations/${consultationId}/${file.filename}`;

    const attachment = await this.prisma.consultationAttachment.create({
      data: {
        consultationId,
        type: metadata.type,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        fileUrl,
        description: metadata.description,
        uploadedBy,
      },
    });

    await this.auditService.log({
      action: AuditAction.CREATE,
      resource: 'consultation_attachment',
      resourceId: attachment.id,
      userId: uploadedBy,
      description: `Anexo adicionado: ${metadata.type}`,
    });

    return attachment;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  private generateContentHash(content: any): string {
    const contentString = JSON.stringify(content, Object.keys(content).sort());
    return crypto
      .createHash('sha256')
      .update(contentString)
      .digest('hex');
  }
}
```

#### CHECKPOINT 4.2.1:
```
VALIDAÇÃO OBRIGATÓRIA:
[ ] Service SOAP completo?
[ ] Início/atualização/finalização funcionando?
[ ] Assinatura digital ICP-Brasil?
[ ] Integração IA transcription?
[ ] Hash de integridade implementado?
[ ] FHIR integration preparada?
[ ] Auditoria completa?

EXECUTAR:
cd apps/api
npm run lint
npm run build

SE TUDO PASSAR → PROSSEGUIR
SE ERRO → CORRIGIR
```

---

## FASE 5: PRESCRIÇÃO DIGITAL [Dias 85-112]

### 5.1 PRESCRIPTION SERVICE

#### PROMPT 5.1.1: Service Completo de Prescrição
```typescript
CRIAR ARQUIVO: /healthflow/apps/api/src/modules/prescriptions/prescriptions.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as dayjs from 'dayjs';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import { PrismaService } from '@/database/prisma.service';
import { CacheService } from '@/common/services/cache.service';
import { AuditService } from '@/common/services/audit.service';
import { DigitalSignatureService } from '@/modules/integrations/icp-brasil/digital-signature.service';
import { MemedIntegrationService } from '@/modules/integrations/memed/memed.service';
import { AnvisaService } from '@/modules/integrations/anvisa/anvisa.service';
import {
  CreatePrescriptionDto,
  AddMedicationDto,
  SignPrescriptionDto,
} from './dto/prescription.dto';
import {
  Prescription,
  PrescriptionStatus,
  MedicationControlType,
  AuditAction,
} from '@prisma/client';

@Injectable()
export class PrescriptionsService {
  private readonly logger = new Logger(PrescriptionsService.name);
  private readonly CACHE_PREFIX = 'prescription:';

  // Listas de controle especial ANVISA
  private readonly CONTROLLED_LISTS: Record<string, MedicationControlType[]> = {
    // Receita especial branca (2 vias)
    whiteSpecial: [
      MedicationControlType.C1,
      MedicationControlType.C5,
    ],
    // Receita azul (B)
    blue: [
      MedicationControlType.B1,
      MedicationControlType.B2,
    ],
    // Receita amarela (A)
    yellow: [
      MedicationControlType.A1,
      MedicationControlType.A2,
      MedicationControlType.A3,
    ],
    // Receita de controle especial (C)
    special: [
      MedicationControlType.C2,
      MedicationControlType.C3,
      MedicationControlType.C4,
    ],
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
    private readonly digitalSignatureService: DigitalSignatureService,
    private readonly memedService: MemedIntegrationService,
    private readonly anvisaService: AnvisaService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // CRIAR PRESCRIÇÃO
  // ═══════════════════════════════════════════════════════════════════════════

  async createPrescription(
    dto: CreatePrescriptionDto,
    doctorId: string,
  ): Promise<Prescription> {
    this.logger.log(`Creating prescription for consultation ${dto.consultationId}`);

    // Validar consulta
    const consultation = await this.prisma.consultation.findUnique({
      where: { id: dto.consultationId },
      include: {
        patient: {
          include: {
            user: { select: { email: true } },
          },
        },
        doctor: true,
        clinic: true,
      },
    });

    if (!consultation) {
      throw new NotFoundException('Consulta não encontrada');
    }

    if (consultation.doctorId !== doctorId) {
      throw new ForbiddenException('Você não tem permissão');
    }

    // Buscar dados do paciente para validações
    const patient = await this.prisma.patient.findUnique({
      where: { id: consultation.patientId },
      select: {
        id: true,
        fullName: true,
        cpf: true,
        birthDate: true,
        allergies: true,
        currentMedications: true,
      },
    });

    // Processar medicamentos
    const processedMedications = await this.processMedications(
      dto.medications,
      patient,
      consultation.doctor,
    );

    // Determinar tipo de receita necessária
    const prescriptionType = this.determinePrescriptionType(processedMedications);

    // Gerar código único
    const prescriptionCode = this.generatePrescriptionCode();

    // Criar prescrição
    const prescription = await this.prisma.prescription.create({
      data: {
        consultationId: dto.consultationId,
        patientId: consultation.patientId,
        doctorId,
        clinicId: consultation.clinicId,
        code: prescriptionCode,
        status: PrescriptionStatus.DRAFT,
        type: prescriptionType,
        validUntil: this.calculateValidity(prescriptionType),
        notes: dto.notes,
        internalNotes: dto.internalNotes,
        items: {
          create: processedMedications.map((med, index) => ({
            sequence: index + 1,
            medicationName: med.name,
            medicationCode: med.code,
            activePrinciple: med.activePrinciple,
            concentration: med.concentration,
            pharmaceuticalForm: med.form,
            dosage: med.dosage,
            route: med.route,
            frequency: med.frequency,
            duration: med.duration,
            quantity: med.quantity,
            instructions: med.instructions,
            controlType: med.controlType,
            isControlled: med.isControlled,
            hasAllergyAlert: med.hasAllergyAlert,
            allergyAlertMessage: med.allergyAlertMessage,
            hasInteractionAlert: med.hasInteractionAlert,
            interactionAlertMessage: med.interactionAlertMessage,
          })),
        },
      },
      include: {
        items: true,
        patient: {
          select: { id: true, fullName: true, cpf: true },
        },
        doctor: {
          select: { id: true, fullName: true, crm: true, crmState: true },
        },
      },
    });

    // Auditoria
    await this.auditService.log({
      action: AuditAction.CREATE,
      resource: 'prescription',
      resourceId: prescription.id,
      userId: doctorId,
      description: `Prescrição criada: ${prescriptionType}`,
      metadata: {
        medicationCount: processedMedications.length,
        hasControlled: processedMedications.some(m => m.isControlled),
      },
    });

    this.logger.log(`Prescription created: ${prescription.id}`);

    return prescription;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ASSINAR PRESCRIÇÃO DIGITALMENTE
  // ═══════════════════════════════════════════════════════════════════════════

  async signPrescription(
    id: string,
    dto: SignPrescriptionDto,
    doctorId: string,
  ): Promise<Prescription> {
    this.logger.log(`Signing prescription ${id}`);

    const prescription = await this.findById(id);

    // Validações
    if (prescription.doctorId !== doctorId) {
      throw new ForbiddenException('Você não tem permissão');
    }

    if (prescription.status !== PrescriptionStatus.DRAFT) {
      throw new BadRequestException('Prescrição já foi assinada');
    }

    // Verificar se médico tem certificado digital válido
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        id: true,
        cpf: true,
        crm: true,
        crmState: true,
        fullName: true,
        digitalCertificateId: true,
      },
    });

    if (!doctor.digitalCertificateId) {
      throw new BadRequestException(
        'Médico não possui certificado digital cadastrado'
      );
    }

    // Validar certificado ICP-Brasil
    const certValidation = await this.digitalSignatureService.validateCertificate(
      dto.certificate
    );

    if (!certValidation.valid) {
      throw new BadRequestException(`Certificado inválido: ${certValidation.error}`);
    }

    // Verificar se certificado pertence ao médico
    if (certValidation.cpf !== doctor.cpf) {
      throw new BadRequestException('Certificado não pertence ao médico');
    }

    // Gerar conteúdo para assinatura (hash do documento)
    const prescriptionContent = this.generatePrescriptionContent(prescription);
    const contentHash = crypto
      .createHash('sha256')
      .update(prescriptionContent)
      .digest('hex');

    // Verificar assinatura
    const signatureValid = await this.digitalSignatureService.verifySignature(
      contentHash,
      dto.signature,
      dto.certificate
    );

    if (!signatureValid) {
      throw new BadRequestException('Assinatura digital inválida');
    }

    // Gerar QR Code para validação
    const qrCodeData = {
      code: prescription.code,
      doctorCrm: `${doctor.crm}/${doctor.crmState}`,
      patientCpf: prescription.patient.cpf.slice(-4), // Últimos 4 dígitos
      issuedAt: new Date().toISOString(),
      validUntil: prescription.validUntil?.toISOString(),
      hash: contentHash.slice(0, 16), // Primeiros 16 chars do hash
    };

    const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrCodeData));

    // Atualizar prescrição
    const signed = await this.prisma.prescription.update({
      where: { id },
      data: {
        status: PrescriptionStatus.SIGNED,
        signedAt: new Date(),
        digitalSignature: dto.signature,
        contentHash,
        qrCode: qrCodeUrl,
        certificateInfo: {
          issuer: certValidation.issuer,
          subject: certValidation.subject,
          serialNumber: certValidation.serialNumber,
          validFrom: certValidation.validFrom,
          validTo: certValidation.validTo,
        },
        // Dados do médico no momento da assinatura (imutável)
        doctorCrm: doctor.crm,
        doctorCrmState: doctor.crmState,
        doctorName: doctor.fullName,
      },
      include: {
        items: true,
        patient: true,
        doctor: true,
        clinic: true,
      },
    });

    // Registrar em sistema de rastreabilidade (SNGPC se controlado)
    if (prescription.items.some(i => i.isControlled)) {
      await this.registerInSNGPC(signed);
    }

    // Enviar para paciente
    this.eventEmitter.emit('prescription.signed', {
      prescriptionId: id,
      patientId: prescription.patientId,
      patientEmail: prescription.patient.user?.email,
      qrCodeUrl,
    });

    // Auditoria imutável
    await this.auditService.log({
      action: AuditAction.SIGN,
      resource: 'prescription',
      resourceId: id,
      userId: doctorId,
      description: 'Prescrição assinada digitalmente',
      metadata: {
        certificateSerial: certValidation.serialNumber,
        contentHash,
        hasControlled: prescription.items.some(i => i.isControlled),
      },
    });

    this.logger.log(`Prescription signed: ${id}`);

    return signed;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDAR PRESCRIÇÃO (Para farmácias)
  // ═══════════════════════════════════════════════════════════════════════════

  async validatePrescription(code: string): Promise<{
    valid: boolean;
    prescription?: any;
    error?: string;
  }> {
    const prescription = await this.prisma.prescription.findUnique({
      where: { code },
      include: {
        items: true,
        patient: {
          select: { fullName: true, cpf: true },
        },
        doctor: {
          select: { fullName: true, crm: true, crmState: true },
        },
        clinic: {
          select: { tradeName: true, cnpj: true },
        },
      },
    });

    if (!prescription) {
      return { valid: false, error: 'Prescrição não encontrada' };
    }

    if (prescription.status !== PrescriptionStatus.SIGNED) {
      return { valid: false, error: 'Prescrição não está assinada' };
    }

    if (prescription.validUntil && prescription.validUntil < new Date()) {
      return { valid: false, error: 'Prescrição expirada' };
    }

    if (prescription.status === PrescriptionStatus.DISPENSED) {
      return { 
        valid: false, 
        error: 'Prescrição já foi dispensada',
        prescription: {
          dispensedAt: prescription.dispensedAt,
        },
      };
    }

    if (prescription.status === PrescriptionStatus.CANCELLED) {
      return { valid: false, error: 'Prescrição cancelada' };
    }

    // Verificar integridade do documento
    const currentContent = this.generatePrescriptionContent(prescription);
    const currentHash = crypto
      .createHash('sha256')
      .update(currentContent)
      .digest('hex');

    if (currentHash !== prescription.contentHash) {
      return { valid: false, error: 'Documento foi alterado (hash inválido)' };
    }

    return {
      valid: true,
      prescription: {
        code: prescription.code,
        type: prescription.type,
        issuedAt: prescription.signedAt,
        validUntil: prescription.validUntil,
        patient: {
          name: prescription.patient.fullName,
          cpfLastDigits: prescription.patient.cpf.slice(-4),
        },
        doctor: {
          name: prescription.doctor.fullName,
          crm: `${prescription.doctor.crm}/${prescription.doctor.crmState}`,
        },
        clinic: prescription.clinic.tradeName,
        medications: prescription.items.map(item => ({
          name: item.medicationName,
          dosage: item.dosage,
          quantity: item.quantity,
          instructions: item.instructions,
          isControlled: item.isControlled,
          controlType: item.controlType,
        })),
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DISPENSAÇÃO (Farmácia)
  // ═══════════════════════════════════════════════════════════════════════════

  async registerDispensation(
    code: string,
    dispensationData: {
      pharmacyName: string;
      pharmacyCnpj: string;
      pharmacistName: string;
      pharmacistCrf: string;
      items: Array<{
        itemId: string;
        quantityDispensed: number;
        batchNumber?: string;
        manufacturerName?: string;
        price?: number;
      }>;
    },
  ): Promise<Prescription> {
    const prescription = await this.prisma.prescription.findUnique({
      where: { code },
      include: { items: true },
    });

    if (!prescription) {
      throw new NotFoundException('Prescrição não encontrada');
    }

    if (prescription.status !== PrescriptionStatus.SIGNED) {
      throw new BadRequestException('Prescrição não pode ser dispensada');
    }

    // Calcular valores
    let totalValue = 0;
    let cashbackValue = 0;

    for (const item of dispensationData.items) {
      if (item.price) {
        totalValue += item.price * item.quantityDispensed;
        // Cashback de 2% em medicamentos
        cashbackValue += (item.price * item.quantityDispensed) * 0.02;
      }
    }

    // Registrar dispensação
    const dispensation = await this.prisma.$transaction(async (tx) => {
      // Criar registro de dispensação
      const disp = await tx.dispensation.create({
        data: {
          prescriptionId: prescription.id,
          pharmacyName: dispensationData.pharmacyName,
          pharmacyCnpj: dispensationData.pharmacyCnpj,
          pharmacistName: dispensationData.pharmacistName,
          pharmacistCrf: dispensationData.pharmacistCrf,
          dispensedAt: new Date(),
          totalValue,
          cashbackValue,
          items: dispensationData.items as any,
        },
      });

      // Atualizar status da prescrição
      const updated = await tx.prescription.update({
        where: { id: prescription.id },
        data: {
          status: PrescriptionStatus.DISPENSED,
          dispensedAt: new Date(),
        },
        include: { items: true },
      });

      // Registrar cashback para o paciente
      if (cashbackValue > 0) {
        await tx.patient.update({
          where: { id: prescription.patientId },
          data: {
            totalCashback: { increment: cashbackValue },
          },
        });
      }

      return updated;
    });

    // Gamificação
    this.eventEmitter.emit('gamification.action', {
      patientId: prescription.patientId,
      action: 'PRESCRIPTION_DISPENSED',
      points: 10,
      metadata: { cashbackEarned: cashbackValue },
    });

    // Notificar paciente
    this.eventEmitter.emit('notification.send', {
      userId: prescription.patientId,
      type: 'PUSH',
      title: 'Medicamento retirado!',
      body: `Sua receita foi dispensada. Cashback de R$ ${cashbackValue.toFixed(2)} creditado!`,
    });

    // Auditoria
    await this.auditService.log({
      action: AuditAction.UPDATE,
      resource: 'prescription',
      resourceId: prescription.id,
      userId: 'pharmacy-system',
      description: 'Prescrição dispensada',
      metadata: {
        pharmacy: dispensationData.pharmacyName,
        pharmacist: dispensationData.pharmacistCrf,
        totalValue,
        cashbackValue,
      },
    });

    return dispensation;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRAÇÃO MEMED
  // ═══════════════════════════════════════════════════════════════════════════

  async searchMedication(query: string): Promise<any[]> {
    // Buscar no Memed
    const results = await this.memedService.searchMedications(query);
    
    // Enriquecer com dados ANVISA
    const enriched = await Promise.all(
      results.map(async (med: any) => {
        const anvisaInfo = await this.anvisaService.getMedicationInfo(med.registryNumber);
        return {
          ...med,
          controlType: anvisaInfo?.controlType || null,
          isControlled: anvisaInfo?.isControlled || false,
        };
      })
    );

    return enriched;
  }

  async checkInteractions(
    medications: string[],
    patientId: string,
  ): Promise<any[]> {
    // Buscar medicamentos atuais do paciente
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: { currentMedications: true },
    });

    const allMedications = [
      ...medications,
      ...((patient?.currentMedications as any[]) || []).map(m => m.name),
    ];

    // Verificar interações via Memed
    const interactions = await this.memedService.checkInteractions(allMedications);

    return interactions;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  private async processMedications(
    medications: AddMedicationDto[],
    patient: any,
    doctor: any,
  ): Promise<any[]> {
    const processed = [];

    for (const med of medications) {
      // Buscar informações ANVISA
      const anvisaInfo = await this.anvisaService.getMedicationInfo(med.code);

      // Verificar alergias
      let hasAllergyAlert = false;
      let allergyAlertMessage = '';
      
      if (patient.allergies?.length) {
        const allergyMatch = patient.allergies.find((allergy: string) =>
          med.name.toLowerCase().includes(allergy.toLowerCase()) ||
          med.activePrinciple?.toLowerCase().includes(allergy.toLowerCase())
        );
        
        if (allergyMatch) {
          hasAllergyAlert = true;
          allergyAlertMessage = `ALERTA: Paciente tem alergia registrada a ${allergyMatch}`;
        }
      }

      // Verificar interações com medicamentos atuais
      let hasInteractionAlert = false;
      let interactionAlertMessage = '';

      if (patient.currentMedications?.length) {
        const interactions = await this.memedService.checkInteractions([
          med.name,
          ...patient.currentMedications.map((m: any) => m.name),
        ]);

        if (interactions.length > 0) {
          hasInteractionAlert = true;
          interactionAlertMessage = interactions
            .map((i: any) => `${i.drug1} + ${i.drug2}: ${i.severity} - ${i.description}`)
            .join('; ');
        }
      }

      processed.push({
        ...med,
        controlType: anvisaInfo?.controlType || MedicationControlType.COMMON,
        isControlled: anvisaInfo?.isControlled || false,
        hasAllergyAlert,
        allergyAlertMessage,
        hasInteractionAlert,
        interactionAlertMessage,
      });
    }

    return processed;
  }

  private determinePrescriptionType(medications: any[]): string {
    // Verificar se há medicamentos de cada tipo
    const controlTypes = medications
      .filter(m => m.isControlled)
      .map(m => m.controlType);

    if (controlTypes.some(t => this.CONTROLLED_LISTS.yellow.includes(t))) {
      return 'YELLOW'; // Receita amarela (entorpecentes)
    }

    if (controlTypes.some(t => this.CONTROLLED_LISTS.blue.includes(t))) {
      return 'BLUE'; // Receita azul (psicotrópicos)
    }

    if (controlTypes.some(t => this.CONTROLLED_LISTS.special.includes(t))) {
      return 'SPECIAL'; // Receita especial
    }

    if (controlTypes.some(t => this.CONTROLLED_LISTS.whiteSpecial.includes(t))) {
      return 'WHITE_SPECIAL'; // Receita especial branca
    }

    return 'SIMPLE'; // Receita simples
  }

  private calculateValidity(prescriptionType: string): Date {
    const now = dayjs();

    switch (prescriptionType) {
      case 'YELLOW':
        return now.add(30, 'day').toDate(); // 30 dias
      case 'BLUE':
        return now.add(30, 'day').toDate(); // 30 dias
      case 'SPECIAL':
        return now.add(30, 'day').toDate(); // 30 dias
      case 'WHITE_SPECIAL':
        return now.add(30, 'day').toDate(); // 30 dias
      default:
        return now.add(180, 'day').toDate(); // 6 meses para receita simples
    }
  }

  private generatePrescriptionCode(): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString('hex');
    return `RX-${timestamp}-${random}`.toUpperCase();
  }

  private generatePrescriptionContent(prescription: any): string {
    return JSON.stringify({
      code: prescription.code,
      patientId: prescription.patientId,
      doctorId: prescription.doctorId,
      items: prescription.items.map((i: any) => ({
        name: i.medicationName,
        dosage: i.dosage,
        quantity: i.quantity,
      })),
      createdAt: prescription.createdAt,
    });
  }

  private async registerInSNGPC(prescription: any): Promise<void> {
    // TODO: Integração real com SNGPC
    this.logger.log(`Registering prescription ${prescription.id} in SNGPC`);
    
    // Registrar medicamentos controlados
    for (const item of prescription.items) {
      if (item.isControlled) {
        await this.anvisaService.registerControlledDispensation({
          prescriptionCode: prescription.code,
          medicationCode: item.medicationCode,
          quantity: item.quantity,
          doctorCrm: prescription.doctorCrm,
          patientCpf: prescription.patient.cpf,
        });
      }
    }
  }

  async findById(id: string): Promise<Prescription> {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: {
        items: true,
        patient: {
          include: { user: { select: { email: true } } },
        },
        doctor: true,
        clinic: true,
        consultation: true,
      },
    });

    if (!prescription) {
      throw new NotFoundException('Prescrição não encontrada');
    }

    return prescription;
  }
}
```

#### CHECKPOINT 5.1.1:
```
VALIDAÇÃO OBRIGATÓRIA:
[ ] Criação de prescrição completa?
[ ] Assinatura digital ICP-Brasil?
[ ] Validação de receita?
[ ] Controle ANVISA implementado?
[ ] Dispensação com cashback?
[ ] Integração Memed preparada?
[ ] SNGPC preparado?
[ ] Alertas de alergia/interação?

EXECUTAR:
cd apps/api
npm run lint
npm run build
```

---

## FASE 6: GAMIFICAÇÃO [Dias 113-140]

### 6.1 GAMIFICATION SERVICE

#### PROMPT 6.1.1: Service Completo de Gamificação
```typescript
CRIAR ARQUIVO: /healthflow/apps/api/src/modules/gamification/gamification.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as dayjs from 'dayjs';
import { PrismaService } from '@/database/prisma.service';
import { CacheService } from '@/common/services/cache.service';
import { AuditService } from '@/common/services/audit.service';
import { TaskType, TaskStatus, AuditAction } from '@prisma/client';

// Configuração de pontos por ação
const POINTS_CONFIG: Record<string, number> = {
  // Saúde
  VITAL_SIGN_RECORDED: 5,
  MEDICATION_TAKEN: 10,
  CONSULTATION_COMPLETED: 20,
  PRESCRIPTION_DISPENSED: 10,
  EXAM_COMPLETED: 15,
  
  // Engajamento
  DAILY_LOGIN: 5,
  PROFILE_COMPLETED: 50,
  WEARABLE_CONNECTED: 100,
  AVATAR_CUSTOMIZED: 20,
  
  // Streak
  STREAK_3_DAYS: 25,
  STREAK_7_DAYS: 75,
  STREAK_30_DAYS: 300,
  STREAK_90_DAYS: 1000,
  
  // Social
  REFERRAL_COMPLETED: 200,
  REVIEW_SUBMITTED: 30,
};

// Badges disponíveis
const BADGES: Record<string, {
  name: string;
  description: string;
  icon: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  criteria: any;
}> = {
  FIRST_CONSULTATION: {
    name: 'Primeira Consulta',
    description: 'Completou sua primeira consulta no HEALTHFLOW',
    icon: '🏥',
    rarity: 'COMMON',
    criteria: { consultations: 1 },
  },
  HEALTH_GUARDIAN: {
    name: 'Guardião da Saúde',
    description: 'Registrou sinais vitais por 7 dias consecutivos',
    icon: '💓',
    rarity: 'RARE',
    criteria: { vitalSignStreak: 7 },
  },
  MEDICATION_MASTER: {
    name: 'Mestre dos Medicamentos',
    description: 'Tomou todos os medicamentos por 30 dias seguidos',
    icon: '💊',
    rarity: 'EPIC',
    criteria: { medicationStreak: 30 },
  },
  DIGITAL_PIONEER: {
    name: 'Pioneiro Digital',
    description: 'Conectou um wearable e sincronizou dados',
    icon: '⌚',
    rarity: 'RARE',
    criteria: { wearableConnected: true },
  },
  WELLNESS_WARRIOR: {
    name: 'Guerreiro do Bem-Estar',
    description: 'Alcançou 10.000 pontos de saúde',
    icon: '🏆',
    rarity: 'LEGENDARY',
    criteria: { totalPoints: 10000 },
  },
  PERFECT_WEEK: {
    name: 'Semana Perfeita',
    description: 'Completou todas as tarefas por uma semana',
    icon: '⭐',
    rarity: 'EPIC',
    criteria: { perfectWeek: true },
  },
  COMMUNITY_BUILDER: {
    name: 'Construtor de Comunidade',
    description: 'Indicou 5 amigos para o HEALTHFLOW',
    icon: '🤝',
    rarity: 'RARE',
    criteria: { referrals: 5 },
  },
};

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);
  private readonly CACHE_PREFIX = 'gamification:';
  private readonly LEADERBOARD_CACHE_TTL = 300; // 5 minutos

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  @OnEvent('gamification.action')
  async handleGamificationAction(payload: {
    patientId: string;
    action: string;
    points?: number;
    metadata?: any;
  }): Promise<void> {
    this.logger.log(`Processing gamification action: ${payload.action} for patient ${payload.patientId}`);

    const points = payload.points || POINTS_CONFIG[payload.action] || 0;

    if (points > 0) {
      await this.addPoints(payload.patientId, points, payload.action, payload.metadata);
    }

    // Verificar conquistas
    await this.checkAchievements(payload.patientId, payload.action);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PONTOS
  // ═══════════════════════════════════════════════════════════════════════════

  async addPoints(
    patientId: string,
    points: number,
    action: string,
    metadata?: any,
  ): Promise<{ newTotal: number; levelUp: boolean; newLevel?: number }> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        gamificationPoints: true,
        gamificationLevel: true,
      },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado');
    }

    const newTotal = patient.gamificationPoints + points;
    const oldLevel = patient.gamificationLevel;
    const newLevel = this.calculateLevel(newTotal);
    const levelUp = newLevel > oldLevel;

    // Atualizar paciente
    await this.prisma.patient.update({
      where: { id: patientId },
      data: {
        gamificationPoints: newTotal,
        gamificationLevel: newLevel,
      },
    });

    // Registrar histórico
    await this.prisma.pointsHistory.create({
      data: {
        patientId,
        points,
        action,
        description: this.getActionDescription(action),
        metadata: metadata as any,
      },
    });

    // Invalidar cache
    await this.cacheService.del(`${this.CACHE_PREFIX}stats:${patientId}`);

    // Se subiu de nível
    if (levelUp) {
      this.eventEmitter.emit('notification.send', {
        userId: patientId,
        type: 'PUSH',
        title: '🎉 Parabéns! Você subiu de nível!',
        body: `Você agora é nível ${newLevel}! Continue assim!`,
      });

      // Recompensa por nível
      const levelReward = await this.getLevelReward(newLevel);
      if (levelReward) {
        await this.grantReward(patientId, levelReward.id);
      }
    }

    return { newTotal, levelUp, newLevel: levelUp ? newLevel : undefined };
  }

  async getPointsHistory(
    patientId: string,
    options: { page?: number; limit?: number } = {},
  ): Promise<any[]> {
    const { page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    return this.prisma.pointsHistory.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NÍVEIS
  // ═══════════════════════════════════════════════════════════════════════════

  private calculateLevel(points: number): number {
    // Progressão exponencial
    // Nível 1: 0-99
    // Nível 2: 100-299
    // Nível 3: 300-599
    // Nível 4: 600-999
    // Nível 5: 1000-1499
    // etc.
    
    if (points < 100) return 1;
    if (points < 300) return 2;
    if (points < 600) return 3;
    if (points < 1000) return 4;
    if (points < 1500) return 5;
    if (points < 2100) return 6;
    if (points < 2800) return 7;
    if (points < 3600) return 8;
    if (points < 4500) return 9;
    if (points < 5500) return 10;
    
    // Para níveis acima de 10, cada nível requer +1100 pontos
    return 10 + Math.floor((points - 5500) / 1100);
  }

  getPointsForNextLevel(currentPoints: number): { nextLevel: number; pointsNeeded: number; progress: number } {
    const currentLevel = this.calculateLevel(currentPoints);
    
    const levelThresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500];
    
    let nextLevelPoints: number;
    let currentLevelPoints: number;
    
    if (currentLevel < 10) {
      currentLevelPoints = levelThresholds[currentLevel - 1];
      nextLevelPoints = levelThresholds[currentLevel];
    } else {
      currentLevelPoints = 5500 + (currentLevel - 10) * 1100;
      nextLevelPoints = currentLevelPoints + 1100;
    }

    const pointsInLevel = currentPoints - currentLevelPoints;
    const pointsNeededForLevel = nextLevelPoints - currentLevelPoints;
    const progress = Math.round((pointsInLevel / pointsNeededForLevel) * 100);

    return {
      nextLevel: currentLevel + 1,
      pointsNeeded: nextLevelPoints - currentPoints,
      progress,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAREFAS DIÁRIAS
  // ═══════════════════════════════════════════════════════════════════════════

  async getDailyTasks(patientId: string): Promise<any[]> {
    const today = dayjs().startOf('day').toDate();

    // Buscar tarefas existentes para hoje
    let tasks = await this.prisma.task.findMany({
      where: {
        patientId,
        scheduledFor: { gte: today },
      },
      orderBy: { scheduledFor: 'asc' },
    });

    // Se não há tarefas para hoje, gerar
    if (tasks.length === 0) {
      tasks = await this.generateDailyTasks(patientId);
    }

    return tasks;
  }

  private async generateDailyTasks(patientId: string): Promise<any[]> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        prescriptions: {
          where: { status: 'SIGNED' },
          include: { items: true },
        },
      },
    });

    const today = dayjs().startOf('day').toDate();
    const tasksToCreate: any[] = [];

    // Tarefa: Registrar sinais vitais
    tasksToCreate.push({
      patientId,
      type: TaskType.VITAL_SIGN,
      title: 'Registrar Sinais Vitais',
      description: 'Registre sua pressão arterial e peso hoje',
      points: 5,
      scheduledFor: today,
      status: TaskStatus.PENDING,
    });

    // Tarefas de medicamentos (baseado em prescrições ativas)
    if (patient?.prescriptions?.length) {
      for (const prescription of patient.prescriptions) {
        for (const item of prescription.items) {
          // Parse frequency para determinar quantas vezes por dia
          const times = this.parseFrequencyToTimes(item.frequency);
          
          for (let i = 0; i < times.length; i++) {
            tasksToCreate.push({
              patientId,
              type: TaskType.MEDICATION,
              title: `Tomar ${item.medicationName}`,
              description: `${item.dosage} - ${item.instructions || ''}`,
              points: 10,
              scheduledFor: dayjs(today).hour(times[i]).toDate(),
              status: TaskStatus.PENDING,
              metadata: {
                prescriptionItemId: item.id,
                medicationName: item.medicationName,
                dosage: item.dosage,
              },
            });
          }
        }
      }
    }

    // Tarefa: Check-in diário
    tasksToCreate.push({
      patientId,
      type: TaskType.CHECK_IN,
      title: 'Check-in do Dia',
      description: 'Como você está se sentindo hoje?',
      points: 5,
      scheduledFor: today,
      status: TaskStatus.PENDING,
    });

    // Criar tarefas
    await this.prisma.task.createMany({
      data: tasksToCreate,
    });

    return this.prisma.task.findMany({
      where: {
        patientId,
        scheduledFor: { gte: today },
      },
      orderBy: { scheduledFor: 'asc' },
    });
  }

  async completeTask(
    taskId: string,
    patientId: string,
    response?: any,
  ): Promise<{ task: any; pointsEarned: number; streakBonus: number }> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    if (task.patientId !== patientId) {
      throw new BadRequestException('Tarefa não pertence a este paciente');
    }

    if (task.status === TaskStatus.COMPLETED) {
      throw new BadRequestException('Tarefa já completada');
    }

    // Atualizar tarefa
    const completedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
        response: response as any,
      },
    });

    // Calcular streak bonus
    const streak = await this.updateStreak(patientId, task.type);
    const streakBonus = this.calculateStreakBonus(streak);

    // Adicionar pontos
    const totalPoints = task.points + streakBonus;
    await this.addPoints(patientId, totalPoints, `TASK_${task.type}`, {
      taskId,
      basePoints: task.points,
      streakBonus,
      streak,
    });

    return {
      task: completedTask,
      pointsEarned: totalPoints,
      streakBonus,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STREAKS
  // ═══════════════════════════════════════════════════════════════════════════

  private async updateStreak(patientId: string, taskType: TaskType): Promise<number> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        currentStreak: true,
        lastStreakDate: true,
        longestStreak: true,
      },
    });

    const today = dayjs().startOf('day');
    const lastStreakDate = patient?.lastStreakDate
      ? dayjs(patient.lastStreakDate).startOf('day')
      : null;

    let newStreak: number;

    if (!lastStreakDate) {
      // Primeira vez
      newStreak = 1;
    } else if (lastStreakDate.isSame(today)) {
      // Já atualizou hoje
      newStreak = patient.currentStreak;
    } else if (lastStreakDate.add(1, 'day').isSame(today)) {
      // Dia consecutivo
      newStreak = patient.currentStreak + 1;
    } else {
      // Streak quebrado
      newStreak = 1;
    }

    // Atualizar
    await this.prisma.patient.update({
      where: { id: patientId },
      data: {
        currentStreak: newStreak,
        lastStreakDate: today.toDate(),
        longestStreak: Math.max(newStreak, patient?.longestStreak || 0),
      },
    });

    // Verificar conquistas de streak
    if ([3, 7, 30, 90].includes(newStreak)) {
      const action = `STREAK_${newStreak}_DAYS`;
      await this.addPoints(patientId, POINTS_CONFIG[action], action);
    }

    return newStreak;
  }

  private calculateStreakBonus(streak: number): number {
    if (streak < 3) return 0;
    if (streak < 7) return 5;
    if (streak < 14) return 10;
    if (streak < 30) return 20;
    return 30;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BADGES (CONQUISTAS)
  // ═══════════════════════════════════════════════════════════════════════════

  private async checkAchievements(patientId: string, action: string): Promise<void> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        badges: { select: { badgeId: true } },
        _count: {
          select: {
            consultations: true,
            prescriptions: true,
          },
        },
      },
    });

    const earnedBadgeIds = patient?.badges.map(b => b.badgeId) || [];

    // Verificar cada badge
    for (const [badgeId, badge] of Object.entries(BADGES)) {
      if (earnedBadgeIds.includes(badgeId)) continue;

      const earned = await this.checkBadgeCriteria(patient, badge.criteria, action);
      
      if (earned) {
        await this.awardBadge(patientId, badgeId, badge);
      }
    }
  }

  private async checkBadgeCriteria(
    patient: any,
    criteria: any,
    action: string,
  ): Promise<boolean> {
    if (criteria.consultations && patient._count.consultations >= criteria.consultations) {
      return true;
    }

    if (criteria.totalPoints && patient.gamificationPoints >= criteria.totalPoints) {
      return true;
    }

    if (criteria.vitalSignStreak && patient.currentStreak >= criteria.vitalSignStreak) {
      return true;
    }

    if (criteria.wearableConnected && (patient.healthKitConnected || patient.googleFitConnected)) {
      return true;
    }

    return false;
  }

  private async awardBadge(
    patientId: string,
    badgeId: string,
    badge: typeof BADGES[string],
  ): Promise<void> {
    // Verificar se badge existe no banco
    let dbBadge = await this.prisma.badge.findUnique({
      where: { id: badgeId },
    });

    if (!dbBadge) {
      // Criar badge no banco
      dbBadge = await this.prisma.badge.create({
        data: {
          id: badgeId,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          rarity: badge.rarity,
          criteria: badge.criteria as any,
        },
      });
    }

    // Atribuir ao paciente
    await this.prisma.patientBadge.create({
      data: {
        patientId,
        badgeId,
        earnedAt: new Date(),
      },
    });

    // Notificar
    this.eventEmitter.emit('notification.send', {
      userId: patientId,
      type: 'PUSH',
      title: `🏅 Nova Conquista: ${badge.name}!`,
      body: badge.description,
    });

    // Auditoria
    await this.auditService.log({
      action: AuditAction.CREATE,
      resource: 'patient_badge',
      resourceId: badgeId,
      userId: patientId,
      description: `Badge conquistado: ${badge.name}`,
    });
  }

  async getPatientBadges(patientId: string): Promise<any[]> {
    return this.prisma.patientBadge.findMany({
      where: { patientId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RECOMPENSAS
  // ═══════════════════════════════════════════════════════════════════════════

  async getAvailableRewards(patientId: string): Promise<any[]> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: { gamificationPoints: true, totalCashback: true },
    });

    const rewards = await this.prisma.reward.findMany({
      where: { active: true },
      orderBy: { pointsCost: 'asc' },
    });

    return rewards.map(reward => ({
      ...reward,
      canRedeem: patient.gamificationPoints >= reward.pointsCost,
    }));
  }

  async redeemReward(
    patientId: string,
    rewardId: string,
  ): Promise<{ success: boolean; message: string }> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    const reward = await this.prisma.reward.findUnique({
      where: { id: rewardId },
    });

    if (!reward || !reward.active) {
      throw new NotFoundException('Recompensa não encontrada');
    }

    if (patient.gamificationPoints < reward.pointsCost) {
      throw new BadRequestException('Pontos insuficientes');
    }

    // Transação
    await this.prisma.$transaction([
      // Deduzir pontos
      this.prisma.patient.update({
        where: { id: patientId },
        data: {
          gamificationPoints: { decrement: reward.pointsCost },
        },
      }),
      // Registrar resgate
      this.prisma.patientReward.create({
        data: {
          patientId,
          rewardId,
          redeemedAt: new Date(),
          status: 'PENDING',
        },
      }),
    ]);

    // Auditoria
    await this.auditService.log({
      action: AuditAction.CREATE,
      resource: 'patient_reward',
      resourceId: rewardId,
      userId: patientId,
      description: `Recompensa resgatada: ${reward.name}`,
      metadata: { pointsCost: reward.pointsCost },
    });

    return {
      success: true,
      message: `Recompensa "${reward.name}" resgatada com sucesso!`,
    };
  }

  private async getLevelReward(level: number): Promise<any | null> {
    // Recompensas por nível
    return this.prisma.reward.findFirst({
      where: {
        type: 'LEVEL_UP',
        metadata: {
          path: ['level'],
          equals: level,
        },
      },
    });
  }

  private async grantReward(patientId: string, rewardId: string): Promise<void> {
    await this.prisma.patientReward.create({
      data: {
        patientId,
        rewardId,
        redeemedAt: new Date(),
        status: 'GRANTED',
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LEADERBOARD
  // ═══════════════════════════════════════════════════════════════════════════

  async getLeaderboard(
    options: { clinicId?: string; period?: 'week' | 'month' | 'all' } = {},
  ): Promise<any[]> {
    const cacheKey = `${this.CACHE_PREFIX}leaderboard:${options.clinicId || 'global'}:${options.period || 'all'}`;
    
    const cached = await this.cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    const where: any = {};
    
    if (options.clinicId) {
      where.clinicPatients = {
        some: { clinicId: options.clinicId },
      };
    }

    const leaderboard = await this.prisma.patient.findMany({
      where,
      orderBy: { gamificationPoints: 'desc' },
      take: 100,
      select: {
        id: true,
        fullName: true,
        socialName: true,
        profilePhotoUrl: true,
        gamificationPoints: true,
        gamificationLevel: true,
        currentStreak: true,
        _count: {
          select: { badges: true },
        },
      },
    });

    const result = leaderboard.map((patient, index) => ({
      rank: index + 1,
      id: patient.id,
      name: patient.socialName || patient.fullName,
      avatar: patient.profilePhotoUrl,
      points: patient.gamificationPoints,
      level: patient.gamificationLevel,
      streak: patient.currentStreak,
      badges: patient._count.badges,
    }));

    await this.cacheService.set(cacheKey, result, this.LEADERBOARD_CACHE_TTL);

    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ESTATÍSTICAS
  // ═══════════════════════════════════════════════════════════════════════════

  async getPatientStats(patientId: string): Promise<any> {
    const cacheKey = `${this.CACHE_PREFIX}stats:${patientId}`;
    
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        badges: { include: { badge: true } },
        rewards: { include: { reward: true } },
        _count: {
          select: {
            tasks: { where: { status: TaskStatus.COMPLETED } },
            consultations: true,
          },
        },
      },
    });

    const levelProgress = this.getPointsForNextLevel(patient.gamificationPoints);

    const stats = {
      points: patient.gamificationPoints,
      level: patient.gamificationLevel,
      levelProgress,
      streak: {
        current: patient.currentStreak,
        longest: patient.longestStreak,
      },
      badges: {
        total: patient.badges.length,
        recent: patient.badges.slice(0, 5).map(b => ({
          ...b.badge,
          earnedAt: b.earnedAt,
        })),
      },
      rewards: {
        total: patient.rewards.length,
        redeemed: patient.rewards.filter(r => r.status === 'REDEEMED').length,
      },
      tasks: {
        completed: patient._count.tasks,
      },
      consultations: patient._count.consultations,
      cashback: patient.totalCashback,
    };

    await this.cacheService.set(cacheKey, stats, 300); // 5 min

    return stats;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  private getActionDescription(action: string): string {
    const descriptions: Record<string, string> = {
      VITAL_SIGN_RECORDED: 'Registrou sinais vitais',
      MEDICATION_TAKEN: 'Tomou medicamento',
      CONSULTATION_COMPLETED: 'Completou consulta',
      PRESCRIPTION_DISPENSED: 'Retirou medicamento',
      DAILY_LOGIN: 'Login diário',
      PROFILE_COMPLETED: 'Completou perfil',
      WEARABLE_CONNECTED: 'Conectou wearable',
      TASK_VITAL_SIGN: 'Completou tarefa de sinais vitais',
      TASK_MEDICATION: 'Completou tarefa de medicamento',
      TASK_CHECK_IN: 'Completou check-in diário',
    };

    return descriptions[action] || action;
  }

  private parseFrequencyToTimes(frequency: string): number[] {
    // Parse frequência para horários
    const freq = frequency.toLowerCase();
    
    if (freq.includes('8/8') || freq.includes('3x')) {
      return [8, 14, 22]; // 8h, 14h, 22h
    }
    if (freq.includes('12/12') || freq.includes('2x')) {
      return [8, 20]; // 8h, 20h
    }
    if (freq.includes('6/6') || freq.includes('4x')) {
      return [6, 12, 18, 24]; // 6h, 12h, 18h, 00h
    }
    
    // 1x ao dia
    return [8]; // 8h
  }
}
```

#### CHECKPOINT 6.1.1:
```
VALIDAÇÃO OBRIGATÓRIA:
[ ] Sistema de pontos funcionando?
[ ] Níveis calculados corretamente?
[ ] Tarefas diárias geradas?
[ ] Streaks funcionando?
[ ] Badges sendo concedidos?
[ ] Recompensas resgatáveis?
[ ] Leaderboard funcionando?
[ ] Event handlers configurados?

EXECUTAR:
cd apps/api
npm run lint
npm run build
npm run test -- --coverage
```

---

## FASE 7: TELEMEDICINA [Dias 141-168]

### 7.1 TELEMEDICINE SERVICE

#### PROMPT 7.1.1: Service Completo de Telemedicina
```typescript
CRIAR ARQUIVO: /healthflow/apps/api/src/modules/telemedicine/telemedicine.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as crypto from 'crypto';
import * as dayjs from 'dayjs';
import { PrismaService } from '@/database/prisma.service';
import { CacheService } from '@/common/services/cache.service';
import { AuditService } from '@/common/services/audit.service';
import { TwilioService } from '@/modules/integrations/twilio/twilio.service';
import { AgoraService } from '@/modules/integrations/agora/agora.service';
import { AuditAction, AppointmentStatus } from '@prisma/client';

interface TelemedicineSession {
  id: string;
  appointmentId: string;
  roomName: string;
  patientToken: string;
  doctorToken: string;
  status: 'waiting' | 'in_progress' | 'ended';
  startedAt?: Date;
  endedAt?: Date;
  duration?: number;
  recordingUrl?: string;
}

@Injectable()
export class TelemedicineService {
  private readonly logger = new Logger(TelemedicineService.name);
  private readonly CACHE_PREFIX = 'telemedicine:';
  private readonly SESSION_TTL = 7200; // 2 horas

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
    private readonly twilioService: TwilioService,
    private readonly agoraService: AgoraService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // CRIAR SESSÃO DE TELEMEDICINA
  // ═══════════════════════════════════════════════════════════════════════════

  async createSession(appointmentId: string, userId: string): Promise<TelemedicineSession> {
    this.logger.log(`Creating telemedicine session for appointment ${appointmentId}`);

    // Buscar agendamento
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          include: { user: { select: { id: true, email: true } } },
        },
        doctor: {
          include: { user: { select: { id: true, email: true } } },
        },
        clinic: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    // Validar se é telemedicina
    if (!appointment.isTelemedicine) {
      throw new BadRequestException('Este agendamento não é de telemedicina');
    }

    // Verificar permissão
    const isPatient = appointment.patient.userId === userId;
    const isDoctor = appointment.doctor.userId === userId;

    if (!isPatient && !isDoctor) {
      throw new ForbiddenException('Você não tem permissão para esta consulta');
    }

    // Verificar status do agendamento
    const allowedStatuses = [
      AppointmentStatus.SCHEDULED,
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.CHECKED_IN,
      AppointmentStatus.IN_PROGRESS,
    ];

    if (!allowedStatuses.includes(appointment.status)) {
      throw new BadRequestException('Status do agendamento não permite teleconsulta');
    }

    // Verificar se já existe sessão ativa
    const existingSession = await this.cacheService.get<TelemedicineSession>(
      `${this.CACHE_PREFIX}session:${appointmentId}`
    );

    if (existingSession && existingSession.status !== 'ended') {
      return existingSession;
    }

    // Gerar sala e tokens
    const roomName = this.generateRoomName(appointmentId);
    const sessionId = crypto.randomUUID();

    // Gerar tokens para paciente e médico
    // Usando Twilio Video como provider padrão
    const patientToken = await this.twilioService.generateVideoToken(
      roomName,
      `patient_${appointment.patientId}`,
      {
        ttl: 7200, // 2 horas
        identity: appointment.patient.fullName,
      }
    );

    const doctorToken = await this.twilioService.generateVideoToken(
      roomName,
      `doctor_${appointment.doctorId}`,
      {
        ttl: 7200,
        identity: appointment.doctor.fullName,
      }
    );

    // Criar sala no Twilio
    await this.twilioService.createVideoRoom(roomName, {
      recordParticipantsOnConnect: true, // Gravar consulta
      maxParticipants: 2,
      statusCallback: `${this.configService.get('APP_URL')}/api/webhooks/twilio/video`,
    });

    // Criar sessão
    const session: TelemedicineSession = {
      id: sessionId,
      appointmentId,
      roomName,
      patientToken,
      doctorToken,
      status: 'waiting',
    };

    // Salvar no cache
    await this.cacheService.set(
      `${this.CACHE_PREFIX}session:${appointmentId}`,
      session,
      this.SESSION_TTL
    );

    // Atualizar agendamento com dados da telemedicina
    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        telemedicineSessionId: sessionId,
        telemedicineRoomName: roomName,
      },
    });

    // Auditoria
    await this.auditService.log({
      action: AuditAction.CREATE,
      resource: 'telemedicine_session',
      resourceId: sessionId,
      userId,
      description: 'Sessão de telemedicina criada',
      metadata: { appointmentId, roomName },
    });

    this.logger.log(`Telemedicine session created: ${sessionId}`);

    return session;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ENTRAR NA SALA
  // ═══════════════════════════════════════════════════════════════════════════

  async joinSession(
    appointmentId: string,
    userId: string,
  ): Promise<{ token: string; roomName: string; role: 'patient' | 'doctor' }> {
    const session = await this.cacheService.get<TelemedicineSession>(
      `${this.CACHE_PREFIX}session:${appointmentId}`
    );

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    if (session.status === 'ended') {
      throw new BadRequestException('Sessão já encerrada');
    }

    // Buscar appointment para verificar permissão
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { select: { userId: true } },
        doctor: { select: { userId: true } },
      },
    });

    let token: string;
    let role: 'patient' | 'doctor';

    if (appointment.patient.userId === userId) {
      token = session.patientToken;
      role = 'patient';
    } else if (appointment.doctor.userId === userId) {
      token = session.doctorToken;
      role = 'doctor';

      // Se médico está entrando, atualizar status
      if (session.status === 'waiting') {
        session.status = 'in_progress';
        session.startedAt = new Date();

        await this.cacheService.set(
          `${this.CACHE_PREFIX}session:${appointmentId}`,
          session,
          this.SESSION_TTL
        );

        // Atualizar appointment
        await this.prisma.appointment.update({
          where: { id: appointmentId },
          data: {
            status: AppointmentStatus.IN_PROGRESS,
            startedAt: new Date(),
          },
        });

        // Notificar paciente que médico entrou
        this.eventEmitter.emit('telemedicine.doctor-joined', {
          appointmentId,
          patientId: appointment.patient.userId,
        });
      }
    } else {
      throw new ForbiddenException('Você não tem permissão');
    }

    // Auditoria
    await this.auditService.log({
      action: AuditAction.READ,
      resource: 'telemedicine_session',
      resourceId: session.id,
      userId,
      description: `${role} entrou na sessão`,
    });

    return { token, roomName: session.roomName, role };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTROLES DA CONSULTA
  // ═══════════════════════════════════════════════════════════════════════════

  async toggleMute(
    appointmentId: string,
    userId: string,
    muted: boolean,
  ): Promise<void> {
    // Evento para sincronizar estado no cliente
    this.eventEmitter.emit('telemedicine.participant-muted', {
      appointmentId,
      participantId: userId,
      muted,
    });
  }

  async toggleVideo(
    appointmentId: string,
    userId: string,
    videoOff: boolean,
  ): Promise<void> {
    this.eventEmitter.emit('telemedicine.participant-video-toggled', {
      appointmentId,
      participantId: userId,
      videoOff,
    });
  }

  async startScreenShare(
    appointmentId: string,
    userId: string,
  ): Promise<{ shareToken: string }> {
    const session = await this.getSession(appointmentId);

    // Gerar token para compartilhamento de tela
    const shareToken = await this.twilioService.generateVideoToken(
      session.roomName,
      `screen_${userId}`,
      { ttl: 3600 }
    );

    this.eventEmitter.emit('telemedicine.screen-share-started', {
      appointmentId,
      participantId: userId,
    });

    return { shareToken };
  }

  async stopScreenShare(appointmentId: string, userId: string): Promise<void> {
    this.eventEmitter.emit('telemedicine.screen-share-stopped', {
      appointmentId,
      participantId: userId,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ENCERRAR SESSÃO
  // ═══════════════════════════════════════════════════════════════════════════

  async endSession(
    appointmentId: string,
    userId: string,
    reason?: string,
  ): Promise<{ duration: number; recordingUrl?: string }> {
    const session = await this.getSession(appointmentId);

    if (session.status === 'ended') {
      throw new BadRequestException('Sessão já encerrada');
    }

    // Calcular duração
    const startedAt = session.startedAt || new Date();
    const endedAt = new Date();
    const duration = Math.round((endedAt.getTime() - startedAt.getTime()) / 60000);

    // Buscar URL da gravação
    let recordingUrl: string | undefined;
    try {
      const recordings = await this.twilioService.getRecordings(session.roomName);
      if (recordings.length > 0) {
        recordingUrl = recordings[0].mediaUrl;
      }
    } catch (error) {
      this.logger.warn(`Failed to get recording: ${error.message}`);
    }

    // Atualizar sessão
    session.status = 'ended';
    session.endedAt = endedAt;
    session.duration = duration;
    session.recordingUrl = recordingUrl;

    await this.cacheService.set(
      `${this.CACHE_PREFIX}session:${appointmentId}`,
      session,
      86400 // 24h para referência
    );

    // Fechar sala no Twilio
    await this.twilioService.completeRoom(session.roomName);

    // Atualizar appointment
    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.COMPLETED,
        endedAt,
        telemedicineDuration: duration,
        telemedicineRecordingUrl: recordingUrl,
      },
    });

    // Emitir evento para notificar participantes
    this.eventEmitter.emit('telemedicine.session-ended', {
      appointmentId,
      duration,
      reason,
    });

    // Auditoria
    await this.auditService.log({
      action: AuditAction.UPDATE,
      resource: 'telemedicine_session',
      resourceId: session.id,
      userId,
      description: 'Sessão de telemedicina encerrada',
      metadata: { duration, reason, hasRecording: !!recordingUrl },
    });

    this.logger.log(`Telemedicine session ended: ${session.id}, duration: ${duration}min`);

    return { duration, recordingUrl };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SALA DE ESPERA
  // ═══════════════════════════════════════════════════════════════════════════

  async getWaitingRoom(doctorId: string): Promise<any[]> {
    // Buscar agendamentos de telemedicina do médico
    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        isTelemedicine: true,
        scheduledDate: {
          gte: dayjs().startOf('day').toDate(),
          lte: dayjs().endOf('day').toDate(),
        },
        status: {
          in: [
            AppointmentStatus.SCHEDULED,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.CHECKED_IN,
          ],
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            socialName: true,
            profilePhotoUrl: true,
          },
        },
      },
      orderBy: { scheduledTime: 'asc' },
    });

    // Enriquecer com status da sessão
    const enriched = await Promise.all(
      appointments.map(async (apt) => {
        const session = await this.cacheService.get<TelemedicineSession>(
          `${this.CACHE_PREFIX}session:${apt.id}`
        );

        return {
          id: apt.id,
          patient: apt.patient,
          scheduledTime: apt.scheduledTime,
          status: apt.status,
          sessionStatus: session?.status || null,
          isPatientWaiting: session?.status === 'waiting',
        };
      })
    );

    return enriched;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WEBHOOK HANDLERS (Twilio)
  // ═══════════════════════════════════════════════════════════════════════════

  async handleTwilioWebhook(payload: any): Promise<void> {
    const { StatusCallbackEvent, RoomSid, RoomName, ParticipantIdentity } = payload;

    this.logger.log(`Twilio webhook: ${StatusCallbackEvent} for room ${RoomName}`);

    switch (StatusCallbackEvent) {
      case 'participant-connected':
        this.eventEmitter.emit('telemedicine.participant-connected', {
          roomName: RoomName,
          participantId: ParticipantIdentity,
        });
        break;

      case 'participant-disconnected':
        this.eventEmitter.emit('telemedicine.participant-disconnected', {
          roomName: RoomName,
          participantId: ParticipantIdentity,
        });
        break;

      case 'room-ended':
        // Room encerrado automaticamente
        break;

      case 'recording-started':
        this.logger.log(`Recording started for room ${RoomName}`);
        break;

      case 'recording-completed':
        this.logger.log(`Recording completed for room ${RoomName}`);
        // Processar gravação
        await this.processRecording(RoomName, payload.RecordingSid);
        break;
    }
  }

  private async processRecording(roomName: string, recordingSid: string): Promise<void> {
    try {
      // Baixar e armazenar gravação
      const recording = await this.twilioService.getRecording(recordingSid);
      
      // TODO: Upload para S3
      const s3Url = `https://s3.amazonaws.com/healthflow/recordings/${recordingSid}.mp4`;

      // Atualizar appointment com URL da gravação
      await this.prisma.appointment.updateMany({
        where: { telemedicineRoomName: roomName },
        data: { telemedicineRecordingUrl: s3Url },
      });

      this.logger.log(`Recording processed: ${recordingSid}`);
    } catch (error) {
      this.logger.error(`Failed to process recording: ${error.message}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STAMP CFM (Carimbo de Telemedicina)
  // ═══════════════════════════════════════════════════════════════════════════

  async generateCfmStamp(appointmentId: string): Promise<string> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        doctor: true,
        clinic: true,
      },
    });

    if (!appointment.isTelemedicine) {
      throw new BadRequestException('Não é uma teleconsulta');
    }

    // Gerar carimbo conforme CFM 2.314/2022
    const stamp = {
      type: 'TELECONSULTA',
      cfmResolution: '2.314/2022',
      datetime: appointment.startedAt,
      duration: appointment.telemedicineDuration,
      patient: {
        name: appointment.patient.fullName,
        cpf: appointment.patient.cpf,
      },
      doctor: {
        name: appointment.doctor.fullName,
        crm: `${appointment.doctor.crm}/${appointment.doctor.crmState}`,
      },
      clinic: {
        name: appointment.clinic.tradeName,
        cnpj: appointment.clinic.cnpj,
      },
      platform: 'HEALTHFLOW',
      platformCnpj: this.configService.get('COMPANY_CNPJ'),
      sessionId: appointment.telemedicineSessionId,
      hasRecording: !!appointment.telemedicineRecordingUrl,
    };

    return JSON.stringify(stamp);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  private generateRoomName(appointmentId: string): string {
    const timestamp = Date.now().toString(36);
    return `healthflow_${appointmentId.slice(0, 8)}_${timestamp}`;
  }

  private async getSession(appointmentId: string): Promise<TelemedicineSession> {
    const session = await this.cacheService.get<TelemedicineSession>(
      `${this.CACHE_PREFIX}session:${appointmentId}`
    );

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    return session;
  }
}
```

#### CHECKPOINT 7.1.1:
```
VALIDAÇÃO OBRIGATÓRIA:
[ ] Criação de sessão funcionando?
[ ] Tokens de vídeo gerados?
[ ] Join/leave funcionando?
[ ] Controles (mute/video) implementados?
[ ] Encerramento correto?
[ ] Gravação configurada?
[ ] Webhook handlers prontos?
[ ] Stamp CFM implementado?

EXECUTAR:
cd apps/api
npm run lint
npm run build
```

---

## CICLO DE VALIDAÇÃO COMPLETO - PARTE 4

```
╔══════════════════════════════════════════════════════════════════════════════╗
║           VALIDAÇÃO COMPLETA - FASES 4, 5, 6 E 7                            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  FASE 4 - CONSULTAS/PRONTUÁRIO                                              ║
║  □ DTOs SOAP completos                                                       ║
║  □ Service com início/atualização/finalização                                ║
║  □ Assinatura digital ICP-Brasil                                             ║
║  □ Integração IA transcrição                                                 ║
║  □ Hash de integridade                                                       ║
║  □ FHIR resources                                                            ║
║                                                                              ║
║  FASE 5 - PRESCRIÇÃO DIGITAL                                                 ║
║  □ Criação de prescrições                                                    ║
║  □ Assinatura digital                                                        ║
║  □ Validação para farmácias                                                  ║
║  □ Controle ANVISA (listas)                                                  ║
║  □ Dispensação com cashback                                                  ║
║  □ Alertas alergia/interação                                                 ║
║  □ SNGPC preparado                                                           ║
║                                                                              ║
║  FASE 6 - GAMIFICAÇÃO                                                        ║
║  □ Sistema de pontos                                                         ║
║  □ Níveis e progressão                                                       ║
║  □ Tarefas diárias                                                           ║
║  □ Streaks                                                                   ║
║  □ Badges/conquistas                                                         ║
║  □ Recompensas                                                               ║
║  □ Leaderboard                                                               ║
║                                                                              ║
║  FASE 7 - TELEMEDICINA                                                       ║
║  □ Criação de sessões                                                        ║
║  □ Tokens de vídeo (Twilio)                                                  ║
║  □ Controles de chamada                                                      ║
║  □ Gravação                                                                  ║
║  □ Webhooks                                                                  ║
║  □ Stamp CFM 2.314/2022                                                      ║
║                                                                              ║
║  SEQUÊNCIA DE VALIDAÇÃO FINAL:                                               ║
║  1. npm run lint (zero erros)                                                ║
║  2. npm run build (sucesso)                                                  ║
║  3. npm run test -- --coverage (>80%)                                        ║
║  4. npm run test:e2e                                                         ║
║  5. docker-compose up -d && npm run db:migrate                               ║
║  6. npm run start:dev (testar Swagger)                                       ║
║                                                                              ║
║  SE TUDO OK → COMMIT:                                                        ║
║  git add .                                                                   ║
║  git commit -m "feat: implement core medical modules (consultation,          ║
║    prescription, gamification, telemedicine)"                                ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

**CONTINUA NA PARTE 5:**
- Fase 8: Notificações (Push, Email, SMS, WhatsApp)
- Fase 9: Integrações FHIR/RNDS
- Fase 10: Analytics e BI
- Fase 11: Frontend Web (React)
- Fase 12: Mobile App (React Native)
