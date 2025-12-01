import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ReportType,
  TimeGranularity,
  ReportFormat,
  ScheduleFrequency,
  DashboardWidgetType,
  MetricType,
  ComparisonType,
} from './create-analytics.dto';

// ==================== Base Response DTOs ====================

export class PeriodDto {
  @ApiProperty()
  start: Date;

  @ApiProperty()
  end: Date;

  @ApiPropertyOptional({ enum: TimeGranularity })
  granularity?: TimeGranularity;
}

export class ComparisonDto {
  @ApiProperty()
  previousPeriod: PeriodDto;

  @ApiProperty()
  change: number;

  @ApiProperty()
  changePercentage: number;

  @ApiProperty()
  trend: 'up' | 'down' | 'stable';
}

export class DataPointDto {
  @ApiProperty()
  date: string;

  @ApiProperty()
  value: number;

  @ApiPropertyOptional()
  label?: string;

  @ApiPropertyOptional()
  breakdown?: Record<string, number>;
}

export class MetricResultDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  value: number;

  @ApiPropertyOptional()
  previousValue?: number;

  @ApiPropertyOptional()
  change?: number;

  @ApiPropertyOptional()
  changePercentage?: number;

  @ApiPropertyOptional()
  trend?: 'up' | 'down' | 'stable';

  @ApiPropertyOptional()
  unit?: string;

  @ApiPropertyOptional()
  format?: string;
}

// ==================== Operational Analytics Response ====================

export class OperationalAnalyticsResponseDto {
  @ApiProperty()
  period: PeriodDto;

  @ApiProperty()
  appointments: {
    total: number;
    scheduled: number;
    completed: number;
    cancelled: number;
    noShow: number;
    rescheduled: number;
    noShowRate: number;
    cancellationRate: number;
    completionRate: number;
  };

  @ApiPropertyOptional()
  occupancy?: {
    average: number;
    byDoctor?: Array<{
      doctorId: string;
      doctorName: string;
      occupancy: number;
    }>;
    byDayOfWeek?: Record<string, number>;
    byHour?: Record<string, number>;
  };

  @ApiPropertyOptional()
  waitTime?: {
    average: number;
    median: number;
    p90: number;
    byDoctor?: Array<{
      doctorId: string;
      doctorName: string;
      averageWaitTime: number;
    }>;
    trend?: DataPointDto[];
  };

  @ApiPropertyOptional()
  byType?: Record<string, {
    count: number;
    percentage: number;
    completionRate: number;
  }>;

  @ApiPropertyOptional()
  byDoctor?: Array<{
    doctorId: string;
    doctorName: string;
    specialty: string;
    total: number;
    completed: number;
    noShowRate: number;
    averageWaitTime: number;
  }>;

  @ApiPropertyOptional()
  byStatus?: Record<string, number>;

  @ApiPropertyOptional()
  trends?: DataPointDto[];

  @ApiPropertyOptional()
  comparison?: ComparisonDto;
}

// ==================== Financial Analytics Response ====================

export class FinancialAnalyticsResponseDto {
  @ApiProperty()
  period: PeriodDto;

  @ApiProperty()
  revenue: {
    gross: number;
    net: number;
    discounts: number;
    refunds: number;
  };

  @ApiProperty()
  billing: {
    totalInvoiced: number;
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
    averageInvoice: number;
    paymentRate: number;
  };

  @ApiPropertyOptional()
  receivables?: {
    total: number;
    current: number;
    overdue: number;
    aging: Array<{
      bucket: string;
      amount: number;
      count: number;
      percentage: number;
    }>;
  };

  @ApiPropertyOptional()
  byType?: Record<string, {
    revenue: number;
    count: number;
    percentage: number;
  }>;

  @ApiPropertyOptional()
  byInsurance?: Array<{
    insuranceId: string;
    insuranceName: string;
    revenue: number;
    claims: number;
    approvalRate: number;
    averagePaymentTime: number;
  }>;

  @ApiPropertyOptional()
  byDoctor?: Array<{
    doctorId: string;
    doctorName: string;
    revenue: number;
    consultations: number;
    averageTicket: number;
    commission: number;
  }>;

  @ApiPropertyOptional()
  byPaymentMethod?: Record<string, {
    amount: number;
    count: number;
    percentage: number;
  }>;

