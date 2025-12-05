# HealtFlow - Documentação Completa

<div align="center">

![HealtFlow Logo](../apps/web/public/logo.png)

**Sistema de Gestão de Saúde Inteligente**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/KallebyX/HealtFlow)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/KallebyX/HealtFlow/actions)

</div>

---

## Sobre Esta Documentação

Esta documentação abrangente foi desenvolvida para fornecer informações completas sobre o sistema HealtFlow, cobrindo todos os aspectos técnicos, operacionais e de usuário.

## Índice Geral

### Para Desenvolvedores

| Documento | Descrição |
|-----------|-----------|
| [Arquitetura do Sistema](./architecture/README.md) | Visão geral da arquitetura, padrões e decisões técnicas |
| [Guia Backend](./guides/backend/README.md) | Desenvolvimento com NestJS, Prisma e APIs |
| [Guia Frontend](./guides/frontend/README.md) | Desenvolvimento com Next.js e React |
| [Guia Mobile](./guides/mobile/README.md) | Desenvolvimento com React Native e Expo |
| [Guia DevOps](./guides/devops/README.md) | Docker, Kubernetes, CI/CD e infraestrutura |
| [Documentação de APIs](./api/README.md) | Referência completa das APIs REST |
| [Integrações](./integration/README.md) | FHIR, RNDS, pagamentos e mais |

### Para Designers

| Documento | Descrição |
|-----------|-----------|
| [Design System](./design/README.md) | Componentes, tokens e padrões visuais |
| [Componentes UI](./design/ui-components/README.md) | Biblioteca de componentes |
| [Fluxos UX](./design/ux-flows/README.md) | Jornadas de usuário e wireframes |
| [Identidade Visual](./design/brand/README.md) | Logo, cores, tipografia |

### Para Usuários Finais

| Manual | Perfil |
|--------|--------|
| [Manual da Clínica](./user-manuals/clinics/README.md) | Administradores e gestores de clínicas |
| [Manual do Médico](./user-manuals/doctors/README.md) | Médicos e profissionais de saúde |
| [Manual do Paciente](./user-manuals/patients/README.md) | Pacientes e acompanhantes |
| [Manual da Farmácia](./user-manuals/pharmacies/README.md) | Farmacêuticos e atendentes |
| [Manual do Laboratório](./user-manuals/laboratories/README.md) | Técnicos e gestores laboratoriais |
| [Manual Administrativo](./user-manuals/admin/README.md) | Super administradores do sistema |

### Wiki e Referência

| Documento | Descrição |
|-----------|-----------|
| [Wiki do Projeto](./wiki/README.md) | Base de conhecimento geral |
| [Segurança e Compliance](./security/README.md) | LGPD, CFM, SBIS e certificações |
| [FAQ](./wiki/FAQ.md) | Perguntas frequentes |
| [Glossário](./wiki/GLOSSARY.md) | Termos técnicos e de saúde |

---

## Visão Geral do Sistema

### O que é o HealtFlow?

O **HealtFlow** é uma plataforma completa de gestão de saúde que integra clínicas, médicos, pacientes, farmácias e laboratórios em um ecossistema digital unificado. O sistema oferece:

- **Gestão de Clínicas**: Administração completa de estabelecimentos de saúde
- **Prontuário Eletrônico**: Registros médicos digitais seguros e padronizados
- **Agendamento Inteligente**: Sistema avançado de marcação de consultas
- **Telemedicina**: Consultas por vídeo com qualidade profissional
- **Prescrição Digital**: Receitas eletrônicas com assinatura digital
- **Integração Laboratorial**: Pedidos e resultados de exames online
- **Financeiro**: Faturamento, pagamentos e gestão de convênios
- **Gamificação**: Engajamento de pacientes com pontos e conquistas

### Stack Tecnológico

```
┌─────────────────────────────────────────────────────────────────┐
│                        HEALTHFLOW STACK                         │
├─────────────────────────────────────────────────────────────────┤
│  Frontend Web    │  Next.js 14 + React 18 + Tailwind CSS        │
│  Mobile App      │  React Native + Expo 50                      │
│  Backend API     │  NestJS 10 + TypeScript                      │
│  Database        │  PostgreSQL 16 + Prisma ORM                  │
│  Cache/Queue     │  Redis 7 + Bull                              │
│  Storage         │  AWS S3 / MinIO                              │
│  Telemedicina    │  LiveKit                                     │
│  Pagamentos      │  Stripe + PIX + Boleto                       │
│  Notificações    │  Firebase + SendGrid + Twilio                │
│  Infraestrutura  │  Docker + Kubernetes + Nginx                 │
├─────────────────────────────────────────────────────────────────┤
│  Integrações     │  FHIR R4, RNDS, ICP-Brasil, TISS             │
└─────────────────────────────────────────────────────────────────┘
```

### Arquitetura de Alto Nível

