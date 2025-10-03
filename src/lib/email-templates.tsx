import { EMAIL_CONFIG } from './resend';

// Template base para todos os e-mails
export const BaseEmailTemplate = ({ 
  title, 
  content, 
  buttonText, 
  buttonUrl, 
  footerText 
}: {
  title: string;
  content: string;
  buttonText?: string;
  buttonUrl?: string;
  footerText?: string;
}) => {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: ${EMAIL_CONFIG.fontFamily};
          line-height: 1.6;
          color: #374151;
          background-color: #f9fafb;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, ${EMAIL_CONFIG.primaryColor} 0%, ${EMAIL_CONFIG.secondaryColor} 100%);
          padding: 32px 24px;
          text-align: center;
        }
        .logo {
          width: 120px;
          height: auto;
          margin-bottom: 16px;
        }
        .header h1 {
          color: #ffffff;
          font-size: 24px;
          font-weight: 600;
          margin: 0;
        }
        .content {
          padding: 32px 24px;
        }
        .content h2 {
          color: ${EMAIL_CONFIG.primaryColor};
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
          background-color: ${EMAIL_CONFIG.primaryColor};
          color: #ffffff;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          margin: 24px 0;
          transition: background-color 0.2s;
        }
        .button:hover {
          background-color: #1e3a8a;
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
          margin: 0;
        }
        .security-notice {
          background-color: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 16px;
          margin: 24px 0;
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
          <img src="${EMAIL_CONFIG.logo}" alt="Arruda Hub" class="logo">
          <h1>Arruda Hub</h1>
        </div>
        
        <div class="content">
          <h2>${title}</h2>
          <div>${content}</div>
          
          ${buttonText && buttonUrl ? `
            <div style="text-align: center;">
              <a href="${buttonUrl}" class="button">${buttonText}</a>
            </div>
          ` : ''}
          
          <div class="security-notice">
            <p><strong>🔒 Segurança:</strong> Se você não solicitou esta ação, ignore este e-mail. Sua conta permanece segura.</p>
          </div>
        </div>
        
        <div class="footer">
          <p>${footerText || 'Este é um e-mail automático do Arruda Hub. Não responda a esta mensagem.'}</p>
          <p>Para suporte, entre em contato: ${EMAIL_CONFIG.replyTo}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Template para reset de senha
export const PasswordResetTemplate = (resetUrl: string, userName: string) => {
  return BaseEmailTemplate({
    title: 'Redefinir sua senha',
    content: `
      <p>Olá <strong>${userName}</strong>,</p>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta no Arruda Hub.</p>
      <p>Clique no botão abaixo para criar uma nova senha segura:</p>
    `,
    buttonText: 'Redefinir Senha',
    buttonUrl: resetUrl,
    footerText: 'Este link expira em 1 hora por motivos de segurança.'
  });
};

// Template para confirmação de email
export const EmailConfirmationTemplate = (confirmUrl: string, userName: string) => {
  return BaseEmailTemplate({
    title: 'Confirme seu e-mail',
    content: `
      <p>Olá <strong>${userName}</strong>,</p>
      <p>Bem-vindo ao Arruda Hub! Para ativar sua conta, confirme seu endereço de e-mail clicando no botão abaixo:</p>
    `,
    buttonText: 'Confirmar E-mail',
    buttonUrl: confirmUrl,
    footerText: 'Este link expira em 24 horas.'
  });
};

// Template para notificação de segurança
export const SecurityAlertTemplate = (userName: string, activity: string, location: string) => {
  return BaseEmailTemplate({
    title: 'Atividade de Segurança Detectada',
    content: `
      <p>Olá <strong>${userName}</strong>,</p>
      <p>Detectamos uma atividade em sua conta que gostaríamos de informar:</p>
      <p><strong>Atividade:</strong> ${activity}</p>
      <p><strong>Local:</strong> ${location}</p>
      <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
      <p>Se esta atividade foi realizada por você, não é necessário fazer nada. Caso contrário, recomendamos alterar sua senha imediatamente.</p>
    `,
    buttonText: 'Alterar Senha',
    buttonUrl: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    footerText: 'Esta é uma notificação automática de segurança.'
  });
};

// Template para boas-vindas
export const WelcomeTemplate = (userName: string, loginUrl: string) => {
  return BaseEmailTemplate({
    title: 'Bem-vindo ao Arruda Hub!',
    content: `
      <p>Olá <strong>${userName}</strong>,</p>
      <p>Sua conta foi criada com sucesso! Agora você tem acesso completo ao sistema Arruda Hub.</p>
      <p>Você pode acessar todos os módulos disponíveis e começar a usar o sistema imediatamente.</p>
    `,
    buttonText: 'Acessar Sistema',
    buttonUrl: loginUrl,
    footerText: 'Se você tiver dúvidas, nossa equipe de suporte está sempre disponível.'
  });
};

