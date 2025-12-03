// ============================================================
// LANDING PAGE
// Página inicial do HealthFlow
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Calendar,
  FileText,
  Video,
  Pill,
  TestTubes,
  Shield,
  Users,
  BarChart3,
  Trophy,
  Bell,
  Globe,
  CheckCircle2,
  ArrowRight,
  Star,
} from 'lucide-react';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from '@/components/ui';

export const metadata: Metadata = {
  title: 'HealthFlow - Sistema de Gestao de Saude',
  description: 'Sistema completo de gestao de saude para clinicas e consultorios. Agendamentos, prontuarios, telemedicina, receituario digital e muito mais.',
};

const features = [
  {
    icon: Calendar,
    title: 'Agenda Inteligente',
    description: 'Gerencie agendamentos com facilidade. Confirmacao automatica, lembretes por WhatsApp e verificacao de conflitos.',
  },
  {
    icon: FileText,
    title: 'Prontuario Eletronico',
    description: 'Prontuario completo com anamnese, SOAP notes, historico e anexos. Tudo em um so lugar.',
  },
  {
    icon: Video,
    title: 'Telemedicina',
    description: 'Consultas por video com qualidade HD. Sala de espera virtual, chat e gravacao de consultas.',
  },
  {
    icon: Pill,
    title: 'Receituario Digital',
    description: 'Prescricoes com assinatura digital ICP-Brasil. Integracao com farmacias e verificacao de interacoes.',
  },
  {
    icon: TestTubes,
    title: 'Exames e Laboratorio',
    description: 'Solicitacao de exames, upload de resultados e alertas de valores criticos automaticos.',
  },
  {
    icon: Shield,
    title: 'Seguranca Total',
    description: 'Dados criptografados, autenticacao 2FA, auditoria completa. Conformidade com LGPD.',
  },
  {
    icon: Users,
    title: 'Multiusuario',
    description: 'Controle de acesso por perfil. Medicos, enfermeiros, recepcionistas e gestores em um so sistema.',
  },
  {
    icon: BarChart3,
    title: 'Relatorios e Analytics',
    description: 'Dashboards em tempo real, KPIs clinicos e financeiros. Tome decisoes baseadas em dados.',
  },
  {
    icon: Trophy,
    title: 'Gamificacao',
    description: 'Engaje pacientes com sistema de pontos, badges e desafios de saude. Aumente a adesao ao tratamento.',
  },
  {
    icon: Bell,
    title: 'Notificacoes Multi-canal',
    description: 'Envie lembretes por Push, SMS, Email e WhatsApp. Automatize a comunicacao com pacientes.',
  },
  {
    icon: Globe,
    title: 'Integracoes',
    description: 'Conecte-se com RNDS, laboratorios, convenios e farmacias. Compativel com FHIR R4 e TISS.',
  },
];

const plans = [
  {
    name: 'Starter',
    description: 'Para consultorios individuais',
    price: 'R$ 197',
    period: '/mes',
    features: [
      'Ate 1 profissional',
      'Agendamentos ilimitados',
      'Prontuario eletronico',
      'Receituario digital',
      '500 pacientes',
      'Suporte por email',
    ],
    popular: false,
  },
  {
    name: 'Professional',
    description: 'Para clinicas em crescimento',
    price: 'R$ 497',
    period: '/mes',
    features: [
      'Ate 5 profissionais',
      'Tudo do Starter',
      'Telemedicina',
      'Exames laboratoriais',
      'Pacientes ilimitados',
      'Relatorios avancados',
      'Integracoes',
      'Suporte prioritario',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    description: 'Para grandes organizacoes',
    price: 'Sob consulta',
    period: '',
    features: [
      'Profissionais ilimitados',
      'Tudo do Professional',
      'Multi-clinicas',
      'API personalizada',
      'SLA garantido',
      'Gerente de sucesso dedicado',
      'Treinamento presencial',
      'Customizacoes',
    ],
    popular: false,
  },
];

const testimonials = [
  {
    name: 'Dra. Maria Silva',
    role: 'Cardiologista',
    avatar: 'MS',
    content: 'O HealthFlow transformou minha clinica. Antes eu perdia horas com papelada, agora tenho tudo organizado e acessivel.',
    rating: 5,
  },
  {
    name: 'Dr. Carlos Santos',
    role: 'Clinico Geral',
    avatar: 'CS',
    content: 'A telemedicina do HealthFlow e impecavel. Consigo atender pacientes de outras cidades com a mesma qualidade.',
    rating: 5,
  },
  {
    name: 'Ana Oliveira',
    role: 'Gestora de Clinica',
    avatar: 'AO',
    content: 'Os relatorios financeiros me ajudam a tomar decisoes estrategicas. Aumentamos o faturamento em 40% apos a implantacao.',
    rating: 5,
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="container relative">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6">
              Novo: Integracao com RNDS do DATASUS
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Gestao de saude{' '}
              <span className="text-primary">inteligente</span> para sua clinica
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              Sistema completo para clinicas e consultorios. Agendamentos, prontuarios,
              telemedicina, receituario digital e muito mais em uma unica plataforma.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/registro">
                  Comecar gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/#demo">Ver demonstracao</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              14 dias gratis. Sem cartao de credito. Cancele quando quiser.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-20 bg-muted/50">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              Tudo que voce precisa em um so lugar
            </h2>
            <p className="mt-4 text-muted-foreground">
              Funcionalidades completas para gerenciar sua clinica com eficiencia
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="border-0 shadow-sm">
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="mt-4">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              Planos para todos os tamanhos
            </h2>
            <p className="mt-4 text-muted-foreground">
              Escolha o plano ideal para sua clinica. Todos incluem suporte e atualizacoes.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={plan.popular ? 'border-primary shadow-lg' : ''}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge>Mais popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-8 w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    asChild
                  >
                    <Link href="/registro">
                      {plan.price === 'Sob consulta' ? 'Falar com vendas' : 'Comecar agora'}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              O que nossos clientes dizem
            </h2>
            <p className="mt-4 text-muted-foreground">
              Mais de 500 clinicas ja confiam no HealthFlow
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name}>
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground">&ldquo;{testimonial.content}&rdquo;</p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contato" className="py-20">
        <div className="container">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="py-16 text-center">
              <h2 className="text-3xl font-bold md:text-4xl">
                Pronto para transformar sua clinica?
              </h2>
              <p className="mt-4 text-primary-foreground/80 max-w-xl mx-auto">
                Comece agora mesmo com 14 dias gratis. Sem compromisso, sem cartao de credito.
                Cancele quando quiser.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/registro">
                    Criar conta gratis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-primary-foreground/20 hover:bg-primary-foreground/10"
                  asChild
                >
                  <Link href="mailto:contato@healthflow.com.br">
                    Falar com especialista
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
