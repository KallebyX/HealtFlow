// ============================================================
// LOGIN PAGE
// Página de login com suporte a 2FA
// ============================================================

'use client';

import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn, AlertCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import { Button, Input, Label, Checkbox, Alert, AlertDescription, Spinner } from '@/components/ui';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email('Email invalido').min(1, 'Email e obrigatorio'),
  password: z.string().min(1, 'Senha e obrigatoria'),
  rememberMe: z.boolean().optional(),
});

const twoFactorSchema = z.object({
  code: z.string().length(6, 'Codigo deve ter 6 digitos'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type TwoFactorFormData = z.infer<typeof twoFactorSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const errorParam = searchParams.get('error');

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const twoFactorForm = useForm<TwoFactorFormData>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: {
      code: '',
    },
  });

  async function onLoginSubmit(data: LoginFormData) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await login(data.email, data.password);

      if (result.requires2FA) {
        setCredentials({ email: data.email, password: data.password });
        setRequires2FA(true);
        toast.info('Codigo 2FA necessario');
      } else if (result.success) {
        toast.success('Login realizado com sucesso!');
        router.push(callbackUrl);
        router.refresh();
      } else {
        setError(result.error || 'Credenciais invalidas');
      }
    } catch {
      setError('Erro ao realizar login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  async function onTwoFactorSubmit(data: TwoFactorFormData) {
    if (!credentials) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await login(credentials.email, credentials.password, data.code);

      if (result.success) {
        toast.success('Login realizado com sucesso!');
        router.push(callbackUrl);
        router.refresh();
      } else {
        setError(result.error || 'Codigo invalido');
        twoFactorForm.reset();
      }
    } catch {
      setError('Erro ao verificar codigo. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleBackToLogin() {
    setRequires2FA(false);
    setCredentials(null);
    setError(null);
    twoFactorForm.reset();
  }

  // Show 2FA form
  if (requires2FA) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Verificacao em duas etapas</h1>
          <p className="mt-2 text-muted-foreground">
            Digite o codigo de 6 digitos do seu app autenticador
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={twoFactorForm.handleSubmit(onTwoFactorSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Codigo de verificacao</Label>
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              className="text-center text-2xl tracking-widest"
              {...twoFactorForm.register('code')}
              disabled={isLoading}
              autoFocus
            />
            {twoFactorForm.formState.errors.code && (
              <p className="text-sm text-destructive">
                {twoFactorForm.formState.errors.code.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Verificando...
              </>
            ) : (
              'Verificar'
            )}
          </Button>
        </form>

        <div className="text-center">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBackToLogin}
            disabled={isLoading}
          >
            Voltar ao login
          </Button>
        </div>
      </div>
    );
  }

  // Show login form
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Entrar no HealthFlow</h1>
        <p className="mt-2 text-muted-foreground">
          Digite suas credenciais para acessar o sistema
        </p>
      </div>

      {(error || errorParam) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || getErrorMessage(errorParam)}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            {...loginForm.register('email')}
            disabled={isLoading}
            autoComplete="email"
            autoFocus
          />
          {loginForm.formState.errors.email && (
            <p className="text-sm text-destructive">
              {loginForm.formState.errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link
              href="/esqueci-senha"
              className="text-sm text-primary hover:underline"
            >
              Esqueceu a senha?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="********"
              {...loginForm.register('password')}
              disabled={isLoading}
              autoComplete="current-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {loginForm.formState.errors.password && (
            <p className="text-sm text-destructive">
              {loginForm.formState.errors.password.message}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="rememberMe"
            {...loginForm.register('rememberMe')}
            disabled={isLoading}
          />
          <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
            Manter-me conectado
          </Label>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Entrando...
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" />
              Entrar
            </>
          )}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Novo por aqui?
          </span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Nao tem uma conta?{' '}
          <Link href="/registro" className="text-primary font-medium hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}

function getErrorMessage(error: string | null): string {
  switch (error) {
    case 'CredentialsSignin':
      return 'Email ou senha incorretos';
    case 'SessionRequired':
      return 'Voce precisa estar logado para acessar esta pagina';
    case 'AccessDenied':
      return 'Acesso negado';
    case 'AccountInactive':
      return 'Sua conta esta inativa. Entre em contato com o suporte.';
    case 'Unauthorized':
      return 'Voce nao tem permissao para acessar esta pagina';
    default:
      return 'Ocorreu um erro. Tente novamente.';
  }
}
