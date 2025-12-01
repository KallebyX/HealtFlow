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
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole } from '@/common/enums/user-role.enum';

import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  SendInvoiceDto,
  CancelInvoiceDto,
  CreatePaymentDto,
  ConfirmPaymentDto,
  RefundPaymentDto,
  RecordManualPaymentDto,
  CreateInsuranceClaimDto,
  UpdateInsuranceClaimDto,
  AppealInsuranceClaimDto,
  BatchInsuranceClaimDto,
  CreatePaymentPlanDto,
  PayInstallmentDto,
  RenegotiatePaymentPlanDto,
  CreatePriceTableDto,
  UpdatePriceTableDto,
  PriceTableItemDto,
  GenerateFinancialReportDto,
  CreateCommissionRuleDto,
  CalculateCommissionDto,
} from './dto/create-billing.dto';

import {
  InvoiceQueryDto,
  PatientInvoicesQueryDto,
  OverdueInvoicesQueryDto,
  PaymentQueryDto,
  PaymentReconciliationQueryDto,
  InsuranceClaimQueryDto,
  InsuranceBatchQueryDto,
  PaymentPlanQueryDto,
  InstallmentQueryDto,
  PriceTableQueryDto,
  PriceTableItemQueryDto,
  RevenueQueryDto,
  CashFlowQueryDto,
  AgingReportQueryDto,
  CommissionQueryDto,
  CommissionRulesQueryDto,
  BillingStatisticsQueryDto,
  BillingDashboardQueryDto,
} from './dto/billing-query.dto';

