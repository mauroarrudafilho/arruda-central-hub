# ArrudaHub — Agent Runbook

**Este arquivo rege o comportamento de agentes (Claude Code, Cursor, Cowork, Copilot, etc.) em qualquer um dos 16 projetos do ecossistema.** Leia antes de começar qualquer tarefa.

**Distinção importante:**
- `SHARED_RULES.md` → regras de **código** (service pattern, RLS, Zod, naming). Mudam devagar.
- `AGENTS.md` (este arquivo) → regras de **comportamento do agente** (rituais, MCPs, armadilhas, quando perguntar). Mudam rápido.
- `CLAUDE.md` → contexto **técnico** de cada projeto (rotas, schema, integrações). Específico por projeto.

Em caso de conflito: `AGENTS.md` para comportamento > `SHARED_RULES.md` para código > `CLAUDE.md` do projeto para contexto local.

---

## 0. Antes de começar qualquer tarefa

0.1. **Registrar o HEAD inicial da sessão.** Antes de qualquer commit, rode `git rev-parse HEAD` (por repo tocado) e guarde o SHA — é o que o passo 9 do `CHECKPOINT` (§2) usa para diferenciar arquivo criado por **esta sessão** (`A` no diff contra esse HEAD, ou `??` em `git status`) de arquivo legado. Sem esse SHA registrado, o critério mecânico do passo 9 não tem como ser aplicado.

Ordem de leitura obrigatória:

1. `ECOSSISTEMA.md` (raiz) — porta de entrada: o que é cada arquivo-mãe e como nasce um Ripple
2. `AGENTS.md` (este arquivo) — comportamento
3. `SHARED_RULES.md` (raiz) — padrões de código
4. `CLAUDE.md` (raiz) — mapa do ecossistema
5. `CLAUDE.md` do projeto específico — stack, rotas, schema
6. `PROGRESS.md` do projeto — estado atual
7. `LESSONS.md` do projeto — armadilhas já documentadas

Se o usuário citar arquivo específico, ler esse também antes de agir.

### 0.2 RBAC canônico — lei do ecossistema, não sugestão

**Qualquer trabalho de acesso, permissão, policy ou matriz de perfil começa no
`arruda-rbac-master`**, não no app que apresenta o sintoma. Ele é a fonte única de identidade e
autorização. O modelo está em `arruda-rbac-master/CLAUDE.md` § *O Modelo Canônico*; o resumo
operacional é:

| Eixo | O que é | Valores |
|---|---|---|
| **Perfil canônico** | capacidade — o que **pode fazer** | `visualizador` · `operador` · `gestor` · `admin` — **só esses 4** |
| **Cargo** | contexto — o que a pessoa **é** | Vendedor, Promotor, Analista, Financeiro… — **texto, não confere permissão** |
| **Escopo de dados** | alcance | `proprio` · `equipe` · `todos` |
| **Vínculo de domínio** | operação | `promoters`, `usuarios_acordos`, `portal_acessos` |
| **Tenant** | organização | `organizacao_id` — **nunca** `tenant_id` |

**As três confusões que mais custam caro:**

1. **Cargo não é role.** "Vendedor" e "promotor" são cargo. Quem responde "essa pessoa é vendedora"
   é o **vínculo de domínio** (`usuarios_acordos`), nunca uma role nem uma flag. A coluna
   `eh_vendedor` foi removida justamente por isso — não recriar equivalente.
2. **RBAC é o portão, o vínculo é o escopo.** Foi o que quebrou os acordos em 24/07: a policy caiu
   em `FALSE` porque procurava a role literal `'vendedor'` (o perfil unificado é `operador`), e
   comparava `auth.uid()` com `acordos.vendedor_id`, que referencia `usuarios_acordos.id`.
   Ao escrever policy: **papel pelo RBAC, linha pelo vínculo.**
3. **Perfil novo não se inventa.** São 4. Precisa de recorte diferente? É escopo de dados ou
   vínculo, não um quinto perfil. QA/leitura ampla = `visualizador` + `todos`.