  @ApiPropertyOptional()
  trends?: {
    revenue: DataPointDto[];
    payments: DataPointDto[];
    invoices: DataPointDto[];
  };

  @ApiPropertyOptional()
  comparison?: ComparisonDto;
}

// ==================== Clinical Analytics Response ====================

export class ClinicalAnalyticsResponseDto {
  @ApiProperty()
  period: PeriodDto;

  @ApiProperty()
  consultations: {
    total: number;
    firstVisit: number;
    followUp: number;
    emergency: number;
    averageDuration: number;
  };

  @ApiPropertyOptional()
  diagnoses?: {
    total: number;
    unique: number;
    top: Array<{
      icdCode: string;
      description: string;
      count: number;
      percentage: number;
    }>;
    byCategory?: Record<string, number>;
  };

  @ApiPropertyOptional()
  prescriptions?: {
    total: number;
    medications: Array<{
      name: string;
      count: number;
      percentage: number;
    }>;
    averageItemsPerPrescription: number;
    controlledSubstances: number;
  };

  @ApiPropertyOptional()
  labOrders?: {
    total: number;
    tests: Array<{
      code: string;
      name: string;
      count: number;
      percentage: number;
    }>;
    averageTurnaroundTime: number;
    criticalValues: number;
  };

  @ApiPropertyOptional()
  byGender?: Record<string, {
    consultations: number;
    percentage: number;
  }>;

  @ApiPropertyOptional()
  byAgeGroup?: Array<{
    range: string;
    consultations: number;
    percentage: number;
    topDiagnoses: string[];
  }>;

  @ApiPropertyOptional()
  trends?: DataPointDto[];

  @ApiPropertyOptional()
  comparison?: ComparisonDto;
}

// ==================== Patient Analytics Response ====================

export class PatientAnalyticsResponseDto {
  @ApiProperty()
  period: PeriodDto;

  @ApiProperty()
  overview: {
    totalPatients: number;
    activePatients: number;
    newPatients: number;
    returningPatients: number;
    churnedPatients: number;
  };

  @ApiPropertyOptional()
  demographics?: {
    byGender: Record<string, { count: number; percentage: number }>;
    byAgeGroup: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
    byCity: Array<{
      city: string;
      state: string;
      count: number;
      percentage: number;
    }>;
    averageAge: number;
  };

  @ApiPropertyOptional()
  retention?: {
    rate: number;
    averageVisitsPerPatient: number;
    averageLifetimeValue: number;
    cohortRetention?: Array<{
      cohort: string;
      month1: number;
      month2: number;
      month3: number;
      month6: number;
      month12: number;
    }>;
  };

  @ApiPropertyOptional()
  acquisition?: {
    bySource: Record<string, number>;
    byInsurance: Array<{
      insuranceId: string;
      insuranceName: string;
      count: number;
      percentage: number;
    }>;
    trend: DataPointDto[];
  };

  @ApiPropertyOptional()
  engagement?: {
    appointmentFrequency: number;
    portalUsage: number;
    appUsage: number;
  };

  @ApiPropertyOptional()
  trends?: {
    newPatients: DataPointDto[];
    activePatients: DataPointDto[];
    churn: DataPointDto[];
  };

  @ApiPropertyOptional()
  comparison?: ComparisonDto;
}

// ==================== Doctor Analytics Response ====================

export class DoctorAnalyticsResponseDto {
  @ApiProperty()
  period: PeriodDto;

  @ApiProperty()
  overview: {
    totalDoctors: number;
    activeDoctors: number;
    totalConsultations: number;
    averageConsultationsPerDoctor: number;
  };

  @ApiPropertyOptional()
  productivity?: Array<{
    doctorId: string;
    doctorName: string;
    specialty: string;
    consultations: number;
    patients: number;
    averageConsultationTime: number;
    occupancyRate: number;
    noShowRate: number;
  }>;

  @ApiPropertyOptional()
  revenue?: Array<{
    doctorId: string;
    doctorName: string;
    grossRevenue: number;
    netRevenue: number;
    averageTicket: number;
    commission: number;
  }>;

  @ApiPropertyOptional()
  satisfaction?: Array<{
    doctorId: string;
    doctorName: string;
    rating: number;
    reviewsCount: number;
    recommendationRate: number;
  }>;

