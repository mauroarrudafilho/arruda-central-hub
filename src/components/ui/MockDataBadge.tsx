import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MockDataBadgeProps {
  className?: string;
}

export const MockDataBadge: React.FC<MockDataBadgeProps> = ({ className = "" }) => {
  // Só mostra em desenvolvimento
  const isDevelopment = import.meta.env.MODE === 'development' || 
                       import.meta.env.DEV || 
                       process.env.NODE_ENV === 'development';
  
  if (!isDevelopment) {
    return null;
  }

  return (
    <Badge 
      variant="outline" 
      className={`text-amber-600 border-amber-300 bg-amber-50 text-xs ${className}`}
    >
      <AlertTriangle className="h-3 w-3 mr-1" />
      Dados Mock
    </Badge>
  );
};

export default MockDataBadge;


