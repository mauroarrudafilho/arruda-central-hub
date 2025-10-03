export interface ArrudaUser {
  id: string;
  email: string;
  nome: string;
  status: 'ativo' | 'inativo' | 'suspenso';
  ultimo_login?: string;
  created_at: string;
}

export interface ArrudaProject {
  id: string;
  nome: string;
  descricao?: string;
  slug: string;
  status: string;
  nivel_acesso: 'admin' | 'gestor' | 'visualizador';
}

export interface ArrudaPermission {
  permission: string;
  module: string;
  action: string;
  granted: boolean;
}

export interface ArrudaSession {
  session_id: string;
  session_token: string;
  user_id: string;
  project_id: string;
  frontend_module: string;
  permissions: ArrudaPermission[];
  expires_at: string;
}

export interface FrontendConfig {
  module_name: string;
  display_name: string;
  frontend_url: string;
  project_id: string;
  allowed_origins: string[];
}

export interface AuthState {
  user: ArrudaUser | null;
  session: ArrudaSession | null;
  project: ArrudaProject | null;
  loading: boolean;
  error: string | null;
}

export interface SessionConfig {
  supabaseUrl: string;
  supabaseKey: string;
  projectId: string;
  moduleName: string;
  frontendOrigin: string;
  enableLogging?: boolean;
}

