# Wiki do Projeto HealtFlow

Bem-vindo à Wiki oficial do HealtFlow! Esta base de conhecimento contém informações essenciais sobre o projeto, processos e melhores práticas.

## Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [História e Evolução](#história-e-evolução)
- [Equipe e Papéis](#equipe-e-papéis)
- [Processos de Desenvolvimento](#processos-de-desenvolvimento)
- [Convenções e Padrões](#convenções-e-padrões)
- [Roadmap](#roadmap)
- [FAQ](./FAQ.md)
- [Glossário](./GLOSSARY.md)
- [Contribuição](./CONTRIBUTING.md)

---

## Sobre o Projeto

### Missão

> Transformar a gestão de saúde através da tecnologia, conectando pacientes, profissionais e estabelecimentos de saúde em um ecossistema digital integrado, seguro e eficiente.

### Visão

> Ser a plataforma líder em gestão de saúde digital no Brasil, promovendo acesso universal à saúde de qualidade através da inovação tecnológica.

### Valores

1. **Segurança em Primeiro Lugar**: Proteção de dados sensíveis de saúde
2. **Inovação Contínua**: Busca constante por melhorias e novas tecnologias
3. **Foco no Usuário**: Design centrado nas necessidades reais dos usuários
4. **Interoperabilidade**: Integração com padrões nacionais e internacionais
5. **Acessibilidade**: Saúde digital para todos

---

## História e Evolução

### Timeline do Projeto

```
2024 Q1 - Concepção e Planejamento
├── Definição de requisitos
├── Arquitetura inicial
└── Prototipagem

2024 Q2 - FASE 1: Fundação
├── Setup do monorepo
├── Backend core (Auth, Users)
├── Database schema inicial
└── CI/CD básico

2024 Q3 - FASE 2: Core Features
├── Módulo de Pacientes
├── Módulo de Médicos
├── Módulo de Agendamento
├── Módulo de Consultas
└── Módulo de Prescrições

2024 Q4 - FASE 3: Expansão
├── Módulo Financeiro
├── Módulo Laboratorial
├── Frontend Web completo
├── Integrações (FHIR, RNDS)
└── Dashboard Analytics

2025 Q1 - FASE 4: Mobile & Telemedicina
├── App Mobile (React Native)
├── Telemedicina (LiveKit)
├── Push Notifications
├── Gamificação
└── Melhorias de UX

2025 Q2 - FASE 5: Infraestrutura
├── Docker otimizado
├── Kubernetes deployment
├── CI/CD avançado
├── Monitoramento
└── Alta disponibilidade
```

### Marcos Importantes

| Data | Marco | Descrição |
|------|-------|-----------|
| Jan 2024 | Kickoff | Início oficial do projeto |
| Mar 2024 | MVP Backend | API funcional com auth |
| Jun 2024 | Beta Privado | Primeiros testes internos |
| Set 2024 | Integração RNDS | Conexão com SUS |
| Dez 2024 | App Mobile | Lançamento do app |
| Mar 2025 | v1.0 | Release estável |

---

## Equipe e Papéis

### Estrutura de Times

```
┌─────────────────────────────────────────────────────────────┐
│                    Product Owner                             │
│              Visão do produto e priorização                  │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   Backend     │     │   Frontend    │     │    Mobile     │
│    Team       │     │    Team       │     │    Team       │
├───────────────┤     ├───────────────┤     ├───────────────┤
│ • NestJS      │     │ • Next.js     │     │ • React Native│
│ • PostgreSQL  │     │ • React       │     │ • Expo        │
│ • Redis       │     │ • Tailwind    │     │ • TypeScript  │
│ • Prisma      │     │ • TypeScript  │     │               │
└───────────────┘     └───────────────┘     └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │      DevOps       │
                    │       Team        │
                    ├───────────────────┤
                    │ • Docker          │
                    │ • Kubernetes      │
                    │ • CI/CD           │
                    │ • Monitoramento   │
                    └───────────────────┘
```

### Papéis e Responsabilidades

| Papel | Responsabilidades |
|-------|-------------------|
| **Product Owner** | Backlog, priorização, stakeholders |
| **Tech Lead** | Arquitetura, decisões técnicas, code review |
| **Backend Developer** | APIs, integrações, database |
| **Frontend Developer** | UI/UX, componentes, páginas |
| **Mobile Developer** | App iOS/Android, UX mobile |
| **DevOps Engineer** | Infra, deploy, monitoramento |
| **QA Engineer** | Testes, qualidade, automação |
| **Designer** | UI/UX, design system, protótipos |

---

## Processos de Desenvolvimento

### Git Flow

```
main (produção)
├── develop (desenvolvimento)
│   ├── feature/pacientes-crud
│   ├── feature/telemedicina
│   ├── feature/gamificacao
│   └── ...
├── release/v1.0.0
├── release/v1.1.0
└── hotfix/fix-auth-bug
```

### Branch Naming

```
Tipos de branch:
├── feature/    → Nova funcionalidade
├── bugfix/     → Correção de bug
├── hotfix/     → Correção urgente em produção
├── release/    → Preparação de release
├── docs/       → Documentação
└── refactor/   → Refatoração de código

Exemplos:
├── feature/add-telemedicine-module
├── bugfix/fix-appointment-overlap
├── hotfix/fix-login-2fa
├── release/v1.2.0
└── docs/update-api-docs
```

### Commit Convention

```
<tipo>(<escopo>): <descrição>

[corpo opcional]

[rodapé opcional]

Tipos:
├── feat     → Nova funcionalidade
├── fix      → Correção de bug
├── docs     → Documentação
├── style    → Formatação
├── refactor → Refatoração
├── test     → Testes
├── chore    → Manutenção
└── perf     → Performance

Exemplos:
├── feat(patients): add patient avatar upload
├── fix(auth): resolve 2FA timeout issue
├── docs(api): update swagger documentation
└── refactor(billing): simplify invoice calculation
```

### Code Review Process

```
1. Criar Pull Request
   └── Template preenchido
   └── Linked issues
   └── Screenshots (se UI)

2. Automated Checks
   └── Lint ✓
   └── Type Check ✓
   └── Tests ✓
   └── Build ✓

3. Code Review
   └── Mínimo 1 aprovação
   └── Sem conflitos
   └── Coverage adequado

4. Merge
   └── Squash and merge
   └── Delete branch
```

### Sprint Workflow

```
Sprint (2 semanas)
├── Sprint Planning (Segunda)
│   └── Seleção de items do backlog
│   └── Estimativas
│   └── Commitment
│
├── Daily Standups (Diário)
│   └── O que fiz ontem?
│   └── O que farei hoje?
│   └── Algum bloqueio?
│
├── Development
│   └── Coding
│   └── Code Review
│   └── Testing
│
├── Sprint Review (Sexta - semana 2)
│   └── Demo das entregas
│   └── Feedback stakeholders
│
└── Sprint Retrospective
    └── O que funcionou?
    └── O que melhorar?
    └── Action items
```

---

## Convenções e Padrões

### Estrutura de Arquivos

#### Backend (NestJS)

```typescript
// Nome do arquivo: patients.service.ts
// Classe: PatientsService
// Método: createPatient, findPatientById, updatePatient

// DTOs: create-patient.dto.ts, update-patient.dto.ts
// Entities: patient.entity.ts
// Module: patients.module.ts
// Controller: patients.controller.ts
```

#### Frontend (Next.js)

```typescript
// Páginas: page.tsx (App Router convention)
// Componentes: patient-card.tsx, patient-form.tsx
// Hooks: use-patients.ts
// Types: patients.types.ts
// API: patients.ts (lib/api/)
```

### Naming Conventions

```typescript
// Variables: camelCase
const patientName = 'John Doe';

// Functions: camelCase, verb prefix
function getPatientById(id: string) {}
function createAppointment(data: AppointmentDto) {}

// Classes: PascalCase
class PatientService {}

// Interfaces: PascalCase, I prefix (opcional)
interface IPatient {}
interface Patient {}

// Types: PascalCase
type AppointmentStatus = 'scheduled' | 'completed';

// Enums: PascalCase
enum UserRole {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
}

// Constants: SCREAMING_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.healtflow.com';

// Files: kebab-case
patient-service.ts
create-patient.dto.ts

// Database tables: snake_case (Prisma convention)
user_profiles, medical_records
```

### API Conventions

```
RESTful Endpoints:

GET    /api/v1/patients          → Lista todos
GET    /api/v1/patients/:id      → Busca por ID
POST   /api/v1/patients          → Cria novo
PATCH  /api/v1/patients/:id      → Atualiza parcial
PUT    /api/v1/patients/:id      → Atualiza completo
DELETE /api/v1/patients/:id      → Remove

Query Parameters:
?page=1&limit=10                 → Paginação
?search=john                     → Busca
?status=active                   → Filtro
?sort=createdAt&order=desc       → Ordenação

Response Format:
{
  "success": true,
  "data": {...},
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100
  }
}

Error Format:
{
  "success": false,
  "error": {
    "code": "PATIENT_NOT_FOUND",
    "message": "Patient with ID xyz not found",
    "details": {}
  }
}
```

### Testing Conventions

```typescript
// Unit Test: *.spec.ts
// E2E Test: *.e2e-spec.ts

// Estrutura de teste
describe('PatientsService', () => {
  describe('createPatient', () => {
    it('should create a new patient successfully', async () => {
      // Arrange
      const dto = { name: 'John', email: 'john@test.com' };

      // Act
      const result = await service.createPatient(dto);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe('John');
    });

    it('should throw error if email already exists', async () => {
      // ...
    });
  });
});
```

---

## Roadmap

### 2025 H1

- [x] Documentação completa do sistema
- [ ] Testes E2E automatizados
- [ ] Cobertura de testes > 80%
- [ ] Performance optimization
- [ ] Integração com novos convênios

### 2025 H2

- [ ] App para Apple Watch
- [ ] Integração com wearables
- [ ] AI-powered diagnostics
- [ ] Chatbot para pacientes
- [ ] Multi-language support

### 2026

- [ ] Expansão para América Latina
- [ ] Blockchain para prontuários
- [ ] IoT médico
- [ ] Realidade aumentada para cirurgias
- [ ] Machine Learning preditivo

---

## Links Úteis

### Documentação Interna

- [Arquitetura](../architecture/README.md)
- [Guia Backend](../guides/backend/README.md)
- [Guia Frontend](../guides/frontend/README.md)
- [API Reference](../api/README.md)

### Recursos Externos

- [NestJS Docs](https://docs.nestjs.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Native](https://reactnative.dev/)
- [FHIR Standard](https://hl7.org/fhir/)
- [RNDS](https://rnds.datasus.gov.br/)

### Ferramentas

- [GitHub Repository](https://github.com/KallebyX/HealtFlow)
- [Swagger API Docs](http://localhost:3001/api/docs)
- [Prisma Studio](http://localhost:5555)

---

## Contato

Para dúvidas ou sugestões sobre esta wiki:

- **Email**: dev@healtflow.com.br
- **Slack**: #healtflow-dev
- **GitHub Issues**: [Abrir issue](https://github.com/KallebyX/HealtFlow/issues)