  @ApiPropertyOptional()
  ranking?: Array<{
    rank: number;
    doctorId: string;
    doctorName: string;
    score: number;
    metrics: {
      consultations: number;
      revenue: number;
      satisfaction: number;
    };
  }>;

  @ApiPropertyOptional()
  bySpecialty?: Record<string, {
    doctors: number;
    consultations: number;
    revenue: number;
  }>;

  @ApiPropertyOptional()
  trends?: DataPointDto[];

  @ApiPropertyOptional()
  comparison?: ComparisonDto;
}

// ==================== Laboratory Analytics Response ====================

export class LaboratoryAnalyticsResponseDto {
  @ApiProperty()
  period: PeriodDto;

  @ApiProperty()
  overview: {
    totalOrders: number;
    totalTests: number;
    completedTests: number;
    pendingTests: number;
    cancelledTests: number;
  };

  @ApiPropertyOptional()
  turnaroundTime?: {
    average: number;
    median: number;
    p90: number;
    byCategory: Record<string, number>;
    trend: DataPointDto[];
  };

  @ApiPropertyOptional()
  quality?: {
    rejectionRate: number;
    criticalValuesRate: number;
    retestRate: number;
    byReason: Record<string, number>;
  };

  @ApiPropertyOptional()
  topTests?: Array<{
    code: string;
    name: string;
    category: string;
    count: number;
    revenue: number;
    averageTAT: number;
  }>;

  @ApiPropertyOptional()
  byCategory?: Record<string, {
    tests: number;
    revenue: number;
    percentage: number;
  }>;

  @ApiPropertyOptional()
  trends?: {
    orders: DataPointDto[];
    tat: DataPointDto[];
    rejection: DataPointDto[];
  };

  @ApiPropertyOptional()
  comparison?: ComparisonDto;
}

// ==================== Telemedicine Analytics Response ====================

export class TelemedicineAnalyticsResponseDto {
  @ApiProperty()
  period: PeriodDto;

  @ApiProperty()
  overview: {
    totalSessions: number;
    completedSessions: number;
    cancelledSessions: number;
    averageDuration: number;
    totalMinutes: number;
  };

  @ApiPropertyOptional()
  connectionQuality?: {
    average: number;
    excellent: number;
    good: number;
    fair: number;
    poor: number;
    disconnections: number;
  };

  @ApiPropertyOptional()
  satisfaction?: {
    averageRating: number;
    ratings: Array<{
      rating: number;
      count: number;
      percentage: number;
    }>;
    wouldRecommend: number;
  };

  @ApiPropertyOptional()
  bySessionType?: Record<string, {
    count: number;
    averageDuration: number;
    percentage: number;
  }>;

  @ApiPropertyOptional()
  byDoctor?: Array<{
    doctorId: string;
    doctorName: string;
    sessions: number;
    totalMinutes: number;
    averageRating: number;
  }>;

  @ApiPropertyOptional()
  adoption?: {
    totalUsers: number;
    newUsers: number;
    returningUsers: number;
    trend: DataPointDto[];
  };

  @ApiPropertyOptional()
  trends?: DataPointDto[];

  @ApiPropertyOptional()
  comparison?: ComparisonDto;
}

// ==================== Custom Report Response ====================

