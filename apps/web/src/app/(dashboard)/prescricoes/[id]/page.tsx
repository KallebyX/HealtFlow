'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  FileText,
  User,
  Stethoscope,
  Pill,
  PenTool,
  Printer,
  Send,
  Copy,
  XCircle,
  CheckCircle,
  Clock,
  AlertCircle,
  QrCode,
  Loader2,
  Download,
  Mail,
  MessageSquare,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { prescriptionsApi } from '@/lib/api/prescriptions';
import {
  PrescriptionStatus,
  getPrescriptionStatusLabel,
  getPrescriptionStatusColor,
  getPrescriptionTypeLabel,
  getPrescriptionTypeColor,
  getMedicationTypeLabel,
  getRouteLabel,
  canSignPrescription,
} from '@/types/prescription';

export default function PrescriptionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const prescriptionId = params.id as string;

  const [showSignDialog, setShowSignDialog] = React.useState(false);
  const [showCancelDialog, setShowCancelDialog] = React.useState(false);
  const [showSendDialog, setShowSendDialog] = React.useState(false);
  const [signPassword, setSignPassword] = React.useState('');
  const [cancelReason, setCancelReason] = React.useState('');
  const [sendChannel, setSendChannel] = React.useState<'email' | 'whatsapp'>('email');
  const [error, setError] = React.useState<string | null>(null);

  const { data: prescription, isLoading } = useQuery({
    queryKey: ['prescription', prescriptionId],
    queryFn: () => prescriptionsApi.getById(prescriptionId),
    enabled: !!prescriptionId,
  });

  const signMutation = useMutation({
    mutationFn: () => prescriptionsApi.sign(prescriptionId, signPassword),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescription', prescriptionId] });
      setShowSignDialog(false);
      setSignPassword('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erro ao assinar prescricao');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => prescriptionsApi.cancel(prescriptionId, cancelReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescription', prescriptionId] });
      setShowCancelDialog(false);
      setCancelReason('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erro ao cancelar prescricao');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: () => prescriptionsApi.duplicate(prescriptionId),
    onSuccess: (newPrescription) => {
      router.push(`/prescricoes/${newPrescription.id}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erro ao duplicar prescricao');
    },
  });

  const sendMutation = useMutation({
    mutationFn: () => prescriptionsApi.send(prescriptionId, sendChannel),
    onSuccess: () => {
      setShowSendDialog(false);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erro ao enviar prescricao');
    },
  });

  const handlePrint = async () => {
    try {
      const blob = await prescriptionsApi.generatePdf(prescriptionId);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      await prescriptionsApi.print(prescriptionId);
      queryClient.invalidateQueries({ queryKey: ['prescription', prescriptionId] });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao gerar PDF');
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

  if (!prescription) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold">Prescricao nao encontrada</h2>
        <p className="text-muted-foreground">
          A prescricao solicitada nao foi encontrada no sistema.
        </p>
        <Button className="mt-4" onClick={() => router.push('/prescricoes')}>
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
          { label: 'Prescricoes', href: '/prescricoes' },
          { label: `#${prescription.id.slice(-8).toUpperCase()}` },
        ]}
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Prescricao #{prescription.id.slice(-8).toUpperCase()}
            </h1>
            <Badge className={getPrescriptionStatusColor(prescription.status)}>
              {getPrescriptionStatusLabel(prescription.status)}
            </Badge>
            <Badge className={getPrescriptionTypeColor(prescription.type)}>
              {getPrescriptionTypeLabel(prescription.type)}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Emitida em{' '}
            {format(parseISO(prescription.prescriptionDate), "dd 'de' MMMM 'de' yyyy", {
              locale: ptBR,
            })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => router.push('/prescricoes')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          {canSignPrescription(prescription.status) && (
            <Button onClick={() => setShowSignDialog(true)}>
              <PenTool className="mr-2 h-4 w-4" />
              Assinar
            </Button>
          )}
        </div>
      </div>

      {/* Actions based on status */}
      {prescription.status === PrescriptionStatus.SIGNED && (
        <Card>
          <CardHeader>
            <CardTitle>Acoes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
              <Button variant="outline" onClick={() => setShowSendDialog(true)}>
                <Send className="mr-2 h-4 w-4" />
                Enviar para Paciente
              </Button>
              <Button
                variant="outline"
                onClick={() => duplicateMutation.mutate()}
                disabled={duplicateMutation.isPending}
              >
                {duplicateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                Duplicar
              </Button>
              <Button
                variant="outline"
                className="text-destructive"
                onClick={() => setShowCancelDialog(true)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
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
            {prescription.patient ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium">
                      {prescription.patient.socialName || prescription.patient.fullName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CPF</p>
                    <p className="font-medium">{prescription.patient.cpf}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                    <p className="font-medium">
                      {format(parseISO(prescription.patient.birthDate), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/pacientes/${prescription.patientId}`)}
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
              Prescritor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {prescription.doctor ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">
                    Dr(a). {prescription.doctor.socialName || prescription.doctor.fullName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CRM</p>
                  <p className="font-medium">
                    {prescription.doctor.crm}/{prescription.doctor.crmState}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Especialidades</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {prescription.doctor.specialties.map((spec) => (
                      <Badge key={spec} variant="secondary">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Medico nao encontrado</p>
            )}
          </CardContent>
        </Card>

        {/* Medications */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Medicamentos
            </CardTitle>
            <CardDescription>
              {prescription.medications?.length || 0} medicamento(s) prescritos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {prescription.medications?.map((med, index) => (
                <div
                  key={med.id || index}
                  className="rounded-lg border p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-lg">{med.medicationName}</h4>
                      {med.activeIngredient && (
                        <p className="text-sm text-muted-foreground">
                          {med.activeIngredient}
                          {med.concentration && ` - ${med.concentration}`}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline">
                      {getMedicationTypeLabel(med.medicationType)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Quantidade</p>
                      <p className="font-medium">
                        {med.quantity} {med.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Posologia</p>
                      <p className="font-medium">{med.dosage}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Frequencia</p>
                      <p className="font-medium">{med.frequency}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Via</p>
                      <p className="font-medium">{getRouteLabel(med.route)}</p>
                    </div>
                  </div>

                  {med.duration && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">Duracao</p>
                      <p className="font-medium">{med.duration}</p>
                    </div>
                  )}

                  {med.instructions && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">Instrucoes</p>
                      <p className="font-medium">{med.instructions}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {med.continuousUse && (
                      <Badge variant="secondary">Uso continuo</Badge>
                    )}
                    {med.substituteAllowed && (
                      <Badge variant="outline">Substituicao permitida</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        {(prescription.recommendations || prescription.warnings) && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Informacoes Adicionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {prescription.recommendations && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Recomendacoes
                  </p>
                  <p className="whitespace-pre-wrap">{prescription.recommendations}</p>
                </div>
              )}
              {prescription.warnings && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Alertas
                  </p>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{prescription.warnings}</AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Signature Info */}
        {prescription.status === PrescriptionStatus.SIGNED && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenTool className="h-5 w-5" />
                Assinatura Digital
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium text-green-700">
                  Prescricao assinada digitalmente
                </span>
              </div>
              {prescription.signedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Assinada em</p>
                  <p className="font-medium">
                    {format(parseISO(prescription.signedAt), "dd/MM/yyyy 'as' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
              )}
              {prescription.validationCode && (
                <div>
                  <p className="text-sm text-muted-foreground">Codigo de Validacao</p>
                  <p className="font-mono font-medium">{prescription.validationCode}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Print History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Historico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Criada em</p>
              <p className="font-medium">
                {format(parseISO(prescription.createdAt), "dd/MM/yyyy 'as' HH:mm", {
                  locale: ptBR,
                })}
              </p>
            </div>
            {prescription.expirationDate && (
              <div>
                <p className="text-sm text-muted-foreground">Validade</p>
                <p className="font-medium">
                  {format(parseISO(prescription.expirationDate), 'dd/MM/yyyy')}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Impressoes</p>
              <p className="font-medium">{prescription.printCount} vez(es)</p>
            </div>
            {prescription.lastPrintedAt && (
              <div>
                <p className="text-sm text-muted-foreground">Ultima impressao</p>
                <p className="font-medium">
                  {format(parseISO(prescription.lastPrintedAt), "dd/MM/yyyy 'as' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sign Dialog */}
      <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assinar Prescricao</DialogTitle>
            <DialogDescription>
              Insira sua senha do certificado digital para assinar a prescricao.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signPassword">Senha do Certificado</Label>
              <Input
                id="signPassword"
                type="password"
                value={signPassword}
                onChange={(e) => setSignPassword(e.target.value)}
                placeholder="Digite sua senha"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSignDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => signMutation.mutate()}
              disabled={!signPassword || signMutation.isPending}
            >
              {signMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PenTool className="mr-2 h-4 w-4" />
              )}
              Assinar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Prescricao</DialogTitle>
            <DialogDescription>
              Informe o motivo do cancelamento. Esta acao nao pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cancelReason">Motivo do Cancelamento *</Label>
              <Textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Informe o motivo..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate()}
              disabled={!cancelReason.trim() || cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Prescricao</DialogTitle>
            <DialogDescription>
              Escolha como deseja enviar a prescricao para o paciente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSendChannel('email')}
                className={`p-4 rounded-lg border text-center transition-colors ${
                  sendChannel === 'email'
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted'
                }`}
              >
                <Mail className="h-6 w-6 mx-auto mb-2" />
                <p className="font-medium">Email</p>
              </button>
              <button
                type="button"
                onClick={() => setSendChannel('whatsapp')}
                className={`p-4 rounded-lg border text-center transition-colors ${
                  sendChannel === 'whatsapp'
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted'
                }`}
              >
                <MessageSquare className="h-6 w-6 mx-auto mb-2" />
                <p className="font-medium">WhatsApp</p>
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => sendMutation.mutate()}
              disabled={sendMutation.isPending}
            >
              {sendMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
