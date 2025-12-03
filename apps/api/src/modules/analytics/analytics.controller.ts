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
  ParseUUIDPipe,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { AnalyticsService } from './analytics.service';
import {
  GenerateReportDto,
  CreateCustomReportDto,
  UpdateCustomReportDto,
  CreateScheduledReportDto,
  UpdateScheduledReportDto,
  CreateDashboardDto,
  UpdateDashboardDto,
  CreateWidgetDto,
  UpdateWidgetDto,
  CreateKPIDto,
  UpdateKPIDto,
  CreateCohortDto,
  CohortAnalysisDto,
  ExportDataDto,
} from './dto/create-analytics.dto';
import {
  OperationalAnalyticsQueryDto,
  FinancialAnalyticsQueryDto,
  ClinicalAnalyticsQueryDto,
  PatientAnalyticsQueryDto,
  DoctorAnalyticsQueryDto,
  LaboratoryAnalyticsQueryDto,
  TelemedicineAnalyticsQueryDto,
  CustomReportQueryDto,
  ScheduledReportQueryDto,
  DashboardQueryDto,
  KPIQueryDto,
  KPIValueQueryDto,
  CohortQueryDto,
  ExportQueryDto,
  TrendingQueryDto,
} from './dto/analytics-query.dto';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // ==================== Core Analytics ====================

  @Get('operational')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Obter analytics operacionais' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Analytics operacionais retornados com sucesso' })
  async getOperationalAnalytics(
    @Query() query: OperationalAnalyticsQueryDto,
    @Request() req: any,
  ) {
    return this.analyticsService.getOperationalAnalytics(query, req.user.id);
  }

  @Get('financial')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Obter analytics financeiros' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Analytics financeiros retornados com sucesso' })
  async getFinancialAnalytics(
    @Query() query: FinancialAnalyticsQueryDto,
    @Request() req: any,
  ) {
    return this.analyticsService.getFinancialAnalytics(query, req.user.id);
  }

  @Get('clinical')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Obter analytics clínicos' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Analytics clínicos retornados com sucesso' })
  async getClinicalAnalytics(
    @Query() query: ClinicalAnalyticsQueryDto,
    @Request() req: any,
  ) {
    return this.analyticsService.getClinicalAnalytics(query, req.user.id);
  }

  @Get('patients')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Obter analytics de pacientes' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Analytics de pacientes retornados com sucesso' })
  async getPatientAnalytics(
    @Query() query: PatientAnalyticsQueryDto,
    @Request() req: any,
  ) {
    return this.analyticsService.getPatientAnalytics(query, req.user.id);
  }

  @Get('doctors')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Obter analytics de médicos' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Analytics de médicos retornados com sucesso' })
  async getDoctorAnalytics(
    @Query() query: DoctorAnalyticsQueryDto,
    @Request() req: any,
  ) {
    return this.analyticsService.getDoctorAnalytics(query, req.user.id);
  }

  @Get('laboratory')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Obter analytics de laboratório' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Analytics de laboratório retornados com sucesso' })
  async getLaboratoryAnalytics(
    @Query() query: LaboratoryAnalyticsQueryDto,
    @Request() req: any,
  ) {
    return this.analyticsService.getLaboratoryAnalytics(query, req.user.id);
  }

  @Get('telemedicine')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Obter analytics de telemedicina' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Analytics de telemedicina retornados com sucesso' })
  async getTelemedicineAnalytics(
    @Query() query: TelemedicineAnalyticsQueryDto,
    @Request() req: any,
  ) {
    return this.analyticsService.getTelemedicineAnalytics(query, req.user.id);
  }

  @Get('executive-summary')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Obter resumo executivo' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Resumo executivo retornado com sucesso' })
  async getExecutiveSummary(
    @Query() query: any,
    @Request() req: any,
  ) {
    return this.analyticsService.getExecutiveSummary(query, req.user.id);
  }

  @Get('trending')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Obter tendências' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Tendências retornadas com sucesso' })
  async getTrending(
    @Query() query: TrendingQueryDto,
    @Request() req: any,
  ) {
    return this.analyticsService.getTrending(query, req.user.id);
  }

  @Post('reports/generate')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Gerar relatório' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Relatório gerado com sucesso' })
  async generateReport(
    @Body() dto: GenerateReportDto,
    @Request() req: any,
  ) {
    return this.analyticsService.generateReport(dto, req.user.id);
  }

  // ==================== Custom Reports ====================

  @Post('reports/custom')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Criar relatório customizado' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Relatório criado com sucesso' })
  async createCustomReport(
    @Body() dto: CreateCustomReportDto,
    @Request() req: any,
  ) {
    return this.analyticsService.createCustomReport(dto, req.user.id);
  }

  @Get('reports/custom')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Listar relatórios customizados' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Relatórios listados com sucesso' })
  async findAllCustomReports(
    @Query() query: CustomReportQueryDto,
    @Request() req: any,
  ) {
    return this.analyticsService.findAllCustomReports(query, req.user.id);
  }

  @Put('reports/custom/:id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Atualizar relatório customizado' })
  @ApiParam({ name: 'id', description: 'ID do relatório' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Relatório atualizado com sucesso' })
  async updateCustomReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomReportDto,
    @Request() req: any,
  ) {
    return this.analyticsService.updateCustomReport(id, dto, req.user.id);
  }

  @Delete('reports/custom/:id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Excluir relatório customizado' })
  @ApiParam({ name: 'id', description: 'ID do relatório' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Relatório excluído com sucesso' })
  async deleteCustomReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    return this.analyticsService.deleteCustomReport(id, req.user.id);
  }

  @Post('reports/custom/:id/execute')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Executar relatório customizado' })
  @ApiParam({ name: 'id', description: 'ID do relatório' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Relatório executado com sucesso' })
  async executeCustomReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GenerateReportDto,
    @Request() req: any,
  ) {
    return this.analyticsService.executeCustomReport(id, dto, req.user.id);
  }

  // ==================== Scheduled Reports ====================

  @Post('reports/scheduled')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar relatório agendado' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Agendamento criado com sucesso' })
  async createScheduledReport(
    @Body() dto: CreateScheduledReportDto,
    @Request() req: any,
  ) {
    return this.analyticsService.createScheduledReport(dto, req.user.id);
  }

  @Get('reports/scheduled')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar relatórios agendados' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Agendamentos listados com sucesso' })
  async findAllScheduledReports(
    @Query() query: ScheduledReportQueryDto,
    @Request() req: any,
  ) {
    return this.analyticsService.findAllScheduledReports(query, req.user.id);
  }

  @Put('reports/scheduled/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar relatório agendado' })
  @ApiParam({ name: 'id', description: 'ID do agendamento' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Agendamento atualizado com sucesso' })
  async updateScheduledReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateScheduledReportDto,
    @Request() req: any,
  ) {
    return this.analyticsService.updateScheduledReport(id, dto, req.user.id);
  }

  @Delete('reports/scheduled/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Excluir relatório agendado' })
  @ApiParam({ name: 'id', description: 'ID do agendamento' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Agendamento excluído com sucesso' })
  async deleteScheduledReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    return this.analyticsService.deleteScheduledReport(id, req.user.id);
  }

  // ==================== Dashboards ====================

  @Post('dashboards')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Criar dashboard' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Dashboard criado com sucesso' })
  async createDashboard(
    @Body() dto: CreateDashboardDto,
    @Request() req: any,
  ) {
    return this.analyticsService.createDashboard(dto, req.user.id);
  }

  @Get('dashboards')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Listar dashboards' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Dashboards listados com sucesso' })
  async findAllDashboards(
    @Query() query: DashboardQueryDto,
    @Request() req: any,
  ) {
    return this.analyticsService.findAllDashboards(query, req.user.id);
  }

  @Get('dashboards/:id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Obter dashboard por ID' })
  @ApiParam({ name: 'id', description: 'ID do dashboard' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Dashboard retornado com sucesso' })
  async getDashboardById(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    return this.analyticsService.getDashboardById(id, req.user.id);
  }

  @Get('dashboards/:id/data')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Obter dados do dashboard' })
  @ApiParam({ name: 'id', description: 'ID do dashboard' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Dados do dashboard retornados com sucesso' })
  async getDashboardData(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    return this.analyticsService.getDashboardData(id, req.user.id);
  }

  @Put('dashboards/:id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Atualizar dashboard' })
  @ApiParam({ name: 'id', description: 'ID do dashboard' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Dashboard atualizado com sucesso' })
  async updateDashboard(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDashboardDto,
    @Request() req: any,
  ) {
    return this.analyticsService.updateDashboard(id, dto, req.user.id);
  }

  @Delete('dashboards/:id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Excluir dashboard' })
  @ApiParam({ name: 'id', description: 'ID do dashboard' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Dashboard excluído com sucesso' })
  async deleteDashboard(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    return this.analyticsService.deleteDashboard(id, req.user.id);
  }

  // ==================== Widgets ====================

  @Post('dashboards/:dashboardId/widgets')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Criar widget em dashboard' })
  @ApiParam({ name: 'dashboardId', description: 'ID do dashboard' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Widget criado com sucesso' })
  async createWidget(
    @Param('dashboardId', ParseUUIDPipe) dashboardId: string,
    @Body() dto: CreateWidgetDto,
    @Request() req: any,
  ) {
    return this.analyticsService.createWidget(dashboardId, dto, req.user.id);
  }

  @Put('widgets/:id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Atualizar widget' })
  @ApiParam({ name: 'id', description: 'ID do widget' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Widget atualizado com sucesso' })
  async updateWidget(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWidgetDto,
    @Request() req: any,
  ) {
    return this.analyticsService.updateWidget(id, dto, req.user.id);
  }

  @Delete('widgets/:id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Excluir widget' })
  @ApiParam({ name: 'id', description: 'ID do widget' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Widget excluído com sucesso' })
  async deleteWidget(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    return this.analyticsService.deleteWidget(id, req.user.id);
  }

  // ==================== KPIs ====================

  @Post('kpis')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar KPI' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'KPI criado com sucesso' })
  async createKPI(
    @Body() dto: CreateKPIDto,
    @Request() req: any,
  ) {
    return this.analyticsService.createKPI(dto, req.user.id);
  }

  @Get('kpis')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Listar KPIs' })
  @ApiResponse({ status: HttpStatus.OK, description: 'KPIs listados com sucesso' })
  async findAllKPIs(@Query() query: KPIQueryDto) {
    return this.analyticsService.findAllKPIs(query);
  }

  @Get('kpis/values')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Obter valores dos KPIs' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Valores dos KPIs retornados com sucesso' })
  async getKPIValues(
    @Query() query: KPIValueQueryDto,
    @Request() req: any,
  ) {
    return this.analyticsService.getKPIValues(query, req.user.id);
  }

  @Put('kpis/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar KPI' })
  @ApiParam({ name: 'id', description: 'ID do KPI' })
  @ApiResponse({ status: HttpStatus.OK, description: 'KPI atualizado com sucesso' })
  async updateKPI(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateKPIDto,
    @Request() req: any,
  ) {
    return this.analyticsService.updateKPI(id, dto, req.user.id);
  }

  @Delete('kpis/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Excluir KPI' })
  @ApiParam({ name: 'id', description: 'ID do KPI' })
  @ApiResponse({ status: HttpStatus.OK, description: 'KPI excluído com sucesso' })
  async deleteKPI(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    return this.analyticsService.deleteKPI(id, req.user.id);
  }

  // ==================== Cohorts ====================

  @Post('cohorts')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Criar coorte' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Coorte criada com sucesso' })
  async createCohort(
    @Body() dto: CreateCohortDto,
    @Request() req: any,
  ) {
    return this.analyticsService.createCohort(dto, req.user.id);
  }

  @Get('cohorts')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Listar coortes' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Coortes listadas com sucesso' })
  async findAllCohorts(
    @Query() query: CohortQueryDto,
    @Request() req: any,
  ) {
    return this.analyticsService.findAllCohorts(query, req.user.id);
  }

  @Get('cohorts/:id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Obter coorte por ID' })
  @ApiParam({ name: 'id', description: 'ID da coorte' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Coorte retornada com sucesso' })
  async getCohortById(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    return this.analyticsService.getCohortById(id, req.user.id);
  }

  @Post('cohorts/:id/refresh')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Atualizar membros da coorte' })
  @ApiParam({ name: 'id', description: 'ID da coorte' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Membros atualizados com sucesso' })
  async refreshCohortMembers(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.analyticsService.refreshCohortMembers(id);
  }

  @Post('cohorts/analyze')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Analisar coorte' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Análise da coorte retornada com sucesso' })
  async analyzeCohort(
    @Body() dto: CohortAnalysisDto,
    @Request() req: any,
  ) {
    return this.analyticsService.analyzeCohort(dto, req.user.id);
  }

  // ==================== Data Export ====================

  @Post('export')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Exportar dados' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Exportação iniciada com sucesso' })
  async exportData(
    @Body() dto: ExportDataDto,
    @Request() req: any,
  ) {
    return this.analyticsService.exportData(dto, req.user.id);
  }

  @Get('export')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar exportações' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Exportações listadas com sucesso' })
  async findAllExports(
    @Query() query: ExportQueryDto,
    @Request() req: any,
  ) {
    return this.analyticsService.findAllExports(query, req.user.id);
  }
}
