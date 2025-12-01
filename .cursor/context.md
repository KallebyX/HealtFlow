# HEALTHFLOW - Contexto do Projeto

## Visão Geral

HEALTHFLOW é um sistema completo de gestão de saúde enterprise-grade, construído como monorepo com as seguintes tecnologias:

- **Backend**: NestJS + Prisma + PostgreSQL + Redis
- **Frontend Web**: Next.js 14 + TailwindCSS + shadcn/ui
- **Mobile**: React Native + Expo + NativeWind
- **Infra**: Docker + Kubernetes + GitHub Actions

## Módulos do Sistema

### Core
1. **Auth** - Autenticação JWT com refresh tokens
2. **Patients** - Gestão de pacientes com histórico médico
3. **Doctors** - Gestão de médicos e especialidades
4. **Clinics** - Multi-tenancy para clínicas

### Operacional
5. **Appointments** - Agendamentos com slots dinâmicos
6. **Consultations** - Consultas médicas com SOAP notes
7. **Prescriptions** - Prescrições digitais
8. **Laboratory** - Exames e resultados

### Avançado
9. **Telemedicine** - Videochamadas com LiveKit
10. **Gamification** - Sistema de pontos, níveis e badges
11. **Billing** - Faturamento e integração Stripe
12. **Notifications** - Multi-canal (Email, SMS, Push, WhatsApp)

### Integrações
13. **FHIR R4** - Padrão internacional de dados de saúde
14. **RNDS** - Rede Nacional de Dados em Saúde (Brasil)
15. **TISS** - Padrão para convênios médicos

## Estrutura do Monorepo

```
healthflow/
├── apps/
│   ├── api/           # NestJS Backend
│   ├── web/           # Next.js Frontend
│   └── mobile/        # React Native App
├── packages/
│   ├── database/      # Prisma schema
│   ├── shared/        # Tipos compartilhados
│   ├── ui/            # Componentes React
│   └── config/        # Configs compartilhadas
├── infrastructure/
│   ├── docker/
│   └── kubernetes/
└── docs/
```

## Banco de Dados

PostgreSQL com Prisma ORM. Principais entidades:
- User, Patient, Doctor, Clinic
- Appointment, Consultation, Prescription
- Laboratory, Exam, Result
- Payment, Invoice, Transaction
- GamificationProfile, Badge, Achievement

## APIs Externas

- **Stripe**: Pagamentos
- **LiveKit**: Videochamadas
- **SendGrid**: Email
- **Twilio**: SMS/WhatsApp
- **Firebase**: Push notifications
- **RNDS**: Saúde Brasil

## Variáveis de Ambiente

Principais variáveis necessárias:
- DATABASE_URL
- REDIS_URL
- JWT_SECRET, JWT_REFRESH_SECRET
- STRIPE_SECRET_KEY
- LIVEKIT_API_KEY, LIVEKIT_API_SECRET
- SENDGRID_API_KEY
- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN

## Estado Atual

- **Fase**: 1 - Foundation
- **Progresso**: Iniciando setup do monorepo
