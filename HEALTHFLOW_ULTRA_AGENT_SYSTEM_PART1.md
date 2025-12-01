# HEALTHFLOW - ULTRA AGENT SYSTEM - PARTE 1
## Fundação do Projeto, Setup Inicial, Schema Prisma e Configurações Base

---

# VISÃO GERAL DO SISTEMA

## Sobre o HEALTHFLOW

O **HEALTHFLOW** é um sistema de gestão de saúde completo, enterprise-grade, desenvolvido para clínicas, consultórios e hospitais. O sistema integra:

- **Prontuário Eletrônico** (PEP) com estrutura SOAP
- **Agendamento Inteligente** com IA
- **Telemedicina** integrada
- **Prescrição Digital** com assinatura ICP-Brasil
- **Gamificação** para engajamento do paciente
- **Integrações** com FHIR, RNDS, CFM, ANVISA
- **Conformidade** total com LGPD, CFM e SBIS

---

## ARQUITETURA DO SISTEMA

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           HEALTHFLOW ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Web App   │  │ Mobile App  │  │  Admin Web  │  │  TV Display │        │
│  │  (Next.js)  │  │(React Native│  │  (Next.js)  │  │   (React)   │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │               │
│         └────────────────┴────────────────┴────────────────┘               │
│                                   │                                         │
│                          ┌────────┴────────┐                               │
│                          │   API Gateway   │                               │
│                          │    (Nginx)      │                               │
│                          └────────┬────────┘                               │
│                                   │                                         │
│  ┌────────────────────────────────┴────────────────────────────────┐       │
│  │                        NestJS API                                │       │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │       │
│  │  │   Auth   │ │ Patients │ │Scheduling│ │Consulting│           │       │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │       │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │       │
│  │  │Prescriptn│ │Telemedicn│ │Gamificatn│ │Laboratory│           │       │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │       │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │       │
│  │  │ Billing  │ │Analytics │ │Notificatn│ │  Audit   │           │       │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │       │
│  └────────────────────────────────┬────────────────────────────────┘       │
│                                   │                                         │
│         ┌─────────────────────────┼─────────────────────────┐              │
│         │                         │                         │              │
│  ┌──────┴──────┐  ┌───────────────┴───────────────┐  ┌─────┴─────┐        │
│  │ PostgreSQL  │  │           Redis               │  │   MinIO   │        │
│  │  (Primary)  │  │  (Cache + Queue + Sessions)   │  │ (Storage) │        │
│  └─────────────┘  └───────────────────────────────┘  └───────────┘        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                    EXTERNAL INTEGRATIONS                         │       │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │       │
│  │  │  FHIR  │ │  RNDS  │ │ Stripe │ │Firebase│ │LiveKit │        │       │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘        │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## FASE 1: SETUP DO PROJETO [Dias 1-14]

### 1.1 ESTRUTURA MONOREPO

#### PROMPT 1.1.1: Criar Estrutura do Monorepo
```bash
EXECUTAR SEQUÊNCIA DE COMANDOS:

# Criar diretório raiz
mkdir -p healthflow
cd healthflow

# Inicializar monorepo com Turborepo
npx create-turbo@latest . --example with-nestjs

# Estrutura de pastas
mkdir -p apps/api/src/{modules,common,database,config}
mkdir -p apps/web/src/{app,components,hooks,lib,stores,types}
mkdir -p apps/mobile/src/{app,components,hooks,lib,stores}
mkdir -p apps/admin/src
mkdir -p packages/{shared,ui,types,config}
mkdir -p infrastructure/{docker,k8s,nginx,scripts,monitoring}
mkdir -p docs/{api,architecture,guides}

# Criar arquivos de configuração base
touch .env.example
touch .env.local
touch docker-compose.yml
touch docker-compose.test.yml
touch turbo.json
touch .gitignore
touch .prettierrc
touch .eslintrc.js
```

#### PROMPT 1.1.2: Package.json Raiz
```json
CRIAR ARQUIVO: /healthflow/package.json

{
  "name": "healthflow",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "dev:api": "turbo run dev --filter=@healthflow/api",
    "dev:web": "turbo run dev --filter=@healthflow/web",
    "dev:mobile": "turbo run dev --filter=@healthflow/mobile",
    "build": "turbo run build",
    "test": "turbo run test",
    "test:e2e": "turbo run test:e2e",
    "test:coverage": "turbo run test -- --coverage",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "db:generate": "cd apps/api && npx prisma generate",
    "db:migrate": "cd apps/api && npx prisma migrate dev",
    "db:migrate:prod": "cd apps/api && npx prisma migrate deploy",
    "db:seed": "cd apps/api && npx prisma db seed",
    "db:studio": "cd apps/api && npx prisma studio",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:build": "docker-compose build",
    "prepare": "husky install"
  },
  "devDependencies": {
    "@types/node": "^20.12.0",
    "eslint": "^8.57.0",
    "husky": "^9.0.11",
    "lint-staged": "^15.2.2",
    "prettier": "^3.2.5",
    "turbo": "^1.13.2",
    "typescript": "^5.4.3"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

#### PROMPT 1.1.3: Turbo.json
```json
CRIAR ARQUIVO: /healthflow/turbo.json

{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"],
      "env": ["NODE_ENV", "DATABASE_URL", "REDIS_URL"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "type-check": {
      "outputs": []
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "env": ["NODE_ENV", "DATABASE_URL"]
    },
    "test:e2e": {
      "dependsOn": ["build"],
      "outputs": ["playwright-report/**"]
    }
  }
}
```

---

### 1.2 BACKEND API - NESTJS

#### PROMPT 1.2.1: Package.json da API
```json
CRIAR ARQUIVO: /healthflow/apps/api/package.json

{
  "name": "@healthflow/api",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "prebuild": "rimraf dist",
    "build": "nest build",
    "dev": "nest start --watch",
    "start": "node dist/main",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,test}/**/*.ts\" --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "dependencies": {
    "@nestjs/common": "^10.3.7",
    "@nestjs/config": "^3.2.2",
    "@nestjs/core": "^10.3.7",
    "@nestjs/event-emitter": "^2.0.4",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/platform-express": "^10.3.7",
    "@nestjs/platform-socket.io": "^10.3.7",
    "@nestjs/schedule": "^4.0.2",
    "@nestjs/swagger": "^7.3.1",
    "@nestjs/throttler": "^5.1.2",
    "@nestjs/websockets": "^10.3.7",
    "@nestjs/bull": "^10.1.1",
    "@prisma/client": "^5.12.1",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "passport-local": "^1.0.0",
    "bcryptjs": "^2.4.3",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "dayjs": "^1.11.10",
    "otplib": "^12.0.1",
    "qrcode": "^1.5.3",
    "uuid": "^9.0.1",
    "ioredis": "^5.3.2",
    "bull": "^4.12.2",
    "helmet": "^7.1.0",
    "compression": "^1.7.4",
    "express-rate-limit": "^7.2.0",
    "cookie-parser": "^1.4.6",
    "rxjs": "^7.8.1",
    "reflect-metadata": "^0.2.2",
    "stripe": "^15.1.0",
    "axios": "^1.6.8",
    "crypto-js": "^4.2.0",
    "jsonwebtoken": "^9.0.2",
    "@aws-sdk/client-s3": "^3.556.0",
    "@aws-sdk/s3-request-presigner": "^3.556.0",
    "firebase-admin": "^12.0.0",
    "@sendgrid/mail": "^8.1.3",
    "twilio": "^5.0.3",
    "livekit-server-sdk": "^2.2.0",
    "socket.io": "^4.7.5"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.3.2",
    "@nestjs/schematics": "^10.1.1",
    "@nestjs/testing": "^10.3.7",
    "@types/bcryptjs": "^2.4.6",
    "@types/compression": "^1.7.5",
    "@types/cookie-parser": "^1.4.7",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.12",
    "@types/node": "^20.12.5",
    "@types/passport-jwt": "^4.0.1",
    "@types/passport-local": "^1.0.38",
    "@types/qrcode": "^1.5.5",
    "@types/uuid": "^9.0.8",
    "@typescript-eslint/eslint-plugin": "^7.5.0",
    "@typescript-eslint/parser": "^7.5.0",
    "eslint": "^8.57.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.1.3",
    "jest": "^29.7.0",
    "prettier": "^3.2.5",
    "prisma": "^5.12.1",
    "rimraf": "^5.0.5",
    "source-map-support": "^0.5.21",
    "supertest": "^6.3.4",
    "ts-jest": "^29.1.2",
    "ts-loader": "^9.5.1",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.4.4"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": ["**/*.(t|j)s"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node",
    "moduleNameMapper": {
      "^@/(.*)$": "<rootDir>/$1"
    }
  }
}
```

#### PROMPT 1.2.2: Configuração TSConfig API
```json
CRIAR ARQUIVO: /healthflow/apps/api/tsconfig.json

