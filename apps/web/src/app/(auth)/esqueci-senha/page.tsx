// ============================================================
// FORGOT PASSWORD PAGE
// Página para solicitar recuperação de senha
// ============================================================

'use client';

import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import {
  Button,
  Input,
  Label,
  Alert,
  AlertDescription,
  Spinner,
  Card,
  CardContent,
} from '@/components/ui';
import { authApi, getErrorMessage } from '@/lib/api';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalido').min(1, 'Email e obrigatorio'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(data: ForgotPasswordFormData) {
    setIsLoading(true);
    setError(null);

    try {
      await authApi.forgotPassword({ email: data.email });
      setSubmittedEmail(data.email);
      setSuccess(true);
      toast.success('Email de recuperacao enviado!');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend() {
    if (!submittedEmail) return;

    setIsLoading(true);
    try {
      await authApi.forgotPassword({ email: submittedEmail });
      toast.success('Email reenviado!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
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
          <h1 className="text-2xl font-bold">Email enviado!</h1>
          <p className="mt-2 text-muted-foreground">
            Enviamos um link de recuperacao para <strong>{submittedEmail}</strong>.
            Verifique sua caixa de entrada.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              O link expira em 1 hora. Nao recebeu o email?{' '}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={handleResend}
                disabled={isLoading}
              >
                {isLoading ? 'Reenviando...' : 'Clique aqui para reenviar'}
              </button>
            </p>
          </CardContent>
        </Card>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao login
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Esqueceu sua senha?</h1>
        <p className="mt-2 text-muted-foreground">
          Informe seu email e enviaremos um link para redefinir sua senha
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            {...form.register('email')}
            disabled={isLoading}
            autoComplete="email"
            autoFocus
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Enviando...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Enviar link de recuperacao
            </>
          )}
        </Button>
      </form>

      <div className="text-center">
        <Link
          href="/login"
          className="text-sm text-muted-foreground hover:text-primary inline-flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}
