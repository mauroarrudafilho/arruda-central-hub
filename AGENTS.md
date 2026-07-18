# ArrudaHub — Agent Runbook

**Este arquivo rege o comportamento de agentes (Claude Code, Cursor, Cowork, Copilot, etc.) em qualquer um dos 11 projetos do ecossistema.** Leia antes de começar qualquer tarefa.

**Distinção importante:**
- `SHARED_RULES.md` → regras de **código** (service pattern, RLS, Zod, naming). Mudam devagar.
- `AGENTS.md` (este arquivo) → regras de **comportamento do agente** (rituais, MCPs, armadilhas, quando perguntar). Mudam rápido.
- `CLAUDE.md` → contexto **técnico** de cada projeto (rotas, schema, integrações). Específico por projeto.

Em caso de conflito: `AGENTS.md` para comportamento > `SHARED_RULES.md` para código > `CLAUDE.md` do projeto para contexto local.

---

## 0. Antes de começar qualquer tarefa

Ordem de leitura obrigatória:

1. `AGENTS.md` (este arquivo) — comportamento
2. `SHARED_RULES.md` (raiz) — padrões de código
3. `CLAUDE.md` (raiz) — mapa do ecossistema
4. `CLAUDE.md` do projeto específico — stack, rotas, schema
5. `PROGRESS.md` do projeto — estado atual
6. `LESSONS.md` do projeto — armadilhas já documentadas

Se o usuário citar arquivo específico, ler esse também antes de agir.

---

## 1. Inventário de capacidades — MCPs disponíveis

Antes de dizer "não consigo", verifique esta lista. Se a tarefa se encaixa em um MCP, use-o em vez de pedir acesso ou escrever código do zero.

| MCP | Para quê | Quando NÃO usar |
|---|---|---|
| **Supabase** | `execute_sql`, `apply_migration`, `list_tables`, `get_logs`, `search_docs`, `list_migrations` | Operações destrutivas em produção sem autorização explícita |

**Regra de ouro:** para **qualquer** coisa de DB do ecossistema (Supabase), usar o MCP diretamente. Não peça credenciais, não assuma que não tem acesso — verifique primeiro.

Outros MCPs (Gmail, Calendar, navegação web, controle de desktop, etc.) podem existir no ambiente do agente, mas **não são oficializados ainda** neste runbook — serão avaliados caso a caso antes de entrar nesta tabela.

---

## 2. Rituais — Acronyms de comando

Quando o usuário disparar um destes acronyms (em maiúscula, minúscula ou misto), execute o ritual na ordem descrita. **Não pergunte se deve fazer** — o acronym é a autorização.

### `CHECKPOINT`

Salva estado sem publicar. Usado para pontos de parada ou fim de tarefa sem deploy.

1. Verificar `git status` — o que mudou.
2. Atualizar `PROGRESS.md` do(s) projeto(s) tocados com o que foi entregue (checkbox + 1 linha).
3. Se aprendeu algo (armadilha, decisão técnica, workaround), adicionar entrada em `LESSONS.md`.
4. `git add` **nominal** (nunca `-A` ou `.`) dos arquivos relevantes.
5. `git commit` com mensagem conventional PT-BR (ver §3).
6. `git push`.
7. Responder com: commit hash + resumo 1 linha.

### `DEPLOY`

Ritual completo de entrega: roda `CHECKPOINT` inteiro + dispara deploy Vercel.

1–6. Idêntico ao `CHECKPOINT`.
7. Se a entrega inclui features ou correções visíveis ao usuário, adicionar entrada na rota `/novidades` do projeto — seguindo obrigatoriamente as regras do §7.1 abaixo.
8. Disparar deploy. Duas opções:
   - Se o projeto tem CI configurado em `main`, bastou `git push` — responder com link do dashboard Vercel.
   - Se precisa rodar `vercel --prod` localmente, executar e aguardar.
9. Responder com: commit hash + URL do preview/produção + resumo 1 linha.

**Se `CHECKPOINT` ou `DEPLOY` disparar hook pre-commit que falha:** parar, reportar o erro, **não** fazer `--no-verify`, **não** fazer `--amend`. Resolver e criar novo commit.

---

## 3. Protocolo de commit

Conventional commits em PT-BR. Estrutura:

```
<tipo>(<escopo>): <descrição curta no imperativo>

<corpo opcional em PT-BR, primeira pessoa do plural>
```

**Tipos:** `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`, `perf`.

**Escopo:** nome curto do projeto ou módulo. Ex.: `rbac`, `acordos`, `logistics`, `catalog`, `analytics`.

