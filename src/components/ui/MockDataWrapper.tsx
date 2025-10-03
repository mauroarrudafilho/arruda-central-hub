import React from 'react';
import { MockDataBadge } from './MockDataBadge';

interface MockDataWrapperProps {
  children: React.ReactNode;
  isMock?: boolean;
  className?: string;
}

export const MockDataWrapper: React.FC<MockDataWrapperProps> = ({ 
  children, 
  isMock = false, 
  className = "" 
}) => {
  if (!isMock) {
    return <>{children}</>;
  }

  return (
    <div className={`relative ${className}`}>
      {children}
      <div className="absolute top-2 right-2">
        <MockDataBadge />
      </div>
    </div>
  );
};

export default MockDataWrapper;


