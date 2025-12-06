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
  DollarSign,
  UserPlus,
  Stethoscope,
  Video,
  ArrowUpRight,
  Building2,
  UserCog,
  Shield,
  Settings,
  AlertTriangle,
  Target,
  BarChart3,
  HeartPulse,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
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
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getInitials } from '@/lib/utils';

// Clinic info
const clinicInfo = {
  name: 'Clinica Saude Total',
  address: 'Av. Paulista, 1000 - Sao Paulo, SP',
  totalRooms: 15,
  activeRooms: 12,
  totalDoctors: 28,
  activeDoctors: 24,
  totalEmployees: 45,
};

// Stats
const overviewStats = {
  patientsToday: 187,
  patientsChange: 12,
  revenue: 67500,
  revenueChange: 8,
  occupancy: 85,
  occupancyChange: 5,
  avgWaitTime: 18,
  waitTimeChange: -3,
  satisfaction: 4.7,
  satisfactionChange: 0.2,
  newPatients: 23,
  newPatientsChange: 15,
};

// Weekly appointments trend
const weeklyAppointments = [
  { day: 'Seg', agendados: 45, realizados: 40, cancelados: 5 },
  { day: 'Ter', agendados: 52, realizados: 48, cancelados: 4 },
  { day: 'Qua', agendados: 48, realizados: 45, cancelados: 3 },
  { day: 'Qui', agendados: 58, realizados: 52, cancelados: 6 },
  { day: 'Sex', agendados: 55, realizados: 50, cancelados: 5 },
  { day: 'Sab', agendados: 25, realizados: 22, cancelados: 3 },
];

// Monthly revenue data
const monthlyRevenue = [
  { month: 'Jan', receita: 52000, despesas: 38000, lucro: 14000 },
  { month: 'Fev', receita: 58000, despesas: 40000, lucro: 18000 },
  { month: 'Mar', receita: 55000, despesas: 39000, lucro: 16000 },
  { month: 'Abr', receita: 62000, despesas: 42000, lucro: 20000 },
  { month: 'Mai', receita: 65000, despesas: 43000, lucro: 22000 },
  { month: 'Jun', receita: 67500, despesas: 44000, lucro: 23500 },
];

// Revenue by payment method
const revenueByPayment = [
  { name: 'Particular', value: 35, color: '#3b82f6' },
  { name: 'Convenio', value: 45, color: '#10b981' },
  { name: 'SUS', value: 15, color: '#f59e0b' },
  { name: 'Outros', value: 5, color: '#6b7280' },
];

// Appointments by specialty
const appointmentsBySpecialty = [
  { specialty: 'Cardiologia', count: 85, color: '#ef4444' },
  { specialty: 'Pediatria', count: 72, color: '#f59e0b' },
  { specialty: 'Ortopedia', count: 65, color: '#3b82f6' },
  { specialty: 'Dermatologia', count: 58, color: '#8b5cf6' },
  { specialty: 'Ginecologia', count: 52, color: '#ec4899' },
];

// Doctor performance
const doctorPerformance = [
  {
    id: '1',
    name: 'Dr. Carlos Santos',
    specialty: 'Cardiologia',
    consultations: 48,
    rating: 4.9,
    revenue: 12500,
    availability: 92,
  },
  {
    id: '2',
    name: 'Dra. Ana Lima',
    specialty: 'Pediatria',
    consultations: 52,
    rating: 4.8,
    revenue: 11800,
    availability: 88,
  },
  {
    id: '3',
    name: 'Dr. Roberto Mendes',
    specialty: 'Ortopedia',
    consultations: 38,
    rating: 4.7,
    revenue: 15200,
    availability: 95,
  },
  {
    id: '4',
    name: 'Dra. Patricia Souza',
    specialty: 'Dermatologia',
    consultations: 45,
    rating: 4.9,
    revenue: 13400,
    availability: 90,
  },
];

// Employee summary
const employeeSummary = {
  doctors: 28,
  nurses: 12,
  receptionists: 8,
  technicians: 6,
  admin: 4,
  onDuty: 35,
  onLeave: 3,
  absent: 2,
};

// Alerts
const alerts = [
  {
    id: '1',
    type: 'warning',
    title: 'Estoque baixo',
    description: '5 itens de material medico com estoque critico',
    time: '2h atras',
  },
  {
    id: '2',
    type: 'info',
    title: 'Manutencao programada',
    description: 'Sistema de ar-condicionado sala 5 - Amanha 8h',
    time: '4h atras',
  },
  {
    id: '3',
    type: 'error',
    title: 'Equipamento indisponivel',
    description: 'Eletrocardiografo #3 em manutencao',
    time: '1 dia atras',
  },
];

