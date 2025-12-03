# Manual do Usuário - Médicos

Guia completo para médicos e profissionais de saúde utilizarem o HealtFlow.

## Sumário

1. [Introdução](#introdução)
2. [Primeiro Acesso](#primeiro-acesso)
3. [Dashboard do Médico](#dashboard-do-médico)
4. [Agenda e Consultas](#agenda-e-consultas)
5. [Atendimento ao Paciente](#atendimento-ao-paciente)
6. [Prontuário Eletrônico](#prontuário-eletrônico)
7. [Prescrição Digital](#prescrição-digital)
8. [Solicitação de Exames](#solicitação-de-exames)
9. [Telemedicina](#telemedicina)
10. [Certificado Digital](#certificado-digital)

---

## Introdução

### Por que usar o HealtFlow?

O HealtFlow foi desenvolvido para facilitar o dia a dia do médico:

- ✅ **Prontuário eletrônico** completo e organizado
- ✅ **Prescrição digital** com assinatura eletrônica
- ✅ **Telemedicina** integrada
- ✅ **Histórico do paciente** acessível em segundos
- ✅ **Integração com RNDS** automática
- ✅ **Conformidade com CFM** e LGPD

### Requisitos

- Navegador atualizado (Chrome, Firefox, Safari, Edge)
- Certificado digital ICP-Brasil (para prescrições controladas)
- Webcam e microfone (para telemedicina)

---

## Primeiro Acesso

### 1. Credenciais

Você receberá por email:
- Link de acesso
- Usuário (seu email)
- Senha temporária

### 2. Login Inicial

1. Acesse **https://app.healtflow.com.br**
2. Digite email e senha temporária
3. Crie sua nova senha (mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo)

### 3. Complete seu Perfil

Após o primeiro login, complete:
- Foto profissional
- CRM e estado
- Especialidades
- CNS (Cartão Nacional de Saúde)
- Configurações de agenda

### 4. Configure a Autenticação 2FA

Recomendamos ativar para maior segurança:
1. **Configurações > Segurança**
2. **Ativar Autenticação em Duas Etapas**
3. Escaneie o QR Code com Google Authenticator ou Authy

---

## Dashboard do Médico

### Visão Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                    DASHBOARD - Dr. Carlos Silva                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Bom dia, Dr. Carlos!                     📅 Terça, 15 Mar 2024 │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Consultas    │  │ Próximo      │  │ Pendências   │          │
│  │ Hoje: 12     │  │ Paciente     │  │              │          │
│  │ Realizadas: 5│  │ João Silva   │  │ 3 exames     │          │
│  │ Restantes: 7 │  │ 10:30        │  │ 2 prescrições│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  AGENDA DE HOJE                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  ✓ 08:00  Maria Santos      Retorno     ✓ Finalizado           │
│  ✓ 08:30  Pedro Lima        1ª Consulta ✓ Finalizado           │
│  ✓ 09:00  Ana Oliveira      Retorno     ✓ Finalizado           │
│  → 09:30  Carlos Souza      Emergência  ● Em atendimento       │
│  ○ 10:00  Lucia Ferreira    Retorno     ○ Aguardando           │
│  ○ 10:30  João Silva        1ª Consulta ○ Aguardando           │
│  ...                                                            │
│                                                                 │
│  ALERTAS                                                        │
│  ─────────────────────────────────────────────────────────────  │
│  ⚠ Resultado crítico: Glicemia de Maria Santos (250 mg/dL)     │
│  ⚠ Paciente João Silva alérgico a Penicilina                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Elementos do Dashboard

- **Consultas do dia**: Total, realizadas e restantes
- **Próximo paciente**: Nome e horário
- **Pendências**: Exames para analisar, prescrições para assinar
- **Agenda**: Lista de consultas com status
- **Alertas**: Resultados críticos, alergias, avisos importantes

---

## Agenda e Consultas

### Visualizando a Agenda

Acesse **Agenda** no menu lateral. Você pode visualizar:

- **Dia**: Todas as consultas do dia selecionado
- **Semana**: Visão semanal
- **Mês**: Calendário mensal

### Cores e Status

| Cor | Status |
|-----|--------|
| 🔵 Azul | Confirmado |
| 🟡 Amarelo | Aguardando confirmação |
| 🟢 Verde | Check-in realizado |
| 🟣 Roxo | Em atendimento |
| ⬜ Cinza | Finalizado |
| 🔴 Vermelho | Cancelado/No-show |

### Iniciando uma Consulta

1. Encontre o paciente na agenda
2. Clique no nome ou no botão **Iniciar**
3. O sistema abrirá a tela de atendimento
4. O status muda para "Em atendimento"

### Bloqueando Horários

Para bloquear horários (reunião, evento, etc.):
1. Clique no horário desejado
2. Selecione **Bloquear horário**
3. Adicione o motivo
4. Defina se é recorrente

---

## Atendimento ao Paciente

### Tela de Atendimento

```
┌─────────────────────────────────────────────────────────────────┐
│  CONSULTA - João da Silva                          [Finalizar]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ DADOS DO PACIENTE                                 [Editar]│  │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ Nome: João da Silva                                      │   │
│  │ Idade: 45 anos (15/05/1979)                              │   │
│  │ CPF: ***456789**                                         │   │
│  │ Convênio: Unimed - Plano Especial                        │   │
│  │                                                          │   │
│  │ ⚠ ALERGIAS: Penicilina, Dipirona                        │   │
│  │ 💊 EM USO: Losartana 50mg, AAS 100mg                     │   │
│  │ 🩺 CONDIÇÕES: HAS, DM2                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Histórico] [Exames] [Prescrições] [Documentos]               │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  REGISTRO SOAP                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ S - Subjetivo (Queixa principal)                        │   │
│  │ ┌─────────────────────────────────────────────────────┐ │   │
│  │ │ Paciente relata dor no peito há 3 dias, tipo       │ │   │
│  │ │ pressão, que piora aos esforços...                  │ │   │
│  │ └─────────────────────────────────────────────────────┘ │   │
│  │                                                          │   │
│  │ O - Objetivo (Exame físico)                              │   │
│  │ ┌─────────────────────────────────────────────────────┐ │   │
│  │ │ PA: 140/90 mmHg | FC: 88 bpm | Temp: 36.5°C        │ │   │
│  │ │ Ausculta cardíaca: BRNF, sem sopros                 │ │   │
│  │ │ Ausculta pulmonar: MV+ bilateral, sem RA            │ │   │
│  │ └─────────────────────────────────────────────────────┘ │   │
│  │                                                          │   │
│  │ A - Avaliação (Hipótese diagnóstica)                    │   │
│  │ ┌─────────────────────────────────────────────────────┐ │   │
│  │ │ CID: I20 - Angina pectoris                          │ │   │
│  │ │ Suspeita de angina estável. Necessário investigação │ │   │
│  │ └─────────────────────────────────────────────────────┘ │   │
│  │                                                          │   │
│  │ P - Plano (Conduta)                                      │   │
│  │ ┌─────────────────────────────────────────────────────┐ │   │
│  │ │ 1. Solicitar ECG e enzimas cardíacas                │ │   │
│  │ │ 2. Manter medicações em uso                         │ │   │
│  │ │ 3. Orientar repouso relativo                        │ │   │
│  │ │ 4. Retorno em 7 dias com exames                     │ │   │
│  │ └─────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Prescrever] [Solicitar Exames] [Atestado] [Finalizar]        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Sinais Vitais

Registre os sinais vitais do paciente:

| Sinal | Campo | Unidade |
|-------|-------|---------|
| Pressão Arterial | Sistólica/Diastólica | mmHg |
| Frequência Cardíaca | FC | bpm |
| Temperatura | Temp | °C |
| Frequência Respiratória | FR | irpm |
| Saturação O2 | SpO2 | % |
| Peso | Peso | kg |
| Altura | Altura | cm |
| IMC | Calculado automaticamente | kg/m² |

### Histórico do Paciente

Acesse rapidamente:
- **Consultas anteriores**: Todas as consultas com este paciente
- **Exames**: Resultados de exames anteriores
- **Prescrições**: Histórico de medicamentos
- **Documentos**: Atestados, laudos, etc.

---

## Prontuário Eletrônico

### Método SOAP

O HealtFlow utiliza o método SOAP para registro de consultas:

| Seção | O que registrar |
|-------|-----------------|
| **S** - Subjetivo | Queixa principal, história da doença atual, revisão de sistemas |
| **O** - Objetivo | Exame físico, sinais vitais, achados clínicos |
| **A** - Avaliação | Hipóteses diagnósticas, CID-10 |
| **P** - Plano | Conduta, medicamentos, exames, orientações, retorno |

### Templates

Economize tempo com templates pré-definidos:

1. Durante o atendimento, clique em **Templates**
2. Selecione o template desejado (ex: "Consulta de rotina HAS")
3. O texto é inserido automaticamente
4. Edite conforme necessário

### Criando Templates Personalizados

1. Vá em **Configurações > Templates**
2. Clique em **+ Novo Template**
3. Defina nome e categoria
4. Escreva o conteúdo
5. Use variáveis: `{paciente}`, `{data}`, `{medico}`

---

## Prescrição Digital

### Criando uma Prescrição

1. Durante ou após a consulta, clique em **Prescrever**
2. Busque o medicamento pelo nome
3. Preencha:
   - Dosagem
   - Posologia (frequência)
   - Duração
   - Instruções especiais

```
┌─────────────────────────────────────────────────────────────────┐
│                    NOVA PRESCRIÇÃO                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Tipo: ○ Simples  ○ Controlada  ○ Antimicrobiano               │
│                                                                 │
│  Medicamentos                                            [+ Add] │
│  ─────────────────────────────────────────────────────────────  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 1. Losartana 50mg                              [Remover]│   │
│  │    Posologia: 1 comprimido pela manhã                   │   │
│  │    Duração: uso contínuo                                │   │
│  │    Instruções: Tomar em jejum                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 2. AAS 100mg                                   [Remover]│   │
│  │    Posologia: 1 comprimido após o almoço                │   │
│  │    Duração: uso contínuo                                │   │
│  │    Instruções: Tomar após refeição                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Observações gerais:                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Retorno em 30 dias. Monitorar PA em casa.               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Validade: 30 dias                                              │
│                                                                 │
│                    [Cancelar]  [Salvar Rascunho]  [Assinar]    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Tipos de Receita

| Tipo | Descrição | Validade |
|------|-----------|----------|
| **Simples** | Medicamentos de venda livre | 30 dias |
| **Controlada (Azul)** | Psicotrópicos C1 | 30 dias |
| **Controlada (Amarela)** | Entorpecentes A1, A2 | 30 dias |
| **Antimicrobiano** | Antibióticos | 10 dias |
| **Especial** | Retinoides, talidomida | 30 dias |

### Assinatura Digital

Prescrições controladas exigem assinatura digital ICP-Brasil:

1. Após adicionar os medicamentos, clique em **Assinar**
2. Insira a senha do certificado digital
3. A prescrição é assinada e enviada ao paciente

### Alertas de Segurança

O sistema alerta automaticamente sobre:
- ⚠️ Alergias do paciente
- ⚠️ Interações medicamentosas
- ⚠️ Dosagem acima do recomendado
- ⚠️ Duplicidade de prescrição

---

## Solicitação de Exames

### Criando um Pedido de Exames

1. Clique em **Solicitar Exames**
2. Busque os exames pelo nome ou código
3. Para cada exame, indique:
   - Urgência (Rotina, Urgente, Emergência)
   - Informações clínicas
   - Preparo necessário

```
┌─────────────────────────────────────────────────────────────────┐
│                 SOLICITAÇÃO DE EXAMES                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Paciente: João da Silva                                        │
│                                                                 │
│  Exames Selecionados                                    [+ Add] │
│  ─────────────────────────────────────────────────────────────  │
│  ☑ Hemograma completo                          Rotina     ▼    │
│  ☑ Glicemia de jejum                           Rotina     ▼    │
│  ☑ Hemoglobina glicada (HbA1c)                 Rotina     ▼    │
│  ☑ Perfil lipídico                             Rotina     ▼    │
│  ☑ Creatinina                                  Rotina     ▼    │
│  ☑ ECG (Eletrocardiograma)                     Urgente    ▼    │
│                                                                 │
│  Informações clínicas:                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Paciente diabético e hipertenso, com suspeita de        │   │
│  │ angina estável. Investigação cardiovascular.            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Laboratório preferencial: [Selecione ▼]                        │
│                                                                 │
│                              [Cancelar]  [Solicitar]            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Acompanhando Resultados

1. Vá em **Exames > Pendentes**
2. Visualize o status de cada pedido:
   - 🟡 Aguardando coleta
   - 🔵 Em análise
   - 🟢 Resultado disponível
   - 🔴 Valor crítico (requer atenção)

### Analisando Resultados

Quando um resultado chega:
1. Clique no exame para visualizar
2. Valores alterados são destacados em vermelho
3. Você pode adicionar observações
4. Marque como "Analisado"

---

## Telemedicina

### Requisitos

- Webcam funcionando
- Microfone funcionando
- Conexão estável de internet (mínimo 2 Mbps)
- Navegador atualizado

### Iniciando uma Teleconsulta

1. Acesse a consulta marcada como "Telemedicina"
2. Clique em **Iniciar Teleconsulta**
3. Permita acesso à câmera e microfone
4. Aguarde o paciente entrar na sala

### Interface da Teleconsulta

```
┌─────────────────────────────────────────────────────────────────┐
│                    TELECONSULTA                                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │                    [VÍDEO DO PACIENTE]                   │   │
│  │                                                          │   │
│  │                                                          │   │
│  │                                                          │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────┐                                                    │
│  │ [Você]  │                                                    │
│  └─────────┘                                                    │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│   🎤         📹         💬         📋         🔴               │
│   Mudo      Câmera     Chat      Prontuário  Encerrar          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Durante a Consulta

- **Chat**: Envie mensagens de texto
- **Compartilhar tela**: Mostre exames ou imagens
- **Prontuário**: Acesse e preencha sem sair da chamada
- **Gravar**: Com consentimento do paciente

### Finalizando

1. Clique em **Encerrar Chamada**
2. Complete o prontuário
3. Emita prescrições e atestados normalmente
4. A gravação (se houver) fica disponível no prontuário

---

## Certificado Digital

### Por que é necessário?

O certificado digital ICP-Brasil é exigido para:
- ✅ Prescrições de medicamentos controlados
- ✅ Atestados médicos digitais
- ✅ Laudos e relatórios oficiais
- ✅ Integração com RNDS

### Tipos Aceitos

- **e-CPF A1**: Arquivo digital (mais prático)
- **e-CPF A3**: Cartão ou token físico (mais seguro)

### Configurando seu Certificado

1. Vá em **Configurações > Certificado Digital**
2. Clique em **Configurar Certificado**
3. Para A1: Faça upload do arquivo .p12 ou .pfx
4. Para A3: Instale o driver do token/cartão
5. Digite a senha do certificado
6. Clique em **Validar**

### Renovação

- O sistema avisa 30 dias antes do vencimento
- Renove com a mesma certificadora
- Atualize no sistema após renovação

---

## Dicas e Atalhos

### Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `Ctrl + Enter` | Finalizar consulta |
| `Ctrl + P` | Nova prescrição |
| `Ctrl + E` | Solicitar exames |
| `Ctrl + S` | Salvar rascunho |
| `Tab` | Próximo campo |

### Produtividade

1. **Use templates**: Economize tempo com textos pré-definidos
2. **Favoritos**: Marque medicamentos mais usados
3. **Histórico**: Copie de consultas anteriores
4. **Ditado por voz**: Use o microfone para transcrição (Beta)

---

## Suporte

- **Chat**: Ícone no canto inferior direito
- **Email**: medicos@healtflow.com.br
- **Telefone**: 0800 123 4567

---

*Última atualização: Dezembro 2025*
