'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  FlaskConical,
  User,
  Stethoscope,
  MoreHorizontal,
  Eye,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
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
import { examsApi } from '@/lib/api/exams';
import type { ExamRequest } from '@/types/exam';
import {
  ExamStatus,
  ExamPriority,
  getExamStatusLabel,
  getExamStatusColor,
  getExamPriorityLabel,
  getExamPriorityColor,
  getExamCategoryLabel,
} from '@/types/exam';

export default function ExamesPage() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['exams'],
    queryFn: () => examsApi.list({ limit: 100, sortBy: 'requestedAt', sortOrder: 'desc' }),
  });

  const exams = data?.data ?? [];

  // Stats
  const totalExams = data?.total ?? 0;
  const pendingCount = exams.filter(
    (e) =>
      e.status === ExamStatus.REQUESTED ||
      e.status === ExamStatus.SCHEDULED ||
      e.status === ExamStatus.COLLECTED
  ).length;
  const inAnalysisCount = exams.filter(
    (e) => e.status === ExamStatus.IN_ANALYSIS
  ).length;
  const completedCount = exams.filter(
    (e) => e.status === ExamStatus.COMPLETED
  ).length;
  const criticalCount = exams.filter((e) => e.hasCriticalValues).length;

  const columns: ColumnDef<ExamRequest>[] = [
    {
      accessorKey: 'examName',
      header: 'Exame',
      cell: ({ row }) => {
        const exam = row.original;
        return (
          <div>
            <p className="font-medium">{exam.examName}</p>
            <p className="text-xs text-muted-foreground">
              {getExamCategoryLabel(exam.category)}
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
            <span>{patient.socialName || patient.fullName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'requestingDoctor',
      header: 'Solicitante',
      cell: ({ row }) => {
        const doctor = row.original.requestingDoctor;
        if (!doctor) return '-';
        return (
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Dr(a). {doctor.socialName || doctor.fullName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'requestedAt',
      header: 'Solicitado em',
      cell: ({ row }) => {
        return (
          <span className="text-sm">
            {format(parseISO(row.original.requestedAt), 'dd/MM/yyyy')}
          </span>
        );
      },
    },
    {
      accessorKey: 'priority',
      header: 'Prioridade',
      cell: ({ row }) => {
        const priority = row.original.priority;
        return (
          <Badge className={getExamPriorityColor(priority)}>
            {getExamPriorityLabel(priority)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const exam = row.original;
        return (
          <div className="flex items-center gap-2">
            <Badge className={getExamStatusColor(exam.status)}>
              {getExamStatusLabel(exam.status)}
            </Badge>
            {exam.hasCriticalValues && (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const exam = row.original;
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
                onClick={() => router.push(`/exames/${exam.id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Ver detalhes
              </DropdownMenuItem>
              {exam.status === ExamStatus.COMPLETED && (
                <DropdownMenuItem>
                  <FileText className="mr-2 h-4 w-4" />
                  Ver resultado
                </DropdownMenuItem>
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
          { label: 'Exames' },
        ]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Exames Laboratoriais</h1>
          <p className="text-muted-foreground">
            Gerencie as solicitacoes e resultados de exames
          </p>
        </div>
        <Button onClick={() => router.push('/exames/novo')}>
          <Plus className="mr-2 h-4 w-4" />
          Solicitar Exame
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExams}</div>
            <p className="text-xs text-muted-foreground">solicitacoes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">aguardando</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Em Analise</CardTitle>
            <FlaskConical className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{inAnalysisCount}</div>
            <p className="text-xs text-muted-foreground">processando</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Concluidos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            <p className="text-xs text-muted-foreground">finalizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Valores Criticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
            <p className="text-xs text-muted-foreground">atencao</p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Values Alert */}
      {criticalCount > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Valores Criticos Detectados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700">
              Existem {criticalCount} exame(s) com valores criticos que requerem atencao imediata.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 border-red-300 text-red-700 hover:bg-red-100"
              onClick={() => {
                // Filter by critical values
              }}
            >
              Ver exames criticos
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Exames</CardTitle>
          <CardDescription>
            Visualize e gerencie todas as solicitacoes de exames
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={exams}
            searchKey="examName"
            searchPlaceholder="Buscar por nome do exame..."
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
