# Documentação da API HealtFlow

Referência completa da API REST do HealtFlow.

## Sumário

1. [Visão Geral](#visão-geral)
2. [Autenticação](#autenticação)
3. [Formato de Respostas](#formato-de-respostas)
4. [Rate Limiting](#rate-limiting)
5. [Endpoints por Módulo](#endpoints-por-módulo)
6. [Códigos de Erro](#códigos-de-erro)
7. [Webhooks](#webhooks)
8. [SDKs](#sdks)

---

## Visão Geral

### Base URL

```
Produção:    https://api.healtflow.com.br/api/v1
Staging:     https://staging-api.healtflow.com.br/api/v1
Desenvolvimento: http://localhost:3001/api/v1
```

### Swagger/OpenAPI

Documentação interativa disponível em:
- **Local:** http://localhost:3001/api/docs
- **Produção:** https://api.healtflow.com.br/api/docs

### Headers Padrão

```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer <access_token>
X-Request-ID: <uuid> (opcional, para rastreamento)
```

### Versionamento

A API é versionada via URL: `/api/v1/`, `/api/v2/`, etc.

---

## Autenticação

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "usuario@email.com",
  "password": "Senha@123"
}
```

**Resposta (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "usuario@email.com",
      "role": "DOCTOR",
      "status": "ACTIVE"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

### Refresh Token

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Resposta (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

### Registro

```http
POST /auth/register
Content-Type: application/json

{
  "email": "novo@email.com",
  "password": "Senha@123",
  "fullName": "Nome Completo",
  "cpf": "12345678901",
  "birthDate": "1990-01-15",
  "gender": "MALE"
}
```

### 2FA - Habilitar

```http
POST /auth/2fa/enable
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCode": "data:image/png;base64,..."
  }
}
```

### 2FA - Verificar

```http
POST /auth/2fa/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "123456"
}
```

### Logout

```http
POST /auth/logout
Authorization: Bearer <token>
```

---

## Formato de Respostas

### Sucesso

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Erro

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos",
    "details": [
      {
        "field": "email",
        "message": "Email inválido"
      }
    ]
  }
}
```

---

## Rate Limiting

| Endpoint | Limite | Janela |
|----------|--------|--------|
| Global | 100 requisições | 60 segundos |
| Login | 10 requisições | 60 segundos |
| Register | 5 requisições | 60 segundos |
| Upload | 20 requisições | 60 segundos |

Headers de resposta:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## Endpoints por Módulo

### Pacientes

#### Listar Pacientes

```http
GET /patients?page=1&limit=10&search=joao&status=ACTIVE
Authorization: Bearer <token>
```

**Query Parameters:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| page | number | Página (default: 1) |
| limit | number | Itens por página (default: 10, max: 100) |
| search | string | Busca por nome, CPF ou email |
| status | string | ACTIVE, INACTIVE |
| sortBy | string | Campo para ordenar |
| order | string | asc, desc |

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "fullName": "João da Silva",
      "cpf": "***456789**",
      "email": "joao@email.com",
      "birthDate": "1990-05-15",
      "gender": "MALE",
      "phone": "11999999999",
      "bloodType": "A_POSITIVE",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  }
}
```

#### Buscar Paciente

```http
GET /patients/:id
Authorization: Bearer <token>
```

#### Criar Paciente

```http
POST /patients
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "paciente@email.com",
  "password": "Senha@123",
  "fullName": "Nome do Paciente",
  "cpf": "12345678901",
  "birthDate": "1990-05-15",
  "gender": "MALE",
  "phone": "11999999999",
  "bloodType": "A_POSITIVE",
  "allergies": ["Penicilina", "Dipirona"]
}
```

#### Atualizar Paciente

```http
PATCH /patients/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "phone": "11888888888",
  "allergies": ["Penicilina"]
}
```

#### Remover Paciente

```http
DELETE /patients/:id
Authorization: Bearer <token>
```

---

### Médicos

#### Listar Médicos

```http
GET /doctors?specialty=Cardiologia&telemedicine=true
Authorization: Bearer <token>
```

#### Buscar Médico

```http
GET /doctors/:id
Authorization: Bearer <token>
```

#### Criar Médico

```http
POST /doctors
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "medico@email.com",
  "password": "Senha@123",
  "fullName": "Dr. Nome Completo",
  "cpf": "12345678901",
  "crm": "123456",
  "crmState": "SP",
  "specialty": "Cardiologia",
  "subspecialties": ["Ecocardiografia"],
  "telemedicineEnabled": true,
  "appointmentDuration": 30
}
```

#### Horários Disponíveis

```http
GET /doctors/:id/availability?date=2024-03-15
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "date": "2024-03-15",
    "slots": [
      { "start": "08:00", "end": "08:30", "available": true },
      { "start": "08:30", "end": "09:00", "available": false },
      { "start": "09:00", "end": "09:30", "available": true }
    ]
  }
}
```

---

### Agendamentos

#### Listar Agendamentos

```http
GET /appointments?startDate=2024-03-01&endDate=2024-03-31&status=SCHEDULED
Authorization: Bearer <token>
```

#### Criar Agendamento

```http
POST /appointments
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "uuid",
  "doctorId": "uuid",
  "clinicId": "uuid",
  "dateTime": "2024-03-15T10:00:00Z",
  "type": "FIRST_VISIT",
  "notes": "Primeira consulta - dor no peito"
}
```

**Tipos de Agendamento:**
- `FIRST_VISIT` - Primeira consulta
- `FOLLOW_UP` - Retorno
- `ROUTINE` - Rotina
- `EMERGENCY` - Emergência
- `EXAM` - Exame
- `PROCEDURE` - Procedimento
- `TELEMEDICINE` - Telemedicina

#### Confirmar Agendamento

```http
POST /appointments/:id/confirm
Authorization: Bearer <token>
```

#### Cancelar Agendamento

```http
POST /appointments/:id/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Paciente solicitou cancelamento"
}
```

#### Check-in

```http
POST /appointments/:id/check-in
Authorization: Bearer <token>
```

---

### Consultas

#### Listar Consultas

```http
GET /consultations?patientId=uuid&startDate=2024-01-01
Authorization: Bearer <token>
```

#### Buscar Consulta

```http
GET /consultations/:id
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "consultationNumber": "2024-001234",
    "patient": { "id": "uuid", "fullName": "João da Silva" },
    "doctor": { "id": "uuid", "fullName": "Dr. Carlos", "crm": "123456-SP" },
    "appointment": { "id": "uuid", "dateTime": "2024-03-15T10:00:00Z" },
    "soap": {
      "subjective": "Paciente relata dor no peito há 3 dias...",
      "objective": "PA: 120/80, FC: 72bpm, ausculta cardíaca...",
      "assessment": "Suspeita de angina estável...",
      "plan": "Solicitar ECG e enzimas cardíacas..."
    },
    "vitalSigns": {
      "bloodPressureSystolic": 120,
      "bloodPressureDiastolic": 80,
      "heartRate": 72,
      "temperature": 36.5,
      "respiratoryRate": 16,
      "oxygenSaturation": 98
    },
    "prescriptions": [],
    "labOrders": [],
    "status": "IN_PROGRESS",
    "createdAt": "2024-03-15T10:15:00Z"
  }
}
```

#### Criar Consulta

```http
POST /consultations
Authorization: Bearer <token>
Content-Type: application/json

