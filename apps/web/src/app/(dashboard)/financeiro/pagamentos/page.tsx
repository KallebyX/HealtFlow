'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  CreditCard,
  Search,
  Filter,
  Download,
  Calendar,
  DollarSign,
  ArrowUpDown,
  Eye,
  RotateCcw,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { format, parseISO, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { paymentsApi } from '@/lib/api/financial';
import {
  formatCurrency,
  getPaymentStatusLabel,
  getPaymentStatusColor,
  getPaymentMethodLabel,
  PaymentStatus,
  PaymentMethod,
} from '@/types/financial';
import type { Payment } from '@/types/financial';

export default function PagamentosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filters
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [methodFilter, setMethodFilter] = React.useState<string>('all');
  const [period, setPeriod] = React.useState('month');
  const [page, setPage] = React.useState(1);

  // Selected payment for details
  const [selectedPayment, setSelectedPayment] = React.useState<Payment | null>(null);

  const getPeriodDates = () => {
    const now = new Date();
    switch (period) {
      case 'week':
        return { start: subDays(now, 7).toISOString(), end: now.toISOString() };
      case 'month':
        return {
          start: startOfMonth(now).toISOString(),
          end: endOfMonth(now).toISOString(),
        };
      case 'quarter':
        return { start: subDays(now, 90).toISOString(), end: now.toISOString() };
      case 'year':
        return { start: subDays(now, 365).toISOString(), end: now.toISOString() };
      default:
        return {
          start: startOfMonth(now).toISOString(),
          end: endOfMonth(now).toISOString(),
        };
    }
  };

  const periodDates = getPeriodDates();

  // Query
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['payments', page, statusFilter, methodFilter, period],
    queryFn: () =>
      paymentsApi.list({
        page,
        limit: 20,
        status: statusFilter !== 'all' ? (statusFilter as PaymentStatus) : undefined,
        method: methodFilter !== 'all' ? (methodFilter as PaymentMethod) : undefined,
        dateFrom: periodDates.start,
        dateTo: periodDates.end,
      }),
  });

  // Stats
  const stats = React.useMemo(() => {
    if (!data?.data) return null;

    const total = data.data.reduce((sum, p) => sum + p.amount, 0);
    const completed = data.data.filter((p) => p.status === PaymentStatus.COMPLETED);
    const pending = data.data.filter((p) => p.status === PaymentStatus.PENDING);
    const failed = data.data.filter((p) => p.status === PaymentStatus.FAILED);

    return {
      total,
      completedAmount: completed.reduce((sum, p) => sum + p.amount, 0),
      completedCount: completed.length,
      pendingAmount: pending.reduce((sum, p) => sum + p.amount, 0),
      pendingCount: pending.length,
      failedCount: failed.length,
    };
  }, [data?.data]);

  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case PaymentStatus.PENDING:
      case PaymentStatus.PROCESSING:
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case PaymentStatus.FAILED:
      case PaymentStatus.CANCELLED:
        return <XCircle className="h-4 w-4 text-red-500" />;
      case PaymentStatus.REFUNDED:
      case PaymentStatus.PARTIALLY_REFUNDED:
        return <RefreshCw className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  };

  const getMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.PIX:
        return '⚡';
      case PaymentMethod.CREDIT_CARD:
      case PaymentMethod.DEBIT_CARD:
        return '💳';
      case PaymentMethod.BOLETO:
        return '📄';
      case PaymentMethod.CASH:
        return '💵';
      case PaymentMethod.BANK_TRANSFER:
        return '🏦';
      case PaymentMethod.INSURANCE:
        return '🏥';
      default:
        return '💰';
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Financeiro', href: '/financeiro' },
          { label: 'Pagamentos' },
        ]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Historico de Pagamentos</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie todos os pagamentos
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats?.completedAmount || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.completedCount} pagamentos confirmados
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats?.pendingAmount || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.pendingCount} pagamentos aguardando
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Falhas</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.failedCount || 0}</div>
                <p className="text-xs text-muted-foreground">pagamentos com erro</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">{data?.total || 0}</div>
                <p className="text-xs text-muted-foreground">transacoes no periodo</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por paciente, referencia..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                {Object.values(PaymentStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {getPaymentStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Metodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Metodos</SelectItem>
                {Object.values(PaymentMethod).map((method) => (
                  <SelectItem key={method} value={method}>
                    {getPaymentMethodLabel(method)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Ultima Semana</SelectItem>
                <SelectItem value="month">Este Mes</SelectItem>
                <SelectItem value="quarter">Trimestre</SelectItem>
                <SelectItem value="year">Este Ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : data?.data.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <CreditCard className="mx-auto h-12 w-12 opacity-50 mb-4" />
              <p>Nenhum pagamento encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Metodo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((payment) => (
                  <TableRow
                    key={payment.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedPayment(payment)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {payment.patient?.fullName || 'N/A'}
                        </p>
                        {payment.reference && (
                          <p className="text-sm text-muted-foreground">
                            Ref: {payment.reference}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{getMethodIcon(payment.method)}</span>
                        <span>{getPaymentMethodLabel(payment.method)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(payment.status)}
                        <Badge className={getPaymentStatusColor(payment.status)}>
                          {getPaymentStatusLabel(payment.status)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(parseISO(payment.createdAt), "dd/MM/yyyy 'as' HH:mm", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acoes</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPayment(payment);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          {payment.status === PaymentStatus.COMPLETED && (
                            <DropdownMenuItem className="text-orange-600">
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Reembolsar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {(page - 1) * 20 + 1} a {Math.min(page * 20, data.total)} de{' '}
            {data.total} resultados
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <span className="text-sm">
              Pagina {page} de {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages}
            >
              Proxima
            </Button>
          </div>
        </div>
      )}

      {/* Payment Details Dialog */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Pagamento</DialogTitle>
            <DialogDescription>
              Informacoes completas da transacao
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div>
                  <p className="text-sm text-muted-foreground">Valor</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(selectedPayment.amount)}
                  </p>
                </div>
                <Badge className={getPaymentStatusColor(selectedPayment.status)}>
                  {getPaymentStatusLabel(selectedPayment.status)}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paciente</span>
                  <span className="font-medium">
                    {selectedPayment.patient?.fullName || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Metodo</span>
                  <span className="font-medium">
                    {getMethodIcon(selectedPayment.method)}{' '}
                    {getPaymentMethodLabel(selectedPayment.method)}
                  </span>
                </div>
                {selectedPayment.cardLast4 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cartao</span>
                    <span className="font-medium">
                      {selectedPayment.cardBrand} **** {selectedPayment.cardLast4}
                    </span>
                  </div>
                )}
                {selectedPayment.reference && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Referencia</span>
                    <span className="font-medium">{selectedPayment.reference}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data</span>
                  <span className="font-medium">
                    {format(
                      parseISO(selectedPayment.createdAt),
                      "dd/MM/yyyy 'as' HH:mm",
                      { locale: ptBR }
                    )}
                  </span>
                </div>
                {selectedPayment.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Confirmado em</span>
                    <span className="font-medium">
                      {format(
                        parseISO(selectedPayment.paidAt),
                        "dd/MM/yyyy 'as' HH:mm",
                        { locale: ptBR }
                      )}
                    </span>
                  </div>
                )}
                {selectedPayment.description && (
                  <div>
                    <span className="text-muted-foreground">Descricao</span>
                    <p className="font-medium mt-1">{selectedPayment.description}</p>
                  </div>
                )}
              </div>

              {selectedPayment.status === PaymentStatus.COMPLETED && (
                <Button variant="outline" className="w-full text-orange-600">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Solicitar Reembolso
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