{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["src/*"],
      "@modules/*": ["src/modules/*"],
      "@common/*": ["src/common/*"],
      "@config/*": ["src/config/*"],
      "@database/*": ["src/database/*"]
    },
    "resolveJsonModule": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

#### PROMPT 1.2.3: Nest-CLI Configuration
```json
CRIAR ARQUIVO: /healthflow/apps/api/nest-cli.json

{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "plugins": [
      {
        "name": "@nestjs/swagger",
        "options": {
          "classValidatorShim": true,
          "introspectComments": true
        }
      }
    ]
  }
}
```

---

### 1.3 VARIÁVEIS DE AMBIENTE

#### PROMPT 1.3.1: Arquivo .env.example
```env
CRIAR ARQUIVO: /healthflow/.env.example

# ═══════════════════════════════════════════════════════════════════════════
# APPLICATION
# ═══════════════════════════════════════════════════════════════════════════
NODE_ENV=development
APP_NAME=HealthFlow
APP_URL=http://localhost:3000
API_URL=http://localhost:3001
API_PORT=3001
API_PREFIX=api

# ═══════════════════════════════════════════════════════════════════════════
# DATABASE
# ═══════════════════════════════════════════════════════════════════════════
DATABASE_URL="postgresql://healthflow:healthflow@localhost:5432/healthflow?schema=public"
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# ═══════════════════════════════════════════════════════════════════════════
# REDIS
# ═══════════════════════════════════════════════════════════════════════════
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=0

# ═══════════════════════════════════════════════════════════════════════════
# JWT / AUTH
# ═══════════════════════════════════════════════════════════════════════════
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-min-32
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=healthflow
JWT_AUDIENCE=healthflow-api

# ═══════════════════════════════════════════════════════════════════════════
# 2FA
# ═══════════════════════════════════════════════════════════════════════════
TOTP_ISSUER=HealthFlow
TOTP_SECRET_LENGTH=20

# ═══════════════════════════════════════════════════════════════════════════
# ENCRYPTION
# ═══════════════════════════════════════════════════════════════════════════
ENCRYPTION_KEY=32-character-encryption-key-here
ENCRYPTION_IV_LENGTH=16

# ═══════════════════════════════════════════════════════════════════════════
# AWS / S3
# ═══════════════════════════════════════════════════════════════════════════
AWS_REGION=sa-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=healthflow-storage
AWS_S3_ENDPOINT=

# ═══════════════════════════════════════════════════════════════════════════
# MINIO (Local S3)
# ═══════════════════════════════════════════════════════════════════════════
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=healthflow

# ═══════════════════════════════════════════════════════════════════════════
# FIREBASE (Push Notifications)
# ═══════════════════════════════════════════════════════════════════════════
FIREBASE_PROJECT_ID=your-firebase-project
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"

# ═══════════════════════════════════════════════════════════════════════════
# SENDGRID (Email)
# ═══════════════════════════════════════════════════════════════════════════
SENDGRID_API_KEY=SG.xxxx
SENDGRID_FROM_EMAIL=noreply@healthflow.com.br
SENDGRID_FROM_NAME=HealthFlow

# ═══════════════════════════════════════════════════════════════════════════
# TWILIO (SMS/WhatsApp)
# ═══════════════════════════════════════════════════════════════════════════
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+15551234567
TWILIO_WHATSAPP_NUMBER=+14155238886

# ═══════════════════════════════════════════════════════════════════════════
# STRIPE (Payments)
# ═══════════════════════════════════════════════════════════════════════════
STRIPE_SECRET_KEY=sk_test_xxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxx
STRIPE_CURRENCY=brl

# ═══════════════════════════════════════════════════════════════════════════
# LIVEKIT (Video/Telemedicine)
# ═══════════════════════════════════════════════════════════════════════════
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
LIVEKIT_URL=wss://your-livekit-server.com

# ═══════════════════════════════════════════════════════════════════════════
# FHIR / RNDS
# ═══════════════════════════════════════════════════════════════════════════
FHIR_SERVER_URL=http://localhost:8080/fhir
RNDS_ENABLED=false
RNDS_ENVIRONMENT=homologation
RNDS_CLIENT_ID=your-rnds-client-id
RNDS_CERTIFICATE_PATH=/path/to/certificate.pfx
RNDS_CERTIFICATE_PASSWORD=your-certificate-password

# ═══════════════════════════════════════════════════════════════════════════
# DIGITAL SIGNATURE (ICP-Brasil)
# ═══════════════════════════════════════════════════════════════════════════
ICP_BRASIL_ENABLED=false
ICP_BRASIL_TSA_URL=http://timestamp.example.com

# ═══════════════════════════════════════════════════════════════════════════
# OPENAI (Transcrição/IA)
# ═══════════════════════════════════════════════════════════════════════════
OPENAI_API_KEY=sk-xxxx
OPENAI_MODEL=gpt-4-turbo-preview

# ═══════════════════════════════════════════════════════════════════════════
# RATE LIMITING
# ═══════════════════════════════════════════════════════════════════════════
THROTTLE_TTL=60
THROTTLE_LIMIT=100
THROTTLE_LOGIN_TTL=300
THROTTLE_LOGIN_LIMIT=5

# ═══════════════════════════════════════════════════════════════════════════
# LOGGING
# ═══════════════════════════════════════════════════════════════════════════
LOG_LEVEL=debug
LOG_FORMAT=json

# ═══════════════════════════════════════════════════════════════════════════
# CORS
# ═══════════════════════════════════════════════════════════════════════════
CORS_ORIGINS=http://localhost:3000,http://localhost:3002
CORS_CREDENTIALS=true

# ═══════════════════════════════════════════════════════════════════════════
# SESSION
# ═══════════════════════════════════════════════════════════════════════════
SESSION_SECRET=your-session-secret-min-32-characters
SESSION_MAX_AGE=86400000

# ═══════════════════════════════════════════════════════════════════════════
# AUDIT
# ═══════════════════════════════════════════════════════════════════════════
AUDIT_RETENTION_DAYS=2555
AUDIT_LOG_SENSITIVE=false
```