**Exemplos bons:**
```
feat(rbac): adiciona token brand teal e remove laranja global
fix(analytics): usa profile como fonte canônica de org no ranking
refactor(rbac): move matriz granular de seção flat para sheet por módulo
docs(agents): registra rituais CHECKPOINT e DEPLOY
```

**Regras:**
- Descrição em **imperativo**, não passado ("adiciona" ✔, "adicionado" ✘).
- Sem emoji.
- **Co-authors oficiais (padrão do ecossistema):** todo commit assistido por agente leva no rodapé o trailer do Mauro + o(s) do(s) agente(s) que trabalharam no commit:
  ```
  Co-Authored-By: Mauro Arruda Filho (devtechlabs) <maurofilho@grupoarruda.com>
  Co-Authored-By: Claude <noreply@anthropic.com>
  Co-Authored-By: Cursor <noreply@cursor.com>
  ```
  Incluir a linha de Claude e/ou Cursor conforme quem participou; a do Mauro entra sempre.
- `git add` sempre **nominal** — lista os arquivos. Nunca `-A`, `.` ou `-u`.
- Não commitar arquivos com credencial (`.env`, `*.pem`, `credentials.json`).
- Se precisar passar mensagem multi-linha, usar heredoc: `git commit -m "$(cat <<'EOF' ... EOF)"`.

---

## 4. When to ask vs when to act

### Agir sem perguntar

- Mudanças de UI/estilo (cor, tipografia, layout local).
- Bulk replace com typecheck passando depois.
- Refactor local que não muda contrato público.
- Adicionar testes, docs, comentários.
- Criar migration **aditiva** (`ADD COLUMN`, `CREATE TABLE` nova).
- Atualizar `PROGRESS.md`, `LESSONS.md`, `ROADMAP.md` quando natural.
- Ler o banco via Supabase MCP para diagnóstico.

### Perguntar antes de agir

- Migration **destrutiva** (`DROP`, `TRUNCATE`, `ALTER COLUMN ... TYPE`, `UPDATE` sem `WHERE` específico, `DELETE`).
- Mexer em RLS de qualquer tabela (criar, alterar, remover policy).
- Deletar/renomear tabela, coluna ou função pública.
- Alterar contrato entre apps (RPC compartilhada, schema de evento, formato de token).
- Mexer em `rbac_auth_*`, `rbac_organizations`, `rbac_permissions` de forma estrutural.
- `DEPLOY` em projeto que não foi autorizado explicitamente nessa sessão — confirmar antes.
- Remover arquivo, diretório ou commit anterior.
- Usar `git reset --hard`, `git push --force`, `git checkout --`, `git clean -f`.

### Dica prática

Se a dúvida é "isso é reversível?" e a resposta é **não** sem backup/branch, pergunte. Se a resposta é **sim**, aja.

---

## 5. Padrões emergentes — replicar em todos os projetos

Convenções que já decidimos padronizar no ecossistema. Ao entrar em projeto que ainda não adotou, sinalizar como débito técnico em `PROGRESS.md` do projeto — **não aplicar por conta própria sem aprovação**.

**Escopo deste §5:** apenas padrões de **dados, estrutura de código e documentação**.

**O que NÃO entra neste §5 (não se propaga automaticamente entre projetos):**
- Design tokens (cores, escalas, gradientes).
- Tipografia (famílias, pesos, escalas).
- Decisões de layout (sidebar, topbar, breadcrumb).
- Hierarquias de role/tier específicas de um projeto.

Esses itens são **locais ao projeto** até que exista um design system/pacote compartilhado oficializado. Se for tentado replicar visual de um projeto em outro, **perguntar antes** (ver §4).

| Padrão | Origem | Escopo |
|---|---|---|
| **Rota `/novidades`** — changelog interno do app exibido aos usuários | arruda-hub-commercial-core | Todos os apps com usuários finais |
| **`src/services/` como única camada de acesso ao Supabase** | SHARED_RULES §1 | Todos |
| **Zod schemas em `src/schemas/` ou inline no form** | commercial-core, flow-buddy | Todos com forms complexos |
| **`useXService` para hooks que consomem service** | sales-boost, logistics | Todos |
| **`organizacao_id` em toda tabela de negócio** | roadmap Fase G do RBAC Master | Pré-requisito para 2º cliente SaaS |
| **PROGRESS + LESSONS + ROADMAP versionados por projeto** | CLAUDE.md raiz | Todos |

---

## 6. Formato numérico, monetário, percentual, timezone

Quatro das dores mais recorrentes. Regras abaixo são **defaults obrigatórios** — divergir exige registro em `LESSONS.md` do projeto.

