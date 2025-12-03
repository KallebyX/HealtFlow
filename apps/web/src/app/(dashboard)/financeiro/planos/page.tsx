'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  X,
  Sparkles,
  Users,
  HardDrive,
  Calendar,
  CreditCard,
  AlertTriangle,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { plansApi, subscriptionsApi } from '@/lib/api/financial';
import {
  formatCurrency,
  getBillingCycleLabel,
  getSubscriptionStatusLabel,
  getSubscriptionStatusColor,
  getPlanTypeLabel,
  BillingCycle,
  SubscriptionStatus,
  PlanType,
} from '@/types/financial';
import type { Plan } from '@/types/financial';

export default function PlanosPage() {
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = React.useState<Plan | null>(null);
  const [billingCycle, setBillingCycle] = React.useState<BillingCycle>(BillingCycle.MONTHLY);
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  const [showCancelDialog, setShowCancelDialog] = React.useState(false);

  // Queries
  const { data: plans, isLoading: loadingPlans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansApi.getActive(),
  });

  const { data: subscription, isLoading: loadingSubscription } = useQuery({
    queryKey: ['subscription', 'current'],
    queryFn: () => subscriptionsApi.getCurrent(),
  });

  // Mutations
  const subscribeMutation = useMutation({
    mutationFn: ({ planId, cycle }: { planId: string; cycle: string }) =>
      subscriptionsApi.subscribe(planId, cycle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      setShowConfirmDialog(false);
      setSelectedPlan(null);
    },
  });

  const changePlanMutation = useMutation({
    mutationFn: (planId: string) => subscriptionsApi.changePlan(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      setShowConfirmDialog(false);
      setSelectedPlan(null);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => subscriptionsApi.cancel(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      setShowCancelDialog(false);
    },
  });

  const toggleAutoRenewMutation = useMutation({
    mutationFn: (autoRenew: boolean) => subscriptionsApi.toggleAutoRenew(autoRenew),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });

  const getPriceWithCycle = (plan: Plan, cycle: BillingCycle) => {
    const basePrice = plan.price;
    switch (cycle) {
      case BillingCycle.QUARTERLY:
        return basePrice * 3 * 0.95; // 5% discount
      case BillingCycle.SEMIANNUAL:
        return basePrice * 6 * 0.9; // 10% discount
      case BillingCycle.ANNUAL:
        return basePrice * 12 * 0.8; // 20% discount
      default:
        return basePrice;
    }
  };

  const getDiscountPercentage = (cycle: BillingCycle) => {
    switch (cycle) {
      case BillingCycle.QUARTERLY:
        return 5;
      case BillingCycle.SEMIANNUAL:
        return 10;
      case BillingCycle.ANNUAL:
        return 20;
      default:
        return 0;
    }
  };

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowConfirmDialog(true);
  };

  const handleConfirm = () => {
    if (!selectedPlan) return;

    if (subscription) {
      changePlanMutation.mutate(selectedPlan.id);
    } else {
      subscribeMutation.mutate({ planId: selectedPlan.id, cycle: billingCycle });
    }
  };

  const daysUntilRenewal = subscription?.nextBillingDate
    ? differenceInDays(parseISO(subscription.nextBillingDate), new Date())
    : null;

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Financeiro', href: '/financeiro' },
          { label: 'Planos' },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Planos e Assinatura</h1>
        <p className="text-muted-foreground">
          Gerencie sua assinatura e escolha o melhor plano
        </p>
      </div>

      {/* Current Subscription */}
      {loadingSubscription ? (
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      ) : subscription ? (
        <Card
          className={
            subscription.status === SubscriptionStatus.PAST_DUE
              ? 'border-red-300 bg-red-50'
              : subscription.status === SubscriptionStatus.TRIAL
              ? 'border-blue-300 bg-blue-50'
              : ''
          }
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Sua Assinatura Atual
                  <Badge className={getSubscriptionStatusColor(subscription.status)}>
                    {getSubscriptionStatusLabel(subscription.status)}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Plano {subscription.plan?.name} - {getBillingCycleLabel(subscription.billingCycle)}
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {formatCurrency(subscription.currentPrice)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{subscription.billingCycle === BillingCycle.MONTHLY ? 'mes' : 'periodo'}
                  </span>
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Proxima cobranca</p>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(subscription.nextBillingDate), "dd 'de' MMMM", {
                      locale: ptBR,
                    })}
                    {daysUntilRenewal !== null && (
                      <span className="ml-1">({daysUntilRenewal} dias)</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Renovacao automatica</p>
                  <p className="text-sm text-muted-foreground">
                    {subscription.autoRenew ? 'Ativada' : 'Desativada'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Assinante desde</p>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(subscription.startDate), "dd 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>
            </div>

            {subscription.status === SubscriptionStatus.PAST_DUE && (
              <div className="mt-4 flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                <p className="text-sm">
                  Sua assinatura esta com pagamento pendente. Regularize para evitar
                  interrupcao.
                </p>
              </div>
            )}

            {subscription.status === SubscriptionStatus.TRIAL && subscription.trialEndDate && (
              <div className="mt-4 flex items-center gap-2 text-blue-700">
                <Sparkles className="h-5 w-5" />
                <p className="text-sm">
                  Periodo de teste ate{' '}
                  {format(parseISO(subscription.trialEndDate), "dd 'de' MMMM", {
                    locale: ptBR,
                  })}
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                toggleAutoRenewMutation.mutate(!subscription.autoRenew)
              }
              disabled={toggleAutoRenewMutation.isPending}
            >
              {subscription.autoRenew ? 'Desativar' : 'Ativar'} renovacao automatica
            </Button>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700"
              onClick={() => setShowCancelDialog(true)}
            >
              Cancelar assinatura
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sem assinatura ativa</h3>
            <p className="text-muted-foreground text-center mb-4">
              Escolha um plano abaixo para comecar a usar todos os recursos
            </p>
          </CardContent>
        </Card>
      )}

      {/* Billing Cycle Selector */}
      <div className="flex items-center justify-center gap-4 p-4 bg-muted rounded-lg">
        <span className="text-sm font-medium">Ciclo de cobranca:</span>
        <Select
          value={billingCycle}
          onValueChange={(v) => setBillingCycle(v as BillingCycle)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={BillingCycle.MONTHLY}>Mensal</SelectItem>
            <SelectItem value={BillingCycle.QUARTERLY}>
              Trimestral (5% desc.)
            </SelectItem>
            <SelectItem value={BillingCycle.SEMIANNUAL}>
              Semestral (10% desc.)
            </SelectItem>
            <SelectItem value={BillingCycle.ANNUAL}>Anual (20% desc.)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {loadingPlans
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            ))
          : plans?.map((plan) => {
              const price = getPriceWithCycle(plan, billingCycle);
              const discount = getDiscountPercentage(billingCycle);
              const isCurrentPlan = subscription?.planId === plan.id;
              const isUpgrade =
                subscription?.plan &&
                Object.values(PlanType).indexOf(plan.type) >
                  Object.values(PlanType).indexOf(subscription.plan.type as PlanType);

              return (
                <Card
                  key={plan.id}
                  className={`relative ${plan.isPopular ? 'border-blue-500 shadow-lg' : ''} ${
                    isCurrentPlan ? 'border-green-500' : ''
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-blue-500">Mais Popular</Badge>
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-green-500">Plano Atual</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="mb-4">
                      <span className="text-4xl font-bold">{formatCurrency(price)}</span>
                      <span className="text-muted-foreground">
                        /{getBillingCycleLabel(billingCycle).toLowerCase()}
                      </span>
                      {discount > 0 && (
                        <Badge variant="outline" className="ml-2 text-green-600">
                          -{discount}%
                        </Badge>
                      )}
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-3 text-left">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {plan.maxUsers === -1 ? 'Usuarios ilimitados' : `Ate ${plan.maxUsers} usuarios`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {plan.maxAppointments === -1
                            ? 'Agendamentos ilimitados'
                            : `Ate ${plan.maxAppointments} agendamentos/mes`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{plan.maxStorage} GB de armazenamento</span>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-2 text-left">
                      {plan.features.slice(0, 5).map((feature) => (
                        <div key={feature.id} className="flex items-center gap-2">
                          {feature.included ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-gray-300" />
                          )}
                          <span
                            className={`text-sm ${!feature.included ? 'text-muted-foreground' : ''}`}
                          >
                            {feature.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={plan.isPopular ? 'default' : 'outline'}
                      disabled={isCurrentPlan || plan.type === PlanType.FREE}
                      onClick={() => handleSelectPlan(plan)}
                    >
                      {isCurrentPlan
                        ? 'Plano Atual'
                        : plan.type === PlanType.FREE
                        ? 'Gratuito'
                        : isUpgrade
                        ? 'Fazer Upgrade'
                        : 'Selecionar'}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
      </div>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {subscription ? 'Alterar Plano' : 'Confirmar Assinatura'}
            </DialogTitle>
            <DialogDescription>
              {subscription
                ? `Deseja alterar para o plano ${selectedPlan?.name}?`
                : `Confirme sua assinatura do plano ${selectedPlan?.name}`}
            </DialogDescription>
          </DialogHeader>
          {selectedPlan && (
            <div className="py-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div>
                  <p className="font-semibold">{selectedPlan.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {getBillingCycleLabel(billingCycle)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {formatCurrency(getPriceWithCycle(selectedPlan, billingCycle))}
                  </p>
                  {getDiscountPercentage(billingCycle) > 0 && (
                    <p className="text-sm text-green-600">
                      Economia de {getDiscountPercentage(billingCycle)}%
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={subscribeMutation.isPending || changePlanMutation.isPending}
            >
              {subscribeMutation.isPending || changePlanMutation.isPending
                ? 'Processando...'
                : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Assinatura</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar sua assinatura? Voce perdera acesso aos
              recursos premium.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Atencao</p>
                  <p className="text-sm text-yellow-700">
                    Sua assinatura continuara ativa ate o fim do periodo atual. Apos
                    isso, voce sera movido para o plano gratuito.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Manter Assinatura
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Cancelando...' : 'Confirmar Cancelamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