---

### 1.4 PRISMA SCHEMA

#### PROMPT 1.4.1: Schema Prisma Completo
```prisma
CRIAR ARQUIVO: /healthflow/apps/api/prisma/schema.prisma

// ═══════════════════════════════════════════════════════════════════════════
// PRISMA SCHEMA - HEALTHFLOW
// Sistema de Gestão de Saúde Enterprise
// ═══════════════════════════════════════════════════════════════════════════

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgcrypto, uuid_ossp]
}

// ═══════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════

enum UserRole {
  SUPER_ADMIN
  CLINIC_ADMIN
  DOCTOR
  NURSE
  RECEPTIONIST
  PATIENT
  PHARMACIST
  LAB_TECHNICIAN
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  PENDING_VERIFICATION
}

enum Gender {
  MALE
  FEMALE
  OTHER
  NOT_INFORMED
}

enum MaritalStatus {
  SINGLE
  MARRIED
  DIVORCED
  WIDOWED
  SEPARATED
  CIVIL_UNION
  OTHER
}

enum BloodType {
  A_POSITIVE
  A_NEGATIVE
  B_POSITIVE
  B_NEGATIVE
  AB_POSITIVE
  AB_NEGATIVE
  O_POSITIVE
  O_NEGATIVE
}

enum AppointmentStatus {
  SCHEDULED
  CONFIRMED
  CHECKED_IN
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
  RESCHEDULED
}

enum AppointmentType {
  FIRST_VISIT
  FOLLOW_UP
  RETURN
  EMERGENCY
  TELEMEDICINE
  EXAM
  PROCEDURE
}

enum ConsultationStatus {
  DRAFT
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum PrescriptionStatus {
  DRAFT
  SIGNED
  PARTIALLY_DISPENSED
  FULLY_DISPENSED
  CANCELLED
  EXPIRED
}

enum PrescriptionType {
  SIMPLE
  CONTROLLED
  ANTIMICROBIAL
}

enum ControlLevel {
  COMMON
  CONTROLLED_C1
  CONTROLLED_C2
  CONTROLLED_C3
  CONTROLLED_C4
  CONTROLLED_C5
  CONTROLLED_A
  CONTROLLED_B
  ANTIMICROBIAL
}

enum LabOrderStatus {
  PENDING
  COLLECTED
  PROCESSING
  COMPLETED
  RELEASED
  CANCELLED
}

enum InvoiceStatus {
  PENDING
  PARTIALLY_PAID
  PAID
  OVERDUE
  CANCELLED
  REFUNDED
}

enum PaymentMethod {
  CREDIT_CARD
  DEBIT_CARD
  PIX
  BOLETO
  CASH
  INSURANCE
  TRANSFER
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
  CANCELLED
}

enum NotificationType {
  PUSH
  EMAIL
  SMS
  WHATSAPP
  IN_APP
}

enum NotificationStatus {
  PENDING
  SENT
  DELIVERED
  READ
  FAILED
}

enum TelemedicineSessionStatus {
  SCHEDULED
  WAITING
  IN_PROGRESS
  ENDED
  CANCELLED
}

enum TriageLevel {
  RED
  YELLOW
  GREEN
  BLUE
}

enum TaskStatus {
  PENDING
  COMPLETED
  SKIPPED
  EXPIRED
}

enum AuditAction {
  CREATE
  READ
  UPDATE
  DELETE
  LOGIN
  LOGOUT
  EXPORT
  SIGN
  VERIFY
  ACCESS
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTHENTICATION & USERS
// ═══════════════════════════════════════════════════════════════════════════

model User {
  id                      String         @id @default(uuid())
  email                   String         @unique
  passwordHash            String
  role                    UserRole       @default(PATIENT)
  status                  UserStatus     @default(PENDING_VERIFICATION)
  
  // 2FA
  twoFactorEnabled        Boolean        @default(false)
  twoFactorSecret         String?
  twoFactorBackupCodes    String[]
  
  // Email verification
  emailVerified           Boolean        @default(false)
  emailVerificationToken  String?
  emailVerificationExpires DateTime?
  
  // Password reset
  passwordResetToken      String?
  passwordResetExpires    DateTime?
  
  // Session management
  lastLoginAt             DateTime?
  lastLoginIp             String?
  loginAttempts           Int            @default(0)
  lockedUntil             DateTime?
  
  // Preferences
  notificationPreferences Json?
  language                String         @default("pt-BR")
  timezone                String         @default("America/Sao_Paulo")
  
  // Timestamps
  createdAt               DateTime       @default(now())
  updatedAt               DateTime       @updatedAt
  deletedAt               DateTime?
  
  // Relations
  patient                 Patient?
  doctor                  Doctor?
  employee                Employee?
  refreshTokens           RefreshToken[]
  sessions                UserSession[]
  devices                 UserDevice[]
  notifications           Notification[]
  auditLogs               AuditLog[]     @relation("UserAuditLogs")
  performedAudits         AuditLog[]     @relation("PerformedAuditLogs")

  @@index([email])
  @@index([status])
  @@index([role])
  @@map("users")
}

model RefreshToken {
  id          String   @id @default(uuid())
  token       String   @unique
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt   DateTime
  revokedAt   DateTime?
  createdAt   DateTime @default(now())
  createdByIp String?
  userAgent   String?

  @@index([userId])
  @@index([token])
  @@map("refresh_tokens")
}

model UserSession {
  id           String    @id @default(uuid())
  userId       String
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  token        String    @unique
  ipAddress    String?
  userAgent    String?
  deviceInfo   Json?
  expiresAt    DateTime
  lastActivity DateTime  @default(now())
  revokedAt    DateTime?
  createdAt    DateTime  @default(now())

  @@index([userId])
  @@index([token])
  @@map("user_sessions")
}

model UserDevice {
  id           String   @id @default(uuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  deviceId     String
  deviceType   String
  deviceName   String?
  fcmToken     String?
  active       Boolean  @default(true)
  lastActiveAt DateTime @default(now())
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([userId, deviceId])
  @@index([fcmToken])
  @@map("user_devices")
}

// ═══════════════════════════════════════════════════════════════════════════
// PATIENTS
// ═══════════════════════════════════════════════════════════════════════════

model Patient {
  id                    String              @id @default(uuid())
  userId                String              @unique
  user                  User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Personal Info
  fullName              String
  socialName            String?
  cpf                   String              @unique
  rg                    String?
  rgIssuer              String?
  birthDate             DateTime
  gender                Gender
  maritalStatus         MaritalStatus?
  nationality           String              @default("Brasileiro")
  birthPlace            String?
  motherName            String?
  fatherName            String?
  
  // Contact
  phone                 String
  secondaryPhone        String?
  email                 String?
  
  // Address
  address               Json?               // { street, number, complement, neighborhood, city, state, zipCode, country, lat, lng }
  
  // Healthcare
  cns                   String?             @unique // Cartão Nacional de Saúde
  bloodType             BloodType?
  allergies             String[]
  chronicConditions     String[]
  currentMedications    Json[]              // [{ name, dosage, frequency, startDate }]
  familyHistory         Json[]              // [{ condition, relationship }]
  surgicalHistory       Json[]              // [{ procedure, date, hospital }]
  
  // Health Insurance
  healthInsuranceId     String?
  healthInsurance       HealthInsurance?    @relation(fields: [healthInsuranceId], references: [id])
  insuranceNumber       String?
  insuranceValidUntil   DateTime?
  
  // Biometrics
  height                Float?              // cm
  weight                Float?              // kg
  
  // Lifestyle
  smokingStatus         String?
  alcoholConsumption    String?
  physicalActivity      String?
  occupation            String?
  
  // Emergency Contact
  emergencyContact      Json?               // { name, relationship, phone }
  
  // Avatar 3D
  avatarConfig          Json?
  
  // Gamification
  totalPoints           Int                 @default(0)
  level                 Int                 @default(1)
  levelName             String              @default("Iniciante")
  currentStreak         Int                 @default(0)
  longestStreak         Int                 @default(0)
  lastActivityDate      DateTime?
  
  // Preferences
  preferredLanguage     String              @default("pt-BR")
  preferredTimezone     String              @default("America/Sao_Paulo")
  
  // Timestamps
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt
  deletedAt             DateTime?
  
  // Relations
  clinicPatients        ClinicPatient[]
  appointments          Appointment[]
  consultations         Consultation[]
  prescriptions         Prescription[]
  vitalSigns            VitalSign[]
  labOrders             LabOrder[]
  invoices              Invoice[]
  documents             PatientDocument[]
  tasks                 Task[]
  badges                PatientBadge[]
  rewards               PatientReward[]
  pointTransactions     PointTransaction[]
  wearableConnections   WearableConnection[]
  telemedicineSessions  TelemedicineSession[] @relation("PatientSessions")

  @@index([cpf])
  @@index([cns])
  @@index([fullName])
  @@map("patients")
}

model PatientDocument {
  id           String   @id @default(uuid())
  patientId    String
  patient      Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)
  type         String   // exam, prescription, medical_report, etc
  category     String?
  name         String
  description  String?
  fileUrl      String
  fileSize     Int
  mimeType     String
  uploadedBy   String
  validUntil   DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([patientId])
  @@index([type])
  @@map("patient_documents")
}

model VitalSign {
  id              String    @id @default(uuid())
  patientId       String
  patient         Patient   @relation(fields: [patientId], references: [id], onDelete: Cascade)
  consultationId  String?
  consultation    Consultation? @relation(fields: [consultationId], references: [id])
  appointmentId   String?
  appointment     Appointment? @relation(fields: [appointmentId], references: [id])
  
  // Measurements
  systolicBp      Int?      // mmHg
  diastolicBp     Int?      // mmHg
  heartRate       Int?      // bpm
  respiratoryRate Int?      // rpm
  temperature     Float?    // °C
  oxygenSaturation Int?     // %
  weight          Float?    // kg
  height          Float?    // cm
  bloodGlucose    Float?    // mg/dL
  painScale       Int?      // 0-10
  
  // Triage
  triageLevel     TriageLevel?
  triageNotes     String?
  
  // Metadata
  measuredAt      DateTime  @default(now())
  measuredBy      String?
  source          String?   // manual, wearable, device
  deviceId        String?
  
  createdAt       DateTime  @default(now())

  @@index([patientId])
  @@index([measuredAt])
  @@map("vital_signs")
}

model WearableConnection {
  id            String   @id @default(uuid())
  patientId     String
  patient       Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)
  provider      String   // healthkit, googlefit, fitbit, etc
  accessToken   String?
  refreshToken  String?
  tokenExpires  DateTime?
  lastSyncAt    DateTime?
  active        Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([patientId, provider])
  @@map("wearable_connections")
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCTORS & EMPLOYEES
// ═══════════════════════════════════════════════════════════════════════════

model Doctor {
  id                   String              @id @default(uuid())
  userId               String              @unique
  user                 User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Personal Info
  fullName             String
  socialName           String?
  cpf                  String              @unique
  birthDate            DateTime
  gender               Gender
  phone                String
  
  // Professional Info
  crm                  String
  crmState             String
  crmStatus            String              @default("ACTIVE")
  specialties          String[]
  subspecialties       String[]
  rqe                  String[]            // Registro de Qualificação de Especialista
  
  // Digital Certificate (ICP-Brasil)
  digitalCertificateId String?
  digitalCertificate   DigitalCertificate? @relation(fields: [digitalCertificateId], references: [id])
  
  // CNS
  cns                  String?
  
  // Profile
  bio                  String?
  profilePhotoUrl      String?
  signatureUrl         String?
  
  // Working Hours
  workingHours         Json?               // { monday: [{ start, end }], ... }
  appointmentDuration  Int                 @default(30) // minutes
  telemedicineEnabled  Boolean             @default(true)
  
  // Timestamps
  createdAt            DateTime            @default(now())
  updatedAt            DateTime            @updatedAt
  deletedAt            DateTime?
  
  // Relations
  clinicDoctors        ClinicDoctor[]
  appointments         Appointment[]
  consultations        Consultation[]
  prescriptions        Prescription[]
  labOrders            LabOrder[]
  telemedicineSessions TelemedicineSession[] @relation("DoctorSessions")

  @@index([crm, crmState])
  @@index([cpf])
  @@map("doctors")
}

model Employee {
  id              String          @id @default(uuid())
  userId          String          @unique
  user            User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Personal Info
  fullName        String
  cpf             String          @unique
  birthDate       DateTime
  gender          Gender
  phone           String
  
  // Professional Info
  position        String
  department      String?
  hireDate        DateTime
  
  // Timestamps
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  deletedAt       DateTime?
  
  // Relations
  clinicEmployees ClinicEmployee[]

  @@index([cpf])
  @@map("employees")
}

model DigitalCertificate {
  id              String    @id @default(uuid())
  type            String    // A1, A3
  serialNumber    String    @unique
  issuer          String
  subject         String
  validFrom       DateTime
  validUntil      DateTime
  thumbprint      String
  certificateData String?   // Encrypted
  active          Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  doctors         Doctor[]

  @@map("digital_certificates")
}

// ═══════════════════════════════════════════════════════════════════════════
// CLINICS
// ═══════════════════════════════════════════════════════════════════════════

model Clinic {
  id                  String              @id @default(uuid())
  
  // Identification
  legalName           String
  tradeName           String
  cnpj                String              @unique
  cnes                String?             @unique // Cadastro Nacional de Estabelecimentos de Saúde
  
  // Contact
  phone               String
  email               String
  website             String?
  
  // Address
  address             Json                // { street, number, complement, neighborhood, city, state, zipCode, country, lat, lng }
  
  // Settings
  settings            Json?
  workingHours        Json?               // { monday: [{ start, end }], ... }
  timezone            String              @default("America/Sao_Paulo")
  
  // Branding
  logoUrl             String?
  primaryColor        String?
  
  // Status
  active              Boolean             @default(true)
  
  // Timestamps
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt
  deletedAt           DateTime?
  
  // Relations
  clinicDoctors       ClinicDoctor[]
  clinicPatients      ClinicPatient[]
  clinicEmployees     ClinicEmployee[]
  appointments        Appointment[]
  consultations       Consultation[]
  prescriptions       Prescription[]
  labOrders           LabOrder[]
  invoices            Invoice[]
  rooms               Room[]
  analyticsSnapshots  AnalyticsSnapshot[]
  fhirResources       FhirResource[]
  telemedicineSessions TelemedicineSession[]

  @@index([cnpj])
  @@index([cnes])
  @@map("clinics")
}

model ClinicDoctor {
  id        String   @id @default(uuid())
  clinicId  String
  clinic    Clinic   @relation(fields: [clinicId], references: [id], onDelete: Cascade)
  doctorId  String
  doctor    Doctor   @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  isActive  Boolean  @default(true)
  joinedAt  DateTime @default(now())
  leftAt    DateTime?

  @@unique([clinicId, doctorId])
  @@map("clinic_doctors")
}

model ClinicPatient {
  id           String   @id @default(uuid())
  clinicId     String
  clinic       Clinic   @relation(fields: [clinicId], references: [id], onDelete: Cascade)
  patientId    String
  patient      Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)
  medicalRecord String?
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([clinicId, patientId])
  @@map("clinic_patients")
}

model ClinicEmployee {
  id         String   @id @default(uuid())
  clinicId   String
  clinic     Clinic   @relation(fields: [clinicId], references: [id], onDelete: Cascade)
  employeeId String
  employee   Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  role       String
  isActive   Boolean  @default(true)
  joinedAt   DateTime @default(now())
  leftAt     DateTime?

  @@unique([clinicId, employeeId])
  @@map("clinic_employees")
}

model Room {
  id           String        @id @default(uuid())
  clinicId     String
  clinic       Clinic        @relation(fields: [clinicId], references: [id], onDelete: Cascade)
  name         String
  type         String        // consultation, procedure, exam, etc
  floor        String?
  capacity     Int           @default(1)
  equipment    String[]
  active       Boolean       @default(true)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  
  appointments Appointment[]

  @@unique([clinicId, name])
  @@map("rooms")
}

// ═══════════════════════════════════════════════════════════════════════════
// APPOINTMENTS
// ═══════════════════════════════════════════════════════════════════════════

model Appointment {
  id               String            @id @default(uuid())
  
  // References
  patientId        String
  patient          Patient           @relation(fields: [patientId], references: [id])
  doctorId         String
  doctor           Doctor            @relation(fields: [doctorId], references: [id])
  clinicId         String
  clinic           Clinic            @relation(fields: [clinicId], references: [id])
  roomId           String?
  room             Room?             @relation(fields: [roomId], references: [id])
  
  // Scheduling
  scheduledDate    DateTime
  scheduledTime    DateTime
  duration         Int               @default(30) // minutes
  
  // Status
  status           AppointmentStatus @default(SCHEDULED)
  type             AppointmentType
  isTelemedicine   Boolean           @default(false)
  
  // Check-in
  checkedInAt      DateTime?
  queueNumber      String?
  
  // Execution
  startedAt        DateTime?
  completedAt      DateTime?
  
  // Notes
  reason           String?
  notes            String?
  internalNotes    String?
  
  // Cancellation/Reschedule
  cancelledAt      DateTime?
  cancelledBy      String?
  cancellationReason String?
  rescheduledFrom  String?
  
  // Reminders
  reminders        Json?             // { 7d: { scheduledFor, sent }, 24h: {...}, 2h: {...} }
  
  // Timestamps
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt
  
  // Relations
  consultation     Consultation?
  vitalSigns       VitalSign[]
  telemedicineSession TelemedicineSession?

  @@index([patientId])
  @@index([doctorId])
  @@index([clinicId])
  @@index([scheduledDate])
  @@index([status])
  @@map("appointments")
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSULTATIONS (SOAP)
// ═══════════════════════════════════════════════════════════════════════════

model Consultation {
  id                  String            @id @default(uuid())
  consultationNumber  String            @unique
  
  // References
  appointmentId       String?           @unique
  appointment         Appointment?      @relation(fields: [appointmentId], references: [id])
  patientId           String
  patient             Patient           @relation(fields: [patientId], references: [id])
  doctorId            String
  doctor              Doctor            @relation(fields: [doctorId], references: [id])
  clinicId            String
  clinic              Clinic            @relation(fields: [clinicId], references: [id])
  
  // Status
  status              ConsultationStatus @default(IN_PROGRESS)
  isTelemedicine      Boolean           @default(false)
  
  // SOAP Structure
  subjective          Json?             // { chiefComplaint, historyOfPresentIllness, pastMedicalHistory, ... }
  objective           Json?             // { vitalSigns, physicalExam, inOfficeTests, ... }
  assessment          Json?             // { diagnoses: [{ icd10Code, description, type, certainty }], clinicalReasoning, prognosis }
  plan                Json?             // { labOrders, imagingOrders, referrals, procedures, instructions, followUp }
  
  // Transcription
  audioUrl            String?
  transcription       String?
  aiSuggestions       Json?
  
  // Digital Signature
  signedDigitally     Boolean           @default(false)
  signedAt            DateTime?
  signatureData       Json?
  contentHash         String?
  
  // Timestamps
  startedAt           DateTime          @default(now())
  completedAt         DateTime?
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt
  
  // Relations
  prescriptions       Prescription[]
  attachments         ConsultationAttachment[]
  vitalSigns          VitalSign[]
  fhirResources       FhirResource[]

  @@index([patientId])
  @@index([doctorId])
  @@index([clinicId])
  @@index([status])
  @@map("consultations")
}

model ConsultationAttachment {
  id              String       @id @default(uuid())
  consultationId  String
  consultation    Consultation @relation(fields: [consultationId], references: [id], onDelete: Cascade)
  type            String       // image, document, audio
  name            String
  fileUrl         String
  fileSize        Int
  mimeType        String
  uploadedBy      String
  createdAt       DateTime     @default(now())

  @@index([consultationId])
  @@map("consultation_attachments")
}

// ═══════════════════════════════════════════════════════════════════════════
// PRESCRIPTIONS
// ═══════════════════════════════════════════════════════════════════════════

model Prescription {
  id                   String             @id @default(uuid())
  prescriptionNumber   String             @unique
  
  // References
  patientId            String
  patient              Patient            @relation(fields: [patientId], references: [id])
  doctorId             String
  doctor               Doctor             @relation(fields: [doctorId], references: [id])
  clinicId             String
  clinic               Clinic             @relation(fields: [clinicId], references: [id])
  consultationId       String?
  consultation         Consultation?      @relation(fields: [consultationId], references: [id])
  
  // Type & Status
  type                 PrescriptionType
  status               PrescriptionStatus @default(DRAFT)
  controlLevel         ControlLevel       @default(COMMON)
  
  // Validity
  validUntil           DateTime
  
  // Digital Signature
  signedAt             DateTime?
  signedDigitally      Boolean            @default(false)
  signatureData        Json?
  contentHash          String?
  qrCodeData           String?
  
  // CFM Validation
  cfmValidated         Boolean            @default(false)
  cfmValidationDate    DateTime?
  cfmValidationCode    String?
  
  // Notes
  clinicalIndication   String?
  notes                String?
  
  // Timestamps
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt
  
  // Relations
  items                PrescriptionItem[]
  dispensations        Dispensation[]

  @@index([patientId])
  @@index([doctorId])
  @@index([status])
  @@index([prescriptionNumber])
  @@map("prescriptions")
}

model PrescriptionItem {
  id                String           @id @default(uuid())
  prescriptionId    String
  prescription      Prescription     @relation(fields: [prescriptionId], references: [id], onDelete: Cascade)
  
  // Medication
  medicationName    String
  activeIngredient  String?
  concentration     String?
  pharmaceuticalForm String?
  
  // Dosage
  dosage            String
  frequency         String
  route             String           // oral, IV, IM, etc
  duration          String?
  quantity          Int
  quantityUnit      String
  
  // Control
  controlLevel      ControlLevel     @default(COMMON)
  isAntimicrobial   Boolean          @default(false)
  
  // Instructions
  instructions      String?
  
  // Dispensation tracking
  dispensedQuantity Int              @default(0)
  
  createdAt         DateTime         @default(now())
  
  // Relations
  dispensations     Dispensation[]

  @@index([prescriptionId])
  @@map("prescription_items")
}

model Dispensation {
  id                  String           @id @default(uuid())
  prescriptionId      String
  prescription        Prescription     @relation(fields: [prescriptionId], references: [id])
  prescriptionItemId  String
  prescriptionItem    PrescriptionItem @relation(fields: [prescriptionItemId], references: [id])
  
  quantity            Int
  dispensedBy         String
  pharmacyId          String?
  
  batchNumber         String?
  expirationDate      DateTime?
  
  notes               String?
  
  dispensedAt         DateTime         @default(now())

  @@index([prescriptionId])
  @@map("dispensations")
}

// ═══════════════════════════════════════════════════════════════════════════
// LABORATORY
// ═══════════════════════════════════════════════════════════════════════════

model LabOrder {
  id                  String         @id @default(uuid())
  orderNumber         String         @unique
  
  // References
  patientId           String
  patient             Patient        @relation(fields: [patientId], references: [id])
  doctorId            String
  doctor              Doctor         @relation(fields: [doctorId], references: [id])
  clinicId            String
  clinic              Clinic         @relation(fields: [clinicId], references: [id])
  consultationId      String?
  laboratoryId        String?
  laboratory          Laboratory?    @relation(fields: [laboratoryId], references: [id])
  
  // Status
  status              LabOrderStatus @default(PENDING)
  priority            String         @default("ROUTINE")
  
  // Clinical Info
  clinicalIndication  String?
  fastingRequired     Boolean        @default(false)
  fastingHours        Int?
  specialInstructions String?
  
  // Collection
  scheduledDate       DateTime?
  collectedAt         DateTime?
  collectionNotes     String?
  
  // Release
  releasedAt          DateTime?
  releasedBy          String?
  
  // Timestamps
  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt
  
  // Relations
  items               LabOrderItem[]

  @@index([patientId])
  @@index([doctorId])
  @@index([status])
  @@map("lab_orders")
}

model LabOrderItem {
  id              String       @id @default(uuid())
  labOrderId      String
  labOrder        LabOrder     @relation(fields: [labOrderId], references: [id], onDelete: Cascade)
  
  // Exam Info
  examCode        String
  examName        String
  loincCode       String?
  category        String?
  sampleType      String?
  
  // Status
  status          String       @default("PENDING")
  
  // Collection
  sampleBarcode   String?
  collectedAt     DateTime?
  collectedBy     String?
  
  // Results
  results         LabResult[]
  
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  @@index([labOrderId])
  @@map("lab_order_items")
}

model LabResult {
  id                  String       @id @default(uuid())
  labOrderItemId      String
  labOrderItem        LabOrderItem @relation(fields: [labOrderItemId], references: [id], onDelete: Cascade)
  
  // Result
  numericValue        Float?
  textValue           String?
  unit                String?
  referenceRange      String?
  
  // Interpretation
  interpretation      String?      // N, L, H, LL, HH
  interpretationText  String?
  isAbnormal          Boolean      @default(false)
  isCritical          Boolean      @default(false)
  
  // Method
  method              String?
  equipment           String?
  
  // Notes
  notes               String?
  
  // Metadata
  performedAt         DateTime
  performedBy         String
  
  createdAt           DateTime     @default(now())

  @@index([labOrderItemId])
  @@map("lab_results")
}

model Laboratory {
  id        String     @id @default(uuid())
  name      String
  cnes      String?
  cnpj      String?
  phone     String?
  email     String?
  address   Json?
  active    Boolean    @default(true)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  
  labOrders LabOrder[]

  @@map("laboratories")
}

// ═══════════════════════════════════════════════════════════════════════════
// BILLING & PAYMENTS
// ═══════════════════════════════════════════════════════════════════════════

model Invoice {
  id                      String          @id @default(uuid())
  invoiceNumber           String          @unique
  
  // References
  patientId               String
  patient                 Patient         @relation(fields: [patientId], references: [id])
  clinicId                String
  clinic                  Clinic          @relation(fields: [clinicId], references: [id])
  consultationId          String?
  
  // Status
  status                  InvoiceStatus   @default(PENDING)
  
  // Amounts
  subtotal                Float
  discountPercent         Float?
  discountAmount          Float           @default(0)
  taxPercent              Float?
  taxAmount               Float           @default(0)
  totalAmount             Float
  insuranceCoverageAmount Float           @default(0)
  patientResponsibility   Float
  amountPaid              Float           @default(0)
  
  // Dates
  dueDate                 DateTime
  paidAt                  DateTime?
  
  // Notes
  notes                   String?
  
  // Timestamps
  createdAt               DateTime        @default(now())
  updatedAt               DateTime        @updatedAt
  
  // Relations
  items                   InvoiceItem[]
  payments                Payment[]
  insuranceClaim          InsuranceClaim?

  @@index([patientId])
  @@index([clinicId])
  @@index([status])
  @@index([dueDate])
  @@map("invoices")
}

model InvoiceItem {
  id          String   @id @default(uuid())
  invoiceId   String
  invoice     Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  
  code        String?
  description String
  category    String?
  quantity    Int
  unitPrice   Float
  totalPrice  Float
  tussCode    String?
  cbhpmCode   String?
  
  createdAt   DateTime @default(now())

  @@index([invoiceId])
  @@map("invoice_items")
}

model Payment {
  id              String        @id @default(uuid())
  invoiceId       String
  invoice         Invoice       @relation(fields: [invoiceId], references: [id])
  
  amount          Float
  method          PaymentMethod
  status          PaymentStatus @default(PENDING)
  
  transactionId   String?
  gatewayResponse Json?
  
  installments    Int           @default(1)
  
  processedBy     String?
  processedAt     DateTime?
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([invoiceId])
  @@index([transactionId])
  @@map("payments")
}

model InsuranceClaim {
  id            String   @id @default(uuid())
  invoiceId     String   @unique
  invoice       Invoice  @relation(fields: [invoiceId], references: [id])
  insuranceId   String
  insurance     HealthInsurance @relation(fields: [insuranceId], references: [id])
  
  guideNumber   String   @unique
  guideType     String   // SP_SADT, consulta, etc
  
  status        String   @default("PENDING")
  claimedAmount Float
  approvedAmount Float?
  
  tissXml       String?
  submittedAt   DateTime?
  respondedAt   DateTime?
  responseData  Json?
  
  items         InsuranceClaimItem[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([guideNumber])
  @@map("insurance_claims")
}

model InsuranceClaimItem {
  id              String         @id @default(uuid())
  claimId         String
  claim           InsuranceClaim @relation(fields: [claimId], references: [id], onDelete: Cascade)
  
  procedureCode   String
  procedureName   String
  quantity        Int
  unitValue       Float
  totalValue      Float
  
  createdAt       DateTime       @default(now())

  @@map("insurance_claim_items")
}

model HealthInsurance {
  id              String           @id @default(uuid())
  name            String
  ansCode         String           @unique
  phone           String?
  email           String?
  website         String?
  active          Boolean          @default(true)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  patients        Patient[]
  claims          InsuranceClaim[]

  @@map("health_insurances")
}

// ═══════════════════════════════════════════════════════════════════════════
// GAMIFICATION
// ═══════════════════════════════════════════════════════════════════════════

model Badge {
  id              String         @id @default(uuid())
  code            String         @unique
  name            String
  description     String
  iconUrl         String?
  category        String
  requiredPoints  Int?
  requiredLevel   Int?
  requiredStreak  Int?
  isSecret        Boolean        @default(false)
  bonusPoints     Int            @default(0)
  createdAt       DateTime       @default(now())
  
  patientBadges   PatientBadge[]

  @@map("badges")
}

model PatientBadge {
  id        String   @id @default(uuid())
  patientId String
  patient   Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)
  badgeId   String
  badge     Badge    @relation(fields: [badgeId], references: [id])
  earnedAt  DateTime @default(now())

  @@unique([patientId, badgeId])
  @@map("patient_badges")
}

model Reward {
  id              String          @id @default(uuid())
  code            String          @unique
  name            String
  description     String
  type            String          // discount, product, service
  value           Float?
  discountPercent Float?
  pointsCost      Int
  requiredLevel   Int             @default(1)
  quantity        Int?
  validUntil      DateTime?
  active          Boolean         @default(true)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  patientRewards  PatientReward[]

  @@map("rewards")
}

model PatientReward {
  id          String   @id @default(uuid())
  patientId   String
  patient     Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)
  rewardId    String
  reward      Reward   @relation(fields: [rewardId], references: [id])
  redeemedAt  DateTime @default(now())
  usedAt      DateTime?
  code        String?  @unique

  @@map("patient_rewards")
}

model PointTransaction {
  id          String   @id @default(uuid())
  patientId   String
  patient     Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)
  points      Int
  action      String
  description String?
  metadata    Json?
  createdAt   DateTime @default(now())

  @@index([patientId])
  @@index([createdAt])
  @@map("point_transactions")
}

model Task {
  id          String     @id @default(uuid())
  patientId   String
  patient     Patient    @relation(fields: [patientId], references: [id], onDelete: Cascade)
  type        String     // MEDICATION, VITAL_SIGNS, EXERCISE, etc
  title       String
  description String?
  points      Int
  status      TaskStatus @default(PENDING)
  dueDate     DateTime?
  completedAt DateTime?
  metadata    Json?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([patientId])
  @@index([status])
  @@index([dueDate])
  @@map("tasks")
}

// ═══════════════════════════════════════════════════════════════════════════
// TELEMEDICINE
// ═══════════════════════════════════════════════════════════════════════════

model TelemedicineSession {
  id                  String                   @id @default(uuid())
  
  // References
  appointmentId       String                   @unique
  appointment         Appointment              @relation(fields: [appointmentId], references: [id])
  patientId           String
  patient             Patient                  @relation("PatientSessions", fields: [patientId], references: [id])
  doctorId            String
  doctor              Doctor                   @relation("DoctorSessions", fields: [doctorId], references: [id])
  clinicId            String
  clinic              Clinic                   @relation(fields: [clinicId], references: [id])
  
  // Room
  roomId              String
  roomUrl             String
  provider            String                   // livekit, daily, twilio
  
  // Status
  status              TelemedicineSessionStatus @default(SCHEDULED)
  
  // Participation
  doctorJoinedAt      DateTime?
  patientJoinedAt     DateTime?
  
  // Consent
  consentRecorded     Boolean                  @default(false)
  consentGiven        Boolean?
  consentRecordedAt   DateTime?
  
  // Recording
  recordingEnabled    Boolean                  @default(false)
  recordingUrl        String?
  recordingDuration   Int?                     // seconds
  
  // Session
  startedAt           DateTime?
  endedAt             DateTime?
  duration            Int?                     // minutes
  
  // Timestamps
  createdAt           DateTime                 @default(now())
  updatedAt           DateTime                 @updatedAt
  
  // Relations
  chatMessages        TelemedicineChatMessage[]

  @@index([appointmentId])
  @@index([patientId])
  @@index([doctorId])
  @@index([status])
  @@map("telemedicine_sessions")
}

model TelemedicineChatMessage {
  id          String              @id @default(uuid())
  sessionId   String
  session     TelemedicineSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  senderType  String              // DOCTOR, PATIENT
  senderId    String
  message     String
  createdAt   DateTime            @default(now())

  @@index([sessionId])
  @@map("telemedicine_chat_messages")
}

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════

model Notification {
  id           String             @id @default(uuid())
  userId       String
  user         User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type         NotificationType
  title        String
  body         String
  data         Json?
  priority     String             @default("normal")
  
  status       NotificationStatus @default(PENDING)
  sentAt       DateTime?
  readAt       DateTime?
  errorMessage String?
  
  createdAt    DateTime           @default(now())

  @@index([userId])
  @@index([status])
  @@index([createdAt])
  @@map("notifications")
}

// ═══════════════════════════════════════════════════════════════════════════
// AUDIT & LOGS
// ═══════════════════════════════════════════════════════════════════════════

model AuditLog {
  id           String      @id @default(uuid())
  userId       String?
  user         User?       @relation("UserAuditLogs", fields: [userId], references: [id])
  performedBy  String?
  performer    User?       @relation("PerformedAuditLogs", fields: [performedBy], references: [id])
  
  action       AuditAction
  resource     String
  resourceId   String?
  description  String?
  
  oldData      Json?
  newData      Json?
  metadata     Json?
  
  ipAddress    String?
  userAgent    String?
  
  createdAt    DateTime    @default(now())

  @@index([userId])
  @@index([resource])
  @@index([action])
  @@index([createdAt])
  @@map("audit_logs")
}

// ═══════════════════════════════════════════════════════════════════════════
// INTEGRATIONS (FHIR)
// ═══════════════════════════════════════════════════════════════════════════

model FhirResource {
  id            String        @id @default(uuid())
  resourceType  String
  resourceId    String
  localId       String
  localType     String
  clinicId      String?
  clinic        Clinic?       @relation(fields: [clinicId], references: [id])
  consultationId String?
  consultation  Consultation? @relation(fields: [consultationId], references: [id])
  data          Json
  syncedAt      DateTime
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@unique([resourceType, resourceId])
  @@index([localType, localId])
  @@map("fhir_resources")
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

model AnalyticsSnapshot {
  id        String   @id @default(uuid())
  clinicId  String
  clinic    Clinic   @relation(fields: [clinicId], references: [id])
  type      String   // DAILY, WEEKLY, MONTHLY
  date      DateTime
  data      Json
  createdAt DateTime @default(now())

  @@unique([clinicId, type, date])
  @@map("analytics_snapshots")
}
```

