'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  FlaskConical,
  User,
  Stethoscope,
  Building2,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Download,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { examsApi } from '@/lib/api/exams';
import {
  ExamStatus,
  getExamStatusLabel,
  getExamStatusColor,
  getExamPriorityLabel,
  getExamPriorityColor,
  getExamCategoryLabel,
} from '@/types/exam';

export default function ExamDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const examId = params.id as string;

  const [error, setError] = React.useState<string | null>(null);

  const { data: exam, isLoading } = useQuery({
    queryKey: ['exam', examId],
    queryFn: () => examsApi.getById(examId),
    enabled: !!examId,
  });

  const handleDownloadPdf = async () => {
    try {
      const blob = await examsApi.generatePdf(examId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `exame-${examId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao baixar PDF');
    }
  };

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

  if (!exam) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FlaskConical className="h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold">Exame nao encontrado</h2>
        <p className="text-muted-foreground">
          O exame solicitado nao foi encontrado no sistema.
        </p>
        <Button className="mt-4" onClick={() => router.push('/exames')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para lista
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Exames', href: '/exames' },
          { label: exam.examName },
        ]}
      />

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{exam.examName}</h1>
            <Badge className={getExamStatusColor(exam.status)}>
              {getExamStatusLabel(exam.status)}
            </Badge>
            <Badge className={getExamPriorityColor(exam.priority)}>
              {getExamPriorityLabel(exam.priority)}
            </Badge>
            {exam.hasCriticalValues && (
              <Badge variant="destructive">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Valor Critico
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {getExamCategoryLabel(exam.category)} | Solicitado em{' '}
            {format(parseISO(exam.requestedAt), "dd 'de' MMMM 'de' yyyy", {
              locale: ptBR,
            })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => router.push('/exames')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          {exam.status === ExamStatus.COMPLETED && (
            <Button onClick={handleDownloadPdf}>
              <Download className="mr-2 h-4 w-4" />
              Baixar PDF
            </Button>
          )}
        </div>
      </div>

      {/* Critical Value Alert */}
      {exam.hasCriticalValues && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Este exame possui valores criticos que requerem atencao imediata.
            {exam.criticalValueNotified && exam.criticalValueNotifiedAt && (
              <span className="block mt-1 text-sm">
                Notificado em{' '}
                {format(parseISO(exam.criticalValueNotifiedAt), "dd/MM/yyyy 'as' HH:mm")}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Details Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Patient Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Paciente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {exam.patient ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium">
                      {exam.patient.socialName || exam.patient.fullName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CPF</p>
                    <p className="font-medium">{exam.patient.cpf}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                    <p className="font-medium">
                      {format(parseISO(exam.patient.birthDate), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/pacientes/${exam.patientId}`)}
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
              Medico Solicitante
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {exam.requestingDoctor ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">
                    Dr(a). {exam.requestingDoctor.socialName || exam.requestingDoctor.fullName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CRM</p>
                  <p className="font-medium">
                    {exam.requestingDoctor.crm}/{exam.requestingDoctor.crmState}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Medico nao encontrado</p>
            )}
          </CardContent>
        </Card>

        {/* Exam Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Informacoes do Exame
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Codigo</p>
                <p className="font-medium">{exam.examCode}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Categoria</p>
                <p className="font-medium">{getExamCategoryLabel(exam.category)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Jejum</p>
                <p className="font-medium">
                  {exam.fastingRequired ? 'Obrigatorio' : 'Nao necessario'}
                </p>
              </div>
            </div>

            {exam.clinicalIndication && (
              <div>
                <p className="text-sm text-muted-foreground">Indicacao Clinica</p>
                <p className="font-medium">{exam.clinicalIndication}</p>
              </div>
            )}

            {exam.preparationInstructions && (
              <div>
                <p className="text-sm text-muted-foreground">Instrucoes de Preparo</p>
                <p className="font-medium">{exam.preparationInstructions}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Historico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TimelineItem
              label="Solicitado"
              date={exam.requestedAt}
              completed
            />
            {exam.scheduledDate && (
              <TimelineItem
                label="Agendado"
                date={`${exam.scheduledDate}T${exam.scheduledTime || '00:00'}`}
                completed={!!exam.collectedAt}
              />
            )}
            {exam.collectedAt && (
              <TimelineItem
                label="Coletado"
                date={exam.collectedAt}
                completed
              />
            )}
            {exam.status === ExamStatus.IN_ANALYSIS && (
              <TimelineItem
                label="Em analise"
                date={exam.updatedAt}
                completed={false}
                inProgress
              />
            )}
            {exam.completedAt && (
              <TimelineItem
                label="Concluido"
                date={exam.completedAt}
                completed
              />
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {exam.status === ExamStatus.COMPLETED && exam.results && exam.results.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Resultados
              </CardTitle>
              <CardDescription>
                Valores obtidos na analise laboratorial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parametro</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exam.results.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className="font-medium">{result.parameter}</TableCell>
                      <TableCell>
                        <span
                          className={
                            result.isCritical
                              ? 'text-red-600 font-bold'
                              : result.isAbnormal
                              ? 'text-orange-600 font-medium'
                              : ''
                          }
                        >
                          {result.value}
                        </span>
                      </TableCell>
                      <TableCell>{result.unit || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {result.referenceRange || '-'}
                      </TableCell>
                      <TableCell>
                        {result.isCritical ? (
                          <Badge variant="destructive">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Critico
                          </Badge>
                        ) : result.isAbnormal ? (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            <TrendingUp className="mr-1 h-3 w-3" />
                            Alterado
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <Minus className="mr-1 h-3 w-3" />
                            Normal
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {exam.interpretation && (
                <div className="mt-6 p-4 rounded-lg bg-muted">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Interpretacao
                  </p>
                  <p className="whitespace-pre-wrap">{exam.interpretation}</p>
                </div>
              )}

              {exam.validatedBy && (
                <div className="mt-4 text-sm text-muted-foreground">
                  Validado por: {exam.validatedBy}
                  {exam.validatedAt && (
                    <span>
                      {' '}
                      em {format(parseISO(exam.validatedAt), "dd/MM/yyyy 'as' HH:mm")}
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Lab Info */}
        {exam.lab && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Laboratorio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{exam.lab.name}</p>
              </div>
              {exam.lab.cnes && (
                <div>
                  <p className="text-sm text-muted-foreground">CNES</p>
                  <p className="font-medium">{exam.lab.cnes}</p>
                </div>
              )}
              {exam.lab.phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{exam.lab.phone}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function TimelineItem({
  label,
  date,
  completed,
  inProgress,
}: {
  label: string;
  date: string;
  completed: boolean;
  inProgress?: boolean;
}) {
  return (
    <div className="flex items-center gap-4">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full ${
          completed
            ? 'bg-green-100 text-green-600'
            : inProgress
            ? 'bg-yellow-100 text-yellow-600'
            : 'bg-gray-100 text-gray-400'
        }`}
      >
        {completed ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : inProgress ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Clock className="h-4 w-4" />
        )}
      </div>
      <div className="flex-1">
        <p className={`font-medium ${!completed && !inProgress ? 'text-muted-foreground' : ''}`}>
          {label}
        </p>
        <p className="text-sm text-muted-foreground">
          {format(parseISO(date), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
        </p>
      </div>
    </div>
  );
}
