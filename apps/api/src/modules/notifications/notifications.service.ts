import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/database/prisma.service';
import { CacheService } from '@/common/services/cache.service';
import { AuditService } from '@/common/services/audit.service';

import {
  CreateNotificationDto,
  SendSingleNotificationDto,
  SendBulkNotificationDto,
  MarkNotificationReadDto,
  CreateScheduledNotificationDto,
  UpdateScheduledNotificationDto,
  CreateNotificationTemplateDto,
  UpdateNotificationTemplateDto,
  TestTemplateDto,
  UpdateNotificationPreferencesDto,
  RegisterDeviceTokenDto,
  UnregisterDeviceTokenDto,
  EmailWebhookDto,
  SmsWebhookDto,
  NotificationChannel,
  NotificationType,
  NotificationStatus,
  NotificationPriority,
  ScheduleType,
} from './dto/create-notification.dto';

import {
  NotificationQueryDto,
  UserNotificationsQueryDto,
  NotificationHistoryQueryDto,
  TemplateQueryDto,
  ScheduledNotificationQueryDto,
  DeviceTokenQueryDto,
  NotificationStatisticsQueryDto,
  DeliveryReportQueryDto,
  NotificationDashboardQueryDto,
} from './dto/notification-query.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ==================== Notification Methods ====================

  async createNotification(dto: CreateNotificationDto, createdBy: string) {
    const notifications = [];

    for (const recipient of dto.recipients) {
      // Get user preferences
      const preferences = await this.getUserPreferences(recipient.userId);

      // Filter channels based on preferences
      const allowedChannels = this.filterChannelsByPreferences(
        dto.channels,
        dto.type,
        preferences,
      );

      if (allowedChannels.length === 0) {
        continue; // Skip if user has disabled all channels for this type
      }

      // Get user contact info
      const user = await this.prisma.user.findUnique({
        where: { id: recipient.userId },
      });

      if (!user) continue;

      // Get template if specified
      let template = null;
      if (dto.templateId) {
        template = await this.prisma.notificationTemplate.findUnique({
          where: { id: dto.templateId },
        });
      }

      // Create notification for each channel
      for (const channel of allowedChannels) {
        const { title, message } = this.resolveContent(
          dto,
          template,
          channel,
          { ...dto.templateVariables, ...recipient.variables },
        );

        const notification = await this.prisma.notification.create({
          data: {
            userId: recipient.userId,
            type: dto.type,
            channel,
            status:
              dto.scheduleType === ScheduleType.SCHEDULED
                ? NotificationStatus.PENDING
                : NotificationStatus.QUEUED,
            priority: dto.priority || NotificationPriority.NORMAL,
            title,
            message,
            templateId: dto.templateId,
            templateVariables: { ...dto.templateVariables, ...recipient.variables } as any,
            relatedEntityId: dto.relatedEntityId,
            relatedEntityType: dto.relatedEntityType,
            actionUrl: dto.actionUrl,
            actionText: dto.actionText,
            imageUrl: dto.imageUrl,
            scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
            metadata: dto.metadata as any,
            ttl: dto.ttl,
            recipientEmail: recipient.email || user.email,
            recipientPhone: recipient.phone || user.phone,
            createdBy,
          },
        });

        notifications.push(notification);

        // Queue for sending if immediate
        if (dto.scheduleType !== ScheduleType.SCHEDULED) {
          this.eventEmitter.emit('notification.queue', { notification });
        }
      }
    }

    return {
      success: true,
      notificationsCreated: notifications.length,
      notifications: notifications.map((n) => this.formatNotificationResponse(n)),
    };
  }

  async sendSingleNotification(dto: SendSingleNotificationDto, sentBy: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Get preferences
    const preferences = await this.getUserPreferences(dto.userId);

    // Determine channels
    let channels = dto.channels || [NotificationChannel.IN_APP, NotificationChannel.PUSH];
    channels = this.filterChannelsByPreferences(channels, dto.type, preferences);

    if (channels.length === 0) {
      return {
        success: false,
        reason: 'User has disabled notifications for this type',
      };
    }

    // Get template
    let template = null;
    if (dto.templateId) {
      template = await this.prisma.notificationTemplate.findUnique({
        where: { id: dto.templateId },
      });
    }

    const results = [];

    for (const channel of channels) {
      const { title, message } = this.resolveContent(
        dto,
        template,
        channel,
        dto.variables,
      );

      const notification = await this.prisma.notification.create({
        data: {
          userId: dto.userId,
          type: dto.type,
          channel,
          status: NotificationStatus.QUEUED,
          priority: NotificationPriority.NORMAL,
          title,
          message,
          templateId: dto.templateId,
          templateVariables: dto.variables as any,
          relatedEntityId: dto.relatedEntityId,
          relatedEntityType: dto.relatedEntityType,
          recipientEmail: user.email,
          recipientPhone: user.phone,
          createdBy: sentBy,
        },
      });

      results.push(notification);

      // Queue for sending
      this.eventEmitter.emit('notification.queue', { notification });
    }

    return {
      success: true,
      channels: results.map((r) => r.channel),
      notificationIds: results.map((r) => r.id),
    };
  }

  async sendBulkNotification(dto: SendBulkNotificationDto, sentBy: string) {
    let userIds = dto.userIds || [];

    // If using audience filters, find matching users
    if (dto.audienceFilters && !dto.userIds?.length) {
      userIds = await this.findUsersByFilters(dto.audienceFilters);
    }

    if (userIds.length === 0) {
      throw new BadRequestException('Nenhum usuário encontrado para o envio');
    }

    // Create batch
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get template
    let template = null;
    if (dto.templateId) {
      template = await this.prisma.notificationTemplate.findUnique({
        where: { id: dto.templateId },
      });
    }

    let queuedCount = 0;
    const failedUsers: string[] = [];

    for (const userId of userIds) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          failedUsers.push(userId);
          continue;
        }

        const preferences = await this.getUserPreferences(userId);
        const channels = this.filterChannelsByPreferences(
          dto.channels,
          dto.type,
          preferences,
        );

        for (const channel of channels) {
          const { title, message } = this.resolveContent(
            dto,
            template,
            channel,
            dto.templateVariables,
          );

          const notification = await this.prisma.notification.create({
            data: {
              userId,
              type: dto.type,
              channel,
              status:
                dto.scheduleType === ScheduleType.SCHEDULED
                  ? NotificationStatus.PENDING
                  : NotificationStatus.QUEUED,
              priority: dto.priority || NotificationPriority.NORMAL,
              title,
              message,
              templateId: dto.templateId,
              templateVariables: dto.templateVariables as any,
              batchId,
              scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
              recipientEmail: user.email,
              recipientPhone: user.phone,
              createdBy: sentBy,
            },
          });

          if (dto.scheduleType !== ScheduleType.SCHEDULED) {
            this.eventEmitter.emit('notification.queue', { notification });
          }

          queuedCount++;
        }
      } catch (error) {
        failedUsers.push(userId);
      }
    }

    await this.auditService.log({
      action: 'BULK_NOTIFICATION_SENT',
      entityType: 'NotificationBatch',
      entityId: batchId,
      userId: sentBy,
      details: {
        totalRecipients: userIds.length,
        queued: queuedCount,
        failed: failedUsers.length,
      },
    });

    return {
      batchId,
      totalRecipients: userIds.length,
      queued: queuedCount,
      failed: failedUsers.length,
      failedUsers: failedUsers.slice(0, 10), // Return first 10 failed
      channels: dto.channels,
      type: dto.type,
      status: dto.scheduleType === ScheduleType.SCHEDULED ? 'scheduled' : 'queued',
      scheduledAt: dto.scheduledAt,
    };
  }

  async getUserNotifications(userId: string, query: UserNotificationsQueryDto) {
    const { page = 1, limit = 20, type, channel, unreadOnly, dateFrom, dateTo } = query;

    const where: any = {
      userId,
      channel: NotificationChannel.IN_APP,
    };

    if (type) where.type = type;
    if (channel) where.channel = channel;
    if (unreadOnly) where.readAt = null;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { ...where, readAt: null },
      }),
    ]);

    return {
      data: notifications.map((n) => this.formatInAppNotification(n)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        channel: NotificationChannel.IN_APP,
        readAt: null,
      },
    });

    return { unreadCount: count };
  }

  async markAsRead(userId: string, dto: MarkNotificationReadDto) {
    const result = await this.prisma.notification.updateMany({
      where: {
        id: { in: dto.notificationIds },
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
        status: NotificationStatus.READ,
      },
    });

    return {
      success: true,
      markedAsRead: result.count,
    };
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        channel: NotificationChannel.IN_APP,
        readAt: null,
      },
      data: {
        readAt: new Date(),
        status: NotificationStatus.READ,
      },
    });

    return {
      success: true,
      markedAsRead: result.count,
    };
  }

  async findAllNotifications(query: NotificationQueryDto) {
    const {
      page = 1,
      limit = 20,
      userId,
      type,
      types,
      channel,
      status,
      statuses,
      priority,
      unreadOnly,
      createdFrom,
      createdTo,
      relatedEntityId,
      relatedEntityType,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: any = {};

    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (types?.length) where.type = { in: types };
    if (channel) where.channel = channel;
    if (status) where.status = status;
    if (statuses?.length) where.status = { in: statuses };
    if (priority) where.priority = priority;
    if (unreadOnly) where.readAt = null;
    if (relatedEntityId) where.relatedEntityId = relatedEntityId;
    if (relatedEntityType) where.relatedEntityType = relatedEntityType;

    if (createdFrom || createdTo) {
      where.createdAt = {};
      if (createdFrom) where.createdAt.gte = new Date(createdFrom);
      if (createdTo) where.createdAt.lte = new Date(createdTo);
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: notifications.map((n) => this.formatNotificationResponse(n)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ==================== Scheduled Notification Methods ====================

  async createScheduledNotification(dto: CreateScheduledNotificationDto, createdBy: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const scheduledNotification = await this.prisma.scheduledNotification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        channels: dto.channels,
        templateId: dto.templateId,
        title: dto.title,
        message: dto.message,
        variables: dto.variables as any,
        startDate: new Date(dto.startDate),
        nextRunAt: new Date(dto.startDate),
        recurrence: dto.recurrence as any,
        relatedEntityId: dto.relatedEntityId,
        relatedEntityType: dto.relatedEntityType,
        isActive: dto.isActive ?? true,
        createdBy,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await this.auditService.log({
      action: 'SCHEDULED_NOTIFICATION_CREATED',
      entityType: 'ScheduledNotification',
      entityId: scheduledNotification.id,
      userId: createdBy,
      details: { type: dto.type, startDate: dto.startDate },
    });

    return this.formatScheduledNotificationResponse(scheduledNotification);
  }

  async updateScheduledNotification(
    id: string,
    dto: UpdateScheduledNotificationDto,
    updatedBy: string,
  ) {
    const scheduled = await this.prisma.scheduledNotification.findUnique({
      where: { id },
    });

    if (!scheduled) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    const updated = await this.prisma.scheduledNotification.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        recurrence: dto.recurrence as any,
        nextRunAt: dto.startDate ? new Date(dto.startDate) : undefined,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await this.auditService.log({
      action: 'SCHEDULED_NOTIFICATION_UPDATED',
      entityType: 'ScheduledNotification',
      entityId: id,
      userId: updatedBy,
      details: dto,
    });

    return this.formatScheduledNotificationResponse(updated);
  }

  async deleteScheduledNotification(id: string, deletedBy: string) {
    const scheduled = await this.prisma.scheduledNotification.findUnique({
      where: { id },
    });

    if (!scheduled) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    await this.prisma.scheduledNotification.delete({
      where: { id },
    });

    await this.auditService.log({
      action: 'SCHEDULED_NOTIFICATION_DELETED',
      entityType: 'ScheduledNotification',
      entityId: id,
      userId: deletedBy,
    });

    return { success: true };
  }

  async findAllScheduledNotifications(query: ScheduledNotificationQueryDto) {
    const {
      page = 1,
      limit = 20,
      userId,
      type,
      activeOnly,
      scheduledFrom,
      scheduledTo,
      recurringOnly,
      relatedEntityId,
      sortBy = 'nextRunAt',
      sortOrder = 'asc',
    } = query;

    const where: any = {};

    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (activeOnly) where.isActive = true;
    if (recurringOnly) where.recurrence = { not: null };
    if (relatedEntityId) where.relatedEntityId = relatedEntityId;

    if (scheduledFrom || scheduledTo) {
      where.nextRunAt = {};
      if (scheduledFrom) where.nextRunAt.gte = new Date(scheduledFrom);
      if (scheduledTo) where.nextRunAt.lte = new Date(scheduledTo);
    }

    const [notifications, total] = await Promise.all([
      this.prisma.scheduledNotification.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.scheduledNotification.count({ where }),
    ]);

    return {
      data: notifications.map((n) => this.formatScheduledNotificationResponse(n)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ==================== Template Methods ====================

  async createTemplate(dto: CreateNotificationTemplateDto, createdBy: string) {
    // Check for duplicate code
    const existing = await this.prisma.notificationTemplate.findFirst({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException('Template com este código já existe');
    }

    const template = await this.prisma.notificationTemplate.create({
      data: {
        ...dto,
        isActive: dto.isActive ?? true,
        usageCount: 0,
        createdBy,
      },
    });

    await this.auditService.log({
      action: 'NOTIFICATION_TEMPLATE_CREATED',
      entityType: 'NotificationTemplate',
      entityId: template.id,
      userId: createdBy,
      details: { code: dto.code, category: dto.category },
    });

    return this.formatTemplateResponse(template);
  }

  async updateTemplate(id: string, dto: UpdateNotificationTemplateDto, updatedBy: string) {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template não encontrado');
    }

    const updated = await this.prisma.notificationTemplate.update({
      where: { id },
      data: dto,
    });

    await this.auditService.log({
      action: 'NOTIFICATION_TEMPLATE_UPDATED',
      entityType: 'NotificationTemplate',
      entityId: id,
      userId: updatedBy,
      details: dto,
    });

    return this.formatTemplateResponse(updated);
  }

  async deleteTemplate(id: string, deletedBy: string) {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template não encontrado');
    }

    await this.prisma.notificationTemplate.delete({
      where: { id },
    });

    await this.auditService.log({
      action: 'NOTIFICATION_TEMPLATE_DELETED',
      entityType: 'NotificationTemplate',
      entityId: id,
      userId: deletedBy,
    });

    return { success: true };
  }

  async findAllTemplates(query: TemplateQueryDto) {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      notificationType,
      channel,
      activeOnly,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: any = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) where.category = category;
    if (notificationType) where.notificationType = notificationType;
    if (channel) where.supportedChannels = { has: channel };
    if (activeOnly) where.isActive = true;

    const [templates, total] = await Promise.all([
      this.prisma.notificationTemplate.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.notificationTemplate.count({ where }),
    ]);

    return {
      data: templates.map((t) => this.formatTemplateResponse(t)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findTemplateByCode(code: string) {
    const template = await this.prisma.notificationTemplate.findFirst({
      where: { code, isActive: true },
    });

    if (!template) {
      throw new NotFoundException('Template não encontrado');
    }

    return this.formatTemplateResponse(template);
  }

  async testTemplate(dto: TestTemplateDto, testedBy: string) {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { id: dto.templateId },
    });

    if (!template) {
      throw new NotFoundException('Template não encontrado');
    }

    const { title, message } = this.resolveContent(
      { title: '', message: '' },
      template,
      dto.channel,
      dto.variables || {},
    );

    // Send test notification
    const result = await this.sendToChannel(dto.channel, dto.recipient, title, message, {
      isTest: true,
    });

    await this.auditService.log({
      action: 'NOTIFICATION_TEMPLATE_TESTED',
      entityType: 'NotificationTemplate',
      entityId: dto.templateId,
      userId: testedBy,
      details: { channel: dto.channel, recipient: dto.recipient },
    });

    return {
      success: result.success,
      channel: dto.channel,
      recipient: dto.recipient,
      renderedTitle: title,
      renderedMessage: message,
      error: result.error,
    };
  }

  // ==================== Preferences Methods ====================

  async getUserPreferences(userId: string) {
    let preferences = await this.prisma.notificationPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      // Create default preferences
      preferences = await this.prisma.notificationPreferences.create({
        data: {
          userId,
          allNotificationsEnabled: true,
          channelPreferences: this.getDefaultChannelPreferences() as any,
          typePreferences: [] as any,
          marketingEmails: true,
          marketingSms: false,
        },
      });
    }

    return this.formatPreferencesResponse(preferences);
  }

  async updateUserPreferences(userId: string, dto: UpdateNotificationPreferencesDto) {
    const existing = await this.prisma.notificationPreferences.findUnique({
      where: { userId },
    });

    const data: any = {};

    if (dto.allNotificationsEnabled !== undefined) {
      data.allNotificationsEnabled = dto.allNotificationsEnabled;
    }
    if (dto.channelPreferences) {
      data.channelPreferences = dto.channelPreferences;
    }
    if (dto.typePreferences) {
      data.typePreferences = dto.typePreferences;
    }
    if (dto.timezone !== undefined) {
      data.timezone = dto.timezone;
    }
    if (dto.preferredLocale !== undefined) {
      data.preferredLocale = dto.preferredLocale;
    }
    if (dto.marketingEmails !== undefined) {
      data.marketingEmails = dto.marketingEmails;
    }
    if (dto.marketingSms !== undefined) {
      data.marketingSms = dto.marketingSms;
    }

    let preferences;

    if (existing) {
      preferences = await this.prisma.notificationPreferences.update({
        where: { userId },
        data,
      });
    } else {
      preferences = await this.prisma.notificationPreferences.create({
        data: {
          userId,
          ...data,
          allNotificationsEnabled: data.allNotificationsEnabled ?? true,
          channelPreferences: data.channelPreferences || this.getDefaultChannelPreferences(),
          typePreferences: data.typePreferences || [],
        },
      });
    }

    await this.cacheService.delete(`notification_prefs:${userId}`);

    return this.formatPreferencesResponse(preferences);
  }

  // ==================== Device Token Methods ====================

  async registerDeviceToken(userId: string, dto: RegisterDeviceTokenDto) {
    // Check if token already exists for another user
    const existing = await this.prisma.deviceToken.findFirst({
      where: { token: dto.token },
    });

    if (existing && existing.userId !== userId) {
      // Transfer token to new user
      await this.prisma.deviceToken.delete({
        where: { id: existing.id },
      });
    }

    const deviceToken = await this.prisma.deviceToken.upsert({
      where: {
        userId_token: {
          userId,
          token: dto.token,
        },
      },
      update: {
        platform: dto.platform,
        deviceId: dto.deviceId,
        deviceName: dto.deviceName,
        appVersion: dto.appVersion,
        osVersion: dto.osVersion,
        isActive: true,
        lastUsedAt: new Date(),
      },
      create: {
        userId,
        token: dto.token,
        platform: dto.platform,
        deviceId: dto.deviceId,
        deviceName: dto.deviceName,
        appVersion: dto.appVersion,
        osVersion: dto.osVersion,
        isActive: true,
      },
    });

    return {
      success: true,
      deviceToken: this.formatDeviceTokenResponse(deviceToken),
    };
  }

  async unregisterDeviceToken(userId: string, dto: UnregisterDeviceTokenDto) {
    const result = await this.prisma.deviceToken.updateMany({
      where: {
        userId,
        token: dto.token,
      },
      data: {
        isActive: false,
      },
    });

    return {
      success: result.count > 0,
    };
  }

  async getUserDeviceTokens(userId: string) {
    const tokens = await this.prisma.deviceToken.findMany({
      where: { userId, isActive: true },
      orderBy: { lastUsedAt: 'desc' },
    });

    return {
      data: tokens.map((t) => this.formatDeviceTokenResponse(t)),
      total: tokens.length,
    };
  }

  // ==================== Webhook Handlers ====================

  async handleEmailWebhook(dto: EmailWebhookDto) {
    const notification = await this.prisma.notification.findFirst({
      where: { externalMessageId: dto.messageId },
    });

    if (!notification) {
      return { success: false, reason: 'Notification not found' };
    }

    let status: NotificationStatus | undefined;

    switch (dto.event) {
      case 'delivered':
        status = NotificationStatus.DELIVERED;
        break;
      case 'opened':
      case 'clicked':
        status = NotificationStatus.READ;
        break;
      case 'bounced':
      case 'failed':
        status = NotificationStatus.FAILED;
        break;
    }

    if (status) {
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status,
          deliveredAt: dto.event === 'delivered' ? new Date() : undefined,
          readAt: ['opened', 'clicked'].includes(dto.event) ? new Date() : undefined,
          failedAt: ['bounced', 'failed'].includes(dto.event) ? new Date() : undefined,
        },
      });
    }

    // Log webhook event
    await this.prisma.notificationWebhookEvent.create({
      data: {
        notificationId: notification.id,
        event: dto.event,
        channel: NotificationChannel.EMAIL,
        recipient: dto.recipient,
        externalMessageId: dto.messageId,
        data: dto.data as any,
        processedAt: new Date(),
      },
    });

    return { success: true };
  }

  async handleSmsWebhook(dto: SmsWebhookDto) {
    const notification = await this.prisma.notification.findFirst({
      where: { externalMessageId: dto.messageId },
    });

    if (!notification) {
      return { success: false, reason: 'Notification not found' };
    }

    let status: NotificationStatus | undefined;

    switch (dto.status) {
      case 'delivered':
        status = NotificationStatus.DELIVERED;
        break;
      case 'failed':
        status = NotificationStatus.FAILED;
        break;
    }

    if (status) {
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status,
          deliveredAt: dto.status === 'delivered' ? new Date() : undefined,
          failedAt: dto.status === 'failed' ? new Date() : undefined,
          failureReason: dto.errorMessage,
        },
      });
    }

    return { success: true };
  }

  // ==================== Statistics Methods ====================

  async getStatistics(query: NotificationStatisticsQueryDto) {
    const {
      startDate,
      endDate,
      channel,
      type,
      groupByChannel,
      groupByType,
      groupByStatus,
    } = query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const where: any = {
      createdAt: { gte: start, lte: end },
    };

    if (channel) where.channel = channel;
    if (type) where.type = type;

    const total = await this.prisma.notification.count({ where });
    const sent = await this.prisma.notification.count({
      where: { ...where, sentAt: { not: null } },
    });
    const delivered = await this.prisma.notification.count({
      where: { ...where, status: NotificationStatus.DELIVERED },
    });
    const read = await this.prisma.notification.count({
      where: { ...where, status: NotificationStatus.READ },
    });
    const failed = await this.prisma.notification.count({
      where: { ...where, status: NotificationStatus.FAILED },
    });

    const result: any = {
      period: { start, end },
      total,
      sent,
      delivered,
      read,
      failed,
      deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
      readRate: delivered > 0 ? (read / delivered) * 100 : 0,
    };

    if (groupByChannel) {
      const byChannel = await this.prisma.notification.groupBy({
        by: ['channel'],
        where,
        _count: true,
      });

      result.byChannel = {};
      for (const item of byChannel) {
        const channelStats = await this.getChannelStats(where, item.channel);
        result.byChannel[item.channel] = {
          total: item._count,
          ...channelStats,
        };
      }
    }

    if (groupByType) {
      const byType = await this.prisma.notification.groupBy({
        by: ['type'],
        where,
        _count: true,
      });

      result.byType = {};
      for (const item of byType) {
        const typeDelivered = await this.prisma.notification.count({
          where: { ...where, type: item.type, status: NotificationStatus.DELIVERED },
        });
        const typeRead = await this.prisma.notification.count({
          where: { ...where, type: item.type, status: NotificationStatus.READ },
        });

        result.byType[item.type] = {
          total: item._count,
          sent: item._count,
          delivered: typeDelivered,
          readRate: typeDelivered > 0 ? (typeRead / typeDelivered) * 100 : 0,
        };
      }
    }

    if (groupByStatus) {
      const byStatus = await this.prisma.notification.groupBy({
        by: ['status'],
        where,
        _count: true,
      });

      result.byStatus = {};
      byStatus.forEach((item) => {
        result.byStatus[item.status] = item._count;
      });
    }

    return result;
  }

  async getDashboard(query: NotificationDashboardQueryDto) {
    const { period = 'week', startDate, endDate } = query;

    let start: Date;
    let end = new Date();

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      switch (period) {
        case 'today':
          start = new Date();
          start.setHours(0, 0, 0, 0);
          break;
        case 'month':
          start = new Date();
          start.setMonth(start.getMonth() - 1);
          break;
        case 'week':
        default:
          start = new Date();
          start.setDate(start.getDate() - 7);
      }
    }

    const where = {
      createdAt: { gte: start, lte: end },
    };

    const stats = await this.getStatistics({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      groupByChannel: true,
    });

    // Today's stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayStats = {
      sent: await this.prisma.notification.count({
        where: { createdAt: { gte: todayStart } },
      }),
      delivered: await this.prisma.notification.count({
        where: { createdAt: { gte: todayStart }, status: NotificationStatus.DELIVERED },
      }),
      read: await this.prisma.notification.count({
        where: { createdAt: { gte: todayStart }, status: NotificationStatus.READ },
      }),
      failed: await this.prisma.notification.count({
        where: { createdAt: { gte: todayStart }, status: NotificationStatus.FAILED },
      }),
    };

    // Recent failed
    const failedNotifications = await this.prisma.notification.findMany({
      where: { status: NotificationStatus.FAILED },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    // Upcoming scheduled
    const upcomingScheduled = await this.prisma.scheduledNotification.findMany({
      where: {
        isActive: true,
        nextRunAt: { gte: new Date() },
      },
      orderBy: { nextRunAt: 'asc' },
      take: 5,
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return {
      period,
      summary: {
        totalSent: stats.sent,
        totalDelivered: stats.delivered,
        totalRead: stats.read,
        totalFailed: stats.failed,
        deliveryRate: stats.deliveryRate,
        readRate: stats.readRate,
      },
      todayStats,
      failedNotifications: failedNotifications.map((n) => this.formatNotificationResponse(n)),
      upcomingScheduled: upcomingScheduled.map((n) => this.formatScheduledNotificationResponse(n)),
      channelBreakdown: stats.byChannel
        ? Object.entries(stats.byChannel).map(([channel, data]: [string, any]) => ({
            channel,
            count: data.total,
            percentage: stats.total > 0 ? (data.total / stats.total) * 100 : 0,
            deliveryRate: data.deliveryRate,
          }))
        : undefined,
    };
  }

  // ==================== Cron Jobs ====================

  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledNotifications() {
    const now = new Date();

    const scheduled = await this.prisma.scheduledNotification.findMany({
      where: {
        isActive: true,
        nextRunAt: { lte: now },
      },
      include: {
        user: true,
      },
    });

    for (const sched of scheduled) {
      try {
        // Send notification
        await this.sendSingleNotification(
          {
            userId: sched.userId,
            type: sched.type as NotificationType,
            channels: sched.channels as NotificationChannel[],
            templateId: sched.templateId || undefined,
            title: sched.title || undefined,
            message: sched.message || undefined,
            variables: sched.variables as Record<string, any>,
            relatedEntityId: sched.relatedEntityId || undefined,
            relatedEntityType: sched.relatedEntityType || undefined,
          },
          'system',
        );

        // Update execution count and next run
        const nextRunAt = this.calculateNextRunDate(sched);

        await this.prisma.scheduledNotification.update({
          where: { id: sched.id },
          data: {
            lastRunAt: now,
            nextRunAt,
            executionsCount: { increment: 1 },
            lastExecutionStatus: 'success',
            isActive: nextRunAt !== null,
          },
        });
      } catch (error) {
        await this.prisma.scheduledNotification.update({
          where: { id: sched.id },
          data: {
            lastRunAt: now,
            lastExecutionStatus: 'failed',
          },
        });
      }
    }
  }

  // ==================== Event Handlers ====================

  @OnEvent('notification.queue')
  async handleNotificationQueue(payload: { notification: any }) {
    const { notification } = payload;

    try {
      const result = await this.sendToChannel(
        notification.channel,
        notification.recipientEmail || notification.recipientPhone,
        notification.title,
        notification.message,
        {
          notificationId: notification.id,
          imageUrl: notification.imageUrl,
          actionUrl: notification.actionUrl,
          userId: notification.userId,
        },
      );

      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: result.success ? NotificationStatus.SENT : NotificationStatus.FAILED,
          sentAt: result.success ? new Date() : undefined,
          failedAt: !result.success ? new Date() : undefined,
          failureReason: result.error,
          externalMessageId: result.messageId,
        },
      });
    } catch (error) {
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.FAILED,
          failedAt: new Date(),
          failureReason: error.message,
        },
      });
    }
  }

  @OnEvent('notification.send')
  async handleNotificationSendEvent(payload: any) {
    const { type, channel, recipient, data, userId } = payload;

    if (userId) {
      await this.sendSingleNotification(
        {
          userId,
          type,
          channels: [channel],
          ...data,
        },
        'system',
      );
    }
  }

  // ==================== Helper Methods ====================

  private async sendToChannel(
    channel: NotificationChannel,
    recipient: string,
    title: string,
    message: string,
    options: any = {},
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // This would integrate with actual email/SMS/push services
    // For now, returning mock success

    switch (channel) {
      case NotificationChannel.EMAIL:
        // Integration with email service (SendGrid, SES, etc.)
        return {
          success: true,
          messageId: `email_${Date.now()}`,
        };

      case NotificationChannel.SMS:
        // Integration with SMS service (Twilio, etc.)
        return {
          success: true,
          messageId: `sms_${Date.now()}`,
        };

      case NotificationChannel.PUSH:
        // Send push notification to device tokens
        if (options.userId) {
          const tokens = await this.prisma.deviceToken.findMany({
            where: { userId: options.userId, isActive: true },
          });

          if (tokens.length === 0) {
            return { success: false, error: 'No active device tokens' };
          }

          // Integration with FCM/APNs
          return {
            success: true,
            messageId: `push_${Date.now()}`,
          };
        }
        return { success: false, error: 'No user ID provided' };

      case NotificationChannel.WHATSAPP:
        // Integration with WhatsApp Business API
        return {
          success: true,
          messageId: `wa_${Date.now()}`,
        };

      case NotificationChannel.IN_APP:
        // In-app notifications are already stored
        return { success: true };

      default:
        return { success: false, error: 'Unknown channel' };
    }
  }

  private resolveContent(
    dto: any,
    template: any,
    channel: NotificationChannel,
    variables: Record<string, any> = {},
  ): { title: string; message: string } {
    let title = dto.title || '';
    let message = dto.message || '';

    if (template) {
      switch (channel) {
        case NotificationChannel.EMAIL:
          title = template.emailSubject || title;
          message = template.emailBody || message;
          break;
        case NotificationChannel.SMS:
          message = template.smsMessage || message;
          break;
        case NotificationChannel.PUSH:
          title = template.pushTitle || title;
          message = template.pushBody || message;
          break;
        case NotificationChannel.WHATSAPP:
          message = template.whatsappMessage || message;
          break;
        case NotificationChannel.IN_APP:
          title = template.inAppTitle || title;
          message = template.inAppMessage || message;
          break;
      }
    }

    // Replace variables
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      title = title.replace(placeholder, String(value));
      message = message.replace(placeholder, String(value));
    }

    return { title, message };
  }

  private filterChannelsByPreferences(
    channels: NotificationChannel[],
    type: NotificationType,
    preferences: any,
  ): NotificationChannel[] {
    if (!preferences?.allNotificationsEnabled) {
      return [];
    }

    const channelPrefs = preferences.channelPreferences || [];
    const typePrefs = preferences.typePreferences || [];

    // Check type preference
    const typePref = typePrefs.find((p: any) => p.type === type);
    if (typePref && !typePref.enabled) {
      return [];
    }

    // Filter by channel preference
    return channels.filter((channel) => {
      const channelPref = channelPrefs.find((p: any) => p.channel === channel);
      if (channelPref && !channelPref.enabled) {
        return false;
      }

      // Check type-specific channel restrictions
      if (typePref?.allowedChannels?.length > 0) {
        return typePref.allowedChannels.includes(channel);
      }

      return true;
    });
  }

  private async findUsersByFilters(filters: any): Promise<string[]> {
    const where: any = {};

    if (filters.roles?.length) {
      where.role = { in: filters.roles };
    }

    // Add more filters as needed

    const users = await this.prisma.user.findMany({
      where,
      select: { id: true },
    });

    return users.map((u) => u.id);
  }

  private calculateNextRunDate(scheduled: any): Date | null {
    const recurrence = scheduled.recurrence;

    if (!recurrence) {
      return null; // One-time notification
    }

    const now = new Date();
    let next = new Date(scheduled.nextRunAt || scheduled.startDate);

    // Check max occurrences
    if (
      recurrence.maxOccurrences &&
      scheduled.executionsCount >= recurrence.maxOccurrences
    ) {
      return null;
    }

    // Check end date
    if (recurrence.endDate && next > new Date(recurrence.endDate)) {
      return null;
    }

    const interval = recurrence.interval || 1;

    switch (recurrence.pattern) {
      case 'DAILY':
        next.setDate(next.getDate() + interval);
        break;
      case 'WEEKLY':
        next.setDate(next.getDate() + 7 * interval);
        break;
      case 'MONTHLY':
        next.setMonth(next.getMonth() + interval);
        break;
    }

    // Set time if specified
    if (recurrence.time) {
      const [hours, minutes] = recurrence.time.split(':');
      next.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }

    return next;
  }

  private getDefaultChannelPreferences() {
    return Object.values(NotificationChannel).map((channel) => ({
      channel,
      enabled: true,
    }));
  }

  private async getChannelStats(baseWhere: any, channel: NotificationChannel) {
    const where = { ...baseWhere, channel };

    const sent = await this.prisma.notification.count({
      where: { ...where, sentAt: { not: null } },
    });
    const delivered = await this.prisma.notification.count({
      where: { ...where, status: NotificationStatus.DELIVERED },
    });
    const failed = await this.prisma.notification.count({
      where: { ...where, status: NotificationStatus.FAILED },
    });

    return {
      sent,
      delivered,
      failed,
      deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
    };
  }

  private formatNotificationResponse(notification: any) {
    return {
      id: notification.id,
      userId: notification.userId,
      userName: notification.user?.name,
      type: notification.type,
      channel: notification.channel,
      status: notification.status,
      priority: notification.priority,
      title: notification.title,
      message: notification.message,
      templateId: notification.templateId,
      templateVariables: notification.templateVariables,
      relatedEntityId: notification.relatedEntityId,
      relatedEntityType: notification.relatedEntityType,
      actionUrl: notification.actionUrl,
      actionText: notification.actionText,
      imageUrl: notification.imageUrl,
      scheduledAt: notification.scheduledAt,
      sentAt: notification.sentAt,
      deliveredAt: notification.deliveredAt,
      readAt: notification.readAt,
      failedAt: notification.failedAt,
      failureReason: notification.failureReason,
      externalMessageId: notification.externalMessageId,
      metadata: notification.metadata,
      isRead: !!notification.readAt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }

  private formatInAppNotification(notification: any) {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      imageUrl: notification.imageUrl,
      actionUrl: notification.actionUrl,
      actionText: notification.actionText,
      isRead: !!notification.readAt,
      relatedEntityId: notification.relatedEntityId,
      relatedEntityType: notification.relatedEntityType,
      createdAt: notification.createdAt,
      readAt: notification.readAt,
    };
  }

  private formatScheduledNotificationResponse(scheduled: any) {
    return {
      id: scheduled.id,
      userId: scheduled.userId,
      userName: scheduled.user?.name,
      type: scheduled.type,
      channels: scheduled.channels,
      templateId: scheduled.templateId,
      title: scheduled.title,
      message: scheduled.message,
      variables: scheduled.variables,
      startDate: scheduled.startDate,
      nextRunAt: scheduled.nextRunAt,
      lastRunAt: scheduled.lastRunAt,
      recurrence: scheduled.recurrence,
      relatedEntityId: scheduled.relatedEntityId,
      relatedEntityType: scheduled.relatedEntityType,
      isActive: scheduled.isActive,
      executionsCount: scheduled.executionsCount,
      lastExecutionStatus: scheduled.lastExecutionStatus,
      createdAt: scheduled.createdAt,
      updatedAt: scheduled.updatedAt,
    };
  }

  private formatTemplateResponse(template: any) {
    return {
      id: template.id,
      code: template.code,
      name: template.name,
      description: template.description,
      category: template.category,
      notificationType: template.notificationType,
      supportedChannels: template.supportedChannels,
      emailSubject: template.emailSubject,
      emailBody: template.emailBody,
      emailBodyText: template.emailBodyText,
      smsMessage: template.smsMessage,
      pushTitle: template.pushTitle,
      pushBody: template.pushBody,
      whatsappMessage: template.whatsappMessage,
      whatsappTemplateId: template.whatsappTemplateId,
      inAppTitle: template.inAppTitle,
      inAppMessage: template.inAppMessage,
      availableVariables: template.availableVariables,
      isActive: template.isActive,
      defaultLocale: template.defaultLocale,
      translations: template.translations,
      usageCount: template.usageCount,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }

  private formatPreferencesResponse(preferences: any) {
    return {
      userId: preferences.userId,
      allNotificationsEnabled: preferences.allNotificationsEnabled,
      channelPreferences: preferences.channelPreferences || [],
      typePreferences: preferences.typePreferences || [],
      timezone: preferences.timezone,
      preferredLocale: preferences.preferredLocale,
      marketingEmails: preferences.marketingEmails,
      marketingSms: preferences.marketingSms,
      updatedAt: preferences.updatedAt,
    };
  }

  private formatDeviceTokenResponse(token: any) {
    return {
      id: token.id,
      userId: token.userId,
      token: token.token,
      platform: token.platform,
      deviceId: token.deviceId,
      deviceName: token.deviceName,
      appVersion: token.appVersion,
      osVersion: token.osVersion,
      isActive: token.isActive,
      lastUsedAt: token.lastUsedAt,
      createdAt: token.createdAt,
    };
  }
}
