import React from 'react';
import { AlertTriangle, Database, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MockDataIndicatorProps {
  isMock: boolean;
  dataType: string;
  reason?: string;
  onToggle?: () => void;
  showToggle?: boolean;
  className?: string;
}

export const MockDataIndicator: React.FC<MockDataIndicatorProps> = ({
  isMock,
  dataType,
  reason,
  onToggle,
  showToggle = false,
  className = ""
}) => {
  if (!isMock) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Database className="h-4 w-4 text-green-600" />
        <span className="text-sm text-green-700 font-medium">Dados Reais</span>
        {showToggle && onToggle && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onToggle}
                  className="p-1 hover:bg-gray-100 rounded"
                  aria-label="Mostrar dados mock"
                >
                  <Eye className="h-3 w-3 text-gray-500" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Mostrar dados mock para {dataType}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
        Dados Mock
      </Badge>
      {reason && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-amber-600 cursor-help">?</span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{reason}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {showToggle && onToggle && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggle}
                className="p-1 hover:bg-gray-100 rounded"
                aria-label="Ocultar dados mock"
              >
                <EyeOff className="h-3 w-3 text-gray-500" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ocultar dados mock para {dataType}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

export default MockDataIndicator;