**Migração em andamento:** `degusta-go-app` e `arruda-sales-boost` ainda carregam enums próprios
(`app_role` com `promotor`, `vendedor`, `fornecedor`) e convergem para o modelo canônico. Ao mexer
neles, **não estender o enum legado** — mapear para perfil + cargo + vínculo.

**Repo novo — obrigatório desde já.** Nenhum Ripple novo nasce com role própria, tabela de
permissão própria ou enum de tipo de usuário. Nasce consumindo o RBAC: perfil canônico + cargo +
escopo + `organizacao_id`, com a tabela de vínculo do seu domínio referenciando o usuário canônico.
Checklist em `ECOSSISTEMA.md` § *Como nasce um Ripple novo*.

**Ao validar acesso, medir a função, não o nome da policy.** O predicado costuma citar só a tabela
de vínculo; a camada de RBAC está dentro do helper. Conferir com
`select pg_get_functiondef(oid) from pg_proc where proname = '<helper>'` — foi assim que se
descobriu que `get_acordos_where_filter` lê `rbac_*` **e** `usuarios_acordos`, e que ler só o
predicado escondia a camada canônica.

---

## 1. Inventário de capacidades — MCPs disponíveis

Antes de dizer "não consigo", verifique esta lista. Se a tarefa se encaixa em um MCP, use-o em vez de pedir acesso ou escrever código do zero.

| MCP | Para quê | Quando NÃO usar |
|---|---|---|
| **Supabase** | `execute_sql`, `apply_migration`, `list_tables`, `get_logs`, `search_docs`, `list_migrations` | Operações destrutivas em produção sem autorização explícita |
| **Obsidian (vault git)** | Notas de projeto, Decisões, HOME no ritual CHECKPOINT/DEPLOY via repo `arruda-hub-vault` | Dumpar specs/SQL inteiros no vault; código-fonte dos Ripples |

**Vault Obsidian — canônico = GitHub (2026-07-28).**

| | |
|---|---|
| **Repo** | https://github.com/mauroarrudafilho/arruda-hub-vault |
| **Clone canônico** | `/Users/mauro/arrudahub/arruda-hub-vault` (no cloud: checkout equivalente desse repo) |
| **Estrutura** | `01 - Projetos/`, `04 - Conhecimento/Decisões/`, `HOME.md`, `LEIA-PRIMEIRO - Agentes de IA.md` |
| **Escrita no ritual** | Read/Write/Bash no **clone**; depois `git add` nominal + `commit` + `push` **no repo do vault** (além dos commits dos Ripples) |

- Cloud / Cursor online: clonar ou abrir `arruda-hub-vault` — **não** depender de caminhos sob `/Users/mauro/Documents/...`.
- `Documents/Obsidian Vault/arruda_hub` (se existir no desktop): cópia opcional do app Obsidian Desktop — **não é canônico para agentes**. Preferir abrir o clone git no Obsidian.
- `/Users/mauro/Documents/Ossidian Vault/` (typo): **não é o vault, não escrever lá**.
- MCP `obsidian` (`server-filesystem`): **não** é o caminho preferido do ritual (o cliente costuma sobrescrever o root com o cwd do projeto). Preferir ferramentas de arquivo no clone git. Não “consertar” `~/.claude.json` por causa disso.

**Graphify — fora do fluxo desde 2026-07-26.** O grafo do ecossistema **não é mais mantido** e o `graphify-out/` no disco é um retrato congelado de **2026-07-25**. Não consultar como se fosse o estado atual, não citá-lo como fonte, **não** rodar `graphify query` / `path` / `explain` / `update`. Blast radius cross-app se apura lendo o código e o banco: `grep` nos `src/` dos apps envolvidos, mais `pg_policies` / `pg_proc` via MCP Supabase. Motivo e caminho de retomada em `LESSONS.md` da raiz.

> **Limite conhecido de grafo estático, que motivou a saída.** No `portal-fornecedor`, o grafo mostrava as policies de acordos ligadas a `usuarios_acordos` e a **nenhuma** tabela `rbac_*` — porque lia o texto do predicado, não o corpo dos helpers. Medindo `pg_get_functiondef`, `get_user_data_unified` e `get_user_role_v2` leem `rbac_*`, e `can_user_view_acordo` / `get_acordos_where_filter` leem os dois. O modelo real é de duas camadas — **RBAC é o portão, `usuarios_acordos` é o escopo** — e a camada canônica era justamente a que sumia. Para autorização, medir a função, não o grafo.