---

### 1.5 MAIN E APP MODULE

#### PROMPT 1.5.1: Main.ts
```typescript
CRIAR ARQUIVO: /healthflow/apps/api/src/main.ts

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  
  // Global prefix
  const apiPrefix = configService.get('API_PREFIX', 'api');
  app.setGlobalPrefix(apiPrefix);

  // Security
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGINS', 'http://localhost:3000').split(','),
    credentials: configService.get('CORS_CREDENTIALS', 'true') === 'true',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger
  if (configService.get('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('HealthFlow API')
      .setDescription('API do Sistema de Gestão de Saúde HealthFlow')
      .setVersion('1.0.0')
      .addBearerAuth()
      .addTag('auth', 'Autenticação e autorização')
      .addTag('patients', 'Gestão de pacientes')
      .addTag('doctors', 'Gestão de médicos')
      .addTag('appointments', 'Agendamento de consultas')
      .addTag('consultations', 'Consultas médicas (SOAP)')
      .addTag('prescriptions', 'Prescrições digitais')
      .addTag('laboratory', 'Exames laboratoriais')
      .addTag('telemedicine', 'Telemedicina')
      .addTag('gamification', 'Gamificação')
      .addTag('billing', 'Faturamento')
      .addTag('notifications', 'Notificações')
      .addTag('analytics', 'Analytics e relatórios')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
    
    logger.log(`Swagger docs available at /${apiPrefix}/docs`);
  }

  // Health check endpoint
  app.getHttpAdapter().get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Start server
  const port = configService.get('API_PORT', 3001);
  await app.listen(port);
  
  logger.log(`🚀 HealthFlow API running on port ${port}`);
  logger.log(`📚 API Docs: http://localhost:${port}/docs`);
  logger.log(`🔧 Environment: ${configService.get('NODE_ENV')}`);
}

