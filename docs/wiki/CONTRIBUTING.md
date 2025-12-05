# Guia de Contribuição

Obrigado pelo interesse em contribuir com o HealtFlow! Este documento fornece diretrizes para contribuições ao projeto.

## Sumário

- [Código de Conduta](#código-de-conduta)
- [Como Contribuir](#como-contribuir)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Padrões de Código](#padrões-de-código)
- [Pull Requests](#pull-requests)
- [Issues](#issues)
- [Documentação](#documentação)

---

## Código de Conduta

### Nosso Compromisso

Nos comprometemos a tornar a participação neste projeto uma experiência livre de assédio para todos, independentemente de idade, tamanho corporal, deficiência, etnia, identidade e expressão de gênero, nível de experiência, nacionalidade, aparência pessoal, raça, religião ou identidade e orientação sexual.

### Nossos Padrões

**Comportamentos esperados:**
- Usar linguagem acolhedora e inclusiva
- Respeitar diferentes pontos de vista e experiências
- Aceitar críticas construtivas com graça
- Focar no que é melhor para a comunidade
- Mostrar empatia com outros membros

**Comportamentos inaceitáveis:**
- Uso de linguagem ou imagens sexualizadas
- Comentários insultuosos ou depreciativos
- Assédio público ou privado
- Publicar informações privadas de terceiros sem permissão
- Outras condutas que possam ser consideradas inapropriadas

---

## Como Contribuir

### Tipos de Contribuição

1. **Bug Reports**: Identificou um bug? Abra uma issue!
2. **Feature Requests**: Tem uma ideia? Compartilhe conosco!
3. **Code**: Correções de bugs, novas features, refatorações
4. **Documentation**: Melhorias na documentação
5. **Tests**: Aumento de cobertura de testes
6. **Translations**: Traduções para outros idiomas

### Fluxo de Trabalho

```
1. Fork do repositório
      │
      ▼
2. Clone seu fork
      │
      ▼
3. Crie uma branch
      │
      ▼
4. Faça suas alterações
      │
      ▼
5. Commit e push
      │
      ▼
6. Abra um Pull Request
      │
      ▼
7. Code Review
      │
      ▼
8. Merge!
```

---

## Configuração do Ambiente

### Pré-requisitos

- Node.js 18+
- pnpm 8+
- Docker e Docker Compose
- Git

### Setup Passo a Passo

```bash
# 1. Fork o repositório no GitHub

# 2. Clone seu fork
git clone https://github.com/SEU_USUARIO/HealtFlow.git
cd HealtFlow

# 3. Adicione o upstream
git remote add upstream https://github.com/KallebyX/HealtFlow.git

# 4. Instale as dependências
pnpm install

# 5. Configure as variáveis de ambiente
cp .env.example .env
# Edite conforme necessário

# 6. Inicie os serviços
docker-compose up -d

# 7. Execute as migrações
pnpm db:migrate

# 8. Verifique se tudo funciona
pnpm dev
pnpm test
```

### Sincronizando seu Fork

```bash
# Buscar atualizações do upstream
git fetch upstream

# Atualizar sua main
git checkout main
git merge upstream/main

# Atualizar sua branch de feature
git checkout minha-feature
git rebase main
```

---

## Padrões de Código

### ESLint e Prettier

O projeto usa ESLint e Prettier para garantir consistência do código:

```bash
# Verificar lint
pnpm lint

# Corrigir automaticamente
pnpm lint:fix

# Formatar código
pnpm format
```

### Convenções de Nomenclatura

```typescript
// Arquivos: kebab-case
patient-service.ts
create-patient.dto.ts

// Classes: PascalCase
class PatientService {}

// Funções e variáveis: camelCase
function getPatientById() {}
const patientName = 'John';

// Constantes: SCREAMING_SNAKE_CASE
const MAX_RETRIES = 3;

// Enums: PascalCase
enum UserRole {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
}
```

### Estrutura de Módulos (Backend)

```
modules/
└── nome-modulo/
    ├── nome-modulo.module.ts
    ├── nome-modulo.controller.ts
    ├── nome-modulo.service.ts
    ├── dto/
    │   ├── create-nome.dto.ts
    │   └── update-nome.dto.ts
    └── entities/
        └── nome.entity.ts
```

### Estrutura de Componentes (Frontend)

```typescript
// Componente funcional com TypeScript
import { FC } from 'react';

interface PatientCardProps {
  patient: Patient;
  onEdit?: (id: string) => void;
}

export const PatientCard: FC<PatientCardProps> = ({ patient, onEdit }) => {
  return (
    <div className="rounded-lg border p-4">
      <h3>{patient.name}</h3>
      {onEdit && (
        <button onClick={() => onEdit(patient.id)}>
          Editar
        </button>
      )}
    </div>
  );
};
```

### Testes

```typescript
// Estrutura de teste
describe('PatientService', () => {
  let service: PatientService;

  beforeEach(async () => {
    // Setup
  });

  describe('createPatient', () => {
    it('should create a patient successfully', async () => {
      // Arrange
      const dto = { name: 'John', email: 'john@test.com' };

      // Act
      const result = await service.create(dto);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe('John');
    });

    it('should throw error if email exists', async () => {
      // ...
    });
  });
});
```

---

## Pull Requests

### Antes de Criar um PR

- [ ] Código segue os padrões do projeto
- [ ] Testes passando (`pnpm test`)
- [ ] Lint passando (`pnpm lint`)
- [ ] Type check passando (`pnpm type-check`)
- [ ] Documentação atualizada (se necessário)
- [ ] Commits seguem convenção

### Template de PR

```markdown
## Descrição

[Descreva as mudanças realizadas]

## Tipo de Mudança

- [ ] Bug fix (correção que não quebra funcionalidades existentes)
- [ ] Nova feature (funcionalidade que não quebra funcionalidades existentes)
- [ ] Breaking change (correção ou feature que causa mudança em funcionalidade existente)
- [ ] Documentação

## Como Testar

1. [Passo 1]
2. [Passo 2]
3. [Passo 3]

## Screenshots (se aplicável)

[Adicione screenshots]

## Checklist

- [ ] Meu código segue os padrões do projeto
- [ ] Realizei self-review do meu código
- [ ] Comentei partes complexas do código
- [ ] Atualizei a documentação
- [ ] Minhas mudanças não geram novos warnings
- [ ] Adicionei testes que provam que minha correção/feature funciona
- [ ] Testes unitários e E2E passam localmente
```

### Processo de Review

1. **Automated Checks**: CI executa lint, testes e build
2. **Code Review**: Pelo menos 1 aprovação necessária
3. **Discussion**: Resolva todos os comentários
4. **Merge**: Squash and merge na main

### Commits Semânticos

```
<tipo>(<escopo>): <descrição>

[corpo opcional]

[rodapé opcional]
```

**Tipos:**
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Manutenção
- `perf`: Performance

**Exemplos:**
```
feat(patients): add patient avatar upload
fix(auth): resolve 2FA timeout issue
docs(api): update swagger documentation
refactor(billing): simplify invoice calculation
test(appointments): add integration tests
```

---

## Issues

### Reportando Bugs

Use o template de bug report e inclua:

```markdown
## Descrição do Bug

[Descrição clara e concisa do bug]

## Passos para Reproduzir

1. Vá para '...'
2. Clique em '....'
3. Role até '....'
4. Veja o erro

## Comportamento Esperado

[O que deveria acontecer]

## Comportamento Atual

[O que está acontecendo]

## Screenshots

[Se aplicável]

## Ambiente

- OS: [ex: Ubuntu 22.04]
- Browser: [ex: Chrome 120]
- Node: [ex: 18.19.0]
- Versão: [ex: 1.0.0]

## Informações Adicionais

[Qualquer outro contexto]
```

### Solicitando Features

```markdown
## Descrição da Feature

[Descrição clara da feature desejada]

## Motivação

[Por que essa feature é necessária?]

## Proposta de Solução

[Como você imagina a implementação?]

## Alternativas Consideradas

[Outras soluções que você considerou]

## Informações Adicionais

[Mockups, exemplos, referências]
```

### Labels de Issues

| Label | Descrição |
|-------|-----------|
| `bug` | Algo não está funcionando |
| `feature` | Nova funcionalidade |
| `enhancement` | Melhoria em funcionalidade existente |
| `documentation` | Relacionado à documentação |
| `good first issue` | Bom para iniciantes |
| `help wanted` | Precisamos de ajuda |
| `priority: high` | Alta prioridade |
| `priority: low` | Baixa prioridade |

---

## Documentação

### Onde Documentar

| Tipo | Local |
|------|-------|
| Arquitetura | `/docs/architecture/` |
| APIs | `/docs/api/` + Swagger |
| Guias Dev | `/docs/guides/` |
| Manuais | `/docs/user-manuals/` |
| Wiki | `/docs/wiki/` |

### Estilo de Documentação

- Use Markdown
- Inclua exemplos de código
- Adicione diagramas quando útil
- Mantenha atualizado com o código
- Use linguagem clara e direta

### Atualizando Docs

```bash
# Ao adicionar uma feature, atualize:
1. Swagger/OpenAPI (automático via decorators)
2. README do módulo
3. Guia do usuário (se UI mudou)
4. Changelog
```

---

## Reconhecimento

Contribuidores são reconhecidos de diversas formas:

- Listados no arquivo CONTRIBUTORS.md
- Mencionados no changelog
- Badges especiais em releases importantes

---

## Dúvidas?

- Abra uma issue com label `question`
- Entre em contato: dev@healtflow.com.br
- Discussões: GitHub Discussions

---

Obrigado por contribuir com o HealtFlow! 🎉
