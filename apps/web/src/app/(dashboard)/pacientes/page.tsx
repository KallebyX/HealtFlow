// ============================================================
// PATIENTS LIST PAGE
// Página de listagem de pacientes com DataTable
// ============================================================

'use client';

import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  Button,
  Input,
  Badge,
  Avatar,
  AvatarFallback,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Skeleton,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui';
import { DataTable } from '@/components/data-table';
import { patientsApi } from '@/lib/api/patients';
import { Patient, PatientQuery, getGenderLabel } from '@/types/patient';
import { formatDate, formatPhone, getInitials, calculateAge } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function PatientsPage() {
  const [query, setQuery] = useState<PatientQuery>({
    page: 1,
    limit: 10,
    sortBy: 'fullName',
    sortOrder: 'asc',
  });
  const [searchInput, setSearchInput] = useState('');

  const {
    data: patientsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['patients', query],
    queryFn: () => patientsApi.list(query),
  });

  const handleSearch = () => {
    setQuery((prev) => ({ ...prev, search: searchInput, page: 1 }));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const columns: ColumnDef<Patient>[] = [
    {
      accessorKey: 'fullName',
      header: 'Paciente',
      cell: ({ row }) => {
        const patient = row.original;
        const displayName = patient.socialName || patient.fullName;
        const age = calculateAge(patient.birthDate);

        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <Link
                href={`/pacientes/${patient.id}`}
                className="font-medium hover:text-primary transition-colors"
              >
                {displayName}
              </Link>
              <p className="text-sm text-muted-foreground">
                {age} anos - {getGenderLabel(patient.gender)}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'cpf',
      header: 'CPF',
      cell: ({ row }) => {
        const cpf = row.getValue('cpf') as string;
        // Mascara CPF: ***.***.***-XX
        const maskedCpf = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '***.$2.***-$4');
        return <span className="font-mono text-sm">{maskedCpf}</span>;
      },
    },
    {
      accessorKey: 'phone',
      header: 'Telefone',
      cell: ({ row }) => {
        const phone = row.getValue('phone') as string;
        return <span className="text-sm">{formatPhone(phone)}</span>;
      },
    },
    {
      accessorKey: 'birthDate',
      header: 'Data de Nasc.',
      cell: ({ row }) => {
        const date = row.getValue('birthDate') as string;
        return <span className="text-sm">{formatDate(new Date(date))}</span>;
      },
    },
    {
      accessorKey: 'level',
      header: 'Nivel',
      cell: ({ row }) => {
        const level = row.getValue('level') as number;
        const levelName = row.original.levelName;
        return (
          <Badge variant="secondary" className="gap-1">
            <span className="font-bold">Nv.{level}</span>
            <span className="text-xs">{levelName}</span>
          </Badge>
        );
      },
    },
    {
      accessorKey: 'user.status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.user?.status;
        const statusConfig: Record<string, { label: string; variant: any }> = {
          ACTIVE: { label: 'Ativo', variant: 'success' },
          INACTIVE: { label: 'Inativo', variant: 'secondary' },
          PENDING: { label: 'Pendente', variant: 'warning' },
          SUSPENDED: { label: 'Suspenso', variant: 'destructive' },
          BLOCKED: { label: 'Bloqueado', variant: 'destructive' },
        };
        const config = statusConfig[status || 'INACTIVE'] || statusConfig.INACTIVE;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const patient = row.original;

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
              <DropdownMenuItem asChild>
                <Link href={`/pacientes/${patient.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver detalhes
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/pacientes/${patient.id}/editar`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  toast.error('Funcionalidade em desenvolvimento');
                }}
              >
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
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Pacientes</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Pacientes</h1>
          <p className="text-muted-foreground">
            Gerencie os pacientes cadastrados no sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button asChild>
            <Link href="/pacientes/novo">
              <Plus className="mr-2 h-4 w-4" />
              Novo Paciente
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-20" /> : patientsData?.total || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {isLoading ? <Skeleton className="h-8 w-20" /> : '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos este Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {isLoading ? <Skeleton className="h-8 w-20" /> : '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultas Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {isLoading ? <Skeleton className="h-8 w-20" /> : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF, telefone ou email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSearch}>
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchInput('');
                  setQuery({ page: 1, limit: 10, sortBy: 'fullName', sortOrder: 'asc' });
                }}
              >
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="pt-6">
          {isError ? (
            <div className="text-center py-10">
              <p className="text-destructive">Erro ao carregar pacientes.</p>
              <Button variant="outline" onClick={() => refetch()} className="mt-4">
                Tentar novamente
              </Button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={patientsData?.data || []}
              isLoading={isLoading}
              pageSize={query.limit}
            />
          )}
        </CardContent>
      </Card>

      {/* Pagination Info */}
      {patientsData && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Mostrando {((query.page || 1) - 1) * (query.limit || 10) + 1} a{' '}
            {Math.min((query.page || 1) * (query.limit || 10), patientsData.total)} de{' '}
            {patientsData.total} pacientes
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={(query.page || 1) <= 1}
              onClick={() => setQuery((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={(query.page || 1) >= patientsData.totalPages}
              onClick={() => setQuery((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
            >
              Proxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
