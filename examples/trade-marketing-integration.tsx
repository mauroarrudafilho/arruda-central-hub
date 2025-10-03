// Exemplo de como integrar a biblioteca no frontend de TRADE MARKETING

import React from 'react';
import { ArrudaAuthProvider, ProtectedRoute, PermissionGate, useArrudaAuth } from '@arruda/rbac-client';

// Configuração do módulo de trade marketing
const authConfig = {
  supabaseUrl: 'https://kgzybpelluftexrewyke.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  projectId: 'uuid-do-projeto-gestao', // ID do projeto no banco
  moduleName: 'trade-marketing',
  frontendOrigin: 'https://trade.arrudahub.com',
  enableLogging: true,
};

// Componente principal do app
function TradeMarketingApp() {
  return (
    <ArrudaAuthProvider config={authConfig}>
      <div className="min-h-screen bg-background">
        <ProtectedRoute
          requiredPermission={{ module: 'trade-marketing', action: 'access' }}
          redirectTo="https://rbac.arrudahub.com/auth"
        >
          <AppContent />
        </ProtectedRoute>
      </div>
    </ArrudaAuthProvider>
  );
}

// Conteúdo do app
function AppContent() {
  const { user, logResourceAccess, hasPermission } = useArrudaAuth();

  React.useEffect(() => {
    // Log de acesso à página principal
    logResourceAccess('page', '/trade-marketing/dashboard', 'view');
  }, []);

  return (
    <div>
      <header className="bg-blue-600 text-white p-4">
        <h1>Trade Marketing</h1>
        <p>Bem-vindo, {user?.nome}!</p>
        
        {/* Indicador de permissões */}
        <div className="text-sm mt-2">
          Permissões: 
          {hasPermission('trade-marketing', 'create') && ' Criar |'}
          {hasPermission('trade-marketing', 'edit') && ' Editar |'}
          {hasPermission('trade-marketing', 'delete') && ' Excluir'}
        </div>
      </header>

      <main className="p-6">
        {/* Dashboard de campanhas */}
        <CampaignDashboard />

        {/* Seção de criação de campanhas */}
        <PermissionGate module="trade-marketing" action="create">
          <CreateCampaignSection />
        </PermissionGate>

        {/* Lista de campanhas */}
        <CampaignsList />
      </main>
    </div>
  );
}

// Dashboard de campanhas
function CampaignDashboard() {
  const { logResourceAccess } = useArrudaAuth();
  const [stats, setStats] = React.useState(null);

  React.useEffect(() => {
    const fetchStats = async () => {
      const startTime = Date.now();
      
      try {
        // Simular busca de estatísticas
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setStats({
          totalCampaigns: 25,
          activeCampaigns: 8,
          budget: 150000
        });

        await logResourceAccess(
          'api',
          '/api/trade-marketing/stats',
          'read',
          true,
          Date.now() - startTime
        );

      } catch (error) {
        await logResourceAccess(
          'api',
          '/api/trade-marketing/stats',
          'read',
          false,
          Date.now() - startTime,
          error.message
        );
      }
    };

    fetchStats();
  }, []);

  if (!stats) {
    return <div>Carregando estatísticas...</div>;
  }

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-white p-4 rounded shadow">
        <h3>Total de Campanhas</h3>
        <p className="text-2xl font-bold">{stats.totalCampaigns}</p>
      </div>
      <div className="bg-white p-4 rounded shadow">
        <h3>Campanhas Ativas</h3>
        <p className="text-2xl font-bold">{stats.activeCampaigns}</p>
      </div>
      <div className="bg-white p-4 rounded shadow">
        <h3>Orçamento Total</h3>
        <p className="text-2xl font-bold">R$ {stats.budget.toLocaleString()}</p>
      </div>
    </div>
  );
}

// Seção de criação de campanhas
function CreateCampaignSection() {
  const { logResourceAccess } = useArrudaAuth();

  const handleCreateCampaign = async () => {
    const startTime = Date.now();
    
    try {
      await logResourceAccess('action', '/trade-marketing/campaigns', 'create_attempt');
      
      // Lógica de criação aqui
      console.log('Criando nova campanha...');
      
      await logResourceAccess(
        'action',
        '/trade-marketing/campaigns',
        'create',
        true,
        Date.now() - startTime,
        null,
        { campaign_type: 'promotional' }
      );

    } catch (error) {
      await logResourceAccess(
        'action',
        '/trade-marketing/campaigns',
        'create',
        false,
        Date.now() - startTime,
        error.message
      );
    }
  };

  return (
    <div className="bg-green-50 p-4 rounded mb-6">
      <h2>Nova Campanha</h2>
      <p>Crie uma nova campanha de trade marketing</p>
      <button 
        onClick={handleCreateCampaign}
        className="bg-green-600 text-white px-4 py-2 rounded mt-2"
      >
        Criar Campanha
      </button>
    </div>
  );
}

// Lista de campanhas
function CampaignsList() {
  const { logResourceAccess } = useArrudaAuth();
  const [campaigns, setCampaigns] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchCampaigns = async () => {
      const startTime = Date.now();
      
      try {
        // Simular busca de campanhas
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const mockCampaigns = [
          { id: 1, name: 'Campanha Verão 2024', status: 'ativa', budget: 50000 },
          { id: 2, name: 'Promoção Black Friday', status: 'planejada', budget: 75000 },
          { id: 3, name: 'Lançamento Produto X', status: 'finalizada', budget: 25000 },
        ];
        
        setCampaigns(mockCampaigns);

        await logResourceAccess(
          'api',
          '/api/trade-marketing/campaigns',
          'read',
          true,
          Date.now() - startTime,
          null,
          { count: mockCampaigns.length }
        );

      } catch (error) {
        await logResourceAccess(
          'api',
          '/api/trade-marketing/campaigns',
          'read',
          false,
          Date.now() - startTime,
          error.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  if (loading) {
    return <div>Carregando campanhas...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Campanhas</h2>
      <div className="space-y-4">
        {campaigns.map(campaign => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>
    </div>
  );
}

// Card de campanha
function CampaignCard({ campaign }) {
  const { logResourceAccess } = useArrudaAuth();

  const handleEdit = async () => {
    await logResourceAccess('action', `/trade-marketing/campaigns/${campaign.id}`, 'edit_attempt');
    console.log(`Editando campanha ${campaign.id}`);
  };

  const handleDelete = async () => {
    await logResourceAccess('action', `/trade-marketing/campaigns/${campaign.id}`, 'delete_attempt');
    console.log(`Excluindo campanha ${campaign.id}`);
  };

  const handleView = async () => {
    await logResourceAccess('action', `/trade-marketing/campaigns/${campaign.id}`, 'view');
    console.log(`Visualizando campanha ${campaign.id}`);
  };

  return (
    <div className="bg-white border rounded p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{campaign.name}</h3>
          <p className="text-sm text-gray-600">Status: {campaign.status}</p>
          <p className="text-sm text-gray-600">Orçamento: R$ {campaign.budget.toLocaleString()}</p>
        </div>
        
        <div className="flex gap-2">
          <button onClick={handleView} className="text-blue-600 hover:underline">
            Ver
          </button>
          
          <PermissionGate module="trade-marketing" action="edit">
            <button onClick={handleEdit} className="text-green-600 hover:underline">
              Editar
            </button>
          </PermissionGate>
          
          <PermissionGate module="trade-marketing" action="delete">
            <button onClick={handleDelete} className="text-red-600 hover:underline">
              Excluir
            </button>
          </PermissionGate>
        </div>
      </div>
    </div>
  );
}

export default TradeMarketingApp;

