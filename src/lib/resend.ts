import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export { resend };

// Tipos para templates de email
export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

// Configurações do Arruda Hub
export const EMAIL_CONFIG = {
  from: 'Arruda Hub <noreply@arrudahub.com>',
  replyTo: 'suporte@arrudahub.com',
  logo: 'https://arrudahub.com/logo.png', // URL do logo
  primaryColor: '#2E4A8B',
  secondaryColor: '#4DD0E1',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
};

