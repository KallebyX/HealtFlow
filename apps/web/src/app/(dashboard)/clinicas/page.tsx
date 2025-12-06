'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Building2,
  MapPin,
  Phone,
  Mail,
  Users,
  Stethoscope,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Settings,
  Calendar,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { clinicsApi } from '@/lib/api/clinics';
import {
  Clinic,
  getClinicStatusLabel,
  getClinicStatusColor,
} from '@/types/clinic';

export default function ClinicasPage() {
  const router = useRouter();
  const [search, setSearch] = React.useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['clinics', search],
    queryFn: () => clinicsApi.list({ search, limit: 50 }),
  });

  const clinics = data?.data ?? [];

  // Stats
  const totalClinics = data?.total ?? 0;
  const activeClinics = clinics.filter((c) => c.status === 'ACTIVE').length;
  const totalDoctors = clinics.reduce((acc, c) => acc + (c.totalDoctors ?? 0), 0);
  const totalPatients = clinics.reduce((acc, c) => acc + (c.totalPatients ?? 0), 0);

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Clinicas' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clinicas</h1>
          <p className="text-muted-foreground">
            Gerencie as clinicas cadastradas no sistema
          </p>
        </div>
        <Button onClick={() => router.push('/clinicas/nova')}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Clinica
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Clinicas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : totalClinics}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeClinics} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Medicos</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : totalDoctors}
            </div>
            <p className="text-xs text-muted-foreground">
              profissionais cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pacientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : totalPatients}
            </div>
            <p className="text-xs text-muted-foreground">
              pacientes atendidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Consultas/Mes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> :
                clinics.reduce((acc, c) => acc + (c.totalAppointmentsMonth ?? 0), 0)
              }
            </div>
            <p className="text-xs text-muted-foreground">
              este mes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Buscar por nome, CNPJ ou cidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
            <Button variant="outline" onClick={() => refetch()}>
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Clinics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : clinics.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium">Nenhuma clinica encontrada</p>
              <p className="text-muted-foreground">
                Cadastre a primeira clinica para comecar
              </p>
              <Button className="mt-4" onClick={() => router.push('/clinicas/nova')}>
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar Clinica
              </Button>
            </CardContent>
          </Card>
        ) : (
          clinics.map((clinic) => (
            <ClinicCard key={clinic.id} clinic={clinic} />
          ))
        )}
      </div>
    </div>
  );
}

function ClinicCard({ clinic }: { clinic: Clinic }) {
  const router = useRouter();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            {clinic.logoUrl ? (
              <img
                src={clinic.logoUrl}
                alt={clinic.name}
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <Building2 className="h-6 w-6 text-primary" />
            )}
          </div>
          <div>
            <CardTitle className="text-base">{clinic.tradeName || clinic.name}</CardTitle>
            <CardDescription>{clinic.cnpj}</CardDescription>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acoes</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(`/clinicas/${clinic.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/clinicas/${clinic.id}/editar`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/clinicas/${clinic.id}/configuracoes`)}>
              <Settings className="mr-2 h-4 w-4" />
              Configuracoes
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-3">
        <Badge className={getClinicStatusColor(clinic.status)}>
          {getClinicStatusLabel(clinic.status)}
        </Badge>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{clinic.city}, {clinic.state}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{clinic.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="truncate">{clinic.email}</span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-lg font-bold">{clinic.totalDoctors ?? 0}</p>
              <p className="text-xs text-muted-foreground">Medicos</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{clinic.totalPatients ?? 0}</p>
              <p className="text-xs text-muted-foreground">Pacientes</p>
            </div>
          </div>
          {clinic.averageRating && (
            <div className="flex items-center gap-1">
              <span className="text-yellow-500">★</span>
              <span className="font-medium">{clinic.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {clinic.specialties && clinic.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1 border-t pt-3">
            {clinic.specialties.slice(0, 3).map((spec) => (
              <Badge key={spec} variant="secondary" className="text-xs">
                {spec}
              </Badge>
            ))}
            {clinic.specialties.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{clinic.specialties.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
