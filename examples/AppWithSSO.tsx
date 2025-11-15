/**
 * Exemplo de como usar o hook useSSO no seu App.tsx
 * 
 * COMO USAR:
 * 1. Copie o arquivo useSSO.ts para seu projeto
 * 2. Substitua seu App.tsx por este exemplo (ajustando conforme necessário)
 * 3. Ajuste as constantes no useSSO.ts
 */

import { useSSO } from './useSSO';

function App() {
  const { user, loading, authenticated, error, redirectToHub } = useSSO();

  // Mostrar loading enquanto valida o token
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não autenticado, o hook já redireciona automaticamente
  // Mas podemos mostrar uma mensagem enquanto redireciona
  if (!authenticated || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <p className="text-gray-600">Redirecionando para o Hub...</p>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>
      </div>
    );
  }

  // ✅ Usuário autenticado! Renderizar seu app normalmente
  return (
    <div>
      {/* Seu header/navbar */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Seu Módulo</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Olá, {user.name} ({user.email})
            </span>
            <button
              onClick={redirectToHub}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Voltar ao Hub
            </button>
          </div>
        </div>
      </header>

      {/* Seu conteúdo principal */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-4">
          Bem-vindo ao {user.projectName}!
        </h2>
        
        {/* Exemplo: Verificar permissões */}
        {user.permissions.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Suas permissões:</h3>
            <ul className="list-disc list-inside text-sm text-gray-600">
              {user.permissions.map((perm, idx) => (
                <li key={idx}>
                  {perm.permission} - {perm.module}.{perm.action}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Aqui vai o resto do seu app */}
        <div className="bg-white rounded-lg shadow p-6">
          <p>Conteúdo do seu módulo aqui...</p>
        </div>
      </main>
    </div>
  );
}

export default App;

