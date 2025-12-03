'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  UserRound,
  Stethoscope,
  Video,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Phone,
  Mail,
  MapPin,
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
import { DataTable } from '@/components/data-table/data-table';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { doctorsApi } from '@/lib/api/doctors';
import type { Doctor } from '@/types/doctor';
import { formatCRM, getCrmStatusLabel, getCrmStatusColor } from '@/types/doctor';

export default function MedicosPage() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorsApi.list({ limit: 100 }),
  });

  const doctors = data?.data ?? [];

  // Stats
  const totalDoctors = data?.total ?? 0;
  const activeDoctors = doctors.filter((d) => !d.deletedAt).length;
  const telemedicineEnabled = doctors.filter((d) => d.telemedicineEnabled).length;
  const specialtiesCount = new Set(doctors.flatMap((d) => d.specialties)).size;

  const columns: ColumnDef<Doctor>[] = [
    {
      accessorKey: 'fullName',
      header: 'Medico',
      cell: ({ row }) => {
        const doctor = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              {doctor.profilePhotoUrl ? (
                <img
                  src={doctor.profilePhotoUrl}
                  alt={doctor.fullName}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <UserRound className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <p className="font-medium">{doctor.socialName || doctor.fullName}</p>
              <p className="text-sm text-muted-foreground">
                {formatCRM(doctor.crm, doctor.crmState)}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'specialties',
      header: 'Especialidades',
      cell: ({ row }) => {
        const specialties = row.original.specialties;
        return (
          <div className="flex flex-wrap gap-1">
            {specialties.slice(0, 2).map((specialty) => (
              <Badge key={specialty} variant="secondary" className="text-xs">
                {specialty}
              </Badge>
            ))}
            {specialties.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{specialties.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'crmStatus',
      header: 'Status CRM',
      cell: ({ row }) => {
        const status = row.original.crmStatus;
        return (
          <Badge className={getCrmStatusColor(status)}>
            {getCrmStatusLabel(status)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'phone',
      header: 'Contato',
      cell: ({ row }) => {
        const doctor = row.original;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm">
              <Phone className="h-3 w-3 text-muted-foreground" />
              {doctor.phone}
            </div>
            {doctor.user?.email && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span className="max-w-[150px] truncate">{doctor.user.email}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'telemedicineEnabled',
      header: 'Telemedicina',
      cell: ({ row }) => {
        const enabled = row.original.telemedicineEnabled;
        return enabled ? (
          <Badge variant="default" className="bg-green-600">
            <Video className="mr-1 h-3 w-3" />
            Ativo
          </Badge>
        ) : (
          <Badge variant="secondary">Inativo</Badge>
        );
      },
    },
    {
      accessorKey: 'clinics',
      header: 'Clinicas',
      cell: ({ row }) => {
        const clinics = row.original.clinics ?? [];
        if (clinics.length === 0) {
          return <span className="text-muted-foreground">-</span>;
        }
        return (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span>{clinics.length} clinica(s)</span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const doctor = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acoes</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/medicos/${doctor.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalhes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/medicos/${doctor.id}/editar`)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Medicos' },
        ]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Medicos</h1>
          <p className="text-muted-foreground">
            Gerencie os medicos cadastrados no sistema
          </p>
        </div>
        <Button onClick={() => router.push('/medicos/novo')}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Medico
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Medicos</CardTitle>
            <UserRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDoctors}</div>
            <p className="text-xs text-muted-foreground">
              {activeDoctors} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Especialidades</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{specialtiesCount}</div>
            <p className="text-xs text-muted-foreground">
              especialidades disponíveis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Telemedicina</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{telemedicineEnabled}</div>
            <p className="text-xs text-muted-foreground">
              medicos com telemedicina
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Ocupacao</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">
              media de agendamentos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Medicos</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os medicos cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={doctors}
            searchKey="fullName"
            searchPlaceholder="Buscar por nome..."
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
