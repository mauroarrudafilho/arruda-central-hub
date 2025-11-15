import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { cn } from '@/lib/utils';
import { ArrowRight, ExternalLink, Star } from 'lucide-react';

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
  status?: string;
  disabled?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  // Estatísticas detalhadas
  userAccessCount?: number;
  totalAccessCount?: number;
  uniqueUsers?: number;
  successRate?: number;
  lastAccess?: string;
  lastUserAccess?: string;
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
  status,
  disabled = false,
  isFavorite = false,
  onToggleFavorite,
  userAccessCount,
  totalAccessCount,
  uniqueUsers,
  successRate,
  lastAccess,
  lastUserAccess,
}) => {
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Nunca acessado';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  const navigate = useNavigate();
  const designTokens = useDesignTokens();

  const handleClick = () => {
    if (disabled) return;

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
        disabled && "pointer-events-none opacity-50 cursor-not-allowed",
        className
      )}
      style={{ 
        borderColor: designTokens.colors.neutral[200],
        fontFamily: designTokens.typography.fontFamily.sans.join(', ')
      }}
      onClick={handleClick}
      aria-disabled={disabled}
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
                {onToggleFavorite && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (!disabled) {
                        onToggleFavorite();
                      }
                    }}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                    aria-pressed={isFavorite}
                    aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  >
                    <Star
                      className={cn(
                        "h-4 w-4",
                        isFavorite ? "fill-yellow-400 text-yellow-500" : "text-gray-400 group-hover:text-yellow-400"
                      )}
                    />
                  </button>
                )}
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
            {status && (
              <p
                className={cn(
                  "mt-3 text-xs font-medium",
                  status === 'Disponível' ? 'text-green-600' : 'text-yellow-600'
                )}
              >
                {status}
              </p>
            )}
            
            {/* Estatísticas detalhadas */}
            {(userAccessCount !== undefined || totalAccessCount !== undefined) && (
              <div className="mt-4 space-y-1 text-xs text-gray-600">
                {userAccessCount !== undefined && (
                  <p>
                    {userAccessCount > 0 
                      ? `${userAccessCount} acessos seus`
                      : 'Nenhum acesso seu ainda'}
                  </p>
                )}
                {lastUserAccess && (
                  <p className="text-gray-500">
                    {formatDate(lastUserAccess)}
                  </p>
                )}
                {totalAccessCount !== undefined && (
                  <p className="text-gray-500">
                    {totalAccessCount} acessos totais
                    {uniqueUsers !== undefined && ` - ${uniqueUsers} usuários`}
                    {successRate !== undefined && ` - ${Math.round(successRate)}% sucesso`}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};



