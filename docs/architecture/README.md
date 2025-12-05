# Arquitetura do Sistema HealtFlow

## Sumário

1. [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
2. [Princípios Arquiteturais](#princípios-arquiteturais)
3. [Arquitetura de Alto Nível](#arquitetura-de-alto-nível)
4. [Arquitetura de Microserviços](#arquitetura-de-microserviços)
5. [Modelo de Dados](#modelo-de-dados)
6. [Padrões de Design](#padrões-de-design)
7. [Segurança](#segurança)
8. [Escalabilidade](#escalabilidade)
9. [Decisões Arquiteturais](#decisões-arquiteturais)

---

## Visão Geral da Arquitetura

O HealtFlow foi projetado seguindo uma arquitetura **modular monolítica** com capacidade de evolução para microserviços. Esta abordagem oferece:

- **Simplicidade inicial**: Facilidade de desenvolvimento e deploy
- **Modularidade**: Separação clara de responsabilidades
- **Escalabilidade**: Preparado para crescimento horizontal
- **Manutenibilidade**: Código organizado e testável

### Diagrama de Contexto (C4 - Nível 1)

```
                                    ┌─────────────────────────────┐
                                    │        Usuários             │
                                    │  (Médicos, Pacientes, etc.) │
                                    └──────────────┬──────────────┘
                                                   │
                                    ┌──────────────▼──────────────┐
                                    │                             │
                                    │     HealtFlow System        │
                                    │                             │
                                    │  Sistema de Gestão de       │
                                    │  Saúde Inteligente          │
                                    │                             │
                                    └──────────────┬──────────────┘
                                                   │
          ┌────────────────────────────────────────┼────────────────────────────────────────┐
          │                    │                   │                   │                    │
┌─────────▼─────────┐ ┌───────▼────────┐ ┌───────▼────────┐ ┌────────▼────────┐ ┌─────────▼─────────┐
│   RNDS/DATASUS    │ │    Stripe      │ │   LiveKit      │ │    Twilio       │ │    SendGrid       │
│   (SUS Brasil)    │ │  (Pagamentos)  │ │ (Telemedicina) │ │ (SMS/WhatsApp)  │ │     (Email)       │
└───────────────────┘ └────────────────┘ └────────────────┘ └─────────────────┘ └───────────────────┘
```

### Diagrama de Containers (C4 - Nível 2)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    HealtFlow System                                          │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐                         │
│  │   Web App       │    │   Mobile App    │    │   Admin Panel   │                         │
│  │   (Next.js)     │    │ (React Native)  │    │   (Next.js)     │                         │
│  │                 │    │                 │    │                 │                         │
│  │  - Dashboard    │    │  - Login        │    │  - Gestão       │                         │
│  │  - Consultas    │    │  - Consultas    │    │  - Relatórios   │                         │
│  │  - Pacientes    │    │  - Prescrições  │    │  - Configuração │                         │
│  │  - Agenda       │    │  - Agenda       │    │                 │                         │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘                         │
│           │                      │                      │                                   │
│           └──────────────────────┼──────────────────────┘                                   │
│                                  │                                                          │
│                                  ▼                                                          │
│                    ┌─────────────────────────┐                                              │
│                    │      API Gateway        │                                              │
│                    │       (Nginx)           │                                              │
│                    │                         │                                              │
│                    │  - Rate Limiting        │                                              │
│                    │  - SSL Termination      │                                              │
│                    │  - Load Balancing       │                                              │
│                    └───────────┬─────────────┘                                              │
│                                │                                                            │
│                                ▼                                                            │
│                    ┌─────────────────────────┐                                              │
│                    │     Backend API         │                                              │
│                    │      (NestJS)           │                                              │
│                    │                         │                                              │
│                    │  Módulos:               │                                              │
│                    │  - Auth                 │                                              │
│                    │  - Patients             │                                              │
│                    │  - Doctors              │                                              │
│                    │  - Appointments         │                                              │
│                    │  - Consultations        │                                              │
│                    │  - Prescriptions        │                                              │
│                    │  - Laboratory           │                                              │
│                    │  - Telemedicine         │                                              │
│                    │  - Billing              │                                              │
│                    │  - Notifications        │                                              │
│                    │  - Gamification         │                                              │
│                    │  - Analytics            │                                              │
│                    └───────────┬─────────────┘                                              │
│                                │                                                            │
│           ┌────────────────────┼────────────────────┐                                       │
│           │                    │                    │                                       │
│           ▼                    ▼                    ▼                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                             │
│  │   PostgreSQL    │  │     Redis       │  │   MinIO/S3      │                             │
│  │   (Database)    │  │    (Cache)      │  │   (Storage)     │                             │
│  │                 │  │                 │  │                 │                             │
│  │  - 40+ tabelas  │  │  - Sessions     │  │  - Documentos   │                             │
│  │  - Full-text    │  │  - Cache        │  │  - Imagens      │                             │
│  │  - JSONB        │  │  - Queue        │  │  - Exames       │                             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                             │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Princípios Arquiteturais

### 1. **Domain-Driven Design (DDD)**

O sistema é organizado em domínios de negócio claramente definidos:

```
Domínios Principais (Bounded Contexts):
├── Identity & Access (Autenticação/Autorização)
├── Patient Management (Gestão de Pacientes)
├── Clinical Care (Atendimento Clínico)
│   ├── Appointments (Agendamento)
│   ├── Consultations (Consultas)
│   └── Prescriptions (Prescrições)
├── Diagnostics (Diagnósticos)
│   └── Laboratory (Laboratório)
├── Telemedicine (Telemedicina)
├── Financial (Financeiro)
├── Engagement (Gamificação)
└── Integration (Integrações Externas)
    ├── FHIR
    ├── RNDS
    └── Payments
```

### 2. **SOLID Principles**

- **S** - Single Responsibility: Cada módulo tem uma única responsabilidade
- **O** - Open/Closed: Aberto para extensão, fechado para modificação
- **L** - Liskov Substitution: Abstrações bem definidas
- **I** - Interface Segregation: Interfaces específicas por contexto
- **D** - Dependency Inversion: Dependências injetadas via IoC container

### 3. **Clean Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                      Frameworks & Drivers                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  Interface Adapters                  │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │              Application Layer               │   │   │
│  │  │  ┌─────────────────────────────────────┐   │   │   │
│  │  │  │         Domain/Entities             │   │   │   │
│  │  │  │                                     │   │   │   │
│  │  │  │   - Patient Entity                  │   │   │   │
│  │  │  │   - Doctor Entity                   │   │   │   │
│  │  │  │   - Appointment Entity              │   │   │   │
│  │  │  │   - Consultation Entity             │   │   │   │
│  │  │  │                                     │   │   │   │
│  │  │  └─────────────────────────────────────┘   │   │   │
│  │  │                                             │   │   │
│  │  │   - Use Cases                               │   │   │
│  │  │   - Application Services                    │   │   │
│  │  │                                             │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  │   - Controllers                                     │   │
│  │   - Presenters                                      │   │
│  │   - Gateways                                        │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│   - NestJS Framework                                        │
│   - Prisma ORM                                              │
│   - External Services                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4. **Twelve-Factor App**

O HealtFlow segue os 12 fatores para aplicações modernas:

| Fator | Implementação |
|-------|---------------|
| Codebase | Monorepo com Git |
| Dependencies | package.json + lockfile |
| Config | Variáveis de ambiente |
| Backing Services | PostgreSQL, Redis, S3 |
| Build/Release/Run | CI/CD com GitHub Actions |
| Processes | Stateless containers |
| Port Binding | Auto-contained via Docker |
| Concurrency | Horizontal scaling com K8s |
| Disposability | Fast startup/graceful shutdown |
| Dev/Prod Parity | Docker Compose/Kubernetes |
| Logs | Stdout/JSON structured |
| Admin Processes | Migrations, seeds |

---

## Arquitetura de Componentes

### Estrutura do Backend (NestJS)

```
apps/api/src/
├── main.ts                     # Entry point
├── app.module.ts               # Root module
│
├── common/                     # Shared utilities
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   ├── public.decorator.ts
│   │   └── roles.decorator.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   ├── roles.guard.ts
│   │   └── throttle.guard.ts
│   ├── interceptors/
│   │   ├── logging.interceptor.ts
│   │   └── transform.interceptor.ts
│   ├── pipes/
│   │   └── validation.pipe.ts
│   └── services/
│       ├── audit.service.ts
│       └── cache.service.ts
│
├── database/
│   ├── prisma.module.ts
│   └── prisma.service.ts
│
└── modules/
    ├── auth/
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   ├── auth.module.ts
    │   ├── dto/
    │   │   ├── login.dto.ts
    │   │   ├── register.dto.ts
    │   │   └── refresh-token.dto.ts
    │   ├── guards/
    │   │   └── local-auth.guard.ts
    │   └── strategies/
    │       ├── jwt.strategy.ts
    │       └── local.strategy.ts
    │
    ├── patients/
    │   ├── patients.controller.ts
    │   ├── patients.service.ts
    │   ├── patients.module.ts
    │   └── dto/
    │       ├── create-patient.dto.ts
    │       └── update-patient.dto.ts
    │
    ├── doctors/
    │   └── [similar structure]
    │
    ├── appointments/
    │   └── [similar structure]
    │
    ├── consultations/
    │   └── [similar structure]
    │
    ├── prescriptions/
    │   └── [similar structure]
    │
    ├── laboratory/
    │   └── [similar structure]
    │
    ├── telemedicine/
    │   └── [similar structure]
    │
    ├── billing/
    │   └── [similar structure]
    │
    ├── notifications/
    │   └── [similar structure]
    │
    ├── gamification/
    │   └── [similar structure]
    │
    ├── analytics/
    │   └── [similar structure]
    │
    └── integrations/
        ├── fhir/
        ├── rnds/
        └── storage/
```

### Estrutura do Frontend (Next.js)

```
apps/web/src/
├── app/                        # App Router (Next.js 14)
│   ├── (auth)/                # Rotas de autenticação
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   │
│   ├── (dashboard)/           # Rotas protegidas
│   │   ├── layout.tsx         # Layout com sidebar
│   │   ├── page.tsx           # Dashboard home
│   │   ├── pacientes/
│   │   │   ├── page.tsx       # Lista
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx   # Detalhes
│   │   │   └── novo/
│   │   │       └── page.tsx   # Criação
│   │   ├── medicos/
│   │   ├── agenda/
│   │   ├── consultorias/
│   │   ├── prescricoes/
│   │   ├── exames/
│   │   ├── financeiro/
│   │   └── telemedicina/
│   │
│   ├── api/                   # API Routes
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts
│   │
│   ├── layout.tsx             # Root layout
│   └── globals.css
│
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   └── navigation.tsx
│   ├── ui/                    # Componentes base (Radix)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   └── ...
│   └── data-table/
│       └── data-table.tsx
│
├── lib/
│   ├── api/                   # Funções de API
│   │   ├── patients.ts
│   │   ├── doctors.ts
│   │   └── ...
│   ├── api.ts                 # Axios instance
│   ├── auth.ts                # Auth utilities
│   └── utils.ts               # Helpers
│
├── hooks/
│   ├── use-auth.ts
│   └── use-toast.ts
│
├── providers/
│   └── providers.tsx
│
└── types/
    └── index.ts
```

---

## Modelo de Dados

### Diagrama ER (Entidades Principais)

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│      User        │       │     Patient      │       │     Doctor       │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id               │       │ id               │       │ id               │
│ email            │       │ userId       ────┼───────│ userId           │
│ password         │       │ cpf              │       │ crm              │
│ role             │       │ bloodType        │       │ specialty        │
│ status           │       │ allergies        │       │ digitalCert      │
│ twoFactorEnabled │       │ healthInsurance  │       │ cns              │
│ createdAt        │       │ gamificationStats│       │ telemedicine     │
│ updatedAt        │       │ createdAt        │       │ createdAt        │
└──────────────────┘       └──────────────────┘       └──────────────────┘
         │                          │                          │
         │                          │                          │
         │                          ▼                          │
         │                 ┌──────────────────┐                │
         │                 │   Appointment    │                │
         │                 ├──────────────────┤                │
         │                 │ id               │                │
         │                 │ patientId    ────┼────────────────┘
         │                 │ doctorId         │
         │                 │ clinicId         │
         │                 │ dateTime         │
         │                 │ type             │
         │                 │ status           │
         │                 │ createdAt        │
         │                 └──────────────────┘
         │                          │
         │                          ▼
         │                 ┌──────────────────┐
         │                 │  Consultation    │
         │                 ├──────────────────┤
         │                 │ id               │
         │                 │ appointmentId    │
         │                 │ patientId        │
         │                 │ doctorId         │
         │                 │ soapSubjective   │
         │                 │ soapObjective    │
         │                 │ soapAssessment   │
         │                 │ soapPlan         │
         │                 │ vitalSigns       │
         │                 │ digitalSignature │
         │                 │ createdAt        │
         │                 └──────────────────┘
         │                          │
         │          ┌───────────────┼───────────────┐
         │          │               │               │
         │          ▼               ▼               ▼
         │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
         │  │ Prescription │ │   LabOrder   │ │Telemedicine  │
         │  ├──────────────┤ ├──────────────┤ │   Session    │
         │  │ id           │ │ id           │ ├──────────────┤
         │  │consultation  │ │ consultation │ │ id           │
         │  │ type         │ │ examType     │ │ consultation │
         │  │ medications  │ │ status       │ │ roomUrl      │
         │  │ controlLevel │ │ results      │ │ status       │
         │  │ signature    │ │ labId        │ │ recordingUrl │
         │  │ validUntil   │ │ createdAt    │ │ createdAt    │
         │  └──────────────┘ └──────────────┘ └──────────────┘
         │
         │
         ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│     Clinic       │       │     Invoice      │       │  Notification    │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id               │       │ id               │       │ id               │
│ name             │       │ patientId        │       │ userId           │
│ cnes             │       │ clinicId         │       │ type             │
│ address          │       │ amount           │       │ title            │
│ specialties      │       │ paymentMethod    │       │ body             │
│ operatingHours   │       │ status           │       │ read             │
│ createdAt        │       │ paidAt           │       │ sentAt           │
└──────────────────┘       └──────────────────┘       └──────────────────┘
```

### Enums do Sistema

```typescript
// Roles de usuário
enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  CLINIC_ADMIN = 'CLINIC_ADMIN',
  CLINIC_MANAGER = 'CLINIC_MANAGER',
  DOCTOR = 'DOCTOR',
  NURSE = 'NURSE',
  PHARMACIST = 'PHARMACIST',
  PHYSIOTHERAPIST = 'PHYSIOTHERAPIST',
  PSYCHOLOGIST = 'PSYCHOLOGIST',
  NUTRITIONIST = 'NUTRITIONIST',
  DENTIST = 'DENTIST',
  LAB_TECHNICIAN = 'LAB_TECHNICIAN',
  LAB_MANAGER = 'LAB_MANAGER',
  RECEPTIONIST = 'RECEPTIONIST',
  BILLING_CLERK = 'BILLING_CLERK',
  SECRETARY = 'SECRETARY',
  PATIENT = 'PATIENT',
  INSURANCE_AGENT = 'INSURANCE_AGENT',
  SUPPLIER = 'SUPPLIER',
  GUEST = 'GUEST'
}

// Status de agendamento
enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  RESCHEDULED = 'RESCHEDULED'
}

// Tipos de prescrição
enum PrescriptionType {
  SIMPLE = 'SIMPLE',
  CONTROLLED = 'CONTROLLED',
  ANTIMICROBIAL = 'ANTIMICROBIAL',
  SPECIAL = 'SPECIAL'
}

// Métodos de pagamento
enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PIX = 'PIX',
  BOLETO = 'BOLETO',
  INSURANCE = 'INSURANCE',
  CASH = 'CASH'
}
```

---

## Padrões de Design

### 1. Repository Pattern

```typescript
// Interface do repositório
interface IPatientRepository {
  findById(id: string): Promise<Patient | null>;
  findByEmail(email: string): Promise<Patient | null>;
  create(data: CreatePatientDto): Promise<Patient>;
  update(id: string, data: UpdatePatientDto): Promise<Patient>;
  delete(id: string): Promise<void>;
}

// Implementação com Prisma
@Injectable()
class PatientRepository implements IPatientRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Patient | null> {
    return this.prisma.patient.findUnique({
      where: { id },
      include: { user: true }
    });
  }
  // ...
}
```

### 2. DTO (Data Transfer Object)

```typescript
// CreatePatientDto
export class CreatePatientDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  fullName: string;

  @IsString()
  @Length(11, 11)
  cpf: string;

  @IsOptional()
  @IsEnum(BloodType)
  bloodType?: BloodType;
}
```

### 3. Guard Pattern (Autenticação/Autorização)

```typescript
// JWT Auth Guard
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (isPublic) return true;
    return super.canActivate(context);
  }
}

// Roles Guard
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}
```

### 4. Interceptor Pattern

```typescript
// Logging Interceptor
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        this.logger.log(
          `${method} ${url} ${response.statusCode} - ${Date.now() - now}ms`
        );
      }),
    );
  }
}
```

### 5. Event-Driven Architecture

```typescript
// Eventos do sistema
interface AppointmentCreatedEvent {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  dateTime: Date;
}

