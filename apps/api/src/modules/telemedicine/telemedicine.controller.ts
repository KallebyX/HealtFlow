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
  ApiQuery,
} from '@nestjs/swagger';
import { TelemedicineService } from './telemedicine.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole } from '@/common/enums/user-role.enum';

import {
  CreateTelemedicineSessionDto,
  UpdateTelemedicineSessionDto,
  JoinSessionDto,
  LeaveSessionDto,
  InviteGuestDto,
  UpdateConnectionQualityDto,
  SendChatMessageDto,
  ShareFileDto,
  EndSessionDto,
  RescheduleSessionDto,
  CancelSessionDto,
  ReportTechnicalIssueDto,
  RateSessionDto,
  StartRecordingDto,
  StopRecordingDto,
  WaitingRoomActionDto,
  DeviceTestDto,
  ScreenShareDto,
} from './dto/create-telemedicine.dto';
import {
  TelemedicineSessionQueryDto,
  UpcomingSessionsQueryDto,
  SessionHistoryQueryDto,
  ChatMessagesQueryDto,
  SharedFilesQueryDto,
  TelemedicineStatisticsQueryDto,
  WaitingRoomQueryDto,
  RecordingsQueryDto,
  TechnicalIssuesQueryDto,
} from './dto/telemedicine-query.dto';
import {
  TelemedicineSessionResponseDto,
  TelemedicineSessionListResponseDto,
  JoinSessionResponseDto,
  ChatMessagesResponseDto,
  SharedFilesResponseDto,
  RecordingsResponseDto,
  TechnicalIssuesResponseDto,
  WaitingRoomResponseDto,
  TelemedicineStatisticsResponseDto,
  UpcomingSessionsResponseDto,
  InviteGuestResponseDto,
  DeviceTestResultDto,
} from './dto/telemedicine-response.dto';

@ApiTags('Telemedicine')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('telemedicine')
export class TelemedicineController {
  constructor(private readonly telemedicineService: TelemedicineService) {}

  // ==================== Sessões ====================

