'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Calendar,
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  Activity,
  DollarSign,
  UserPlus,
  Stethoscope,
  Video,
  CheckCircle,
  XCircle,
  ArrowUpRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
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
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Chart data
const appointmentsWeekData = [
  { name: 'Seg', agendados: 45, realizados: 40, cancelados: 5 },
  { name: 'Ter', agendados: 52, realizados: 48, cancelados: 4 },
  { name: 'Qua', agendados: 48, realizados: 45, cancelados: 3 },
  { name: 'Qui', agendados: 58, realizados: 52, cancelados: 6 },
  { name: 'Sex', agendados: 55, realizados: 50, cancelados: 5 },
  { name: 'Sab', agendados: 25, realizados: 22, cancelados: 3 },
  { name: 'Dom', agendados: 10, realizados: 8, cancelados: 2 },
];

const monthlyRevenueData = [
  { name: 'Jan', receita: 45000, despesas: 32000 },
  { name: 'Fev', receita: 52000, despesas: 35000 },
  { name: 'Mar', receita: 48000, despesas: 30000 },
  { name: 'Abr', receita: 61000, despesas: 38000 },
  { name: 'Mai', receita: 55000, despesas: 36000 },
  { name: 'Jun', receita: 67000, despesas: 40000 },
];

const specialtiesData = [
  { name: 'Cardiologia', value: 25, color: '#3b82f6' },
  { name: 'Dermatologia', value: 20, color: '#10b981' },
  { name: 'Pediatria', value: 18, color: '#f59e0b' },
  { name: 'Ortopedia', value: 15, color: '#ef4444' },
  { name: 'Ginecologia', value: 12, color: '#8b5cf6' },
  { name: 'Outros', value: 10, color: '#6b7280' },
];

const patientGrowthData = [
  { name: 'Jan', pacientes: 120 },
  { name: 'Fev', pacientes: 145 },
  { name: 'Mar', pacientes: 170 },
  { name: 'Abr', pacientes: 210 },
  { name: 'Mai', pacientes: 250 },
  { name: 'Jun', pacientes: 290 },
];

const stats = [
  {
    title: 'Pacientes Ativos',
    value: '1.284',
    change: '+12%',
    changeType: 'positive' as const,
    icon: Users,
  },
  {
    title: 'Consultas Hoje',
    value: '67',
    change: '85% ocupacao',
    changeType: 'positive' as const,
    icon: Calendar,
  },
  {
    title: 'Receita Mensal',
    value: 'R$ 67.000',
    change: '+8%',
    changeType: 'positive' as const,
    icon: DollarSign,
  },
  {
    title: 'Telemedicina',
    value: '156',
    change: '+28%',
    changeType: 'positive' as const,
    icon: Video,
  },
];

const recentAppointments = [
  {
    id: '1',
    patient: 'Maria Silva',
    doctor: 'Dr. Carlos Santos',
    specialty: 'Cardiologia',
    time: '09:00',
    status: 'confirmed' as const,
  },
  {
    id: '2',
    patient: 'Joao Costa',
    doctor: 'Dra. Ana Lima',
    specialty: 'Dermatologia',
    time: '09:30',
    status: 'waiting' as const,
  },
  {
    id: '3',
    patient: 'Pedro Oliveira',
    doctor: 'Dr. Roberto Mendes',
    specialty: 'Ortopedia',
    time: '10:00',
    status: 'scheduled' as const,
  },
  {
    id: '4',
    patient: 'Lucia Ferreira',
    doctor: 'Dra. Patricia Souza',
    specialty: 'Pediatria',
    time: '10:30',
    status: 'confirmed' as const,
    isTelemedicine: true,
  },
];

