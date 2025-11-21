-- Migration: Fix user_sessions table for SSO token generation
-- Data: 2025-02-04
-- Descrição: Adiciona campo status e constraint única para permitir ON CONFLICT na função generate_sso_token

-- ==============================================
-- ADICIONAR CAMPO STATUS
-- ==============================================

-- Adicionar coluna status se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_sessions' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.user_sessions 
    ADD COLUMN status TEXT NOT NULL DEFAULT 'ativo' 
    CHECK (status IN ('ativo', 'inativo', 'expirado'));
  END IF;
END $$;

-- ==============================================
-- ADICIONAR CONSTRAINT ÚNICA
-- ==============================================

-- Adicionar constraint única em (user_id, frontend_module) se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_sessions_user_id_frontend_module_key'
  ) THEN
    ALTER TABLE public.user_sessions 
    ADD CONSTRAINT user_sessions_user_id_frontend_module_key 
    UNIQUE (user_id, frontend_module);
  END IF;
END $$;

-- ==============================================
-- COMENTÁRIOS
-- ==============================================

COMMENT ON COLUMN public.user_sessions.status IS 'Status da sessão: ativo, inativo ou expirado';
COMMENT ON CONSTRAINT user_sessions_user_id_frontend_module_key ON public.user_sessions IS 'Garante que cada usuário tenha apenas uma sessão ativa por módulo frontend';

