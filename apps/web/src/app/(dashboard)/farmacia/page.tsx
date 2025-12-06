'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Pill,
  QrCode,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Package,
  Shield,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Download,
  Scan,
} from 'lucide-react';
import { format } from 'date-fns';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { pharmacyApi } from '@/lib/api/pharmacy';
import {
  DispensationStatus,
  DispensationType,
  getDispensationStatusLabel,
  getDispensationStatusColor,
  getDispensationTypeLabel,
  getDispensationTypeColor,
} from '@/types/pharmacy';
import { toast } from 'sonner';

// Mock data
const mockDispensations = [
  {
    id: '1',
    dispensationNumber: 'DISP-2024-001234',
    prescription: {
      prescriptionNumber: 'RX-2024-005678',
      patient: { fullName: 'Maria Silva Santos', cpf: '***456789**' },
      doctor: { fullName: 'Dr. Carlos Silva', crm: '123456', crmState: 'SP' },
    },
    type: 'SIMPLE',
    status: 'COMPLETED',
    items: [
      { medicationName: 'Losartana 50mg', quantity: 30 },
      { medicationName: 'AAS 100mg', quantity: 30 },
    ],
    dispensedAt: '2024-03-18T14:35:00',
  },
  {
    id: '2',
    dispensationNumber: 'DISP-2024-001235',
    prescription: {
      prescriptionNumber: 'RC-2024-003456',
      patient: { fullName: 'Joao Costa Lima', cpf: '***789012**' },
      doctor: { fullName: 'Dr. Paulo Mendes', crm: '654321', crmState: 'SP' },
    },
    type: 'CONTROLLED_BLUE',
    status: 'COMPLETED',
    items: [{ medicationName: 'Clonazepam 2mg', quantity: 30 }],
    dispensedAt: '2024-03-18T15:20:00',
  },
  {
    id: '3',
    dispensationNumber: 'DISP-2024-001236',
    prescription: {
      prescriptionNumber: 'RX-2024-007890',
      patient: { fullName: 'Ana Paula Ferreira', cpf: '***234567**' },
      doctor: { fullName: 'Dra. Ana Lima', crm: '789012', crmState: 'SP' },
    },
    type: 'ANTIMICROBIAL',
    status: 'PENDING',
    items: [{ medicationName: 'Amoxicilina 500mg', quantity: 21 }],
    dispensedAt: null,
  },
];

const mockControlledInventory = [
  { medication: 'Clonazepam 2mg', list: 'B1', stock: 55, minimum: 30 },
  { medication: 'Diazepam 10mg', list: 'B1', stock: 28, minimum: 30 },
  { medication: 'Alprazolam 1mg', list: 'B1', stock: 42, minimum: 25 },
  { medication: 'Codeina 30mg', list: 'A2', stock: 18, minimum: 20 },
];

