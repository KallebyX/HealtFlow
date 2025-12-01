# HEALTHFLOW - Lista de Tarefas

## FASE 1 - Foundation (Setup do Monorepo)

### 1.1 Estrutura Base
- [ ] Inicializar monorepo com Turborepo
- [ ] Configurar workspaces (apps/, packages/)
- [ ] Setup TypeScript com strict mode
- [ ] Configurar ESLint e Prettier
- [ ] Setup Husky para pre-commit hooks

### 1.2 Package: Database
- [ ] Criar package @healthflow/database
- [ ] Configurar Prisma
- [ ] Implementar schema completo
- [ ] Criar migrations iniciais
- [ ] Setup seed data

### 1.3 Package: Shared
- [ ] Criar package @healthflow/shared
- [ ] Definir tipos compartilhados
- [ ] Criar utilitários comuns
- [ ] Exportar constantes globais

### 1.4 Package: Config
- [ ] Criar package @healthflow/config
- [ ] Configurações ESLint base
- [ ] Configurações TypeScript base
- [ ] Configurações Tailwind base

---

## FASE 2 - Backend API (NestJS)

### 2.1 Setup Base
- [ ] Criar app NestJS
- [ ] Configurar módulos core
- [ ] Setup Swagger/OpenAPI
- [ ] Configurar validação global
- [ ] Setup Redis e Bull queues

### 2.2 Auth Module
- [ ] Implementar registro de usuários
- [ ] Login com JWT
- [ ] Refresh token rotation
- [ ] Logout e invalidação
- [ ] Guards e decorators

### 2.3 Patients Module
- [ ] CRUD de pacientes
- [ ] Histórico médico
- [ ] Alergias e medicamentos
- [ ] Documentos e anexos
- [ ] Busca avançada

### 2.4 Doctors Module
- [ ] CRUD de médicos
- [ ] Especialidades
- [ ] Horários de atendimento
- [ ] Vinculação com clínicas

### 2.5 Clinics Module
- [ ] CRUD de clínicas
- [ ] Multi-tenancy setup
- [ ] Configurações por clínica
- [ ] Gestão de funcionários

### 2.6 Appointments Module
- [ ] CRUD de agendamentos
- [ ] Slots dinâmicos
- [ ] Verificação de conflitos
- [ ] Lembretes automáticos
- [ ] Cancelamento/Reagendamento

### 2.7 Consultations Module
- [ ] Registro de consultas
- [ ] SOAP notes completo
- [ ] Templates de anamnese
- [ ] Assinatura digital
- [ ] Histórico de alterações

### 2.8 Prescriptions Module
- [ ] Criar prescrições
- [ ] Medicamentos e posologia
- [ ] Integração com farmácias
- [ ] PDF para impressão
- [ ] Validação de interações

### 2.9 Laboratory Module
- [ ] Solicitação de exames
- [ ] Upload de resultados
- [ ] Valores de referência
- [ ] Alertas de valores críticos

### 2.10 Telemedicine Module
- [ ] Integração LiveKit
- [ ] Criação de salas
- [ ] Tokens de acesso
- [ ] Gravação de consultas

### 2.11 Gamification Module
- [ ] Sistema de XP e níveis
- [ ] Badges e conquistas
- [ ] Streaks de atividades
- [ ] Desafios de saúde
- [ ] Leaderboard

### 2.12 Billing Module
- [ ] Integração Stripe
- [ ] Planos e assinaturas
- [ ] Faturas e pagamentos
- [ ] Webhooks

### 2.13 Notifications Module
- [ ] Service multi-canal
- [ ] Templates de mensagens
- [ ] Filas de envio
- [ ] Logs de entrega

### 2.14 FHIR Integration
- [ ] Recursos FHIR R4
- [ ] Conversores de dados
- [ ] API FHIR compliant

### 2.15 RNDS Integration
- [ ] Autenticação gov.br
- [ ] Envio de registros
- [ ] Consulta de dados

---

## FASE 3 - Frontend Web (Next.js 14)

### 3.1 Setup Base
- [ ] Criar app Next.js 14
- [ ] Configurar App Router
- [ ] Setup TailwindCSS
- [ ] Instalar shadcn/ui
- [ ] Configurar autenticação

### 3.2 Layout e Navegação
- [ ] Layout responsivo Mobile First
- [ ] Sidebar/Menu adaptativo
- [ ] Header com user info
- [ ] Breadcrumbs
- [ ] Theme switcher (dark/light)

### 3.3 Páginas Públicas
- [ ] Landing page
- [ ] Login/Registro
- [ ] Recuperação de senha
- [ ] Termos e Privacidade

### 3.4 Dashboard
- [ ] Overview com métricas
- [ ] Gráficos e estatísticas
- [ ] Atividades recentes
- [ ] Alertas e notificações

### 3.5 Módulos de Gestão
- [ ] Lista e form de pacientes
- [ ] Lista e form de médicos
- [ ] Agenda de consultas
- [ ] Prontuário eletrônico
- [ ] Prescrições
- [ ] Exames laboratoriais

### 3.6 Telemedicina
- [ ] Sala de videochamada
- [ ] Chat durante consulta
- [ ] Compartilhamento de tela

### 3.7 Financeiro
- [ ] Dashboard financeiro
- [ ] Gestão de planos
- [ ] Histórico de pagamentos

---

## FASE 4 - Mobile App (React Native + Expo)

### 4.1 Setup Base
- [ ] Criar app Expo
- [ ] Configurar navegação
- [ ] Setup NativeWind
- [ ] Configurar autenticação

### 4.2 Telas do Paciente
- [ ] Login/Registro
- [ ] Perfil e dados pessoais
- [ ] Meus agendamentos
- [ ] Minhas consultas
- [ ] Minhas prescrições
- [ ] Meus exames

### 4.3 Gamificação
- [ ] Perfil de gamificação
- [ ] Badges conquistados
- [ ] Desafios ativos
- [ ] Ranking

### 4.4 Telemedicina Mobile
- [ ] Sala de videochamada
- [ ] Notificações push

---

## FASE 5 - Infrastructure

### 5.1 Docker
- [ ] Dockerfile para API
- [ ] Dockerfile para Web
- [ ] Docker Compose desenvolvimento
- [ ] Docker Compose produção

### 5.2 Kubernetes
- [ ] Deployments
- [ ] Services
- [ ] Ingress
- [ ] ConfigMaps e Secrets
- [ ] HPA (autoscaling)

### 5.3 CI/CD
- [ ] GitHub Actions - Lint
- [ ] GitHub Actions - Test
- [ ] GitHub Actions - Build
- [ ] GitHub Actions - Deploy

### 5.4 Monitoramento
- [ ] Prometheus metrics
- [ ] Grafana dashboards
- [ ] Alertas

---

## Legenda

- [ ] Pendente
- [x] Concluído
- [~] Em progresso
