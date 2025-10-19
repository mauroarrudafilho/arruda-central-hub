# Sistema de Organizações - Arruda Hub

## 📋 Visão Geral

O sistema de organizações permite isolamento de dados e controle de acesso baseado na estrutura organizacional real do negócio.

## 🏢 Organizações Atuais

### **1. Grupo Arruda**
- **Slug**: `grupo-arruda`
- **Descrição**: Organização principal do Grupo Arruda
- **Usuários**: Todos os usuários padrão do sistema

### **2. Vinícola Campestre**
- **Slug**: `vinicola-campestre`
- **Descrição**: Vinícola Campestre - Unidade de negócio
- **Usuários**: Usuários específicos da Vinícola Campestre

## 🔐 Controle de Acesso

### **Isolamento por Organização**
- Usuários só veem dados da sua organização
- Admins têm acesso total a todas as organizações
- Roles podem ser específicos de uma organização

### **Políticas RLS**
```sql
-- Usuário só vê dados da sua organização
SELECT * FROM acordos 
WHERE organizacao_slug = (
  SELECT o.slug FROM organizations o
  JOIN auth_profile ap ON ap.organizacao_id = o.id
  WHERE ap.user_id = auth.uid()
);
```

## 📊 Estrutura de Dados

### **Tabela Organizations**
```sql
CREATE TABLE public.rbac_organizations (
  id UUID PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### **Relacionamentos**
- `auth_profile.organizacao_id` → `organizations.id`
- `auth_role.organizacao_id` → `organizations.id` (null = global)

## 🎯 Casos de Uso

### **1. Usuário do Grupo Arruda**
```sql
-- Usuário vê apenas dados do Grupo Arruda
SELECT * FROM acordos 
WHERE organizacao_slug = 'grupo-arruda';
```

### **2. Usuário da Vinícola Campestre**
```sql
-- Usuário vê apenas dados da Vinícola Campestre
SELECT * FROM acordos 
WHERE organizacao_slug = 'vinicola-campestre';
```

### **3. Admin Global**
```sql
-- Admin vê dados de todas as organizações
SELECT * FROM acordos; -- Sem filtro
```

## 🔧 Funções Auxiliares

### **Obter Organização do Usuário**
```sql
SELECT * FROM public.get_user_organization(auth.uid());
```

### **Verificar Pertencimento à Organização**
```sql
SELECT public.user_belongs_to_organization(auth.uid(), 'grupo-arruda');
```

## 📈 Benefícios

- ✅ **Isolamento de dados** por organização
- ✅ **Controle de acesso granular** baseado na estrutura real
- ✅ **Flexibilidade** para adicionar novas organizações
- ✅ **Segurança** com políticas RLS automáticas
- ✅ **Escalabilidade** para crescimento do negócio

## 🚀 Próximos Passos

1. **Migração de dados** existentes
2. **Atualização de interfaces** para mostrar organização
3. **Testes de isolamento** entre organizações
4. **Documentação** para desenvolvedores
5. **Treinamento** para usuários finais
