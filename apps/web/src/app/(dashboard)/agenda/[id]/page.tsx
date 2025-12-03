'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Building2,
  Video,
  Phone,
  Mail,
  FileText,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  PlayCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { appointmentsApi } from '@/lib/api/appointments';
import {
  AppointmentStatus,
  getAppointmentStatusLabel,
  getAppointmentStatusColor,
  getAppointmentTypeLabel,
  getAppointmentTypeColor,
  isAppointmentCancellable,
  isAppointmentEditable,
} from '@/types/appointment';

export default function AppointmentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const appointmentId = params.id as string;

  const [showCancelDialog, setShowCancelDialog] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const { data: appointment, isLoading } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => appointmentsApi.getById(appointmentId),
    enabled: !!appointmentId,
  });

  const confirmMutation = useMutation({
    mutationFn: () => appointmentsApi.confirm(appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erro ao confirmar agendamento');
    },
  });

  const checkInMutation = useMutation({
    mutationFn: () => appointmentsApi.checkIn(appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erro ao fazer check-in');
    },
  });

  const startMutation = useMutation({
    mutationFn: () => appointmentsApi.start(appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erro ao iniciar atendimento');
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => appointmentsApi.complete(appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erro ao finalizar atendimento');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => appointmentsApi.cancel(appointmentId, { reason: cancelReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] });
      setShowCancelDialog(false);
      setCancelReason('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erro ao cancelar agendamento');
    },
  });

  const noShowMutation = useMutation({
    mutationFn: () => appointmentsApi.noShow(appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erro ao marcar como no-show');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Calendar className="h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold">Agendamento nao encontrado</h2>
        <p className="text-muted-foreground">
          O agendamento solicitado nao foi encontrado no sistema.
        </p>
        <Button className="mt-4" onClick={() => router.push('/agenda')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para agenda
        </Button>
      </div>
    );
  }

  const scheduledDateTime = parseISO(
    `${appointment.scheduledDate}T${appointment.scheduledTime}`
  );

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Agenda', href: '/agenda' },
          { label: 'Detalhes do Agendamento' },
        ]}
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Agendamento #{appointment.id.slice(-6).toUpperCase()}
            </h1>
            <Badge className={getAppointmentStatusColor(appointment.status)}>
              {getAppointmentStatusLabel(appointment.status)}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {format(scheduledDateTime, "EEEE, dd 'de' MMMM 'de' yyyy 'as' HH:mm", {
              locale: ptBR,
            })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => router.push('/agenda')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          {isAppointmentEditable(appointment.status) && (
            <Button
              variant="outline"
              onClick={() => router.push(`/agenda/${appointment.id}/editar`)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          )}
        </div>
      </div>

      {/* Action Buttons based on status */}
      {appointment.status !== AppointmentStatus.COMPLETED &&
        appointment.status !== AppointmentStatus.CANCELLED &&
        appointment.status !== AppointmentStatus.NO_SHOW && (
          <Card>
            <CardHeader>
              <CardTitle>Acoes</CardTitle>
              <CardDescription>Gerencie o status do agendamento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {appointment.status === AppointmentStatus.SCHEDULED && (
                  <Button
                    onClick={() => confirmMutation.mutate()}
                    disabled={confirmMutation.isPending}
                  >
                    {confirmMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Confirmar
                  </Button>
                )}

                {(appointment.status === AppointmentStatus.SCHEDULED ||
                  appointment.status === AppointmentStatus.CONFIRMED) && (
                  <Button
                    variant="secondary"
                    onClick={() => checkInMutation.mutate()}
                    disabled={checkInMutation.isPending}
                  >
                    {checkInMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <User className="mr-2 h-4 w-4" />
                    )}
                    Check-in
                  </Button>
                )}

                {appointment.status === AppointmentStatus.WAITING && (
                  <Button
                    onClick={() => startMutation.mutate()}
                    disabled={startMutation.isPending}
                  >
                    {startMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <PlayCircle className="mr-2 h-4 w-4" />
                    )}
                    Iniciar Atendimento
                  </Button>
                )}

                {appointment.status === AppointmentStatus.IN_PROGRESS && (
                  <Button
                    onClick={() => completeMutation.mutate()}
                    disabled={completeMutation.isPending}
                  >
                    {completeMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Finalizar
                  </Button>
                )}

                {isAppointmentCancellable(appointment.status) && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => noShowMutation.mutate()}
                      disabled={noShowMutation.isPending}
                    >
                      {noShowMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <AlertCircle className="mr-2 h-4 w-4" />
                      )}
                      No-Show
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setShowCancelDialog(true)}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancelar
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Details Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Appointment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Dados do Agendamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Data</p>
                <p className="font-medium">
                  {format(scheduledDateTime, "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Horario</p>
                <p className="font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {appointment.scheduledTime}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duracao</p>
                <p className="font-medium">{appointment.duration} minutos</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo</p>
                <Badge className={getAppointmentTypeColor(appointment.type)}>
                  {getAppointmentTypeLabel(appointment.type)}
                </Badge>
              </div>
            </div>

            {appointment.isTelemedicine && (
              <div className="rounded-lg bg-cyan-50 p-3">
                <div className="flex items-center gap-2 text-cyan-800">
                  <Video className="h-4 w-4" />
                  <span className="font-medium">Telemedicina</span>
                </div>
                {appointment.telemedicineLink && (
                  <Button
                    variant="link"
                    className="mt-2 h-auto p-0 text-cyan-700"
                    onClick={() =>
                      window.open(appointment.telemedicineLink, '_blank')
                    }
                  >
                    Acessar sala de consulta
                  </Button>
                )}
              </div>
            )}

            {appointment.reason && (
              <div>
                <p className="text-sm text-muted-foreground">Motivo</p>
                <p className="font-medium">{appointment.reason}</p>
              </div>
            )}

            {appointment.symptoms && (
              <div>
                <p className="text-sm text-muted-foreground">Sintomas</p>
                <p className="font-medium">{appointment.symptoms}</p>
              </div>
            )}

            {appointment.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Observacoes</p>
                <p className="whitespace-pre-wrap">{appointment.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Patient Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Paciente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {appointment.patient ? (
              <>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    {appointment.patient.profilePhotoUrl ? (
                      <img
                        src={appointment.patient.profilePhotoUrl}
                        alt={appointment.patient.fullName}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {appointment.patient.socialName || appointment.patient.fullName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      CPF: {appointment.patient.cpf}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {appointment.patient.phone}
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/pacientes/${appointment.patientId}`)}
                >
                  Ver prontuario completo
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground">Paciente nao encontrado</p>
            )}
          </CardContent>
        </Card>

        {/* Doctor Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Medico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {appointment.doctor ? (
              <>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    {appointment.doctor.profilePhotoUrl ? (
                      <img
                        src={appointment.doctor.profilePhotoUrl}
                        alt={appointment.doctor.fullName}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <Stethoscope className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      Dr(a). {appointment.doctor.socialName || appointment.doctor.fullName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      CRM {appointment.doctor.crm}/{appointment.doctor.crmState}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {appointment.doctor.specialties.map((specialty) => (
                    <Badge key={specialty} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/medicos/${appointment.doctorId}`)}
                >
                  Ver perfil do medico
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground">Medico nao encontrado</p>
            )}
          </CardContent>
        </Card>

        {/* Clinic Info */}
        {appointment.clinic && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Clinica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                  {appointment.clinic.logoUrl ? (
                    <img
                      src={appointment.clinic.logoUrl}
                      alt={appointment.clinic.tradeName}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{appointment.clinic.tradeName}</p>
                  {appointment.clinic.phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {appointment.clinic.phone}
                    </p>
                  )}
                </div>
              </div>

              {appointment.clinic.address && (
                <p className="text-sm text-muted-foreground">
                  {appointment.clinic.address}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Historico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <TimelineItem
                label="Criado"
                date={appointment.createdAt}
                icon={<Calendar className="h-4 w-4" />}
              />
              {appointment.confirmationSentAt && (
                <TimelineItem
                  label="Confirmacao enviada"
                  date={appointment.confirmationSentAt}
                  icon={<Mail className="h-4 w-4" />}
                />
              )}
              {appointment.reminderSentAt && (
                <TimelineItem
                  label="Lembrete enviado"
                  date={appointment.reminderSentAt}
                  icon={<Mail className="h-4 w-4" />}
                />
              )}
              {appointment.checkedInAt && (
                <TimelineItem
                  label="Check-in realizado"
                  date={appointment.checkedInAt}
                  icon={<User className="h-4 w-4" />}
                />
              )}
              {appointment.startedAt && (
                <TimelineItem
                  label="Atendimento iniciado"
                  date={appointment.startedAt}
                  icon={<PlayCircle className="h-4 w-4" />}
                />
              )}
              {appointment.completedAt && (
                <TimelineItem
                  label="Atendimento finalizado"
                  date={appointment.completedAt}
                  icon={<CheckCircle className="h-4 w-4" />}
                />
              )}
              {appointment.cancelledAt && (
                <TimelineItem
                  label={`Cancelado: ${appointment.cancellationReason || 'Sem motivo'}`}
                  date={appointment.cancelledAt}
                  icon={<XCircle className="h-4 w-4" />}
                  variant="destructive"
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Agendamento</DialogTitle>
            <DialogDescription>
              Informe o motivo do cancelamento. Esta acao nao pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cancelReason">Motivo do cancelamento *</Label>
              <Textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Informe o motivo..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate()}
              disabled={!cancelReason.trim() || cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TimelineItem({
  label,
  date,
  icon,
  variant = 'default',
}: {
  label: string;
  date: string;
  icon: React.ReactNode;
  variant?: 'default' | 'destructive';
}) {
  return (
    <div className="flex items-center gap-4">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full ${
          variant === 'destructive' ? 'bg-red-100 text-red-600' : 'bg-muted'
        }`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <p className={`font-medium ${variant === 'destructive' ? 'text-red-600' : ''}`}>
          {label}
        </p>
        <p className="text-sm text-muted-foreground">
          {format(parseISO(date), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
        </p>
      </div>
    </div>
  );
}
