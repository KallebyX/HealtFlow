# Manual do Usuário - Laboratórios

Guia completo para laboratórios de análises clínicas utilizarem o HealtFlow.

## Sumário

1. [Introdução](#introdução)
2. [Configuração Inicial](#configuração-inicial)
3. [Recebimento de Pedidos](#recebimento-de-pedidos)
4. [Coleta de Amostras](#coleta-de-amostras)
5. [Processamento e Análise](#processamento-e-análise)
6. [Lançamento de Resultados](#lançamento-de-resultados)
7. [Liberação e Envio](#liberação-e-envio)
8. [Valores de Referência](#valores-de-referência)
9. [Integração com Equipamentos](#integração-com-equipamentos)
10. [Relatórios e Estatísticas](#relatórios-e-estatísticas)

---

## Introdução

### O que é o HealtFlow para Laboratórios?

O módulo laboratorial do HealtFlow oferece:

- ✅ Recebimento eletrônico de pedidos médicos
- ✅ Gestão completa do fluxo de amostras
- ✅ Integração com equipamentos automatizados
- ✅ Lançamento e validação de resultados
- ✅ Envio automático para médicos e pacientes
- ✅ Alertas de valores críticos
- ✅ Laudos digitais com assinatura

### Fluxo de Trabalho

```
┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
│   Pedido   │───▶│   Coleta   │───▶│  Análise   │───▶│ Resultado  │
│   Médico   │    │  Amostra   │    │            │    │  Liberado  │
└────────────┘    └────────────┘    └────────────┘    └────────────┘
      │                 │                 │                 │
      ▼                 ▼                 ▼                 ▼
  Eletrônico      Identificação      Automação         Notificação
  via HealtFlow   por código         equipamentos      automática
```

---

## Configuração Inicial

### Dados do Laboratório

Configure as informações básicas:

1. **Configurações > Dados do Laboratório**
2. Preencha:
   - Razão Social
   - CNPJ
   - Alvará Sanitário
   - Responsável Técnico (CRF/CRBM)
   - Endereço e contato

### Exames Disponíveis

Cadastre os exames que o laboratório realiza:

1. **Configurações > Catálogo de Exames**
2. Para cada exame, defina:
   - Nome e código interno
   - Código TUSS (convênios)
   - Código LOINC (interoperabilidade)
   - Material biológico
   - Valores de referência
   - Tempo de liberação
   - Preparo necessário

```
┌─────────────────────────────────────────────────────────────────┐
│                 CADASTRO DE EXAME                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Identificação                                                  │
│  ├── Nome: Glicemia de Jejum                                    │
│  ├── Código interno: GLI-001                                    │
│  ├── Código TUSS: 40301630                                      │
│  └── Código LOINC: 1558-6                                       │
│                                                                 │
│  Material e Coleta                                              │
│  ├── Material: Sangue venoso                                    │
│  ├── Tubo: Fluoreto (cinza)                                     │
│  ├── Volume mínimo: 2 mL                                        │
│  └── Estabilidade: 8 horas refrigerado                          │
│                                                                 │
│  Preparo do Paciente                                            │
│  └── Jejum de 8 a 12 horas                                      │
│                                                                 │
│  Valores de Referência                                          │
│  ├── Normal: 70 - 99 mg/dL                                      │
│  ├── Pré-diabetes: 100 - 125 mg/dL                              │
│  ├── Diabetes: ≥ 126 mg/dL                                      │
│  └── Valor crítico: > 400 ou < 50 mg/dL                         │
│                                                                 │
│  Prazos                                                         │
│  ├── Liberação: 24 horas                                        │
│  └── Urgência: 2 horas                                          │
│                                                                 │
│  Preço                                                          │
│  ├── Particular: R$ 15,00                                       │
│  └── Convênios: Tabela CBHPM                                    │
│                                                                 │
│                              [Cancelar]  [Salvar]               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Setores e Equipamentos

Organize o laboratório em setores:
- Coleta
- Hematologia
- Bioquímica
- Imunologia
- Microbiologia
- Urinálise

Para cada setor, cadastre os equipamentos:
- Nome e modelo
- Fabricante
- Número de série
- Interface de comunicação

---

## Recebimento de Pedidos

### Pedidos Eletrônicos

Pedidos chegam automaticamente via HealtFlow:

1. Acesse **Pedidos > Novos**
2. Visualize pedidos pendentes
3. Para cada pedido:
   - Dados do paciente
   - Médico solicitante
   - Exames solicitados
   - Informações clínicas
   - Urgência

```
┌─────────────────────────────────────────────────────────────────┐
│                 NOVO PEDIDO DE EXAMES                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📋 Pedido: PED-2024-001234                                     │
│  📅 Data: 18/03/2024 08:30                                      │
│  🚨 Urgência: ROTINA                                            │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  👤 Paciente                                                    │
│  Nome: Maria da Silva Santos                                    │
│  Data Nasc.: 15/05/1979 (44 anos)                               │
│  Sexo: Feminino                                                 │
│  CPF: ***456789**                                               │
│                                                                 │
│  👨‍⚕️ Solicitante                                                │
│  Dr. Carlos Silva - CRM 123456-SP                               │
│  Especialidade: Endocrinologia                                  │
│                                                                 │
│  📝 Informações Clínicas                                        │
│  "Paciente diabética tipo 2, em uso de Metformina.              │
│   Acompanhamento de rotina trimestral."                         │
│                                                                 │
│  🔬 Exames Solicitados                                          │
│  ─────────────────────────────────────────────────────────────  │
│  ☐ Hemograma completo                    Prazo: 24h             │
│  ☐ Glicemia de jejum                     Prazo: 24h             │
│  ☐ Hemoglobina glicada (HbA1c)           Prazo: 48h             │
│  ☐ Perfil lipídico                       Prazo: 24h             │
│  ☐ Creatinina                            Prazo: 24h             │
│  ☐ Urina tipo 1                          Prazo: 24h             │
│                                                                 │
│                    [Rejeitar]  [Agendar Coleta]  [Aceitar]      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Agendamento de Coleta

Se o paciente precisar agendar:
1. Clique em **Agendar Coleta**
2. Selecione data e horário disponível
3. Sistema envia confirmação ao paciente

### Pedidos Manuais

Para pedidos em papel:
1. Clique em **Novo Pedido Manual**
2. Escaneie ou digite os dados
3. Vincule ao paciente no sistema

---

## Coleta de Amostras

### Check-in do Paciente

Quando o paciente chega:

1. Busque pelo nome ou CPF
2. Confirme o pedido
3. Verifique preparos (jejum, etc.)
4. Gere as etiquetas de identificação

### Etiquetas de Amostra

O sistema gera etiquetas com código de barras:

```
┌──────────────────────────────┐
│ |||||||||||||||||||||||||||  │
│         AM-2024-012345       │
│                              │
│ Maria da Silva Santos        │
│ DN: 15/05/1979               │
│ Tubo: Vermelho               │
│ Exame: Hemograma             │
│ Data: 18/03/2024 09:15       │
└──────────────────────────────┘
```

### Registro de Coleta

Para cada amostra:

1. Escaneie o código de barras
2. Registre:
   - Horário da coleta
   - Coletador responsável
   - Observações (se houver)
3. Confirme

### Rastreabilidade

O sistema mantém rastreabilidade completa:
- Quem coletou
- Quando coletou
- Condições da amostra
- Transporte e armazenamento

---

## Processamento e Análise

### Triagem de Amostras

Na recepção técnica:

1. Escaneie cada amostra
2. Sistema indica o setor de destino
3. Verifique condições:
   - Volume adequado
   - Hemólise
   - Coagulação
   - Identificação correta

### Status das Amostras

| Status | Descrição |
|--------|-----------|
| 🟡 Pendente | Aguardando processamento |
| 🔵 Em análise | No equipamento/bancada |
| 🟢 Concluído | Resultado disponível |
| 🔴 Rejeitada | Problema com a amostra |
| ⚪ Liberada | Laudo emitido |

### Rejeição de Amostras

Se houver problema:

1. Marque como **Rejeitada**
2. Selecione o motivo:
   - Amostra hemolisada
   - Volume insuficiente
   - Identificação incorreta
   - Tubo inadequado
   - Amostra coagulada
3. Sistema notifica para recoleta

---

## Lançamento de Resultados

### Resultados Manuais

Para exames manuais:

1. Acesse **Resultados > Lançar**
2. Escaneie a amostra ou busque o pedido
3. Insira os valores para cada parâmetro
4. Sistema valida automaticamente

```
┌─────────────────────────────────────────────────────────────────┐
│                 LANÇAMENTO DE RESULTADO                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Amostra: AM-2024-012345                                        │
│  Paciente: Maria da Silva Santos                                │
│  Exame: Hemograma Completo                                      │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Parâmetro            Resultado     Unidade    Referência       │
│  ─────────────────────────────────────────────────────────────  │
│  Hemácias             [4.8    ]     x10⁶/µL    4.0-5.5          │
│  Hemoglobina          [14.2   ]     g/dL       12.0-16.0        │
│  Hematócrito          [42     ]     %          36-46            │
│  VCM                  [87.5   ]     fL         80-100           │
│  HCM                  [29.6   ]     pg         26-34            │
│  CHCM                 [33.8   ]     g/dL       31-36            │
│  RDW                  [13.5   ]     %          11.5-15.0        │
│                                                                 │
│  Leucócitos           [7.500  ]     /µL        4.000-11.000     │
│  Neutrófilos          [55     ]     %          40-70            │
│  Linfócitos           [35     ]     %          20-45            │
│  Monócitos            [6      ]     %          2-10             │
│  Eosinófilos          [3      ]     %          1-6              │
│  Basófilos            [1      ]     %          0-2              │
│                                                                 │
│  Plaquetas            [250.000]     /µL        150.000-400.000  │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Observações:                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                    [Cancelar]  [Salvar Rascunho]  [Concluir]   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Validação Automática

O sistema destaca automaticamente:
- 🟡 Valores fora da referência
- 🔴 Valores críticos (requer ação imediata)
- 🟠 Valores delta (variação significativa vs anterior)

### Resultados de Equipamentos

Para equipamentos interfaceados:
1. Resultados chegam automaticamente
2. Técnico revisa e valida
3. Sistema associa à amostra correta

---

## Liberação e Envio

### Validação Técnica

O responsável técnico deve:

1. Revisar todos os resultados
2. Verificar consistência
3. Assinar digitalmente
4. Liberar o laudo

### Laudo Digital

```
┌─────────────────────────────────────────────────────────────────┐
│                     LAUDO LABORATORIAL                           │
│                                                                 │
│  ═══════════════════════════════════════════════════════════   │
│                      LABORATÓRIO SÃO LUCAS                      │
│                    CNPJ: XX.XXX.XXX/0001-XX                     │
│              Rua das Análises, 456 - São Paulo/SP               │
│                     Tel: (11) 3456-7890                         │
│  ═══════════════════════════════════════════════════════════   │
│                                                                 │
│  PACIENTE: Maria da Silva Santos                                │
│  DATA NASC.: 15/05/1979    SEXO: Feminino                       │
│  SOLICITANTE: Dr. Carlos Silva - CRM 123456/SP                  │
│                                                                 │
│  DATA COLETA: 18/03/2024 09:15                                  │
│  DATA LIBERAÇÃO: 18/03/2024 16:30                               │
│  PEDIDO: PED-2024-001234                                        │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  HEMOGRAMA COMPLETO                                             │
│                                                                 │
│  ERITROGRAMA                                                    │
│  Hemácias............... 4,8 x10⁶/µL     (4,0 - 5,5)           │
│  Hemoglobina............ 14,2 g/dL       (12,0 - 16,0)          │
│  Hematócrito............ 42 %            (36 - 46)              │
│  VCM.................... 87,5 fL         (80 - 100)             │
│  HCM.................... 29,6 pg         (26 - 34)              │
│  CHCM................... 33,8 g/dL       (31 - 36)              │
│  RDW.................... 13,5 %          (11,5 - 15,0)          │
│                                                                 │
│  LEUCOGRAMA                                                     │
│  Leucócitos totais...... 7.500 /µL       (4.000 - 11.000)       │
│  Neutrófilos............ 55 %   4.125    (40 - 70)              │
│  Linfócitos............. 35 %   2.625    (20 - 45)              │
│  Monócitos.............. 6 %    450      (2 - 10)               │
│  Eosinófilos............ 3 %    225      (1 - 6)                │
│  Basófilos.............. 1 %    75       (0 - 2)                │
│                                                                 │
│  PLAQUETAS                                                      │
│  Contagem............... 250.000 /µL     (150.000 - 400.000)    │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Material: Sangue venoso - EDTA                                 │
│  Método: Automação (Sysmex XN-2000)                             │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Responsável Técnico: Dra. Ana Paula Silva                      │
│  CRBM: 12345/SP                                                 │
│                                                                 │
│  🔐 Documento assinado digitalmente                             │
│  Verificar em: healtflow.com.br/verificar/LAU-2024-001234       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Notificações Automáticas

Quando o laudo é liberado:
- 📧 Email para paciente
- 📱 Push notification no app
- 👨‍⚕️ Notificação para médico
- 🔴 Alerta especial se valor crítico

### Valores Críticos

O sistema gera alerta imediato para:
- Glicemia < 50 ou > 400 mg/dL
- Potássio < 3,0 ou > 6,0 mEq/L
- Hemoglobina < 7,0 g/dL
- Plaquetas < 50.000/µL
- E outros configuráveis

Ação obrigatória:
1. Confirmar recebimento do alerta
2. Comunicar ao médico solicitante
3. Registrar contato realizado

---

## Valores de Referência

### Configuração por Perfil

Configure valores de referência por:
- Sexo (Masculino/Feminino)
- Faixa etária (Pediátrico, Adulto, Idoso)
- Condição especial (Gestante)

### Unidades e Conversão

O sistema suporta múltiplas unidades:
- Converte automaticamente
- Mostra comparativo se necessário

---

## Integração com Equipamentos

### Equipamentos Suportados

O HealtFlow integra com principais fabricantes:
- Roche
- Abbott
- Siemens
- Beckman Coulter
- Sysmex
- Bio-Rad
- Ortho Clinical
- E outros via HL7/ASTM

### Configuração de Interface

1. **Configurações > Equipamentos > Adicionar**
2. Selecione fabricante e modelo
3. Configure parâmetros de comunicação:
   - Protocolo (HL7, ASTM, TCP/IP)
   - Porta e velocidade
   - Mapeamento de exames

### Fluxo de Comunicação

```
┌────────────┐         ┌─────────────┐         ┌────────────┐
│ HealtFlow  │ ──────▶ │  Interface  │ ──────▶ │Equipamento │
│  (Pedidos) │         │   Bidirecional│        │            │
└────────────┘         └─────────────┘         └────────────┘
      ▲                        │                      │
      │                        │                      │
      └────────────────────────┘◀─────────────────────┘
                        (Resultados)
```

---

## Relatórios e Estatísticas

### Relatórios Disponíveis

- **Produção**: Exames por período, setor, técnico
- **TAT (Turnaround Time)**: Tempo médio de liberação
- **Recoletas**: Taxa e motivos
- **Financeiro**: Faturamento por convênio
- **Qualidade**: Indicadores de controle

### Dashboard Gerencial

```
┌─────────────────────────────────────────────────────────────────┐
│                 DASHBOARD LABORATORIAL                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Hoje: 18/03/2024                                               │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Exames       │  │ TAT Médio    │  │ Pendentes    │          │
│  │ Realizados   │  │              │  │              │          │
│  │    487       │  │   4h 23min   │  │     32       │          │
│  │  ▲ +12%      │  │  ▼ -15min    │  │   ▼ -8       │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │          PRODUÇÃO POR SETOR (HOJE)                        │ │
│  │                                                           │ │
│  │  Bioquímica     ████████████████████████  215             │ │
│  │  Hematologia    ████████████████  145                     │ │
│  │  Urinálise      ████████  72                              │ │
│  │  Imunologia     ██████  55                                │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Suporte

### Central de Ajuda

- **Chat**: Dentro do sistema
- **Email**: laboratorio@healtflow.com.br
- **Telefone**: 0800 123 4567
- **Suporte técnico 24h**: Para valores críticos

---

*Última atualização: Dezembro 2025*
