import { resend, EmailTemplate, EMAIL_CONFIG } from './resend';
import {
  PasswordResetTemplate,
  EmailConfirmationTemplate,
  SecurityAlertTemplate,
  WelcomeTemplate,
} from './email-templates';

export class EmailService {
  static async sendPasswordReset(email: string, resetToken: string, userName: string) {
    try {
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
      const html = PasswordResetTemplate(resetUrl, userName);

      const result = await resend.emails.send({
        from: EMAIL_CONFIG.from,
        to: [email],
        subject: 'Redefinir senha - Arruda Hub',
        html,
      });

      console.log('Password reset email sent:', result);
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, error: error.message };
    }
  }

  static async sendEmailConfirmation(email: string, confirmToken: string, userName: string) {
    try {
      const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/confirm-email?token=${confirmToken}`;
      const html = EmailConfirmationTemplate(confirmUrl, userName);

      const result = await resend.emails.send({
        from: EMAIL_CONFIG.from,
        to: [email],
        subject: 'Confirme seu e-mail - Arruda Hub',
        html,
      });

      console.log('Email confirmation sent:', result);
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Error sending email confirmation:', error);
      return { success: false, error: error.message };
    }
  }

  static async sendSecurityAlert(email: string, userName: string, activity: string, location: string) {
    try {
      const html = SecurityAlertTemplate(userName, activity, location);

      const result = await resend.emails.send({
        from: EMAIL_CONFIG.from,
        to: [email],
        subject: 'Alerta de segurança - Arruda Hub',
        html,
      });

      console.log('Security alert sent:', result);
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Error sending security alert:', error);
      return { success: false, error: error.message };
    }
  }

  static async sendWelcomeEmail(email: string, userName: string) {
    try {
      const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth`;
      const html = WelcomeTemplate(userName, loginUrl);

      const result = await resend.emails.send({
        from: EMAIL_CONFIG.from,
        to: [email],
        subject: 'Bem-vindo ao Arruda Hub',
        html,
      });

      console.log('Welcome email sent:', result);
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error: error.message };
    }
  }

  static async sendCustomEmail(template: EmailTemplate) {
    try {
      const result = await resend.emails.send({
        from: template.from || EMAIL_CONFIG.from,
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
