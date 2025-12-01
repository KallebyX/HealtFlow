# HEALTHFLOW - Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

### Adicionado
- FASE 1: Foundation completa
  - Monorepo com Turborepo e workspaces
  - NestJS API com Prisma Schema (40+ models, 25+ enums)
  - Next.js 14 Web App (Mobile First CSS)
  - React Native + Expo Mobile App
  - Packages: @healthflow/shared, config, types, ui
  - Docker Compose (PostgreSQL, Redis, MinIO, MailHog)
  - Configurações ESLint, Prettier, TypeScript strict
  - Estrutura de controle (.cursor/, docs/)
  - Arquivos de documentação (TODO.md, PROGRESS.md, CHANGELOG.md)

### Em Desenvolvimento
- FASE 2: Backend API - Módulos de funcionalidade

---

## Histórico de Versões

### Planejado

#### [1.0.0] - Data TBD
- Release inicial com funcionalidades core
- Auth, Patients, Doctors, Clinics
- Appointments e Consultations
- Frontend Web responsivo
- App Mobile básico

#### [1.1.0] - Data TBD
- Telemedicina completa
- Gamificação
- Integrações FHIR/RNDS

#### [1.2.0] - Data TBD
- Billing e pagamentos
- Laboratory avançado
- Analytics e relatórios