const statusBadgeMap = {
  confirmed: { label: 'Confirmado', className: 'bg-green-100 text-green-800' },
  scheduled: { label: 'Agendado', className: 'bg-blue-100 text-blue-800' },
  waiting: { label: 'Aguardando', className: 'bg-yellow-100 text-yellow-800' },
  inProgress: { label: 'Em Andamento', className: 'bg-purple-100 text-purple-800' },
  completed: { label: 'Concluido', className: 'bg-gray-100 text-gray-800' },
  cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },
};

export default function DashboardPage() {
  const router = useRouter();
  const today = new Date();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard</h1>
          <p className="text-muted-foreground">
            Visao geral do sistema - {format(today, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push('/agenda')}>
            <Calendar className="mr-2 h-4 w-4" />
            Ver Agenda
          </Button>
          <Button onClick={() => router.push('/agenda/novo')}>
            Novo Agendamento
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center gap-1 text-xs">
                  {stat.changeType === 'positive' ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span
                    className={
                      stat.changeType === 'positive'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                  >
                    {stat.change}
                  </span>
                  <span className="text-muted-foreground">vs mes anterior</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Appointments Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Agendamentos da Semana</CardTitle>
            <CardDescription>
              Comparativo de agendamentos, realizacoes e cancelamentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={appointmentsWeekData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 12 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="agendados" fill="#3b82f6" name="Agendados" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="realizados" fill="#10b981" name="Realizados" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cancelados" fill="#ef4444" name="Cancelados" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Specialties Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Consultas por Especialidade</CardTitle>
            <CardDescription>
              Distribuicao de atendimentos este mes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={specialtiesData}
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
                    {specialtiesData.map((entry, index) => (
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

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Patient Growth */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Crescimento de Pacientes</CardTitle>
            <CardDescription>
              Evolucao do numero de pacientes cadastrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={patientGrowthData}>
                  <defs>
                    <linearGradient id="colorPacientes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 12 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="pacientes"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPacientes)"
                    name="Pacientes"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Today's Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo de Hoje</CardTitle>
            <CardDescription>Estatisticas em tempo real</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm">Agendados</span>
              </div>
              <span className="font-bold">67</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <span className="text-sm">Aguardando</span>
              </div>
              <span className="font-bold">8</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                  <Activity className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-sm">Em Atendimento</span>
              </div>
              <span className="font-bold">3</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-sm">Finalizados</span>
              </div>
              <span className="font-bold">42</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                  <XCircle className="h-4 w-4 text-red-600" />
                </div>
                <span className="text-sm">Cancelados</span>
              </div>
              <span className="font-bold">4</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart and Upcoming Appointments */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Receita Mensal</CardTitle>
            <CardDescription>
              Comparativo de receita e despesas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 12 }} />
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

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Proximos Atendimentos</CardTitle>
              <CardDescription>Agenda de hoje</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/agenda')}
            >
              Ver todos
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className="text-lg font-bold">{apt.time}</div>
                    </div>
                    <div>
                      <p className="font-medium">{apt.patient}</p>
                      <p className="text-sm text-muted-foreground">
                        {apt.doctor} - {apt.specialty}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {apt.isTelemedicine && (
                      <Badge variant="outline">
                        <Video className="mr-1 h-3 w-3" />
                        Tele
                      </Badge>
                    )}
                    <Badge className={statusBadgeMap[apt.status].className}>
                      {statusBadgeMap[apt.status].label}
                    </Badge>
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
          <CardDescription>Acesse rapidamente as funcoes mais utilizadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <QuickAction
              icon={Calendar}
              title="Novo Agendamento"
              description="Agendar consulta"
              href="/agenda/novo"
            />
            <QuickAction
              icon={Users}
              title="Novo Paciente"
              description="Cadastrar paciente"
              href="/pacientes/novo"
            />
            <QuickAction
              icon={Stethoscope}
              title="Medicos"
              description="Ver profissionais"
              href="/medicos"
            />
            <QuickAction
              icon={TrendingUp}
              title="Relatorios"
              description="Ver relatorios"
              href="/relatorios"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}
