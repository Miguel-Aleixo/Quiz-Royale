import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

@Injectable()
export class EmailService {

  async enviarVerificacaoEmail(
    email: string,
    nome: string,
    token: string,
  ) {
    const frontendUrl = process.env.FRONTEND_URL;
    const apiKey = process.env.BREVO_API_KEY;
    const remetenteEmail = process.env.BREVO_EMAIL;
    const remetenteNome =
      process.env.BREVO_NAME || 'Quiz Royale';

    if (
      !frontendUrl ||
      !apiKey ||
      !remetenteEmail
    ) {
      console.error(
        'Variáveis de ambiente da Brevo não configuradas.',
      );

      throw new InternalServerErrorException(
        'Serviço de e-mail não configurado.',
      );
    }

    const link =
      `${frontendUrl}/verificar-email?token=${encodeURIComponent(token)}`;

    try {
      const response = await fetch(
        'https://api.brevo.com/v3/smtp/email',
        {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'api-key': apiKey,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            sender: {
              name: remetenteNome,
              email: remetenteEmail,
            },

            to: [
              {
                email,
                name: nome,
              },
            ],

            subject: 'Verifique seu e-mail - Quiz Royale',

            htmlContent: `
              <div style="
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: auto;
                padding: 30px;
                background: #111827;
                color: white;
                border-radius: 16px;
              ">

                <h1 style="
                  color: #a855f7;
                  margin-bottom: 20px;
                ">
                  Quiz Royale
                </h1>

                <p>
                  Olá, <strong>${nome}</strong>!
                </p>

                <p>
                  Para poder jogar no Quiz Royale,
                  você precisa verificar seu endereço de e-mail.
                </p>

                <div style="
                  text-align: center;
                  margin: 30px 0;
                ">
                  <a
                    href="${link}"
                    style="
                      display: inline-block;
                      padding: 14px 24px;
                      background: #9333ea;
                      color: white;
                      text-decoration: none;
                      border-radius: 10px;
                      font-weight: bold;
                    "
                  >
                    Verificar meu e-mail
                  </a>
                </div>

                <p style="
                  color: #9ca3af;
                  font-size: 13px;
                ">
                  Este link expira em 30 minutos.
                </p>

                <p style="
                  color: #6b7280;
                  font-size: 12px;
                  margin-top: 25px;
                ">
                  Se você não criou uma conta no Quiz Royale,
                  pode ignorar este e-mail.
                </p>

              </div>
            `,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          'Erro retornado pela Brevo:',
          data,
        );

        throw new Error(
          data?.message ||
          'A Brevo recusou o envio do e-mail.',
        );
      }

      console.log(
        'E-mail de verificação enviado:',
        data?.messageId,
      );

      return data;
    } catch (error) {
      console.error(
        'Erro ao enviar e-mail:',
        error,
      );

      throw new InternalServerErrorException(
        'Não foi possível enviar o e-mail de verificação.',
      );
    }
  }

  async enviarRecuperacaoSenha(
    email: string,
    nome: string,
    token: string,
  ) {
    const apiKey = process.env.BREVO_API_KEY;
    const remetente = process.env.BREVO_EMAIL;
    const nomeRemetente =
      process.env.BREVO_NAME || 'Quiz Royale';
    const frontendUrl = process.env.FRONTEND_URL;

    if (!apiKey || !remetente || !frontendUrl) {
      throw new Error(
        'Configuração do Brevo incompleta.',
      );
    }

    const link = `${frontendUrl}/redefinir-senha?token=${encodeURIComponent(token)}`;

    const response = await fetch(
      'https://api.brevo.com/v3/smtp/email',
      {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: nomeRemetente,
            email: remetente,
          },
          to: [
            {
              email,
              name: nome,
            },
          ],
          subject: 'Redefinição de senha — Quiz Royale',
          htmlContent: `
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          </head>

          <body style="
            margin: 0;
            padding: 0;
            background: #080812;
            font-family: Arial, Helvetica, sans-serif;
            color: #ffffff;
          ">

            <div style="
              max-width: 600px;
              margin: 0 auto;
              padding: 40px 20px;
            ">

              <div style="
                background: #10101c;
                border: 1px solid #27243a;
                border-radius: 24px;
                padding: 40px 32px;
              ">

                <div style="
                  color: #a855f7;
                  font-size: 12px;
                  font-weight: bold;
                  letter-spacing: 2px;
                  text-transform: uppercase;
                  margin-bottom: 20px;
                ">
                  Quiz Royale
                </div>

                <h1 style="
                  margin: 0 0 16px;
                  font-size: 28px;
                  color: #ffffff;
                ">
                  Redefinição de senha
                </h1>

                <p style="
                  margin: 0 0 12px;
                  font-size: 15px;
                  line-height: 1.7;
                  color: #b7b4c5;
                ">
                  Olá, ${nome}!
                </p>

                <p style="
                  margin: 0 0 28px;
                  font-size: 15px;
                  line-height: 1.7;
                  color: #b7b4c5;
                ">
                  Recebemos uma solicitação para redefinir a senha
                  da sua conta no Quiz Royale.
                </p>

                <a
                  href="${link}"
                  style="
                    display: inline-block;
                    padding: 14px 24px;
                    border-radius: 12px;
                    background: #9333ea;
                    color: #ffffff;
                    text-decoration: none;
                    font-size: 14px;
                    font-weight: bold;
                  "
                >
                  Redefinir minha senha
                </a>

                <p style="
                  margin: 28px 0 0;
                  font-size: 13px;
                  line-height: 1.6;
                  color: #777489;
                ">
                  Este link expira em 30 minutos.
                </p>

                <p style="
                  margin: 12px 0 0;
                  font-size: 13px;
                  line-height: 1.6;
                  color: #777489;
                ">
                  Se você não solicitou a redefinição da senha,
                  pode ignorar este e-mail.
                </p>

              </div>

              <p style="
                margin: 20px 0 0;
                text-align: center;
                font-size: 11px;
                color: #555263;
              ">
                © 2026 Quiz Royale · Conhecimento que transforma.
              </p>

            </div>

          </body>
          </html>
        `,
        }),
      },
    );

    if (!response.ok) {
      const erro = await response.text();

      console.error(
        'Erro ao enviar e-mail de recuperação:',
        erro,
      );

      throw new Error(
        'Não foi possível enviar o e-mail de recuperação.',
      );
    }
  }

}