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
  Request,
  Headers,
  HttpStatus,
  HttpCode,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiHeader,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/enums/user-role.enum';
import { Public } from '../../auth/decorators/public.decorator';
import { FhirService } from './fhir.service';
import {
  FHIRPatientDto,
  FHIRPractitionerDto,
  FHIROrganizationDto,
  FHIRAppointmentDto,
  FHIRObservationDto,
  FHIRBundleDto,
} from './dto/fhir-resources.dto';
import {
  FHIRPatientSearchDto,
  FHIRPractitionerSearchDto,
  FHIROrganizationSearchDto,
  FHIRAppointmentSearchDto,
  FHIRObservationSearchDto,
  FHIRConditionSearchDto,
  FHIRMedicationRequestSearchDto,
  FHIREverythingDto,
} from './dto/fhir-query.dto';

@ApiTags('FHIR R4')
@Controller('fhir')
export class FhirController {
  constructor(private readonly fhirService: FhirService) {}

  // ==================== Capability Statement ====================

  @Get('metadata')
  @Public()
  @ApiOperation({ summary: 'Get FHIR Capability Statement' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Capability statement returned' })
  @ApiHeader({ name: 'Accept', description: 'Accept header', required: false })
  async getCapabilityStatement(
    @Headers('Accept') accept?: string,
    @Res() res?: Response,
  ) {
    const capability = await this.fhirService.getCapabilityStatement();

    if (res) {
      res.setHeader('Content-Type', 'application/fhir+json');
      return res.json(capability);
    }
    return capability;
  }

  // ==================== Patient Resource ====================

  @Post('Patient')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new Patient resource' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Patient created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid resource' })
  @HttpCode(HttpStatus.CREATED)
  async createPatient(
    @Body() dto: FHIRPatientDto,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const patient = await this.fhirService.createPatient(dto, req.user.id);
    res.setHeader('Content-Type', 'application/fhir+json');
    res.setHeader('Location', `/fhir/Patient/${patient.id}`);
    res.setHeader('ETag', `W/"${patient.meta?.versionId}"`);
    return res.status(HttpStatus.CREATED).json(patient);
  }

