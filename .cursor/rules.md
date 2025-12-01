# HEALTHFLOW - Regras de Desenvolvimento

## SEMPRE (ALWAYS)

1. **Seguir a ordem das especificações** - Backend → API → Frontend → Mobile
2. **TypeScript strict mode** em todo código
3. **Mobile First CSS** - Começar pelo mobile, expandir para desktop
4. **Commits pequenos e frequentes** - Um commit por funcionalidade
5. **Atualizar TODO.md e PROGRESS.md** após cada tarefa
6. **Usar português para commits e documentação**
7. **Validar dados de entrada** com class-validator
8. **Implementar tratamento de erros** robusto
9. **Seguir padrões REST** para APIs
10. **Documentar endpoints** com Swagger/OpenAPI

## NUNCA (NEVER)

1. **Pular etapas** da ordem de execução
2. **Código sem tipagem** - Sempre usar tipos explícitos
3. **CSS Desktop First** - Sempre Mobile First
4. **Commits grandes** - Dividir em partes menores
5. **Ignorar atualizações** de TODO.md e PROGRESS.md
6. **Deixar console.log** em produção
7. **Expor dados sensíveis** em logs ou respostas
8. **Ignorar validações** de segurança

## Ordem de Execução das Fases

```
FASE 1: Foundation (Monorepo Setup)
    ↓
FASE 2: Backend API (NestJS)
    ↓
FASE 3: Frontend Web (Next.js 14)
    ↓
FASE 4: Mobile App (React Native + Expo)
    ↓
FASE 5: Infrastructure (Docker, K8s, CI/CD)
```

## Mobile First Breakpoints

```css
/* Mobile (default) */
.component { }

/* Tablet (768px+) */
@media (min-width: 768px) { }

/* Desktop (1024px+) */
@media (min-width: 1024px) { }

/* Large Desktop (1280px+) */
@media (min-width: 1280px) { }
```

## Padrões de Código

### NestJS
- Controllers: Apenas roteamento
- Services: Lógica de negócio
- DTOs: Validação de entrada
- Entities: Modelos Prisma

### Next.js 14
- App Router com Server Components
- Client Components apenas quando necessário
- Server Actions para mutações

### React Native
- Expo managed workflow
- NativeWind para estilos
- React Query para estado servidor

## Checklist por Tarefa

- [ ] Código implementado seguindo specs
- [ ] Tipos TypeScript corretos
- [ ] Validações implementadas
- [ ] Testes básicos passando
- [ ] TODO.md atualizado
- [ ] PROGRESS.md atualizado
- [ ] Commit realizado