### 6.1 Monetário — sempre BRL/pt-BR

```ts
// Display
new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
// → "R$ 1.234,56"
```

- Nunca template string crua (`R$ ${value}`).
- Armazenar em coluna `numeric(14,2)` no Postgres, sem sufixo monetário.
- Import/export CSV: função utilitária `parseMoneyBR(input: string | number): number` que aceita `"R$ 1.234,56"`, `"1.234,56"`, `"1234.56"`, `1234.56` e normaliza.
- XLSX (SheetJS): valor cru + `cell.z = 'R$ #,##0.00'`. Excel trata como número com display BR.

### 6.2 Percentual — decimal canônico, sufixo `_pct` na coluna

- Armazenar como decimal `0.15` (15%). Coluna nomeada `*_pct` (ex.: `desconto_pct`, `comissao_pct`, `margem_pct`).
- Display: `new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2 }).format(0.15)` → `"15,00%"`.
- XLSX: valor cru (`0.15`) + `cell.z = '0.00%'`.
- Import: função `parsePercentBR` que aceita `"15%"`, `"15,00%"`, `"15"`, `"0,15"`, `"0.15"`, `15`, `0.15`. Heurística: tem `%` → divide por 100; valor `> 1` → divide por 100; `≤ 1` → assume decimal.
- **Detecção automática pelo agente:** coluna com nome contendo `pct|percent|percentual|taxa|comissao|desconto|margem|aliquota|juros` → aplicar formato percentual por padrão em exports, a menos que CLAUDE.md do projeto diga o contrário.

### 6.3 Timezone — UTC no banco, America/Sao_Paulo no app

O bug "dia -1" é o mais clássico do stack. Origem: `new Date('2026-04-15')` em JS é interpretado como UTC meia-noite → em UTC-3 vira `2026-04-14 21:00`.

- **DB:** `timestamptz` para datas+horas; `date` (sem tz) para datas puras (aniversário, data do acordo).
- **Frontend:** `date-fns-tz` (`formatInTimeZone`) ou `dayjs` com plugin `timezone`. **Nunca** `toLocaleDateString()` sem timezone explícito.
- **Regra visual:** ao ver qualquer formatação de data num componente, confirmar que tem tz explícita. Se não tem, presumir bug.
- **Supabase client:** `.toISOString()` preserva UTC corretamente; não mexer.
- **Ao criar nova coluna de data:** decidir entre `date` (puro) ou `timestamptz` (momento no tempo) antes de escrever a migration.

### 6.4 Números fracionários genéricos

`new Intl.NumberFormat('pt-BR').format(1234.56)` → `"1.234,56"`. Sempre pt-BR no display, sempre ponto decimal no banco.

---

## 7. UX — convenções operacionais

- **Dropdown → Combobox** quando há >8 opções (cmdk/shadcn). Permite busca.
- **Toast via `sonner`** para feedback de sucesso/erro. Nunca `alert()`, `window.confirm()`, `console.log` em produção.
- **Forms sempre com React Hook Form + Zod.** Validação dupla (frontend + backend).
- **Breadcrumb** em subrotas de apps operacionais.
- **Loading state** sempre com skeleton ou spinner — nunca tela em branco.
- **Ações destrutivas** (excluir, desativar) sempre atrás de `AlertDialog` com botão de confirmação em destaque.
- **Empty state** tem copy editorial, não genérica ("Nenhum item encontrado" ✘; "Nenhum acordo pendente nesta visão — que tal filtrar por outro status?" ✔).

### 7.1 Novidades (`/novidades` / `changelog.ts`) — regras obrigatórias

A rota de novidades é a vitrine do produto para o usuário final. Três regras inegociáveis:

**1. Só entra o que o usuário final percebe.**
Incluir apenas mudanças que impactem a usabilidade: novas telas, botões, fluxos, correções visuais, melhorias de UX. **Não incluir:** migrations de banco, backfills de dados, ajustes de comissão/parâmetros internos, refactors, mudanças de infra, CI/CD, RLS policies, rename de colunas, otimizações de query. Se o usuário não vê diferença na tela, não entra em novidades.

**2. Texto resumido e amigável — linguagem de produto, não de dev.**
- Escrever como se estivesse falando com o vendedor ou gestor que usa a plataforma.
- Máximo 2 linhas por item. Sem jargão técnico (nada de "migration", "backfill", "RLS", "Edge Function", "cron", "state management").
- Focar no benefício: "Agora você pode filtrar pedidos por status direto no painel" ✔. "Adicionado componente FilterDropdown com integração ao Zustand store" ✘.
- Título da versão em 1 frase que resume o impacto ("Ficha do cliente com modo leitura" ✔, "Refactor do ClienteDetail para separar read/edit" ✘).

