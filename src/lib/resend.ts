import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export { resend };

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export const EMAIL_CONFIG = {
  from: 'Arruda Hub <noreply@arrudahub.dev>',
  replyTo: 'suporte@arrudahub.dev',
  primaryColor: '#0A2342',
  secondaryColor: '#14B8A6',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
};