**Regra de ouro:** para **qualquer** coisa de DB do ecossistema (Supabase), usar o MCP diretamente. Não peça credenciais, não assuma que não tem acesso — verifique primeiro.

Outros MCPs (Gmail, Calendar, navegação web, etc.) podem existir no ambiente — avaliar caso a caso antes de oficializar nesta tabela.

---

## 2. Rituais — Acronyms de comando

Quando o usuário disparar um destes acronyms (em maiúscula, minúscula ou misto), execute o ritual na ordem descrita. **Não pergunte se deve fazer** — o acronym é a autorização.

### `CHECKPOINT`

Salva estado e **sincroniza contexto** (não é só git). Usado para pontos de parada ou fim de tarefa sem deploy.

1. Verificar `git status` — o que mudou.
2. **Auditoria de contexto** do(s) projeto(s) tocados: `CLAUDE.md`, `PROGRESS.md`, `LESSONS.md` (e `ROADMAP.md` se a entrega mudar direção) devem refletir o que esta sessão entregou. Se `CLAUDE.md` estiver obsoleto, corrigir neste ritual.
3. Atualizar `PROGRESS.md` do(s) projeto(s) tocados (checkbox + 1 linha) — obrigatório.
4. Se aprendeu algo (armadilha, decisão técnica, workaround), adicionar entrada em `LESSONS.md`.
5. **Alinhar `CLAUDE.md` do projeto** (rotas, schema, integrações, status) com o estado real.
6. Se a mudança for **transversal** ao ecossistema: atualizar `AGENTS.md` / `SHARED_RULES.md` / `CLAUDE.md` na **raiz do ArrudaHub** e rodar `./sync-agents.sh` (depois commitar `AGENTS.md` em cada Ripple afetado pela cópia).
7. **Obsidian (vault git `arruda-hub-vault`):** no clone canônico (`/Users/mauro/arrudahub/arruda-hub-vault` ou checkout cloud do mesmo repo), atualizar nota em `01 - Projetos/<App>.md` (tabela Últimas atualizações); se decisão cross-app, criar nota em `04 - Conhecimento/Decisões/`; 1 linha em `HOME.md`. Em seguida `git add` nominal + `commit` + `push` **nesse repo**. Se o clone/repo estiver ausente ou o push falhar: avisar e listar o que faltou — **não** bloquear o commit do Ripple.
8. ~~**Graphify (Hub)**~~ — **passo removido em 2026-07-26.** O grafo saiu do fluxo; não rodar `graphify` no ritual. Ver §1.
9. **Higiene de documentação — escopo: só o que esta sessão criou.** Rodar `/Users/mauro/arrudahub/scripts/doc-hygiene.sh <repo>` (caminho absoluto — o script vive só no repo raiz; as 16 cópias do `AGENTS.md` ficam em repos sem `scripts/`). **Se o script não existir no caminho acima:** avisar e seguir em frente — não bloquear o commit por isso.
   - O passo 9 trata **apenas** de arquivo que **esta sessão** criou: aparece como `??` em `git status`, ou `A` no diff contra o HEAD inicial registrado no §0.1. Se não virou canônico: triar e remover sozinho.
   - Arquivo que já estava no HEAD inicial da sessão (legado, de outra sessão) **não é escopo deste passo** — não listar, não perguntar, não remover aqui. O acervo legado (hoje dezenas de candidatos em 8 repos — nfe-radar 55, sales-boost 42, portal-fornecedor 42, commercial-core 41, degusta-go 25, catalog-maker 24, central-hub 17, rbac-master 16) é trabalho da **Fase 2** da spec de higiene de documentação, não do ritual diário. Rodar o auditor sem esse filtro de sessão transforma todo `CHECKPOINT` numa lista enorme de arquivos legados e o passo acaba sendo ignorado — não repita esse erro.
   - Triagem antes de remover (só dos arquivos da sessão): **promover** (lição vai para `LESSONS.md`, ou `AGENTS.md` §5/§8 se transversal) · **mover** (doc de domínio vai para `docs/`, e o `CLAUDE.md` passa a citá-lo) · **remover** (`git rm`).
   - Doc de sessão nasce em `docs/sessions/YYYY-MM-DD-<slug>.md`, nunca na raiz.
