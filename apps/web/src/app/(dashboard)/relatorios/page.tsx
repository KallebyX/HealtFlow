'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  FileText,
  Download,
  Calendar,
  Users,
  Stethoscope,
  DollarSign,
  TrendingUp,
  Clock,
  Activity,
  PieChart,
  LineChart as LineChartIcon,
  Filter,
  RefreshCw,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { reportsApi } from '@/lib/api/reports';

// Mock data
const appointmentsBySpecialty = [
  { name: 'Cardiologia', value: 145, color: '#3b82f6' },
  { name: 'Dermatologia', value: 120, color: '#10b981' },
  { name: 'Pediatria', value: 98, color: '#f59e0b' },
  { name: 'Ortopedia', value: 87, color: '#ef4444' },
  { name: 'Ginecologia', value: 76, color: '#8b5cf6' },
  { name: 'Outros', value: 64, color: '#6b7280' },
];

const monthlyData = [
  { month: 'Jan', consultas: 420, pacientes: 180, receita: 45000 },
  { month: 'Fev', consultas: 480, pacientes: 210, receita: 52000 },
  { month: 'Mar', consultas: 450, pacientes: 195, receita: 48000 },
  { month: 'Abr', consultas: 520, pacientes: 240, receita: 61000 },
  { month: 'Mai', consultas: 490, pacientes: 220, receita: 55000 },
  { month: 'Jun', consultas: 560, pacientes: 260, receita: 67000 },
];

const weeklyAppointments = [
  { day: 'Seg', total: 85, realizadas: 78, canceladas: 7 },
  { day: 'Ter', total: 92, realizadas: 85, canceladas: 7 },
  { day: 'Qua', total: 88, realizadas: 80, canceladas: 8 },
  { day: 'Qui', total: 95, realizadas: 88, canceladas: 7 },
  { day: 'Sex', total: 90, realizadas: 82, canceladas: 8 },
  { day: 'Sab', total: 45, realizadas: 40, canceladas: 5 },
];

const doctorPerformance = [
  { name: 'Dr. Carlos Silva', consultas: 145, satisfacao: 4.8, tempo: 28 },
  { name: 'Dra. Ana Lima', consultas: 132, satisfacao: 4.9, tempo: 25 },
  { name: 'Dr. Roberto Mendes', consultas: 128, satisfacao: 4.7, tempo: 30 },
  { name: 'Dra. Patricia Souza', consultas: 118, satisfacao: 4.8, tempo: 27 },
  { name: 'Dr. Fernando Costa', consultas: 105, satisfacao: 4.6, tempo: 32 },
];

const patientDemographics = [
  { faixa: '0-18', masculino: 45, feminino: 52 },
  { faixa: '19-30', masculino: 78, feminino: 95 },
  { faixa: '31-45', masculino: 120, feminino: 145 },
  { faixa: '46-60', masculino: 98, feminino: 112 },
  { faixa: '60+', masculino: 65, feminino: 88 },
];