bootstrap();
```

#### PROMPT 1.5.2: App Module
```typescript
CRIAR ARQUIVO: /healthflow/apps/api/src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bull';

// Database
import { PrismaModule } from './database/prisma.module';

// Common
import { CacheModule } from './common/cache/cache.module';
import { AuditModule } from './common/audit/audit.module';

// Feature Modules
import { AuthModule } from './modules/auth/auth.module';
import { PatientsModule } from './modules/patients/patients.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { ClinicsModule } from './modules/clinics/clinics.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { ConsultationsModule } from './modules/consultations/consultations.module';
import { PrescriptionsModule } from './modules/prescriptions/prescriptions.module';
import { LaboratoryModule } from './modules/laboratory/laboratory.module';
import { TelemedicineModule } from './modules/telemedicine/telemedicine.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { BillingModule } from './modules/billing/billing.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

// Integration Modules
import { FhirModule } from './modules/integrations/fhir/fhir.module';
import { RndsModule } from './modules/integrations/rnds/rnds.module';
import { StorageModule } from './modules/integrations/storage/storage.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ttl: configService.get('THROTTLE_TTL', 60),
        limit: configService.get('THROTTLE_LIMIT', 100),
      }),
    }),

    // Scheduling
    ScheduleModule.forRoot(),

    // Events
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
    }),

    // Queue (Bull)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        },
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: false,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      }),
    }),

    // Database
    PrismaModule,

    // Common
    CacheModule,
    AuditModule,

    // Features
    AuthModule,
    PatientsModule,
    DoctorsModule,
    ClinicsModule,
    AppointmentsModule,
    ConsultationsModule,
    PrescriptionsModule,
    LaboratoryModule,
    TelemedicineModule,
    GamificationModule,
    BillingModule,
    NotificationsModule,
    AnalyticsModule,

    // Integrations
    FhirModule,
    RndsModule,
    StorageModule,
  ],
})
export class AppModule {}
```

---

## CHECKPOINT FASE 1

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    VALIDAÇÃO - FASE 1 COMPLETA                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  ESTRUTURA DO PROJETO                                                        ║
║  □ Monorepo configurado (Turborepo)                                         ║
║  □ Apps: api, web, mobile, admin                                            ║
║  □ Packages: shared, ui, types, config                                      ║
║  □ Infrastructure: docker, k8s, nginx, scripts                              ║
║                                                                              ║
║  BACKEND API                                                                 ║
║  □ NestJS configurado com todos os módulos                                  ║
║  □ Prisma Schema completo (40+ models)                                      ║
║  □ Enums definidos (25+)                                                    ║
║  □ Swagger configurado                                                      ║
║  □ Validação global                                                         ║
║  □ CORS e segurança                                                         ║
║                                                                              ║
║  CONFIGURAÇÕES                                                               ║
║  □ .env.example completo                                                    ║
║  □ tsconfig.json                                                            ║
║  □ nest-cli.json                                                            ║
║  □ turbo.json                                                               ║
║                                                                              ║
║  SEQUÊNCIA DE VALIDAÇÃO:                                                     ║
║  1. npm install                                                             ║
║  2. cd apps/api && npx prisma generate                                      ║
║  3. npx prisma migrate dev --name init                                      ║
║  4. npm run lint                                                            ║
║  5. npm run build                                                           ║
║                                                                              ║
║  SE TUDO OK → PROSSEGUIR PARA FASE 2 (AUTH)                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

# ÍNDICE COMPLETO DO ULTRA AGENT SYSTEM

| Parte | Fases | Conteúdo Principal |
|-------|-------|-------------------|
| **1** | 1 | Setup, Monorepo, Prisma Schema, Configurações |
| **2** | 2 | Autenticação completa (JWT, 2FA, Sessions) |
| **3** | 3-4 | Pacientes, Agendamento |
| **4** | 5-7 | Consultas, Prescrições, Gamificação, Telemedicina |
| **5** | 8-10 | Notificações, FHIR, RNDS, Analytics |
| **6** | 11-14 | Frontend Web, Mobile, Infra, E2E |
| **7** | 15-18 | Laboratório, Financeiro, CI/CD, Monitoramento |

---

**CONTINUA NA PARTE 2: Módulo de Autenticação Completo**