export class CustomReportResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: ReportType })
  baseType: ReportType;

  @ApiProperty()
  metrics: Array<{
    name: string;
    field: string;
    aggregation: MetricType;
    label?: string;
    format?: string;
  }>;

  @ApiPropertyOptional()
  defaultFilters?: Record<string, any>;

  @ApiPropertyOptional({ enum: TimeGranularity })
  defaultGranularity?: TimeGranularity;

  @ApiPropertyOptional()
  defaultGroupBy?: string[];

  @ApiPropertyOptional()
  visualization?: Record<string, any>;

  @ApiProperty()
  isPublic: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  usageCount: number;

  @ApiProperty()
  createdBy: string;

  @ApiPropertyOptional()
  createdByName?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CustomReportListResponseDto {
  @ApiProperty({ type: [CustomReportResponseDto] })
  data: CustomReportResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class CustomReportResultDto {
  @ApiProperty()
  reportId: string;

  @ApiProperty()
  reportName: string;

  @ApiProperty()
  period: PeriodDto;

  @ApiProperty({ type: [MetricResultDto] })
  metrics: MetricResultDto[];

  @ApiPropertyOptional()
  data?: DataPointDto[];

  @ApiPropertyOptional()
  breakdown?: Record<string, any>;

  @ApiProperty()
  generatedAt: Date;
}

// ==================== Scheduled Report Response ====================

export class ScheduledReportResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  reportIdOrType: string;

  @ApiPropertyOptional()
  reportName?: string;

  @ApiProperty({ enum: ScheduleFrequency })
  frequency: ScheduleFrequency;

  @ApiPropertyOptional()
  dayOfWeek?: number;

  @ApiPropertyOptional()
  dayOfMonth?: number;

  @ApiPropertyOptional()
  executionTime?: string;

  @ApiProperty({ enum: ReportFormat })
  format: ReportFormat;

  @ApiProperty()
  recipients: string[];

  @ApiPropertyOptional()
  filters?: Record<string, any>;

  @ApiPropertyOptional()
  periodDays?: number;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  lastRunAt?: Date;

  @ApiPropertyOptional()
  nextRunAt?: Date;

  @ApiProperty()
  executionsCount: number;

  @ApiPropertyOptional()
  lastStatus?: string;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ScheduledReportListResponseDto {
  @ApiProperty({ type: [ScheduledReportResponseDto] })
  data: ScheduledReportResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

// ==================== Dashboard Response ====================

export class WidgetDataResponseDto {
  @ApiProperty()
  widgetId: string;

  @ApiProperty({ enum: DashboardWidgetType })
  type: DashboardWidgetType;

  @ApiPropertyOptional()
  value?: number | string;

  @ApiPropertyOptional()
  previousValue?: number;

  @ApiPropertyOptional()
  change?: number;

  @ApiPropertyOptional()
  trend?: 'up' | 'down' | 'stable';

  @ApiPropertyOptional()
  data?: DataPointDto[] | Record<string, any>[];

  @ApiPropertyOptional()
  breakdown?: Record<string, any>;

  @ApiProperty()
  updatedAt: Date;
}

export class DashboardWidgetResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ enum: DashboardWidgetType })
  type: DashboardWidgetType;

  @ApiProperty()
  dataConfig: Record<string, any>;

  @ApiPropertyOptional()
  position?: Record<string, any>;

  @ApiPropertyOptional()
  visualConfig?: Record<string, any>;

  @ApiPropertyOptional()
  actions?: Record<string, any>;

  @ApiProperty()
  order: number;

  @ApiProperty()
  createdAt: Date;
}

export class DashboardResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  isDefault: boolean;

  @ApiProperty()
  isPublic: boolean;

  @ApiPropertyOptional()
  layout?: Record<string, any>;

  @ApiPropertyOptional()
  globalFilters?: Record<string, any>;

  @ApiPropertyOptional()
  defaultPeriodDays?: number;

  @ApiPropertyOptional()
  refreshInterval?: number;

  @ApiProperty({ type: [DashboardWidgetResponseDto] })
  widgets: DashboardWidgetResponseDto[];

  @ApiProperty()
  createdBy: string;

  @ApiPropertyOptional()
  createdByName?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class DashboardDataResponseDto {
  @ApiProperty()
  dashboardId: string;

  @ApiProperty()
  period: PeriodDto;

  @ApiProperty({ type: [WidgetDataResponseDto] })
  widgets: WidgetDataResponseDto[];

  @ApiProperty()
  generatedAt: Date;
}

export class DashboardListResponseDto {
  @ApiProperty({ type: [DashboardResponseDto] })
  data: DashboardResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

// ==================== KPI Response ====================

export class KPIResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  category: string;

  @ApiProperty({ enum: MetricType })
  calculationType: MetricType;

  @ApiProperty()
  formula: string;

  @ApiPropertyOptional()
  target?: number;

  @ApiPropertyOptional()
  unit?: string;

  @ApiPropertyOptional()
  format?: string;

  @ApiPropertyOptional()
  warningThreshold?: number;

  @ApiPropertyOptional()
  criticalThreshold?: number;

  @ApiProperty()
  higherIsBetter: boolean;

