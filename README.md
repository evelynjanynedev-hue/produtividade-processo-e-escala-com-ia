# Execução — Sistema Operacional Pessoal

> Nada permanece apenas na ideia.

Um sistema operacional pessoal que transforma **intenção em clareza, ação em evidência e evidência em processo escalável**.
Não é um lugar para guardar informação — é um lugar para transformar informação em realidade.

## O problema que resolve

A maioria das pessoas e das empresas acumula:

- ideias sem execução
- planos sem prova
- tarefas concluídas sem resultado
- projetos abandonados sem aprendizado
- decisões sem evidência

O resultado é dispersão, idealização e retrabalho.
Este sistema existe para inverter isso:

```
Intenção → Clareza → Estrutura → Plano → Ação → Evidência → Resultado → Aprendizado → Padronização → Escala
```

## Regra de realidade

Uma ideia não é um resultado. Um plano não é execução. Uma tarefa concluída não é sucesso.
Só é considerado **validado** o que possui **evidência concreta de execução e resultado**.

| Nível | Definição | Avança quando |
|---|---|---|
| Ideia | algo que você pensou | objetivo em uma frase |
| Hipótese | uma aposta | estrutura com etapas |
| Intenção | objetivo declarado | tarefa executável |
| Plano | caminho definido | ação realizada |
| Execução | saiu do papel | evidência registrada |
| Evidência | prova observável | resultado medido |
| Resultado | número que mudou | aprendizado provado |
| Aprendizado | o que funcionou e por quê | processo documentado |
| Processo validado | método repetível | pronto para escalar |
| Processo escalável | pode crescer sem você | — |

## Sistema de prova

Tudo que for relevante gera evidência observável:

- tarefa executada
- entrega produzida
- arquivo criado
- publicação realizada
- cliente contatado
- reunião realizada
- venda realizada
- receita gerada
- métrica registrada
- feedback recebido
- processo documentado
- resultado comparável

O sistema sempre pergunta:

> **"Qual é a prova de que isso aconteceu?"**
> **"Qual resultado isso gerou?"**

## Visualização da cadeia

Cada projeto pode ser visualizado como:

```
OBJETIVO
   ↓
RESULTADO ESPERADO
   ↓
ETAPAS
   ↓
TAREFAS
   ↓
EXECUÇÃO
   ↓
EVIDÊNCIAS
   ↓
RESULTADOS
   ↓
APRENDIZADOS
   ↓
PROCESSO VALIDADO
   ↓
ESCALA
```

O sistema mostra claramente:

- onde você está
- para onde está indo
- o que precisa ser feito agora
- o que está bloqueado
- o que já foi validado
- o que ainda é hipótese
- o que está funcionando
- o que precisa ser descartado
- o que pode ser repetido
- o que pode ser automatizado
- o que pode ser escalado

## Inteligência do sistema

Não é um armazém de informação. É um sistema que pensa junto com você.
Quando você insere algo desestruturado, ele interpreta e devolve uma estrutura executável.

Exemplo:

> **Entrada:** "Quero criar uma empresa para ajudar negócios jurídicos a crescer usando marketing, vendas, tecnologia e IA — 5 clientes em 90 dias."

> **Saída:**
> - Visão → empresa de crescimento para negócios jurídicos
> - Hipóteses → existe uma dor · existe um público · existe uma oferta possível
> - Validação → conversar com potenciais clientes · identificar dores · testar proposta · apresentar oferta · medir interesse
> - Execução → criar oferta · prospectar · realizar reuniões · fechar primeiros clientes · entregar
> - Evidências → contatos realizados · reuniões · propostas · contratos · entregas
> - Resultados → taxa de resposta · reuniões · conversão · receita · retenção · satisfação
> - Aprendizado → o que funcionou · para quem funcionou · em qual contexto · por quê
> - Processo → documentar método
> - Escala → repetir · otimizar · automatizar · delegar · aumentar volume

O motor de intake é heurístico (offline, sem LLM). A interface `IntakeEngine` permite trocar pelo provedor de IA quando disponível.

## Princípio de escala

```
Fazer → Medir → Aprender → Melhorar → Padronizar → Repetir → Automatizar → Delegar → Escalar
```

**Não escale o que ainda não foi validado.**
Primeiro: prove. Depois: repita. Depois: padronize. Só então: escale.

## Stack (pensada para não quebrar quando escalar)

- **Frontend:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind 3.4
- **Backend:** Server Actions (zero-JS-first forms) · Zod · bcryptjs
- **Banco:** PostgreSQL 16 · Drizzle ORM
- **Autenticação:** sessão custom — token de 32 bytes, hash SHA-256 armazenado, cookie `httpOnly`/`lax`/`secure`, TTL 30 dias
- **Deploy:** `output: "standalone"` (container) · Dockerfile · docker-compose

