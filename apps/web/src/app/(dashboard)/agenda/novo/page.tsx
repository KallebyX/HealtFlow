'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Building2,
  Video,
  Loader2,
  Search,
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { appointmentsApi } from '@/lib/api/appointments';
import { patientsApi } from '@/lib/api/patients';
import { doctorsApi } from '@/lib/api/doctors';
import { AppointmentType, getAppointmentTypeLabel } from '@/types/appointment';

const createAppointmentSchema = z.object({
  patientId: z.string().min(1, 'Selecione um paciente'),
  doctorId: z.string().min(1, 'Selecione um medico'),
  clinicId: z.string().optional(),
  scheduledDate: z.string().min(1, 'Selecione uma data'),
  scheduledTime: z.string().min(1, 'Selecione um horario'),
  duration: z.number().min(10).max(240).optional(),
  type: z.nativeEnum(AppointmentType),
  reason: z.string().optional(),
  symptoms: z.string().optional(),
  notes: z.string().optional(),
  isTelemedicine: z.boolean().optional(),
  healthInsuranceId: z.string().optional(),
});

type CreateAppointmentForm = z.infer<typeof createAppointmentSchema>;

export default function NovoAgendamentoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId');
  const preselectedDoctorId = searchParams.get('doctorId');

  const [error, setError] = React.useState<string | null>(null);
  const [patientSearch, setPatientSearch] = React.useState('');
  const [doctorSearch, setDoctorSearch] = React.useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateAppointmentForm>({
    resolver: zodResolver(createAppointmentSchema),
    defaultValues: {
      patientId: preselectedPatientId || '',
      doctorId: preselectedDoctorId || '',
      scheduledDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      type: AppointmentType.CONSULTATION,
      duration: 30,
      isTelemedicine: false,
    },
  });

  const selectedDoctorId = watch('doctorId');
  const selectedDate = watch('scheduledDate');
  const isTelemedicine = watch('isTelemedicine');

  // Fetch patients
  const { data: patientsData, isLoading: loadingPatients } = useQuery({
    queryKey: ['patients-search', patientSearch],
    queryFn: () => patientsApi.list({ search: patientSearch, limit: 20 }),
    enabled: patientSearch.length >= 2 || !!preselectedPatientId,
  });

  // Fetch doctors
  const { data: doctorsData, isLoading: loadingDoctors } = useQuery({
    queryKey: ['doctors-search', doctorSearch],
    queryFn: () => doctorsApi.list({ search: doctorSearch, limit: 20 }),
    enabled: doctorSearch.length >= 2 || !!preselectedDoctorId,
  });

  // Fetch selected patient details
  const { data: selectedPatient } = useQuery({
    queryKey: ['patient', watch('patientId')],
    queryFn: () => patientsApi.getById(watch('patientId')),
    enabled: !!watch('patientId'),
  });

  // Fetch selected doctor details
  const { data: selectedDoctor } = useQuery({
    queryKey: ['doctor', selectedDoctorId],
    queryFn: () => doctorsApi.getById(selectedDoctorId),
    enabled: !!selectedDoctorId,
  });

  // Fetch available slots
  const { data: availableSlots, isLoading: loadingSlots } = useQuery({
    queryKey: ['available-slots', selectedDoctorId, selectedDate],
    queryFn: () =>
      doctorsApi.getAvailableSlots(
        selectedDoctorId,
        selectedDate,
        selectedDate
      ),
    enabled: !!selectedDoctorId && !!selectedDate,
  });

  const patients = patientsData?.data ?? [];
  const doctors = doctorsData?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (data: CreateAppointmentForm) => appointmentsApi.create(data),
    onSuccess: (appointment) => {
      router.push(`/agenda/${appointment.id}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erro ao criar agendamento');
    },
  });

  const onSubmit = (data: CreateAppointmentForm) => {
    setError(null);
    createMutation.mutate(data);
  };

  // Generate time slots if no API slots available
  const timeSlots = React.useMemo(() => {
    if (availableSlots?.slots) {
      return availableSlots.slots.filter((s) => s.available);
    }
    // Generate default slots from 7:00 to 18:00
    const slots = [];
    for (let h = 7; h < 18; h++) {
      for (let m = 0; m < 60; m += 30) {
        slots.push({
          time: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
          available: true,
        });
      }
    }
    return slots;
  }, [availableSlots]);

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Agenda', href: '/agenda' },
          { label: 'Novo Agendamento' },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Novo Agendamento</h1>
          <p className="text-muted-foreground">
            Agende uma nova consulta ou procedimento
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/agenda')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Patient Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Paciente
              </CardTitle>
              <CardDescription>
                Selecione o paciente para o agendamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar paciente por nome ou CPF..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {loadingPatients ? (
                <Skeleton className="h-20" />
              ) : patientSearch.length >= 2 && patients.length > 0 ? (
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {patients.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => {
                        setValue('patientId', patient.id);
                        setPatientSearch('');
                      }}
                      className={`w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors ${
                        watch('patientId') === patient.id ? 'border-primary bg-primary/5' : ''
                      }`}
                    >
                      <p className="font-medium">
                        {patient.socialName || patient.fullName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        CPF: {patient.cpf} | Tel: {patient.phone}
                      </p>
                    </button>
                  ))}
                </div>
              ) : null}

              {selectedPatient && (
                <div className="rounded-lg border border-primary bg-primary/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {selectedPatient.socialName || selectedPatient.fullName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedPatient.phone}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {errors.patientId && (
                <p className="text-sm text-destructive">{errors.patientId.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Doctor Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Medico
              </CardTitle>
              <CardDescription>
                Selecione o medico para o atendimento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar medico por nome ou CRM..."
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {loadingDoctors ? (
                <Skeleton className="h-20" />
              ) : doctorSearch.length >= 2 && doctors.length > 0 ? (
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {doctors.map((doctor) => (
                    <button
                      key={doctor.id}
                      type="button"
                      onClick={() => {
                        setValue('doctorId', doctor.id);
                        setDoctorSearch('');
                      }}
                      className={`w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors ${
                        watch('doctorId') === doctor.id ? 'border-primary bg-primary/5' : ''
                      }`}
                    >
                      <p className="font-medium">
                        Dr(a). {doctor.socialName || doctor.fullName}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>
                          CRM {doctor.crm}/{doctor.crmState}
                        </span>
                        {doctor.telemedicineEnabled && (
                          <Badge variant="outline" className="text-xs">
                            <Video className="mr-1 h-3 w-3" />
                            Telemedicina
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}

              {selectedDoctor && (
                <div className="rounded-lg border border-primary bg-primary/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Stethoscope className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        Dr(a). {selectedDoctor.socialName || selectedDoctor.fullName}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedDoctor.specialties.slice(0, 2).map((spec) => (
                          <Badge key={spec} variant="secondary" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {errors.doctorId && (
                <p className="text-sm text-destructive">{errors.doctorId.message}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Date and Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Data e Horario
            </CardTitle>
            <CardDescription>
              Escolha a data e horario do agendamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Data *</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  min={format(new Date(), 'yyyy-MM-dd')}
                  {...register('scheduledDate')}
                />
                {errors.scheduledDate && (
                  <p className="text-sm text-destructive">
                    {errors.scheduledDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duracao (minutos)</Label>
                <Select
                  defaultValue="30"
                  onValueChange={(value) => setValue('duration', parseInt(value, 10))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="45">45 minutos</SelectItem>
                    <SelectItem value="60">60 minutos</SelectItem>
                    <SelectItem value="90">90 minutos</SelectItem>
                    <SelectItem value="120">120 minutos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedDoctorId && selectedDate && (
              <div className="space-y-2">
                <Label>Horario Disponivel *</Label>
                {loadingSlots ? (
                  <div className="flex gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-16" />
                    ))}
                  </div>
                ) : timeSlots.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => setValue('scheduledTime', slot.time)}
                        className={`px-3 py-2 rounded-md border text-sm transition-colors ${
                          watch('scheduledTime') === slot.time
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <Clock className="inline-block h-3 w-3 mr-1" />
                        {slot.time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhum horario disponivel nesta data
                  </p>
                )}
                {errors.scheduledTime && (
                  <p className="text-sm text-destructive">
                    {errors.scheduledTime.message}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appointment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Agendamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Atendimento *</Label>
                <Select
                  defaultValue={AppointmentType.CONSULTATION}
                  onValueChange={(value) =>
                    setValue('type', value as AppointmentType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(AppointmentType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {getAppointmentTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="isTelemedicine"
                  checked={isTelemedicine}
                  onCheckedChange={(checked) =>
                    setValue('isTelemedicine', checked as boolean)
                  }
                  disabled={
                    selectedDoctor ? !selectedDoctor.telemedicineEnabled : false
                  }
                />
                <Label htmlFor="isTelemedicine" className="cursor-pointer">
                  <Video className="inline-block h-4 w-4 mr-1" />
                  Consulta por Telemedicina
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motivo da Consulta</Label>
              <Input
                id="reason"
                placeholder="Ex: Dor de cabeca, Check-up anual..."
                {...register('reason')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="symptoms">Sintomas</Label>
              <Textarea
                id="symptoms"
                placeholder="Descreva os sintomas do paciente..."
                rows={3}
                {...register('symptoms')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observacoes</Label>
              <Textarea
                id="notes"
                placeholder="Observacoes adicionais..."
                rows={2}
                {...register('notes')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/agenda')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <Calendar className="mr-2 h-4 w-4" />
            Agendar
          </Button>
        </div>
      </form>
    </div>
  );
}
