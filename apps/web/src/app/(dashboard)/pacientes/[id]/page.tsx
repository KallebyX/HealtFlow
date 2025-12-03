// ============================================================
// PATIENT DETAILS PAGE
// Página de detalhes do paciente com tabs
// ============================================================

'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit,
  Calendar,
  FileText,
  Pill,
  TestTubes,
  Heart,
  Phone,
  Mail,
  MapPin,
  User,
  AlertCircle,
  Trophy,
  Activity,
} from 'lucide-react';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Avatar,
  AvatarFallback,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Skeleton,
  Separator,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui';
import { patientsApi } from '@/lib/api/patients';
import {
  getGenderLabel,
  getBloodTypeLabel,
  getMaritalStatusLabel,
} from '@/types/patient';
import {
  formatDate,
  formatPhone,
  formatCPF,
  getInitials,
  calculateAge,
} from '@/lib/utils';

export default function PatientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const {
    data: patient,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientsApi.getById(patientId),
    enabled: !!patientId,
  });

  if (isLoading) {
    return <PatientDetailsSkeleton />;
  }

  if (isError || !patient) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-10">
              <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
              <h2 className="mt-4 text-lg font-semibold">Paciente nao encontrado</h2>
              <p className="mt-2 text-muted-foreground">
                O paciente solicitado nao existe ou foi removido.
              </p>
              <Button asChild className="mt-4">
                <Link href="/pacientes">Ver todos os pacientes</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = patient.socialName || patient.fullName;
  const age = calculateAge(patient.birthDate);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/pacientes">Pacientes</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{displayName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{displayName}</h1>
                {patient.socialName && (
                  <p className="text-muted-foreground">Nome civil: {patient.fullName}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="secondary">{age} anos</Badge>
                  <Badge variant="secondary">{getGenderLabel(patient.gender)}</Badge>
                  {patient.bloodType && (
                    <Badge variant="secondary">{getBloodTypeLabel(patient.bloodType)}</Badge>
                  )}
                  <Badge
                    variant={patient.user?.status === 'ACTIVE' ? 'success' : 'secondary'}
                  >
                    {patient.user?.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {formatPhone(patient.phone)}
                  </span>
                  {patient.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {patient.email}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/pacientes/${patient.id}/editar`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </Button>
              <Button asChild>
                <Link href={`/agenda/novo?paciente=${patient.id}`}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Agendar
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patient._count?.consultations || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prescricoes</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patient._count?.prescriptions || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nivel</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Nv. {patient.level} - {patient.levelName}
            </div>
            <p className="text-xs text-muted-foreground">{patient.totalPoints} pontos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Streak</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patient.currentStreak} dias</div>
            <p className="text-xs text-muted-foreground">
              Recorde: {patient.longestStreak} dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Informacoes</TabsTrigger>
          <TabsTrigger value="medical">Historico Medico</TabsTrigger>
          <TabsTrigger value="appointments">Consultas</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescricoes</TabsTrigger>
          <TabsTrigger value="exams">Exames</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Personal Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Dados Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Nome Completo" value={patient.fullName} />
                {patient.socialName && (
                  <InfoRow label="Nome Social" value={patient.socialName} />
                )}
                <InfoRow label="CPF" value={formatCPF(patient.cpf)} />
                {patient.rg && (
                  <InfoRow
                    label="RG"
                    value={`${patient.rg}${patient.rgIssuer ? ` - ${patient.rgIssuer}` : ''}`}
                  />
                )}
                <InfoRow
                  label="Data de Nascimento"
                  value={`${formatDate(new Date(patient.birthDate))} (${age} anos)`}
                />
                <InfoRow label="Genero" value={getGenderLabel(patient.gender)} />
                {patient.maritalStatus && (
                  <InfoRow
                    label="Estado Civil"
                    value={getMaritalStatusLabel(patient.maritalStatus)}
                  />
                )}
                {patient.occupation && (
                  <InfoRow label="Profissao" value={patient.occupation} />
                )}
                {patient.motherName && (
                  <InfoRow label="Nome da Mae" value={patient.motherName} />
                )}
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Telefone Principal" value={formatPhone(patient.phone)} />
                {patient.secondaryPhone && (
                  <InfoRow
                    label="Telefone Secundario"
                    value={formatPhone(patient.secondaryPhone)}
                  />
                )}
                {patient.email && <InfoRow label="Email" value={patient.email} />}
                {patient.address && (
                  <>
                    <Separator className="my-4" />
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Endereco</p>
                        <p className="text-sm text-muted-foreground">
                          {patient.address.street}, {patient.address.number}
                          {patient.address.complement && ` - ${patient.address.complement}`}
                          <br />
                          {patient.address.neighborhood} - {patient.address.city}/{patient.address.state}
                          <br />
                          CEP: {patient.address.zipCode}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Health Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Informacoes de Saude
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {patient.bloodType && (
                  <InfoRow label="Tipo Sanguineo" value={getBloodTypeLabel(patient.bloodType)} />
                )}
                {patient.cns && <InfoRow label="CNS" value={patient.cns} />}
                {patient.height && <InfoRow label="Altura" value={`${patient.height} cm`} />}
                {patient.weight && <InfoRow label="Peso" value={`${patient.weight} kg`} />}
                {patient.allergies && patient.allergies.length > 0 && (
                  <div>
                    <p className="text-sm font-medium">Alergias</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {patient.allergies.map((allergy, i) => (
                        <Badge key={i} variant="destructive">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {patient.chronicConditions && patient.chronicConditions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium">Condicoes Cronicas</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {patient.chronicConditions.map((condition, i) => (
                        <Badge key={i} variant="warning">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            {patient.emergencyContact && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Contato de Emergencia
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow label="Nome" value={patient.emergencyContact.name} />
                  <InfoRow label="Parentesco" value={patient.emergencyContact.relationship} />
                  <InfoRow
                    label="Telefone"
                    value={formatPhone(patient.emergencyContact.phone)}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Medical History Tab */}
        <TabsContent value="medical">
          <Card>
            <CardHeader>
              <CardTitle>Historico Medico</CardTitle>
              <CardDescription>Historico de consultas, diagnosticos e tratamentos</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-10">
                Historico medico sera implementado em breve.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <CardTitle>Consultas</CardTitle>
              <CardDescription>Historico de consultas do paciente</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-10">
                Lista de consultas sera implementada em breve.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prescriptions Tab */}
        <TabsContent value="prescriptions">
          <Card>
            <CardHeader>
              <CardTitle>Prescricoes</CardTitle>
              <CardDescription>Receituarios emitidos para o paciente</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-10">
                Lista de prescricoes sera implementada em breve.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exams Tab */}
        <TabsContent value="exams">
          <Card>
            <CardHeader>
              <CardTitle>Exames</CardTitle>
              <CardDescription>Resultados de exames laboratoriais</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-10">
                Lista de exames sera implementada em breve.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documentos</CardTitle>
              <CardDescription>Documentos e anexos do paciente</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-10">
                Gerenciamento de documentos sera implementado em breve.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function PatientDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-48" />
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