// Emissão de evento
@Injectable()
export class AppointmentsService {
  constructor(private eventEmitter: EventEmitter2) {}

  async create(data: CreateAppointmentDto) {
    const appointment = await this.prisma.appointment.create({ data });

    this.eventEmitter.emit('appointment.created', {
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      dateTime: appointment.dateTime,
    });

    return appointment;
  }
}

// Listener do evento
@Injectable()
export class NotificationListener {
  @OnEvent('appointment.created')
  handleAppointmentCreated(event: AppointmentCreatedEvent) {
    // Enviar notificação push, email, SMS
  }
}
```

---

## Segurança

### Camadas de Segurança

```
┌─────────────────────────────────────────────────────────────┐
│                    Camada de Aplicação                       │
├─────────────────────────────────────────────────────────────┤
│  • Validação de entrada (class-validator)                   │
│  • Sanitização de dados                                     │
│  • Rate limiting por endpoint                               │
│  • CORS configurado                                         │
│  • Helmet.js (security headers)                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Camada de Autenticação                      │
├─────────────────────────────────────────────────────────────┤
│  • JWT com refresh tokens                                   │
│  • Autenticação 2FA (TOTP)                                  │
│  • Senhas com bcrypt (10 rounds)                            │
│  • Session management                                       │
│  • Device fingerprinting                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Camada de Autorização                      │
├─────────────────────────────────────────────────────────────┤
│  • RBAC (Role-Based Access Control)                         │
│  • Guards por endpoint                                      │
│  • Isolation por clínica                                    │
│  • Ownership verification                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Camada de Dados                           │
├─────────────────────────────────────────────────────────────┤
│  • Encryption at rest (PostgreSQL)                          │
│  • Encryption in transit (TLS 1.3)                          │
│  • Parametrized queries (Prisma)                            │
│  • Sensitive data masking                                   │
│  • Audit logging                                            │
└─────────────────────────────────────────────────────────────┘
```

### Headers de Segurança

```typescript
// Configuração do Helmet.js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
```

---

## Escalabilidade

### Estratégia de Escalonamento

```
                    ┌─────────────────────────────────────┐
                    │          Load Balancer              │
                    │           (Nginx/K8s)               │
                    └─────────────────┬───────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          │                           │                           │
          ▼                           ▼                           ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   API Pod #1    │       │   API Pod #2    │       │   API Pod #N    │
