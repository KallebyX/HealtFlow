# Manual do Usuário - Farmácias

Guia completo para farmacêuticos e atendentes utilizarem o HealtFlow.

## Sumário

1. [Introdução](#introdução)
2. [Acesso ao Sistema](#acesso-ao-sistema)
3. [Validação de Receitas](#validação-de-receitas)
4. [Dispensação de Medicamentos](#dispensação-de-medicamentos)
5. [Medicamentos Controlados](#medicamentos-controlados)
6. [Histórico de Dispensações](#histórico-de-dispensações)
7. [Relatórios SNGPC](#relatórios-sngpc)
8. [Integração com o Sistema](#integração-com-o-sistema)

---

## Introdução

### O que é o HealtFlow para Farmácias?

O módulo de farmácia do HealtFlow permite:

- ✅ Validar receitas digitais em segundos
- ✅ Verificar autenticidade e assinatura do médico
- ✅ Registrar dispensação automaticamente
- ✅ Controlar estoque de medicamentos controlados
- ✅ Gerar relatórios para SNGPC
- ✅ Comunicação direta com o prescritor

### Benefícios

| Processo Tradicional | Com HealtFlow |
|---------------------|---------------|
| Verificar receita manualmente | Scan do QR Code |
| Ligar para confirmar | Validação instantânea |
| Anotar em livro | Registro digital |
| Relatório mensal manual | Relatório automático |

---

## Acesso ao Sistema

### Credenciais

A farmácia recebe:
- URL de acesso
- Login (CNPJ ou email)
- Senha temporária

### Primeiro Acesso

1. Acesse **https://farmacia.healtflow.com.br**
2. Digite suas credenciais
3. Crie nova senha
4. Configure dados da farmácia:
   - CNPJ
   - Razão Social
   - CRF do responsável técnico
   - Endereço e telefone

### Cadastro de Funcionários

O responsável técnico pode cadastrar atendentes:
1. Vá em **Configurações > Funcionários**
2. Clique em **+ Novo Funcionário**
3. Defina permissões:
   - Apenas consulta
   - Dispensação simples
   - Dispensação controlada (requer CRF)

---

## Validação de Receitas

### Via QR Code

A forma mais rápida de validar:

1. Paciente apresenta receita (celular ou impressa)
2. Clique em **Validar Receita**
3. Escaneie o QR Code
4. Sistema exibe os dados da receita

```
┌─────────────────────────────────────────────────────────────────┐
│                 VALIDAÇÃO DE RECEITA                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ RECEITA VÁLIDA                                              │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  📋 Dados da Receita                                            │
│  Número: RX-2024-001234                                         │
│  Tipo: Simples                                                  │
│  Data: 15/03/2024                                               │
│  Validade: 14/04/2024 (29 dias restantes)                       │
│                                                                 │
│  👨‍⚕️ Prescritor                                                 │
│  Dr. Carlos Silva                                               │
│  CRM: 123456-SP                                                 │
│  Especialidade: Cardiologia                                     │
│  🔐 Assinatura Digital: ✓ Válida                                │
│                                                                 │
│  👤 Paciente                                                    │
│  Maria da Silva Santos                                          │
│  CPF: ***456789**                                               │
│                                                                 │
│  💊 Medicamentos                                                │
│  ─────────────────────────────────────────────────────────────  │
│  1. Losartana 50mg                                              │
│     1 comprimido pela manhã - 30 unidades                       │
│     Status: ⚪ Não dispensado                                   │
│                                                                 │
│  2. AAS 100mg                                                   │
│     1 comprimido após almoço - 30 unidades                      │
│     Status: ⚪ Não dispensado                                   │
│                                                                 │
│                              [Dispensar Medicamentos]           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Via Código da Receita

Se não conseguir ler o QR Code:

1. Clique em **Validar Receita > Por Código**
2. Digite o código da receita (RX-2024-XXXXXX)
3. O sistema busca e exibe os dados

### Validações Automáticas

O sistema verifica automaticamente:

| Verificação | Descrição |
|-------------|-----------|
| ✅ Assinatura | Certificado digital válido |
| ✅ Validade | Receita não expirada |
| ✅ CRM | Médico ativo no conselho |
| ✅ Especialidade | Médico pode prescrever |
| ✅ Dispensação | Ainda não foi dispensada |

### Receitas Inválidas

Se a receita for inválida, o sistema mostra:

- ❌ **Expirada**: Validade ultrapassada
- ❌ **Já dispensada**: Medicamento já retirado
- ❌ **Assinatura inválida**: Problema no certificado
- ❌ **CRM inativo**: Médico com registro irregular

---

## Dispensação de Medicamentos

### Processo de Dispensação

1. **Valide a receita** (QR Code ou código)
2. **Verifique os medicamentos** prescritos
3. **Selecione** os itens a dispensar
4. **Confirme a identidade** do paciente ou representante
5. **Registre a dispensação**

### Dispensação Parcial

Se o paciente não quiser todos os medicamentos:

1. Selecione apenas os itens desejados
2. Os demais ficam como "Pendente"
3. Paciente pode retirar depois na mesma farmácia

### Registro de Dispensação

```
┌─────────────────────────────────────────────────────────────────┐
│                 REGISTRAR DISPENSAÇÃO                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Receita: RX-2024-001234                                        │
│  Paciente: Maria da Silva Santos                                │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Medicamentos a dispensar:                                      │
│                                                                 │
│  ☑ Losartana 50mg - 30 comprimidos                             │
│     Lote: ABC123    Validade: 12/2025                          │
│     Fabricante: EMS                                             │
│                                                                 │
│  ☑ AAS 100mg - 30 comprimidos                                  │
│     Lote: XYZ789    Validade: 06/2025                          │
│     Fabricante: Bayer                                           │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Retirado por:                                                  │
│  ○ Paciente                                                     │
│  ○ Representante                                                │
│                                                                 │
│  Se representante:                                              │
│  Nome: _______________________________                          │
│  CPF: _________________                                         │
│  Parentesco: [Selecione ▼]                                      │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Atendente: João Silva                                          │
│  Data/Hora: 18/03/2024 14:35                                    │
│                                                                 │
│                    [Cancelar]  [Confirmar Dispensação]          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Medicamentos Controlados

### Categorias

| Tarja | Cor da Receita | Retenção | Exemplos |
|-------|----------------|----------|----------|
| C1 | Azul (2 vias) | Retém 1 via | Ansiolíticos, antidepressivos |
| A1/A2 | Amarela | Retém | Opioides, anfetaminas |
| B1/B2 | Azul | Retém | Barbitúricos |
| Antimicrobiano | Branca (2 vias) | Retém 1 via | Antibióticos |

### Validação Especial

Para controlados, o sistema verifica adicionalmente:

- ✅ Tipo correto de receita
- ✅ Quantidade dentro do limite permitido
- ✅ Intervalo mínimo entre dispensações
- ✅ Necessidade de notificação especial

### Receita Controlada Digital

```
┌─────────────────────────────────────────────────────────────────┐
│                 RECEITA CONTROLADA                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ⚠️ MEDICAMENTO CONTROLADO - LISTA B1                           │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  📋 Dados da Receita                                            │
│  Número: RC-2024-005678                                         │
│  Tipo: Receita de Controle Especial (Azul)                      │
│  Data: 15/03/2024                                               │
│  Validade: 30 dias                                              │
│                                                                 │
│  👨‍⚕️ Prescritor                                                 │
│  Dr. Paulo Mendes                                               │
│  CRM: 654321-SP                                                 │
│  Especialidade: Psiquiatria                                     │
│  🔐 Assinatura ICP-Brasil: ✓ Válida                             │
│                                                                 │
│  👤 Paciente                                                    │
│  João Pedro Santos                                              │
│  CPF: 123.456.789-00                                            │
│  Endereço: Rua das Flores, 123 - São Paulo/SP                   │
│                                                                 │
│  💊 Medicamento                                                 │
│  Clonazepam 2mg                                                 │
│  Quantidade: 30 comprimidos (máximo permitido: 60)              │
│  Posologia: 1 comprimido à noite                                │
│                                                                 │
│  ⏱️ Última dispensação: 20/02/2024 (26 dias atrás)              │
│  ✅ Intervalo mínimo respeitado                                 │
│                                                                 │
│                              [Dispensar com Retenção]           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Notificação de Receita

Para receitas A (amarelas), o sistema:
1. Gera a notificação automaticamente
2. Registra todos os dados obrigatórios
3. Envia ao SNGPC em tempo real

---

## Histórico de Dispensações

### Consultando Histórico

Acesse **Dispensações > Histórico** para ver:

- Todas as dispensações realizadas
- Filtro por data, paciente, medicamento
- Status (completa, parcial, cancelada)

### Informações Registradas

Para cada dispensação:
- Data e hora
- Receita associada
- Medicamentos dispensados
- Lote e validade
- Quem retirou
- Atendente responsável

### Exportando Relatórios

1. Selecione o período
2. Aplique filtros desejados
3. Clique em **Exportar**
4. Escolha formato (PDF, Excel, CSV)

---

## Relatórios SNGPC

### Sistema Nacional de Gerenciamento de Produtos Controlados

O HealtFlow gera automaticamente os relatórios para o SNGPC:

### Inventário

```
┌─────────────────────────────────────────────────────────────────┐
│                 INVENTÁRIO SNGPC                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Período: 01/03/2024 a 31/03/2024                               │
│  Farmácia: Farmácia São Lucas - CNPJ: XX.XXX.XXX/0001-XX        │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Medicamento          Lista   Entrada   Saída   Saldo           │
│  ─────────────────────────────────────────────────────────────  │
│  Clonazepam 2mg       B1      100       45      55              │
│  Diazepam 10mg        B1      50        22      28              │
│  Alprazolam 1mg       B1      80        38      42              │
│  Codeína 30mg         A2      30        12      18              │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  [Verificar]  [Corrigir]  [Enviar ANVISA]                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Envio Automático

Configure envio automático:
1. **Configurações > SNGPC**
2. Insira credenciais ANVISA
3. Defina frequência (diário, semanal)
4. Sistema envia automaticamente

### Alertas de Conformidade

O sistema alerta sobre:
- ⚠️ Divergência de estoque
- ⚠️ Receitas vencidas não utilizadas
- ⚠️ Prazo de envio próximo
- ⚠️ Irregularidades identificadas

---

## Integração com o Sistema

### API para Sistemas de Farmácia

Integre seu sistema de gestão:

```
Endpoint: https://api.healtflow.com.br/v1/pharmacy
```

### Funcionalidades da API

- Validar receitas
- Registrar dispensações
- Consultar histórico
- Enviar movimentações

### Webhooks

Receba notificações em tempo real:
- Nova receita para sua farmácia
- Cancelamento de receita
- Atualização de dados

---

## Suporte

### Central de Ajuda

- **Chat**: No sistema
- **Email**: farmacia@healtflow.com.br
- **Telefone**: 0800 123 4567

### Documentação Técnica

Para integração de sistemas:
- API Reference: docs.healtflow.com.br/api/pharmacy
- SDK disponível para principais linguagens

---

*Última atualização: Dezembro 2025*
