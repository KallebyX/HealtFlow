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
import { ConsultationsService } from './consultations.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import {
  CreateConsultationDto,
  UpdateConsultationDto,
  SignConsultationDto,
  AmendConsultationDto,
} from './dto/create-consultation.dto';
import {
  ConsultationQueryDto,
  PatientHistoryQueryDto,
  DiagnosisSearchQueryDto,
  ConsultationStatsQueryDto,
  MedicalRecordExportQueryDto,
} from './dto/consultation-query.dto';
import {
  ConsultationResponseDto,
  ConsultationListResponseDto,
  PatientHistoryResponseDto,
  DiagnosisSearchResponseDto,
  ConsultationStatsResponseDto,
  MedicalRecordExportResponseDto,
  PatientTimelineResponseDto,
} from './dto/consultation-response.dto';
import { UserRole } from '@prisma/client';

@ApiTags('Consultations')
@Controller('consultations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ConsultationsController {
  private readonly logger = new Logger(ConsultationsController.name);

  constructor(private readonly consultationsService: ConsultationsService) {}

  // ═══════════════════════════════════════════════════════════════════════════════
  // CRUD BÁSICO
  // ═══════════════════════════════════════════════════════════════════════════════

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Criar consulta',
    description: 'Cria um novo registro de consulta médica.',
  })
  @ApiBody({ type: CreateConsultationDto })
  @ApiResponse({ status: 201, description: 'Consulta criada', type: ConsultationResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou consulta já existe' })
  async create(
    @Body() dto: CreateConsultationDto,
    @CurrentUser('id') userId: string,
  ): Promise<ConsultationResponseDto> {
    return this.consultationsService.create(dto, userId);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  @ApiOperation({
    summary: 'Listar consultas',
    description: 'Lista consultas com filtros e paginação.',
  })
  @ApiResponse({ status: 200, description: 'Lista de consultas', type: ConsultationListResponseDto })
  async findAll(@Query() query: ConsultationQueryDto): Promise<ConsultationListResponseDto> {
    return this.consultationsService.findAll(query);
  }

  @Get('diagnoses/search')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  @ApiOperation({
    summary: 'Buscar diagnósticos CID-10',
    description: 'Busca diagnósticos pelo código ou descrição CID-10.',
  })
  @ApiResponse({ status: 200, description: 'Resultados da busca', type: DiagnosisSearchResponseDto })
  async searchDiagnoses(@Query() query: DiagnosisSearchQueryDto): Promise<DiagnosisSearchResponseDto> {
    return this.consultationsService.searchDiagnoses(query);
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Estatísticas de consultas',
    description: 'Retorna estatísticas de consultas.',
  })
  @ApiResponse({ status: 200, description: 'Estatísticas', type: ConsultationStatsResponseDto })
  async getStats(@Query() query: ConsultationStatsQueryDto): Promise<ConsultationStatsResponseDto> {
    return this.consultationsService.getStats(query);
  }

  @Get('patient/:patientId/history')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Histórico do paciente',
    description: 'Retorna o histórico completo de consultas de um paciente.',
  })
  @ApiParam({ name: 'patientId', description: 'ID do paciente' })
  @ApiResponse({ status: 200, description: 'Histórico do paciente', type: PatientHistoryResponseDto })
  async getPatientHistory(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query() query: Omit<PatientHistoryQueryDto, 'patientId'>,
  ): Promise<PatientHistoryResponseDto> {
    return this.consultationsService.getPatientHistory({ ...query, patientId });
  }

  @Get('patient/:patientId/timeline')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Timeline do paciente',
    description: 'Retorna a timeline de eventos médicos do paciente.',
  })
  @ApiParam({ name: 'patientId', description: 'ID do paciente' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Data de início' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Data de fim' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de eventos' })
  @ApiResponse({ status: 200, description: 'Timeline do paciente', type: PatientTimelineResponseDto })
  async getPatientTimeline(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
  ): Promise<PatientTimelineResponseDto> {
    return this.consultationsService.getPatientTimeline(patientId, startDate, endDate, limit);
  }

  @Post('patient/:patientId/export')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Exportar prontuário',
    description: 'Exporta o prontuário médico do paciente.',
  })
  @ApiParam({ name: 'patientId', description: 'ID do paciente' })
  @ApiBody({ type: MedicalRecordExportQueryDto })
  @ApiResponse({ status: 200, description: 'Exportação iniciada', type: MedicalRecordExportResponseDto })
  async exportMedicalRecord(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() query: Omit<MedicalRecordExportQueryDto, 'patientId'>,
    @CurrentUser('id') userId: string,
  ): Promise<MedicalRecordExportResponseDto> {
    return this.consultationsService.exportMedicalRecord({ ...query, patientId }, userId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Obter consulta por ID',
    description: 'Retorna os dados completos de uma consulta.',
  })
  @ApiParam({ name: 'id', description: 'ID da consulta' })
  @ApiResponse({ status: 200, description: 'Dados da consulta', type: ConsultationResponseDto })
  @ApiResponse({ status: 404, description: 'Consulta não encontrada' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<ConsultationResponseDto> {
    return this.consultationsService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Atualizar consulta',
    description: 'Atualiza os dados de uma consulta não assinada.',
  })
  @ApiParam({ name: 'id', description: 'ID da consulta' })
  @ApiBody({ type: UpdateConsultationDto })
  @ApiResponse({ status: 200, description: 'Consulta atualizada', type: ConsultationResponseDto })
  @ApiResponse({ status: 400, description: 'Consulta já assinada' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateConsultationDto,
    @CurrentUser('id') userId: string,
  ): Promise<ConsultationResponseDto> {
    return this.consultationsService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.DOCTOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Excluir consulta',
    description: 'Exclui uma consulta não assinada (soft delete).',
  })
  @ApiParam({ name: 'id', description: 'ID da consulta' })
  @ApiResponse({ status: 204, description: 'Consulta excluída' })
  @ApiResponse({ status: 400, description: 'Consulta já assinada' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    await this.consultationsService.delete(id, userId);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ASSINATURA E RETIFICAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════════

  @Post(':id/sign')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Assinar consulta',
    description: 'Assina digitalmente a consulta, tornando-a imutável.',
  })
  @ApiParam({ name: 'id', description: 'ID da consulta' })
  @ApiBody({ type: SignConsultationDto })
  @ApiResponse({ status: 200, description: 'Consulta assinada', type: ConsultationResponseDto })
  @ApiResponse({ status: 400, description: 'Consulta já assinada ou dados incompletos' })
  @ApiResponse({ status: 403, description: 'Apenas o médico da consulta pode assinar' })
  async sign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SignConsultationDto,
    @CurrentUser('id') userId: string,
  ): Promise<ConsultationResponseDto> {
    return this.consultationsService.sign(id, dto, userId);
  }

  @Post(':id/amend')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Retificar consulta',
    description: 'Retifica uma consulta já assinada, mantendo histórico.',
  })
  @ApiParam({ name: 'id', description: 'ID da consulta' })
  @ApiBody({ type: AmendConsultationDto })
  @ApiResponse({ status: 200, description: 'Consulta retificada', type: ConsultationResponseDto })
  @ApiResponse({ status: 400, description: 'Consulta não está assinada' })
  @ApiResponse({ status: 403, description: 'Apenas o médico da consulta pode retificar' })
  async amend(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AmendConsultationDto,
    @CurrentUser('id') userId: string,
  ): Promise<ConsultationResponseDto> {
    return this.consultationsService.amend(id, dto, userId);
  }
}
