'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  FileText,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Receipt,
  AlertTriangle,
  ChevronRight,
  Download,
  Filter,
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import {
  financialAnalyticsApi,
  paymentsApi,
  invoicesApi,
} from '@/lib/api/financial';
import {
  formatCurrency,
  formatPercentage,
  getPaymentStatusLabel,
  getPaymentStatusColor,
  getInvoiceStatusLabel,
  getInvoiceStatusColor,
  getPaymentMethodLabel,
  InvoiceStatus,
} from '@/types/financial';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function FinanceiroPage() {
  const router = useRouter();
  const [period, setPeriod] = React.useState('month');

  const getPeriodDates = () => {
    const now = new Date();
    switch (period) {
      case 'week':
        return { start: subDays(now, 7).toISOString(), end: now.toISOString() };
      case 'month':
        return {
          start: startOfMonth(now).toISOString(),
          end: endOfMonth(now).toISOString(),
        };
      case 'quarter':
        return { start: subDays(now, 90).toISOString(), end: now.toISOString() };
      case 'year':
        return { start: subDays(now, 365).toISOString(), end: now.toISOString() };
      default:
        return {
          start: startOfMonth(now).toISOString(),
          end: endOfMonth(now).toISOString(),
        };
    }
  };

  const periodDates = getPeriodDates();

  // Queries
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['financial', 'summary', period],
    queryFn: () => financialAnalyticsApi.getSummary(periodDates),
  });

  const { data: revenueByPeriod, isLoading: loadingRevenue } = useQuery({
    queryKey: ['financial', 'revenue-by-period', period],
    queryFn: () =>
      financialAnalyticsApi.getRevenueByPeriod(
        period === 'week' ? 'day' : period === 'year' ? 'month' : 'day',
        periodDates
      ),
  });

  const { data: revenueByService } = useQuery({
    queryKey: ['financial', 'revenue-by-service', period],
    queryFn: () => financialAnalyticsApi.getRevenueByService(periodDates),
  });

  const { data: paymentsByMethod } = useQuery({
    queryKey: ['financial', 'payments-by-method', period],
    queryFn: () => financialAnalyticsApi.getPaymentsByMethod(periodDates),
  });

  const { data: recentPayments } = useQuery({
    queryKey: ['payments', 'recent'],
    queryFn: () => paymentsApi.getRecent(5),
  });

  const { data: overdueInvoices } = useQuery({
    queryKey: ['invoices', 'overdue'],
    queryFn: () => invoicesApi.getOverdue(),
  });

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Financeiro' },
        ]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">
            Visao geral das financas da clinica
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Ultima Semana</SelectItem>
              <SelectItem value="month">Este Mes</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Este Ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(summary?.revenue.total || 0)}
                </div>
                <div className="flex items-center text-sm">
                  {(summary?.comparison.revenueChange || 0) >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  )}
                  <span
                    className={
                      (summary?.comparison.revenueChange || 0) >= 0
                        ? 'text-green-500'
                        : 'text-red-500'
                    }
                  >
                    {formatPercentage(summary?.comparison.revenueChange || 0)}
                  </span>
                  <span className="text-muted-foreground ml-1">vs periodo anterior</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(summary?.expenses.total || 0)}
                </div>
                <div className="flex items-center text-sm">
                  {(summary?.comparison.expenseChange || 0) <= 0 ? (
                    <ArrowDownRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-red-500" />
                  )}
                  <span
                    className={
                      (summary?.comparison.expenseChange || 0) <= 0
                        ? 'text-green-500'
                        : 'text-red-500'
                    }
                  >
                    {formatPercentage(summary?.comparison.expenseChange || 0)}
                  </span>
                  <span className="text-muted-foreground ml-1">vs periodo anterior</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Liquido</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(summary?.profit.net || 0)}
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-muted-foreground">
                    Margem: {summary?.profit.margin.toFixed(1)}%
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturas Pendentes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">{summary?.invoices.pending || 0}</div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <span className="text-red-500 font-medium mr-1">
                    {summary?.invoices.overdue || 0}
                  </span>
                  vencidas
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Receita e Despesas</CardTitle>
            <CardDescription>Evolucao ao longo do periodo</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingRevenue ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueByPeriod || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      try {
                        return format(parseISO(value), 'dd/MM', { locale: ptBR });
                      } catch {
                        return value;
                      }
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => {
                      try {
                        return format(parseISO(label), "dd 'de' MMMM", { locale: ptBR });
                      } catch {
                        return label;
                      }
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Receita"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    name="Despesas"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Service */}
        <Card>
          <CardHeader>
            <CardTitle>Receita por Servico</CardTitle>
            <CardDescription>Distribuicao das fontes de receita</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueByService || []}
                  dataKey="revenue"
                  nameKey="service"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(0)}%`}
                >
                  {(revenueByService || []).map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Payments by Method & Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Payments by Method */}
        <Card>
          <CardHeader>
            <CardTitle>Pagamentos por Metodo</CardTitle>
            <CardDescription>Distribuicao dos metodos de pagamento</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={paymentsByMethod || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="method"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => getPaymentMethodLabel(value)}
                  width={100}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === 'amount' ? 'Valor' : name,
                  ]}
                />
                <Bar dataKey="amount" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pagamentos Recentes</CardTitle>
              <CardDescription>Ultimas transacoes realizadas</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/financeiro/pagamentos')}
            >
              Ver todos
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPayments?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum pagamento recente
                </p>
              ) : (
                recentPayments?.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{payment.patient?.fullName || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">
                          {getPaymentMethodLabel(payment.method)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                      <Badge className={getPaymentStatusColor(payment.status)}>
                        {getPaymentStatusLabel(payment.status)}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Invoices Alert */}
      {overdueInvoices && overdueInvoices.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Faturas Vencidas ({overdueInvoices.length})
            </CardTitle>
            <CardDescription className="text-red-700">
              Essas faturas estao vencidas e precisam de atencao
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueInvoices.slice(0, 5).map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white border border-red-200 cursor-pointer hover:bg-red-50 transition-colors"
                  onClick={() => router.push(`/financeiro/faturas/${invoice.id}`)}
                >
                  <div>
                    <p className="font-medium">{invoice.patient?.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      Fatura #{invoice.number} - Venceu em{' '}
                      {format(parseISO(invoice.dueDate), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">
                      {formatCurrency(invoice.amountDue)}
                    </p>
                    <Badge className={getInvoiceStatusColor(invoice.status)}>
                      {getInvoiceStatusLabel(invoice.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            {overdueInvoices.length > 5 && (
              <Button
                variant="link"
                className="mt-4 text-red-700"
                onClick={() =>
                  router.push(`/financeiro/faturas?status=${InvoiceStatus.OVERDUE}`)
                }
              >
                Ver todas as {overdueInvoices.length} faturas vencidas
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push('/financeiro/faturas/nova')}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <Receipt className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold">Nova Fatura</p>
              <p className="text-sm text-muted-foreground">Criar fatura para paciente</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push('/financeiro/pagamentos')}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="font-semibold">Pagamentos</p>
              <p className="text-sm text-muted-foreground">Historico de transacoes</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push('/financeiro/planos')}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold">Planos</p>
              <p className="text-sm text-muted-foreground">Gerenciar assinatura</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
