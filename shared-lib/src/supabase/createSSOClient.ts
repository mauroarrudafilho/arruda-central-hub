/**
 * Helper para criar cliente Supabase configurado com suporte a SSO
 * 
 * Este helper configura automaticamente o cliente Supabase para:
 * 1. Enviar o token SSO no header 'x-sso-token' em todas as requisições
 * 2. Não usar sessão do Supabase Auth (quando usando SSO)
 * 
 * @example
 * ```typescript
 * import { createSSOClient } from '@arruda/rbac-client';
 * 
 * const supabase = createSSOClient(
 *   'https://kgzybpelluftexrewyke.supabase.co',
 *   'sua-chave-anon'
 * );
 * ```
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Função para obter token SSO do localStorage
 */
const getSSOToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('arruda_sso_token');
};

/**
 * Cria um cliente Supabase configurado para enviar token SSO em todas as requisições
 * 
 * @param supabaseUrl - URL do projeto Supabase
 * @param supabaseAnonKey - Chave anônima do Supabase
 * @param options - Opções adicionais para o cliente Supabase
 * @returns Cliente Supabase configurado com interceptor SSO
 */
export function createSSOClient(
  supabaseUrl: string,
  supabaseAnonKey: string,
  options?: {
    /**
     * Nome da chave no localStorage onde o token SSO está armazenado
     * @default 'arruda_sso_token'
     */
    tokenKey?: string;
    /**
     * Nome do header HTTP onde o token será enviado
     * @default 'x-sso-token'
     */
    headerName?: string;
    /**
     * Se deve usar sessão do Supabase Auth (false quando usando SSO)
     * @default false
     */
    persistSession?: boolean;
  }
): SupabaseClient {
  const {
    tokenKey = 'arruda_sso_token',
    headerName = 'x-sso-token',
    persistSession = false,
  } = options || {};

  // Função customizada para obter token
  const getToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(tokenKey);
  };

  // Criar cliente Supabase
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {},
    },
    auth: {
      persistSession,
      autoRefreshToken: false,
    },
  });

  // Interceptor para adicionar token SSO em todas as requisições
  const originalFetch = supabase.rest.fetch;
  supabase.rest.fetch = async (url, options = {}) => {
    const ssoToken = getToken();
    
    // Adicionar token SSO ao header se existir
    const headers = new Headers(options.headers);
    if (ssoToken) {
      headers.set(headerName, ssoToken);
      if (process.env.NODE_ENV === 'development') {
        console.log('[SSO Client] Token SSO adicionado à requisição:', url);
      }
    }
    
    return originalFetch(url, {
      ...options,
      headers,
    });
  };

  return supabase;
}

/**
 * Configuração padrão do Supabase para o Arruda Hub
 */
export const ARRUDA_SUPABASE_CONFIG = {
  url: 'https://kgzybpelluftexrewyke.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnenlicGVsbHVmdGV4cmV3eWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyODA4NzUsImV4cCI6MjA3MDg1Njg3NX0.tQGH9z4Sp0I23vETIrqwRvSRUGSOru1e4r5GOKgzbsI',
} as const;

/**
 * Cria um cliente Supabase pré-configurado para o Arruda Hub
 * 
 * @example
 * ```typescript
 * import { createArrudaSSOClient } from '@arruda/rbac-client';
 * 
 * const supabase = createArrudaSSOClient();
 * ```
 */
export function createArrudaSSOClient(): SupabaseClient {
  return createSSOClient(
    ARRUDA_SUPABASE_CONFIG.url,
    ARRUDA_SUPABASE_CONFIG.anonKey
  );
}

