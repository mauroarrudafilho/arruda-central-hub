import { useState, useEffect } from 'react';

export const useMockData = () => {
  const [showMockIndicators, setShowMockIndicators] = useState(true);

  // Carregar configuração do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('showMockIndicators');
    if (saved !== null) {
      setShowMockIndicators(JSON.parse(saved));
    }
  }, []);

  // Salvar configuração no localStorage
  const toggleMockIndicators = () => {
    const newValue = !showMockIndicators;
    setShowMockIndicators(newValue);
    localStorage.setItem('showMockIndicators', JSON.stringify(newValue));
  };

  // Só mostra indicadores em desenvolvimento
  const shouldShowMockIndicator = (isMock: boolean) => {
    // Verifica se está em desenvolvimento (Vite usa import.meta.env.MODE)
    const isDevelopment = import.meta.env.MODE === 'development' || 
                         import.meta.env.DEV || 
                         process.env.NODE_ENV === 'development';
    
    return isMock && showMockIndicators && isDevelopment;
  };

  return {
    showMockIndicators,
    toggleMockIndicators,
    shouldShowMockIndicator
  };
};

export default useMockData;


