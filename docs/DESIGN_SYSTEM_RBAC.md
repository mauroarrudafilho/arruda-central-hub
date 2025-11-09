# Design System - Arruda Hub RBAC

## 📋 Visão Geral

Este documento descreve o **Design System** utilizado no projeto **Arruda Hub RBAC**, um sistema de design padronizado baseado em **shadcn/ui** e **Tailwind CSS**, criado para garantir consistência visual e de experiência em todos os projetos do ecossistema Arruda Hub.

### Versão
- **Versão Atual**: 1.0.0
- **Base**: shadcn/ui + Tailwind CSS
- **Framework**: React 18+ com TypeScript
- **Data de Criação**: 2025

---

## 🏗️ Arquitetura do Design System

### Estrutura de Diretórios

```
arruda-rbac-master/
├── design-system/              # Design System isolado
│   ├── src/
│   │   ├── components/         # Componentes customizados
│   │   ├── hooks/              # Hooks reutilizáveis
│   │   ├── types/              # TypeScript types
│   │   └── utils/              # Utilitários
│   ├── styles/
│   │   ├── globals.css         # Estilos globais
│   │   └── components.css      # Estilos dos componentes
│   ├── tokens.ts               # Design tokens (cores, tipografia, etc.)
│   ├── utils.ts                # Funções utilitárias
│   ├── components.tsx         # Componentes padronizados
│   ├── config.ts               # Configurações centralizadas
│   ├── index.ts                # Ponto de entrada único
│   └── docs/                   # Documentação
│
├── src/
│   ├── components/
│   │   └── ui/                 # Componentes shadcn/ui (54+ componentes)
│   ├── index.css               # CSS global com variáveis HSL
│   └── lib/
│       └── utils.ts            # Função cn() para merge de classes
│
├── components.json             # Configuração shadcn/ui
├── tailwind.config.ts          # Configuração Tailwind CSS
└── postcss.config.js           # Configuração PostCSS
```

---

## 🎨 Base Tecnológica

### 1. **shadcn/ui**
- **Versão**: Atual (via CLI)
- **Descrição**: Biblioteca de componentes React acessíveis e customizáveis
- **Características**:
  - Componentes baseados em **Radix UI**
  - Estilização via **Tailwind CSS**
  - Código copiado para o projeto (não é dependência npm)
  - Totalmente customizável