10. `git add` **nominal** (nunca `-A` ou `.`) dos arquivos relevantes.
11. `git commit` com mensagem conventional PT-BR (ver §3).
12. `git push`.
13. Responder com: commit hash + resumo 1 linha + confirmação `contexto sync: CLAUDE/PROGRESS/Obsidian(vault git)` (ou falha parcial explícita).

**Gate anti-staleness (antes do commit):** (a) `CLAUDE.md` descreve o módulo tocado? (b) `PROGRESS` reflete o estado real? (c) decisão afeta outro app? → conferir o uso real no `src/` dos apps envolvidos (e `pg_policies` / `pg_proc` se for RLS ou RPC), depois nota em Decisões. Divergência clara em CLAUDE/PROGRESS **bloqueia** o commit até corrigir.

### `DEPLOY`

Ritual completo de entrega: roda `CHECKPOINT` inteiro + dispara deploy Vercel.

1–12. Idênticos ao `CHECKPOINT` (incluindo Obsidian + gate).
13. Se a entrega inclui features ou correções visíveis ao usuário, adicionar entrada na rota `/novidades` do projeto — seguindo obrigatoriamente as regras do §7.1 abaixo (texto aprovado pelo usuário antes de commitar).
14. Disparar deploy. Duas opções:
   - Se o projeto tem CI configurado em `main`, bastou `git push` — responder com link do dashboard Vercel.
   - Se precisa rodar `vercel --prod` localmente, executar e aguardar.
15. Responder com: commit hash + URL do preview/produção + resumo 1 linha + `contexto sync: CLAUDE/PROGRESS/Obsidian(vault git)` (ou falha parcial explícita).

**Se `CHECKPOINT` ou `DEPLOY` disparar hook pre-commit que falha:** parar, reportar o erro, **não** fazer `--no-verify`, **não** fazer `--amend`. Resolver e criar novo commit.

### `PULSE`

Pulso diário de estabilidade (Sentry × PostHog × Supabase). Objetivo: decidir no máximo 3 correções do dia seguinte — não inventar produto. Detalhe operacional e harness SQL vivem no `arruda-rbac-master` (`scripts/harness_public_links_security.sql`, SEC-004 / §8.6).

1. Harness de links públicos no Supabase (via MCP no projeto rbac / instância compartilhada). `FAIL` = ação; `WARN` só com sintoma de usuário.
2. Sentry: `permission denied` / `42501` / Platform unavailable nas últimas 24h (priorizar `degusta-go` e `sales-boost`).
3. PostHog: outages reais (`query_error` / `http_error` / `manual_outage`), bursts, exceptions — não escalar só com `network`/`timeout`.
4. Supabase logs: `42501` / `permission denied` em helpers de sessão e RPCs públicas.
5. Classificar **VERDE / AMARELO / VERMELHO** (≥2 fontes alinhadas; harness FAIL já conta).
6. Relatório curto no Slack/chat: Status · Sinais · Cruzamento · Ações amanhã (≤3) · Ignorar.
7. Sem migration destrutiva / RLS sem autorização além do PULSE.

Automação: diário **19:00 America/Sao_Paulo** → `#degusta-go-bugs`.

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
- Criar função `SECURITY DEFINER` (requer revisão de search_path e necessidade real).
- Conceder qualquer permissão ao role `anon` (sempre questionar se o dado é realmente público).
- Revogar grants de roles (`REVOKE` em `authenticated`, `anon`, `public`).
- Deletar/renomear tabela, coluna ou função pública.
- Alterar contrato entre apps (RPC compartilhada, schema de evento, formato de token).
- Mexer em `rbac_auth_*`, `rbac_organizations`, `rbac_permissions` de forma estrutural.
- `DEPLOY` em projeto que não foi autorizado explicitamente nessa sessão — confirmar antes.
- Remover arquivo, diretório ou commit anterior — **exceto** arquivo de documentação criado pela própria sessão e ainda não promovido a canônico (ver CHECKPOINT passo 9). O critério é mecânico: `??` em `git status` ou `A` no diff contra o HEAD inicial da sessão. Arquivo que já estava no HEAD quando a sessão começou: sempre perguntar.
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

