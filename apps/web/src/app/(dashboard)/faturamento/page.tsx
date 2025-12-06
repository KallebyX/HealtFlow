'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Receipt,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Download,
  Calendar,
  Building2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

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
import { Breadcrumb } from '@/components/ui/breadcrumb';

// Mock data for charts
const revenueData = [
  { month: 'Jan', receita: 45000, despesas: 32000 },
  { month: 'Fev', receita: 52000, despesas: 35000 },
  { month: 'Mar', receita: 48000, despesas: 30000 },
  { month: 'Abr', receita: 61000, despesas: 38000 },
  { month: 'Mai', receita: 55000, despesas: 36000 },
  { month: 'Jun', receita: 67000, despesas: 40000 },
];

const paymentMethodData = [
  { name: 'Convenio', value: 45, color: '#3b82f6' },
  { name: 'Cartao Credito', value: 25, color: '#10b981' },
  { name: 'PIX', value: 20, color: '#f59e0b' },
  { name: 'Dinheiro', value: 7, color: '#8b5cf6' },
  { name: 'Boleto', value: 3, color: '#6b7280' },
];

const recentInvoices = [
  { id: '1', patient: 'Maria Silva', value: 250, status: 'paid', date: '2024-03-15', type: 'Consulta' },
  { id: '2', patient: 'Joao Costa', value: 450, status: 'pending', date: '2024-03-14', type: 'Exames' },
  { id: '3', patient: 'Ana Santos', value: 180, status: 'paid', date: '2024-03-14', type: 'Retorno' },
  { id: '4', patient: 'Pedro Lima', value: 350, status: 'overdue', date: '2024-03-10', type: 'Consulta' },
  { id: '5', patient: 'Lucia Ferreira', value: 600, status: 'pending', date: '2024-03-13', type: 'Procedimento' },
];

const insuranceData = [
  { name: 'Unimed', value: 35000, count: 120 },
  { name: 'Bradesco Saude', value: 28000, count: 95 },
  { name: 'SulAmerica', value: 22000, count: 78 },
  { name: 'Amil', value: 18000, count: 62 },
  { name: 'Particular', value: 15000, count: 45 },
];

export default function FaturamentoPage() {
  const router = useRouter();
  const [period, setPeriod] = React.useState('month');

  // Stats
  const stats = {
    totalRevenue: 67000,
    revenueGrowth: 8.5,
    pendingInvoices: 12500,
    overdueInvoices: 3200,
    paidThisMonth: 54300,
    averageTicket: 285,
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Faturamento' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Faturamento</h1>
          <p className="text-muted-foreground">
            Gestao financeira e faturamento
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/faturamento/faturas')}>
            <Receipt className="mr-2 h-4 w-4" />
            Ver Faturas
          </Button>
          <Button variant="outline" onClick={() => router.push('/faturamento/convenios')}>
            <Building2 className="mr-2 h-4 w-4" />
            Convenios
          </Button>
          <Button onClick={() => router.push('/faturamento/nova-fatura')}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Fatura
          </Button>
        </div>
      </div>

      {/* Period Filter */}
      <div className="flex items-center gap-4">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Periodo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Esta semana</SelectItem>
            <SelectItem value="month">Este mes</SelectItem>
            <SelectItem value="quarter">Este trimestre</SelectItem>
            <SelectItem value="year">Este ano</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.totalRevenue.toLocaleString('pt-BR')}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-600">+{stats.revenueGrowth}%</span>
              <span className="text-muted-foreground">vs mes anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recebido</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {stats.paidThisMonth.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">A Receber</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              R$ {stats.pendingInvoices.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              faturas pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {stats.overdueInvoices.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              vencidas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Receita vs Despesas</CardTitle>
            <CardDescription>Comparativo mensal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 12 }} />
                  <YAxis
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [
                      `R$ ${value.toLocaleString('pt-BR')}`,
                      '',
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line
                    type="monotone"
                    dataKey="receita"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981' }}
                    name="Receita"
                  />
                  <Line
                    type="monotone"
                    dataKey="despesas"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ fill: '#ef4444' }}
                    name="Despesas"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Formas de Pagamento</CardTitle>
            <CardDescription>Distribuicao por metodo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value}%`, 'Porcentagem']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices and Insurance */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Faturas Recentes</CardTitle>
              <CardDescription>Ultimas transacoes</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/faturamento/faturas')}>
              Ver todas
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{invoice.patient}</p>
                    <p className="text-sm text-muted-foreground">
                      {invoice.type} - {format(new Date(invoice.date), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">R$ {invoice.value.toLocaleString('pt-BR')}</p>
                    <Badge
                      variant={
                        invoice.status === 'paid'
                          ? 'default'
                          : invoice.status === 'pending'
                          ? 'secondary'
                          : 'destructive'
                      }
                      className="mt-1"
                    >
                      {invoice.status === 'paid'
                        ? 'Pago'
                        : invoice.status === 'pending'
                        ? 'Pendente'
                        : 'Vencido'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Insurance Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Receita por Convenio</CardTitle>
              <CardDescription>Este mes</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/faturamento/convenios')}>
              Ver todos
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insuranceData.map((insurance, index) => (
                <div key={insurance.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{insurance.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {insurance.count} consultas
                      </Badge>
                    </div>
                    <span className="font-bold">
                      R$ {insurance.value.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: `${(insurance.value / insuranceData[0].value) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acoes Rapidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 p-4"
              onClick={() => router.push('/faturamento/nova-fatura')}
            >
              <Receipt className="h-6 w-6" />
              <span>Nova Fatura</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 p-4"
              onClick={() => router.push('/faturamento/convenios')}
            >
              <Building2 className="h-6 w-6" />
              <span>Gerenciar Convenios</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 p-4"
              onClick={() => router.push('/faturamento/pagamentos')}
            >
              <CreditCard className="h-6 w-6" />
              <span>Registrar Pagamento</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 p-4"
              onClick={() => router.push('/relatorios')}
            >
              <FileText className="h-6 w-6" />
              <span>Relatorios</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
