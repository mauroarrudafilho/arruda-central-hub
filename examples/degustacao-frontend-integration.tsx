// Exemplo de como integrar a biblioteca no frontend de DEGUSTAÇÃO

import React from 'react';
import { 
  ArrudaAuthProvider, 
  ProtectedRoute, 
  PermissionGate, 
  FrontendGuard,
  useArrudaAuth 
} from '@arruda/rbac-client';

// Configuração do módulo de degustação
const authConfig = {
  supabaseUrl: 'https://kgzybpelluftexrewyke.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnenlicGVsbHVmdGV4cmV3eWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyODA4NzUsImV4cCI6MjA3MDg1Njg3NX0.tQGH9z4Sp0I23vETIrqwRvSRUGSOru1e4r5GOKgzbsI',
  projectId: 'uuid-do-projeto-gestao', // ID do projeto no banco - buscar com: SELECT id FROM projects WHERE slug = 'gestao'
  moduleName: 'degustacao',
  frontendOrigin: 'https://degusta-go.vercel.app',
  enableLogging: true,
};

// URL do Hub Central
const hubUrl = 'https://arruda-rbac-master.lovable.app/hub';

// Componente principal do app
function DegustacaoApp() {
  return (
    <ArrudaAuthProvider config={authConfig}>
      <div className="min-h-screen bg-background">
        <FrontendGuard
          moduleName="degustacao"
          supabaseUrl={authConfig.supabaseUrl}
          supabaseAnonKey={authConfig.supabaseKey}
          hubUrl={hubUrl}
        >
          <ProtectedRoute
            requiredPermission={{ module: 'degustacao', action: 'access' }}
            redirectTo={hubUrl}
          >
            <AppContent />
          </ProtectedRoute>
        </FrontendGuard>
      </div>
    </ArrudaAuthProvider>
  );
}

// Conteúdo do app
function AppContent() {
  const { user, logResourceAccess, hasPermission } = useArrudaAuth();

  React.useEffect(() => {
    // Log de acesso à página principal
    logResourceAccess('page', '/degustacao/dashboard', 'view');
  }, []);

  return (
    <div>
      <header className="bg-orange-600 text-white p-4">
        <h1>Degustação & Trade Marketing</h1>
        <p>Bem-vindo, {user?.nome}!</p>
        
        {/* Indicador de permissões */}
        <div className="text-sm mt-2">
          Permissões: 
          {hasPermission('degustacao', 'create') && ' Criar |'}
          {hasPermission('degustacao', 'edit') && ' Editar |'}
          {hasPermission('degustacao', 'delete') && ' Excluir |'}
          {hasPermission('degustacao', 'manage') && ' Gerenciar'}
        </div>
      </header>

      <main className="p-6">
        {/* Dashboard de ações */}
        <ActionsDashboard />

        {/* Seção de criação de ações */}
        <PermissionGate module="degustacao" action="create">
          <CreateActionSection />
        </PermissionGate>

        {/* Seção de gerenciamento de degustadoras */}
        <PermissionGate module="degustacao" action="manage">
          <DegustadorasManagement />
        </PermissionGate>

        {/* Lista de ações */}
        <ActionsList />
      </main>
    </div>
  );
}

