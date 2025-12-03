'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Plus,
  Trash2,
  User,
  Stethoscope,
  Pill,
  Search,
  Loader2,
  AlertCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { prescriptionsApi } from '@/lib/api/prescriptions';
import { patientsApi } from '@/lib/api/patients';
import {
  PrescriptionType,
  MedicationType,
  RouteOfAdministration,
  getPrescriptionTypeLabel,
  getMedicationTypeLabel,
  getRouteLabel,
} from '@/types/prescription';

const medicationSchema = z.object({
  medicationName: z.string().min(1, 'Nome do medicamento obrigatorio'),
  activeIngredient: z.string().optional(),
  concentration: z.string().optional(),
  pharmaceuticalForm: z.string().optional(),
  medicationType: z.nativeEnum(MedicationType),
  quantity: z.number().min(1, 'Quantidade obrigatoria'),
  unit: z.string().min(1, 'Unidade obrigatoria'),
  dosage: z.string().min(1, 'Posologia obrigatoria'),
  frequency: z.string().min(1, 'Frequencia obrigatoria'),
  duration: z.string().optional(),
  route: z.nativeEnum(RouteOfAdministration),
  instructions: z.string().optional(),
  continuousUse: z.boolean().optional(),
  substituteAllowed: z.boolean().optional(),
});

const createPrescriptionSchema = z.object({
  patientId: z.string().min(1, 'Selecione um paciente'),
  type: z.nativeEnum(PrescriptionType),
  medications: z.array(medicationSchema).min(1, 'Adicione ao menos um medicamento'),
  recommendations: z.string().optional(),
  warnings: z.string().optional(),
});

type CreatePrescriptionForm = z.infer<typeof createPrescriptionSchema>;

const defaultMedication = {
  medicationName: '',
  activeIngredient: '',
  concentration: '',
  pharmaceuticalForm: '',
  medicationType: MedicationType.GENERIC,
  quantity: 1,
  unit: 'comprimido(s)',
  dosage: '',
  frequency: '',
  duration: '',
  route: RouteOfAdministration.ORAL,
  instructions: '',
  continuousUse: false,
  substituteAllowed: true,
};

