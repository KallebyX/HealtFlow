// ============================================================
// REGISTER PAGE
// Página de registro de novos pacientes
// ============================================================

'use client';

import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  Button,
  Input,
  Label,
  Checkbox,
  Alert,
  AlertDescription,
  Spinner,
  Card,
  CardContent,
} from '@/components/ui';
import { authApi, getErrorMessage } from '@/lib/api';
import { Gender } from '@/types/auth';
import { isValidCPF, formatCPF, formatPhone } from '@/lib/utils';

const registerSchema = z
  .object({
    email: z.string().email('Email invalido').min(1, 'Email e obrigatorio'),
    password: z
      .string()
      .min(8, 'Senha deve ter no minimo 8 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        'Senha deve conter maiuscula, minuscula, numero e caractere especial'
      ),
    confirmPassword: z.string().min(1, 'Confirmacao de senha e obrigatoria'),
    fullName: z
      .string()
      .min(3, 'Nome deve ter no minimo 3 caracteres')
      .max(255, 'Nome muito longo'),
    cpf: z
      .string()
      .min(11, 'CPF invalido')
      .refine((val) => isValidCPF(val), 'CPF invalido'),
    birthDate: z.string().min(1, 'Data de nascimento e obrigatoria'),
    gender: z.nativeEnum(Gender, { errorMap: () => ({ message: 'Selecione o genero' }) }),
    phone: z.string().min(10, 'Telefone invalido'),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: 'Voce deve aceitar os termos de uso',
    }),
    privacyAccepted: z.boolean().refine((val) => val === true, {
      message: 'Voce deve aceitar a politica de privacidade',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas nao conferem',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const genderOptions = [
  { value: Gender.MALE, label: 'Masculino' },
  { value: Gender.FEMALE, label: 'Feminino' },
  { value: Gender.OTHER, label: 'Outro' },
  { value: Gender.PREFER_NOT_TO_SAY, label: 'Prefiro nao dizer' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      cpf: '',
      birthDate: '',
      gender: undefined,
      phone: '',
      termsAccepted: false,
      privacyAccepted: false,
    },
  });

  async function onSubmit(data: RegisterFormData) {
    setIsLoading(true);
    setError(null);

    try {
      await authApi.registerPatient({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        cpf: data.cpf.replace(/\D/g, ''),
        birthDate: data.birthDate,
        gender: data.gender,
        phone: data.phone.replace(/\D/g, ''),
        termsAccepted: data.termsAccepted,
        privacyAccepted: data.privacyAccepted,
      });

      setSuccess(true);
      toast.success('Conta criada com sucesso!');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  // Handle CPF formatting
  function handleCPFChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      form.setValue('cpf', formatCPF(value));
    }
  }

  // Handle phone formatting
  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      form.setValue('phone', formatPhone(value));
    }
  }

  // Success state
  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Conta criada com sucesso!</h1>
          <p className="mt-2 text-muted-foreground">
            Enviamos um email de confirmacao para você. Por favor, verifique sua
            caixa de entrada para ativar sua conta.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Nao recebeu o email? Verifique sua pasta de spam ou{' '}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => {
                  // Reenviar email
                  toast.info('Email reenviado!');
                }}
              >
                clique aqui para reenviar
              </button>
            </p>
          </CardContent>
        </Card>
        <Button asChild className="w-full">
          <Link href="/login">Ir para o login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Criar conta</h1>
        <p className="mt-2 text-muted-foreground">
          Preencha os dados abaixo para criar sua conta
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Nome completo */}
        <div className="space-y-2">
          <Label htmlFor="fullName">Nome completo *</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Seu nome completo"
            {...form.register('fullName')}
            disabled={isLoading}
            autoComplete="name"
          />
          {form.formState.errors.fullName && (
            <p className="text-sm text-destructive">
              {form.formState.errors.fullName.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            {...form.register('email')}
            disabled={isLoading}
            autoComplete="email"
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        {/* CPF e Telefone */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF *</Label>
            <Input
              id="cpf"
              type="text"
              placeholder="000.000.000-00"
              value={form.watch('cpf')}
              onChange={handleCPFChange}
              disabled={isLoading}
            />
            {form.formState.errors.cpf && (
              <p className="text-sm text-destructive">
                {form.formState.errors.cpf.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(00) 00000-0000"
              value={form.watch('phone')}
              onChange={handlePhoneChange}
              disabled={isLoading}
              autoComplete="tel"
            />
            {form.formState.errors.phone && (
              <p className="text-sm text-destructive">
                {form.formState.errors.phone.message}
              </p>
            )}
          </div>
        </div>

        {/* Data de nascimento e Gênero */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="birthDate">Data de nascimento *</Label>
            <Input
              id="birthDate"
              type="date"
              {...form.register('birthDate')}
              disabled={isLoading}
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
            <select
              id="gender"
              {...form.register('gender')}
              disabled={isLoading}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Selecione...</option>
              {genderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {form.formState.errors.gender && (
              <p className="text-sm text-destructive">
                {form.formState.errors.gender.message}
              </p>
            )}
          </div>
        </div>

        {/* Senha */}
        <div className="space-y-2">
          <Label htmlFor="password">Senha *</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Minimo 8 caracteres"
              {...form.register('password')}
              disabled={isLoading}
              autoComplete="new-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {form.formState.errors.password && (
            <p className="text-sm text-destructive">
              {form.formState.errors.password.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            A senha deve conter maiuscula, minuscula, numero e caractere especial
          </p>
        </div>

        {/* Confirmar senha */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar senha *</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Digite a senha novamente"
              {...form.register('confirmPassword')}
              disabled={isLoading}
              autoComplete="new-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {form.formState.errors.confirmPassword && (
            <p className="text-sm text-destructive">
              {form.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Termos e Privacidade */}
        <div className="space-y-3">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="termsAccepted"
              {...form.register('termsAccepted')}
              disabled={isLoading}
              className="mt-1"
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="termsAccepted" className="text-sm font-normal cursor-pointer">
                Li e aceito os{' '}
                <Link href="/termos" className="text-primary hover:underline">
                  Termos de Uso
                </Link>{' '}
                *
              </Label>
              {form.formState.errors.termsAccepted && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.termsAccepted.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="privacyAccepted"
              {...form.register('privacyAccepted')}
              disabled={isLoading}
              className="mt-1"
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="privacyAccepted" className="text-sm font-normal cursor-pointer">
                Li e aceito a{' '}
                <Link href="/privacidade" className="text-primary hover:underline">
                  Politica de Privacidade
                </Link>{' '}
                *
              </Label>
              {form.formState.errors.privacyAccepted && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.privacyAccepted.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Criando conta...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Criar conta
            </>
          )}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Ja tem uma conta?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}
