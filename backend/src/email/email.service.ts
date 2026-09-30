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
}