# FAQ - Perguntas Frequentes

## Sumário

- [Geral](#geral)
- [Técnico](#técnico)
- [Usuários](#usuários)
- [Integração](#integração)
- [Segurança](#segurança)
- [Mobile](#mobile)

---

## Geral

### O que é o HealtFlow?

O HealtFlow é uma plataforma completa de gestão de saúde digital que conecta clínicas, médicos, pacientes, farmácias e laboratórios em um ecossistema unificado. Oferece prontuário eletrônico, agendamento, telemedicina, prescrição digital e muito mais.

### Quais são os requisitos mínimos para usar o HealtFlow?

**Para Web:**
- Navegador moderno (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Conexão com internet estável
- Resolução mínima: 1280x720

**Para Mobile:**
- iOS 13+ ou Android 8+
- 100MB de espaço livre
- Câmera (para telemedicina)

### O HealtFlow funciona offline?

Parcialmente. O app mobile possui funcionalidades offline limitadas:
- Visualização de consultas agendadas
- Acesso a prescrições salvas
- Histórico de consultas recentes

A sincronização completa requer conexão com internet.

### Quantos usuários simultâneos o sistema suporta?

A arquitetura foi projetada para suportar:
- 10.000+ usuários simultâneos por instância
- Auto-scaling horizontal com Kubernetes
- Load balancing com Nginx

### O sistema está em conformidade com a LGPD?

Sim. O HealtFlow implementa:
- Criptografia de dados sensíveis
- Consentimento explícito do paciente
- Direito ao esquecimento
- Portabilidade de dados
- Logs de auditoria completos
- Data Protection Officer (DPO) designado

---

## Técnico

### Como faço para configurar o ambiente de desenvolvimento?

```bash
# 1. Clone o repositório
git clone https://github.com/KallebyX/HealtFlow.git
cd HealtFlow

# 2. Instale as dependências
pnpm install

# 3. Configure variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# 4. Inicie os serviços Docker
docker-compose up -d

# 5. Execute as migrações
pnpm db:migrate

# 6. Popule o banco (opcional)
pnpm db:seed

# 7. Inicie o desenvolvimento
pnpm dev
```

### Quais são as portas padrão dos serviços?

| Serviço | Porta |
|---------|-------|
| Web App | 3000 |
| API | 3001 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| MinIO | 9000 (API), 9001 (Console) |
| MailHog | 1025 (SMTP), 8025 (UI) |
| Prisma Studio | 5555 |

### Como adiciono um novo módulo ao backend?

```bash
# 1. Crie a estrutura do módulo
mkdir -p apps/api/src/modules/novo-modulo/{dto,entities}

# 2. Crie os arquivos principais
touch apps/api/src/modules/novo-modulo/novo-modulo.module.ts
touch apps/api/src/modules/novo-modulo/novo-modulo.controller.ts
touch apps/api/src/modules/novo-modulo/novo-modulo.service.ts

# 3. Registre no app.module.ts
# Importe e adicione ao array imports
```

### Como executo os testes?

```bash
# Todos os testes
pnpm test

# Testes com coverage
pnpm test:coverage

# Testes E2E
pnpm test:e2e

# Testes de um módulo específico
pnpm test -- --testPathPattern=patients

# Watch mode
pnpm test:watch
```

### Como faço deploy para produção?

```bash
# 1. Build das aplicações
pnpm build

# 2. Build das imagens Docker
docker build -t healthflow-api:latest ./apps/api
docker build -t healthflow-web:latest ./apps/web

# 3. Push para registry
docker push healthflow-api:latest
docker push healthflow-web:latest

# 4. Deploy no Kubernetes
kubectl apply -k k8s/overlays/production/
```

### Como resolvo erros de migração do Prisma?

```bash
# Resetar banco de desenvolvimento
pnpm db:reset

# Recriar cliente Prisma
pnpm db:generate

# Forçar migração (CUIDADO em produção)
npx prisma migrate deploy

# Verificar status das migrações
npx prisma migrate status
```

---

## Usuários

### Como crio um novo tipo de usuário?

1. Adicione o role no enum `UserRole` em `schema.prisma`
2. Execute a migração: `pnpm db:migrate`
3. Atualize os guards de autorização
4. Adicione permissões específicas

### Como funciona a autenticação 2FA?

1. Usuário habilita 2FA nas configurações
2. Sistema gera QR code TOTP
3. Usuário escaneia com app autenticador
4. No próximo login, usuário informa código de 6 dígitos
5. Código válido por 30 segundos

### Esqueci a senha, como recupero?

1. Na tela de login, clique em "Esqueci minha senha"
2. Informe o email cadastrado
3. Receba link de recuperação por email
4. Clique no link (válido por 1 hora)
5. Defina nova senha
6. Faça login normalmente

### Como funciona o sistema de gamificação?

**Pontos:**
- Login diário: 10 pontos
- Completar perfil: 50 pontos
- Comparecer consulta: 100 pontos
- Tomar medicação: 20 pontos/dia

**Níveis:**
- Bronze: 0-500 pontos
- Prata: 501-2000 pontos
- Ouro: 2001-5000 pontos
- Platina: 5001-10000 pontos
- Diamante: 10001+ pontos

**Badges:**
- "Pontual": 5 consultas sem faltas
- "Saudável": 30 dias de streak
- "Veterano": 1 ano de uso

---

## Integração

### Como integro com o RNDS?

1. **Pré-requisitos:**
   - Certificado digital ICP-Brasil (e-CPF/e-CNPJ)
   - Cadastro no Portal de Serviços DATASUS
   - Credenciais OAuth2 do RNDS

2. **Configuração:**
```env
RNDS_ENABLED=true
RNDS_ENVIRONMENT=homologacao  # ou producao
RNDS_CLIENT_ID=seu_client_id
RNDS_CERTIFICATE_PATH=/path/to/certificado.p12
RNDS_CERTIFICATE_PASSWORD=senha_do_certificado
```

3. **Documentos suportados:**
   - Resultado de Exame Laboratorial
   - Sumário de Alta
   - Atestado Digital
   - Registro Imunobiológico
   - Dispensação de Medicamento

### Como configuro integração com Stripe?

```env
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_CURRENCY=brl
```

### A API segue o padrão FHIR?

Sim, o HealtFlow implementa o padrão FHIR R4 para interoperabilidade:

- Patient → FHIR Patient Resource
- Practitioner → FHIR Practitioner Resource
- Encounter → FHIR Encounter Resource
- Observation → FHIR Observation Resource
- MedicationRequest → FHIR MedicationRequest Resource

### Como configuro notificações push?

**Firebase (Android/iOS):**
```env
FIREBASE_PROJECT_ID=seu_projeto
FIREBASE_CLIENT_EMAIL=firebase@projeto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

**Email (SendGrid):**
```env
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@healtflow.com.br
```

**SMS/WhatsApp (Twilio):**
```env
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+5511999999999
TWILIO_WHATSAPP_NUMBER=+5511999999999
```

---

## Segurança

### Os dados são criptografados?

Sim, em múltiplas camadas:

- **Em trânsito:** TLS 1.3 para todas as comunicações
- **Em repouso:** Criptografia AES-256 para dados sensíveis
- **Senhas:** bcrypt com salt (10 rounds)
- **Tokens:** JWT com rotação automática

### Como funciona o controle de acesso?

O HealtFlow usa RBAC (Role-Based Access Control):

```
Super Admin → Acesso total
Admin → Administração do sistema
Clinic Admin → Gestão da clínica
Doctor → Atendimento clínico
Nurse → Apoio clínico
Receptionist → Agendamento e recepção
Patient → Acesso próprio
```

### O sistema tem logs de auditoria?

Sim, todas as ações são registradas:

- Quem (userId)
- O quê (action: CREATE, READ, UPDATE, DELETE)
- Quando (timestamp)
- Onde (IP, device)
- Dados antes/depois (quando aplicável)

Retenção padrão: 7 anos (configurável)

### Como reporto uma vulnerabilidade?

1. **NÃO** publique detalhes publicamente
2. Envie email para: security@healtflow.com.br
3. Inclua:
   - Descrição detalhada
   - Passos para reproduzir
   - Impacto potencial
4. Aguarde resposta em até 48h
5. Programa de bug bounty disponível

---

## Mobile

### O app funciona em tablets?

Sim, o app é responsivo e funciona em:
- iPhones (iOS 13+)
- iPads (iPadOS 13+)
- Smartphones Android (8+)
- Tablets Android (8+)

### Como habilito notificações push?

1. Abra o app
2. Vá em Configurações > Notificações
3. Ative "Permitir notificações"
4. Aceite a permissão do sistema
5. Selecione tipos de notificação desejados

### A telemedicina funciona em dados móveis?

Sim, mas recomendamos:
- Conexão 4G/5G estável
- Mínimo 1 Mbps de upload/download
- Wi-Fi preferível para melhor qualidade

### Como faço backup dos meus dados?

Os dados são automaticamente sincronizados com a nuvem. Para exportar:

1. Vá em Perfil > Meus Dados
2. Clique em "Exportar Dados"
3. Selecione formato (PDF ou JSON)
4. Receba por email ou baixe diretamente

---

## Precisa de mais ajuda?

- **Documentação:** [docs.healtflow.com.br](https://docs.healtflow.com.br)
- **Suporte:** suporte@healtflow.com.br
- **GitHub Issues:** [Abrir issue](https://github.com/KallebyX/HealtFlow/issues)
- **Chat ao vivo:** Disponível no app e site
