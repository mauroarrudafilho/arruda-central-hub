# Guia de Uso do Design System

## 🚀 Como começar

### 1. Instalação
```bash
# No projeto que vai usar o design system
npm install @arruda/design-system
```

### 2. Importação
```typescript
// Importar componentes específicos
import { DashboardCard, AnalyticsChart, DataTable } from '@arruda/design-system';

// Ou importar tudo
import * as DS from '@arruda/design-system';
```

### 3. Configuração do Tailwind
Adicione os estilos do design system no seu `tailwind.config.js`:

```javascript
module.exports = {
  content: [
    // ... seus arquivos
    './node_modules/@arruda/design-system/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // ... outras cores
      },
    },
  },
  plugins: [],
}
```

## 📝 Exemplos de Uso

### Dashboard
```tsx
import { DashboardCard, PageHeader, AnalyticsChart } from '@arruda/design-system';
import { Users, Activity, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const chartData = [
    { name: 'Jan', users: 12 },
    { name: 'Fev', users: 15 },
    { name: 'Mar', users: 17 },
  ];

  const chartConfig = {
    users: {
      label: "Usuários",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visão geral do sistema"
        actions={[
          { label: 'Atualizar', icon: RefreshCw, onClick: () => {} }
        ]}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total de Usuários"
          icon={Users}
          value="17"
          subtitle="5 ativos nas últimas 24h"
          trend={{ value: 12, isPositive: true }}
        />
        
        <DashboardCard
          title="Sessões Ativas"
          icon={Activity}
          value="3"
          subtitle="Usuários conectados"
        />
      </div>

      <AnalyticsChart
        title="Crescimento de Usuários"
        data={chartData}
        type="area"
        dataKey="users"
        config={chartConfig}
      />
    </div>
  );
};
```

### Tabela de Dados
```tsx
import { DataTable, StatusBadge } from '@arruda/design-system';
import { Edit, Trash2, Eye } from 'lucide-react';

const UsersTable = () => {
  const columns = [
    {
      key: 'name',
      label: 'Nome',
      render: (value: string, row: any) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground">{row.email}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <StatusBadge 
          status={value === 'active' ? 'success' : 'error'} 
          text={value === 'active' ? 'Ativo' : 'Inativo'} 
        />
      )
    },
  ];

  const actions = [
    { label: 'Ver', icon: Eye, onClick: (user: any) => console.log('Ver', user) },
    { label: 'Editar', icon: Edit, onClick: (user: any) => console.log('Editar', user) },
    { label: 'Excluir', icon: Trash2, onClick: (user: any) => console.log('Excluir', user), variant: 'destructive' as const },
  ];

  return (
    <DataTable
      data={users}
      columns={columns}
      loading={isLoading}
      onRowClick={(user) => navigate(`/users/${user.id}`)}
      actions={actions}
    />
  );
};
```

## 🎨 Customização

### Temas
O design system suporta temas claro e escuro através das variáveis CSS:

```css
/* Tema claro (padrão) */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  /* ... outras variáveis */
}

/* Tema escuro */
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... outras variáveis */
}
```

### Cores Customizadas
Você pode sobrescrever as cores padrão:

```css
:root {
  --primary: 220 70% 50%; /* Azul customizado */
  --chart-1: 120 60% 50%; /* Verde customizado */
}
```

## 🔧 Desenvolvimento

### Adicionando Novos Componentes
1. Crie o componente na pasta apropriada (`ui/`, `charts/`, `forms/`, `layout/`)
2. Exporte no arquivo `index.ts` da pasta
3. Adicione na documentação
4. Teste em diferentes projetos

### Estrutura de Arquivo
```
src/components/ui/MeuComponente.tsx
├── Interface/Props
├── Componente principal
├── Estilos (se necessário)
└── Export default
```

## 📚 Recursos Adicionais

- [Documentação dos Componentes](./components.md)
- [Exemplos no Storybook](link-para-storybook)
- [Figma Design Kit](link-para-figma)
- [Changelog](./CHANGELOG.md)

