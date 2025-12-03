# Manual do Usuário - Clínicas e Administradores

Guia completo para administradores e gestores de clínicas utilizarem o HealtFlow.

## Sumário

1. [Introdução](#introdução)
2. [Primeiro Acesso](#primeiro-acesso)
3. [Dashboard Administrativo](#dashboard-administrativo)
4. [Gestão da Clínica](#gestão-da-clínica)
5. [Gestão de Colaboradores](#gestão-de-colaboradores)
6. [Gestão de Médicos](#gestão-de-médicos)
7. [Configuração de Agenda](#configuração-de-agenda)
8. [Módulo Financeiro](#módulo-financeiro)
9. [Relatórios e Analytics](#relatórios-e-analytics)
10. [Configurações do Sistema](#configurações-do-sistema)

---

## Introdução

### O que é o HealtFlow?

O HealtFlow é uma plataforma completa de gestão de saúde que permite gerenciar todos os aspectos da sua clínica:

- ✅ Agendamento de consultas
- ✅ Prontuário eletrônico
- ✅ Prescrição digital
- ✅ Telemedicina
- ✅ Gestão financeira
- ✅ Relatórios e analytics
- ✅ Integração com RNDS/SUS

### Perfis de Acesso

| Perfil | Permissões |
|--------|------------|
| **Admin da Clínica** | Acesso total à clínica |
| **Gerente** | Gestão operacional, relatórios |
| **Recepcionista** | Agendamento, cadastro de pacientes |
| **Faturista** | Módulo financeiro |

---

## Primeiro Acesso

### 1. Recebendo suas Credenciais

Você receberá um email com:
- Link de acesso ao sistema
- Email de login
- Senha temporária

### 2. Primeiro Login

1. Acesse **https://app.healtflow.com.br**
2. Insira seu email e senha temporária
3. O sistema solicitará que você crie uma nova senha

### 3. Requisitos de Senha

Sua nova senha deve conter:
- ✅ Mínimo 8 caracteres
- ✅ Pelo menos uma letra maiúscula
- ✅ Pelo menos uma letra minúscula
- ✅ Pelo menos um número
- ✅ Pelo menos um caractere especial (@, #, $, etc.)

### 4. Ativando Autenticação em Duas Etapas (Recomendado)

Para maior segurança:

1. Vá em **Configurações > Segurança**
2. Clique em **Ativar 2FA**
3. Escaneie o QR Code com um app autenticador (Google Authenticator, Authy)
4. Digite o código de 6 dígitos para confirmar

---

## Dashboard Administrativo

### Visão Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                    DASHBOARD DA CLÍNICA                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Consultas    │  │ Pacientes    │  │ Receita      │          │
│  │ Hoje: 24     │  │ Total: 1.523 │  │ Mês: R$45k   │          │
│  │ ▲ +12%       │  │ ▲ +5%        │  │ ▲ +8%        │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                  AGENDA DO DIA                             │ │
│  │  08:00 - Dr. Carlos - João Silva - Cardiologia            │ │
│  │  08:30 - Dra. Ana - Maria Santos - Pediatria              │ │
│  │  09:00 - Dr. Carlos - Pedro Lima - Cardiologia            │ │
│  │  ...                                                       │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐  │
│  │ PRÓXIMOS VENCIMENTOS    │  │ ALERTAS                     │  │
│  │ • Alvará: 15/04/2024    │  │ • 3 consultas sem confirm.  │  │
│  │ • CRM Dr. João: 30/05   │  │ • 5 faturas em atraso       │  │
│  └─────────────────────────┘  └─────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Cards de Métricas

- **Consultas Hoje**: Total de consultas agendadas para o dia
- **Pacientes**: Total de pacientes cadastrados
- **Receita do Mês**: Faturamento do mês atual
- **Taxa de Ocupação**: Percentual de agenda preenchida

### Agenda do Dia

Visualização rápida de todas as consultas do dia, com:
- Horário
- Médico responsável
- Nome do paciente
- Especialidade
- Status (Confirmado, Aguardando, Em atendimento)

---

## Gestão da Clínica

### Dados Cadastrais

1. Acesse **Configurações > Dados da Clínica**
2. Preencha ou atualize:

| Campo | Descrição |
|-------|-----------|
| Razão Social | Nome legal da empresa |
| Nome Fantasia | Nome comercial |
| CNPJ | Cadastro Nacional de Pessoa Jurídica |
| CNES | Cadastro Nacional de Estabelecimentos de Saúde |
| Endereço | Endereço completo com CEP |
| Telefone | Telefone principal |
| Email | Email institucional |
| Site | Website da clínica |

### Especialidades

Para adicionar especialidades oferecidas:

1. Vá em **Configurações > Especialidades**
2. Clique em **+ Adicionar Especialidade**
3. Selecione da lista ou digite manualmente
4. Defina o valor padrão da consulta
5. Clique em **Salvar**

### Salas e Consultórios

Configure os espaços físicos:

1. Acesse **Configurações > Salas**
2. Clique em **+ Nova Sala**
3. Preencha:
   - Nome da sala (ex: "Consultório 1")
   - Tipo (Consultório, Sala de Exames, etc.)
   - Equipamentos disponíveis
   - Status (Ativo/Inativo)

### Horário de Funcionamento

1. Vá em **Configurações > Horários**
2. Defina para cada dia da semana:
   - Abertura
   - Fechamento
   - Intervalo (almoço)
3. Marque feriados e dias sem expediente

---

## Gestão de Colaboradores

### Cadastrando Colaboradores

1. Acesse **Equipe > Colaboradores**
2. Clique em **+ Novo Colaborador**
3. Preencha os dados:

```
┌─────────────────────────────────────────────────────────────────┐
│                  CADASTRO DE COLABORADOR                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Dados Pessoais                                                 │
│  ├── Nome Completo: ___________________________________        │
│  ├── CPF: _______________                                      │
│  ├── Email: ___________________________________                │
│  └── Telefone: _________________                               │
│                                                                 │
│  Dados Profissionais                                            │
│  ├── Cargo: [Selecione ▼]                                      │
│  │          • Recepcionista                                    │
│  │          • Faturista                                        │
│  │          • Gerente                                          │
│  │          • Enfermeiro(a)                                    │
│  │          • Técnico(a)                                       │
│  ├── Departamento: ___________________                         │
│  ├── Data de Admissão: ___/___/______                          │
│  └── Jornada: [Integral ▼]                                     │
│                                                                 │
│  Permissões de Acesso                                           │
│  ├── [x] Agenda                                                │
│  ├── [x] Pacientes                                             │
│  ├── [ ] Prontuário                                            │
│  ├── [ ] Financeiro                                            │
│  └── [ ] Relatórios                                            │
│                                                                 │
│                              [Cancelar]  [Salvar]               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Gerenciando Permissões

Cada cargo tem permissões padrão, mas você pode personalizar:

| Permissão | Recepção | Faturamento | Gerência |
|-----------|----------|-------------|----------|
| Agenda | ✅ | ❌ | ✅ |
| Pacientes | ✅ | ✅ | ✅ |
| Prontuário | ❌ | ❌ | 👁️ |
| Prescrições | ❌ | ❌ | 👁️ |
| Financeiro | ❌ | ✅ | ✅ |
| Relatórios | ❌ | ✅ | ✅ |
| Configurações | ❌ | ❌ | ✅ |

*👁️ = Apenas visualização*

### Desativando Colaboradores

1. Encontre o colaborador na lista
2. Clique nos três pontos (⋮)
3. Selecione **Desativar**
4. Confirme a ação

> **Nota**: Colaboradores desativados perdem acesso imediatamente, mas seus registros são mantidos para auditoria.

---

## Gestão de Médicos

### Cadastrando Médicos

1. Acesse **Equipe > Médicos**
2. Clique em **+ Novo Médico**
3. Preencha as informações:

**Dados Pessoais:**
- Nome completo
- CPF
- Data de nascimento
- Email e telefone

**Dados Profissionais:**
- CRM (número e estado)
- Especialidade principal
- Subespecialidades
- CNS (Cartão Nacional de Saúde)

**Configurações de Atendimento:**
- Duração padrão da consulta (minutos)
- Valor da consulta
- Aceita telemedicina?
- Horários de atendimento

### Configurando Agenda do Médico

1. Selecione o médico
2. Vá em **Agenda > Configurar Horários**
3. Para cada dia da semana:
   - Defina horário de início e fim
   - Marque intervalos (almoço, etc.)
   - Defina número máximo de pacientes

```
┌─────────────────────────────────────────────────────────────────┐
│           CONFIGURAÇÃO DE AGENDA - Dr. Carlos Silva             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Segunda-feira                                                  │
│  [x] Atende    Início: [08:00]  Fim: [12:00]                   │
│                Início: [14:00]  Fim: [18:00]                   │
│                                                                 │
│  Terça-feira                                                    │
│  [x] Atende    Início: [08:00]  Fim: [12:00]                   │
│                Início: [14:00]  Fim: [18:00]                   │
│                                                                 │
│  Quarta-feira                                                   │
│  [x] Atende    Início: [08:00]  Fim: [12:00]                   │
│                [ ] Tarde livre                                  │
│                                                                 │
│  Quinta-feira                                                   │
│  [x] Atende    (mesma configuração)                            │
│                                                                 │
│  Sexta-feira                                                    │
│  [x] Atende    (mesma configuração)                            │
│                                                                 │
│  Sábado                                                         │
│  [ ] Não atende                                                 │
│                                                                 │
│  Domingo                                                        │
│  [ ] Não atende                                                 │
│                                                                 │
│  Duração da consulta: [30] minutos                              │
│  Intervalo entre consultas: [5] minutos                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Bloqueando Horários

Para bloquear horários (férias, eventos, etc.):

1. Vá em **Agenda > Bloqueios**
2. Clique em **+ Novo Bloqueio**
3. Selecione:
   - Médico (ou todos)
   - Data/período
   - Motivo
4. Salvar

---

## Configuração de Agenda

### Tipos de Consulta

Configure os tipos de agendamento:

1. Acesse **Configurações > Tipos de Consulta**
2. Para cada tipo, defina:
   - Nome (Primeira consulta, Retorno, etc.)
   - Duração
   - Valor
   - Cor na agenda

### Regras de Agendamento

```
┌─────────────────────────────────────────────────────────────────┐
│              REGRAS DE AGENDAMENTO                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Antecedência                                                   │
│  ├── Mínima para agendar: [24] horas                           │
│  ├── Máxima para agendar: [90] dias                            │
│  └── Mínima para cancelar: [12] horas                          │
│                                                                 │
│  Confirmação                                                    │
│  ├── [x] Exigir confirmação do paciente                        │
│  ├── Prazo para confirmar: [48] horas antes                    │
│  └── [x] Cancelar automaticamente se não confirmar             │
│                                                                 │
│  Lembretes                                                      │
│  ├── [x] Email - [24] horas antes                              │
│  ├── [x] SMS - [2] horas antes                                 │
│  ├── [x] WhatsApp - [24] horas antes                           │
│  └── [x] Push notification - [1] hora antes                    │
│                                                                 │
│  Encaixes                                                       │
│  ├── [x] Permitir encaixes                                     │
│  └── Limite por dia: [2] encaixes                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Lista de Espera

Quando não há horários disponíveis:

1. O sistema oferece opção de lista de espera
2. Paciente é notificado quando surgir vaga
3. Vaga é oferecida por ordem de entrada
4. Prazo para aceitar: 2 horas

---

## Módulo Financeiro

### Tabela de Preços

1. Acesse **Financeiro > Tabela de Preços**
2. Configure valores para:
   - Consultas por especialidade
   - Procedimentos
   - Exames
   - Taxas adicionais

### Formas de Pagamento

Configure os métodos aceitos:

| Método | Configuração |
|--------|--------------|
| Dinheiro | Habilitar/desabilitar |
| Cartão de Crédito | Integração Stripe |
| Cartão de Débito | Integração Stripe |
| PIX | Chave PIX da clínica |
| Boleto | Dados bancários |
| Convênio | Configurar convênios |

### Convênios

Para adicionar um convênio:

1. Vá em **Financeiro > Convênios**
2. Clique em **+ Novo Convênio**
3. Preencha:
   - Nome do convênio
   - Código ANS
   - Tabela de procedimentos
   - Prazos de pagamento
   - Regras de autorização

### Faturamento

#### Gerando Faturas

1. Acesse **Financeiro > Faturas**
2. Clique em **+ Nova Fatura**
3. Selecione:
   - Paciente
   - Serviços prestados
   - Forma de pagamento
   - Descontos (se houver)

#### Recebendo Pagamentos

1. Encontre a fatura na lista
2. Clique em **Receber**
3. Confirme o valor e método
4. Emita o recibo

### Relatórios Financeiros

- **Faturamento por período**
- **Receitas por médico**
- **Receitas por convênio**
- **Inadimplência**
- **Fluxo de caixa**

---

## Relatórios e Analytics

### Tipos de Relatórios

1. **Operacionais**
   - Consultas realizadas
   - Taxa de ocupação
   - No-shows (faltas)
   - Tempo médio de atendimento

2. **Financeiros**
   - Faturamento
   - Receitas x Despesas
   - Ticket médio
   - Inadimplência

3. **Pacientes**
   - Novos cadastros
   - Retornos
   - Perfil demográfico
   - Satisfação

### Gerando Relatórios

1. Vá em **Relatórios**
2. Selecione o tipo de relatório
3. Defina o período
4. Aplique filtros (médico, especialidade, etc.)
5. Clique em **Gerar**

### Exportando Dados

Formatos disponíveis:
- PDF (para impressão)
- Excel (para análise)
- CSV (para integração)

---

## Configurações do Sistema

### Dados da Empresa

- Razão social, CNPJ, endereço
- Logo da clínica
- Informações de contato

### Integrações

- **RNDS**: Conexão com a Rede Nacional de Dados em Saúde
- **Convênios**: Integração com operadoras
- **Laboratórios**: Envio/recebimento de exames

### Notificações

Configure quando e como a clínica será notificada:
- Novos agendamentos
- Cancelamentos
- Pagamentos recebidos
- Alertas do sistema

### Backup e Segurança

- Backups automáticos diários
- Logs de acesso
- Política de senhas
- Sessões ativas

---

## Suporte

### Central de Ajuda

- **Chat**: Disponível no canto inferior direito
- **Email**: suporte@healtflow.com.br
- **Telefone**: 0800 123 4567
- **Horário**: Seg-Sex, 8h às 18h

### Treinamento

Solicite treinamento para sua equipe:
1. Acesse **Ajuda > Solicitar Treinamento**
2. Escolha a modalidade (online/presencial)
3. Indique número de participantes
4. Agende a data

---

## Dicas de Uso

### Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `Ctrl + N` | Novo agendamento |
| `Ctrl + P` | Buscar paciente |
| `Ctrl + F` | Buscar na tela |
| `Esc` | Fechar modal |

### Boas Práticas

1. **Mantenha dados atualizados**: Revise cadastros periodicamente
2. **Use tags e filtros**: Organize pacientes e consultas
3. **Confirme agendamentos**: Reduza no-shows
4. **Monitore relatórios**: Tome decisões baseadas em dados
5. **Faça backup**: Exporte dados importantes regularmente

---

*Última atualização: Dezembro 2025*
