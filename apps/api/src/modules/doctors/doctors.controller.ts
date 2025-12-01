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
import { DoctorsService } from './doctors.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import {
  CreateDoctorDto,
  UpdateDoctorDto,
  BlockTimeSlotDto,
  VacationDto,
} from './dto/create-doctor.dto';
import { DoctorQueryDto, AvailableSlotsQueryDto, DoctorStatsQueryDto } from './dto/doctor-query.dto';
import {
  DoctorResponseDto,
  DoctorListResponseDto,
  AvailableSlotsResponseDto,
  DoctorStatsResponseDto,
  CrmValidationResponseDto,
} from './dto/doctor-response.dto';
import { UserRole } from '@prisma/client';

@ApiTags('Doctors')
@Controller('doctors')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class DoctorsController {
  private readonly logger = new Logger(DoctorsController.name);

  constructor(private readonly doctorsService: DoctorsService) {}

  // ═══════════════════════════════════════════════════════════════════════════════
  // LISTAGEM E BUSCA
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Listar médicos',
    description: `
      Lista todos os médicos com paginação e filtros.

      **Filtros disponíveis:**
      - search: Busca por nome, CRM ou especialidade
      - specialty: Filtra por especialidade
      - crmState: Filtra por estado do CRM
      - telemedicineEnabled: Filtra por disponibilidade de telemedicina
      - sortBy/sortOrder: Ordenação
    `,
  })
  @ApiResponse({ status: 200, description: 'Lista de médicos', type: DoctorListResponseDto })
  async findAll(
    @Query() query: DoctorQueryDto,
    @CurrentUser('clinicId') clinicId?: string,
  ): Promise<DoctorListResponseDto> {
    return this.doctorsService.findAll(query, clinicId) as any;
  }

  @Get('specialties')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Listar especialidades',
    description: 'Retorna lista de especialidades médicas disponíveis.',
  })
  @ApiResponse({ status: 200, description: 'Lista de especialidades' })
  async getSpecialties() {
    // Lista de especialidades reconhecidas pelo CFM
    return {
      specialties: [
        'Acupuntura',
        'Alergia e Imunologia',
        'Anestesiologia',
        'Angiologia',
        'Cardiologia',
        'Cirurgia Cardiovascular',
        'Cirurgia da Mão',
        'Cirurgia de Cabeça e Pescoço',
        'Cirurgia do Aparelho Digestivo',
        'Cirurgia Geral',
        'Cirurgia Oncológica',
        'Cirurgia Pediátrica',
        'Cirurgia Plástica',
        'Cirurgia Torácica',
        'Cirurgia Vascular',
        'Clínica Médica',
        'Coloproctologia',
        'Dermatologia',
        'Endocrinologia e Metabologia',
        'Endoscopia',
        'Gastroenterologia',
        'Genética Médica',
        'Geriatria',
        'Ginecologia e Obstetrícia',
        'Hematologia e Hemoterapia',
        'Homeopatia',
        'Infectologia',
        'Mastologia',
        'Medicina de Emergência',
        'Medicina de Família e Comunidade',
        'Medicina do Trabalho',
        'Medicina do Tráfego',
        'Medicina Esportiva',
        'Medicina Física e Reabilitação',
        'Medicina Intensiva',
        'Medicina Legal e Perícia Médica',
        'Medicina Nuclear',
        'Medicina Preventiva e Social',
        'Nefrologia',
        'Neurocirurgia',
        'Neurologia',
        'Nutrologia',
        'Oftalmologia',
        'Oncologia Clínica',
        'Ortopedia e Traumatologia',
        'Otorrinolaringologia',
        'Patologia',
        'Patologia Clínica/Medicina Laboratorial',
        'Pediatria',
        'Pneumologia',
        'Psiquiatria',
        'Radiologia e Diagnóstico por Imagem',
        'Radioterapia',
        'Reumatologia',
        'Urologia',
      ],
    };
  }

  @Get('me')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Obter dados do médico logado',
    description: 'Retorna os dados completos do médico autenticado.',
  })
  @ApiResponse({ status: 200, description: 'Dados do médico', type: DoctorResponseDto })
  async getMyProfile(@CurrentUser('id') userId: string): Promise<DoctorResponseDto> {
    return this.doctorsService.findByUserId(userId) as any;
  }

  @Get('validate-crm')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN)
  @ApiOperation({
    summary: 'Validar CRM',
    description: 'Valida um número de CRM junto ao CFM.',
  })
  @ApiQuery({ name: 'crm', required: true, description: 'Número do CRM' })
  @ApiQuery({ name: 'state', required: true, description: 'Estado do CRM (UF)' })
  @ApiResponse({ status: 200, description: 'Resultado da validação', type: CrmValidationResponseDto })
  async validateCrm(
    @Query('crm') crm: string,
    @Query('state') state: string,
  ): Promise<CrmValidationResponseDto> {
    return this.doctorsService.validateCrm(crm, state);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Obter médico por ID',
    description: 'Retorna os dados completos de um médico específico.',
  })
  @ApiParam({ name: 'id', description: 'ID do médico (UUID)' })
  @ApiResponse({ status: 200, description: 'Dados do médico', type: DoctorResponseDto })
  @ApiResponse({ status: 404, description: 'Médico não encontrado' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<DoctorResponseDto> {
    return this.doctorsService.findById(id) as any;
  }

  @Get('crm/:crm/:state')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({
    summary: 'Buscar médico por CRM',
    description: 'Busca um médico pelo número do CRM e estado.',
  })
  @ApiParam({ name: 'crm', description: 'Número do CRM' })
  @ApiParam({ name: 'state', description: 'Estado (UF)' })
  @ApiResponse({ status: 200, description: 'Médico encontrado ou não' })
  async findByCrm(
    @Param('crm') crm: string,
    @Param('state') state: string,
  ) {
    const doctor = await this.doctorsService.findByCrm(crm, state);
    if (!doctor) {
      return { found: false };
    }
    return { found: true, doctor };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // CRIAÇÃO E ATUALIZAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════════

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN)
  @ApiOperation({
    summary: 'Criar médico',
    description: 'Cria um novo médico no sistema. Este endpoint é para criação por admin.',
  })
  @ApiBody({ type: CreateDoctorDto })
  @ApiResponse({ status: 201, description: 'Médico criado', type: DoctorResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'CPF ou CRM já cadastrado' })
  async create(
    @Body() dto: CreateDoctorDto,
    @CurrentUser('id') userId: string,
  ): Promise<DoctorResponseDto> {
    return this.doctorsService.create(dto, userId) as any;
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Atualizar médico',
    description: 'Atualiza os dados de um médico.',
  })
  @ApiParam({ name: 'id', description: 'ID do médico' })
  @ApiBody({ type: UpdateDoctorDto })
  @ApiResponse({ status: 200, description: 'Médico atualizado', type: DoctorResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDoctorDto,
    @CurrentUser('id') userId: string,
  ): Promise<DoctorResponseDto> {
    return this.doctorsService.update(id, dto, userId) as any;
  }

  @Patch('me')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Atualizar meu perfil',
    description: 'Permite que o médico atualize seus próprios dados.',
  })
  @ApiBody({ type: UpdateDoctorDto })
  @ApiResponse({ status: 200, description: 'Perfil atualizado', type: DoctorResponseDto })
  async updateMyProfile(
    @Body() dto: UpdateDoctorDto,
    @CurrentUser('id') userId: string,
  ): Promise<DoctorResponseDto> {
    const doctor = await this.doctorsService.findByUserId(userId);
    return this.doctorsService.update(doctor.id, dto, userId) as any;
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover médico',
    description: 'Remove um médico (soft delete). Não pode ter consultas futuras agendadas.',
  })
  @ApiParam({ name: 'id', description: 'ID do médico' })
  @ApiResponse({ status: 204, description: 'Médico removido' })
  @ApiResponse({ status: 400, description: 'Não é possível remover médico com consultas agendadas' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    await this.doctorsService.delete(id, userId);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // AGENDA E DISPONIBILIDADE
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get(':id/available-slots')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Obter horários disponíveis',
    description: `
      Retorna os horários disponíveis para agendamento.

      **Parâmetros:**
      - startDate: Data inicial (default: hoje)
      - endDate: Data final (default: 7 dias a partir de startDate)
      - clinicId: Filtrar por clínica específica
      - telemedicineOnly: Apenas horários de telemedicina
      - duration: Duração do slot em minutos
    `,
  })
  @ApiParam({ name: 'id', description: 'ID do médico' })
  @ApiResponse({ status: 200, description: 'Horários disponíveis', type: AvailableSlotsResponseDto })
  async getAvailableSlots(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: AvailableSlotsQueryDto,
  ) {
    const slots = await this.doctorsService.getAvailableSlots(id, query);
    const doctor = await this.doctorsService.findById(id);

    return {
      doctorId: id,
      doctorName: doctor.fullName,
      slots,
      startDate: query.startDate || new Date().toISOString().split('T')[0],
      endDate: query.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };
  }

  @Post(':id/schedule/block')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Bloquear horário',
    description: 'Bloqueia um horário na agenda do médico.',
  })
  @ApiParam({ name: 'id', description: 'ID do médico' })
  @ApiBody({ type: BlockTimeSlotDto })
  @ApiResponse({ status: 200, description: 'Horário bloqueado' })
  async blockTimeSlot(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BlockTimeSlotDto,
    @CurrentUser('id') userId: string,
  ) {
    await this.doctorsService.blockTimeSlot(id, dto, userId);
    return { message: 'Horário bloqueado com sucesso' };
  }

  @Post(':id/schedule/vacation')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Configurar férias',
    description: 'Configura um período de férias para o médico.',
  })
  @ApiParam({ name: 'id', description: 'ID do médico' })
  @ApiBody({ type: VacationDto })
  @ApiResponse({ status: 200, description: 'Férias configuradas' })
  async setVacation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VacationDto,
    @CurrentUser('id') userId: string,
  ) {
    await this.doctorsService.setVacation(id, dto, userId);
    return { message: 'Férias configuradas com sucesso' };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ESTATÍSTICAS
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get(':id/stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Estatísticas do médico',
    description: 'Retorna estatísticas de atendimentos do médico.',
  })
  @ApiParam({ name: 'id', description: 'ID do médico' })
  @ApiResponse({ status: 200, description: 'Estatísticas', type: DoctorStatsResponseDto })
  async getStats(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DoctorStatsQueryDto,
  ): Promise<DoctorStatsResponseDto> {
    return this.doctorsService.getStats(id, query);
  }

  @Get('me/stats')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Minhas estatísticas',
    description: 'Retorna estatísticas do médico logado.',
  })
  @ApiResponse({ status: 200, description: 'Estatísticas', type: DoctorStatsResponseDto })
  async getMyStats(
    @CurrentUser('id') userId: string,
    @Query() query: DoctorStatsQueryDto,
  ): Promise<DoctorStatsResponseDto> {
    const doctor = await this.doctorsService.findByUserId(userId);
    return this.doctorsService.getStats(doctor.id, query);
  }
}
