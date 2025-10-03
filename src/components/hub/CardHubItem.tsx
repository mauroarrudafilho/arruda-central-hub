import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { cn } from '@/lib/utils';
import { ArrowRight, ExternalLink } from 'lucide-react';

interface CardHubItemProps {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  external?: boolean;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
  onClick?: () => void;
}

export const CardHubItem: React.FC<CardHubItemProps> = ({
  title,
  description,
  icon: Icon,
  href,
  external = false,
  badge,
  badgeVariant = 'secondary',
  className,
  onClick,
}) => {
  const navigate = useNavigate();
  const designTokens = useDesignTokens();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (external) {
      window.open(href, '_blank');
    } else {
      navigate(href);
    }
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-md transition-all duration-200 hover:border-blue-300 group",
        className
      )}
      style={{ 
        borderColor: designTokens.colors.neutral[200],
        fontFamily: designTokens.typography.fontFamily.sans.join(', ')
      }}
      onClick={handleClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200"
              style={{ backgroundColor: designTokens.colors.primary[50] }}
            >
              <Icon 
                className="h-6 w-6" 
                style={{ color: designTokens.colors.primary.DEFAULT }} 
              />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 
                className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                {title}
              </h3>
              <div className="flex items-center space-x-2">
                {badge && (
                  <Badge variant={badgeVariant} className="text-xs">
                    {badge}
                  </Badge>
                )}
                {external ? (
                  <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                ) : (
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                )}
              </div>
            </div>
            <p 
              className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors"
              style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
            >
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};