// Dashboard de ações
function ActionsDashboard() {
  const { logResourceAccess } = useArrudaAuth();
  const [stats, setStats] = React.useState(null);

  React.useEffect(() => {
    const fetchStats = async () => {
      const startTime = Date.now();
      
      try {
        // Simular busca de estatísticas
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setStats({
          totalActions: 45,
          activeActions: 12,
          degustadoras: 8,
          budget: 75000
        });

        await logResourceAccess(
          'api',
          '/api/degustacao/stats',
          'read',
          true,
          Date.now() - startTime
        );

      } catch (error) {
        await logResourceAccess(
          'api',
          '/api/degustacao/stats',
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
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded shadow">
        <h3>Total de Ações</h3>
        <p className="text-2xl font-bold">{stats.totalActions}</p>
      </div>
      <div className="bg-white p-4 rounded shadow">
        <h3>Ações Ativas</h3>
        <p className="text-2xl font-bold">{stats.activeActions}</p>
      </div>
      <div className="bg-white p-4 rounded shadow">
        <h3>Degustadoras</h3>
        <p className="text-2xl font-bold">{stats.degustadoras}</p>
      </div>
      <div className="bg-white p-4 rounded shadow">
        <h3>Orçamento Total</h3>
        <p className="text-2xl font-bold">R$ {stats.budget.toLocaleString()}</p>
      </div>
    </div>
  );
}

// Seção de criação de ações
function CreateActionSection() {
  const { logResourceAccess } = useArrudaAuth();

  const handleCreateAction = async () => {
    const startTime = Date.now();
    
    try {
      await logResourceAccess('action', '/degustacao/actions', 'create_attempt');
      
      // Lógica de criação aqui
      console.log('Criando nova ação de degustação...');
      
      await logResourceAccess(
        'action',
        '/degustacao/actions',
        'create',
        true,
        Date.now() - startTime,
        null,
        { action_type: 'degustacao' }
      );

    } catch (error) {
      await logResourceAccess(
        'action',
        '/degustacao/actions',
        'create',
        false,
        Date.now() - startTime,
        error.message
      );
    }
  };

  return (
    <div className="bg-green-50 p-4 rounded mb-6">
      <h2>Nova Ação de Degustação</h2>
      <p>Crie uma nova ação de degustação</p>
      <button 
        onClick={handleCreateAction}
        className="bg-green-600 text-white px-4 py-2 rounded mt-2"
      >
        Criar Ação
      </button>
    </div>
  );
}

// Gerenciamento de degustadoras
function DegustadorasManagement() {
  const { logResourceAccess } = useArrudaAuth();
  const [degustadoras, setDegustadoras] = React.useState([]);

  React.useEffect(() => {
    const fetchDegustadoras = async () => {
      const startTime = Date.now();
      
      try {
        // Simular busca de degustadoras
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const mockDegustadoras = [
          { id: 1, name: 'Maria Silva', status: 'ativa', region: 'São Paulo' },
          { id: 2, name: 'Ana Costa', status: 'ativa', region: 'Rio de Janeiro' },
          { id: 3, name: 'Paula Santos', status: 'inativa', region: 'Belo Horizonte' },
        ];
        
        setDegustadoras(mockDegustadoras);

        await logResourceAccess(
          'api',
          '/api/degustacao/degustadoras',
          'read',
          true,
          Date.now() - startTime
        );

      } catch (error) {
        await logResourceAccess(
          'api',
          '/api/degustacao/degustadoras',
          'read',
          false,
          Date.now() - startTime,
          error.message
        );
      }
    };

    fetchDegustadoras();
  }, []);

  return (
    <div className="bg-blue-50 p-4 rounded mb-6">
      <h2>Gerenciar Degustadoras</h2>
      <div className="grid grid-cols-3 gap-4 mt-4">
        {degustadoras.map(degustadora => (
          <div key={degustadora.id} className="bg-white p-3 rounded shadow">
            <h3 className="font-semibold">{degustadora.name}</h3>
            <p className="text-sm text-gray-600">Região: {degustadora.region}</p>
            <span className={`text-xs px-2 py-1 rounded ${
              degustadora.status === 'ativa' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
            }`}>
              {degustadora.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Lista de ações
function ActionsList() {
  const { logResourceAccess } = useArrudaAuth();
  const [actions, setActions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchActions = async () => {
      const startTime = Date.now();
      
      try {
        // Simular busca de ações
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        const mockActions = [
          { 
            id: 1, 
            title: 'Degustação Shopping Center Norte', 
            status: 'ativa', 
            store: 'Extra Hipermercado',
            degustadora: 'Maria Silva',
            startDate: '2024-01-15',
            endDate: '2024-01-17'
          },
          { 
            id: 2, 
            title: 'Ação Trade Carrefour', 
            status: 'planejada', 
            store: 'Carrefour Barra',
            degustadora: 'Ana Costa',
            startDate: '2024-01-20',
            endDate: '2024-01-22'
          },
          { 
            id: 3, 
            title: 'Degustação Pão de Açúcar', 
            status: 'finalizada', 
            store: 'Pão de Açúcar Ipanema',
            degustadora: 'Paula Santos',
            startDate: '2024-01-10',
            endDate: '2024-01-12'
          },
        ];
        
        setActions(mockActions);

        await logResourceAccess(
          'api',
          '/api/degustacao/actions',
          'read',
          true,
          Date.now() - startTime,
          null,
          { count: mockActions.length }
        );

      } catch (error) {
        await logResourceAccess(
          'api',
          '/api/degustacao/actions',
          'read',
          false,
          Date.now() - startTime,
          error.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchActions();
  }, []);

  if (loading) {
    return <div>Carregando ações...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Ações de Degustação</h2>
      <div className="space-y-4">
        {actions.map(action => (
          <ActionCard key={action.id} action={action} />
        ))}
      </div>
    </div>
  );
}

// Card de ação
function ActionCard({ action }) {
  const { logResourceAccess } = useArrudaAuth();

  const handleEdit = async () => {
    await logResourceAccess('action', `/degustacao/actions/${action.id}`, 'edit_attempt');
    console.log(`Editando ação ${action.id}`);
  };

  const handleDelete = async () => {
    await logResourceAccess('action', `/degustacao/actions/${action.id}`, 'delete_attempt');
    console.log(`Excluindo ação ${action.id}`);
  };

  const handleView = async () => {
    await logResourceAccess('action', `/degustacao/actions/${action.id}`, 'view');
    console.log(`Visualizando ação ${action.id}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ativa': return 'bg-green-100 text-green-800';
      case 'planejada': return 'bg-blue-100 text-blue-800';
      case 'finalizada': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white border rounded p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{action.title}</h3>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-600">
              <strong>Loja:</strong> {action.store}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Degustadora:</strong> {action.degustadora}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Período:</strong> {new Date(action.startDate).toLocaleDateString('pt-BR')} até {new Date(action.endDate).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${getStatusColor(action.status)}`}>
            {action.status}
          </span>
        </div>
        
        <div className="flex gap-2 ml-4">
          <button onClick={handleView} className="text-blue-600 hover:underline text-sm">
            Ver
          </button>
          
          <PermissionGate module="degustacao" action="edit">
            <button onClick={handleEdit} className="text-green-600 hover:underline text-sm">
              Editar
            </button>
          </PermissionGate>
          
          <PermissionGate module="degustacao" action="delete">
            <button onClick={handleDelete} className="text-red-600 hover:underline text-sm">
              Excluir
            </button>
          </PermissionGate>
        </div>
      </div>
    </div>
  );
}

export default DegustacaoApp;