  @Post('sessions')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Criar sessão de telemedicina' })
  @ApiResponse({ status: 201, description: 'Sessão criada', type: TelemedicineSessionResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Paciente/Médico não encontrado' })
  async createSession(
    @Body() dto: CreateTelemedicineSessionDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.telemedicineService.createSession(dto, userId, userRole);
  }

  @Get('sessions')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.PATIENT)
  @ApiOperation({ summary: 'Listar sessões de telemedicina' })
  @ApiResponse({ status: 200, description: 'Lista de sessões', type: TelemedicineSessionListResponseDto })
  async findAllSessions(
    @Query() query: TelemedicineSessionQueryDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.telemedicineService.findAllSessions(query, userId, userRole);
  }

  @Get('sessions/upcoming')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  @ApiOperation({ summary: 'Próximas sessões agendadas' })
  @ApiResponse({ status: 200, description: 'Próximas sessões', type: UpcomingSessionsResponseDto })
  async getUpcomingSessions(
    @Query() query: UpcomingSessionsQueryDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.telemedicineService.getUpcomingSessions(query, userId, userRole);
  }

  @Get('sessions/:id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.PATIENT)
  @ApiOperation({ summary: 'Buscar sessão por ID' })
  @ApiParam({ name: 'id', description: 'ID da sessão' })
  @ApiResponse({ status: 200, description: 'Sessão encontrada', type: TelemedicineSessionResponseDto })
  @ApiResponse({ status: 404, description: 'Sessão não encontrada' })
  async findSessionById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.telemedicineService.findSessionById(id, userId, userRole);
  }

  @Get('sessions/code/:code')
  @ApiOperation({ summary: 'Buscar sessão por código' })
  @ApiParam({ name: 'code', description: 'Código da sessão' })
  @ApiResponse({ status: 200, description: 'Sessão encontrada', type: TelemedicineSessionResponseDto })
  async findSessionByCode(
    @Param('code') code: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.telemedicineService.findSessionByCode(code, userId, userRole);
  }

  @Put('sessions/:id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Atualizar sessão' })
  @ApiParam({ name: 'id', description: 'ID da sessão' })
  @ApiResponse({ status: 200, description: 'Sessão atualizada', type: TelemedicineSessionResponseDto })
  async updateSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTelemedicineSessionDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.telemedicineService.updateSession(id, dto, userId, userRole);
  }

  // ==================== Fluxo da Sessão ====================

  @Post('sessions/join')
  @ApiOperation({ summary: 'Entrar na sessão' })
  @ApiResponse({ status: 200, description: 'Conectado à sessão', type: JoinSessionResponseDto })
  async joinSession(
    @Body() dto: JoinSessionDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.telemedicineService.joinSession(dto, userId, userRole);
  }

  @Post('sessions/leave')
  @ApiOperation({ summary: 'Sair da sessão' })
  @ApiResponse({ status: 200, description: 'Desconectado da sessão' })
  async leaveSession(
    @Body() dto: LeaveSessionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.telemedicineService.leaveSession(dto, userId);
  }

  @Post('sessions/end')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Encerrar sessão' })
  @ApiResponse({ status: 200, description: 'Sessão encerrada', type: TelemedicineSessionResponseDto })
  async endSession(
    @Body() dto: EndSessionDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.telemedicineService.endSession(dto, userId, userRole);
  }

  @Post('sessions/reschedule')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Reagendar sessão' })
  @ApiResponse({ status: 200, description: 'Sessão reagendada', type: TelemedicineSessionResponseDto })
  async rescheduleSession(
    @Body() dto: RescheduleSessionDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.telemedicineService.rescheduleSession(dto, userId, userRole);
  }

  @Post('sessions/cancel')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Cancelar sessão' })
  @ApiResponse({ status: 200, description: 'Sessão cancelada', type: TelemedicineSessionResponseDto })
  async cancelSession(
    @Body() dto: CancelSessionDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.telemedicineService.cancelSession(dto, userId, userRole);
  }

  // ==================== Sala de Espera ====================

  @Get('waiting-room')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Listar participantes na sala de espera' })
  @ApiResponse({ status: 200, description: 'Sala de espera', type: WaitingRoomResponseDto })
  async getWaitingRoom(
    @Query() query: WaitingRoomQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.telemedicineService.getWaitingRoom(query, userId);
  }

  @Post('waiting-room/action')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Ação na sala de espera (admitir, negar, etc.)' })
  @ApiResponse({ status: 200, description: 'Ação executada' })
  async waitingRoomAction(
    @Body() dto: WaitingRoomActionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.telemedicineService.waitingRoomAction(dto, userId);
  }

  // ==================== Chat ====================

  @Post('chat/send')
  @ApiOperation({ summary: 'Enviar mensagem no chat' })
  @ApiResponse({ status: 201, description: 'Mensagem enviada' })
  async sendChatMessage(
    @Body() dto: SendChatMessageDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.telemedicineService.sendChatMessage(dto, userId);
  }

  @Get('sessions/:sessionId/chat')
  @ApiOperation({ summary: 'Obter mensagens do chat' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiResponse({ status: 200, description: 'Mensagens do chat', type: ChatMessagesResponseDto })
  async getChatMessages(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Query() query: ChatMessagesQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.telemedicineService.getChatMessages(sessionId, query, userId);
  }

  // ==================== Arquivos Compartilhados ====================

  @Post('files/share')
  @ApiOperation({ summary: 'Compartilhar arquivo na sessão' })
  @ApiResponse({ status: 201, description: 'Arquivo compartilhado' })
  async shareFile(
    @Body() dto: ShareFileDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.telemedicineService.shareFile(dto, userId);
  }

  @Get('sessions/:sessionId/files')
  @ApiOperation({ summary: 'Listar arquivos compartilhados' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiResponse({ status: 200, description: 'Arquivos compartilhados', type: SharedFilesResponseDto })
  async getSharedFiles(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Query() query: SharedFilesQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.telemedicineService.getSharedFiles(sessionId, query, userId);
  }

  // ==================== Convidados ====================

  @Post('invite')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  @ApiOperation({ summary: 'Convidar participante para sessão' })
  @ApiResponse({ status: 201, description: 'Convite enviado', type: InviteGuestResponseDto })
  async inviteGuest(
    @Body() dto: InviteGuestDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.telemedicineService.inviteGuest(dto, userId, userRole);
  }

  // ==================== Qualidade e Problemas Técnicos ====================

  @Post('quality/update')
  @ApiOperation({ summary: 'Atualizar métricas de qualidade' })
  @ApiResponse({ status: 200, description: 'Métricas atualizadas' })
  async updateConnectionQuality(
    @Body() dto: UpdateConnectionQualityDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.telemedicineService.updateConnectionQuality(dto, userId);
  }

  @Post('issues/report')
  @ApiOperation({ summary: 'Reportar problema técnico' })
  @ApiResponse({ status: 201, description: 'Problema reportado' })
  async reportTechnicalIssue(
    @Body() dto: ReportTechnicalIssueDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.telemedicineService.reportTechnicalIssue(dto, userId);
  }

  // ==================== Avaliação ====================

  @Post('rate')
  @ApiOperation({ summary: 'Avaliar sessão' })
  @ApiResponse({ status: 201, description: 'Avaliação registrada' })
  async rateSession(
    @Body() dto: RateSessionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.telemedicineService.rateSession(dto, userId);
  }

  // ==================== Gravação ====================

  @Post('recording/start')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Iniciar gravação da sessão' })
  @ApiResponse({ status: 201, description: 'Gravação iniciada' })
  async startRecording(
    @Body() dto: StartRecordingDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.telemedicineService.startRecording(dto, userId, userRole);
  }

  @Post('recording/stop')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Parar gravação da sessão' })
  @ApiResponse({ status: 200, description: 'Gravação parada' })
  async stopRecording(
    @Body() dto: StopRecordingDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.telemedicineService.stopRecording(dto, userId);
  }

  @Get('recordings')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Listar gravações' })
  @ApiResponse({ status: 200, description: 'Lista de gravações', type: RecordingsResponseDto })
  async getRecordings(@Query() query: RecordingsQueryDto) {
    return this.telemedicineService.getRecordings(query);
  }

  // ==================== Estatísticas ====================

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Estatísticas de telemedicina' })
  @ApiResponse({ status: 200, description: 'Estatísticas', type: TelemedicineStatisticsResponseDto })
  async getStatistics(
    @Query() query: TelemedicineStatisticsQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.telemedicineService.getStatistics(query, userId);
  }

  // ==================== Teste de Dispositivos ====================

  @Post('device-test')
  @ApiOperation({ summary: 'Testar dispositivos (câmera, microfone, etc.)' })
  @ApiResponse({ status: 200, description: 'Resultado dos testes', type: DeviceTestResultDto })
  async testDevices(@Body() dto: DeviceTestDto) {
    // Este endpoint seria chamado pelo frontend para testar dispositivos
    // A lógica real de teste acontece no cliente
    return {
      success: true,
      camera: dto.testCamera ? { available: true, name: 'Integrated Camera' } : undefined,
      microphone: dto.testMicrophone ? { available: true, name: 'Default Microphone' } : undefined,
      speaker: dto.testSpeaker ? { available: true, name: 'Default Speaker' } : undefined,
      network: dto.testNetwork ? { available: true, speed: 50, latency: 30, recommendation: 'Sua conexão é adequada para videochamadas' } : undefined,
      browser: { supported: true, webrtcSupported: true },
      recommendations: [],
    };
  }

  // ==================== Histórico ====================

  @Get('history')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  @ApiOperation({ summary: 'Histórico de sessões' })
  @ApiResponse({ status: 200, description: 'Histórico de sessões' })
  async getSessionHistory(
    @Query() query: SessionHistoryQueryDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    // Reutiliza findAllSessions com filtro de status completado
    return this.telemedicineService.findAllSessions(
      {
        ...query,
        statuses: ['COMPLETED', 'CANCELLED', 'NO_SHOW_PATIENT', 'NO_SHOW_DOCTOR', 'TECHNICAL_ISSUE'] as any,
        includeCancelled: true,
      },
      userId,
      userRole,
    );
  }
}
