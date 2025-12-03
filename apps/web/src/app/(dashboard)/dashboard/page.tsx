import type { Metadata } from 'next';
import {
  Users,
  Calendar,
  FileText,
  TrendingUp,
  Clock,
  Activity,
  DollarSign,
  UserPlus,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Visao geral do sistema HealthFlow',
};

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
    value: '24',
    change: '+3',
    changeType: 'positive' as const,
    icon: Calendar,
  },
  {
    title: 'Receita Mensal',
    value: 'R$ 45.231',
    change: '+8%',
    changeType: 'positive' as const,
    icon: DollarSign,
  },
  {
    title: 'Novos Pacientes',
    value: '47',
    change: 'este mes',
    changeType: 'neutral' as const,
    icon: UserPlus,
  },
];

const recentAppointments = [
  {
    id: 1,
    patient: 'Maria Silva',
    doctor: 'Dr. Carlos Eduardo',
    time: '08:00',
    type: 'Consulta',
    status: 'confirmed' as const,
  },
  {
    id: 2,
    patient: 'Joao Santos',
    doctor: 'Dra. Ana Paula',
    time: '09:30',
    type: 'Retorno',
    status: 'scheduled' as const,
  },
  {
    id: 3,
    patient: 'Ana Oliveira',
    doctor: 'Dr. Roberto Lima',
    time: '10:00',
    type: 'Telemedicina',
    status: 'inProgress' as const,
  },
  {
    id: 4,
    patient: 'Pedro Costa',
    doctor: 'Dra. Fernanda',
    time: '11:30',
    type: 'Exame',
    status: 'scheduled' as const,
  },
  {
    id: 5,
    patient: 'Lucia Ferreira',
    doctor: 'Dr. Carlos Eduardo',
    time: '14:00',
    type: 'Consulta',
    status: 'scheduled' as const,
  },
];

const statusBadgeMap = {
  confirmed: { label: 'Confirmado', variant: 'success' as const },
  scheduled: { label: 'Agendado', variant: 'info' as const },
  inProgress: { label: 'Em Andamento', variant: 'warning' as const },
  completed: { label: 'Concluido', variant: 'secondary' as const },
  cancelled: { label: 'Cancelado', variant: 'destructive' as const },
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta! Aqui esta um resumo das atividades de hoje.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Atualizado ha 5 minutos</span>
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
                <p
                  className={`text-xs ${
                    stat.changeType === 'positive'
                      ? 'text-green-600 dark:text-green-400'
                      : stat.changeType === 'negative'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-muted-foreground'
                  }`}
                >
                  {stat.change}
                  {stat.changeType !== 'neutral' && ' vs mes anterior'}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Consultas de Hoje
            </CardTitle>
            <CardDescription>
              Proximas consultas agendadas para hoje
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{appointment.patient}</p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.doctor} - {appointment.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{appointment.time}</span>
                    <Badge variant={statusBadgeMap[appointment.status].variant}>
                      {statusBadgeMap[appointment.status].label}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Atividade Recente
            </CardTitle>
            <CardDescription>
              Ultimas acoes realizadas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ActivityItem
                title="Nova consulta agendada"
                description="Maria Silva - Dr. Carlos Eduardo"
                time="ha 5 min"
                type="appointment"
              />
              <ActivityItem
                title="Prescricao emitida"
                description="Receituario #1234 - Joao Santos"
                time="ha 15 min"
                type="prescription"
              />
              <ActivityItem
                title="Resultado de exame disponivel"
                description="Hemograma completo - Ana Oliveira"
                time="ha 30 min"
                type="exam"
              />
              <ActivityItem
                title="Novo paciente cadastrado"
                description="Pedro Costa - CPF ***456***"
                time="ha 1 hora"
                type="patient"
              />
              <ActivityItem
                title="Consulta finalizada"
                description="Lucia Ferreira - Dra. Fernanda"
                time="ha 2 horas"
                type="completed"
              />
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
              icon={FileText}
              title="Nova Prescricao"
              description="Emitir receituario"
              href="/prescricoes/nova"
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

function ActivityItem({
  title,
  description,
  time,
  type,
}: {
  title: string;
  description: string;
  time: string;
  type: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <span className="text-xs text-muted-foreground">{time}</span>
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
    <a
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
    </a>
  );
}
