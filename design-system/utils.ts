// Utilitários do Design System - Arruda Hub
// Baseado no padrão do Acordo Flow

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { tokens } from './tokens';

// Função principal para combinar classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Funções de Tipografia
export function getTypographyClasses(
  size: keyof typeof tokens.typography.fontSize = 'base',
  weight: keyof typeof tokens.typography.fontWeight = 'normal',
  color: 'primary' | 'secondary' | 'neutral' | 'success' | 'warning' | 'destructive' = 'neutral'
) {
  const sizeClasses = tokens.typography.fontSize[size];
  const weightClass = `font-${weight}`;
  const colorClass = `text-${color === 'neutral' ? 'gray-700' : color === 'primary' ? 'blue-900' : color === 'secondary' ? 'teal-700' : color === 'success' ? 'green-700' : color === 'warning' ? 'yellow-700' : 'red-700'}`;
  
  return cn(
    sizeClasses[0],
    weightClass,
    colorClass
  );
}

// Funções de Espaçamento
export function getSpacingClasses(
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl',
  margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
) {
  const paddingMap = {
    none: 'p-0',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };

  const marginMap = {
    none: 'm-0',
    sm: 'm-2',
    md: 'm-4',
    lg: 'm-6',
    xl: 'm-8',
  };

  return cn(
    padding ? paddingMap[padding] : '',
    margin ? marginMap[margin] : ''
  );
}

// Funções de Cor
export function getColorClasses(
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'neutral' = 'neutral',
  type: 'bg' | 'text' | 'border' = 'bg'
) {
  const colorMap = {
    primary: {
      bg: 'bg-blue-600',
      text: 'text-blue-600',
      border: 'border-blue-600',
    },
    secondary: {
      bg: 'bg-teal-600',
      text: 'text-teal-600',
      border: 'border-teal-600',
    },
    success: {
      bg: 'bg-green-600',
      text: 'text-green-600',
      border: 'border-green-600',
    },
    warning: {
      bg: 'bg-yellow-600',
      text: 'text-yellow-600',
      border: 'border-yellow-600',
    },
    destructive: {
      bg: 'bg-red-600',
      text: 'text-red-600',
      border: 'border-red-600',
    },
    neutral: {
      bg: 'bg-gray-600',
      text: 'text-gray-600',
      border: 'border-gray-600',
    },
  };

  return colorMap[variant][type];
}

// Funções de Gradiente
export function getGradientClasses(
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' = 'primary'
) {
  const gradientMap = {
    primary: 'bg-gradient-to-r from-blue-600 to-blue-700',
    secondary: 'bg-gradient-to-r from-teal-600 to-teal-700',
    success: 'bg-gradient-to-r from-green-600 to-green-700',
    warning: 'bg-gradient-to-r from-yellow-600 to-yellow-700',
    destructive: 'bg-gradient-to-r from-red-600 to-red-700',
  };

  return gradientMap[variant];
}

// Funções de Animação
export function getAnimationClasses(
  type: 'fade' | 'slide' | 'scale' | 'bounce' = 'fade',
  duration: 'fast' | 'normal' | 'slow' = 'normal'
) {
  const durationMap = {
    fast: 'duration-150',
    normal: 'duration-200',
    slow: 'duration-300',
  };

  const animationMap = {
    fade: 'transition-opacity',
    slide: 'transition-transform',
    scale: 'transition-transform',
    bounce: 'transition-transform',
  };

  return cn(animationMap[type], durationMap[duration]);
}

// Funções de Layout
export function getContainerClasses(
  size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'lg',
  padding: boolean = true
) {
  const sizeMap = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  };

  return cn(
    'mx-auto',
    sizeMap[size],
    padding ? 'px-4 sm:px-6 lg:px-8' : ''
  );
}

export function getGridClasses(
  cols: 1 | 2 | 3 | 4 | 5 | 6 = 3,
  gap: 'sm' | 'md' | 'lg' = 'md'
) {
  const colsMap = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
  };

  const gapMap = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  };

  return cn('grid', colsMap[cols], gapMap[gap]);
}

export function getResponsiveClasses(
  mobile: string,
  tablet?: string,
  desktop?: string
) {
  return cn(
    mobile,
    tablet && `md:${tablet}`,
    desktop && `lg:${desktop}`
  );
}

// Funções de Acessibilidade
export function getFocusClasses(
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' = 'primary'
) {
  const focusMap = {
    primary: 'focus:ring-blue-500 focus:border-blue-500',
    secondary: 'focus:ring-teal-500 focus:border-teal-500',
    success: 'focus:ring-green-500 focus:border-green-500',
    warning: 'focus:ring-yellow-500 focus:border-yellow-500',
    destructive: 'focus:ring-red-500 focus:border-red-500',
  };

  return cn(
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    focusMap[variant]
  );
}

export function getHoverClasses(
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'neutral' = 'neutral'
) {
  const hoverMap = {
    primary: 'hover:bg-blue-50 hover:text-blue-700',
    secondary: 'hover:bg-teal-50 hover:text-teal-700',
    success: 'hover:bg-green-50 hover:text-green-700',
    warning: 'hover:bg-yellow-50 hover:text-yellow-700',
    destructive: 'hover:bg-red-50 hover:text-red-700',
    neutral: 'hover:bg-gray-50 hover:text-gray-700',
  };

  return hoverMap[variant];
}

// Funções específicas do RBAC
export function getStatusClasses(
  status: 'active' | 'inactive' | 'pending' | 'suspended',
  type: 'bg' | 'text' | 'border' = 'bg'
) {
  const statusMap = {
    active: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-200',
    },
    inactive: {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      border: 'border-gray-200',
    },
    pending: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-200',
    },
    suspended: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-200',
    },
  };

  return statusMap[status][type];
}

export function getRoleClasses(
  role: 'admin' | 'manager' | 'user' | 'guest',
  type: 'bg' | 'text' | 'border' = 'bg'
) {
  const roleMap = {
    admin: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-200',
    },
    manager: {
      bg: 'bg-teal-100',
      text: 'text-teal-800',
      border: 'border-teal-200',
    },
    user: {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      border: 'border-gray-200',
    },
    guest: {
      bg: 'bg-gray-50',
      text: 'text-gray-600',
      border: 'border-gray-100',
    },
  };

  return roleMap[role][type];
}

// Função para formatar valores
export function formatValue(
  value: number | string,
  type: 'currency' | 'percentage' | 'number' | 'text' = 'text'
) {
  if (type === 'currency') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(value));
  }

  if (type === 'percentage') {
    return `${Number(value).toFixed(1)}%`;
  }

  if (type === 'number') {
    return new Intl.NumberFormat('pt-BR').format(Number(value));
  }

  return String(value);
}

// Função para formatar datas
export function formatDate(
  date: string | Date,
  format: 'short' | 'long' | 'time' = 'short'
) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (format === 'short') {
    return dateObj.toLocaleDateString('pt-BR');
  }

  if (format === 'long') {
    return dateObj.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  if (format === 'time') {
    return dateObj.toLocaleString('pt-BR');
  }

  return dateObj.toLocaleDateString('pt-BR');
}
