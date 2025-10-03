import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MockDataIconProps {
  className?: string;
  size?: 'sm' | 'md';
}

export const MockDataIcon: React.FC<MockDataIconProps> = ({ 
  className = "", 
  size = 'sm' 
}) => {
  // Só mostra em desenvolvimento
  const isDevelopment = import.meta.env.MODE === 'development' || 
                       import.meta.env.DEV || 
                       process.env.NODE_ENV === 'development';
  
  if (!isDevelopment) {
    return null;
  }

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertTriangle 
            className={`${iconSize} text-amber-500 ${className}`}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            Dados simulados - será removido em produção
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default MockDataIcon;
