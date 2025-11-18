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
      const resolvedIp = data.ip_address ?? await this.getClientIP();
      const sanitizedIp = this.sanitizeIp(resolvedIp);

      // Adicionar dados do navegador se não fornecidos
      const logData = {
        ...data,
        ip_address: sanitizedIp ?? undefined,
        user_agent: data.user_agent || (typeof navigator !== 'undefined' ? navigator.userAgent : undefined),
        // REMOVIDO: created_at - será definido pelo DEFAULT da tabela no banco
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

      // Filtrar e preparar logs válidos
      const validLogs = logsToProcess
        .map(log => {
          // Validar campos obrigatórios
          if (!log.event_type || !log.severity || !log.description) {
            console.warn('Log ignorado - campos obrigatórios faltando:', log);
            return null;
          }

          const insertData: any = {
            user_id: log.user_id || null,
            event_type: log.event_type,
            severity: log.severity,
            description: log.description,
            // REMOVIDO: resource_path - não existe na tabela atual
            // action é NOT NULL, então sempre deve ter um valor
            action: log.action || log.event_type, // Usar event_type como fallback se action não fornecido
            success: log.success ?? true,
            user_agent: log.user_agent || null,
            metadata: log.metadata || {},
            error_message: log.error_message || null,
            // REMOVIDO: created_at - deixar o DEFAULT da tabela fazer
          };

          // Validar e converter ip_address (tipo INET no banco)
          if (log.ip_address && log.ip_address.trim()) {
            const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
            if (ipPattern.test(log.ip_address.trim())) {
              insertData.ip_address = log.ip_address.trim();
            } else {
              insertData.ip_address = null;
            }
          } else {
            insertData.ip_address = null;
          }

          return insertData;
        })
        .filter(item => item !== null); // Remover logs inválidos

      // Só inserir se houver logs válidos
      if (validLogs.length === 0) {
        return;
      }

      // Inserir logs em lote no Supabase
      const { error } = await supabase
        .from('security_logs')
        .insert(validLogs);

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
      // Validar campos obrigatórios
      if (!logData.event_type || !logData.severity || !logData.description) {
        console.warn('Log crítico ignorado - campos obrigatórios faltando:', logData);
        return;
      }

      const insertData: any = {
        user_id: logData.user_id || null,
        event_type: logData.event_type,
        severity: logData.severity,
        description: logData.description,
        // REMOVIDO: resource_path - não existe na tabela atual
        // action é NOT NULL, então sempre deve ter um valor
        action: logData.action || logData.event_type, // Usar event_type como fallback se action não fornecido
        success: logData.success ?? true,
        user_agent: logData.user_agent || null,
        metadata: logData.metadata || {},
        error_message: logData.error_message || null,
        // REMOVIDO: created_at - deixar o DEFAULT da tabela fazer
      };

      // Validar e converter ip_address
      if (logData.ip_address && logData.ip_address.trim()) {
        const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        if (ipPattern.test(logData.ip_address.trim())) {
          insertData.ip_address = logData.ip_address.trim();
        } else {
          insertData.ip_address = null;
        }
      } else {
        insertData.ip_address = null;
      }

      const { error } = await supabase
        .from('security_logs')
        .insert(insertData);

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
  private async getClientIP(): Promise<string | null> {
    try {
      // Em produção, você pode usar um serviço como ipify.org
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return typeof data?.ip === 'string' ? data.ip : null;
    } catch (error) {
      return null;
    }
  }

  private sanitizeIp(ip?: string | null): string | null {
    if (!ip) {
      return null;
    }

    const trimmed = ip.trim();
    if (!trimmed) {
      return null;
    }

    const ipv4Pattern = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)(\.(25[0-5]|2[0-4]\d|[01]?\d\d?)){3}$/;
    const ipv6Pattern = /^(([0-9a-fA-F]{1,4}):){2,7}[0-9a-fA-F]{1,4}$/;

    if (ipv4Pattern.test(trimmed) || ipv6Pattern.test(trimmed)) {
      return trimmed;
    }

    return null;
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
