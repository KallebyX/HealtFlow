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
import { LaboratoryService } from './laboratory.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole } from '@/common/enums/user-role.enum';

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
import {
  LabOrderResponseDto,
  LabOrderListResponseDto,
  LabResultResponseDto,
  LabResultListResponseDto,
  LabTestCatalogListDto,
  PatientLabHistoryResponseDto,
  CollectionScheduleResponseDto,
  WorklistResponseDto,
  CriticalValuesResponseDto,
  LabStatisticsResponseDto,
  ExternalLabListResponseDto,
  PreparationInstructionsResponseDto,
} from './dto/lab-response.dto';

@ApiTags('Laboratory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('laboratory')
export class LaboratoryController {
  constructor(private readonly laboratoryService: LaboratoryService) {}

  // ==================== Pedidos de Exame ====================

  @Post('orders')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Criar pedido de exame' })
  @ApiResponse({ status: 201, description: 'Pedido criado', type: LabOrderResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Paciente/Médico não encontrado' })
  async createLabOrder(
    @Body() dto: CreateLabOrderDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.laboratoryService.createLabOrder(dto, userId, userRole);
  }

  @Get('orders')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.LAB_TECHNICIAN, UserRole.PATIENT)
  @ApiOperation({ summary: 'Listar pedidos de exame' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos', type: LabOrderListResponseDto })
  async findAllLabOrders(
    @Query() query: LabOrderQueryDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.laboratoryService.findAllLabOrders(query, userId, userRole);
  }

  @Get('orders/:id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.LAB_TECHNICIAN, UserRole.PATIENT)
  @ApiOperation({ summary: 'Buscar pedido de exame por ID' })
  @ApiParam({ name: 'id', description: 'ID do pedido' })
  @ApiResponse({ status: 200, description: 'Pedido encontrado', type: LabOrderResponseDto })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  async findLabOrderById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.laboratoryService.findLabOrderById(id, userId, userRole);
  }

  @Put('orders/:id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Atualizar pedido de exame' })
  @ApiParam({ name: 'id', description: 'ID do pedido' })
  @ApiResponse({ status: 200, description: 'Pedido atualizado', type: LabOrderResponseDto })
  @ApiResponse({ status: 400, description: 'Pedido não pode ser editado' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  async updateLabOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLabOrderDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.laboratoryService.updateLabOrder(id, dto, userId, userRole);
  }

  @Delete('orders/:id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar pedido de exame' })
  @ApiParam({ name: 'id', description: 'ID do pedido' })
  @ApiQuery({ name: 'reason', description: 'Motivo do cancelamento', required: true })
  @ApiResponse({ status: 200, description: 'Pedido cancelado', type: LabOrderResponseDto })
  @ApiResponse({ status: 400, description: 'Pedido não pode ser cancelado' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  async cancelLabOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('reason') reason: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.laboratoryService.cancelLabOrder(id, reason, userId, userRole);
  }

  // ==================== Agendamento de Coleta ====================

  @Post('collection/schedule')
  @Roles(UserRole.ADMIN, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.LAB_TECHNICIAN)
  @ApiOperation({ summary: 'Agendar coleta de exame' })
  @ApiResponse({ status: 201, description: 'Coleta agendada', type: LabOrderResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Conflito de horário' })
  async scheduleCollection(
    @Body() dto: ScheduleCollectionDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.laboratoryService.scheduleCollection(dto, userId, userRole);
  }

  @Put('collection/reschedule/:orderId')
  @Roles(UserRole.ADMIN, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.LAB_TECHNICIAN)
  @ApiOperation({ summary: 'Reagendar coleta de exame' })
  @ApiParam({ name: 'orderId', description: 'ID do pedido' })
  @ApiResponse({ status: 200, description: 'Coleta reagendada', type: LabOrderResponseDto })
  async rescheduleCollection(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() body: { newDateTime: string; reason: string },
    @CurrentUser('id') userId: string,
  ) {
    return this.laboratoryService.rescheduleCollection(orderId, body.newDateTime, body.reason, userId);
  }

  @Get('collection/schedule')
  @Roles(UserRole.ADMIN, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.LAB_TECHNICIAN)
  @ApiOperation({ summary: 'Consultar agenda de coletas' })
  @ApiResponse({ status: 200, description: 'Agenda de coletas', type: CollectionScheduleResponseDto })
  async getCollectionSchedule(
    @Query() query: CollectionScheduleQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.laboratoryService.getCollectionSchedule(query, userId);
  }

  // ==================== Registro de Coleta ====================

  @Post('collection/register')
  @Roles(UserRole.ADMIN, UserRole.NURSE, UserRole.LAB_TECHNICIAN)
  @ApiOperation({ summary: 'Registrar coleta de amostra' })
  @ApiResponse({ status: 201, description: 'Coleta registrada', type: LabOrderResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Código de barras duplicado' })
  async registerSampleCollection(
    @Body() dto: RegisterSampleCollectionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.laboratoryService.registerSampleCollection(dto, userId);
  }

  @Post('sample/reject')
  @Roles(UserRole.ADMIN, UserRole.LAB_TECHNICIAN)
  @ApiOperation({ summary: 'Rejeitar amostra' })
  @ApiResponse({ status: 201, description: 'Amostra rejeitada' })
  async rejectSample(
    @Body() dto: RejectSampleDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.laboratoryService.rejectSample(dto, userId);
  }

  // ==================== Resultados ====================

  @Post('results')
  @Roles(UserRole.ADMIN, UserRole.LAB_TECHNICIAN)
  @ApiOperation({ summary: 'Registrar resultado de exame' })
  @ApiResponse({ status: 201, description: 'Resultado registrado', type: LabResultResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Resultado já existe' })
  async registerLabResult(
    @Body() dto: RegisterLabResultDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.laboratoryService.registerLabResult(dto, userId);
  }

  @Post('results/validate')
  @Roles(UserRole.ADMIN, UserRole.LAB_TECHNICIAN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Validar resultado de exame' })
  @ApiResponse({ status: 200, description: 'Resultado validado' })
  @ApiResponse({ status: 400, description: 'Resultado já validado' })
  async validateLabResult(
    @Body() dto: ValidateResultDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.laboratoryService.validateLabResult(dto, userId);
  }

  @Get('results')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.LAB_TECHNICIAN, UserRole.PATIENT)
  @ApiOperation({ summary: 'Listar resultados de exames' })
  @ApiResponse({ status: 200, description: 'Lista de resultados', type: LabResultListResponseDto })
  async findAllLabResults(
    @Query() query: LabResultQueryDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    // Implementar método se necessário
    return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
  }

  // ==================== Worklist ====================

  @Get('worklist')
  @Roles(UserRole.ADMIN, UserRole.LAB_TECHNICIAN)
  @ApiOperation({ summary: 'Obter worklist de análises' })
  @ApiResponse({ status: 200, description: 'Worklist', type: WorklistResponseDto })
  async getWorklist(
    @Query() query: WorklistQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.laboratoryService.getWorklist(query, userId);
  }

  // ==================== Valores Críticos ====================

  @Get('critical-values')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.LAB_TECHNICIAN)
  @ApiOperation({ summary: 'Listar valores críticos' })
  @ApiResponse({ status: 200, description: 'Valores críticos', type: CriticalValuesResponseDto })
  async getCriticalValues(
    @Query() query: CriticalValuesQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.laboratoryService.getCriticalValues(query, userId);
  }

  @Post('critical-values/:resultId/acknowledge')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Confirmar recebimento de valor crítico' })
  @ApiParam({ name: 'resultId', description: 'ID do resultado' })
  async acknowledgeCriticalValue(
    @Param('resultId', ParseUUIDPipe) resultId: string,
    @Body() body: { notes?: string },
    @CurrentUser('id') userId: string,
  ) {
    return this.laboratoryService.acknowledgeCriticalValue(resultId, body.notes || '', userId);
  }

  @Post('critical-values/:resultId/notify-doctor')
  @Roles(UserRole.ADMIN, UserRole.LAB_TECHNICIAN)
  @ApiOperation({ summary: 'Notificar médico sobre valor crítico' })
  @ApiParam({ name: 'resultId', description: 'ID do resultado' })
  async notifyDoctorCriticalValue(
    @Param('resultId', ParseUUIDPipe) resultId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.laboratoryService.notifyDoctorCriticalValue(resultId, userId);
  }

  // ==================== Histórico do Paciente ====================

  @Get('patients/:patientId/history')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.PATIENT)
  @ApiOperation({ summary: 'Histórico de exames do paciente' })
  @ApiParam({ name: 'patientId', description: 'ID do paciente' })
  @ApiResponse({ status: 200, description: 'Histórico de exames', type: PatientLabHistoryResponseDto })
  async getPatientLabHistory(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query() query: PatientLabHistoryQueryDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.laboratoryService.getPatientLabHistory(patientId, query, userId, userRole);
  }

  @Get('patients/:patientId/tests/:testCode/evolution')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.PATIENT)
  @ApiOperation({ summary: 'Evolução de exame específico do paciente' })
  @ApiParam({ name: 'patientId', description: 'ID do paciente' })
  @ApiParam({ name: 'testCode', description: 'Código do exame' })
  @ApiQuery({ name: 'parameterName', description: 'Nome do parâmetro específico', required: false })
  async getTestEvolution(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('testCode') testCode: string,
    @Query('parameterName') parameterName?: string,
  ) {
    return this.laboratoryService.getTestEvolution(patientId, testCode, parameterName);
  }

  // ==================== Catálogo de Exames ====================

  @Get('catalog')
  @ApiOperation({ summary: 'Consultar catálogo de exames' })
  @ApiResponse({ status: 200, description: 'Catálogo de exames', type: LabTestCatalogListDto })
  async getTestCatalog(@Query() query: LabTestCatalogQueryDto) {
    return this.laboratoryService.getTestCatalog(query);
  }

  @Get('catalog/:testCode')
  @ApiOperation({ summary: 'Detalhes de exame do catálogo' })
  @ApiParam({ name: 'testCode', description: 'Código do exame' })
  async getTestDetails(@Param('testCode') testCode: string) {
    return this.laboratoryService.getTestDetails(testCode);
  }

  @Post('catalog/preparation-instructions')
  @ApiOperation({ summary: 'Instruções de preparo para exames' })
  @ApiResponse({ status: 200, description: 'Instruções de preparo', type: [PreparationInstructionsResponseDto] })
  async getPreparationInstructions(@Body() body: { testCodes: string[] }) {
    return this.laboratoryService.getPreparationInstructions(body.testCodes);
  }

  // ==================== Laboratório Externo ====================

  @Post('external/send')
  @Roles(UserRole.ADMIN, UserRole.LAB_TECHNICIAN)
  @ApiOperation({ summary: 'Enviar pedido para laboratório externo' })
  @ApiResponse({ status: 201, description: 'Pedido enviado', type: LabOrderResponseDto })
  async sendToExternalLab(
    @Body() dto: ExternalLabOrderDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.laboratoryService.sendToExternalLab(dto, userId);
  }

  @Get('external/labs')
  @Roles(UserRole.ADMIN, UserRole.LAB_TECHNICIAN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Listar laboratórios externos' })
  @ApiResponse({ status: 200, description: 'Lista de laboratórios', type: ExternalLabListResponseDto })
  async getExternalLabs(@Query('activeOnly') activeOnly?: boolean) {
    return this.laboratoryService.getExternalLabs(activeOnly);
  }

  // ==================== Estatísticas ====================

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.LAB_TECHNICIAN)
  @ApiOperation({ summary: 'Estatísticas do laboratório' })
  @ApiResponse({ status: 200, description: 'Estatísticas', type: LabStatisticsResponseDto })
  async getStatistics(
    @Query() query: LabStatisticsQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.laboratoryService.getStatistics(query, userId);
  }

  // ==================== Relatórios ====================

  @Get('orders/:id/report')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.LAB_TECHNICIAN, UserRole.PATIENT)
  @ApiOperation({ summary: 'Gerar relatório do pedido de exame' })
  @ApiParam({ name: 'id', description: 'ID do pedido' })
  async generateOrderReport(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    // Implementar geração de PDF
    const order = await this.laboratoryService.findLabOrderById(id, userId, userRole);
    return {
      message: 'Relatório gerado',
      orderId: id,
      orderNumber: order.orderNumber,
      // reportUrl: await this.generatePdfReport(order),
    };
  }

  @Get('patients/:patientId/report')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  @ApiOperation({ summary: 'Gerar relatório consolidado do paciente' })
  @ApiParam({ name: 'patientId', description: 'ID do paciente' })
  @ApiQuery({ name: 'startDate', description: 'Data inicial', required: false })
  @ApiQuery({ name: 'endDate', description: 'Data final', required: false })
  async generatePatientReport(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser('id') userId?: string,
    @CurrentUser('role') userRole?: UserRole,
  ) {
    // Implementar geração de relatório consolidado
    return {
      message: 'Relatório consolidado gerado',
      patientId,
      period: { startDate, endDate },
      // reportUrl: await this.generateConsolidatedReport(patientId, startDate, endDate),
    };
  }
}
