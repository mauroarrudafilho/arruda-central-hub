# Componentes do Design System

## 📋 Lista de Componentes

### UI Components

#### DashboardCard
Card para exibir estatísticas no dashboard.

**Props:**
- `title: string` - Título do card
- `value: string | number` - Valor principal
- `icon: LucideIcon` - Ícone do card
- `subtitle?: string` - Subtítulo opcional
- `trend?: { value: number, isPositive: boolean }` - Tendência opcional

**Exemplo:**
```tsx
<DashboardCard
  title="Total de Usuários"
  icon={Users}
  value="17"
  subtitle="5 ativos nas últimas 24h"
  trend={{ value: 12, isPositive: true }}
/>
```

#### DataTable
Tabela moderna com ações e estados.

**Props:**
- `data: any[]` - Dados da tabela
- `columns: Column[]` - Definição das colunas
- `loading?: boolean` - Estado de carregamento
- `onRowClick?: (row: any) => void` - Callback para clique na linha
- `actions?: Action[]` - Ações disponíveis

**Exemplo:**
```tsx
<DataTable
  data={users}
  columns={columns}
  loading={isLoading}
  onRowClick={(user) => navigate(`/users/${user.id}`)}
  actions={[
    { label: 'Editar', icon: Edit, onClick: handleEdit },
    { label: 'Excluir', icon: Trash2, onClick: handleDelete }
  ]}
/>
```

#### StatusBadge
Badge para indicar status com ícones.

**Props:**
- `status: 'success' | 'warning' | 'error' | 'pending'` - Status
- `text?: string` - Texto customizado
- `showIcon?: boolean` - Mostrar ícone

**Exemplo:**
```tsx
<StatusBadge status="success" text="Ativo" />
<StatusBadge status="warning" text="Pendente" />
<StatusBadge status="error" text="Erro" />
```

### Chart Components

#### AnalyticsChart
Gráfico interativo com múltiplos tipos.

**Props:**
- `title: string` - Título do gráfico
- `data: any[]` - Dados do gráfico
- `type: 'area' | 'bar' | 'line' | 'pie'` - Tipo do gráfico
- `dataKey: string` - Chave dos dados
- `config: ChartConfig` - Configuração das cores

**Exemplo:**
```tsx
<AnalyticsChart
  title="Crescimento de Usuários"
  data={chartData}
  type="area"
  dataKey="users"
  config={chartConfig}
/>
```

### Layout Components

#### PageHeader
Cabeçalho de página com ações.

**Props:**
- `title: string` - Título da página
- `description?: string` - Descrição opcional
- `actions?: Action[]` - Ações disponíveis

**Exemplo:**
```tsx
<PageHeader
  title="Dashboard"
  description="Visão geral do sistema"
  actions={[
    { label: 'Atualizar', icon: RefreshCw, onClick: handleRefresh },
    { label: 'Exportar', icon: Download, onClick: handleExport }
  ]}
/>
```

## 🎨 Padrões de Design

### Cores
- **Primary**: `hsl(var(--primary))`
- **Secondary**: `hsl(var(--secondary))`
- **Success**: `hsl(var(--chart-1))`
- **Warning**: `hsl(var(--chart-4))`
- **Error**: `hsl(var(--destructive))`

### Espaçamento
- **xs**: `0.25rem` (4px)
- **sm**: `0.5rem` (8px)
- **md**: `1rem` (16px)
- **lg**: `1.5rem` (24px)
- **xl**: `2rem` (32px)

### Tipografia
- **Heading 1**: `text-3xl font-bold`
- **Heading 2**: `text-2xl font-semibold`
- **Heading 3**: `text-xl font-medium`
- **Body**: `text-base`
- **Caption**: `text-sm text-muted-foreground`

