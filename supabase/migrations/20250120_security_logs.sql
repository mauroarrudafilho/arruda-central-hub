-- Migration: Security Logs System
-- Sistema completo de logs de segurança

-- Tabela principal de logs de segurança
CREATE TABLE public.security_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  resource_path TEXT,
  action TEXT,
  success BOOLEAN DEFAULT true,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para alertas de segurança
CREATE TABLE public.security_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  security_log_id UUID REFERENCES public.security_logs(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'false_positive')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para regras de detecção de anomalias
CREATE TABLE public.security_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('threshold', 'pattern', 'anomaly', 'geolocation')),
  conditions JSONB NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para bloqueios de IP
CREATE TABLE public.ip_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address INET NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  blocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para sessões suspeitas
CREATE TABLE public.suspicious_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.user_sessions(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  ip_address INET,
  user_agent TEXT,
  location_data JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Índices para performance
CREATE INDEX idx_security_logs_user_id ON public.security_logs(user_id);
CREATE INDEX idx_security_logs_event_type ON public.security_logs(event_type);
CREATE INDEX idx_security_logs_severity ON public.security_logs(severity);
CREATE INDEX idx_security_logs_created_at ON public.security_logs(created_at);
CREATE INDEX idx_security_logs_ip_address ON public.security_logs(ip_address);
CREATE INDEX idx_security_logs_success ON public.security_logs(success);

CREATE INDEX idx_security_alerts_status ON public.security_alerts(status);
CREATE INDEX idx_security_alerts_severity ON public.security_alerts(severity);
CREATE INDEX idx_security_alerts_assigned_to ON public.security_alerts(assigned_to);
CREATE INDEX idx_security_alerts_created_at ON public.security_alerts(created_at);

CREATE INDEX idx_ip_blocks_ip_address ON public.ip_blocks(ip_address);
CREATE INDEX idx_ip_blocks_is_active ON public.ip_blocks(is_active);
CREATE INDEX idx_ip_blocks_expires_at ON public.ip_blocks(expires_at);

CREATE INDEX idx_suspicious_sessions_user_id ON public.suspicious_sessions(user_id);
CREATE INDEX idx_suspicious_sessions_is_active ON public.suspicious_sessions(is_active);
CREATE INDEX idx_suspicious_sessions_created_at ON public.suspicious_sessions(created_at);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_security_alerts_updated_at BEFORE UPDATE ON public.security_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_security_rules_updated_at BEFORE UPDATE ON public.security_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ip_blocks_updated_at BEFORE UPDATE ON public.ip_blocks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para detectar tentativas de força bruta
CREATE OR REPLACE FUNCTION detect_brute_force_attempts()
RETURNS TRIGGER AS $$
DECLARE
    attempt_count INTEGER;
    time_window INTERVAL := '15 minutes';
BEGIN
    -- Contar tentativas de login falhadas nos últimos 15 minutos
    SELECT COUNT(*)
    INTO attempt_count
    FROM public.security_logs
    WHERE event_type = 'login_failed'
      AND ip_address = NEW.ip_address
      AND created_at > (now() - time_window);

    -- Se mais de 5 tentativas, criar alerta
    IF attempt_count >= 5 THEN
        INSERT INTO public.security_alerts (
            security_log_id,
            alert_type,
            title,
            description,
            severity
        ) VALUES (
            NEW.id,
            'brute_force',
            'Tentativa de Força Bruta Detectada',
            'Múltiplas tentativas de login falhadas de ' || NEW.ip_address,
            'critical'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para detectar força bruta
CREATE TRIGGER detect_brute_force_trigger
    AFTER INSERT ON public.security_logs
    FOR EACH ROW
    WHEN (NEW.event_type = 'login_failed')
    EXECUTE FUNCTION detect_brute_force_attempts();

-- Função para detectar acessos de localizações suspeitas
CREATE OR REPLACE FUNCTION detect_suspicious_location()
RETURNS TRIGGER AS $$
DECLARE
    recent_locations TEXT[];
    current_location TEXT;
BEGIN
    -- Obter localizações recentes do usuário (últimas 24h)
    SELECT ARRAY_AGG(DISTINCT metadata->>'country')
    INTO recent_locations
    FROM public.security_logs
    WHERE user_id = NEW.user_id
      AND created_at > (now() - interval '24 hours')
      AND metadata->>'country' IS NOT NULL;

    -- Obter localização atual
    current_location := NEW.metadata->>'country';

    -- Se é uma nova localização e o usuário tem histórico, criar alerta
    IF current_location IS NOT NULL 
       AND array_length(recent_locations, 1) > 0 
       AND NOT (current_location = ANY(recent_locations)) THEN
        
        INSERT INTO public.security_alerts (
            security_log_id,
            alert_type,
            title,
            description,
            severity
        ) VALUES (
            NEW.id,
            'suspicious_location',
            'Acesso de Localização Suspeita',
            'Login de nova localização: ' || current_location,
            'medium'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para detectar localizações suspeitas
CREATE TRIGGER detect_suspicious_location_trigger
    AFTER INSERT ON public.security_logs
    FOR EACH ROW
    WHEN (NEW.event_type = 'login_success' AND NEW.metadata->>'country' IS NOT NULL)
    EXECUTE FUNCTION detect_suspicious_location();

-- RLS (Row Level Security)
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suspicious_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para security_logs
CREATE POLICY "Admins can view all security logs" ON public.security_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.auth_user_role aur
            JOIN public.auth_role ar ON aur.role_id = ar.id
            WHERE aur.user_id = auth.uid()
            AND ar.nome = 'admin'
            AND aur.ativo = true
        )
    );

CREATE POLICY "Users can view their own security logs" ON public.security_logs
    FOR SELECT USING (user_id = auth.uid());

-- Políticas RLS para security_alerts
CREATE POLICY "Admins can manage security alerts" ON public.security_alerts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.auth_user_role aur
            JOIN public.auth_role ar ON aur.role_id = ar.id
            WHERE aur.user_id = auth.uid()
            AND ar.nome = 'admin'
            AND aur.ativo = true
        )
    );