**Componentes Disponíveis** (54+ componentes):
- `accordion`, `alert`, `alert-dialog`, `avatar`, `badge`, `breadcrumb`
- `button`, `calendar`, `card`, `carousel`, `chart`, `checkbox`
- `collapsible`, `command`, `context-menu`, `dialog`, `drawer`
- `dropdown-menu`, `form`, `hover-card`, `input`, `input-otp`
- `label`, `menubar`, `navigation-menu`, `pagination`, `popover`
- `progress`, `radio-group`, `resizable`, `scroll-area`, `select`
- `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `sonner`
- `switch`, `table`, `tabs`, `textarea`, `toast`, `toggle`
- `toggle-group`, `tooltip`

### 2. **Tailwind CSS**
- **Versão**: 3.4.17
- **Configuração**: `tailwind.config.ts`
- **Características**:
  - Utility-first CSS framework
  - Dark mode via classe (`.dark`)
  - Variáveis CSS customizadas (HSL)
  - Sistema de design tokens integrado

### 3. **Radix UI**
- **Versão**: Várias (via shadcn/ui)
- **Descrição**: Primitivos UI acessíveis e não-estilizados
- **Uso**: Base para todos os componentes shadcn/ui

### 4. **Class Variance Authority (CVA)**
- **Versão**: 0.7.1
- **Descrição**: Gerenciamento de variantes de componentes
- **Uso**: Criação de variantes type-safe para componentes

### 5. **Lucide React**
- **Versão**: 0.462.0
- **Descrição**: Biblioteca de ícones moderna
- **Uso**: Ícones em todo o sistema

---

## 🎨 Design Tokens

### Cores

O sistema utiliza **variáveis CSS HSL** para facilitar temas e dark mode:

#### Paleta Principal (Light Mode)

```css
:root {
  --background: 0 0% 100%;              /* Branco */
  --foreground: 222.2 84% 4.9%;         /* Preto quase */
  
  --primary: 222.2 47.4% 11.2%;         /* Navy (#003366) */
  --primary-foreground: 210 40% 98%;    /* Branco */
  
  --secondary: 210 40% 96.1%;           /* Cinza claro */
  --secondary-foreground: 222.2 47.4% 11.2%;
  
  --muted: 210 40% 96.1%;              /* Cinza muito claro */
  --muted-foreground: 215.4 16.3% 46.9%; /* Cinza médio */
  
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  
  --destructive: 0 84.2% 60.2%;         /* Vermelho (#EF4444) */
  --destructive-foreground: 210 40% 98%;
  
  --border: 214.3 31.8% 91.4%;          /* Cinza borda */
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  
  --radius: 0.5rem;                     /* 8px */
}
```

#### Paleta Principal (Dark Mode)

```css
.dark {
  --background: 222.2 84% 4.9%;         /* Preto quase */
  --foreground: 210 40% 98%;            /* Branco */
  
  --primary: 210 40% 98%;               /* Branco */
  --primary-foreground: 222.2 47.4% 11.2%;
  
  --secondary: 217.2 32.6% 17.5%;       /* Cinza escuro */
  --secondary-foreground: 210 40% 98%;
  
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  
  --destructive: 0 62.8% 30.6%;         /* Vermelho escuro */
  --destructive-foreground: 210 40% 98%;
  
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 212.7 26.8% 83.9%;
}
```

#### Cores Customizadas (Design Tokens)

```typescript
// design-system/tokens.ts
colors: {
  primary: {
    DEFAULT: '#003366',  // Navy
    50: '#f0f4f8',
    100: '#d9e2ec',
    // ... até 900
  },
  secondary: {
    DEFAULT: '#008080', // Teal
    // ... tons completos
  },
  success: {
    DEFAULT: '#22C55E',  // Verde
    // ... tons completos
  },
  warning: {
    DEFAULT: '#FACC15',  // Amarelo
    // ... tons completos
  },
  destructive: {
    DEFAULT: '#EF4444',  // Vermelho
    // ... tons completos
  },
  neutral: {
    DEFAULT: '#6B7280',  // Cinza
    // ... tons completos
  }
}
```

### Tipografia

#### Fontes

```typescript
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
}
```

#### Tamanhos

```typescript
fontSize: {
  xs: ['12px', { lineHeight: '16px' }],
  sm: ['14px', { lineHeight: '20px' }],
  base: ['16px', { lineHeight: '24px' }],
  lg: ['18px', { lineHeight: '28px' }],
  xl: ['20px', { lineHeight: '28px' }],
  '2xl': ['24px', { lineHeight: '32px' }],
  '3xl': ['30px', { lineHeight: '36px' }],
  '4xl': ['36px', { lineHeight: '40px' }],
  '5xl': ['48px', { lineHeight: '1' }],
  '6xl': ['60px', { lineHeight: '1' }],
}
```

#### Pesos

```typescript
fontWeight: {
  thin: '100',
  extralight: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
}
```

### Espaçamento

Baseado em **grid de 8px**:

```typescript
spacing: {
  0: '0px',
  1: '4px',    // 0.25rem
  2: '8px',    // 0.5rem
  3: '12px',   // 0.75rem
  4: '16px',   // 1rem
  5: '20px',   // 1.25rem
  6: '24px',   // 1.5rem
  8: '32px',   // 2rem
  10: '40px',  // 2.5rem
  12: '48px',  // 3rem
  // ... até 96: '384px'
}
```

### Border Radius

```typescript
borderRadius: {
  none: '0px',
  sm: '2px',
  DEFAULT: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  '3xl': '24px',
  full: '9999px',
}
```

### Shadows

```typescript
boxShadow: {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
}
```

### Breakpoints

```typescript
breakpoints: {
  xs: '375px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1400px',
}
```

### Z-Index

```typescript
zIndex: {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
}
```

---

## 🧩 Componentes Customizados

### 1. **ArrudaCard**

Card baseado no Card do shadcn/ui com padrões Arruda Hub.

```tsx
import { ArrudaCard } from '@/design-system';

<ArrudaCard 
  variant="default"        // 'default' | 'elevated' | 'outlined'
  padding="md"            // 'none' | 'sm' | 'md' | 'lg' | 'xl'
  title="Título"
  description="Descrição opcional"
>
  Conteúdo do card
</ArrudaCard>
```

**Props:**
- `variant`: `'default' | 'elevated' | 'outlined'`
- `padding`: `'none' | 'sm' | 'md' | 'lg' | 'xl'`
- `title?`: string
- `description?`: string

### 2. **ArrudaButton**

Botão com variantes e estados customizados.

```tsx
import { ArrudaButton } from '@/design-system';

