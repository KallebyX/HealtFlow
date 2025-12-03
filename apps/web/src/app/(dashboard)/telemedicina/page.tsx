'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Video,
  VideoOff,
  Clock,
  Calendar,
  User,
  Stethoscope,
  CheckCircle,
  AlertTriangle,
  Play,
  Eye,
} from 'lucide-react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { telemedicineApi } from '@/lib/api/telemedicine';
import {
  VideoCallStatus,
  getVideoCallStatusLabel,
  getVideoCallStatusColor,
  formatDuration,
} from '@/types/telemedicine';
import type { VideoCall } from '@/types/telemedicine';

export default function TelemedinaPage() {
  const router = useRouter();

  const { data: todayCalls, isLoading: loadingToday } = useQuery({
    queryKey: ['telemedicine', 'today'],
    queryFn: () => telemedicineApi.getTodayCalls(),
  });

  const { data: upcomingCalls, isLoading: loadingUpcoming } = useQuery({
    queryKey: ['telemedicine', 'upcoming'],
    queryFn: () => telemedicineApi.getUpcoming(10),
  });

  const { data: historyCalls, isLoading: loadingHistory } = useQuery({
    queryKey: ['telemedicine', 'history'],
    queryFn: () =>
      telemedicineApi.list({
        status: [VideoCallStatus.COMPLETED, VideoCallStatus.CANCELLED],
        limit: 20,
      }),
  });

  const inProgressCalls = todayCalls?.filter(
    (c) => c.status === VideoCallStatus.IN_PROGRESS
  ) || [];
  const waitingCalls = todayCalls?.filter(
    (c) => c.status === VideoCallStatus.WAITING
  ) || [];
  const scheduledToday = todayCalls?.filter(
    (c) => c.status === VideoCallStatus.SCHEDULED
  ) || [];

  const formatScheduleDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Hoje';
    if (isTomorrow(date)) return 'Amanha';
    return format(date, "dd 'de' MMMM", { locale: ptBR });
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Telemedicina' },
        ]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Telemedicina</h1>
          <p className="text-muted-foreground">
            Gerencie suas consultas por video
          </p>
        </div>
      </div>

      {/* Active Call Alert */}
      {inProgressCalls.length > 0 && (
        <Card className="border-green-500 bg-green-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
                  <Video className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-green-800">
                    Consulta em andamento
                  </p>
                  <p className="text-sm text-green-700">
                    {inProgressCalls[0].patient?.fullName || inProgressCalls[0].patient?.socialName}
                  </p>
                </div>
              </div>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => router.push(`/telemedicina/${inProgressCalls[0].id}`)}
              >
                <Video className="mr-2 h-4 w-4" />
                Retornar a consulta
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Video className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCalls.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Na Espera</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{waitingCalls.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendadas Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledToday.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finalizadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {historyCalls?.data.filter((c) => c.status === VideoCallStatus.COMPLETED).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Waiting Room */}
      {waitingCalls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              Sala de Espera
            </CardTitle>
            <CardDescription>
              Pacientes aguardando para iniciar a consulta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {waitingCalls.map((call) => (
                <div
                  key={call.id}
                  className="flex items-center justify-between rounded-lg border p-4 bg-yellow-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                      <User className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {call.patient?.socialName || call.patient?.fullName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Agendado: {format(parseISO(call.scheduledAt), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => router.push(`/telemedicina/${call.id}`)}>
                    <Play className="mr-2 h-4 w-4" />
                    Iniciar Consulta
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="today" className="space-y-4">
        <TabsList>
          <TabsTrigger value="today">
            Hoje
            {scheduledToday.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {scheduledToday.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="upcoming">Proximas</TabsTrigger>
          <TabsTrigger value="history">Historico</TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          <Card>
            <CardHeader>
              <CardTitle>Consultas de Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingToday ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-4 p-4 border rounded-lg">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : scheduledToday.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Calendar className="mx-auto h-12 w-12 opacity-50" />
                  <p className="mt-4">Nenhuma consulta agendada para hoje</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scheduledToday.map((call) => (
                    <VideoCallCard key={call.id} call={call} onClick={() => router.push(`/telemedicina/${call.id}`)} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Proximas Consultas</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingUpcoming ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-4 p-4 border rounded-lg">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : upcomingCalls?.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Calendar className="mx-auto h-12 w-12 opacity-50" />
                  <p className="mt-4">Nenhuma consulta agendada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingCalls?.map((call) => (
                    <VideoCallCard
                      key={call.id}
                      call={call}
                      showDate
                      onClick={() => router.push(`/telemedicina/${call.id}`)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historico de Consultas</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-4 p-4 border rounded-lg">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : historyCalls?.data.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Video className="mx-auto h-12 w-12 opacity-50" />
                  <p className="mt-4">Nenhum historico de consultas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyCalls?.data.map((call) => (
                    <VideoCallCard
                      key={call.id}
                      call={call}
                      showDate
                      onClick={() => router.push(`/telemedicina/${call.id}`)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function VideoCallCard({
  call,
  showDate = false,
  onClick,
}: {
  call: VideoCall;
  showDate?: boolean;
  onClick: () => void;
}) {
  const isUpcoming = call.status === VideoCallStatus.SCHEDULED;
  const isCompleted = call.status === VideoCallStatus.COMPLETED;

  return (
    <div
      className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <User className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">
              {call.patient?.socialName || call.patient?.fullName}
            </p>
            <Badge className={getVideoCallStatusColor(call.status)}>
              {getVideoCallStatusLabel(call.status)}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {showDate && (
              <span>
                {format(parseISO(call.scheduledAt), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            )}
            <span>{format(parseISO(call.scheduledAt), 'HH:mm')}</span>
            <span>-</span>
            <span>{formatDuration(call.scheduledDuration)}</span>
            {isCompleted && call.actualDuration && (
              <>
                <span>|</span>
                <span>Duracao real: {formatDuration(call.actualDuration)}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {call.isRecorded && (
          <Badge variant="outline" className="text-purple-600 border-purple-600">
            Gravada
          </Badge>
        )}
        {isUpcoming && (
          <Button variant="outline" size="sm">
            <Eye className="mr-2 h-4 w-4" />
            Detalhes
          </Button>
        )}
        {isCompleted && (
          <Button variant="outline" size="sm">
            <Eye className="mr-2 h-4 w-4" />
            Ver Resumo
          </Button>
        )}
      </div>
    </div>
  );
}
