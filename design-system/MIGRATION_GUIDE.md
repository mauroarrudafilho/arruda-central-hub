# Guia de Migração - Arruda Hub Design System

## 🎯 Objetivo

Este guia ajuda a migrar componentes existentes para o novo Design System padronizado do Arruda Hub.

## 📋 Checklist de Migração

### Fase 1: Preparação
- [ ] Instalar dependências necessárias
- [ ] Configurar imports do design system
- [ ] Identificar componentes a serem migrados
- [ ] Mapear estilos atuais

### Fase 2: Migração de Componentes
- [ ] Migrar Cards → ArrudaCard
- [ ] Migrar Buttons → ArrudaButton
- [ ] Migrar Inputs → ArrudaInput
- [ ] Migrar Badges → StatusBadge/RoleBadge
- [ ] Migrar Headers → PageHeader

### Fase 3: Validação
- [ ] Testar funcionalidade
- [ ] Validar design
- [ ] Verificar responsividade
- [ ] Testar acessibilidade

## 🔄 Migrações Específicas

### 1. Cards

**Antes:**
```tsx
<div className="bg-white rounded-lg border p-4 shadow-sm">
  <h3 className="text-lg font-semibold">Título</h3>
  <p className="text-gray-600">Conteúdo</p>
</div>
```

**Depois:**
```tsx
import { ArrudaCard } from '@/design-system';

<ArrudaCard variant="default" padding="md">
  <h3 className={getTypographyClasses('lg', 'semibold')}>Título</h3>
  <p className={getTypographyClasses('base', 'normal', 'neutral')}>Conteúdo</p>
</ArrudaCard>
```

### 2. Buttons

**Antes:**
```tsx
<button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
  Clique aqui
</button>
```

**Depois:**
```tsx
import { ArrudaButton } from '@/design-system';

<ArrudaButton variant="primary" size="md">
  Clique aqui
</ArrudaButton>
```

### 3. Inputs

**Antes:**
```tsx
<div className="space-y-2">
  <label className="text-sm font-medium">Email</label>
  <input 
    type="email" 
    className="w-full px-3 py-2 border border-gray-300 rounded-md"
    placeholder="seu@email.com"
  />
</div>
```

**Depois:**
```tsx
import { ArrudaInput } from '@/design-system';

<ArrudaInput
  label="Email"
  type="email"
  placeholder="seu@email.com"
  icon={Mail}
/>
```

### 4. Badges de Status

**Antes:**
```tsx
<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
  Ativo
</span>
```

**Depois:**
```tsx
import { StatusBadge } from '@/design-system';

<StatusBadge status="active" showIcon>
  Ativo
</StatusBadge>
```

### 5. Headers de Página

**Antes:**
```tsx
<div className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-3xl font-bold">Título</h1>
    <p className="text-gray-600">Descrição</p>
  </div>
  <button className="bg-blue-600 text-white px-4 py-2 rounded-md">
    Ação
  </button>
</div>
```

**Depois:**
```tsx
import { PageHeader, ArrudaButton } from '@/design-system';

<PageHeader
  title="Título"
  description="Descrição"
  actions={
    <ArrudaButton variant="primary">
      Ação
    </ArrudaButton>
  }
/>
```

## 🎨 Migração de Estilos

### Tipografia

**Antes:**
```tsx
<h1 className="text-3xl font-bold text-gray-900">Título</h1>
<p className="text-base text-gray-600">Texto</p>
```

**Depois:**
```tsx
import { getTypographyClasses } from '@/design-system';

<h1 className={getTypographyClasses('3xl', 'bold')}>Título</h1>
<p className={getTypographyClasses('base', 'normal', 'neutral')}>Texto</p>
```

### Layout

**Antes:**
```tsx
<div className="max-w-6xl mx-auto px-4">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {/* Conteúdo */}
  </div>
</div>
```

**Depois:**
```tsx
import { getContainerClasses, getGridClasses } from '@/design-system';

<div className={getContainerClasses('lg')}>
  <div className={getGridClasses(3, 'md')}>
    {/* Conteúdo */}
  </div>
</div>
```

## 🔧 Scripts de Migração

### Buscar e Substituir

```bash
# Buscar cards antigos
grep -r "bg-white rounded-lg border" src/

# Buscar buttons antigos
grep -r "bg-blue-600 text-white" src/

# Buscar inputs antigos
grep -r "border border-gray-300 rounded-md" src/
```

### Substituições Automáticas

```bash
# Substituir classes de tipografia
sed -i 's/text-3xl font-bold text-gray-900/getTypographyClasses("3xl", "bold")/g' src/**/*.tsx

# Substituir classes de container
sed -i 's/max-w-6xl mx-auto px-4/getContainerClasses("lg")/g' src/**/*.tsx
```

## 📊 Benefícios da Migração

### Antes da Migração
- ❌ Estilos inconsistentes
- ❌ Código duplicado
- ❌ Manutenção difícil
- ❌ Design não padronizado

### Depois da Migração
- ✅ Design consistente
- ✅ Código reutilizável
- ✅ Manutenção simplificada
- ✅ Padrões visuais unificados

## 🚨 Problemas Comuns

### 1. Conflitos de CSS
**Problema:** Estilos antigos conflitando com novos
**Solução:** Remover classes antigas e usar apenas o design system

### 2. Imports Incorretos
**Problema:** Importar componentes do lugar errado
**Solução:** Sempre importar de `@/design-system`

### 3. Props Incompatíveis
**Problema:** Props antigas não funcionando
**Solução:** Verificar documentação e usar props corretas

### 4. Responsividade Quebrada
**Problema:** Layout quebrado em diferentes telas
**Solução:** Usar funções de layout do design system

## 📚 Recursos Adicionais

- [Documentação dos Componentes](./docs/components.md)
- [Exemplos de Uso](./examples.tsx)
- [Design Tokens](./tokens.ts)
- [Utilitários](./utils.ts)

## 🎯 Próximos Passos

1. **Identificar** componentes prioritários
2. **Migrar** um componente por vez
3. **Testar** cada migração
4. **Documentar** mudanças
5. **Validar** com equipe

---

**Versão**: 1.0.0  
**Data**: Dezembro 2024  
**Status**: ✅ Pronto para Uso
