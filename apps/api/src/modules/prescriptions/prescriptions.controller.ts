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
} from '@nestjs/swagger';
import { PrescriptionsService } from './prescriptions.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import {
  CreatePrescriptionDto,
  UpdatePrescriptionDto,
  SignPrescriptionDto,
  DispensePrescriptionDto,
  CancelPrescriptionDto,
  RenewPrescriptionDto,
  MedicationSearchDto,
  CheckInteractionsDto,
} from './dto/create-prescription.dto';
import {
  PrescriptionQueryDto,
  PatientPrescriptionsQueryDto,
  PrescriptionStatsQueryDto,
} from './dto/prescription-query.dto';
import {
  PrescriptionResponseDto,
  PrescriptionListResponseDto,
  MedicationSearchResponseDto,
  InteractionsCheckResponseDto,
  PatientMedicationsResponseDto,
  PrescriptionStatsResponseDto,
  PrescriptionDocumentResponseDto,
} from './dto/prescription-response.dto';
import { UserRole } from '@prisma/client';

@ApiTags('Prescriptions')
@Controller('prescriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class PrescriptionsController {
  private readonly logger = new Logger(PrescriptionsController.name);

  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  // ═══════════════════════════════════════════════════════════════════════════════
  // CRUD BÁSICO
  // ═══════════════════════════════════════════════════════════════════════════════

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Criar prescrição',
    description: 'Cria uma nova prescrição médica.',
  })
  @ApiBody({ type: CreatePrescriptionDto })
  @ApiResponse({ status: 201, description: 'Prescrição criada', type: PrescriptionResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou interações não reconhecidas' })
  async create(
    @Body() dto: CreatePrescriptionDto,
    @CurrentUser('id') userId: string,
  ): Promise<PrescriptionResponseDto> {
    return this.prescriptionsService.create(dto, userId);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
  @ApiOperation({
    summary: 'Listar prescrições',
    description: 'Lista prescrições com filtros e paginação.',
  })
  @ApiResponse({ status: 200, description: 'Lista de prescrições', type: PrescriptionListResponseDto })
  async findAll(@Query() query: PrescriptionQueryDto): Promise<PrescriptionListResponseDto> {
    return this.prescriptionsService.findAll(query);
  }

  @Get('medications/search')
  @Roles(UserRole.SUPER_ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  @ApiOperation({
    summary: 'Buscar medicamentos',
    description: 'Busca medicamentos no banco de dados.',
  })
  @ApiResponse({ status: 200, description: 'Resultados da busca', type: MedicationSearchResponseDto })
  async searchMedications(@Query() dto: MedicationSearchDto): Promise<MedicationSearchResponseDto> {
    return this.prescriptionsService.searchMedications(dto);
  }

  @Post('interactions/check')
  @Roles(UserRole.SUPER_ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  @ApiOperation({
    summary: 'Verificar interações',
    description: 'Verifica interações medicamentosas entre os medicamentos.',
  })
  @ApiBody({ type: CheckInteractionsDto })
  @ApiResponse({ status: 200, description: 'Resultado da verificação', type: InteractionsCheckResponseDto })
  async checkInteractions(@Body() dto: CheckInteractionsDto): Promise<InteractionsCheckResponseDto> {
    return this.prescriptionsService.checkInteractions(dto);
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Estatísticas de prescrições',
    description: 'Retorna estatísticas de prescrições.',
  })
  @ApiResponse({ status: 200, description: 'Estatísticas', type: PrescriptionStatsResponseDto })
  async getStats(@Query() query: PrescriptionStatsQueryDto): Promise<PrescriptionStatsResponseDto> {
    return this.prescriptionsService.getStats(query);
  }

  @Get('patient/:patientId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Medicamentos do paciente',
    description: 'Retorna medicamentos atuais e prescrições recentes do paciente.',
  })
  @ApiParam({ name: 'patientId', description: 'ID do paciente' })
  @ApiResponse({ status: 200, description: 'Medicamentos do paciente', type: PatientMedicationsResponseDto })
  async getPatientMedications(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query() query: PatientPrescriptionsQueryDto,
  ): Promise<PatientMedicationsResponseDto> {
    return this.prescriptionsService.getPatientMedications(patientId, query);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Obter prescrição por ID',
    description: 'Retorna os dados completos de uma prescrição.',
  })
  @ApiParam({ name: 'id', description: 'ID da prescrição' })
  @ApiResponse({ status: 200, description: 'Dados da prescrição', type: PrescriptionResponseDto })
  @ApiResponse({ status: 404, description: 'Prescrição não encontrada' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<PrescriptionResponseDto> {
    return this.prescriptionsService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Atualizar prescrição',
    description: 'Atualiza os dados de uma prescrição não assinada.',
  })
  @ApiParam({ name: 'id', description: 'ID da prescrição' })
  @ApiBody({ type: UpdatePrescriptionDto })
  @ApiResponse({ status: 200, description: 'Prescrição atualizada', type: PrescriptionResponseDto })
  @ApiResponse({ status: 400, description: 'Prescrição já assinada' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePrescriptionDto,
    @CurrentUser('id') userId: string,
  ): Promise<PrescriptionResponseDto> {
    return this.prescriptionsService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.DOCTOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Excluir prescrição',
    description: 'Exclui uma prescrição não assinada (soft delete).',
  })
  @ApiParam({ name: 'id', description: 'ID da prescrição' })
  @ApiResponse({ status: 204, description: 'Prescrição excluída' })
  @ApiResponse({ status: 400, description: 'Prescrição já assinada' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    await this.prescriptionsService.delete(id, userId);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ASSINATURA, DISPENSAÇÃO E CANCELAMENTO
  // ═══════════════════════════════════════════════════════════════════════════════

  @Post(':id/sign')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Assinar prescrição',
    description: 'Assina digitalmente a prescrição.',
  })
  @ApiParam({ name: 'id', description: 'ID da prescrição' })
  @ApiBody({ type: SignPrescriptionDto })
  @ApiResponse({ status: 200, description: 'Prescrição assinada', type: PrescriptionResponseDto })
  @ApiResponse({ status: 400, description: 'Prescrição já assinada ou interações não confirmadas' })
  @ApiResponse({ status: 403, description: 'Apenas o médico pode assinar' })
  async sign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SignPrescriptionDto,
    @CurrentUser('id') userId: string,
  ): Promise<PrescriptionResponseDto> {
    return this.prescriptionsService.sign(id, dto, userId);
  }

  @Post(':id/dispense')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN)
  @ApiOperation({
    summary: 'Registrar dispensação',
    description: 'Registra a dispensação de medicamentos da prescrição.',
  })
  @ApiParam({ name: 'id', description: 'ID da prescrição' })
  @ApiBody({ type: DispensePrescriptionDto })
  @ApiResponse({ status: 200, description: 'Dispensação registrada', type: PrescriptionResponseDto })
  @ApiResponse({ status: 400, description: 'Prescrição não assinada, expirada ou cancelada' })
  async dispense(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DispensePrescriptionDto,
    @CurrentUser('id') userId: string,
  ): Promise<PrescriptionResponseDto> {
    return this.prescriptionsService.dispense(id, dto, userId);
  }

  @Post(':id/cancel')
  @Roles(UserRole.SUPER_ADMIN, UserRole.DOCTOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Cancelar prescrição',
    description: 'Cancela uma prescrição.',
  })
  @ApiParam({ name: 'id', description: 'ID da prescrição' })
  @ApiBody({ type: CancelPrescriptionDto })
  @ApiResponse({ status: 204, description: 'Prescrição cancelada' })
  @ApiResponse({ status: 400, description: 'Prescrição já dispensada' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelPrescriptionDto,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    await this.prescriptionsService.cancel(id, dto, userId);
  }

  @Post(':id/renew')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Renovar prescrição',
    description: 'Cria uma nova prescrição baseada em uma existente.',
  })
  @ApiParam({ name: 'id', description: 'ID da prescrição original' })
  @ApiBody({ type: RenewPrescriptionDto })
  @ApiResponse({ status: 201, description: 'Nova prescrição criada', type: PrescriptionResponseDto })
  @ApiResponse({ status: 400, description: 'Prescrição original não está assinada' })
  async renew(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RenewPrescriptionDto,
    @CurrentUser('id') userId: string,
  ): Promise<PrescriptionResponseDto> {
    return this.prescriptionsService.renew(id, dto, userId);
  }

  @Post(':id/document')
  @Roles(UserRole.SUPER_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Gerar documento',
    description: 'Gera o documento PDF da prescrição.',
  })
  @ApiParam({ name: 'id', description: 'ID da prescrição' })
  @ApiResponse({ status: 200, description: 'Documento gerado', type: PrescriptionDocumentResponseDto })
  @ApiResponse({ status: 400, description: 'Prescrição não está assinada' })
  async generateDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<PrescriptionDocumentResponseDto> {
    return this.prescriptionsService.generateDocument(id, userId);
  }
}
