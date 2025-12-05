# Design System HealtFlow

Guia completo de design, UX/UI e identidade visual do HealtFlow.

## Sumário

1. [Identidade Visual](#identidade-visual)
2. [Fundamentos de Design](#fundamentos-de-design)
3. [Sistema de Cores](#sistema-de-cores)
4. [Tipografia](#tipografia)
5. [Iconografia](#iconografia)
6. [Espaçamento e Grid](#espaçamento-e-grid)
7. [Componentes UI](#componentes-ui)
8. [Padrões de UX](#padrões-de-ux)
9. [Jornadas de Usuário](#jornadas-de-usuário)
10. [Acessibilidade](#acessibilidade)
11. [Design Mobile](#design-mobile)
12. [Recursos e Assets](#recursos-e-assets)

---

## Identidade Visual

### Logo

O logo do HealtFlow representa a união entre saúde e tecnologia, simbolizando fluxo e continuidade no cuidado com a saúde.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│     ╔═══╗                                                       │
│     ║ H ║  HealtFlow                                            │
│     ╚═══╝                                                       │
│                                                                 │
│     Versão Principal (Horizontal)                               │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│     ╔═══╗                                                       │
│     ║ H ║                                                       │
│     ╚═══╝                                                       │
│     Healt                                                       │
│     Flow                                                        │
│                                                                 │
│     Versão Empilhada (Vertical)                                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│     ╔═══╗                                                       │
│     ║ H ║                                                       │
│     ╚═══╝                                                       │
│                                                                 │
│     Símbolo (Favicon/Ícone)                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Uso do Logo

| Contexto | Versão | Tamanho Mínimo |
|----------|--------|----------------|
| Header | Horizontal | 120px largura |
| Sidebar | Horizontal compacto | 100px |
| Favicon | Símbolo | 32px |
| App Icon | Símbolo | 512px |
| Print | Horizontal | 40mm |

### Área de Proteção

```
        ┌───────────────────────────────────┐
        │     ╔═══╗                         │
        │  X  ║ H ║  HealtFlow          X   │
        │     ╚═══╝                         │
        │  X                             X  │
        └───────────────────────────────────┘

        X = metade da altura do símbolo
```

### Uso Incorreto

- ❌ Não distorcer o logo
- ❌ Não alterar as cores
- ❌ Não adicionar efeitos (sombra, brilho)
- ❌ Não colocar sobre fundos de baixo contraste
- ❌ Não rotacionar o logo

---

## Fundamentos de Design

### Princípios de Design

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRINCÍPIOS HEALTFLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. CLAREZA                                                     │
│     Informações médicas devem ser claras e sem ambiguidade.     │
│     Priorize legibilidade e hierarquia visual.                  │
│                                                                 │
│  2. CONFIANÇA                                                   │
│     Design profissional que transmite segurança.                │
│     Consistência em todas as interfaces.                        │
│                                                                 │
│  3. EFICIÊNCIA                                                  │
│     Minimizar cliques e tempo para completar tarefas.           │
│     Fluxos otimizados para uso frequente.                       │
│                                                                 │
│  4. ACESSIBILIDADE                                              │
│     Design inclusivo para todos os usuários.                    │
│     Suporte a leitores de tela e contraste adequado.           │
│                                                                 │
│  5. HUMANIZAÇÃO                                                 │
│     Linguagem acolhedora e empática.                            │
│     Feedback positivo e orientações claras.                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Tom de Voz

| Situação | Tom | Exemplo |
|----------|-----|---------|
| Sucesso | Positivo, Encorajador | "Consulta agendada com sucesso!" |
| Erro | Claro, Solícito | "Não foi possível salvar. Verifique os campos destacados." |
| Aviso | Neutro, Informativo | "Você tem 3 consultas pendentes de confirmação." |
| Crítico | Direto, Urgente | "Atenção: Resultado de exame com valor crítico." |

---

## Sistema de Cores

### Paleta Principal

```css
:root {
  /* Primary - Azul Saúde */
  --primary-50: #EFF6FF;
  --primary-100: #DBEAFE;
  --primary-200: #BFDBFE;
  --primary-300: #93C5FD;
  --primary-400: #60A5FA;
  --primary-500: #3B82F6;  /* Principal */
  --primary-600: #2563EB;
  --primary-700: #1D4ED8;
  --primary-800: #1E40AF;
  --primary-900: #1E3A8A;

  /* Secondary - Verde Saúde */
  --secondary-50: #F0FDF4;
  --secondary-100: #DCFCE7;
  --secondary-200: #BBF7D0;
  --secondary-300: #86EFAC;
  --secondary-400: #4ADE80;
  --secondary-500: #22C55E;  /* Principal */
  --secondary-600: #16A34A;
  --secondary-700: #15803D;
  --secondary-800: #166534;
  --secondary-900: #14532D;
}
```

### Cores Semânticas

```css
:root {
  /* Estados */
  --success: #22C55E;    /* Verde - Sucesso */
  --warning: #F59E0B;    /* Amarelo - Aviso */
  --error: #EF4444;      /* Vermelho - Erro */
  --info: #3B82F6;       /* Azul - Informação */

  /* Neutros */
  --gray-50: #F9FAFB;
  --gray-100: #F3F4F6;
  --gray-200: #E5E7EB;
  --gray-300: #D1D5DB;
  --gray-400: #9CA3AF;
  --gray-500: #6B7280;
  --gray-600: #4B5563;
  --gray-700: #374151;
  --gray-800: #1F2937;
  --gray-900: #111827;

  /* Superfícies */
  --background: #FFFFFF;
  --surface: #F9FAFB;
  --border: #E5E7EB;
}
```

### Aplicação de Cores

| Elemento | Cor | Uso |
|----------|-----|-----|
| Ação primária | Primary-500 | Botões principais, links |
| Ação secundária | Gray-600 | Botões secundários |
| Texto principal | Gray-900 | Títulos, corpo |
| Texto secundário | Gray-500 | Labels, placeholders |
| Fundo página | Gray-50 | Background geral |
| Fundo card | White | Cards, modais |
| Bordas | Gray-200 | Divisórias, inputs |
| Sucesso | Success | Confirmações, badges positivos |
| Erro | Error | Validações, alertas críticos |
| Aviso | Warning | Alertas moderados |

### Contraste e Acessibilidade

```
┌─────────────────────────────────────────────────────────────────┐
│                    RATIOS DE CONTRASTE (WCAG AA)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Texto Normal (< 18px)                                          │
│  └── Mínimo: 4.5:1                                              │
│                                                                 │
│  Texto Grande (≥ 18px ou ≥ 14px bold)                          │
│  └── Mínimo: 3:1                                                │
│                                                                 │
│  Componentes UI e Gráficos                                      │
│  └── Mínimo: 3:1                                                │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Combinações Aprovadas:                                         │
│  ✅ Gray-900 em White → 15.8:1                                  │
│  ✅ Gray-700 em White → 8.6:1                                   │
│  ✅ Primary-600 em White → 5.6:1                                │
│  ✅ White em Primary-500 → 4.5:1                                │
│  ❌ Gray-400 em White → 2.9:1 (apenas decorativo)               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tipografia

### Família Tipográfica

```css
/* Font Stack */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
             Roboto, 'Helvetica Neue', Arial, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', Consolas, Monaco, monospace;
```

### Escala Tipográfica

```
┌─────────────────────────────────────────────────────────────────┐
│                      ESCALA TIPOGRÁFICA                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Display       48px / 1.1    Bold      Títulos de página        │
│  ───────────────────────────────────────────────────────────    │
│                                                                 │
│  Heading 1     36px / 1.2    Bold      Seções principais        │
│  ─────────────────────────────────────────────────────          │
│                                                                 │
│  Heading 2     30px / 1.25   Semibold  Subseções                │
│  ────────────────────────────────────────                       │
│                                                                 │
│  Heading 3     24px / 1.3    Semibold  Cards, modais            │
│  ───────────────────────────────                                │
│                                                                 │
│  Heading 4     20px / 1.4    Medium    Subtítulos               │
│  ────────────────────────                                       │
│                                                                 │
│  Body Large    18px / 1.5    Regular   Destaque                 │
│  ─────────────────────                                          │
│                                                                 │
│  Body          16px / 1.5    Regular   Texto principal          │
│  ───────────────────                                            │
│                                                                 │
│  Body Small    14px / 1.5    Regular   Texto secundário         │
│  ─────────────────                                              │
│                                                                 │
│  Caption       12px / 1.4    Regular   Labels, helpers          │
│  ────────────                                                   │
│                                                                 │
│  Overline      11px / 1.4    Medium    Tags, badges             │
│  ───────────                                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Tailwind Classes

```typescript
// Mapeamento para Tailwind
const typography = {
  display: 'text-5xl font-bold leading-tight',      // 48px
  h1: 'text-4xl font-bold leading-tight',           // 36px
  h2: 'text-3xl font-semibold leading-snug',        // 30px
  h3: 'text-2xl font-semibold leading-snug',        // 24px
  h4: 'text-xl font-medium leading-normal',         // 20px
  bodyLarge: 'text-lg leading-relaxed',             // 18px
  body: 'text-base leading-relaxed',                // 16px
  bodySmall: 'text-sm leading-relaxed',             // 14px
  caption: 'text-xs leading-normal',                // 12px
  overline: 'text-[11px] font-medium uppercase tracking-wide',
};
```

---

## Iconografia

### Biblioteca de Ícones

O HealtFlow usa [Lucide Icons](https://lucide.dev/) como biblioteca padrão.

```typescript
import {
  // Navegação
  Home,
  Menu,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,

  // Ações
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,

  // Status
  Check,
  X,
  AlertCircle,
  AlertTriangle,
  Info,

  // Saúde
  Stethoscope,
  Pill,
  Syringe,
  Heart,
  Activity,
  Thermometer,
  FlaskConical,

  // Usuários
  User,
  Users,
  UserCog,

  // Comunicação
  Mail,
  Phone,
  Video,
  MessageSquare,

  // Calendário/Tempo
  Calendar,
  Clock,

  // Arquivos
  File,
  FileText,
  Folder,
  Image,

  // Financeiro
  CreditCard,
  DollarSign,
  Receipt,
} from 'lucide-react';
```

### Tamanhos de Ícones

| Contexto | Tamanho | Classe |
|----------|---------|--------|
| Inline (texto) | 16px | `h-4 w-4` |
| Botões pequenos | 16px | `h-4 w-4` |
| Botões normais | 20px | `h-5 w-5` |
| Navegação | 20px | `h-5 w-5` |
| Cards | 24px | `h-6 w-6` |
| Destaque | 32px | `h-8 w-8` |
| Empty State | 48px | `h-12 w-12` |

### Uso Correto

```tsx
// ✅ Correto: Ícone com texto descritivo ou aria-label
<Button>
  <Plus className="h-4 w-4 mr-2" />
  Novo Paciente
</Button>

// ✅ Correto: Ícone solo com aria-label
<Button variant="ghost" size="icon" aria-label="Editar">
  <Edit className="h-4 w-4" />
</Button>

// ❌ Incorreto: Ícone sem contexto acessível
<Button>
  <Plus className="h-4 w-4" />
</Button>
```

---

## Espaçamento e Grid

### Sistema de Espaçamento

```css
/* Base: 4px */
--space-0: 0;
--space-1: 4px;    /* 0.25rem */
--space-2: 8px;    /* 0.5rem */
--space-3: 12px;   /* 0.75rem */
--space-4: 16px;   /* 1rem */
--space-5: 20px;   /* 1.25rem */
--space-6: 24px;   /* 1.5rem */
--space-8: 32px;   /* 2rem */
--space-10: 40px;  /* 2.5rem */
--space-12: 48px;  /* 3rem */
--space-16: 64px;  /* 4rem */
--space-20: 80px;  /* 5rem */
--space-24: 96px;  /* 6rem */
```

### Grid Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                     LAYOUT PRINCIPAL                            │
├───────┬─────────────────────────────────────────────────────────┤
│       │                                                         │
│       │  ┌─────────────────────────────────────────────────┐   │
│       │  │                    Header                        │   │
│ Side  │  │                    (h-16)                        │   │
│ bar   │  └─────────────────────────────────────────────────┘   │
│       │                                                         │
│ (w-64)│  ┌─────────────────────────────────────────────────┐   │
│       │  │                                                  │   │
│       │  │               Content Area                       │   │
│       │  │               (p-6)                              │   │
│       │  │                                                  │   │
│       │  │  ┌────────┐  ┌────────┐  ┌────────┐            │   │
│       │  │  │ Card   │  │ Card   │  │ Card   │            │   │
│       │  │  │ (gap-6)│  │        │  │        │            │   │
│       │  │  └────────┘  └────────┘  └────────┘            │   │
│       │  │                                                  │   │
│       │  └─────────────────────────────────────────────────┘   │
│       │                                                         │
└───────┴─────────────────────────────────────────────────────────┘
```

### Breakpoints

```typescript
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop small
  xl: '1280px',  // Desktop
  '2xl': '1536px', // Desktop large
};
```

### Grid de Cards

```tsx
// Grid responsivo para cards
<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {items.map(item => (
    <Card key={item.id}>{/* ... */}</Card>
  ))}
</div>
```

---

## Componentes UI

### Anatomia dos Componentes

#### Button

```
┌─────────────────────────────────────────────────────────────────┐
│                         BUTTON                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Variants:                                                     │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│   │   Primary    │  │  Secondary   │  │   Outline    │         │
│   │   (filled)   │  │   (gray)     │  │   (border)   │         │
│   └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│   │    Ghost     │  │ Destructive  │  │     Link     │         │
│   │ (transparent)│  │   (red)      │  │  (underline) │         │
│   └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│   Sizes:                                                        │
│   ┌────┐  ┌──────────┐  ┌────────────────┐                     │
│   │ sm │  │ default  │  │      lg        │                     │
│   │32px│  │   40px   │  │     44px       │                     │
│   └────┘  └──────────┘  └────────────────┘                     │
│                                                                 │
│   States:                                                       │
│   • Default    • Hover    • Focus    • Active    • Disabled    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Input

```
┌─────────────────────────────────────────────────────────────────┐
│                          INPUT                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Label (optional)                                              │
│   ┌─────────────────────────────────────────┐                   │
│   │ 🔍  Placeholder text...             │▼│                   │
│   └─────────────────────────────────────────┘                   │
│   Helper text ou mensagem de erro                               │
│                                                                 │
│   Anatomy:                                                      │
│   • Label: text-sm font-medium mb-2                             │
│   • Input: h-10 px-3 rounded-md border                          │
│   • Icon (left): absolute left-3                                │
│   • Icon (right): absolute right-3                              │
│   • Helper: text-sm text-muted-foreground mt-1                  │
│   • Error: text-sm text-destructive mt-1                        │
│                                                                 │
│   States:                                                       │
│   • Default: border-input                                       │
│   • Focus: ring-2 ring-ring border-primary                      │
│   • Error: border-destructive                                   │
│   • Disabled: opacity-50 cursor-not-allowed                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Card

```
┌─────────────────────────────────────────────────────────────────┐
│                           CARD                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │  CardHeader                                             │   │
│   │  ┌─────────────────────────────────────────────────┐   │   │
│   │  │ CardTitle          CardDescription              │   │   │
│   │  │ (h3, semibold)     (text-muted)                │   │   │
│   │  └─────────────────────────────────────────────────┘   │   │
│   │                                                         │   │
│   │  CardContent                                            │   │
│   │  ┌─────────────────────────────────────────────────┐   │   │
│   │  │                                                  │   │   │
│   │  │  Conteúdo do card...                            │   │   │
│   │  │                                                  │   │   │
│   │  └─────────────────────────────────────────────────┘   │   │
│   │                                                         │   │
│   │  CardFooter (optional)                                  │   │
│   │  ┌─────────────────────────────────────────────────┐   │   │
│   │  │                              [Cancel] [Save]    │   │   │
│   │  └─────────────────────────────────────────────────┘   │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   Styles:                                                       │
│   • Container: bg-card rounded-lg border shadow-sm              │
│   • Header: p-6 pb-0                                            │
│   • Content: p-6                                                │
│   • Footer: p-6 pt-0 flex justify-end gap-2                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Catálogo de Componentes

| Componente | Uso | Variantes |
|------------|-----|-----------|
| Button | Ações do usuário | primary, secondary, outline, ghost, destructive, link |
| Input | Entrada de texto | default, error, disabled |
| Select | Seleção de opções | default, multiple |
| Checkbox | Múltipla escolha | default, indeterminate |
| Radio | Escolha única | default |
| Switch | Toggle on/off | default |
| Textarea | Texto longo | default, error |
| Card | Container de conteúdo | default |
| Dialog | Modal | default, alert |
| Dropdown | Menu suspenso | default |
| Tabs | Navegação em abas | default |
| Table | Dados tabulares | default |
| Badge | Labels de status | default, outline |
| Alert | Mensagens do sistema | info, success, warning, error |
| Toast | Notificações | info, success, warning, error |
| Skeleton | Loading placeholder | default |
| Avatar | Imagem de usuário | default, fallback |
| Progress | Indicador de progresso | bar, circular |
| Tooltip | Dicas contextuais | default |
| Popover | Conteúdo flutuante | default |

---

## Padrões de UX

### Feedback do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                   PADRÕES DE FEEDBACK                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. LOADING STATES                                              │
│     • Skeleton para listas e cards                              │
│     • Spinner para botões (inline)                              │
│     • Progress bar para uploads                                 │
│     • Sempre indicar tempo estimado quando possível             │
│                                                                 │
│  2. SUCCESS FEEDBACK                                            │
│     • Toast verde no canto superior direito                     │
│     • Auto-dismiss após 3 segundos                              │
│     • Mensagem clara da ação completada                         │
│                                                                 │
│  3. ERROR HANDLING                                              │
│     • Toast vermelho para erros de servidor                     │
│     • Inline errors para validação de formulário                │
│     • Mensagens acionáveis ("Tente novamente")                  │
│                                                                 │
│  4. EMPTY STATES                                                │
│     • Ilustração + mensagem amigável                            │
│     • Call-to-action claro                                      │
│     • Não deixar a tela vazia                                   │
│                                                                 │
│  5. CONFIRMAÇÕES                                                │
│     • Dialog para ações destrutivas                             │
│     • Explicar consequências claramente                         │
│     • Botão de cancelar sempre visível                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Formulários

```
┌─────────────────────────────────────────────────────────────────┐
│                   PADRÕES DE FORMULÁRIO                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  LAYOUT                                                         │
│  • Labels acima dos inputs                                      │
│  • Um campo por linha (máximo 2 em telas grandes)               │
│  • Agrupar campos relacionados                                  │
│  • Separar seções com títulos claros                            │
│                                                                 │
│  VALIDAÇÃO                                                      │
│  • Validar em tempo real após blur                              │
│  • Mostrar erro abaixo do campo                                 │
│  • Destacar campos com erro (borda vermelha)                    │
│  • Scroll automático para primeiro erro                         │
│                                                                 │
│  CAMPOS OBRIGATÓRIOS                                            │
│  • Marcar com asterisco (*)                                     │
│  • Indicar "campos obrigatórios" no início do form              │
│  • Validar antes de submit                                      │
│                                                                 │
│  AÇÕES                                                          │
│  • Botão primário à direita                                     │
│  • Botão secundário (cancelar) à esquerda                       │
│  • Desabilitar submit durante loading                           │
│  • Confirmar navegação se houver dados não salvos               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Navegação

```
┌─────────────────────────────────────────────────────────────────┐
│                   PADRÕES DE NAVEGAÇÃO                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SIDEBAR                                                        │
│  • Sempre visível em desktop (lg+)                              │
│  • Colapsável em tablet/mobile                                  │
│  • Highlight do item ativo                                      │
│  • Máximo 10 itens no primeiro nível                            │
│                                                                 │
│  BREADCRUMBS                                                    │
│  • Em páginas de detalhe e formulários                          │
│  • Máximo 4 níveis                                              │
│  • Último item não clicável                                     │
│                                                                 │
│  TABS                                                           │
│  • Para alternar entre visualizações do mesmo contexto          │
│  • Máximo 6 tabs                                                │
│  • Tab ativa claramente destacada                               │
│                                                                 │
│  PAGINAÇÃO                                                      │
│  • Em listas com mais de 10 itens                               │
│  • Mostrar total de itens/páginas                               │
│  • Navegação por número e setas                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Jornadas de Usuário

### Médico: Atender Paciente

```
┌─────────────────────────────────────────────────────────────────┐
│              JORNADA: MÉDICO ATENDE PACIENTE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. LOGIN                                                       │
│     └── Dashboard com agenda do dia                             │
│                                                                 │
│  2. VISUALIZAR AGENDA                                           │
│     ├── Ver próximas consultas                                  │
│     ├── Status: Confirmado, Aguardando, Em atendimento          │
│     └── Click para iniciar atendimento                          │
│                                                                 │
│  3. INICIAR CONSULTA                                            │
│     ├── Ver histórico do paciente                               │
│     ├── Consultas anteriores                                    │
│     ├── Exames recentes                                         │
│     └── Alergias e medicamentos em uso                          │
│                                                                 │
│  4. REGISTRAR ATENDIMENTO (SOAP)                                │
│     ├── Queixa principal (Subjetivo)                            │
│     ├── Exame físico (Objetivo)                                 │
│     ├── Diagnóstico (Avaliação)                                 │
│     └── Conduta (Plano)                                         │
│                                                                 │
│  5. PRESCREVER                                                  │
│     ├── Buscar medicamento                                      │
│     ├── Definir posologia                                       │
│     ├── Adicionar observações                                   │
│     └── Assinar digitalmente                                    │
│                                                                 │
│  6. SOLICITAR EXAMES (opcional)                                 │
│     ├── Selecionar exames                                       │
│     ├── Indicar urgência                                        │
│     └── Gerar pedido                                            │
│                                                                 │
│  7. FINALIZAR                                                   │
│     ├── Revisar informações                                     │
│     ├── Assinar consulta                                        │
│     ├── Enviar documentos ao paciente                           │
│     └── Agendar retorno (opcional)                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Paciente: Agendar Consulta

```
┌─────────────────────────────────────────────────────────────────┐
│              JORNADA: PACIENTE AGENDA CONSULTA                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. ACESSO (App ou Web)                                         │
│     └── Login com email/senha                                   │
│                                                                 │
│  2. NOVA CONSULTA                                               │
│     ├── Selecionar especialidade                                │
│     ├── Escolher clínica (se mais de uma)                       │
│     └── Ver médicos disponíveis                                 │
│                                                                 │
│  3. ESCOLHER MÉDICO                                             │
│     ├── Ver perfil do médico                                    │
│     ├── Avaliações de outros pacientes                          │
│     └── Horários disponíveis                                    │
│                                                                 │
│  4. SELECIONAR DATA/HORA                                        │
│     ├── Calendário com disponibilidade                          │
│     ├── Horários em formato visual                              │
│     └── Indicar tipo (primeira vez, retorno)                    │
│                                                                 │
│  5. CONFIRMAR                                                   │
│     ├── Resumo do agendamento                                   │
│     ├── Forma de pagamento (se particular)                      │
│     └── Aceitar termos                                          │
│                                                                 │
│  6. CONFIRMAÇÃO                                                 │
│     ├── Tela de sucesso                                         │
│     ├── Detalhes da consulta                                    │
│     ├── Adicionar ao calendário                                 │
│     └── Notificações ativadas                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Acessibilidade

### Checklist WCAG 2.1 AA

```
┌─────────────────────────────────────────────────────────────────┐
│                  CHECKLIST DE ACESSIBILIDADE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PERCEPTÍVEL                                                    │
│  ☑ Texto alternativo para imagens                               │
│  ☑ Contraste mínimo 4.5:1 para texto                            │
│  ☑ Conteúdo não depende apenas de cor                           │
│  ☑ Texto pode ser aumentado até 200%                            │
│  ☑ Não há conteúdo piscando                                     │
│                                                                 │
│  OPERÁVEL                                                       │
│  ☑ Tudo acessível via teclado                                   │
│  ☑ Focus visível em todos os elementos                          │
│  ☑ Skip links para conteúdo principal                           │
│  ☑ Títulos de página descritivos                                │
│  ☑ Links com texto descritivo                                   │
│                                                                 │
│  COMPREENSÍVEL                                                  │
│  ☑ Linguagem da página definida                                 │
│  ☑ Labels para todos os inputs                                  │
│  ☑ Erros identificados e descritos                              │
│  ☑ Navegação consistente                                        │
│                                                                 │
│  ROBUSTO                                                        │
│  ☑ HTML válido e semântico                                      │
│  ☑ ARIA quando necessário                                       │
│  ☑ Funciona com leitores de tela                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Implementação

```tsx
// ✅ Formulário acessível
<form aria-labelledby="form-title">
  <h2 id="form-title">Cadastro de Paciente</h2>

  <div>
    <Label htmlFor="email">Email *</Label>
    <Input
      id="email"
      type="email"
      aria-required="true"
      aria-invalid={!!errors.email}
      aria-describedby={errors.email ? "email-error" : undefined}
    />
    {errors.email && (
      <p id="email-error" role="alert" className="text-destructive">
        {errors.email.message}
      </p>
    )}
  </div>

  <Button type="submit">
    Cadastrar
  </Button>
</form>

// ✅ Tabela de dados acessível
<table aria-label="Lista de pacientes">
  <thead>
    <tr>
      <th scope="col">Nome</th>
      <th scope="col">Email</th>
      <th scope="col">Status</th>
      <th scope="col">Ações</th>
    </tr>
  </thead>
  <tbody>
    {patients.map(patient => (
      <tr key={patient.id}>
        <td>{patient.name}</td>
        <td>{patient.email}</td>
        <td>
          <Badge aria-label={`Status: ${patient.status}`}>
            {patient.status}
          </Badge>
        </td>
        <td>
          <Button aria-label={`Editar ${patient.name}`}>
            <Edit className="h-4 w-4" />
          </Button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

---

## Design Mobile

### Princípios Mobile-First

```
┌─────────────────────────────────────────────────────────────────┐
│                   DESIGN MOBILE-FIRST                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. TOUCH TARGETS                                               │
│     • Mínimo 44x44px para áreas tocáveis                        │
│     • Espaçamento entre targets: 8px                            │
│     • Botões no final da tela (thumb zone)                      │
│                                                                 │
│  2. TIPOGRAFIA                                                  │
│     • Corpo mínimo: 16px (evitar zoom no iOS)                   │
│     • Títulos: proporcionalmente menores                        │
│     • Line-height generoso: 1.5+                                │
│                                                                 │
│  3. NAVEGAÇÃO                                                   │
│     • Bottom tab bar para navegação principal                   │
│     • Hamburger menu para navegação secundária                  │
│     • Gestos (swipe) para ações comuns                          │
│                                                                 │
│  4. FORMULÁRIOS                                                 │
│     • Um campo por linha                                        │
│     • Labels sempre acima                                       │
│     • Teclados apropriados (email, numérico)                    │
│     • Auto-focus no primeiro campo                              │
│                                                                 │
│  5. PERFORMANCE                                                 │
│     • Imagens otimizadas                                        │
│     • Lazy loading                                              │
│     • Skeleton loading                                          │
│     • Offline-first quando possível                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Layouts Responsivos

```tsx
// Grid responsivo
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards */}
</div>

// Stack para mobile, row para desktop
<div className="flex flex-col lg:flex-row gap-4">
  {/* Items */}
</div>

// Hidden/visible por breakpoint
<Sidebar className="hidden lg:block" />
<MobileNav className="lg:hidden" />
```

---

## Recursos e Assets

### Exports de Design

| Asset | Formato | Resolução |
|-------|---------|-----------|
| Logo principal | SVG, PNG | @1x, @2x, @3x |
| Favicon | ICO, PNG | 16, 32, 48, 64, 128, 256 |
| App Icon iOS | PNG | 1024x1024 |
| App Icon Android | PNG | 512x512 |
| Open Graph | PNG | 1200x630 |
| Ilustrações | SVG | Vetorial |

### Ferramentas Recomendadas

| Ferramenta | Uso |
|------------|-----|
| Figma | Design de interfaces |
| Storybook | Documentação de componentes |
| Chromatic | Visual testing |
| axe DevTools | Testes de acessibilidade |
| Lighthouse | Audit de performance e a11y |

### Links Úteis

- [Radix UI](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [Framer Motion](https://www.framer.com/motion/)
- [WCAG 2.1](https://www.w3.org/TR/WCAG21/)

---

## Próximos Passos

- [Componentes UI](./ui-components/README.md)
- [Fluxos UX](./ux-flows/README.md)
- [Brand Guidelines](./brand/README.md)
- [Guia Frontend](../guides/frontend/README.md)