export default function NovaPrescricaoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId');

  const [error, setError] = React.useState<string | null>(null);
  const [patientSearch, setPatientSearch] = React.useState('');

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreatePrescriptionForm>({
    resolver: zodResolver(createPrescriptionSchema),
    defaultValues: {
      patientId: preselectedPatientId || '',
      type: PrescriptionType.SIMPLE,
      medications: [defaultMedication],
      recommendations: '',
      warnings: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'medications',
  });

  // Fetch patients
  const { data: patientsData, isLoading: loadingPatients } = useQuery({
    queryKey: ['patients-search', patientSearch],
    queryFn: () => patientsApi.list({ search: patientSearch, limit: 20 }),
    enabled: patientSearch.length >= 2 || !!preselectedPatientId,
  });

  // Fetch selected patient
  const { data: selectedPatient } = useQuery({
    queryKey: ['patient', watch('patientId')],
    queryFn: () => patientsApi.getById(watch('patientId')),
    enabled: !!watch('patientId'),
  });

  const patients = patientsData?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (data: CreatePrescriptionForm) => prescriptionsApi.create(data),
    onSuccess: (prescription) => {
      router.push(`/prescricoes/${prescription.id}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erro ao criar prescricao');
    },
  });

  const onSubmit = (data: CreatePrescriptionForm) => {
    setError(null);
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Prescricoes', href: '/prescricoes' },
          { label: 'Nova Prescricao' },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nova Prescricao</h1>
          <p className="text-muted-foreground">
            Crie uma nova prescricao medica
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/prescricoes')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Patient Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Paciente
            </CardTitle>
            <CardDescription>
              Selecione o paciente para a prescricao
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar paciente por nome ou CPF..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {loadingPatients ? (
              <Skeleton className="h-20" />
            ) : patientSearch.length >= 2 && patients.length > 0 ? (
              <div className="max-h-48 overflow-y-auto space-y-2">
                {patients.map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => {
                      setValue('patientId', patient.id);
                      setPatientSearch('');
                    }}
                    className={`w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors ${
                      watch('patientId') === patient.id ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
                    <p className="font-medium">
                      {patient.socialName || patient.fullName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      CPF: {patient.cpf}
                    </p>
                  </button>
                ))}
              </div>
            ) : null}

            {selectedPatient && (
              <div className="rounded-lg border border-primary bg-primary/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {selectedPatient.socialName || selectedPatient.fullName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      CPF: {selectedPatient.cpf}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {errors.patientId && (
              <p className="text-sm text-destructive">{errors.patientId.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Prescription Type */}
        <Card>
          <CardHeader>
            <CardTitle>Tipo de Prescricao</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              defaultValue={PrescriptionType.SIMPLE}
              onValueChange={(value) => setValue('type', value as PrescriptionType)}
            >
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(PrescriptionType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {getPrescriptionTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Medications */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Medicamentos
                </CardTitle>
                <CardDescription>
                  Adicione os medicamentos da prescricao
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => append(defaultMedication)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {fields.map((field, index) => (
              <div key={field.id} className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Medicamento {index + 1}</h4>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Nome do Medicamento *</Label>
                    <Input
                      {...register(`medications.${index}.medicationName`)}
                      placeholder="Ex: Dipirona Sodica"
                    />
                    {errors.medications?.[index]?.medicationName && (
                      <p className="text-sm text-destructive">
                        {errors.medications[index]?.medicationName?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Principio Ativo</Label>
                    <Input
                      {...register(`medications.${index}.activeIngredient`)}
                      placeholder="Ex: Metamizol Sodico"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Concentracao</Label>
                    <Input
                      {...register(`medications.${index}.concentration`)}
                      placeholder="Ex: 500mg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      defaultValue={MedicationType.GENERIC}
                      onValueChange={(value) =>
                        setValue(`medications.${index}.medicationType`, value as MedicationType)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(MedicationType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {getMedicationTypeLabel(type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Via de Administracao</Label>
                    <Select
                      defaultValue={RouteOfAdministration.ORAL}
                      onValueChange={(value) =>
                        setValue(`medications.${index}.route`, value as RouteOfAdministration)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(RouteOfAdministration).map((route) => (
                          <SelectItem key={route} value={route}>
                            {getRouteLabel(route)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Quantidade *</Label>
                    <Input
                      type="number"
                      min={1}
                      {...register(`medications.${index}.quantity`, { valueAsNumber: true })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Unidade *</Label>
                    <Input
                      {...register(`medications.${index}.unit`)}
                      placeholder="Ex: comprimido(s), ml"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Posologia *</Label>
                    <Input
                      {...register(`medications.${index}.dosage`)}
                      placeholder="Ex: 1 comprimido"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Frequencia *</Label>
                    <Input
                      {...register(`medications.${index}.frequency`)}
                      placeholder="Ex: 8 em 8 horas"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Duracao</Label>
                    <Input
                      {...register(`medications.${index}.duration`)}
                      placeholder="Ex: 7 dias"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label>Instrucoes Adicionais</Label>
                    <Textarea
                      {...register(`medications.${index}.instructions`)}
                      placeholder="Ex: Tomar apos as refeicoes"
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center space-x-4 sm:col-span-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`continuous-${index}`}
                        onCheckedChange={(checked) =>
                          setValue(`medications.${index}.continuousUse`, checked as boolean)
                        }
                      />
                      <Label htmlFor={`continuous-${index}`} className="cursor-pointer">
                        Uso continuo
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`substitute-${index}`}
                        defaultChecked
                        onCheckedChange={(checked) =>
                          setValue(`medications.${index}.substituteAllowed`, checked as boolean)
                        }
                      />
                      <Label htmlFor={`substitute-${index}`} className="cursor-pointer">
                        Permite substituicao
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {errors.medications?.message && (
              <p className="text-sm text-destructive">{errors.medications.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Informacoes Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Recomendacoes</Label>
              <Textarea
                {...register('recommendations')}
                placeholder="Orientacoes gerais ao paciente..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Alertas</Label>
              <Textarea
                {...register('warnings')}
                placeholder="Alertas importantes sobre a prescricao..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/prescricoes')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Criar Prescricao
          </Button>
        </div>
      </form>
    </div>
  );
}