// Room occupancy
const roomOccupancy = [
  { room: 'Sala 1', status: 'occupied', doctor: 'Dr. Carlos' },
  { room: 'Sala 2', status: 'occupied', doctor: 'Dra. Ana' },
  { room: 'Sala 3', status: 'available', doctor: null },
  { room: 'Sala 4', status: 'occupied', doctor: 'Dr. Roberto' },
  { room: 'Sala 5', status: 'maintenance', doctor: null },
  { room: 'Sala 6', status: 'available', doctor: null },
  { room: 'Sala 7', status: 'occupied', doctor: 'Dra. Patricia' },
  { room: 'Sala 8', status: 'occupied', doctor: 'Dr. Fernando' },
];

// Recent activities
const recentActivities = [
  { id: '1', action: 'Novo paciente cadastrado', user: 'Maria (Recepcao)', time: '5 min atras' },
  { id: '2', action: 'Consulta finalizada', user: 'Dr. Carlos Santos', time: '12 min atras' },
  { id: '3', action: 'Pagamento recebido - R$ 350', user: 'Ana (Financeiro)', time: '20 min atras' },
  { id: '4', action: 'Exame agendado', user: 'Pedro (Laboratorio)', time: '35 min atras' },
  { id: '5', action: 'Prontuario atualizado', user: 'Dra. Ana Lima', time: '45 min atras' },
];

const alertTypeStyles = {
  error: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600' },
  warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: 'text-yellow-600' },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600' },
};

