# Sistema Centralizado de Políticas RLS

## 📋 Visão Geral

O Sistema Centralizado de Políticas RLS unifica e padroniza todas as políticas de Row Level Security (RLS) dos módulos do Arruda Hub, mantendo a funcionalidade existente mas centralizando a manutenção no RBAC.

## 🎯 Objetivos

- ✅ **Manter funcionalidade atual**: Todas as políticas existentes são preservadas
- ✅ **Centralização**: Manutenção em um local único
- ✅ **Consistência**: Mesmo padrão para todos os módulos
- ✅ **Flexibilidade**: Fácil aplicação em novas tabelas
- ✅ **Auditoria**: Logs centralizados de todas as operações
- ✅ **Performance**: Funções otimizadas e reutilizáveis

## 🔧 Funções Principais

### Verificação de Papéis

```sql
-- Verificar papel do usuário
SELECT public.get_user_role();

-- Verificar se é admin
SELECT public.is_admin();

-- Verificar se é gestor
SELECT public.is_gestor();

-- Verificar se é líder
SELECT public.is_leader();

-- Verificar papel específico
SELECT public.has_role(auth.uid(), 'vendedor');

-- Obter nível de acesso
SELECT public.get_user_access_level();
```

### Verificação de Permissões

```sql
-- Verificar permissão específica de módulo
SELECT public.user_has_module_permission(auth.uid(), 'acordos', 'create');

-- Verificar acesso a dados específicos
SELECT public.user_can_access_data(
  auth.uid(), 
  'acordos', 
  'user_id', 
  'distribuidor', 
  'departamento', 
  'status'
);
```

### Aplicação de Políticas

```sql
-- Para tabelas de acordos
SELECT public.apply_acordos_rls_policies('acordos', 'criado_por', 'distribuidor', 'status');

-- Para tabelas de degustação
SELECT public.apply_degustacao_rls_policies('actions', 'criado_por', 'leader_id');

-- Para tabelas genéricas
SELECT public.apply_standard_module_rls_policies('tabela_generica', 'modulo', 'criado_por');
```

## 📊 Hierarquia de Papéis

### 1. **Admin**

- Acesso total a todos os recursos
- Pode gerenciar usuários, roles e permissões
- Bypass de todas as políticas RLS

### 2. **Gestor**

- Acesso gerencial com restrições regionais/hierárquicas
- Pode gerenciar usuários da sua regional
- Acesso a dados do seu distribuidor/departamento

### 3. **Gestor Fornecedor**

- Acesso total a acordos
- Pode aprovar acordos comerciais
- Acesso a dados de fornecedores

### 4. **Financeiro Fornecedor**

- Visualização limitada (status: validacao, assinado, conciliado)
- Pode conciliar acordos
- Acesso restrito a dados financeiros

### 5. **Vendedor**

- Apenas próprios acordos
- Acesso limitado a dados que criou
- Não pode aprovar acordos

### 6. **Líder**

- Gerenciamento de degustadoras/promotores atribuídos
- Acesso hierárquico baseado em atribuições
- Pode criar e gerenciar campanhas

### 7. **Visualizador**

- Apenas leitura
- Acesso limitado a dados públicos
- Não pode criar ou modificar dados

## 🏗️ Estrutura de Módulos

### Módulo de Acordos

**Tabelas principais:**

- `acordos` - Tabela principal de acordos
- `acordo_anexos` - Anexos dos acordos
- `acordo_aprovacoes` - Aprovações dos acordos
- `clientes_acordos` - Clientes dos acordos
- `compradores_acordos` - Compradores dos acordos
- `usuarios_acordos` - Usuários dos acordos

**Políticas aplicadas:**

- **SELECT**: Baseado no papel e distribuidor
- **INSERT**: Admin, gestor_fornecedor, vendedor
- **UPDATE**: Baseado no papel e status
- **DELETE**: Admin, gestor_fornecedor, vendedor (próprios)

### Módulo de Degustação

**Tabelas principais:**

- `actions` - Ações/campanhas de degustação
- `degustadoras` - Degustadoras
- `promoters` - Promotores
- `epis` - EPIs
- `stores` - Lojas
- `products` - Produtos
- `leaders` - Líderes

