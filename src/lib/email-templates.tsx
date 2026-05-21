import { EMAIL_CONFIG } from './resend';

export const BaseEmailTemplate = ({
  headline,
  title,
  content,
  buttonText,
  buttonUrl,
  footerText,
  securityNotice,
}: {
  headline: string;
  title?: string;
  content: string;
  buttonText?: string;
  buttonUrl?: string;
  footerText?: string;
  securityNotice?: string;
}) => {
  const { primaryColor, secondaryColor, fontFamily, replyTo } = EMAIL_CONFIG;
  const contentTitle = title ?? headline;

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${headline}</title>
      <style>
        body {
          font-family: ${fontFamily};
          line-height: 1.6;
          color: #374151;
          background-color: #f9fafb;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
          padding: 32px 24px;
          text-align: center;
        }
        .header h1 {
          color: #ffffff;
          font-size: 22px;
          font-weight: 600;
          margin: 0;
          line-height: 1.3;
        }
        .header .product {
          color: rgba(255, 255, 255, 0.9);
          font-size: 13px;
          margin: 8px 0 0 0;
        }
        .content {
          padding: 32px 24px;
        }
        .content h2 {
          color: ${primaryColor};
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 16px 0;
        }
        .content p {
          font-size: 16px;
          margin: 0 0 16px 0;
          color: #6b7280;
        }
        .button {
          display: inline-block;
          background-color: ${primaryColor};
          color: #ffffff !important;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          margin: 8px 0;
        }
        .footer {
          background-color: #f9fafb;
          padding: 24px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer p {
          font-size: 14px;
          color: #9ca3af;
          margin: 0 0 8px 0;
        }
        .security-notice {
          background-color: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 16px;
          margin: 24px 0 0 0;
        }
        .security-notice p {
          color: #92400e;
          font-size: 14px;
          margin: 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${headline}</h1>
          <p class="product">Arruda Hub</p>
        </div>
        <div class="content">
          <h2>${contentTitle}</h2>
          <div>${content}</div>
          ${
            buttonText && buttonUrl
              ? `<div style="text-align: center; margin: 24px 0;">
                  <a href="${buttonUrl}" class="button">${buttonText}</a>
                </div>`
              : ''
          }
          ${
            securityNotice
              ? `<div class="security-notice">
                  <p><strong>Segurança:</strong> ${securityNotice}</p>
                </div>`
              : ''
          }
        </div>
        <div class="footer">
          <p>${footerText || 'E-mail automático do Arruda Hub. Não responda a esta mensagem.'}</p>
          <p>Suporte: <a href="mailto:${replyTo}" style="color: ${primaryColor}; text-decoration: none;">${replyTo}</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const PasswordResetTemplate = (resetUrl: string, userName: string) => {
  return BaseEmailTemplate({
    headline: 'Redefinir senha',
    title: 'Crie uma nova senha',
    content: `
      <p>Olá <strong>${userName}</strong>,</p>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta no Arruda Hub.</p>
      <p>Clique no botão abaixo para criar uma nova senha segura:</p>
    `,
    buttonText: 'Redefinir senha',
    buttonUrl: resetUrl,
    footerText: 'Este link expira em 1 hora por motivos de segurança.',
    securityNotice: 'Se você não solicitou esta ação, ignore este e-mail. Sua conta permanece segura.',
  });
};

export const EmailConfirmationTemplate = (confirmUrl: string, userName: string) => {
  return BaseEmailTemplate({
    headline: 'Confirme seu e-mail',
    title: 'Ative sua conta',
    content: `
      <p>Olá <strong>${userName}</strong>,</p>
      <p>Bem-vindo ao Arruda Hub. Para ativar sua conta, confirme seu endereço de e-mail:</p>
    `,
    buttonText: 'Confirmar e-mail',
    buttonUrl: confirmUrl,
    footerText: 'Este link expira em 24 horas.',
    securityNotice: 'Se você não criou esta conta, ignore este e-mail.',
  });
};

export const SecurityAlertTemplate = (userName: string, activity: string, location: string) => {
  return BaseEmailTemplate({
    headline: 'Alerta de segurança',
    title: 'Atividade detectada na sua conta',
    content: `
      <p>Olá <strong>${userName}</strong>,</p>
      <p>Detectamos uma atividade em sua conta:</p>
      <p><strong>Atividade:</strong> ${activity}</p>
      <p><strong>Local:</strong> ${location}</p>
      <p><strong>Data/hora:</strong> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
      <p>Se foi você, nenhuma ação é necessária. Caso contrário, altere sua senha imediatamente.</p>
    `,
    buttonText: 'Alterar senha',
    buttonUrl: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    footerText: 'Notificação automática de segurança.',
  });
};

export const WelcomeTemplate = (userName: string, loginUrl: string) => {
  return BaseEmailTemplate({
    headline: 'Bem-vindo ao Arruda Hub',
    title: 'Sua conta está pronta',
    content: `
      <p>Olá <strong>${userName}</strong>,</p>
      <p>Sua conta foi criada com sucesso. Você já pode acessar todos os módulos disponíveis.</p>
    `,
    buttonText: 'Acessar sistema',
    buttonUrl: loginUrl,
    footerText: 'Dúvidas? Nossa equipe de suporte está disponível.',
  });
};