  @Get('Patient/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Read a Patient resource' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Patient resource returned' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Patient not found' })
  async readPatient(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const patient = await this.fhirService.readPatient(id);
    res.setHeader('Content-Type', 'application/fhir+json');
    res.setHeader('ETag', `W/"${patient.meta?.versionId}"`);
    return res.json(patient);
  }

  @Put('Patient/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a Patient resource' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Patient updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Patient not found' })
  async updatePatient(
    @Param('id') id: string,
    @Body() dto: FHIRPatientDto,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const patient = await this.fhirService.updatePatient(id, dto, req.user.id);
    res.setHeader('Content-Type', 'application/fhir+json');
    res.setHeader('ETag', `W/"${patient.meta?.versionId}"`);
    return res.json(patient);
  }

  @Delete('Patient/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a Patient resource' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Patient deleted' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Patient not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePatient(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    await this.fhirService.deletePatient(id, req.user.id);
  }

  @Get('Patient')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search for Patient resources' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Search results returned' })
  async searchPatients(
    @Query() query: FHIRPatientSearchDto,
    @Res() res: Response,
  ) {
    const bundle = await this.fhirService.searchPatients(query);
    res.setHeader('Content-Type', 'application/fhir+json');
    return res.json(bundle);
  }

  @Get('Patient/:id/$everything')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get everything for a Patient' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Patient data returned' })
  async getPatientEverything(
    @Param('id') id: string,
    @Query() query: FHIREverythingDto,
    @Res() res: Response,
  ) {
    const bundle = await this.fhirService.getPatientEverything(id, query);
    res.setHeader('Content-Type', 'application/fhir+json');
    return res.json(bundle);
  }

  // ==================== Practitioner Resource ====================

  @Post('Practitioner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new Practitioner resource' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Practitioner created' })
  @HttpCode(HttpStatus.CREATED)
  async createPractitioner(
    @Body() dto: FHIRPractitionerDto,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const practitioner = await this.fhirService.createPractitioner(dto, req.user.id);
    res.setHeader('Content-Type', 'application/fhir+json');
    res.setHeader('Location', `/fhir/Practitioner/${practitioner.id}`);
    return res.status(HttpStatus.CREATED).json(practitioner);
  }

  @Get('Practitioner/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Read a Practitioner resource' })
  @ApiParam({ name: 'id', description: 'Practitioner ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Practitioner returned' })
  async readPractitioner(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const practitioner = await this.fhirService.readPractitioner(id);
    res.setHeader('Content-Type', 'application/fhir+json');
    return res.json(practitioner);
  }

  @Get('Practitioner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search for Practitioner resources' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Search results returned' })
  async searchPractitioners(
    @Query() query: FHIRPractitionerSearchDto,
    @Res() res: Response,
  ) {
    const bundle = await this.fhirService.searchPractitioners(query);
    res.setHeader('Content-Type', 'application/fhir+json');
    return res.json(bundle);
  }

  // ==================== Organization Resource ====================

  @Post('Organization')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new Organization resource' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Organization created' })
  @HttpCode(HttpStatus.CREATED)
  async createOrganization(
    @Body() dto: FHIROrganizationDto,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const organization = await this.fhirService.createOrganization(dto, req.user.id);
    res.setHeader('Content-Type', 'application/fhir+json');
    res.setHeader('Location', `/fhir/Organization/${organization.id}`);
    return res.status(HttpStatus.CREATED).json(organization);
  }

  @Get('Organization/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Read an Organization resource' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Organization returned' })
  async readOrganization(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const organization = await this.fhirService.readOrganization(id);
    res.setHeader('Content-Type', 'application/fhir+json');
    return res.json(organization);
  }

  @Get('Organization')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search for Organization resources' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Search results returned' })
  async searchOrganizations(
    @Query() query: FHIROrganizationSearchDto,
    @Res() res: Response,
  ) {
    const bundle = await this.fhirService.searchOrganizations(query);
    res.setHeader('Content-Type', 'application/fhir+json');
    return res.json(bundle);
  }

  // ==================== Appointment Resource ====================

  @Post('Appointment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DOCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new Appointment resource' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Appointment created' })
  @HttpCode(HttpStatus.CREATED)
  async createAppointment(
    @Body() dto: FHIRAppointmentDto,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const appointment = await this.fhirService.createAppointment(dto, req.user.id);
    res.setHeader('Content-Type', 'application/fhir+json');
    res.setHeader('Location', `/fhir/Appointment/${appointment.id}`);
    return res.status(HttpStatus.CREATED).json(appointment);
  }

  @Get('Appointment/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.PATIENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Read an Appointment resource' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Appointment returned' })
  async readAppointment(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const appointment = await this.fhirService.readAppointment(id);
    res.setHeader('Content-Type', 'application/fhir+json');
    return res.json(appointment);
  }

  @Get('Appointment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search for Appointment resources' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Search results returned' })
  async searchAppointments(
    @Query() query: FHIRAppointmentSearchDto,
    @Res() res: Response,
  ) {
    const bundle = await this.fhirService.searchAppointments(query);
    res.setHeader('Content-Type', 'application/fhir+json');
    return res.json(bundle);
  }

  // ==================== Observation Resource ====================

  @Post('Observation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new Observation resource' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Observation created' })
  @HttpCode(HttpStatus.CREATED)
  async createObservation(
    @Body() dto: FHIRObservationDto,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const observation = await this.fhirService.createObservation(dto, req.user.id);
    res.setHeader('Content-Type', 'application/fhir+json');
    res.setHeader('Location', `/fhir/Observation/${observation.id}`);
    return res.status(HttpStatus.CREATED).json(observation);
  }

  @Get('Observation/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Read an Observation resource' })
  @ApiParam({ name: 'id', description: 'Observation ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Observation returned' })
  async readObservation(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const observation = await this.fhirService.readObservation(id);
    res.setHeader('Content-Type', 'application/fhir+json');
    return res.json(observation);
  }

  @Get('Observation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search for Observation resources' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Search results returned' })
  async searchObservations(
    @Query() query: FHIRObservationSearchDto,
    @Res() res: Response,
  ) {
    const bundle = await this.fhirService.searchObservations(query);
    res.setHeader('Content-Type', 'application/fhir+json');
    return res.json(bundle);
  }

  // ==================== Condition Resource ====================

  @Get('Condition')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search for Condition resources' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Search results returned' })
  async searchConditions(
    @Query() query: FHIRConditionSearchDto,
    @Res() res: Response,
  ) {
    const bundle = await this.fhirService.searchConditions(query);
    res.setHeader('Content-Type', 'application/fhir+json');
    return res.json(bundle);
  }

  // ==================== MedicationRequest Resource ====================

  @Get('MedicationRequest')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search for MedicationRequest resources' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Search results returned' })
  async searchMedicationRequests(
    @Query() query: FHIRMedicationRequestSearchDto,
    @Res() res: Response,
  ) {
    const bundle = await this.fhirService.searchMedicationRequests(query);
    res.setHeader('Content-Type', 'application/fhir+json');
    return res.json(bundle);
  }

  // ==================== Bundle Operations ====================

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process a FHIR Bundle (transaction/batch)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Bundle processed' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid bundle' })
  async processBundle(
    @Body() bundle: FHIRBundleDto,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const result = await this.fhirService.processBundle(bundle, req.user.id);
    res.setHeader('Content-Type', 'application/fhir+json');
    return res.json(result);
  }

  // ==================== Well-Known Endpoints ====================

  @Get('.well-known/smart-configuration')
  @Public()
  @ApiOperation({ summary: 'SMART on FHIR configuration' })
  async getSmartConfiguration() {
    const baseUrl = process.env.FHIR_BASE_URL || 'http://localhost:3000/fhir';
    const authUrl = process.env.AUTH_URL || 'http://localhost:3000/auth';

    return {
      authorization_endpoint: `${authUrl}/authorize`,
      token_endpoint: `${authUrl}/token`,
      token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
      registration_endpoint: `${authUrl}/register`,
      scopes_supported: [
        'openid',
        'profile',
        'fhirUser',
        'launch',
        'launch/patient',
        'patient/*.read',
        'patient/*.write',
        'user/*.read',
        'user/*.write',
        'offline_access',
      ],
      response_types_supported: ['code'],
      management_endpoint: `${authUrl}/manage`,
      introspection_endpoint: `${authUrl}/introspect`,
      revocation_endpoint: `${authUrl}/revoke`,
      capabilities: [
        'launch-ehr',
        'launch-standalone',
        'client-public',
        'client-confidential-symmetric',
        'context-passthrough-banner',
        'context-passthrough-style',
        'context-ehr-patient',
        'context-standalone-patient',
        'permission-offline',
        'permission-patient',
        'permission-user',
        'sso-openid-connect',
      ],
      code_challenge_methods_supported: ['S256'],
    };
  }
}
