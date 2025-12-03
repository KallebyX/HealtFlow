'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  UserRound,
  Stethoscope,
  Phone,
  Mail,
  ArrowLeft,
  Loader2,
  Plus,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { doctorsApi } from '@/lib/api/doctors';
import { Gender } from '@/types/auth';

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

const COMMON_SPECIALTIES = [
  'Cardiologia',
  'Dermatologia',
  'Endocrinologia',
  'Gastroenterologia',
  'Geriatria',
  'Ginecologia e Obstetricia',
  'Medicina de Familia',
  'Neurologia',
  'Oftalmologia',
  'Ortopedia',
  'Otorrinolaringologia',
  'Pediatria',
  'Pneumologia',
  'Psiquiatria',
  'Urologia',
];

const createDoctorSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(8, 'Senha deve ter no minimo 8 caracteres'),
  confirmPassword: z.string(),
  fullName: z.string().min(3, 'Nome deve ter no minimo 3 caracteres'),
  socialName: z.string().optional(),
  cpf: z.string().length(11, 'CPF deve ter 11 digitos'),
  birthDate: z.string().min(1, 'Data de nascimento obrigatoria'),
  gender: z.nativeEnum(Gender),
  phone: z.string().min(10, 'Telefone invalido'),
  crm: z.string().min(1, 'CRM obrigatorio'),
  crmState: z.string().length(2, 'Estado do CRM obrigatorio'),
  specialties: z.array(z.string()).min(1, 'Selecione ao menos uma especialidade'),
  subspecialties: z.array(z.string()).optional(),
  rqe: z.array(z.string()).optional(),
  cns: z.string().optional(),
  bio: z.string().optional(),
  appointmentDuration: z.number().min(10).max(120).optional(),
  telemedicineEnabled: z.boolean().optional(),
  termsAccepted: z.boolean().refine((val) => val === true, 'Aceite os termos'),
  privacyAccepted: z.boolean().refine((val) => val === true, 'Aceite a politica de privacidade'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas nao conferem',
  path: ['confirmPassword'],
});

type CreateDoctorForm = z.infer<typeof createDoctorSchema>;