const roomStatusStyles = {
  occupied: { bg: 'bg-green-100', text: 'text-green-800', label: 'Ocupada' },
  available: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Livre' },
  maintenance: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Manutencao' },
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const today = new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{clinicInfo.name}</h1>
              <p className="text-muted-foreground text-sm">{clinicInfo.address}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push('/relatorios')}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Relatorios
          </Button>
          <Button variant="outline" onClick={() => router.push('/configuracoes')}>
            <Settings className="mr-2 h-4 w-4" />
            Configuracoes
          </Button>
        </div>
      </div>

      {/* Date */}
      <p className="text-muted-foreground">
        Dashboard Administrativo - {format(today, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
      </p>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(0, 2).map((alert) => {
            const styles = alertTypeStyles[alert.type as keyof typeof alertTypeStyles];
            return (
              <div
                key={alert.id}
                className={`flex items-center justify-between rounded-lg border p-3 ${styles.bg} ${styles.border}`}
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`h-5 w-5 ${styles.icon}`} />
                  <div>
                    <p className="font-medium text-sm">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">{alert.description}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{alert.time}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <StatCard
          title="Pacientes Hoje"
          value={overviewStats.patientsToday.toString()}
          change={`+${overviewStats.patientsChange}%`}
          changeType="positive"
          icon={Users}
        />
        <StatCard
          title="Receita Mensal"
          value={`R$ ${(overviewStats.revenue / 1000).toFixed(1)}k`}
          change={`+${overviewStats.revenueChange}%`}
          changeType="positive"
          icon={DollarSign}
        />
        <StatCard
          title="Taxa Ocupacao"
          value={`${overviewStats.occupancy}%`}
          change={`+${overviewStats.occupancyChange}%`}
          changeType="positive"
          icon={Target}
        />
        <StatCard
          title="Tempo Espera"
          value={`${overviewStats.avgWaitTime} min`}
          change={`${overviewStats.waitTimeChange} min`}
          changeType="positive"
          icon={Clock}
        />
        <StatCard
          title="Satisfacao"
          value={overviewStats.satisfaction.toFixed(1)}
          change={`+${overviewStats.satisfactionChange}`}
          changeType="positive"
          icon={HeartPulse}
        />
        <StatCard
          title="Novos Pacientes"
          value={overviewStats.newPatients.toString()}
          change={`+${overviewStats.newPatientsChange}%`}
          changeType="positive"
          icon={UserPlus}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Agendamentos da Semana</CardTitle>
            <CardDescription>Comparativo de atendimentos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyAppointments}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
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

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Receita x Despesas</CardTitle>
            <CardDescription>Evolucao financeira mensal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$ ${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={2} name="Receita" />
                  <Line type="monotone" dataKey="despesas" stroke="#ef4444" strokeWidth={2} name="Despesas" />
                  <Line type="monotone" dataKey="lucro" stroke="#3b82f6" strokeWidth={2} name="Lucro" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Receita por Forma de Pagamento</CardTitle>
            <CardDescription>Distribuicao percentual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={revenueByPayment}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {revenueByPayment.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, 'Porcentagem']}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Appointments by Specialty */}
        <Card>
          <CardHeader>
            <CardTitle>Top Especialidades</CardTitle>
            <CardDescription>Consultas este mes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointmentsBySpecialty.map((item, index) => (
                <div key={item.specialty} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.specialty}</span>
                    <span className="text-muted-foreground">{item.count} consultas</span>
                  </div>
                  <Progress
                    value={(item.count / appointmentsBySpecialty[0].count) * 100}
                    className="h-2"
                    style={{ '--progress-color': item.color } as React.CSSProperties}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Employee Status */}
        <Card>
          <CardHeader>
            <CardTitle>Equipe</CardTitle>
            <CardDescription>Status dos funcionarios hoje</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-green-50">
                  <p className="text-2xl font-bold text-green-600">{employeeSummary.onDuty}</p>
                  <p className="text-xs text-muted-foreground">Em servico</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-yellow-50">
                  <p className="text-2xl font-bold text-yellow-600">{employeeSummary.onLeave}</p>
                  <p className="text-xs text-muted-foreground">De folga</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Medicos</span>
                  <span className="font-medium">{employeeSummary.doctors}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Enfermeiros</span>
                  <span className="font-medium">{employeeSummary.nurses}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recepcionistas</span>
                  <span className="font-medium">{employeeSummary.receptionists}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tecnicos</span>
                  <span className="font-medium">{employeeSummary.technicians}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Administrativo</span>
                  <span className="font-medium">{employeeSummary.admin}</span>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={() => router.push('/funcionarios')}>
                Gerenciar Equipe
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Doctor Performance */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Desempenho dos Medicos</CardTitle>
              <CardDescription>Ranking por produtividade este mes</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/medicos')}>
              Ver todos
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {doctorPerformance.map((doctor, index) => (
                <div
                  key={doctor.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold">
                      {index + 1}
                    </div>
                    <Avatar>
                      <AvatarFallback>{getInitials(doctor.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{doctor.name}</p>
                      <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="font-bold">{doctor.consultations}</p>
                      <p className="text-xs text-muted-foreground">Consultas</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold">R$ {(doctor.revenue / 1000).toFixed(1)}k</p>
                      <p className="text-xs text-muted-foreground">Receita</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1">
                        <span className="font-bold">{doctor.rating}</span>
                        <span className="text-yellow-500">★</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Avaliacao</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold">{doctor.availability}%</p>
                      <p className="text-xs text-muted-foreground">Disp.</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Room Status & Recent Activity */}
        <div className="space-y-6">
          {/* Room Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status das Salas</CardTitle>
              <CardDescription>Ocupacao em tempo real</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {roomOccupancy.map((room) => {
                  const styles = roomStatusStyles[room.status as keyof typeof roomStatusStyles];
                  return (
                    <div
                      key={room.room}
                      className={`p-2 rounded-lg text-center ${styles.bg}`}
                      title={room.doctor || styles.label}
                    >
                      <p className={`text-xs font-medium ${styles.text}`}>
                        {room.room.replace('Sala ', '')}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-4 mt-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded bg-green-100" />
                  <span>Ocupada</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded bg-blue-100" />
                  <span>Livre</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded bg-yellow-100" />
                  <span>Manut.</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Atividade Recente</CardTitle>
              <CardDescription>Ultimas acoes no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-3">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 text-sm"
                    >
                      <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                      <div className="flex-1">
                        <p>{activity.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.user} • {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Gestao da Clinica</CardTitle>
          <CardDescription>Acoes administrativas rapidas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <QuickAction
              icon={Building2}
              title="Clinicas"
              description="Gerenciar unidades"
              href="/clinicas"
            />
            <QuickAction
              icon={UserCog}
              title="Funcionarios"
              description="Gerenciar equipe"
              href="/funcionarios"
            />
            <QuickAction
              icon={Stethoscope}
              title="Medicos"
              description="Corpo clinico"
              href="/medicos"
            />
            <QuickAction
              icon={DollarSign}
              title="Faturamento"
              description="Financeiro"
              href="/faturamento"
            />
            <QuickAction
              icon={BarChart3}
              title="Relatorios"
              description="Analises detalhadas"
              href="/relatorios"
            />
            <QuickAction
              icon={Calendar}
              title="Agenda"
              description="Ver agendamentos"
              href="/agenda"
            />
            <QuickAction
              icon={Shield}
              title="Permissoes"
              description="Controle de acesso"
              href="/configuracoes"
            />
            <QuickAction
              icon={Settings}
              title="Configuracoes"
              description="Sistema"
              href="/configuracoes"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
}: {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-1 text-xs">
          {changeType === 'positive' ? (
            <TrendingUp className="h-3 w-3 text-green-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )}
          <span className={changeType === 'positive' ? 'text-green-600' : 'text-red-600'}>
            {change}
          </span>
          <span className="text-muted-foreground">vs anterior</span>
        </div>
      </CardContent>
    </Card>
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
