// Componentes do Design System - Arruda Hub
// Baseado no padrão do Acordo Flow

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn, getTypographyClasses, getColorClasses, getStatusClasses, getRoleClasses } from './utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LucideIcon } from 'lucide-react';

// ArrudaCard - Baseado no Card do shadcn/ui
const arrudaCardVariants = cva(
  'rounded-lg border bg-card text-card-foreground shadow-sm',
  {
    variants: {
      variant: {
        default: 'border-border',
        elevated: 'border-border shadow-md',
        outlined: 'border-2 border-border',
      },
      padding: {
        none: 'p-0',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
        xl: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
  }
);

export interface ArrudaCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof arrudaCardVariants> {
  title?: string;
  description?: string;
}

export const ArrudaCard = React.forwardRef<HTMLDivElement, ArrudaCardProps>(
  ({ className, variant, padding, title, description, children, ...props }, ref) => (
    <Card ref={ref} className={cn(arrudaCardVariants({ variant, padding }), className)} {...props}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle className={getTypographyClasses('lg', 'semibold')}>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  )
);
ArrudaCard.displayName = 'ArrudaCard';

// ArrudaButton - Baseado no Button do shadcn/ui
const arrudaButtonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-teal-600 text-white hover:bg-teal-700',
        outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
        ghost: 'text-gray-700 hover:bg-gray-100',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 py-2',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ArrudaButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof arrudaButtonVariants> {
  icon?: LucideIcon;
  loading?: boolean;
}

export const ArrudaButton = React.forwardRef<HTMLButtonElement, ArrudaButtonProps>(
  ({ className, variant, size, icon: Icon, loading, children, ...props }, ref) => (
    <Button
      ref={ref}
      className={cn(arrudaButtonVariants({ variant, size }), className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
      )}
      {!loading && Icon && (
        <Icon className="w-4 h-4 mr-2" />
      )}
      {children}
    </Button>
  )
);
ArrudaButton.displayName = 'ArrudaButton';

// ArrudaInput - Input com label e validação integradas
export interface ArrudaInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
}

export const ArrudaInput = React.forwardRef<HTMLInputElement, ArrudaInputProps>(
  ({ className, label, error, helperText, icon: Icon, ...props }, ref) => (
    <div className="space-y-2">
      {label && (
        <Label className={getTypographyClasses('sm', 'medium')}>
          {label}
        </Label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        )}
        <Input
          ref={ref}
          className={cn(
            Icon ? 'pl-10' : '',
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className={cn(getTypographyClasses('xs', 'normal', 'destructive'))}>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className={cn(getTypographyClasses('xs', 'normal', 'neutral'))}>
          {helperText}
        </p>
      )}
    </div>
  )
);
ArrudaInput.displayName = 'ArrudaInput';

// StatusBadge - Badge para status do RBAC
const statusBadgeVariants = cva(
  'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
  {
    variants: {
      status: {
        active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        suspended: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      },
    },
    defaultVariants: {
      status: 'active',
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  showIcon?: boolean;
}

export const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, status, showIcon = false, children, ...props }, ref) => (
    <Badge
      ref={ref}
      className={cn(statusBadgeVariants({ status }), className)}
      {...props}
    >
      {showIcon && (
        <div className={cn('w-2 h-2 rounded-full', getStatusClasses(status, 'bg'))} />
      )}
      {children}
    </Badge>
  )
);
StatusBadge.displayName = 'StatusBadge';

// RoleBadge - Badge para roles do RBAC
const roleBadgeVariants = cva(
  'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
  {
    variants: {
      role: {
        admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        manager: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
        user: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        guest: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
      },
    },
    defaultVariants: {
      role: 'user',
    },
  }
);

export interface RoleBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof roleBadgeVariants> {
  showIcon?: boolean;
}

export const RoleBadge = React.forwardRef<HTMLSpanElement, RoleBadgeProps>(
  ({ className, role, showIcon = false, children, ...props }, ref) => (
    <Badge
      ref={ref}
      className={cn(roleBadgeVariants({ role }), className)}
      {...props}
    >
      {showIcon && (
        <div className={cn('w-2 h-2 rounded-full', getRoleClasses(role, 'bg'))} />
      )}
      {children}
    </Badge>
  )
);
RoleBadge.displayName = 'RoleBadge';

// KPICard - Card para indicadores de performance
export interface KPICardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  icon?: LucideIcon;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive';
}

export const KPICard = React.forwardRef<HTMLDivElement, KPICardProps>(
  ({ className, title, value, subtitle, trend, icon: Icon, color = 'primary', ...props }, ref) => (
    <ArrudaCard ref={ref} className={cn('transition-all duration-200 hover:shadow-md', className)} {...props}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className={cn(getTypographyClasses('sm', 'medium', 'neutral'))}>
            {title}
          </p>
          <p className={cn(getTypographyClasses('2xl', 'bold', color))}>
            {value}
          </p>
          {subtitle && (
            <p className={cn(getTypographyClasses('xs', 'normal', 'neutral'))}>
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn('p-2 rounded-lg', getColorClasses(color, 'bg'), 'bg-opacity-10')}>
            <Icon className={cn('w-5 h-5', getColorClasses(color, 'text'))} />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-4 flex items-center">
          <span className={cn(
            'text-xs font-medium',
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          )}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
          <span className="ml-2 text-xs text-gray-500">
            {trend.label}
          </span>
        </div>
      )}
    </ArrudaCard>
  )
);
KPICard.displayName = 'KPICard';

// PageHeader - Cabeçalho de página com ações
export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, title, description, actions, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center justify-between mb-6', className)}
      {...props}
    >
      <div>
        <h1 className={getTypographyClasses('3xl', 'bold')}>
          {title}
        </h1>
        {description && (
          <p className={cn(getTypographyClasses('base', 'normal', 'neutral'), 'mt-1')}>
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center space-x-2">
          {actions}
        </div>
      )}
    </div>
  )
);
PageHeader.displayName = 'PageHeader';