-- Políticas RLS para security_rules
CREATE POLICY "Admins can manage security rules" ON public.security_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.auth_user_role aur
            JOIN public.auth_role ar ON aur.role_id = ar.id
            WHERE aur.user_id = auth.uid()
            AND ar.nome = 'admin'
            AND aur.ativo = true
        )
    );

-- Políticas RLS para ip_blocks
CREATE POLICY "Admins can manage IP blocks" ON public.ip_blocks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.auth_user_role aur
            JOIN public.auth_role ar ON aur.role_id = ar.id
            WHERE aur.user_id = auth.uid()
            AND ar.nome = 'admin'
            AND aur.ativo = true
        )
    );

-- Políticas RLS para suspicious_sessions
CREATE POLICY "Admins can view suspicious sessions" ON public.suspicious_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.auth_user_role aur
            JOIN public.auth_role ar ON aur.role_id = ar.id
            WHERE aur.user_id = auth.uid()
            AND ar.nome = 'admin'
            AND aur.ativo = true
        )
    );

-- Inserir regras de segurança padrão
INSERT INTO public.security_rules (name, description, rule_type, conditions, severity) VALUES
('Brute Force Detection', 'Detecta tentativas de força bruta em login', 'threshold', 
 '{"event_type": "login_failed", "time_window": "15m", "max_attempts": 5}', 'critical'),

('Suspicious Location', 'Detecta logins de novas localizações', 'pattern',
 '{"event_type": "login_success", "check_location": true}', 'medium'),

('Multiple Failed Logins', 'Detecta múltiplas falhas de login do mesmo usuário', 'threshold',
 '{"event_type": "login_failed", "time_window": "1h", "max_attempts": 3}', 'high'),

('Unusual Access Time', 'Detecta acessos em horários incomuns', 'pattern',
 '{"event_type": "login_success", "unusual_hours": true}', 'low'),

('Permission Escalation', 'Detecta tentativas de escalação de privilégios', 'pattern',
 '{"event_type": "permission_denied", "sensitive_resources": true}', 'high');

