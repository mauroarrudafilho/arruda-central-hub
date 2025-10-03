// Configurações do Design System - Arruda Hub
// Baseado no padrão do Acordo Flow

export const designSystemConfig = {
  // Configurações gerais
  name: 'Arruda Hub Design System',
  version: '1.0.0',
  description: 'Sistema de design padronizado para o Arruda Hub',

  // Configurações de tema
  theme: {
    default: 'light',
    supported: ['light', 'dark'],
    storageKey: 'arruda-hub-theme',
  },

  // Configurações de breakpoints
  breakpoints: {
    xs: '375px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1400px',
  },

  // Configurações de cores
  colors: {
    primary: '#003366', // Navy
    secondary: '#008080', // Teal
    success: '#22C55E',
    warning: '#FACC15',
    destructive: '#EF4444',
    neutral: '#6B7280',
  },

  // Configurações de tipografia
  typography: {
    fontFamily: {
      primary: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    baseSize: '16px',
    scale: 1.125, // Major third
  },

  // Configurações de espaçamento
  spacing: {
    base: 8, // 8px
    scale: 'linear',
  },

  // Configurações de animação
  animation: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // Configurações de acessibilidade
  accessibility: {
    focusRing: {
      width: '2px',
      color: '#3B82F6',
      offset: '2px',
    },
    minTouchTarget: '44px',
    contrastRatio: 4.5,
  },

  // Configurações específicas do RBAC
  rbac: {
    status: {
      active: { color: '#22C55E', label: 'Ativo' },
      inactive: { color: '#6B7280', label: 'Inativo' },
      pending: { color: '#FACC15', label: 'Pendente' },
      suspended: { color: '#EF4444', label: 'Suspenso' },
    },
    roles: {
      admin: { color: '#003366', label: 'Administrador' },
      manager: { color: '#008080', label: 'Gerente' },
      user: { color: '#6B7280', label: 'Usuário' },
      guest: { color: '#9CA3AF', label: 'Convidado' },
    },
    permissions: {
      read: { color: '#22C55E', label: 'Leitura' },
      write: { color: '#FACC15', label: 'Escrita' },
      delete: { color: '#EF4444', label: 'Exclusão' },
      admin: { color: '#003366', label: 'Administração' },
    },
  },

  // Configurações de componentes
  components: {
    button: {
      minHeight: '40px',
      borderRadius: '6px',
      fontWeight: '500',
    },
    input: {
      minHeight: '40px',
      borderRadius: '6px',
      borderWidth: '1px',
    },
    card: {
      borderRadius: '8px',
      shadow: 'sm',
      borderWidth: '1px',
    },
    badge: {
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: '500',
    },
  },

  // Configurações de layout
  layout: {
    container: {
      maxWidth: '1200px',
      padding: '0 16px',
    },
    grid: {
      columns: 12,
      gap: '24px',
    },
    sidebar: {
      width: '256px',
      collapsedWidth: '64px',
    },
  },

  // Configurações de performance
  performance: {
    lazyLoading: true,
    virtualScrolling: true,
    debounceDelay: 300,
  },

  // Configurações de desenvolvimento
  development: {
    debugMode: false,
    showGrid: false,
    showBreakpoints: false,
  },
} as const;

// Configurações específicas por ambiente
export const getConfig = (environment: 'development' | 'production' | 'test' = 'production') => {
  const baseConfig = { ...designSystemConfig };

  if (environment === 'development') {
    return {
      ...baseConfig,
      development: {
        ...baseConfig.development,
        debugMode: true,
        showGrid: true,
        showBreakpoints: true,
      },
    };
  }

  if (environment === 'test') {
    return {
      ...baseConfig,
      animation: {
        ...baseConfig.animation,
        duration: {
          fast: '0ms',
          normal: '0ms',
          slow: '0ms',
        },
      },
    };
  }

  return baseConfig;
};

// Configurações de validação
export const validateConfig = (config: any) => {
  const required = ['name', 'version', 'colors', 'typography', 'spacing'];
  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required config keys: ${missing.join(', ')}`);
  }
  
  return true;
};

// Configurações de migração
export const migrationConfig = {
  from: '0.0.0',
  to: '1.0.0',
  steps: [
    {
      version: '1.0.0',
      description: 'Initial release with core components',
      changes: [
        'Added ArrudaCard component',
        'Added ArrudaButton component',
        'Added ArrudaInput component',
        'Added StatusBadge component',
        'Added RoleBadge component',
        'Added KPICard component',
        'Added PageHeader component',
        'Added utility functions',
        'Added design tokens',
      ],
    },
  ],
};