export default function RelatoriosPage() {
  const router = useRouter();
  const [dateFrom, setDateFrom] = React.useState(
    format(subMonths(new Date(), 1), 'yyyy-MM-dd')
  );
  const [dateTo, setDateTo] = React.useState(format(new Date(), 'yyyy-MM-dd'));
  const [reportType, setReportType] = React.useState('overview');

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    // TODO: Implement export
    console.log(`Exporting as ${format}`);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Relatorios' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatorios</h1>
          <p className="text-muted-foreground">
            Analise de dados e metricas do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
          <Button variant="outline" onClick={() => handleExport('excel')}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data Final</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tipo de relatorio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Visao Geral</SelectItem>
                <SelectItem value="appointments">Consultas</SelectItem>
                <SelectItem value="financial">Financeiro</SelectItem>
                <SelectItem value="patients">Pacientes</SelectItem>
                <SelectItem value="doctors">Medicos</SelectItem>
              </SelectContent>
            </Select>
            <Button>
              <Filter className="mr-2 h-4 w-4" />
              Aplicar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <Tabs value={reportType} onValueChange={setReportType} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visao Geral</TabsTrigger>
          <TabsTrigger value="appointments">Consultas</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="patients">Pacientes</TabsTrigger>
          <TabsTrigger value="doctors">Medicos</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Consultas</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2,920</div>
                <div className="flex items-center gap-1 text-xs">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-600">+12%</span>
                  <span className="text-muted-foreground">vs periodo anterior</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Novos Pacientes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,305</div>
                <div className="flex items-center gap-1 text-xs">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-600">+8%</span>
                  <span className="text-muted-foreground">vs periodo anterior</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ 328k</div>
                <div className="flex items-center gap-1 text-xs">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-600">+15%</span>
                  <span className="text-muted-foreground">vs periodo anterior</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Ocupacao</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">78%</div>
                <div className="flex items-center gap-1 text-xs">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-600">+5%</span>
                  <span className="text-muted-foreground">vs periodo anterior</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Monthly Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Evolucao Mensal</CardTitle>
                <CardDescription>Consultas, pacientes e receita</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="left" className="text-xs" tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="right" orientation="right" className="text-xs" tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Line yAxisId="left" type="monotone" dataKey="consultas" stroke="#3b82f6" strokeWidth={2} name="Consultas" />
                      <Line yAxisId="left" type="monotone" dataKey="pacientes" stroke="#10b981" strokeWidth={2} name="Pacientes" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Specialty Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Consultas por Especialidade</CardTitle>
                <CardDescription>Distribuicao no periodo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={appointmentsBySpecialty}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {appointmentsBySpecialty.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Weekly Appointments Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Consultas da Semana</CardTitle>
                <CardDescription>Realizadas vs Canceladas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyAppointments}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="day" className="text-xs" tick={{ fontSize: 12 }} />
                      <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="realizadas" fill="#10b981" name="Realizadas" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="canceladas" fill="#ef4444" name="Canceladas" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Appointment Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Estatisticas de Consultas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total de Consultas</span>
                  <span className="font-bold">495</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Taxa de Comparecimento</span>
                  <span className="font-bold text-green-600">92%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Taxa de Cancelamento</span>
                  <span className="font-bold text-red-600">8%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tempo Medio de Espera</span>
                  <span className="font-bold">12 min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Duracao Media</span>
                  <span className="font-bold">28 min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Telemedicina</span>
                  <span className="font-bold">23%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatorio Financeiro</CardTitle>
              <CardDescription>Detalhamento de receitas e despesas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
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
                      formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Receita']}
                    />
                    <Area
                      type="monotone"
                      dataKey="receita"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorReceita)"
                      name="Receita"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patients Tab */}
        <TabsContent value="patients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Demografia de Pacientes</CardTitle>
              <CardDescription>Distribuicao por faixa etaria e genero</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={patientDemographics} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="faixa" type="category" className="text-xs" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="masculino" fill="#3b82f6" name="Masculino" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="feminino" fill="#ec4899" name="Feminino" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Doctors Tab */}
        <TabsContent value="doctors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance dos Medicos</CardTitle>
              <CardDescription>Metricas de atendimento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {doctorPerformance.map((doctor, index) => (
                  <div key={doctor.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="font-medium w-8 text-muted-foreground">#{index + 1}</span>
                        <span className="font-medium">{doctor.name}</span>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="font-bold">{doctor.consultas}</p>
                          <p className="text-xs text-muted-foreground">consultas</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold flex items-center gap-1">
                            <span className="text-yellow-500">★</span>
                            {doctor.satisfacao}
                          </p>
                          <p className="text-xs text-muted-foreground">satisfacao</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold">{doctor.tempo}min</p>
                          <p className="text-xs text-muted-foreground">tempo medio</p>
                        </div>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{
                          width: `${(doctor.consultas / doctorPerformance[0].consultas) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
