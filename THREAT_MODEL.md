# Modelo de Segurança — Central Hub (stand-by)

> **O que este arquivo cobre:** a superfície de um app **em stand-by**. Ler antes de qualquer
> proposta de reativar o SSO.
>
> Verificado em 2026-07-26.

---

## 1. O risco principal deste repo é ele ser levado a sério

O `arruda-central-hub` foi desenhado como camada de SSO cross-app e **está em stand-by**. Não é
fonte de autorização, e o `CLAUDE.md` da raiz é explícito: identidade, perfil e RLS se resolvem no
**`arruda-rbac-master`**.

O código de SSO continua no repo, completo e plausível. Essa é exatamente a armadilha: um agente
que abra este repositório sem contexto encontra um fluxo de token bem documentado e conclui que é
o caminho vigente. **Não é.** `VITE_HUB_CENTRAL_URL` sobrevive em 4 apps (`arruda-academy`,
`arruda-peoplecare-hub`, `arruda-sales-boost`, `logistics-arrudahub`) apenas para redirecionar à
tela de login.

O mecanismo vivo é Supabase Auth direto, com autorização validada no banco por RPC e RLS.

---

## 2. Por que o stand-by foi a decisão certa — inclusive por segurança

Cada time opera exclusivamente um app: Comercial → `arruda-sales-boost`, Trade Marketing →
`degusta-go-app`, RH → `arruda-peoplecare-hub`, Finanças → `arruda-flow-buddy`. Sessão única
cross-app nunca foi necessária.

Do ponto de vista de segurança, SSO adiciona superfície sem reduzir risco neste desenho: cria um
token que atravessa 16 apps, e portanto um ponto único cujo comprometimento vale por todos. Sem
ele, a instância compartilhada já é o elo comum — e o controle está no RLS de cada tabela, que é
onde deve estar.

**Quando reativar:** só se um usuário passar a precisar de acesso a mais de uma plataforma. Até
lá, não investir.

---

## 3. Se algum dia for reativado

O `LESSONS.md` deste repo abre com *"Mudanças no Token JWT Quebram TODO o Ecossistema"*. Vale como
aviso de segurança, não só de compatibilidade: um claim a mais no JWT muda o que **todas** as
policies dos 16 apps enxergam.

Antes de qualquer reativação:

1. Consultar o grafo (`graphify-out/`) para o blast radius — SSO toca contrato entre apps.
2. Reconciliar com o modelo canônico do `arruda-rbac-master`, que evoluiu desde o stand-by (a
   Onda 3 mudou `fn_user_module_tiers`). A documentação de SSO deste repo descreve um modelo
   **superado**.
3. Tratar o desenho preservado em `docs/sso/` como histórico, não como especificação vigente.

---

## 4. Superfície residual

- `supabase/config.toml` contém apenas `project_id = "kgzybpelluftexrewyke"` — o ponteiro para a
  instância compartilhada, sem nenhuma config de function. **Marcado** com o aviso de `db push` em
  2026-07-26, não removido, porque `supabase/functions/` existe e o deploy usa o arquivo.
- `supabase/.temp/` adicionado ao `.gitignore` na mesma data. É o cache de link da CLI: versioná-lo
  permite `supabase db push` contra a produção dos 16 apps direto de um clone.
- Sem prefixo de tabela próprio. O que este app tocaria são tabelas de outros donos — mais uma
  razão para não escrever daqui.

---

## 5. Antes de mexer

1. **Não usar este repo como referência de acesso.** A fonte canônica é o `arruda-rbac-master`.
2. Não criar policy nem RPC de autorização aqui.
3. Não recriar `supabase/config.toml` além do que existe, nem versionar `supabase/.temp/`.
4. Proposta de reativar SSO → grafo + reconciliação com o modelo canônico, antes de código.
5. Migration via MCP `apply_migration`. `supabase db push` **proibido**.

---

*Verificado em 2026-07-26 contra o `CLAUDE.md` da raiz e a instância `kgzybpelluftexrewyke`.*
