// Exemplo de como integrar a biblioteca no frontend de ACORDOS

import React from 'react';
import { 
  ArrudaAuthProvider, 
  ProtectedRoute, 
  PermissionGate, 
  SoftFrontendGuard,
  useArrudaAuth 
} from '@arruda/rbac-client';

// Configuração do módulo de acordos
const authConfig = {
  supabaseUrl: 'https://kgzybpelluftexrewyke.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnenlicGVsbHVmdGV4cmV3eWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyODA4NzUsImV4cCI6MjA3MDg1Njg3NX0.tQGH9z4Sp0I23vETIrqwRvSRUGSOru1e4r5GOKgzbsI',
  projectId: 'uuid-do-projeto-gestao', // ID do projeto no banco - buscar com: SELECT id FROM projects WHERE slug = 'gestao'
  moduleName: 'acordos',
  frontendOrigin: 'https://acordo-flow.lovable.app',
  enableLogging: true,
};

// URL do Hub Central
const hubUrl = 'https://arruda-rbac-master.lovable.app/hub';

// Componente principal do app
function AcordosApp() {
  return (
    <ArrudaAuthProvider config={authConfig}>
      <div className="min-h-screen bg-background">
        <SoftFrontendGuard
          moduleName="acordos"
          supabaseUrl={authConfig.supabaseUrl}
          supabaseAnonKey={authConfig.supabaseKey}
          hubUrl={hubUrl}
          enabled={false} // Desabilitado por enquanto
        >
          <ProtectedRoute
            requiredPermission={{ module: 'acordos', action: 'access' }}
            redirectTo={hubUrl}
          >
            <AppContent />
          </ProtectedRoute>
        </SoftFrontendGuard>
      </div>
    </ArrudaAuthProvider>
  );
}

// Conteúdo do app
function AppContent() {
  const { user, logResourceAccess } = useArrudaAuth();

  React.useEffect(() => {
    // Log de acesso à página principal
    logResourceAccess('page', '/acordos/dashboard', 'view');
  }, []);

  return (
    <div>
      <header>
        <h1>Módulo de Acordos</h1>
        <p>Bem-vindo, {user?.nome}!</p>
      </header>

      <main>
        {/* Botão que só aparece para quem pode criar acordos */}
        <PermissionGate module="acordos" action="create">
          <button onClick={handleCreateAcordo}>
            Criar Novo Acordo
          </button>
        </PermissionGate>

        {/* Seção de administração só para admins */}
        <PermissionGate module="acordos" action="admin" requireAdmin>
          <AdminSection />
        </PermissionGate>

        <AcordosList />
      </main>
    </div>
  );
}

// Componente de lista de acordos
function AcordosList() {
  const { logResourceAccess } = useArrudaAuth();
  const [acordos, setAcordos] = React.useState([]);

  const fetchAcordos = async () => {
    const startTime = Date.now();
    
    try {
      // Sua lógica de busca aqui
      const response = await fetch('/api/acordos');
      const data = await response.json();
      
      setAcordos(data);
      
      // Log de sucesso
      await logResourceAccess(
        'api',
        '/api/acordos',
        'read',
        true,
        Date.now() - startTime
      );
      
    } catch (error) {
      // Log de erro
      await logResourceAccess(
        'api',
        '/api/acordos',
        'read',
        false,
        Date.now() - startTime,
        error.message
      );
    }
  };

  React.useEffect(() => {
    fetchAcordos();
  }, []);

  return (
    <div>
      {acordos.map(acordo => (
        <AcordoCard key={acordo.id} acordo={acordo} />
      ))}
    </div>
  );
}

// Componente de card de acordo
function AcordoCard({ acordo }) {
  const { logResourceAccess } = useArrudaAuth();

  const handleEdit = async () => {
    await logResourceAccess('action', `/acordos/${acordo.id}`, 'edit_attempt');
    // Lógica de edição
  };

  const handleDelete = async () => {
    await logResourceAccess('action', `/acordos/${acordo.id}`, 'delete_attempt');
    // Lógica de deleção
  };

  return (
    <div className="border rounded p-4">
      <h3>{acordo.titulo}</h3>
      <p>{acordo.descricao}</p>
      
      <div className="flex gap-2 mt-4">
        <PermissionGate module="acordos" action="edit">
          <button onClick={handleEdit}>Editar</button>
        </PermissionGate>
        
        <PermissionGate module="acordos" action="delete">
          <button onClick={handleDelete}>Excluir</button>
        </PermissionGate>
      </div>
    </div>
  );
}

function AdminSection() {
  return (
    <div className="bg-red-50 p-4 rounded">
      <h2>Seção Administrativa</h2>
      <p>Apenas administradores podem ver isso!</p>
    </div>
  );
}

function handleCreateAcordo() {
  // Lógica para criar acordo
  console.log('Criando novo acordo...');
}

export default AcordosApp;
