'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  TestTubes,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Filter,
  RefreshCw,
  Search,
  Download,
  Eye,
  Play,
  Beaker,
  Clipboard,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { laboratoryApi } from '@/lib/api/laboratory';
import {
  LabOrderStatus,
  LabPriority,
  getLabOrderStatusLabel,
  getLabOrderStatusColor,
  getLabPriorityLabel,
  getLabPriorityColor,
} from '@/types/laboratory';

// Mock data
const mockOrders = [
  {
    id: '1',
    orderNumber: 'PED-2024-001234',
    patient: { fullName: 'Maria Silva Santos', birthDate: '1979-05-15' },
    doctor: { fullName: 'Dr. Carlos Silva', crm: '123456', crmState: 'SP' },
    status: 'IN_ANALYSIS',
    priority: 'ROUTINE',
    items: [
      { examName: 'Hemograma Completo', status: 'COMPLETED' },
      { examName: 'Glicemia de Jejum', status: 'IN_ANALYSIS' },
      { examName: 'Hemoglobina Glicada', status: 'PENDING' },
    ],
    createdAt: '2024-03-18T08:30:00',
  },
  {
    id: '2',
    orderNumber: 'PED-2024-001235',
    patient: { fullName: 'Joao Costa Lima', birthDate: '1985-08-22' },
    doctor: { fullName: 'Dra. Ana Lima', crm: '654321', crmState: 'SP' },
    status: 'PENDING',
    priority: 'URGENT',
    items: [
      { examName: 'Troponina', status: 'PENDING' },
      { examName: 'CK-MB', status: 'PENDING' },
      { examName: 'ECG', status: 'PENDING' },
    ],
    createdAt: '2024-03-18T09:15:00',
  },
  {
    id: '3',
    orderNumber: 'PED-2024-001236',
    patient: { fullName: 'Ana Paula Ferreira', birthDate: '1992-11-30' },
    doctor: { fullName: 'Dr. Roberto Mendes', crm: '789012', crmState: 'SP' },
    status: 'RELEASED',
    priority: 'ROUTINE',
    items: [
      { examName: 'Urina Tipo 1', status: 'RELEASED' },
      { examName: 'Creatinina', status: 'RELEASED' },
    ],
    createdAt: '2024-03-17T14:00:00',
  },
];

const mockCriticalValues = [
  {
    id: '1',
    patient: 'Pedro Oliveira',
    exam: 'Glicemia',
    value: '450 mg/dL',
    reference: '70-99 mg/dL',
    time: '10 min atras',
    notified: false,
  },
  {
    id: '2',
    patient: 'Lucia Santos',
    exam: 'Potassio',
    value: '6.8 mEq/L',
    reference: '3.5-5.0 mEq/L',
    time: '25 min atras',
    notified: true,
  },
];

export default function LaboratorioPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [priorityFilter, setPriorityFilter] = React.useState<string>('all');
  const [searchTerm, setSearchTerm] = React.useState('');

  const orders = mockOrders;

  // Stats
  const stats = {
    pending: orders.filter((o) => o.status === 'PENDING').length,
    inAnalysis: orders.filter((o) => o.status === 'IN_ANALYSIS').length,
    completed: orders.filter((o) => o.status === 'COMPLETED' || o.status === 'RELEASED').length,
    urgent: orders.filter((o) => o.priority === 'URGENT').length,
    criticalValues: mockCriticalValues.filter((c) => !c.notified).length,
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Laboratorio' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Laboratorio</h1>
          <p className="text-muted-foreground">
            Gestao de exames e resultados laboratoriais
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/laboratorio/pedidos')}>
            <Clipboard className="mr-2 h-4 w-4" />
            Ver Pedidos
          </Button>
          <Button variant="outline" onClick={() => router.push('/laboratorio/resultados')}>
            <FileText className="mr-2 h-4 w-4" />
            Lancar Resultados
          </Button>
        </div>
      </div>

      {/* Critical Values Alert */}
      {stats.criticalValues > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-800">
                  {stats.criticalValues} Valor(es) Critico(s) Pendente(s)
                </p>
                <p className="text-sm text-red-600">
                  Requer atencao imediata e notificacao ao medico
                </p>
              </div>
            </div>
            <Button variant="destructive" size="sm">
              Ver Valores Criticos
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">aguardando coleta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Em Analise</CardTitle>
            <Beaker className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.inAnalysis}</div>
            <p className="text-xs text-muted-foreground">processando</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Liberados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.urgent}</div>
            <p className="text-xs text-muted-foreground">prioridade alta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">TAT Medio</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">4h 23min</div>
            <p className="text-xs text-muted-foreground">turnaround time</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por paciente ou pedido..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.values(LabOrderStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {getLabOrderStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.values(LabPriority).map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {getLabPriorityLabel(priority)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos de Exames</CardTitle>
          <CardDescription>
            Lista de pedidos laboratoriais recentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-start justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-medium">
                      {order.orderNumber}
                    </span>
                    <Badge className={getLabOrderStatusColor(order.status as LabOrderStatus)}>
                      {getLabOrderStatusLabel(order.status as LabOrderStatus)}
                    </Badge>
                    <Badge className={getLabPriorityColor(order.priority as LabPriority)}>
                      {getLabPriorityLabel(order.priority as LabPriority)}
                    </Badge>
                  </div>
                  <div>
                    <p className="font-medium">{order.patient.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      Solicitante: {order.doctor.fullName} - CRM {order.doctor.crm}/{order.doctor.crmState}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {order.items.map((item, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {item.examName}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Criado em: {format(parseISO(order.createdAt), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                  {order.status === 'PENDING' && (
                    <Button variant="ghost" size="icon">
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                  {order.status === 'RELEASED' && (
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Critical Values */}
      {mockCriticalValues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Valores Criticos
            </CardTitle>
            <CardDescription>
              Resultados que requerem comunicacao imediata ao medico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockCriticalValues.map((critical) => (
                <div
                  key={critical.id}
                  className={`flex items-center justify-between rounded-lg border p-4 ${
                    !critical.notified ? 'border-red-200 bg-red-50' : ''
                  }`}
                >
                  <div>
                    <p className="font-medium">{critical.patient}</p>
                    <p className="text-sm">
                      <span className="font-semibold">{critical.exam}:</span>{' '}
                      <span className="text-red-600 font-bold">{critical.value}</span>{' '}
                      <span className="text-muted-foreground">
                        (Ref: {critical.reference})
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">{critical.time}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {critical.notified ? (
                      <Badge variant="secondary">Notificado</Badge>
                    ) : (
                      <Button size="sm" variant="destructive">
                        Notificar Medico
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
