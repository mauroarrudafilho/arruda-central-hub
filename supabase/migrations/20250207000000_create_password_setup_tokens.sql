-- Migration: Create Password Setup Tokens Table
-- Data: 2025-02-07
-- Descrição: Cria tabela para armazenar tokens de definição de senha
-- Esta tabela permite que o Reback e outros sistemas armazenem tokens
-- de forma centralizada para o fluxo de criação de senha

-- ==============================================
-- TABELA: password_setup_tokens
-- ==============================================

CREATE TABLE IF NOT EXISTS public.password_setup_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_password_setup_tokens_token ON public.password_setup_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_setup_tokens_user_id ON public.password_setup_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_setup_tokens_expires_at ON public.password_setup_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_setup_tokens_used ON public.password_setup_tokens(used);

-- Comentários
COMMENT ON TABLE public.password_setup_tokens IS 'Armazena tokens para definição inicial de senha de usuários. Usado pelo fluxo de criação de usuários do Reback.';
COMMENT ON COLUMN public.password_setup_tokens.token IS 'Token único gerado para definir senha';
COMMENT ON COLUMN public.password_setup_tokens.expires_at IS 'Data de expiração do token (geralmente 7 dias)';
COMMENT ON COLUMN public.password_setup_tokens.used IS 'Indica se o token já foi usado';
COMMENT ON COLUMN public.password_setup_tokens.metadata IS 'Metadados adicionais (ex: origem do convite, projeto, etc.)';

-- ==============================================
-- RLS POLICIES
-- ==============================================

-- Habilitar RLS
ALTER TABLE public.password_setup_tokens ENABLE ROW LEVEL SECURITY;

-- Política: Apenas service role pode ler/escrever
-- Tokens são sensíveis e não devem ser acessíveis via API pública
CREATE POLICY "Service role only for password_setup_tokens"
  ON public.password_setup_tokens
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Nota: Esta tabela é acessada apenas via Edge Functions com service role
-- Não há necessidade de políticas RLS para usuários autenticados

-- ==============================================
-- FUNÇÃO: Limpar tokens expirados
-- ==============================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_password_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Deletar tokens expirados há mais de 30 dias
  DELETE FROM public.password_setup_tokens
  WHERE expires_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_expired_password_tokens IS 'Remove tokens de definição de senha expirados há mais de 30 dias. Pode ser executada periodicamente via cron job.';

-- ==============================================
-- FUNÇÃO: Gerar token de definição de senha
-- ==============================================

CREATE OR REPLACE FUNCTION public.generate_password_setup_token(
  p_user_id UUID,
  p_expires_in_hours INTEGER DEFAULT 168, -- 7 dias por padrão
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  token TEXT,
  expires_at TIMESTAMPTZ,
  token_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _token TEXT;
  _expires_at TIMESTAMPTZ;
  _token_id UUID;
BEGIN
  -- Verificar se o usuário existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Usuário não encontrado: %', p_user_id;
  END IF;

  -- Gerar token único (base64, 32 bytes)
  _token := encode(gen_random_bytes(32), 'base64');
  
  -- Definir expiração
  _expires_at := NOW() + (p_expires_in_hours || ' hours')::INTERVAL;

  -- Inserir token
  INSERT INTO public.password_setup_tokens (
    user_id,
    token,
    expires_at,
    metadata
  ) VALUES (
    p_user_id,
    _token,
    _expires_at,
    p_metadata
  )
  RETURNING id INTO _token_id;

  -- Retornar token e informações
  RETURN QUERY SELECT 
    _token,
    _expires_at,
    _token_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao gerar token de definição de senha: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION public.generate_password_setup_token IS 'Gera um token único para definição de senha. Usado pelo Reback e outros sistemas ao criar usuários.';

-- ==============================================
-- TRIGGER: Atualizar updated_at
-- ==============================================

CREATE OR REPLACE FUNCTION public.update_password_setup_tokens_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_password_setup_tokens_updated_at
  BEFORE UPDATE ON public.password_setup_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_password_setup_tokens_updated_at();

