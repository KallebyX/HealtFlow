import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { UserRole } from '@/common/enums/user-role.enum';

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
} from './dto/create-notification.dto';

import {
  NotificationQueryDto,
  UserNotificationsQueryDto,
  TemplateQueryDto,
  ScheduledNotificationQueryDto,
  NotificationStatisticsQueryDto,
  NotificationDashboardQueryDto,
} from './dto/notification-query.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // ==================== User Notifications ====================

  @Get('me')
  @ApiOperation({ summary: 'Minhas notificações' })
  @ApiResponse({ status: 200, description: 'Lista de notificações' })
  async getMyNotifications(
    @Query() query: UserNotificationsQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.getUserNotifications(userId, query);
  }

  @Get('me/unread-count')
  @ApiOperation({ summary: 'Contador de não lidas' })
  @ApiResponse({ status: 200, description: 'Contagem de notificações não lidas' })
  async getUnreadCount(@CurrentUser('id') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Post('me/mark-read')
  @ApiOperation({ summary: 'Marcar como lidas' })
  @ApiResponse({ status: 200, description: 'Notificações marcadas como lidas' })
  async markAsRead(
    @Body() dto: MarkNotificationReadDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.markAsRead(userId, dto);
  }

  @Post('me/mark-all-read')
  @ApiOperation({ summary: 'Marcar todas como lidas' })
  @ApiResponse({ status: 200, description: 'Todas notificações marcadas como lidas' })
  async markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  // ==================== Preferences ====================

  @Get('preferences')
  @ApiOperation({ summary: 'Minhas preferências de notificação' })
  @ApiResponse({ status: 200, description: 'Preferências do usuário' })
  async getMyPreferences(@CurrentUser('id') userId: string) {
    return this.notificationsService.getUserPreferences(userId);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Atualizar preferências' })
  @ApiResponse({ status: 200, description: 'Preferências atualizadas' })
  async updateMyPreferences(
    @Body() dto: UpdateNotificationPreferencesDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.updateUserPreferences(userId, dto);
  }

  @Get('preferences/:userId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Preferências de um usuário' })
  @ApiParam({ name: 'userId', description: 'ID do usuário' })
  async getUserPreferences(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.notificationsService.getUserPreferences(userId);
  }

  // ==================== Device Tokens ====================

  @Post('device-tokens')
  @ApiOperation({ summary: 'Registrar token de dispositivo' })
  @ApiResponse({ status: 201, description: 'Token registrado' })
  async registerDeviceToken(
    @Body() dto: RegisterDeviceTokenDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.registerDeviceToken(userId, dto);
  }

  @Delete('device-tokens')
  @ApiOperation({ summary: 'Remover token de dispositivo' })
  @ApiResponse({ status: 200, description: 'Token removido' })
  async unregisterDeviceToken(
    @Body() dto: UnregisterDeviceTokenDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.unregisterDeviceToken(userId, dto);
  }

  @Get('device-tokens')
  @ApiOperation({ summary: 'Meus tokens de dispositivo' })
  @ApiResponse({ status: 200, description: 'Lista de tokens' })
  async getMyDeviceTokens(@CurrentUser('id') userId: string) {
    return this.notificationsService.getUserDeviceTokens(userId);
  }

  // ==================== Send Notifications ====================

  @Post('send')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Enviar notificação' })
  @ApiResponse({ status: 201, description: 'Notificação enviada' })
  async createNotification(
    @Body() dto: CreateNotificationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.createNotification(dto, userId);
  }

  @Post('send/single')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Enviar notificação para um usuário' })
  @ApiResponse({ status: 200, description: 'Notificação enviada' })
  async sendSingleNotification(
    @Body() dto: SendSingleNotificationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.sendSingleNotification(dto, userId);
  }

  @Post('send/bulk')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Enviar notificação em massa' })
  @ApiResponse({ status: 200, description: 'Notificações enfileiradas' })
  async sendBulkNotification(
    @Body() dto: SendBulkNotificationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.sendBulkNotification(dto, userId);
  }

  // ==================== Admin Operations ====================

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar todas notificações' })
  @ApiResponse({ status: 200, description: 'Lista de notificações' })
  async findAllNotifications(@Query() query: NotificationQueryDto) {
    return this.notificationsService.findAllNotifications(query);
  }

  @Get('user/:userId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Notificações de um usuário' })
  @ApiParam({ name: 'userId', description: 'ID do usuário' })
  async getUserNotifications(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: UserNotificationsQueryDto,
  ) {
    return this.notificationsService.getUserNotifications(userId, query);
  }

  // ==================== Scheduled Notifications ====================

  @Post('scheduled')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar notificação agendada' })
  @ApiResponse({ status: 201, description: 'Agendamento criado' })
  async createScheduledNotification(
    @Body() dto: CreateScheduledNotificationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.createScheduledNotification(dto, userId);
  }

  @Get('scheduled')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar notificações agendadas' })
  @ApiResponse({ status: 200, description: 'Lista de agendamentos' })
  async findAllScheduledNotifications(@Query() query: ScheduledNotificationQueryDto) {
    return this.notificationsService.findAllScheduledNotifications(query);
  }

  @Put('scheduled/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar notificação agendada' })
  @ApiParam({ name: 'id', description: 'ID do agendamento' })
  async updateScheduledNotification(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateScheduledNotificationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.updateScheduledNotification(id, dto, userId);
  }

  @Delete('scheduled/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deletar notificação agendada' })
  @ApiParam({ name: 'id', description: 'ID do agendamento' })
  async deleteScheduledNotification(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.deleteScheduledNotification(id, userId);
  }

  // ==================== Templates ====================

  @Post('templates')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar template' })
  @ApiResponse({ status: 201, description: 'Template criado' })
  async createTemplate(
    @Body() dto: CreateNotificationTemplateDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.createTemplate(dto, userId);
  }

  @Get('templates')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar templates' })
  @ApiResponse({ status: 200, description: 'Lista de templates' })
  async findAllTemplates(@Query() query: TemplateQueryDto) {
    return this.notificationsService.findAllTemplates(query);
  }

  @Get('templates/code/:code')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Buscar template por código' })
  @ApiParam({ name: 'code', description: 'Código do template' })
  async findTemplateByCode(@Param('code') code: string) {
    return this.notificationsService.findTemplateByCode(code);
  }

  @Put('templates/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar template' })
  @ApiParam({ name: 'id', description: 'ID do template' })
  async updateTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNotificationTemplateDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.updateTemplate(id, dto, userId);
  }

  @Delete('templates/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deletar template' })
  @ApiParam({ name: 'id', description: 'ID do template' })
  async deleteTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.deleteTemplate(id, userId);
  }

  @Post('templates/test')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Testar template' })
  @ApiResponse({ status: 200, description: 'Resultado do teste' })
  async testTemplate(
    @Body() dto: TestTemplateDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.testTemplate(dto, userId);
  }

  // ==================== Statistics & Dashboard ====================

  @Get('statistics')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Estatísticas de notificações' })
  @ApiResponse({ status: 200, description: 'Estatísticas gerais' })
  async getStatistics(@Query() query: NotificationStatisticsQueryDto) {
    return this.notificationsService.getStatistics(query);
  }

  @Get('dashboard')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Dashboard de notificações' })
  @ApiResponse({ status: 200, description: 'Dashboard' })
  async getDashboard(@Query() query: NotificationDashboardQueryDto) {
    return this.notificationsService.getDashboard(query);
  }

  // ==================== Webhooks ====================

  @Post('webhooks/email')
  @Public()
  @ApiOperation({ summary: 'Webhook de email' })
  @ApiResponse({ status: 200, description: 'Webhook processado' })
  async handleEmailWebhook(@Body() dto: EmailWebhookDto) {
    return this.notificationsService.handleEmailWebhook(dto);
  }

  @Post('webhooks/sms')
  @Public()
  @ApiOperation({ summary: 'Webhook de SMS' })
  @ApiResponse({ status: 200, description: 'Webhook processado' })
  async handleSmsWebhook(@Body() dto: SmsWebhookDto) {
    return this.notificationsService.handleSmsWebhook(dto);
  }
}
