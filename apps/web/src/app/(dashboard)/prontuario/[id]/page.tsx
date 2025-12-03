'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
  User,
  Stethoscope,
  Heart,
  Activity,
  Thermometer,
  Scale,
  Ruler,
  Wind,
  Droplet,
  Save,
  CheckCircle,
  FileText,
  ClipboardList,
  AlertCircle,
  Loader2,
  Plus,
  X,
  Download,
  PenTool,
} from 'lucide-react';
import { format, parseISO, differenceInYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { consultationsApi } from '@/lib/api/consultations';
import {
  ConsultationStatus,
  getConsultationStatusLabel,
  getConsultationStatusColor,
  getConsultationTypeLabel,
  calculateBMI,
  getBMICategory,
} from '@/types/consultation';
import type { UpdateConsultationData, VitalSigns, SOAPNote } from '@/types/consultation';

export default function ProntuarioPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const consultationId = params.id as string;

  const [activeTab, setActiveTab] = React.useState('anamnese');
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const { data: consultation, isLoading } = useQuery({
    queryKey: ['consultation', consultationId],
    queryFn: () => consultationsApi.getById(consultationId),
    enabled: !!consultationId,
  });

  const { register, handleSubmit, watch, setValue, getValues } = useForm<UpdateConsultationData>({
    defaultValues: {
      chiefComplaint: '',
      historyOfPresentIllness: '',
      pastMedicalHistory: '',
      familyHistory: '',
      socialHistory: '',
      reviewOfSystems: '',
      physicalExam: '',
      treatmentPlan: '',
      recommendations: '',
      followUpInstructions: '',
      soapNote: {
        subjective: '',
        objective: '',
        assessment: '',
        plan: '',
      },
      vitalSigns: {},
      diagnoses: [],
    },
  });

  // Populate form when consultation loads
  React.useEffect(() => {
    if (consultation) {
      setValue('chiefComplaint', consultation.chiefComplaint || '');
      setValue('historyOfPresentIllness', consultation.historyOfPresentIllness || '');
      setValue('pastMedicalHistory', consultation.pastMedicalHistory || '');
      setValue('familyHistory', consultation.familyHistory || '');
      setValue('socialHistory', consultation.socialHistory || '');
      setValue('reviewOfSystems', consultation.reviewOfSystems || '');
      setValue('physicalExam', consultation.physicalExam || '');
      setValue('treatmentPlan', consultation.treatmentPlan || '');
      setValue('recommendations', consultation.recommendations || '');
      setValue('followUpInstructions', consultation.followUpInstructions || '');
      if (consultation.soapNote) {
        setValue('soapNote', consultation.soapNote);
      }
      if (consultation.vitalSigns) {
        setValue('vitalSigns', consultation.vitalSigns);
      }
    }
  }, [consultation, setValue]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateConsultationData) =>
      consultationsApi.update(consultationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultation', consultationId] });
      setIsSaving(false);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erro ao salvar');
      setIsSaving(false);
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => consultationsApi.complete(consultationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultation', consultationId] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erro ao finalizar consulta');
    },
  });

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    const data = getValues();
    updateMutation.mutate(data);
  };

  const handleComplete = async () => {
    await handleSave();
    completeMutation.mutate();
  };

  const handleDownloadPdf = async () => {
    try {
      const blob = await consultationsApi.generatePdf(consultationId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prontuario-${consultationId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao gerar PDF');
    }
  };

  // Calculate patient age
  const patientAge = consultation?.patient?.birthDate
    ? differenceInYears(new Date(), parseISO(consultation.patient.birthDate))
    : null;

  // Watch vital signs for BMI calculation
  const weight = watch('vitalSigns.weight');
  const height = watch('vitalSigns.height');
  const bmi = calculateBMI(weight, height);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-96 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold">Consulta nao encontrada</h2>
        <Button className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    );
  }

  const isEditable = consultation.status === ConsultationStatus.IN_PROGRESS;

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Pacientes', href: '/pacientes' },
          { label: consultation.patient?.fullName || 'Paciente', href: `/pacientes/${consultation.patientId}` },
          { label: 'Prontuario' },
        ]}
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Prontuario Eletronico</h1>
            <Badge className={getConsultationStatusColor(consultation.status)}>
              {getConsultationStatusLabel(consultation.status)}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {getConsultationTypeLabel(consultation.type)} -{' '}
            {format(parseISO(consultation.startedAt), "dd/MM/yyyy 'as' HH:mm")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          {consultation.status === ConsultationStatus.COMPLETED && (
            <Button variant="outline" onClick={handleDownloadPdf}>
              <Download className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
          )}
          {isEditable && (
            <>
              <Button variant="outline" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar
              </Button>
              <Button onClick={handleComplete} disabled={completeMutation.isPending}>
                {completeMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Finalizar Consulta
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Patient Info Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium text-lg">
                  {consultation.patient?.socialName || consultation.patient?.fullName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {patientAge} anos | {consultation.patient?.gender}
                </p>
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground">CPF</p>
                <p className="font-medium">{consultation.patient?.cpf}</p>
              </div>
              {consultation.patient?.bloodType && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Tipo Sanguineo</p>
                  <Badge variant="outline">{consultation.patient.bloodType}</Badge>
                </div>
              )}
              {consultation.patient?.allergies && consultation.patient.allergies.length > 0 && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Alergias</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {consultation.patient.allergies.map((allergy, i) => (
                      <Badge key={i} variant="destructive" className="text-xs">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => router.push(`/pacientes/${consultation.patientId}`)}
              >
                Ver prontuario completo
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Stethoscope className="h-5 w-5" />
                Medico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                Dr(a). {consultation.doctor?.socialName || consultation.doctor?.fullName}
              </p>
              <p className="text-sm text-muted-foreground">
                CRM {consultation.doctor?.crm}/{consultation.doctor?.crmState}
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {consultation.doctor?.specialties.map((spec) => (
                  <Badge key={spec} variant="secondary" className="text-xs">
                    {spec}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="anamnese">Anamnese</TabsTrigger>
                  <TabsTrigger value="sinais">Sinais Vitais</TabsTrigger>
                  <TabsTrigger value="soap">SOAP</TabsTrigger>
                  <TabsTrigger value="conduta">Conduta</TabsTrigger>
                </TabsList>

                {/* Anamnese Tab */}
                <TabsContent value="anamnese" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="chiefComplaint">Queixa Principal</Label>
                    <Textarea
                      id="chiefComplaint"
                      {...register('chiefComplaint')}
                      placeholder="Qual o motivo principal da consulta?"
                      rows={2}
                      disabled={!isEditable}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="historyOfPresentIllness">Historia da Doenca Atual (HDA)</Label>
                    <Textarea
                      id="historyOfPresentIllness"
                      {...register('historyOfPresentIllness')}
                      placeholder="Descreva a evolucao dos sintomas..."
                      rows={4}
                      disabled={!isEditable}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pastMedicalHistory">Antecedentes Pessoais</Label>
                    <Textarea
                      id="pastMedicalHistory"
                      {...register('pastMedicalHistory')}
                      placeholder="Doencas previas, cirurgias, internacoes..."
                      rows={3}
                      disabled={!isEditable}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="familyHistory">Historia Familiar</Label>
                      <Textarea
                        id="familyHistory"
                        {...register('familyHistory')}
                        placeholder="Doencas na familia..."
                        rows={3}
                        disabled={!isEditable}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="socialHistory">Historia Social</Label>
                      <Textarea
                        id="socialHistory"
                        {...register('socialHistory')}
                        placeholder="Habitos, profissao..."
                        rows={3}
                        disabled={!isEditable}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reviewOfSystems">Revisao de Sistemas</Label>
                    <Textarea
                      id="reviewOfSystems"
                      {...register('reviewOfSystems')}
                      placeholder="Revisao sistematizada..."
                      rows={3}
                      disabled={!isEditable}
                    />
                  </div>
                </TabsContent>

                {/* Vital Signs Tab */}
                <TabsContent value="sinais" className="space-y-4 mt-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-500" />
                        Pressao Arterial
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Sist."
                          {...register('vitalSigns.bloodPressureSystolic', { valueAsNumber: true })}
                          disabled={!isEditable}
                        />
                        <span className="flex items-center">/</span>
                        <Input
                          type="number"
                          placeholder="Diast."
                          {...register('vitalSigns.bloodPressureDiastolic', { valueAsNumber: true })}
                          disabled={!isEditable}
                        />
                        <span className="flex items-center text-sm text-muted-foreground">mmHg</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-pink-500" />
                        Frequencia Cardiaca
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="FC"
                          {...register('vitalSigns.heartRate', { valueAsNumber: true })}
                          disabled={!isEditable}
                        />
                        <span className="flex items-center text-sm text-muted-foreground">bpm</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Wind className="h-4 w-4 text-blue-500" />
                        Frequencia Respiratoria
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="FR"
                          {...register('vitalSigns.respiratoryRate', { valueAsNumber: true })}
                          disabled={!isEditable}
                        />
                        <span className="flex items-center text-sm text-muted-foreground">irpm</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-orange-500" />
                        Temperatura
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Temp"
                          {...register('vitalSigns.temperature', { valueAsNumber: true })}
                          disabled={!isEditable}
                        />
                        <span className="flex items-center text-sm text-muted-foreground">°C</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Droplet className="h-4 w-4 text-cyan-500" />
                        Saturacao O2
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="SpO2"
                          {...register('vitalSigns.oxygenSaturation', { valueAsNumber: true })}
                          disabled={!isEditable}
                        />
                        <span className="flex items-center text-sm text-muted-foreground">%</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Droplet className="h-4 w-4 text-red-500" />
                        Glicemia
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Glicemia"
                          {...register('vitalSigns.bloodGlucose', { valueAsNumber: true })}
                          disabled={!isEditable}
                        />
                        <span className="flex items-center text-sm text-muted-foreground">mg/dL</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Scale className="h-4 w-4 text-purple-500" />
                        Peso
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Peso"
                          {...register('vitalSigns.weight', { valueAsNumber: true })}
                          disabled={!isEditable}
                        />
                        <span className="flex items-center text-sm text-muted-foreground">kg</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-green-500" />
                        Altura
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Altura"
                          {...register('vitalSigns.height', { valueAsNumber: true })}
                          disabled={!isEditable}
                        />
                        <span className="flex items-center text-sm text-muted-foreground">cm</span>
                      </div>
                    </div>

                    {bmi && (
                      <div className="space-y-2">
                        <Label>IMC (calculado)</Label>
                        <div className="p-3 rounded-lg bg-muted">
                          <p className="text-2xl font-bold">{bmi}</p>
                          <p className="text-sm text-muted-foreground">{getBMICategory(bmi)}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="physicalExam">Exame Fisico</Label>
                    <Textarea
                      id="physicalExam"
                      {...register('physicalExam')}
                      placeholder="Descricao do exame fisico..."
                      rows={6}
                      disabled={!isEditable}
                    />
                  </div>
                </TabsContent>

                {/* SOAP Tab */}
                <TabsContent value="soap" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="subjective" className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-blue-100 text-blue-700 text-xs font-bold">
                        S
                      </span>
                      Subjetivo
                    </Label>
                    <Textarea
                      id="subjective"
                      {...register('soapNote.subjective')}
                      placeholder="O que o paciente relata..."
                      rows={4}
                      disabled={!isEditable}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="objective" className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-green-100 text-green-700 text-xs font-bold">
                        O
                      </span>
                      Objetivo
                    </Label>
                    <Textarea
                      id="objective"
                      {...register('soapNote.objective')}
                      placeholder="Achados do exame fisico e exames complementares..."
                      rows={4}
                      disabled={!isEditable}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assessment" className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-yellow-100 text-yellow-700 text-xs font-bold">
                        A
                      </span>
                      Avaliacao
                    </Label>
                    <Textarea
                      id="assessment"
                      {...register('soapNote.assessment')}
                      placeholder="Hipoteses diagnosticas e diagnosticos..."
                      rows={4}
                      disabled={!isEditable}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plan" className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-purple-100 text-purple-700 text-xs font-bold">
                        P
                      </span>
                      Plano
                    </Label>
                    <Textarea
                      id="plan"
                      {...register('soapNote.plan')}
                      placeholder="Plano terapeutico e orientacoes..."
                      rows={4}
                      disabled={!isEditable}
                    />
                  </div>
                </TabsContent>

                {/* Conduta Tab */}
                <TabsContent value="conduta" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="treatmentPlan">Plano Terapeutico</Label>
                    <Textarea
                      id="treatmentPlan"
                      {...register('treatmentPlan')}
                      placeholder="Medicamentos, procedimentos, encaminhamentos..."
                      rows={4}
                      disabled={!isEditable}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recommendations">Recomendacoes</Label>
                    <Textarea
                      id="recommendations"
                      {...register('recommendations')}
                      placeholder="Orientacoes gerais ao paciente..."
                      rows={3}
                      disabled={!isEditable}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="followUpInstructions">Instrucoes de Retorno</Label>
                    <Textarea
                      id="followUpInstructions"
                      {...register('followUpInstructions')}
                      placeholder="Quando e como retornar..."
                      rows={2}
                      disabled={!isEditable}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="followUpDate">Data de Retorno</Label>
                    <Input
                      id="followUpDate"
                      type="date"
                      {...register('followUpDate')}
                      disabled={!isEditable}
                    />
                  </div>

                  {/* Quick Actions */}
                  {isEditable && (
                    <div className="flex flex-wrap gap-2 pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push(`/prescricoes/nova?patientId=${consultation.patientId}&consultationId=${consultationId}`)}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Nova Prescricao
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push(`/exames/novo?patientId=${consultation.patientId}&consultationId=${consultationId}`)}
                      >
                        <ClipboardList className="mr-2 h-4 w-4" />
                        Solicitar Exame
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