### 6.4 Coluna `date` e strings `YYYY-MM-DD` — harness anti-regressão (off-by-one)

Complemento ao §6.3: valores **só-dia** vindos do Postgres (PostgREST retorna como `YYYY-MM-DD`) **não representam um instante com fuso**. `new Date("2026-05-10")` e `parseISO("2026-05-10")` tratam como **meia-noite UTC**; em **America/Sao_Paulo** o calendário local pode mostrar **o dia anterior**. Afeta exibição, filtros, "hoje" / "vencido", ordenação e exportação.

**Regras obrigatórias (todos os projetos):**

- **Não** formatar campo **`date`** ou string estritamente `YYYY-MM-DD` usando só `new Date(...)` ou `format(parseISO(...))` sem ramo explícito para literal só-dia.
- **Comparar** dias civis com chave **`yyyy-MM-dd`** (ordem lexicográfica) ou helpers do projeto que implementem essa semântica — **não** `isToday(parseISO(ymd))` / `startOfDay(parseISO(ymd))` em cima de date-only sem tratamento.
- **"Hoje" e "vencido" no produto BR:** quando a regra for dia civil no app, alinhar ao fuso documentado do projeto (padrão ecossistema: **America/Sao_Paulo** via `date-fns-tz`, não depender do fuso da máquina do dev ou do CI).
- **Timestamptz** (momento real): usar `parseISO` + formatação/comparação no fuso acordado (ver §6.3). Não misturar no mesmo caminho date-only e instante sem `if`/helper.
- **Exportação** (CSV/XLSX): mesma semântica de calendário que a tela para colunas de data; evitar `toLocaleDateString()` sem timezone explícito.

**Checklist (PR / agente):**

- [ ] Campo é **`date`** ou sempre `YYYY-MM-DD`? → proibido depender só de `new Date(campo)` para UI.
- [ ] Há "é hoje?" / "vencido?" / range por dia? → comparação por `yyyy-MM-dd` ou helper de calendário do app.
- [ ] Teste com **pelo menos** um valor `YYYY-MM-DD` que falharia com `parseISO` + `format` ingênuos; preferir `vi.setSystemTime` com offset explícito (ex. `-03:00`) e, se o app fixar SP, um caso borda UTC ↔ calendário SP.

**Frase-resumo para colar em runbooks de projeto:** *Strings `YYYY-MM-DD` / colunas `date`: nunca formatar nem classificar só com `new Date` ou `parseISO` sem ramo específico; comparar chaves `yyyy-MM-dd` ou helpers + fuso SP conforme este runbook.*

### 6.5 Números fracionários genéricos

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

Agregado dos `LESSONS.md` dos 16 projetos. **Antes de mexer numa área, cheque se tem armadilha registrada aqui.**

### 8.1 Segurança e autenticação

