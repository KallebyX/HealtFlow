# Guia do Desenvolvedor Backend

Manual completo para desenvolvimento backend com NestJS no HealtFlow.

## Sumário

1. [Visão Geral](#visão-geral)
2. [Configuração do Ambiente](#configuração-do-ambiente)
3. [Arquitetura do Backend](#arquitetura-do-backend)
4. [Estrutura de Módulos](#estrutura-de-módulos)
5. [Banco de Dados (Prisma)](#banco-de-dados-prisma)
6. [Autenticação e Autorização](#autenticação-e-autorização)
7. [Validação e DTOs](#validação-e-dtos)
8. [Tratamento de Erros](#tratamento-de-erros)
9. [Testes](#testes)
10. [Boas Práticas](#boas-práticas)

---

## Visão Geral

### Stack Tecnológico

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Node.js | 20.x | Runtime |
| NestJS | 10.3.7 | Framework |
| TypeScript | 5.4.3 | Linguagem |
| Prisma | 5.12.1 | ORM |
| PostgreSQL | 16 | Database |
| Redis | 7 | Cache/Queue |
| Bull | 4.12.2 | Job Queue |
| Jest | 29.x | Testes |

### Estrutura de Diretórios

```
apps/api/
├── src/
│   ├── main.ts                 # Entry point
│   ├── app.module.ts           # Root module
│   ├── common/                 # Utilitários compartilhados
│   │   ├── decorators/         # Decorators customizados
│   │   ├── filters/            # Exception filters
│   │   ├── guards/             # Auth/RBAC guards
│   │   ├── interceptors/       # Request/Response interceptors
│   │   ├── pipes/              # Validation pipes
│   │   └── services/           # Serviços compartilhados
│   ├── database/               # Configuração Prisma
│   └── modules/                # Módulos de negócio
│       ├── auth/
│       ├── patients/
│       ├── doctors/
│       ├── appointments/
│       ├── consultations/
│       ├── prescriptions/
│       ├── laboratory/
│       ├── telemedicine/
│       ├── billing/
│       ├── notifications/
│       ├── gamification/
│       ├── analytics/
│       └── integrations/
├── prisma/
│   ├── schema.prisma          # Schema do banco
│   ├── migrations/            # Migrações
│   └── seed.ts                # Dados iniciais
├── test/                      # Testes E2E
├── Dockerfile                 # Container config
├── nest-cli.json             # NestJS CLI config
└── package.json
```

---

## Configuração do Ambiente

### 1. Instalação

```bash
# Clone o repositório
git clone https://github.com/KallebyX/HealtFlow.git
cd HealtFlow

# Instale dependências
pnpm install

# Configure variáveis de ambiente
cp .env.example .env
```

### 2. Variáveis de Ambiente

```env
# Aplicação
NODE_ENV=development
API_PORT=3001
API_PREFIX=api/v1

# Database
DATABASE_URL="postgresql://healthflow:healthflow@localhost:5432/healthflow?schema=public"
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# 2FA
TOTP_ISSUER=HealtFlow
TOTP_SECRET_LENGTH=20

# Encryption
ENCRYPTION_KEY=your-32-char-encryption-key-here

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

### 3. Serviços Docker

```bash
# Iniciar serviços de desenvolvimento
docker-compose up -d

# Verificar status
docker-compose ps

# Logs
docker-compose logs -f api

# Parar serviços
docker-compose down
```

### 4. Database Setup

```bash
# Gerar cliente Prisma
pnpm db:generate

# Executar migrações
pnpm db:migrate

# Popular banco com dados de teste
pnpm db:seed

# Abrir Prisma Studio
pnpm db:studio
```

---

## Arquitetura do Backend

### Diagrama de Camadas

```
┌─────────────────────────────────────────────────────────────────┐
│                       Controllers                                │
│  • Recebem requisições HTTP                                     │
│  • Validam entrada com DTOs                                     │
│  • Delegam para Services                                        │
│  • Retornam respostas formatadas                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Services                                  │
│  • Implementam lógica de negócio                                │
│  • Orquestram operações                                         │
│  • Emitem eventos                                               │
│  • Aplicam regras de domínio                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Repositories                               │
│  • Abstraem acesso a dados                                      │
│  • Prisma Client                                                │
│  • Redis Cache                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Database                                  │
│  • PostgreSQL (dados principais)                                │
│  • Redis (cache, sessions, queues)                              │
│  • MinIO/S3 (arquivos)                                          │
└─────────────────────────────────────────────────────────────────┘
```

### Fluxo de Requisição

```
Request → Guards → Interceptors → Pipes → Controller → Service → Database
                                                               ↓
Response ← Interceptors ← Filters ← Controller ← Service ← Result
```

---

## Estrutura de Módulos

### Anatomia de um Módulo

```
modules/patients/
├── patients.module.ts       # Configuração do módulo
├── patients.controller.ts   # Endpoints REST
├── patients.service.ts      # Lógica de negócio
├── dto/
│   ├── create-patient.dto.ts
│   ├── update-patient.dto.ts
│   └── query-patient.dto.ts
└── entities/
    └── patient.entity.ts    # Tipos/interfaces
```

### Exemplo: Module

```typescript
// patients.module.ts
import { Module } from '@nestjs/common';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
```

### Exemplo: Controller

```typescript
// patients.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { QueryPatientDto } from './dto/query-patient.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Patients')
@ApiBearerAuth()
@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Criar novo paciente' })
  create(@Body() createPatientDto: CreatePatientDto) {
    return this.patientsService.create(createPatientDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  @ApiOperation({ summary: 'Listar pacientes' })
  findAll(@Query() query: QueryPatientDto) {
    return this.patientsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar paciente por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.patientsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar paciente' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePatientDto: UpdatePatientDto,
  ) {
    return this.patientsService.update(id, updatePatientDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_ADMIN)
  @ApiOperation({ summary: 'Remover paciente' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.patientsService.remove(id);
  }
}
```

### Exemplo: Service

```typescript
// patients.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { QueryPatientDto } from './dto/query-patient.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PatientsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreatePatientDto) {
    // Verificar se CPF já existe
    const existing = await this.prisma.patient.findUnique({
      where: { cpf: dto.cpf },
    });

    if (existing) {
      throw new ConflictException('CPF já cadastrado');
    }

    // Criar usuário e paciente em transação
    const patient = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          password: dto.password, // Hash aplicado via middleware
          role: 'PATIENT',
        },
      });

      return tx.patient.create({
        data: {
          userId: user.id,
          cpf: dto.cpf,
          fullName: dto.fullName,
          birthDate: dto.birthDate,
          gender: dto.gender,
          phone: dto.phone,
          bloodType: dto.bloodType,
        },
        include: { user: true },
      });
    });

    // Emitir evento
    this.eventEmitter.emit('patient.created', { patientId: patient.id });

    return patient;
  }

  async findAll(query: QueryPatientDto) {
    const { page = 1, limit = 10, search, status } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { cpf: { contains: search } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ],
      }),
      ...(status && { user: { status } }),
    };

    const [patients, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        skip,
        take: limit,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.patient.count({ where }),
    ]);

    return {
      data: patients,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        user: true,
        appointments: {
          take: 10,
          orderBy: { dateTime: 'desc' },
        },
        consultations: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado');
    }

    return patient;
  }

  async update(id: string, dto: UpdatePatientDto) {
    await this.findOne(id); // Verifica existência

    return this.prisma.patient.update({
      where: { id },
      data: dto,
      include: { user: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    // Soft delete - mantém dados para auditoria
    return this.prisma.patient.update({
      where: { id },
      data: {
        user: {
          update: { status: 'INACTIVE' },
        },
      },
    });
  }
}
```

---

## Banco de Dados (Prisma)

### Schema Principal

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Enums
enum UserRole {
  SUPER_ADMIN
  ADMIN
  CLINIC_ADMIN
  DOCTOR
  NURSE
  PATIENT
  RECEPTIONIST
  // ... outros roles
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  PENDING_VERIFICATION
}

// Models
model User {
  id                String     @id @default(uuid())
  email             String     @unique
  password          String
  role              UserRole   @default(PATIENT)
  status            UserStatus @default(PENDING_VERIFICATION)
  twoFactorEnabled  Boolean    @default(false)
  twoFactorSecret   String?
  lastLoginAt       DateTime?
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt

  patient   Patient?
  doctor    Doctor?
  sessions  Session[]
  auditLogs AuditLog[]

  @@index([email])
  @@index([role])
  @@map("users")
}

model Patient {
  id           String    @id @default(uuid())
  userId       String    @unique
  cpf          String    @unique
  fullName     String
  birthDate    DateTime
  gender       Gender
  phone        String?
  bloodType    BloodType?
  allergies    String[]

  // Gamification
  points       Int       @default(0)
  level        Int       @default(1)
  streakDays   Int       @default(0)

  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  user          User           @relation(fields: [userId], references: [id])
  appointments  Appointment[]
  consultations Consultation[]
  prescriptions Prescription[]
  labOrders     LabOrder[]

  @@index([cpf])
  @@index([fullName])
  @@map("patients")
}

model Doctor {
  id              String   @id @default(uuid())
  userId          String   @unique
  crm             String   @unique
  crmState        String
  specialty       String
  subspecialties  String[]
  cns             String?
  digitalCertPath String?

  telemedicineEnabled Boolean @default(true)
  appointmentDuration Int     @default(30)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user          User           @relation(fields: [userId], references: [id])
  appointments  Appointment[]
  consultations Consultation[]
  prescriptions Prescription[]

  @@index([crm])
  @@map("doctors")
}
```

### Comandos Prisma

```bash
# Gerar cliente
npx prisma generate

# Criar migração
npx prisma migrate dev --name nome_da_migracao

# Aplicar migrações em produção
npx prisma migrate deploy

# Reset database (CUIDADO!)
npx prisma migrate reset

# Abrir Studio
npx prisma studio

# Formatar schema
npx prisma format

# Validar schema
npx prisma validate
```

### Queries Avançadas

```typescript
// Transações
const result = await prisma.$transaction(async (tx) => {
  const patient = await tx.patient.create({ data: patientData });
  await tx.auditLog.create({
    data: { action: 'CREATE', entity: 'PATIENT', entityId: patient.id },
  });
  return patient;
});

// Queries complexas com relacionamentos
const consultations = await prisma.consultation.findMany({
  where: {
    patient: { userId: currentUserId },
    createdAt: { gte: startDate, lte: endDate },
  },
  include: {
    doctor: { include: { user: true } },
    prescriptions: true,
    labOrders: { include: { examType: true } },
  },
  orderBy: { createdAt: 'desc' },
});

// Aggregations
const stats = await prisma.appointment.groupBy({
  by: ['status'],
  _count: { status: true },
  where: { clinicId },
});

// Raw queries (quando necessário)
const results = await prisma.$queryRaw`
  SELECT
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as count
  FROM appointments
  WHERE clinic_id = ${clinicId}
  GROUP BY month
  ORDER BY month DESC
`;
```

---

## Autenticação e Autorização

### JWT Strategy

```typescript
// strategies/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { patient: true, doctor: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      patient: user.patient,
      doctor: user.doctor,
    };
  }
}
```

### Guards

```typescript
// guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}

// guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}
```

### Decorators

```typescript
// decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

// decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
```

### Uso nos Controllers

```typescript
@Controller('consultations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsultationsController {
  @Post()
  @Roles(UserRole.DOCTOR)
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateConsultationDto,
  ) {
    return this.service.create(user.doctor.id, dto);
  }

  @Get('my-consultations')
  @Roles(UserRole.PATIENT)
  async getMyConsultations(@CurrentUser('id') userId: string) {
    return this.service.findByPatient(userId);
  }
}
```

---

## Validação e DTOs

### Exemplo de DTO

```typescript
// dto/create-patient.dto.ts
import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  Length,
  MinLength,
  Matches,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Gender, BloodType } from '@prisma/client';

export class CreatePatientDto {
  @ApiProperty({ example: 'joao@email.com' })
  @IsEmail({}, { message: 'Email inválido' })
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @ApiProperty({ example: 'Senha@123' })
  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Senha deve conter maiúscula, minúscula, número e símbolo',
  })
  password: string;

  @ApiProperty({ example: 'João da Silva' })
  @IsString()
  @Length(3, 100)
  @Transform(({ value }) => value.trim())
  fullName: string;

  @ApiProperty({ example: '12345678901' })
  @IsString()
  @Length(11, 11, { message: 'CPF deve ter 11 dígitos' })
  @Matches(/^\d{11}$/, { message: 'CPF deve conter apenas números' })
  cpf: string;

  @ApiProperty({ example: '1990-05-15' })
  @IsDateString()
  birthDate: string;

  @ApiProperty({ enum: Gender })
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional({ example: '11999999999' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{10,11}$/, { message: 'Telefone inválido' })
  phone?: string;

  @ApiPropertyOptional({ enum: BloodType })
  @IsOptional()
  @IsEnum(BloodType)
  bloodType?: BloodType;

  @ApiPropertyOptional({ example: ['Penicilina', 'Dipirona'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];
}
```

### Validação Global

```typescript
// main.ts
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // Remove campos não declarados
      forbidNonWhitelisted: true,  // Erro se campos extras
      transform: true,        // Transforma tipos automaticamente
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen(3001);
}
```

---

## Tratamento de Erros

### Exception Filter Global

```typescript
// filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error: typeof message === 'string' ? { message } : message,
    };

    // Log apenas erros de servidor
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : '',
      );
    }

    response.status(status).json(errorResponse);
  }
}
```

### Exceções Customizadas

```typescript
// exceptions/business.exception.ts
import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(message: string, code: string) {
    super(
      {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        error: 'Business Rule Violation',
        code,
        message,
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

// Uso
throw new BusinessException(
  'Paciente já possui consulta agendada neste horário',
  'DUPLICATE_APPOINTMENT',
);
```

---

## Testes

### Unit Tests

```typescript
// patients.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PatientsService } from './patients.service';
import { PrismaService } from '../../database/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('PatientsService', () => {
  let service: PatientsService;
  let prisma: PrismaService;

  const mockPrisma = {
    patient: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    user: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      email: 'test@test.com',
      password: 'Password@123',
      fullName: 'Test Patient',
      cpf: '12345678901',
      birthDate: '1990-01-01',
      gender: 'MALE' as const,
    };

    it('should create a patient successfully', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockResolvedValue({
        id: 'patient-id',
        ...createDto,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'patient.created',
        expect.any(Object),
      );
    });

    it('should throw ConflictException if CPF exists', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue({ id: 'existing-id' });

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return a patient', async () => {
      const patient = { id: 'patient-id', fullName: 'Test' };
      mockPrisma.patient.findUnique.mockResolvedValue(patient);

      const result = await service.findOne('patient-id');

      expect(result).toEqual(patient);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
```

### E2E Tests

```typescript
// test/patients.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('PatientsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get(PrismaService);

    // Login para obter token
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'Admin@123' });
    authToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /patients', () => {
    it('should create a patient', () => {
      return request(app.getHttpServer())
        .post('/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'newpatient@test.com',
          password: 'Password@123',
          fullName: 'New Patient',
          cpf: '98765432100',
          birthDate: '1990-01-01',
          gender: 'MALE',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.fullName).toBe('New Patient');
        });
    });

    it('should return 400 for invalid data', () => {
      return request(app.getHttpServer())
        .post('/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'invalid' })
        .expect(400);
    });
  });

  describe('GET /patients', () => {
    it('should return paginated patients', () => {
      return request(app.getHttpServer())
        .get('/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeInstanceOf(Array);
          expect(res.body.meta).toBeDefined();
        });
    });
  });
});
```

### Executando Testes

```bash
# Unit tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage

# E2E tests
pnpm test:e2e

# Teste específico
pnpm test -- --testPathPattern=patients
```

---

## Boas Práticas

### 1. Organização de Código

```typescript
// ✅ BOM: Separação clara de responsabilidades
@Controller('patients')
export class PatientsController {
  constructor(private readonly service: PatientsService) {}

  @Get()
  findAll(@Query() query: QueryDto) {
    return this.service.findAll(query);
  }
}

// ❌ RUIM: Lógica de negócio no controller
@Controller('patients')
export class PatientsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll() {
    const patients = await this.prisma.patient.findMany();
    // Lógica de negócio aqui...
    return patients.map(p => ({ ...p, age: calculateAge(p.birthDate) }));
  }
}
```

### 2. Tratamento de Erros

```typescript
// ✅ BOM: Erros específicos e informativos
async findOne(id: string) {
  const patient = await this.prisma.patient.findUnique({ where: { id } });

  if (!patient) {
    throw new NotFoundException(`Paciente com ID ${id} não encontrado`);
  }

  return patient;
}

// ❌ RUIM: Erros genéricos
async findOne(id: string) {
  const patient = await this.prisma.patient.findUnique({ where: { id } });

  if (!patient) {
    throw new Error('Not found');
  }

  return patient;
}
```

### 3. Logging

```typescript
// ✅ BOM: Logging estruturado
import { Logger } from '@nestjs/common';

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  async create(dto: CreatePatientDto) {
    this.logger.log(`Creating patient with email: ${dto.email}`);

    try {
      const patient = await this.prisma.patient.create({ data: dto });
      this.logger.log(`Patient created: ${patient.id}`);
      return patient;
    } catch (error) {
      this.logger.error(`Failed to create patient: ${error.message}`, error.stack);
      throw error;
    }
  }
}
```

### 4. Performance

```typescript
// ✅ BOM: Seleção específica de campos
const patients = await this.prisma.patient.findMany({
  select: {
    id: true,
    fullName: true,
    email: true,
    // Apenas campos necessários
  },
});

// ✅ BOM: Paginação
const patients = await this.prisma.patient.findMany({
  skip: (page - 1) * limit,
  take: limit,
});

// ✅ BOM: Índices no Prisma schema
model Patient {
  cpf String @unique
  @@index([fullName])
  @@index([createdAt])
}
```

### 5. Segurança

```typescript
// ✅ BOM: Nunca expor senhas
const user = await this.prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    role: true,
    // password: NÃO incluir
  },
});

// ✅ BOM: Validar ownership
async updatePatient(userId: string, patientId: string, dto: UpdateDto) {
  const patient = await this.findOne(patientId);

  if (patient.userId !== userId) {
    throw new ForbiddenException('Acesso negado');
  }

  return this.prisma.patient.update({ where: { id: patientId }, data: dto });
}
```

---

## Próximos Passos

- [Documentação de APIs](../../api/README.md)
- [Guia de Integração](../../integration/README.md)
- [Guia de DevOps](../devops/README.md)
- [Arquitetura](../../architecture/README.md)
