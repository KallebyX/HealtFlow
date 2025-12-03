'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  UserRound,
  Phone,
  Mail,
  Calendar,
  Stethoscope,
  Video,
  Clock,
  Building2,
  FileText,
  CalendarDays,
  ClipboardList,
  Pencil,
  ArrowLeft,
  BadgeCheck,
  Shield,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { doctorsApi } from '@/lib/api/doctors';
import {
  formatCRM,
  getCrmStatusLabel,
  getCrmStatusColor,
  getDayOfWeekLabel,
} from '@/types/doctor';
import { getGenderLabel } from '@/types/patient';

export default function DoctorDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const doctorId = params.id as string;

  const { data: doctor, isLoading } = useQuery({
    queryKey: ['doctor', doctorId],
    queryFn: () => doctorsApi.getById(doctorId),
    enabled: !!doctorId,
  });

  const { data: stats } = useQuery({
    queryKey: ['doctor-stats', doctorId],
    queryFn: () => doctorsApi.getStats(doctorId),
    enabled: !!doctorId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <UserRound className="h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold">Medico nao encontrado</h2>
        <p className="text-muted-foreground">
          O medico solicitado nao foi encontrado no sistema.
        </p>
        <Button className="mt-4" onClick={() => router.push('/medicos')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para lista
        </Button>
      </div>
    );
  }

  const birthDate = new Date(doctor.birthDate);
  const age = Math.floor(
    (Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Medicos', href: '/medicos' },
          { label: doctor.socialName || doctor.fullName },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            {doctor.profilePhotoUrl ? (
              <img
                src={doctor.profilePhotoUrl}
                alt={doctor.fullName}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <UserRound className="h-8 w-8 text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Dr(a). {doctor.socialName || doctor.fullName}
            </h1>
            <p className="text-muted-foreground">
              {formatCRM(doctor.crm, doctor.crmState)}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge className={getCrmStatusColor(doctor.crmStatus)}>
                {getCrmStatusLabel(doctor.crmStatus)}
              </Badge>
              {doctor.telemedicineEnabled && (
                <Badge variant="default" className="bg-green-600">
                  <Video className="mr-1 h-3 w-3" />
                  Telemedicina
                </Badge>
              )}
              {doctor.digitalCertificate?.active && (
                <Badge variant="default" className="bg-blue-600">
                  <Shield className="mr-1 h-3 w-3" />
                  Certificado Digital
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/medicos')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button onClick={() => router.push(`/medicos/${doctor.id}/editar`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Consultas</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.completedConsultations ?? doctor._count?.consultations ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">consultas realizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalAppointments ?? doctor._count?.appointments ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">agendamentos totais</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Prescricoes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.prescriptionsIssued ?? doctor._count?.prescriptions ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">prescricoes emitidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pacientes</CardTitle>
            <UserRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.patientsSeen ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.newPatients ?? 0} novos este mes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Informacoes</TabsTrigger>
          <TabsTrigger value="schedule">Horarios</TabsTrigger>
          <TabsTrigger value="clinics">Clinicas</TabsTrigger>
          <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
          <TabsTrigger value="stats">Estatisticas</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Personal Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserRound className="h-5 w-5" />
                  Dados Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome Completo</p>
                    <p className="font-medium">{doctor.fullName}</p>
                  </div>
                  {doctor.socialName && (
                    <div>
                      <p className="text-sm text-muted-foreground">Nome Social</p>
                      <p className="font-medium">{doctor.socialName}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">CPF</p>
                    <p className="font-medium">{doctor.cpf}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                    <p className="font-medium">
                      {birthDate.toLocaleDateString('pt-BR')} ({age} anos)
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Genero</p>
                    <p className="font-medium">{getGenderLabel(doctor.gender)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {doctor.phone}
                    </p>
                  </div>
                </div>
                {doctor.user?.email && (
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {doctor.user.email}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Professional Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Dados Profissionais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">CRM</p>
                    <p className="font-medium">{formatCRM(doctor.crm, doctor.crmState)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status CRM</p>
                    <Badge className={getCrmStatusColor(doctor.crmStatus)}>
                      {getCrmStatusLabel(doctor.crmStatus)}
                    </Badge>
                  </div>
                  {doctor.cns && (
                    <div>
                      <p className="text-sm text-muted-foreground">CNS</p>
                      <p className="font-medium">{doctor.cns}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Duracao Consulta</p>
                    <p className="font-medium">{doctor.appointmentDuration} min</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Especialidades</p>
                  <div className="flex flex-wrap gap-2">
                    {doctor.specialties.map((specialty) => (
                      <Badge key={specialty} variant="secondary">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>

                {doctor.subspecialties && doctor.subspecialties.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Subespecialidades</p>
                    <div className="flex flex-wrap gap-2">
                      {doctor.subspecialties.map((sub) => (
                        <Badge key={sub} variant="outline">
                          {sub}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {doctor.rqe && doctor.rqe.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">RQE</p>
                    <div className="flex flex-wrap gap-2">
                      {doctor.rqe.map((rqe, index) => (
                        <Badge key={index} variant="outline">
                          {rqe}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bio */}
            {doctor.bio && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Biografia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {doctor.bio}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Digital Certificate */}
            {doctor.digitalCertificate && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BadgeCheck className="h-5 w-5" />
                    Certificado Digital
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo</p>
                      <p className="font-medium">{doctor.digitalCertificate.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Emissor</p>
                      <p className="font-medium">{doctor.digitalCertificate.issuer}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Valido desde</p>
                      <p className="font-medium">
                        {new Date(doctor.digitalCertificate.validFrom).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Valido ate</p>
                      <p className="font-medium">
                        {new Date(doctor.digitalCertificate.validUntil).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <Badge variant={doctor.digitalCertificate.active ? 'default' : 'destructive'}>
                    {doctor.digitalCertificate.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horarios de Atendimento
              </CardTitle>
              <CardDescription>
                Configuracao dos horarios de trabalho do medico
              </CardDescription>
            </CardHeader>
            <CardContent>
              {doctor.workingHours && doctor.workingHours.length > 0 ? (
                <div className="space-y-3">
                  {doctor.workingHours
                    .filter((wh) => wh.active)
                    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                    .map((wh, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="font-medium">
                          {getDayOfWeekLabel(wh.dayOfWeek)}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span>
                            {wh.startTime} - {wh.endTime}
                          </span>
                          {wh.breakStart && wh.breakEnd && (
                            <span className="text-muted-foreground">
                              (Intervalo: {wh.breakStart} - {wh.breakEnd})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Clock className="mx-auto h-12 w-12 opacity-50" />
                  <p className="mt-2">Nenhum horario configurado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clinics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Clinicas Vinculadas
              </CardTitle>
              <CardDescription>
                Clinicas onde o medico atende
              </CardDescription>
            </CardHeader>
            <CardContent>
              {doctor.clinics && doctor.clinics.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {doctor.clinics.map((clinic) => (
                    <div
                      key={clinic.id}
                      className="flex items-center gap-3 rounded-lg border p-4"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                        {clinic.logoUrl ? (
                          <img
                            src={clinic.logoUrl}
                            alt={clinic.tradeName}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{clinic.tradeName}</p>
                        <Button
                          variant="link"
                          className="h-auto p-0 text-sm"
                          onClick={() => router.push(`/clinicas/${clinic.id}`)}
                        >
                          Ver detalhes
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Building2 className="mx-auto h-12 w-12 opacity-50" />
                  <p className="mt-2">Nenhuma clinica vinculada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Agendamentos
              </CardTitle>
              <CardDescription>
                Historico e proximos agendamentos do medico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center text-muted-foreground">
                <Calendar className="mx-auto h-12 w-12 opacity-50" />
                <p className="mt-2">Funcionalidade em desenvolvimento</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push('/agenda')}
                >
                  Ir para Agenda
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Consultas Realizadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.completedConsultations ?? 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Cancelamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.cancelledAppointments ?? 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  No-Shows
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.noShowAppointments ?? 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Telemedicina
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.telemedicineConsultations ?? 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Tempo Medio de Consulta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.averageConsultationDuration ?? 0} min
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Pacientes Retornantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.returningPatients ?? 0}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Graficos de Desempenho</CardTitle>
              <CardDescription>
                Analise detalhada do desempenho do medico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center text-muted-foreground">
                <Stethoscope className="mx-auto h-12 w-12 opacity-50" />
                <p className="mt-2">Graficos em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