- **JWT com mudança de claims quebra todos os 10+ clientes.** (central-hub) → versionamento obrigatório; suportar v1 e v2 por ≥ 2 releases.
- **RLS só funciona com `ENABLE ROW LEVEL SECURITY` explícito.** (central-hub, commercial-core, degusta) → sempre ativar antes de criar policy.
- **`organizacao_id` ausente em RLS = vazamento cross-tenant.** (cross-project) → toda tabela de negócio deve ter a coluna + policy filtrando.
- **Tokens opacos vs JWT para acesso público.** (logistics tracking) → opaco tem `enabled` flag + expiry + logging.
- **[SEC-001 — 2026-04-28] Role `anon` com grants sem RLS = exposição total ao público.** Auditoria identificou 24 tabelas (incluindo `password_reset_tokens`, `rbac_organizations`, `comercialplus_comissoes`) abertas para a internet. Causa: padrão histórico do Supabase concedia grants ao role `anon` por padrão, sem RLS habilitado. Correção: `migrations/20260428_rls_security_fase1.sql`. Regra permanente: toda tabela nova deve ter RLS habilitado na mesma migration que a cria. Ver `SHARED_RULES.md §8`.
- **[SEC-002 — 2026-04-28] SECURITY DEFINER sem `SET search_path` = risco de hijacking.** 71 funções com esse problema. Funções privilegiadas executam com permissões do owner do banco — sem search_path fixo, um schema malicioso pode interceptar chamadas. Template obrigatório em `SHARED_RULES.md §8.4`.
- **[SEC-003 — 2026-04-28] RLS habilitado com ZERO policies = NEGA TUDO (comportamento intencional).** Tabelas internas (`rbac_analytics_events_*`, `rbac_rls_policies`) propositalmente sem policy — service_role bypassa RLS e acessa, usuários não. Não adicionar policies acidentalmente nessas tabelas.
- **[SEC-004 — 2026-07-24] Policy `TO PUBLIC` + helper SECURITY DEFINER + `REVOKE EXECUTE` = link público 401/`42501`.** Anon avalia policies `PUBLIC` e precisa de `EXECUTE` no helper (`get_promotor_id_*`, `is_admin()`, `is_field_vendedor()`, …). `REVOKE … FROM anon` **não** remove grant via role `PUBLIC` — usar `REVOKE FROM PUBLIC` + allowlist (migration B2). Padrão obrigatório: rota pública via RPC/`Edge` (`SHARED_RULES` §8.6 / §3.1). Ver harness §8.6 e `scripts/harness_public_links_security.sql` no rbac-master.

### 8.2 Dados e performance

#### Carga no Supabase — as 5 regras que evitam derrubar a instância

O banco caiu em ondas em **21 e 24/07/2026**. A causa não foi volume de usuários — foram 60 contas.
Foi **custo de RLS por linha** somado a **retry storm do cliente**. As regras abaixo são o que
manteve o estado atual; medido em 2026-07-28 sobre ~1026 policies. Placar contínuo:
`arruda-rbac-master/scripts/harness_supabase_performance_placar.sql` (MCP `execute_sql`).

1. **`(SELECT auth.uid())`, nunca `auth.uid()` cru.** Envolvido em `SELECT`, o planner avalia
 **uma vez por query** (InitPlan); cru, avalia **uma vez por linha varrida**. Numa tabela de
 100 mil linhas isso é a diferença entre 1 e 100.000 execuções. **Estado (2026-07-29): 0 policies
 residuais** com `auth.uid()`/`auth.jwt()` cru (A03 PASS — migration `20260729190000`).
 Custo principal é em SELECT/UPDATE de varredura; não reintroduzir. Vale igual para `auth.jwt()`.
2. **Helper de policy é `STABLE`, nunca `VOLATILE`.** `VOLATILE` impede o cache do planner e
 re-executa por linha, anulando a regra 1. **Estado (2026-07-28): `lms_is_admin`
 e `lms_is_admin_or_manager` já são `STABLE`.** Helper novo nasce `STABLE SECURITY DEFINER`
 com `search_path` fixo. Auditar com o harness `harness_supabase_performance_placar.sql`
 (check A04) se algum helper VOLATILE voltar a aparecer em predicado de policy.
3. **Não empilhar policy permissiva.** Policies permissivas se somam por `OR`, e o Postgres avalia
   **todas** por linha até uma passar. **Estado: nenhuma tabela tem 4+ permissivas no mesmo
   comando** — manter assim. Precisa de mais de uma condição? Junte com `OR` dentro de **uma**
   policy, ou use `AS RESTRICTIVE` quando a intenção for filtrar (ver §8.6).
4. **Toda coluna que uma policy filtra precisa de índice.** `organizacao_id = stock_org_do_usuario()`
   sem índice em `organizacao_id` é seq scan a cada query, com o custo do helper por linha. Policy
   nova sem índice de apoio é meia policy.
5. **Retry do cliente com backoff exponencial, sempre.** O segundo vetor dos apagões foi o
   tracking reenviando em loop contra um banco já degradado — cada retry empilha conexão e piora.
   Erro de rede → backoff com teto e limite de tentativas, nunca retry imediato. Realtime tem
   kill switch por app (`VITE_SUPABASE_REALTIME_ENABLED`, default **off**) — não reativar sem
   medir.

