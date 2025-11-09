# Perfis de Usuários Simplificados - RBAC Arruda Hub

## 📋 Visão Geral

Sistema de perfis de usuários simplificado e padronizado para o RBAC do Arruda Hub, com controle granular de acesso por tenant e permissões por tela.

## 🎯 Estrutura de Perfis

### **Perfis para Grupo Arruda**

#### 1. **Admin**
- **Descrição**: Acesso total ao sistema
- **Características**:
  - Acesso a todos os tenants
  - Todas as permissões em todas as telas
  - Pode criar, editar, deletar e aprovar
  - Gerenciamento completo de usuários e roles

#### 2. **Gestor**
- **Descrição**: Gestão com restrições organizacionais
- **Características**:
  - Pode visualizar todos os tenants (configurável)
  - Pode criar, aprovar e soft delete
  - Gerenciamento de equipe
  - Não pode deletar permanentemente
- **Estrutura de Equipe**: Vinculação de usuários à equipe do gestor

#### 3. **Usuário**
- **Descrição**: Operacional, foco em execução
- **Características**:
  - Acesso exclusivamente aos próprios dados
  - Pode criar e submeter à aprovação
  - Não possui alçada de aprovação definitiva
  - Acesso configurável a tenants

#### 4. **Visualizador**
- **Descrição**: Acesso somente leitura
- **Características**:
  - Apenas visualizar todo o fluxo do sistema
  - Não pode criar, editar ou deletar
  - Acesso configurável a tenants

#### 5. **Teste**
- **Descrição**: Mesmo acesso do admin, exceto exclusão
- **Características**:
  - Todas as permissões do admin
  - Não pode deletar permanentemente
  - Ideal para testes e homologação

### **Perfis para Fornecedores**

#### 1. **Gestor Fornecedor**
- **Descrição**: Mesmas permissões do gestor, mas apenas do seu tenant
- **Características**:
  - Acesso restrito ao seu próprio tenant
  - Pode criar, aprovar e soft delete
  - Gerenciamento de equipe do fornecedor

#### 2. **Usuário Fornecedor**
- **Descrição**: Mesma lógica do usuário, mas apenas do seu tenant
- **Características**:
  - Acesso exclusivamente aos próprios dados
  - Restrito ao seu tenant
  - Pode criar e submeter à aprovação

#### 3. **Visualizador Fornecedor**
- **Descrição**: Visualizar todo o fluxo, mas apenas do seu tenant
- **Características**:
  - Apenas visualização
  - Restrito ao seu tenant
  - Não pode modificar dados

#### 4. **Teste Fornecedor**
- **Descrição**: Mesmo acesso do gestor, mas apenas do seu tenant, sem exclusão
- **Características**:
  - Todas as permissões do gestor fornecedor
  - Restrito ao seu tenant
  - Não pode deletar permanentemente

## 🏢 Controle de Acesso por Tenant

### **Para Usuários do Grupo Arruda**
- **Acesso Configurável**: Podem ter acesso a todos os tenants ou apenas alguns específicos
- **Configuração**: Através da tabela `rbac_user_tenant_access`
- **Níveis de Acesso**: `read`, `write`, `admin`

### **Para Fornecedores**
- **Acesso Exclusivo**: Apenas ao seu próprio tenant
- **Isolamento**: Dados completamente isolados por organização
- **Segurança**: Impossível acessar dados de outros fornecedores

## 📊 Matriz de Permissões por Tela

| Tela/Módulo | Admin | Gestor | Usuário | Visualizador | Teste | Gestor Forn. | Usuário Forn. | Visualizador Forn. | Teste Forn. |
|-------------|-------|--------|---------|--------------|-------|--------------|---------------|-------------------|-------------|
| **Gestão** | | | | | | | | | |
| users | ✅ Total | ✅ Equipe | ❌ | ✅ | ✅ Total | ✅ Equipe | ❌ | ✅ | ✅ Equipe |
| roles | ✅ Total | ❌ | ❌ | ✅ | ✅ Total | ❌ | ❌ | ✅ | ❌ |
| audit | ✅ Total | ✅ | ❌ | ✅ | ✅ Total | ✅ | ❌ | ✅ | ✅ |
| profile | ✅ Total | ✅ | ✅ Próprio | ✅ | ✅ Total | ✅ | ✅ Próprio | ✅ | ✅ |
| **Acordos** | | | | | | | | | |
| acordos | ✅ Total | ✅ Aprovar | ✅ Próprios | ✅ | ✅ Total | ✅ Aprovar | ✅ Próprios | ✅ | ✅ Aprovar |
| fornecedores | ✅ Total | ✅ | ✅ | ✅ | ✅ Total | ✅ | ✅ | ✅ | ✅ |
| **Degustação** | | | | | | | | | |
| degustacao | ✅ Total | ✅ Aprovar | ✅ Próprios | ✅ | ✅ Total | ✅ Aprovar | ✅ Próprios | ✅ | ✅ Aprovar |
| campanhas | ✅ Total | ✅ Aprovar | ✅ Próprios | ✅ | ✅ Total | ✅ Aprovar | ✅ Próprios | ✅ | ✅ Aprovar |
| **Analytics** | | | | | | | | | |
| analytics | ✅ Total | ✅ | ✅ | ✅ | ✅ Total | ✅ | ✅ | ✅ | ✅ |
| relatorios | ✅ Total | ✅ | ✅ | ✅ | ✅ Total | ✅ | ✅ | ✅ | ✅ |