{
  "appointmentId": "uuid",
  "soap": {
    "subjective": "Paciente relata...",
    "objective": "Exame físico...",
    "assessment": "Hipótese diagnóstica...",
    "plan": "Conduta..."
  },
  "vitalSigns": {
    "bloodPressureSystolic": 120,
    "bloodPressureDiastolic": 80,
    "heartRate": 72
  }
}
```

#### Finalizar Consulta

```http
POST /consultations/:id/finish
Authorization: Bearer <token>
Content-Type: application/json

{
  "digitalSignature": "base64..."
}
```

---

### Prescrições

#### Listar Prescrições

```http
GET /prescriptions?patientId=uuid&status=ACTIVE
Authorization: Bearer <token>
```

#### Criar Prescrição

```http
POST /prescriptions
Authorization: Bearer <token>
Content-Type: application/json

{
  "consultationId": "uuid",
  "type": "SIMPLE",
  "medications": [
    {
      "name": "Losartana",
      "dosage": "50mg",
      "frequency": "1x ao dia",
      "duration": "uso contínuo",
      "instructions": "Tomar pela manhã"
    }
  ],
  "notes": "Retorno em 30 dias"
}
```

**Tipos de Prescrição:**
- `SIMPLE` - Receita simples (branca)
- `CONTROLLED` - Receita controlada (azul/amarela)
- `ANTIMICROBIAL` - Antimicrobiano (2 vias)
- `SPECIAL` - Especial

#### Assinar Prescrição

```http
POST /prescriptions/:id/sign
Authorization: Bearer <token>
Content-Type: application/json

