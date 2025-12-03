# Documentação de Segurança e Compliance

Guia completo de segurança, privacidade e conformidade regulatória do HealtFlow.

## Sumário

1. [Visão Geral de Segurança](#visão-geral-de-segurança)
2. [Conformidade Regulatória](#conformidade-regulatória)
3. [Autenticação e Autorização](#autenticação-e-autorização)
4. [Proteção de Dados](#proteção-de-dados)
5. [Segurança de Infraestrutura](#segurança-de-infraestrutura)
6. [Auditoria e Logging](#auditoria-e-logging)
7. [Gestão de Incidentes](#gestão-de-incidentes)
8. [Políticas e Procedimentos](#políticas-e-procedimentos)
9. [Certificações](#certificações)
10. [Contatos de Segurança](#contatos-de-segurança)

---

## Visão Geral de Segurança

### Princípios de Segurança

O HealtFlow foi desenvolvido seguindo os princípios de **Security by Design**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAMADAS DE SEGURANÇA                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    PERÍMETRO                             │   │
│  │  • CloudFlare WAF                                        │   │
│  │  • DDoS Protection                                       │   │
│  │  • Rate Limiting                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    REDE                                  │   │
│  │  • TLS 1.3                                               │   │
│  │  • VPC Isolation                                         │   │
│  │  • Network Policies                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    APLICAÇÃO                             │   │
│  │  • Input Validation                                      │   │
│  │  • Output Encoding                                       │   │
│  │  • CORS Policy                                           │   │
│  │  • CSP Headers                                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    DADOS                                 │   │
│  │  • Encryption at Rest (AES-256)                          │   │
│  │  • Encryption in Transit (TLS)                           │   │
│  │  • Key Management (KMS)                                  │   │
│  │  • Data Masking                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    ACESSO                                │   │
│  │  • JWT Authentication                                    │   │
│  │  • 2FA/MFA                                               │   │
│  │  • RBAC                                                  │   │
│  │  • Session Management                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Modelo de Responsabilidade

| Responsabilidade | HealtFlow | Cliente |
|-----------------|-----------|---------|
| Segurança da plataforma | ✅ | |
| Patches e atualizações | ✅ | |
| Criptografia de dados | ✅ | |
| Controle de acesso | ✅ | ✅ |
| Gestão de usuários | | ✅ |
| Senhas dos usuários | | ✅ |
| Treinamento da equipe | | ✅ |

---

## Conformidade Regulatória

### LGPD (Lei Geral de Proteção de Dados)

O HealtFlow está em conformidade com a Lei nº 13.709/2018:

#### Bases Legais Utilizadas

| Tratamento | Base Legal |
|------------|------------|
| Prontuário médico | Tutela da saúde (Art. 7º, VIII) |
| Agendamentos | Execução de contrato (Art. 7º, V) |
| Marketing | Consentimento (Art. 7º, I) |
| Obrigações legais | Cumprimento legal (Art. 7º, II) |

#### Direitos do Titular

O sistema implementa todos os direitos do titular:

- ✅ **Confirmação e acesso** (Art. 18, I e II)
- ✅ **Correção** (Art. 18, III)
- ✅ **Anonimização/bloqueio/eliminação** (Art. 18, IV)
- ✅ **Portabilidade** (Art. 18, V)
- ✅ **Eliminação de consentimento** (Art. 18, VI)
- ✅ **Revogação do consentimento** (Art. 18, IX)

#### Funcionalidades LGPD

```
┌─────────────────────────────────────────────────────────────────┐
│                    PAINEL LGPD - PACIENTE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Seus Direitos de Privacidade                                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📥 Solicitar meus dados                                  │   │
│  │    Receba uma cópia de todos os seus dados              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ✏️ Corrigir dados                                        │   │
│  │    Atualize informações incorretas ou desatualizadas    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🔄 Portabilidade                                         │   │
│  │    Transfira seus dados para outro serviço              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🗑️ Exclusão de dados                                     │   │
│  │    Solicite a remoção dos seus dados                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ⚙️ Gerenciar consentimentos                              │   │
│  │    Controle como usamos seus dados                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### CFM (Conselho Federal de Medicina)

#### Resolução CFM nº 1.821/2007 (Prontuário Eletrônico)

- ✅ Certificação SBIS/CFM para S-RES
- ✅ Assinatura digital ICP-Brasil
- ✅ Garantia de integridade e autenticidade
- ✅ Tempo de retenção mínimo de 20 anos
- ✅ Acesso controlado por perfil profissional

#### Resolução CFM nº 2.314/2022 (Telemedicina)

- ✅ Registro de consentimento do paciente
- ✅ Garantia de confidencialidade
- ✅ Possibilidade de gravação (com consentimento)
- ✅ Ambiente virtual seguro

### ANVISA

#### RDC nº 44/2009 (Boas Práticas Farmacêuticas)

- ✅ Controle de medicamentos especiais
- ✅ Rastreabilidade de receitas
- ✅ Integração com SNGPC

### TISS (Troca de Informações em Saúde Suplementar)

- ✅ Padrão TISS para comunicação com operadoras
- ✅ Versão 3.05.00 ou superior
- ✅ XML conforme especificação ANS

### FHIR e HL7

- ✅ FHIR R4 para interoperabilidade
- ✅ Mapeamento de recursos padronizado
- ✅ Integração com RNDS

---

## Autenticação e Autorização

### Autenticação

#### JWT (JSON Web Token)

```typescript
// Estrutura do Token
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user-uuid",
    "email": "user@email.com",
    "role": "DOCTOR",
    "clinicId": "clinic-uuid",
    "iat": 1647123456,
    "exp": 1647124356,
    "iss": "healtflow",
    "aud": "healtflow-api"
  }
}
```

#### Configuração de Tokens

| Token | Validade | Uso |
|-------|----------|-----|
| Access Token | 15 minutos | Requisições à API |
| Refresh Token | 7 dias | Renovar access token |
| 2FA Token | 30 segundos | Código TOTP |
| Reset Token | 1 hora | Recuperação de senha |

#### Autenticação em Duas Etapas (2FA)

1. **TOTP (Time-based One-Time Password)**
   - Compatível com Google Authenticator, Authy
   - Algoritmo: SHA-1, 6 dígitos, 30 segundos

2. **Fluxo de Ativação**
   ```
   Usuário solicita ativar 2FA
              │
              ▼
   Sistema gera secret TOTP
              │
              ▼
   Usuário escaneia QR Code
              │
              ▼
   Usuário confirma com código
              │
              ▼
   2FA ativado + backup codes gerados
   ```

### Autorização (RBAC)

#### Matriz de Permissões

| Recurso | SuperAdmin | ClinicAdmin | Doctor | Nurse | Patient |
|---------|------------|-------------|--------|-------|---------|
| Criar paciente | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ver paciente | ✅ | ✅ | ✅ | ✅ | 👤 |
| Editar paciente | ✅ | ✅ | ✅ | ❌ | 👤 |
| Ver prontuário | ✅ | ❌ | ✅ | ✅ | 👤 |
| Criar consulta | ✅ | ❌ | ✅ | ❌ | ❌ |
| Prescrever | ✅ | ❌ | ✅ | ❌ | ❌ |
| Ver relatórios | ✅ | ✅ | ❌ | ❌ | ❌ |
| Configurações | ✅ | ✅ | ❌ | ❌ | ❌ |

*👤 = Apenas seus próprios dados*

#### Implementação

```typescript
// Decorator para verificar role
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DOCTOR, UserRole.NURSE)
@Get('patients/:id/medical-history')
async getMedicalHistory(@Param('id') id: string) {
  return this.patientService.getMedicalHistory(id);
}

// Guard de ownership
@UseGuards(JwtAuthGuard, OwnershipGuard)
@Get('my-consultations')
async getMyConsultations(@CurrentUser() user: User) {
  return this.consultationService.findByPatient(user.patient.id);
}
```

---

## Proteção de Dados

### Criptografia

#### Em Repouso (At Rest)

| Dado | Método | Chave |
|------|--------|-------|
| Senhas | bcrypt | 10 rounds |
| Dados sensíveis | AES-256-GCM | KMS |
| Backups | AES-256 | KMS |
| S3/MinIO | Server-side encryption | AWS KMS |

#### Em Trânsito (In Transit)

- TLS 1.3 obrigatório
- Certificados Let's Encrypt (auto-renovação)
- HSTS habilitado (max-age: 1 ano)
- Certificate pinning no app mobile

### Mascaramento de Dados

```typescript
// Dados mascarados nas respostas
{
  "cpf": "***456789**",
  "email": "j***@email.com",
  "phone": "****-9999",
  "creditCard": "**** **** **** 1234"
}

// Implementação
function maskCPF(cpf: string): string {
  return cpf.replace(/^(\d{3})(\d{4})(\d{2})$/, '***$2**');
}
```

### Anonimização

Para dados usados em analytics e pesquisa:

```typescript
// Dados anonimizados
{
  "ageRange": "40-50",
  "gender": "M",
  "region": "Sudeste",
  "diagnosis": "I10", // CID-10
  "outcome": "improved"
}
```

### Retenção de Dados

| Tipo de Dado | Período | Base Legal |
|--------------|---------|------------|
| Prontuário médico | 20 anos | CFM 1.821/2007 |
| Prescrições | 5 anos | RDC 20/2011 |
| Logs de acesso | 5 anos | Marco Civil |
| Dados financeiros | 5 anos | Código Civil |
| Consentimentos | Enquanto vigente | LGPD |
| Backups | 90 dias | Política interna |

---

## Segurança de Infraestrutura

### Proteção de Rede

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARQUITETURA DE REDE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Internet                                                       │
│      │                                                          │
│      ▼                                                          │
│  ┌────────────────┐                                             │
│  │   CloudFlare   │  WAF, DDoS, Bot Protection                  │
│  └───────┬────────┘                                             │
│          │                                                      │
│          ▼                                                      │
│  ┌────────────────┐                                             │
│  │    Firewall    │  Allow: 80, 443                             │
│  └───────┬────────┘                                             │
│          │                                                      │
│  ════════╪═══════════════════════════════════════════           │
│  │       │           VPC (10.0.0.0/16)              │           │
│  │       ▼                                          │           │
│  │  ┌─────────────┐     ┌─────────────┐            │           │
│  │  │   Public    │     │   Public    │            │           │
│  │  │  Subnet A   │     │  Subnet B   │            │           │
│  │  │ (Ingress)   │     │ (Ingress)   │            │           │
│  │  └──────┬──────┘     └──────┬──────┘            │           │
│  │         │                   │                   │           │
│  │         └─────────┬─────────┘                   │           │
│  │                   │                             │           │
│  │  ┌─────────────────────────────────────────┐   │           │
│  │  │          Private Subnet                 │   │           │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐ │   │           │
│  │  │  │   API   │  │   Web   │  │ Workers │ │   │           │
│  │  │  │  Pods   │  │  Pods   │  │  Pods   │ │   │           │
│  │  │  └─────────┘  └─────────┘  └─────────┘ │   │           │
│  │  └─────────────────────────────────────────┘   │           │
│  │                   │                             │           │
│  │  ┌─────────────────────────────────────────┐   │           │
│  │  │          Database Subnet                │   │           │
│  │  │  ┌───────────┐  ┌───────────┐          │   │           │
│  │  │  │ PostgreSQL│  │   Redis   │          │   │           │
│  │  │  │  Primary  │  │  Cluster  │          │   │           │
│  │  │  └───────────┘  └───────────┘          │   │           │
│  │  └─────────────────────────────────────────┘   │           │
│  │                                                │           │
│  ═════════════════════════════════════════════════            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Segurança de Container

```yaml
# Pod Security Policy
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: healthflow-restricted
spec:
  privileged: false
  runAsUser:
    rule: MustRunAsNonRoot
  seLinux:
    rule: RunAsAny
  fsGroup:
    rule: RunAsAny
  volumes:
    - 'configMap'
    - 'secret'
    - 'persistentVolumeClaim'
  hostNetwork: false
  hostIPC: false
  hostPID: false
  readOnlyRootFilesystem: true
```

### Scan de Vulnerabilidades

```yaml
# GitHub Actions - Security Scan
- name: Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: 'ghcr.io/healthflow/api:latest'
    format: 'sarif'
    output: 'trivy-results.sarif'
    severity: 'CRITICAL,HIGH'

- name: Upload results to GitHub Security
  uses: github/codeql-action/upload-sarif@v2
  with:
    sarif_file: 'trivy-results.sarif'
```

---

## Auditoria e Logging

### Eventos Auditados

```typescript
enum AuditAction {
  // Autenticação
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  MFA_ENABLED = 'MFA_ENABLED',

  // CRUD
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',

  // Operações sensíveis
  EXPORT = 'EXPORT',
  PRINT = 'PRINT',
  SHARE = 'SHARE',

  // Compliance
  CONSENT_GIVEN = 'CONSENT_GIVEN',
  CONSENT_REVOKED = 'CONSENT_REVOKED',
  DATA_REQUEST = 'DATA_REQUEST',
  DATA_DELETION = 'DATA_DELETION',
}
```

### Estrutura do Log de Auditoria

```json
{
  "id": "uuid",
  "timestamp": "2024-03-15T10:30:00Z",
  "userId": "user-uuid",
  "userEmail": "doctor@clinic.com",
  "userRole": "DOCTOR",
  "action": "READ",
  "resource": "PATIENT_MEDICAL_HISTORY",
  "resourceId": "patient-uuid",
  "clinicId": "clinic-uuid",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "requestId": "req-uuid",
  "success": true,
  "metadata": {
    "fields_accessed": ["diagnosis", "prescriptions"]
  }
}
```

### Retenção de Logs

| Tipo | Retenção | Storage |
|------|----------|---------|
| Audit logs | 7 anos | S3 Glacier |
| Access logs | 1 ano | S3 Standard |
| Error logs | 90 dias | CloudWatch |
| Debug logs | 7 dias | Local |

### Alertas de Segurança

```yaml
# Alertas automáticos
alerts:
  - name: Multiple Failed Logins
    condition: failed_logins > 5 in 5 minutes
    action: block_ip, notify_security

  - name: Bulk Data Export
    condition: export_records > 1000
    action: notify_security, require_approval

  - name: Off-hours Access
    condition: access outside 06:00-22:00
    action: notify_admin

  - name: Privilege Escalation
    condition: role_change detected
    action: notify_security, require_mfa
```

---

## Gestão de Incidentes

### Classificação de Incidentes

| Severidade | Descrição | Tempo de Resposta |
|------------|-----------|-------------------|
| P0 - Crítico | Vazamento de dados, sistema fora | 15 minutos |
| P1 - Alto | Funcionalidade crítica afetada | 1 hora |
| P2 - Médio | Funcionalidade degradada | 4 horas |
| P3 - Baixo | Problema isolado | 24 horas |

### Plano de Resposta

```
┌─────────────────────────────────────────────────────────────────┐
│              FLUXO DE RESPOSTA A INCIDENTES                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. DETECÇÃO                                                    │
│     ├── Monitoramento automático                                │
│     ├── Relato de usuário                                       │
│     └── Análise de segurança                                    │
│              │                                                  │
│              ▼                                                  │
│  2. CONTENÇÃO                                                   │
│     ├── Isolar sistemas afetados                                │
│     ├── Bloquear acessos suspeitos                              │
│     └── Preservar evidências                                    │
│              │                                                  │
│              ▼                                                  │
│  3. INVESTIGAÇÃO                                                │
│     ├── Análise de logs                                         │
│     ├── Identificar causa raiz                                  │
│     └── Avaliar impacto                                         │
│              │                                                  │
│              ▼                                                  │
│  4. ERRADICAÇÃO                                                 │
│     ├── Remover ameaça                                          │
│     ├── Corrigir vulnerabilidade                                │
│     └── Atualizar sistemas                                      │
│              │                                                  │
│              ▼                                                  │
│  5. RECUPERAÇÃO                                                 │
│     ├── Restaurar serviços                                      │
│     ├── Monitorar anomalias                                     │
│     └── Validar integridade                                     │
│              │                                                  │
│              ▼                                                  │
│  6. LIÇÕES APRENDIDAS                                           │
│     ├── Post-mortem                                             │
│     ├── Atualizar procedimentos                                 │
│     └── Treinamento                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Comunicação de Incidentes

#### Para ANPD (Autoridade Nacional de Proteção de Dados)

Em caso de vazamento de dados pessoais:
- Prazo: 72 horas
- Canal: formulário ANPD
- Conteúdo: natureza, titulares afetados, medidas

#### Para Titulares

- Comunicação clara e acessível
- Medidas de mitigação disponíveis
- Canais de suporte

---

## Políticas e Procedimentos

### Política de Senhas

| Requisito | Valor |
|-----------|-------|
| Comprimento mínimo | 8 caracteres |
| Complexidade | Maiúscula + minúscula + número + símbolo |
| Histórico | Últimas 5 senhas não podem ser reutilizadas |
| Expiração | 90 dias (recomendado) |
| Bloqueio | 5 tentativas = bloqueio 15 min |

### Política de Acesso

1. **Princípio do menor privilégio**
   - Acesso apenas ao necessário para a função

2. **Segregação de funções**
   - Separação entre quem aprova e quem executa

3. **Revisão periódica**
   - Revisão trimestral de acessos
   - Desativação imediata em desligamentos

### Política de Backup

- Backup diário incremental
- Backup semanal completo
- Retenção de 90 dias
- Teste de restauração mensal
- Armazenamento geográfico distribuído

---

## Certificações

### Conformidades Atuais

- ✅ **LGPD** - Lei Geral de Proteção de Dados
- ✅ **CFM** - Padrões do Conselho Federal de Medicina
- ✅ **SBIS** - Sociedade Brasileira de Informática em Saúde
- ✅ **TISS** - Padrão ANS para operadoras

### Em Processo

- 🔄 **ISO 27001** - Gestão de Segurança da Informação
- 🔄 **SOC 2 Type II** - Controles de Segurança
- 🔄 **HIPAA** - Para expansão internacional

---

## Contatos de Segurança

### Equipe de Segurança

- **CISO**: ciso@healtflow.com.br
- **Security Team**: security@healtflow.com.br
- **DPO**: dpo@healtflow.com.br

### Reportar Vulnerabilidades

Se você descobriu uma vulnerabilidade de segurança:

1. **NÃO** divulgue publicamente
2. Envie para: **security@healtflow.com.br**
3. Use nossa chave PGP (disponível em healtflow.com.br/security.txt)
4. Inclua:
   - Descrição detalhada
   - Passos para reproduzir
   - Impacto potencial

### Bug Bounty

Participamos de programa de bug bounty:
- Vulnerabilidades críticas: até R$ 10.000
- Vulnerabilidades altas: até R$ 5.000
- Vulnerabilidades médias: até R$ 1.000

Regras completas em: healtflow.com.br/bug-bounty

---

## Atualizações

Este documento é revisado:
- Trimestralmente (revisão regular)
- Após incidentes de segurança
- Quando há mudanças regulatórias

---

*Última atualização: Dezembro 2025*
*Versão: 2.0*