**Legenda:**
- ✅ Total: Acesso completo (criar, editar, deletar, aprovar)
- ✅ Aprovar: Pode aprovar registros
- ✅ Equipe: Acesso aos dados da equipe
- ✅ Próprios: Acesso apenas aos próprios dados
- ✅: Apenas visualização
- ❌: Sem acesso

## 🔧 Estrutura Técnica

### **Tabelas Principais**

#### 1. **rbac_auth_role**
- Armazena os perfis de usuário
- Vinculado à organização
- Roles do sistema não podem ser deletados

#### 2. **rbac_team_management**
- Vinculação de gestores às suas equipes
- Controle de hierarquia organizacional
- Isolamento por organização

#### 3. **rbac_user_tenant_access**
- Controle de acesso a tenants específicos
- Configurável para usuários do Grupo Arruda
- Níveis de acesso granular

#### 4. **rbac_screen_permissions**
- Permissões específicas por tela/módulo
- Controle granular de funcionalidades
- Baseado no role do usuário

### **Funções de Verificação**

#### **Verificação de Roles**
```sql
-- Verificar papel do usuário
SELECT public.get_user_role();

-- Verificar tipos específicos
SELECT public.is_admin();
SELECT public.is_gestor();
SELECT public.is_usuario();
SELECT public.is_visualizador();
SELECT public.is_teste();
SELECT public.is_fornecedor();
```

#### **Verificação de Permissões**
```sql
-- Verificar permissão em tela específica
SELECT public.user_has_screen_permission(auth.uid(), 'users', 'gestao', 'create');

-- Obter todas as permissões do usuário
SELECT * FROM public.get_user_screen_permissions();
```

#### **Verificação de Acesso a Tenants**
```sql
-- Verificar acesso a tenant específico
SELECT public.user_has_tenant_access(auth.uid(), 'tenant-uuid');

-- Obter tenants acessíveis
SELECT * FROM public.get_user_accessible_tenants();
```

#### **Verificação de Equipe**
```sql
-- Verificar se é gestor de usuário
SELECT public.is_user_manager(auth.uid(), 'user-uuid');

-- Obter usuários gerenciados
SELECT * FROM public.get_managed_users(auth.uid());
```

## 🚀 Implementação

### **1. Migração dos Dados**
- Executar migrações para criar nova estrutura
- Migrar usuários existentes para novos roles
- Configurar acesso a tenants

### **2. Configuração de Equipes**
- Vincular gestores às suas equipes
- Configurar hierarquia organizacional
- Definir responsabilidades

### **3. Configuração de Acesso**
- Definir quais tenants cada usuário pode acessar
- Configurar níveis de acesso
- Testar isolamento de dados

### **4. Configuração de Permissões**
- Definir permissões por tela/módulo
- Configurar funcionalidades específicas
- Testar controle de acesso

## 📈 Benefícios

### **1. Simplicidade**
- Estrutura de perfis mais enxuta
- Fácil compreensão e manutenção
- Redução de complexidade

### **2. Flexibilidade**
- Acesso configurável a tenants
- Permissões granulares por tela
- Adaptável a diferentes necessidades

### **3. Segurança**
- Isolamento de dados por tenant
- Controle granular de acesso
- Auditoria completa

### **4. Escalabilidade**
- Fácil adição de novos perfis
- Suporte a múltiplas organizações
- Crescimento do negócio

## 🔍 Monitoramento

### **Logs de Auditoria**
- Todas as operações são logadas
- Rastreamento de mudanças de permissões
- Monitoramento de acesso a dados

### **Métricas de Uso**
- Uso de funcionalidades por perfil
- Acesso a tenants
- Performance do sistema

### **Alertas de Segurança**
- Tentativas de acesso não autorizado
- Mudanças em permissões críticas
- Comportamentos suspeitos

## ✅ Status

**🎉 ESTRUTURA SIMPLIFICADA IMPLEMENTADA!**

- ✅ **Perfis simplificados**: 9 perfis principais
- ✅ **Controle de tenant**: Configurável para Grupo Arruda, exclusivo para fornecedores
- ✅ **Permissões por tela**: Controle granular de funcionalidades
- ✅ **Estrutura de equipe**: Vinculação de gestores às equipes
- ✅ **Políticas RLS**: Atualizadas para nova estrutura
- ✅ **Funções de verificação**: Completas e otimizadas

O sistema está pronto para uso com a nova estrutura simplificada! 🚀
