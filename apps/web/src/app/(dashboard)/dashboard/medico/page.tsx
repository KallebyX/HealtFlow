'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Calendar,
  FileText,
  TrendingUp,
  Clock,
  Activity,
  Stethoscope,
  Video,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  AlertTriangle,
  ClipboardList,
  Pill,
  TestTubes,
  Star,
  Award,
  Play,
  Bell,
  UserCheck,
  Timer,
  BarChart3,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getInitials } from '@/lib/utils';

// Mock data for doctor dashboard
const doctorInfo = {
  name: 'Dr. Carlos Santos',
  specialty: 'Cardiologia',
  crm: '123456-SP',
  avatar: null,
  rating: 4.8,
  reviewCount: 156,
};

const todayStats = {
  scheduled: 12,
  completed: 5,
  inProgress: 1,
  waiting: 3,
  cancelled: 1,
  noShow: 0,
  telemedicine: 4,
  avgConsultTime: 25, // minutes
};

const weeklyPerformance = [
  { day: 'Seg', consultas: 10, media: 24 },
  { day: 'Ter', consultas: 12, media: 22 },
  { day: 'Qua', consultas: 8, media: 28 },
  { day: 'Qui', consultas: 11, media: 25 },
  { day: 'Sex', consultas: 9, media: 23 },
  { day: 'Sab', consultas: 6, media: 20 },
];

const monthlyConsultations = [
  { semana: 'Sem 1', total: 45 },
  { semana: 'Sem 2', total: 52 },
  { semana: 'Sem 3', total: 48 },
  { semana: 'Sem 4', total: 55 },
];

const waitingPatients = [
  {
    id: '1',
    name: 'Maria Silva Santos',
    age: 45,
    waitTime: '15 min',
    reason: 'Dor no peito',
    priority: 'high',
    isFirstVisit: false,
  },
  {
    id: '2',
    name: 'Joao Costa Lima',
    age: 62,
    waitTime: '8 min',
    reason: 'Retorno - Hipertensao',
    priority: 'normal',
    isFirstVisit: false,
  },
  {
    id: '3',
    name: 'Ana Paula Ferreira',
    age: 35,
    waitTime: '3 min',
    reason: 'Check-up cardiologico',
    priority: 'normal',
    isFirstVisit: true,
  },
];

const upcomingAppointments = [
  {
    id: '1',
    patient: 'Pedro Oliveira',
    time: '10:30',
    type: 'Consulta',
    isTelemedicine: false,
  },
  {
    id: '2',
    patient: 'Lucia Ferreira',
    time: '11:00',
    type: 'Retorno',
    isTelemedicine: true,
  },
  {
    id: '3',
    patient: 'Roberto Mendes',
    time: '11:30',
    type: 'Consulta',
    isTelemedicine: false,
  },
  {
    id: '4',
    patient: 'Patricia Souza',
    time: '14:00',
    type: 'Telemedicina',
    isTelemedicine: true,
  },
  {
    id: '5',
    patient: 'Fernando Lima',
    time: '14:30',
    type: 'Retorno',
    isTelemedicine: false,
  },
];

const pendingTasks = [
  {
    id: '1',
    type: 'prescription',
    title: 'Receita pendente de assinatura',
    patient: 'Maria Silva',
    urgency: 'high',
    time: '2h atras',
  },
  {
    id: '2',
    type: 'lab',
    title: 'Resultado de exame para revisao',
    patient: 'Joao Costa',
    urgency: 'normal',
    time: '4h atras',
    detail: 'Hemograma + Lipidograma',
  },
  {
    id: '3',
    type: 'lab',
    title: 'Valor critico - Glicemia',
    patient: 'Pedro Santos',
    urgency: 'critical',
    time: '30 min atras',
    detail: '450 mg/dL',
  },
  {
    id: '4',
    type: 'report',
    title: 'Laudo pendente',
    patient: 'Ana Lima',
    urgency: 'normal',
    time: '1 dia atras',
  },
];

const recentPatients = [
  {
    id: '1',
    name: 'Carlos Eduardo Silva',
    lastVisit: new Date(2024, 2, 17),
    condition: 'Hipertensao',
    nextAppointment: new Date(2024, 3, 17),
  },
  {
    id: '2',
    name: 'Maria Helena Costa',
    lastVisit: new Date(2024, 2, 16),
    condition: 'Arritmia',
    nextAppointment: new Date(2024, 3, 16),
  },
  {
    id: '3',
    name: 'Jose Antonio Lima',
    lastVisit: new Date(2024, 2, 15),
    condition: 'Insuficiencia cardiaca',
    nextAppointment: null,
  },
];

