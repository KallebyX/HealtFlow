// ============================================================
// NEW PATIENT PAGE
// Página de cadastro de novo paciente
// ============================================================

'use client';

import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Checkbox,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui';
import { patientsApi } from '@/lib/api/patients';
import { Gender, BloodType } from '@/types/patient';
import { isValidCPF, formatCPF, formatPhone, formatCEP } from '@/lib/utils';
import { getErrorMessage } from '@/lib/api';

const patientSchema = z.object({
  fullName: z.string().min(3, 'Nome deve ter no minimo 3 caracteres'),
  socialName: z.string().optional(),
  email: z.string().email('Email invalido'),
  password: z
    .string()
    .min(8, 'Senha deve ter no minimo 8 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Senha deve conter maiuscula, minuscula, numero e caractere especial'
    ),
  cpf: z.string().refine((val) => isValidCPF(val), 'CPF invalido'),
  birthDate: z.string().min(1, 'Data de nascimento e obrigatoria'),
  gender: z.nativeEnum(Gender),
  phone: z.string().min(10, 'Telefone invalido'),
  secondaryPhone: z.string().optional(),
  cns: z.string().optional(),
  bloodType: z.nativeEnum(BloodType).optional(),
  height: z.coerce.number().min(0).max(300).optional(),
  weight: z.coerce.number().min(0).max(500).optional(),
  allergies: z.string().optional(),
  // Address
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  // Emergency contact
  emergencyName: z.string().optional(),
  emergencyRelationship: z.string().optional(),
  emergencyPhone: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

const genderOptions = [
  { value: Gender.MALE, label: 'Masculino' },
  { value: Gender.FEMALE, label: 'Feminino' },
  { value: Gender.OTHER, label: 'Outro' },
  { value: Gender.PREFER_NOT_TO_SAY, label: 'Prefiro nao informar' },
];

const bloodTypeOptions = [
  { value: BloodType.A_POSITIVE, label: 'A+' },
  { value: BloodType.A_NEGATIVE, label: 'A-' },
  { value: BloodType.B_POSITIVE, label: 'B+' },
  { value: BloodType.B_NEGATIVE, label: 'B-' },
  { value: BloodType.AB_POSITIVE, label: 'AB+' },
  { value: BloodType.AB_NEGATIVE, label: 'AB-' },
  { value: BloodType.O_POSITIVE, label: 'O+' },
  { value: BloodType.O_NEGATIVE, label: 'O-' },
];

const brazilianStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

export default function NewPatientPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      fullName: '',
      socialName: '',
      email: '',
      password: '',
      cpf: '',
      birthDate: '',
      gender: undefined,
      phone: '',
      secondaryPhone: '',
      cns: '',
      bloodType: undefined,
      height: undefined,
      weight: undefined,
      allergies: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      emergencyName: '',
      emergencyRelationship: '',
      emergencyPhone: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: PatientFormData) => {
      const payload: any = {
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        socialName: data.socialName || undefined,
        cpf: data.cpf.replace(/\D/g, ''),
        birthDate: data.birthDate,
        gender: data.gender,
        phone: data.phone.replace(/\D/g, ''),
        secondaryPhone: data.secondaryPhone?.replace(/\D/g, '') || undefined,
        cns: data.cns || undefined,
        bloodType: data.bloodType || undefined,
        height: data.height || undefined,
        weight: data.weight || undefined,
        allergies: data.allergies
          ? data.allergies.split(',').map((a) => a.trim()).filter(Boolean)
          : undefined,
      };

      // Address
      if (data.street && data.number && data.neighborhood && data.city && data.state && data.zipCode) {
        payload.address = {
          street: data.street,
          number: data.number,
          complement: data.complement || undefined,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode.replace(/\D/g, ''),
          country: 'Brasil',
        };
      }

      // Emergency contact
      if (data.emergencyName && data.emergencyRelationship && data.emergencyPhone) {
        payload.emergencyContact = {
          name: data.emergencyName,
          relationship: data.emergencyRelationship,
          phone: data.emergencyPhone.replace(/\D/g, ''),
        };
      }

      return patientsApi.create(payload);
    },
    onSuccess: (patient) => {
      toast.success('Paciente cadastrado com sucesso!');
      router.push(`/pacientes/${patient.id}`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const onSubmit = (data: PatientFormData) => {
    mutation.mutate(data);
  };

  // Formatters
  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      form.setValue('cpf', formatCPF(value));
    }
  };

  const handlePhoneChange = (field: 'phone' | 'secondaryPhone' | 'emergencyPhone') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      form.setValue(field, formatPhone(value));
    }
  };

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 8) {
      form.setValue('zipCode', formatCEP(value));
    }
  };

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
            <BreadcrumbLink href="/pacientes">Pacientes</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Novo Paciente</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/pacientes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Novo Paciente</h1>
          <p className="text-muted-foreground">
            Cadastre um novo paciente no sistema
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-6">
          {/* Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle>Dados Pessoais</CardTitle>
              <CardDescription>Informacoes basicas do paciente</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo *</Label>
                <Input
                  id="fullName"
                  {...form.register('fullName')}
                  placeholder="Nome completo"
                />
                {form.formState.errors.fullName && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.fullName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="socialName">Nome Social</Label>
                <Input
                  id="socialName"
                  {...form.register('socialName')}
                  placeholder="Nome social (opcional)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  value={form.watch('cpf')}
                  onChange={handleCPFChange}
                  placeholder="000.000.000-00"
                />
                {form.formState.errors.cpf && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.cpf.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de Nascimento *</Label>
                <Input
                  id="birthDate"
                  type="date"
                  {...form.register('birthDate')}
                  max={new Date().toISOString().split('T')[0]}
                />
                {form.formState.errors.birthDate && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.birthDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Genero *</Label>
                <Select
                  value={form.watch('gender')}
                  onValueChange={(value) => form.setValue('gender', value as Gender)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {genderOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.gender && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.gender.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bloodType">Tipo Sanguineo</Label>
                <Select
                  value={form.watch('bloodType')}
                  onValueChange={(value) => form.setValue('bloodType', value as BloodType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {bloodTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Contato</CardTitle>
              <CardDescription>Informacoes de contato do paciente</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register('email')}
                  placeholder="email@exemplo.com"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...form.register('password')}
                  placeholder="Minimo 8 caracteres"
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone Principal *</Label>
                <Input
                  id="phone"
                  value={form.watch('phone')}
                  onChange={handlePhoneChange('phone')}
                  placeholder="(00) 00000-0000"
                />
                {form.formState.errors.phone && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryPhone">Telefone Secundario</Label>
                <Input
                  id="secondaryPhone"
                  value={form.watch('secondaryPhone')}
                  onChange={handlePhoneChange('secondaryPhone')}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </CardContent>
          </Card>

          {/* Health Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informacoes de Saude</CardTitle>
              <CardDescription>Dados de saude do paciente</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cns">Cartao Nacional de Saude (CNS)</Label>
                <Input
                  id="cns"
                  {...form.register('cns')}
                  placeholder="000 0000 0000 0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="height">Altura (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  {...form.register('height')}
                  placeholder="170"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  {...form.register('weight')}
                  placeholder="70.5"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="allergies">Alergias</Label>
                <Input
                  id="allergies"
                  {...form.register('allergies')}
                  placeholder="Separe por virgula: Penicilina, Dipirona, Latex"
                />
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle>Endereco</CardTitle>
              <CardDescription>Endereco do paciente (opcional)</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="zipCode">CEP</Label>
                <Input
                  id="zipCode"
                  value={form.watch('zipCode')}
                  onChange={handleCEPChange}
                  placeholder="00000-000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="street">Rua</Label>
                <Input
                  id="street"
                  {...form.register('street')}
                  placeholder="Nome da rua"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="number">Numero</Label>
                <Input
                  id="number"
                  {...form.register('number')}
                  placeholder="123"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  {...form.register('complement')}
                  placeholder="Apto 101"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  {...form.register('neighborhood')}
                  placeholder="Centro"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  {...form.register('city')}
                  placeholder="Sao Paulo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Select
                  value={form.watch('state')}
                  onValueChange={(value) => form.setValue('state', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {brazilianStates.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Contato de Emergencia</CardTitle>
              <CardDescription>Pessoa para contato em caso de emergencia</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="emergencyName">Nome</Label>
                <Input
                  id="emergencyName"
                  {...form.register('emergencyName')}
                  placeholder="Nome do contato"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyRelationship">Parentesco</Label>
                <Input
                  id="emergencyRelationship"
                  {...form.register('emergencyRelationship')}
                  placeholder="Mae, Pai, Conjuge..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">Telefone</Label>
                <Input
                  id="emergencyPhone"
                  value={form.watch('emergencyPhone')}
                  onChange={handlePhoneChange('emergencyPhone')}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/pacientes">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Paciente
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
