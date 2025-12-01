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
import {
  CreatePatientDto,
  UpdatePatientDto,
} from './dto/create-patient.dto';
import { PatientQueryDto, PatientStatsQueryDto } from './dto/patient-query.dto';
import { CreateVitalSignDto, VitalSignQueryDto } from './dto/vital-sign.dto';
import {
  PatientResponseDto,
  PatientListResponseDto,
  AvatarConfigResponseDto,
  PatientDocumentResponseDto,
  WearableConnectionResponseDto,
} from './dto/patient-response.dto';
import { UserRole } from '@prisma/client';

@ApiTags('Patients')
@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class PatientsController {
  private readonly logger = new Logger(PatientsController.name);

  constructor(private readonly patientsService: PatientsService) {}

  // ═══════════════════════════════════════════════════════════════════════════════
  // LISTAGEM E BUSCA
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
  @ApiOperation({
    summary: 'Listar pacientes',
    description: `
      Lista todos os pacientes com paginação e filtros.

      **Permissões:**
      - Admin/Médico/Enfermeiro/Recepcionista: Acesso total
      - Paciente: Não tem acesso a este endpoint

      **Filtros disponíveis:**
      - search: Busca por nome, CPF, telefone ou email
      - status: Filtra por status do usuário
      - gender: Filtra por gênero
      - bloodType: Filtra por tipo sanguíneo
      - healthInsuranceId: Filtra por convênio
      - hasAllergies: Filtra por presença de alergias
      - hasChronicConditions: Filtra por condições crônicas
      - ageMin/ageMax: Filtra por faixa etária
      - sortBy/sortOrder: Ordenação
    `,
  })
  @ApiResponse({ status: 200, description: 'Lista de pacientes', type: PatientListResponseDto })
  async findAll(
    @Query() query: PatientQueryDto,
    @CurrentUser('clinicId') clinicId?: string,
  ): Promise<PatientListResponseDto> {
    return this.patientsService.findAll(query, clinicId);
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Estatísticas de pacientes',
    description: 'Retorna estatísticas agregadas dos pacientes.',
  })
  @ApiResponse({ status: 200, description: 'Estatísticas' })
  async getStats(@Query() query: PatientStatsQueryDto) {
    return this.patientsService.getStats(query);
  }

  @Get('me')
  @Roles(UserRole.PATIENT)
  @ApiOperation({
    summary: 'Obter dados do paciente logado',
    description: 'Retorna os dados completos do paciente autenticado.',
  })
  @ApiResponse({ status: 200, description: 'Dados do paciente', type: PatientResponseDto })
  async getMyProfile(@CurrentUser('id') userId: string): Promise<PatientResponseDto> {
    return this.patientsService.findByUserId(userId) as any;
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  @ApiOperation({
    summary: 'Obter paciente por ID',
    description: 'Retorna os dados completos de um paciente específico.',
  })
  @ApiParam({ name: 'id', description: 'ID do paciente (UUID)' })
  @ApiResponse({ status: 200, description: 'Dados do paciente', type: PatientResponseDto })
  @ApiResponse({ status: 404, description: 'Paciente não encontrado' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<PatientResponseDto> {
    return this.patientsService.findById(id, userId) as any;
  }

  @Get('cpf/:cpf')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({
    summary: 'Buscar paciente por CPF',
    description: 'Busca um paciente pelo número do CPF.',
  })
  @ApiParam({ name: 'cpf', description: 'CPF do paciente' })
  @ApiResponse({ status: 200, description: 'Paciente encontrado ou não' })
  async findByCpf(@Param('cpf') cpf: string) {
    const patient = await this.patientsService.findByCpf(cpf);
    if (!patient) {
      return { found: false };
    }
    return { found: true, patient };
  }

  @Get('cns/:cns')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({
    summary: 'Buscar paciente por CNS',
    description: 'Busca um paciente pelo Cartão Nacional de Saúde.',
  })
  @ApiParam({ name: 'cns', description: 'CNS do paciente' })
  @ApiResponse({ status: 200, description: 'Paciente encontrado ou não' })
  async findByCns(@Param('cns') cns: string) {
    const patient = await this.patientsService.findByCns(cns);
    if (!patient) {
      return { found: false };
    }
    return { found: true, patient };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // CRIAÇÃO E ATUALIZAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════════

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({
    summary: 'Criar paciente',
    description: 'Cria um novo paciente no sistema. Este endpoint é para criação por admin/recepção.',
  })
  @ApiBody({ type: CreatePatientDto })
  @ApiResponse({ status: 201, description: 'Paciente criado', type: PatientResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'CPF ou CNS já cadastrado' })
  async create(
    @Body() dto: CreatePatientDto,
    @CurrentUser('id') userId: string,
  ): Promise<PatientResponseDto> {
    return this.patientsService.create(dto, userId) as any;
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Atualizar paciente',
    description: 'Atualiza os dados de um paciente.',
  })
  @ApiParam({ name: 'id', description: 'ID do paciente' })
  @ApiBody({ type: UpdatePatientDto })
  @ApiResponse({ status: 200, description: 'Paciente atualizado', type: PatientResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePatientDto,
    @CurrentUser('id') userId: string,
  ): Promise<PatientResponseDto> {
    return this.patientsService.update(id, dto, userId) as any;
  }

  @Patch('me')
  @Roles(UserRole.PATIENT)
  @ApiOperation({
    summary: 'Atualizar meu perfil',
    description: 'Permite que o paciente atualize seus próprios dados.',
  })
  @ApiBody({ type: UpdatePatientDto })
  @ApiResponse({ status: 200, description: 'Perfil atualizado', type: PatientResponseDto })
  async updateMyProfile(
    @Body() dto: UpdatePatientDto,
    @CurrentUser('id') userId: string,
  ): Promise<PatientResponseDto> {
    const patient = await this.patientsService.findByUserId(userId);
    return this.patientsService.update(patient.id, dto, userId) as any;
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
  ): Promise<void> {
    await this.patientsService.delete(id, userId);
  }

  @Post(':id/restore')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN)
  @ApiOperation({
    summary: 'Restaurar paciente',
    description: 'Restaura um paciente que foi removido.',
  })
  @ApiParam({ name: 'id', description: 'ID do paciente' })
  @ApiResponse({ status: 200, description: 'Paciente restaurado', type: PatientResponseDto })
  async restore(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<PatientResponseDto> {
    return this.patientsService.restore(id, userId) as any;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // SINAIS VITAIS
  // ═══════════════════════════════════════════════════════════════════════════════

  @Post(':id/vital-signs')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Registrar sinais vitais',
    description: `
      Registra novos sinais vitais para o paciente.

      **Triagem automática:**
      - RED: PA sistólica >180 ou <90, SpO2 <90, Glicose <70, FC >150 ou <40, Temp >40 ou <34
      - YELLOW: Valores moderadamente alterados
      - GREEN: Valores normais

      **Fontes aceitas:**
      - manual: Registro manual
      - healthkit: Apple HealthKit
      - googlefit: Google Fit
      - totem: Totem de autoatendimento
      - wearable: Dispositivo wearable
      - device: Dispositivo médico
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
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Histórico de sinais vitais',
    description: 'Retorna o histórico de sinais vitais do paciente.',
  })
  @ApiParam({ name: 'id', description: 'ID do paciente' })
  @ApiResponse({ status: 200, description: 'Histórico de sinais vitais' })
  async getVitalSignHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: VitalSignQueryDto,
  ) {
    return this.patientsService.getVitalSignHistory(id, query);
  }

  @Get(':id/vital-signs/latest')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Últimos sinais vitais',
    description: 'Retorna os sinais vitais mais recentes do paciente.',
  })
  @ApiParam({ name: 'id', description: 'ID do paciente' })
  @ApiResponse({ status: 200, description: 'Últimos sinais vitais' })
  async getLatestVitalSigns(@Param('id', ParseUUIDPipe) id: string) {
    return this.patientsService.getLatestVitalSigns(id);
  }

  @Get(':id/vital-signs/stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Estatísticas de sinais vitais',
    description: 'Retorna estatísticas agregadas dos sinais vitais.',
  })
  @ApiParam({ name: 'id', description: 'ID do paciente' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Estatísticas de sinais vitais' })
  async getVitalSignStats(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.patientsService.getVitalSignStats(
      id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // AVATAR 3D
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get(':id/avatar')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.PATIENT)
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
  @ApiResponse({ status: 200, description: 'Configuração do Avatar', type: AvatarConfigResponseDto })
  async getAvatarConfig(@Param('id', ParseUUIDPipe) id: string): Promise<AvatarConfigResponseDto> {
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

  // ═══════════════════════════════════════════════════════════════════════════════
  // DOCUMENTOS
  // ═══════════════════════════════════════════════════════════════════════════════

  @Post(':id/documents')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.PATIENT)
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
      required: ['file', 'type'],
      properties: {
        file: { type: 'string', format: 'binary' },
        type: { type: 'string', example: 'exam', description: 'Tipo do documento' },
        category: { type: 'string', example: 'blood_test', description: 'Categoria' },
        description: { type: 'string', description: 'Descrição' },
        validUntil: { type: 'string', format: 'date', description: 'Validade' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Documento enviado', type: PatientDocumentResponseDto })
  async uploadDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() metadata: { type: string; category?: string; description?: string; validUntil?: string },
    @CurrentUser('id') userId: string,
  ): Promise<PatientDocumentResponseDto> {
    return this.patientsService.uploadDocument(id, file, metadata, userId) as any;
  }

  @Get(':id/documents')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Listar documentos',
    description: 'Lista todos os documentos do paciente.',
  })
  @ApiParam({ name: 'id', description: 'ID do paciente' })
  @ApiQuery({ name: 'type', required: false, description: 'Filtrar por tipo' })
  @ApiQuery({ name: 'category', required: false, description: 'Filtrar por categoria' })
  @ApiResponse({ status: 200, description: 'Lista de documentos', type: [PatientDocumentResponseDto] })
  async getDocuments(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('type') type?: string,
    @Query('category') category?: string,
  ): Promise<PatientDocumentResponseDto[]> {
    return this.patientsService.getDocuments(id, { type, category }) as any;
  }

  @Delete(':id/documents/:documentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover documento',
    description: 'Remove um documento do paciente.',
  })
  @ApiParam({ name: 'id', description: 'ID do paciente' })
  @ApiParam({ name: 'documentId', description: 'ID do documento' })
  @ApiResponse({ status: 204, description: 'Documento removido' })
  async deleteDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    await this.patientsService.deleteDocument(id, documentId, userId);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // WEARABLES
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get(':id/wearables')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Listar conexões de wearables',
    description: 'Lista todas as conexões de dispositivos wearables do paciente.',
  })
  @ApiParam({ name: 'id', description: 'ID do paciente' })
  @ApiResponse({ status: 200, description: 'Lista de conexões', type: [WearableConnectionResponseDto] })
  async getWearableConnections(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<WearableConnectionResponseDto[]> {
    return this.patientsService.getWearableConnections(id);
  }

  @Post(':id/wearables/connect')
  @Roles(UserRole.PATIENT)
  @ApiOperation({
    summary: 'Conectar wearable',
    description: 'Conecta um dispositivo wearable à conta do paciente.',
  })
  @ApiParam({ name: 'id', description: 'ID do paciente' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['provider', 'accessToken'],
      properties: {
        provider: { type: 'string', example: 'healthkit', enum: ['healthkit', 'googlefit', 'fitbit', 'garmin'] },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Wearable conectado' })
  async connectWearable(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { provider: string; accessToken: string; refreshToken?: string },
  ) {
    await this.patientsService.connectWearable(
      id,
      body.provider,
      body.accessToken,
      body.refreshToken,
    );
    return { message: `${body.provider} conectado com sucesso` };
  }

  @Delete(':id/wearables/:provider')
  @Roles(UserRole.PATIENT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Desconectar wearable',
    description: 'Desconecta um dispositivo wearable da conta do paciente.',
  })
  @ApiParam({ name: 'id', description: 'ID do paciente' })
  @ApiParam({ name: 'provider', description: 'Provedor do wearable' })
  @ApiResponse({ status: 204, description: 'Wearable desconectado' })
  async disconnectWearable(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('provider') provider: string,
  ): Promise<void> {
    await this.patientsService.disconnectWearable(id, provider);
  }

  @Post(':id/wearables/sync')
  @Roles(UserRole.PATIENT)
  @ApiOperation({
    summary: 'Sincronizar dados de wearables',
    description: 'Sincroniza os dados de todos os wearables conectados.',
  })
  @ApiParam({ name: 'id', description: 'ID do paciente' })
  @ApiResponse({ status: 200, description: 'Dados sincronizados' })
  async syncWearableData(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.patientsService.syncWearableData(id);
    return {
      message: `${result.synced} registros sincronizados`,
      ...result,
    };
  }
}
