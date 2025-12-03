'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  List,
  Clock,
  User,
  Stethoscope,
  Video,
  Phone,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from 'date-fns';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { appointmentsApi } from '@/lib/api/appointments';
import { doctorsApi } from '@/lib/api/doctors';
import {
  AppointmentStatus,
  getAppointmentStatusLabel,
  getAppointmentStatusColor,
  getAppointmentTypeLabel,
  getAppointmentTypeColor,
} from '@/types/appointment';
import type { Appointment } from '@/types/appointment';

type ViewMode = 'day' | 'week' | 'list';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 7); // 7:00 - 18:00

export default function AgendaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [viewMode, setViewMode] = React.useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDoctorId, setSelectedDoctorId] = React.useState<string>('all');

  // Date range based on view mode
  const startDate = viewMode === 'week'
    ? startOfWeek(currentDate, { weekStartsOn: 1 })
    : currentDate;
  const endDate = viewMode === 'week'
    ? endOfWeek(currentDate, { weekStartsOn: 1 })
    : currentDate;

  // Fetch appointments
  const { data: appointmentsData, isLoading, refetch } = useQuery({
    queryKey: [
      'appointments',
      format(startDate, 'yyyy-MM-dd'),
      format(endDate, 'yyyy-MM-dd'),
      selectedDoctorId,
    ],
    queryFn: () =>
      appointmentsApi.list({
        dateFrom: format(startDate, 'yyyy-MM-dd'),
        dateTo: format(endDate, 'yyyy-MM-dd'),
        doctorId: selectedDoctorId !== 'all' ? selectedDoctorId : undefined,
        limit: 200,
      }),
  });

  // Fetch doctors for filter
  const { data: doctorsData } = useQuery({
    queryKey: ['doctors-list'],
    queryFn: () => doctorsApi.list({ limit: 100 }),
  });

  const appointments = appointmentsData?.data ?? [];
  const doctors = doctorsData?.data ?? [];

  // Generate week days
  const weekDays = React.useMemo(() => {
    if (viewMode !== 'week') return [currentDate];
    const days = [];
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i));
    }
    return days;
  }, [currentDate, viewMode]);

  // Group appointments by date and hour
  const getAppointmentsForSlot = (date: Date, hour: number) => {
    return appointments.filter((apt) => {
      const aptDate = parseISO(apt.scheduledDate);
      const aptHour = parseInt(apt.scheduledTime.split(':')[0], 10);
      return isSameDay(aptDate, date) && aptHour === hour;
    });
  };

  // Navigation
  const goToToday = () => setCurrentDate(new Date());
  const goToPrevious = () => {
    setCurrentDate((prev) =>
      viewMode === 'week' ? addDays(prev, -7) : addDays(prev, -1)
    );
  };
  const goToNext = () => {
    setCurrentDate((prev) =>
      viewMode === 'week' ? addDays(prev, 7) : addDays(prev, 1)
    );
  };

  // Stats
  const todayAppointments = appointments.filter((apt) =>
    isSameDay(parseISO(apt.scheduledDate), new Date())
  );
  const pendingCount = todayAppointments.filter(
    (apt) =>
      apt.status === AppointmentStatus.SCHEDULED ||
      apt.status === AppointmentStatus.CONFIRMED
  ).length;
  const waitingCount = todayAppointments.filter(
    (apt) => apt.status === AppointmentStatus.WAITING
  ).length;
  const inProgressCount = todayAppointments.filter(
    (apt) => apt.status === AppointmentStatus.IN_PROGRESS
  ).length;

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Agenda' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground">
            Gerencie os agendamentos e consultas
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button onClick={() => router.push('/agenda/novo')}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Hoje</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAppointments.length}</div>
            <p className="text-xs text-muted-foreground">agendamentos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">aguardando</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Na Espera</CardTitle>
            <User className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{waitingCount}</div>
            <p className="text-xs text-muted-foreground">pacientes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Em Atendimento</CardTitle>
            <Stethoscope className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground">agora</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Controls */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={goToToday}>
                Hoje
              </Button>
              <Button variant="outline" size="icon" onClick={goToNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="ml-2 font-semibold">
                {viewMode === 'week'
                  ? `${format(startDate, 'dd MMM', { locale: ptBR })} - ${format(endDate, 'dd MMM yyyy', { locale: ptBR })}`
                  : format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>

            {/* Filters and View */}
            <div className="flex items-center gap-2">
              <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filtrar medico" />
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

              <div className="flex rounded-md border">
                <Button
                  variant={viewMode === 'day' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-r-none"
                  onClick={() => setViewMode('day')}
                >
                  Dia
                </Button>
                <Button
                  variant={viewMode === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none border-x"
                  onClick={() => setViewMode('week')}
                >
                  Semana
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-l-none"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-[500px] w-full" />
            </div>
          ) : viewMode === 'list' ? (
            // List View
            <div className="space-y-2">
              {appointments.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <CalendarIcon className="mx-auto h-12 w-12 opacity-50" />
                  <p className="mt-2">Nenhum agendamento encontrado</p>
                </div>
              ) : (
                appointments
                  .sort(
                    (a, b) =>
                      new Date(`${a.scheduledDate}T${a.scheduledTime}`).getTime() -
                      new Date(`${b.scheduledDate}T${b.scheduledTime}`).getTime()
                  )
                  .map((apt) => (
                    <AppointmentCard
                      key={apt.id}
                      appointment={apt}
                      onClick={() => router.push(`/agenda/${apt.id}`)}
                    />
                  ))
              )}
            </div>
          ) : (
            // Calendar View (Day/Week)
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Header with days */}
                <div
                  className="grid border-b"
                  style={{
                    gridTemplateColumns: `60px repeat(${weekDays.length}, 1fr)`,
                  }}
                >
                  <div className="p-2 text-sm text-muted-foreground">Hora</div>
                  {weekDays.map((day) => (
                    <div
                      key={day.toISOString()}
                      className={`p-2 text-center border-l ${
                        isSameDay(day, new Date())
                          ? 'bg-primary/5 font-semibold'
                          : ''
                      }`}
                    >
                      <div className="text-xs text-muted-foreground uppercase">
                        {format(day, 'EEE', { locale: ptBR })}
                      </div>
                      <div
                        className={`text-lg ${
                          isSameDay(day, new Date())
                            ? 'text-primary'
                            : ''
                        }`}
                      >
                        {format(day, 'dd')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Time slots */}
                <div className="max-h-[600px] overflow-y-auto">
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="grid border-b"
                      style={{
                        gridTemplateColumns: `60px repeat(${weekDays.length}, 1fr)`,
                        minHeight: '60px',
                      }}
                    >
                      <div className="p-2 text-xs text-muted-foreground border-r">
                        {`${hour.toString().padStart(2, '0')}:00`}
                      </div>
                      {weekDays.map((day) => {
                        const slotAppointments = getAppointmentsForSlot(day, hour);
                        return (
                          <div
                            key={`${day.toISOString()}-${hour}`}
                            className={`p-1 border-l min-h-[60px] ${
                              isSameDay(day, new Date())
                                ? 'bg-primary/5'
                                : ''
                            }`}
                          >
                            {slotAppointments.map((apt) => (
                              <button
                                key={apt.id}
                                onClick={() => router.push(`/agenda/${apt.id}`)}
                                className={`w-full text-left text-xs p-1 mb-1 rounded truncate ${getAppointmentTypeColor(apt.type)} text-white hover:opacity-90`}
                              >
                                <div className="font-medium truncate">
                                  {apt.patient?.socialName || apt.patient?.fullName}
                                </div>
                                <div className="opacity-80 truncate">
                                  {apt.scheduledTime} - {apt.doctor?.fullName}
                                </div>
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Appointment Card Component for List View
function AppointmentCard({
  appointment,
  onClick,
}: {
  appointment: Appointment;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border p-4 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">
              {format(parseISO(appointment.scheduledDate), 'dd')}
            </div>
            <div className="text-xs text-muted-foreground uppercase">
              {format(parseISO(appointment.scheduledDate), 'MMM', { locale: ptBR })}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{appointment.scheduledTime}</span>
              <span className="text-muted-foreground">
                ({appointment.duration} min)
              </span>
              {appointment.isTelemedicine && (
                <Badge variant="outline" className="gap-1">
                  <Video className="h-3 w-3" />
                  Telemedicina
                </Badge>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>
                {appointment.patient?.socialName || appointment.patient?.fullName}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Stethoscope className="h-3 w-3" />
              <span>
                Dr(a). {appointment.doctor?.socialName || appointment.doctor?.fullName}
              </span>
            </div>
            {appointment.reason && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                {appointment.reason}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge className={getAppointmentStatusColor(appointment.status)}>
            {getAppointmentStatusLabel(appointment.status)}
          </Badge>
          <Badge variant="outline">
            {getAppointmentTypeLabel(appointment.type)}
          </Badge>
        </div>
      </div>
    </button>
  );
}
