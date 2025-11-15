import React from 'react';
import { useDesignTokens } from '@/hooks/useDesignTokens';

interface HeaderProps {
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = () => {
  const designTokens = useDesignTokens();


  return (
    <header 
      className="w-full border-b border-gray-200 bg-white shadow-sm"
      style={{ 
        backgroundColor: designTokens.colors.primary.DEFAULT,
        borderColor: designTokens.colors.primary[200]
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo e Nome */}
          <div className="flex items-center space-x-4 flex-1">
            <img 
              src="/logoarrudahub_white.png" 
              alt="Arruda Hub" 
              className="h-8 w-auto" 
            />
            <div className="border-l border-white/20 pl-4">
              <h1 
                className="text-lg font-semibold text-white"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                Arruda Hub
              </h1>
              <p 
                className="text-xs text-white/80"
                style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}
              >
                Portal Central
              </p>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};

export default Header;