@ApiTags('Billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // ==================== Invoice Endpoints ====================

  @Post('invoices')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Criar fatura' })
  @ApiResponse({ status: 201, description: 'Fatura criada' })
  async createInvoice(
    @Body() dto: CreateInvoiceDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.billingService.createInvoice(dto, userId);
  }

  @Get('invoices')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Listar faturas' })
  @ApiResponse({ status: 200, description: 'Lista de faturas' })
  async findAllInvoices(@Query() query: InvoiceQueryDto) {
    return this.billingService.findAllInvoices(query);
  }

  @Get('invoices/overdue')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Listar faturas em atraso' })
  @ApiResponse({ status: 200, description: 'Faturas em atraso' })
  async getOverdueInvoices(@Query() query: OverdueInvoicesQueryDto) {
    return this.billingService.findAllInvoices({ ...query, overdue: true });
  }

  @Get('invoices/my')
  @ApiOperation({ summary: 'Minhas faturas (paciente)' })
  @ApiResponse({ status: 200, description: 'Faturas do paciente' })
  async getMyInvoices(
    @Query() query: PatientInvoicesQueryDto,
    @CurrentUser('patientId') patientId: string,
  ) {
    return this.billingService.getPatientInvoices(patientId, query);
  }

  @Get('invoices/patient/:patientId')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Faturas de um paciente' })
  @ApiParam({ name: 'patientId', description: 'ID do paciente' })
  async getPatientInvoices(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query() query: PatientInvoicesQueryDto,
  ) {
    return this.billingService.getPatientInvoices(patientId, query);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Detalhes da fatura' })
  @ApiParam({ name: 'id', description: 'ID da fatura' })
  async findInvoiceById(@Param('id', ParseUUIDPipe) id: string) {
    return this.billingService.findInvoiceById(id);
  }

  @Put('invoices/:id')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Atualizar fatura' })
  @ApiParam({ name: 'id', description: 'ID da fatura' })
  async updateInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvoiceDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.billingService.updateInvoice(id, dto, userId);
  }

  @Post('invoices/send')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Enviar fatura ao paciente' })
  @ApiResponse({ status: 200, description: 'Fatura enviada' })
  async sendInvoice(
    @Body() dto: SendInvoiceDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.billingService.sendInvoice(dto, userId);
  }

  @Post('invoices/:id/cancel')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Cancelar fatura' })
  @ApiParam({ name: 'id', description: 'ID da fatura' })
  async cancelInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelInvoiceDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.billingService.cancelInvoice(id, dto, userId);
  }

  // ==================== Payment Endpoints ====================

  @Post('payments')
  @ApiOperation({ summary: 'Criar pagamento' })
  @ApiResponse({ status: 201, description: 'Pagamento iniciado' })
  async createPayment(
    @Body() dto: CreatePaymentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.billingService.createPayment(dto, userId);
  }

  @Get('payments')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Listar pagamentos' })
  @ApiResponse({ status: 200, description: 'Lista de pagamentos' })
  async findAllPayments(@Query() query: PaymentQueryDto) {
    return this.billingService.findAllPayments(query);
  }

  @Post('payments/confirm')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Confirmar pagamento' })
  @ApiResponse({ status: 200, description: 'Pagamento confirmado' })
  async confirmPayment(
    @Body() dto: ConfirmPaymentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.billingService.confirmPayment(dto, userId);
  }

  @Post('payments/refund')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Estornar pagamento' })
  @ApiResponse({ status: 200, description: 'Pagamento estornado' })
  async refundPayment(
    @Body() dto: RefundPaymentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.billingService.refundPayment(dto, userId);
  }

  @Post('payments/manual')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Registrar pagamento manual' })
  @ApiResponse({ status: 201, description: 'Pagamento registrado' })
  async recordManualPayment(
    @Body() dto: RecordManualPaymentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.billingService.recordManualPayment(dto, userId);
  }

  // ==================== Insurance Claim Endpoints ====================

  @Post('insurance-claims')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Criar claim de convênio' })
  @ApiResponse({ status: 201, description: 'Claim criado' })
  async createInsuranceClaim(
    @Body() dto: CreateInsuranceClaimDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.billingService.createInsuranceClaim(dto, userId);
  }

  @Get('insurance-claims')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Listar claims de convênio' })
  @ApiResponse({ status: 200, description: 'Lista de claims' })
  async findAllInsuranceClaims(@Query() query: InsuranceClaimQueryDto) {
    return this.billingService.findAllInsuranceClaims(query);
  }

  @Post('insurance-claims/:id/submit')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Submeter claim ao convênio' })
  @ApiParam({ name: 'id', description: 'ID do claim' })
  async submitInsuranceClaim(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.billingService.submitInsuranceClaim(id, userId);
  }

  @Put('insurance-claims/:id')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Atualizar claim de convênio' })
  @ApiParam({ name: 'id', description: 'ID do claim' })
  async updateInsuranceClaim(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInsuranceClaimDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.billingService.updateInsuranceClaim(id, dto, userId);
  }

  @Post('insurance-claims/appeal')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Recorrer de negativa' })
  @ApiResponse({ status: 200, description: 'Recurso registrado' })
  async appealInsuranceClaim(
    @Body() dto: AppealInsuranceClaimDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.billingService.appealInsuranceClaim(dto, userId);
  }

  @Post('insurance-claims/batch')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar lote de faturamento' })
  @ApiResponse({ status: 201, description: 'Lote criado' })
  async createInsuranceBatch(
    @Body() dto: BatchInsuranceClaimDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.billingService.createInsuranceBatch(dto, userId);
  }

  // ==================== Payment Plan Endpoints ====================

  @Post('payment-plans')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Criar plano de pagamento' })
  @ApiResponse({ status: 201, description: 'Plano criado' })
  async createPaymentPlan(
    @Body() dto: CreatePaymentPlanDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.billingService.createPaymentPlan(dto, userId);
  }

  @Get('payment-plans')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Listar planos de pagamento' })
  @ApiResponse({ status: 200, description: 'Lista de planos' })
  async findAllPaymentPlans(@Query() query: PaymentPlanQueryDto) {
    return this.billingService.findAllPaymentPlans(query);
  }

  @Post('payment-plans/pay-installment')
  @ApiOperation({ summary: 'Pagar parcela' })
  @ApiResponse({ status: 200, description: 'Parcela paga' })
  async payInstallment(
    @Body() dto: PayInstallmentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.billingService.payInstallment(dto, userId);
  }

  // ==================== Price Table Endpoints ====================

  @Post('price-tables')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar tabela de preços' })
  @ApiResponse({ status: 201, description: 'Tabela criada' })
  async createPriceTable(
    @Body() dto: CreatePriceTableDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.billingService.createPriceTable(dto, userId);
  }

  @Get('price-tables')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Listar tabelas de preços' })
  @ApiResponse({ status: 200, description: 'Lista de tabelas' })
  async findAllPriceTables(@Query() query: PriceTableQueryDto) {
    return this.billingService.findAllPriceTables(query);
  }

  @Put('price-tables/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar tabela de preços' })
  @ApiParam({ name: 'id', description: 'ID da tabela' })
  async updatePriceTable(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePriceTableDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.billingService.updatePriceTable(id, dto, userId);
  }

  @Post('price-tables/:id/items')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Adicionar itens à tabela de preços' })
  @ApiParam({ name: 'id', description: 'ID da tabela' })
  async addPriceTableItems(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() items: PriceTableItemDto[],
    @CurrentUser('id') userId: string,
  ) {
    return this.billingService.addPriceTableItems(id, items, userId);
  }

  @Get('price-tables/lookup')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Consultar preço de serviço' })
  @ApiQuery({ name: 'code', description: 'Código do serviço' })
  @ApiQuery({ name: 'insuranceId', required: false, description: 'ID do convênio' })
  @ApiQuery({ name: 'priceTableId', required: false, description: 'ID da tabela' })
  async getPriceForService(
    @Query('code') code: string,
    @Query('insuranceId') insuranceId?: string,
    @Query('priceTableId') priceTableId?: string,
  ) {
    return this.billingService.getPriceForService(code, insuranceId, priceTableId);
  }

  // ==================== Financial Reports Endpoints ====================

  @Get('reports/revenue')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Relatório de receita' })
  @ApiResponse({ status: 200, description: 'Relatório de receita' })
  async getRevenue(@Query() query: RevenueQueryDto) {
    return this.billingService.getRevenue(query);
  }

  @Get('reports/cash-flow')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Relatório de fluxo de caixa' })
  @ApiResponse({ status: 200, description: 'Fluxo de caixa' })
  async getCashFlow(@Query() query: CashFlowQueryDto) {
    return this.billingService.getCashFlow(query);
  }

  @Get('reports/aging')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Relatório de aging (vencimentos)' })
  @ApiResponse({ status: 200, description: 'Relatório de aging' })
  async getAgingReport(@Query() query: AgingReportQueryDto) {
    return this.billingService.getAgingReport(query);
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Estatísticas de faturamento' })
  @ApiResponse({ status: 200, description: 'Estatísticas gerais' })
  async getStatistics(@Query() query: BillingStatisticsQueryDto) {
    return this.billingService.getBillingStatistics(query);
  }

  @Get('dashboard')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Dashboard de faturamento' })
  @ApiResponse({ status: 200, description: 'Dashboard' })
  async getDashboard(@Query() query: BillingDashboardQueryDto) {
    return this.billingService.getDashboard(query);
  }
}