│                 │       │                 │       │                 │
│  - Stateless    │       │  - Stateless    │       │  - Stateless    │
│  - 2 CPU        │       │  - 2 CPU        │       │  - 2 CPU        │
│  - 2GB RAM      │       │  - 2GB RAM      │       │  - 2GB RAM      │
└────────┬────────┘       └────────┬────────┘       └────────┬────────┘
         │                         │                         │
         └─────────────────────────┼─────────────────────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
          ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │      Redis      │    │   MinIO/S3      │
│   (Primary)     │    │   (Cluster)     │    │   (Distributed) │
│        │        │    │                 │    │                 │
│        ▼        │    │  - Master       │    │  - Bucket 1     │
│   Replica #1    │    │  - Replica 1    │    │  - Bucket 2     │
│   Replica #2    │    │  - Replica 2    │    │  - Bucket N     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Horizontal Pod Autoscaling

```yaml
# HPA Configuration
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: healthflow-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: healthflow-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

---

## Decisões Arquiteturais (ADRs)

### ADR-001: Monorepo com Turborepo

**Contexto**: Precisamos gerenciar múltiplas aplicações (API, Web, Mobile) e pacotes compartilhados.

**Decisão**: Usar Turborepo para gerenciamento do monorepo.

**Consequências**:
- (+) Compartilhamento de código facilitado
- (+) Build incremental e cache
- (+) Versionamento unificado
- (-) Complexidade inicial de setup

### ADR-002: NestJS para Backend

**Contexto**: Precisamos de um framework backend robusto e escalável.

**Decisão**: Usar NestJS com TypeScript.

**Consequências**:
- (+) Arquitetura modular bem definida
- (+) Dependency Injection nativo
- (+) TypeScript first-class
- (+) Grande ecossistema de módulos
- (-) Curva de aprendizado para iniciantes

### ADR-003: PostgreSQL como Database Principal

**Contexto**: Sistema de saúde requer database confiável com suporte a dados complexos.

**Decisão**: Usar PostgreSQL 16 com Prisma ORM.

**Consequências**:
- (+) ACID compliance
- (+) JSONB para dados flexíveis
- (+) Full-text search nativo
- (+) Extensões para UUID, crypto
- (-) Requer mais recursos que databases NoSQL

### ADR-004: Next.js 14 App Router

**Contexto**: Precisamos de framework React moderno com SSR e bom DX.

**Decisão**: Usar Next.js 14 com App Router.

**Consequências**:
- (+) Server Components
- (+) Streaming e Suspense
- (+) File-based routing
- (+) Otimizações automáticas
- (-) Mudança de paradigma do Pages Router

### ADR-005: React Native + Expo para Mobile

**Contexto**: Precisamos de app mobile multiplataforma.

**Decisão**: Usar React Native com Expo managed workflow.

**Consequências**:
- (+) Código compartilhado entre iOS e Android
- (+) Expo simplifica desenvolvimento
- (+) Atualizações OTA
- (-) Limitações em funcionalidades nativas avançadas

---

## Referências

- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Native Documentation](https://reactnative.dev/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [FHIR R4 Specification](https://hl7.org/fhir/R4/)
- [Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
