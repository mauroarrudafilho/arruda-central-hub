/**
 * Gerenciador de Tokens SSO
 * 
 * Pré-gera e gerencia tokens SSO para todos os módulos externos
 * após o login do usuário, armazenando no localStorage para acesso instantâneo.
 */

import { supabase } from '@/integrations/supabase/client';

export interface SSOTokenData {
  token: string;
  expires_at: string;
  project_id: string;
  project_slug: string;
  project_name: string;
  generated_at: string;
}

export interface SSOTokensMap {
  [projectSlug: string]: SSOTokenData;
}

const STORAGE_KEY = 'arruda_sso_tokens';
const TOKEN_VALIDITY_BUFFER = 5 * 60 * 1000; // 5 minutos antes de expirar

/**
 * Carrega tokens SSO do localStorage
 */
export function loadSSOTokens(): SSOTokensMap {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    
    const tokens: SSOTokensMap = JSON.parse(stored);
    
    // Limpar tokens expirados ao carregar
    const now = new Date();
    const validTokens: SSOTokensMap = {};
    
    for (const [slug, tokenData] of Object.entries(tokens)) {
      const expiresAt = new Date(tokenData.expires_at);
      if (expiresAt > now) {
        validTokens[slug] = tokenData;
      }
    }
    
    // Se houve limpeza, salvar de volta
    if (Object.keys(validTokens).length !== Object.keys(tokens).length) {
      saveSSOTokens(validTokens);
    }
    
    return validTokens;
  } catch (error) {
    console.error('[SSO Token Manager] Erro ao carregar tokens:', error);
    return {};
  }
}

/**
 * Salva tokens SSO no localStorage
 */
export function saveSSOTokens(tokens: SSOTokensMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  } catch (error) {
    console.error('[SSO Token Manager] Erro ao salvar tokens:', error);
  }
}

/**
 * Obtém token SSO para um módulo específico
 */
export function getSSOToken(projectSlug: string): SSOTokenData | null {
  const tokens = loadSSOTokens();
  const tokenData = tokens[projectSlug];
  
  if (!tokenData) return null;
  
  // Verificar se ainda é válido (com buffer de segurança)
  const expiresAt = new Date(tokenData.expires_at);
  const now = new Date();
  const validUntil = new Date(expiresAt.getTime() - TOKEN_VALIDITY_BUFFER);
  
  if (now > validUntil) {
    // Token expirado ou prestes a expirar
    delete tokens[projectSlug];
    saveSSOTokens(tokens);
    return null;
  }
  
  return tokenData;
}

/**
 * Verifica se um token está válido
 */
export function isSSOTokenValid(projectSlug: string): boolean {
  const tokenData = getSSOToken(projectSlug);
  return tokenData !== null;
}

/**
 * Gera token SSO para um módulo específico
 */
export async function generateSSOTokenForModule(projectSlug: string): Promise<SSOTokenData | null> {
  try {
    const { data: tokenData, error: tokenError } = await supabase.rpc('generate_sso_token', {
      _project_slug: projectSlug,
    });

    if (tokenError || !tokenData || tokenData.length === 0) {
      console.error(`[SSO Token Manager] Erro ao gerar token para ${projectSlug}:`, tokenError);
      return null;
    }

    const result = tokenData[0];
    const ssoTokenData: SSOTokenData = {
      token: result.token,
      expires_at: result.expires_at,
      project_id: result.project_id,
      project_slug: projectSlug,
      project_name: result.project_name,
      generated_at: new Date().toISOString(),
    };

    // Salvar no localStorage
    const tokens = loadSSOTokens();
    tokens[projectSlug] = ssoTokenData;
    saveSSOTokens(tokens);

    return ssoTokenData;
  } catch (error) {
    console.error(`[SSO Token Manager] Erro ao gerar token para ${projectSlug}:`, error);
    return null;
  }
}

/**
 * Pré-gera tokens SSO para todos os módulos externos
 * Executado após login bem-sucedido
 * 
 * Para plataformas com uso restrito (poucos usuários, poucos módulos),
 * é mais eficiente pré-gerar todos os tokens de uma vez.
 */
export async function preGenerateSSOTokens(projects: Array<{ slug: string; url_vercel?: string | null }>): Promise<void> {
  try {
    console.log('[SSO Token Manager] Iniciando pré-geração de tokens SSO...');
    
    // Filtrar apenas projetos externos (com URL)
    const externalProjects = projects.filter(
      (project) => project.url_vercel && /^https?:\/\//i.test(project.url_vercel)
    );

    if (externalProjects.length === 0) {
      console.log('[SSO Token Manager] Nenhum módulo externo encontrado');
      return;
    }

    console.log(`[SSO Token Manager] Pré-gerando tokens para ${externalProjects.length} módulos externos...`);

    // Carregar tokens existentes
    const existingTokens = loadSSOTokens();

    // Gerar tokens em paralelo para todos os módulos
    const tokenPromises = externalProjects.map(async (project) => {
      // Verificar se já existe token válido
      const existingToken = existingTokens[project.slug];
      if (existingToken) {
        const expiresAt = new Date(existingToken.expires_at);
        const now = new Date();
        const validUntil = new Date(expiresAt.getTime() - TOKEN_VALIDITY_BUFFER);
        
        // Se ainda é válido, não precisa regenerar
        if (now <= validUntil) {
          console.log(`[SSO Token Manager] Token válido existente para ${project.slug}, reutilizando`);
          return { slug: project.slug, token: existingToken, fromCache: true };
        }
      }

      // Gerar novo token
      const tokenData = await generateSSOTokenForModule(project.slug);
      return { slug: project.slug, token: tokenData, fromCache: false };
    });

    const results = await Promise.allSettled(tokenPromises);
    
    let successCount = 0;
    let cachedCount = 0;
    let errorCount = 0;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.token) {
        if (result.value.fromCache) {
          cachedCount++;
        } else {
          successCount++;
        }
      } else {
        errorCount++;
        console.warn(`[SSO Token Manager] Falha ao gerar token para ${externalProjects[index].slug}`);
      }
    });

    console.log(`[SSO Token Manager] Pré-geração concluída: ${successCount} novos, ${cachedCount} do cache, ${errorCount} erros`);
  } catch (error) {
    console.error('[SSO Token Manager] Erro na pré-geração de tokens:', error);
  }
}

/**
 * Limpa todos os tokens SSO do localStorage
 */
export function clearSSOTokens(): void {
  localStorage.removeItem(STORAGE_KEY);
  console.log('[SSO Token Manager] Tokens SSO limpos');
}

/**
 * Atualiza tokens para novos módulos adicionados
 */
export async function refreshSSOTokensForNewModules(
  currentProjects: Array<{ slug: string; url_vercel?: string | null }>
): Promise<void> {
  const existingTokens = loadSSOTokens();
  const externalProjects = currentProjects.filter(
    (project) => project.url_vercel && /^https?:\/\//i.test(project.url_vercel)
  );

  // Encontrar módulos sem token
  const modulesWithoutToken = externalProjects.filter(
    (project) => !existingTokens[project.slug] || !isSSOTokenValid(project.slug)
  );

  if (modulesWithoutToken.length === 0) {
    console.log('[SSO Token Manager] Todos os módulos já possuem tokens válidos');
    return;
  }

  console.log(`[SSO Token Manager] Gerando tokens para ${modulesWithoutToken.length} novos módulos...`);
  
  // Gerar tokens apenas para módulos novos ou expirados
  await preGenerateSSOTokens(modulesWithoutToken);
}

