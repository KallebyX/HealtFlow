import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { RndsService } from './rnds.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole } from '../../auth/enums/user-role.enum';
import {
  ValidateCNSDto,
  ValidateCPFDto,
  SearchPatientDto,
  RNDSCredentialsDto,
  LabResultRNDSDto,
  ImmunizationRNDSDto,
  ClinicalEncounterRNDSDto,
  DischargeSummaryRNDSDto,
  CovidCertificateRNDSDto,
  RNDSEnvironment,
  RNDSDocumentType,
  SyncStatusQueryDto,
  RetrySyncDto,
} from './dto';

// ============================================================
// RNDS CONTROLLER - Rede Nacional de Dados em Saúde
// Controller completo para integração com o barramento do
// Ministério da Saúde do Brasil (DATASUS)
// ============================================================

@ApiTags('RNDS - Rede Nacional de Dados em Saúde')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('integrations/rnds')
export class RndsController {
  constructor(private readonly rndsService: RndsService) {}

  // ============================================================
  // AUTENTICAÇÃO E CONFIGURAÇÃO
  // ============================================================

  @Post('auth/token')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obter token de acesso RNDS',
    description: 'Autentica no barramento RNDS usando certificado digital e obtém token OAuth 2.0',
  })
  @ApiBody({ type: RNDSCredentialsDto })
  @ApiResponse({
    status: 200,
    description: 'Token obtido com sucesso',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
        token_type: { type: 'string', example: 'Bearer' },
        expires_in: { type: 'number', example: 3600 },
        scope: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Certificado inválido ou expirado' })
  @ApiResponse({ status: 503, description: 'Serviço RNDS indisponível' })
  async authenticate(
    @Body() credentials: RNDSCredentialsDto,
    @CurrentUser() user: any,
  ) {
    return this.rndsService.authenticate(credentials, user.id);
  }

  @Get('auth/status')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Verificar status da autenticação RNDS',
    description: 'Verifica se existe um token válido para a clínica atual',
  })
  @ApiQuery({ name: 'clinicId', required: true, type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Status da autenticação',
    schema: {
      type: 'object',
      properties: {
        authenticated: { type: 'boolean' },
        expiresAt: { type: 'string', format: 'date-time' },
        environment: { type: 'string', enum: ['HOMOLOGATION', 'PRODUCTION'] },
        cnesCode: { type: 'string' },
      },
    },
  })
  async getAuthStatus(
    @Query('clinicId', ParseUUIDPipe) clinicId: string,
    @CurrentUser() user: any,
  ) {
    return this.rndsService.getAuthStatus(clinicId, user.id);
  }

  @Get('environments')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN)
  @ApiOperation({
    summary: 'Listar ambientes RNDS disponíveis',
    description: 'Retorna os ambientes disponíveis para integração (Homologação e Produção)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de ambientes',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          code: { type: 'string', enum: ['HOMOLOGATION', 'PRODUCTION'] },
          name: { type: 'string' },
          baseUrl: { type: 'string' },
          authUrl: { type: 'string' },
          description: { type: 'string' },
        },
      },
    },
  })
  async getEnvironments() {
    return [
      {
        code: RNDSEnvironment.HOMOLOGATION,
        name: 'Homologação',
        baseUrl: 'https://ehr-services-hmg.saude.gov.br',
        authUrl: 'https://ehr-auth-hmg.saude.gov.br/api/token',
        description: 'Ambiente de testes e homologação',
      },
      {
        code: RNDSEnvironment.PRODUCTION,
        name: 'Produção',
        baseUrl: 'https://ehr-services.saude.gov.br',
        authUrl: 'https://ehr-auth.saude.gov.br/api/token',
        description: 'Ambiente de produção',
      },
    ];
  }

  // ============================================================
  // VALIDAÇÃO DE DOCUMENTOS BRASILEIROS
  // ============================================================

  @Post('validate/cns')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validar número do Cartão Nacional de Saúde (CNS)',
    description: 'Valida o dígito verificador do CNS usando o algoritmo oficial do DATASUS',
  })
  @ApiBody({ type: ValidateCNSDto })
  @ApiResponse({
    status: 200,
    description: 'Resultado da validação',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
        cns: { type: 'string' },
        type: { type: 'string', enum: ['DEFINITIVO', 'PROVISORIO'] },
        message: { type: 'string' },
      },
    },
  })
  async validateCNS(@Body() dto: ValidateCNSDto) {
    const result = this.rndsService.validateCNS(dto.cns);
    return result;
  }

  @Post('validate/cpf')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validar número do CPF',
    description: 'Valida o dígito verificador do CPF usando o algoritmo oficial da Receita Federal',
  })
  @ApiBody({ type: ValidateCPFDto })
  @ApiResponse({
    status: 200,
    description: 'Resultado da validação',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
        cpf: { type: 'string' },
        formattedCpf: { type: 'string' },
        message: { type: 'string' },
      },
    },
  })
  async validateCPF(@Body() dto: ValidateCPFDto) {
    const result = this.rndsService.validateCPF(dto.cpf);
    return result;
  }

  @Post('validate/batch')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validar múltiplos documentos em lote',
    description: 'Valida uma lista de CPFs e/ou CNSs em uma única requisição',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        documents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['CPF', 'CNS'] },
              value: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Resultados da validação em lote',
  })
  async validateBatch(
    @Body() dto: { documents: Array<{ type: 'CPF' | 'CNS'; value: string }> },
  ) {
    const results = dto.documents.map((doc) => {
      if (doc.type === 'CPF') {
        return {
          type: 'CPF',
          value: doc.value,
          ...this.rndsService.validateCPF(doc.value),
        };
      } else {
        return {
          type: 'CNS',
          value: doc.value,
          ...this.rndsService.validateCNS(doc.value),
        };
      }
    });

    return {
      total: dto.documents.length,
      valid: results.filter((r) => r.valid).length,
      invalid: results.filter((r) => !r.valid).length,
      results,
    };
  }

  // ============================================================
  // BUSCA DE PACIENTES
  // ============================================================

  @Get('patient/search')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
  @ApiOperation({
    summary: 'Buscar paciente no RNDS',
    description: 'Busca informações de um paciente no barramento RNDS usando CPF ou CNS',
  })
  @ApiQuery({ name: 'cpf', required: false, description: 'CPF do paciente' })
  @ApiQuery({ name: 'cns', required: false, description: 'CNS do paciente' })
  @ApiQuery({ name: 'clinicId', required: true, description: 'ID da clínica autenticada' })
  @ApiResponse({
    status: 200,
    description: 'Dados do paciente encontrado',
    schema: {
      type: 'object',
      properties: {
        resourceType: { type: 'string', example: 'Patient' },
        id: { type: 'string' },
        identifier: { type: 'array' },
        name: { type: 'array' },
        birthDate: { type: 'string', format: 'date' },
        gender: { type: 'string' },
        address: { type: 'array' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Paciente não encontrado' })
  async searchPatient(
    @Query() query: SearchPatientDto,
    @CurrentUser() user: any,
  ) {
    if (!query.cpf && !query.cns) {
      throw new BadRequestException('Informe CPF ou CNS para busca');
    }

    const result = await this.rndsService.searchPatient(
      query.clinicId,
      { cpf: query.cpf, cns: query.cns },
      user.id,
    );

    if (!result) {
      throw new NotFoundException('Paciente não encontrado no RNDS');
    }

    return result;
  }

  @Get('patient/:patientId/history')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Consultar histórico de saúde do paciente',
    description: 'Busca o histórico de documentos clínicos do paciente no RNDS',
  })
  @ApiParam({ name: 'patientId', description: 'ID do paciente no sistema local' })
  @ApiQuery({ name: 'clinicId', required: true })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'documentType', required: false, enum: RNDSDocumentType })
  @ApiResponse({
    status: 200,
    description: 'Histórico do paciente',
  })
  async getPatientHistory(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query('clinicId', ParseUUIDPipe) clinicId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('documentType') documentType?: RNDSDocumentType,
    @CurrentUser() user?: any,
  ) {
    return this.rndsService.getPatientDocuments(
      clinicId,
      patientId,
      {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        documentType,
      },
      user.id,
    );
  }

  // ============================================================
  // ENVIO DE RESULTADOS DE EXAMES LABORATORIAIS
  // ============================================================

  @Post('lab-results')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.LAB_TECHNICIAN)
  @ApiOperation({
    summary: 'Enviar resultado de exame laboratorial para o RNDS',
    description: 'Submete um resultado de exame laboratorial ao barramento RNDS',
  })
  @ApiBody({ type: LabResultRNDSDto })
  @ApiResponse({
    status: 201,
    description: 'Resultado enviado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        rndsId: { type: 'string' },
        protocol: { type: 'string' },
        submittedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 422, description: 'Erro de validação no RNDS' })
  async submitLabResult(
    @Body() dto: LabResultRNDSDto,
    @CurrentUser() user: any,
  ) {
    return this.rndsService.submitLabResult(dto, user.id);
  }

  @Post('lab-results/batch')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN, UserRole.LAB_TECHNICIAN)
  @ApiOperation({
    summary: 'Enviar múltiplos resultados de exames em lote',
    description: 'Submete vários resultados de exames laboratoriais ao RNDS em uma única operação',
  })
  @ApiBody({
    type: [LabResultRNDSDto],
    description: 'Lista de resultados de exames',
  })
  @ApiResponse({
    status: 201,
    description: 'Resultados processados',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        success: { type: 'number' },
        failed: { type: 'number' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              labOrderId: { type: 'string' },
              success: { type: 'boolean' },
              rndsId: { type: 'string' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async submitLabResultsBatch(
    @Body() dtos: LabResultRNDSDto[],
    @CurrentUser() user: any,
  ) {
    const results = await Promise.allSettled(
      dtos.map((dto) => this.rndsService.submitLabResult(dto, user.id)),
    );

    const processedResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          labOrderId: dtos[index].labOrderId,
          success: true,
          ...result.value,
        };
      } else {
        return {
          labOrderId: dtos[index].labOrderId,
          success: false,
          error: result.reason?.message || 'Erro desconhecido',
        };
      }
    });

    return {
      total: dtos.length,
      success: processedResults.filter((r) => r.success).length,
      failed: processedResults.filter((r) => !r.success).length,
      results: processedResults,
    };
  }

  @Get('lab-results/:labOrderId/status')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.LAB_TECHNICIAN)
  @ApiOperation({
    summary: 'Consultar status de envio do resultado de exame',
    description: 'Verifica o status de sincronização de um resultado de exame com o RNDS',
  })
  @ApiParam({ name: 'labOrderId', description: 'ID do pedido de exame no sistema local' })
  @ApiResponse({
    status: 200,
    description: 'Status do envio',
  })
  async getLabResultStatus(
    @Param('labOrderId', ParseUUIDPipe) labOrderId: string,
    @CurrentUser() user: any,
  ) {
    return this.rndsService.getDocumentSyncStatus('LabOrder', labOrderId, user.id);
  }

  // ============================================================
  // ENVIO DE REGISTROS DE VACINAÇÃO
  // ============================================================

  @Post('immunizations')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  @ApiOperation({
    summary: 'Registrar vacinação no RNDS',
    description: 'Submete um registro de vacinação ao barramento RNDS',
  })
  @ApiBody({ type: ImmunizationRNDSDto })
  @ApiResponse({
    status: 201,
    description: 'Vacinação registrada com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        rndsId: { type: 'string' },
        protocol: { type: 'string' },
        submittedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  async submitImmunization(
    @Body() dto: ImmunizationRNDSDto,
    @CurrentUser() user: any,
  ) {
    return this.rndsService.submitImmunization(dto, user.id);
  }

  @Post('immunizations/batch')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN, UserRole.NURSE)
  @ApiOperation({
    summary: 'Registrar múltiplas vacinações em lote',
    description: 'Submete vários registros de vacinação ao RNDS',
  })
  @ApiBody({
    type: [ImmunizationRNDSDto],
    description: 'Lista de registros de vacinação',
  })
  @ApiResponse({
    status: 201,
    description: 'Vacinações processadas',
  })
  async submitImmunizationsBatch(
    @Body() dtos: ImmunizationRNDSDto[],
    @CurrentUser() user: any,
  ) {
    const results = await Promise.allSettled(
      dtos.map((dto) => this.rndsService.submitImmunization(dto, user.id)),
    );

    const processedResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          appointmentId: dtos[index].appointmentId,
          success: true,
          ...result.value,
        };
      } else {
        return {
          appointmentId: dtos[index].appointmentId,
          success: false,
          error: result.reason?.message || 'Erro desconhecido',
        };
      }
    });

    return {
      total: dtos.length,
      success: processedResults.filter((r) => r.success).length,
      failed: processedResults.filter((r) => !r.success).length,
      results: processedResults,
    };
  }

  @Get('immunizations/:appointmentId/status')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  @ApiOperation({
    summary: 'Consultar status de envio da vacinação',
    description: 'Verifica o status de sincronização de um registro de vacinação com o RNDS',
  })
  @ApiParam({ name: 'appointmentId', description: 'ID do atendimento de vacinação' })
  @ApiResponse({
    status: 200,
    description: 'Status do envio',
  })
  async getImmunizationStatus(
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @CurrentUser() user: any,
  ) {
    return this.rndsService.getDocumentSyncStatus('Appointment', appointmentId, user.id);
  }

  // ============================================================
  // ENVIO DE ATENDIMENTOS CLÍNICOS
  // ============================================================

  @Post('clinical-encounters')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Enviar registro de atendimento clínico',
    description: 'Submete um Registro de Atendimento Clínico (RAC) ao RNDS',
  })
  @ApiBody({ type: ClinicalEncounterRNDSDto })
  @ApiResponse({
    status: 201,
    description: 'Atendimento registrado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        rndsId: { type: 'string' },
        protocol: { type: 'string' },
        submittedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  async submitClinicalEncounter(
    @Body() dto: ClinicalEncounterRNDSDto,
    @CurrentUser() user: any,
  ) {
    return this.rndsService.submitClinicalEncounter(dto, user.id);
  }

  @Post('clinical-encounters/batch')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN)
  @ApiOperation({
    summary: 'Enviar múltiplos atendimentos em lote',
    description: 'Submete vários registros de atendimento clínico ao RNDS',
  })
  @ApiBody({
    type: [ClinicalEncounterRNDSDto],
    description: 'Lista de atendimentos clínicos',
  })
  @ApiResponse({
    status: 201,
    description: 'Atendimentos processados',
  })
  async submitClinicalEncountersBatch(
    @Body() dtos: ClinicalEncounterRNDSDto[],
    @CurrentUser() user: any,
  ) {
    const results = await Promise.allSettled(
      dtos.map((dto) => this.rndsService.submitClinicalEncounter(dto, user.id)),
    );

    const processedResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          consultationId: dtos[index].consultationId,
          success: true,
          ...result.value,
        };
      } else {
        return {
          consultationId: dtos[index].consultationId,
          success: false,
          error: result.reason?.message || 'Erro desconhecido',
        };
      }
    });

    return {
      total: dtos.length,
      success: processedResults.filter((r) => r.success).length,
      failed: processedResults.filter((r) => !r.success).length,
      results: processedResults,
    };
  }

  @Get('clinical-encounters/:consultationId/status')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Consultar status de envio do atendimento',
    description: 'Verifica o status de sincronização de um atendimento clínico com o RNDS',
  })
  @ApiParam({ name: 'consultationId', description: 'ID da consulta no sistema local' })
  @ApiResponse({
    status: 200,
    description: 'Status do envio',
  })
  async getClinicalEncounterStatus(
    @Param('consultationId', ParseUUIDPipe) consultationId: string,
    @CurrentUser() user: any,
  ) {
    return this.rndsService.getDocumentSyncStatus('Consultation', consultationId, user.id);
  }

  // ============================================================
  // ENVIO DE SUMÁRIOS DE ALTA
  // ============================================================

  @Post('discharge-summaries')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Enviar sumário de alta hospitalar',
    description: 'Submete um Sumário de Alta ao RNDS',
  })
  @ApiBody({ type: DischargeSummaryRNDSDto })
  @ApiResponse({
    status: 201,
    description: 'Sumário de alta registrado com sucesso',
  })
  async submitDischargeSummary(
    @Body() dto: DischargeSummaryRNDSDto,
    @CurrentUser() user: any,
  ) {
    return this.rndsService.submitDischargeSummary(dto, user.id);
  }

  @Get('discharge-summaries/:encounterId/status')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Consultar status de envio do sumário de alta',
    description: 'Verifica o status de sincronização de um sumário de alta com o RNDS',
  })
  @ApiParam({ name: 'encounterId', description: 'ID do internamento/encounter' })
  @ApiResponse({
    status: 200,
    description: 'Status do envio',
  })
  async getDischargeSummaryStatus(
    @Param('encounterId', ParseUUIDPipe) encounterId: string,
    @CurrentUser() user: any,
  ) {
    return this.rndsService.getDocumentSyncStatus('Encounter', encounterId, user.id);
  }

  // ============================================================
  // CERTIFICADO COVID-19
  // ============================================================

  @Post('covid-certificate')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  @ApiOperation({
    summary: 'Gerar certificado de vacinação COVID-19',
    description: 'Solicita a geração do Certificado Nacional de Vacinação COVID-19',
  })
  @ApiBody({ type: CovidCertificateRNDSDto })
  @ApiResponse({
    status: 201,
    description: 'Certificado gerado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        certificateId: { type: 'string' },
        qrCode: { type: 'string', description: 'Base64 encoded QR Code' },
        pdfUrl: { type: 'string' },
        validUntil: { type: 'string', format: 'date-time' },
      },
    },
  })
  async generateCovidCertificate(
    @Body() dto: CovidCertificateRNDSDto,
    @CurrentUser() user: any,
  ) {
    return this.rndsService.generateCovidCertificate(dto, user.id);
  }

  @Get('covid-certificate/:patientId')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Consultar certificado COVID-19 do paciente',
    description: 'Busca o certificado de vacinação COVID-19 de um paciente',
  })
  @ApiParam({ name: 'patientId', description: 'ID do paciente' })
  @ApiQuery({ name: 'clinicId', required: true })
  @ApiResponse({
    status: 200,
    description: 'Certificado do paciente',
  })
  @ApiResponse({ status: 404, description: 'Certificado não encontrado' })
  async getCovidCertificate(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query('clinicId', ParseUUIDPipe) clinicId: string,
    @CurrentUser() user: any,
  ) {
    return this.rndsService.getCovidCertificate(clinicId, patientId, user.id);
  }

  // ============================================================
  // SINCRONIZAÇÃO E STATUS
  // ============================================================

  @Get('sync/status')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN)
  @ApiOperation({
    summary: 'Listar status de sincronização',
    description: 'Lista os documentos pendentes de sincronização com o RNDS',
  })
  @ApiQuery({ name: 'clinicId', required: true })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'SYNCED', 'FAILED', 'RETRYING'] })
  @ApiQuery({ name: 'documentType', required: false, enum: RNDSDocumentType })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Lista de documentos com status de sincronização',
  })
  async getSyncStatus(
    @Query() query: SyncStatusQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.rndsService.listSyncStatus(query, user.id);
  }

  @Get('sync/summary')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN)
  @ApiOperation({
    summary: 'Resumo da sincronização',
    description: 'Retorna estatísticas de sincronização com o RNDS',
  })
  @ApiQuery({ name: 'clinicId', required: true })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({
    status: 200,
    description: 'Resumo da sincronização',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        synced: { type: 'number' },
        pending: { type: 'number' },
        failed: { type: 'number' },
        retrying: { type: 'number' },
        byDocumentType: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              total: { type: 'number' },
              synced: { type: 'number' },
              pending: { type: 'number' },
              failed: { type: 'number' },
            },
          },
        },
        lastSync: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getSyncSummary(
    @Query('clinicId', ParseUUIDPipe) clinicId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: any,
  ) {
    return this.rndsService.getSyncSummary(
      clinicId,
      {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
      user.id,
    );
  }

  @Post('sync/retry')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retentar sincronização de documentos falhos',
    description: 'Força uma nova tentativa de sincronização para documentos com status FAILED',
  })
  @ApiBody({ type: RetrySyncDto })
  @ApiResponse({
    status: 200,
    description: 'Sincronização agendada com sucesso',
    schema: {
      type: 'object',
      properties: {
        queued: { type: 'number' },
        documentIds: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async retrySync(
    @Body() dto: RetrySyncDto,
    @CurrentUser() user: any,
  ) {
    return this.rndsService.retryFailedSync(dto, user.id);
  }

  @Post('sync/retry-all')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retentar todas as sincronizações falhas',
    description: 'Força nova tentativa de sincronização para todos os documentos FAILED de uma clínica',
  })
  @ApiQuery({ name: 'clinicId', required: true })
  @ApiResponse({
    status: 200,
    description: 'Sincronizações agendadas',
  })
  async retryAllFailedSync(
    @Query('clinicId', ParseUUIDPipe) clinicId: string,
    @CurrentUser() user: any,
  ) {
    return this.rndsService.retryAllFailedSync(clinicId, user.id);
  }

  // ============================================================
  // CONSULTA DE DOCUMENTOS
  // ============================================================

  @Get('documents/:documentId')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Consultar documento no RNDS',
    description: 'Busca um documento específico no barramento RNDS pelo ID',
  })
  @ApiParam({ name: 'documentId', description: 'ID do documento no RNDS' })
  @ApiQuery({ name: 'clinicId', required: true })
  @ApiResponse({
    status: 200,
    description: 'Documento encontrado',
  })
  @ApiResponse({ status: 404, description: 'Documento não encontrado' })
  async getDocument(
    @Param('documentId') documentId: string,
    @Query('clinicId', ParseUUIDPipe) clinicId: string,
    @CurrentUser() user: any,
  ) {
    const document = await this.rndsService.getDocumentFromRNDS(
      clinicId,
      documentId,
      user.id,
    );

    if (!document) {
      throw new NotFoundException('Documento não encontrado no RNDS');
    }

    return document;
  }

  @Get('documents')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Listar documentos do paciente no RNDS',
    description: 'Busca todos os documentos de um paciente no barramento RNDS',
  })
  @ApiQuery({ name: 'clinicId', required: true })
  @ApiQuery({ name: 'patientId', required: true })
  @ApiQuery({ name: 'documentType', required: false, enum: RNDSDocumentType })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Lista de documentos',
  })
  async listDocuments(
    @Query('clinicId', ParseUUIDPipe) clinicId: string,
    @Query('patientId', ParseUUIDPipe) patientId: string,
    @Query('documentType') documentType?: RNDSDocumentType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUser() user?: any,
  ) {
    return this.rndsService.getPatientDocuments(
      clinicId,
      patientId,
      {
        documentType,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        page: page || 1,
        limit: limit || 20,
      },
      user.id,
    );
  }

  // ============================================================
  // TERMINOLOGIAS E CÓDIGOS
  // ============================================================

  @Get('terminologies/cid10')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  @ApiOperation({
    summary: 'Buscar código CID-10',
    description: 'Busca códigos da Classificação Internacional de Doenças',
  })
  @ApiQuery({ name: 'query', required: true, description: 'Termo de busca' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Limite de resultados' })
  @ApiResponse({
    status: 200,
    description: 'Lista de códigos CID-10',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string' },
        },
      },
    },
  })
  async searchCID10(
    @Query('query') query: string,
    @Query('limit') limit?: number,
  ) {
    return this.rndsService.searchCID10(query, limit || 20);
  }

  @Get('terminologies/ciap2')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  @ApiOperation({
    summary: 'Buscar código CIAP-2',
    description: 'Busca códigos da Classificação Internacional de Atenção Primária',
  })
  @ApiQuery({ name: 'query', required: true, description: 'Termo de busca' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Lista de códigos CIAP-2',
  })
  async searchCIAP2(
    @Query('query') query: string,
    @Query('limit') limit?: number,
  ) {
    return this.rndsService.searchCIAP2(query, limit || 20);
  }

  @Get('terminologies/tuss')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  @ApiOperation({
    summary: 'Buscar procedimento TUSS',
    description: 'Busca códigos da Terminologia Unificada da Saúde Suplementar',
  })
  @ApiQuery({ name: 'query', required: true, description: 'Termo de busca' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Lista de procedimentos TUSS',
  })
  async searchTUSS(
    @Query('query') query: string,
    @Query('limit') limit?: number,
  ) {
    return this.rndsService.searchTUSS(query, limit || 20);
  }

  @Get('terminologies/vaccines')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  @ApiOperation({
    summary: 'Listar vacinas do calendário nacional',
    description: 'Retorna a lista de vacinas do calendário nacional de vacinação',
  })
  @ApiQuery({ name: 'query', required: false })
  @ApiResponse({
    status: 200,
    description: 'Lista de vacinas',
  })
  async listVaccines(@Query('query') query?: string) {
    return this.rndsService.listVaccines(query);
  }

  @Get('terminologies/exams')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.LAB_TECHNICIAN)
  @ApiOperation({
    summary: 'Buscar exames laboratoriais',
    description: 'Busca códigos de exames laboratoriais (SIGTAP)',
  })
  @ApiQuery({ name: 'query', required: true })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Lista de exames',
  })
  async searchExams(
    @Query('query') query: string,
    @Query('limit') limit?: number,
  ) {
    return this.rndsService.searchExams(query, limit || 20);
  }

  // ============================================================
  // ESTABELECIMENTOS DE SAÚDE
  // ============================================================

  @Get('establishments/search')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Buscar estabelecimento de saúde',
    description: 'Busca estabelecimentos de saúde no CNES pelo nome ou código',
  })
  @ApiQuery({ name: 'query', required: true, description: 'Nome ou código CNES' })
  @ApiQuery({ name: 'state', required: false, description: 'UF do estabelecimento' })
  @ApiQuery({ name: 'city', required: false, description: 'Município' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Lista de estabelecimentos',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          cnes: { type: 'string' },
          name: { type: 'string' },
          fantasyName: { type: 'string' },
          type: { type: 'string' },
          address: { type: 'object' },
          phone: { type: 'string' },
          email: { type: 'string' },
        },
      },
    },
  })
  async searchEstablishments(
    @Query('query') query: string,
    @Query('state') state?: string,
    @Query('city') city?: string,
    @Query('limit') limit?: number,
  ) {
    return this.rndsService.searchEstablishments(query, { state, city }, limit || 20);
  }

  @Get('establishments/:cnes')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Consultar estabelecimento por CNES',
    description: 'Busca detalhes de um estabelecimento de saúde pelo código CNES',
  })
  @ApiParam({ name: 'cnes', description: 'Código CNES do estabelecimento' })
  @ApiResponse({
    status: 200,
    description: 'Dados do estabelecimento',
  })
  @ApiResponse({ status: 404, description: 'Estabelecimento não encontrado' })
  async getEstablishment(@Param('cnes') cnes: string) {
    const establishment = await this.rndsService.getEstablishment(cnes);

    if (!establishment) {
      throw new NotFoundException('Estabelecimento não encontrado');
    }

    return establishment;
  }

  // ============================================================
  // PROFISSIONAIS DE SAÚDE
  // ============================================================

  @Get('professionals/search')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Buscar profissional de saúde',
    description: 'Busca profissionais de saúde pelo CPF, CNS ou CRM',
  })
  @ApiQuery({ name: 'cpf', required: false })
  @ApiQuery({ name: 'cns', required: false })
  @ApiQuery({ name: 'crm', required: false })
  @ApiQuery({ name: 'clinicId', required: true })
  @ApiResponse({
    status: 200,
    description: 'Dados do profissional',
  })
  async searchProfessional(
    @Query('cpf') cpf?: string,
    @Query('cns') cns?: string,
    @Query('crm') crm?: string,
    @Query('clinicId', ParseUUIDPipe) clinicId?: string,
    @CurrentUser() user?: any,
  ) {
    if (!cpf && !cns && !crm) {
      throw new BadRequestException('Informe CPF, CNS ou CRM para busca');
    }

    return this.rndsService.searchProfessional(
      clinicId!,
      { cpf, cns, crm },
      user.id,
    );
  }

  // ============================================================
  // RELATÓRIOS E AUDITORIA
  // ============================================================

  @Get('audit/logs')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN)
  @ApiOperation({
    summary: 'Consultar logs de auditoria RNDS',
    description: 'Lista todos os logs de operações realizadas com o RNDS',
  })
  @ApiQuery({ name: 'clinicId', required: true })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Lista de logs de auditoria',
  })
  async getAuditLogs(
    @Query('clinicId', ParseUUIDPipe) clinicId: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUser() user?: any,
  ) {
    return this.rndsService.getAuditLogs(
      clinicId,
      {
        userId,
        action,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        page: page || 1,
        limit: limit || 50,
      },
      user.id,
    );
  }

  @Get('reports/submissions')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN)
  @ApiOperation({
    summary: 'Relatório de submissões ao RNDS',
    description: 'Gera relatório de todas as submissões realizadas ao RNDS',
  })
  @ApiQuery({ name: 'clinicId', required: true })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiQuery({ name: 'format', required: false, enum: ['json', 'csv', 'pdf'] })
  @ApiResponse({
    status: 200,
    description: 'Relatório de submissões',
  })
  async getSubmissionsReport(
    @Query('clinicId', ParseUUIDPipe) clinicId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('format') format: 'json' | 'csv' | 'pdf' = 'json',
    @CurrentUser() user?: any,
  ) {
    return this.rndsService.generateSubmissionsReport(
      clinicId,
      {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        format,
      },
      user.id,
    );
  }

  // ============================================================
  // HEALTH CHECK
  // ============================================================

  @Get('health')
  @ApiOperation({
    summary: 'Verificar saúde da integração RNDS',
    description: 'Verifica a conectividade com os serviços do RNDS',
  })
  @ApiResponse({
    status: 200,
    description: 'Status dos serviços',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
        services: {
          type: 'object',
          properties: {
            auth: {
              type: 'object',
              properties: {
                status: { type: 'string' },
                latency: { type: 'number' },
              },
            },
            ehr: {
              type: 'object',
              properties: {
                status: { type: 'string' },
                latency: { type: 'number' },
              },
            },
          },
        },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  async healthCheck() {
    return this.rndsService.healthCheck();
  }

  @Get('capabilities')
  @ApiOperation({
    summary: 'Listar capacidades da integração RNDS',
    description: 'Retorna as funcionalidades disponíveis na integração com o RNDS',
  })
  @ApiResponse({
    status: 200,
    description: 'Capacidades da integração',
  })
  async getCapabilities() {
    return {
      version: '1.0.0',
      supportedDocumentTypes: Object.values(RNDSDocumentType),
      supportedEnvironments: Object.values(RNDSEnvironment),
      features: {
        authentication: {
          method: 'OAuth 2.0 with Digital Certificate',
          certificateTypes: ['A1', 'A3'],
        },
        patientSearch: {
          identifiers: ['CPF', 'CNS'],
        },
        documentSubmission: {
          labResults: true,
          immunizations: true,
          clinicalEncounters: true,
          dischargeSummaries: true,
          covidCertificates: true,
        },
        terminologies: {
          cid10: true,
          ciap2: true,
          tuss: true,
          sigtap: true,
        },
        batchOperations: true,
        retryMechanism: true,
        auditLogging: true,
      },
      fhirVersion: 'R4',
      rndsVersion: 'v1',
    };
  }
}