{
  "digitalSignature": "base64...",
  "certificateSerial": "1234567890"
}
```

#### Validar Prescrição (Farmácia)

```http
GET /prescriptions/validate/:code
Authorization: Bearer <token>
```

---

### Laboratório

#### Listar Pedidos de Exame

```http
GET /lab-orders?patientId=uuid&status=PENDING
Authorization: Bearer <token>
```

#### Criar Pedido de Exame

```http
POST /lab-orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "consultationId": "uuid",
  "patientId": "uuid",
  "exams": [
    {
      "examTypeId": "uuid",
      "urgency": "ROUTINE",
      "clinicalInfo": "Suspeita de diabetes"
    }
  ]
}
```

#### Registrar Resultado

```http
POST /lab-orders/:id/results
Authorization: Bearer <token>
Content-Type: application/json

{
  "results": [
    {
      "examId": "uuid",
      "value": "126",
      "unit": "mg/dL",
      "referenceRange": "70-99 mg/dL",
      "interpretation": "HIGH"
    }
  ],
  "technician": "Nome do Técnico"
}
```

---

### Telemedicina

#### Criar Sessão

```http
POST /telemedicine/sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "consultationId": "uuid",
  "scheduledAt": "2024-03-15T14:00:00Z"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "roomUrl": "https://meet.healtflow.com.br/abc123",
    "accessToken": "eyJ...",
    "expiresAt": "2024-03-15T15:00:00Z"
  }
}
```

#### Entrar na Sessão

```http
POST /telemedicine/sessions/:id/join
Authorization: Bearer <token>
```

#### Finalizar Sessão

```http
POST /telemedicine/sessions/:id/end
Authorization: Bearer <token>
```

---

### Financeiro

#### Listar Faturas

```http
GET /invoices?clinicId=uuid&status=PENDING
Authorization: Bearer <token>
```

#### Criar Fatura

```http
POST /invoices
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "uuid",
  "clinicId": "uuid",
  "appointmentId": "uuid",
  "items": [
    {
      "description": "Consulta cardiológica",
      "quantity": 1,
      "unitPrice": 300.00
    }
  ],
  "discount": 0,
  "paymentMethod": "CREDIT_CARD"
}
```

#### Processar Pagamento

```http
POST /invoices/:id/pay
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentMethod": "PIX",
  "paymentDetails": {
    "pixKey": "email@email.com"
  }
}
```

---

### Notificações

#### Listar Notificações

```http
GET /notifications?read=false
Authorization: Bearer <token>
```

#### Marcar como Lida

```http
POST /notifications/:id/read
Authorization: Bearer <token>
```

#### Configurar Preferências

```http
PATCH /notifications/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": true,
  "push": true,
  "sms": false,
  "whatsapp": true
}
```

---

### Integrações

#### FHIR - Exportar Paciente

```http
GET /integrations/fhir/patients/:id
Authorization: Bearer <token>
Accept: application/fhir+json
```

#### RNDS - Enviar Documento

```http
POST /integrations/rnds/documents
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "RESULTADO_EXAME",
  "consultationId": "uuid",
  "labOrderId": "uuid"
}
```

#### RNDS - Consultar Status

```http
GET /integrations/rnds/documents/:id/status
Authorization: Bearer <token>
```

---

## Códigos de Erro

### Códigos HTTP

| Código | Significado | Descrição |
|--------|-------------|-----------|
| 200 | OK | Sucesso |
| 201 | Created | Recurso criado |
| 204 | No Content | Sucesso sem conteúdo |
| 400 | Bad Request | Dados inválidos |
| 401 | Unauthorized | Não autenticado |
| 403 | Forbidden | Sem permissão |
| 404 | Not Found | Recurso não encontrado |
| 409 | Conflict | Conflito de dados |
| 422 | Unprocessable Entity | Erro de validação |
| 429 | Too Many Requests | Rate limit excedido |
| 500 | Internal Server Error | Erro do servidor |

### Códigos de Erro da Aplicação

| Código | Descrição |
|--------|-----------|
| AUTH_INVALID_CREDENTIALS | Credenciais inválidas |
| AUTH_TOKEN_EXPIRED | Token expirado |
| AUTH_2FA_REQUIRED | 2FA necessário |
| AUTH_2FA_INVALID | Código 2FA inválido |
| USER_NOT_FOUND | Usuário não encontrado |
| USER_INACTIVE | Usuário inativo |
| PATIENT_NOT_FOUND | Paciente não encontrado |
| PATIENT_CPF_EXISTS | CPF já cadastrado |
| DOCTOR_NOT_FOUND | Médico não encontrado |
| DOCTOR_CRM_EXISTS | CRM já cadastrado |
| APPOINTMENT_NOT_FOUND | Agendamento não encontrado |
| APPOINTMENT_CONFLICT | Conflito de horário |
| APPOINTMENT_PAST | Data no passado |
| CONSULTATION_NOT_FOUND | Consulta não encontrada |
| PRESCRIPTION_NOT_FOUND | Prescrição não encontrada |
| PRESCRIPTION_EXPIRED | Prescrição expirada |
| PAYMENT_FAILED | Pagamento falhou |
| RNDS_AUTH_ERROR | Erro de autenticação RNDS |
| RNDS_SEND_ERROR | Erro ao enviar para RNDS |

---

## Webhooks

### Configuração

```http
POST /webhooks
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://seu-sistema.com/webhook",
  "events": ["appointment.created", "appointment.cancelled"],
  "secret": "seu-secret-para-validacao"
}
```

### Eventos Disponíveis

| Evento | Descrição |
|--------|-----------|
| `appointment.created` | Novo agendamento |
| `appointment.confirmed` | Agendamento confirmado |
| `appointment.cancelled` | Agendamento cancelado |
| `consultation.completed` | Consulta finalizada |
| `prescription.created` | Prescrição criada |
| `prescription.dispensed` | Medicamento dispensado |
| `lab_order.results_ready` | Resultados prontos |
| `payment.received` | Pagamento recebido |
| `payment.failed` | Pagamento falhou |

### Payload do Webhook

```json
{
  "id": "evt_123",
  "type": "appointment.created",
  "timestamp": "2024-03-15T10:30:00Z",
  "data": {
    "appointmentId": "uuid",
    "patientId": "uuid",
    "doctorId": "uuid",
    "dateTime": "2024-03-20T14:00:00Z"
  }
}
```

### Validação de Assinatura

```typescript
const crypto = require('crypto');

function validateWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

---

## SDKs

### JavaScript/TypeScript

```typescript
import { HealtFlowClient } from '@healtflow/sdk';

const client = new HealtFlowClient({
  apiKey: 'sua-api-key',
  environment: 'production', // ou 'sandbox'
});

// Listar pacientes
const patients = await client.patients.list({
  page: 1,
  limit: 10,
  search: 'João',
});

// Criar agendamento
const appointment = await client.appointments.create({
  patientId: 'uuid',
  doctorId: 'uuid',
  clinicId: 'uuid',
  dateTime: new Date('2024-03-15T10:00:00Z'),
  type: 'FIRST_VISIT',
});
```

### cURL Examples

```bash
# Login
curl -X POST https://api.healtflow.com.br/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@email.com","password":"senha123"}'

# Listar pacientes
curl https://api.healtflow.com.br/api/v1/patients \
  -H "Authorization: Bearer <token>"

# Criar paciente
curl -X POST https://api.healtflow.com.br/api/v1/patients \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "paciente@email.com",
    "fullName": "Nome Completo",
    "cpf": "12345678901",
    "birthDate": "1990-01-15",
    "gender": "MALE"
  }'
```

---

## Suporte

- **Email:** api-support@healtflow.com.br
- **Status:** https://status.healtflow.com.br
- **Changelog:** https://docs.healtflow.com.br/changelog
