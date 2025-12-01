import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/database/prisma.service';
import { CacheService } from '@/common/services/cache.service';
import { AuditService } from '@/common/services/audit.service';

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
  AgeReceivablesDto,
  WriteOffReceivableDto,
  CreateCommissionRuleDto,
  CalculateCommissionDto,
  ExportBillingDataDto,
  InvoiceStatus,
  InvoiceType,
  PaymentStatus,
  PaymentMethod,
  InsuranceClaimStatus,
  PaymentPlanStatus,
  DiscountType,
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
  FinancialReportQueryDto,
  RevenueQueryDto,
  CashFlowQueryDto,
  ReceivablesQueryDto,
  AgingReportQueryDto,
  CommissionQueryDto,
  CommissionRulesQueryDto,
  BillingStatisticsQueryDto,
  BillingDashboardQueryDto,
  BillingExportQueryDto,
  PaymentReminderQueryDto,
} from './dto/billing-query.dto';

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ==================== Invoice Methods ====================

  async createInvoice(dto: CreateInvoiceDto, createdBy: string) {
    // Verify patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
      include: { user: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado');
    }

    // Verify clinic exists
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: dto.clinicId },
    });

    if (!clinic) {
      throw new NotFoundException('Clínica não encontrada');
    }

    // Calculate totals
    let subtotal = 0;
    const processedItems = dto.items.map((item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      let itemDiscount = 0;

      if (item.discount) {
        itemDiscount =
          item.discountType === DiscountType.PERCENTAGE
            ? itemSubtotal * (item.discount / 100)
            : item.discount;
      }

      const itemTotal = itemSubtotal - itemDiscount;
      subtotal += itemTotal;

      return {
        ...item,
        subtotal: itemSubtotal,
        discountValue: itemDiscount,
        total: itemTotal,
      };
    });

    // Apply global discount
    let globalDiscountValue = 0;
    if (dto.globalDiscount) {
      globalDiscountValue =
        dto.globalDiscountType === DiscountType.PERCENTAGE
          ? subtotal * (dto.globalDiscount / 100)
          : dto.globalDiscount;
    }

    // Calculate taxes
    let taxTotal = 0;
    const processedTaxes = dto.taxes?.map((tax) => {
      const taxValue = (subtotal - globalDiscountValue) * (tax.percentage / 100);
      taxTotal += taxValue;
      return { ...tax, value: taxValue };
    });

    const total = subtotal - globalDiscountValue + taxTotal;

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber(dto.clinicId);

    // Set due date if not provided (default: 30 days)
    const dueDate = dto.dueDate
      ? new Date(dto.dueDate)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Create invoice
    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        patientId: dto.patientId,
        clinicId: dto.clinicId,
        type: dto.type,
        status: InvoiceStatus.DRAFT,
        items: processedItems as any,
        subtotal,
        globalDiscount: dto.globalDiscount,
        globalDiscountType: dto.globalDiscountType,
        discountReason: dto.discountReason,
        discountTotal: globalDiscountValue,
        taxes: processedTaxes as any,
        taxTotal,
        total,
        amountPaid: 0,
        amountDue: total,
        issueDate: new Date(),
        dueDate,
        insuranceId: dto.insuranceId,
        insuranceAuthorizationNumber: dto.insuranceAuthorizationNumber,
        consultationId: dto.consultationId,
        appointmentId: dto.appointmentId,
        notes: dto.notes,
        internalNotes: dto.internalNotes,
        externalReference: dto.externalReference,
        acceptedPaymentMethods: dto.acceptedPaymentMethods,
        createdBy,
      },
      include: {
        patient: {
          include: { user: true },
        },
        clinic: true,
        insurance: true,
      },
    });

    // Log audit
    await this.auditService.log({
      action: 'INVOICE_CREATED',
      entityType: 'Invoice',
      entityId: invoice.id,
      userId: createdBy,
      details: {
        invoiceNumber,
        patientId: dto.patientId,
        total,
      },
    });

    // Emit event
    this.eventEmitter.emit('invoice.created', { invoice });

    // Send to patient if requested
    if (dto.sendToPatient) {
      await this.sendInvoice({
        invoiceId: invoice.id,
        sendEmail: true,
      }, createdBy);
    }

    return this.formatInvoiceResponse(invoice);
  }

  async findAllInvoices(query: InvoiceQueryDto) {
    const {
      page = 1,
      limit = 20,
      search,
      patientId,
      clinicId,
      doctorId,
      status,
      statuses,
      type,
      issueDateFrom,
      issueDateTo,
      dueDateFrom,
      dueDateTo,
      minAmount,
      maxAmount,
      overdue,
      insuranceId,
      hasInsurance,
      consultationId,
      includeItems,
      includePayments,
      includePatient,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { externalReference: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (patientId) where.patientId = patientId;
    if (clinicId) where.clinicId = clinicId;
    if (status) where.status = status;
    if (statuses?.length) where.status = { in: statuses };
    if (type) where.type = type;
    if (consultationId) where.consultationId = consultationId;
    if (insuranceId) where.insuranceId = insuranceId;
    if (hasInsurance !== undefined) {
      where.insuranceId = hasInsurance ? { not: null } : null;
    }

    if (issueDateFrom || issueDateTo) {
      where.issueDate = {};
      if (issueDateFrom) where.issueDate.gte = new Date(issueDateFrom);
      if (issueDateTo) where.issueDate.lte = new Date(issueDateTo);
    }

    if (dueDateFrom || dueDateTo) {
      where.dueDate = {};
      if (dueDateFrom) where.dueDate.gte = new Date(dueDateFrom);
      if (dueDateTo) where.dueDate.lte = new Date(dueDateTo);
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      where.total = {};
      if (minAmount !== undefined) where.total.gte = minAmount;
      if (maxAmount !== undefined) where.total.lte = maxAmount;
    }

    if (overdue) {
      where.status = { in: [InvoiceStatus.PENDING, InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID] };
      where.dueDate = { lt: new Date() };
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: {
          patient: includePatient ? { include: { user: true } } : false,
          clinic: true,
          insurance: true,
          payments: includePayments,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    // Calculate summary
    const summaryData = await this.prisma.invoice.aggregate({
      where,
      _sum: {
        total: true,
        amountPaid: true,
        amountDue: true,
      },
      _count: true,
    });

    const overdueData = await this.prisma.invoice.aggregate({
      where: {
        ...where,
        status: { in: [InvoiceStatus.PENDING, InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID] },
        dueDate: { lt: new Date() },
      },
      _sum: { amountDue: true },
      _count: true,
    });

    return {
      data: invoices.map((inv) => this.formatInvoiceResponse(inv)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: {
        totalAmount: summaryData._sum.total || 0,
        totalPaid: summaryData._sum.amountPaid || 0,
        totalPending: summaryData._sum.amountDue || 0,
        totalOverdue: overdueData._sum.amountDue || 0,
        overdueCount: overdueData._count,
      },
    };
  }

  async findInvoiceById(id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, deletedAt: null },
      include: {
        patient: { include: { user: true } },
        clinic: true,
        insurance: true,
        payments: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Fatura não encontrada');
    }

    return this.formatInvoiceResponse(invoice);
  }

  async getPatientInvoices(patientId: string, query: PatientInvoicesQueryDto) {
    const { page = 1, limit = 20, status, type, dateFrom, dateTo, pendingOnly } = query;

    const where: any = {
      patientId,
      deletedAt: null,
    };

    if (status) where.status = status;
    if (type) where.type = type;
    if (pendingOnly) {
      where.status = { in: [InvoiceStatus.PENDING, InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID] };
    }

    if (dateFrom || dateTo) {
      where.issueDate = {};
      if (dateFrom) where.issueDate.gte = new Date(dateFrom);
      if (dateTo) where.issueDate.lte = new Date(dateTo);
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: {
          clinic: true,
          payments: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices.map((inv) => this.formatInvoiceResponse(inv)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateInvoice(id: string, dto: UpdateInvoiceDto, updatedBy: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, deletedAt: null },
    });

    if (!invoice) {
      throw new NotFoundException('Fatura não encontrada');
    }

    if (![InvoiceStatus.DRAFT, InvoiceStatus.PENDING].includes(invoice.status as InvoiceStatus)) {
      throw new BadRequestException('Fatura não pode ser alterada neste status');
    }

    let updateData: any = { ...dto };

    // Recalculate if items changed
    if (dto.items) {
      let subtotal = 0;
      const processedItems = dto.items.map((item) => {
        const itemSubtotal = item.quantity * item.unitPrice;
        let itemDiscount = 0;

        if (item.discount) {
          itemDiscount =
            item.discountType === DiscountType.PERCENTAGE
              ? itemSubtotal * (item.discount / 100)
              : item.discount;
        }

        const itemTotal = itemSubtotal - itemDiscount;
        subtotal += itemTotal;

        return {
          ...item,
          subtotal: itemSubtotal,
          discountValue: itemDiscount,
          total: itemTotal,
        };
      });

      const globalDiscount = dto.globalDiscount ?? invoice.globalDiscount;
      const globalDiscountType = dto.globalDiscountType ?? invoice.globalDiscountType;

      let globalDiscountValue = 0;
      if (globalDiscount) {
        globalDiscountValue =
          globalDiscountType === DiscountType.PERCENTAGE
            ? subtotal * (globalDiscount / 100)
            : globalDiscount;
      }

      const total = subtotal - globalDiscountValue + (invoice.taxTotal || 0);

      updateData = {
        ...updateData,
        items: processedItems,
        subtotal,
        discountTotal: globalDiscountValue,
        total,
        amountDue: total - invoice.amountPaid,
      };
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        patient: { include: { user: true } },
        clinic: true,
        insurance: true,
        payments: true,
      },
    });

    await this.auditService.log({
      action: 'INVOICE_UPDATED',
      entityType: 'Invoice',
      entityId: id,
      userId: updatedBy,
      details: { changes: dto },
    });

    return this.formatInvoiceResponse(updated);
  }

  async sendInvoice(dto: SendInvoiceDto, sentBy: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: dto.invoiceId, deletedAt: null },
      include: {
        patient: { include: { user: true } },
        clinic: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Fatura não encontrada');
    }

    if (invoice.status === InvoiceStatus.DRAFT) {
      await this.prisma.invoice.update({
        where: { id: dto.invoiceId },
        data: { status: InvoiceStatus.PENDING },
      });
    }

    // Update sent timestamp
    await this.prisma.invoice.update({
      where: { id: dto.invoiceId },
      data: {
        status: InvoiceStatus.SENT,
        sentAt: new Date(),
      },
    });

    // Send notifications
    const notifications: string[] = [];

    if (dto.sendEmail) {
      const email = dto.alternativeEmail || invoice.patient.user.email;
      // Email sending logic would go here
      notifications.push('email');
      this.eventEmitter.emit('notification.send', {
        type: 'INVOICE_SENT',
        channel: 'email',
        recipient: email,
        data: {
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.total,
          dueDate: invoice.dueDate,
        },
      });
    }

    if (dto.sendSms) {
      const phone = dto.alternativePhone || invoice.patient.phone;
      notifications.push('sms');
      this.eventEmitter.emit('notification.send', {
        type: 'INVOICE_SENT',
        channel: 'sms',
        recipient: phone,
        data: {
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.total,
        },
      });
    }

    if (dto.sendWhatsApp) {
      const phone = dto.alternativePhone || invoice.patient.phone;
      notifications.push('whatsapp');
      this.eventEmitter.emit('notification.send', {
        type: 'INVOICE_SENT',
        channel: 'whatsapp',
        recipient: phone,
        data: {
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.total,
          dueDate: invoice.dueDate,
        },
      });
    }

    await this.auditService.log({
      action: 'INVOICE_SENT',
      entityType: 'Invoice',
      entityId: dto.invoiceId,
      userId: sentBy,
      details: { notifications },
    });

    return {
      success: true,
      invoiceId: dto.invoiceId,
      sentVia: notifications,
      sentAt: new Date(),
    };
  }

  async cancelInvoice(id: string, dto: CancelInvoiceDto, cancelledBy: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, deletedAt: null },
      include: { payments: true },
    });

    if (!invoice) {
      throw new NotFoundException('Fatura não encontrada');
    }

    if ([InvoiceStatus.CANCELLED, InvoiceStatus.REFUNDED].includes(invoice.status as InvoiceStatus)) {
      throw new BadRequestException('Fatura já está cancelada');
    }

    // Handle refunds if requested
    if (dto.refundPayments && invoice.amountPaid > 0) {
      const completedPayments = invoice.payments.filter(
        (p) => p.status === PaymentStatus.COMPLETED,
      );

      for (const payment of completedPayments) {
        await this.refundPayment(
          {
            paymentId: payment.id,
            reason: 'DUPLICATE_PAYMENT' as any,
            description: `Estorno por cancelamento da fatura: ${dto.reason}`,
          },
          cancelledBy,
        );
      }
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: dto.reason,
        cancelledBy,
      },
    });

    await this.auditService.log({
      action: 'INVOICE_CANCELLED',
      entityType: 'Invoice',
      entityId: id,
      userId: cancelledBy,
      details: {
        reason: dto.reason,
        refundsProcessed: dto.refundPayments,
      },
    });

    this.eventEmitter.emit('invoice.cancelled', { invoice: updated });

    return { success: true, invoiceId: id };
  }

  // ==================== Payment Methods ====================

  async createPayment(dto: CreatePaymentDto, createdBy: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: dto.invoiceId, deletedAt: null },
      include: { patient: true },
    });

    if (!invoice) {
      throw new NotFoundException('Fatura não encontrada');
    }

    if ([InvoiceStatus.CANCELLED, InvoiceStatus.REFUNDED, InvoiceStatus.PAID].includes(
      invoice.status as InvoiceStatus,
    )) {
      throw new BadRequestException('Fatura não aceita pagamentos neste status');
    }

    if (dto.amount > invoice.amountDue) {
      throw new BadRequestException('Valor do pagamento excede o valor devido');
    }

    // Process payment based on method
    let paymentData: any = {
      invoiceId: dto.invoiceId,
      patientId: invoice.patientId,
      amount: dto.amount,
      method: dto.method,
      status: PaymentStatus.PENDING,
      externalReference: dto.externalReference,
      notes: dto.notes,
      metadata: dto.metadata,
      createdBy,
    };

    let paymentResponse: any = {};

    switch (dto.method) {
      case PaymentMethod.CREDIT_CARD:
      case PaymentMethod.DEBIT_CARD:
        const cardResult = await this.processCardPayment(dto, invoice);
        paymentData = { ...paymentData, ...cardResult.data };
        paymentResponse = cardResult.response;
        break;

      case PaymentMethod.PIX:
        const pixResult = await this.generatePixPayment(dto, invoice);
        paymentData = { ...paymentData, ...pixResult.data };
        paymentResponse = pixResult.response;
        break;

      case PaymentMethod.BOLETO:
        const boletoResult = await this.generateBoletoPayment(dto, invoice);
        paymentData = { ...paymentData, ...boletoResult.data };
        paymentResponse = boletoResult.response;
        break;

      case PaymentMethod.CASH:
      case PaymentMethod.CHECK:
      case PaymentMethod.BANK_TRANSFER:
        paymentData.status = PaymentStatus.PENDING;
        break;

      default:
        paymentData.status = PaymentStatus.PENDING;
    }

    const payment = await this.prisma.payment.create({
      data: paymentData,
    });

    await this.auditService.log({
      action: 'PAYMENT_CREATED',
      entityType: 'Payment',
      entityId: payment.id,
      userId: createdBy,
      details: {
        invoiceId: dto.invoiceId,
        amount: dto.amount,
        method: dto.method,
      },
    });

    this.eventEmitter.emit('payment.created', { payment, invoice });

    return {
      payment: this.formatPaymentResponse(payment),
      ...paymentResponse,
    };
  }

  async processCardPayment(dto: CreatePaymentDto, invoice: any) {
    // Integration with payment gateway would go here
    // This is a simplified implementation
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      data: {
        gatewayTransactionId: transactionId,
        cardLastFour: dto.cardDetails?.cardToken.slice(-4),
        installments: dto.cardDetails?.installments || 1,
        status: PaymentStatus.PROCESSING,
      },
      response: {
        transactionId,
        status: 'processing',
        message: 'Pagamento em processamento',
      },
    };
  }

  async generatePixPayment(dto: CreatePaymentDto, invoice: any) {
    // Integration with PIX would go here
    const pixCode = `PIX_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(
      Date.now() + (dto.pixDetails?.expirationMinutes || 30) * 60 * 1000,
    );

    return {
      data: {
        pixCode,
        pixExpiresAt: expiresAt,
        status: PaymentStatus.PENDING,
      },
      response: {
        pixCode,
        pixQrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?data=${pixCode}`,
        pixQrCodeBase64: '', // Would be generated
        expiresAt,
      },
    };
  }

  async generateBoletoPayment(dto: CreatePaymentDto, invoice: any) {
    // Integration with boleto generation would go here
    const boletoBarcode = `23793.38128 60000.000003 00000.000400 1 ${Date.now()}`;
    const daysToExpire = dto.boletoDetails?.daysToExpire || 3;
    const expiresAt = new Date(Date.now() + daysToExpire * 24 * 60 * 60 * 1000);

    return {
      data: {
        boletoBarcode,
        boletoExpiresAt: expiresAt,
        status: PaymentStatus.PENDING,
      },
      response: {
        boletoUrl: `https://boleto.example.com/${boletoBarcode}`,
        boletoBarcode,
        boletoPdfUrl: `https://boleto.example.com/${boletoBarcode}/pdf`,
        dueDate: expiresAt,
      },
    };
  }

  async confirmPayment(dto: ConfirmPaymentDto, confirmedBy: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: dto.paymentId },
      include: { invoice: true },
    });

    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado');
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Pagamento já confirmado');
    }

    const paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();

    // Update payment
    const updatedPayment = await this.prisma.payment.update({
      where: { id: dto.paymentId },
      data: {
        status: PaymentStatus.COMPLETED,
        gatewayTransactionId: dto.gatewayTransactionId,
        receiptUrl: dto.receiptUrl,
        paidAt,
      },
    });

    // Update invoice
    const newAmountPaid = payment.invoice.amountPaid + payment.amount;
    const newAmountDue = payment.invoice.total - newAmountPaid;

    let newStatus = payment.invoice.status;
    if (newAmountDue <= 0) {
      newStatus = InvoiceStatus.PAID;
    } else if (newAmountPaid > 0) {
      newStatus = InvoiceStatus.PARTIALLY_PAID;
    }

    await this.prisma.invoice.update({
      where: { id: payment.invoiceId },
      data: {
        amountPaid: newAmountPaid,
        amountDue: Math.max(0, newAmountDue),
        status: newStatus,
        paidDate: newStatus === InvoiceStatus.PAID ? paidAt : null,
      },
    });

    await this.auditService.log({
      action: 'PAYMENT_CONFIRMED',
      entityType: 'Payment',
      entityId: dto.paymentId,
      userId: confirmedBy,
      details: { amount: payment.amount, paidAt },
    });

    this.eventEmitter.emit('payment.confirmed', { payment: updatedPayment });

    // Grant points if gamification is enabled
    this.eventEmitter.emit('gamification.action', {
      userId: payment.invoice.patientId,
      action: 'PAYMENT_MADE',
      metadata: { amount: payment.amount },
    });

    return this.formatPaymentResponse(updatedPayment);
  }

  async refundPayment(dto: RefundPaymentDto, refundedBy: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: dto.paymentId },
      include: { invoice: true },
    });

    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado');
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Apenas pagamentos concluídos podem ser estornados');
    }

    const refundAmount = dto.amount || payment.amount;

    if (refundAmount > payment.amount - (payment.refundedAmount || 0)) {
      throw new BadRequestException('Valor de estorno excede o valor disponível');
    }

    const isPartialRefund = refundAmount < payment.amount;
    const totalRefunded = (payment.refundedAmount || 0) + refundAmount;

    // Process refund with gateway if applicable
    // Integration would go here

    const updatedPayment = await this.prisma.payment.update({
      where: { id: dto.paymentId },
      data: {
        status:
          totalRefunded >= payment.amount
            ? PaymentStatus.REFUNDED
            : PaymentStatus.PARTIALLY_REFUNDED,
        refundedAmount: totalRefunded,
        refundedAt: new Date(),
        refundReason: dto.reason,
        refundDescription: dto.description,
      },
    });

    // Update invoice
    const newAmountPaid = payment.invoice.amountPaid - refundAmount;
    const newAmountDue = payment.invoice.total - newAmountPaid;

    let newStatus = payment.invoice.status;
    if (newAmountPaid <= 0 && payment.invoice.status === InvoiceStatus.PAID) {
      newStatus = InvoiceStatus.REFUNDED;
    } else if (newAmountPaid > 0 && newAmountDue > 0) {
      newStatus = InvoiceStatus.PARTIALLY_PAID;
    }

    await this.prisma.invoice.update({
      where: { id: payment.invoiceId },
      data: {
        amountPaid: Math.max(0, newAmountPaid),
        amountDue: newAmountDue,
        status: newStatus,
      },
    });

    await this.auditService.log({
      action: 'PAYMENT_REFUNDED',
      entityType: 'Payment',
      entityId: dto.paymentId,
      userId: refundedBy,
      details: {
        amount: refundAmount,
        reason: dto.reason,
        isPartial: isPartialRefund,
      },
    });

    this.eventEmitter.emit('payment.refunded', {
      payment: updatedPayment,
      amount: refundAmount,
    });

    return this.formatPaymentResponse(updatedPayment);
  }

  async recordManualPayment(dto: RecordManualPaymentDto, recordedBy: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: dto.invoiceId, deletedAt: null },
    });

    if (!invoice) {
      throw new NotFoundException('Fatura não encontrada');
    }

    if (dto.amount > invoice.amountDue) {
      throw new BadRequestException('Valor excede o saldo devedor');
    }

    const payment = await this.prisma.payment.create({
      data: {
        invoiceId: dto.invoiceId,
        patientId: invoice.patientId,
        amount: dto.amount,
        method: dto.method,
        status: PaymentStatus.COMPLETED,
        paidAt: new Date(dto.paidAt),
        referenceNumber: dto.referenceNumber,
        bankName: dto.bankName,
        receiptUrl: dto.receiptUrl,
        notes: dto.notes,
        createdBy: recordedBy,
        isManual: true,
      },
    });

    // Update invoice
    const newAmountPaid = invoice.amountPaid + dto.amount;
    const newAmountDue = invoice.total - newAmountPaid;

    await this.prisma.invoice.update({
      where: { id: dto.invoiceId },
      data: {
        amountPaid: newAmountPaid,
        amountDue: Math.max(0, newAmountDue),
        status: newAmountDue <= 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID,
        paidDate: newAmountDue <= 0 ? new Date(dto.paidAt) : null,
      },
    });

    await this.auditService.log({
      action: 'MANUAL_PAYMENT_RECORDED',
      entityType: 'Payment',
      entityId: payment.id,
      userId: recordedBy,
      details: {
        invoiceId: dto.invoiceId,
        amount: dto.amount,
        method: dto.method,
      },
    });

    return this.formatPaymentResponse(payment);
  }

  async findAllPayments(query: PaymentQueryDto) {
    const {
      page = 1,
      limit = 20,
      invoiceId,
      patientId,
      clinicId,
      method,
      status,
      paidDateFrom,
      paidDateTo,
      minAmount,
      maxAmount,
      includeInvoice,
      includePatient,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: any = {};

    if (invoiceId) where.invoiceId = invoiceId;
    if (patientId) where.patientId = patientId;
    if (method) where.method = method;
    if (status) where.status = status;

    if (clinicId) {
      where.invoice = { clinicId };
    }

    if (paidDateFrom || paidDateTo) {
      where.paidAt = {};
      if (paidDateFrom) where.paidAt.gte = new Date(paidDateFrom);
      if (paidDateTo) where.paidAt.lte = new Date(paidDateTo);
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      where.amount = {};
      if (minAmount !== undefined) where.amount.gte = minAmount;
      if (maxAmount !== undefined) where.amount.lte = maxAmount;
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          invoice: includeInvoice,
          patient: includePatient ? { include: { user: true } } : false,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data: payments.map((p) => this.formatPaymentResponse(p)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ==================== Insurance Claim Methods ====================

  async createInsuranceClaim(dto: CreateInsuranceClaimDto, createdBy: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: dto.invoiceId, deletedAt: null },
    });

    if (!invoice) {
      throw new NotFoundException('Fatura não encontrada');
    }

    // Verify insurance exists
    const insurance = await this.prisma.insurance.findUnique({
      where: { id: dto.insuranceId },
    });

    if (!insurance) {
      throw new NotFoundException('Convênio não encontrado');
    }

    // Generate claim number
    const claimNumber = await this.generateClaimNumber(dto.insuranceId);

    const claim = await this.prisma.insuranceClaim.create({
      data: {
        claimNumber,
        invoiceId: dto.invoiceId,
        insuranceId: dto.insuranceId,
        patientId: dto.patientId,
        membershipNumber: dto.membershipNumber,
        priorAuthorizationNumber: dto.priorAuthorizationNumber,
        guideNumber: dto.guideNumber,
        totalAmount: dto.totalAmount,
        status: InsuranceClaimStatus.DRAFT,
        procedures: dto.procedures,
        diagnosisCodes: dto.diagnosisCodes,
        serviceDate: dto.serviceDate ? new Date(dto.serviceDate) : null,
        attachments: dto.attachments,
        clinicalNotes: dto.clinicalNotes,
        createdBy,
      },
      include: {
        invoice: true,
        insurance: true,
        patient: { include: { user: true } },
      },
    });

    await this.auditService.log({
      action: 'INSURANCE_CLAIM_CREATED',
      entityType: 'InsuranceClaim',
      entityId: claim.id,
      userId: createdBy,
      details: {
        claimNumber,
        insuranceId: dto.insuranceId,
        amount: dto.totalAmount,
      },
    });

    return this.formatInsuranceClaimResponse(claim);
  }

  async submitInsuranceClaim(id: string, submittedBy: string) {
    const claim = await this.prisma.insuranceClaim.findUnique({
      where: { id },
      include: { insurance: true },
    });

    if (!claim) {
      throw new NotFoundException('Claim não encontrado');
    }

    if (claim.status !== InsuranceClaimStatus.DRAFT) {
      throw new BadRequestException('Claim já foi submetido');
    }

    const updated = await this.prisma.insuranceClaim.update({
      where: { id },
      data: {
        status: InsuranceClaimStatus.SUBMITTED,
        submittedAt: new Date(),
      },
      include: {
        invoice: true,
        insurance: true,
        patient: { include: { user: true } },
      },
    });

    await this.auditService.log({
      action: 'INSURANCE_CLAIM_SUBMITTED',
      entityType: 'InsuranceClaim',
      entityId: id,
      userId: submittedBy,
    });

    this.eventEmitter.emit('insurance.claim.submitted', { claim: updated });

    return this.formatInsuranceClaimResponse(updated);
  }

  async updateInsuranceClaim(id: string, dto: UpdateInsuranceClaimDto, updatedBy: string) {
    const claim = await this.prisma.insuranceClaim.findUnique({
      where: { id },
    });

    if (!claim) {
      throw new NotFoundException('Claim não encontrado');
    }

    const updated = await this.prisma.insuranceClaim.update({
      where: { id },
      data: {
        ...dto,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
        reviewedAt: dto.status && dto.status !== InsuranceClaimStatus.SUBMITTED
          ? new Date()
          : undefined,
      },
      include: {
        invoice: true,
        insurance: true,
        patient: { include: { user: true } },
      },
    });

    // If approved/paid, update invoice
    if (dto.paidAmount && dto.status === InsuranceClaimStatus.PAID) {
      await this.prisma.invoice.update({
        where: { id: claim.invoiceId },
        data: {
          insuranceCoverage: dto.paidAmount,
          amountPaid: { increment: dto.paidAmount },
          amountDue: { decrement: dto.paidAmount },
        },
      });
    }

    await this.auditService.log({
      action: 'INSURANCE_CLAIM_UPDATED',
      entityType: 'InsuranceClaim',
      entityId: id,
      userId: updatedBy,
      details: dto,
    });

    return this.formatInsuranceClaimResponse(updated);
  }

  async appealInsuranceClaim(dto: AppealInsuranceClaimDto, appealedBy: string) {
    const claim = await this.prisma.insuranceClaim.findUnique({
      where: { id: dto.claimId },
    });

    if (!claim) {
      throw new NotFoundException('Claim não encontrado');
    }

    if (claim.status !== InsuranceClaimStatus.DENIED) {
      throw new BadRequestException('Apenas claims negados podem ser recorridos');
    }

    const updated = await this.prisma.insuranceClaim.update({
      where: { id: dto.claimId },
      data: {
        status: InsuranceClaimStatus.APPEALED,
        appealJustification: dto.justification,
        appealDocuments: dto.additionalDocuments,
        appealMedicalLiterature: dto.medicalLiterature,
        appealedAt: new Date(),
        appealedBy,
      },
      include: {
        invoice: true,
        insurance: true,
        patient: { include: { user: true } },
      },
    });

    await this.auditService.log({
      action: 'INSURANCE_CLAIM_APPEALED',
      entityType: 'InsuranceClaim',
      entityId: dto.claimId,
      userId: appealedBy,
      details: { justification: dto.justification },
    });

    return this.formatInsuranceClaimResponse(updated);
  }

  async findAllInsuranceClaims(query: InsuranceClaimQueryDto) {
    const {
      page = 1,
      limit = 20,
      search,
      insuranceId,
      patientId,
      clinicId,
      status,
      statuses,
      submittedFrom,
      submittedTo,
      minAmount,
      maxAmount,
      deniedOnly,
      pendingPayment,
      includeInvoice,
      includePatient,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: any = {};

    if (search) {
      where.OR = [
        { claimNumber: { contains: search, mode: 'insensitive' } },
        { guideNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (insuranceId) where.insuranceId = insuranceId;
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;
    if (statuses?.length) where.status = { in: statuses };
    if (deniedOnly) where.status = InsuranceClaimStatus.DENIED;
    if (pendingPayment) {
      where.status = InsuranceClaimStatus.APPROVED;
      where.paidAt = null;
    }

    if (clinicId) {
      where.invoice = { clinicId };
    }

    if (submittedFrom || submittedTo) {
      where.submittedAt = {};
      if (submittedFrom) where.submittedAt.gte = new Date(submittedFrom);
      if (submittedTo) where.submittedAt.lte = new Date(submittedTo);
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      where.totalAmount = {};
      if (minAmount !== undefined) where.totalAmount.gte = minAmount;
      if (maxAmount !== undefined) where.totalAmount.lte = maxAmount;
    }

    const [claims, total] = await Promise.all([
      this.prisma.insuranceClaim.findMany({
        where,
        include: {
          invoice: includeInvoice,
          insurance: true,
          patient: includePatient ? { include: { user: true } } : false,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.insuranceClaim.count({ where }),
    ]);

    return {
      data: claims.map((c) => this.formatInsuranceClaimResponse(c)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createInsuranceBatch(dto: BatchInsuranceClaimDto, createdBy: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        id: { in: dto.invoiceIds },
        insuranceId: dto.insuranceId,
        deletedAt: null,
      },
    });

    if (invoices.length !== dto.invoiceIds.length) {
      throw new BadRequestException('Algumas faturas não foram encontradas ou não pertencem ao convênio');
    }

    const batchNumber = await this.generateBatchNumber(dto.insuranceId);
    const competenceDate = dto.competenceDate ? new Date(dto.competenceDate) : new Date();

    // Create claims for each invoice
    const claims = await Promise.all(
      invoices.map((invoice) =>
        this.prisma.insuranceClaim.create({
          data: {
            claimNumber: `${batchNumber}-${invoice.invoiceNumber}`,
            invoiceId: invoice.id,
            insuranceId: dto.insuranceId,
            patientId: invoice.patientId,
            totalAmount: invoice.total,
            status: InsuranceClaimStatus.DRAFT,
            batchNumber,
            createdBy,
          },
        }),
      ),
    );

    const batch = await this.prisma.insuranceBatch.create({
      data: {
        batchNumber,
        insuranceId: dto.insuranceId,
        clinicId: invoices[0].clinicId,
        competenceDate,
        claimsCount: claims.length,
        totalAmount: invoices.reduce((sum, inv) => sum + inv.total, 0),
        status: 'DRAFT',
        createdBy,
      },
    });

    await this.auditService.log({
      action: 'INSURANCE_BATCH_CREATED',
      entityType: 'InsuranceBatch',
      entityId: batch.id,
      userId: createdBy,
      details: {
        batchNumber,
        claimsCount: claims.length,
        totalAmount: batch.totalAmount,
      },
    });

    return {
      batch,
      claims: claims.map((c) => this.formatInsuranceClaimResponse(c)),
    };
  }

  // ==================== Payment Plan Methods ====================

  async createPaymentPlan(dto: CreatePaymentPlanDto, createdBy: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: dto.invoiceId, deletedAt: null },
    });

    if (!invoice) {
      throw new NotFoundException('Fatura não encontrada');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Fatura já está paga');
    }

    const financedAmount = invoice.amountDue - (dto.downPayment || 0);
    const monthlyInterest = dto.monthlyInterestRate || 0;

    // Calculate installment amount with interest
    let installmentAmount: number;
    if (monthlyInterest > 0) {
      const rate = monthlyInterest / 100;
      installmentAmount =
        financedAmount * (rate * Math.pow(1 + rate, dto.installments)) /
        (Math.pow(1 + rate, dto.installments) - 1);
    } else {
      installmentAmount = financedAmount / dto.installments;
    }

    const totalAmount = installmentAmount * dto.installments + (dto.downPayment || 0);

    // Generate installments
    const firstDueDate = dto.firstDueDate
      ? new Date(dto.firstDueDate)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const installments = [];
    for (let i = 0; i < dto.installments; i++) {
      const dueDate = new Date(firstDueDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      if (dto.dueDay) {
        dueDate.setDate(dto.dueDay);
      }

      installments.push({
        number: i + 1,
        amount: Math.round(installmentAmount * 100) / 100,
        dueDate,
        status: 'PENDING',
      });
    }

    const paymentPlan = await this.prisma.paymentPlan.create({
      data: {
        invoiceId: dto.invoiceId,
        patientId: invoice.patientId,
        originalAmount: invoice.amountDue,
        downPayment: dto.downPayment,
        financedAmount,
        installmentsCount: dto.installments,
        installmentAmount: Math.round(installmentAmount * 100) / 100,
        monthlyInterestRate: monthlyInterest,
        totalAmount: Math.round(totalAmount * 100) / 100,
        status: PaymentPlanStatus.ACTIVE,
        paymentMethod: dto.paymentMethod,
        installments: installments as any,
        notes: dto.notes,
        recurringCardId: dto.recurringCardId,
        createdBy,
      },
      include: {
        invoice: true,
        patient: { include: { user: true } },
      },
    });

    // Process down payment if provided
    if (dto.downPayment && dto.downPayment > 0) {
      await this.recordManualPayment(
        {
          invoiceId: dto.invoiceId,
          amount: dto.downPayment,
          method: dto.paymentMethod || PaymentMethod.CASH,
          paidAt: new Date().toISOString(),
          notes: 'Entrada do parcelamento',
        },
        createdBy,
      );
    }

    // Update invoice status
    await this.prisma.invoice.update({
      where: { id: dto.invoiceId },
      data: {
        hasPaymentPlan: true,
        paymentPlanId: paymentPlan.id,
      },
    });

    await this.auditService.log({
      action: 'PAYMENT_PLAN_CREATED',
      entityType: 'PaymentPlan',
      entityId: paymentPlan.id,
      userId: createdBy,
      details: {
        installments: dto.installments,
        totalAmount,
        monthlyInterest,
      },
    });

    return this.formatPaymentPlanResponse(paymentPlan);
  }

  async payInstallment(dto: PayInstallmentDto, paidBy: string) {
    const paymentPlan = await this.prisma.paymentPlan.findUnique({
      where: { id: dto.paymentPlanId },
      include: { invoice: true },
    });

    if (!paymentPlan) {
      throw new NotFoundException('Plano de pagamento não encontrado');
    }

    if (paymentPlan.status !== PaymentPlanStatus.ACTIVE) {
      throw new BadRequestException('Plano de pagamento não está ativo');
    }

    const installments = paymentPlan.installments as any[];
    const installment = installments.find((i) => i.number === dto.installmentNumber);

    if (!installment) {
      throw new NotFoundException('Parcela não encontrada');
    }

    if (installment.status === 'PAID') {
      throw new BadRequestException('Parcela já está paga');
    }

    // Calculate late fees if applicable
    const dueDate = new Date(installment.dueDate);
    const now = new Date();
    let totalDue = installment.amount;
    let lateFee = 0;
    let interest = 0;

    if (now > dueDate) {
      const daysLate = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      lateFee = installment.amount * 0.02; // 2% late fee
      interest = installment.amount * (daysLate * 0.00033); // 0.033% per day
      totalDue = installment.amount + lateFee + interest;
    }

    const amount = dto.amount || totalDue;

    // Create payment
    const payment = await this.createPayment(
      {
        invoiceId: paymentPlan.invoiceId,
        amount,
        method: dto.method,
        cardDetails: dto.cardDetails,
        notes: `Parcela ${dto.installmentNumber}/${paymentPlan.installmentsCount}`,
      },
      paidBy,
    );

    // Update installment
    installments[dto.installmentNumber - 1] = {
      ...installment,
      status: 'PAID',
      paidAt: new Date(),
      paidAmount: amount,
      lateFee,
      interest,
      paymentId: payment.payment.id,
    };

    // Check if all installments are paid
    const allPaid = installments.every((i) => i.status === 'PAID');
    const paidCount = installments.filter((i) => i.status === 'PAID').length;

    await this.prisma.paymentPlan.update({
      where: { id: dto.paymentPlanId },
      data: {
        installments: installments as any,
        paidInstallments: paidCount,
        pendingInstallments: paymentPlan.installmentsCount - paidCount,
        totalPaid: { increment: amount },
        totalPending: { decrement: installment.amount },
        status: allPaid ? PaymentPlanStatus.COMPLETED : PaymentPlanStatus.ACTIVE,
      },
    });

    await this.auditService.log({
      action: 'INSTALLMENT_PAID',
      entityType: 'PaymentPlan',
      entityId: dto.paymentPlanId,
      userId: paidBy,
      details: {
        installmentNumber: dto.installmentNumber,
        amount,
        lateFee,
        interest,
      },
    });

    return payment;
  }

  async findAllPaymentPlans(query: PaymentPlanQueryDto) {
    const {
      page = 1,
      limit = 20,
      patientId,
      clinicId,
      status,
      hasOverdueInstallments,
      createdFrom,
      createdTo,
      includeInstallments,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: any = {};

    if (patientId) where.patientId = patientId;
    if (status) where.status = status;

    if (clinicId) {
      where.invoice = { clinicId };
    }

    if (createdFrom || createdTo) {
      where.createdAt = {};
      if (createdFrom) where.createdAt.gte = new Date(createdFrom);
      if (createdTo) where.createdAt.lte = new Date(createdTo);
    }

    const [plans, total] = await Promise.all([
      this.prisma.paymentPlan.findMany({
        where,
        include: {
          invoice: true,
          patient: { include: { user: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.paymentPlan.count({ where }),
    ]);

    // Filter by overdue installments if needed
    let filteredPlans = plans;
    if (hasOverdueInstallments) {
      const now = new Date();
      filteredPlans = plans.filter((plan) => {
        const installments = plan.installments as any[];
        return installments.some(
          (i) => i.status === 'PENDING' && new Date(i.dueDate) < now,
        );
      });
    }

    return {
      data: filteredPlans.map((p) => this.formatPaymentPlanResponse(p)),
      total: hasOverdueInstallments ? filteredPlans.length : total,
      page,
      limit,
      totalPages: Math.ceil((hasOverdueInstallments ? filteredPlans.length : total) / limit),
    };
  }

  // ==================== Price Table Methods ====================

  async createPriceTable(dto: CreatePriceTableDto, createdBy: string) {
    const priceTable = await this.prisma.priceTable.create({
      data: {
        name: dto.name,
        type: dto.type,
        description: dto.description,
        validFrom: new Date(dto.validFrom),
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        insuranceId: dto.insuranceId,
        multiplier: dto.multiplier,
        isDefault: dto.isDefault || false,
        isActive: true,
        items: dto.items as any,
        createdBy,
      },
    });

    // If this is set as default, unset others
    if (dto.isDefault) {
      await this.prisma.priceTable.updateMany({
        where: {
          id: { not: priceTable.id },
          type: dto.type,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    await this.auditService.log({
      action: 'PRICE_TABLE_CREATED',
      entityType: 'PriceTable',
      entityId: priceTable.id,
      userId: createdBy,
      details: { name: dto.name, type: dto.type },
    });

    return this.formatPriceTableResponse(priceTable);
  }

  async updatePriceTable(id: string, dto: UpdatePriceTableDto, updatedBy: string) {
    const priceTable = await this.prisma.priceTable.findUnique({
      where: { id },
    });

    if (!priceTable) {
      throw new NotFoundException('Tabela de preços não encontrada');
    }

    const updated = await this.prisma.priceTable.update({
      where: { id },
      data: {
        ...dto,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      },
    });

    // If setting as default, unset others
    if (dto.isDefault) {
      await this.prisma.priceTable.updateMany({
        where: {
          id: { not: id },
          type: priceTable.type,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    await this.auditService.log({
      action: 'PRICE_TABLE_UPDATED',
      entityType: 'PriceTable',
      entityId: id,
      userId: updatedBy,
      details: dto,
    });

    return this.formatPriceTableResponse(updated);
  }

  async addPriceTableItems(id: string, items: PriceTableItemDto[], addedBy: string) {
    const priceTable = await this.prisma.priceTable.findUnique({
      where: { id },
    });

    if (!priceTable) {
      throw new NotFoundException('Tabela de preços não encontrada');
    }

    const existingItems = (priceTable.items as any[]) || [];
    const newItems = items.map((item) => ({
      ...item,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isActive: item.isActive ?? true,
      createdAt: new Date(),
    }));

    const updated = await this.prisma.priceTable.update({
      where: { id },
      data: {
        items: [...existingItems, ...newItems] as any,
      },
    });

    await this.auditService.log({
      action: 'PRICE_TABLE_ITEMS_ADDED',
      entityType: 'PriceTable',
      entityId: id,
      userId: addedBy,
      details: { itemsCount: items.length },
    });

    return this.formatPriceTableResponse(updated);
  }

  async findAllPriceTables(query: PriceTableQueryDto) {
    const {
      page = 1,
      limit = 20,
      search,
      type,
      insuranceId,
      activeOnly,
      validOn,
      includeItems,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: any = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (type) where.type = type;
    if (insuranceId) where.insuranceId = insuranceId;
    if (activeOnly) where.isActive = true;

    if (validOn) {
      const date = new Date(validOn);
      where.validFrom = { lte: date };
      where.OR = [
        { validUntil: null },
        { validUntil: { gte: date } },
      ];
    }

    const [tables, total] = await Promise.all([
      this.prisma.priceTable.findMany({
        where,
        include: {
          insurance: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.priceTable.count({ where }),
    ]);

    return {
      data: tables.map((t) => this.formatPriceTableResponse(t, includeItems)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPriceForService(code: string, insuranceId?: string, priceTableId?: string) {
    let priceTable: any;

    if (priceTableId) {
      priceTable = await this.prisma.priceTable.findUnique({
        where: { id: priceTableId },
      });
    } else if (insuranceId) {
      priceTable = await this.prisma.priceTable.findFirst({
        where: {
          insuranceId,
          isActive: true,
          validFrom: { lte: new Date() },
          OR: [
            { validUntil: null },
            { validUntil: { gte: new Date() } },
          ],
        },
      });
    }

    if (!priceTable) {
      // Get default private table
      priceTable = await this.prisma.priceTable.findFirst({
        where: {
          type: 'PRIVATE',
          isDefault: true,
          isActive: true,
        },
      });
    }

    if (!priceTable) {
      throw new NotFoundException('Tabela de preços não encontrada');
    }

    const items = priceTable.items as any[];
    const item = items.find(
      (i) =>
        i.code === code ||
        i.tussCode === code ||
        i.cbhpmCode === code,
    );

    if (!item) {
      throw new NotFoundException('Item não encontrado na tabela de preços');
    }

    const finalPrice = priceTable.multiplier
      ? item.price * priceTable.multiplier
      : item.price;

    return {
      code: item.code,
      description: item.description,
      originalPrice: item.price,
      multiplier: priceTable.multiplier || 1,
      finalPrice,
      priceTable: {
        id: priceTable.id,
        name: priceTable.name,
        type: priceTable.type,
      },
    };
  }

  // ==================== Financial Reports ====================

  async getRevenue(query: RevenueQueryDto) {
    const {
      startDate,
      endDate,
      clinicId,
      granularity = 'day',
      groupByType,
      groupByInsurance,
      groupByDoctor,
    } = query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const where: any = {
      issueDate: { gte: start, lte: end },
      deletedAt: null,
      status: { not: InvoiceStatus.CANCELLED },
    };

    if (clinicId) where.clinicId = clinicId;

    const invoices = await this.prisma.invoice.findMany({
      where,
      include: {
        insurance: true,
      },
    });

    // Calculate totals
    let totalGross = 0;
    let totalNet = 0;
    let totalDiscounts = 0;
    let totalRefunds = 0;

    invoices.forEach((inv) => {
      totalGross += inv.total;
      totalNet += inv.amountPaid;
      totalDiscounts += inv.discountTotal || 0;
    });

    // Get refunds
    const refunds = await this.prisma.payment.aggregate({
      where: {
        invoice: where,
        status: { in: [PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED] },
      },
      _sum: { refundedAmount: true },
    });

    totalRefunds = refunds._sum.refundedAmount || 0;

    // Group data by granularity
    const dataPoints = this.groupByGranularity(invoices, granularity, start, end);

    return {
      period: {
        start,
        end,
        granularity,
      },
      totalGross,
      totalNet: totalNet - totalRefunds,
      totalDiscounts,
      totalRefunds,
      data: dataPoints,
      averages: {
        dailyGross: totalGross / Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
        dailyNet: (totalNet - totalRefunds) / Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
        perInvoice: totalGross / (invoices.length || 1),
        perPatient: totalGross / (new Set(invoices.map((i) => i.patientId)).size || 1),
      },
    };
  }

  async getCashFlow(query: CashFlowQueryDto) {
    const {
      startDate,
      endDate,
      clinicId,
      granularity = 'day',
      includeProjections,
    } = query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const where: any = {
      paidAt: { gte: start, lte: end },
      status: PaymentStatus.COMPLETED,
    };

    if (clinicId) {
      where.invoice = { clinicId };
    }

    const payments = await this.prisma.payment.findMany({
      where,
      include: { invoice: true },
    });

    // Get refunds
    const refunds = await this.prisma.payment.findMany({
      where: {
        ...where,
        refundedAt: { gte: start, lte: end },
      },
    });

    let totalInflow = 0;
    let totalOutflow = 0;

    payments.forEach((p) => {
      totalInflow += p.amount;
    });

    refunds.forEach((r) => {
      totalOutflow += r.refundedAmount || 0;
    });

    const netFlow = totalInflow - totalOutflow;

    // Group data
    const dataPoints = this.groupCashFlowByGranularity(payments, refunds, granularity, start, end);

    const result: any = {
      period: { start, end, granularity },
      openingBalance: 0, // Would need bank integration
      closingBalance: netFlow,
      totalInflow,
      totalOutflow,
      netFlow,
      data: dataPoints,
    };

    // Add projections if requested
    if (includeProjections) {
      result.projections = await this.generateCashFlowProjections(clinicId);
    }

    return result;
  }

  async getAgingReport(query: AgingReportQueryDto) {
    const { clinicId, referenceDate, groupBy, insuranceId } = query;

    const refDate = referenceDate ? new Date(referenceDate) : new Date();

    const where: any = {
      status: { in: [InvoiceStatus.PENDING, InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE] },
      deletedAt: null,
      dueDate: { lt: refDate },
    };

    if (clinicId) where.clinicId = clinicId;
    if (insuranceId) where.insuranceId = insuranceId;

    const overdueInvoices = await this.prisma.invoice.findMany({
      where,
      include: {
        patient: { include: { user: true } },
        insurance: true,
      },
    });

    // Define aging buckets
    const buckets = [
      { name: '1-30 dias', min: 1, max: 30 },
      { name: '31-60 dias', min: 31, max: 60 },
      { name: '61-90 dias', min: 61, max: 90 },
      { name: '91-120 dias', min: 91, max: 120 },
      { name: 'Mais de 120 dias', min: 121, max: Infinity },
    ];

    const aging = buckets.map((bucket) => {
      const invoicesInBucket = overdueInvoices.filter((inv) => {
        const daysOverdue = Math.ceil(
          (refDate.getTime() - new Date(inv.dueDate!).getTime()) / (1000 * 60 * 60 * 24),
        );
        return daysOverdue >= bucket.min && daysOverdue <= bucket.max;
      });

      const amount = invoicesInBucket.reduce((sum, inv) => sum + inv.amountDue, 0);

      return {
        bucket: bucket.name,
        daysRange: `${bucket.min}-${bucket.max === Infinity ? '+' : bucket.max}`,
        count: invoicesInBucket.length,
        amount,
        percentage: 0, // Will be calculated after
      };
    });

    const totalReceivables = overdueInvoices.reduce((sum, inv) => sum + inv.amountDue, 0);

    // Calculate percentages
    aging.forEach((a) => {
      a.percentage = totalReceivables > 0 ? (a.amount / totalReceivables) * 100 : 0;
    });

    const result: any = {
      referenceDate: refDate,
      totalReceivables,
      totalOverdue: totalReceivables,
      overduePercentage: 100,
      aging,
    };

    // Group by patient if requested
    if (groupBy === 'patient') {
      const byPatient = new Map<string, any>();

      overdueInvoices.forEach((inv) => {
        const patientId = inv.patientId;
        if (!byPatient.has(patientId)) {
          byPatient.set(patientId, {
            patientId,
            patientName: inv.patient.user.name,
            total: 0,
            overdue: 0,
            oldestDue: inv.dueDate,
          });
        }

        const patient = byPatient.get(patientId);
        patient.total += inv.amountDue;
        patient.overdue += inv.amountDue;
        if (new Date(inv.dueDate!) < new Date(patient.oldestDue)) {
          patient.oldestDue = inv.dueDate;
        }
      });

      result.byPatient = Array.from(byPatient.values()).sort((a, b) => b.total - a.total);
    }

    // Group by insurance if requested
    if (groupBy === 'insurance' || insuranceId) {
      const byInsurance = new Map<string, any>();

      overdueInvoices.filter((inv) => inv.insuranceId).forEach((inv) => {
        const insuranceId = inv.insuranceId!;
        if (!byInsurance.has(insuranceId)) {
          byInsurance.set(insuranceId, {
            insuranceId,
            insuranceName: inv.insurance?.name,
            total: 0,
            overdue: 0,
          });
        }

        const insurance = byInsurance.get(insuranceId);
        insurance.total += inv.amountDue;
        insurance.overdue += inv.amountDue;
      });

      result.byInsurance = Array.from(byInsurance.values()).sort((a, b) => b.total - a.total);
    }

    return result;
  }

  async getBillingStatistics(query: BillingStatisticsQueryDto) {
    const {
      startDate,
      endDate,
      clinicId,
      includeComparison,
      includeTypeBreakdown,
      includeInsuranceBreakdown,
      includePaymentMethodBreakdown,
    } = query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const where: any = {
      createdAt: { gte: start, lte: end },
      deletedAt: null,
    };

    if (clinicId) where.clinicId = clinicId;

    // Invoice statistics
    const invoiceStats = await this.prisma.invoice.aggregate({
      where,
      _count: true,
      _sum: {
        total: true,
        amountPaid: true,
        discountTotal: true,
        taxTotal: true,
      },
      _avg: { total: true },
    });

    const paidInvoices = await this.prisma.invoice.count({
      where: { ...where, status: InvoiceStatus.PAID },
    });

    const overdueInvoices = await this.prisma.invoice.count({
      where: {
        ...where,
        status: { in: [InvoiceStatus.PENDING, InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID] },
        dueDate: { lt: new Date() },
      },
    });

    const cancelledInvoices = await this.prisma.invoice.count({
      where: { ...where, status: InvoiceStatus.CANCELLED },
    });

    // Payment statistics
    const paymentWhere: any = {
      createdAt: { gte: start, lte: end },
    };
    if (clinicId) paymentWhere.invoice = { clinicId };

    const paymentStats = await this.prisma.payment.aggregate({
      where: paymentWhere,
      _count: true,
      _sum: { amount: true, refundedAmount: true },
    });

    const completedPayments = await this.prisma.payment.count({
      where: { ...paymentWhere, status: PaymentStatus.COMPLETED },
    });

    const failedPayments = await this.prisma.payment.count({
      where: { ...paymentWhere, status: PaymentStatus.FAILED },
    });

    // Insurance statistics
    const claimStats = await this.prisma.insuranceClaim.aggregate({
      where: {
        createdAt: { gte: start, lte: end },
      },
      _count: true,
      _sum: { totalAmount: true, approvedAmount: true },
    });

    const approvedClaims = await this.prisma.insuranceClaim.count({
      where: {
        createdAt: { gte: start, lte: end },
        status: { in: [InsuranceClaimStatus.APPROVED, InsuranceClaimStatus.PAID] },
      },
    });

    const deniedClaims = await this.prisma.insuranceClaim.count({
      where: {
        createdAt: { gte: start, lte: end },
        status: InsuranceClaimStatus.DENIED,
      },
    });

    const result: any = {
      period: { start, end },
      invoices: {
        total: invoiceStats._count,
        issued: invoiceStats._count - cancelledInvoices,
        paid: paidInvoices,
        overdue: overdueInvoices,
        cancelled: cancelledInvoices,
        averageValue: invoiceStats._avg.total || 0,
        medianValue: 0, // Would need additional query
      },
      revenue: {
        gross: invoiceStats._sum.total || 0,
        net: (invoiceStats._sum.amountPaid || 0) - (paymentStats._sum.refundedAmount || 0),
        discounts: invoiceStats._sum.discountTotal || 0,
        refunds: paymentStats._sum.refundedAmount || 0,
        taxes: invoiceStats._sum.taxTotal || 0,
      },
      payments: {
        total: paymentStats._count,
        completed: completedPayments,
        pending: paymentStats._count - completedPayments - failedPayments,
        failed: failedPayments,
        averageTime: 0, // Would need additional calculation
      },
      insurance: {
        claims: claimStats._count,
        approved: approvedClaims,
        denied: deniedClaims,
        pending: claimStats._count - approvedClaims - deniedClaims,
        approvalRate: claimStats._count > 0 ? (approvedClaims / claimStats._count) * 100 : 0,
        averageProcessingTime: 0, // Would need additional calculation
      },
    };

    // Add breakdowns if requested
    if (includeTypeBreakdown) {
      const byType = await this.prisma.invoice.groupBy({
        by: ['type'],
        where,
        _count: true,
        _sum: { total: true },
      });

      result.byType = {};
      byType.forEach((t) => {
        result.byType[t.type] = {
          count: t._count,
          amount: t._sum.total || 0,
          percentage: invoiceStats._sum.total
            ? ((t._sum.total || 0) / invoiceStats._sum.total) * 100
            : 0,
        };
      });
    }

    if (includePaymentMethodBreakdown) {
      const byMethod = await this.prisma.payment.groupBy({
        by: ['method'],
        where: { ...paymentWhere, status: PaymentStatus.COMPLETED },
        _count: true,
        _sum: { amount: true },
      });

      result.byPaymentMethod = {};
      byMethod.forEach((m) => {
        result.byPaymentMethod[m.method] = {
          count: m._count,
          amount: m._sum.amount || 0,
          percentage: paymentStats._sum.amount
            ? ((m._sum.amount || 0) / paymentStats._sum.amount) * 100
            : 0,
        };
      });
    }

    return result;
  }

  async getDashboard(query: BillingDashboardQueryDto) {
    const { clinicId, period = 'month', startDate, endDate } = query;

    let start: Date;
    let end = new Date();

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      switch (period) {
        case 'today':
          start = new Date();
          start.setHours(0, 0, 0, 0);
          break;
        case 'week':
          start = new Date();
          start.setDate(start.getDate() - 7);
          break;
        case 'year':
          start = new Date();
          start.setFullYear(start.getFullYear() - 1);
          break;
        case 'month':
        default:
          start = new Date();
          start.setMonth(start.getMonth() - 1);
      }
    }

    const where: any = {
      createdAt: { gte: start, lte: end },
      deletedAt: null,
    };

    if (clinicId) where.clinicId = clinicId;

    // Get summary data
    const summary = await this.prisma.invoice.aggregate({
      where: { ...where, status: { not: InvoiceStatus.CANCELLED } },
      _sum: { total: true, amountDue: true },
    });

    const overdueAmount = await this.prisma.invoice.aggregate({
      where: {
        ...where,
        status: { in: [InvoiceStatus.PENDING, InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID] },
        dueDate: { lt: new Date() },
      },
      _sum: { amountDue: true },
    });

    // Today's stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayInvoices = await this.prisma.invoice.count({
      where: {
        clinicId: clinicId || undefined,
        createdAt: { gte: todayStart },
        deletedAt: null,
      },
    });

    const todayPayments = await this.prisma.payment.aggregate({
      where: {
        invoice: clinicId ? { clinicId } : undefined,
        paidAt: { gte: todayStart },
        status: PaymentStatus.COMPLETED,
      },
      _count: true,
      _sum: { amount: true },
    });

    // Recent invoices
    const recentInvoices = await this.prisma.invoice.findMany({
      where: { clinicId: clinicId || undefined, deletedAt: null },
      include: {
        patient: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Recent payments
    const recentPayments = await this.prisma.payment.findMany({
      where: {
        invoice: clinicId ? { clinicId } : undefined,
        status: PaymentStatus.COMPLETED,
      },
      include: { invoice: true },
      orderBy: { paidAt: 'desc' },
      take: 5,
    });

    // Overdue invoices
    const overdueInvoices = await this.prisma.invoice.findMany({
      where: {
        clinicId: clinicId || undefined,
        status: { in: [InvoiceStatus.PENDING, InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID] },
        dueDate: { lt: new Date() },
        deletedAt: null,
      },
      include: {
        patient: { include: { user: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
    });

    // Generate alerts
    const alerts = [];

    if (overdueInvoices.length > 0) {
      alerts.push({
        type: 'OVERDUE_INVOICES',
        message: `${overdueInvoices.length} fatura(s) em atraso`,
        count: overdueInvoices.length,
        severity: 'warning',
      });
    }

    return {
      period,
      summary: {
        totalRevenue: summary._sum.total || 0,
        totalPending: summary._sum.amountDue || 0,
        totalOverdue: overdueAmount._sum.amountDue || 0,
        revenueChange: 0, // Would compare with previous period
      },
      todayStats: {
        invoicesIssued: todayInvoices,
        paymentsReceived: todayPayments._count,
        paymentsAmount: todayPayments._sum.amount || 0,
      },
      recentInvoices: recentInvoices.map((inv) => this.formatInvoiceResponse(inv)),
      recentPayments: recentPayments.map((p) => this.formatPaymentResponse(p)),
      overdueInvoices: overdueInvoices.map((inv) => this.formatInvoiceResponse(inv)),
      alerts,
    };
  }

  // ==================== Helper Methods ====================

  private async generateInvoiceNumber(clinicId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.invoice.count({
      where: {
        clinicId,
        invoiceNumber: { startsWith: `INV-${year}` },
      },
    });
    return `INV-${year}-${String(count + 1).padStart(6, '0')}`;
  }

  private async generateClaimNumber(insuranceId: string): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await this.prisma.insuranceClaim.count({
      where: {
        insuranceId,
        claimNumber: { startsWith: `CLM-${year}${month}` },
      },
    });
    return `CLM-${year}${month}-${String(count + 1).padStart(5, '0')}`;
  }

  private async generateBatchNumber(insuranceId: string): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await this.prisma.insuranceBatch.count({
      where: {
        insuranceId,
        batchNumber: { startsWith: `BAT-${year}${month}` },
      },
    });
    return `BAT-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }

  private formatInvoiceResponse(invoice: any) {
    const daysOverdue = invoice.dueDate && invoice.status !== InvoiceStatus.PAID
      ? Math.max(0, Math.ceil((Date.now() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      patientId: invoice.patientId,
      patientName: invoice.patient?.user?.name,
      patientCpf: invoice.patient?.cpf,
      clinicId: invoice.clinicId,
      clinicName: invoice.clinic?.name,
      type: invoice.type,
      status: invoice.status,
      items: invoice.items,
      subtotal: invoice.subtotal,
      globalDiscount: invoice.globalDiscount,
      globalDiscountType: invoice.globalDiscountType,
      discountReason: invoice.discountReason,
      discountTotal: invoice.discountTotal,
      taxes: invoice.taxes,
      taxTotal: invoice.taxTotal,
      total: invoice.total,
      amountPaid: invoice.amountPaid,
      amountDue: invoice.amountDue,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      paidDate: invoice.paidDate,
      insuranceId: invoice.insuranceId,
      insuranceName: invoice.insurance?.name,
      insuranceAuthorizationNumber: invoice.insuranceAuthorizationNumber,
      insuranceCoverage: invoice.insuranceCoverage,
      consultationId: invoice.consultationId,
      appointmentId: invoice.appointmentId,
      notes: invoice.notes,
      internalNotes: invoice.internalNotes,
      externalReference: invoice.externalReference,
      sentAt: invoice.sentAt,
      daysOverdue,
      acceptedPaymentMethods: invoice.acceptedPaymentMethods,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      createdBy: invoice.createdBy,
    };
  }

  private formatPaymentResponse(payment: any) {
    return {
      id: payment.id,
      invoiceId: payment.invoiceId,
      invoiceNumber: payment.invoice?.invoiceNumber,
      patientId: payment.patientId,
      patientName: payment.patient?.user?.name,
      amount: payment.amount,
      method: payment.method,
      status: payment.status,
      gatewayTransactionId: payment.gatewayTransactionId,
      cardLastFour: payment.cardLastFour,
      cardBrand: payment.cardBrand,
      installments: payment.installments,
      pixCode: payment.pixCode,
      pixExpiresAt: payment.pixExpiresAt,
      boletoBarcode: payment.boletoBarcode,
      boletoExpiresAt: payment.boletoExpiresAt,
      referenceNumber: payment.referenceNumber,
      bankName: payment.bankName,
      receiptUrl: payment.receiptUrl,
      paidAt: payment.paidAt,
      refundedAt: payment.refundedAt,
      refundedAmount: payment.refundedAmount,
      refundReason: payment.refundReason,
      notes: payment.notes,
      metadata: payment.metadata,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }

  private formatInsuranceClaimResponse(claim: any) {
    return {
      id: claim.id,
      claimNumber: claim.claimNumber,
      invoiceId: claim.invoiceId,
      invoiceNumber: claim.invoice?.invoiceNumber,
      insuranceId: claim.insuranceId,
      insuranceName: claim.insurance?.name,
      patientId: claim.patientId,
      patientName: claim.patient?.user?.name,
      membershipNumber: claim.membershipNumber,
      priorAuthorizationNumber: claim.priorAuthorizationNumber,
      guideNumber: claim.guideNumber,
      totalAmount: claim.totalAmount,
      approvedAmount: claim.approvedAmount,
      paidAmount: claim.paidAmount,
      status: claim.status,
      procedures: claim.procedures,
      diagnosisCodes: claim.diagnosisCodes,
      serviceDate: claim.serviceDate,
      submittedAt: claim.submittedAt,
      reviewedAt: claim.reviewedAt,
      paidAt: claim.paidAt,
      denialReason: claim.denialReason,
      denialExplanation: claim.denialExplanation,
      deniedItems: claim.deniedItems,
      attachments: claim.attachments,
      clinicalNotes: claim.clinicalNotes,
      internalNotes: claim.internalNotes,
      createdAt: claim.createdAt,
      updatedAt: claim.updatedAt,
    };
  }

  private formatPaymentPlanResponse(plan: any) {
    const installments = plan.installments as any[];
    const now = new Date();

    const overdueInstallments = installments.filter(
      (i) => i.status === 'PENDING' && new Date(i.dueDate) < now,
    ).length;

    const nextInstallment = installments.find(
      (i) => i.status === 'PENDING',
    );

    return {
      id: plan.id,
      invoiceId: plan.invoiceId,
      invoiceNumber: plan.invoice?.invoiceNumber,
      patientId: plan.patientId,
      patientName: plan.patient?.user?.name,
      originalAmount: plan.originalAmount,
      downPayment: plan.downPayment,
      financedAmount: plan.financedAmount,
      installmentsCount: plan.installmentsCount,
      installmentAmount: plan.installmentAmount,
      monthlyInterestRate: plan.monthlyInterestRate,
      totalAmount: plan.totalAmount,
      status: plan.status,
      paymentMethod: plan.paymentMethod,
      paidInstallments: plan.paidInstallments,
      pendingInstallments: plan.pendingInstallments,
      overdueInstallments,
      totalPaid: plan.totalPaid,
      totalPending: plan.totalPending,
      installments,
      nextInstallment,
      notes: plan.notes,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }

  private formatPriceTableResponse(table: any, includeItems = false) {
    const items = table.items as any[];
    return {
      id: table.id,
      name: table.name,
      type: table.type,
      description: table.description,
      validFrom: table.validFrom,
      validUntil: table.validUntil,
      insuranceId: table.insuranceId,
      insuranceName: table.insurance?.name,
      multiplier: table.multiplier,
      isDefault: table.isDefault,
      isActive: table.isActive,
      itemsCount: items?.length || 0,
      items: includeItems ? items : undefined,
      createdAt: table.createdAt,
      updatedAt: table.updatedAt,
    };
  }

  private groupByGranularity(invoices: any[], granularity: string, start: Date, end: Date) {
    const data: any[] = [];
    const current = new Date(start);

    while (current <= end) {
      const periodStart = new Date(current);
      let periodEnd: Date;

      switch (granularity) {
        case 'week':
          periodEnd = new Date(current);
          periodEnd.setDate(periodEnd.getDate() + 7);
          break;
        case 'month':
          periodEnd = new Date(current);
          periodEnd.setMonth(periodEnd.getMonth() + 1);
          break;
        case 'year':
          periodEnd = new Date(current);
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
          break;
        case 'day':
        default:
          periodEnd = new Date(current);
          periodEnd.setDate(periodEnd.getDate() + 1);
      }

      const periodInvoices = invoices.filter((inv) => {
        const date = new Date(inv.issueDate);
        return date >= periodStart && date < periodEnd;
      });

      const gross = periodInvoices.reduce((sum, inv) => sum + inv.total, 0);
      const net = periodInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
      const discounts = periodInvoices.reduce((sum, inv) => sum + (inv.discountTotal || 0), 0);

      data.push({
        date: periodStart.toISOString().split('T')[0],
        gross,
        net,
        discounts,
        refunds: 0,
      });

      current.setTime(periodEnd.getTime());
    }

    return data;
  }

  private groupCashFlowByGranularity(
    payments: any[],
    refunds: any[],
    granularity: string,
    start: Date,
    end: Date,
  ) {
    const data: any[] = [];
    const current = new Date(start);
    let cumulativeBalance = 0;

    while (current <= end) {
      const periodStart = new Date(current);
      let periodEnd: Date;

      switch (granularity) {
        case 'week':
          periodEnd = new Date(current);
          periodEnd.setDate(periodEnd.getDate() + 7);
          break;
        case 'month':
          periodEnd = new Date(current);
          periodEnd.setMonth(periodEnd.getMonth() + 1);
          break;
        case 'day':
        default:
          periodEnd = new Date(current);
          periodEnd.setDate(periodEnd.getDate() + 1);
      }

      const periodPayments = payments.filter((p) => {
        const date = new Date(p.paidAt);
        return date >= periodStart && date < periodEnd;
      });

      const periodRefunds = refunds.filter((r) => {
        const date = new Date(r.refundedAt);
        return date >= periodStart && date < periodEnd;
      });

      const inflow = periodPayments.reduce((sum, p) => sum + p.amount, 0);
      const outflow = periodRefunds.reduce((sum, r) => sum + (r.refundedAmount || 0), 0);
      const balance = inflow - outflow;
      cumulativeBalance += balance;

      data.push({
        date: periodStart.toISOString().split('T')[0],
        inflow,
        outflow,
        balance,
        cumulativeBalance,
      });

      current.setTime(periodEnd.getTime());
    }

    return data;
  }

  private async generateCashFlowProjections(clinicId?: string) {
    // Simple projection based on pending receivables
    const projections: any[] = [];
    const now = new Date();

    // Get pending invoices with due dates
    const pendingInvoices = await this.prisma.invoice.findMany({
      where: {
        clinicId: clinicId || undefined,
        status: { in: [InvoiceStatus.PENDING, InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID] },
        dueDate: { gte: now },
        deletedAt: null,
      },
      orderBy: { dueDate: 'asc' },
    });

    // Group by day for next 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const dayInvoices = pendingInvoices.filter((inv) => {
        const dueDate = new Date(inv.dueDate!).toISOString().split('T')[0];
        return dueDate === dateStr;
      });

      const expectedInflow = dayInvoices.reduce((sum, inv) => sum + inv.amountDue, 0);

      projections.push({
        date: dateStr,
        inflow: expectedInflow,
        outflow: 0,
        balance: expectedInflow,
        cumulativeBalance: projections.length > 0
          ? projections[projections.length - 1].cumulativeBalance + expectedInflow
          : expectedInflow,
      });
    }

    return projections;
  }
}