### Por que não quebra ao escalar

1. **Pooler-ready:** cliente Postgres com `prepare: false` — compatível com Neon, Supabase, PgBouncer em modo transaction.
2. **Pool configurável:** `DATABASE_POOL_MAX` (default 10).
3. **Multi-tenant desde o dia 1:** `workspaces` + `memberships`. Toda query é escopada por `workspaceId`.
4. **Índices estratégicos** em todas as FKs e colunas de filtro.
5. **Rate limit de login** (10 tentativas/10 min) — documentado para migração para Redis em produção.
6. **Headers de segurança** (X-Frame-Options, nosniff, referrer-policy, permissions-policy).
7. **Sem LLM obrigatório:** o intake funciona offline.

## Arquitetura

```
src/
├── app/
│   ├── page.tsx                  # painel
│   ├── login/ cadastro/          # autenticação
│   ├── initiatives/              # portfólio + detalhe
│   ├── processes/                # biblioteca de processos
│   └── api/health/               # health check
├── components/
│   ├── app-shell.tsx             # sidebar + nav
│   ├── auth-shell.tsx            # layout de autenticação
│   └── stage.tsx                 # StageBadge, StageRail, StageProgress
└── lib/
    ├── auth/session.ts           # sessão, signup, rate limit
    ├── db/                       # schema, client, seed
    └── domain/
        ├── stages.ts             # 10 etapas + tipos de evidência
        ├── rules.ts              # regra de realidade
        ├── intake.ts             # motor de intake
        ├── queries.ts            # leituras tipadas
        └── actions.ts            # server actions (mutações)
```

## Modelo de dados

| Tabela | Responsabilidade |
|---|---|
| `users` | identidade (bcrypt 12) |
| `sessions` | tokens SHA-256 com expiração |
| `workspaces` | espaço de trabalho (multi-tenant) |
| `memberships` | vínculo usuário ↔ workspace (role) |
| `initiatives` | intenção/projeto + etapa (0–9) + status |
| `milestones` | etapas do projeto |
| `tasks` | tarefas executáveis (status, evidência requerida) |
| `evidences` | provas observáveis |
| `results` | métricas medidas (com meta) |
| `learnings` | aprendizados (aberto/provado/descartado) |
| `processes` | processos padronizados (rascunho/validado/escalando) |
| `activity_events` | trilha de auditoria |

## Rodando localmente

### Requisitos

- Node.js 20+
- PostgreSQL 15+

### Passos

```bash
# 1. Clone
git clone https://github.com/evelynjanynedev-hue/produtividade-processo-e-escala-com-ia.git
cd produtividade-processo-e-escala-com-ia

# 2. Instale dependências
npm install

# 3. Configure ambiente
cp .env.example .env.local
# edite DATABASE_URL e AUTH_SECRET

# 4. Crie o banco
createdb execucao

# 5. Aplique schema + seed
npm run setup

# 6. Rode
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

**Credenciais demo:** `demo@sistema.dev` / `demo1234`

### Comandos úteis

```bash
npm run typecheck    # verificação de tipos
npm run build        # build de produção
npm run db:push      # aplicar schema
npm run db:seed      # popular dados demo
npm run db:studio    # Drizzle Studio
```

## Segurança

- Senhas com bcrypt (custo 12).
- Tokens de sessão de 32 bytes (base64url), armazenados como SHA-256.
- Cookie `httpOnly`, `sameSite=lax`, `secure` em produção.
- Rate limit de login (10/10 min).
- Headers de segurança em todas as rotas.
- Multi-tenant: toda query filtrada por `workspaceId`.

## Caminho de escala

Quando o produto crescer:

1. **Banco:** migrar para pooler (Neon/Supabase/RDS Proxy) — já suportado (`prepare: false`).
2. **Cache:** Redis para rate limit distribuído e sessões.
3. **Filas:** processar evidências/resultados em background (BullMQ/Inngest).
4. **Storage:** S3 para arquivos de evidência (hoje só links).
5. **Multi-tenant forte:** RLS no Postgres por `workspace_id`.
6. **Observabilidade:** Sentry + OpenTelemetry.
7. **Escala horizontal:** container stateless atrás de load balancer.

## Roadmap

- [ ] Visualização em grafo da cadeia (D3/Cytoscape)
- [ ] Intake com LLM (OpenAI/Anthropic) via `IntakeEngine`
- [ ] Upload de arquivos de evidência (S3)
- [ ] Notificações de bloqueios
- [ ] Exportação de processos (PDF/Markdown)
- [ ] API pública (REST/tRPC)
- [ ] App mobile (React Native)
- [ ] Integrações (GitHub, Linear, Notion)

## Licença

MIT — use, modifique e escale. A única regra: nada fica só na ideia.