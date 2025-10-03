import { resend, EmailTemplate } from './resend';
import { 
  PasswordResetTemplate, 
  EmailConfirmationTemplate, 
  SecurityAlertTemplate, 
  WelcomeTemplate 
} from './email-templates';

export class EmailService {
  // Enviar e-mail de reset de senha
  static async sendPasswordReset(email: string, resetToken: string, userName: string) {
    try {
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
      const html = PasswordResetTemplate(resetUrl, userName);
      
      const result = await resend.emails.send({
        from: 'Arruda Hub <noreply@arrudahub.com>',
        to: [email],
        subject: '🔒 Redefinir senha - Arruda Hub',
        html,
      });

      console.log('Password reset email sent:', result);
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, error: error.message };
    }
  }

  // Enviar e-mail de confirmação
  static async sendEmailConfirmation(email: string, confirmToken: string, userName: string) {
    try {
      const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/confirm-email?token=${confirmToken}`;
      const html = EmailConfirmationTemplate(confirmUrl, userName);
      
      const result = await resend.emails.send({
        from: 'Arruda Hub <noreply@arrudahub.com>',
        to: [email],
        subject: '✅ Confirme seu e-mail - Arruda Hub',
        html,
      });

      console.log('Email confirmation sent:', result);
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Error sending email confirmation:', error);
      return { success: false, error: error.message };
    }
  }

  // Enviar alerta de segurança
  static async sendSecurityAlert(email: string, userName: string, activity: string, location: string) {
    try {
      const html = SecurityAlertTemplate(userName, activity, location);
      
      const result = await resend.emails.send({
        from: 'Arruda Hub <seguranca@arrudahub.com>',
        to: [email],
        subject: '🚨 Alerta de Segurança - Arruda Hub',
        html,
      });

      console.log('Security alert sent:', result);
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Error sending security alert:', error);
      return { success: false, error: error.message };
    }
  }

  // Enviar e-mail de boas-vindas
  static async sendWelcomeEmail(email: string, userName: string) {
    try {
      const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth`;
      const html = WelcomeTemplate(userName, loginUrl);
      
      const result = await resend.emails.send({
        from: 'Arruda Hub <bemvindo@arrudahub.com>',
        to: [email],
        subject: '🎉 Bem-vindo ao Arruda Hub!',
        html,
      });

      console.log('Welcome email sent:', result);
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error: error.message };
    }
  }

  // Enviar e-mail customizado
  static async sendCustomEmail(template: EmailTemplate) {
    try {
      const result = await resend.emails.send({
        from: template.from || 'Arruda Hub <noreply@arrudahub.com>',
        to: [template.to],
        subject: template.subject,
        html: template.html,
      });

      console.log('Custom email sent:', result);
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Error sending custom email:', error);
      return { success: false, error: error.message };
    }
  }
}

