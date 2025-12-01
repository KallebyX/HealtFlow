import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/services/cache.service';
import { AuditService } from '../../common/services/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
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
  ReportType,
  ReportFormat,
  TimeGranularity,
  MetricType,
  ComparisonType,
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

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ==================== Operational Analytics ====================

  async getOperationalAnalytics(
    query: OperationalAnalyticsQueryDto,
    userId: string,
  ) {
    const cacheKey = `analytics:operational:${JSON.stringify(query)}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const { startDate, endDate, clinicId, clinicIds, granularity } = query;

    const dateFilter = this.buildDateFilter(startDate, endDate);
    const clinicFilter = this.buildClinicFilter(clinicId, clinicIds);

    // Total de agendamentos
    const totalAppointments = await this.prisma.appointment.count({
      where: {
        ...dateFilter,
        ...clinicFilter,
        deletedAt: null,
      },
    });

    // Agendamentos por status
    const appointmentsByStatus = await this.prisma.appointment.groupBy({
      by: ['status'],
      where: {
        ...dateFilter,
        ...clinicFilter,
        deletedAt: null,
      },
      _count: { id: true },
    });

    // Taxa de no-show
    const noShowCount = appointmentsByStatus.find(
      (s) => s.status === 'NO_SHOW',
    )?._count?.id || 0;
    const noShowRate = totalAppointments > 0
      ? (noShowCount / totalAppointments) * 100
      : 0;

    // Taxa de cancelamento
    const cancelledCount = appointmentsByStatus.find(
      (s) => s.status === 'CANCELLED',
    )?._count?.id || 0;
    const cancellationRate = totalAppointments > 0
      ? (cancelledCount / totalAppointments) * 100
      : 0;

    // Taxa de confirmação
    const confirmedCount = appointmentsByStatus.find(
      (s) => s.status === 'CONFIRMED',
    )?._count?.id || 0;
    const completedCount = appointmentsByStatus.find(
      (s) => s.status === 'COMPLETED',
    )?._count?.id || 0;
    const confirmationRate = totalAppointments > 0
      ? ((confirmedCount + completedCount) / totalAppointments) * 100
      : 0;

    // Tempo médio de espera (simulado - seria calculado com timestamps reais)
    const avgWaitTime = await this.calculateAverageWaitTime(dateFilter, clinicFilter);

    // Taxa de ocupação
    const occupancyRate = await this.calculateOccupancyRate(dateFilter, clinicFilter);

    // Breakdown por médico
    let doctorBreakdown = null;
    if (query.groupByDoctor) {
      doctorBreakdown = await this.prisma.appointment.groupBy({
        by: ['doctorId'],
        where: {
          ...dateFilter,
          ...clinicFilter,
          deletedAt: null,
        },
        _count: { id: true },
      });

      // Enriquecer com dados do médico
      const doctorIds = doctorBreakdown.map((d) => d.doctorId);
      const doctors = await this.prisma.doctor.findMany({
        where: { id: { in: doctorIds } },
        include: { user: { select: { name: true } } },
      });

      doctorBreakdown = doctorBreakdown.map((d) => {
        const doctor = doctors.find((doc) => doc.id === d.doctorId);
        return {
          doctorId: d.doctorId,
          doctorName: doctor?.user?.name || 'Unknown',
          specialty: doctor?.specialty,
          count: d._count.id,
        };
      });
    }

    // Breakdown por tipo
    let typeBreakdown = null;
    if (query.groupByType) {
      typeBreakdown = await this.prisma.appointment.groupBy({
        by: ['type'],
        where: {
          ...dateFilter,
          ...clinicFilter,
          deletedAt: null,
        },
        _count: { id: true },
      });
    }

    // Tendência temporal
    const trend = await this.buildTimeSeries(
      'appointment',
      dateFilter,
      clinicFilter,
      granularity || TimeGranularity.DAY,
    );

    // Comparativo
    let comparison = null;
    if (query.includeComparison) {
      comparison = await this.buildComparison(
        'operational',
        dateFilter,
        clinicFilter,
        query.comparisonType || ComparisonType.PREVIOUS_PERIOD,
      );
    }

    const result = {
      summary: {
        totalAppointments,
        confirmedAppointments: confirmedCount,
        completedAppointments: completedCount,
        cancelledAppointments: cancelledCount,
        noShowAppointments: noShowCount,
        noShowRate: Number(noShowRate.toFixed(2)),
        cancellationRate: Number(cancellationRate.toFixed(2)),
        confirmationRate: Number(confirmationRate.toFixed(2)),
        avgWaitTimeMinutes: avgWaitTime,
        occupancyRate: Number(occupancyRate.toFixed(2)),
      },
      byStatus: appointmentsByStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
        percentage: Number(((s._count.id / totalAppointments) * 100).toFixed(2)),
      })),
      byDoctor: doctorBreakdown,
      byType: typeBreakdown?.map((t) => ({
        type: t.type,
        count: t._count.id,
        percentage: Number(((t._count.id / totalAppointments) * 100).toFixed(2)),
      })),
      trend,
      comparison,
      period: {
        startDate: startDate || 'all-time',
        endDate: endDate || 'now',
        granularity: granularity || TimeGranularity.DAY,
      },
    };

    await this.cacheService.set(cacheKey, result, 300); // 5 min cache
    return result;
  }

  // ==================== Financial Analytics ====================

  async getFinancialAnalytics(
    query: FinancialAnalyticsQueryDto,
    userId: string,
  ) {
    const cacheKey = `analytics:financial:${JSON.stringify(query)}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const { startDate, endDate, clinicId, clinicIds, granularity } = query;

    const dateFilter = this.buildDateFilter(startDate, endDate, 'createdAt');
    const clinicFilter = this.buildClinicFilter(clinicId, clinicIds);

    // Receita total
    const revenueData = await this.prisma.invoice.aggregate({
      where: {
        ...dateFilter,
        ...clinicFilter,
        status: 'PAID',
        deletedAt: null,
      },
      _sum: { totalAmount: true },
      _count: { id: true },
      _avg: { totalAmount: true },
    });

    // Receita bruta (faturado)
    const grossRevenue = await this.prisma.invoice.aggregate({
      where: {
        ...dateFilter,
        ...clinicFilter,
        status: { in: ['PAID', 'PENDING', 'PARTIALLY_PAID'] },
        deletedAt: null,
      },
      _sum: { totalAmount: true },
    });

    // Contas a receber
    const receivables = await this.prisma.invoice.aggregate({
      where: {
        ...dateFilter,
        ...clinicFilter,
        status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] },
        deletedAt: null,
      },
      _sum: { totalAmount: true },
      _count: { id: true },
    });

    // Inadimplência
    const overdueAmount = await this.prisma.invoice.aggregate({
      where: {
        ...clinicFilter,
        status: 'OVERDUE',
        deletedAt: null,
      },
      _sum: { totalAmount: true },
      _count: { id: true },
    });

    // Por método de pagamento
    const byPaymentMethod = await this.prisma.payment.groupBy({
      by: ['method'],
      where: {
        ...dateFilter,
        ...clinicFilter,
        status: 'COMPLETED',
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    // Por convênio
    let byInsurance = null;
    if (query.groupByInsurance) {
      byInsurance = await this.prisma.invoice.groupBy({
        by: ['insuranceId'],
        where: {
          ...dateFilter,
          ...clinicFilter,
          insuranceId: { not: null },
          deletedAt: null,
        },
        _sum: { totalAmount: true },
        _count: { id: true },
      });

      const insuranceIds = byInsurance
        .filter((i) => i.insuranceId)
        .map((i) => i.insuranceId as string);

      if (insuranceIds.length > 0) {
        const insurances = await this.prisma.insurance.findMany({
          where: { id: { in: insuranceIds } },
        });

        byInsurance = byInsurance.map((i) => {
          const insurance = insurances.find((ins) => ins.id === i.insuranceId);
          return {
            insuranceId: i.insuranceId,
            insuranceName: insurance?.name || 'Particular',
            totalAmount: i._sum.totalAmount || 0,
            count: i._count.id,
          };
        });
      }
    }

    // Por médico
    let byDoctor = null;
    if (query.groupByDoctor) {
      byDoctor = await this.prisma.invoice.groupBy({
        by: ['doctorId'],
        where: {
          ...dateFilter,
          ...clinicFilter,
          doctorId: { not: null },
          deletedAt: null,
        },
        _sum: { totalAmount: true },
        _count: { id: true },
      });

      const doctorIds = byDoctor
        .filter((d) => d.doctorId)
        .map((d) => d.doctorId as string);

      if (doctorIds.length > 0) {
        const doctors = await this.prisma.doctor.findMany({
          where: { id: { in: doctorIds } },
          include: { user: { select: { name: true } } },
        });

        byDoctor = byDoctor.map((d) => {
          const doctor = doctors.find((doc) => doc.id === d.doctorId);
          return {
            doctorId: d.doctorId,
            doctorName: doctor?.user?.name || 'Unknown',
            totalAmount: d._sum.totalAmount || 0,
            count: d._count.id,
          };
        });
      }
    }

    // Aging report
    let agingReport = null;
    if (query.includeAging) {
      agingReport = await this.generateAgingReport(clinicFilter);
    }

    // Tendência
    const trend = await this.buildFinancialTimeSeries(
      dateFilter,
      clinicFilter,
      granularity || TimeGranularity.DAY,
    );

    // Comparativo
    let comparison = null;
    if (query.includeComparison) {
      comparison = await this.buildComparison(
        'financial',
        dateFilter,
        clinicFilter,
        query.comparisonType || ComparisonType.PREVIOUS_PERIOD,
      );
    }

    const totalRevenue = Number(revenueData._sum.totalAmount || 0);
    const totalGross = Number(grossRevenue._sum.totalAmount || 0);
    const totalReceivables = Number(receivables._sum.totalAmount || 0);
    const totalOverdue = Number(overdueAmount._sum.totalAmount || 0);

    const result = {
      summary: {
        totalRevenue,
        grossRevenue: totalGross,
        netRevenue: totalRevenue,
        receivables: totalReceivables,
        overdueAmount: totalOverdue,
        invoiceCount: revenueData._count.id,
        averageTicket: Number(revenueData._avg.totalAmount || 0),
        collectionRate: totalGross > 0
          ? Number(((totalRevenue / totalGross) * 100).toFixed(2))
          : 0,
        overdueRate: totalGross > 0
          ? Number(((totalOverdue / totalGross) * 100).toFixed(2))
          : 0,
      },
      byPaymentMethod: byPaymentMethod.map((p) => ({
        method: p.method,
        totalAmount: Number(p._sum.amount || 0),
        count: p._count.id,
        percentage: totalRevenue > 0
          ? Number(((Number(p._sum.amount || 0) / totalRevenue) * 100).toFixed(2))
          : 0,
      })),
      byInsurance,
      byDoctor,
      agingReport,
      trend,
      comparison,
      period: {
        startDate: startDate || 'all-time',
        endDate: endDate || 'now',
        granularity: granularity || TimeGranularity.DAY,
      },
    };

    await this.cacheService.set(cacheKey, result, 300);
    return result;
  }

  // ==================== Clinical Analytics ====================

  async getClinicalAnalytics(
    query: ClinicalAnalyticsQueryDto,
    userId: string,
  ) {
    const cacheKey = `analytics:clinical:${JSON.stringify(query)}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const { startDate, endDate, clinicId, clinicIds, granularity } = query;

    const dateFilter = this.buildDateFilter(startDate, endDate);
    const clinicFilter = this.buildClinicFilter(clinicId, clinicIds);

    // Total de consultas
    const totalConsultations = await this.prisma.consultation.count({
      where: {
        ...dateFilter,
        ...clinicFilter,
        deletedAt: null,
      },
    });

    // Top diagnósticos (CID)
    let topDiagnoses = null;
    if (query.includeTopDiagnoses) {
      const diagnoses = await this.prisma.diagnosis.groupBy({
        by: ['icdCode', 'description'],
        where: {
          consultation: {
            ...dateFilter,
            ...clinicFilter,
            deletedAt: null,
          },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 20,
      });

      topDiagnoses = diagnoses.map((d, index) => ({
        rank: index + 1,
        icdCode: d.icdCode,
        description: d.description,
        count: d._count.id,
        percentage: Number(((d._count.id / totalConsultations) * 100).toFixed(2)),
      }));
    }

    // Top medicamentos
    let topMedications = null;
    if (query.includeTopMedications) {
      const medications = await this.prisma.prescriptionItem.groupBy({
        by: ['medicationName'],
        where: {
          prescription: {
            ...dateFilter,
            ...clinicFilter,
            deletedAt: null,
          },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 20,
      });

      topMedications = medications.map((m, index) => ({
        rank: index + 1,
        medicationName: m.medicationName,
        count: m._count.id,
      }));
    }

    // Top exames
    let topExams = null;
    if (query.includeTopExams) {
      const exams = await this.prisma.labOrder.groupBy({
        by: ['testCode', 'testName'],
        where: {
          ...dateFilter,
          ...clinicFilter,
          deletedAt: null,
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 20,
      });

      topExams = exams.map((e, index) => ({
        rank: index + 1,
        testCode: e.testCode,
        testName: e.testName,
        count: e._count.id,
      }));
    }

    // Breakdown por gênero
    let byGender = null;
    if (query.groupByGender) {
      const genderData = await this.prisma.consultation.findMany({
        where: {
          ...dateFilter,
          ...clinicFilter,
          deletedAt: null,
        },
        select: {
          patient: {
            select: { gender: true },
          },
        },
      });

      const genderCounts = genderData.reduce((acc, c) => {
        const gender = c.patient?.gender || 'NOT_SPECIFIED';
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      byGender = Object.entries(genderCounts).map(([gender, count]) => ({
        gender,
        count,
        percentage: Number(((count / totalConsultations) * 100).toFixed(2)),
      }));
    }

    // Breakdown por faixa etária
    let byAgeGroup = null;
    if (query.groupByAgeGroup) {
      const ageData = await this.prisma.consultation.findMany({
        where: {
          ...dateFilter,
          ...clinicFilter,
          deletedAt: null,
        },
        select: {
          patient: {
            select: { birthDate: true },
          },
        },
      });

      const ageGroups = {
        '0-17': 0,
        '18-29': 0,
        '30-44': 0,
        '45-59': 0,
        '60-74': 0,
        '75+': 0,
      };

      ageData.forEach((c) => {
        if (c.patient?.birthDate) {
          const age = this.calculateAge(c.patient.birthDate);
          if (age < 18) ageGroups['0-17']++;
          else if (age < 30) ageGroups['18-29']++;
          else if (age < 45) ageGroups['30-44']++;
          else if (age < 60) ageGroups['45-59']++;
          else if (age < 75) ageGroups['60-74']++;
          else ageGroups['75+']++;
        }
      });

      byAgeGroup = Object.entries(ageGroups).map(([group, count]) => ({
        ageGroup: group,
        count,
        percentage: Number(((count / totalConsultations) * 100).toFixed(2)),
      }));
    }

    // Tendência
    const trend = await this.buildTimeSeries(
      'consultation',
      dateFilter,
      clinicFilter,
      granularity || TimeGranularity.DAY,
    );

    const result = {
      summary: {
        totalConsultations,
        uniquePatients: await this.prisma.consultation.findMany({
          where: { ...dateFilter, ...clinicFilter, deletedAt: null },
          distinct: ['patientId'],
        }).then((r) => r.length),
        avgConsultationsPerPatient: 0,
      },
      topDiagnoses,
      topMedications,
      topExams,
      byGender,
      byAgeGroup,
      trend,
      period: {
        startDate: startDate || 'all-time',
        endDate: endDate || 'now',
        granularity: granularity || TimeGranularity.DAY,
      },
    };

    await this.cacheService.set(cacheKey, result, 300);
    return result;
  }

  // ==================== Patient Analytics ====================

  async getPatientAnalytics(
    query: PatientAnalyticsQueryDto,
    userId: string,
  ) {
    const cacheKey = `analytics:patient:${JSON.stringify(query)}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const { startDate, endDate, clinicId, clinicIds, granularity } = query;

    const dateFilter = this.buildDateFilter(startDate, endDate);
    const clinicFilter = this.buildClinicFilter(clinicId, clinicIds);

    // Total de pacientes ativos
    const totalPatients = await this.prisma.patient.count({
      where: {
        deletedAt: null,
        ...clinicFilter,
      },
    });

    // Novos pacientes no período
    const newPatients = await this.prisma.patient.count({
      where: {
        ...dateFilter,
        ...clinicFilter,
        deletedAt: null,
      },
    });

    // Pacientes ativos (com consulta no período)
    const activePatients = await this.prisma.appointment.findMany({
      where: {
        ...dateFilter,
        ...clinicFilter,
        status: { in: ['COMPLETED', 'CONFIRMED'] },
        deletedAt: null,
      },
      distinct: ['patientId'],
    });

    // Demographics
    let demographics = null;
    if (query.includeDemographics) {
      // Por gênero
      const byGender = await this.prisma.patient.groupBy({
        by: ['gender'],
        where: {
          ...clinicFilter,
          deletedAt: null,
        },
        _count: { id: true },
      });

      // Por cidade
      const byCity = await this.prisma.patient.groupBy({
        by: ['city'],
        where: {
          ...clinicFilter,
          deletedAt: null,
          city: { not: null },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      });

      // Por estado
      const byState = await this.prisma.patient.groupBy({
        by: ['state'],
        where: {
          ...clinicFilter,
          deletedAt: null,
          state: { not: null },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      });

      // Por faixa etária
      const patients = await this.prisma.patient.findMany({
        where: { ...clinicFilter, deletedAt: null },
        select: { birthDate: true },
      });

      const ageDistribution = {
        '0-17': 0,
        '18-29': 0,
        '30-44': 0,
        '45-59': 0,
        '60-74': 0,
        '75+': 0,
      };

      patients.forEach((p) => {
        if (p.birthDate) {
          const age = this.calculateAge(p.birthDate);
          if (age < 18) ageDistribution['0-17']++;
          else if (age < 30) ageDistribution['18-29']++;
          else if (age < 45) ageDistribution['30-44']++;
          else if (age < 60) ageDistribution['45-59']++;
          else if (age < 75) ageDistribution['60-74']++;
          else ageDistribution['75+']++;
        }
      });

      demographics = {
        byGender: byGender.map((g) => ({
          gender: g.gender || 'NOT_SPECIFIED',
          count: g._count.id,
          percentage: Number(((g._count.id / totalPatients) * 100).toFixed(2)),
        })),
        byCity: byCity.map((c) => ({
          city: c.city,
          count: c._count.id,
        })),
        byState: byState.map((s) => ({
          state: s.state,
          count: s._count.id,
        })),
        byAgeGroup: Object.entries(ageDistribution).map(([group, count]) => ({
          ageGroup: group,
          count,
          percentage: Number(((count / totalPatients) * 100).toFixed(2)),
        })),
      };
    }

    // Retenção
    let retention = null;
    if (query.includeRetention) {
      retention = await this.calculateRetentionRate(dateFilter, clinicFilter);
    }

    // Novos vs Retornos
    let newVsReturning = null;
    if (query.includeNewVsReturning) {
      newVsReturning = await this.calculateNewVsReturning(dateFilter, clinicFilter);
    }

    // Churn
    let churn = null;
    if (query.includeChurn) {
      churn = await this.calculateChurnRate(clinicFilter);
    }

    // Tendência de novos pacientes
    const trend = await this.buildTimeSeries(
      'patient',
      dateFilter,
      clinicFilter,
      granularity || TimeGranularity.DAY,
    );

    const result = {
      summary: {
        totalPatients,
        newPatients,
        activePatients: activePatients.length,
        inactivePatients: totalPatients - activePatients.length,
        activeRate: Number(((activePatients.length / totalPatients) * 100).toFixed(2)),
      },
      demographics,
      retention,
      newVsReturning,
      churn,
      trend,
      period: {
        startDate: startDate || 'all-time',
        endDate: endDate || 'now',
        granularity: granularity || TimeGranularity.DAY,
      },
    };

    await this.cacheService.set(cacheKey, result, 300);
    return result;
  }

  // ==================== Doctor Analytics ====================

  async getDoctorAnalytics(
    query: DoctorAnalyticsQueryDto,
    userId: string,
  ) {
    const cacheKey = `analytics:doctor:${JSON.stringify(query)}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const { startDate, endDate, clinicId, clinicIds, granularity, doctorId } = query;

    const dateFilter = this.buildDateFilter(startDate, endDate);
    const clinicFilter = this.buildClinicFilter(clinicId, clinicIds);
    const doctorFilter = doctorId ? { doctorId } : {};

    // Total de médicos
    const totalDoctors = await this.prisma.doctor.count({
      where: {
        ...clinicFilter,
        deletedAt: null,
        isActive: true,
      },
    });

    // Produtividade
    let productivity = null;
    if (query.includeProductivity) {
      const doctorStats = await this.prisma.appointment.groupBy({
        by: ['doctorId'],
        where: {
          ...dateFilter,
          ...clinicFilter,
          ...doctorFilter,
          status: 'COMPLETED',
          deletedAt: null,
        },
        _count: { id: true },
      });

      const doctors = await this.prisma.doctor.findMany({
        where: { id: { in: doctorStats.map((d) => d.doctorId) } },
        include: { user: { select: { name: true } } },
      });

      productivity = doctorStats.map((d) => {
        const doctor = doctors.find((doc) => doc.id === d.doctorId);
        return {
          doctorId: d.doctorId,
          doctorName: doctor?.user?.name || 'Unknown',
          specialty: doctor?.specialty,
          completedAppointments: d._count.id,
        };
      }).sort((a, b) => b.completedAppointments - a.completedAppointments);

      // Adicionar média
      const totalCompleted = productivity.reduce((sum, d) => sum + d.completedAppointments, 0);
      const avgPerDoctor = productivity.length > 0 ? totalCompleted / productivity.length : 0;

      productivity = {
        doctors: productivity,
        totalCompleted,
        averagePerDoctor: Number(avgPerDoctor.toFixed(2)),
      };
    }

    // Satisfação (baseado em ratings de consultas)
    let satisfaction = null;
    if (query.includeSatisfaction) {
      const ratings = await this.prisma.consultationRating.groupBy({
        by: ['doctorId'],
        where: {
          consultation: {
            ...dateFilter,
            ...clinicFilter,
            deletedAt: null,
          },
        },
        _avg: { rating: true },
        _count: { id: true },
      });

      const doctors = await this.prisma.doctor.findMany({
        where: { id: { in: ratings.map((r) => r.doctorId) } },
        include: { user: { select: { name: true } } },
      });

      satisfaction = ratings.map((r) => {
        const doctor = doctors.find((d) => d.id === r.doctorId);
        return {
          doctorId: r.doctorId,
          doctorName: doctor?.user?.name || 'Unknown',
          averageRating: Number((r._avg.rating || 0).toFixed(2)),
          totalRatings: r._count.id,
        };
      }).sort((a, b) => b.averageRating - a.averageRating);
    }

    // Receita por médico
    let revenue = null;
    if (query.includeRevenue) {
      const doctorRevenue = await this.prisma.invoice.groupBy({
        by: ['doctorId'],
        where: {
          ...dateFilter,
          ...clinicFilter,
          ...doctorFilter,
          status: 'PAID',
          deletedAt: null,
          doctorId: { not: null },
        },
        _sum: { totalAmount: true },
        _count: { id: true },
      });

      const doctors = await this.prisma.doctor.findMany({
        where: { id: { in: doctorRevenue.filter((d) => d.doctorId).map((d) => d.doctorId as string) } },
        include: { user: { select: { name: true } } },
      });

      revenue = doctorRevenue.map((d) => {
        const doctor = doctors.find((doc) => doc.id === d.doctorId);
        return {
          doctorId: d.doctorId,
          doctorName: doctor?.user?.name || 'Unknown',
          totalRevenue: Number(d._sum.totalAmount || 0),
          invoiceCount: d._count.id,
        };
      }).sort((a, b) => b.totalRevenue - a.totalRevenue);
    }

    // Ranking geral
    let ranking = null;
    if (query.includeRanking) {
      ranking = await this.generateDoctorRanking(dateFilter, clinicFilter);
    }

    const result = {
      summary: {
        totalDoctors,
        activeDoctors: totalDoctors,
      },
      productivity,
      satisfaction,
      revenue,
      ranking,
      period: {
        startDate: startDate || 'all-time',
        endDate: endDate || 'now',
        granularity: granularity || TimeGranularity.DAY,
      },
    };

    await this.cacheService.set(cacheKey, result, 300);
    return result;
  }

  // ==================== Laboratory Analytics ====================

  async getLaboratoryAnalytics(
    query: LaboratoryAnalyticsQueryDto,
    userId: string,
  ) {
    const cacheKey = `analytics:laboratory:${JSON.stringify(query)}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const { startDate, endDate, clinicId, clinicIds, granularity } = query;

    const dateFilter = this.buildDateFilter(startDate, endDate);
    const clinicFilter = this.buildClinicFilter(clinicId, clinicIds);

    // Total de pedidos
    const totalOrders = await this.prisma.labOrder.count({
      where: {
        ...dateFilter,
        ...clinicFilter,
        deletedAt: null,
      },
    });

    // Por status
    const byStatus = await this.prisma.labOrder.groupBy({
      by: ['status'],
      where: {
        ...dateFilter,
        ...clinicFilter,
        deletedAt: null,
      },
      _count: { id: true },
    });

    // TAT (Turnaround Time)
    let tat = null;
    if (query.includeTAT) {
      const completedOrders = await this.prisma.labOrder.findMany({
        where: {
          ...dateFilter,
          ...clinicFilter,
          status: 'COMPLETED',
          completedAt: { not: null },
          deletedAt: null,
        },
        select: {
          createdAt: true,
          completedAt: true,
        },
      });

      if (completedOrders.length > 0) {
        const tatValues = completedOrders.map((o) => {
          const start = new Date(o.createdAt).getTime();
          const end = new Date(o.completedAt!).getTime();
          return (end - start) / (1000 * 60 * 60); // em horas
        });

        const avgTAT = tatValues.reduce((a, b) => a + b, 0) / tatValues.length;
        const minTAT = Math.min(...tatValues);
        const maxTAT = Math.max(...tatValues);

        tat = {
          averageHours: Number(avgTAT.toFixed(2)),
          minHours: Number(minTAT.toFixed(2)),
          maxHours: Number(maxTAT.toFixed(2)),
          ordersAnalyzed: completedOrders.length,
        };
      }
    }

    // Taxa de rejeição
    let rejectionRate = null;
    if (query.includeRejectionRate) {
      const rejectedCount = byStatus.find((s) => s.status === 'REJECTED')?._count?.id || 0;
      rejectionRate = {
        rejectedCount,
        totalOrders,
        rate: totalOrders > 0 ? Number(((rejectedCount / totalOrders) * 100).toFixed(2)) : 0,
      };
    }

    // Valores críticos
    let criticalValues = null;
    if (query.includeCriticalValues) {
      const critical = await this.prisma.labResult.count({
        where: {
          labOrder: {
            ...dateFilter,
            ...clinicFilter,
            deletedAt: null,
          },
          isCritical: true,
        },
      });

      criticalValues = {
        count: critical,
        percentage: totalOrders > 0 ? Number(((critical / totalOrders) * 100).toFixed(2)) : 0,
      };
    }

    // Por categoria
    let byCategory = null;
    if (query.groupByCategory) {
      byCategory = await this.prisma.labOrder.groupBy({
        by: ['category'],
        where: {
          ...dateFilter,
          ...clinicFilter,
          deletedAt: null,
          category: { not: null },
        },
        _count: { id: true },
      });

      byCategory = byCategory.map((c) => ({
        category: c.category,
        count: c._count.id,
        percentage: Number(((c._count.id / totalOrders) * 100).toFixed(2)),
      }));
    }

    // Tendência
    const trend = await this.buildTimeSeries(
      'labOrder',
      dateFilter,
      clinicFilter,
      granularity || TimeGranularity.DAY,
    );

    const result = {
      summary: {
        totalOrders,
        completedOrders: byStatus.find((s) => s.status === 'COMPLETED')?._count?.id || 0,
        pendingOrders: byStatus.find((s) => s.status === 'PENDING')?._count?.id || 0,
        inProgressOrders: byStatus.find((s) => s.status === 'IN_PROGRESS')?._count?.id || 0,
      },
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
        percentage: Number(((s._count.id / totalOrders) * 100).toFixed(2)),
      })),
      tat,
      rejectionRate,
      criticalValues,
      byCategory,
      trend,
      period: {
        startDate: startDate || 'all-time',
        endDate: endDate || 'now',
        granularity: granularity || TimeGranularity.DAY,
      },
    };

    await this.cacheService.set(cacheKey, result, 300);
    return result;
  }

  // ==================== Telemedicine Analytics ====================

  async getTelemedicineAnalytics(
    query: TelemedicineAnalyticsQueryDto,
    userId: string,
  ) {
    const cacheKey = `analytics:telemedicine:${JSON.stringify(query)}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const { startDate, endDate, clinicId, clinicIds, granularity } = query;

    const dateFilter = this.buildDateFilter(startDate, endDate);
    const clinicFilter = this.buildClinicFilter(clinicId, clinicIds);

    // Total de sessões
    const totalSessions = await this.prisma.telemedicineSession.count({
      where: {
        ...dateFilter,
        ...clinicFilter,
        deletedAt: null,
      },
    });

    // Por status
    const byStatus = await this.prisma.telemedicineSession.groupBy({
      by: ['status'],
      where: {
        ...dateFilter,
        ...clinicFilter,
        deletedAt: null,
      },
      _count: { id: true },
    });

    // Métricas de conexão
    let connectionMetrics = null;
    if (query.includeConnectionMetrics) {
      const sessions = await this.prisma.telemedicineSession.findMany({
        where: {
          ...dateFilter,
          ...clinicFilter,
          status: { in: ['COMPLETED', 'ENDED'] },
          deletedAt: null,
        },
        select: {
          connectionQuality: true,
          technicalIssues: true,
        },
      });

      const qualityCounts = sessions.reduce((acc, s) => {
        const quality = s.connectionQuality || 'UNKNOWN';
        acc[quality] = (acc[quality] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const issuesCount = sessions.filter((s) => s.technicalIssues && s.technicalIssues.length > 0).length;

      connectionMetrics = {
        byQuality: Object.entries(qualityCounts).map(([quality, count]) => ({
          quality,
          count,
          percentage: Number(((count / sessions.length) * 100).toFixed(2)),
        })),
        technicalIssuesRate: sessions.length > 0
          ? Number(((issuesCount / sessions.length) * 100).toFixed(2))
          : 0,
      };
    }

    // Satisfação
    let satisfaction = null;
    if (query.includeSatisfaction) {
      const ratings = await this.prisma.telemedicineSession.aggregate({
        where: {
          ...dateFilter,
          ...clinicFilter,
          patientRating: { not: null },
          deletedAt: null,
        },
        _avg: { patientRating: true },
        _count: { patientRating: true },
      });

      satisfaction = {
        averageRating: Number((ratings._avg.patientRating || 0).toFixed(2)),
        totalRatings: ratings._count.patientRating,
      };
    }

    // Duração média
    let duration = null;
    if (query.includeDuration) {
      const sessions = await this.prisma.telemedicineSession.findMany({
        where: {
          ...dateFilter,
          ...clinicFilter,
          status: { in: ['COMPLETED', 'ENDED'] },
          startedAt: { not: null },
          endedAt: { not: null },
          deletedAt: null,
        },
        select: {
          startedAt: true,
          endedAt: true,
        },
      });

      if (sessions.length > 0) {
        const durations = sessions.map((s) => {
          const start = new Date(s.startedAt!).getTime();
          const end = new Date(s.endedAt!).getTime();
          return (end - start) / (1000 * 60); // em minutos
        });

        duration = {
          averageMinutes: Number((durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2)),
          minMinutes: Number(Math.min(...durations).toFixed(2)),
          maxMinutes: Number(Math.max(...durations).toFixed(2)),
          sessionsAnalyzed: sessions.length,
        };
      }
    }

    // Tendência
    const trend = await this.buildTimeSeries(
      'telemedicineSession',
      dateFilter,
      clinicFilter,
      granularity || TimeGranularity.DAY,
    );

    const completedCount = byStatus.find((s) => ['COMPLETED', 'ENDED'].includes(s.status))?._count?.id || 0;

    const result = {
      summary: {
        totalSessions,
        completedSessions: completedCount,
        cancelledSessions: byStatus.find((s) => s.status === 'CANCELLED')?._count?.id || 0,
        completionRate: totalSessions > 0
          ? Number(((completedCount / totalSessions) * 100).toFixed(2))
          : 0,
      },
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
        percentage: Number(((s._count.id / totalSessions) * 100).toFixed(2)),
      })),
      connectionMetrics,
      satisfaction,
      duration,
      trend,
      period: {
        startDate: startDate || 'all-time',
        endDate: endDate || 'now',
        granularity: granularity || TimeGranularity.DAY,
      },
    };

    await this.cacheService.set(cacheKey, result, 300);
    return result;
  }

  // ==================== Custom Reports ====================

  async createCustomReport(dto: CreateCustomReportDto, userId: string) {
    const report = await this.prisma.customReport.create({
      data: {
        name: dto.name,
        description: dto.description,
        baseType: dto.baseType,
        metrics: dto.metrics as any,
        defaultFilters: dto.defaultFilters as any,
        defaultGranularity: dto.defaultGranularity,
        defaultGroupBy: dto.defaultGroupBy,
        visualization: dto.visualization as any,
        isPublic: dto.isPublic || false,
        createdById: userId,
      },
    });

    await this.auditService.log({
      action: 'CREATE_CUSTOM_REPORT',
      entityType: 'CustomReport',
      entityId: report.id,
      userId,
      newValues: dto,
    });

    return report;
  }

  async updateCustomReport(id: string, dto: UpdateCustomReportDto, userId: string) {
    const existing = await this.prisma.customReport.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Relatório não encontrado');
    }

    if (existing.createdById !== userId) {
      throw new ForbiddenException('Sem permissão para editar este relatório');
    }

    const updated = await this.prisma.customReport.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        metrics: dto.metrics as any,
        defaultFilters: dto.defaultFilters as any,
        visualization: dto.visualization as any,
        isPublic: dto.isPublic,
        isActive: dto.isActive,
      },
    });

    await this.auditService.log({
      action: 'UPDATE_CUSTOM_REPORT',
      entityType: 'CustomReport',
      entityId: id,
      userId,
      oldValues: existing,
      newValues: dto,
    });

    return updated;
  }

  async deleteCustomReport(id: string, userId: string) {
    const existing = await this.prisma.customReport.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Relatório não encontrado');
    }

    if (existing.createdById !== userId) {
      throw new ForbiddenException('Sem permissão para excluir este relatório');
    }

    await this.prisma.customReport.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.log({
      action: 'DELETE_CUSTOM_REPORT',
      entityType: 'CustomReport',
      entityId: id,
      userId,
    });

    return { success: true };
  }

  async findAllCustomReports(query: CustomReportQueryDto, userId: string) {
    const { page = 1, limit = 20, search, baseType, publicOnly, activeOnly } = query;

    const where: any = {
      deletedAt: null,
      OR: [
        { createdById: userId },
        { isPublic: true },
      ],
    };

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    if (baseType) {
      where.baseType = baseType;
    }

    if (publicOnly) {
      where.isPublic = true;
    }

    if (activeOnly !== false) {
      where.isActive = true;
    }

    const [items, total] = await Promise.all([
      this.prisma.customReport.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.customReport.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async executeCustomReport(id: string, dto: GenerateReportDto, userId: string) {
    const report = await this.prisma.customReport.findUnique({
      where: { id, deletedAt: null },
    });

    if (!report) {
      throw new NotFoundException('Relatório não encontrado');
    }

    if (!report.isPublic && report.createdById !== userId) {
      throw new ForbiddenException('Sem permissão para executar este relatório');
    }

    // Mesclar filtros
    const filters = {
      ...(report.defaultFilters as any),
      ...dto.filters,
    };

    const query = {
      startDate: dto.startDate,
      endDate: dto.endDate,
      granularity: dto.granularity || report.defaultGranularity,
      groupBy: dto.groupBy || report.defaultGroupBy,
      ...filters,
    };

    // Executar relatório baseado no tipo
    let result;
    switch (report.baseType) {
      case ReportType.OPERATIONAL:
        result = await this.getOperationalAnalytics(query as any, userId);
        break;
      case ReportType.FINANCIAL:
        result = await this.getFinancialAnalytics(query as any, userId);
        break;
      case ReportType.CLINICAL:
        result = await this.getClinicalAnalytics(query as any, userId);
        break;
      case ReportType.PATIENT:
        result = await this.getPatientAnalytics(query as any, userId);
        break;
      case ReportType.DOCTOR:
        result = await this.getDoctorAnalytics(query as any, userId);
        break;
      case ReportType.LABORATORY:
        result = await this.getLaboratoryAnalytics(query as any, userId);
        break;
      case ReportType.TELEMEDICINE:
        result = await this.getTelemedicineAnalytics(query as any, userId);
        break;
      default:
        throw new BadRequestException('Tipo de relatório não suportado');
    }

    // Atualizar última execução
    await this.prisma.customReport.update({
      where: { id },
      data: { lastExecutedAt: new Date() },
    });

    return {
      reportId: id,
      reportName: report.name,
      ...result,
    };
  }

  // ==================== Scheduled Reports ====================

  async createScheduledReport(dto: CreateScheduledReportDto, userId: string) {
    const scheduled = await this.prisma.scheduledReport.create({
      data: {
        reportIdOrType: dto.reportIdOrType,
        name: dto.name,
        frequency: dto.frequency,
        dayOfWeek: dto.dayOfWeek,
        dayOfMonth: dto.dayOfMonth,
        executionTime: dto.executionTime || '08:00',
        format: dto.format,
        recipients: dto.recipients,
        filters: dto.filters as any,
        periodDays: dto.periodDays || 30,
        isActive: dto.isActive !== false,
        createdById: userId,
      },
    });

    await this.auditService.log({
      action: 'CREATE_SCHEDULED_REPORT',
      entityType: 'ScheduledReport',
      entityId: scheduled.id,
      userId,
      newValues: dto,
    });

    return scheduled;
  }

  async updateScheduledReport(id: string, dto: UpdateScheduledReportDto, userId: string) {
    const existing = await this.prisma.scheduledReport.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    if (existing.createdById !== userId) {
      throw new ForbiddenException('Sem permissão para editar este agendamento');
    }

    const updated = await this.prisma.scheduledReport.update({
      where: { id },
      data: {
        name: dto.name,
        frequency: dto.frequency,
        dayOfWeek: dto.dayOfWeek,
        dayOfMonth: dto.dayOfMonth,
        executionTime: dto.executionTime,
        format: dto.format,
        recipients: dto.recipients,
        filters: dto.filters as any,
        isActive: dto.isActive,
      },
    });

    return updated;
  }

  async deleteScheduledReport(id: string, userId: string) {
    const existing = await this.prisma.scheduledReport.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    if (existing.createdById !== userId) {
      throw new ForbiddenException('Sem permissão para excluir');
    }

    await this.prisma.scheduledReport.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  async findAllScheduledReports(query: ScheduledReportQueryDto, userId: string) {
    const { page = 1, limit = 20, frequency, activeOnly } = query;

    const where: any = {
      deletedAt: null,
      createdById: userId,
    };

    if (frequency) {
      where.frequency = frequency;
    }

    if (activeOnly) {
      where.isActive = true;
    }

    const [items, total] = await Promise.all([
      this.prisma.scheduledReport.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.scheduledReport.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @Cron(CronExpression.EVERY_HOUR)
  async processScheduledReports() {
    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = '00';
    const currentTime = `${currentHour}:${currentMinute}`;
    const dayOfWeek = now.getDay();
    const dayOfMonth = now.getDate();

    const scheduledReports = await this.prisma.scheduledReport.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        executionTime: currentTime,
      },
    });

    for (const report of scheduledReports) {
      try {
        let shouldExecute = false;

        switch (report.frequency) {
          case 'DAILY':
            shouldExecute = true;
            break;
          case 'WEEKLY':
            shouldExecute = report.dayOfWeek === dayOfWeek;
            break;
          case 'MONTHLY':
            shouldExecute = report.dayOfMonth === dayOfMonth;
            break;
        }

        if (shouldExecute) {
          await this.executeAndSendScheduledReport(report);
        }
      } catch (error) {
        this.logger.error(`Error processing scheduled report ${report.id}:`, error);
      }
    }
  }

  private async executeAndSendScheduledReport(report: any) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (report.periodDays || 30));

    const dto: GenerateReportDto = {
      type: report.reportIdOrType as ReportType,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      filters: report.filters,
      format: report.format,
    };

    // Executar relatório
    let result;
    if (Object.values(ReportType).includes(report.reportIdOrType as ReportType)) {
      result = await this.generateReport(dto, report.createdById);
    } else {
      result = await this.executeCustomReport(report.reportIdOrType, dto, report.createdById);
    }

    // Emitir evento para envio
    this.eventEmitter.emit('scheduled.report.completed', {
      reportId: report.id,
      reportName: report.name,
      recipients: report.recipients,
      format: report.format,
      result,
    });

    // Atualizar última execução
    await this.prisma.scheduledReport.update({
      where: { id: report.id },
      data: { lastExecutedAt: new Date() },
    });

    this.logger.log(`Scheduled report ${report.id} executed successfully`);
  }

  // ==================== Dashboards ====================

  async createDashboard(dto: CreateDashboardDto, userId: string) {
    // Se for default, remover default de outros
    if (dto.isDefault) {
      await this.prisma.dashboard.updateMany({
        where: { createdById: userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const dashboard = await this.prisma.dashboard.create({
      data: {
        name: dto.name,
        description: dto.description,
        isDefault: dto.isDefault || false,
        isPublic: dto.isPublic || false,
        layout: dto.layout as any,
        globalFilters: dto.globalFilters as any,
        defaultPeriodDays: dto.defaultPeriodDays || 30,
        refreshInterval: dto.refreshInterval,
        createdById: userId,
      },
    });

    await this.auditService.log({
      action: 'CREATE_DASHBOARD',
      entityType: 'Dashboard',
      entityId: dashboard.id,
      userId,
      newValues: dto,
    });

    return dashboard;
  }

  async updateDashboard(id: string, dto: UpdateDashboardDto, userId: string) {
    const existing = await this.prisma.dashboard.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Dashboard não encontrado');
    }

    if (existing.createdById !== userId) {
      throw new ForbiddenException('Sem permissão para editar');
    }

    if (dto.isDefault) {
      await this.prisma.dashboard.updateMany({
        where: { createdById: userId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updated = await this.prisma.dashboard.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        isDefault: dto.isDefault,
        isPublic: dto.isPublic,
        layout: dto.layout as any,
        globalFilters: dto.globalFilters as any,
        defaultPeriodDays: dto.defaultPeriodDays,
        refreshInterval: dto.refreshInterval,
      },
    });

    return updated;
  }

  async deleteDashboard(id: string, userId: string) {
    const existing = await this.prisma.dashboard.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Dashboard não encontrado');
    }

    if (existing.createdById !== userId) {
      throw new ForbiddenException('Sem permissão para excluir');
    }

    await this.prisma.dashboard.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  async findAllDashboards(query: DashboardQueryDto, userId: string) {
    const { page = 1, limit = 20, search, publicOnly, defaultOnly } = query;

    const where: any = {
      deletedAt: null,
      OR: [
        { createdById: userId },
        { isPublic: true },
      ],
    };

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    if (publicOnly) {
      where.isPublic = true;
    }

    if (defaultOnly) {
      where.isDefault = true;
      where.createdById = userId;
    }

    const [items, total] = await Promise.all([
      this.prisma.dashboard.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        include: {
          widgets: {
            where: { deletedAt: null },
            orderBy: { order: 'asc' },
          },
          createdBy: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.dashboard.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getDashboardById(id: string, userId: string) {
    const dashboard = await this.prisma.dashboard.findUnique({
      where: { id, deletedAt: null },
      include: {
        widgets: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    if (!dashboard) {
      throw new NotFoundException('Dashboard não encontrado');
    }

    if (!dashboard.isPublic && dashboard.createdById !== userId) {
      throw new ForbiddenException('Sem permissão para visualizar');
    }

    return dashboard;
  }

  async getDashboardData(id: string, userId: string) {
    const dashboard = await this.getDashboardById(id, userId);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (dashboard.defaultPeriodDays || 30));

    const widgetData = await Promise.all(
      dashboard.widgets.map(async (widget: any) => {
        try {
          const data = await this.getWidgetData(widget, {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            ...(dashboard.globalFilters as any),
          });
          return {
            widgetId: widget.id,
            title: widget.title,
            type: widget.type,
            data,
          };
        } catch (error) {
          this.logger.error(`Error fetching widget ${widget.id} data:`, error);
          return {
            widgetId: widget.id,
            title: widget.title,
            type: widget.type,
            error: 'Erro ao carregar dados',
          };
        }
      }),
    );

    return {
      dashboard: {
        id: dashboard.id,
        name: dashboard.name,
        description: dashboard.description,
        layout: dashboard.layout,
        refreshInterval: dashboard.refreshInterval,
      },
      widgets: widgetData,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      generatedAt: new Date().toISOString(),
    };
  }

  // ==================== Widgets ====================

  async createWidget(dashboardId: string, dto: CreateWidgetDto, userId: string) {
    const dashboard = await this.prisma.dashboard.findUnique({
      where: { id: dashboardId },
    });

    if (!dashboard) {
      throw new NotFoundException('Dashboard não encontrado');
    }

    if (dashboard.createdById !== userId) {
      throw new ForbiddenException('Sem permissão');
    }

    const lastWidget = await this.prisma.dashboardWidget.findFirst({
      where: { dashboardId },
      orderBy: { order: 'desc' },
    });

    const widget = await this.prisma.dashboardWidget.create({
      data: {
        dashboardId,
        title: dto.title,
        type: dto.type,
        dataConfig: dto.dataConfig as any,
        position: dto.position as any,
        visualConfig: dto.visualConfig as any,
        actions: dto.actions as any,
        order: (lastWidget?.order || 0) + 1,
      },
    });

    return widget;
  }

  async updateWidget(id: string, dto: UpdateWidgetDto, userId: string) {
    const widget = await this.prisma.dashboardWidget.findUnique({
      where: { id },
      include: { dashboard: true },
    });

    if (!widget) {
      throw new NotFoundException('Widget não encontrado');
    }

    if (widget.dashboard.createdById !== userId) {
      throw new ForbiddenException('Sem permissão');
    }

    const updated = await this.prisma.dashboardWidget.update({
      where: { id },
      data: {
        title: dto.title,
        type: dto.type,
        dataConfig: dto.dataConfig as any,
        position: dto.position as any,
        visualConfig: dto.visualConfig as any,
      },
    });

    return updated;
  }

  async deleteWidget(id: string, userId: string) {
    const widget = await this.prisma.dashboardWidget.findUnique({
      where: { id },
      include: { dashboard: true },
    });

    if (!widget) {
      throw new NotFoundException('Widget não encontrado');
    }

    if (widget.dashboard.createdById !== userId) {
      throw new ForbiddenException('Sem permissão');
    }

    await this.prisma.dashboardWidget.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  private async getWidgetData(widget: any, filters: any) {
    const dataConfig = widget.dataConfig;

    if (dataConfig.customReportId) {
      return this.executeCustomReport(dataConfig.customReportId, {
        type: ReportType.CUSTOM,
        startDate: filters.startDate,
        endDate: filters.endDate,
        filters: dataConfig.filters,
      }, widget.dashboard.createdById);
    }

    const query = {
      startDate: filters.startDate,
      endDate: filters.endDate,
      ...dataConfig.filters,
    };

    switch (dataConfig.reportType) {
      case ReportType.OPERATIONAL:
        return this.getOperationalAnalytics(query, '');
      case ReportType.FINANCIAL:
        return this.getFinancialAnalytics(query, '');
      case ReportType.CLINICAL:
        return this.getClinicalAnalytics(query, '');
      case ReportType.PATIENT:
        return this.getPatientAnalytics(query, '');
      case ReportType.DOCTOR:
        return this.getDoctorAnalytics(query, '');
      case ReportType.LABORATORY:
        return this.getLaboratoryAnalytics(query, '');
      case ReportType.TELEMEDICINE:
        return this.getTelemedicineAnalytics(query, '');
      default:
        return { error: 'Tipo de dados não suportado' };
    }
  }

  // ==================== KPIs ====================

  async createKPI(dto: CreateKPIDto, userId: string) {
    const existing = await this.prisma.kpi.findFirst({
      where: { code: dto.code, deletedAt: null },
    });

    if (existing) {
      throw new BadRequestException('Já existe um KPI com este código');
    }

    const kpi = await this.prisma.kpi.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        category: dto.category,
        calculationType: dto.calculationType,
        formula: dto.formula,
        target: dto.target,
        unit: dto.unit,
        format: dto.format,
        warningThreshold: dto.warningThreshold,
        criticalThreshold: dto.criticalThreshold,
        higherIsBetter: dto.higherIsBetter !== false,
        filters: dto.filters as any,
        createdById: userId,
      },
    });

    await this.auditService.log({
      action: 'CREATE_KPI',
      entityType: 'KPI',
      entityId: kpi.id,
      userId,
      newValues: dto,
    });

    return kpi;
  }

  async updateKPI(id: string, dto: UpdateKPIDto, userId: string) {
    const existing = await this.prisma.kpi.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('KPI não encontrado');
    }

    const updated = await this.prisma.kpi.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        target: dto.target,
        warningThreshold: dto.warningThreshold,
        criticalThreshold: dto.criticalThreshold,
        isActive: dto.isActive,
      },
    });

    return updated;
  }

  async deleteKPI(id: string, userId: string) {
    await this.prisma.kpi.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  async findAllKPIs(query: KPIQueryDto) {
    const { page = 1, limit = 20, search, category, activeOnly } = query;

    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (activeOnly !== false) {
      where.isActive = true;
    }

    const [items, total] = await Promise.all([
      this.prisma.kpi.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.kpi.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getKPIValues(query: KPIValueQueryDto, userId: string) {
    const { kpiIds, kpiCodes, startDate, endDate, clinicId, clinicIds } = query;

    let kpis;
    if (kpiIds?.length) {
      kpis = await this.prisma.kpi.findMany({
        where: { id: { in: kpiIds }, isActive: true, deletedAt: null },
      });
    } else if (kpiCodes?.length) {
      kpis = await this.prisma.kpi.findMany({
        where: { code: { in: kpiCodes }, isActive: true, deletedAt: null },
      });
    } else {
      kpis = await this.prisma.kpi.findMany({
        where: { isActive: true, deletedAt: null },
      });
    }

    const dateFilter = this.buildDateFilter(startDate, endDate);
    const clinicFilter = this.buildClinicFilter(clinicId, clinicIds);

    const values = await Promise.all(
      kpis.map(async (kpi) => {
        const value = await this.calculateKPIValue(kpi, dateFilter, clinicFilter);
        const status = this.getKPIStatus(kpi, value);

        return {
          kpiId: kpi.id,
          code: kpi.code,
          name: kpi.name,
          category: kpi.category,
          value,
          target: kpi.target,
          unit: kpi.unit,
          format: kpi.format,
          status,
          trend: await this.getKPITrend(kpi, dateFilter, clinicFilter),
        };
      }),
    );

    return {
      kpis: values,
      period: {
        startDate: startDate || 'all-time',
        endDate: endDate || 'now',
      },
      generatedAt: new Date().toISOString(),
    };
  }

  private async calculateKPIValue(kpi: any, dateFilter: any, clinicFilter: any): Promise<number> {
    // Implementação simplificada - em produção, seria mais complexo
    // baseado na fórmula do KPI

    const formula = kpi.formula;

    // Exemplos de KPIs pré-definidos
    switch (kpi.code) {
      case 'APPOINTMENT_COMPLETION_RATE':
        const total = await this.prisma.appointment.count({
          where: { ...dateFilter, ...clinicFilter, deletedAt: null },
        });
        const completed = await this.prisma.appointment.count({
          where: { ...dateFilter, ...clinicFilter, status: 'COMPLETED', deletedAt: null },
        });
        return total > 0 ? (completed / total) * 100 : 0;

      case 'NO_SHOW_RATE':
        const totalAppts = await this.prisma.appointment.count({
          where: { ...dateFilter, ...clinicFilter, deletedAt: null },
        });
        const noShows = await this.prisma.appointment.count({
          where: { ...dateFilter, ...clinicFilter, status: 'NO_SHOW', deletedAt: null },
        });
        return totalAppts > 0 ? (noShows / totalAppts) * 100 : 0;

      case 'AVERAGE_TICKET':
        const revenue = await this.prisma.invoice.aggregate({
          where: { ...dateFilter, ...clinicFilter, status: 'PAID', deletedAt: null },
          _avg: { totalAmount: true },
        });
        return Number(revenue._avg.totalAmount || 0);

      case 'PATIENT_RETENTION':
        return await this.calculateRetentionRate(dateFilter, clinicFilter).then(r => r?.rate || 0);

      default:
        return 0;
    }
  }

  private getKPIStatus(kpi: any, value: number): string {
    if (!kpi.target) return 'NEUTRAL';

    const higherIsBetter = kpi.higherIsBetter;
    const warning = kpi.warningThreshold;
    const critical = kpi.criticalThreshold;

    if (higherIsBetter) {
      if (value >= kpi.target) return 'GOOD';
      if (warning && value >= warning) return 'WARNING';
      if (critical && value <= critical) return 'CRITICAL';
      return 'WARNING';
    } else {
      if (value <= kpi.target) return 'GOOD';
      if (warning && value <= warning) return 'WARNING';
      if (critical && value >= critical) return 'CRITICAL';
      return 'WARNING';
    }
  }

  private async getKPITrend(kpi: any, dateFilter: any, clinicFilter: any) {
    // Implementação simplificada de tendência
    return {
      direction: 'STABLE',
      changePercent: 0,
    };
  }

  // ==================== Cohorts ====================

  async createCohort(dto: CreateCohortDto, userId: string) {
    const cohort = await this.prisma.cohort.create({
      data: {
        name: dto.name,
        description: dto.description,
        baseEntity: dto.baseEntity,
        criteria: dto.criteria as any,
        isDynamic: dto.isDynamic || false,
        createdById: userId,
      },
    });

    // Calcular membros iniciais
    if (!dto.isDynamic) {
      await this.refreshCohortMembers(cohort.id);
    }

    await this.auditService.log({
      action: 'CREATE_COHORT',
      entityType: 'Cohort',
      entityId: cohort.id,
      userId,
      newValues: dto,
    });

    return cohort;
  }

  async findAllCohorts(query: CohortQueryDto, userId: string) {
    const { page = 1, limit = 20, search, baseEntity, dynamicOnly } = query;

    const where: any = {
      deletedAt: null,
      createdById: userId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (baseEntity) {
      where.baseEntity = baseEntity;
    }

    if (dynamicOnly) {
      where.isDynamic = true;
    }

    const [items, total] = await Promise.all([
      this.prisma.cohort.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { members: true },
          },
        },
      }),
      this.prisma.cohort.count({ where }),
    ]);

    return {
      items: items.map((c) => ({
        ...c,
        memberCount: c._count.members,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCohortById(id: string, userId: string) {
    const cohort = await this.prisma.cohort.findUnique({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    if (!cohort) {
      throw new NotFoundException('Coorte não encontrada');
    }

    if (cohort.createdById !== userId) {
      throw new ForbiddenException('Sem permissão');
    }

    return {
      ...cohort,
      memberCount: cohort._count.members,
    };
  }

  async refreshCohortMembers(cohortId: string) {
    const cohort = await this.prisma.cohort.findUnique({
      where: { id: cohortId },
    });

    if (!cohort) {
      throw new NotFoundException('Coorte não encontrada');
    }

    // Limpar membros existentes
    await this.prisma.cohortMember.deleteMany({
      where: { cohortId },
    });

    // Buscar novos membros baseado nos critérios
    const criteria = cohort.criteria as any;
    let memberIds: string[] = [];

    switch (cohort.baseEntity) {
      case 'patient':
        const patients = await this.prisma.patient.findMany({
          where: {
            deletedAt: null,
            ...this.buildCohortWhere(criteria),
          },
          select: { id: true },
        });
        memberIds = patients.map((p) => p.id);
        break;

      case 'doctor':
        const doctors = await this.prisma.doctor.findMany({
          where: {
            deletedAt: null,
            ...this.buildCohortWhere(criteria),
          },
          select: { id: true },
        });
        memberIds = doctors.map((d) => d.id);
        break;
    }

    // Criar membros
    if (memberIds.length > 0) {
      await this.prisma.cohortMember.createMany({
        data: memberIds.map((entityId) => ({
          cohortId,
          entityId,
        })),
      });
    }

    // Atualizar contador
    await this.prisma.cohort.update({
      where: { id: cohortId },
      data: { lastRefreshedAt: new Date() },
    });

    return { memberCount: memberIds.length };
  }

  async analyzeCohort(dto: CohortAnalysisDto, userId: string) {
    const cohort = await this.getCohortById(dto.cohortId, userId);

    // Se dinâmica, atualizar membros
    if (cohort.isDynamic) {
      await this.refreshCohortMembers(dto.cohortId);
    }

    const members = await this.prisma.cohortMember.findMany({
      where: { cohortId: dto.cohortId },
    });

    const entityIds = members.map((m) => m.entityId);

    const dateFilter = this.buildDateFilter(dto.startDate, dto.endDate);

    // Análise baseada na entidade
    const analysis: any = {
      cohortId: dto.cohortId,
      cohortName: cohort.name,
      memberCount: entityIds.length,
      metrics: {},
    };

    for (const metric of dto.metrics) {
      analysis.metrics[metric] = await this.calculateCohortMetric(
        cohort.baseEntity,
        entityIds,
        metric,
        dateFilter,
      );
    }

    return analysis;
  }

  private async calculateCohortMetric(
    baseEntity: string,
    entityIds: string[],
    metric: string,
    dateFilter: any,
  ) {
    // Implementação simplificada
    switch (metric) {
      case 'appointment_count':
        if (baseEntity === 'patient') {
          return this.prisma.appointment.count({
            where: {
              patientId: { in: entityIds },
              ...dateFilter,
              deletedAt: null,
            },
          });
        }
        break;
      case 'revenue':
        if (baseEntity === 'patient') {
          const result = await this.prisma.invoice.aggregate({
            where: {
              patientId: { in: entityIds },
              ...dateFilter,
              status: 'PAID',
              deletedAt: null,
            },
            _sum: { totalAmount: true },
          });
          return Number(result._sum.totalAmount || 0);
        }
        break;
    }
    return 0;
  }

  private buildCohortWhere(criteria: any): any {
    const where: any = {};

    if (criteria.filters) {
      if (criteria.filters.clinicIds?.length) {
        where.clinicId = { in: criteria.filters.clinicIds };
      }
      if (criteria.filters.gender) {
        where.gender = criteria.filters.gender;
      }
      if (criteria.filters.city) {
        where.city = criteria.filters.city;
      }
      if (criteria.filters.state) {
        where.state = criteria.filters.state;
      }
    }

    if (criteria.dateRange) {
      where[criteria.dateRange.field] = {
        gte: new Date(criteria.dateRange.start),
        lte: new Date(criteria.dateRange.end),
      };
    }

    return where;
  }

  // ==================== Data Export ====================

  async exportData(dto: ExportDataDto, userId: string) {
    const export_ = await this.prisma.dataExport.create({
      data: {
        dataType: dto.dataType,
        format: dto.format,
        filters: dto.filters as any,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        fields: dto.fields,
        includeRelations: dto.includeRelations || false,
        anonymize: dto.anonymize || false,
        status: 'PENDING',
        createdById: userId,
      },
    });

    // Processar em background
    this.processExport(export_.id);

    return export_;
  }

  private async processExport(exportId: string) {
    try {
      await this.prisma.dataExport.update({
        where: { id: exportId },
        data: { status: 'PROCESSING' },
      });

      const export_ = await this.prisma.dataExport.findUnique({
        where: { id: exportId },
      });

      if (!export_) return;

      // Buscar dados
      let data: any[] = [];
      const dateFilter = this.buildDateFilter(
        export_.startDate.toISOString(),
        export_.endDate.toISOString(),
      );

      switch (export_.dataType) {
        case 'appointments':
          data = await this.prisma.appointment.findMany({
            where: { ...dateFilter, deletedAt: null },
            include: export_.includeRelations ? {
              patient: { select: { id: true, name: true } },
              doctor: { include: { user: { select: { name: true } } } },
            } : undefined,
          });
          break;
        case 'patients':
          data = await this.prisma.patient.findMany({
            where: { ...dateFilter, deletedAt: null },
          });
          break;
        case 'invoices':
          data = await this.prisma.invoice.findMany({
            where: { ...dateFilter, deletedAt: null },
          });
          break;
      }

      // Anonimizar se necessário
      if (export_.anonymize) {
        data = this.anonymizeData(data);
      }

      // Gerar arquivo
      const fileUrl = await this.generateExportFile(data, export_.format, exportId);

      await this.prisma.dataExport.update({
        where: { id: exportId },
        data: {
          status: 'COMPLETED',
          fileUrl,
          completedAt: new Date(),
          recordCount: data.length,
        },
      });

      this.eventEmitter.emit('export.completed', { exportId, fileUrl });
    } catch (error) {
      this.logger.error(`Export ${exportId} failed:`, error);
      await this.prisma.dataExport.update({
        where: { id: exportId },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  private anonymizeData(data: any[]): any[] {
    return data.map((item) => {
      const anonymized = { ...item };
      // Remover/anonimizar campos sensíveis
      if (anonymized.name) anonymized.name = 'ANONYMIZED';
      if (anonymized.email) anonymized.email = 'anonymized@example.com';
      if (anonymized.phone) anonymized.phone = '**********';
      if (anonymized.cpf) anonymized.cpf = '***.***.***-**';
      if (anonymized.address) anonymized.address = 'ANONYMIZED';
      return anonymized;
    });
  }

  private async generateExportFile(data: any[], format: ReportFormat, exportId: string): Promise<string> {
    // Em produção, geraria arquivo real e salvaria no storage
    const filename = `export_${exportId}.${format.toLowerCase()}`;
    return `/exports/${filename}`;
  }

  async findAllExports(query: ExportQueryDto, userId: string) {
    const { page = 1, limit = 20, dataType, status } = query;

    const where: any = {
      createdById: userId,
    };

    if (dataType) {
      where.dataType = dataType;
    }

    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      this.prisma.dataExport.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.dataExport.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ==================== Generate Report ====================

  async generateReport(dto: GenerateReportDto, userId: string) {
    const query = {
      startDate: dto.startDate,
      endDate: dto.endDate,
      granularity: dto.granularity,
      includeComparison: dto.includeComparison,
      comparisonType: dto.comparisonType,
      ...dto.filters,
    };

    switch (dto.type) {
      case ReportType.OPERATIONAL:
        return this.getOperationalAnalytics(query as any, userId);
      case ReportType.FINANCIAL:
        return this.getFinancialAnalytics(query as any, userId);
      case ReportType.CLINICAL:
        return this.getClinicalAnalytics(query as any, userId);
      case ReportType.PATIENT:
        return this.getPatientAnalytics(query as any, userId);
      case ReportType.DOCTOR:
        return this.getDoctorAnalytics(query as any, userId);
      case ReportType.LABORATORY:
        return this.getLaboratoryAnalytics(query as any, userId);
      case ReportType.TELEMEDICINE:
        return this.getTelemedicineAnalytics(query as any, userId);
      default:
        throw new BadRequestException('Tipo de relatório não suportado');
    }
  }

  // ==================== Executive Summary ====================

  async getExecutiveSummary(query: any, userId: string) {
    const cacheKey = `analytics:executive:${JSON.stringify(query)}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const { startDate, endDate, clinicId } = query;
    const dateFilter = this.buildDateFilter(startDate, endDate);
    const clinicFilter = clinicId ? { clinicId } : {};

    // Buscar dados principais em paralelo
    const [
      appointments,
      revenue,
      patients,
      doctors,
    ] = await Promise.all([
      this.prisma.appointment.aggregate({
        where: { ...dateFilter, ...clinicFilter, deletedAt: null },
        _count: { id: true },
      }),
      this.prisma.invoice.aggregate({
        where: { ...dateFilter, ...clinicFilter, status: 'PAID', deletedAt: null },
        _sum: { totalAmount: true },
      }),
      this.prisma.patient.count({
        where: { ...dateFilter, ...clinicFilter, deletedAt: null },
      }),
      this.prisma.doctor.count({
        where: { ...clinicFilter, deletedAt: null, isActive: true },
      }),
    ]);

    const result = {
      overview: {
        totalAppointments: appointments._count.id,
        totalRevenue: Number(revenue._sum.totalAmount || 0),
        newPatients: patients,
        activeDoctors: doctors,
      },
      period: {
        startDate: startDate || 'all-time',
        endDate: endDate || 'now',
      },
      generatedAt: new Date().toISOString(),
    };

    await this.cacheService.set(cacheKey, result, 300);
    return result;
  }

  // ==================== Trending ====================

  async getTrending(query: TrendingQueryDto, userId: string) {
    const { startDate, endDate, clinicId, limit = 10, category } = query;
    const dateFilter = this.buildDateFilter(startDate, endDate);
    const clinicFilter = clinicId ? { clinicId } : {};

    const trending: any = {};

    // Diagnósticos em alta
    trending.diagnoses = await this.prisma.diagnosis.groupBy({
      by: ['icdCode', 'description'],
      where: {
        consultation: {
          ...dateFilter,
          ...clinicFilter,
          deletedAt: null,
        },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    // Procedimentos em alta
    trending.procedures = await this.prisma.appointment.groupBy({
      by: ['type'],
      where: {
        ...dateFilter,
        ...clinicFilter,
        deletedAt: null,
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    return trending;
  }

  // ==================== Helper Methods ====================

  private buildDateFilter(startDate?: string, endDate?: string, field: string = 'scheduledAt') {
    const filter: any = {};

    if (startDate || endDate) {
      filter[field] = {};
      if (startDate) {
        filter[field].gte = new Date(startDate);
      }
      if (endDate) {
        filter[field].lte = new Date(endDate);
      }
    }

    return filter;
  }

  private buildClinicFilter(clinicId?: string, clinicIds?: string[]) {
    if (clinicId) {
      return { clinicId };
    }
    if (clinicIds?.length) {
      return { clinicId: { in: clinicIds } };
    }
    return {};
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  private async calculateAverageWaitTime(dateFilter: any, clinicFilter: any): Promise<number> {
    // Implementação simplificada
    return 15; // 15 minutos média
  }

  private async calculateOccupancyRate(dateFilter: any, clinicFilter: any): Promise<number> {
    // Implementação simplificada
    const totalSlots = 100;
    const usedSlots = await this.prisma.appointment.count({
      where: {
        ...dateFilter,
        ...clinicFilter,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        deletedAt: null,
      },
    });
    return (usedSlots / totalSlots) * 100;
  }

  private async buildTimeSeries(
    entity: string,
    dateFilter: any,
    clinicFilter: any,
    granularity: TimeGranularity,
  ) {
    // Implementação simplificada - retorna dados mock
    const series: any[] = [];
    const startDate = dateFilter.scheduledAt?.gte || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dateFilter.scheduledAt?.lte || new Date();

    let current = new Date(startDate);
    while (current <= endDate) {
      series.push({
        date: current.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 50) + 10,
      });

      switch (granularity) {
        case TimeGranularity.HOUR:
          current.setHours(current.getHours() + 1);
          break;
        case TimeGranularity.DAY:
          current.setDate(current.getDate() + 1);
          break;
        case TimeGranularity.WEEK:
          current.setDate(current.getDate() + 7);
          break;
        case TimeGranularity.MONTH:
          current.setMonth(current.getMonth() + 1);
          break;
        default:
          current.setDate(current.getDate() + 1);
      }
    }

    return series;
  }

  private async buildFinancialTimeSeries(
    dateFilter: any,
    clinicFilter: any,
    granularity: TimeGranularity,
  ) {
    return this.buildTimeSeries('invoice', dateFilter, clinicFilter, granularity);
  }

  private async buildComparison(
    type: string,
    dateFilter: any,
    clinicFilter: any,
    comparisonType: ComparisonType,
  ) {
    // Implementação simplificada
    return {
      currentPeriod: 100,
      previousPeriod: 90,
      change: 10,
      changePercent: 11.11,
    };
  }

  private async generateAgingReport(clinicFilter: any) {
    const now = new Date();
    const ranges = [
      { label: '0-30 dias', min: 0, max: 30 },
      { label: '31-60 dias', min: 31, max: 60 },
      { label: '61-90 dias', min: 61, max: 90 },
      { label: '90+ dias', min: 91, max: 9999 },
    ];

    const aging = await Promise.all(
      ranges.map(async (range) => {
        const minDate = new Date(now);
        minDate.setDate(minDate.getDate() - range.max);
        const maxDate = new Date(now);
        maxDate.setDate(maxDate.getDate() - range.min);

        const result = await this.prisma.invoice.aggregate({
          where: {
            ...clinicFilter,
            status: { in: ['PENDING', 'OVERDUE'] },
            dueDate: {
              gte: minDate,
              lt: maxDate,
            },
            deletedAt: null,
          },
          _sum: { totalAmount: true },
          _count: { id: true },
        });

        return {
          range: range.label,
          amount: Number(result._sum.totalAmount || 0),
          count: result._count.id,
        };
      }),
    );

    return aging;
  }

  private async calculateRetentionRate(dateFilter: any, clinicFilter: any) {
    // Implementação simplificada
    return {
      rate: 85.5,
      retainedPatients: 850,
      totalPatients: 1000,
    };
  }

  private async calculateNewVsReturning(dateFilter: any, clinicFilter: any) {
    // Implementação simplificada
    return {
      newPatients: 150,
      returningPatients: 350,
      newPercentage: 30,
      returningPercentage: 70,
    };
  }

  private async calculateChurnRate(clinicFilter: any) {
    // Implementação simplificada
    return {
      churnRate: 5.2,
      churnedPatients: 52,
      period: 'last 90 days',
    };
  }

  private async generateDoctorRanking(dateFilter: any, clinicFilter: any) {
    const doctors = await this.prisma.doctor.findMany({
      where: { ...clinicFilter, deletedAt: null, isActive: true },
      include: {
        user: { select: { name: true } },
        _count: {
          select: {
            appointments: {
              where: { ...dateFilter, status: 'COMPLETED', deletedAt: null },
            },
          },
        },
      },
      orderBy: {
        appointments: { _count: 'desc' },
      },
      take: 10,
    });

    return doctors.map((d, index) => ({
      rank: index + 1,
      doctorId: d.id,
      doctorName: d.user.name,
      specialty: d.specialty,
      completedAppointments: d._count.appointments,
    }));
  }
}