  @ApiPropertyOptional()
  filters?: Record<string, any>;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class KPIValueResponseDto {
  @ApiProperty()
  kpiId: string;

  @ApiProperty()
  kpiCode: string;

  @ApiProperty()
  kpiName: string;

  @ApiProperty()
  value: number;

  @ApiPropertyOptional()
  target?: number;

  @ApiPropertyOptional()
  achievement?: number;

  @ApiProperty()
  status: 'good' | 'warning' | 'critical';

  @ApiPropertyOptional()
  previousValue?: number;

  @ApiPropertyOptional()
  change?: number;

  @ApiPropertyOptional()
  trend?: 'up' | 'down' | 'stable';

  @ApiPropertyOptional()
  history?: DataPointDto[];

  @ApiProperty()
  calculatedAt: Date;
}

export class KPIListResponseDto {
  @ApiProperty({ type: [KPIResponseDto] })
  data: KPIResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

// ==================== Cohort Response ====================

export class CohortResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  baseEntity: string;

  @ApiProperty()
  criteria: Record<string, any>;

  @ApiProperty()
  isDynamic: boolean;

  @ApiProperty()
  membersCount: number;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  lastCalculatedAt?: Date;
}

export class CohortAnalysisResponseDto {
  @ApiProperty()
  cohortId: string;

  @ApiProperty()
  cohortName: string;

  @ApiProperty()
  membersCount: number;

  @ApiProperty()
  period: PeriodDto;

  @ApiProperty({ type: [MetricResultDto] })
  metrics: MetricResultDto[];

  @ApiPropertyOptional()
  segments?: Array<{
    name: string;
    count: number;
    metrics: MetricResultDto[];
  }>;

  @ApiPropertyOptional()
  trends?: DataPointDto[];

  @ApiProperty()
  calculatedAt: Date;
}

// ==================== Export Response ====================

export class ExportJobResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  dataType: string;

  @ApiProperty()
  period: PeriodDto;

  @ApiProperty({ enum: ReportFormat })
  format: ReportFormat;

  @ApiProperty()
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @ApiPropertyOptional()
  downloadUrl?: string;

  @ApiPropertyOptional()
  fileSize?: number;

  @ApiPropertyOptional()
  recordsCount?: number;

  @ApiPropertyOptional()
  expiresAt?: Date;

  @ApiPropertyOptional()
  error?: string;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  completedAt?: Date;
}

// ==================== Trending Response ====================

export class TrendingItemDto {
  @ApiProperty()
  rank: number;

  @ApiProperty()
  item: string;

  @ApiPropertyOptional()
  itemId?: string;

  @ApiProperty()
  count: number;

  @ApiPropertyOptional()
  change?: number;

  @ApiPropertyOptional()
  changePercentage?: number;

  @ApiProperty()
  trend: 'up' | 'down' | 'stable' | 'new';
}

export class TrendingResponseDto {
  @ApiProperty()
  category: string;

  @ApiProperty()
  period: PeriodDto;

  @ApiProperty({ type: [TrendingItemDto] })
  items: TrendingItemDto[];

  @ApiProperty()
  generatedAt: Date;
}

// ==================== Summary Dashboard Response ====================

export class AnalyticsSummaryResponseDto {
  @ApiProperty()
  period: PeriodDto;

  @ApiProperty()
  highlights: {
    revenue: MetricResultDto;
    patients: MetricResultDto;
    appointments: MetricResultDto;
    satisfaction: MetricResultDto;
  };

  @ApiPropertyOptional()
  operational?: {
    appointmentsToday: number;
    occupancyRate: number;
    averageWaitTime: number;
    noShowRate: number;
  };

  @ApiPropertyOptional()
  financial?: {
    revenueToday: number;
    pendingPayments: number;
    overdueAmount: number;
    insuranceClaims: number;
  };

  @ApiPropertyOptional()
  clinical?: {
    consultationsToday: number;
    prescriptionsIssued: number;
    labOrdersPending: number;
    criticalAlerts: number;
  };

  @ApiPropertyOptional()
  trends?: {
    revenue: DataPointDto[];
    patients: DataPointDto[];
    appointments: DataPointDto[];
  };

  @ApiPropertyOptional()
  alerts?: Array<{
    type: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    value?: number;
    link?: string;
  }>;
}