**3. Antes de publicar, mostrar o texto ao usuário e pedir aprovação.**
O agente **nunca** deve commitar/deployar uma entrada de novidades sem antes apresentar o rascunho e receber confirmação explícita. Fluxo:
1. Redigir a entrada seguindo regras 1 e 2.
2. Apresentar ao usuário: título, summary e items.
3. Aguardar "ok", "pode ir", "aprovado" ou equivalente.
4. Só então adicionar ao `changelog.ts` (ou equivalente) e prosseguir com o commit/deploy.

**Exemplo de entrada boa:**
```ts
{
  version: '1.10.0',
  title: 'Ficha do cliente: leitura, edição e cadastro',
  summary: 'A ficha abre em modo leitura por padrão. Use o botão Editar para alterar dados.',
  items: [
    { type: 'feature', description: 'Ficha do cliente em modo leitura por padrão. Botão flutuante acompanha o scroll para concluir a edição.' },
    { type: 'feature', description: 'Na lista, o ícone de lápis abre direto em modo edição.' },
  ],
}
```

**Exemplo de entrada ruim (não publicar):**
```ts
{
  version: '1.11.2',
  title: 'Comissão do vendedor em clientes sem cadastro',
  summary: 'Backfill em comercialplus_clientes.comissao via migration versionada...',
  // ❌ Usuário final não precisa saber de backfill, migration ou nome de coluna
}
```

---

## 8. Armadilhas transversais conhecidas

Agregado dos `LESSONS.md` dos 11 projetos. **Antes de mexer numa área, cheque se tem armadilha registrada aqui.**

### 8.1 Segurança e autenticação

- **JWT com mudança de claims quebra todos os 10+ clientes.** (central-hub) → versionamento obrigatório; suportar v1 e v2 por ≥ 2 releases.
- **RLS só funciona com `ENABLE ROW LEVEL SECURITY` explícito.** (central-hub, commercial-core, degusta) → sempre ativar antes de criar policy.
- **`organizacao_id` ausente em RLS = vazamento cross-tenant.** (cross-project) → toda tabela de negócio deve ter a coluna + policy filtrando.
- **Tokens opacos vs JWT para acesso público.** (logistics tracking) → opaco tem `enabled` flag + expiry + logging.

### 8.2 Dados e performance

- **`NOW()` do servidor, não `new Date()` do cliente.** (acordo-flow) → timestamps sempre no banco.
- **Multiplicidade product vs product_version em pedidos.** (commercial-core) → FK sempre para version, preço histórico preservado.
- **ExcelJS trava com 10k+ linhas.** (flow-buddy) → chunk processing 1000/vez, não bloquear UI.
- **PapaParse com Latin-1 em CSV BR.** (flow-buddy) → detectar encoding ou fallback ISO-8859-1.
- **XML SEFAZ com namespaces múltiplos + arquivos de 5–10MB.** (nfe-radar) → parsing em background job, chunked insert.
- **Pub/Sub redelivery duplicando documentos.** (nfe-radar) → hash SHA256 + idempotência por `status='sucesso'`.
- **Analytics events sem `organization_id` no payload.** (rbac-master) → usar profile como fonte canônica, não o evento (ver Decisão 6 em LESSONS).

### 8.3 Integrações externas

- **Gmail Watch expira em 7 dias + access token em 1h.** (nfe-radar) → cron daily de renovação, refresh proativo 5min antes do expiry.
- **Sincronização comercialplus falha silenciosamente.** (catalog-maker) → registrar tentativas em tabela, alertar admin após 3 falhas.
- **Upload de anexo em rede instável sem retry.** (acordo-flow) → exponential backoff + checksum; considerar Tus.io resumível.

### 8.4 Frontend/visual

- **Sharp só funciona em Node, não no browser.** (catalog-maker) → Sharp em Edge Functions; canvas nativo no browser.
- **html2canvas não carrega imagens CORS + falha com transforms/SVG/fontes dinâmicas.** (catalog-maker, commercial-core) → proxy ou Base64; posição absoluta; `document.fonts.ready`.
- **Leaflet ícones somem em produção (Vite).** (sales-boost, route-planner) → custom icons em `public/`.
- **Turf.js inverte coordenadas `[lat,lng]` vs `[lng,lat]`.** (sales-boost, route-planner, degusta) → wrapper de conversão + testar com coordenadas reais (não `[0,0]`).
- **Leaflet-Draw fora de sync com React state.** (route-planner) → escutar `L.Draw.Event.*` e despachar pro estado.
- **Framer Motion + shadcn/ui Dialog conflitam.** (sales-boost) → animar container externo, não o conteúdo.
- **Signature Pad canvas não serializa direto.** (flow-buddy) → `.toDataURL('image/png')` + validar tamanho > 2000 bytes.
- **Geolocation falha silenciosa (timeout, permissão).** (degusta, sales-boost) → retry com timeout 30s + mensagens customizadas.