export default function FarmaciaPage() {
  const router = useRouter();
  const [isValidateDialogOpen, setIsValidateDialogOpen] = React.useState(false);
  const [prescriptionCode, setPrescriptionCode] = React.useState('');
  const [validationResult, setValidationResult] = React.useState<any>(null);

  const dispensations = mockDispensations;

  // Stats
  const stats = {
    todayDispensations: 45,
    pendingValidation: 3,
    controlled: 12,
    lowStock: mockControlledInventory.filter((i) => i.stock < i.minimum).length,
  };

  const handleValidate = async () => {
    // Simulate validation
    toast.success('Receita validada com sucesso!');
    setValidationResult({
      isValid: true,
      prescription: {
        prescriptionNumber: prescriptionCode || 'RX-2024-001234',
        validUntil: '2024-04-14',
        daysRemaining: 29,
        patient: { fullName: 'Maria Silva Santos', cpf: '***456789**' },
        doctor: {
          fullName: 'Dr. Carlos Silva',
          crm: '123456-SP',
          digitalSignature: { isValid: true },
        },
        items: [
          { medicationName: 'Losartana 50mg', quantity: 30, dispensedQuantity: 0 },
          { medicationName: 'AAS 100mg', quantity: 30, dispensedQuantity: 0 },
        ],
      },
    });
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Farmacia' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Farmacia</h1>
          <p className="text-muted-foreground">
            Validacao de receitas e dispensacao de medicamentos
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isValidateDialogOpen} onOpenChange={setIsValidateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <QrCode className="mr-2 h-4 w-4" />
                Validar Receita
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Validar Receita</DialogTitle>
                <DialogDescription>
                  Escaneie o QR Code ou digite o codigo da receita
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {!validationResult ? (
                  <>
                    <div className="flex justify-center">
                      <div className="w-48 h-48 border-2 border-dashed border-muted-foreground/50 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <Scan className="h-12 w-12 mx-auto text-muted-foreground/50" />
                          <p className="text-sm text-muted-foreground mt-2">
                            Escaneie o QR Code
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-center text-muted-foreground">ou</div>
                    <div className="space-y-2">
                      <Label>Codigo da Receita</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="RX-2024-XXXXXX"
                          value={prescriptionCode}
                          onChange={(e) => setPrescriptionCode(e.target.value)}
                        />
                        <Button onClick={handleValidate}>Validar</Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800">Receita Valida</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Numero da Receita</p>
                        <p className="font-medium">{validationResult.prescription.prescriptionNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Paciente</p>
                        <p className="font-medium">{validationResult.prescription.patient.fullName}</p>
                        <p className="text-sm">CPF: {validationResult.prescription.patient.cpf}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Prescritor</p>
                        <p className="font-medium">{validationResult.prescription.doctor.fullName}</p>
                        <p className="text-sm">CRM: {validationResult.prescription.doctor.crm}</p>
                        <Badge variant="default" className="mt-1">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Assinatura Digital Valida
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Validade</p>
                        <p className="font-medium">
                          {validationResult.prescription.validUntil} ({validationResult.prescription.daysRemaining} dias restantes)
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Medicamentos</p>
                        <div className="space-y-2 mt-2">
                          {validationResult.prescription.items.map((item: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded">
                              <span>{item.medicationName}</span>
                              <Badge variant="secondary">{item.quantity} un</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => {
                        setValidationResult(null);
                        setPrescriptionCode('');
                      }}>
                        Nova Validacao
                      </Button>
                      <Button onClick={() => {
                        toast.success('Redirecionando para dispensacao...');
                        setIsValidateDialogOpen(false);
                      }}>
                        Dispensar Medicamentos
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={() => router.push('/farmacia/dispensacoes')}>
            <FileText className="mr-2 h-4 w-4" />
            Historico
          </Button>
          <Button variant="outline" onClick={() => router.push('/farmacia/estoque')}>
            <Package className="mr-2 h-4 w-4" />
            Estoque
          </Button>
        </div>
      </div>

      {/* Low Stock Alert */}
      {stats.lowStock > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
              <div>
                <p className="font-semibold text-orange-800">
                  {stats.lowStock} Medicamento(s) com Estoque Baixo
                </p>
                <p className="text-sm text-orange-600">
                  Verifique o estoque de controlados
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push('/farmacia/estoque')}>
              Ver Estoque
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Dispensacoes Hoje</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayDispensations}</div>
            <p className="text-xs text-muted-foreground">medicamentos dispensados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aguardando</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingValidation}</div>
            <p className="text-xs text-muted-foreground">receitas para validar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Controlados</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.controlled}</div>
            <p className="text-xs text-muted-foreground">hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Dispensacao</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">94%</div>
            <p className="text-xs text-muted-foreground">receitas dispensadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="dispensations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dispensations">Dispensacoes Recentes</TabsTrigger>
          <TabsTrigger value="controlled">Controlados</TabsTrigger>
        </TabsList>

        {/* Dispensations Tab */}
        <TabsContent value="dispensations">
          <Card>
            <CardHeader>
              <CardTitle>Ultimas Dispensacoes</CardTitle>
              <CardDescription>
                Historico de dispensacoes recentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dispensations.map((disp) => (
                  <div
                    key={disp.id}
                    className="flex items-start justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-medium">
                          {disp.dispensationNumber}
                        </span>
                        <Badge className={getDispensationStatusColor(disp.status as DispensationStatus)}>
                          {getDispensationStatusLabel(disp.status as DispensationStatus)}
                        </Badge>
                        <Badge className={getDispensationTypeColor(disp.type as DispensationType)}>
                          {getDispensationTypeLabel(disp.type as DispensationType)}
                        </Badge>
                      </div>
                      <div>
                        <p className="font-medium">{disp.prescription.patient.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          Receita: {disp.prescription.prescriptionNumber}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Prescritor: {disp.prescription.doctor.fullName} - CRM {disp.prescription.doctor.crm}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {disp.items.map((item, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {item.medicationName} x{item.quantity}
                          </Badge>
                        ))}
                      </div>
                      {disp.dispensedAt && (
                        <p className="text-xs text-muted-foreground">
                          Dispensado em: {format(new Date(disp.dispensedAt), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Controlled Tab */}
        <TabsContent value="controlled">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Estoque de Controlados</CardTitle>
                <CardDescription>
                  Inventario de medicamentos controlados (SNGPC)
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Relatorio SNGPC
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockControlledInventory.map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between rounded-lg border p-4 ${
                      item.stock < item.minimum ? 'border-orange-200 bg-orange-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{item.medication}</p>
                        <Badge variant="secondary" className="mt-1">
                          Lista {item.list}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${
                        item.stock < item.minimum ? 'text-orange-600' : ''
                      }`}>
                        {item.stock}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Min: {item.minimum}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