const notifications = [
  {
    id: '1',
    message: 'Paciente Maria Silva chegou para consulta',
    time: '2 min atras',
    type: 'arrival',
  },
  {
    id: '2',
    message: 'Novo resultado de exame disponivel',
    time: '15 min atras',
    type: 'lab',
  },
  {
    id: '3',
    message: 'Lembrete: Reuniao clinica as 17h',
    time: '1h atras',
    type: 'reminder',
  },
];

const priorityColors = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  normal: 'bg-blue-100 text-blue-800 border-blue-200',
};

const taskTypeIcons = {
  prescription: Pill,
  lab: TestTubes,
  report: FileText,
};

export default function DoctorDashboardPage() {
  const router = useRouter();
  const today = new Date();
  const [currentPatient, setCurrentPatient] = React.useState<string | null>(null);

  // Calculate progress
  const consultationProgress = Math.round(
    (todayStats.completed / todayStats.scheduled) * 100
  );

  return (
    <div className="space-y-6">
      {/* Header with Doctor Info */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={doctorInfo.avatar || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {getInitials(doctorInfo.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{doctorInfo.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Stethoscope className="h-4 w-4" />
              <span>{doctorInfo.specialty}</span>
              <span>•</span>
              <span>CRM {doctorInfo.crm}</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{doctorInfo.rating}</span>
              <span className="text-sm text-muted-foreground">
                ({doctorInfo.reviewCount} avaliacoes)
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push('/agenda')}>
            <Calendar className="mr-2 h-4 w-4" />
            Minha Agenda
          </Button>
          <Button onClick={() => router.push('/consultas')}>
            <Play className="mr-2 h-4 w-4" />
            Iniciar Atendimento
          </Button>
        </div>
      </div>

      {/* Date and Notifications */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          {format(today, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Bell className="h-3 w-3" />
            {notifications.length} notificacoes
          </Badge>
        </div>
      </div>

      {/* Critical Alert - if exists */}
      {pendingTasks.some((t) => t.urgency === 'critical') && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-800">Atencao: Valores criticos pendentes</p>
                <p className="text-sm text-red-600">
                  {pendingTasks.filter((t) => t.urgency === 'critical').length} resultado(s) requer(em) atencao imediata
                </p>
              </div>
            </div>
            <Button variant="destructive" size="sm" onClick={() => router.push('/laboratorio')}>
              Ver Agora
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Today Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Agendados Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.scheduled}</div>
            <Progress value={consultationProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {consultationProgress}% concluido
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aguardando</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{todayStats.waiting}</div>
            <p className="text-xs text-muted-foreground">pacientes na sala de espera</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Finalizados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{todayStats.completed}</div>
            <p className="text-xs text-muted-foreground">de {todayStats.scheduled} consultas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Telemedicina</CardTitle>
            <Video className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{todayStats.telemedicine}</div>
            <p className="text-xs text-muted-foreground">consultas online hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tempo Medio</CardTitle>
            <Timer className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.avgConsultTime}min</div>
            <p className="text-xs text-muted-foreground">por consulta</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Waiting Patients & Upcoming */}
        <div className="lg:col-span-2 space-y-6">
          {/* Waiting Patients */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pacientes Aguardando</CardTitle>
                <CardDescription>Sala de espera em tempo real</CardDescription>
              </div>
              <Badge variant="secondary">{waitingPatients.length} pacientes</Badge>
            </CardHeader>
            <CardContent>
              {waitingPatients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <UserCheck className="h-12 w-12 mb-2" />
                  <p>Nenhum paciente aguardando</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {waitingPatients.map((patient, index) => (
                    <div
                      key={patient.id}
                      className={`flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                        index === 0 ? 'border-primary bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[50px]">
                          <span className="text-2xl font-bold text-muted-foreground">
                            #{index + 1}
                          </span>
                        </div>
                        <Avatar>
                          <AvatarFallback>{getInitials(patient.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{patient.name}</p>
                            {patient.isFirstVisit && (
                              <Badge variant="outline" className="text-xs">
                                1a Consulta
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {patient.age} anos • {patient.reason}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <Badge className={priorityColors[patient.priority as keyof typeof priorityColors]}>
                            {patient.priority === 'high' ? 'Prioritario' : 'Normal'}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            Aguardando ha {patient.waitTime}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/prontuario/novo?paciente=${patient.id}`)}
                        >
                          <Play className="mr-1 h-3 w-3" />
                          Atender
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Consultas da Semana</CardTitle>
                <CardDescription>Total de atendimentos por dia</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyPerformance}>
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
                      <Bar dataKey="consultas" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Consultas" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tempo Medio (min)</CardTitle>
                <CardDescription>Duracao media das consultas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyPerformance}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} domain={[15, 35]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="media"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: '#10b981' }}
                        name="Tempo medio (min)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Producao Mensal</CardTitle>
              <CardDescription>Total de consultas por semana</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyConsultations}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="semana" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorTotal)"
                      name="Consultas"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Tasks & Schedule */}
        <div className="space-y-6">
          {/* Pending Tasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tarefas Pendentes</CardTitle>
                <CardDescription>Itens que precisam de atencao</CardDescription>
              </div>
              <Badge variant="secondary">{pendingTasks.length}</Badge>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[280px]">
                <div className="space-y-3">
                  {pendingTasks.map((task) => {
                    const Icon = taskTypeIcons[task.type as keyof typeof taskTypeIcons];
                    return (
                      <div
                        key={task.id}
                        className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 ${
                          task.urgency === 'critical'
                            ? 'border-red-200 bg-red-50'
                            : task.urgency === 'high'
                            ? 'border-orange-200 bg-orange-50'
                            : ''
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            task.urgency === 'critical'
                              ? 'bg-red-100 text-red-600'
                              : task.urgency === 'high'
                              ? 'bg-orange-100 text-orange-600'
                              : 'bg-blue-100 text-blue-600'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{task.title}</p>
                          <p className="text-xs text-muted-foreground">{task.patient}</p>
                          {task.detail && (
                            <p className="text-xs font-medium mt-1">{task.detail}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">{task.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Upcoming Appointments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Proximos Atendimentos</CardTitle>
                <CardDescription>Sua agenda para hoje</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push('/agenda')}>
                Ver agenda
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[280px]">
                <div className="space-y-3">
                  {upcomingAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-center min-w-[50px]">
                          <span className="text-lg font-bold">{apt.time}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{apt.patient}</p>
                          <p className="text-xs text-muted-foreground">{apt.type}</p>
                        </div>
                      </div>
                      {apt.isTelemedicine && (
                        <Badge variant="outline" className="gap-1">
                          <Video className="h-3 w-3" />
                          Online
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Recent Patients */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pacientes Recentes</CardTitle>
                <CardDescription>Ultimos atendimentos</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push('/pacientes')}>
                Ver todos
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 cursor-pointer"
                    onClick={() => router.push(`/pacientes/${patient.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(patient.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{patient.name}</p>
                        <p className="text-xs text-muted-foreground">{patient.condition}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(patient.lastVisit, {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acoes Rapidas</CardTitle>
          <CardDescription>Acesse as funcoes mais utilizadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <QuickAction
              icon={Play}
              title="Iniciar Consulta"
              description="Atender paciente"
              href="/consultas"
            />
            <QuickAction
              icon={Calendar}
              title="Minha Agenda"
              description="Ver compromissos"
              href="/agenda"
            />
            <QuickAction
              icon={Users}
              title="Meus Pacientes"
              description="Lista de pacientes"
              href="/pacientes"
            />
            <QuickAction
              icon={TestTubes}
              title="Resultados"
              description="Exames pendentes"
              href="/laboratorio"
            />
            <QuickAction
              icon={Pill}
              title="Prescricoes"
              description="Receitas pendentes"
              href="/prescricoes"
            />
            <QuickAction
              icon={Video}
              title="Telemedicina"
              description="Consultas online"
              href="/telemedicina"
            />
            <QuickAction
              icon={BarChart3}
              title="Meus Relatorios"
              description="Estatisticas"
              href="/relatorios"
            />
            <QuickAction
              icon={Award}
              title="Gamificacao"
              description="Conquistas"
              href="/gamificacao"
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