**Como conferir antes de propor policy nova** (MCP Supabase, leitura pura):

```sql
-- 1+2: chamadas por linha e volatilidade de helper
select policyname, qual from pg_policies
where schemaname='public' and tablename='<tabela>'
  and (coalesce(qual,'')||coalesce(with_check,'')) ~ 'auth\.(uid|jwt)\(\)'
  and (coalesce(qual,'')||coalesce(with_check,'')) !~ '\( *SELECT auth\.';
-- 3: empilhamento
select cmd, count(*) from pg_policies
where schemaname='public' and tablename='<tabela>' and permissive='PERMISSIVE' group by cmd;
```

**Regra de ouro da §8.2:** contagem de policy sem a dimensão de `role` engana. Sempre excluir
`service_role` — ela ignora RLS por desenho, e policies `USING (true)` para ela são corretas.
Contar sem esse filtro produz alarme falso (aconteceu com o `arruda-stock-control`, que parecia
ter 16 tabelas abertas e tem zero).

- **`NOW()` do servidor, não `new Date()` do cliente.** (acordo-flow) → timestamps sempre no banco.
- **Multiplicidade product vs product_version em pedidos.** (commercial-core) → FK sempre para version, preço histórico preservado.
- **ExcelJS trava com 10k+ linhas.** (flow-buddy) → chunk processing 1000/vez, não bloquear UI.
- **PapaParse com Latin-1 em CSV BR.** (flow-buddy) → detectar encoding ou fallback ISO-8859-1.
- **XML SEFAZ com namespaces múltiplos + arquivos de 5–10MB.** (nfe-radar) → parsing em background job, chunked insert.
- **Pub/Sub redelivery duplicando documentos.** (nfe-radar) → hash SHA256 + idempotência por `status='sucesso'`.
- **Analytics events sem `organization_id` no payload.** (rbac-master) → usar profile como fonte canônica, não o evento (ver Decisão 6 em LESSONS).
- **Migration é aplicada manualmente, via MCP `apply_migration`** — uma por vez, autorizada. O histórico da instância compartilhada tem mais de 1.600 migrations de todos os apps.
- **`supabase db push` é proibido** contra a instância compartilhada. Ele reconcilia a pasta local contra esse histórico e reaplicaria migrations de RLS já aplicadas. Os 7 `supabase/config.toml` do ecossistema trazem esse aviso no topo — **não os apague**: 4 deles (`degusta-go`, `portal-fornecedor`, `ceo-hub`, `sales-boost`) carregam `verify_jwt` de edge functions vivas, e removê-los derrubaria o deploy das functions.
- **Nunca versionar `supabase/.temp/`.** É o cache de link da CLI: guarda `project-ref` e `pooler-url` da instância compartilhada e faz `db push` mirar produção sem passo de `link`. Todo repo com `supabase/` deve ignorá-lo.
- **`apply_migration` registra no histórico; `execute_sql` não.** Mudança de schema feita por `execute_sql` fica fora do versionamento — invisível para o próximo agente. Schema sempre por `apply_migration`.
- **Nome de migration:** `YYYYMMDDHHMMSS_descricao.sql` (14 dígitos), **da próxima em diante**. Vale para arquivo novo; migration já aplicada não se renomeia — a ordem real dela está em `supabase_migrations.schema_migrations`, não no nome do arquivo, e reescrever o nome inventaria um horário que ninguém mediu.

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

### 8.6 Links públicos / SECURITY DEFINER anon — harness anti-regressão

Complemento ao `SHARED_RULES` §8.6 / §3.1 e à SEC-004. Evita que, ao crescer o catálogo de RPCs e policies, voltem embeds anônimos quebrados ou `EXECUTE` amplo para `anon`.

**Regras obrigatórias:**

