// ============================================================
// REPORTS API
// API para relatórios e analytics
// ============================================================

import api from '@/lib/api';

export interface ReportQuery {
  dateFrom: string;
  dateTo: string;
  clinicId?: string;
  doctorId?: string;
  specialty?: string;
  groupBy?: 'day' | 'week' | 'month';
}

export interface DashboardStats {
  patients: {
    total: number;
    active: number;
    newThisMonth: number;
    growth: number;
  };
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
    occupancyRate: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  telemedicine: {
    total: number;
    thisMonth: number;
    percentageOfTotal: number;
  };
}

export interface AppointmentReport {
  summary: {
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
    completionRate: number;
  };
  byDoctor: {
    doctorId: string;
    doctorName: string;
    total: number;
    completed: number;
    averageDuration: number;
  }[];
  bySpecialty: {
    specialty: string;
    total: number;
    percentage: number;
  }[];
  byStatus: {
    status: string;
    count: number;
    percentage: number;
  }[];
  byType: {
    type: string;
    count: number;
    percentage: number;
  }[];
  timeline: {
    date: string;
    scheduled: number;
    completed: number;
    cancelled: number;
  }[];
}

export interface FinancialReport {
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    margin: number;
  };
  revenue: {
    byPaymentMethod: {
      method: string;
      amount: number;
      count: number;
    }[];
    byInsurance: {
      insuranceName: string;
      amount: number;
      count: number;
    }[];
    byService: {
      service: string;
      amount: number;
      count: number;
    }[];
  };
  receivables: {
    total: number;
    overdue: number;
    upcoming: number;
  };
  timeline: {
    date: string;
    revenue: number;
    expenses: number;
  }[];
}

export interface PatientReport {
  summary: {
    total: number;
    active: number;
    inactive: number;
    newThisPeriod: number;
  };
  demographics: {
    byGender: { gender: string; count: number; percentage: number }[];
    byAge: { range: string; count: number; percentage: number }[];
    byCity: { city: string; count: number; percentage: number }[];
  };
  engagement: {
    averageAppointmentsPerPatient: number;
    returnRate: number;
    satisfactionScore: number;
  };
  timeline: {
    date: string;
    newPatients: number;
    totalActive: number;
  }[];
}

export interface OperationalReport {
  occupancy: {
    overall: number;
    byDoctor: { doctorId: string; doctorName: string; rate: number }[];
    byDay: { day: string; rate: number }[];
    byHour: { hour: string; rate: number }[];
  };
  waitTime: {
    average: number;
    byDoctor: { doctorId: string; doctorName: string; average: number }[];
  };
  consultationDuration: {
    average: number;
    byDoctor: { doctorId: string; doctorName: string; average: number }[];
    bySpecialty: { specialty: string; average: number }[];
  };
}

export const reportsApi = {
  // Dashboard stats
  getDashboardStats: async (clinicId?: string): Promise<DashboardStats> => {
    const params = clinicId ? `?clinicId=${clinicId}` : '';
    const response = await api.get<DashboardStats>(`/reports/dashboard${params}`);
    return response.data;
  },

  // Appointment reports
  getAppointmentReport: async (query: ReportQuery): Promise<AppointmentReport> => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value) params.append(key, String(value));
    });
    const response = await api.get<AppointmentReport>(`/reports/appointments?${params.toString()}`);
    return response.data;
  },

  // Financial reports
  getFinancialReport: async (query: ReportQuery): Promise<FinancialReport> => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value) params.append(key, String(value));
    });
    const response = await api.get<FinancialReport>(`/reports/financial?${params.toString()}`);
    return response.data;
  },

  // Patient reports
  getPatientReport: async (query: ReportQuery): Promise<PatientReport> => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value) params.append(key, String(value));
    });
    const response = await api.get<PatientReport>(`/reports/patients?${params.toString()}`);
    return response.data;
  },

  // Operational reports
  getOperationalReport: async (query: ReportQuery): Promise<OperationalReport> => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value) params.append(key, String(value));
    });
    const response = await api.get<OperationalReport>(`/reports/operational?${params.toString()}`);
    return response.data;
  },

  // Export report
  exportReport: async (
    type: 'appointments' | 'financial' | 'patients' | 'operational',
    query: ReportQuery,
    format: 'pdf' | 'excel' | 'csv'
  ): Promise<Blob> => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value) params.append(key, String(value));
    });
    params.append('format', format);
    const response = await api.get(`/reports/${type}/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Custom report builder
  getCustomReport: async (config: {
    metrics: string[];
    dimensions: string[];
    filters: Record<string, any>;
    dateFrom: string;
    dateTo: string;
  }): Promise<any> => {
    const response = await api.post('/reports/custom', config);
    return response.data;
  },

  // Scheduled reports
  listScheduledReports: async (): Promise<any[]> => {
    const response = await api.get('/reports/scheduled');
    return response.data;
  },

  createScheduledReport: async (data: {
    name: string;
    type: string;
    schedule: string;
    recipients: string[];
    config: any;
  }): Promise<any> => {
    const response = await api.post('/reports/scheduled', data);
    return response.data;
  },

  deleteScheduledReport: async (id: string): Promise<void> => {
    await api.delete(`/reports/scheduled/${id}`);
  },
};

export default reportsApi;