<ArrudaButton 
  variant="primary"       // 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size="md"              // 'sm' | 'md' | 'lg'
  icon={Icon}            // LucideIcon opcional
  loading={false}        // Estado de loading
>
  Texto do botão
</ArrudaButton>
```

**Props:**
- `variant`: `'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'`
- `size`: `'sm' | 'md' | 'lg'`
- `icon?`: LucideIcon
- `loading?`: boolean

### 3. **ArrudaInput**

Input com label e validação integradas.

```tsx
import { ArrudaInput } from '@/design-system';

<ArrudaInput 
  label="Nome completo"
  placeholder="Digite seu nome"
  error={errors.name}
  helperText="Este campo é obrigatório"
  icon={User}
/>
```

**Props:**
- `label?`: string
- `error?`: string
- `helperText?`: string
- `icon?`: LucideIcon

### 4. **StatusBadge**

Badge para status do RBAC.

```tsx
import { StatusBadge } from '@/design-system';

<StatusBadge 
  status="active"        // 'active' | 'inactive' | 'pending' | 'suspended'
  showIcon={true}
>
  Ativo
</StatusBadge>
```

**Cores por Status:**
- `active`: Verde (#22C55E)
- `inactive`: Cinza (#6B7280)
- `pending`: Amarelo (#FACC15)
- `suspended`: Vermelho (#EF4444)

### 5. **RoleBadge**

Badge para roles do RBAC.

```tsx
import { RoleBadge } from '@/design-system';

<RoleBadge 
  role="admin"           // 'admin' | 'manager' | 'user' | 'guest'
  showIcon={true}
>
  Administrador
</RoleBadge>
```

**Cores por Role:**
- `admin`: Navy (#003366)
- `manager`: Teal (#008080)
- `user`: Cinza (#6B7280)
- `guest`: Cinza claro (#9CA3AF)

### 6. **KPICard**

Card para indicadores de performance (KPIs).

```tsx
import { KPICard } from '@/design-system';

<KPICard 
  title="Usuários Ativos"
  value="17"
  subtitle="5 ativos nas últimas 24h"
  trend={{
    value: 5.1,
    label: "vs mês anterior",
    isPositive: true
  }}
  icon={Users}
  color="primary"        // 'primary' | 'secondary' | 'success' | 'warning' | 'destructive'
/>
```

**Props:**
- `title`: string
- `value`: string | number
- `subtitle?`: string
- `trend?`: `{ value: number; label: string; isPositive?: boolean }`
- `icon?`: LucideIcon
- `color?`: `'primary' | 'secondary' | 'success' | 'warning' | 'destructive'`

### 7. **PageHeader**

Cabeçalho de página com ações.

```tsx
import { PageHeader } from '@/design-system';

<PageHeader 
  title="Dashboard"
  description="Visão geral do sistema"
  actions={
    <Button>Nova ação</Button>
  }
/>
```

---

## 🛠️ Utilitários e Funções Helper

### Função `cn()` - Merge de Classes

Função principal para combinar classes Tailwind:

```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  'base-class',
  condition && 'conditional-class',
  className
)} />
```

### Funções de Tipografia

```tsx
import { getTypographyClasses } from '@/design-system';

<h1 className={getTypographyClasses('lg', 'semibold', 'primary')}>
  Título
</h1>
```

**Parâmetros:**
- `size`: `'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'`
- `weight`: `'thin' | 'extralight' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black'`
- `color`: `'primary' | 'secondary' | 'neutral' | 'success' | 'warning' | 'destructive'`

### Funções de Espaçamento

```tsx
import { getSpacingClasses } from '@/design-system';

<div className={getSpacingClasses('md', 'lg')}>
  {/* padding: md, margin: lg */}
</div>
```

### Funções de Cor

```tsx
import { getColorClasses } from '@/design-system';

<div className={getColorClasses('primary', 'bg')}>
  {/* bg-blue-600 */}
</div>
```

**Parâmetros:**
- `variant`: `'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'neutral'`
- `type`: `'bg' | 'text' | 'border'`

### Funções de Layout

```tsx
import { getContainerClasses, getGridClasses } from '@/design-system';

<div className={getContainerClasses('lg', true)}>
  {/* max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 */}
</div>

<div className={getGridClasses(3, 'md')}>
  {/* grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 */}
</div>
```