- Rota pública nova = RPC `get_*_by_token` / `get_public_*` / `*_public_tracking` (ou Edge `service_role`). Não abrir PostgREST embed anon em tabelas com helpers de sessão.
- Toda SECURITY DEFINER nova: `SET search_path = public, pg_temp`; `REVOKE EXECUTE … FROM PUBLIC`; `GRANT` só aos roles necessários. `anon` só se estiver na allowlist B2 (nome ou padrão).
- Policy com helper de sessão (`get_promotor_id_*`, `is_admin()`, `has_role()`, `is_field_vendedor()`, …) → `TO authenticated`, nunca `TO PUBLIC`.
- Policy residual de token em tabela → `TO anon, authenticated` e `USING` só no token (sem helper).
- Cliente do app: `supabase.rpc(...)` com anon; smoke sem login + token inválido sem `42501`.

**Checklist (PR / agente / migration):**

- [ ] Superfície pública nova usa RPC/Edge — não `.from(...).select('*, embed(*)')` anônimo.
- [ ] Nome da RPC bate allowlist B2 (`get_public_%` / `get_%_by_token` / lista explícita em `20260724180300_…b2…sql`).
- [ ] `REVOKE FROM PUBLIC` na função (não só `FROM anon`).
- [ ] Nenhuma policy nova `TO PUBLIC` chama helper de sessão.
- [ ] Rodou `scripts/harness_public_links_security.sql` no rbac-master (via Supabase MCP) e tratou FAIL.

**Frase-resumo:** *Link público = RPC (ou Edge); policy com helper = `TO authenticated`; `REVOKE FROM PUBLIC` + allowlist para anon EXECUTE.*

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

Lista autoritativa: array `PROJECTS` do `./sync-agents.sh` (16 projetos).

| Projeto | Dev | Porta default | Package manager | Scripts relevantes |
|---|---|---|---|---|
| arruda-academy | `npm run dev` | 3010 | npm | `test`, `test:watch` |
| arruda-catalog-maker | `npm run dev` | 5173 | npm | `reprocess-images` |
| arruda-central-hub | `npm run dev` | 5173 | npm | — |
| arruda-ceo-hub | `npm run dev` | 8080 | npm | — |
| arruda-design-system | `npm run dev` (tsup --watch) | N/A (biblioteca, sem dev server) | npm | `showcase:dev`, `showcase:build` (site em `showcase-site/`) |
| arruda-flow-buddy | `bun dev` | 5173 | **bun** | — |
| arruda-hub-commercial-core | `npm run dev` | 5173 | npm | `fix:novos-itens-pallet`, `fix:total-weight`, `fix:peso-itens`, `fix:*:dry-run` |
| arruda-peoplecare-hub | `npm run dev` | 5174 | npm | `test`, `test:run` |
| arruda-rbac-master | `npm run dev` | 5173 | npm | — |
| arruda-sales-boost | `npm run dev` | 5173 | npm | `test`, `test:watch`, `db:fix-resumo-type` |
| arruda-stock-control | `npm run dev` | 5173 | npm | `test`, `test:watch` |
| degusta-go-app | `npm run dev` | 5173 | npm | `test`, `lint:report`, `lint:fix`, `sonar` |
| logistics-arrudahub | `node scripts/dev.mjs` | 5173 | npm | `migration:ocorrencias`, `migration:lead-time`, `migration:rota-id`, `test`, `test:ui`, `test:coverage` |
| nfe-radar | `npm run dev` (frontend) | 5173 | npm | Backend Python separado (Railway) |
| portal-fornecedor | `npm run dev` | 3001 | npm | `test` |
| route-planner | `npm run dev` | 5173 | npm | `tsc -b && vite build` |

**Deploy:** todos os frontends em Vercel (auto via `main`). Backend Python (Railway): `arruda-sales-boost` (`python-pdf-service`) e `nfe-radar` (`nfe-ingestion-service`, `cte-ingestion-service`, `boleto-ingestion-service`).

---

## Manutenção deste arquivo

Este runbook é vivo. Quando:

- Um novo MCP for instalado → atualizar §1.
- Um novo padrão for promovido a ecossistema → adicionar em §5.
- Uma nova armadilha cross-project for descoberta → adicionar em §8.
- Um novo ritual/acronym for proposto → adicionar em §2 com a mesma estrutura.

Edits não-triviais exigem commit com `docs(agents): <mudança>`.