**Políticas aplicadas:**

- **SELECT**: Baseado no papel e atribuições hierárquicas
- **INSERT**: Admin, gestor, líder
- **UPDATE**: Baseado no papel e atribuições
- **DELETE**: Admin, gestor, líder (com restrições)

## 🔍 Verificação de Políticas

### Listar Todas as Políticas

```sql
SELECT * FROM public.list_all_rls_policies();
```

### Verificar Políticas de uma Tabela

```sql
SELECT * FROM public.check_table_rls_policies('acordos');
```

## 📝 Exemplos de Uso

### 1. Aplicar Políticas em Nova Tabela de Acordos

```sql
-- Criar tabela
CREATE TABLE public.nova_tabela_acordos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  criado_por uuid REFERENCES auth.users(id),
  distribuidor text,
  status text,
  dados jsonb
);

-- Aplicar políticas
SELECT public.apply_acordos_rls_policies('nova_tabela_acordos', 'criado_por', 'distribuidor', 'status');
```

### 2. Aplicar Políticas em Nova Tabela de Degustação

```sql
-- Criar tabela
CREATE TABLE public.nova_tabela_degustacao (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  criado_por uuid REFERENCES auth.users(id),
  leader_id uuid REFERENCES auth.users(id),
  dados jsonb
);

-- Aplicar políticas
SELECT public.apply_degustacao_rls_policies('nova_tabela_degustacao', 'criado_por', 'leader_id');
```

### 3. Verificar Acesso de Usuário

```sql
-- Verificar se usuário pode acessar dados específicos
SELECT 
  public.get_user_role() as papel,
  public.user_can_access_data(
    auth.uid(), 
    'acordos', 
    'user_id', 
    'distribuidor', 
    'departamento', 
    'status'
  ) as pode_acessar;
```

## 🚀 Migração de Políticas Existentes

### Passo 1: Backup das Políticas Atuais

```sql
-- Exportar políticas existentes
SELECT * FROM public.list_all_rls_policies();
```

### Passo 2: Aplicar Sistema Centralizado

```sql
-- Executar migração
\i supabase/migrations/20250127000000_centralized_rls_system.sql
```

### Passo 3: Verificar Aplicação

```sql
-- Verificar se políticas foram aplicadas
SELECT * FROM public.list_all_rls_policies();
```

## 🔒 Segurança

### Funções SECURITY DEFINER

Todas as funções de verificação usam `SECURITY DEFINER` para:

- Evitar recursão infinita nas políticas RLS
- Executar com privilégios elevados de forma segura
- Garantir que as verificações sejam consistentes

### Controle de Acesso

- **Admin**: Acesso total a tudo
- **Gestor**: Acesso regional + gestão de usuários
- **Gestor Fornecedor**: Acesso total a acordos + aprovação comercial
- **Financeiro Fornecedor**: Visualização limitada + conciliação
- **Vendedor**: Apenas próprios acordos
- **Líder**: Gerenciamento hierárquico de degustadoras/promotores
- **Visualizador**: Apenas leitura

## 📈 Benefícios

1. **Manutenção Centralizada**: Todas as políticas em um local
2. **Consistência**: Mesmo padrão para todos os módulos
3. **Flexibilidade**: Fácil aplicação em novas tabelas
4. **Auditoria**: Logs centralizados de todas as operações
5. **Performance**: Funções otimizadas e reutilizáveis
6. **Segurança**: Controle granular de acesso
7. **Escalabilidade**: Fácil adição de novos módulos

## 🛠️ Manutenção

### Adicionar Novo Módulo

1. Criar permissões específicas do módulo
2. Aplicar políticas usando as funções centralizadas
3. Testar acesso com diferentes papéis
4. Documentar políticas específicas

### Modificar Políticas

1. Atualizar funções centralizadas
2. Reaplicar políticas nas tabelas afetadas
3. Testar mudanças
4. Atualizar documentação

### Monitoramento

- Usar `list_all_rls_policies()` para auditoria
- Verificar logs de acesso
- Monitorar performance das funções
- Revisar permissões regularmente

## 📚 Referências

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Arruda Hub RBAC Documentation](./rbac-system.md)
