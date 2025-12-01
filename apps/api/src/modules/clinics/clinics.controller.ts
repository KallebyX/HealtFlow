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
import { ClinicsService } from './clinics.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import {
  CreateClinicDto,
  UpdateClinicDto,
  AddDoctorToClinicDto,
  AddPatientToClinicDto,
  RoomDto,
} from './dto/create-clinic.dto';
import { ClinicQueryDto, ClinicStatsQueryDto, ClinicDoctorsQueryDto, ClinicPatientsQueryDto } from './dto/clinic-query.dto';
import {
  ClinicResponseDto,
  ClinicListResponseDto,
  ClinicStatsResponseDto,
  ClinicDoctorResponseDto,
  ClinicPatientResponseDto,
  RoomResponseDto,
} from './dto/clinic-response.dto';
import { UserRole } from '@prisma/client';

@ApiTags('Clinics')
@Controller('clinics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ClinicsController {
  private readonly logger = new Logger(ClinicsController.name);

  constructor(private readonly clinicsService: ClinicsService) {}

  // ═══════════════════════════════════════════════════════════════════════════════
  // LISTAGEM E BUSCA
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Listar clínicas',
    description: 'Lista todas as clínicas com paginação e filtros.',
  })
  @ApiResponse({ status: 200, description: 'Lista de clínicas', type: ClinicListResponseDto })
  async findAll(@Query() query: ClinicQueryDto): Promise<ClinicListResponseDto> {
    return this.clinicsService.findAll(query) as any;
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Obter clínica por ID',
    description: 'Retorna os dados completos de uma clínica.',
  })
  @ApiParam({ name: 'id', description: 'ID da clínica' })
  @ApiResponse({ status: 200, description: 'Dados da clínica', type: ClinicResponseDto })
  @ApiResponse({ status: 404, description: 'Clínica não encontrada' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<ClinicResponseDto> {
    return this.clinicsService.findById(id) as any;
  }

  @Get('cnpj/:cnpj')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN)
  @ApiOperation({
    summary: 'Buscar clínica por CNPJ',
    description: 'Busca uma clínica pelo CNPJ.',
  })
  @ApiParam({ name: 'cnpj', description: 'CNPJ da clínica' })
  @ApiResponse({ status: 200, description: 'Clínica encontrada ou não' })
  async findByCnpj(@Param('cnpj') cnpj: string) {
    const clinic = await this.clinicsService.findByCnpj(cnpj);
    if (!clinic) {
      return { found: false };
    }
    return { found: true, clinic };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // CRIAÇÃO E ATUALIZAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════════

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Criar clínica',
    description: 'Cria uma nova clínica no sistema.',
  })
  @ApiBody({ type: CreateClinicDto })
  @ApiResponse({ status: 201, description: 'Clínica criada', type: ClinicResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'CNPJ ou CNES já cadastrado' })
  async create(
    @Body() dto: CreateClinicDto,
    @CurrentUser('id') userId: string,
  ): Promise<ClinicResponseDto> {
    return this.clinicsService.create(dto, userId) as any;
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN)
  @ApiOperation({
    summary: 'Atualizar clínica',
    description: 'Atualiza os dados de uma clínica.',
  })
  @ApiParam({ name: 'id', description: 'ID da clínica' })
  @ApiBody({ type: UpdateClinicDto })
  @ApiResponse({ status: 200, description: 'Clínica atualizada', type: ClinicResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClinicDto,
    @CurrentUser('id') userId: string,
  ): Promise<ClinicResponseDto> {
    return this.clinicsService.update(id, dto, userId) as any;
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover clínica',
    description: 'Remove uma clínica (soft delete).',
  })
  @ApiParam({ name: 'id', description: 'ID da clínica' })
  @ApiResponse({ status: 204, description: 'Clínica removida' })
  @ApiResponse({ status: 400, description: 'Não é possível remover clínica com consultas agendadas' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    await this.clinicsService.delete(id, userId);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // MÉDICOS DA CLÍNICA
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get(':id/doctors')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Listar médicos da clínica',
    description: 'Lista todos os médicos vinculados à clínica.',
  })
  @ApiParam({ name: 'id', description: 'ID da clínica' })
  @ApiResponse({ status: 200, description: 'Lista de médicos' })
  async getDoctors(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ClinicDoctorsQueryDto,
  ) {
    return this.clinicsService.getDoctors(id, query);
  }

  @Post(':id/doctors')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN)
  @ApiOperation({
    summary: 'Vincular médico à clínica',
    description: 'Adiciona um médico ao corpo clínico.',
  })
  @ApiParam({ name: 'id', description: 'ID da clínica' })
  @ApiBody({ type: AddDoctorToClinicDto })
  @ApiResponse({ status: 201, description: 'Médico vinculado', type: ClinicDoctorResponseDto })
  async addDoctor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddDoctorToClinicDto,
    @CurrentUser('id') userId: string,
  ): Promise<ClinicDoctorResponseDto> {
    return this.clinicsService.addDoctor(id, dto, userId);
  }

  @Delete(':id/doctors/:doctorId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Desvincular médico da clínica',
    description: 'Remove um médico do corpo clínico.',
  })
  @ApiParam({ name: 'id', description: 'ID da clínica' })
  @ApiParam({ name: 'doctorId', description: 'ID do médico' })
  @ApiResponse({ status: 204, description: 'Médico desvinculado' })
  async removeDoctor(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('doctorId', ParseUUIDPipe) doctorId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    await this.clinicsService.removeDoctor(id, doctorId, userId);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // PACIENTES DA CLÍNICA
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get(':id/patients')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
  @ApiOperation({
    summary: 'Listar pacientes da clínica',
    description: 'Lista todos os pacientes cadastrados na clínica.',
  })
  @ApiParam({ name: 'id', description: 'ID da clínica' })
  @ApiResponse({ status: 200, description: 'Lista de pacientes' })
  async getPatients(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ClinicPatientsQueryDto,
  ) {
    return this.clinicsService.getPatients(id, query);
  }

  @Post(':id/patients')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({
    summary: 'Vincular paciente à clínica',
    description: 'Adiciona um paciente ao cadastro da clínica.',
  })
  @ApiParam({ name: 'id', description: 'ID da clínica' })
  @ApiBody({ type: AddPatientToClinicDto })
  @ApiResponse({ status: 201, description: 'Paciente vinculado', type: ClinicPatientResponseDto })
  async addPatient(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddPatientToClinicDto,
    @CurrentUser('id') userId: string,
  ): Promise<ClinicPatientResponseDto> {
    return this.clinicsService.addPatient(id, dto, userId);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // SALAS/CONSULTÓRIOS
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get(':id/rooms')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
  @ApiOperation({
    summary: 'Listar salas da clínica',
    description: 'Lista todas as salas/consultórios da clínica.',
  })
  @ApiParam({ name: 'id', description: 'ID da clínica' })
  @ApiResponse({ status: 200, description: 'Lista de salas', type: [RoomResponseDto] })
  async getRooms(@Param('id', ParseUUIDPipe) id: string): Promise<RoomResponseDto[]> {
    return this.clinicsService.getRooms(id);
  }

  @Post(':id/rooms')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN)
  @ApiOperation({
    summary: 'Criar sala',
    description: 'Adiciona uma nova sala/consultório à clínica.',
  })
  @ApiParam({ name: 'id', description: 'ID da clínica' })
  @ApiBody({ type: RoomDto })
  @ApiResponse({ status: 201, description: 'Sala criada', type: RoomResponseDto })
  async addRoom(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RoomDto,
    @CurrentUser('id') userId: string,
  ): Promise<RoomResponseDto> {
    return this.clinicsService.addRoom(id, dto, userId);
  }

  @Put(':id/rooms/:roomId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN)
  @ApiOperation({
    summary: 'Atualizar sala',
    description: 'Atualiza os dados de uma sala/consultório.',
  })
  @ApiParam({ name: 'id', description: 'ID da clínica' })
  @ApiParam({ name: 'roomId', description: 'ID da sala' })
  @ApiBody({ type: RoomDto })
  @ApiResponse({ status: 200, description: 'Sala atualizada', type: RoomResponseDto })
  async updateRoom(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Body() dto: Partial<RoomDto>,
    @CurrentUser('id') userId: string,
  ): Promise<RoomResponseDto> {
    return this.clinicsService.updateRoom(id, roomId, dto, userId);
  }

  @Delete(':id/rooms/:roomId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Desativar sala',
    description: 'Desativa uma sala/consultório.',
  })
  @ApiParam({ name: 'id', description: 'ID da clínica' })
  @ApiParam({ name: 'roomId', description: 'ID da sala' })
  @ApiResponse({ status: 204, description: 'Sala desativada' })
  async deleteRoom(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    await this.clinicsService.deleteRoom(id, roomId, userId);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ESTATÍSTICAS
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get(':id/stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Estatísticas da clínica',
    description: 'Retorna estatísticas de atendimentos da clínica.',
  })
  @ApiParam({ name: 'id', description: 'ID da clínica' })
  @ApiResponse({ status: 200, description: 'Estatísticas', type: ClinicStatsResponseDto })
  async getStats(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ClinicStatsQueryDto,
  ): Promise<ClinicStatsResponseDto> {
    return this.clinicsService.getStats(id, query);
  }
}
