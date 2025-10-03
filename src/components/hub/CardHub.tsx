import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { cn } from '@/lib/utils';

interface CardHubProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<any>;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
  children: React.ReactNode;
}

export const CardHub: React.FC<CardHubProps> = ({
  title,
  description,
  icon: Icon,
  badge,
  badgeVariant = 'secondary',
  className,
  children,
}) => {
  const designTokens = useDesignTokens();

  return (
    <Card 
      className={cn(
        "hover:shadow-md transition-shadow duration-200",
        className
      )}
      style={{ 
        borderColor: designTokens.colors.neutral[200],
        fontFamily: designTokens.typography.fontFamily.sans.join(', ')
      }}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {Icon && (
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: designTokens.colors.primary[50] }}
              >
                <Icon 
                  className="h-5 w-5" 
                  style={{ color: designTokens.colors.primary.DEFAULT }} 
                />
              </div>
            )}
            <div>
              <CardTitle 
                className="text-xl font-semibold text-gray-900"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                {title}
              </CardTitle>
              {description && (
                <p 
                  className="text-sm text-gray-600 mt-1"
                  style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
                >
                  {description}
                </p>
              )}
            </div>
          </div>
          {badge && (
            <Badge variant={badgeVariant} className="ml-auto">
              {badge}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};