```
                                    ┌─────────────────┐
                                    │   CloudFlare    │
                                    │   (CDN + WAF)   │
                                    └────────┬────────┘
                                             │
                                    ┌────────▼────────┐
                                    │     Nginx       │
                                    │  Load Balancer  │
                                    └────────┬────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
           ┌────────▼────────┐     ┌────────▼────────┐     ┌────────▼────────┐
           │    Web App      │     │    API Server   │     │  Mobile App     │
           │   (Next.js)     │     │    (NestJS)     │     │ (React Native)  │
           │    Port 3000    │     │    Port 3001    │     │   (Expo)        │
           └─────────────────┘     └────────┬────────┘     └─────────────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │                       │                       │
           ┌────────▼────────┐    ┌────────▼────────┐    ┌────────▼────────┐
           │   PostgreSQL    │    │     Redis       │    │   MinIO/S3      │
           │   (Database)    │    │    (Cache)      │    │   (Storage)     │
           └─────────────────┘    └─────────────────┘    └─────────────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │                       │                       │
           ┌────────▼────────┐    ┌────────▼────────┐    ┌────────▼────────┐
           │    Firebase     │    │    SendGrid     │    │     Twilio      │
           │     (Push)      │    │    (Email)      │    │   (SMS/WhatsApp)│
           └─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## Início Rápido

### Pré-requisitos

- Node.js 18+
- pnpm 8+
- Docker e Docker Compose
- Git

### Instalação

```bash
# Clone o repositório
git clone https://github.com/KallebyX/HealtFlow.git
cd HealtFlow

# Instale as dependências
pnpm install

# Configure as variáveis de ambiente
cp .env.example .env

# Inicie os serviços Docker
docker-compose up -d

# Execute as migrações do banco
pnpm db:migrate

# Popule o banco com dados iniciais
pnpm db:seed

# Inicie o ambiente de desenvolvimento
pnpm dev
```

### URLs de Desenvolvimento

| Serviço | URL |
|---------|-----|
| Web App | http://localhost:3000 |
| API | http://localhost:3001 |
| API Docs (Swagger) | http://localhost:3001/api/docs |
| Prisma Studio | http://localhost:5555 |
| MinIO Console | http://localhost:9001 |
| MailHog | http://localhost:8025 |

---

## Perfis de Usuário

O HealtFlow suporta diversos perfis de usuário, cada um com funcionalidades específicas:

### Administração do Sistema
- **Super Admin**: Acesso total ao sistema
- **Admin**: Administração geral

### Gestão de Clínicas
- **Admin da Clínica**: Proprietário/administrador da clínica
- **Gerente da Clínica**: Gestão operacional

### Profissionais de Saúde
- **Médico**: Atendimento clínico completo
- **Enfermeiro**: Apoio ao atendimento
- **Farmacêutico**: Dispensação de medicamentos
- **Fisioterapeuta**: Reabilitação
- **Psicólogo**: Saúde mental
- **Nutricionista**: Nutrição clínica
- **Dentista**: Odontologia

### Laboratório
- **Técnico de Laboratório**: Execução de exames
- **Gerente de Laboratório**: Gestão laboratorial

### Administrativo
- **Recepcionista**: Atendimento ao público
- **Faturista**: Contas e cobranças
- **Secretário(a)**: Apoio administrativo

### Pacientes
- **Paciente**: Usuário final do sistema de saúde

---

## Módulos do Sistema

| Módulo | Descrição | Status |
|--------|-----------|--------|
| Autenticação | Login, 2FA, recuperação de senha | ✅ Completo |
| Pacientes | Cadastro e gestão de pacientes | ✅ Completo |
| Médicos | Gestão de profissionais de saúde | ✅ Completo |
| Clínicas | Administração de estabelecimentos | ✅ Completo |
| Agendamento | Marcação e gestão de consultas | ✅ Completo |
| Consultas | Prontuário eletrônico (SOAP) | ✅ Completo |
| Prescrições | Receitas digitais | ✅ Completo |
| Laboratório | Pedidos e resultados de exames | ✅ Completo |
| Telemedicina | Consultas por vídeo | ✅ Completo |
| Gamificação | Pontos, badges e desafios | ✅ Completo |
| Financeiro | Faturamento e pagamentos | ✅ Completo |
| Notificações | Push, email, SMS, WhatsApp | ✅ Completo |
| Analytics | Relatórios e dashboards | ✅ Completo |
| FHIR | Interoperabilidade FHIR R4 | ✅ Completo |
| RNDS | Integração com SUS | ✅ Completo |

---

## Suporte e Comunidade

### Canais de Suporte

- **Issues**: [GitHub Issues](https://github.com/KallebyX/HealtFlow/issues)
- **Discussions**: [GitHub Discussions](https://github.com/KallebyX/HealtFlow/discussions)
- **Email**: suporte@healtflow.com.br

### Contribuindo

Veja o [Guia de Contribuição](./wiki/CONTRIBUTING.md) para saber como contribuir com o projeto.

### Licença

Este projeto está licenciado sob a [Licença MIT](../LICENSE).

---

## Changelog

Veja o [CHANGELOG](../CHANGELOG.md) para o histórico de versões.

---

<div align="center">

**HealtFlow** - Transformando a Saúde Digital

Feito com ❤️ pela equipe HealtFlow

</div>
