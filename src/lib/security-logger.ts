import { supabase } from '@/integrations/supabase/client';

export interface SecurityLogData {
  user_id?: string;
  event_type: SecurityEventType;
  severity: SecuritySeverity;
  description: string;
  resource_path?: string;
  action?: string;
  success?: boolean;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  error_message?: string;
}

export type SecurityEventType = 
  | 'login_attempt'
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'password_reset_request'
  | 'password_reset_success'
  | 'email_confirmation'
  | 'email_confirmation_failed'
  | 'permission_denied'
  | 'suspicious_activity'
  | 'account_locked'
  | 'account_unlocked'
  | 'role_assigned'
  | 'role_removed'
  | 'permission_granted'
  | 'permission_revoked'
  | 'data_export'
  | 'data_import'
  | 'api_access'
  | 'file_upload'
  | 'file_download'
  | 'configuration_change'
  | 'system_error'
  | 'brute_force_attempt'
  | 'session_hijack_attempt'
  | 'unauthorized_access'
  | 'data_breach_attempt'
  | 'malware_detected'
  | 'anomaly_detected';

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

export class SecurityLogger {
  private static instance: SecurityLogger;
  private logQueue: SecurityLogData[] = [];
  private isProcessing = false;

  private constructor() {}

  public static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger();
    }
    return SecurityLogger.instance;
  }

  /**
   * Log de segurança principal
   */
  public async log(data: SecurityLogData): Promise<void> {
    try {
      // Adicionar timestamp e dados do navegador se não fornecidos
      const logData = {
        ...data,
        ip_address: data.ip_address || await this.getClientIP(),
        user_agent: data.user_agent || navigator.userAgent,
        created_at: new Date().toISOString(),
      };

      // Adicionar à fila para processamento em lote
      this.logQueue.push(logData);

      // Processar fila se não estiver processando
      if (!this.isProcessing) {
        await this.processQueue();
      }

      // Log crítico deve ser processado imediatamente
      if (data.severity === 'critical') {
        await this.processCriticalLog(logData);
      }

    } catch (error) {
      console.error('Erro ao registrar log de segurança:', error);
    }
  }

  /**
   * Log de tentativa de login
   */
  public async logLoginAttempt(email: string, success: boolean, errorMessage?: string): Promise<void> {
    await this.log({
      event_type: success ? 'login_success' : 'login_failed',
      severity: success ? 'low' : 'medium',
      description: success 
        ? `Login realizado com sucesso para ${email}`
        : `Tentativa de login falhada para ${email}`,
      action: 'login',
      success,
      error_message: errorMessage,
      metadata: { email }
    });
  }

  /**
   * Log de atividade suspeita
   */
  public async logSuspiciousActivity(description: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      event_type: 'suspicious_activity',
      severity: 'high',
      description,
      metadata
    });
  }

  /**
   * Log de tentativa de força bruta
   */
  public async logBruteForceAttempt(ip: string, attempts: number): Promise<void> {
    await this.log({
      event_type: 'brute_force_attempt',
      severity: 'critical',
      description: `Tentativa de força bruta detectada - ${attempts} tentativas de IP ${ip}`,
      ip_address: ip,
      metadata: { attempts, ip }
    });
  }

  /**
   * Log de acesso negado
   */
  public async logPermissionDenied(userId: string, resource: string, action: string): Promise<void> {
    await this.log({
      user_id: userId,
      event_type: 'permission_denied',
      severity: 'medium',
      description: `Acesso negado: ${action} em ${resource}`,
      resource_path: resource,
      action,
      success: false,
      metadata: { resource, action }
    });
  }

  /**
   * Log de mudança de configuração
   */
  public async logConfigurationChange(userId: string, change: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      user_id: userId,
      event_type: 'configuration_change',
      severity: 'medium',
      description: `Configuração alterada: ${change}`,
      action: 'update',
      metadata
    });
  }

  /**
   * Log de exportação de dados
   */
  public async logDataExport(userId: string, dataType: string, recordCount: number): Promise<void> {
    await this.log({
      user_id: userId,
      event_type: 'data_export',
      severity: 'medium',
      description: `Exportação de dados: ${dataType} (${recordCount} registros)`,
      action: 'export',
      metadata: { dataType, recordCount }
    });
  }

  /**
   * Log de anomalia detectada
   */
  public async logAnomaly(description: string, severity: SecuritySeverity, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      event_type: 'anomaly_detected',
      severity,
      description,
      metadata
    });
  }

  /**
   * Processar fila de logs
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.logQueue.length === 0) return;

    this.isProcessing = true;

    try {
      const logsToProcess = [...this.logQueue];
      this.logQueue = [];

      // Inserir logs em lote no Supabase
      const { error } = await supabase
        .from('security_logs')
        .insert(logsToProcess.map(log => ({
          user_id: log.user_id,
          event_type: log.event_type,
          severity: log.severity,
          description: log.description,
          resource_path: log.resource_path,
          action: log.action,
          success: log.success,
          ip_address: log.ip_address,
          user_agent: log.user_agent,
          metadata: log.metadata,
          error_message: log.error_message,
          created_at: log.created_at
        })));

      if (error) {
        console.error('Erro ao inserir logs de segurança:', error);
        // Recolocar logs na fila se houver erro
        this.logQueue.unshift(...logsToProcess);
      }

    } catch (error) {
      console.error('Erro ao processar fila de logs:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Processar log crítico imediatamente
   */
  private async processCriticalLog(logData: SecurityLogData): Promise<void> {
    try {
      const { error } = await supabase
        .from('security_logs')
        .insert({
          user_id: logData.user_id,
          event_type: logData.event_type,
          severity: logData.severity,
          description: logData.description,
          resource_path: logData.resource_path,
          action: logData.action,
          success: logData.success,
          ip_address: logData.ip_address,
          user_agent: logData.user_agent,
          metadata: logData.metadata,
          error_message: logData.error_message,
          created_at: logData.created_at
        });

      if (error) {
        console.error('Erro ao inserir log crítico:', error);
      }
    } catch (error) {
      console.error('Erro ao processar log crítico:', error);
    }
  }

  /**
   * Obter IP do cliente (simulado)
   */
  private async getClientIP(): Promise<string> {
    try {
      // Em produção, você pode usar um serviço como ipify.org
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Obter logs de segurança
   */
  public static async getSecurityLogs(filters?: {
    event_type?: SecurityEventType;
    severity?: SecuritySeverity;
    user_id?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
  }) {
    try {
      let query = supabase
        .from('security_logs')
        .select(`
          *,
          auth_profile!inner(email, nome)
        `)
        .order('created_at', { ascending: false });

      if (filters?.event_type) {
        query = query.eq('event_type', filters.event_type);
      }

      if (filters?.severity) {
        query = query.eq('severity', filters.severity);
      }

      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar logs de segurança:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar logs de segurança:', error);
      // Retornar array vazio em caso de erro para não quebrar a aplicação
      return [];
    }
  }

  /**
   * Obter estatísticas de segurança
   */
  public static async getSecurityStats() {
    try {
      const { data, error } = await supabase
        .from('security_logs')
        .select('event_type, severity, created_at');

      if (error) {
        console.error('Erro ao buscar estatísticas de segurança:', error);
        return null;
      }

      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const stats = {
        total: data?.length || 0,
        last24h: data?.filter(log => new Date(log.created_at) > last24h).length || 0,
        last7d: data?.filter(log => new Date(log.created_at) > last7d).length || 0,
        bySeverity: {
          low: data?.filter(log => log.severity === 'low').length || 0,
          medium: data?.filter(log => log.severity === 'medium').length || 0,
          high: data?.filter(log => log.severity === 'high').length || 0,
          critical: data?.filter(log => log.severity === 'critical').length || 0,
        },
        byEventType: {} as Record<string, number>
      };

      // Contar por tipo de evento
      data?.forEach(log => {
        stats.byEventType[log.event_type] = (stats.byEventType[log.event_type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Erro ao calcular estatísticas de segurança:', error);
      // Retornar null em caso de erro para indicar falha na obtenção de estatísticas
      return null;
    }
  }
}

// Instância singleton
export const securityLogger = SecurityLogger.getInstance();
