# Arruda Hub Design System

Design System padrão para todos os projetos do Arruda Hub, baseado no padrão do Acordo Flow.

## 📁 Estrutura

```
design-system/
├── README.md                 # Documentação completa
├── package.json              # Configuração do package
├── tsconfig.json             # Configuração TypeScript
├── tokens.ts                 # Design tokens (cores, tipografia, espaçamento)
├── utils.ts                  # Utilitários e funções auxiliares
├── components.tsx            # Componentes padronizados
├── config.ts                 # Configurações centralizadas
├── index.ts                  # Ponto de entrada único
├── styles/
│   ├── globals.css           # Estilos globais
│   └── components.css        # Estilos dos componentes
└── docs/
    ├── components.md         # Documentação dos componentes
    └── usage.md              # Guia de uso
```

## 🎨 Componentes Principais

### 1. **ArrudaCard**
- Variações: `default`, `elevated`, `outlined`
- Padding configurável: `none`, `sm`, `md`, `lg`
- Baseado no Card do shadcn/ui com padrões Arruda Hub

### 2. **ArrudaButton**
- Variações: `primary`, `secondary`, `outline`, `ghost`, `destructive`
- Tamanhos: `sm`, `md`, `lg`
- Estados: normal, loading, disabled
- Suporte a ícones

### 3. **ArrudaInput**
- Labels e validação integradas
- Estados de erro e helper text
- Suporte a ícones
- Acessibilidade completa

### 4. **StatusBadge**
- Status do RBAC: ativo, inativo, pendente, suspenso
- Cores e variantes automáticas
- Baseado nos tokens de design

### 5. **RoleBadge**
- Roles: admin, manager, user, guest
- Cores específicas por role
- Consistente com sistema de permissões

### 6. **KPICard**
- Indicadores de performance
- Suporte a tendências (positivas/negativas)
- Layout responsivo
- Cores automáticas baseadas em valores

## 🚀 Como usar

### 1. Importação Simples
```tsx
import { 
  ArrudaCard, 
  ArrudaButton, 
  KPICard,
  getTypographyClasses 
} from '@/design-system';
```

### 2. Uso Básico
```tsx
<ArrudaCard variant="default" padding="md">
  <h3 className={getTypographyClasses('lg', 'semibold')}>
    Título
  </h3>
  <ArrudaButton variant="primary">
    Ação
  </ArrudaButton>
</ArrudaCard>
```

### 3. Componentes Específicos do RBAC
```tsx
<StatusBadge status="active" />
<RoleBadge role="admin" />
<KPICard title="Usuários Ativos" value="17" trend={{value: 5.1, label: "vs mês anterior"}} />
```

## 🎨 Padrões de Design

- **Cores**: Paleta consistente do shadcn-ui
- **Tipografia**: Hierarquia visual clara
- **Espaçamento**: Grid system responsivo
- **Interações**: Hover effects e transições suaves
- **Acessibilidade**: Componentes acessíveis por padrão

## 📋 Checklist

- [ ] Copiar componentes do projeto principal
- [ ] Organizar por categoria
- [ ] Criar arquivos de exportação
- [ ] Testar importação no RBAC
- [ ] Documentar componentes
- [ ] Configurar build (opcional)

