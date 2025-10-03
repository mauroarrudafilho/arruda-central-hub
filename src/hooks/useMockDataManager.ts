import { useState, useEffect } from 'react';

export interface MockDataConfig {
  [key: string]: {
    isMock: boolean;
    reason?: string;
    realDataAvailable: boolean;
    mockData?: any;
  };
}

export const useMockDataManager = (initialConfig: MockDataConfig = {}) => {
  const [config, setConfig] = useState<MockDataConfig>(initialConfig);
  const [showMockData, setShowMockData] = useState<{ [key: string]: boolean }>({});

  // Carregar configuração do localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('mockDataConfig');
    const savedShowMock = localStorage.getItem('showMockData');
    
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (error) {
        console.error('Error loading mock data config:', error);
      }
    }
    
    if (savedShowMock) {
      try {
        setShowMockData(JSON.parse(savedShowMock));
      } catch (error) {
        console.error('Error loading show mock data config:', error);
      }
    }
  }, []);

  // Salvar configuração no localStorage
  const updateConfig = (newConfig: MockDataConfig) => {
    setConfig(newConfig);
    localStorage.setItem('mockDataConfig', JSON.stringify(newConfig));
  };

  const toggleMockData = (dataType: string) => {
    const newShowMock = {
      ...showMockData,
      [dataType]: !showMockData[dataType]
    };
    setShowMockData(newShowMock);
    localStorage.setItem('showMockData', JSON.stringify(newShowMock));
  };

  const isDataMock = (dataType: string): boolean => {
    const dataConfig = config[dataType];
    if (!dataConfig) return false;
    
    // Se o usuário escolheu mostrar dados mock, retorna true
    if (showMockData[dataType]) return true;
    
    // Caso contrário, retorna a configuração padrão
    return dataConfig.isMock;
  };

  const getDataReason = (dataType: string): string | undefined => {
    return config[dataType]?.reason;
  };

  const isRealDataAvailable = (dataType: string): boolean => {
    return config[dataType]?.realDataAvailable || false;
  };

  const getMockData = (dataType: string): any => {
    return config[dataType]?.mockData;
  };

  // Configurações padrão para diferentes tipos de dados
  const defaultConfigs: MockDataConfig = {
    userBasicInfo: {
      isMock: false,
      realDataAvailable: true,
      reason: "Dados reais do Supabase"
    },
    userRoles: {
      isMock: false,
      realDataAvailable: true,
      reason: "Dados reais do Supabase"
    },
    userPermissions: {
      isMock: false,
      realDataAvailable: true,
      reason: "Dados reais do Supabase"
    },
    userProjects: {
      isMock: false,
      realDataAvailable: true,
      reason: "Dados reais do Supabase"
    },
    userActivities: {
      isMock: false,
      realDataAvailable: true,
      reason: "Dados reais do Supabase"
    },
    userSessions: {
      isMock: false,
      realDataAvailable: true,
      reason: "Dados reais do Supabase"
    },
    securityLogs: {
      isMock: false,
      realDataAvailable: true,
      reason: "Dados reais do Supabase"
    },
    usagePatterns: {
      isMock: false,
      realDataAvailable: true,
      reason: "Dados reais do Supabase"
    },
    activitySummary: {
      isMock: false,
      realDataAvailable: true,
      reason: "Dados reais do Supabase"
    },
    // Configurações de segurança (mock por enquanto)
    securitySettings: {
      isMock: true,
      realDataAvailable: false,
      reason: "Configurações de segurança não implementadas no banco",
      mockData: {
        twoFactorEnabled: false,
        loginNotifications: true,
        simultaneousSessions: false
      }
    },
    // Preferências do usuário (mock por enquanto)
    userPreferences: {
      isMock: true,
      realDataAvailable: false,
      reason: "Sistema de preferências não implementado no banco",
      mockData: {
        theme: 'system',
        language: 'pt-BR'
      }
    }
  };

  // Inicializar com configurações padrão se não houver configuração salva
  useEffect(() => {
    if (Object.keys(config).length === 0) {
      updateConfig(defaultConfigs);
    }
  }, []);

  return {
    config,
    showMockData,
    updateConfig,
    toggleMockData,
    isDataMock,
    getDataReason,
    isRealDataAvailable,
    getMockData,
    defaultConfigs
  };
};

export default useMockDataManager;


