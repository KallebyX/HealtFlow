'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  FileText,
  User,
  Stethoscope,
  MoreHorizontal,
  Eye,
  Printer,
  Copy,
  XCircle,
  Send,
  PenTool,
  Calendar,
  Pill,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/data-table/data-table';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { prescriptionsApi } from '@/lib/api/prescriptions';
import type { Prescription } from '@/types/prescription';
import {
  PrescriptionStatus,
  getPrescriptionStatusLabel,
  getPrescriptionStatusColor,
  getPrescriptionTypeLabel,
  getPrescriptionTypeColor,
} from '@/types/prescription';

export default function PrescricoesPage() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['prescriptions'],
    queryFn: () => prescriptionsApi.list({ limit: 100, sortBy: 'createdAt', sortOrder: 'desc' }),
  });

  const prescriptions = data?.data ?? [];

  // Stats
  const totalPrescriptions = data?.total ?? 0;
  const signedCount = prescriptions.filter(
    (p) => p.status === PrescriptionStatus.SIGNED
  ).length;
  const pendingCount = prescriptions.filter(
    (p) => p.status === PrescriptionStatus.PENDING_SIGNATURE || p.status === PrescriptionStatus.DRAFT
  ).length;
  const dispensedCount = prescriptions.filter(
    (p) => p.status === PrescriptionStatus.DISPENSED
  ).length;

  const columns: ColumnDef<Prescription>[] = [
    {
      accessorKey: 'id',
      header: 'Codigo',
      cell: ({ row }) => {
        const prescription = row.original;
        return (
          <div>
            <p className="font-mono text-sm font-medium">
              #{prescription.id.slice(-8).toUpperCase()}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(parseISO(prescription.prescriptionDate), 'dd/MM/yyyy')}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: 'patient',
      header: 'Paciente',
      cell: ({ row }) => {
        const patient = row.original.patient;
        if (!patient) return '-';
        return (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{patient.socialName || patient.fullName}</p>
              <p className="text-xs text-muted-foreground">CPF: {patient.cpf}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'doctor',
      header: 'Medico',
      cell: ({ row }) => {
        const doctor = row.original.doctor;
        if (!doctor) return '-';
        return (
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">
                Dr(a). {doctor.socialName || doctor.fullName}
              </p>
              <p className="text-xs text-muted-foreground">
                CRM {doctor.crm}/{doctor.crmState}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ row }) => {
        const type = row.original.type;
        return (
          <Badge className={getPrescriptionTypeColor(type)}>
            {getPrescriptionTypeLabel(type)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'medications',
      header: 'Medicamentos',
      cell: ({ row }) => {
        const medications = row.original.medications;
        return (
          <div className="flex items-center gap-1">
            <Pill className="h-4 w-4 text-muted-foreground" />
            <span>{medications?.length || 0} item(s)</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge className={getPrescriptionStatusColor(status)}>
            {getPrescriptionStatusLabel(status)}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const prescription = row.original;
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
              <DropdownMenuItem
                onClick={() => router.push(`/prescricoes/${prescription.id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Ver detalhes
              </DropdownMenuItem>
              {prescription.status === PrescriptionStatus.SIGNED && (
                <>
                  <DropdownMenuItem>
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar para paciente
                  </DropdownMenuItem>
                </>
              )}
              {(prescription.status === PrescriptionStatus.DRAFT ||
                prescription.status === PrescriptionStatus.PENDING_SIGNATURE) && (
                <DropdownMenuItem>
                  <PenTool className="mr-2 h-4 w-4" />
                  Assinar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <Copy className="mr-2 h-4 w-4" />
                Duplicar
              </DropdownMenuItem>
              {prescription.status === PrescriptionStatus.DRAFT && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <XCircle className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </>
              )}
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
          { label: 'Prescricoes' },
        ]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prescricoes</h1>
          <p className="text-muted-foreground">
            Gerencie as prescricoes e receituarios medicos
          </p>
        </div>
        <Button onClick={() => router.push('/prescricoes/nova')}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Prescricao
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPrescriptions}</div>
            <p className="text-xs text-muted-foreground">prescricoes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Assinadas</CardTitle>
            <PenTool className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{signedCount}</div>
            <p className="text-xs text-muted-foreground">prontas para uso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">aguardando assinatura</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Dispensadas</CardTitle>
            <Pill className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{dispensedCount}</div>
            <p className="text-xs text-muted-foreground">ja utilizadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Prescricoes</CardTitle>
          <CardDescription>
            Visualize e gerencie todas as prescricoes emitidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={prescriptions}
            searchKey="patient"
            searchPlaceholder="Buscar por paciente..."
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
