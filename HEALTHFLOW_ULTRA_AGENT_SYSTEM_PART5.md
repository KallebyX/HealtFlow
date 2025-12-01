# HEALTHFLOW - ULTRA AGENT SYSTEM - PARTE 5
## Notificações, Integrações Saúde (FHIR/RNDS/CFM), Analytics, Frontend Web e Mobile

---

## FASE 8: NOTIFICAÇÕES MULTI-CANAL [Dias 120-133]

### 8.1 NOTIFICATION SERVICE

#### PROMPT 8.1.1: Service Completo de Notificações
```typescript
CRIAR ARQUIVO: /healthflow/apps/api/src/modules/notifications/notifications.service.ts

import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as dayjs from 'dayjs';
import { PrismaService } from '@/database/prisma.service';
import { CacheService } from '@/common/services/cache.service';
import { FirebaseService } from '@/modules/integrations/firebase/firebase.service';
import { TwilioSmsService } from '@/modules/integrations/twilio/twilio-sms.service';
import { SendgridService } from '@/modules/integrations/sendgrid/sendgrid.service';
import { WhatsAppService } from '@/modules/integrations/whatsapp/whatsapp.service';
import {
  CreateNotificationDto,
  NotificationPreferencesDto,
} from './dto/notification.dto';
import {
  Notification,
  NotificationType,
  NotificationStatus,
  User,
} from '@prisma/client';

interface NotificationPayload {
  userId: string;
  type: 'PUSH' | 'EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP';
  title: string;
  body: string;
  data?: Record<string, any>;
  template?: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  scheduledFor?: Date;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly firebaseService: FirebaseService,
    private readonly twilioSmsService: TwilioSmsService,
    private readonly sendgridService: SendgridService,
    private readonly whatsAppService: WhatsAppService,
    @InjectQueue('notifications') private readonly notificationQueue: Queue,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  @OnEvent('notification.send')
  async handleNotificationEvent(payload: NotificationPayload): Promise<void> {
    this.logger.log(`Processing notification for user ${payload.userId}: ${payload.type}`);

    try {
      // Se agendada para o futuro, adicionar na fila
      if (payload.scheduledFor && payload.scheduledFor > new Date()) {
        await this.scheduleNotification(payload);
        return;
      }

      await this.send(payload);
    } catch (error) {
      this.logger.error(`Failed to process notification: ${error.message}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ENVIO DE NOTIFICAÇÕES
  // ═══════════════════════════════════════════════════════════════════════════

  async send(payload: NotificationPayload): Promise<Notification> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        patient: true,
        doctor: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar preferências do usuário
    const preferences = await this.getUserPreferences(payload.userId);
    if (!this.shouldSendNotification(payload.type, preferences)) {
      this.logger.debug(`Notification skipped due to user preferences: ${payload.userId}`);
      return null;
    }

    // Criar registro da notificação
    const notification = await this.prisma.notification.create({
      data: {
        userId: payload.userId,
        type: payload.type as NotificationType,
        title: payload.title,
        body: payload.body,
        data: payload.data as any,
        priority: payload.priority || 'normal',
        status: NotificationStatus.PENDING,
      },
    });

    // Enviar pelo canal apropriado
    try {
      switch (payload.type) {
        case 'PUSH':
          await this.sendPushNotification(user, payload, notification.id);
          break;
        case 'EMAIL':
          await this.sendEmailNotification(user, payload, notification.id);
          break;
        case 'SMS':
          await this.sendSmsNotification(user, payload, notification.id);
          break;
        case 'WHATSAPP':
          await this.sendWhatsAppNotification(user, payload, notification.id);
          break;
        case 'IN_APP':
          // IN_APP já está salvo no banco, apenas atualizar status
          break;
      }

      // Atualizar status para enviado
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
        },
      });

      return notification;
    } catch (error) {
      // Marcar como falha
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.FAILED,
          errorMessage: error.message,
        },
      });

      throw error;
    }
  }

  async sendBulk(
    userIds: string[],
    payload: Omit<NotificationPayload, 'userId'>,
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    // Processar em batches de 100
    const batchSize = 100;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      const promises = batch.map((userId) =>
        this.send({ ...payload, userId })
          .then(() => { sent++; })
          .catch(() => { failed++; }),
      );

      await Promise.allSettled(promises);
    }

    return { sent, failed };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CANAIS DE ENVIO
  // ═══════════════════════════════════════════════════════════════════════════

  private async sendPushNotification(
    user: User & { patient?: any; doctor?: any },
    payload: NotificationPayload,
    notificationId: string,
  ): Promise<void> {
    // Buscar tokens FCM do usuário
    const fcmTokens = await this.prisma.userDevice.findMany({
      where: {
        userId: user.id,
        active: true,
        fcmToken: { not: null },
      },
      select: { fcmToken: true },
    });

    if (fcmTokens.length === 0) {
      this.logger.warn(`No FCM tokens found for user ${user.id}`);
      return;
    }

    const tokens = fcmTokens.map((d) => d.fcmToken);

    await this.firebaseService.sendMulticast({
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        notificationId,
        ...payload.data,
      },
      android: {
        priority: payload.priority === 'critical' ? 'high' : 'normal',
        notification: {
          channelId: this.getAndroidChannel(payload.data?.type),
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: payload.title,
              body: payload.body,
            },
            sound: 'default',
            badge: await this.getUnreadCount(user.id),
          },
        },
      },
    });
  }

  private async sendEmailNotification(
    user: User & { patient?: any; doctor?: any },
    payload: NotificationPayload,
    notificationId: string,
  ): Promise<void> {
    const recipientName = user.patient?.fullName || user.doctor?.fullName || 'Usuário';

    await this.sendgridService.send({
      to: user.email,
      subject: payload.title,
      templateId: payload.template || 'general-notification',
      dynamicTemplateData: {
        recipientName,
        title: payload.title,
        body: payload.body,
        ...payload.data,
        year: new Date().getFullYear(),
      },
    });
  }

  private async sendSmsNotification(
    user: User & { patient?: any; doctor?: any },
    payload: NotificationPayload,
    notificationId: string,
  ): Promise<void> {
    const phone = user.patient?.phone || user.doctor?.phone;

    if (!phone) {
      throw new Error('User has no phone number');
    }

    // Limitar SMS a 160 caracteres
    const message = `${payload.title}: ${payload.body}`.substring(0, 160);

    await this.twilioSmsService.send({
      to: phone,
      body: message,
    });
  }

  private async sendWhatsAppNotification(
    user: User & { patient?: any; doctor?: any },
    payload: NotificationPayload,
    notificationId: string,
  ): Promise<void> {
    const phone = user.patient?.phone || user.doctor?.phone;

    if (!phone) {
      throw new Error('User has no phone number');
    }

    await this.whatsAppService.sendTemplate({
      to: phone,
      template: payload.template || 'notification_general',
      parameters: {
        title: payload.title,
        body: payload.body,
        ...payload.data,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AGENDAMENTO
  // ═══════════════════════════════════════════════════════════════════════════

  async scheduleNotification(payload: NotificationPayload): Promise<void> {
    const delay = payload.scheduledFor.getTime() - Date.now();

    await this.notificationQueue.add(
      'send',
      payload,
      {
        delay,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000, // 1 minuto
        },
      },
    );

    this.logger.log(`Notification scheduled for ${payload.scheduledFor}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PREFERÊNCIAS
  // ═══════════════════════════════════════════════════════════════════════════

  async getUserPreferences(userId: string): Promise<NotificationPreferencesDto> {
    const cacheKey = `notification:preferences:${userId}`;
    
    let preferences = await this.cacheService.get<NotificationPreferencesDto>(cacheKey);
    
    if (!preferences) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { notificationPreferences: true },
      });

      preferences = (user?.notificationPreferences as NotificationPreferencesDto) || {
        push: true,
        email: true,
        sms: false,
        whatsapp: true,
        inApp: true,
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        categories: {
          appointments: true,
          prescriptions: true,
          gamification: true,
          promotions: false,
          system: true,
        },
      };

      await this.cacheService.set(cacheKey, preferences, 3600);
    }

    return preferences;
  }

  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferencesDto>,
  ): Promise<NotificationPreferencesDto> {
    const current = await this.getUserPreferences(userId);
    const updated = { ...current, ...preferences };

    await this.prisma.user.update({
      where: { id: userId },
      data: { notificationPreferences: updated as any },
    });

    await this.cacheService.del(`notification:preferences:${userId}`);

    return updated;
  }

  private shouldSendNotification(
    type: string,
    preferences: NotificationPreferencesDto,
  ): boolean {
    // Verificar canal habilitado
    const channelEnabled = {
      PUSH: preferences.push,
      EMAIL: preferences.email,
      SMS: preferences.sms,
      WHATSAPP: preferences.whatsapp,
      IN_APP: preferences.inApp,
    };

    if (!channelEnabled[type]) {
      return false;
    }

    // Verificar horário de silêncio
    if (preferences.quietHoursEnabled) {
      const now = dayjs();
      const start = dayjs(`${now.format('YYYY-MM-DD')} ${preferences.quietHoursStart}`);
      const end = dayjs(`${now.format('YYYY-MM-DD')} ${preferences.quietHoursEnd}`);

      if (end.isBefore(start)) {
        // Atravessa meia-noite
        if (now.isAfter(start) || now.isBefore(end)) {
          return false;
        }
      } else {
        if (now.isAfter(start) && now.isBefore(end)) {
          return false;
        }
      }
    }

    return true;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSULTAS
  // ═══════════════════════════════════════════════════════════════════════════

  async findByUser(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
    } = {},
  ): Promise<{ data: Notification[]; total: number; unread: number }> {
    const { page = 1, limit = 20, unreadOnly = false } = options;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (unreadOnly) {
      where.readAt = null;
    }

    const [data, total, unread] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    return { data, total, unread };
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { readAt: new Date(), status: NotificationStatus.READ },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date(), status: NotificationStatus.READ },
    });
  }

  async delete(notificationId: string, userId: string): Promise<void> {
    await this.prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
  }

  private async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, readAt: null },
    });
  }

  private getAndroidChannel(type?: string): string {
    const channels: Record<string, string> = {
      appointment: 'appointments',
      prescription: 'prescriptions',
      gamification: 'gamification',
      telemedicine: 'telemedicine',
      default: 'general',
    };

    return channels[type] || channels.default;
  }
}
```

#### CHECKPOINT 8.1.1:
```
VALIDAÇÃO OBRIGATÓRIA:
[ ] Service criado sem erros?
[ ] Push notifications (Firebase FCM)?
[ ] Email (SendGrid)?
[ ] SMS (Twilio)?
[ ] WhatsApp?
[ ] Preferências do usuário?
[ ] Horário de silêncio?
[ ] Fila de processamento (Bull)?

EXECUTAR:
npm run lint
npm run build

SE TUDO PASSAR → PROSSEGUIR
```

---

## FASE 9: INTEGRAÇÕES SAÚDE [Dias 134-161]

### 9.1 FHIR SERVICE

#### PROMPT 9.1.1: Service de Integração FHIR R4
```typescript
CRIAR ARQUIVO: /healthflow/apps/api/src/modules/integrations/fhir/fhir.service.ts

import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as dayjs from 'dayjs';
import { PrismaService } from '@/database/prisma.service';
import { AuditService } from '@/common/services/audit.service';
import { AuditAction } from '@prisma/client';

// Tipos FHIR R4 simplificados
interface FhirResource {
  resourceType: string;
  id?: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
    profile?: string[];
  };
  [key: string]: any;
}

interface FhirPatient extends FhirResource {
  resourceType: 'Patient';
  identifier: Array<{
    system: string;
    value: string;
  }>;
  name: Array<{
    use: string;
    family: string;
    given: string[];
  }>;
  gender: 'male' | 'female' | 'other' | 'unknown';
  birthDate: string;
  telecom?: Array<{
    system: string;
    value: string;
    use?: string;
  }>;
  address?: Array<{
    use: string;
    line: string[];
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }>;
}

interface FhirEncounter extends FhirResource {
  resourceType: 'Encounter';
  status: 'planned' | 'arrived' | 'triaged' | 'in-progress' | 'finished' | 'cancelled';
  class: {
    system: string;
    code: string;
    display: string;
  };
  subject: {
    reference: string;
  };
  participant: Array<{
    individual: {
      reference: string;
    };
  }>;
  period: {
    start: string;
    end?: string;
  };
  serviceProvider: {
    reference: string;
  };
}

@Injectable()
export class FhirService {
  private readonly logger = new Logger(FhirService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {
    this.baseUrl = this.configService.get('FHIR_SERVER_URL') || 'http://localhost:8080/fhir';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PATIENT RESOURCE
  // ═══════════════════════════════════════════════════════════════════════════

  async createPatientResource(patient: any): Promise<string> {
    const fhirPatient: FhirPatient = {
      resourceType: 'Patient',
      meta: {
        profile: ['http://hl7.org/fhir/br/core/StructureDefinition/BRIndividuo-1.0'],
      },
      identifier: [
        {
          system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf',
          value: patient.cpf,
        },
      ],
      name: [
        {
          use: 'official',
          family: patient.fullName.split(' ').slice(-1)[0],
          given: patient.fullName.split(' ').slice(0, -1),
        },
      ],
      gender: this.mapGenderToFhir(patient.gender),
      birthDate: dayjs(patient.birthDate).format('YYYY-MM-DD'),
      telecom: [
        {
          system: 'phone',
          value: patient.phone,
          use: 'mobile',
        },
      ],
    };

    // Adicionar nome social se existir
    if (patient.socialName) {
      fhirPatient.name.push({
        use: 'usual',
        family: patient.socialName.split(' ').slice(-1)[0],
        given: patient.socialName.split(' ').slice(0, -1),
      });
    }

    // Adicionar endereço se existir
    if (patient.address) {
      fhirPatient.address = [
        {
          use: 'home',
          line: [
            `${patient.address.street}, ${patient.address.number}`,
            patient.address.complement,
          ].filter(Boolean),
          city: patient.address.city,
          state: patient.address.state,
          postalCode: patient.address.zipCode,
          country: 'BR',
        },
      ];
    }

    // Adicionar CNS se existir
    if (patient.cns) {
      fhirPatient.identifier.push({
        system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cns',
        value: patient.cns,
      });
    }

    const fhirResourceId = await this.createResource(fhirPatient);

    // Salvar referência no banco
    await this.prisma.fhirResource.create({
      data: {
        resourceType: 'Patient',
        resourceId: fhirResourceId,
        localId: patient.id,
        localType: 'patient',
        data: fhirPatient as any,
        syncedAt: new Date(),
      },
    });

    return fhirResourceId;
  }

  async updatePatientResource(patient: any): Promise<void> {
    const existing = await this.prisma.fhirResource.findFirst({
      where: { localId: patient.id, localType: 'patient' },
    });

    if (!existing) {
      await this.createPatientResource(patient);
      return;
    }

    // Atualizar recurso FHIR
    const fhirPatient = this.buildFhirPatient(patient);
    fhirPatient.id = existing.resourceId;

    await this.updateResource('Patient', existing.resourceId, fhirPatient);

    // Atualizar referência local
    await this.prisma.fhirResource.update({
      where: { id: existing.id },
      data: {
        data: fhirPatient as any,
        syncedAt: new Date(),
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ENCOUNTER RESOURCE (Consultas)
  // ═══════════════════════════════════════════════════════════════════════════

  async createEncounter(data: {
    consultationId: string;
    patientId: string;
    practitionerId: string;
    organizationId: string;
    period: { start: Date; end?: Date };
    reasonCode?: string;
    class: 'AMB' | 'VR' | 'EMER'; // Ambulatorial, Virtual, Emergency
  }): Promise<string> {
    // Buscar referências FHIR
    const [patientFhir, practitionerFhir, organizationFhir] = await Promise.all([
      this.getFhirReference('patient', data.patientId),
      this.getFhirReference('doctor', data.practitionerId),
      this.getFhirReference('clinic', data.organizationId),
    ]);

    const fhirEncounter: FhirEncounter = {
      resourceType: 'Encounter',
      meta: {
        profile: ['http://hl7.org/fhir/br/core/StructureDefinition/BRContatoAssistencial-1.0'],
      },
      status: 'finished',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: data.class,
        display: this.getEncounterClassDisplay(data.class),
      },
      subject: {
        reference: `Patient/${patientFhir}`,
      },
      participant: [
        {
          individual: {
            reference: `Practitioner/${practitionerFhir}`,
          },
        },
      ],
      period: {
        start: data.period.start.toISOString(),
        end: data.period.end?.toISOString(),
      },
      serviceProvider: {
        reference: `Organization/${organizationFhir}`,
      },
    };

    // Adicionar razão da consulta (CID-10)
    if (data.reasonCode) {
      fhirEncounter.reasonCode = [
        {
          coding: [
            {
              system: 'http://hl7.org/fhir/sid/icd-10',
              code: data.reasonCode,
            },
          ],
        },
      ];
    }

    const fhirResourceId = await this.createResource(fhirEncounter);

    // Salvar referência
    await this.prisma.fhirResource.create({
      data: {
        resourceType: 'Encounter',
        resourceId: fhirResourceId,
        localId: data.consultationId,
        localType: 'consultation',
        data: fhirEncounter as any,
        syncedAt: new Date(),
      },
    });

    return fhirResourceId;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONDITION RESOURCE (Diagnósticos)
  // ═══════════════════════════════════════════════════════════════════════════

  async createCondition(data: {
    patientId: string;
    encounterId: string;
    code: string; // CID-10
    display: string;
    clinicalStatus: 'active' | 'recurrence' | 'relapse' | 'inactive' | 'remission' | 'resolved';
    verificationStatus: 'unconfirmed' | 'provisional' | 'differential' | 'confirmed' | 'refuted';
  }): Promise<string> {
    const patientFhir = await this.getFhirReference('patient', data.patientId);
    const encounterFhir = await this.getFhirReference('consultation', data.encounterId);

    const fhirCondition: FhirResource = {
      resourceType: 'Condition',
      meta: {
        profile: ['http://hl7.org/fhir/br/core/StructureDefinition/BRDiagnostico-1.0'],
      },
      clinicalStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
            code: data.clinicalStatus,
          },
        ],
      },
      verificationStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
            code: data.verificationStatus,
          },
        ],
      },
      code: {
        coding: [
          {
            system: 'http://hl7.org/fhir/sid/icd-10',
            code: data.code,
            display: data.display,
          },
        ],
      },
      subject: {
        reference: `Patient/${patientFhir}`,
      },
      encounter: {
        reference: `Encounter/${encounterFhir}`,
      },
      recordedDate: new Date().toISOString(),
    };

    return this.createResource(fhirCondition);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OBSERVATION RESOURCE (Sinais Vitais)
  // ═══════════════════════════════════════════════════════════════════════════

  async createVitalSignsObservation(data: {
    patientId: string;
    encounterId: string;
    vitalSigns: any;
    effectiveDateTime: Date;
  }): Promise<string[]> {
    const patientFhir = await this.getFhirReference('patient', data.patientId);
    const encounterFhir = await this.getFhirReference('consultation', data.encounterId);

    const resourceIds: string[] = [];

    // Criar observação para cada sinal vital
    const vitalSignsMappings = [
      { key: 'systolicBp', code: '8480-6', display: 'Systolic blood pressure', unit: 'mmHg' },
      { key: 'diastolicBp', code: '8462-4', display: 'Diastolic blood pressure', unit: 'mmHg' },
      { key: 'heartRate', code: '8867-4', display: 'Heart rate', unit: '/min' },
      { key: 'respiratoryRate', code: '9279-1', display: 'Respiratory rate', unit: '/min' },
      { key: 'temperature', code: '8310-5', display: 'Body temperature', unit: 'Cel' },
      { key: 'oxygenSaturation', code: '2708-6', display: 'Oxygen saturation', unit: '%' },
      { key: 'weight', code: '29463-7', display: 'Body weight', unit: 'kg' },
      { key: 'height', code: '8302-2', display: 'Body height', unit: 'cm' },
    ];

    for (const mapping of vitalSignsMappings) {
      const value = data.vitalSigns[mapping.key];
      if (value === undefined || value === null) continue;

      const fhirObservation: FhirResource = {
        resourceType: 'Observation',
        meta: {
          profile: ['http://hl7.org/fhir/StructureDefinition/vitalsigns'],
        },
        status: 'final',
        category: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                code: 'vital-signs',
                display: 'Vital Signs',
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: mapping.code,
              display: mapping.display,
            },
          ],
        },
        subject: {
          reference: `Patient/${patientFhir}`,
        },
        encounter: {
          reference: `Encounter/${encounterFhir}`,
        },
        effectiveDateTime: data.effectiveDateTime.toISOString(),
        valueQuantity: {
          value,
          unit: mapping.unit,
          system: 'http://unitsofmeasure.org',
          code: mapping.unit,
        },
      };

      const resourceId = await this.createResource(fhirObservation);
      resourceIds.push(resourceId);
    }

    return resourceIds;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MEDICATION REQUEST (Prescrições)
  // ═══════════════════════════════════════════════════════════════════════════

  async createMedicationRequest(data: {
    prescriptionId: string;
    patientId: string;
    practitionerId: string;
    encounterId?: string;
    medication: {
      name: string;
      code?: string;
      dosage: string;
      frequency: string;
      route: string;
      quantity: number;
      quantityUnit: string;
    };
  }): Promise<string> {
    const patientFhir = await this.getFhirReference('patient', data.patientId);
    const practitionerFhir = await this.getFhirReference('doctor', data.practitionerId);

    const fhirMedicationRequest: FhirResource = {
      resourceType: 'MedicationRequest',
      meta: {
        profile: ['http://hl7.org/fhir/br/core/StructureDefinition/BRPrescricaoMedicamento-1.0'],
      },
      status: 'active',
      intent: 'order',
      medicationCodeableConcept: {
        coding: data.medication.code
          ? [
              {
                system: 'http://www.anvisa.gov.br/datavisa/fila_bula/frmConsultarProduto.asp',
                code: data.medication.code,
                display: data.medication.name,
              },
            ]
          : [],
        text: data.medication.name,
      },
      subject: {
        reference: `Patient/${patientFhir}`,
      },
      requester: {
        reference: `Practitioner/${practitionerFhir}`,
      },
      dosageInstruction: [
        {
          text: `${data.medication.dosage} - ${data.medication.frequency}`,
          route: {
            coding: [
              {
                system: 'http://snomed.info/sct',
                code: this.mapRouteToSnomed(data.medication.route),
                display: data.medication.route,
              },
            ],
          },
        },
      ],
      dispenseRequest: {
        quantity: {
          value: data.medication.quantity,
          unit: data.medication.quantityUnit,
        },
      },
      authoredOn: new Date().toISOString(),
    };

    if (data.encounterId) {
      const encounterFhir = await this.getFhirReference('consultation', data.encounterId);
      fhirMedicationRequest.encounter = {
        reference: `Encounter/${encounterFhir}`,
      };
    }

    return this.createResource(fhirMedicationRequest);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // API METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private async createResource(resource: FhirResource): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/${resource.resourceType}`, resource, {
          headers: {
            'Content-Type': 'application/fhir+json',
            Accept: 'application/fhir+json',
          },
        }),
      );

      const resourceId = response.data.id;
      this.logger.log(`Created FHIR ${resource.resourceType}: ${resourceId}`);
      return resourceId;
    } catch (error) {
      this.logger.error(`Failed to create FHIR resource: ${error.message}`);
      throw error;
    }
  }

  private async updateResource(
    resourceType: string,
    resourceId: string,
    resource: FhirResource,
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.put(
          `${this.baseUrl}/${resourceType}/${resourceId}`,
          resource,
          {
            headers: {
              'Content-Type': 'application/fhir+json',
              Accept: 'application/fhir+json',
            },
          },
        ),
      );

      this.logger.log(`Updated FHIR ${resourceType}: ${resourceId}`);
    } catch (error) {
      this.logger.error(`Failed to update FHIR resource: ${error.message}`);
      throw error;
    }
  }

  async getResource(resourceType: string, resourceId: string): Promise<FhirResource> {
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/${resourceType}/${resourceId}`, {
        headers: { Accept: 'application/fhir+json' },
      }),
    );

    return response.data;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  private async getFhirReference(localType: string, localId: string): Promise<string> {
    const fhirResource = await this.prisma.fhirResource.findFirst({
      where: { localType, localId },
    });

    if (!fhirResource) {
      throw new BadRequestException(`FHIR resource not found for ${localType}:${localId}`);
    }

    return fhirResource.resourceId;
  }

  private mapGenderToFhir(gender: string): 'male' | 'female' | 'other' | 'unknown' {
    const mapping: Record<string, any> = {
      MALE: 'male',
      FEMALE: 'female',
      OTHER: 'other',
      NOT_INFORMED: 'unknown',
    };
    return mapping[gender] || 'unknown';
  }

  private getEncounterClassDisplay(code: string): string {
    const displays: Record<string, string> = {
      AMB: 'ambulatory',
      VR: 'virtual',
      EMER: 'emergency',
    };
    return displays[code] || code;
  }

  private mapRouteToSnomed(route: string): string {
    const mapping: Record<string, string> = {
      oral: '26643006',
      intravenous: '47625008',
      intramuscular: '78421000',
      subcutaneous: '34206005',
      topical: '6064005',
      inhalation: '18679011000001101',
    };
    return mapping[route.toLowerCase()] || '26643006';
  }

  private buildFhirPatient(patient: any): FhirPatient {
    // Implementação igual a createPatientResource
    return {} as FhirPatient;
  }
}
```

---

### 9.2 RNDS SERVICE (Rede Nacional de Dados em Saúde)

#### PROMPT 9.2.1: Service de Integração RNDS
```typescript
CRIAR ARQUIVO: /healthflow/apps/api/src/modules/integrations/rnds/rnds.service.ts

import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import { PrismaService } from '@/database/prisma.service';
import { CacheService } from '@/common/services/cache.service';
import { AuditService } from '@/common/services/audit.service';
import { AuditAction } from '@prisma/client';

interface RndsToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface RndsCnes {
  cnes: string;
  nome: string;
  uf: string;
  municipio: string;
}

@Injectable()
export class RndsService {
  private readonly logger = new Logger(RndsService.name);
  private readonly baseUrl: string;
  private readonly authUrl: string;
  private readonly clientId: string;
  private readonly certificatePath: string;
  private readonly certificatePassword: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly auditService: AuditService,
  ) {
    // Configuração RNDS (Homologação ou Produção)
    const isProduction = this.configService.get('RNDS_ENVIRONMENT') === 'production';
    
    this.baseUrl = isProduction
      ? 'https://ehr-services.saude.gov.br/api'
      : 'https://ehr-services-hom.saude.gov.br/api';
    
    this.authUrl = isProduction
      ? 'https://ehr-auth.saude.gov.br/api/token'
      : 'https://ehr-auth-hom.saude.gov.br/api/token';

    this.clientId = this.configService.get('RNDS_CLIENT_ID');
    this.certificatePath = this.configService.get('RNDS_CERTIFICATE_PATH');
    this.certificatePassword = this.configService.get('RNDS_CERTIFICATE_PASSWORD');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTENTICAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════

  async getAccessToken(): Promise<string> {
    const cacheKey = 'rnds:access_token';
    
    // Verificar cache
    let token = await this.cacheService.get<string>(cacheKey);
    if (token) {
      return token;
    }

    // Gerar JWT assinado com certificado ICP-Brasil
    const assertion = this.generateAssertion();

    try {
      const response = await firstValueFrom(
        this.httpService.post<RndsToken>(
          this.authUrl,
          new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion,
          }).toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );

      token = response.data.access_token;
      
      // Cachear token (com margem de segurança de 60s)
      const ttl = response.data.expires_in - 60;
      await this.cacheService.set(cacheKey, token, ttl);

      return token;
    } catch (error) {
      this.logger.error(`Failed to get RNDS access token: ${error.message}`);
      throw new UnauthorizedException('Falha na autenticação RNDS');
    }
  }

  private generateAssertion(): string {
    const now = Math.floor(Date.now() / 1000);
    
    const payload = {
      iss: this.clientId,
      sub: this.clientId,
      aud: this.authUrl,
      jti: `${now}-${Math.random().toString(36).substring(7)}`,
      iat: now,
      exp: now + 300, // 5 minutos
    };

    // Ler certificado
    const certificate = fs.readFileSync(this.certificatePath);
    
    // Assinar com RS256
    return jwt.sign(payload, certificate, {
      algorithm: 'RS256',
      header: {
        alg: 'RS256',
        typ: 'JWT',
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSULTA DE PACIENTE (CNS)
  // ═══════════════════════════════════════════════════════════════════════════

  async searchPatientByCns(cns: string): Promise<any> {
    const token = await this.getAccessToken();

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/fhir/r4/Patient`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Authorization-Server': 'oauth.saude.gov.br',
            },
            params: {
              identifier: `http://rnds.saude.gov.br/fhir/r4/NamingSystem/cns|${cns}`,
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to search patient by CNS: ${error.message}`);
      throw error;
    }
  }

  async searchPatientByCpf(cpf: string): Promise<any> {
    const token = await this.getAccessToken();

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/fhir/r4/Patient`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Authorization-Server': 'oauth.saude.gov.br',
            },
            params: {
              identifier: `http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf|${cpf}`,
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to search patient by CPF: ${error.message}`);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ENVIO DE RESULTADOS
  // ═══════════════════════════════════════════════════════════════════════════

  async sendResultadoExame(
    patientCns: string,
    laboratorioCnes: string,
    resultado: any,
  ): Promise<string> {
    const token = await this.getAccessToken();

    const bundle = this.buildResultadoExameBundle(patientCns, laboratorioCnes, resultado);

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/fhir/r4/Bundle`,
          bundle,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Authorization-Server': 'oauth.saude.gov.br',
              'Content-Type': 'application/fhir+json',
            },
          },
        ),
      );

      const resourceId = response.data.id;

      await this.auditService.log({
        action: AuditAction.CREATE,
        resource: 'rnds_resultado_exame',
        resourceId,
        description: `Resultado de exame enviado à RNDS - Paciente CNS: ${patientCns}`,
      });

      return resourceId;
    } catch (error) {
      this.logger.error(`Failed to send exam result to RNDS: ${error.message}`);
      throw error;
    }
  }

  async sendRegistroAtendimento(
    consultationId: string,
    patientCns: string,
    estabelecimentoCnes: string,
    profissionalCns: string,
  ): Promise<string> {
    const token = await this.getAccessToken();

    // Buscar dados da consulta
    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
      include: {
        patient: true,
        doctor: true,
        clinic: true,
      },
    });

    const bundle = this.buildRegistroAtendimentoBundle(
      consultation,
      patientCns,
      estabelecimentoCnes,
      profissionalCns,
    );

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/fhir/r4/Bundle`,
          bundle,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Authorization-Server': 'oauth.saude.gov.br',
              'Content-Type': 'application/fhir+json',
            },
          },
        ),
      );

      const resourceId = response.data.id;

      await this.auditService.log({
        action: AuditAction.CREATE,
        resource: 'rnds_registro_atendimento',
        resourceId,
        description: `Registro de atendimento enviado à RNDS - Consulta: ${consultationId}`,
      });

      return resourceId;
    } catch (error) {
      this.logger.error(`Failed to send attendance record to RNDS: ${error.message}`);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSULTA DE ESTABELECIMENTOS
  // ═══════════════════════════════════════════════════════════════════════════

  async getEstabelecimentoByCnes(cnes: string): Promise<RndsCnes | null> {
    const token = await this.getAccessToken();

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/fhir/r4/Organization`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Authorization-Server': 'oauth.saude.gov.br',
            },
            params: {
              identifier: `http://rnds.saude.gov.br/fhir/r4/NamingSystem/cnes|${cnes}`,
            },
          },
        ),
      );

      if (response.data.entry?.length > 0) {
        const org = response.data.entry[0].resource;
        return {
          cnes,
          nome: org.name,
          uf: org.address?.[0]?.state,
          municipio: org.address?.[0]?.city,
        };
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to get establishment by CNES: ${error.message}`);
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BUNDLE BUILDERS
  // ═══════════════════════════════════════════════════════════════════════════

  private buildResultadoExameBundle(
    patientCns: string,
    laboratorioCnes: string,
    resultado: any,
  ): any {
    return {
      resourceType: 'Bundle',
      type: 'document',
      timestamp: new Date().toISOString(),
      meta: {
        lastUpdated: new Date().toISOString(),
      },
      identifier: {
        system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/BRRNDS-numero',
        value: `${laboratorioCnes}-${Date.now()}`,
      },
      entry: [
        {
          fullUrl: 'urn:uuid:composition-1',
          resource: {
            resourceType: 'Composition',
            meta: {
              profile: [
                'http://rnds.saude.gov.br/fhir/r4/StructureDefinition/BRResultadoExameLaboratorial-2.0',
              ],
            },
            status: 'final',
            type: {
              coding: [
                {
                  system: 'http://loinc.org',
                  code: '11502-2',
                  display: 'Laboratory report',
                },
              ],
            },
            subject: {
              identifier: {
                system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cns',
                value: patientCns,
              },
            },
            date: new Date().toISOString(),
            author: [
              {
                identifier: {
                  system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cnes',
                  value: laboratorioCnes,
                },
              },
            ],
            title: 'Resultado de Exame Laboratorial',
            section: [
              {
                entry: [
                  { reference: 'urn:uuid:observation-1' },
                ],
              },
            ],
          },
        },
        {
          fullUrl: 'urn:uuid:observation-1',
          resource: {
            resourceType: 'Observation',
            meta: {
              profile: [
                'http://rnds.saude.gov.br/fhir/r4/StructureDefinition/BRDiagnosticoLaboratorioClinico-1.0',
              ],
            },
            status: 'final',
            code: {
              coding: [
                {
                  system: 'http://loinc.org',
                  code: resultado.loincCode,
                  display: resultado.exameName,
                },
              ],
            },
            subject: {
              identifier: {
                system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cns',
                value: patientCns,
              },
            },
            effectiveDateTime: resultado.collectionDate || new Date().toISOString(),
            valueQuantity: resultado.numericValue
              ? {
                  value: resultado.numericValue,
                  unit: resultado.unit,
                  system: 'http://unitsofmeasure.org',
                  code: resultado.unitCode,
                }
              : undefined,
            valueString: resultado.textValue,
            interpretation: resultado.interpretation
              ? [
                  {
                    coding: [
                      {
                        system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                        code: resultado.interpretation,
                      },
                    ],
                  },
                ]
              : undefined,
          },
        },
      ],
    };
  }

  private buildRegistroAtendimentoBundle(
    consultation: any,
    patientCns: string,
    estabelecimentoCnes: string,
    profissionalCns: string,
  ): any {
    const assessment = consultation.assessment as any;
    const diagnoses = assessment?.diagnoses || [];

    return {
      resourceType: 'Bundle',
      type: 'document',
      timestamp: new Date().toISOString(),
      identifier: {
        system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/BRRNDS-numero',
        value: `${estabelecimentoCnes}-${consultation.consultationNumber}`,
      },
      entry: [
        {
          fullUrl: 'urn:uuid:composition-1',
          resource: {
            resourceType: 'Composition',
            meta: {
              profile: [
                'http://rnds.saude.gov.br/fhir/r4/StructureDefinition/BRRegistroAtendimentoClinico-1.0',
              ],
            },
            status: 'final',
            type: {
              coding: [
                {
                  system: 'http://loinc.org',
                  code: '34117-2',
                  display: 'History and physical note',
                },
              ],
            },
            subject: {
              identifier: {
                system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cns',
                value: patientCns,
              },
            },
            encounter: {
              reference: 'urn:uuid:encounter-1',
            },
            date: consultation.completedAt?.toISOString() || new Date().toISOString(),
            author: [
              {
                identifier: {
                  system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cns',
                  value: profissionalCns,
                },
              },
            ],
            title: 'Registro de Atendimento Clínico',
            section: diagnoses.map((d: any, i: number) => ({
              entry: [{ reference: `urn:uuid:condition-${i + 1}` }],
            })),
          },
        },
        {
          fullUrl: 'urn:uuid:encounter-1',
          resource: {
            resourceType: 'Encounter',
            meta: {
              profile: [
                'http://rnds.saude.gov.br/fhir/r4/StructureDefinition/BRContatoAssistencial-1.0',
              ],
            },
            status: 'finished',
            class: {
              system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
              code: consultation.isTelemedicine ? 'VR' : 'AMB',
            },
            subject: {
              identifier: {
                system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cns',
                value: patientCns,
              },
            },
            period: {
              start: consultation.startedAt?.toISOString(),
              end: consultation.completedAt?.toISOString(),
            },
            serviceProvider: {
              identifier: {
                system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cnes',
                value: estabelecimentoCnes,
              },
            },
          },
        },
        ...diagnoses.map((diagnosis: any, index: number) => ({
          fullUrl: `urn:uuid:condition-${index + 1}`,
          resource: {
            resourceType: 'Condition',
            meta: {
              profile: [
                'http://rnds.saude.gov.br/fhir/r4/StructureDefinition/BRDiagnostico-1.0',
              ],
            },
            clinicalStatus: {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
                  code: 'active',
                },
              ],
            },
            code: {
              coding: [
                {
                  system: 'http://hl7.org/fhir/sid/icd-10',
                  code: diagnosis.icd10Code,
                  display: diagnosis.description,
                },
              ],
            },
            subject: {
              identifier: {
                system: 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cns',
                value: patientCns,
              },
            },
            encounter: {
              reference: 'urn:uuid:encounter-1',
            },
          },
        })),
      ],
    };
  }
}
```

---

## FASE 10: ANALYTICS E BI [Dias 162-175]

### 10.1 ANALYTICS SERVICE

#### PROMPT 10.1.1: Service de Analytics e Métricas
```typescript
CRIAR ARQUIVO: /healthflow/apps/api/src/modules/analytics/analytics.service.ts

import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as dayjs from 'dayjs';
import { PrismaService } from '@/database/prisma.service';
import { CacheService } from '@/common/services/cache.service';
import {
  ClinicDashboardDto,
  PatientAnalyticsDto,
  FinancialReportDto,
  OperationalMetricsDto,
} from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly CACHE_PREFIX = 'analytics:';
  private readonly CACHE_TTL = 300; // 5 minutos

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // DASHBOARD DA CLÍNICA
  // ═══════════════════════════════════════════════════════════════════════════

  async getClinicDashboard(
    clinicId: string,
    period: { startDate: Date; endDate: Date },
  ): Promise<ClinicDashboardDto> {
    const cacheKey = `${this.CACHE_PREFIX}clinic:${clinicId}:${period.startDate.toISOString()}`;
    
    const cached = await this.cacheService.get<ClinicDashboardDto>(cacheKey);
    if (cached) return cached;

    const [
      appointmentMetrics,
      patientMetrics,
      revenueMetrics,
      topDoctors,
      appointmentsByDay,
      appointmentsByType,
    ] = await Promise.all([
      this.getAppointmentMetrics(clinicId, period),
      this.getPatientMetrics(clinicId, period),
      this.getRevenueMetrics(clinicId, period),
      this.getTopDoctors(clinicId, period),
      this.getAppointmentsByDay(clinicId, period),
      this.getAppointmentsByType(clinicId, period),
    ]);

    const dashboard: ClinicDashboardDto = {
      period: {
        startDate: period.startDate,
        endDate: period.endDate,
      },
      appointments: appointmentMetrics,
      patients: patientMetrics,
      revenue: revenueMetrics,
      topDoctors,
      charts: {
        appointmentsByDay,
        appointmentsByType,
      },
      generatedAt: new Date(),
    };

    await this.cacheService.set(cacheKey, dashboard, this.CACHE_TTL);

    return dashboard;
  }

  private async getAppointmentMetrics(
    clinicId: string,
    period: { startDate: Date; endDate: Date },
  ): Promise<any> {
    const [total, completed, cancelled, noShow, telemedicine] = await Promise.all([
      this.prisma.appointment.count({
        where: {
          clinicId,
          scheduledDate: { gte: period.startDate, lte: period.endDate },
        },
      }),
      this.prisma.appointment.count({
        where: {
          clinicId,
          scheduledDate: { gte: period.startDate, lte: period.endDate },
          status: 'COMPLETED',
        },
      }),
      this.prisma.appointment.count({
        where: {
          clinicId,
          scheduledDate: { gte: period.startDate, lte: period.endDate },
          status: 'CANCELLED',
        },
      }),
      this.prisma.appointment.count({
        where: {
          clinicId,
          scheduledDate: { gte: period.startDate, lte: period.endDate },
          status: 'NO_SHOW',
        },
      }),
      this.prisma.appointment.count({
        where: {
          clinicId,
          scheduledDate: { gte: period.startDate, lte: period.endDate },
          isTelemedicine: true,
        },
      }),
    ]);

    // Comparar com período anterior
    const previousPeriod = this.getPreviousPeriod(period);
    const previousTotal = await this.prisma.appointment.count({
      where: {
        clinicId,
        scheduledDate: { gte: previousPeriod.startDate, lte: previousPeriod.endDate },
      },
    });

    return {
      total,
      completed,
      cancelled,
      noShow,
      telemedicine,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      cancellationRate: total > 0 ? (cancelled / total) * 100 : 0,
      noShowRate: total > 0 ? (noShow / total) * 100 : 0,
      telemedicineRate: total > 0 ? (telemedicine / total) * 100 : 0,
      growth: previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0,
    };
  }

  private async getPatientMetrics(
    clinicId: string,
    period: { startDate: Date; endDate: Date },
  ): Promise<any> {
    const [newPatients, activePatients, totalPatients] = await Promise.all([
      this.prisma.clinicPatient.count({
        where: {
          clinicId,
          createdAt: { gte: period.startDate, lte: period.endDate },
        },
      }),
      this.prisma.appointment.groupBy({
        by: ['patientId'],
        where: {
          clinicId,
          scheduledDate: { gte: period.startDate, lte: period.endDate },
          status: 'COMPLETED',
        },
      }).then((r) => r.length),
      this.prisma.clinicPatient.count({
        where: { clinicId },
      }),
    ]);

    // Média de consultas por paciente
    const avgAppointmentsPerPatient = activePatients > 0
      ? await this.prisma.appointment.count({
          where: {
            clinicId,
            scheduledDate: { gte: period.startDate, lte: period.endDate },
            status: 'COMPLETED',
          },
        }).then((count) => count / activePatients)
      : 0;

    // Retenção (pacientes que voltaram no período)
    const returningPatients = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(DISTINCT p."patientId") as count
      FROM "Appointment" p
      WHERE p."clinicId" = ${clinicId}
        AND p."scheduledDate" >= ${period.startDate}
        AND p."scheduledDate" <= ${period.endDate}
        AND p.status = 'COMPLETED'
        AND EXISTS (
          SELECT 1 FROM "Appointment" prev
          WHERE prev."patientId" = p."patientId"
            AND prev."clinicId" = ${clinicId}
            AND prev."scheduledDate" < ${period.startDate}
            AND prev.status = 'COMPLETED'
        )
    `;

    const retentionRate = activePatients > 0
      ? (Number(returningPatients[0].count) / activePatients) * 100
      : 0;

    return {
      newPatients,
      activePatients,
      totalPatients,
      avgAppointmentsPerPatient: Math.round(avgAppointmentsPerPatient * 10) / 10,
      retentionRate: Math.round(retentionRate * 10) / 10,
    };
  }

  private async getRevenueMetrics(
    clinicId: string,
    period: { startDate: Date; endDate: Date },
  ): Promise<any> {
    // Faturamento de consultas
    const consultationRevenue = await this.prisma.invoice.aggregate({
      where: {
        clinicId,
        createdAt: { gte: period.startDate, lte: period.endDate },
        status: 'PAID',
      },
      _sum: { amount: true },
    });

    // Faturamento período anterior
    const previousPeriod = this.getPreviousPeriod(period);
    const previousRevenue = await this.prisma.invoice.aggregate({
      where: {
        clinicId,
        createdAt: { gte: previousPeriod.startDate, lte: previousPeriod.endDate },
        status: 'PAID',
      },
      _sum: { amount: true },
    });

    const currentRevenue = consultationRevenue._sum.amount || 0;
    const prevRevenue = previousRevenue._sum.amount || 0;

    // Ticket médio
    const totalPaidInvoices = await this.prisma.invoice.count({
      where: {
        clinicId,
        createdAt: { gte: period.startDate, lte: period.endDate },
        status: 'PAID',
      },
    });

    return {
      total: currentRevenue,
      growth: prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0,
      averageTicket: totalPaidInvoices > 0 ? currentRevenue / totalPaidInvoices : 0,
      previousPeriod: prevRevenue,
    };
  }

  private async getTopDoctors(
    clinicId: string,
    period: { startDate: Date; endDate: Date },
  ): Promise<any[]> {
    const topDoctors = await this.prisma.appointment.groupBy({
      by: ['doctorId'],
      where: {
        clinicId,
        scheduledDate: { gte: period.startDate, lte: period.endDate },
        status: 'COMPLETED',
      },
      _count: { _all: true },
      orderBy: { _count: { doctorId: 'desc' } },
      take: 5,
    });

    const doctorIds = topDoctors.map((d) => d.doctorId);
    const doctors = await this.prisma.doctor.findMany({
      where: { id: { in: doctorIds } },
      select: { id: true, fullName: true, specialties: true, profilePhotoUrl: true },
    });

    return topDoctors.map((item) => {
      const doctor = doctors.find((d) => d.id === item.doctorId);
      return {
        doctor: {
          id: doctor?.id,
          name: doctor?.fullName,
          specialty: doctor?.specialties?.[0],
          photoUrl: doctor?.profilePhotoUrl,
        },
        appointments: item._count._all,
      };
    });
  }

  private async getAppointmentsByDay(
    clinicId: string,
    period: { startDate: Date; endDate: Date },
  ): Promise<any[]> {
    const appointments = await this.prisma.appointment.groupBy({
      by: ['scheduledDate'],
      where: {
        clinicId,
        scheduledDate: { gte: period.startDate, lte: period.endDate },
      },
      _count: { _all: true },
      orderBy: { scheduledDate: 'asc' },
    });

    return appointments.map((item) => ({
      date: dayjs(item.scheduledDate).format('YYYY-MM-DD'),
      count: item._count._all,
    }));
  }

  private async getAppointmentsByType(
    clinicId: string,
    period: { startDate: Date; endDate: Date },
  ): Promise<any[]> {
    const byType = await this.prisma.appointment.groupBy({
      by: ['type'],
      where: {
        clinicId,
        scheduledDate: { gte: period.startDate, lte: period.endDate },
      },
      _count: { _all: true },
    });

    return byType.map((item) => ({
      type: item.type,
      count: item._count._all,
    }));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYTICS DO PACIENTE
  // ═══════════════════════════════════════════════════════════════════════════

  async getPatientAnalytics(patientId: string): Promise<PatientAnalyticsDto> {
    const [
      healthMetrics,
      adherenceMetrics,
      gamificationStats,
      consultationHistory,
    ] = await Promise.all([
      this.getHealthMetrics(patientId),
      this.getAdherenceMetrics(patientId),
      this.getGamificationStats(patientId),
      this.getConsultationHistory(patientId),
    ]);

    return {
      health: healthMetrics,
      adherence: adherenceMetrics,
      gamification: gamificationStats,
      consultations: consultationHistory,
      generatedAt: new Date(),
    };
  }

  private async getHealthMetrics(patientId: string): Promise<any> {
    // Últimos sinais vitais
    const latestVitals = await this.prisma.vitalSign.findFirst({
      where: { patientId },
      orderBy: { measuredAt: 'desc' },
    });

    // Histórico de peso (últimos 6 meses)
    const weightHistory = await this.prisma.vitalSign.findMany({
      where: {
        patientId,
        weight: { not: null },
        measuredAt: { gte: dayjs().subtract(6, 'month').toDate() },
      },
      select: { weight: true, measuredAt: true },
      orderBy: { measuredAt: 'asc' },
    });

    // Histórico de PA (últimos 3 meses)
    const bpHistory = await this.prisma.vitalSign.findMany({
      where: {
        patientId,
        systolicBp: { not: null },
        measuredAt: { gte: dayjs().subtract(3, 'month').toDate() },
      },
      select: { systolicBp: true, diastolicBp: true, measuredAt: true },
      orderBy: { measuredAt: 'asc' },
    });

    // Calcular tendências
    let weightTrend = 'stable';
    if (weightHistory.length >= 2) {
      const first = weightHistory[0].weight;
      const last = weightHistory[weightHistory.length - 1].weight;
      const diff = last - first;
      if (diff > 2) weightTrend = 'increasing';
      else if (diff < -2) weightTrend = 'decreasing';
    }

    return {
      latestVitals: latestVitals
        ? {
            bloodPressure: latestVitals.systolicBp
              ? `${latestVitals.systolicBp}/${latestVitals.diastolicBp}`
              : null,
            heartRate: latestVitals.heartRate,
            weight: latestVitals.weight,
            measuredAt: latestVitals.measuredAt,
          }
        : null,
      weightHistory: weightHistory.map((w) => ({
        date: w.measuredAt,
        value: w.weight,
      })),
      bpHistory: bpHistory.map((bp) => ({
        date: bp.measuredAt,
        systolic: bp.systolicBp,
        diastolic: bp.diastolicBp,
      })),
      trends: {
        weight: weightTrend,
      },
    };
  }

  private async getAdherenceMetrics(patientId: string): Promise<any> {
    // Tarefas completadas vs total (últimos 30 dias)
    const thirtyDaysAgo = dayjs().subtract(30, 'day').toDate();

    const [totalTasks, completedTasks] = await Promise.all([
      this.prisma.task.count({
        where: {
          patientId,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.task.count({
        where: {
          patientId,
          createdAt: { gte: thirtyDaysAgo },
          status: 'COMPLETED',
        },
      }),
    ]);

    // Medicamentos tomados
    const medicationTasks = await this.prisma.task.count({
      where: {
        patientId,
        type: 'MEDICATION',
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    const completedMedicationTasks = await this.prisma.task.count({
      where: {
        patientId,
        type: 'MEDICATION',
        status: 'COMPLETED',
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Taxa de comparecimento em consultas
    const [totalAppointments, attendedAppointments] = await Promise.all([
      this.prisma.appointment.count({
        where: {
          patientId,
          scheduledDate: { gte: thirtyDaysAgo },
          status: { in: ['COMPLETED', 'NO_SHOW'] },
        },
      }),
      this.prisma.appointment.count({
        where: {
          patientId,
          scheduledDate: { gte: thirtyDaysAgo },
          status: 'COMPLETED',
        },
      }),
    ]);

    return {
      overall: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      medication: medicationTasks > 0 ? (completedMedicationTasks / medicationTasks) * 100 : 0,
      appointments: totalAppointments > 0 ? (attendedAppointments / totalAppointments) * 100 : 0,
      period: '30 days',
    };
  }

  private async getGamificationStats(patientId: string): Promise<any> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        totalPoints: true,
        level: true,
        levelName: true,
        currentStreak: true,
        longestStreak: true,
        _count: {
          select: {
            badges: true,
            rewards: true,
          },
        },
      },
    });

    // Ranking na clínica principal
    const clinicPatient = await this.prisma.clinicPatient.findFirst({
      where: { patientId },
      select: { clinicId: true },
    });

    let rank = null;
    if (clinicPatient) {
      const patientsAbove = await this.prisma.patient.count({
        where: {
          clinicPatients: { some: { clinicId: clinicPatient.clinicId } },
          totalPoints: { gt: patient.totalPoints },
        },
      });
      rank = patientsAbove + 1;
    }

    return {
      points: patient.totalPoints,
      level: patient.level,
      levelName: patient.levelName,
      currentStreak: patient.currentStreak,
      longestStreak: patient.longestStreak,
      badgesEarned: patient._count.badges,
      rewardsRedeemed: patient._count.rewards,
      clinicRank: rank,
    };
  }

  private async getConsultationHistory(patientId: string): Promise<any> {
    const consultations = await this.prisma.consultation.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        consultationNumber: true,
        status: true,
        createdAt: true,
        completedAt: true,
        doctor: {
          select: { fullName: true, specialties: true },
        },
        clinic: {
          select: { tradeName: true },
        },
      },
    });

    const totalConsultations = await this.prisma.consultation.count({
      where: { patientId },
    });

    // Especialidades mais visitadas
    const specialtyStats = await this.prisma.consultation.groupBy({
      by: ['doctorId'],
      where: { patientId },
      _count: { _all: true },
    });

    return {
      recent: consultations,
      total: totalConsultations,
      bySpecialty: specialtyStats,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RELATÓRIOS OPERACIONAIS
  // ═══════════════════════════════════════════════════════════════════════════

  async getOperationalMetrics(
    clinicId: string,
    date: Date,
  ): Promise<OperationalMetricsDto> {
    const startOfDay = dayjs(date).startOf('day').toDate();
    const endOfDay = dayjs(date).endOf('day').toDate();

    // Tempo médio de espera
    const waitTimeData = await this.prisma.appointment.findMany({
      where: {
        clinicId,
        scheduledDate: { gte: startOfDay, lte: endOfDay },
        checkedInAt: { not: null },
        startedAt: { not: null },
      },
      select: {
        checkedInAt: true,
        startedAt: true,
      },
    });

    const avgWaitTime = waitTimeData.length > 0
      ? waitTimeData.reduce((sum, apt) => {
          return sum + (apt.startedAt.getTime() - apt.checkedInAt.getTime());
        }, 0) / waitTimeData.length / 60000 // minutos
      : 0;

    // Duração média das consultas
    const durationData = await this.prisma.consultation.findMany({
      where: {
        clinicId,
        createdAt: { gte: startOfDay, lte: endOfDay },
        status: 'COMPLETED',
        startedAt: { not: null },
        completedAt: { not: null },
      },
      select: {
        startedAt: true,
        completedAt: true,
      },
    });

    const avgDuration = durationData.length > 0
      ? durationData.reduce((sum, con) => {
          return sum + (con.completedAt.getTime() - con.startedAt.getTime());
        }, 0) / durationData.length / 60000
      : 0;

    // Taxa de ocupação por sala
    const rooms = await this.prisma.room.findMany({
      where: { clinicId },
      select: { id: true, name: true },
    });

    const roomOccupancy = await Promise.all(
      rooms.map(async (room) => {
        const appointments = await this.prisma.appointment.count({
          where: {
            roomId: room.id,
            scheduledDate: { gte: startOfDay, lte: endOfDay },
            status: { in: ['COMPLETED', 'IN_PROGRESS'] },
          },
        });

        // Assumindo 8h de operação, slots de 30min = 16 slots
        const totalSlots = 16;
        return {
          room: room.name,
          occupancy: (appointments / totalSlots) * 100,
          appointments,
        };
      }),
    );

    return {
      date,
      avgWaitTime: Math.round(avgWaitTime),
      avgConsultationDuration: Math.round(avgDuration),
      roomOccupancy,
      peakHours: await this.getPeakHours(clinicId, startOfDay, endOfDay),
    };
  }

  private async getPeakHours(
    clinicId: string,
    startOfDay: Date,
    endOfDay: Date,
  ): Promise<any[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        clinicId,
        scheduledDate: { gte: startOfDay, lte: endOfDay },
      },
      select: { scheduledTime: true },
    });

    const hourCounts: Record<number, number> = {};
    appointments.forEach((apt) => {
      const hour = apt.scheduledTime.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // JOBS AGENDADOS
  // ═══════════════════════════════════════════════════════════════════════════

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async generateDailyReports(): Promise<void> {
    this.logger.log('Generating daily reports...');

    const clinics = await this.prisma.clinic.findMany({
      where: { active: true },
      select: { id: true },
    });

    const yesterday = dayjs().subtract(1, 'day');
    const period = {
      startDate: yesterday.startOf('day').toDate(),
      endDate: yesterday.endOf('day').toDate(),
    };

    for (const clinic of clinics) {
      try {
        const dashboard = await this.getClinicDashboard(clinic.id, period);
        
        // Salvar snapshot diário
        await this.prisma.analyticsSnapshot.create({
          data: {
            clinicId: clinic.id,
            type: 'DAILY',
            date: yesterday.toDate(),
            data: dashboard as any,
          },
        });
      } catch (error) {
        this.logger.error(`Failed to generate report for clinic ${clinic.id}: ${error.message}`);
      }
    }

    this.logger.log('Daily reports generated');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  private getPreviousPeriod(period: { startDate: Date; endDate: Date }): { startDate: Date; endDate: Date } {
    const duration = period.endDate.getTime() - period.startDate.getTime();
    return {
      startDate: new Date(period.startDate.getTime() - duration),
      endDate: new Date(period.startDate.getTime() - 1),
    };
  }
}
```

#### CHECKPOINT 10.1.1:
```
VALIDAÇÃO OBRIGATÓRIA:
[ ] Service criado sem erros?
[ ] Dashboard da clínica completo?
[ ] Analytics do paciente?
[ ] Métricas operacionais?
[ ] Relatórios automáticos?
[ ] Cache implementado?
[ ] Tendências e comparações?

EXECUTAR:
npm run lint
npm run build

SE TUDO PASSAR → PROSSEGUIR PARA FRONTEND
```

---

## CICLO DE VALIDAÇÃO DAS FASES 8-10

```
╔══════════════════════════════════════════════════════════════════════════════╗
║              VALIDAÇÃO COMPLETA - FASES 8, 9 E 10                           ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  FASE 8 - NOTIFICAÇÕES MULTI-CANAL                                          ║
║  □ Push notifications (Firebase FCM)                                         ║
║  □ Email (SendGrid com templates)                                            ║
║  □ SMS (Twilio)                                                              ║
║  □ WhatsApp Business API                                                     ║
║  □ Preferências do usuário                                                   ║
║  □ Horário de silêncio                                                       ║
║  □ Fila de processamento assíncrono                                          ║
║                                                                              ║
║  FASE 9 - INTEGRAÇÕES SAÚDE                                                  ║
║  □ FHIR R4 (Patient, Encounter, Condition, Observation, MedicationRequest)   ║
║  □ RNDS (Rede Nacional de Dados em Saúde)                                    ║
║  □ Autenticação com certificado ICP-Brasil                                   ║
║  □ Envio de resultados de exames                                             ║
║  □ Registro de atendimento clínico                                           ║
║                                                                              ║
║  FASE 10 - ANALYTICS E BI                                                    ║
║  □ Dashboard da clínica                                                      ║
║  □ Analytics do paciente                                                     ║
║  □ Métricas operacionais                                                     ║
║  □ Relatórios automáticos                                                    ║
║  □ Comparações período anterior                                              ║
║  □ Cache de resultados                                                       ║
║                                                                              ║
║  SEQUÊNCIA DE VALIDAÇÃO:                                                     ║
║  1. npm run lint                                                             ║
║  2. npm run build                                                            ║
║  3. npm run test -- --coverage                                               ║
║  4. Testar integração FHIR com servidor de teste                             ║
║  5. Testar envio de notificações                                             ║
║                                                                              ║
║  SE TUDO OK → COMMIT E AVANÇAR PARA FRONTEND                                ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

**CONTINUA NA PARTE 6:**
- Fase 11: Frontend Web (React + TypeScript)
- Fase 12: Mobile App (React Native + Expo)
- Fase 13: Infraestrutura e DevOps
- Fase 14: Testes E2E
- Fase 15: Deploy Production