### 8.5 Build e ambiente

- **Bun vs npm em flow-buddy.** → CI/CD usa Bun; não usar `npm install` (invalida lockfile).
- **React Query subutilizado em logistics** — migração gradual, components novos já usam.
- **Zustand sem memoization automática** → usar selectors `useStore(state => state.x)` para evitar re-render desnecessário.

---

## 9. Formato de entrega ao usuário

Após concluir tarefa, responder ao usuário seguindo:

1. **Linha 1 — resultado:** o que foi feito, 1 frase. Ex.: "Paleta convertida para teal em 17 arquivos."
2. **Bullets curtos só se houver ≥ 3 itens independentes.** Evite bullets para 1–2 itens (usar prosa).
3. **Link `computer://` sempre que o resultado é arquivo/output.** Ex.: `[Abrir AGENTS.md](computer:///sessions/.../AGENTS.md)`.
4. **Não re-explicar** o que o link já mostra. Se linkou o arquivo, não descreva o conteúdo em prosa — o usuário abre se quiser.
5. **Postâmbulo mínimo.** Nada de "Espero ter ajudado!" ou "Me avise se precisar de ajustes!". Se tem próximo passo natural, citar em 1 linha.

---

## 10. O que NÃO fazer

- ❌ Criar arquivo `.md` novo sem ser explicitamente solicitado.
- ❌ Usar emoji em código ou docs (apenas se pedido).
- ❌ Inventar MCP ou comando que não está no §1 — se não tem, pedir instalação via `search_mcp_registry`.
- ❌ Commit automático sem o usuário pedir ou disparar `CHECKPOINT`/`DEPLOY`.
- ❌ `git add -A` ou `.` — sempre nominal.
- ❌ `--no-verify` em commits (nunca skip hooks).
- ❌ `--amend` após hook pre-commit falhar — criar novo commit.
- ❌ Mexer em RLS sem documentar em `LESSONS.md`.
- ❌ `alert()`, `window.confirm()`, `console.log` em produção.
- ❌ Expor caminhos internos `/sessions/...` em respostas ao usuário — usar "pasta do projeto" ou nome do projeto.
- ❌ Explicar o que o link `computer://` já mostra.
- ❌ Repetir "sou uma IA" ou disclaimers desnecessários.

---

## Apêndice — Comandos por projeto

| Projeto | Dev | Porta default | Package manager | Scripts relevantes |
|---|---|---|---|---|
| acordo-flow | `npm run dev` | 5173 | npm | — |
| arruda-catalog-maker | `npm run dev` | 5173 | npm | `reprocess-images` |
| arruda-central-hub | `npm run dev` | 5173 | npm | — |
| arruda-flow-buddy | `bun dev` | 5173 | **bun** | — |
| arruda-hub-commercial-core | `npm run dev` | 5173 | npm | `fix:novos-itens-pallet`, `fix:total-weight`, `fix:peso-itens`, `fix:*:dry-run` |
| arruda-rbac-master | `npm run dev` | 5173 | npm | — |
| arruda-sales-boost | `npm run dev` | 5173 | npm | `test`, `test:watch`, `db:fix-resumo-type` |
| degusta-go-app | `npm run dev` | 5173 | npm | `test`, `lint:report`, `lint:fix`, `sonar` |
| logistics-arrudahub | `node scripts/dev.mjs` | 5173 | npm | `migration:ocorrencias`, `migration:lead-time`, `migration:rota-id`, `test`, `test:ui`, `test:coverage` |
| nfe-radar | `npm run dev` (frontend) | 5173 | npm | Backend Python separado (Railway) |
| route-planner | `npm run dev` | 5173 | npm | `tsc -b && vite build` |

**Deploy:** todos os frontends em Vercel (auto via `main`). Backend Python de `nfe-radar` em Railway.

---

## Manutenção deste arquivo

Este runbook é vivo. Quando:

- Um novo MCP for instalado → atualizar §1.
- Um novo padrão for promovido a ecossistema → adicionar em §5.
- Uma nova armadilha cross-project for descoberta → adicionar em §8.
- Um novo ritual/acronym for proposto → adicionar em §2 com a mesma estrutura.

Edits não-triviais exigem commit com `docs(agents): <mudança>`.