export default function NovoDoctorPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [newSpecialty, setNewSpecialty] = React.useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateDoctorForm>({
    resolver: zodResolver(createDoctorSchema),
    defaultValues: {
      specialties: [],
      subspecialties: [],
      rqe: [],
      appointmentDuration: 30,
      telemedicineEnabled: false,
      termsAccepted: false,
      privacyAccepted: false,
    },
  });

  const specialties = watch('specialties') || [];
  const subspecialties = watch('subspecialties') || [];
  const rqeList = watch('rqe') || [];

  const { data: availableSpecialties } = useQuery({
    queryKey: ['specialties'],
    queryFn: () => doctorsApi.getSpecialties(),
  });

  const specialtiesList = availableSpecialties || COMMON_SPECIALTIES;

  const createMutation = useMutation({
    mutationFn: (data: CreateDoctorForm) => {
      const { confirmPassword, ...submitData } = data;
      return doctorsApi.create(submitData);
    },
    onSuccess: (doctor) => {
      router.push(`/medicos/${doctor.id}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erro ao cadastrar medico');
    },
  });

  const onSubmit = (data: CreateDoctorForm) => {
    setError(null);
    createMutation.mutate(data);
  };

  const addSpecialty = (specialty: string) => {
    if (specialty && !specialties.includes(specialty)) {
      setValue('specialties', [...specialties, specialty]);
    }
    setNewSpecialty('');
  };

  const removeSpecialty = (specialty: string) => {
    setValue('specialties', specialties.filter((s) => s !== specialty));
  };

  const addSubspecialty = (sub: string) => {
    if (sub && !subspecialties.includes(sub)) {
      setValue('subspecialties', [...subspecialties, sub]);
    }
  };

  const removeSubspecialty = (sub: string) => {
    setValue('subspecialties', subspecialties.filter((s) => s !== sub));
  };

  const addRQE = (rqe: string) => {
    if (rqe && !rqeList.includes(rqe)) {
      setValue('rqe', [...rqeList, rqe]);
    }
  };

  const removeRQE = (rqe: string) => {
    setValue('rqe', rqeList.filter((r) => r !== rqe));
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Medicos', href: '/medicos' },
          { label: 'Novo Medico' },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Novo Medico</h1>
          <p className="text-muted-foreground">
            Cadastre um novo medico no sistema
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/medicos')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Dados de Acesso
            </CardTitle>
            <CardDescription>
              Informacoes para login no sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="medico@exemplo.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="********"
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5" />
              Dados Pessoais
            </CardTitle>
            <CardDescription>
              Informacoes pessoais do medico
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo *</Label>
              <Input
                id="fullName"
                placeholder="Dr. Joao Silva"
                {...register('fullName')}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="socialName">Nome Social</Label>
              <Input
                id="socialName"
                placeholder="Nome social (opcional)"
                {...register('socialName')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                placeholder="00000000000"
                maxLength={11}
                {...register('cpf')}
              />
              {errors.cpf && (
                <p className="text-sm text-destructive">{errors.cpf.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">Data de Nascimento *</Label>
              <Input
                id="birthDate"
                type="date"
                {...register('birthDate')}
              />
              {errors.birthDate && (
                <p className="text-sm text-destructive">{errors.birthDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Genero *</Label>
              <Select
                onValueChange={(value) => setValue('gender', value as Gender)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Gender.MALE}>Masculino</SelectItem>
                  <SelectItem value={Gender.FEMALE}>Feminino</SelectItem>
                  <SelectItem value={Gender.OTHER}>Outro</SelectItem>
                  <SelectItem value={Gender.PREFER_NOT_TO_SAY}>
                    Prefiro nao informar
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && (
                <p className="text-sm text-destructive">{errors.gender.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                placeholder="(11) 99999-9999"
                {...register('phone')}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Professional Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Dados Profissionais
            </CardTitle>
            <CardDescription>
              Informacoes do registro profissional
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="crm">CRM *</Label>
                <Input
                  id="crm"
                  placeholder="123456"
                  {...register('crm')}
                />
                {errors.crm && (
                  <p className="text-sm text-destructive">{errors.crm.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="crmState">Estado do CRM *</Label>
                <Select
                  onValueChange={(value) => setValue('crmState', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRAZILIAN_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.crmState && (
                  <p className="text-sm text-destructive">{errors.crmState.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cns">CNS</Label>
                <Input
                  id="cns"
                  placeholder="CNS (opcional)"
                  {...register('cns')}
                />
              </div>
            </div>

            {/* Specialties */}
            <div className="space-y-2">
              <Label>Especialidades *</Label>
              <div className="flex gap-2">
                <Select onValueChange={addSpecialty} value={newSpecialty}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione uma especialidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialtiesList
                      .filter((s) => !specialties.includes(s))
                      .map((specialty) => (
                        <SelectItem key={specialty} value={specialty}>
                          {specialty}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              {specialties.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {specialties.map((specialty) => (
                    <Badge key={specialty} variant="secondary" className="gap-1">
                      {specialty}
                      <button
                        type="button"
                        onClick={() => removeSpecialty(specialty)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              {errors.specialties && (
                <p className="text-sm text-destructive">{errors.specialties.message}</p>
              )}
            </div>

            {/* RQE */}
            <div className="space-y-2">
              <Label>RQE (Registro de Qualificacao de Especialista)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Numero do RQE"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.currentTarget;
                      addRQE(input.value);
                      input.value = '';
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    const input = (e.currentTarget.previousSibling as HTMLInputElement);
                    addRQE(input.value);
                    input.value = '';
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {rqeList.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {rqeList.map((rqe) => (
                    <Badge key={rqe} variant="outline" className="gap-1">
                      RQE {rqe}
                      <button
                        type="button"
                        onClick={() => removeRQE(rqe)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Appointment Duration */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="appointmentDuration">Duracao da Consulta (minutos)</Label>
                <Input
                  id="appointmentDuration"
                  type="number"
                  min={10}
                  max={120}
                  {...register('appointmentDuration', { valueAsNumber: true })}
                />
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="telemedicineEnabled"
                  onCheckedChange={(checked) =>
                    setValue('telemedicineEnabled', checked as boolean)
                  }
                />
                <Label htmlFor="telemedicineEnabled" className="cursor-pointer">
                  Habilitar Telemedicina
                </Label>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Biografia</Label>
              <Textarea
                id="bio"
                placeholder="Breve descricao sobre o medico, formacao e experiencia..."
                rows={4}
                {...register('bio')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Termos e Condicoes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="termsAccepted"
                onCheckedChange={(checked) =>
                  setValue('termsAccepted', checked as boolean)
                }
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="termsAccepted" className="cursor-pointer">
                  Li e aceito os{' '}
                  <a href="/termos" target="_blank" className="text-primary underline">
                    Termos de Uso
                  </a>{' '}
                  *
                </Label>
              </div>
            </div>
            {errors.termsAccepted && (
              <p className="text-sm text-destructive">{errors.termsAccepted.message}</p>
            )}

            <div className="flex items-start space-x-2">
              <Checkbox
                id="privacyAccepted"
                onCheckedChange={(checked) =>
                  setValue('privacyAccepted', checked as boolean)
                }
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="privacyAccepted" className="cursor-pointer">
                  Li e aceito a{' '}
                  <a href="/privacidade" target="_blank" className="text-primary underline">
                    Politica de Privacidade
                  </a>{' '}
                  *
                </Label>
              </div>
            </div>
            {errors.privacyAccepted && (
              <p className="text-sm text-destructive">{errors.privacyAccepted.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/medicos')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Cadastrar Medico
          </Button>
        </div>
      </form>
    </div>
  );
}