### Funções de Formatação

```tsx
import { formatValue, formatDate } from '@/design-system';

formatValue(1234.56, 'currency');  // "R$ 1.234,56"
formatValue(85.5, 'percentage');   // "85.5%"
formatValue(1234, 'number');       // "1.234"

formatDate(new Date(), 'short');   // "30/01/2025"
formatDate(new Date(), 'long');    // "30 de janeiro de 2025"
formatDate(new Date(), 'time');    // "30/01/2025 19:05:00"
```

### Funções Específicas do RBAC

```tsx
import { getStatusClasses, getRoleClasses } from '@/design-system';

<div className={getStatusClasses('active', 'bg')}>
  {/* bg-green-100 */}
</div>

<div className={getRoleClasses('admin', 'text')}>
  {/* text-blue-800 */}
</div>
```

---

## ⚙️ Configurações

### components.json (shadcn/ui)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### tailwind.config.ts

```typescript
export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... outras cores
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

---

## 📦 Dependências Principais

### Core
- `react`: ^18.3.1
- `react-dom`: ^18.3.1
- `typescript`: ^5.8.3

### UI Framework
- `tailwindcss`: ^3.4.17
- `tailwindcss-animate`: ^1.0.7
- `class-variance-authority`: ^0.7.1
- `clsx`: ^2.1.1
- `tailwind-merge`: ^2.6.0

### Radix UI (via shadcn/ui)
- `@radix-ui/react-*`: Várias versões (accordion, alert-dialog, avatar, etc.)

### Ícones
- `lucide-react`: ^0.462.0

### Formulários
- `react-hook-form`: ^7.61.1
- `@hookform/resolvers`: ^3.10.0
- `zod`: ^3.25.76

### Gráficos
- `recharts`: ^2.15.4
- `@tremor/react`: ^3.18.7

### Build
- `vite`: ^5.4.19
- `@vitejs/plugin-react-swc`: ^3.11.0
- `postcss`: ^8.5.6
- `autoprefixer`: ^10.4.21

---

## 🚀 Como Usar

### 1. Importação de Componentes

```tsx
// Componentes shadcn/ui
import { Button, Card, Input } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Componentes customizados do Design System
import { 
  ArrudaCard, 
  ArrudaButton, 
  ArrudaInput,
  StatusBadge,
  RoleBadge,
  KPICard,
  PageHeader
} from '@/design-system';

// Utilitários
import { 
  cn,
  getTypographyClasses,
  getColorClasses,
  formatValue,
  formatDate
} from '@/design-system';
```

### 2. Exemplo Completo

```tsx
import { PageHeader } from '@/design-system';
import { ArrudaCard } from '@/design-system';
import { KPICard } from '@/design-system';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp } from 'lucide-react';

export function DashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <PageHeader
        title="Dashboard"
        description="Visão geral do sistema"
        actions={
          <Button>
            <TrendingUp className="mr-2" />
            Exportar
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <KPICard
          title="Usuários Ativos"
          value="17"
          subtitle="5 ativos nas últimas 24h"
          trend={{ value: 5.1, label: "vs mês anterior", isPositive: true }}
          icon={Users}
          color="primary"
        />
      </div>

      <ArrudaCard variant="elevated" padding="lg" className="mt-6">
        <h2 className="text-2xl font-bold mb-4">Conteúdo</h2>
        <p>Conteúdo do card...</p>
      </ArrudaCard>
    </div>
  );
}
```

### 3. Dark Mode

O sistema suporta dark mode via classe `.dark`:

```tsx
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Adicionar classe 'dark' ao <html> para ativar dark mode
    document.documentElement.classList.add('dark');
  }, []);

  return <div>...</div>;
}
```

Ou usar `next-themes` (se disponível):

```tsx
import { ThemeProvider } from 'next-themes';

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system">
      {/* ... */}
    </ThemeProvider>
  );
}
```

---

## 🎯 Boas Práticas

### 1. **Sempre use a função `cn()`**

```tsx
// ✅ Correto
<div className={cn('base-class', condition && 'conditional-class')} />

// ❌ Evitar
<div className={`base-class ${condition ? 'conditional-class' : ''}`} />
```

### 2. **Use componentes do Design System quando possível**

```tsx
// ✅ Usar ArrudaCard
<ArrudaCard variant="elevated" padding="lg">...</ArrudaCard>

