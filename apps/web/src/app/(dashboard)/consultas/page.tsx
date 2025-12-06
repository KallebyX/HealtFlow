'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  FileText,
  Clock,
  User,
  Stethoscope,
  Calendar,
  MoreHorizontal,
  Eye,
  Play,
  CheckCircle,
  XCircle,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { format, parseISO, isToday } from 'date-fns';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { consultationsApi } from '@/lib/api/consultations';
import { doctorsApi } from '@/lib/api/doctors';
import {
  Consultation,
  ConsultationStatus,
  getConsultationStatusLabel,
  getConsultationStatusColor,
} from '@/types/consultation';

export default function ConsultasPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [doctorFilter, setDoctorFilter] = React.useState<string>('all');
  const [dateFilter, setDateFilter] = React.useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );

  // Fetch consultations
  const { data: consultationsData, isLoading, refetch } = useQuery({
    queryKey: ['consultations', statusFilter, doctorFilter, dateFilter],
    queryFn: () =>
      consultationsApi.list({
        status: statusFilter !== 'all' ? statusFilter as ConsultationStatus : undefined,
        doctorId: doctorFilter !== 'all' ? doctorFilter : undefined,
        date: dateFilter,
        limit: 100,
      }),
  });

  // Fetch doctors for filter
  const { data: doctorsData } = useQuery({
    queryKey: ['doctors-filter'],
    queryFn: () => doctorsApi.list({ limit: 100 }),
  });

  const consultations = consultationsData?.data ?? [];
  const doctors = doctorsData?.data ?? [];

  // Stats
  const stats = {
    total: consultations.length,
    scheduled: consultations.filter((c) => c.status === ConsultationStatus.SCHEDULED).length,
    inProgress: consultations.filter((c) => c.status === ConsultationStatus.IN_PROGRESS).length,
    completed: consultations.filter((c) => c.status === ConsultationStatus.COMPLETED).length,
    cancelled: consultations.filter((c) => c.status === ConsultationStatus.CANCELLED).length,
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Consultas' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Consultas</h1>
          <p className="text-muted-foreground">
            Gerencie os atendimentos e prontuarios
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button onClick={() => router.push('/agenda/novo')}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Consulta
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">consultas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Agendadas</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Play className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Finalizadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.values(ConsultationStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {getConsultationStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={doctorFilter} onValueChange={setDoctorFilter}>
              <SelectTrigger className="w-[200px]">
                <Stethoscope className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Medico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os medicos</SelectItem>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    Dr(a). {doctor.socialName || doctor.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Consultations List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Consultas - {format(parseISO(dateFilter), "dd 'de' MMMM", { locale: ptBR })}
          </CardTitle>
          <CardDescription>
            {isToday(parseISO(dateFilter)) ? 'Consultas de hoje' : 'Consultas do dia selecionado'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : consultations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium">Nenhuma consulta encontrada</p>
              <p className="text-muted-foreground">
                Nao ha consultas para os filtros selecionados
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {consultations
                .sort((a, b) => {
                  if (a.appointment?.scheduledTime && b.appointment?.scheduledTime) {
                    return a.appointment.scheduledTime.localeCompare(b.appointment.scheduledTime);
                  }
                  return 0;
                })
                .map((consultation) => (
                  <ConsultationCard
                    key={consultation.id}
                    consultation={consultation}
                    onView={() => router.push(`/prontuario/${consultation.id}`)}
                  />
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ConsultationCard({
  consultation,
  onView,
}: {
  consultation: Consultation;
  onView: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="text-center min-w-[60px]">
          <div className="text-2xl font-bold">
            {consultation.appointment?.scheduledTime?.slice(0, 5) || '--:--'}
          </div>
        </div>

        <div className="border-l pl-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {consultation.patient?.socialName || consultation.patient?.fullName}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <Stethoscope className="h-3 w-3" />
            <span>
              Dr(a). {consultation.doctor?.socialName || consultation.doctor?.fullName}
            </span>
          </div>
          {consultation.chiefComplaint && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
              Queixa: {consultation.chiefComplaint}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge className={getConsultationStatusColor(consultation.status)}>
          {getConsultationStatusLabel(consultation.status)}
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acoes</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onView}>
              <Eye className="mr-2 h-4 w-4" />
              Ver prontuario
            </DropdownMenuItem>
            {consultation.status === ConsultationStatus.SCHEDULED && (
              <DropdownMenuItem onClick={() => router.push(`/prontuario/${consultation.id}`)}>
                <Play className="mr-2 h-4 w-4" />
                Iniciar atendimento
              </DropdownMenuItem>
            )}
            {consultation.status === ConsultationStatus.IN_PROGRESS && (
              <DropdownMenuItem onClick={() => router.push(`/prontuario/${consultation.id}`)}>
                <FileText className="mr-2 h-4 w-4" />
                Continuar atendimento
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
