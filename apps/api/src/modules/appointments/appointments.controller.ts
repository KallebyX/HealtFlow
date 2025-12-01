import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
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
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  RescheduleAppointmentDto,
  CancelAppointmentDto,
  ConfirmAppointmentDto,
  CheckInDto,
  StartAppointmentDto,
  CompleteAppointmentDto,
  NoShowDto,
  AddToWaitingListDto,
  BatchCancelDto,
  BatchConfirmDto,
} from './dto/create-appointment.dto';
import {
  AppointmentQueryDto,
  CalendarQueryDto,
  AvailableSlotsQueryDto,
  WaitingListQueryDto,
  AppointmentStatsQueryDto,
} from './dto/appointment-query.dto';
import {
  AppointmentResponseDto,
  AppointmentListResponseDto,
  CalendarResponseDto,
  AvailableSlotsResponseDto,
  WaitingListResponseDto,
  AppointmentStatsResponseDto,
  DailyScheduleResponseDto,
  BatchOperationResultDto,
} from './dto/appointment-response.dto';
import { UserRole } from '@prisma/client';

@ApiTags('Appointments')
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AppointmentsController {
  private readonly logger = new Logger(AppointmentsController.name);

  constructor(private readonly appointmentsService: AppointmentsService) {}

  // ═══════════════════════════════════════════════════════════════════════════════
  // CRUD BÁSICO
  // ═══════════════════════════════════════════════════════════════════════════════

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Criar agendamento',
    description: 'Cria um novo agendamento de consulta.',
  })
  @ApiBody({ type: CreateAppointmentDto })
  @ApiResponse({ status: 201, description: 'Agendamento criado', type: AppointmentResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou horário fora do expediente' })
  @ApiResponse({ status: 409, description: 'Conflito de horário' })
  async create(
    @Body() dto: CreateAppointmentDto,
    @CurrentUser('id') userId: string,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.create(dto, userId);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Listar agendamentos',
    description: 'Lista agendamentos com filtros e paginação.',
  })
  @ApiResponse({ status: 200, description: 'Lista de agendamentos', type: AppointmentListResponseDto })
  async findAll(@Query() query: AppointmentQueryDto): Promise<AppointmentListResponseDto> {
    return this.appointmentsService.findAll(query);
  }

  @Get('calendar')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
  @ApiOperation({
    summary: 'Obter calendário',
    description: 'Retorna eventos formatados para exibição em calendário.',
  })
  @ApiResponse({ status: 200, description: 'Eventos do calendário', type: CalendarResponseDto })
  async getCalendar(@Query() query: CalendarQueryDto): Promise<CalendarResponseDto> {
    return this.appointmentsService.getCalendar(query);
  }

  @Get('available-slots')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Buscar horários disponíveis',
    description: 'Retorna slots disponíveis para agendamento.',
  })
  @ApiResponse({ status: 200, description: 'Slots disponíveis', type: AvailableSlotsResponseDto })
  async getAvailableSlots(@Query() query: AvailableSlotsQueryDto): Promise<AvailableSlotsResponseDto> {
    return this.appointmentsService.getAvailableSlots(query);
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Estatísticas de agendamentos',
    description: 'Retorna estatísticas de agendamentos.',
  })
  @ApiResponse({ status: 200, description: 'Estatísticas', type: AppointmentStatsResponseDto })
  async getStats(@Query() query: AppointmentStatsQueryDto): Promise<AppointmentStatsResponseDto> {
    return this.appointmentsService.getStats(query);
  }

  @Get('doctor/:doctorId/daily-schedule')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
  @ApiOperation({
    summary: 'Agenda diária do médico',
    description: 'Retorna a agenda completa de um médico para um dia específico.',
  })
  @ApiParam({ name: 'doctorId', description: 'ID do médico' })
  @ApiQuery({ name: 'date', description: 'Data no formato YYYY-MM-DD' })
  @ApiResponse({ status: 200, description: 'Agenda diária', type: DailyScheduleResponseDto })
  async getDailySchedule(
    @Param('doctorId', ParseUUIDPipe) doctorId: string,
    @Query('date') date: string,
  ): Promise<DailyScheduleResponseDto> {
    return this.appointmentsService.getDailySchedule(doctorId, date);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Obter agendamento por ID',
    description: 'Retorna os dados completos de um agendamento.',
  })
  @ApiParam({ name: 'id', description: 'ID do agendamento' })
  @ApiResponse({ status: 200, description: 'Dados do agendamento', type: AppointmentResponseDto })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<AppointmentResponseDto> {
    return this.appointmentsService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({
    summary: 'Atualizar agendamento',
    description: 'Atualiza os dados de um agendamento.',
  })
  @ApiParam({ name: 'id', description: 'ID do agendamento' })
  @ApiBody({ type: UpdateAppointmentDto })
  @ApiResponse({ status: 200, description: 'Agendamento atualizado', type: AppointmentResponseDto })
  @ApiResponse({ status: 400, description: 'Não é possível editar agendamento com status atual' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentDto,
    @CurrentUser('id') userId: string,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover agendamento',
    description: 'Remove um agendamento (soft delete).',
  })
  @ApiParam({ name: 'id', description: 'ID do agendamento' })
  @ApiResponse({ status: 204, description: 'Agendamento removido' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    await this.appointmentsService.delete(id, userId);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // AÇÕES DO FLUXO DE ATENDIMENTO
  // ═══════════════════════════════════════════════════════════════════════════════

  @Post(':id/reschedule')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Reagendar consulta',
    description: 'Reagenda uma consulta para novo horário.',
  })
  @ApiParam({ name: 'id', description: 'ID do agendamento' })
  @ApiBody({ type: RescheduleAppointmentDto })
  @ApiResponse({ status: 200, description: 'Consulta reagendada', type: AppointmentResponseDto })
  @ApiResponse({ status: 400, description: 'Não é possível reagendar consulta com status atual' })
  @ApiResponse({ status: 409, description: 'Conflito de horário' })
  async reschedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RescheduleAppointmentDto,
    @CurrentUser('id') userId: string,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.reschedule(id, dto, userId);
  }

  @Post(':id/cancel')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.PATIENT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Cancelar consulta',
    description: 'Cancela uma consulta agendada.',
  })
  @ApiParam({ name: 'id', description: 'ID do agendamento' })
  @ApiBody({ type: CancelAppointmentDto })
  @ApiResponse({ status: 204, description: 'Consulta cancelada' })
  @ApiResponse({ status: 400, description: 'Não é possível cancelar consulta com status atual' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelAppointmentDto,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    await this.appointmentsService.cancel(id, dto, userId);
  }

  @Post(':id/confirm')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Confirmar consulta',
    description: 'Confirma presença na consulta agendada.',
  })
  @ApiParam({ name: 'id', description: 'ID do agendamento' })
  @ApiBody({ type: ConfirmAppointmentDto })
  @ApiResponse({ status: 200, description: 'Consulta confirmada', type: AppointmentResponseDto })
  @ApiResponse({ status: 400, description: 'Agendamento não está em status agendado' })
  async confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmAppointmentDto,
    @CurrentUser('id') userId: string,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.confirm(id, dto, userId);
  }

  @Post(':id/check-in')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({
    summary: 'Fazer check-in',
    description: 'Registra a chegada do paciente na clínica.',
  })
  @ApiParam({ name: 'id', description: 'ID do agendamento' })
  @ApiBody({ type: CheckInDto })
  @ApiResponse({ status: 200, description: 'Check-in realizado', type: AppointmentResponseDto })
  @ApiResponse({ status: 400, description: 'Agendamento não pode fazer check-in' })
  async checkIn(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CheckInDto,
    @CurrentUser('id') userId: string,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.checkIn(id, dto, userId);
  }

  @Post(':id/start')
  @Roles(UserRole.SUPER_ADMIN, UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Iniciar atendimento',
    description: 'Marca o início do atendimento.',
  })
  @ApiParam({ name: 'id', description: 'ID do agendamento' })
  @ApiBody({ type: StartAppointmentDto })
  @ApiResponse({ status: 200, description: 'Atendimento iniciado', type: AppointmentResponseDto })
  @ApiResponse({ status: 400, description: 'Agendamento não pode ser iniciado' })
  async start(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: StartAppointmentDto,
    @CurrentUser('id') userId: string,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.start(id, dto, userId);
  }

  @Post(':id/complete')
  @Roles(UserRole.SUPER_ADMIN, UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Finalizar atendimento',
    description: 'Marca o término do atendimento.',
  })
  @ApiParam({ name: 'id', description: 'ID do agendamento' })
  @ApiBody({ type: CompleteAppointmentDto })
  @ApiResponse({ status: 200, description: 'Atendimento finalizado', type: AppointmentResponseDto })
  @ApiResponse({ status: 400, description: 'Agendamento não está em andamento' })
  async complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteAppointmentDto,
    @CurrentUser('id') userId: string,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.complete(id, dto, userId);
  }

  @Post(':id/no-show')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({
    summary: 'Marcar como falta',
    description: 'Marca o paciente como faltante (no-show).',
  })
  @ApiParam({ name: 'id', description: 'ID do agendamento' })
  @ApiBody({ type: NoShowDto })
  @ApiResponse({ status: 200, description: 'Marcado como falta', type: AppointmentResponseDto })
  @ApiResponse({ status: 400, description: 'Status inválido para marcar como falta' })
  async markNoShow(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: NoShowDto,
    @CurrentUser('id') userId: string,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.markNoShow(id, dto, userId);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // LISTA DE ESPERA
  // ═══════════════════════════════════════════════════════════════════════════════

  @Post('waiting-list')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.RECEPTIONIST, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Adicionar à lista de espera',
    description: 'Adiciona paciente à lista de espera para um médico.',
  })
  @ApiBody({ type: AddToWaitingListDto })
  @ApiResponse({ status: 201, description: 'Adicionado à lista de espera' })
  @ApiResponse({ status: 409, description: 'Paciente já está na lista de espera' })
  async addToWaitingList(
    @Body() dto: AddToWaitingListDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.appointmentsService.addToWaitingList(dto, userId);
  }

  @Get('waiting-list')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({
    summary: 'Listar lista de espera',
    description: 'Lista pacientes na lista de espera.',
  })
  @ApiResponse({ status: 200, description: 'Lista de espera', type: WaitingListResponseDto })
  async getWaitingList(@Query() query: WaitingListQueryDto): Promise<WaitingListResponseDto> {
    return this.appointmentsService.getWaitingList(query);
  }

  @Delete('waiting-list/:entryId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.RECEPTIONIST, UserRole.PATIENT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover da lista de espera',
    description: 'Remove paciente da lista de espera.',
  })
  @ApiParam({ name: 'entryId', description: 'ID da entrada na lista de espera' })
  @ApiResponse({ status: 204, description: 'Removido da lista de espera' })
  async removeFromWaitingList(
    @Param('entryId', ParseUUIDPipe) entryId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    await this.appointmentsService.removeFromWaitingList(entryId, userId);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // OPERAÇÕES EM LOTE
  // ═══════════════════════════════════════════════════════════════════════════════

  @Post('batch/cancel')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN)
  @ApiOperation({
    summary: 'Cancelar em lote',
    description: 'Cancela múltiplos agendamentos de uma vez.',
  })
  @ApiBody({ type: BatchCancelDto })
  @ApiResponse({ status: 200, description: 'Resultado da operação em lote', type: BatchOperationResultDto })
  async batchCancel(
    @Body() dto: BatchCancelDto,
    @CurrentUser('id') userId: string,
  ): Promise<BatchOperationResultDto> {
    return this.appointmentsService.batchCancel(dto, userId);
  }

  @Post('batch/confirm')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({
    summary: 'Confirmar em lote',
    description: 'Confirma múltiplos agendamentos de uma vez.',
  })
  @ApiBody({ type: BatchConfirmDto })
  @ApiResponse({ status: 200, description: 'Resultado da operação em lote', type: BatchOperationResultDto })
  async batchConfirm(
    @Body() dto: BatchConfirmDto,
    @CurrentUser('id') userId: string,
  ): Promise<BatchOperationResultDto> {
    return this.appointmentsService.batchConfirm(dto, userId);
  }
}