// ❌ Evitar criar cards customizados do zero
<div className="rounded-lg border p-6">...</div>
```

### 3. **Use funções utilitárias para tipografia e cores**

```tsx
// ✅ Usar getTypographyClasses
<h1 className={getTypographyClasses('2xl', 'bold', 'primary')}>...</h1>

// ❌ Evitar classes hardcoded
<h1 className="text-2xl font-bold text-blue-900">...</h1>
```

### 4. **Mantenha consistência com tokens de design**

```tsx
// ✅ Usar tokens
<div className="bg-primary text-primary-foreground">...</div>

// ❌ Evitar cores hardcoded
<div className="bg-[#003366] text-white">...</div>
```

### 5. **Use variantes de componentes ao invés de classes customizadas**

```tsx
// ✅ Usar variantes
<Button variant="destructive" size="lg">...</Button>

// ❌ Evitar classes inline
<Button className="bg-red-600 hover:bg-red-700 text-white px-8 py-3">...</Button>
```

### 6. **Respeite o grid de espaçamento (8px)**

```tsx
// ✅ Usar espaçamentos do grid
<div className="p-4">...</div>  // 16px (2 * 8px)
<div className="p-6">...</div>  // 24px (3 * 8px)

// ❌ Evitar valores arbitrários
<div className="p-[13px]">...</div>
```

---

## 🔧 Configuração e Instalação

### Adicionar Novo Componente shadcn/ui

```bash
npx shadcn@latest add [component-name]
```

Exemplo:
```bash
npx shadcn@latest add button
npx shadcn@latest add card
```

### Personalizar Tema

1. Edite `src/index.css` para alterar variáveis CSS HSL
2. Edite `tailwind.config.ts` para adicionar cores customizadas
3. Edite `design-system/tokens.ts` para atualizar tokens

### Adicionar Novo Componente Customizado

1. Crie o componente em `design-system/src/components/`
2. Exporte em `design-system/src/components/index.ts`
3. Re-exporte em `design-system/index.ts`
4. Documente em `design-system/docs/components.md`

---

## 📚 Recursos e Referências

### Documentação Oficial
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/)
- [Lucide Icons](https://lucide.dev/)

### Design Tokens
- Arquivo: `design-system/tokens.ts`
- Contém: cores, tipografia, espaçamento, breakpoints, shadows, etc.

### Configurações
- shadcn/ui: `components.json`
- Tailwind: `tailwind.config.ts`
- PostCSS: `postcss.config.js`
- Design System: `design-system/config.ts`

---

## 🎨 Status Específicos do RBAC

### Status de Usuário

```typescript
rbacStatus: {
  user: {
    active: { color: '#22C55E', label: 'Ativo' },
    inactive: { color: '#6B7280', label: 'Inativo' },
    pending: { color: '#FACC15', label: 'Pendente' },
    suspended: { color: '#EF4444', label: 'Suspenso' },
  }
}
```

### Roles

```typescript
rbacStatus: {
  role: {
    admin: { color: '#003366', label: 'Administrador' },
    manager: { color: '#008080', label: 'Gerente' },
    user: { color: '#6B7280', label: 'Usuário' },
    guest: { color: '#9CA3AF', label: 'Convidado' },
  }
}
```

---

## 📝 Checklist para Novos Projetos

Ao criar um novo projeto que usa este design system:

- [ ] Copiar `components.json`
- [ ] Copiar `tailwind.config.ts`
- [ ] Copiar `postcss.config.js`
- [ ] Copiar `src/index.css` (variáveis CSS)
- [ ] Copiar `src/lib/utils.ts` (função `cn()`)
- [ ] Copiar diretório `design-system/`
- [ ] Instalar dependências principais
- [ ] Configurar aliases do TypeScript (`@/components`, `@/lib`, etc.)
- [ ] Testar importação de componentes
- [ ] Verificar dark mode funcionando

---

## 🔄 Versionamento

O design system segue **Semantic Versioning**:
- **MAJOR**: Mudanças incompatíveis na API
- **MINOR**: Novas funcionalidades mantendo compatibilidade
- **PATCH**: Correções de bugs

**Versão Atual**: `1.0.0`

---

## 📞 Suporte e Contribuições

Para dúvidas, sugestões ou contribuições ao design system:
1. Consulte a documentação em `design-system/docs/`
2. Verifique exemplos em `design-system/examples.tsx`
3. Consulte a documentação do shadcn/ui para componentes base

---

**Última Atualização**: Janeiro 2025
**Mantido por**: Equipe Arruda Hub

